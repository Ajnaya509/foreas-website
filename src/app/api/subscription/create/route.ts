import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabase'
import { FORMULES, DEVISE, resoudreFormule } from '@/lib/offre'

export const runtime = 'nodejs'

/**
 * POST /api/subscription/create
 * Crée un abonnement Stripe en PAIEMENT IMMÉDIAT (payment_behavior:'default_incomplete')
 * et renvoie le client_secret du PaymentIntent → consommé par le Payment Element
 * du checkout sur-mesure /checkout (design FOREAS, pas l'UI Stripe verrouillée).
 *
 * Garantie 30j = gérée hors-Stripe (remboursement manuel). Ici on encaisse maintenant.
 * Le checkout hébergé/embarqué existant (/api/checkout) reste en place — ceci est en plus.
 */

// ─── LE MAPPING QUI FACTURAIT 97 € A ÉTÉ RETIRÉ (14/08/2026) ─────────────────
// Il valait :
//   pro_monthly   → STRIPE_PRICE_ID_PRO_MONTHLY   (97 €/mois)
//   pro_annual    → STRIPE_PRICE_ID_PRO_ANNUAL
//   elite_monthly → STRIPE_PRICE_ID_ELITE_MONTHLY (247 €/mois)
//   elite_annual  → STRIPE_PRICE_ID_ELITE_ANNUAL
// Or l'offre réelle du site est 29,99 €/mois depuis le 22/07. Le même piège avait
// déjà été retiré de `/api/checkout` ce jour-là, avec ce commentaire : « aurait
// facturé 97 € au lieu de 29,99 € ». Il est resté ici, dans le jumeau, EN LIGNE et
// atteignable depuis /checkout — corrigé d'un côté, oublié de l'autre.
//
// Les montants viennent maintenant de `src/lib/offre.ts`, seul endroit où ils vivent.
// Les variables STRIPE_PRICE_ID_* ne sont plus lues nulle part : elles peuvent être
// supprimées de Vercel (les abonnés déjà créés gardent leur Price d'origine côté
// Stripe — rien ne change pour eux, ce fichier ne crée que de NOUVEAUX abonnements).

function getStripe() {
  const key = (process.env.STRIPE_SECRET_KEY || '').replace(/\s/g, '')
  return new Stripe(key, { apiVersion: '2025-02-24.acacia', timeout: 9000, maxNetworkRetries: 1 })
}

/**
 * Produit Stripe de l'abonnement, avec un identifiant DÉTERMINISTE — même motif
 * que les coupons ci-dessous : on tente de le lire, on le crée s'il n'existe pas.
 * Sans identifiant fixe, chaque paiement créerait un produit de plus dans le
 * catalogue Stripe. `subscriptions.create` exige un produit (contrairement à
 * `checkout.sessions.create`, qui accepte `product_data` à la volée).
 */
async function ensureProduit(stripe: Stripe, formule: string, libelle: string): Promise<string> {
  const id = `foreas_abo_${formule}`
  try {
    await stripe.products.retrieve(id)
  } catch {
    await stripe.products.create({ id, name: libelle })
  }
  return id
}

async function ensureReferralCoupon(stripe: Stripe, pct: number): Promise<string> {
  const id = `foreas_ref_${pct}`
  try { await stripe.coupons.retrieve(id) }
  catch { await stripe.coupons.create({ id, percent_off: pct, duration: 'forever', name: `Parrainage FOREAS −${pct}%` }) }
  return id
}

// Offre de sortie : −20% sur le 1er mois UNIQUEMENT (duration:'once') — honnête, non récurrent.
async function ensureExitCoupon(stripe: Stripe): Promise<string> {
  const id = 'foreas_exit20_once'
  try { await stripe.coupons.retrieve(id) }
  catch { await stripe.coupons.create({ id, percent_off: 20, duration: 'once', name: 'FOREAS −20% 1er mois (offre de sortie)' }) }
  return id
}

// Jeton du LIEN SECRET de test (?t=...). Ramène la 1re facture à 0,50 € (minimum Stripe EUR).
//
// AVANT le 14/08/2026, sa valeur était écrite en dur ici, en clair (`frs-paytest-…`).
// Un secret dans le code source est un secret partagé avec tous ceux qui liront ce
// dépôt un jour, pour toujours — et celui-ci ouvre un abonnement à 0,50 €.
// L'ancienne valeur reste dans l'historique git, mais elle est désormais INERTE :
// plus aucun code ne la connaît, et sans `CHECKOUT_TEST_TOKEN` défini il n'existe
// plus aucun chemin à 0,50 €.
// Il vit maintenant dans `CHECKOUT_TEST_TOKEN`, et il est FAIL CLOSED : variable
// absente = plus aucun chemin à 0,50 €, c'est l'état sûr par défaut.
function jetonTestValide(fourni: string | undefined): boolean {
  const attendu = process.env.CHECKOUT_TEST_TOKEN
  if (!attendu || attendu.length < 12) return false
  return fourni === attendu
}

// Mode test : coupon amount_off qui laisse 50 centimes à payer, quel que soit le plan.
async function ensureTestCoupon(stripe: Stripe, unit: number): Promise<string> {
  const off = Math.max(0, unit - 50) // laisse 0,50€ (Stripe refuse < 0,50€)
  const id = `foreas_paytest_${off}`
  try { await stripe.coupons.retrieve(id) }
  catch { await stripe.coupons.create({ id, amount_off: off, currency: 'eur', duration: 'once', name: 'FOREAS test paiement (0,50€)' }) }
  return id
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Clé Stripe non configurée' }, { status: 500 })
    }
    const stripe = getStripe()
    const body = await request.json()
    const { plan, email, referral_code, exit_offer, test_token } = body as { plan?: string; email?: string; referral_code?: string; exit_offer?: boolean; test_token?: string }
    const isTestPay = jetonTestValide(test_token)

    // Une seule grille de prix pour tout le site (src/lib/offre.ts).
    // Une formule qui n'existe plus au catalogue (ex. `elite_monthly`, 247 €) est
    // REFUSÉE : c'est ce qui rend l'ancienne offre techniquement insouscriptible.
    const formule = resoudreFormule(plan)
    if (!formule) {
      return NextResponse.json(
        {
          error:
            "Cette formule n'est plus proposée. L'abonnement FOREAS actuel est unique — rendez-vous sur /tarifs2.",
        },
        { status: 400 },
      )
    }
    const offre = FORMULES[formule]

    // Parrainage (même résolution que /api/checkout : chauffeur OU partenaire).
    const cookieHeader = request.headers.get('cookie') || ''
    const cookieRef = cookieHeader.match(/foreas_partner_ref=([^;]+)/)?.[1]
    const code = (referral_code || cookieRef || '').trim().toUpperCase() || null
    let pct = 0
    if (code) {
      try {
        const { data } = await supabase.rpc('get_referral_discount_for_code', { p_code: code })
        pct = typeof data === 'number' ? data : 0
        if (pct === 0) {
          const { data: pd } = await supabase.rpc('get_partner_discount_for_code', { p_code: code })
          pct = typeof pd === 'number' ? pd : 0
        }
      } catch { /* code inconnu → pas de remise */ }
    }
    // Priorité : lien de test secret (0,50€) > offre de sortie (−20% 1er mois) > parrainage.
    let coupon: string | undefined
    if (isTestPay) coupon = await ensureTestCoupon(stripe, offre.centimes)
    else if (exit_offer) coupon = await ensureExitCoupon(stripe)
    else if (pct > 0) coupon = await ensureReferralCoupon(stripe, pct)

    const customer = await stripe.customers.create(email ? { email } : {})

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      // Prix construit à la volée depuis la source unique, PAS un Price ID Stripe
      // pré-créé : un Price ID figé est exactement ce qui a fait diverger les deux
      // chemins de paiement du site (97 € d'un côté, 29,99 € de l'autre).
      items: [
        {
          price_data: {
            currency: DEVISE,
            product: await ensureProduit(stripe, formule, offre.libelle),
            unit_amount: offre.centimes,
            recurring: { interval: offre.intervalle },
          },
        },
      ],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      ...(coupon ? { discounts: [{ coupon }] } : {}),
      metadata: {
        plan: formule,
        plan_demande: plan as string,
        flow: 'immediate_custom',
        ...(isTestPay ? { test_pay: '1' } : {}),
        ...(exit_offer ? { exit_offer: '1' } : {}),
        ...(code ? { referral_code: code } : {}),
        ...(pct > 0 ? { referral_discount_pct: String(pct) } : {}),
      },
      expand: ['latest_invoice.payment_intent'],
    })

    const invoice = subscription.latest_invoice as Stripe.Invoice & { payment_intent?: Stripe.PaymentIntent | null }
    const pi = invoice?.payment_intent ?? null
    if (!pi?.client_secret) {
      console.error('[subscription/create] no payment_intent client_secret on invoice')
      return NextResponse.json({ error: "Le paiement n'a pas pu être initialisé." }, { status: 502 })
    }

    return NextResponse.json({
      clientSecret: pi.client_secret,
      subscriptionId: subscription.id,
      amountDue: invoice.amount_due ?? null,
      currency: invoice.currency ?? 'eur',
    })
  } catch (error: unknown) {
    const err = error as { message?: string; type?: string }
    // Le détail va dans les journaux Vercel, PAS au navigateur. Le message brut de
    // Stripe raconte l'état de la clé — vérifié le 14/08/2026 : une clé invalide
    // renvoyait « Invalid API Key provided: sk_test_***…mule » jusque dans la
    // réponse HTTP. Un visiteur n'a rien à apprendre de nos identifiants.
    console.error('[subscription/create] error:', err.type, err.message)
    return NextResponse.json(
      { error: "Le paiement n'a pas pu être initialisé. Réessaie dans un instant." },
      { status: 500 },
    )
  }
}

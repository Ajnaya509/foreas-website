import { NextResponse } from 'next/server'
import Stripe from 'stripe'

/**
 * /pay/[id] — point d'entrée unique du lien de paiement envoyé par Ajnaya sur WhatsApp.
 * Décide côté serveur, au clic, si le chauffeur est nouveau / revenant / déjà abonné —
 * jamais deux liens affichés au chauffeur (voir brainstorm Fable 5, 12/07/2026).
 *
 * - Déjà abonné actif → redirige vers l'app, pas de paiement à refaire.
 * - Revenant (a déjà eu un abonnement, résilié/inactif) → session Stripe créée ICI,
 *   SANS essai (il connaît déjà le produit — décision Chandler 12/07).
 * - Nouveau (aucun historique) → redirige vers le lien Stripe déjà créé par le workflow
 *   WhatsApp (pay-003), qui porte déjà l'essai de 3 jours.
 * - Tout doute (id introuvable, erreur, ambiguïté) → toujours traiter comme NOUVEAU
 *   (biais volontaire, cf. brainstorm : priver un vrai nouveau de son essai coûte
 *   beaucoup plus cher qu'un revenant qui obtiendrait l'essai par erreur).
 */

const REACTIVATION_PRICE_CENTS = 2999 // 29,99€/mois — garder synchronisé avec pieuvre_pricing_plans
// 249,99€/an — abonnement unique (décision Chandler, brief BRIEF_PALIERS_ABONNEMENT_2026-07-22).
// Avant : dérivé de REACTIVATION_PRICE_CENTS × 10 (= 299,90€, "2 mois offerts" sur l'ancien
// mensuel). Constante dédiée : le prix annuel ne doit plus jamais se recalculer depuis le
// mensuel — la même règle vit en miroir dans src/app/api/checkout/route.ts, à garder synchro.
const REACTIVATION_ANNUAL_PRICE_CENTS = 24999

function getSupabaseServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return { url, key }
}

async function supaFetch(path: string, key: string, url: string) {
  try {
    const res = await fetch(`${url}${path}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

function getStripe() {
  const key = (process.env.STRIPE_SECRET_KEY || '').replace(/\s/g, '')
  return new Stripe(key, { apiVersion: '2025-02-24.acacia', timeout: 8000, maxNetworkRetries: 1 })
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const origin = new URL(request.url).origin
  const fallback = () => NextResponse.redirect(new URL('/tarifs2', origin), 307)

  const { url: supaUrl, key: supaKey } = getSupabaseServiceClient()
  if (!supaKey) return fallback()

  // 1) Charger le lien de paiement créé par le workflow WhatsApp
  const links = await supaFetch(
    `/rest/v1/pieuvre_payment_links?id=eq.${encodeURIComponent(id)}&select=*`,
    supaKey,
    supaUrl,
  )
  const link = Array.isArray(links) ? links[0] : links
  if (!link) return fallback() // id introuvable = doute → nouveau (page tarifs générique)
  if (link.status === 'paid') {
    return NextResponse.redirect('https://foreas.xyz/go', 307) // déjà payé → renvoie vers l'app
  }

  const phone: string | undefined = link.to_phone_e164
  const planCode: string = link.plan_code || 'monthly'
  const isAnnual = planCode === 'annual'

  // 2) Chercher un historique chauffeur par téléphone (source de vérité réelle de l'abonnement)
  let driver: { subscription_status?: string; subscription_active?: boolean; stripe_customer_id?: string; subscription_start_date?: string } | null = null
  if (phone) {
    const drivers = await supaFetch(
      `/rest/v1/drivers?phone=eq.${encodeURIComponent(phone)}&select=subscription_status,subscription_active,stripe_customer_id,subscription_start_date`,
      supaKey,
      supaUrl,
    )
    driver = Array.isArray(drivers) && drivers.length > 0 ? drivers[0] : null
  }

  // 3) Verdict
  const alreadyActive = driver?.subscription_active === true || driver?.subscription_status === 'active'
  const hasHistory = !!driver && (!!driver.subscription_start_date || !!driver.stripe_customer_id)
  const isReturning = !alreadyActive && hasHistory

  if (alreadyActive) {
    return NextResponse.redirect('https://foreas.xyz/go', 307) // a déjà accès, direction l'app
  }

  if (isReturning) {
    // Paiement direct, SANS essai — il connaît déjà le produit.
    try {
      const stripe = getStripe()
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: { name: isAnnual ? 'FOREAS Pro — Annuel' : 'FOREAS Pro' },
              unit_amount: isAnnual ? REACTIVATION_ANNUAL_PRICE_CENTS : REACTIVATION_PRICE_CENTS,
              recurring: { interval: isAnnual ? 'year' : 'month' },
            },
            quantity: 1,
          },
        ],
        payment_method_types: ['card'],
        locale: 'fr',
        billing_address_collection: 'required',
        success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/pay/${id}`,
        metadata: {
          plan_code: planCode,
          to_phone_e164: phone || '',
          identity_id: link.identity_id || '',
          flow: 'returning_direct',
          source: 'whatsapp_ajnaya',
        },
      })
      if (session.url) return NextResponse.redirect(session.url, 307)
    } catch {
      // Stripe indisponible → filet de sécurité : le lien nouveau (avec essai) plutôt qu'une page cassée.
    }
  }

  // 4) Nouveau (ou doute) → le lien Stripe déjà créé par le workflow WhatsApp (essai 3 jours inclus)
  if (link.stripe_url) return NextResponse.redirect(link.stripe_url, 307)
  return fallback()
}

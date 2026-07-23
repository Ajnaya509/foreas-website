import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabase'

// ─── Prix : construits dynamiquement, PAS de Price ID Stripe pré-créé ────────
// Le mapping PRICE_IDS (Pro 97€ / Elite 247€ / weekly grandfathering / alias vip_*) a été
// retiré le 22/07 avec le passage à l'abonnement unique (29,99€/mois · 249,99€/an).
// Il portait l'ANCIENNE grille et n'avait plus aucun appelant vivant (audit grep : 6 clés
// mortes sur 8). Le laisser aurait été un piège : le chemin essai le consultait encore et
// aurait facturé 97€ au lieu de 29,99€. Les montants vivent maintenant en un seul endroit,
// plus bas dans POST (PRICE_CENTS / ANNUAL_PRICE_CENTS), en miroir de src/app/pay/[id]/route.ts.
// Les abonnés Phase A déjà créés côté Stripe gardent leur Price d'origine — rien ne change
// pour eux, ce fichier ne sert qu'à créer de NOUVELLES sessions.

// Lazy init to avoid build-time error when STRIPE_SECRET_KEY is not set
function getStripe() {
  const key = (process.env.STRIPE_SECRET_KEY || '').replace(/\s/g, '')
  return new Stripe(key, {
    apiVersion: '2025-02-24.acacia',
    timeout: 8000,
    maxNetworkRetries: 1,
  })
}

// Parrainage V3 — coupon Stripe réutilisable par palier de remise (10/15/18 %).
// Récupère le coupon s'il existe, sinon le crée (id déterministe → pas de doublons Stripe).
async function ensureReferralCoupon(stripe: Stripe, pct: number): Promise<string> {
  const id = `foreas_ref_${pct}`
  try {
    await stripe.coupons.retrieve(id)
  } catch {
    await stripe.coupons.create({
      id,
      percent_off: pct,
      duration: 'forever',
      name: `Parrainage FOREAS −${pct}%`,
    })
  }
  return id
}

/**
 * Essai GLISSANT de 3 jours (decision Chandler, brief BRIEF_PALIERS_ABONNEMENT_2026-07-22).
 * Avant : essai jusqu'au "prochain lundi 18h Paris" — un point fixe hebdomadaire, donc une
 * duree reelle qui variait de 1 a 7 jours selon le jour d'inscription. Un chauffeur qui
 * s'inscrivait le dimanche soir avait ~1 jour d'essai, celui du mardi matin en avait 6 :
 * meme promesse affichee, experience deux fois differente. Glissant = tout le monde a
 * exactement 3 jours, quel que soit le moment de l'inscription.
 * Stripe exige trial_end >= 48h dans le futur : 3 jours passe largement.
 */
const TRIAL_DAYS = 3
function getTrialEnd(): number {
  return Math.floor(Date.now() / 1000) + TRIAL_DAYS * 24 * 60 * 60
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Clé Stripe non configurée' }, { status: 500 })
    }
    const stripe = getStripe()
    const body = await request.json()
    const { plan, mode, referral_code, immediate } = body

    // Referral code: from body OR from cookie foreas_partner_ref
    const cookieHeader = request.headers.get('cookie') || ''
    const cookieRefMatch = cookieHeader.match(/foreas_partner_ref=([^;]+)/)
    const effectiveReferralCode = (referral_code || cookieRefMatch?.[1] || '').trim().toUpperCase() || null

    // Parrainage V3 — remise dynamique (fonction SQL, GRANT anon).
    // get_referral_discount_for_code gère DÉJÀ les codes CHAUFFEUR (palier 10/15/18 %)
    // ET les codes PARTENAIRE (sa remise si is_promo_active). Le repli explicite sur
    // get_partner_discount_for_code est une ceinture+bretelles : si la branche
    // partenaire de la 1re fonction évoluait côté fil APP, les partenaires restent
    // couverts (fonction stricte : status='active' + is_promo_active).
    let referralDiscountPct = 0
    if (effectiveReferralCode) {
      try {
        const { data } = await supabase.rpc('get_referral_discount_for_code', {
          p_code: effectiveReferralCode,
        })
        referralDiscountPct = typeof data === 'number' ? data : 0
        if (referralDiscountPct === 0) {
          const { data: partnerData } = await supabase.rpc('get_partner_discount_for_code', {
            p_code: effectiveReferralCode,
          })
          referralDiscountPct = typeof partnerData === 'number' ? partnerData : 0
        }
      } catch {
        /* code inconnu / DB indispo → pas de remise, checkout normal */
      }
    }
    const referralCouponId =
      referralDiscountPct > 0 ? await ensureReferralCoupon(stripe, referralDiscountPct) : null

    if (!plan) {
      return NextResponse.json({ error: 'Plan requis' }, { status: 400 })
    }
    // Reactivation / tarifs2 (paiement immédiat) : prix canonique 29,99€/mois,
    // construit dynamiquement — ne dépend PAS d'un Price ID Stripe pré-créé sur Vercel,
    // pour ne jamais désynchroniser affichage vs montant réellement prélevé.
    // Annuel = même règle que /pay/[id] (recurring interval year) — sans ce cas, un plan
    // `*_annual` était silencieusement facturé au mois (bug corrigé 13/07). 249,99€ fixe
    // (pas ×10) depuis le passage à l'abonnement unique (décision Chandler, brief
    // BRIEF_PALIERS_ABONNEMENT_2026-07-22) — même constante en miroir dans
    // src/app/pay/[id]/route.ts, à garder synchro : deux points d'entrée (site direct et
    // lien WhatsApp) doivent facturer exactement le même montant annuel.
    const PRICE_CENTS = 2999
    const ANNUAL_PRICE_CENTS = 24999
    const isAnnual = typeof plan === 'string' && plan.endsWith('_annual')

    // ⚠️ Prix construit dynamiquement dans LES DEUX cas (essai ET paiement immédiat).
    // Avant, seul le chemin `immediate` utilisait price_data ; le chemin essai passait par
    // PRICE_IDS[plan] → des Price Stripe pré-créés qui portent ENCORE l'ancienne grille
    // (STRIPE_PRICE_ID_PRO_MONTHLY = 97€/mois, _ANNUAL = 970€/an, cf. en-tête du fichier).
    // Rebrancher l'essai sans ça aurait facturé 97€ au lieu de 29,99€ — le triple, en silence.
    // Un seul chemin de prix = l'affichage et le montant prélevé ne peuvent plus diverger.
    const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = {
      price_data: {
        currency: 'eur',
        product_data: { name: isAnnual ? 'FOREAS — Annuel' : 'FOREAS' },
        unit_amount: isAnnual ? ANNUAL_PRICE_CENTS : PRICE_CENTS,
        recurring: { interval: isAnnual ? 'year' : 'month' },
      },
      quantity: 1,
    }
    const origin = request.nextUrl.origin
    const trialEnd = getTrialEnd()
    const isEmbedded = mode === 'embedded'
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      line_items: [lineItem],
      billing_address_collection: 'required',
      locale: 'fr',
      // client_reference_id carries the referral code for MLM attribution
      // Railway webhook reads this to create partner_referrals row
      ...(effectiveReferralCode ? { client_reference_id: effectiveReferralCode } : {}),
      subscription_data: {
        // `immediate` → on encaisse TOUT DE SUITE (pas de trial_end).
        // Sinon : essai glissant de 3 jours, identique pour tous (voir getTrialEnd).
        ...(immediate ? {} : { trial_end: trialEnd }),
        metadata: {
          plan,
          flow: immediate ? 'immediate' : 'trial',
          ...(effectiveReferralCode ? { referral_code: effectiveReferralCode } : {}),
          ...(referralDiscountPct > 0 ? { referral_discount_pct: String(referralDiscountPct) } : {}),
        },
      },
      payment_method_collection: 'always',
      custom_fields: [
        {
          key: 'phone',
          label: { type: 'custom', custom: 'Numéro de téléphone' },
          type: 'numeric',
          optional: false,
        },
        {
          key: 'city',
          label: { type: 'custom', custom: "Ville principale d'activité" },
          type: 'text',
          optional: false,
        },
      ],
      ...(isEmbedded
        ? { ui_mode: 'embedded', return_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}` }
        : { success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`, cancel_url: `${origin}/tarifs2?canceled=true` }),
    }

    // Remise parrainage (coupon %) OU codes promo manuels — mutuellement exclusifs chez Stripe.
    if (referralCouponId) {
      sessionParams.discounts = [{ coupon: referralCouponId }]
    } else {
      sessionParams.allow_promotion_codes = true
    }

    const session = await stripe.checkout.sessions.create(sessionParams)
    if (isEmbedded) return NextResponse.json({ clientSecret: session.client_secret })
    return NextResponse.json({ url: session.url })
  } catch (error: unknown) {
    const err = error as { message?: string; type?: string; code?: string; statusCode?: number }
    console.error('Checkout error full:', JSON.stringify({
      message: err.message,
      type: err.type,
      code: err.code,
      statusCode: err.statusCode,
      keyPrefix: (process.env.STRIPE_SECRET_KEY || '').substring(0, 14),
    }))
    return NextResponse.json({ error: err.message || 'Erreur serveur', type: err.type }, { status: 500 })
  }
}

export async function GET() {
  const trialEnd = getTrialEnd()
  const trialDate = new Date(trialEnd * 1000)
  const now = new Date()
  const trialDays = Math.round((trialEnd * 1000 - now.getTime()) / (24 * 60 * 60 * 1000))
  return NextResponse.json({
    status: 'ok',
    hasKey: !!process.env.STRIPE_SECRET_KEY,
    keyPrefix: (process.env.STRIPE_SECRET_KEY || '').substring(0, 14),
    billing: { trialEndsAt: trialDate.toISOString(), trialDays, rule: `Essai glissant ${TRIAL_DAYS} jours — identique pour tous.` },
  })
}

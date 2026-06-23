import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabase'

// ─── Price IDs LIVE Pricing V2 09/06/2026 (Chandler verrouillé) ─────────────
// Source : FOREAS-SHARED/PRICING_FEATURES_MASTER.md §1.1 (Pricing V2)
// Passage weekly → mensuel. Env vars Vercel à setter :
//   STRIPE_PRICE_ID_PRO_MONTHLY   = price_1TgVSvK89oTss0SbIwh0ukMZ  (97€/mois)
//   STRIPE_PRICE_ID_ELITE_MONTHLY = price_1TgVSwK89oTss0Sba3HYDjf6  (247€/mois)
//   STRIPE_PRICE_ID_PRO_ANNUAL    = price_1TgVSwK89oTss0SbYyQVTKbz  (970€/an)
//   STRIPE_PRICE_ID_ELITE_ANNUAL  = price_1TgVSxK89oTss0Sb2DLX3pUu  (2470€/an)
// Grandfathering weekly (NE PAS SUPPRIMER — abonnés Phase A existants) :
//   STRIPE_PRICE_ID_PRO_WEEKLY / STRIPE_PRICE_ID_ELITE_WEEKLY (inchangés)
const PRICE_IDS: Record<string, string | undefined> = {
  // ── Pro V3 — 97 €/mois · 970 €/an (2 mois offerts)
  pro_monthly:   process.env.STRIPE_PRICE_ID_PRO_MONTHLY,
  pro_annual:    process.env.STRIPE_PRICE_ID_PRO_ANNUAL,
  // ── Elite V3 — 247 €/mois · 2 470 €/an (2 mois offerts)
  elite_monthly: process.env.STRIPE_PRICE_ID_ELITE_MONTHLY,
  elite_annual:  process.env.STRIPE_PRICE_ID_ELITE_ANNUAL,
  // ── Grandfathering Phase A weekly (NE PAS SUPPRIMER)
  pro_weekly:    process.env.STRIPE_PRICE_ID_PRO_WEEKLY,
  elite_weekly:  process.env.STRIPE_PRICE_ID_ELITE_WEEKLY,
  vip_weekly:    process.env.STRIPE_PRICE_ID_ELITE_WEEKLY,
  vip_annual:    process.env.STRIPE_PRICE_ID_ELITE_ANNUAL,
  // ── Legacy alias page /tarifs
  weekly:        process.env.STRIPE_PRICE_ID_PRO_WEEKLY,
  annual:        process.env.STRIPE_PRICE_ID_PRO_ANNUAL,
}

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

function getNextMonday18hParis(): number {
  const now = new Date()
  const dayOfWeek = now.getUTCDay()
  const daysMap: Record<number, number> = { 0: 1, 1: 7, 2: 6, 3: 5, 4: 4, 5: 3, 6: 2 }
  let daysToAdd = daysMap[dayOfWeek]
  if (daysToAdd < 2) daysToAdd += 7
  const monday = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000)
  const year = monday.getUTCFullYear()
  const marchLast = new Date(Date.UTC(year, 2, 31))
  const lastSundayMarch = 31 - (marchLast.getUTCDay() % 7)
  const dstStart = new Date(Date.UTC(year, 2, lastSundayMarch, 1, 0, 0))
  const octLast = new Date(Date.UTC(year, 9, 31))
  const lastSundayOct = 31 - (octLast.getUTCDay() % 7)
  const dstEnd = new Date(Date.UTC(year, 9, lastSundayOct, 1, 0, 0))
  const isSummer = monday.getTime() >= dstStart.getTime() && monday.getTime() < dstEnd.getTime()
  monday.setUTCHours(isSummer ? 16 : 17, 0, 0, 0)
  return Math.floor(monday.getTime() / 1000)
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Clé Stripe non configurée' }, { status: 500 })
    }
    const stripe = getStripe()
    const body = await request.json()
    const { plan, mode, referral_code } = body

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
    const priceId = PRICE_IDS[plan]
    if (!priceId) {
      // Soit le plan n'existe pas (ex: free_*, essentiel_* archivé), soit l'env
      // var Vercel n'est pas configurée. Message explicite côté client.
      return NextResponse.json(
        {
          error: `Plan invalide ou env var manquante : ${plan}. Vérifier STRIPE_PRICE_ID_<TIER>_<BILLING> sur Vercel.`,
        },
        { status: 400 },
      )
    }
    const origin = request.nextUrl.origin
    const trialEnd = getNextMonday18hParis()
    const isEmbedded = mode === 'embedded'
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      billing_address_collection: 'required',
      locale: 'fr',
      // client_reference_id carries the referral code for MLM attribution
      // Railway webhook reads this to create partner_referrals row
      ...(effectiveReferralCode ? { client_reference_id: effectiveReferralCode } : {}),
      subscription_data: {
        trial_end: trialEnd,
        metadata: {
          plan,
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
  const trialEnd = getNextMonday18hParis()
  const trialDate = new Date(trialEnd * 1000)
  const now = new Date()
  const trialDays = Math.round((trialEnd * 1000 - now.getTime()) / (24 * 60 * 60 * 1000))
  return NextResponse.json({
    status: 'ok',
    hasKey: !!process.env.STRIPE_SECRET_KEY,
    keyPrefix: (process.env.STRIPE_SECRET_KEY || '').substring(0, 14),
    billing: { nextMonday18hParis: trialDate.toISOString(), trialDays, rule: 'Lundi 18h Paris = sacré.' },
  })
}

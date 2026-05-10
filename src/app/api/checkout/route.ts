import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

// ─── Price IDs LIVE post-Phase A 10/05/2026 (Chandler verrouillé) ───────────
// Source : FOREAS-SHARED/STRIPE_MLM_CROSSFIL_MASTER.md §1 + PRICING_FEATURES_MASTER.md §1.1
// Lecture EXCLUSIVE depuis env vars Vercel (les 4 vars ont été setées par fil App 10/05 19:50).
// Pas de fallback hardcoded : les anciens prices (Essentiel 12,97 / Pro 14,97 / Elite 34,97)
// sont ARCHIVÉS Stripe et déclencheraient un checkout fail si utilisés.
//
// Format clé : {tier}_{period}  — tier: pro|elite  · period: weekly|annual
//
// Aliases :
//   - `vip_*`     → Elite (compat ancien naming /tarifs2 avant refonte 21:45)
//   - `weekly` / `annual` (sans tier) → Pro (legacy aliases de page /tarifs)
const PRICE_IDS: Record<string, string | undefined> = {
  // ── Pro — 19,97 €/sem · 830,75 €/an (−20%)
  pro_weekly:    process.env.STRIPE_PRICE_ID_PRO_WEEKLY,
  pro_annual:    process.env.STRIPE_PRICE_ID_PRO_ANNUAL,
  // ── Elite — 44,97 €/sem · 1 870,75 €/an (−20%)
  elite_weekly:  process.env.STRIPE_PRICE_ID_ELITE_WEEKLY,
  elite_annual:  process.env.STRIPE_PRICE_ID_ELITE_ANNUAL,
  // ── Aliases compat (anciens IDs page /tarifs et /tarifs2 avant Phase A)
  vip_weekly:    process.env.STRIPE_PRICE_ID_ELITE_WEEKLY,
  vip_annual:    process.env.STRIPE_PRICE_ID_ELITE_ANNUAL,
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
      allow_promotion_codes: true,
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

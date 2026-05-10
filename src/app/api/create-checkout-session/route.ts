/**
 * POST /api/create-checkout-session
 *
 * Crée une Stripe Checkout Session selon le tier + billing demandés.
 * Source de vérité prix : `lib/pricing.ts` (zéro hardcode ici, tout via env vars).
 *
 * Body :
 *   {
 *     tier: 'pro' | 'elite',
 *     billing: 'weekly' | 'annual',
 *     userId?: string,
 *     referralCode?: string,
 *     promoCode?: string  // WELCOME20 / MLM25 / BETA60
 *   }
 *
 * Response :
 *   { url: string }  (Stripe Checkout URL)
 *
 * Sécurité : aucun price ID exposé côté client. Le mapping tier→priceId se fait
 * server-side via `getPriceId()` qui lit `STRIPE_PRICE_ID_<TIER>_<BILLING>`.
 */

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getPriceId, type Tier, type Billing } from '@/lib/pricing'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apiVersion: '2024-11-20.acacia' as any,
})

interface CheckoutBody {
  tier?: Tier | 'free'
  billing?: Billing
  userId?: string
  referralCode?: string
  promoCode?: string
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Configuration Stripe manquante (STRIPE_SECRET_KEY)' },
        { status: 500 },
      )
    }

    const body = (await request.json()) as CheckoutBody
    const { tier, billing = 'weekly', userId, referralCode, promoCode } = body

    if (!tier || (tier !== 'pro' && tier !== 'elite')) {
      return NextResponse.json(
        { error: "Le champ 'tier' doit être 'pro' ou 'elite' (free ne nécessite pas de checkout)" },
        { status: 400 },
      )
    }

    const priceId = getPriceId(tier, billing)
    if (!priceId) {
      return NextResponse.json(
        {
          error: `Price ID manquant pour tier=${tier} billing=${billing}. ` +
            `Vérifier env var STRIPE_PRICE_ID_${tier.toUpperCase()}_${billing.toUpperCase()} sur Vercel.`,
        },
        { status: 500 },
      )
    }

    // ─── Créer la session Stripe Checkout ────────────────────────────────────
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        // Free trial 30 jours par défaut (cohérent avec l'historique).
        // Override possible via env TRIAL_PERIOD_DAYS si Chandler change.
        trial_period_days: parseInt(process.env.TRIAL_PERIOD_DAYS ?? '30', 10),
        metadata: {
          tier,
          billing,
          user_id: userId ?? '',
          referred_by: referralCode ?? '',
          business_model: 'foreas_3tier_mlm',
          source: 'webapp_subscribe',
        },
      },
      success_url: `${process.env.WEBAPP_URL ?? 'https://foreas.xyz'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.WEBAPP_URL ?? 'https://foreas.xyz'}/subscribe`,
    }

    if (promoCode) {
      // Tente de résoudre le promo code en Stripe Promotion Code
      try {
        const promos = await stripe.promotionCodes.list({
          code: promoCode.toUpperCase(),
          active: true,
          limit: 1,
        })
        if (promos.data.length > 0) {
          sessionParams.discounts = [{ promotion_code: promos.data[0].id }]
        } else {
          // Promo invalide → on ne casse pas, on laisse le user payer plein tarif
          // mais on logue (pour debug)
          console.warn(`[checkout] Promo code "${promoCode}" introuvable ou inactif`)
        }
      } catch (e) {
        console.warn(`[checkout] Promo code lookup failed:`, (e as Error).message)
      }
    } else {
      // Pas de promo explicite → laisser Stripe Checkout afficher le champ
      sessionParams.allow_promotion_codes = true
    }

    const session = await stripe.checkout.sessions.create(sessionParams)

    return NextResponse.json({ url: session.url })
  } catch (error) {
    const err = error as Error
    console.error('[checkout] Erreur Stripe:', err.message)
    return NextResponse.json(
      { error: err.message ?? 'Erreur interne' },
      { status: 500 },
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 })
}

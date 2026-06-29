import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabase'

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

const PRICE_IDS: Record<string, string | undefined> = {
  pro_monthly:   process.env.STRIPE_PRICE_ID_PRO_MONTHLY,
  pro_annual:    process.env.STRIPE_PRICE_ID_PRO_ANNUAL,
  elite_monthly: process.env.STRIPE_PRICE_ID_ELITE_MONTHLY,
  elite_annual:  process.env.STRIPE_PRICE_ID_ELITE_ANNUAL,
}

function getStripe() {
  const key = (process.env.STRIPE_SECRET_KEY || '').replace(/\s/g, '')
  return new Stripe(key, { apiVersion: '2025-02-24.acacia', timeout: 9000, maxNetworkRetries: 1 })
}

async function ensureReferralCoupon(stripe: Stripe, pct: number): Promise<string> {
  const id = `foreas_ref_${pct}`
  try { await stripe.coupons.retrieve(id) }
  catch { await stripe.coupons.create({ id, percent_off: pct, duration: 'forever', name: `Parrainage FOREAS −${pct}%` }) }
  return id
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Clé Stripe non configurée' }, { status: 500 })
    }
    const stripe = getStripe()
    const body = await request.json()
    const { plan, email, referral_code } = body as { plan?: string; email?: string; referral_code?: string }

    const priceId = plan ? PRICE_IDS[plan] : undefined
    if (!priceId) {
      return NextResponse.json({ error: `Plan invalide : ${plan ?? '(vide)'}` }, { status: 400 })
    }

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
    const coupon = pct > 0 ? await ensureReferralCoupon(stripe, pct) : undefined

    const customer = await stripe.customers.create(email ? { email } : {})

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      ...(coupon ? { discounts: [{ coupon }] } : {}),
      metadata: {
        plan: plan as string,
        flow: 'immediate_custom',
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
    console.error('[subscription/create] error:', err.message)
    return NextResponse.json({ error: err.message || 'Erreur serveur', type: err.type }, { status: 500 })
  }
}

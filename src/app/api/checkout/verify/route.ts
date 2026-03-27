import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

function getStripe() {
  const key = (process.env.STRIPE_SECRET_KEY || '').replace(/\s/g, '')
  return new Stripe(key, { apiVersion: '2025-02-24.acacia' })
}

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get('session_id')
    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'session_id manquant' }, { status: 400 })
    }

    const stripe = getStripe()
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer'],
    })

    if (session.status !== 'complete' && session.payment_status !== 'paid') {
      return NextResponse.json({ success: false, error: 'Paiement non confirmé' }, { status: 400 })
    }

    const subscription = session.subscription as Stripe.Subscription | null
    const customer = session.customer as Stripe.Customer | null

    // Déterminer le plan à partir des metadata ou du price
    let plan = subscription?.metadata?.plan || 'weekly'
    if (subscription?.items?.data?.[0]?.price?.id) {
      const priceId = subscription.items.data[0].price.id
      if (priceId === (process.env.STRIPE_PRICE_ANNUAL || 'price_1Szy2YK89oTss0Sb9pQyBWXt')) {
        plan = 'annual'
      }
    }

    const trialEnd = subscription?.trial_end
      ? new Date(subscription.trial_end * 1000).toLocaleDateString('fr-FR', {
          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        })
      : null

    return NextResponse.json({
      success: true,
      email: session.customer_details?.email || customer?.email || '',
      name: session.customer_details?.name || customer?.name || '',
      plan: plan === 'annual' ? 'Annuel' : 'Hebdomadaire',
      trialEnd,
      subscriptionId: subscription?.id || null,
    })
  } catch (error: unknown) {
    console.error('[verify] Erreur:', (error as Error).message)
    return NextResponse.json({ success: false, error: 'Session invalide' }, { status: 400 })
  }
}

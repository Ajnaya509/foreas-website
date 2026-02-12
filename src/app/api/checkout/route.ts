import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// Prix IDs Stripe (live)
const PRICE_IDS = {
  weekly: process.env.STRIPE_PRICE_WEEKLY || 'price_1RvOx5K89oTss0SbHKIgcUoO',
  annual: process.env.STRIPE_PRICE_ANNUAL || 'price_1Szy2YK89oTss0Sb9pQyBWXt',
}

export async function POST(request: NextRequest) {
  try {
    const { plan } = await request.json()

    if (!plan || !['weekly', 'annual'].includes(plan)) {
      return NextResponse.json(
        { error: 'Plan invalide' },
        { status: 400 }
      )
    }

    const priceId = PRICE_IDS[plan as keyof typeof PRICE_IDS]

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${request.nextUrl.origin}/tarifs?success=true`,
      cancel_url: `${request.nextUrl.origin}/tarifs?canceled=true`,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      customer_creation: 'always',
      locale: 'fr',
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du paiement' },
      { status: 500 }
    )
  }
}

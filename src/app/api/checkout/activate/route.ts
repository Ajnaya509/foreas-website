import { NextRequest, NextResponse } from 'next/server'

const STRIPE_API = 'https://api.stripe.com/v1'

const PRICE_IDS: Record<string, string> = {
  weekly: process.env.STRIPE_PRICE_WEEKLY || 'price_1RvOx5K89oTss0SbHKIgcUoO',
  annual: process.env.STRIPE_PRICE_ANNUAL || 'price_1Szy2YK89oTss0Sb9pQyBWXt',
}

function stripeHeaders() {
  return {
    'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  }
}

// Prochain lundi 15h Paris
function getNextMonday15h(): number {
  const now = new Date()
  const day = now.getUTCDay()
  let daysUntil = day === 1 ? 7 : day === 0 ? 1 : 8 - day
  const monday = new Date(now)
  monday.setUTCDate(monday.getUTCDate() + daysUntil)
  const month = monday.getUTCMonth()
  const isSummer = month >= 3 && month <= 9
  monday.setUTCHours(isSummer ? 13 : 14, 0, 0, 0)
  return Math.floor(monday.getTime() / 1000)
}

// GET /api/checkout/activate?customer=cus_xxx&plan=weekly
// Appelé après le setup Checkout — crée la subscription avec trial 7j + anchor lundi
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const customerId = searchParams.get('customer')
    const plan = searchParams.get('plan')
    const origin = request.nextUrl.origin

    if (!customerId || !plan || !PRICE_IDS[plan]) {
      return NextResponse.redirect(`${origin}/tarifs?error=params_invalides`)
    }

    // Récupérer les payment methods du customer
    const pmRes = await fetch(
      `${STRIPE_API}/customers/${customerId}/payment_methods?type=card`,
      { headers: stripeHeaders() }
    )
    const pmData = await pmRes.json()

    if (!pmData.data || pmData.data.length === 0) {
      return NextResponse.redirect(`${origin}/tarifs?error=pas_de_carte`)
    }

    const paymentMethodId = pmData.data[0].id

    // Attacher le payment method comme default
    await fetch(`${STRIPE_API}/customers/${customerId}`, {
      method: 'POST',
      headers: stripeHeaders(),
      body: new URLSearchParams({
        'invoice_settings[default_payment_method]': paymentMethodId,
      }).toString(),
    })

    // Créer la subscription avec trial_period_days + billing_cycle_anchor
    // L'API /v1/subscriptions accepte les deux ensemble (contrairement à Checkout)
    const billingAnchor = getNextMonday15h()

    const subRes = await fetch(`${STRIPE_API}/subscriptions`, {
      method: 'POST',
      headers: stripeHeaders(),
      body: new URLSearchParams({
        'customer': customerId,
        'items[0][price]': PRICE_IDS[plan],
        'trial_period_days': '7',
        'billing_cycle_anchor': billingAnchor.toString(),
        'proration_behavior': 'create_prorations',
        'payment_settings[payment_method_types][0]': 'card',
        'default_payment_method': paymentMethodId,
      }).toString(),
    })

    const subscription = await subRes.json()

    if (subscription.error) {
      console.error('Subscription error:', subscription.error)
      return NextResponse.redirect(
        `${origin}/tarifs?error=${encodeURIComponent(subscription.error.message)}`
      )
    }

    // Subscription créée avec succès → redirect vers success
    return NextResponse.redirect(`${origin}/tarifs?success=true`)
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('Activate error:', err.message)
    const origin = request.nextUrl.origin
    return NextResponse.redirect(`${origin}/tarifs?error=erreur_serveur`)
  }
}

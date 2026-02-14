import { NextRequest, NextResponse } from 'next/server'

// Prix IDs Stripe (live)
const PRICE_IDS: Record<string, string> = {
  weekly: process.env.STRIPE_PRICE_WEEKLY || 'price_1RvOx5K89oTss0SbHKIgcUoO',
  annual: process.env.STRIPE_PRICE_ANNUAL || 'price_1Szy2YK89oTss0Sb9pQyBWXt',
}

/**
 * Calcule le PROCHAIN lundi 18h Paris (strictement futur).
 * Règle absolue : lundi 18h = jour de paiement sacré.
 * Si aujourd'hui est lundi → prochain lundi = +7 jours (trial max = 7j).
 * Si aujourd'hui est dimanche → prochain lundi = demain (trial min = 1j).
 * Retourne un timestamp Unix (secondes).
 */
function getNextMonday18hParis(): number {
  const now = new Date()
  const dayOfWeek = now.getUTCDay() // 0=dim, 1=lun, ..., 6=sam

  // Jours jusqu'au prochain lundi (jamais aujourd'hui si c'est lundi)
  const daysMap: Record<number, number> = {
    0: 1, // dimanche → +1
    1: 7, // lundi → +7 (semaine prochaine, trial = 7 jours)
    2: 6, // mardi → +6
    3: 5, // mercredi → +5
    4: 4, // jeudi → +4
    5: 3, // vendredi → +3
    6: 2, // samedi → +2
  }

  const daysToAdd = daysMap[dayOfWeek]
  const monday = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000)

  // 18h Paris = 17h UTC (hiver CET) ou 16h UTC (été CEST)
  const year = monday.getUTCFullYear()

  // Dernier dimanche de mars (début heure d'été)
  const marchLast = new Date(Date.UTC(year, 2, 31))
  const lastSundayMarch = 31 - (marchLast.getUTCDay() % 7)
  const dstStart = new Date(Date.UTC(year, 2, lastSundayMarch, 1, 0, 0))

  // Dernier dimanche d'octobre (fin heure d'été)
  const octLast = new Date(Date.UTC(year, 9, 31))
  const lastSundayOct = 31 - (octLast.getUTCDay() % 7)
  const dstEnd = new Date(Date.UTC(year, 9, lastSundayOct, 1, 0, 0))

  const isSummer = monday.getTime() >= dstStart.getTime() && monday.getTime() < dstEnd.getTime()
  const utcHour = isSummer ? 16 : 17 // 18h Paris

  monday.setUTCHours(utcHour, 0, 0, 0)

  return Math.floor(monday.getTime() / 1000)
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Clé Stripe non configurée' },
        { status: 500 }
      )
    }

    const { plan } = await request.json()

    if (!plan || !PRICE_IDS[plan]) {
      return NextResponse.json({ error: 'Plan invalide' }, { status: 400 })
    }

    const origin = request.nextUrl.origin
    const trialEnd = getNextMonday18hParis()

    const params = new URLSearchParams({
      'mode': 'subscription',
      'line_items[0][price]': PRICE_IDS[plan],
      'line_items[0][quantity]': '1',
      'success_url': `${origin}/tarifs?success=true`,
      'cancel_url': `${origin}/tarifs?canceled=true`,
      'allow_promotion_codes': 'true',
      'billing_address_collection': 'required',
      'locale': 'fr',
      // Trial gratuit jusqu'au prochain lundi 18h Paris
      // Lundi 18h = sacré. Le trial s'adapte (1 à 7 jours).
      'subscription_data[trial_end]': trialEnd.toString(),
      'payment_method_collection': 'always',
    })

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    const session = await response.json()

    if (session.error) {
      console.error('Stripe API error:', session.error)
      return NextResponse.json(
        { error: session.error.message || 'Erreur Stripe' },
        { status: 400 }
      )
    }

    return NextResponse.json({ url: session.url })
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('Checkout error:', err.message)
    return NextResponse.json(
      { error: err.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// Health check + debug trial_end
export async function GET() {
  const trialEnd = getNextMonday18hParis()
  const trialDate = new Date(trialEnd * 1000)
  const now = new Date()
  const trialDays = Math.round((trialEnd * 1000 - now.getTime()) / (24 * 60 * 60 * 1000))

  return NextResponse.json({
    status: 'ok',
    hasKey: !!process.env.STRIPE_SECRET_KEY,
    keyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 12) || 'NOT_SET',
    billing: {
      nextMonday18hParis: trialDate.toISOString(),
      timestamp: trialEnd,
      trialDays,
      firstCharge: '12,97€',
      rule: 'Lundi 18h Paris = sacré. Trial gratuit jusque-là.',
    },
  })
}

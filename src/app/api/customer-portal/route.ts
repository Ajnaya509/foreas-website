import Stripe from 'stripe'
import { clientServeur } from '@/lib/supabaseServeur'
import { gestionAbonnement } from '@/lib/gestionAbonnement'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const traiter = gestionAbonnement({
  supabase: clientServeur,
  stripe: () => {
    const key = (process.env.STRIPE_SECRET_KEY ?? '').replace(/\s/g, '')
    if (!key) throw new Error('stripe_indisponible')
    return new Stripe(key, { apiVersion: '2025-02-24.acacia' as Stripe.StripeConfig['apiVersion'] })
  },
})

// GET lit l'état. Seul POST crée un accès temporaire au portail.
export const GET = traiter
export const POST = traiter

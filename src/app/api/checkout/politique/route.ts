import { NextResponse, type NextRequest } from 'next/server'
import Stripe from 'stripe'
import { calculerDebitDuJour } from '@/lib/politiquePaiement'
import { resoudreFormule } from '@/lib/offre'
import { clientServeurOuNull } from '@/lib/supabaseServeur'
import { CheckoutOwnerError, verifiedCheckoutAccount } from '@/lib/checkoutOwner'
import { checkoutEligibility } from '@/lib/checkoutEligibility'
import { paymentLinkOffer, checkLegacyPaymentLink } from '@/lib/paymentLinkOffer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
const headers = { 'Cache-Control': 'no-store' }

/** The personal trial decision follows confirmed Auth and current subscription
 * evidence. This GET never creates or expires a payment session. */
export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams
    if (query.getAll('formule').length !== 1 || query.getAll('payment_link').length > 1) throw new CheckoutOwnerError(400, 'Le lien contient plusieurs offres. Demande un nouveau lien à FOREAS.')
    const formule = resoudreFormule(query.get('formule'))
    if (!formule) throw new CheckoutOwnerError(400, 'Cette formule n’est plus proposée.')
    const db = clientServeurOuNull()
    if (!db || !process.env.STRIPE_SECRET_KEY) throw new CheckoutOwnerError(503, 'La vérification de ton compte est indisponible.')
    const beneficiary = await verifiedCheckoutAccount(db, request.headers.get('authorization'))
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY.replace(/\s/g, ''), { apiVersion: '2025-02-24.acacia' as Stripe.StripeConfig['apiVersion'], timeout: 8000, maxNetworkRetries: 1 })
    const eligibility = await checkoutEligibility(db, stripe, beneficiary.userId)
    if (eligibility.active) return NextResponse.json({ accountId: beneficiary.userId, alreadySubscribed: true, confirmeParLeServeur: true }, { headers })
    if (query.has('payment_link')) {
      const offer = await paymentLinkOffer(db, query.get('payment_link'))
      await checkLegacyPaymentLink(db, stripe, offer, beneficiary.userId)
    }
    return NextResponse.json({ ...calculerDebitDuJour(formule, eligibility.immediate, Date.now()), accountId: beneficiary.userId, alreadySubscribed: false, confirmeParLeServeur: true }, { headers })
  } catch (error) {
    return NextResponse.json({ error: error instanceof CheckoutOwnerError ? error.message : 'Ton abonnement ne peut pas être vérifié. Réessaie dans un instant.' }, { status: error instanceof CheckoutOwnerError ? error.status : 503, headers })
  }
}

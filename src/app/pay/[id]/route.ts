import { NextResponse } from 'next/server'
import { clientServeurOuNull } from '@/lib/supabaseServeur'
import { paymentLinkOffer } from '@/lib/paymentLinkOffer'
import { CheckoutOwnerError } from '@/lib/checkoutOwner'

export const dynamic = 'force-dynamic'

/** Opening a link carries an offer to the confirmed-account page. No Stripe
 * creation, no phone lookup, no redirect to an anonymous payment address. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const db = clientServeurOuNull()
    if (!db) throw new CheckoutOwnerError(503, 'Cette offre ne peut pas être vérifiée. Réessaie dans un instant.')
    const offer = await paymentLinkOffer(db, (await params).id)
    const destination = new URL('/tarifs3', request.url)
    destination.searchParams.set('formule', offer.formule)
    destination.searchParams.set('payment_link', offer.id)
    if (offer.referralCode) destination.searchParams.set('ref', offer.referralCode)
    const response = NextResponse.redirect(destination, 307)
    response.headers.set('Cache-Control', 'no-store')
    response.headers.set('Referrer-Policy', 'no-referrer')
    return response
  } catch (error) {
    return NextResponse.json({ error: error instanceof CheckoutOwnerError ? error.message : 'Cette offre ne peut pas être vérifiée.' }, { status: error instanceof CheckoutOwnerError ? error.status : 503, headers: { 'Cache-Control': 'no-store' } })
  }
}

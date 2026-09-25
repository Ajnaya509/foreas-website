import { NextRequest, NextResponse } from 'next/server'
import { clientServeurOuNull } from '@/lib/supabaseServeur'
import { CheckoutOwnerError, verifiedCheckoutAccount } from '@/lib/checkoutOwner'

export const dynamic = 'force-dynamic'
export async function GET(request: NextRequest) {
  const reply = (value: unknown, status = 200) => NextResponse.json(value, { status, headers: { 'Cache-Control': 'no-store' } })
  try {
    const db = clientServeurOuNull()
    if (!db) return reply({ error: 'indisponible' }, 503)
    const account = await verifiedCheckoutAccount(db, request.headers.get('authorization'))
    const checkout = request.nextUrl.searchParams.get('session_id')
    if (!checkout || !/^cs_[A-Za-z0-9_]{10,}$/.test(checkout)) return reply({ error: 'demande_invalide' }, 400)
    const { data, error } = await db.rpc('partner_checkout_owner_read', { p_checkout_id: checkout })
    if (error) return reply({ error: 'indisponible' }, 503)
    if (data?.auth_user_id !== account.userId) return reply({ error: 'paiement_non_retrouve' }, 404)
    return reply({ active: data.active === true, email: account.email })
  } catch (error) {
    return reply({ error: error instanceof CheckoutOwnerError ? error.message : 'indisponible' }, error instanceof CheckoutOwnerError ? error.status : 503)
  }
}

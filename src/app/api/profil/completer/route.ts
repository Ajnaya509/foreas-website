import { NextRequest, NextResponse } from 'next/server'
import { clientServeurOuNull } from '@/lib/supabaseServeur'
import { CheckoutOwnerError, verifiedCheckoutAccount } from '@/lib/checkoutOwner'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Only the confirmed beneficiary may complete their own profile after checkout. */
export async function POST(request: NextRequest) {
  const reply = (value: unknown, status = 200) => NextResponse.json(value, { status, headers: { 'Cache-Control': 'no-store' } })
  try {
    const db = clientServeurOuNull()
    if (!db) return reply({ error: 'indisponible' }, 503)
    const account = await verifiedCheckoutAccount(db, request.headers.get('authorization'))
    const body = await request.json().catch(() => null)
    const checkout = typeof body?.sessionId === 'string' ? body.sessionId.trim() : ''
    const name = typeof body?.prenom === 'string' ? body.prenom.trim() : ''
    const phone = typeof body?.telephone === 'string' ? body.telephone.trim() : ''
    if (!/^cs_[A-Za-z0-9_]{10,}$/.test(checkout)) return reply({ error: 'session_invalide' }, 400)
    if (!/^[\p{L}][\p{L}'’\- ]{1,31}$/u.test(name) || name.split(/\s+/).length > 3 || !/^\+?[0-9 .\-()]{8,24}$/.test(phone) || phone.replace(/\D/g, '').length < 8 || phone.replace(/\D/g, '').length > 15) return reply({ error: 'coordonnees_invalides' }, 400)
    const owner = await db.rpc('partner_checkout_owner_read', { p_checkout_id: checkout })
    if (owner.error) return reply({ error: 'indisponible' }, 503)
    if (owner.data?.auth_user_id !== account.userId) return reply({ error: 'session_introuvable' }, 404)
    if (!owner.data.activated_at) return reply({ error: 'abonne_pas_encore_cree' }, 409)
    const saved = await db.from('subscribers').update({ name, phone, profil_complete_le: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('checkout_session_id', checkout).select('id')
    if (saved.error) return reply({ error: 'ecriture_impossible' }, 503)
    if (!saved.data || saved.data.length !== 1) return reply({ error: 'abonne_pas_encore_cree' }, 409)
    const user = await db.auth.admin.getUserById(account.userId)
    if (user.error || !user.data.user) return reply({ error: 'ecriture_impossible' }, 503)
    const updated = await db.auth.admin.updateUserById(account.userId, { user_metadata: { ...user.data.user.user_metadata, full_name: name, phone } })
    if (updated.error || updated.data.user?.id !== account.userId) return reply({ error: 'ecriture_impossible' }, 503)
    return reply({ ok: true })
  } catch (error) {
    return reply({ error: error instanceof CheckoutOwnerError ? error.message : 'indisponible' }, error instanceof CheckoutOwnerError ? error.status : 503)
  }
}

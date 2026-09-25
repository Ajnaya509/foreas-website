import type { SupabaseClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'
import { CheckoutOwnerError } from './checkoutOwner'
import { UUID_PATTERN } from './partnerApplication'
import { normalizeReferralCode } from './referralOffer'
import { PRIX_ANNUEL_CENTIMES, PRIX_MENSUEL_CENTIMES, resoudreFormule } from './offre'

/** A shared link carries an offer, never proof of who owns an account. */
export async function paymentLinkOffer(db: SupabaseClient, rawId: unknown) {
  if (typeof rawId !== 'string' || !UUID_PATTERN.test(rawId)) throw new CheckoutOwnerError(400, 'Ce lien de paiement est incomplet. Demande un nouveau lien à FOREAS.')
  const { data, error } = await db.from('pieuvre_payment_links')
    .select('id,plan_code,billing_cycle,referral_code_used,status,stripe_session_id,amount_cents,currency')
    .eq('id', rawId).maybeSingle()
  if (error) throw new CheckoutOwnerError(503, 'Cette offre ne peut pas être vérifiée. Réessaie dans un instant.')
  if (!data) throw new CheckoutOwnerError(404, 'Ce lien de paiement est introuvable. Demande un nouveau lien à FOREAS.')
  const plan = resoudreFormule(data.plan_code), cycle = resoudreFormule(data.billing_cycle)
  const formule = plan ?? cycle
  if (!formule || (data.plan_code && !plan) || (data.billing_cycle && !cycle) || (plan && cycle && plan !== cycle)) throw new CheckoutOwnerError(409, 'La formule de ce lien doit être confirmée par FOREAS.')
  if (data.currency !== 'eur' || data.amount_cents !== (formule === 'annuel' ? PRIX_ANNUEL_CENTIMES : PRIX_MENSUEL_CENTIMES)) throw new CheckoutOwnerError(409, 'Le tarif de ce lien a changé. Demande une offre à jour à FOREAS.')
  const code = data.referral_code_used == null ? null : normalizeReferralCode(data.referral_code_used)
  if (data.referral_code_used != null && !code) throw new CheckoutOwnerError(409, 'Le code de cette offre doit être confirmé par FOREAS.')
  if (!['open', 'expired', 'paid', 'checkout_replaced'].includes(data.status) || typeof data.stripe_session_id !== 'string' || !/^cs_(?:test_|live_)?[A-Za-z0-9]+$/.test(data.stripe_session_id)) throw new CheckoutOwnerError(409, 'Ce lien doit être vérifié par FOREAS avant un nouveau paiement.')
  return { id: data.id as string, formule, referralCode: code, oldCheckoutId: data.stripe_session_id as string, status: data.status as string }
}

export type PaymentLinkOffer = Awaited<ReturnType<typeof paymentLinkOffer>>

/** Close the old anonymous checkout before replacing it. Keep its historic
 * identifiers intact for reconciliation. Never infer its owner from the URL. */
export async function checkLegacyPaymentLink(db: SupabaseClient, stripe: Stripe, offer: PaymentLinkOffer, userId: string, closeOpen = false) {
  const tracked = await db.rpc('partner_payment_offer_context', { p_offer_id: offer.id, p_auth_user_id: userId })
  if (tracked.error) throw new CheckoutOwnerError(503, 'Le suivi de ce lien ne peut pas être vérifié. Réessaie dans un instant.')
  if (tracked.data?.status === 'different_owner') throw new CheckoutOwnerError(409, 'Ce lien correspond à un autre compte. Demande une nouvelle offre à FOREAS.')
  if (tracked.data?.status === 'owned' && tracked.data.auth_user_id === userId) return
  if (tracked.data?.status !== 'unclaimed') throw new CheckoutOwnerError(409, 'Le suivi de ce lien doit être vérifié par FOREAS avant un nouveau paiement.')
  const owned = await db.rpc('partner_checkout_owner_read', { p_checkout_id: offer.oldCheckoutId })
  if (owned.error) throw new CheckoutOwnerError(503, 'Ce lien ne peut pas être vérifié pour le moment.')
  if (owned.data?.auth_user_id && owned.data.auth_user_id !== userId) throw new CheckoutOwnerError(409, 'Ce lien correspond à un autre compte. Demande une nouvelle offre à FOREAS.')
  const session = await stripe.checkout.sessions.retrieve(offer.oldCheckoutId)
  if (session.id !== offer.oldCheckoutId || session.mode !== 'subscription' || session.livemode !== /^sk_live_/.test((process.env.STRIPE_SECRET_KEY || '').replace(/\s/g, ''))) throw new Error('payment_link_provider_mismatch')
  if (session.status === 'complete' || offer.status === 'paid') {
    if (owned.data?.auth_user_id !== userId) throw new CheckoutOwnerError(409, 'Un paiement existe déjà sur ce lien. Contacte FOREAS pour retrouver son compte.')
    if (!owned.data?.activated_at) throw new CheckoutOwnerError(409, 'Ton paiement est en cours de vérification. Ne paie pas une seconde fois.')
    return
  }
  if (session.status === 'expired') return
  if (session.status !== 'open') throw new Error('payment_link_status_unknown')
  if (closeOpen) {
    const expired = await stripe.checkout.sessions.expire(session.id)
    if (expired.id !== session.id || expired.status !== 'expired') throw new Error('payment_link_expiration_unconfirmed')
  }
}

/** Attach after owner/price/referral reservation, before making checkout usable. */
export async function attachPaymentOffer(db: SupabaseClient, offerId: string, checkoutId: string, userId: string, annual: boolean) {
  const { data, error } = await db.rpc('partner_payment_offer_attach', { p_offer_id: offerId, p_checkout_id: checkoutId, p_auth_user_id: userId, p_selected_plan: annual ? 'annual' : 'monthly' })
  if (error?.message === 'PAYMENT_OFFER_OWNER_CONFLICT') throw new CheckoutOwnerError(409, 'Ce lien correspond à un autre compte. Demande une nouvelle offre à FOREAS.')
  if (error || data?.status !== 'attached' || data.offer_id !== offerId || data.checkout_id !== checkoutId || data.auth_user_id !== userId) throw new CheckoutOwnerError(503, 'Le suivi de ton paiement doit être confirmé. Réessaie dans un instant.')
}

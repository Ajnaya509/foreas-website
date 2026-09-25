import type { SupabaseClient } from '@supabase/supabase-js'

export class CheckoutOwnerError extends Error {
  constructor(public status: number, message: string) { super(message) }
}

/** The caller proves the beneficiary through Auth, never through billing email. */
export async function verifiedCheckoutAccount(db: SupabaseClient, authorization: string | null) {
  const credential = authorization?.match(/^Bearer ([^\s]+)$/)?.[1]
  if (!credential) throw new CheckoutOwnerError(401, 'Connecte ton compte FOREAS avant de payer.')
  const { data, error } = await db.auth.getUser(credential)
  if (error || !data.user?.email || !data.user.email_confirmed_at) {
    throw new CheckoutOwnerError(401, 'Confirme ton adresse, puis reconnecte-toi avant de payer.')
  }
  const driver = await db.from('drivers').select('id').eq('auth_user_id', data.user.id).maybeSingle()
  if (driver.error) throw new CheckoutOwnerError(503, 'Ton compte ne peut pas être vérifié. Réessaie dans un instant.')
  if (!driver.data) throw new CheckoutOwnerError(409, 'Ton compte chauffeur doit être complété. Contacte l’assistance FOREAS.')
  return { userId: data.user.id, email: data.user.email }
}

export async function reserveCheckoutOwner(db: SupabaseClient, checkoutId: string, userId: string, operationId: string) {
  const { data, error } = await db.rpc('partner_checkout_owner_reserve', {
    p_checkout_id: checkoutId, p_auth_user_id: userId, p_operation_id: operationId,
  })
  if (error || data?.status !== 'reserved' || data.auth_user_id !== userId) throw new Error('checkout_owner_reservation_failed')
}

/** Begin before any Stripe read that may change access. Shared by checkout and sync. */
export async function beginBillingObservation(db: SupabaseClient, userId: string): Promise<string> {
  const { data, error } = await db.rpc('partner_billing_observation_begin', { p_auth_user_id: userId })
  if (error || typeof data !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data)) {
    throw new Error('observation_abonnement_indisponible')
  }
  return data
}

/** Runs only for a signed Checkout event with its subscription freshly retrieved. */
export async function activateOwnedCheckout(db: SupabaseClient, input: {
  checkoutId: string; customerId: string; subscriptionId: string; status: string;
  periodEnd: string | null; trialEnd: string | null; pricePerMonth: number; observationId: string | null;
}) {
  const { data, error } = await db.rpc('partner_checkout_activate', {
    p_checkout_id: input.checkoutId, p_customer_id: input.customerId,
    p_subscription_id: input.subscriptionId, p_status: input.status,
    p_period_end: input.periodEnd, p_trial_end: input.trialEnd, p_price_per_month: input.pricePerMonth, p_observation_id: input.observationId,
  })
  if (error) throw new Error('checkout_activation_reprise_requise')
  if (data?.status === 'needs_review' || data?.status === 'not_active') return { status: data.status } as { status: 'needs_review' | 'not_active' }
  if (data?.status !== 'active' || typeof data.auth_user_id !== 'string' || typeof data.email !== 'string') {
    throw new Error('checkout_activation_non_confirmee')
  }
  return { status: 'active' as const, userId: data.auth_user_id as string, email: data.email as string }
}

/** Retired: Stripe billing email is not proof of a beneficiary account.
 * The signed checkout flow now uses checkoutOwner + partner_checkout_activate.
 * Keep closed exports temporarily for old callers; neither can create or grant anything. */
export async function provisionDriverAccount(_input: unknown) {
  return { status: 'failed' as const, reason: 'checkout_verified_owner_required' }
}
export async function activerAccesChauffeur(_input: unknown) {
  return { ouvert: false, detail: 'checkout_atomic_activation_required' }
}

import type { SupabaseClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'
import { beginBillingObservation } from './checkoutOwner'

/** Reconcile all protected Stripe subscriptions of the same account together.
 * An old customer must not close access provided by a different current customer. */
export async function synchroniserAbonnement(supabase: SupabaseClient, stripe: Stripe, id: string) {
  const first = await supabase.from('subscriptions').select('user_id').eq('provider', 'stripe').eq('stripe_subscription_id', id)
  if (first.error) throw new Error('lecture_lien_abonnement')
  if (!first.data?.length) return
  const owners = [...new Set(first.data.map(row => row.user_id))]
  if (owners.length !== 1 || !owners[0]) throw new Error('lien_abonnement_ambigu')
  const observationId = await beginBillingObservation(supabase, owners[0])
  const mapped = await supabase.from('subscriptions').select('stripe_customer_id,stripe_subscription_id')
    .eq('user_id', owners[0]).eq('provider', 'stripe')
  if (mapped.error || !mapped.data?.length) throw new Error('lecture_liens_abonnement')
  const links = mapped.data.map(row => ({ id: row.stripe_subscription_id, customer: row.stripe_customer_id }))
  if (links.some(row => !row.id || !row.customer) || !links.some(row => row.id === id)) throw new Error('lien_abonnement_ambigu')
  const customers = [...new Set(links.map(row => row.customer))]
  if (customers.length > 20) throw new Error('abonnements_controle_requis')
  const lists = await Promise.all(customers.map(async customer => {
    const result = await stripe.subscriptions.list({ customer, status: 'all', limit: 100 })
    if (result.has_more) throw new Error('abonnements_incomplets')
    return { customer, subscriptions: result.data }
  }))
  const states = links.map(link => {
    const subscription = lists.find(list => list.customer === link.customer)?.subscriptions.find(sub => sub.id === link.id)
    if (!subscription) throw new Error('abonnement_introuvable')
    const customer = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id
    if (customer !== link.customer) throw new Error('lien_abonnement_ambigu')
    const period = (subscription as unknown as { current_period_end?: number }).current_period_end ?? subscription.items.data[0]?.current_period_end
    const toDate = (value: number | null | undefined) => value == null ? null : new Date(value * 1000).toISOString()
    return { ...link, status: subscription.status, period_end: toDate(period), trial_end: toDate(subscription.trial_end) }
  })
  // The transaction rejects superseded observations or links changed during the reads,
  // then updates billing, driver access and profile atomically.
  const saved = await supabase.rpc('partner_billing_sync_owner', {
    p_auth_user_id: owners[0], p_source_subscription_id: id, p_expected_links: links, p_states: states, p_observation_id: observationId,
  })
  if (saved.error || saved.data?.status !== 'synced') throw new Error('synchronisation_abonnement_reprise_requise')
}

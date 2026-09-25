import type { SupabaseClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'
import { CheckoutOwnerError } from './checkoutOwner'
import { synchroniserAbonnement } from './synchroniserAbonnement'

const review = () => new CheckoutOwnerError(409, 'Ton ancien abonnement doit être vérifié. Contacte FOREAS avant de payer à nouveau.')
const unavailable = () => new CheckoutOwnerError(503, 'Ton abonnement ne peut pas être vérifié. Réessaie dans un instant.')
const current = (row: { status: string; current_period_end: string | null }) => ['active', 'trialing'].includes(row.status) && Date.parse(row.current_period_end || '') > Date.now()

/** Shared by the preview and checkout. Only protected Auth mappings count.
 * Unreconciled historical customers stop another trial or subscription. */
export async function checkoutEligibility(db: SupabaseClient, stripe: Stripe, userId: string) {
  const [mapped, driver] = await Promise.all([
    db.from('subscriptions').select('provider,status,current_period_end,stripe_customer_id,stripe_subscription_id').eq('user_id', userId),
    db.from('drivers').select('stripe_customer_id,subscription_start_date,subscription_status,subscription_active').eq('auth_user_id', userId).maybeSingle(),
  ])
  if (mapped.error || driver.error || !driver.data) throw unavailable()
  const rows = mapped.data || [], links = rows.filter(row => row.provider === 'stripe')
  const customers = [...new Set<string>(links.map(row => row.stripe_customer_id))]
  if (links.some(row => !/^sub_[A-Za-z0-9]+$/.test(row.stripe_subscription_id || '') || !/^cus_[A-Za-z0-9]+$/.test(row.stripe_customer_id || '')) || customers.length > 20) throw review()
  const legacy = driver.data
  if (legacy.stripe_customer_id && !customers.includes(legacy.stripe_customer_id)) throw review()
  if (!rows.length && (legacy.subscription_active || ['active', 'trialing', 'past_due', 'unpaid', 'paused', 'canceled', 'expired'].includes(legacy.subscription_status))) throw review()
  let unsettled = false
  for (const customer of customers) {
    const list = await stripe.subscriptions.list({ customer, status: 'all', limit: 100 })
    if (list.has_more) throw review()
    for (const sub of list.data) {
      const actualCustomer = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id
      if (actualCustomer !== customer || sub.livemode !== /^sk_live_/.test((process.env.STRIPE_SECRET_KEY || '').replace(/\s/g, ''))) throw review()
      const known = links.some(row => row.stripe_subscription_id === sub.id && row.stripe_customer_id === customer)
      if (!known && !['canceled', 'incomplete_expired'].includes(sub.status)) throw review()
      if (known && !['canceled', 'incomplete_expired'].includes(sub.status)) unsettled = true
    }
    if (links.some(row => row.stripe_customer_id === customer && !list.data.some(sub => sub.id === row.stripe_subscription_id))) throw review()
  }
  if (links.length) {
    await synchroniserAbonnement(db, stripe, links[0].stripe_subscription_id)
    const refreshed = await db.from('subscriptions').select('provider,status,current_period_end,stripe_customer_id,stripe_subscription_id').eq('user_id', userId)
    if (refreshed.error) throw unavailable()
    if (refreshed.data?.some(current)) return { active: true, immediate: true }
    if (unsettled) throw review()
  } else if (rows.some(current)) return { active: true, immediate: true }
  return { active: false, immediate: rows.length > 0 || !!legacy.subscription_start_date }
}

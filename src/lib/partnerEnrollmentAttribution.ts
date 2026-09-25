import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'

// Adapter for the versioned programme. All callers run on the server, after
// checkout ownership / Stripe signature checks. There is no transfer API here.
const CODE = /^FE[A-F0-9]{24}$/
export const ENROLLMENT_VERSION = '2026-09'
export const enrollmentEnabled = () => process.env.PARTNER_ENROLLMENT_ENABLED === 'true'
export const isEnrollmentCode = (value: unknown): value is string =>
  typeof value === 'string' && CODE.test(value.trim().toUpperCase())
type Row = Record<string, unknown>
const object = (value: unknown): Row => value && typeof value === 'object' && !Array.isArray(value) ? value as Row : {}
const id = (value: unknown): string | null => typeof value === 'string' && value ? value : typeof object(value).id === 'string' ? object(value).id as string : null
const requiredId = (value: unknown): string => {
  const found = id(value)
  if (!found) throw new Error('partner_enrollment_identity_missing')
  return found
}
// A marker requires a verified database record; it can never grant a right.
export function hasEnrollmentReference(value: unknown): boolean {
  const row = object(value)
  const metadata = object(row.metadata)
  return metadata.foreas_partner_enrollment === ENROLLMENT_VERSION || isEnrollmentCode(metadata.referral_code)
}
function invoiceReference(value: unknown): boolean {
  const row = object(value)
  return hasEnrollmentReference(row) || hasEnrollmentReference(row.subscription_details) ||
    hasEnrollmentReference(object(row.parent).subscription_details)
}
function subscriptionId(value: unknown): string | null {
  const row = object(value)
  const legacy = id(row.subscription)
  const modern = id(object(object(row.parent).subscription_details).subscription)
  if (legacy && modern && legacy !== modern) throw new Error('partner_enrollment_subscription_conflict')
  return modern || legacy
}
const tableMissing = (error: unknown): boolean => ['42P01', 'PGRST205'].includes(String(object(error).code))

async function call(db: SupabaseClient, name: string, args: Row, statuses?: readonly string[]): Promise<Row> {
  const { data, error } = await db.rpc(name, args)
  if (error) throw new Error(error.message === 'CODE_UNAVAILABLE' ? 'CODE_UNAVAILABLE' : 'partner_enrollment_' + name + '_failed')
  if (!data || typeof data !== 'object' || Array.isArray(data) || (statuses && !statuses.includes(String(data.status)))) {
    throw new Error('partner_enrollment_' + name + '_unconfirmed')
  }
  return data as Row
}

export async function enrollmentOffer(db: SupabaseClient, code: string) {
  if (!isEnrollmentCode(code)) return null
  if (!enrollmentEnabled()) throw new Error('CODE_UNAVAILABLE')
  return call(db, 'partner_enrollment_offer', { p_code: code.trim().toUpperCase() })
}

/** A verified native claim follows the same user into the website checkout. */
export async function enrollmentIntentCode(db: SupabaseClient, userId: string): Promise<string | null> {
  if (!enrollmentEnabled()) return null
  const { data, error } = await db.rpc('partner_enrollment_intent_offer', { p_user: userId })
  if (error) throw new Error('partner_enrollment_intent_unavailable')
  if (data === null) return null
  if (!isEnrollmentCode(data)) throw new Error('partner_enrollment_intent_invalid')
  return data.trim().toUpperCase()
}

export async function prepareEnrollmentCheckout(db: SupabaseClient, input: {
  session: Stripe.Checkout.Session; code: string; authUserId: string; interval: 'month' | 'year'; unitAmount: number;
}) {
  if (!isEnrollmentCode(input.code)) return false
  if (!enrollmentEnabled()) throw new Error('partner_enrollment_disabled')
  const { session } = input
  const lines = session.line_items
  const line = lines?.data?.[0]
  const price = line?.price
  if (!session.id.startsWith('cs_') || session.mode !== 'subscription' || !lines || lines.has_more || lines.data.length !== 1 ||
      !line || line.quantity !== 1 || !price?.id || price.livemode !== session.livemode || price.currency !== 'eur' ||
      price.unit_amount !== input.unitAmount || price.recurring?.interval !== input.interval || price.recurring.interval_count !== 1 ||
      session.client_reference_id !== input.authUserId || session.metadata?.foreas_user_id !== input.authUserId ||
      session.metadata?.foreas_partner_enrollment !== ENROLLMENT_VERSION || session.metadata?.referral_code !== input.code.trim().toUpperCase()) {
    throw new Error('partner_enrollment_price_unverified')
  }
  await call(db, 'partner_enrollment_checkout_prepare', {
    p_user: input.authUserId, p_code: input.code.trim().toUpperCase(), p_checkout: session.id,
    p_customer: id(session.customer), p_price: price.id, p_interval: input.interval, p_unit: input.unitAmount, p_live: session.livemode,
  }, ['prepared'])
  return true
}

type CheckoutProof = {
  checkout_id: string; user_id: string; customer_id: string | null; subscription_id: string | null;
  price_id: string; interval: 'month' | 'year'; unit_amount: number; live: boolean;
}
function checkoutProof(value: unknown): CheckoutProof {
  const row = object(value)
  if (typeof row.checkout_id !== 'string' || typeof row.user_id !== 'string' || typeof row.price_id !== 'string' ||
      !['month', 'year'].includes(String(row.interval)) || typeof row.live !== 'boolean' ||
      typeof row.unit_amount !== 'number' || !Number.isSafeInteger(row.unit_amount) || row.unit_amount <= 0 ||
      (row.customer_id !== null && typeof row.customer_id !== 'string') ||
      (row.subscription_id !== null && typeof row.subscription_id !== 'string')) throw new Error('partner_enrollment_membership_invalid')
  return row as CheckoutProof
}
async function findCheckout(db: SupabaseClient, field: 'checkout_id' | 'subscription_id', value: string, required: boolean) {
  const { data, error } = await db.from('partner_enrollment_checkouts')
    .select('checkout_id,user_id,customer_id,subscription_id,price_id,interval,unit_amount,live').eq(field, value).maybeSingle()
  if (error) {
    // Absence of the optional migration must never break an old programme.
    // Marked new checkouts always fail closed and are retried by Stripe.
    if (!required && tableMissing(error)) return null
    throw new Error('partner_enrollment_membership_unavailable')
  }
  return data ? checkoutProof(data) : null
}
export async function bindEnrollmentCheckout(db: SupabaseClient, input: {
  checkoutId: string; authUserId: string; customerId: string; subscriptionId: string;
}, required = false) {
  const saved = await findCheckout(db, 'checkout_id', input.checkoutId, required)
  if (!saved) {
    if (required) throw new Error('partner_enrollment_checkout_unprepared')
    return false
  }
  if (saved.user_id !== input.authUserId) throw new Error('partner_enrollment_identity_conflict')
  await call(db, 'partner_enrollment_checkout_bind', {
    p_checkout: input.checkoutId, p_user: input.authUserId, p_customer: input.customerId, p_subscription: input.subscriptionId,
  }, ['attached', 'waiting_driver'])
  await call(db, 'partner_enrollment_reconcile', { p_subscription: input.subscriptionId }, ['recorded'])
  return true
}

export function enrollmentInvoiceProof(invoice: unknown, priceValue: unknown, expected: {
  customer_id: string | null; price_id: string; interval: 'month' | 'year'; unit_amount: number; live: boolean;
}) {
  const row = object(invoice), price = object(priceValue), lines = object(row.lines)
  const line = object(Array.isArray(lines.data) ? lines.data[0] : null)
  const details = object(object(line.parent).subscription_item_details)
  const subscription = subscriptionId(row)
  const legacyPrice = id(line.price), modernPrice = id(object(object(line.pricing).price_details).price)
  if (legacyPrice && modernPrice && legacyPrice !== modernPrice) throw new Error('partner_enrollment_price_conflict')
  if (typeof details.proration === 'boolean' && typeof line.proration === 'boolean' && details.proration !== line.proration) {
    throw new Error('partner_enrollment_proration_conflict')
  }
  const proration = typeof details.proration === 'boolean' ? details.proration : line.proration
  const period = object(line.period), paidAt = object(row.status_transitions).paid_at
  if (!subscription || row.status !== 'paid' || row.livemode !== expected.live || id(row.customer) !== expected.customer_id ||
      row.currency !== 'eur' || typeof row.amount_paid !== 'number' || !Number.isSafeInteger(row.amount_paid) || row.amount_paid <= 0 ||
      !['subscription_create', 'subscription_cycle', 'subscription_update'].includes(String(row.billing_reason)) ||
      lines.has_more !== false || !Array.isArray(lines.data) || lines.data.length !== 1 || line.quantity !== 1 || proration !== false ||
      typeof period.start !== 'number' || typeof period.end !== 'number' || typeof paidAt !== 'number' ||
      !Number.isSafeInteger(period.start) || !Number.isSafeInteger(period.end) || !Number.isSafeInteger(paidAt)) {
    throw new Error('partner_enrollment_invoice_unverified')
  }
  const recurring = object(price.recurring)
  if ((modernPrice || legacyPrice) !== expected.price_id || price.id !== expected.price_id || price.livemode !== expected.live ||
      price.unit_amount !== expected.unit_amount || price.currency !== 'eur' || recurring.interval !== expected.interval || recurring.interval_count !== 1) {
    throw new Error('partner_enrollment_price_unverified')
  }
  const start = new Date(period.start * 1000), end = new Date(period.end * 1000)
  const whole = new Date(start), day = start.getUTCDate()
  whole.setUTCDate(1)
  whole.setUTCMonth(whole.getUTCMonth() + (expected.interval === 'year' ? 12 : 1))
  const last = new Date(Date.UTC(whole.getUTCFullYear(), whole.getUTCMonth() + 1, 0)).getUTCDate()
  whole.setUTCDate(Math.min(day, last))
  // Stripe preserves anchors such as Jan 31 → Feb 28 → Mar 31. A short
  // month must not make the following full recurring period look prorated.
  const startLast = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0)).getUTCDate()
  const restoredAnchor = day === startLast && end.getUTCFullYear() === whole.getUTCFullYear() &&
    end.getUTCMonth() === whole.getUTCMonth() && end.getUTCDate() >= whole.getUTCDate() &&
    end.getUTCHours() === start.getUTCHours() && end.getUTCMinutes() === start.getUTCMinutes() && end.getUTCSeconds() === start.getUTCSeconds()
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) ||
      (end.getTime() !== whole.getTime() && !restoredAnchor)) throw new Error('partner_enrollment_full_period_required')
  return { subscription, price: expected.price_id, paidAt: new Date(paidAt * 1000).toISOString(), start: start.toISOString(), end: end.toISOString() }
}

async function invoiceCheckout(db: SupabaseClient, stripe: Stripe, invoice: Stripe.Invoice): Promise<CheckoutProof | null> {
  const subscription = subscriptionId(invoice)
  if (!subscription) return null
  let marked = invoiceReference(invoice)
  let saved = await findCheckout(db, 'subscription_id', subscription, marked)
  if (saved) {
    if (saved.live !== invoice.livemode || saved.customer_id !== id(invoice.customer) || saved.subscription_id !== subscription) {
      throw new Error('partner_enrollment_identity_conflict')
    }
    return saved
  }
  // A canonical subscription read distinguishes old events from a new checkout
  // whose completion callback has not arrived yet, including during rollback.
  const canonical = await stripe.subscriptions.retrieve(subscription)
  if (canonical.id !== subscription || canonical.livemode !== invoice.livemode || id(canonical.customer) !== id(invoice.customer)) {
    throw new Error('partner_enrollment_identity_conflict')
  }
  marked = marked || hasEnrollmentReference(canonical)
  if (!marked) return null
  const sessions = await stripe.checkout.sessions.list({ subscription, limit: 10 })
  if (sessions.has_more) throw new Error('partner_enrollment_checkout_ambiguous')
  for (const session of sessions.data) {
    const prepared = await findCheckout(db, 'checkout_id', session.id, true)
    if (!prepared) continue
    if (saved || session.status !== 'complete' || session.livemode !== invoice.livemode || id(session.customer) !== id(invoice.customer) ||
        id(session.subscription) !== subscription || session.client_reference_id !== prepared.user_id ||
        session.metadata?.foreas_user_id !== prepared.user_id || !hasEnrollmentReference(session)) {
      throw new Error('partner_enrollment_identity_conflict')
    }
    await bindEnrollmentCheckout(db, { checkoutId: session.id, authUserId: prepared.user_id,
      customerId: requiredId(session.customer), subscriptionId: subscription }, true)
    saved = { ...prepared, customer_id: id(session.customer), subscription_id: subscription }
  }
  if (!saved) throw new Error('partner_enrollment_checkout_unprepared')
  return saved
}

/** Canonical invoice and recorded checkout only; never event-carried identity. */
export async function recordEnrollmentPaidInvoice(db: SupabaseClient, stripe: Stripe, invoiceId: string | undefined, liveMode: boolean) {
  if (!invoiceId) throw new Error('partner_enrollment_invoice_missing')
  const invoice = await stripe.invoices.retrieve(invoiceId)
  if (invoice.id !== invoiceId || invoice.livemode !== liveMode) throw new Error('partner_enrollment_mode_conflict')
  const saved = await invoiceCheckout(db, stripe, invoice)
  if (!saved) return false
  if (invoice.amount_paid === 0) return true
  const price = await stripe.prices.retrieve(saved.price_id)
  const proof = enrollmentInvoiceProof(invoice, price, saved)
  await call(db, 'partner_enrollment_invoice_record', {
    p_invoice: invoice.id, p_subscription: proof.subscription, p_customer: id(invoice.customer), p_price: proof.price,
    p_amount: invoice.amount_paid, p_currency: 'eur', p_interval: saved.interval, p_paid: proof.paidAt,
    p_start: proof.start, p_end: proof.end, p_live: liveMode,
  }, ['recorded'])
  return true
}

/** Block proven refunds/disputes. Never move money or reverse a bank transfer. */
export async function blockEnrollmentInvoiceIssue(db: SupabaseClient, stripe: Stripe, event: Stripe.Event) {
  const refund = event.type === 'charge.refunded'
  const disputeEvent = event.type.startsWith('charge.dispute.')
  if (!refund && !disputeEvent) return false
  let chargeId = requiredId(event.data.object)
  if (disputeEvent) {
    const dispute = await stripe.disputes.retrieve(chargeId)
    if (dispute.id !== chargeId || dispute.livemode !== event.livemode) throw new Error('partner_enrollment_mode_conflict')
    chargeId = requiredId(dispute.charge)
  }
  const charge = await stripe.charges.retrieve(chargeId)
  if (charge.id !== chargeId || charge.livemode !== event.livemode ||
      (refund && (!Number.isSafeInteger(charge.amount_refunded) || charge.amount_refunded <= 0 || charge.amount_refunded > charge.amount))) {
    throw new Error('partner_enrollment_issue_unverified')
  }
  let ids: string[] = []
  const direct = id(object(charge).invoice), paymentIntent = id(charge.payment_intent)
  if (direct) ids = [direct]
  else if (paymentIntent) {
    const payments = await stripe.invoicePayments.list({ payment: { type: 'payment_intent', payment_intent: paymentIntent }, limit: 100 }, { apiVersion: '2025-08-27.basil' })
    if (payments.has_more || payments.data.some(payment => payment.livemode !== event.livemode)) throw new Error('partner_enrollment_issue_incomplete')
    ids = [...new Set(payments.data.map(payment => requiredId(payment.invoice)))]
  }
  let handled = 0
  for (const invoiceId of ids) {
    const invoice = await stripe.invoices.retrieve(invoiceId)
    if (invoice.id !== invoiceId || invoice.livemode !== event.livemode) throw new Error('partner_enrollment_mode_conflict')
    const saved = await invoiceCheckout(db, stripe, invoice)
    if (!saved) continue
    await call(db, 'partner_enrollment_invoice_block', { p_invoice: invoiceId, p_issue: refund ? 'refund' : 'dispute' }, ['recorded'])
    handled += 1
  }
  // A payment can cover several invoices. Keep the legacy handler when any
  // invoice belongs to an earlier programme so its existing rights are updated.
  return ids.length > 0 && handled === ids.length
}

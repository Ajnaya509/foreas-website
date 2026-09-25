import type Stripe from 'stripe'
import type { SupabaseClient } from '@supabase/supabase-js'

type RecordValue = Record<string, unknown>
const object = (value: unknown): RecordValue => value && typeof value === 'object' ? value as RecordValue : {}
const idOf = (value: unknown): string | null => typeof value === 'string' && value ? value : typeof object(value).id === 'string' ? object(value).id as string : null
const requiredId = (value: unknown, kind: string): string => {
  const id = idOf(value)
  if (!id) throw new Error('partner_' + kind + '_missing')
  return id
}
export function invoiceSubscription(invoice: unknown): string | null {
  const row = object(invoice)
  const legacy = idOf(row.subscription)
  const current = idOf(object(object(row.parent).subscription_details).subscription)
  if (legacy && current && legacy !== current) throw new Error('partner_subscription_conflict')
  return current || legacy
}
export function invoiceLineProof(invoice: Stripe.Invoice) {
  if (invoice.lines.has_more || invoice.lines.data.length !== 1) throw new Error('partner_invoice_lines_unmapped')
  const line = object(invoice.lines.data[0])
  const legacyPrice = idOf(line.price)
  const currentPrice = idOf(object(object(line.pricing).price_details).price)
  if (legacyPrice && currentPrice && legacyPrice !== currentPrice) throw new Error('partner_price_conflict')
  const priceId = requiredId(currentPrice || legacyPrice, 'price')
  const currentDetails = object(object(line.parent).subscription_item_details)
  const legacyProration = line.proration
  const currentProration = currentDetails.proration
  if (typeof legacyProration === 'boolean' && typeof currentProration === 'boolean' && legacyProration !== currentProration) throw new Error('partner_proration_conflict')
  const proration = typeof currentProration === 'boolean' ? currentProration : legacyProration
  if (typeof proration !== 'boolean' || line.quantity !== 1) throw new Error('partner_invoice_line_unmapped')
  return { priceId, proration }
}
async function rpcChecked(sb: SupabaseClient, name: string, args: RecordValue) {
  const result = await sb.rpc(name, args)
  if (result.error) throw new Error('partner_' + name + '_failed')
  if (!result.data || typeof result.data !== 'object') throw new Error('partner_' + name + '_invalid_response')
  return result.data
}
/** Called only after signature, mode and event reservation checks. Failures must be retried. */
export async function recordPartnerPaidInvoice(sb: SupabaseClient, stripe: Stripe, invoiceId: string | undefined, liveMode: boolean) {
  if (!invoiceId) throw new Error('partner_invoice_missing')
  const invoice = await stripe.invoices.retrieve(invoiceId)
  if (invoice.livemode !== liveMode) throw new Error('partner_invoice_mode_conflict')
  if (invoice.status !== 'paid') throw new Error('partner_invoice_not_paid')
  if (invoice.amount_paid === 0) return { status: 'no_paid_amount' }
  if (!Number.isSafeInteger(invoice.amount_paid) || invoice.amount_paid < 0) throw new Error('partner_invoice_amount_invalid')
  const subscriptionId = invoiceSubscription(invoice)
  if (!subscriptionId) return { status: 'not_subscription' }
  // Ending a trial now produces subscription_update even for a full recurring period.
  // The single line, quantity, proration and registered price are still checked below.
  if (!['subscription_create', 'subscription_cycle', 'subscription_update'].includes(invoice.billing_reason || '')) throw new Error('partner_invoice_reason_unmapped')
  const customerId = requiredId(invoice.customer, 'customer')
  const proof = invoiceLineProof(invoice)
  if (invoice.billing_reason === 'subscription_update' && proof.proration) throw new Error('partner_invoice_reason_unmapped')
  const price = await stripe.prices.retrieve(proof.priceId)
  if (price.livemode !== liveMode || !price.recurring) throw new Error('partner_price_invalid')
  const { data: links, error } = await sb.from('subscriptions')
    .select('user_id,stripe_customer_id,provider').eq('stripe_subscription_id', subscriptionId)
  if (error) throw new Error('partner_billing_link_unavailable')
  if (links?.length && (links.some(link => link.provider !== 'stripe' || link.stripe_customer_id !== customerId || typeof link.user_id !== 'string') ||
      new Set(links.map(link => link.user_id)).size !== 1)) throw new Error('partner_billing_identity_unresolved')
  // Preserve a verified invoice even when checkout identity is not linked yet.
  // The private ledger reconciles it after the protected beneficiary is established.
  const paidAt = invoice.status_transitions?.paid_at
  if (!paidAt || !Number.isFinite(paidAt)) throw new Error('partner_paid_date_missing')
  const result = await rpcChecked(sb, 'partner_paid_invoice', {
    p_auth_user_id: links?.[0]?.user_id ?? null, p_customer_id: customerId, p_subscription_id: subscriptionId,
    p_invoice_id: invoice.id, p_price_id: price.id, p_interval: price.recurring.interval,
    p_interval_count: price.recurring.interval_count, p_amount_paid: invoice.amount_paid,
    p_paid_at: new Date(paidAt * 1000).toISOString(), p_currency: invoice.currency,
    p_proration: proof.proration,
  })
  if (!['created', 'already_recorded', 'commission_ended', 'no_referral', 'no_paid_amount', 'waiting_identity', 'waiting_billing_identity', 'policy_unmapped', 'attribution_after_payment'].includes(result.status)) throw new Error('partner_invoice_status_unknown')
  return result
}
async function invoiceIdsForCharge(stripe: Stripe, charge: Stripe.Charge): Promise<string[]> {
  const direct = idOf(object(charge).invoice)
  if (direct) return [direct]
  const paymentId = idOf(charge.payment_intent)
  if (!paymentId) throw new Error('partner_charge_invoice_unmapped')
  // This resource arrived after Acacia. Only this read uses the newer version.
  const payments = await stripe.invoicePayments.list({ payment: { type: 'payment_intent', payment_intent: paymentId }, limit: 100 }, { apiVersion: '2025-08-27.basil' })
  if (payments.has_more || payments.data.some(payment => payment.livemode !== charge.livemode)) throw new Error('partner_charge_invoices_incomplete')
  return [...new Set(payments.data.map(payment => requiredId(payment.invoice, 'invoice')))]
}
export async function recordPartnerInvoiceIssue(sb: SupabaseClient, stripe: Stripe, event: Stripe.Event) {
  const kind = event.type === 'charge.refunded' ? 'refund' : event.type.startsWith('charge.dispute.') ? 'dispute' : null
  if (!kind) return { status: 'not_invoice_issue' }
  const issueId = requiredId(event.data.object, kind)
  // This reservation must precede even disputes.retrieve. A delayed read cannot
  // overwrite the result of a later verification from the app or the site.
  const observation = await rpcChecked(sb, 'partner_invoice_issue_observation_begin', { p_kind: kind, p_issue_id: issueId })
  const observationId = observation.observation_id
  if (typeof observationId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(observationId) || observation.kind !== kind || observation.issue_id !== issueId) throw new Error('partner_issue_observation_unconfirmed')
  let chargeId: string
  let status: string | null
  if (kind === 'refund') { chargeId = issueId; status = null }
  else {
    const dispute = await stripe.disputes.retrieve(issueId)
    if (dispute.id !== issueId || dispute.livemode !== event.livemode || typeof dispute.status !== 'string') throw new Error('partner_dispute_mode_conflict')
    chargeId = requiredId(dispute.charge, 'charge')
    status = dispute.status === 'won' ? null : dispute.status
  }
  const charge = await stripe.charges.retrieve(chargeId)
  if (charge.id !== chargeId || charge.livemode !== event.livemode) throw new Error('partner_charge_mode_conflict')
  if (kind === 'refund' && (!Number.isSafeInteger(charge.amount) || charge.amount <= 0 ||
      !Number.isSafeInteger(charge.amount_refunded) || charge.amount_refunded <= 0 || charge.amount_refunded > charge.amount)) {
    throw new Error('partner_refund_not_confirmed')
  }
  if (kind === 'refund') status = charge.amount_refunded >= charge.amount ? 'refunded' : 'partially_refunded'
  const ids = await invoiceIdsForCharge(stripe, charge)
  const written = await rpcChecked(sb, 'partner_record_invoice_issues', {
    p_kind: kind, p_issue_id: issueId, p_observation_id: observationId, p_status: status, p_invoice_ids: ids,
  })
  if (written.status !== 'recorded' || written.observation_id !== observationId || written.invoice_count !== ids.length) throw new Error('partner_issue_recording_unconfirmed')
  return { status: ids.length ? 'recorded' : 'not_invoice_payment' }
}

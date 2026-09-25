import { createHash } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { sendWelcomeEmailReceipt } from '@/lib/email'

export async function sendCheckoutWelcome(sb: SupabaseClient, checkoutId: string, authUserId: string,
  message: Omit<Parameters<typeof sendWelcomeEmailReceipt>[0], 'deliveryKey'>): Promise<boolean> {
  const fingerprint = createHash('sha256').update(JSON.stringify(message)).digest('hex')
  const claim = await sb.rpc('partner_checkout_welcome_claim', {
    p_checkout_id: checkoutId, p_auth_user_id: authUserId, p_body_sha256: fingerprint,
  })
  if (claim.error || !claim.data?.status) throw new Error('welcome_receipt_unavailable')
  if (claim.data.status === 'accepted') return true
  if (claim.data.status === 'needs_review') return false
  if (claim.data.status !== 'send' || !claim.data.lease_id) throw new Error('welcome_retry_required')
  const sent = await sendWelcomeEmailReceipt({ ...message, deliveryKey: 'checkout-welcome/' + checkoutId })
  const complete = await sb.rpc('partner_checkout_welcome_complete', {
    p_checkout_id: checkoutId, p_lease_id: claim.data.lease_id,
    p_provider_id: sent.accepted && sent.providerId ? sent.providerId : null,
  })
  if (complete.error || !['accepted', 'retry'].includes(complete.data?.status)) throw new Error('welcome_receipt_not_saved')
  if (complete.data.status !== 'accepted') throw new Error('welcome_retry_required')
  return true
}

import { createHash, randomUUID } from 'node:crypto'
import type Stripe from 'stripe'
import type { SupabaseClient } from '@supabase/supabase-js'

export class UniqueCheckoutError extends Error {
  constructor(readonly status: number, message: string) { super(message) }
}
const busy = () => new UniqueCheckoutError(409, 'Un paiement est en préparation pour ton compte. Réessaie dans un instant.')
const review = () => new UniqueCheckoutError(409, 'Ton paiement doit être vérifié avant de recommencer. Contacte contact@foreas.xyz.')
const paid = () => new UniqueCheckoutError(409, 'Ton abonnement est déjà en cours. Retrouve-le dans ton compte FOREAS.')
const unavailable = () => new UniqueCheckoutError(503, 'Le paiement ne peut pas être vérifié. Réessaie dans un instant.')
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const apiVersion = '2025-08-27.basil'
const id = (value: any): string | null => typeof value === 'string' ? value : value?.id ?? null
const stable = (v: any): any => Array.isArray(v) ? v.map(stable) : v && typeof v === 'object'
  ? Object.fromEntries(Object.keys(v).sort().filter(k => v[k] !== undefined).map(k => [k, stable(v[k])])) : v

/** Identical file in both producers. A lease serializes workers; an immutable
 * provider request survives the lease, crashes and caller-key rotation.
 * Never release an unknown payment merely because time has passed. */
export async function uniqueCheckout(input: {
  db: SupabaseClient; stripe: Stripe; userId: string; livemode: boolean;
  params: Stripe.Checkout.SessionCreateParams; context: Record<string, unknown>;
  validate: () => Promise<void>;
  finalize: (session: Stripe.Checkout.Session, operation: string) => Promise<void>;
}): Promise<Stripe.Checkout.Session> {
  const { db, stripe, userId, livemode } = input
  const proposed = JSON.parse(JSON.stringify(input.params))
  if (proposed.mode !== 'subscription' || proposed.after_expiration || proposed.expires_at) throw unavailable()
  const signature = createHash('sha256').update(JSON.stringify(stable({ params: proposed, context: input.context, livemode, api_version: apiVersion }))).digest('hex')
  // Request-level API override works with both deployed Stripe SDK generations.
  const options = { apiVersion, timeout: 8000, maxNetworkRetries: 1 } as Stripe.RequestOptions
  for (let round = 0; round < 3; round++) {
    const worker = randomUUID()
    const entered = await db.rpc('partner_checkout_gate_enter', { p_auth_user_id: userId, p_worker_id: worker })
    const gate = entered.data
    if (entered.error || gate?.auth_user_id !== userId) throw unavailable()
    if (gate.status === 'busy') throw busy()
    if (gate.status !== 'entered' || gate.worker_id !== worker || !uuid.test(gate.operation_id || '')
      || !Array.isArray(gate.legacy_checkouts)) throw unavailable()
    let released = false
    const write = async (action: string, data: Record<string, unknown> = {}) => {
      const result = await db.rpc('partner_checkout_gate_write', { p_auth_user_id: userId,
        p_operation_id: gate.operation_id, p_worker_id: worker, p_action: action, p_data: data })
      if (result.error || result.data?.status !== action || result.data.auth_user_id !== userId
        || result.data.operation_id !== gate.operation_id || result.data.worker_id !== worker) throw unavailable()
    }
    const fresh = async (sessionId: string, request?: any) => {
      await write('renew')
      const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['line_items.data.price'] }, options)
      if (session.id !== sessionId || session.mode !== 'subscription' || session.livemode !== livemode
        || !['open', 'complete', 'expired'].includes(session.status || '')
        || session.after_expiration?.recovery?.enabled) throw review()
      if (request && (session.metadata?.foreas_checkout_operation !== gate.operation_id
        || session.expires_at !== request.params.expires_at
        || (session.ui_mode || 'hosted') !== (request.params.ui_mode || 'hosted')
        || (request.params.customer && id(session.customer) !== request.params.customer))) throw review()
      return session
    }
    const terminal = async (session: Stripe.Checkout.Session, expire: boolean) => {
      if (session.status === 'open' && expire) {
        await write('renew')
        // Expiry can lose a race to payment. Always reread, even after an error.
        try { await stripe.checkout.sessions.expire(session.id, {}, options) } catch { /* reread below */ }
        session = await fresh(session.id)
      }
      if (session.status === 'expired') return 'expired' as const
      if (session.status === 'complete') {
        const subId = id(session.subscription), customer = id(session.customer)
        if (!subId || !customer) throw review()
        await write('renew')
        const sub = await stripe.subscriptions.retrieve(subId, {}, options)
        if (sub.id !== subId || id(sub.customer) !== customer || sub.livemode !== livemode) throw review()
        if (['canceled', 'incomplete_expired'].includes(sub.status)) {
          if (!['paid', 'no_payment_required'].includes(session.payment_status)) throw review()
          return 'subscription_ended' as const
        }
        throw paid()
      }
      return null
    }
    try {
      let request = gate.request
      if (request != null && (request.signature !== gate.signature || !Number.isFinite(Date.parse(gate.prepared_at)))) throw review()
      if (request == null) {
        if (gate.checkout_id || gate.prepared_at || gate.signature) throw unavailable()
        // Earlier verified sessions also have to be closed before the first
        // new gate can issue a payment. Anonymous history remains a reception gap.
        if (gate.legacy_checkouts.length > 100) throw review()
        for (const oldId of gate.legacy_checkouts) {
          if (typeof oldId !== 'string' || !/^cs_[A-Za-z0-9_]+$/.test(oldId)) throw review()
          if (!await terminal(await fresh(oldId), true)) throw review()
        }
        await input.validate()
        await write('renew')
        request = { api_version: apiVersion, livemode, signature, context: input.context,
          params: { ...proposed, expires_at: Math.floor(Date.now() / 1000) + 21600,
            metadata: { ...proposed.metadata, foreas_checkout_operation: gate.operation_id } } }
        await write('prepare', request)
      }
      if (request.api_version !== apiVersion || request.livemode !== livemode || !/^[a-f0-9]{64}$/.test(request.signature || '')
        || request.params?.mode !== 'subscription' || request.params?.metadata?.foreas_checkout_operation !== gate.operation_id
        || !Number.isSafeInteger(request.params?.expires_at)) throw review()
      let sessionId = gate.checkout_id as string | null
      if (!sessionId) {
        const expiry = request.params.expires_at
        if (Date.now() / 1000 < expiry - 1800) {
          await write('renew')
          // Exact stored bytes and a server operation shared across both channels.
          const created = await stripe.checkout.sessions.create(request.params,
            { ...options, idempotencyKey: `foreas-checkout/${gate.operation_id}` })
          sessionId = created.id
        } else {
          // After the fixed creation window, never replay a potentially pruned
          // Stripe key. Recover the object by the private operation's marker.
          let cursor: string | undefined
          const found = new Set<string>()
          let complete = false
          for (let page = 0; page < 20; page++) {
            await write('renew')
            const list = await stripe.checkout.sessions.list({ limit: 100, starting_after: cursor,
              created: { gte: expiry - 21600 - 300, lte: expiry },
              ...(request.params.customer ? { customer: request.params.customer } : {}) }, options)
            for (const row of list.data) if (row.metadata?.foreas_checkout_operation === gate.operation_id) found.add(row.id)
            if (!list.has_more) { complete = true; break }
            const next = list.data.at(-1)?.id
            if (!next || next === cursor) throw review()
            cursor = next
          }
          if (!complete || found.size !== 1) throw review()
          sessionId = [...found][0]
        }
      }
      if (!sessionId || !/^cs_[A-Za-z0-9_]+$/.test(sessionId)) throw review()
      let session = await fresh(sessionId, request)
      await write('attach', { checkout_id: session.id })
      const reason = await terminal(session, request.signature !== signature)
      if (reason) {
        await write('retire', { checkout_id: session.id, reason })
        released = true
        continue
      }
      if (request.signature !== signature || session.status !== 'open') throw review()
      // Recheck current rights and trial eligibility even for a recovered session.
      await input.validate()
      await write('renew')
      await input.finalize(session, gate.operation_id)
      session = await fresh(session.id, request)
      if (session.status !== 'open') throw paid()
      await write('release')
      released = true
      return session
    } finally {
      // This only releases the worker, never the unresolved payment request.
      if (!released) { try { await write('release') } catch { /* a newer worker owns recovery */ } }
    }
  }
  throw busy()
}

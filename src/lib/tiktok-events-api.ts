/**
 * TikTok Events API (server-side) — équivalent TikTok de meta-capi.ts.
 *
 * Pourquoi : le pixel TikTok client seul perd des signaux exactement pour les mêmes
 * raisons que Meta (adblockers, ITP, Safari) — voir meta-capi.ts pour le contexte complet.
 * Même stratégie ici : doubler chaque event pixel client par un event server-to-server.
 *
 * Doc : https://business-api.tiktok.com/portal/docs?id=1771100865818625
 *
 * Configuration requise (env vars Vercel) :
 *   TIKTOK_PIXEL_ID              — "Pixel Code" trouvé dans TikTok Ads Manager > Assets > Events
 *   TIKTOK_CAPI_ACCESS_TOKEN     — token généré dans Ads Manager > Events > Web Events > Setup > Generate Access Token
 *   NEXT_PUBLIC_TIKTOK_PIXEL_ID  — même valeur que TIKTOK_PIXEL_ID, exposée au client pour le pixel JS
 *
 * Déduplication : chaque event a un `event_id` (même UUID que le pixel client) — TikTok
 * déduplique automatiquement les 2 sources, identique au mécanisme Meta.
 *
 * Fail-open volontaire : sans les 2 variables, sendTikTokEvent() renvoie simplement
 * { ok:false, error:'capi_not_configured' } sans jamais jeter — le webhook Stripe (qui
 * appelle ceci en Promise.allSettled) ne doit jamais échouer à cause d'un pixel pub.
 */

import crypto from 'crypto'

const TIKTOK_API_VERSION = 'v1.3'

// ─── Types ────────────────────────────────────────────────────────────────────
// Noms d'events standard TikTok (distincts des noms Meta — mappés dans tracking.ts)
export type TikTokEventName =
  | 'ViewContent'
  | 'InitiateCheckout'
  | 'AddPaymentInfo'
  | 'CompletePayment'
  | 'SubmitForm'
  | 'CompleteRegistration'
  | 'Contact'
  | 'Subscribe'

export interface TikTokUserData {
  email?: string | null
  phone?: string | null
  externalId?: string | null // identity_bridge.id, même valeur que côté Meta
  ttclid?: string | null // _ttclid cookie (click ID TikTok Ads) — NON hashé
  ttp?: string | null // _ttp cookie (browser ID TikTok) — NON hashé
  clientIpAddress?: string | null
  clientUserAgent?: string | null
}

export interface TikTokCustomData {
  value?: number
  currency?: string
  contentName?: string
  contentIds?: string[]
  contentType?: string
  orderId?: string
}

// ─── Helpers — même normalisation que meta-capi.ts (cohérence des 2 canaux) ────
function sha256(value: string): string {
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

function normalizePhone(raw: string): string {
  const digits = raw.replace(/[^\d]/g, '')
  if (digits.startsWith('0') && digits.length === 10) return '+33' + digits.slice(1)
  if (digits.startsWith('33')) return '+' + digits
  if (digits.startsWith('+')) return digits
  return '+' + digits
}

function buildUserData(user: TikTokUserData): Record<string, string> {
  const ud: Record<string, string> = {}

  if (user.email) ud.email = sha256(user.email)
  if (user.phone) ud.phone = sha256(normalizePhone(user.phone))
  if (user.externalId) ud.external_id = sha256(user.externalId)

  // Non hashés (cf. doc TikTok, même logique que fbc/fbp côté Meta)
  if (user.ttclid) ud.ttclid = user.ttclid
  if (user.ttp) ud.ttp = user.ttp
  if (user.clientIpAddress) ud.ip = user.clientIpAddress
  if (user.clientUserAgent) ud.user_agent = user.clientUserAgent

  return ud
}

// ─── Main sender ──────────────────────────────────────────────────────────────
export interface SendTikTokEventOptions {
  eventName: TikTokEventName
  userData: TikTokUserData
  customData?: TikTokCustomData
  eventSourceUrl?: string
  eventId?: string // pour dedup avec pixel client (même UUID que Meta CAPI)
}

export async function sendTikTokEvent(opts: SendTikTokEventOptions): Promise<{ ok: boolean; error?: string }> {
  const pixelId = process.env.TIKTOK_PIXEL_ID
  const accessToken = process.env.TIKTOK_CAPI_ACCESS_TOKEN

  if (!pixelId || !accessToken) {
    // Silencieux — même comportement que meta-capi.ts : permet de déployer sans
    // TikTok configuré, sans jamais casser le flux de paiement qui appelle ceci.
    return { ok: false, error: 'capi_not_configured' }
  }

  const properties: Record<string, unknown> = {}
  if (opts.customData) {
    if (opts.customData.value !== undefined) properties.value = opts.customData.value
    if (opts.customData.currency) properties.currency = opts.customData.currency
    if (opts.customData.contentName) properties.description = opts.customData.contentName
    if (opts.customData.contentIds) properties.content_id = opts.customData.contentIds[0]
    if (opts.customData.contentType) properties.content_type = opts.customData.contentType
    if (opts.customData.orderId) properties.order_id = opts.customData.orderId
  }

  const eventPayload: Record<string, unknown> = {
    event: opts.eventName,
    event_time: Math.floor(Date.now() / 1000),
    user: buildUserData(opts.userData),
  }
  if (opts.eventId) eventPayload.event_id = opts.eventId
  if (Object.keys(properties).length > 0) eventPayload.properties = properties
  if (opts.eventSourceUrl) eventPayload.page = { url: opts.eventSourceUrl }

  const body = {
    event_source: 'web',
    event_source_id: pixelId,
    data: [eventPayload],
  }

  try {
    const res = await fetch(
      `https://business-api.tiktok.com/open_api/${TIKTOK_API_VERSION}/event/track/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Access-Token': accessToken,
        },
        body: JSON.stringify(body),
      }
    )
    const json = await res.json().catch(() => null)
    // TikTok renvoie 200 même sur erreur métier — le vrai statut est json.code (0 = succès)
    if (!res.ok || (json && json.code !== 0)) {
      console.error('[tiktok-capi] send failed:', res.status, json?.message || 'no body')
      return { ok: false, error: `code_${json?.code ?? res.status}` }
    }
    return { ok: true }
  } catch (error) {
    console.error('[tiktok-capi] network error:', (error as Error).message)
    return { ok: false, error: 'network' }
  }
}

/**
 * Meta Conversions API (CAPI) server-side.
 *
 * Pourquoi : depuis 2024, Meta Advantage+ dégrade les campagnes (surtout CTWA)
 * sans events server-to-server. Sans CAPI, l'attribution est ruinée — les pixels
 * client seuls perdent 40-60% des signaux à cause d'iOS 14.5+ / AdBlockers / ITP.
 *
 * Doc : https://developers.facebook.com/docs/marketing-api/conversions-api
 *
 * Configuration requise (env vars Vercel) :
 *   META_PIXEL_ID               — identifiant numérique du pixel Meta
 *   META_CAPI_ACCESS_TOKEN      — token permanent généré dans Events Manager
 *   META_TEST_EVENT_CODE        — optionnel, pour test events pendant dev
 *
 * Deduplication : chaque event doit avoir un `event_id` (UUID) partagé avec
 * le pixel client — Meta déduplique automatiquement les 2 sources.
 */

import crypto from 'crypto'

const META_GRAPH_VERSION = 'v21.0'

// ─── Types ────────────────────────────────────────────────────────────────────
export type CAPIEventName =
  | 'PageView'
  | 'ViewContent'
  | 'Lead'
  | 'InitiateCheckout'
  | 'AddPaymentInfo'
  | 'Purchase'
  | 'CompleteRegistration'
  | 'Contact'
  | 'Subscribe'
  | 'StartTrial'

export interface CAPIUserData {
  email?: string | null
  phone?: string | null // E.164 ou national, sera normalisé
  firstName?: string | null
  lastName?: string | null
  city?: string | null
  country?: string | null // code ISO 2 lettres
  zipCode?: string | null
  externalId?: string | null // identity_bridge.id par exemple
  fbc?: string | null // _fbc cookie (click ID)
  fbp?: string | null // _fbp cookie (browser ID)
  clientIpAddress?: string | null
  clientUserAgent?: string | null
}

export interface CAPICustomData {
  value?: number
  currency?: string
  contentName?: string
  contentIds?: string[]
  contentType?: string
  numItems?: number
  orderId?: string
}

interface CAPIEventPayload {
  event_name: CAPIEventName
  event_time: number
  event_id?: string
  event_source_url?: string
  action_source: 'website' | 'chat' | 'email' | 'app' | 'phone_call' | 'system_generated' | 'physical_store' | 'business_messaging' | 'other'
  user_data: Record<string, string | string[]>
  custom_data?: Record<string, unknown>
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function sha256(value: string): string {
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

function normalizePhone(raw: string): string {
  // E.164 sans '+' pour Meta (ex: 33780732216)
  const digits = raw.replace(/[^\d]/g, '')
  if (digits.startsWith('0') && digits.length === 10) return '33' + digits.slice(1)
  if (digits.startsWith('33')) return digits
  if (digits.startsWith('+')) return digits.slice(1)
  return digits
}

function buildUserData(user: CAPIUserData): Record<string, string | string[]> {
  const ud: Record<string, string | string[]> = {}

  if (user.email) ud.em = [sha256(user.email)]
  if (user.phone) ud.ph = [sha256(normalizePhone(user.phone))]
  if (user.firstName) ud.fn = [sha256(user.firstName)]
  if (user.lastName) ud.ln = [sha256(user.lastName)]
  if (user.city) ud.ct = [sha256(user.city.replace(/\s/g, ''))]
  if (user.country) ud.country = [sha256(user.country.toLowerCase())]
  if (user.zipCode) ud.zp = [sha256(user.zipCode)]
  if (user.externalId) ud.external_id = [sha256(user.externalId)]

  // Ces champs NE sont PAS hashés (cf. doc Meta)
  if (user.fbc) ud.fbc = user.fbc
  if (user.fbp) ud.fbp = user.fbp
  if (user.clientIpAddress) ud.client_ip_address = user.clientIpAddress
  if (user.clientUserAgent) ud.client_user_agent = user.clientUserAgent

  return ud
}

// ─── Main sender ──────────────────────────────────────────────────────────────
export interface SendCAPIOptions {
  eventName: CAPIEventName
  userData: CAPIUserData
  customData?: CAPICustomData
  eventSourceUrl?: string
  eventId?: string // pour dedup avec pixel client
  actionSource?: CAPIEventPayload['action_source']
}

export async function sendCAPIEvent(opts: SendCAPIOptions): Promise<{ ok: boolean; error?: string }> {
  const pixelId = process.env.META_PIXEL_ID
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN
  const testEventCode = process.env.META_TEST_EVENT_CODE

  if (!pixelId || !accessToken) {
    // Silencieux — permet de dev sans CAPI configuré
    return { ok: false, error: 'capi_not_configured' }
  }

  const custom: Record<string, unknown> = {}
  if (opts.customData) {
    if (opts.customData.value !== undefined) custom.value = opts.customData.value
    if (opts.customData.currency) custom.currency = opts.customData.currency
    if (opts.customData.contentName) custom.content_name = opts.customData.contentName
    if (opts.customData.contentIds) custom.content_ids = opts.customData.contentIds
    if (opts.customData.contentType) custom.content_type = opts.customData.contentType
    if (opts.customData.numItems !== undefined) custom.num_items = opts.customData.numItems
    if (opts.customData.orderId) custom.order_id = opts.customData.orderId
  }

  const eventPayload: CAPIEventPayload = {
    event_name: opts.eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_source_url: opts.eventSourceUrl,
    action_source: opts.actionSource || 'website',
    user_data: buildUserData(opts.userData),
  }
  if (opts.eventId) eventPayload.event_id = opts.eventId
  if (Object.keys(custom).length > 0) eventPayload.custom_data = custom

  const body: Record<string, unknown> = {
    data: [eventPayload],
    access_token: accessToken,
  }
  if (testEventCode) body.test_event_code = testEventCode

  try {
    const res = await fetch(
      `https://graph.facebook.com/${META_GRAPH_VERSION}/${pixelId}/events`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    )
    if (!res.ok) {
      const errText = await res.text().catch(() => 'no body')
      console.error('[meta-capi] send failed:', res.status, errText)
      return { ok: false, error: `http_${res.status}` }
    }
    return { ok: true }
  } catch (error) {
    console.error('[meta-capi] network error:', (error as Error).message)
    return { ok: false, error: 'network' }
  }
}

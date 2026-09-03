import crypto from 'crypto'

const TIKTOK_API_VERSION = 'v1.3'

export type TikTokEventName =
  | 'ViewContent' | 'InitiateCheckout' | 'AddPaymentInfo' | 'CompletePayment'
  | 'SubmitForm' | 'CompleteRegistration' | 'Contact' | 'Subscribe'

export interface TikTokUserData {
  email?: string | null
  phone?: string | null
  externalId?: string | null
  ttclid?: string | null
  ttp?: string | null
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
  const data: Record<string, string> = {}
  if (user.email) data.email = sha256(user.email)
  if (user.phone) data.phone = sha256(normalizePhone(user.phone))
  if (user.externalId) data.external_id = sha256(user.externalId)
  if (user.ttclid) data.ttclid = user.ttclid
  if (user.ttp) data.ttp = user.ttp
  if (user.clientIpAddress) data.ip = user.clientIpAddress
  if (user.clientUserAgent) data.user_agent = user.clientUserAgent
  return data
}

export interface SendTikTokEventOptions {
  /** Preuve explicite. Absent vaut non. */
  consentement?: boolean
  eventName: TikTokEventName
  userData: TikTokUserData
  customData?: TikTokCustomData
  eventSourceUrl?: string
  eventId?: string
}

export async function sendTikTokEvent(
  opts: SendTikTokEventOptions,
): Promise<{ ok: boolean; error?: string; skipped?: string }> {
  if (opts.consentement !== true) {
    return { ok: false, skipped: 'consentement_absent' }
  }
  const pixelId = process.env.TIKTOK_PIXEL_ID
  const accessToken = process.env.TIKTOK_CAPI_ACCESS_TOKEN
  if (!pixelId || !accessToken) return { ok: false, error: 'capi_not_configured' }

  const properties: Record<string, unknown> = {}
  if (opts.customData?.value !== undefined) properties.value = opts.customData.value
  if (opts.customData?.currency) properties.currency = opts.customData.currency
  if (opts.customData?.contentName) properties.description = opts.customData.contentName
  if (opts.customData?.contentIds) properties.content_id = opts.customData.contentIds[0]
  if (opts.customData?.contentType) properties.content_type = opts.customData.contentType
  if (opts.customData?.orderId) properties.order_id = opts.customData.orderId

  const event: Record<string, unknown> = {
    event: opts.eventName,
    event_time: Math.floor(Date.now() / 1000),
    user: buildUserData(opts.userData),
  }
  if (opts.eventId) event.event_id = opts.eventId
  if (Object.keys(properties).length) event.properties = properties
  if (opts.eventSourceUrl) event.page = { url: opts.eventSourceUrl }

  try {
    const response = await fetch(
      `https://business-api.tiktok.com/open_api/${TIKTOK_API_VERSION}/event/track/`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Access-Token': accessToken },
        body: JSON.stringify({ event_source: 'web', event_source_id: pixelId, data: [event] }),
      },
    )
    const json = await response.json().catch(() => null)
    if (!response.ok || (json && json.code !== 0)) {
      return { ok: false, error: `code_${json?.code ?? response.status}` }
    }
    return { ok: true }
  } catch {
    return { ok: false, error: 'network' }
  }
}


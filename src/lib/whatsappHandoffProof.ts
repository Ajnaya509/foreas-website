import crypto from 'crypto'

export const WHATSAPP_HANDOFF_COOKIE = 'foreas_wa_handoff'
// Le code Twilio vivant expire au bout de 10 minutes. La preuve Site ne doit
// jamais prétendre vivre plus longtemps que son fournisseur de preuve.
export const WHATSAPP_HANDOFF_TTL_SECONDS = 10 * 60

export interface WhatsAppHandoffCookiePayload {
  version: 1
  handoffToken: string
  otpSessionToken: string
  phoneE164: string
  phoneHmac: string
  identityIdAtIssue: string
  nextPath: string
  expiresAtMs: number
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const PHONE_RE = /^\+\d{8,15}$/
const HMAC_RE = /^[a-f0-9]{64}$/i

function isSafeNextPath(value: string): boolean {
  return value.startsWith('/wa?') && !value.startsWith('//') && !/[\r\n\\]/.test(value)
}

function isPayload(value: unknown): value is WhatsAppHandoffCookiePayload {
  if (!value || typeof value !== 'object') return false
  const p = value as Partial<WhatsAppHandoffCookiePayload>
  return p.version === 1 &&
    typeof p.handoffToken === 'string' && UUID_RE.test(p.handoffToken) &&
    typeof p.otpSessionToken === 'string' && UUID_RE.test(p.otpSessionToken) &&
    typeof p.phoneE164 === 'string' && PHONE_RE.test(p.phoneE164) &&
    typeof p.phoneHmac === 'string' && HMAC_RE.test(p.phoneHmac) &&
    typeof p.identityIdAtIssue === 'string' && UUID_RE.test(p.identityIdAtIssue) &&
    typeof p.nextPath === 'string' && isSafeNextPath(p.nextPath) &&
    typeof p.expiresAtMs === 'number' && Number.isSafeInteger(p.expiresAtMs)
}

export function phoneHmac(phoneE164: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(phoneE164).digest('hex')
}

export function signWhatsAppHandoffCookie(
  payload: WhatsAppHandoffCookiePayload,
  secret: string,
): string {
  if (!secret || !isPayload(payload)) throw new Error('handoff_cookie_not_signable')
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
  const signature = crypto.createHmac('sha256', secret).update(encoded).digest('base64url')
  return `${encoded}.${signature}`
}

export function readWhatsAppHandoffCookie(
  raw: string | null | undefined,
  secret: string,
  nowMs = Date.now(),
): WhatsAppHandoffCookiePayload | null {
  if (!raw || !secret) return null
  const [encoded, suppliedSignature, extra] = raw.split('.')
  if (!encoded || !suppliedSignature || extra !== undefined) return null

  const expectedSignature = crypto.createHmac('sha256', secret).update(encoded).digest('base64url')
  const supplied = Buffer.from(suppliedSignature)
  const expected = Buffer.from(expectedSignature)
  if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) return null

  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as unknown
    if (!isPayload(parsed)) return null
    if (parsed.expiresAtMs <= nowMs) return null
    return parsed
  } catch {
    return null
  }
}

export function whatsappHandoffSecrets(): { cookieSecret: string; phoneSecret: string } | null {
  const phoneSecret = (process.env.PASSAGE_HMAC_SECRET || process.env.OBSERVE_HMAC_SALT || '').trim()
  // Deux usages, deux clés. Réutiliser la clé d'empreinte téléphone pour signer
  // le cookie agrandit inutilement les dégâts si l'une des deux clés fuit.
  const cookieSecret = (process.env.WHATSAPP_HANDOFF_COOKIE_SECRET || '').trim()
  return phoneSecret && cookieSecret ? { phoneSecret, cookieSecret } : null
}

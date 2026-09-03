import {
  phoneHmac,
  readWhatsAppHandoffCookie,
  type WhatsAppHandoffCookiePayload,
} from './whatsappHandoffProof'

export type FinalizeWhatsAppHandoffResult =
  | { ok: true; nextPath: string; identityId: string }
  | { ok: false; reason: 'invalid_cookie' | 'invalid_code' | 'verification_unavailable' | 'binding_unavailable' | 'identity_conflict' | 'expired_or_used' }

export interface FinalizeWhatsAppHandoffDependencies {
  cookieSecret: string
  phoneSecret: string
  nowMs?: number
  verifyOtp: (sessionToken: string, code: string) => Promise<'approved' | 'rejected' | 'unavailable'>
  resolveVerifiedIdentity: (
    phoneE164: string,
    identityIdAtIssue: string,
  ) => Promise<string | null>
  bindOnce: (input: {
    token: string
    phoneHmac: string
    identityId: string
    verifiedAtIso: string
  }) => Promise<'bound' | 'not_bindable' | 'unavailable'>
}

function sameHex(a: string, b: string): boolean {
  return a.length === b.length && a.toLowerCase() === b.toLowerCase()
}

export async function finalizeWhatsAppHandoff(
  rawCookie: string | null | undefined,
  code: string,
  deps: FinalizeWhatsAppHandoffDependencies,
): Promise<FinalizeWhatsAppHandoffResult> {
  const nowMs = deps.nowMs ?? Date.now()
  const payload: WhatsAppHandoffCookiePayload | null = readWhatsAppHandoffCookie(
    rawCookie,
    deps.cookieSecret,
    nowMs,
  )
  if (!payload) return { ok: false, reason: 'invalid_cookie' }

  const expectedHmac = phoneHmac(payload.phoneE164, deps.phoneSecret)
  if (!sameHex(expectedHmac, payload.phoneHmac)) return { ok: false, reason: 'invalid_cookie' }
  if (!/^\d{4,10}$/.test(code)) return { ok: false, reason: 'invalid_code' }

  const otp = await deps.verifyOtp(payload.otpSessionToken, code)
  if (otp === 'unavailable') return { ok: false, reason: 'verification_unavailable' }
  if (otp !== 'approved') return { ok: false, reason: 'invalid_code' }

  // La clé forte téléphone n'entre dans l'identité qu'APRÈS la preuve Twilio.
  // Avant cette ligne, taper le numéro d'une victime ne donne aucun pouvoir.
  const identityId = await deps.resolveVerifiedIdentity(
    payload.phoneE164,
    payload.identityIdAtIssue,
  )
  if (!identityId) return { ok: false, reason: 'identity_conflict' }

  const binding = await deps.bindOnce({
    token: payload.handoffToken,
    phoneHmac: payload.phoneHmac,
    identityId,
    verifiedAtIso: new Date(nowMs).toISOString(),
  })
  if (binding === 'unavailable') return { ok: false, reason: 'binding_unavailable' }
  if (binding !== 'bound') return { ok: false, reason: 'expired_or_used' }

  return { ok: true, nextPath: payload.nextPath, identityId }
}

import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import test from 'node:test'
import {
  phoneHmac,
  signWhatsAppHandoffCookie,
  type WhatsAppHandoffCookiePayload,
} from '../src/lib/whatsappHandoffProof'
import { finalizeWhatsAppHandoff } from '../src/lib/whatsappHandoffService'

const now = Date.parse('2026-08-31T16:00:00.000Z')
const cookieSecret = 'cookie-secret-for-targeted-test'
const phoneSecret = 'phone-secret-for-targeted-test'
const phone = '+33612345678'
const identityAtIssue = randomUUID()
const identityAfterProof = randomUUID()

function payload(overrides: Partial<WhatsAppHandoffCookiePayload> = {}): WhatsAppHandoffCookiePayload {
  return {
    version: 1,
    handoffToken: randomUUID(),
    otpSessionToken: randomUUID(),
    phoneE164: phone,
    phoneHmac: phoneHmac(phone, phoneSecret),
    identityIdAtIssue: identityAtIssue,
    nextPath: '/wa?s=final&p=%2F&i=ajnaya&o=reprise_verifiee',
    expiresAtMs: now + 10 * 60_000,
    ...overrides,
  }
}

test('1 — code Twilio valide : le passage devient BOUND une seule fois', async () => {
  const p = payload()
  const raw = signWhatsAppHandoffCookie(p, cookieSecret)
  let bindCalls = 0
  const result = await finalizeWhatsAppHandoff(raw, '123456', {
    cookieSecret,
    phoneSecret,
    nowMs: now,
    verifyOtp: async () => 'approved',
    resolveVerifiedIdentity: async (receivedPhone, receivedIdentity) => {
      assert.equal(receivedPhone, phone)
      assert.equal(receivedIdentity, identityAtIssue)
      return identityAfterProof
    },
    bindOnce: async (input) => {
      bindCalls += 1
      assert.equal(input.token, p.handoffToken)
      assert.equal(input.phoneHmac, p.phoneHmac)
      assert.equal(input.identityId, identityAfterProof)
      return 'bound'
    },
  })
  assert.deepEqual(result, { ok: true, nextPath: p.nextPath, identityId: identityAfterProof })
  assert.equal(bindCalls, 1)
})

test('2 — numéro de victime sans cookie signé : aucune identité ni mémoire ne sort', async () => {
  const p = payload()
  const valid = signWhatsAppHandoffCookie(p, cookieSecret)
  const [encoded, signature] = valid.split('.')
  const changed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'))
  changed.phoneE164 = '+33699999999'
  const tampered = `${Buffer.from(JSON.stringify(changed)).toString('base64url')}.${signature}`
  let downstreamCalls = 0
  const result = await finalizeWhatsAppHandoff(tampered, '123456', {
    cookieSecret,
    phoneSecret,
    nowMs: now,
    verifyOtp: async () => { downstreamCalls += 1; return 'approved' },
    resolveVerifiedIdentity: async () => { downstreamCalls += 1; return identityAfterProof },
    bindOnce: async () => { downstreamCalls += 1; return 'bound' },
  })
  assert.deepEqual(result, { ok: false, reason: 'invalid_cookie' })
  assert.equal(downstreamCalls, 0)
})

test('3 — expiration, mauvaise empreinte, panne et rejeu restent sûrs', async () => {
  const expired = payload({ expiresAtMs: now - 1 })
  const expiredResult = await finalizeWhatsAppHandoff(
    signWhatsAppHandoffCookie(expired, cookieSecret),
    '123456',
    {
      cookieSecret, phoneSecret, nowMs: now,
      verifyOtp: async () => 'approved',
      resolveVerifiedIdentity: async () => identityAfterProof,
      bindOnce: async () => 'bound',
    },
  )
  assert.deepEqual(expiredResult, { ok: false, reason: 'invalid_cookie' })

  const wrongHmac = payload({ phoneHmac: 'a'.repeat(64) })
  const wrongHmacResult = await finalizeWhatsAppHandoff(
    signWhatsAppHandoffCookie(wrongHmac, cookieSecret),
    '123456',
    {
      cookieSecret, phoneSecret, nowMs: now,
      verifyOtp: async () => 'approved',
      resolveVerifiedIdentity: async () => identityAfterProof,
      bindOnce: async () => 'bound',
    },
  )
  assert.deepEqual(wrongHmacResult, { ok: false, reason: 'invalid_cookie' })

  const replay = payload()
  const replayResult = await finalizeWhatsAppHandoff(
    signWhatsAppHandoffCookie(replay, cookieSecret),
    '123456',
    {
      cookieSecret, phoneSecret, nowMs: now,
      verifyOtp: async () => 'approved',
      resolveVerifiedIdentity: async () => identityAfterProof,
      bindOnce: async () => 'not_bindable',
    },
  )
  assert.deepEqual(replayResult, { ok: false, reason: 'expired_or_used' })

  const transient = payload()
  const transientResult = await finalizeWhatsAppHandoff(
    signWhatsAppHandoffCookie(transient, cookieSecret),
    '123456',
    {
      cookieSecret, phoneSecret, nowMs: now,
      verifyOtp: async () => 'approved',
      resolveVerifiedIdentity: async () => identityAfterProof,
      bindOnce: async () => 'unavailable',
    },
  )
  assert.deepEqual(transientResult, { ok: false, reason: 'binding_unavailable' })
})

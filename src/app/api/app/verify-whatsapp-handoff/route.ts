import { NextRequest, NextResponse } from 'next/server'
import { clientServeurOuNull } from '@/lib/supabaseServeur'
import { resolveIdentity } from '@/lib/identityGate'
import {
  WHATSAPP_HANDOFF_COOKIE,
  whatsappHandoffSecrets,
} from '@/lib/whatsappHandoffProof'
import { finalizeWhatsAppHandoff } from '@/lib/whatsappHandoffService'

export const runtime = 'nodejs'

const BACKEND_URL = (
  process.env.FOREAS_BACKEND_URL ||
  process.env.BACKEND_URL ||
  'https://foreas-stripe-backend-production.up.railway.app'
).replace(/\/+$/, '')

function responseForFailure(reason: string): NextResponse {
  if (reason === 'verification_unavailable' || reason === 'binding_unavailable') {
    return NextResponse.json(
      { ok: false, error: 'verification_indisponible', message: 'La vérification ne répond pas. Réessaie dans un instant.' },
      { status: 503 },
    )
  }
  if (reason === 'invalid_code') {
    return NextResponse.json(
      { ok: false, error: 'code_incorrect', message: 'Ce code ne fonctionne pas. Vérifie le SMS.' },
      { status: 400 },
    )
  }
  if (reason === 'identity_conflict') {
    return NextResponse.json(
      { ok: false, error: 'identite_ambigue', message: 'On ne peut pas relier cette visite sans risque. Ouvre une nouvelle discussion WhatsApp.' },
      { status: 409 },
    )
  }
  return NextResponse.json(
    { ok: false, error: 'preuve_expiree', message: 'Cette vérification a expiré. Recommence depuis Ajnaya.' },
    { status: 410 },
  )
}

export async function POST(request: NextRequest) {
  const secrets = whatsappHandoffSecrets()
  const sb = clientServeurOuNull()
  if (!secrets || !sb) {
    return NextResponse.json(
      { ok: false, error: 'configuration_absente', message: 'La vérification est indisponible.' },
      { status: 503 },
    )
  }

  let code = ''
  try {
    const body = await request.json()
    code = typeof body?.code === 'string' ? body.code.trim() : ''
  } catch {
    return NextResponse.json({ ok: false, error: 'requete_invalide' }, { status: 400 })
  }

  const rawCookie = request.cookies.get(WHATSAPP_HANDOFF_COOKIE)?.value
  const badge = request.cookies.get('foreas_vid')?.value ?? null

  const result = await finalizeWhatsAppHandoff(rawCookie, code, {
    cookieSecret: secrets.cookieSecret,
    phoneSecret: secrets.phoneSecret,
    verifyOtp: async (sessionToken, otpCode) => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/auth/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionToken, code: otpCode }),
          cache: 'no-store',
          signal: AbortSignal.timeout(10_000),
        })
        if (response.status >= 500) return 'unavailable'
        const payload = await response.json().catch(() => null) as { success?: boolean; verified?: boolean } | null
        return response.ok && payload?.success === true && payload?.verified === true
          ? 'approved'
          : 'rejected'
      } catch {
        return 'unavailable'
      }
    },
    resolveVerifiedIdentity: async (phoneE164, identityIdAtIssue) => {
      const resolution = await resolveIdentity(sb, {
        phone_raw: phoneE164,
        device_cookie_id: badge,
        canal: 'whatsapp',
      })
      if (resolution.status !== 'resolved') return null
      // Le résolveur peut fusionner l'identité anonyme du Site dans l'ancre
      // téléphone. C'est une fusion prouvée, pas la confiance dans un UUID client.
      if (resolution.identity.identity_id !== identityIdAtIssue) {
        console.info('[whatsapp-handoff] identité Site fusionnée après preuve téléphone')
      }
      return resolution.identity.identity_id
    },
    bindOnce: async ({ token, phoneHmac, identityId, verifiedAtIso }) => {
      const { data, error } = await sb.rpc('bind_verified_whatsapp_handoff', {
        p_token: token,
        p_phone_hmac: phoneHmac,
        p_identity_id: identityId,
        p_verified_at: verifiedAtIso,
      })
      if (error) {
        console.error('[whatsapp-handoff] liaison refusée:', error.message)
        return 'unavailable'
      }
      return Boolean((data as { ok?: boolean } | null)?.ok) ? 'bound' : 'not_bindable'
    },
  })

  if (!result.ok) {
    const response = responseForFailure(result.reason)
    if (
      result.reason !== 'invalid_code' &&
      result.reason !== 'verification_unavailable' &&
      result.reason !== 'binding_unavailable'
    ) {
      response.cookies.set(WHATSAPP_HANDOFF_COOKIE, '', { path: '/', maxAge: 0 })
    }
    return response
  }

  const response = NextResponse.json({ ok: true, next: result.nextPath })
  response.cookies.set(WHATSAPP_HANDOFF_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  })
  return response
}

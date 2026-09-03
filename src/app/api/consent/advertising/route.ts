import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { isSameOriginRequest, forbiddenOrigin } from '@/lib/api-guard'
import { resolveSiteIdentity } from '@/lib/identityGate'
import { clientServeurOuNull } from '@/lib/supabaseServeur'
import {
  ADVERTISING_CONSENT_VERSION,
  isValidConsentIntent,
  type AdvertisingConsentDecision,
} from '@/lib/advertisingConsentContract'
import {
  readCurrentAdvertisingConsent,
  recordAdvertisingConsent,
} from '@/lib/advertisingConsentServer'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const noStore = { 'Cache-Control': 'no-store' }

async function context(request: NextRequest) {
  const identityId = await resolveSiteIdentity(request, { canal: 'site' })
  const sb = clientServeurOuNull()
  return { identityId, sb }
}

export async function GET(request: NextRequest) {
  if (!isSameOriginRequest(request)) return forbiddenOrigin()
  const { identityId, sb } = await context(request)
  if (!identityId) {
    return NextResponse.json({ ok: false, reason: 'identity_unresolved' }, { status: 409, headers: noStore })
  }
  if (!sb) {
    return NextResponse.json({ ok: false, reason: 'consent_unavailable' }, { status: 503, headers: noStore })
  }
  const current = await readCurrentAdvertisingConsent(sb, identityId)
  if (!current.ok) {
    return NextResponse.json({ ok: false, reason: current.reason }, { status: 503, headers: noStore })
  }
  return NextResponse.json(current, { status: 200, headers: noStore })
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return forbiddenOrigin()

  const body = await request.json().catch(() => null)
  if (!isValidConsentIntent(body)) {
    return NextResponse.json({ ok: false, reason: 'decision_invalid' }, { status: 400, headers: noStore })
  }

  // Aucun identity_id du navigateur n'est lu. Le badge httpOnly est résolu par
  // la porte d'identité commune au Site, à l'App et à la Pieuvre.
  const { identityId, sb } = await context(request)
  if (!identityId) {
    return NextResponse.json({ ok: false, reason: 'identity_unresolved' }, { status: 409, headers: noStore })
  }

  if (!sb) {
    return NextResponse.json({ ok: false, reason: 'consent_unavailable' }, { status: 503, headers: noStore })
  }

  // L'heure et la preuve qui font foi sont créées ici. Le navigateur apporte
  // le geste, jamais l'autorité temporelle : un futur « oui » fabriqué ne peut
  // donc pas bloquer un retrait reçu ensuite.
  const serverDecision: AdvertisingConsentDecision = {
    granted: body.granted,
    source: body.source,
    version: ADVERTISING_CONSENT_VERSION,
    decided_at: new Date().toISOString(),
    proof_id: crypto.randomUUID(),
  }
  const result = await recordAdvertisingConsent(
    sb,
    identityId,
    serverDecision,
    body.expected_revision,
    body.expected_proof_id,
  )
  if (!result.ok) {
    const conflict = result.reason === 'revision_conflict'
    return NextResponse.json(
      {
        ok: false,
        reason: result.reason,
        granted: result.granted,
        revision: result.revision,
        decided_at: result.decided_at,
        proof_id: result.proof_id,
        version: result.version,
        exists: result.exists,
      },
      { status: conflict ? 409 : 503, headers: noStore },
    )
  }

  // Ne jamais renvoyer l'identité, le badge, ni une donnée personnelle.
  return NextResponse.json(
    {
      ok: true,
      granted: result.granted,
      revision: result.revision,
      decided_at: result.decided_at,
      proof_id: result.proof_id,
      version: result.version,
    },
    { status: 200, headers: noStore },
  )
}

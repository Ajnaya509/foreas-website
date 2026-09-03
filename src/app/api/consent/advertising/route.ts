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
import { readAcquisitionFromRequest, persistAcquisition } from '@/lib/acquisitionServer'

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

  // ── 03/09 — L'ORIGINE S'ÉCRIT ICI, SUR LA FICHE QUI PORTE L'ACCORD ────────
  //
  // ⚠️ LE DÉFAUT QU'ON FERME, MESURÉ SUR UNE VISITE RÉELLE.
  // Le Site fabriquait DEUX fiches pour une seule visite :
  //   20:29:35  fiche A, badge httpOnly `foreas_vid` (UUID)  -> reçoit l'ACCORD (ici)
  //   20:29:51  fiche B, empreinte JavaScript de la page     -> recevait l'ORIGINE
  // Comptes du 03/09 : 3 identités portent un accord, 324 portent une origine,
  // ZÉRO ne porte les deux. Conséquence : la route qui parle à Meta demande
  // « cette personne a-t-elle accepté ? » à la fiche B, qui n'a jamais d'accord.
  // Rien ne pouvait donc jamais partir, même après un vrai « oui ».
  //
  // ⚠️ POURQUOI PAS DE L'AUTRE CÔTÉ. Le correctif évident — ajouter le badge
  // serveur aux identifiants de /api/observe — a été mesuré et REFUSÉ :
  // `resolve_identity_v2` ne retient que le PREMIER `visitor_id` du tableau
  // (`LIMIT 1`, sans tri). Le badge serait arrivé en second, donc jamais lu, et
  // aurait laissé une trace « rattaché » trompeuse dans identity_identifiers.
  //
  // Ici, `identityId` EST déjà la fiche qui porte l'accord. L'origine y atterrit
  // par construction, sans dépendre d'un ordre ni du relais Railway. C'est le
  // motif déjà éprouvé dans `api/ajnaya/home-modal/route.ts` (l. 506-525).
  //
  // ⚠️ SEULEMENT SUR UN OUI. Écrire l'origine de quelqu'un qui vient de REFUSER
  // serait exactement ce que son refus interdit.
  if (result.granted === true) {
    try {
      await persistAcquisition(sb, identityId, 'consent', readAcquisitionFromRequest(request))
    } catch (error) {
      // Une origine non écrite ne doit JAMAIS faire échouer un consentement :
      // le geste de la personne prime sur notre mesure.
      console.warn('[consent] origine non rattachée :', (error as Error).message)
    }
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

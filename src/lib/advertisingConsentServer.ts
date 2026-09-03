import crypto from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  ADVERTISING_CONSENT_VERSION,
  type AdvertisingConsentDecision,
  readAdvertisingConsentCookies,
  isUuid,
} from './advertisingConsentContract'

type ConsentRpcResult = {
  ok?: boolean
  granted?: boolean
  decided_at?: string
  proof_id?: string | null
  revision?: number
  version?: string
  reason?: string
  exists?: boolean
}

type ConsentStateRow = {
  granted?: boolean
  consent_version?: string
  client_decided_at?: string
  proof_id?: string | null
  revision?: number
}

export type ConsentWriteResult = {
  ok: boolean
  granted?: boolean
  revision?: number
  decided_at?: string
  proof_id?: string
  version?: string
  reason?: string
  exists?: boolean
}

export type ConsentReadResult = ConsentWriteResult & { exists: boolean }

function rpcResult(data: unknown, fallback: string): ConsentWriteResult {
  const result = (data ?? {}) as ConsentRpcResult
  const revisionValid = Number.isSafeInteger(result.revision) && Number(result.revision) >= 0
  const canonicalComplete = typeof result.granted === 'boolean' && revisionValid &&
    (result.revision === 0 || Boolean(result.decided_at && result.proof_id && isUuid(result.proof_id)))

  if (result.ok !== true) {
    return {
      ok: false,
      reason: result.reason || fallback,
      ...(canonicalComplete ? {
        granted: result.granted,
        revision: result.revision,
        decided_at: result.decided_at,
        proof_id: result.proof_id || undefined,
        version: result.version,
        exists: result.exists,
      } : {}),
    }
  }
  if (!canonicalComplete || result.revision === 0) {
    return { ok: false, reason: 'canonical_consent_unproven' }
  }
  return {
    ok: true,
    granted: result.granted,
    revision: result.revision,
    decided_at: result.decided_at,
    proof_id: result.proof_id!,
    version: result.version,
    reason: result.reason,
    exists: true,
  }
}

/** Ecriture compare-et-echange. Un oui ne passe que sur la revision lue avant le geste. */
export async function recordAdvertisingConsent(
  sb: SupabaseClient,
  identityId: string,
  decision: AdvertisingConsentDecision,
  expectedRevision: number,
  expectedProofId: string | null,
): Promise<ConsentWriteResult> {
  if (!isUuid(identityId) || !Number.isSafeInteger(expectedRevision) || expectedRevision < 0) {
    return { ok: false, reason: 'consent_precondition_invalid' }
  }
  const { data, error } = await sb.rpc('enregistrer_accord_mesure_p29', {
    p_identity: identityId,
    p_granted: decision.granted,
    p_version: decision.version,
    p_source: decision.source,
    p_proof_id: decision.proof_id,
    p_expected_revision: expectedRevision,
    p_expected_proof_id: expectedProofId,
  })
  if (error) return { ok: false, reason: 'consent_write_failed' }
  return rpcResult(data, 'consent_write_rejected')
}

export async function readCurrentAdvertisingConsent(
  sb: SupabaseClient,
  identityId: string | null,
): Promise<ConsentReadResult> {
  if (!identityId || !isUuid(identityId)) {
    return { ok: false, exists: false, reason: 'identity_unresolved' }
  }
  const { data, error } = await sb
    .from('advertising_consent_state')
    .select('granted,consent_version,client_decided_at,proof_id,revision')
    .eq('identity_id', identityId)
    .maybeSingle()
  if (error) return { ok: false, exists: false, reason: 'current_consent_read_failed' }
  const row = (data ?? null) as ConsentStateRow | null
  if (!row) return { ok: true, exists: false, granted: false, revision: 0 }
  if (typeof row.granted !== 'boolean' || !Number.isSafeInteger(row.revision) ||
      !row.client_decided_at || !row.proof_id || !isUuid(row.proof_id)) {
    return { ok: false, exists: true, reason: 'canonical_consent_unproven' }
  }
  return {
    ok: true,
    exists: true,
    granted: row.granted,
    revision: row.revision,
    decided_at: row.client_decided_at,
    proof_id: row.proof_id,
    version: row.consent_version,
  }
}

export async function hasCurrentAdvertisingConsent(
  sb: SupabaseClient,
  identityId: string | null,
): Promise<boolean> {
  const current = await readCurrentAdvertisingConsent(sb, identityId)
  return current.ok && current.exists && current.granted === true &&
    current.version === ADVERTISING_CONSENT_VERSION
}

/**
 * Le paiement ne fait aucune lecture puis copie. La base verrouille la cible,
 * prouve le lien d'identite et deplace la preuve dans une seule transaction.
 * Si la preuve est deja sur l'identite courante, l'operation est un simple no-op.
 */
export async function syncAdvertisingConsentAtCheckout(
  sb: SupabaseClient,
  identityId: string | null,
  cookieHeader: string | null,
): Promise<ConsentWriteResult> {
  if (!identityId || !isUuid(identityId)) return { ok: false, reason: 'identity_unresolved' }
  const snapshot = readAdvertisingConsentCookies(cookieHeader)
  if (!snapshot) return { ok: false, reason: 'choice_missing' }

  if (snapshot.granted &&
      (snapshot.version !== ADVERTISING_CONSENT_VERSION || !isUuid(snapshot.proof_id) ||
       !Number.isSafeInteger(snapshot.revision) || Number(snapshot.revision) < 1)) {
    return { ok: false, reason: 'positive_proof_incomplete' }
  }
  const { data, error } = await sb.rpc('transferer_accord_mesure_p43', {
    p_target_identity: identityId,
    p_local_granted: snapshot.granted,
    p_source_proof_id: snapshot.granted ? snapshot.proof_id : null,
    p_new_proof_id: crypto.randomUUID(),
    p_version: ADVERTISING_CONSENT_VERSION,
    p_expected_revision: snapshot.revision ?? 0,
  })
  if (error) return { ok: false, reason: 'consent_transfer_failed' }
  return rpcResult(data, 'consent_transfer_rejected')
}

import crypto from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * identityGate — LA PORTE UNIQUE d'identité du site.
 *
 * Règle non-négociable (AJNAYA_NORTH_STAR §4) : le site ne crée JAMAIS une ligne
 * `identity_bridge` lui-même. Il appelle le résolveur canonique `resolve_identity`
 * (SECURITY DEFINER, en base), le même que WhatsApp, la Pieuvre et l'app.
 *
 * Ce que `resolve_identity` fait et qu'un INSERT direct ne fait PAS :
 *   - `pg_advisory_xact_lock` sur la clé forte → deux soumissions simultanées de la
 *     même personne ne fabriquent plus deux identités,
 *   - matching sur `metadata->'phone_hashes'` et `metadata->'visitor_ids'`, pas
 *     seulement sur la colonne `phone_hash`,
 *   - fusion des doublons + `repoint_identity_fks` + trace dans `identity_merges`,
 *   - garde-fou `merge_conflict` (deux personnes fortes distinctes → refus + log
 *     `pieuvre_watchdog_logs`) au lieu d'un écrasement silencieux.
 *
 * ⚠️ Hash : sha256 de la forme normalisée. STRICTEMENT identique à l'Edge Function
 * `hash-identity` (sha256Hex(normalizePhone(x)) / sha256Hex(normalizeEmail(x))),
 * donc les hashs site / app / Pieuvre se rejoignent. On le calcule en local :
 * déterministe, sans appel réseau, donc sans branche de repli qui pourrait produire
 * un hash différent (= identité orpheline) le jour où l'Edge Function tombe.
 */

export type IdentityCanal =
  | 'site'
  | 'widget'
  | 'home_modal'
  | 'whatsapp'
  | 'app'
  | 'email'
  | 'referral'
  | 'ads'

export interface ResolveIdentityInput {
  /** Téléphone brut saisi par la personne (normalisé + hashé ici, jamais stocké en clair). */
  phone_raw?: string | null
  /** Email brut (idem). */
  email_raw?: string | null
  /** Empreinte visiteur côté client (`getVisitorId`) — la clé anonyme du site. */
  visitor_id?: string | null
  /** Badge appareil durable posé par le middleware (cookie 1ère partie `foreas_vid`). */
  device_cookie_id?: string | null
  driver_id?: string | null
  canal: IdentityCanal
}

export interface ResolvedIdentity {
  identity_id: string
  is_known: boolean
  merged: boolean
  conflict?: boolean
  user_type?: string
}

export function normalizePhoneE164(raw: string): string | null {
  const cleaned = raw.replace(/[\s.\-()]/g, '')
  if (/^0\d{9}$/.test(cleaned)) return '+33' + cleaned.slice(1)
  if (/^\+\d{8,15}$/.test(cleaned)) return cleaned
  return null
}

export function normalizeEmail(raw: string): string | null {
  const lower = raw.trim().toLowerCase()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lower) ? lower : null
}

export function sha256Hex(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex')
}

/** Hash téléphone canonique (null si le numéro n'est pas normalisable). */
export function phoneHashOf(raw: string | null | undefined): string | null {
  if (!raw) return null
  const e164 = normalizePhoneE164(raw)
  return e164 ? sha256Hex(e164) : null
}

/** Hash email canonique (null si l'email n'est pas valide). */
export function emailHashOf(raw: string | null | undefined): string | null {
  if (!raw) return null
  const email = normalizeEmail(raw)
  return email ? sha256Hex(email) : null
}

interface RpcShape {
  identity_id?: string
  is_known?: boolean
  merged?: boolean
  conflict?: boolean
  user_type?: string
}

async function callResolve(
  sb: SupabaseClient,
  args: {
    p_phone_hash: string | null
    p_email_hash: string | null
    p_visitor_id: string | null
    p_driver_id: string | null
    p_canal: string
  }
): Promise<ResolvedIdentity | null> {
  const { data, error } = await sb.rpc('resolve_identity', args)
  if (error) {
    // Bruyant volontairement : une porte d'identité qui échoue en silence est
    // exactement la panne qu'on est en train de corriger.
    console.warn('[identityGate] resolve_identity error:', error.code, error.message)
    return null
  }
  const row = data as RpcShape | null
  if (!row?.identity_id) return null
  return {
    identity_id: row.identity_id,
    is_known: Boolean(row.is_known),
    merged: Boolean(row.merged),
    conflict: row.conflict === true ? true : undefined,
    user_type: row.user_type,
  }
}

/**
 * Résout (ou crée) l'identité par la voie canonique.
 *
 * Retourne `null` quand aucune clé exploitable n'est fournie : on ne fabrique
 * JAMAIS une identité orpheline non re-matchable.
 */
export async function resolveIdentity(
  sb: SupabaseClient,
  input: ResolveIdentityInput
): Promise<ResolvedIdentity | null> {
  const p_phone_hash = phoneHashOf(input.phone_raw)
  const p_email_hash = emailHashOf(input.email_raw)
  const p_driver_id = input.driver_id ?? null
  const visitorId = input.visitor_id ?? null
  const cookieId = input.device_cookie_id ?? null

  const hasStrong = Boolean(p_phone_hash || p_email_hash || p_driver_id)
  if (!hasStrong && !visitorId && !cookieId) return null

  // Appel 1 : clé forte + empreinte client (la clé anonyme que /api/observe pose déjà).
  const first = await callResolve(sb, {
    p_phone_hash,
    p_email_hash,
    p_visitor_id: visitorId ?? cookieId,
    p_driver_id,
    p_canal: input.canal,
  })
  if (!first) return null

  // Appel 2 — UNIQUEMENT au moment où une clé forte existe : replie le badge
  // appareil durable (cookie serveur) sur la même personne. Sans ça, l'ancre
  // cookie et l'empreinte client restent deux identités qui ne se rejoignent
  // jamais. Sérialisé par l'advisory lock sur la même clé forte → idempotent.
  if (hasStrong && cookieId && visitorId && cookieId !== visitorId) {
    const second = await callResolve(sb, {
      p_phone_hash,
      p_email_hash,
      p_visitor_id: cookieId,
      p_driver_id,
      p_canal: input.canal,
    })
    if (second) return second
  }

  return first
}

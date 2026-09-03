import crypto from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { clientServeurOuNull } from './supabaseServeur'

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
 *
 * ═══ CORRECTIF 2026-08-13 — DEUX PERSONNES SUR UN APPAREIL PARTAGÉ ═══════════
 *
 * `visitor_id` (empreinte + cookie `foreas_vid`) désigne un APPAREIL, pas un humain.
 * `resolve_identity` cherche en OU : `phone_hash = X OR metadata->'visitor_ids' ? appareil`.
 * Passer les deux dans le MÊME appel, quand le téléphone est INCONNU en base,
 * ramène l'identité du PRÉCÉDENT occupant de l'appareil — et son garde-fou
 * `merge_conflict` ne se déclenche pas (il exige DEUX identités fortes DÉJÀ en base,
 * il ne voit pas le second humain qui arrive). Prouvé en prod le 13/08/2026 :
 *   resolve_identity(hash_A, tablette) -> identité A
 *   resolve_identity(hash_B, tablette) -> identité A  (merged:false, conflict absent)
 *   ...et hash_B est collé dans metadata.phone_hashes de A, DÉFINITIVEMENT.
 *
 * Deux règles, non négociables, appliquées ci-dessous :
 *
 *  1. ORDRE. Quand une clé forte existe, on résout d'abord AVEC LA CLÉ FORTE SEULE.
 *     L'ancre de cette personne existe alors en base ; l'appel suivant, qui ajoute
 *     la clé appareil, voit DEUX identités fortes → le garde-fou se déclenche
 *     enfin. Prouvé en prod : A et B restent deux identités distinctes.
 *
 *  2. `conflict:true` N'EST PAS UNE IDENTITÉ. La branche conflit de la base renvoie
 *     `v_survivor` = la PLUS ANCIENNE des identités ambiguës — soit l'AUTRE personne.
 *     Prouvé en prod : l'appel appareil de B renvoie conflict:true + identity_id = A.
 *     Aucun appelant ne doit pouvoir s'en servir par distraction : le type de retour
 *     est une union discriminée, `identity_id` n'existe QUE dans la branche 'resolved'.
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
  user_type?: string
  /**
   * `true` = la clé appareil de cette personne est aussi portée par QUELQU'UN
   * D'AUTRE (tablette de flotte, navigateur partagé). L'identité renvoyée reste
   * la bonne — elle vient de la clé forte — mais l'appareil n'a volontairement
   * PAS été rattaché. Purement informatif pour l'observabilité.
   */
  device_shared?: boolean
}

/**
 * Résultat de la porte. Union discriminée VOLONTAIRE : il est impossible de lire
 * `identity_id` sans avoir traité le cas 'conflict', où la base ne sait pas de
 * QUI il s'agit et renvoie l'autre personne.
 */
export type IdentityResolution =
  | { status: 'resolved'; identity: ResolvedIdentity }
  /** Deux humains distincts se disputent les clés fournies. On ne devine pas. */
  | { status: 'conflict' }
  /** Aucune clé exploitable, ou le résolveur a échoué. */
  | { status: 'unresolved' }

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

type RawCall =
  | { kind: 'ok'; identity: ResolvedIdentity }
  | { kind: 'conflict' }
  | { kind: 'fail' }

async function callResolve(
  sb: SupabaseClient,
  args: {
    p_phone_hash: string | null
    p_email_hash: string | null
    p_visitor_id: string | null
    p_driver_id: string | null
    p_canal: string
  }
): Promise<RawCall> {
  const { data, error } = await sb.rpc('resolve_identity', args)
  if (error) {
    // Bruyant volontairement : une porte d'identité qui échoue en silence est
    // exactement la panne qu'on est en train de corriger.
    console.warn('[identityGate] resolve_identity error:', error.code, error.message)
    return { kind: 'fail' }
  }
  const row = data as RpcShape | null
  // ⚠️ Le conflit est intercepté ICI, au plus près de la base : `row.identity_id`
  // est alors l'identité d'un AUTRE humain (le plus ancien des candidats). Il ne
  // ressort jamais de cette fonction. La base a déjà tracé le cas dans
  // `pieuvre_watchdog_logs` (service='identity', metric='merge_conflict').
  if (row?.conflict === true) return { kind: 'conflict' }
  if (!row?.identity_id) return { kind: 'fail' }
  return {
    kind: 'ok',
    identity: {
      identity_id: row.identity_id,
      is_known: Boolean(row.is_known),
      merged: Boolean(row.merged),
      user_type: row.user_type,
    },
  }
}

/**
 * Résout (ou crée) l'identité par la voie canonique.
 *
 * `unresolved` quand aucune clé exploitable n'est fournie : on ne fabrique JAMAIS
 * une identité orpheline non re-matchable. `conflict` quand plusieurs humains se
 * disputent les clés : on ne devine pas, l'appelant doit dégrader.
 */
export async function resolveIdentity(
  sb: SupabaseClient,
  input: ResolveIdentityInput
): Promise<IdentityResolution> {
  const p_phone_hash = phoneHashOf(input.phone_raw)
  const p_email_hash = emailHashOf(input.email_raw)
  const p_driver_id = input.driver_id ?? null
  const visitorId = input.visitor_id ?? null
  const cookieId = input.device_cookie_id ?? null
  const p_canal = input.canal

  const hasStrong = Boolean(p_phone_hash || p_email_hash || p_driver_id)

  // ── Chemin ANONYME : aucune clé forte, on n'a QUE l'appareil ────────────────
  // Un appareil ne désigne pas un humain. Si la base répond `conflict`, c'est que
  // plusieurs personnes fortes le portent : on ne rattache l'événement à AUCUNE
  // d'elles plutôt que d'attribuer le trafic de l'un au dossier de l'autre.
  if (!hasStrong) {
    const deviceKey = visitorId ?? cookieId
    if (!deviceKey) return { status: 'unresolved' }
    const anon = await callResolve(sb, {
      p_phone_hash: null,
      p_email_hash: null,
      p_visitor_id: deviceKey,
      p_driver_id: null,
      p_canal,
    })
    if (anon.kind === 'conflict') {
      console.warn('[identityGate] appareil partagé, visiteur anonyme non attribuable')
      return { status: 'conflict' }
    }
    return anon.kind === 'ok' ? { status: 'resolved', identity: anon.identity } : { status: 'unresolved' }
  }

  // ── Étape 1 : CLÉ FORTE SEULE ──────────────────────────────────────────────
  // Aucune clé appareil ici. C'est ce qui garantit qu'on obtient l'identité de LA
  // PERSONNE qui vient de saisir son numéro, et jamais celle du précédent
  // occupant de l'appareil. Voir l'en-tête du fichier (règle 1).
  const anchorCall = await callResolve(sb, {
    p_phone_hash,
    p_email_hash,
    p_visitor_id: null,
    p_driver_id,
    p_canal,
  })
  if (anchorCall.kind === 'conflict') {
    // Les clés FORTES elles-mêmes sont ambiguës (ex. ce téléphone et ce driver_id
    // pointent deux dossiers). Rien à départager côté site.
    console.warn('[identityGate] clés fortes ambiguës — aucune identité rendue')
    return { status: 'conflict' }
  }
  if (anchorCall.kind === 'fail') return { status: 'unresolved' }
  let identity = anchorCall.identity

  // ── Étape 2 : rattacher l'appareil, une clé à la fois ──────────────────────
  // L'ancre existe maintenant en base AVEC sa clé forte. Si un autre humain fort
  // porte le même appareil, `resolve_identity` voit enfin DEUX identités fortes
  // et refuse la fusion (`conflict`) — on garde alors l'ancre et on laisse
  // l'appareil non rattaché. Sinon la fusion est la bonne : elle absorbe
  // l'identité anonyme que l'appareil avait créée avant que la personne se nomme.
  const deviceKeys = [visitorId, cookieId].filter(
    (k, i, arr): k is string => Boolean(k) && arr.indexOf(k) === i
  )
  // ⚠️ Le garde-fou `merge_conflict` de la base compte les identités fortes par
  // `COALESCE(phone_hash, driver_id)` : une identité connue par son SEUL email
  // lui est invisible. Tant que ce trou existe en base (hors périmètre du site),
  // on ne rattache pas d'appareil sur une résolution email-seule.
  const guardCanSeeUs = Boolean(p_phone_hash || p_driver_id)
  let deviceShared = false

  if (guardCanSeeUs) {
    for (const deviceKey of deviceKeys) {
      const withDevice = await callResolve(sb, {
        p_phone_hash,
        p_email_hash,
        p_visitor_id: deviceKey,
        p_driver_id,
        p_canal,
      })
      if (withDevice.kind === 'conflict') {
        // Appareil partagé avec un AUTRE humain : ne pas le rattacher. L'identité
        // de l'étape 1 reste valable, elle vient de la clé forte.
        deviceShared = true
        continue
      }
      if (withDevice.kind === 'ok') {
        // Fusion sûre. L'id peut changer : le survivant est le plus ancien doublon
        // de LA MÊME personne (garanti par le garde-fou qui vient de ne pas tirer).
        identity = { ...withDevice.identity, user_type: withDevice.identity.user_type ?? identity.user_type }
      }
      // 'fail' : on garde l'ancre, on ne perd pas la personne pour un hoquet RPC.
    }
  }

  return { status: 'resolved', identity: deviceShared ? { ...identity, device_shared: true } : identity }
}

type SiteIdentityInput = {
  canal: IdentityCanal
  visitor_id?: string | null
  claimed_identity_id?: string | null
}

/**
 * Résout l'identité d'une requête du site depuis les seules ancres que le
 * serveur peut vérifier. Une identité envoyée par la page n'est jamais une
 * autorité. Le badge httpOnly gagne sur l'empreinte JavaScript.
 */
export async function resolveSiteIdentity(
  request: NextRequest,
  input: SiteIdentityInput,
): Promise<string | null> {
  const deviceCookieId = request.cookies.get('foreas_vid')?.value ?? null
  const visitorId = input.visitor_id ?? null
  if (!deviceCookieId && !visitorId) return null

  try {
    const sb = clientServeurOuNull()
    if (!sb) return null
    const resolution = await resolveIdentity(sb, {
      visitor_id: deviceCookieId ? null : visitorId,
      device_cookie_id: deviceCookieId,
      canal: input.canal,
    })
    if (resolution.status !== 'resolved') return null

    const serverIdentityId = resolution.identity.identity_id
    if (input.claimed_identity_id && input.claimed_identity_id !== serverIdentityId) {
      console.warn(`[${input.canal}] identité client ignorée : désaccord avec le badge serveur`)
    }
    return serverIdentityId
  } catch (error) {
    console.warn(`[${input.canal}] résolution d'identité impossible :`, (error as Error).message)
    return null
  }
}

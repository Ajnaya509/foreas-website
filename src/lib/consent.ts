'use client'

import {
  ADVERTISING_CONSENT_VERSION,
  CONSENT_AT_COOKIE,
  CONSENT_COOKIE,
  CONSENT_PROOF_COOKIE,
  CONSENT_REVISION_COOKIE,
  CONSENT_VERSION_COOKIE,
  type AdvertisingConsentDecision,
  type AdvertisingConsentIntent,
  isUuid,
} from './advertisingConsentContract'

const PENDING_KEY = 'foreas_consent_pending'

type PendingIntent = AdvertisingConsentIntent & { intent_id: string }

type ServerConsentState = {
  ok?: boolean
  exists?: boolean
  granted?: boolean
  reason?: string
  revision?: number
  decided_at?: string
  proof_id?: string
  version?: typeof ADVERTISING_CONSENT_VERSION
}

export type AdvertisingConsentClientResult = {
  ok: boolean
  granted: boolean
  persisted: boolean
  reason?: string
}

let serverRevision: number | null = null
let currentServerState: ServerConsentState | null = null

function cookie(name: string, value: string) {
  const date = new Date()
  date.setFullYear(date.getFullYear() + 1)
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${date.toUTCString()}; secure; samesite=strict`
}

function forgetCookie(name: string) {
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=strict`
}

function publishChoice(accepted: boolean) {
  window.dispatchEvent(new CustomEvent('foreas_consent_changed', { detail: { granted: accepted } }))
  if (accepted) window.dispatchEvent(new CustomEvent('foreas_consent_accepted'))
  const w = window as typeof window & {
    fbq?: (...args: unknown[]) => void
    ttq?: { enableCookie?: () => void; disableCookie?: () => void }
  }
  try { w.fbq?.('consent', accepted ? 'grant' : 'revoke') } catch {}
  try { accepted ? w.ttq?.enableCookie?.() : w.ttq?.disableCookie?.() } catch {}
}

function rememberRevision(revision: number) {
  const previous = knownRevision()
  const newest = previous === null ? revision : Math.max(previous, revision)
  serverRevision = newest
  cookie(CONSENT_REVISION_COOKIE, String(newest))
  localStorage.setItem(CONSENT_REVISION_COOKIE, String(newest))
}

function knownRevision(): number | null {
  const raw = localStorage.getItem(CONSENT_REVISION_COOKIE)
  const stored = raw && /^\d+$/.test(raw) ? Number(raw) : null
  const safeStored = stored !== null && Number.isSafeInteger(stored) ? stored : null
  if (serverRevision === null) return safeStored
  return safeStored === null ? serverRevision : Math.max(serverRevision, safeStored)
}

function localChoice(
  accepted: boolean,
  decision?: AdvertisingConsentDecision,
  revision?: number,
) {
  const value = accepted ? 'accepted' : 'rejected'
  cookie(CONSENT_COOKIE, value)
  localStorage.setItem(CONSENT_COOKIE, value)
  if (decision) {
    cookie(CONSENT_AT_COOKIE, decision.decided_at)
    cookie(CONSENT_PROOF_COOKIE, decision.proof_id)
    cookie(CONSENT_VERSION_COOKIE, decision.version)
  } else if (!accepted) {
    // Le navigateur ne fabrique jamais de preuve positive ou d'heure.
    forgetCookie(CONSENT_AT_COOKIE)
    forgetCookie(CONSENT_PROOF_COOKIE)
    forgetCookie(CONSENT_VERSION_COOKIE)
  }
  if (revision !== undefined) rememberRevision(revision)
  publishChoice(accepted)
}

function clearUnknownChoice(revision: number) {
  for (const name of [CONSENT_COOKIE, CONSENT_AT_COOKIE, CONSENT_PROOF_COOKIE, CONSENT_VERSION_COOKIE]) {
    forgetCookie(name)
  }
  localStorage.removeItem(CONSENT_COOKIE)
  rememberRevision(revision)
  publishChoice(false)
}

function canonicalDecision(state: ServerConsentState): AdvertisingConsentDecision | null {
  if (typeof state.granted !== 'boolean' || !state.decided_at ||
      state.version !== ADVERTISING_CONSENT_VERSION || !isUuid(state.proof_id)) return null
  return {
    granted: state.granted,
    source: state.granted ? 'banner' : 'withdrawal',
    version: state.version,
    decided_at: state.decided_at,
    proof_id: state.proof_id,
  }
}

function applyCanonicalState(state: ServerConsentState): boolean {
  if (!Number.isSafeInteger(state.revision) || Number(state.revision) < 0) return false
  const revision = Number(state.revision)
  const revisionFloor = knownRevision()
  if (revisionFloor !== null && revision < revisionFloor) {
    // Une reponse plus ancienne ne peut jamais rallumer la mesure. Un contexte
    // d'identite devenu ambigu reste coupe jusqu'a une nouvelle lecture stable.
    if (state.granted === true) localChoice(false)
    currentServerState = null
    return false
  }
  if (revision === 0 && state.exists === false) {
    clearUnknownChoice(0)
    currentServerState = state
    return true
  }
  if (revision > 0 && state.version !== ADVERTISING_CONSENT_VERSION) {
    // Une ancienne version n'autorise plus rien, mais sa revision reste la
    // bonne condition pour enregistrer un nouveau geste explicite.
    localChoice(false, undefined, revision)
    currentServerState = state
    return true
  }
  const decision = canonicalDecision(state)
  if (!decision || revision === 0) return false
  localChoice(decision.granted, decision, revision)
  currentServerState = state
  return true
}

async function readCurrentServerState(): Promise<ServerConsentState | null> {
  try {
    const response = await fetch('/api/consent/advertising', {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
    })
    const state = await response.json().catch(() => null) as ServerConsentState | null
    if (!response.ok || state?.ok !== true || !Number.isSafeInteger(state.revision)) return null
    return state
  } catch {
    return null
  }
}

function ownsPending(intent: PendingIntent): boolean {
  try {
    const current = JSON.parse(localStorage.getItem(PENDING_KEY) || 'null') as Partial<PendingIntent> | null
    return current?.intent_id === intent.intent_id
  } catch {
    return false
  }
}

function clearPendingIfOwned(intent: PendingIntent) {
  if (ownsPending(intent)) localStorage.removeItem(PENDING_KEY)
}

function validPending(value: unknown): value is PendingIntent {
  if (!value || typeof value !== 'object') return false
  const pending = value as Partial<PendingIntent>
  return typeof pending.granted === 'boolean' &&
    (pending.source === 'banner' || pending.source === 'withdrawal') &&
    !(pending.source === 'withdrawal' && pending.granted) &&
    Number.isSafeInteger(pending.expected_revision) && Number(pending.expected_revision) >= 0 &&
    (!pending.granted || (Number(pending.expected_revision) === 0
      ? pending.expected_proof_id === null
      : isUuid(pending.expected_proof_id))) &&
    isUuid(pending.intent_id)
}

async function persist(intent: PendingIntent): Promise<AdvertisingConsentClientResult> {
  // Ne jamais recréer ici un intent qu'un autre onglet a déjà remplacé.
  if (!ownsPending(intent)) {
    return { ok: false, granted: false, persisted: false, reason: 'superseded_locally' }
  }
  try {
    const response = await fetch('/api/consent/advertising', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      // Identite et temps restent absents. La revision n'est qu'une condition
      // que la base compare sous verrou, jamais une autorite du navigateur.
      body: JSON.stringify({
        granted: intent.granted,
        source: intent.source,
        expected_revision: intent.expected_revision,
        expected_proof_id: intent.expected_proof_id,
      }),
      keepalive: true,
    })
    const result = await response.json().catch(() => null) as ServerConsentState | null
    const stillLatest = ownsPending(intent)

    if (response.status === 409 && result?.reason === 'revision_conflict') {
      // Cet ancien geste est termine. Surtout, on ne le « rebase » jamais sur
      // la nouvelle revision : ce serait ressusciter un vieux oui.
      clearPendingIfOwned(intent)
      if (stillLatest) applyCanonicalState(result)
      return {
        ok: false,
        granted: result.granted === true,
        persisted: false,
        reason: 'revision_conflict',
      }
    }
    if (!response.ok || result?.ok !== true || typeof result.granted !== 'boolean') {
      return { ok: false, granted: false, persisted: false, reason: result?.reason || 'save_failed' }
    }

    // Un retrait local plus neuf a pu remplacer cet intent pendant que sa
    // reponse voyageait. Une vieille reponse positive ne rallume alors rien.
    if (!stillLatest) {
      return { ok: false, granted: false, persisted: true, reason: 'superseded_locally' }
    }
    const complete = applyCanonicalState(result)
    if (!complete || (intent.granted === false && result.granted === true)) {
      localChoice(false, undefined, Number.isSafeInteger(result.revision) ? Number(result.revision) : undefined)
      return { ok: false, granted: false, persisted: false, reason: 'canonical_state_invalid' }
    }
    clearPendingIfOwned(intent)
    return {
      ok: result.granted === intent.granted,
      granted: result.granted,
      persisted: true,
      reason: result.granted === intent.granted ? undefined : 'refusal_wins',
    }
  } catch {
    return { ok: false, granted: false, persisted: false, reason: 'network_unavailable' }
  }
}

function pendingIntent(
  granted: boolean,
  source: AdvertisingConsentIntent['source'],
  expectedRevision: number,
  expectedProofId: string | null,
): PendingIntent {
  return {
    granted,
    source,
    expected_revision: expectedRevision,
    expected_proof_id: expectedProofId,
    intent_id: crypto.randomUUID(),
  }
}

function getCookieConsentState(): 'accepted' | 'rejected' | 'unknown' {
  const value = document.cookie
    .split(';')
    .find(c => c.trim().startsWith(`${CONSENT_COOKIE}=`))
    ?.split('=')[1]
  return value === 'accepted' || value === 'rejected' ? value : 'unknown'
}

export function hasTrackingConsent(): boolean {
  if (typeof window === 'undefined') return false
  const cookieConsent = getCookieConsentState()
  if (cookieConsent === 'accepted') return true
  if (cookieConsent === 'rejected') return false
  return localStorage.getItem(CONSENT_COOKIE) === 'accepted'
}

export function getAdvertisingConsentState(): 'accepted' | 'rejected' | 'unknown' {
  if (typeof window === 'undefined') return 'unknown'
  const cookieConsent = getCookieConsentState()
  if (cookieConsent !== 'unknown') return cookieConsent
  const local = localStorage.getItem(CONSENT_COOKIE)
  return local === 'accepted' || local === 'rejected' ? local : 'unknown'
}

export async function acceptAdvertisingConsent(): Promise<AdvertisingConsentClientResult> {
  // Le clic utilise uniquement l'etat serveur deja lu. Aucun intent n'est
  // cree ou reecrit apres une attente reseau.
  const current = currentServerState
  const revisionFloor = knownRevision()
  if (!current || !Number.isSafeInteger(current.revision) ||
      (revisionFloor !== null && Number(current.revision) < revisionFloor)) {
    localChoice(false)
    void syncPendingAdvertisingConsent()
    return { ok: false, granted: false, persisted: false, reason: 'current_state_unavailable' }
  }
  const intent = pendingIntent(
    true,
    'banner',
    Number(current.revision),
    Number(current.revision) === 0 ? null : (current.proof_id || null),
  )
  localStorage.setItem(PENDING_KEY, JSON.stringify(intent))
  return persist(intent)
}

async function refuse(source: AdvertisingConsentIntent['source']): Promise<AdvertisingConsentClientResult> {
  // L'arret local n'attend jamais le reseau.
  currentServerState = null
  localChoice(false, undefined, knownRevision() ?? undefined)
  const intent = pendingIntent(false, source, knownRevision() ?? 0, null)
  // Le retrait est reserve une seule fois puis part directement. La base le
  // fait gagner meme si sa revision attendue est ancienne.
  localStorage.setItem(PENDING_KEY, JSON.stringify(intent))
  return persist(intent)
}

export async function rejectAdvertisingConsent(): Promise<AdvertisingConsentClientResult> {
  return refuse('banner')
}

export async function withdrawAdvertisingConsent(): Promise<AdvertisingConsentClientResult> {
  return refuse('withdrawal')
}

export async function syncPendingAdvertisingConsent(): Promise<void> {
  const raw = localStorage.getItem(PENDING_KEY)
  let pending: PendingIntent | null = null
  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      if (!validPending(parsed)) throw new Error('invalid')
      pending = parsed
    } catch {
      localStorage.removeItem(PENDING_KEY)
    }
  }

  // Un oui en attente n'est jamais rejoue au demarrage. Une nouvelle lecture
  // P29 puis un nouveau clic explicite sont obligatoires.
  if (pending?.granted === true) {
    clearPendingIfOwned(pending)
    pending = null
    currentServerState = null
    localChoice(false)
  }
  // Un non en attente reste prioritaire et repart sans lecture prealable.
  if (pending?.granted === false) {
    currentServerState = null
    localChoice(false, undefined, pending.expected_revision)
    await persist(pending)
    return
  }
  const current = await readCurrentServerState()
  if (!current) return
  if (!pending) {
    // Un autre onglet a pu réserver un geste pendant le GET.
    if (localStorage.getItem(PENDING_KEY)) return
    applyCanonicalState(current)
    return
  }
}

/** Compatibilite temporaire : aucun appelant ne peut activer sans preuve serveur. */
export function setTrackingConsent(accepted: boolean) {
  if (!accepted) void rejectAdvertisingConsent()
}

export function loadTrackingPixels() {
  // L'acceptation reussie publie deja foreas_consent_accepted.
}

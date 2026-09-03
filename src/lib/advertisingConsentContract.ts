export const ADVERTISING_CONSENT_VERSION = 'foreas_ads_v1_2026-08-30'

export const CONSENT_COOKIE = 'foreas_consent'
export const CONSENT_AT_COOKIE = 'foreas_consent_at'
export const CONSENT_PROOF_COOKIE = 'foreas_consent_proof'
export const CONSENT_VERSION_COOKIE = 'foreas_consent_version'
export const CONSENT_REVISION_COOKIE = 'foreas_consent_revision'

export type AdvertisingConsentSource = 'banner' | 'withdrawal' | 'checkout'

/**
 * Le navigateur ne fournit qu'un geste. L'heure et la preuve qui font foi
 * sont exclusivement fabriquees par le serveur.
 */
export type AdvertisingConsentIntent = {
  granted: boolean
  source: Exclude<AdvertisingConsentSource, 'checkout'>
  /** 0 signifie que le serveur n'avait encore aucune decision. */
  expected_revision: number
  /** Lie la revision a la ligne serveur lue, sans envoyer d'identite. */
  expected_proof_id: string | null
}

export type AdvertisingConsentDecision = {
  granted: boolean
  version: typeof ADVERTISING_CONSENT_VERSION
  source: AdvertisingConsentSource
  decided_at: string
  proof_id: string
}

export type AdvertisingConsentCookieSnapshot = {
  granted: boolean
  version: string | null
  decided_at: string | null
  proof_id: string | null
  revision: number | null
}

function cookies(cookieHeader: string | null | undefined): Map<string, string> {
  const result = new Map<string, string>()
  for (const part of String(cookieHeader || '').split(';')) {
    const separator = part.indexOf('=')
    if (separator < 1) continue
    const key = part.slice(0, separator).trim()
    const raw = part.slice(separator + 1).trim()
    try {
      result.set(key, decodeURIComponent(raw))
    } catch {
      // Une valeur mal encodée n'est jamais une preuve.
    }
  }
  return result
}

export function readAdvertisingConsentCookies(
  cookieHeader: string | null | undefined,
): AdvertisingConsentCookieSnapshot | null {
  const values = cookies(cookieHeader)
  const choice = values.get(CONSENT_COOKIE)
  if (choice !== 'accepted' && choice !== 'rejected') return null
  return {
    granted: choice === 'accepted',
    version: values.get(CONSENT_VERSION_COOKIE) || null,
    decided_at: values.get(CONSENT_AT_COOKIE) || null,
    proof_id: values.get(CONSENT_PROOF_COOKIE) || null,
    revision: (() => {
      const raw = values.get(CONSENT_REVISION_COOKIE)
      if (!raw || !/^\d+$/.test(raw)) return null
      const revision = Number(raw)
      return Number.isSafeInteger(revision) ? revision : null
    })(),
  }
}

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export function isValidConsentIntent(value: unknown): value is AdvertisingConsentIntent {
  if (!value || typeof value !== 'object') return false
  const d = value as Partial<AdvertisingConsentIntent>
  return typeof d.granted === 'boolean' &&
    (d.source === 'banner' || d.source === 'withdrawal') &&
    Number.isSafeInteger(d.expected_revision) &&
    Number(d.expected_revision) >= 0 &&
    (!d.granted || (Number(d.expected_revision) === 0
      ? d.expected_proof_id === null
      : isUuid(d.expected_proof_id))) &&
    !(d.source === 'withdrawal' && d.granted)
}

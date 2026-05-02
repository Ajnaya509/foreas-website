/**
 * Fingerprint Silencieux — FOREAS
 *
 * Capte un visitorId stable via FingerprintJS open source.
 * Utilisé pour :
 * - Persistance du sarcastic guard cross-incognito (robuste vs localStorage)
 * - Retargeting Meta CAPI server-side (audience custom "home_searched_zone")
 * - Identification anonyme cross-canal (matching identity_bridge si phone capturé plus tard)
 *
 * Phase 1 : init + log dans localStorage + envoi event à Meta CAPI
 * Phase 2 : couplage avec table Supabase `home_visitors` pour persistance serveur
 *
 * NOTE : pour conformité CNIL stricte, prévoir un consent banner (pas inclus MVP
 * mais à activer en Phase 2 si demandé). Actuellement la collecte se base sur
 * l'intérêt légitime + finalité commerciale claire (mesure d'audience).
 */

import FingerprintJS from '@fingerprintjs/fingerprintjs'

const KEY_VISITOR_ID = 'foreas_visitor_id'
const KEY_VISITOR_CONFIDENCE = 'foreas_visitor_confidence'

export interface VisitorIdentity {
  visitorId: string
  confidence: number
  cached: boolean
}

let agentPromise: ReturnType<typeof FingerprintJS.load> | null = null

/**
 * Charge l'agent FingerprintJS une seule fois (singleton).
 */
function getAgent() {
  if (!agentPromise) {
    agentPromise = FingerprintJS.load({
      monitoring: false, // pas de tracking interne FP.js
    })
  }
  return agentPromise
}

/**
 * Récupère un visitorId stable.
 * - Si déjà en cache localStorage → return immédiat (synchrone via cache)
 * - Sinon → calcule via FingerprintJS et cache
 */
export async function getVisitorId(): Promise<VisitorIdentity> {
  if (typeof window === 'undefined') {
    return { visitorId: 'ssr', confidence: 0, cached: false }
  }

  // Cache localStorage (court-circuit pour éviter recalcul à chaque mount)
  try {
    const cached = localStorage.getItem(KEY_VISITOR_ID)
    const confidence = parseFloat(localStorage.getItem(KEY_VISITOR_CONFIDENCE) ?? '0')
    if (cached) {
      return { visitorId: cached, confidence, cached: true }
    }
  } catch {
    // ignore
  }

  try {
    const fp = await getAgent()
    const result = await fp.get()
    const visitorId = result.visitorId
    const confidence = result.confidence?.score ?? 0

    try {
      localStorage.setItem(KEY_VISITOR_ID, visitorId)
      localStorage.setItem(KEY_VISITOR_CONFIDENCE, String(confidence))
    } catch {
      // ignore
    }

    return { visitorId, confidence, cached: false }
  } catch {
    // FingerprintJS a échoué (CSP, blocker…) — fallback random
    const fallback = `fb_${Math.random().toString(36).slice(2, 12)}_${Date.now().toString(36)}`
    try {
      localStorage.setItem(KEY_VISITOR_ID, fallback)
      localStorage.setItem(KEY_VISITOR_CONFIDENCE, '0')
    } catch {
      // ignore
    }
    return { visitorId: fallback, confidence: 0, cached: false }
  }
}

/**
 * Récupère le visitorId déjà en cache, sans déclencher FingerprintJS.
 * Utile pour les events tracking en parallèle.
 */
export function getCachedVisitorId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(KEY_VISITOR_ID)
  } catch {
    return null
  }
}

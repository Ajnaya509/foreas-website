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

import { hasTrackingConsent } from './consent'

/**
 * ⚠️ 22/08/2026 — CE FICHIER EMBARQUAIT 33 578 OCTETS DANS LE PREMIER ÉCRAN.
 *
 * `import FingerprintJS from '@fingerprintjs/fingerprintjs'` était écrit ici,
 * en statique. Mesuré sur la fabrication : le morceau `1474-….js` fait
 * **33 578 octets bruts** et part au premier chargement — sur toutes les pages
 * qui importent ce module, que l'empreinte soit calculée ou non.
 *
 * ⚠️ ET IL PARTAIT AVANT TOUT ACCORD. Le commentaire d'origine, quelques lignes
 * plus haut, le disait lui-même : « pour conformité CNIL stricte, prévoir un
 * consent banner (pas inclus MVP) ». Le bandeau existe depuis longtemps — ce
 * code n'y a jamais été branché.
 *
 * ⚠️ ET TROIS APPELANTS SUR CINQ NE VÉRIFIAIENT RIEN. `LivePhone` et
 * `IdentityObserver` demandaient l'accord ; `ZoneSearchBarHero` (commentaire :
 * « Init fingerprint silencieux dès le mount, pour retargeting »),
 * `AjnayaConversationModal` et `AjnayaWidget` le calculaient ou le lisaient
 * directement.
 *
 * La CNIL classe le calcul d'une empreinte unique du terminal parmi les
 * traceurs soumis à accord préalable — hors ce qui est strictement nécessaire
 * au service demandé.
 *
 * Deux corrections, toutes les deux ICI, au point unique :
 *
 *  1. la bibliothèque est chargée par `import()`, donc seulement quand on
 *     l'utilise vraiment ;
 *  2. l'accord est vérifié DANS ce module. Un appelant qui oublie le garde ne
 *     peut plus déclencher de calcul : la porte est en dessous de lui, pas
 *     au-dessus.
 *
 * Sans accord, `getVisitorId()` rend une identité VIDE. Ce n'est pas une panne :
 * la conversation, la Pieuvre et WhatsApp continuent grâce au badge appareil
 * `foreas_vid`, posé côté serveur, `httpOnly`, qui ne descend jamais au
 * navigateur (voir `src/app/wa/route.ts`).
 */

const KEY_VISITOR_ID = 'foreas_visitor_id'
const KEY_VISITOR_CONFIDENCE = 'foreas_visitor_confidence'

export interface VisitorIdentity {
  visitorId: string
  confidence: number
  cached: boolean
}

interface AgentEmpreinte {
  get: () => Promise<{ visitorId: string; confidence?: { score?: number } }>
}

let agentPromise: Promise<AgentEmpreinte> | null = null

/**
 * Charge l'agent une seule fois, et seulement au moment où on en a besoin.
 *
 * ⚠️ La promesse est mémorisée AVANT le premier `await` : deux appelants
 * simultanés partagent le même chargement. L'affecter après l'attente laisserait
 * passer deux imports — le piège du « vérifier puis agir ».
 */
function getAgent(): Promise<AgentEmpreinte> {
  if (!agentPromise) {
    agentPromise = import('@fingerprintjs/fingerprintjs').then((mod) => {
      const FingerprintJS = mod.default ?? mod
      return FingerprintJS.load({
        monitoring: false, // pas de mesure interne de FingerprintJS
      }) as unknown as Promise<AgentEmpreinte>
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

  // ⚠️ LA PORTE EST ICI, SOUS LES APPELANTS — pas au-dessus.
  // Trois des cinq appelants ne la posaient pas. Un garde placé dans chaque
  // composant se perd au premier composant écrit par quelqu'un d'autre.
  if (!hasTrackingConsent()) {
    return { visitorId: '', confidence: 0, cached: false }
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
/**
 * Lecture du cache uniquement — ne déclenche aucun calcul.
 *
 * ⚠️ Le garde y est quand même : une empreinte déjà calculée reste une donnée
 * de traceur. La relire pour la transmettre après un refus reviendrait à
 * utiliser ce qu'on n'a plus le droit d'utiliser.
 */
export function getCachedVisitorId(): string | null {
  if (typeof window !== 'undefined' && !hasTrackingConsent()) return null
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(KEY_VISITOR_ID)
  } catch {
    return null
  }
}

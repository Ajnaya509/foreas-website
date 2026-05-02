/**
 * Sarcastic Visits Manager — FOREAS
 *
 * Gestion localStorage des visites répétées + zones tapées.
 * Détermine le niveau de sarcasme à afficher (1-2-3) sur la home /ou-ca-paie.
 *
 * Phase 1 : localStorage uniquement (cassable via incognito mais OK MVP)
 * Phase 2 : couplage avec fingerprint silencieux pour persistance robuste
 *
 * Voir : FOREAS-SHARED/HOME_HERO_SEARCH_v1_SPEC.md §5
 */

const KEY_VISIT_COUNT = 'foreas_visit_count'
const KEY_SEARCHED_ZONES = 'foreas_searched_zones'
const KEY_FIRST_VISIT = 'foreas_first_visit'
const KEY_LAST_VISIT = 'foreas_last_visit'

export type SarcasmLevel = 1 | 2 | 3

export interface VisitState {
  count: number
  zones: string[]
  level: SarcasmLevel
  firstVisitAt: string | null
  lastVisitAt: string | null
}

/**
 * Lit l'état actuel — safe SSR (return defaults si window absent).
 */
export function readVisitState(): VisitState {
  if (typeof window === 'undefined') {
    return { count: 0, zones: [], level: 1, firstVisitAt: null, lastVisitAt: null }
  }

  try {
    const count = parseInt(localStorage.getItem(KEY_VISIT_COUNT) ?? '0', 10) || 0
    const zonesRaw = localStorage.getItem(KEY_SEARCHED_ZONES)
    const zones: string[] = zonesRaw ? JSON.parse(zonesRaw) : []
    const firstVisitAt = localStorage.getItem(KEY_FIRST_VISIT)
    const lastVisitAt = localStorage.getItem(KEY_LAST_VISIT)

    return {
      count,
      zones,
      level: computeLevel(count),
      firstVisitAt,
      lastVisitAt,
    }
  } catch {
    return { count: 0, zones: [], level: 1, firstVisitAt: null, lastVisitAt: null }
  }
}

/**
 * Incrémente le compteur de visites + ajoute la zone (déduplication).
 * Appelé à chaque submit de la search bar.
 */
export function recordSearch(zone: string): VisitState {
  if (typeof window === 'undefined') {
    return { count: 1, zones: [zone], level: 1, firstVisitAt: null, lastVisitAt: null }
  }

  const current = readVisitState()
  const newCount = current.count + 1
  const normalized = zone.trim().toLowerCase()
  const newZones = current.zones.includes(normalized)
    ? current.zones
    : [...current.zones, normalized]

  const now = new Date().toISOString()
  const firstVisitAt = current.firstVisitAt ?? now

  try {
    localStorage.setItem(KEY_VISIT_COUNT, String(newCount))
    localStorage.setItem(KEY_SEARCHED_ZONES, JSON.stringify(newZones))
    localStorage.setItem(KEY_FIRST_VISIT, firstVisitAt)
    localStorage.setItem(KEY_LAST_VISIT, now)
  } catch {
    // localStorage indisponible (incognito / quota plein) — silencieux
  }

  return {
    count: newCount,
    zones: newZones,
    level: computeLevel(newCount),
    firstVisitAt,
    lastVisitAt: now,
  }
}

/**
 * Calcule le niveau de sarcasme selon le compteur de visites.
 * Niveau 1 = générosité Cialdini (visite 1-2)
 * Niveau 2 = humour clin d'œil → screenshot virality (3-5)
 * Niveau 3 = autorité fondateur → conversion (6+)
 */
export function computeLevel(count: number): SarcasmLevel {
  if (count <= 2) return 1
  if (count <= 5) return 2
  return 3
}

/**
 * Reset complet (footer "Réinitialiser mes données locales").
 */
export function resetVisitState(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(KEY_VISIT_COUNT)
    localStorage.removeItem(KEY_SEARCHED_ZONES)
    localStorage.removeItem(KEY_FIRST_VISIT)
    localStorage.removeItem(KEY_LAST_VISIT)
  } catch {
    // silencieux
  }
}

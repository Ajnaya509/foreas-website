import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/home/zone-stats?zone=...
 *
 * Renvoie les stats de zone pour la search bar de /ou-ca-paie.
 *
 * PHASE 1 (actuel) : 6 zones mockées hardcodées + fuzzy matching basique.
 *                    Données HONNÊTES marquées comme estimations approximatives
 *                    (transparence Halbert : "47 courses · S18").
 *
 * PHASE 2 (à venir) : remplace par RPC Supabase get_zone_stats() côté Pieuvre
 *                     (voir FOREAS-SHARED/HOME_HERO_SEARCH_v1_SPEC.md §3).
 *
 * Signature de retour cohérente Phase 1 ↔ Phase 2 — frontend agnostique.
 */

interface ZoneStats {
  zone_match: string
  avg_hourly: number
  demand_delta_pct: number
  top_pool: string
  courses_count: number
  week_iso: string
  last_updated: string
  has_data: boolean
  fallback_zone?: { name: string; avg_hourly: number }
}

// ─── Seed Phase 1 — 6 zones priorité 1 ──────────────────────────────────────
const ZONES_MOCK: Record<string, ZoneStats> = {
  cdg: {
    zone_match: 'Aéroport CDG',
    avg_hourly: 41.8,
    demand_delta_pct: 38,
    top_pool: 'T1 (9 prio)',
    courses_count: 47,
    week_iso: getCurrentWeekISO(),
    last_updated: new Date().toISOString(),
    has_data: true,
  },
  orly: {
    zone_match: 'Aéroport Orly',
    avg_hourly: 38.4,
    demand_delta_pct: 22,
    top_pool: 'Sud (parking VTC)',
    courses_count: 31,
    week_iso: getCurrentWeekISO(),
    last_updated: new Date().toISOString(),
    has_data: true,
  },
  defense: {
    zone_match: 'La Défense',
    avg_hourly: 36.2,
    demand_delta_pct: 14,
    top_pool: 'Place de La Défense',
    courses_count: 58,
    week_iso: getCurrentWeekISO(),
    last_updated: new Date().toISOString(),
    has_data: true,
  },
  bercy: {
    zone_match: 'Bercy / Gare de Lyon',
    avg_hourly: 33.7,
    demand_delta_pct: 9,
    top_pool: 'Gare de Lyon · sortie 1',
    courses_count: 42,
    week_iso: getCurrentWeekISO(),
    last_updated: new Date().toISOString(),
    has_data: true,
  },
  partdieu: {
    zone_match: 'Lyon Part-Dieu',
    avg_hourly: 32.5,
    demand_delta_pct: 18,
    top_pool: 'Gare Part-Dieu · sortie Vivier-Merle',
    courses_count: 38,
    week_iso: getCurrentWeekISO(),
    last_updated: new Date().toISOString(),
    has_data: true,
  },
  bordeauxgare: {
    zone_match: 'Bordeaux Saint-Jean',
    avg_hourly: 30.4,
    demand_delta_pct: 11,
    top_pool: 'Gare · parvis Belcier',
    courses_count: 29,
    week_iso: getCurrentWeekISO(),
    last_updated: new Date().toISOString(),
    has_data: true,
  },
}

// Fallback élégant (zone inconnue) → suggère la plus proche dans la même région
const FALLBACK_DEFAULT: NonNullable<ZoneStats['fallback_zone']> = {
  name: 'Aéroport CDG',
  avg_hourly: 41.8,
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function normalize(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // retirer accents
    .replace(/[^a-z0-9]/g, '')
}

function fuzzyMatch(input: string): keyof typeof ZONES_MOCK | null {
  const n = normalize(input)
  if (!n) return null

  // Match keywords pour chaque zone
  const matchers: Record<keyof typeof ZONES_MOCK, string[]> = {
    cdg: ['cdg', 'roissy', 'aeroportcdg', 'charlesdegaulle', 'paris2'],
    orly: ['orly', 'aeroportorly', 'paris7'],
    defense: ['defense', 'ladefense', 'puteaux', 'courbevoie'],
    bercy: ['bercy', 'gareldelyon', 'garedelyon'],
    partdieu: ['partdieu', 'lyon', 'lyonpartdieu'],
    bordeauxgare: ['bordeaux', 'saintjean', 'bordeauxsaintjean'],
  }

  for (const [key, keywords] of Object.entries(matchers) as [keyof typeof ZONES_MOCK, string[]][]) {
    if (keywords.some(kw => n.includes(kw) || kw.includes(n))) {
      return key
    }
  }
  return null
}

function getCurrentWeekISO(): string {
  const now = new Date()
  const year = now.getUTCFullYear()
  const oneJan = new Date(Date.UTC(year, 0, 1))
  const numberOfDays = Math.floor((now.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000))
  const week = Math.ceil((numberOfDays + oneJan.getUTCDay() + 1) / 7)
  return `${year}-W${String(week).padStart(2, '0')}`
}

// ─── Handler ────────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const zoneInput = searchParams.get('zone')?.trim() ?? ''

  if (!zoneInput) {
    return NextResponse.json(
      { error: 'missing_zone' },
      { status: 400 }
    )
  }

  const matchKey = fuzzyMatch(zoneInput)

  if (!matchKey) {
    // Fallback élégant : pas de data sur la zone tapée → suggère CDG
    const fallback: ZoneStats = {
      zone_match: zoneInput, // on garde le texte tapé
      avg_hourly: 0,
      demand_delta_pct: 0,
      top_pool: '',
      courses_count: 0,
      week_iso: getCurrentWeekISO(),
      last_updated: new Date().toISOString(),
      has_data: false,
      fallback_zone: FALLBACK_DEFAULT,
    }
    return NextResponse.json(fallback)
  }

  const stats = ZONES_MOCK[matchKey]
  return NextResponse.json(stats)
}

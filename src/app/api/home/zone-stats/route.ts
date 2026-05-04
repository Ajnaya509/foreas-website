import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/home/zone-stats?zone=...
 *
 * Renvoie les stats de zone pour la search bar de la home.
 *
 * PHASE 2 (live, depuis 03/05/2026) : appelle la RPC Supabase
 * `public.get_zone_stats(zone_input text)` livrée par le fil Pieuvre.
 * 51 zones canoniques disponibles (Paris 24, Lyon 6, Marseille 5 + autres).
 *
 * FALLBACK : si la RPC échoue (Supabase down, env manquante…), on retombe
 * sur 6 zones mockées MVP — la page reste fonctionnelle, jamais d'erreur 500.
 *
 * Voir : FOREAS-SHARED/HOME_HERO_SEARCH_v1_SPEC.md §3
 *      : FOREAS-SHARED/AJNAYA_CONTRACTS.md §11
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
  /** Zone de repli suggérée par la RPC (quand has_data=false).
   *  note est un message optionnel libre (ex: "zone voisine la plus proche") */
  fallback_zone: { name: string; avg_hourly: number; note?: string } | null
}

// ─── Mocks fallback (sécurité au cas où la RPC est indisponible) ────────────
const ZONES_MOCK_FALLBACK: Record<string, ZoneStats> = {
  cdg: {
    zone_match: 'Aéroport CDG',
    avg_hourly: 41.8,
    demand_delta_pct: 38,
    top_pool: 'T1 (9 prio)',
    courses_count: 47,
    week_iso: getCurrentWeekISO(),
    last_updated: new Date().toISOString(),
    has_data: true,
    fallback_zone: null,
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
    fallback_zone: null,
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
    fallback_zone: null,
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
    fallback_zone: null,
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
    fallback_zone: null,
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
    fallback_zone: null,
  },
}

const FALLBACK_DEFAULT = { name: 'Aéroport CDG', avg_hourly: 41.8 }

function normalize(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

function fuzzyMatchMock(input: string): keyof typeof ZONES_MOCK_FALLBACK | null {
  const n = normalize(input)
  if (!n) return null
  const matchers: Record<keyof typeof ZONES_MOCK_FALLBACK, string[]> = {
    cdg: ['cdg', 'roissy', 'aeroportcdg', 'charlesdegaulle', 'paris2'],
    orly: ['orly', 'aeroportorly', 'paris7'],
    defense: ['defense', 'ladefense', 'puteaux', 'courbevoie'],
    bercy: ['bercy', 'gareldelyon', 'garedelyon'],
    partdieu: ['partdieu', 'lyon', 'lyonpartdieu'],
    bordeauxgare: ['bordeaux', 'saintjean', 'bordeauxsaintjean'],
  }
  for (const [key, keywords] of Object.entries(matchers) as [keyof typeof ZONES_MOCK_FALLBACK, string[]][]) {
    if (keywords.some(kw => n.includes(kw) || kw.includes(n))) return key
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
    return NextResponse.json({ error: 'missing_zone' }, { status: 400 })
  }

  // ─── Tentative RPC Supabase (Phase 2) ─────────────────────────────────────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY

  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false },
      })

      const { data, error } = await supabase.rpc('get_zone_stats', {
        zone_input: zoneInput,
      })

      if (!error && Array.isArray(data) && data.length > 0) {
        const row = data[0]
        const stats: ZoneStats = {
          zone_match: row.zone_match ?? zoneInput,
          avg_hourly: Number(row.avg_hourly ?? 0),
          demand_delta_pct: Number(row.demand_delta_pct ?? 0),
          top_pool: row.top_pool ?? '',
          courses_count: Number(row.courses_count ?? 0),
          week_iso: row.week_iso ?? getCurrentWeekISO(),
          last_updated: row.last_updated ?? new Date().toISOString(),
          has_data: Boolean(row.has_data),
          fallback_zone: row.fallback_zone ?? null,
        }
        return NextResponse.json(stats)
      }
      // Si erreur RPC ou data vide → fallback mocks ci-dessous (resilience)
    } catch {
      // Exception réseau / config → fallback mocks
    }
  }

  // ─── Fallback mocks (sécurité) ────────────────────────────────────────────
  const matchKey = fuzzyMatchMock(zoneInput)
  if (matchKey) {
    return NextResponse.json(ZONES_MOCK_FALLBACK[matchKey])
  }

  const fallback: ZoneStats = {
    zone_match: zoneInput,
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

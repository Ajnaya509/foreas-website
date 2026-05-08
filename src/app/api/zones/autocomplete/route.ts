/**
 * GET /api/zones/autocomplete?q=cdg&limit=5
 *
 * Saisie prédictive ultra-fiable sur les 51 zones canoniques FOREAS.
 *
 * Stratégie de matching (par ordre de priorité) :
 *  1. Tente RPC `match_zones_trgm(q, max_results)` (à créer côté Pieuvre, optionnel)
 *  2. Fallback : SELECT direct sur `zones_canonical` avec ilike sur `zone_match`
 *     ET sur les aliases (jsonb array) — index GIN trgm déjà en place §3 STATE
 *
 * Exemples :
 *   q=cdg          → "Aéroport CDG", "Roissy CDG"
 *   q=part-die     → "Lyon Part-Dieu"
 *   q=bdx          → "Bordeaux Saint-Jean" (alias)
 *   q=disney       → "Marne-la-Vallée"
 *   q=bercy        → "Bercy / Gare de Lyon"
 *
 * Sécurité : query <= 64 chars, sanitisé (anti-SQL injection via param binding).
 *
 * Cache : 5 min CDN (les zones bougent rarement) + 1 jour stale-while-revalidate.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const revalidate = 300

interface ZoneSuggestion {
  zone_match: string
  /** Le terme qui a matché (zone_match ou un alias) — pour highlight UI éventuel */
  matched_on: 'zone_match' | 'alias'
  /** Aliases connus (utile pour afficher "CDG · Roissy") */
  aliases?: string[]
  /** Score de pertinence (1.0 = exact, 0.0 = trgm seuil bas) */
  score: number
}

function sanitizeQuery(raw: string | null): string | null {
  if (!raw) return null
  const q = raw.trim().slice(0, 64)
  if (q.length < 1) return null
  // Retire caractères dangereux pour le LIKE pattern (mais pas % ou _ qui peuvent
  // être utiles)
  return q.replace(/[\\;\0]/g, '')
}

interface ZoneRow {
  zone_match: string
  aliases?: string[] | null
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = sanitizeQuery(searchParams.get('q'))
  const limitRaw = searchParams.get('limit')
  const limit = Math.max(1, Math.min(10, parseInt(limitRaw ?? '5', 10) || 5))

  if (!q) {
    return NextResponse.json(
      { suggestions: [] },
      {
        headers: {
          'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=86400',
        },
      },
    )
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    // Fallback hardcoded local (basique) si Supabase pas configuré
    return NextResponse.json({ suggestions: [] }, { status: 503 })
  }

  const sb = createClient(url, key, { auth: { persistSession: false } })

  // ─── Étape 1 : tenter RPC trgm si elle existe (optionnel) ──────────────────
  try {
    const { data, error } = await sb.rpc('match_zones_trgm', {
      q_input: q,
      max_results: limit,
    })
    if (!error && Array.isArray(data) && data.length > 0) {
      const suggestions: ZoneSuggestion[] = data.map((row: ZoneRow & { score?: number; matched_on?: string }) => ({
        zone_match: row.zone_match,
        matched_on: (row.matched_on as 'zone_match' | 'alias') ?? 'zone_match',
        aliases: row.aliases ?? undefined,
        score: typeof row.score === 'number' ? row.score : 0.5,
      }))
      return NextResponse.json(
        { suggestions, source: 'rpc_trgm' },
        {
          headers: {
            'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=86400',
          },
        },
      )
    }
  } catch {
    /* RPC pas dispo — fallback SELECT */
  }

  // ─── Étape 2 : fallback SELECT ilike sur zone_match + aliases ──────────────
  // L'index GIN trigram (déjà en place selon AJNAYA_STATE.md §3) est utilisé
  // automatiquement par PostgreSQL sur les ILIKE %q% si l'extension pg_trgm est
  // active sur la colonne.
  try {
    const pattern = `%${q}%`
    // 1. Match direct sur zone_match
    const { data: directMatches } = await sb
      .from('zones_canonical')
      .select('zone_match, aliases')
      .ilike('zone_match', pattern)
      .order('zone_match', { ascending: true })
      .limit(limit)

    // 2. Match sur aliases (jsonb/text array → contains text or any element ilike)
    // Supabase REST ne supporte pas un "any element ilike" natif facile, donc on
    // fait un select large (max 200 zones) et on filtre côté Node.
    let aliasMatches: ZoneRow[] = []
    const directNames = new Set((directMatches ?? []).map((r) => r.zone_match))
    if ((directMatches?.length ?? 0) < limit) {
      const { data: allZones } = await sb
        .from('zones_canonical')
        .select('zone_match, aliases')
        .not('aliases', 'is', null)
        .limit(200)

      const lowerQ = q.toLowerCase()
      aliasMatches = (allZones ?? [])
        .filter((row: ZoneRow) =>
          !directNames.has(row.zone_match) &&
          Array.isArray(row.aliases) &&
          row.aliases.some((a: string) => a.toLowerCase().includes(lowerQ)),
        )
        .slice(0, limit - (directMatches?.length ?? 0))
    }

    const suggestions: ZoneSuggestion[] = [
      ...(directMatches ?? []).map((row: ZoneRow) => ({
        zone_match: row.zone_match,
        matched_on: 'zone_match' as const,
        aliases: row.aliases ?? undefined,
        // Score : 1.0 si match exact (case-insensitive), sinon 0.7
        score: row.zone_match.toLowerCase() === q.toLowerCase() ? 1.0 : 0.7,
      })),
      ...aliasMatches.map((row: ZoneRow) => ({
        zone_match: row.zone_match,
        matched_on: 'alias' as const,
        aliases: row.aliases ?? undefined,
        score: 0.6,
      })),
    ]

    suggestions.sort((a, b) => b.score - a.score)

    return NextResponse.json(
      { suggestions: suggestions.slice(0, limit), source: 'select_fallback' },
      {
        headers: {
          'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=86400',
        },
      },
    )
  } catch {
    return NextResponse.json({ suggestions: [], source: 'error' }, { status: 503 })
  }
}

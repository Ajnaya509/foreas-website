import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { findNearestZone } from '@/lib/zoneCentroids'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/home/zone-by-coords?lat=X&lng=Y
 *
 * Pin live du chauffeur → zone canonique + stats Pieuvre.
 *
 * Pipeline :
 *  1. Validation des coords (number, range valide)
 *  2. Haversine local sur les centroïdes MVP → zone la plus proche
 *  3. Appel RPC `get_zone_stats(zone_match.name)` côté Pieuvre
 *  4. Augmentation : ajout `distance_km` et `in_range` pour que le client
 *     affiche un message UX type "vous êtes à 2,4 km de La Défense"
 *
 * Si la position est hors-rayon de TOUTES les zones MVP, on renvoie
 * quand même la zone la plus proche en `fallback_zone` avec note explicite.
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
  fallback_zone: { name: string; avg_hourly: number; note?: string } | null
}

interface ZoneByCoordsResponse extends ZoneStats {
  /** Distance en km entre la position fournie et le centroïde de la zone */
  distance_km: number
  /** True si la position est à l'intérieur du radius_km de la zone */
  in_range: boolean
}

function getCurrentWeekISO(): string {
  const now = new Date()
  const year = now.getUTCFullYear()
  const oneJan = new Date(Date.UTC(year, 0, 1))
  const numberOfDays = Math.floor(
    (now.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000),
  )
  const week = Math.ceil((numberOfDays + oneJan.getUTCDay() + 1) / 7)
  return `${year}-W${String(week).padStart(2, '0')}`
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const latRaw = searchParams.get('lat')
  const lngRaw = searchParams.get('lng')

  const lat = latRaw !== null ? Number(latRaw) : NaN
  const lng = lngRaw !== null ? Number(lngRaw) : NaN

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return NextResponse.json(
      { error: 'invalid_coords' },
      { status: 400 },
    )
  }

  // ─── 1. Match local (haversine sur centroïdes MVP) ────────────────────────
  const match = findNearestZone(lat, lng)
  if (!match) {
    return NextResponse.json({ error: 'no_zone_found' }, { status: 404 })
  }

  const { zone, distance_km, in_range } = match

  // ─── 2. Appel RPC Supabase pour les stats ─────────────────────────────────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY

  let stats: ZoneStats = {
    zone_match: zone.name,
    avg_hourly: 0,
    demand_delta_pct: 0,
    top_pool: '',
    courses_count: 0,
    week_iso: getCurrentWeekISO(),
    last_updated: new Date().toISOString(),
    has_data: false,
    fallback_zone: in_range
      ? null
      : {
          name: zone.name,
          avg_hourly: 0,
          note: `Vous êtes à ${distance_km} km de la zone — déplacez-vous ou explorez une autre zone.`,
        },
  }

  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false },
      })
      const { data, error } = await supabase.rpc('get_zone_stats', {
        zone_input: zone.name,
      })
      if (!error && Array.isArray(data) && data.length > 0) {
        const row = data[0]
        stats = {
          zone_match: row.zone_match ?? zone.name,
          avg_hourly: Number(row.avg_hourly ?? 0),
          demand_delta_pct: Number(row.demand_delta_pct ?? 0),
          top_pool: row.top_pool ?? '',
          courses_count: Number(row.courses_count ?? 0),
          week_iso: row.week_iso ?? getCurrentWeekISO(),
          last_updated: row.last_updated ?? new Date().toISOString(),
          has_data: Boolean(row.has_data),
          fallback_zone: row.fallback_zone ?? stats.fallback_zone,
        }
      }
    } catch {
      // Reste sur les valeurs par défaut — la position est valide, juste pas de stats
    }
  }

  const response: ZoneByCoordsResponse = {
    ...stats,
    distance_km,
    in_range,
  }

  return NextResponse.json(response)
}

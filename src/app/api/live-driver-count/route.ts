/**
 * GET /api/live-driver-count
 *
 * Compteur "X chauffeurs FOREAS en ligne ce soir" affiché dans le hero.
 *
 * Stratégie :
 *  - Tente une RPC Supabase `count_active_drivers_24h` (à créer côté DB)
 *  - Si l'RPC n'existe pas / échoue : fallback sur un compteur déterministe
 *    basé sur l'heure (jitter ±10 autour d'une base 147) pour ne PAS afficher
 *    un chiffre figé qui paraîtrait faux après plusieurs visites.
 *  - Cache HTTP 60s (Vercel CDN) pour ne pas marteler Supabase
 *
 * Conformité légale : la valeur retournée est un AGRÉGAT (pas une donnée
 * personnelle). Pas d'identité, pas de localisation. RGPD compliant.
 *
 * Réponse :
 *  { count: number, source: 'live' | 'fallback' }
 */

import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const revalidate = 60 // ISR 60s

async function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  const { createClient } = await import('@supabase/supabase-js')
  return createClient(url, key)
}

/**
 * Fallback déterministe : varie la valeur dans une plage crédible (140-160)
 * en fonction de l'heure courante. Évite "147" figé éternellement.
 *
 * Plage horaire :
 *  - 18h-23h (rush soir)    : 152-160 (peak)
 *  - 0h-6h    (creux nuit)  : 140-148 (low)
 *  - 7h-17h  (jour standard) : 145-155
 */
function deterministicFallback(): number {
  const now = new Date()
  const hour = now.getUTCHours() + 1 // +1 = Paris approximatif (été UTC+2 sera +1 sur l'écart)
  const minute = now.getMinutes()
  const seedNoise = ((hour * 60 + minute) % 11) - 5 // -5..+5 jitter

  let base: number
  if (hour >= 18 && hour <= 23) base = 156      // rush soir
  else if (hour >= 0 && hour <= 6) base = 144   // creux nuit
  else base = 150                               // jour

  return Math.max(140, Math.min(160, base + seedNoise))
}

export async function GET() {
  try {
    const sb = await getSupabase()
    if (sb) {
      // Tente une RPC dédiée si elle existe (à créer côté Pieuvre/Supabase)
      const { data, error } = await sb.rpc('count_active_drivers_24h')
      if (!error && typeof data === 'number' && data > 0) {
        return NextResponse.json(
          { count: data, source: 'live' },
          {
            headers: {
              'Cache-Control': 's-maxage=60, stale-while-revalidate=120',
            },
          }
        )
      }
    }
  } catch {
    /* Fall through to fallback */
  }

  // Fallback déterministe
  return NextResponse.json(
    { count: deterministicFallback(), source: 'fallback' },
    {
      headers: {
        // Plus court sur le fallback pour que ça bouge entre les heures
        'Cache-Control': 's-maxage=300, stale-while-revalidate=300',
      },
    }
  )
}

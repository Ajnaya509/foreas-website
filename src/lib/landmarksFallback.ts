/**
 * landmarksFallback.ts — POIs hardcodés site-side pour les zones critiques.
 *
 * Si la RPC Supabase `get_zone_landmarks(zone_input)` n'est pas encore créée
 * côté Pieuvre (brief PIEUVRE_ZONE_LANDMARKS_BRIEF en cours de propagation),
 * on injecte ici un fallback minimal pour les zones les plus visitées.
 *
 * Rétrocompatible : dès que la RPC retourne ≥ 1 row, le résultat de l'RPC
 * supplante ce fallback (cf. `getZoneData()` dans `/api/ajnaya/home-modal/route.ts`).
 *
 * À retirer dès que le seed Pieuvre couvre toutes ces zones.
 */

import type { ZoneLandmark } from '@/app/api/ajnaya/home-modal/route'

const FALLBACK: Record<string, ZoneLandmark[]> = {
  'Aéroport CDG': [
    { name: 'Terminal 1',  type: 'hub', vibe: 'transit', rank: 0 },
    { name: 'Terminal 2E', type: 'hub', vibe: 'transit', rank: 1 },
    { name: 'Terminal 2F', type: 'hub', vibe: 'transit', rank: 2 },
  ],
  'Aéroport Orly': [
    { name: 'Orly Ouest', type: 'hub', vibe: 'transit', rank: 0 },
    { name: 'Orly Sud',   type: 'hub', vibe: 'transit', rank: 1 },
  ],
  'Marne-la-Vallée': [
    { name: 'Disneyland Park',     type: 'place', vibe: 'tourist',   rank: 0 },
    { name: 'Walt Disney Studios', type: 'place', vibe: 'tourist',   rank: 1 },
    { name: 'Disney Village',      type: 'place', vibe: 'nightlife', rank: 2 },
  ],
  'La Défense': [
    { name: 'Grande Arche', type: 'monument', vibe: 'business', rank: 0 },
    { name: 'CNIT',         type: 'place',    vibe: 'business', rank: 1 },
  ],
  'Bercy': [
    { name: 'AccorHotels Arena',  type: 'salle', vibe: 'events',  rank: 0 },
    { name: 'Cour Saint-Émilion', type: 'place', vibe: 'transit', rank: 1 },
  ],
  'Paris 12ᵉ': [
    { name: 'Gare de Lyon',      type: 'gare',  vibe: 'transit', rank: 0 },
    { name: 'AccorHotels Arena', type: 'salle', vibe: 'events',  rank: 1 },
  ],
  'Lyon Part-Dieu': [
    { name: 'Gare Lyon Part-Dieu', type: 'gare', vibe: 'transit', rank: 0 },
  ],
  'Bordeaux Saint-Jean': [
    { name: 'Gare Saint-Jean', type: 'gare', vibe: 'transit', rank: 0 },
  ],
}

/**
 * Lookup case-insensitive avec quelques alias courants ("CDG", "Roissy"…).
 */
export function getLandmarksFallback(zoneMatch: string | null | undefined): ZoneLandmark[] | null {
  if (!zoneMatch) return null
  const z = zoneMatch.trim()

  // Lookup direct
  if (FALLBACK[z]) return FALLBACK[z]

  // Aliases courants
  const lower = z.toLowerCase()
  if (lower.includes('cdg') || lower.includes('roissy') || lower.includes('charles de gaulle')) {
    return FALLBACK['Aéroport CDG']
  }
  if (lower.includes('orly')) return FALLBACK['Aéroport Orly']
  if (lower.includes('disney') || lower.includes('marne')) return FALLBACK['Marne-la-Vallée']
  if (lower.includes('défense') || lower.includes('defense')) return FALLBACK['La Défense']
  if (lower.includes('bercy')) return FALLBACK['Bercy']

  return null
}

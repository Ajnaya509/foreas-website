/**
 * zoneCentroids — coordonnées des zones canoniques FOREAS
 *
 * Source : MVP local en attendant que la Pieuvre livre la table `zones_canoniques`
 * avec colonnes (slug, name, lat, lng, radius_km) — voir AJNAYA_CONTRACTS.md §11bis.
 *
 * Utilisé par /api/home/zone-by-coords pour matcher la position GPS d'un chauffeur
 * à la zone canonique la plus proche (haversine), puis appeler get_zone_stats().
 *
 * Précision : centroïdes choisis sur les pools VTC réels (parking T1 CDG, parvis
 * Belcier Bordeaux, sortie Vivier-Merle Part-Dieu, etc.) — pas le centre géo brut.
 */

export interface ZoneCentroid {
  /** Slug interne (= clé du fallback mocks dans /api/home/zone-stats) */
  slug: string
  /** Nom canonique tel que renvoyé par la RPC get_zone_stats */
  name: string
  /** Latitude en degrés décimaux (WGS84) */
  lat: number
  /** Longitude en degrés décimaux (WGS84) */
  lng: number
  /** Rayon de couverture en km — au-delà la zone n'est plus considérée pertinente */
  radius_km: number
}

/**
 * Liste MVP — 12 zones canoniques avec leur centroïde pool VTC.
 * À enrichir vers les 51 zones livrées par Pieuvre (table zones_canoniques).
 */
export const ZONE_CENTROIDS: ZoneCentroid[] = [
  // ─── Aéroports Île-de-France ──────────────────────────────────────────
  { slug: 'cdg', name: 'Aéroport CDG', lat: 49.0097, lng: 2.5479, radius_km: 12 },
  { slug: 'orly', name: 'Aéroport Orly', lat: 48.7233, lng: 2.3794, radius_km: 8 },

  // ─── Hubs business Paris ──────────────────────────────────────────────
  { slug: 'defense', name: 'La Défense', lat: 48.8924, lng: 2.2369, radius_km: 3 },
  { slug: 'bercy', name: 'Bercy / Gare de Lyon', lat: 48.8443, lng: 2.3743, radius_km: 2.5 },
  { slug: 'chatelet', name: 'Châtelet — Les Halles', lat: 48.8584, lng: 2.3470, radius_km: 2 },
  { slug: 'gare-nord', name: 'Gare du Nord', lat: 48.8809, lng: 2.3553, radius_km: 1.5 },
  { slug: 'saint-lazare', name: 'Saint-Lazare', lat: 48.8757, lng: 2.3251, radius_km: 1.5 },
  { slug: 'montparnasse', name: 'Montparnasse', lat: 48.8400, lng: 2.3209, radius_km: 2 },
  { slug: 'italie', name: "Place d'Italie", lat: 48.8312, lng: 2.3556, radius_km: 2 },
  { slug: 'mlv-disney', name: 'Marne-la-Vallée (Disney)', lat: 48.8722, lng: 2.7833, radius_km: 5 },

  // ─── Régions ──────────────────────────────────────────────────────────
  { slug: 'partdieu', name: 'Lyon Part-Dieu', lat: 45.7605, lng: 4.8595, radius_km: 4 },
  { slug: 'bordeauxgare', name: 'Bordeaux Saint-Jean', lat: 44.8268, lng: -0.5562, radius_km: 3 },
]

/**
 * Calcule la distance Haversine entre deux points en kilomètres.
 * Formule sphérique (suffisante < 1000 km, erreur < 0.5%).
 */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371 // Rayon Terre en km
  const toRad = (deg: number) => (deg * Math.PI) / 180

  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2

  return 2 * R * Math.asin(Math.sqrt(a))
}

/**
 * Trouve la zone canonique la plus proche d'un point GPS donné.
 *
 * @returns la zone trouvée + distance en km, ou null si aucune zone < radius_km.
 *          On retourne aussi la zone la plus proche même si hors-rayon (pour
 *          permettre un message UX type "vous êtes à 23 km de la Défense").
 */
export function findNearestZone(
  lat: number,
  lng: number,
): { zone: ZoneCentroid; distance_km: number; in_range: boolean } | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

  let nearest: ZoneCentroid | null = null
  let minDist = Infinity

  for (const z of ZONE_CENTROIDS) {
    const d = haversineKm(lat, lng, z.lat, z.lng)
    if (d < minDist) {
      minDist = d
      nearest = z
    }
  }

  if (!nearest) return null

  return {
    zone: nearest,
    distance_km: Math.round(minDist * 10) / 10,
    in_range: minDist <= nearest.radius_km,
  }
}

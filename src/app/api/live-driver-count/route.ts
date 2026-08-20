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
// ── 20/08/2026 — PLUS DE REPLI SILENCIEUX VERS LA CLÉ PUBLIQUE ──────────────
// Cette route retombait sur la clé publique quand la clé serveur manquait.
// Le jour d'une rotation de clé, ce `||` ne produit AUCUNE erreur : la route se
// met à lire avec les droits d'un visiteur anonyme, en silence. Une panne
// bruyante se répare ; une dégradation silencieuse s'installe.
// Le client vient maintenant de src/lib/supabaseServeur.ts, qui refuse plutôt
// que de dégrader.
import { clientServeurOuNull } from '@/lib/supabaseServeur'

export const runtime = 'nodejs'
export const revalidate = 60 // ISR 60s

async function getSupabase() {
  return clientServeurOuNull()
}

/**
 * ⚠️ 20/08/2026 — LA FABRIQUE DE FAUX COMPTEUR A ÉTÉ RETIRÉE.
 *
 * Cette route contenait une fonction `deterministicFallback()` qui INVENTAIT un
 * nombre de chauffeurs « crédible » entre 140 et 160, variant selon l'heure —
 * son propre commentaire disait « évite que 147 reste figé éternellement ».
 *
 * C'est la machine qui produisait le « 147 chauffeurs actifs ce soir » retiré du
 * site le 14/08 pour la raison exacte qu'il était inventé. La phrase avait été
 * retirée ; la fabrique, elle, tournait encore.
 *
 * Vérifié avant de la retirer : AUCUNE page n'affiche cette route. Personne ne
 * ment aujourd'hui à cause d'elle. Mais un nombre plausible disponible à l'appel
 * finit toujours par être branché quelque part, et personne ne se souviendra
 * qu'il était fabriqué.
 *
 * Ce qu'elle rend maintenant : la vérité. `indisponible` quand la mesure
 * n'existe pas — c'est un des trois états de src/lib/provenance.ts, et le seul
 * honnête ici. La fonction `count_active_drivers_24h` n'existe pas en base.
 */

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

  // Aucune mesure : on le DIT. On n'invente pas un nombre plausible.
  // `indisponible` est l'un des trois états de src/lib/provenance.ts, et le
  // seul honnête ici : la fonction count_active_drivers_24h n'existe pas en base.
  return NextResponse.json(
    { count: null, source: 'indisponible' },
    { headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=300' } },
  )
}

import { NextResponse } from 'next/server'
import { deduireProvenance, type Provenance } from '@/lib/provenance'
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
  /** D'où vient ce chiffre (src/lib/provenance.ts). Jamais absent. */
  provenance: Provenance
  /** Zone de repli suggérée par la RPC (quand has_data=false).
   *  note est un message optionnel libre (ex: "zone voisine la plus proche") */
  fallback_zone: { name: string; avg_hourly: number; note?: string } | null
}

// ─── SUPPRIMÉ LE 14/08/2026 : NEUF ZONES DE CHIFFRES INVENTÉS ───────────────
//
// Ce fichier contenait un `ZONES_MOCK_FALLBACK` de 9 zones aux valeurs fabriquées
// (CDG 41,80 €/h · 47 courses · +38 % de demande, Orly 38,40 €/h, La Défense
// 36,20 €/h, Bercy, Part-Dieu, Bordeaux…) renvoyées avec `has_data: true` et une
// date « mise à jour à l'instant » — donc présentées au chauffeur comme des
// données mesurées, alors qu'elles n'étaient reliées à rien.
//
// Elles ne sortaient PAS en production le jour du constat : la base répondait,
// avec des zéros honnêtes. Mais elles étaient ARMÉES — deux `catch` muets y
// menaient au premier hoquet réseau, à la première erreur de droits, au premier
// quota dépassé. Et personne ne l'aurait remarqué : la page aurait eu l'air
// MEILLEURE que d'habitude.
//
// NE PAS LES REMETTRE au nom de la « résilience ». La règle est dans
// src/lib/provenance.ts : quand on ne sait pas, on le dit. Un repli qui
// fabrique une valeur crédible est pire qu'une panne visible — la panne se
// répare, le mensonge plausible s'installe.

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

  // ─── Lecture réelle en base ───────────────────────────────────────────────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  // ── 20/08/2026 — MOINDRE PRIVILÈGE, ASSUMÉ ────────────────────────────
  // Cette route lit des données de ZONE : publiques par nature, aucune donnée
  // personnelle. Elle n'a donc besoin que de la clé publique. La porte de
  // sortie vers la clé serveur a été RETIRÉE : une route qui peut monter en
  // droits finit toujours par le faire, et personne ne s'en aperçoit.
  // Si elle échoue, c'est que la clé publique manque — et c'est visible.
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  /** Pourquoi on n'a pas pu répondre — journalisé, jamais renvoyé au visiteur. */
  let motifEchec: string | null = null

  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false },
      })

      const { data, error } = await supabase.rpc('get_zone_stats', {
        zone_input: zoneInput,
      })

      if (error) {
        // ⚠️ Ce `catch` était MUET avant le 14/08/2026 : l'erreur disparaissait et
        // la route servait des chiffres inventés à la place. Une lecture refusée
        // par les droits (RLS) renvoie zéro ligne EN SILENCE — indistinguable
        // d'une zone réellement vide. On nomme donc la cause, toujours.
        motifEchec = `rpc_error:${error.code ?? '?'}:${error.message}`
      } else if (Array.isArray(data) && data.length > 0) {
        const row = data[0]
        const aDesDonnees = Boolean(row.has_data)
        const zoneDeRepli = row.fallback_zone ?? null
        const stats: ZoneStats = {
          zone_match: row.zone_match ?? zoneInput,
          avg_hourly: Number(row.avg_hourly ?? 0),
          demand_delta_pct: Number(row.demand_delta_pct ?? 0),
          top_pool: row.top_pool ?? '',
          courses_count: Number(row.courses_count ?? 0),
          week_iso: row.week_iso ?? getCurrentWeekISO(),
          last_updated: row.last_updated ?? new Date().toISOString(),
          has_data: aDesDonnees,
          provenance: deduireProvenance({ aDesDonnees, zoneDeRepli }),
          fallback_zone: zoneDeRepli,
        }
        return NextResponse.json(stats, { headers: { 'Cache-Control': 'no-store' } })
      } else {
        motifEchec = 'rpc_vide'
      }
    } catch (e) {
      motifEchec = `exception:${(e as Error).message}`
    }
  } else {
    motifEchec = 'config_supabase_absente'
  }

  // ─── On ne sait pas. On le DIT. ───────────────────────────────────────────
  //
  // Ici se trouvaient NEUF ZONES DE CHIFFRES INVENTÉS (CDG 41,80 €/h,
  // Orly 38,40 €/h, La Défense 36,20 €/h…), renvoyées avec `has_data: true`,
  // un nombre de courses et une date « à l'instant » — donc présentées comme
  // des données mesurées. Elles ne sortaient pas ce jour-là, mais elles étaient
  // ARMÉES : le moindre hoquet de base y menait, et personne ne l'aurait vu,
  // parce que la page aurait eu l'air MEILLEURE que d'habitude.
  //
  // Un repli qui fabrique une valeur crédible est pire qu'une panne visible :
  // la panne se répare, le mensonge plausible s'installe.
  console.warn('[zone-stats] pas de donnée pour', zoneInput, '·', motifEchec)

  const sansDonnee: ZoneStats = {
    zone_match: zoneInput,
    avg_hourly: 0,
    demand_delta_pct: 0,
    top_pool: '',
    courses_count: 0,
    week_iso: getCurrentWeekISO(),
    last_updated: new Date().toISOString(),
    has_data: false,
    provenance: 'indisponible',
    // ⚠️ Ici vivait `FALLBACK_DEFAULT = { name: 'Aéroport CDG', avg_hourly: 41.8 }` :
    // quand une zone n'avait pas de donnée, le site suggérait au chauffeur d'aller
    // à CDG « où ça paie 41,80 €/h » — un chiffre inventé, comme les neuf autres.
    // Suggérer une zone de repli n'a de sens que si son tarif est MESURÉ. Il ne
    // l'est pas. Donc : rien. On ne comble pas un vide avec du plausible.
    fallback_zone: null,
  }
  return NextResponse.json(sansDonnee, { headers: { 'Cache-Control': 'no-store' } })
}

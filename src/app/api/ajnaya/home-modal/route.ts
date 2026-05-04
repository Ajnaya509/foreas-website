/**
 * POST /api/ajnaya/home-modal
 * Endpoint dédié au modal Ajnaya de la home page.
 *
 * Flow :
 *  1. Turn 1 — zone query → fetch get_zone_intelligence + call Pieuvre Brain
 *  2. Turn 2 — créneau    → Pieuvre Brain avec zone context + inject social proof
 *  3. Turn 3 — WA push    → Pieuvre closes + inject video promise
 *
 * Pieuvre attendu : tentacle='widget_site', metadata_source='home_modal_v1'
 * → N8N entry_widget_site route vers home_search_v1_zone_query script
 *
 * Fallback : Haiku direct avec prompt sales-grade si Pieuvre down
 *
 * Site2026v73 — connect Pieuvre Brain + ElevenLabs v3 ready
 */

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const runtime = 'nodejs'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ZoneData {
  zone_match: string
  avg_hourly: number
  demand_delta_pct: number
  top_pool: string
  courses_count: number
  week_iso: string
  has_data: boolean
  last_updated?: string
  fallback_zone?: { name: string; avg_hourly: number; note?: string } | null
}

export interface Testimonial {
  name: string
  zone: string
  quote: string
  kpi?: string
  vehicle?: string
  mux_id?: string
}

// ─── Real testimonials from TESTIMONIALS.md ──────────────────────────────────
// Source : /FOREAS site vitrine/docs/testimonials/TESTIMONIALS.md
const TESTIMONIALS: Testimonial[] = [
  {
    name: 'Binate A.',
    zone: 'Disneyland',
    quote: 'Travaille moins pour avoir plus. C\'est ça la différence.',
    kpi: '+30% revenus',
    vehicle: 'Tesla',
    mux_id: 'i9Bm4N9eyzCeQN1Ku7wutBb9yj7nUtr1pSrGJYQBfKI',
  },
  {
    name: 'Dragan P.',
    zone: 'Paris',
    quote: '2 ans sans problème de paiement. J\'y suis, j\'y reste.',
  },
  {
    name: 'Haitham B.',
    zone: 'Paris',
    quote: 'On a une réponse instantanément. Je me vois encore avec FOREAS pendant un long moment.',
  },
]

// ─── Supabase helper ──────────────────────────────────────────────────────────
async function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  const { createClient } = await import('@supabase/supabase-js')
  return createClient(url, key)
}

// ─── Fetch zone intelligence (try v3 first, fallback v2) ──────────────────────
async function getZoneData(zone: string): Promise<ZoneData | null> {
  try {
    const sb = await getSupabase()
    if (!sb) return null

    // Try get_zone_intelligence v3 (wrapper rétro-compat + signals slot)
    const { data: v3, error: e3 } = await sb.rpc('get_zone_intelligence', { zone_input: zone })
    if (!e3 && v3) return v3 as ZoneData

    // Fallback to get_zone_stats v2
    const { data: v2 } = await sb.rpc('get_zone_stats', { zone_input: zone })
    return (v2 as ZoneData) ?? null
  } catch {
    return null
  }
}

// ─── Record funnel event (fire and forget) ────────────────────────────────────
async function recordFunnelEvent(
  event: string,
  sessionId: string,
  meta: Record<string, unknown> = {}
) {
  try {
    const sb = await getSupabase()
    if (!sb) return
    await sb.rpc('record_funnel_event', {
      p_event_name: event,
      p_session_id: sessionId,
      p_canal: 'home_modal',
      p_metadata: meta,
    })
  } catch { /* silencieux */ }
}

// ─── Fallback system prompt (Pieuvre down) ────────────────────────────────────
function buildFallbackPrompt(zoneData: ZoneData | null, turn: number): string {
  const zoneBlock = zoneData?.has_data
    ? `DONNÉES ZONE RÉELLES :
Zone : ${zoneData.zone_match}
Tarif moyen : ${zoneData.avg_hourly.toFixed(0)}€/h
Demande : ${zoneData.demand_delta_pct > 0 ? '+' : ''}${zoneData.demand_delta_pct}% vs semaine dernière
Courses analysées : ${zoneData.courses_count} (données réelles VTC)
Zone de pickup top : ${zoneData.top_pool}`
    : zoneData?.fallback_zone
    ? `Zone proche de référence : ${zoneData.fallback_zone.name} → ${zoneData.fallback_zone.avg_hourly.toFixed(0)}€/h`
    : ''

  const testimonialBlock = `PREUVES RÉELLES (à injecter au bon moment) :
- Binate A. Tesla Disneyland : "+30% revenus. Travaille moins pour avoir plus."
- Dragan P. Paris 9 ans : "2 ans sans problème de paiement."
- Haitham B. Paris 7 ans : "On a une réponse instantanément."`

  const turnInstruction = turn === 1
    ? `Tour 1 : Tu viens de recevoir les données de la zone. Donne les chiffres EXACTS avec précision chirurgicale. Puis pose UNE question sur le créneau visé.`
    : turn === 2
    ? `Tour 2 : Le chauffeur a donné son créneau. Construis l'urgence : montre ce qu'il rate sans FOREAS sur ce créneau précis. Glisse un témoignage réel. Push vers WhatsApp naturellement.`
    : `Tour 3 : Maximum d'engagement. Promet le plan personnalisé via WhatsApp + la vidéo complète de Binate. Ferme vers le bouton vert.`

  return `Tu es Ajnaya. Confidente des chauffeurs VTC — pas une IA, jamais "je suis une IA".

${zoneBlock}

${testimonialBlock}

${turnInstruction}

RÈGLES ABSOLUES :
- 2-3 phrases maximum. Direct. Comme un SMS d'un pote qui connaît le terrain.
- Utilise les chiffres EXACTS de la zone si disponibles — pas de vagueries.
- Ne dis JAMAIS "FOREAS" dans les tours 1-2. Parle de "votre zone", "ce créneau", "vos chiffres".
- Le but de chaque message : avancer d'un cran vers le WhatsApp.
- Tutoyez toujours. Jamais condescendant.
- Audio tags autorisés UNE FOIS par message max : [sighs] [hmm] [laughs softly] — uniquement en début de phrase si pertinent.`
}

// ─── Strip markdown for TTS ───────────────────────────────────────────────────
function cleanForTTS(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // [text](url) → text
    .replace(/📍|🎬|👥|✅|❌|🎁|📱/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/ajnaya/home-modal
// ═══════════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      message,
      session_id = `home-modal-${Date.now()}`,
      turn = 1,
      zone_data: clientZoneData = null,
      identity_id = null,
    } = body as {
      message: string
      session_id?: string
      turn?: 1 | 2 | 3
      zone_data?: ZoneData | null
      identity_id?: string | null
    }

    if (!message?.trim()) {
      return NextResponse.json({ error: 'message requis' }, { status: 400 })
    }

    // 1. Fetch zone data on turn 1
    let resolvedZoneData: ZoneData | null = clientZoneData
    if (turn === 1) {
      resolvedZoneData = await getZoneData(message)
      // Fire funnel event (fire-and-forget)
      recordFunnelEvent('home_modal_zone_queried', session_id, {
        zone_query: message,
        has_data: resolvedZoneData?.has_data ?? false,
        zone_match: resolvedZoneData?.zone_match,
      })
    } else if (turn === 2) {
      recordFunnelEvent('home_modal_creneau_given', session_id, {
        creneau: message,
        zone: resolvedZoneData?.zone_match,
      })
    }

    // 2. Try Pieuvre Brain
    let text: string | null = null
    let pieuvreIdentityId: string | null = null

    if (process.env.PIEUVRE_BRAIN_ENABLED === 'true') {
      try {
        const { callPieuvreBrain } = await import('@/lib/pieuvre-client')

        // Extended context: inject zone_data + metadata_source for N8N routing
        const extendedContext = {
          page_source: '/home_modal',
          scroll_section: 'hero',
          heat_score: turn * 18, // 18 / 36 / 54 selon turn
          history_last_10: [],
          // These fields are read by entry_widget_site N8N workflow
          // pour router vers home_search_v1_zone_query script
          metadata_source: 'home_modal_v1',
          turn,
          zone_data: resolvedZoneData,
        } as Parameters<typeof callPieuvreBrain>[0]['context']

        const result = await callPieuvreBrain({
          tentacle: 'widget_site',
          canal: 'web',
          identity_id: identity_id,
          session_id,
          message: { role: 'user', text: message, type: 'text' },
          context: extendedContext,
          meta: { device: 'web', utm: {}, user_agent: '' },
        })

        if (result?.reply?.text) {
          text = result.reply.text
          pieuvreIdentityId = result.identity_id ?? null
        }
      } catch (err) {
        console.warn('[home-modal] Pieuvre error, falling back:', (err as Error).message)
      }
    }

    // 3. Fallback — Haiku direct avec prompt sales-grade
    if (!text) {
      const apiKey = process.env.FOREAS_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY
      if (!apiKey) {
        return NextResponse.json(
          { error: 'Service temporairement indisponible' },
          { status: 503 }
        )
      }

      const anthropic = new Anthropic({ apiKey })
      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 180,
        temperature: 0.6,
        system: buildFallbackPrompt(resolvedZoneData, turn),
        messages: [{ role: 'user', content: message }],
      })
      text = response.content[0]?.type === 'text'
        ? response.content[0].text
        : 'Dites-moi votre zone exacte — je regarde les chiffres.'
    }

    // 4. Generate TTS-clean version
    const tts_text = cleanForTTS(text)

    // 5. Determine next turn + show social proof
    const turn_next: 1 | 2 | 3 = turn === 1 ? 2 : turn === 2 ? 3 : 3
    const show_wa_cta = turn >= 2

    // Social proof injected on turn 2+
    const testimonials = turn >= 2 ? TESTIMONIALS : null

    return NextResponse.json({
      text,
      tts_text,
      zone_data: resolvedZoneData,
      show_wa_cta,
      turn_next,
      testimonials,
      identity_id: pieuvreIdentityId ?? identity_id,
    })
  } catch (error) {
    console.error('[home-modal] Error:', (error as Error).message)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 503 })
  }
}

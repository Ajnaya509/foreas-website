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

export interface ZoneLandmark {
  name: string
  type: string
  vibe?: string | null
  rank: number
}

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
  landmarks?: ZoneLandmark[] // CONTRACTS v1.7 — Brief PIEUVRE_ZONE_LANDMARKS_BRIEF
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
//
// IMPORTANT — chaque témoignage cible un CONTEXTE précis. Le matching
// `pickTestimonialsForZone` ci-dessous évite de pousser Binate (Disneyland Tesla)
// à un chauffeur qui demande Bordeaux ou Lyon. Hors-contexte = perte de crédibilité.
const TESTIMONIAL_BINATE: Testimonial = {
  name: 'Binate A.',
  zone: 'Disneyland',
  quote: 'Travaille moins pour avoir plus. C\'est ça la différence.',
  kpi: '+30% revenus',
  vehicle: 'Tesla',
  mux_id: 'i9Bm4N9eyzCeQN1Ku7wutBb9yj7nUtr1pSrGJYQBfKI',
}
const TESTIMONIAL_DRAGAN: Testimonial = {
  name: 'Dragan P.',
  zone: 'Paris',
  quote: '2 ans sans problème de paiement. J\'y suis, j\'y reste.',
}
const TESTIMONIAL_HAITHAM: Testimonial = {
  name: 'Haitham B.',
  zone: 'Paris',
  quote: 'On a une réponse instantanément.',
}

/**
 * Sélectionne 1-2 témoignages pertinents pour la zone matchée.
 *  - Disney/Marne-la-Vallée → Binate (lieu exact) + Dragan en backup
 *  - Paris (CDG, Défense, gares, Bercy, Italie…) → Dragan + Haitham
 *  - Régions hors IdF (Bordeaux, Lyon, Marseille…) → Dragan seul
 *    (NE PAS pousser Binate Disneyland à un chauffeur Bordeaux : hors-contexte = churn)
 *  - Zone inconnue / fallback → Dragan seul (le plus universel)
 */
function pickTestimonialsForZone(zone: string | null | undefined): Testimonial[] {
  const z = (zone ?? '').toLowerCase()
  if (!z) return [TESTIMONIAL_DRAGAN]

  if (z.includes('disney') || z.includes('marne')) {
    return [TESTIMONIAL_BINATE, TESTIMONIAL_DRAGAN]
  }

  // Île-de-France pools VTC standards
  const idfKeywords = ['cdg', 'orly', 'défense', 'defense', 'bercy', 'lyon', 'gare',
    'châtelet', 'chatelet', 'nord', 'lazare', 'montparnasse', 'italie', 'paris']
  // Note: "lyon" inclus pour "Gare de Lyon" Paris, MAIS si la zone est exactement
  // "Lyon Part-Dieu" on tombe dans la branche région ci-dessous via le check explicite.
  if (z.includes('lyon part-dieu') || z.includes('lyon partdieu')) {
    return [TESTIMONIAL_DRAGAN]
  }
  if (z.includes('bordeaux') || z.includes('marseille') || z.includes('toulouse') ||
      z.includes('nice') || z.includes('nantes') || z.includes('strasbourg') ||
      z.includes('rennes') || z.includes('lille')) {
    return [TESTIMONIAL_DRAGAN]
  }
  if (idfKeywords.some((k) => z.includes(k))) {
    return [TESTIMONIAL_DRAGAN, TESTIMONIAL_HAITHAM]
  }

  return [TESTIMONIAL_DRAGAN]
}

/**
 * Catégorise une zone pour les funnel events / fbq dimensions.
 * Aligné sur les buckets du brief Pieuvre PIEUVRE_HOME_MODAL_FIX.md §5.
 *  - "disney"  : Disney / Marne-la-Vallée
 *  - "idf"     : aéroports + gares + hubs Paris
 *  - "region"  : régions hors IdF (Bordeaux, Lyon Part-Dieu, Marseille…)
 *  - "unknown" : zone non matchée / fallback
 *
 * Sert de fallback côté site si Pieuvre ne renvoie pas `modal_zone_category`
 * (ex. Pieuvre down → fallback Haiku).
 */
function inferZoneCategory(zone: string | null | undefined): 'disney' | 'idf' | 'region' | 'unknown' {
  const z = (zone ?? '').toLowerCase()
  if (!z) return 'unknown'
  if (z.includes('disney') || z.includes('marne')) return 'disney'
  if (z.includes('lyon part-dieu') || z.includes('lyon partdieu')) return 'region'
  const regions = ['bordeaux', 'marseille', 'toulouse', 'nice', 'nantes',
    'strasbourg', 'rennes', 'lille']
  if (regions.some((k) => z.includes(k))) return 'region'
  const idfKeywords = ['cdg', 'orly', 'défense', 'defense', 'bercy', 'gare',
    'châtelet', 'chatelet', 'lazare', 'montparnasse', 'italie', 'paris', 'nord']
  if (idfKeywords.some((k) => z.includes(k))) return 'idf'
  return 'unknown'
}

/**
 * Détecte des stats incohérentes côté Pieuvre/Supabase et force `has_data: false`.
 * Évite d'afficher la card "31€/h · -100%" qui détruit la crédibilité.
 */
function sanitizeZoneData(z: ZoneData | null): ZoneData | null {
  if (!z) return null
  const absurd =
    z.avg_hourly < 5 ||                  // < 5€/h = donnée corrompue
    z.avg_hourly > 200 ||                // > 200€/h = donnée corrompue
    z.demand_delta_pct <= -90 ||         // -90%+ = imposible (= no-data déguisé)
    z.demand_delta_pct >= 200 ||         // +200%+ = imposible
    z.courses_count < 5                  // < 5 courses = échantillon non représentatif
  if (absurd) {
    return { ...z, has_data: false }
  }
  return z
}

// ─── Supabase helper ──────────────────────────────────────────────────────────
async function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  const { createClient } = await import('@supabase/supabase-js')
  return createClient(url, key)
}

// ─── Fetch zone intelligence + landmarks en parallèle ────────────────────────
// CONTRACTS v1.7 — On NE dépend PAS de Pieuvre pour récupérer les landmarks.
// Le site fait son propre RPC direct sur Supabase, en parallèle de zone_intelligence.
// → Zone-card affiche les POIs IMMÉDIATEMENT, même si Pieuvre N8N tarde à propager
//   le brief zone_landmarks (queue mode workers, cache prompt, etc.).
async function getZoneData(zone: string): Promise<ZoneData | null> {
  try {
    const sb = await getSupabase()
    if (!sb) return null

    // Brief PIEUVRE_ZONE_LANDMARKS_BRIEF — top 3 POIs ordonnés par rank.
    // Wrappé en async fn pour pouvoir try/catch (la RPC peut ne pas exister
    // tant que Pieuvre n'a pas appliqué la migration).
    const fetchLandmarks = async () => {
      try {
        const { data, error } = await sb.rpc('get_zone_landmarks', { zone_input: zone })
        if (error) return null
        return data as ZoneLandmark[] | null
      } catch {
        return null
      }
    }

    // Promise.all : 2 RPCs en parallèle = pas de latence ajoutée
    const [zoneRes, landmarksRes] = await Promise.all([
      // Try get_zone_intelligence v3 (wrapper rétro-compat + signals slot)
      sb.rpc('get_zone_intelligence', { zone_input: zone }),
      fetchLandmarks(),
    ])

    let zoneData: ZoneData | null = null
    if (!zoneRes.error && zoneRes.data) {
      zoneData = zoneRes.data as ZoneData
    } else {
      // Fallback get_zone_stats v2 (pas de landmarks dedans, mais zone OK)
      const { data: v2 } = await sb.rpc('get_zone_stats', { zone_input: zone })
      zoneData = (v2 as ZoneData) ?? null
    }

    // Merge landmarks (peut être null si RPC pas encore créée côté Pieuvre)
    if (zoneData && Array.isArray(landmarksRes) && landmarksRes.length > 0) {
      zoneData.landmarks = landmarksRes as ZoneData['landmarks']
    } else if (zoneData) {
      // Fallback hardcoded site (CDG / Orly / Disney / Défense / Bercy / Paris 12ᵉ…)
      // Comme ça le user voit "Terminal 1 · Terminal 2E" même si Pieuvre tarde à
      // propager le seed Wikidata.
      const { getLandmarksFallback } = await import('@/lib/landmarksFallback')
      const fb = getLandmarksFallback(zoneData.zone_match)
      if (fb && fb.length > 0) zoneData.landmarks = fb
    }

    return zoneData
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
    // RPC params : p_step_code / p_session_id / p_canal_source / p_zone_match / p_context
    await sb.rpc('record_funnel_event', {
      p_step_code:    event,
      p_step_label:   event,
      p_session_id:   sessionId,
      p_canal_source: 'home_modal',
      p_zone_match:   (meta.zone_match as string | undefined) ?? (meta.zone as string | undefined) ?? null,
      p_context:      meta,
    })
  } catch { /* silencieux — fire-and-forget */ }
}

// ─── Fallback system prompt (Pieuvre down) ────────────────────────────────────
function buildFallbackPrompt(zoneData: ZoneData | null, turn: number, userZone: string): string {
  const hasData = !!zoneData?.has_data
  const zoneName = zoneData?.zone_match ?? userZone

  // Bloc DATA — uniquement si on a des chiffres CRÉDIBLES
  const zoneBlock = hasData
    ? `DONNÉES ZONE RÉELLES (à utiliser littéralement) :
Zone : ${zoneData!.zone_match}
Tarif moyen : ${zoneData!.avg_hourly.toFixed(0)}€/h
Demande vs semaine dernière : ${zoneData!.demand_delta_pct > 0 ? '+' : ''}${zoneData!.demand_delta_pct}%
Courses analysées : ${zoneData!.courses_count}
Top pool : ${zoneData!.top_pool || 'multi-secteurs'}`
    : `PAS DE DONNÉES TEMPS RÉEL pour "${userZone}".
INTERDIT d'inventer un tarif horaire ou un % de demande.
COMPORTEMENT ATTENDU : reconnaître honnêtement qu'on n'a pas les chiffres précis pour CETTE zone à CET instant, et orienter vers WhatsApp pour un audit personnalisé en 2 minutes.`

  // Témoignages — matchés à la zone (pas de Binate Disneyland sur Bordeaux)
  const picks = pickTestimonialsForZone(zoneName)
  const testimonialBlock = `PREUVES PERTINENTES POUR CE CHAUFFEUR (à utiliser SI tour 2 ou 3) :
${picks.map((t) => `- ${t.name}${t.vehicle ? ` (${t.vehicle})` : ''} ${t.zone}${t.kpi ? ` · ${t.kpi}` : ''} : "${t.quote}"`).join('\n')}
INTERDIT : citer un témoignage hors-contexte (ex. Binate Disneyland Tesla pour un chauffeur qui demande Bordeaux).`

  const turnInstruction = turn === 1
    ? hasData
      ? `Tour 1 : Sors UNIQUEMENT les chiffres exacts en format SMS court. Format obligatoire : "Zone · X€/h · stable/+X%/-X%. Quel créneau ?" (max 12 mots TOTAL).`
      : `Tour 1 : 1 phrase max 8 mots qui dit qu'on n'a pas la data ce soir. Puis 1 question 4 mots max. Ex : "Pas de data temps réel ici. Aéroport, gare ou centre ?"`
    : turn === 2
    ? `Tour 2 : Si confusion ("pas compris", "?") → CHANGE d'angle, 1 phrase 5 mots max. Sinon → 1 phrase concrète + push WA. Max 15 mots TOTAL.`
    : `Tour 3 : Ferme en 2 phrases courtes. Ex : "Je vous envoie le plan sur WhatsApp. 2 minutes, sans inscription." Max 15 mots TOTAL.`

  return `Tu es Ajnaya. Confidente des chauffeurs VTC — pas une IA, jamais "je suis une IA".

${zoneBlock}

${testimonialBlock}

${turnInstruction}

RÈGLES ABSOLUES — VIOLATION = CHURN IMMÉDIAT :
1. PHRASES ULTRA-COURTES : max 5 mots par phrase. Pas de subordonnées. Style SMS.
2. SÉPARATEUR · au lieu de virgules ou "et". Ex : "CDG · 39€/h · stable. Quel créneau ?"
3. PAS de "FOREAS" Tour 1-2. Pas de bullshit corporate. Pas de "je vous propose…", "je peux vous…".
4. JAMAIS inventer un chiffre. Si pas de data → le dire en 5 mots max.
5. JAMAIS un -100% / -90% / +200% : si tu vois ça, tu dis "data indispo" point.
6. JAMAIS un témoignage hors-contexte (Tesla Disney pour Bordeaux = mort instantanée).
7. Si confusion ("pas compris") → CHANGE d'angle, ne répète pas. Reformule en 1 phrase 5 mots.
8. Tour 3 : pousse WhatsApp en 2 phrases SMS. Pas plus.
9. Vouvoie toujours. Jamais "tu". Jamais condescendant.
10. Chaque message = avancer d'un cran vers WhatsApp. Zéro blabla.`
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
      const raw = await getZoneData(message)
      // Guard contre stats absurdes (-100% demand, 0€/h, échantillon < 5 courses)
      resolvedZoneData = sanitizeZoneData(raw)
      // Fire funnel event (fire-and-forget)
      recordFunnelEvent('home_modal_zone_queried', session_id, {
        zone_query:    message,
        has_data:      resolvedZoneData?.has_data ?? false,
        zone_match:    resolvedZoneData?.zone_match,
        zone_category: inferZoneCategory(resolvedZoneData?.zone_match ?? message),
        sanitized:     raw && !resolvedZoneData?.has_data && raw.has_data ? true : false,
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
    // Champs enrichis par Pieuvre v1.1 (workflow entry_widget_site versionId 8a4c1439)
    let pieuvreClarifyBranch: boolean = false
    let pieuvreZoneCategory: 'disney' | 'idf' | 'region' | 'unknown' | null = null
    let pieuvreTtsText: string | null = null  // TTS clean Koraly — no emoji, numbers in words
    // Pieuvre v1.7 — zone landmarks (Brief PIEUVRE_ZONE_LANDMARKS_BRIEF)
    let pieuvreLandmarks: ZoneLandmark[] = []

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

        // Pieuvre v1.1 — tts_text séparé (clean: pas d'emoji, chiffres en lettres)
        pieuvreTtsText = result?.reply?.tts_text ?? null

        // Pieuvre v1.1 — signals home_modal à la racine de la réponse (pas dans reply.metadata)
        pieuvreClarifyBranch = Boolean(result?.clarify_branch_detected)
        const cat = result?.modal_zone_category
        if (cat === 'disney' || cat === 'idf' || cat === 'region' || cat === 'unknown') {
          pieuvreZoneCategory = cat
        }
        // Pieuvre v1.7 — landmarks (Brief PIEUVRE_ZONE_LANDMARKS) à la racine
        if (Array.isArray(result?.landmarks)) {
          pieuvreLandmarks = result.landmarks as ZoneLandmark[]
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
        system: buildFallbackPrompt(resolvedZoneData, turn, message),
        messages: [{ role: 'user', content: message }],
      })
      text = response.content[0]?.type === 'text'
        ? response.content[0].text
        : 'Dites-moi votre zone exacte — je regarde les chiffres.'
    }

    // 4. TTS-clean version — Pieuvre v1.1 fournit tts_text séparé (pas d'emoji, chiffres en lettres)
    // Fallback : cleanForTTS(text) si Pieuvre absent ou path Haiku direct
    const tts_text = pieuvreTtsText || cleanForTTS(text)

    // 5. Determine next turn + show social proof
    const turn_next: 1 | 2 | 3 = turn === 1 ? 2 : turn === 2 ? 3 : 3
    const show_wa_cta = turn >= 2

    // Social proof injected on turn 2+ — matché à la zone (pas de Binate Disneyland
    // à un chauffeur qui demande Bordeaux ; pas de Tesla à un chauffeur région).
    const testimonials = turn >= 2
      ? pickTestimonialsForZone(resolvedZoneData?.zone_match ?? message)
      : null

    // 6. Funnel events câblés post-Pieuvre v1.1 (brief PIEUVRE_HOME_MODAL_FIX.md §Métriques)
    const zoneCategory: 'disney' | 'idf' | 'region' | 'unknown' =
      pieuvreZoneCategory ?? inferZoneCategory(resolvedZoneData?.zone_match ?? message)

    // home_modal_clarify_branch : utilisateur en confusion ("j'ai pas compris")
    // → branche clarify activée, mesure la qualité du save côté Pieuvre.
    if (pieuvreClarifyBranch) {
      recordFunnelEvent('home_modal_clarify_branch', session_id, {
        turn,
        zone: resolvedZoneData?.zone_match,
        zone_category: zoneCategory,
        user_message_truncated: message.slice(0, 120),
      })
    }

    // home_modal_wa_push : CTA WhatsApp affiché (turn ≥ 2). Compté à chaque
    // affichage côté serveur — la dédup éventuelle se fait côté table funnel.
    if (show_wa_cta) {
      recordFunnelEvent('home_modal_wa_push', session_id, {
        turn,
        zone: resolvedZoneData?.zone_match,
        zone_category: zoneCategory,
        has_data: resolvedZoneData?.has_data ?? false,
        clarify_branch: pieuvreClarifyBranch,
      })
    }

    // CONTRACTS v1.7 — Merge landmarks : préfère Site fetch (Promise.all RPC direct
    // fait dans getZoneData), fallback sur pieuvreLandmarks (N8N) si Site fetch vide.
    // Évite de perdre les landmarks quand Pieuvre N8N tarde à propager le brief.
    const siteLandmarks = resolvedZoneData?.landmarks ?? []
    const finalLandmarks = siteLandmarks.length > 0 ? siteLandmarks : pieuvreLandmarks
    const zoneDataWithLandmarks = resolvedZoneData
      ? { ...resolvedZoneData, landmarks: finalLandmarks }
      : null

    return NextResponse.json({
      text,
      tts_text,
      zone_data: zoneDataWithLandmarks,
      show_wa_cta,
      turn_next,
      testimonials,
      identity_id: pieuvreIdentityId ?? identity_id,
      // Pieuvre v1.1 — exposés pour tracking client (Meta CAPI fbq dimensions)
      clarify_branch_detected: pieuvreClarifyBranch,
      modal_zone_category: zoneCategory,
      // CONTRACTS v1.7 — landmarks à la racine (compat futurs canaux)
      landmarks: finalLandmarks,
    })
  } catch (error) {
    console.error('[home-modal] Error:', (error as Error).message)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 503 })
  }
}

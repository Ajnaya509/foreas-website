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
  // v1.1 — RPC v2 enrichit avec image POI + lat/lng + center zone (Mapbox Static)
  image_url?: string | null
  image_attribution?: string | null
  lat?: number | null
  lng?: number | null
  center_lat?: number | null
  center_lng?: number | null
  zoom?: number | null
}

export interface ZoneData {
  zone_match: string
  avg_hourly: number
  demand_delta_pct: number
  top_pool: string
  courses_count: number
  week_iso: string
  has_data: boolean
  // True tant que les chiffres sont une estimation baseline (pas de trafic réel).
  // → la carte affiche "ESTIMATION" au lieu de "TEMPS RÉEL" (honnêteté = crédibilité).
  is_estimate?: boolean
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

    // Brief PIEUVRE_ZONE_LANDMARKS_BRIEF v1.1 — top 3 POIs avec image_url + center.
    // BYPASS supabase-js : REST direct (curl-style) marche mieux pour TABLE-returning RPCs
    // (le client JS avait un quirk avec v2 — fallback hardcoded déclenché à tort).
    const fetchLandmarks = async (): Promise<ZoneLandmark[] | null> => {
      const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (!supaUrl || !supaKey) return null
      try {
        const res = await fetch(`${supaUrl}/rest/v1/rpc/get_zone_landmarks_v2`, {
          method: 'POST',
          headers: {
            'apikey': supaKey,
            'Authorization': `Bearer ${supaKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ zone_input: zone }),
          // Edge cache : 1h (les POIs changent rarement)
          next: { revalidate: 3600 },
        })
        if (!res.ok) {
          // Fallback v1 (sans images mais zone OK)
          const r1 = await fetch(`${supaUrl}/rest/v1/rpc/get_zone_landmarks`, {
            method: 'POST',
            headers: {
              'apikey': supaKey,
              'Authorization': `Bearer ${supaKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ zone_input: zone }),
            next: { revalidate: 3600 },
          })
          if (!r1.ok) return null
          return (await r1.json()) as ZoneLandmark[]
        }
        return (await res.json()) as ZoneLandmark[]
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
    const fromIntelligence = !zoneRes.error && !!zoneRes.data
    if (fromIntelligence) {
      zoneData = zoneRes.data as ZoneData
    } else {
      // Fallback get_zone_stats v2 (pas de landmarks dedans, mais zone OK)
      const { data: v2 } = await sb.rpc('get_zone_stats', { zone_input: zone })
      zoneData = (v2 as ZoneData) ?? null
    }

    // Marqueur "estimation" : tant que les signaux temps réel (events/vols/trafic)
    // ne coulent pas, get_zone_intelligence renvoie _source='supabase_rpc_baseline'
    // + confidence < 1. On l'affiche honnêtement comme estimation, pas "RÉEL".
    if (zoneData) {
      const raw = zoneRes.data as { _source?: string; confidence?: number } | null
      zoneData.is_estimate = fromIntelligence
        ? raw?._source === 'supabase_rpc_baseline' ||
          (typeof raw?.confidence === 'number' && raw.confidence < 1)
        : true // fallback get_zone_stats → estimation par défaut
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

// ─── Résolution d'identité (anonyme dès le fingerprint) ───────────────────────
// Brief AJNAYA_FIX_TUNNEL_SITE_HOME_MODAL §Chantier B : rattacher CHAQUE funnel_event
// à une PERSONNE pour que le DG puisse relancer un lâcheur. resolve_identity(p_visitor_id)
// crée/résout une identité (user_type='anonymous') depuis le fingerprint + renvoie son id.
async function resolveIdentityId(opts: {
  identity_id: string | null
  visitor_id: string | null
  device_cookie_id: string | null
}): Promise<string | null> {
  // Déjà résolu côté client / tour précédent → on garde la même identité.
  if (opts.identity_id) return opts.identity_id
  // Sans aucune clé anonyme, ne PAS créer d'identité orpheline (non re-matchable).
  const key = opts.visitor_id || opts.device_cookie_id
  if (!key) return null
  try {
    const sb = await getSupabase()
    if (!sb) return null
    const { data } = await sb.rpc('resolve_identity', { p_visitor_id: key, p_canal: 'home_modal' })
    return (data as { identity_id?: string } | null)?.identity_id ?? null
  } catch {
    return null
  }
}

// ─── Record funnel event (fire and forget) ────────────────────────────────────
// identityId rattache l'événement à une PERSONNE (colonne identity_id, plus jamais NULL).
async function recordFunnelEvent(
  event: string,
  sessionId: string,
  identityId: string | null,
  meta: Record<string, unknown> = {}
) {
  try {
    const sb = await getSupabase()
    if (!sb) return
    await sb.rpc('record_funnel_event', {
      p_step_code:    event,
      p_step_label:   event,
      p_identity_id:  identityId,
      p_session_id:   sessionId,
      p_canal_source: 'home_modal',
      p_zone_input:   (meta.zone_query as string | undefined) ?? (meta.zone as string | undefined) ?? null,
      p_zone_match:   (meta.zone_match as string | undefined) ?? (meta.zone as string | undefined) ?? null,
      p_ab_variant:   (meta.ab_variant as string | undefined) ?? null,
      p_context:      meta,
    })
  } catch { /* silencieux — fire-and-forget */ }
}

// ─── Fallback system prompt (Pieuvre down) ────────────────────────────────────
function buildFallbackPrompt(zoneData: ZoneData | null, turn: number, userZone: string): string {
  const hasData = !!zoneData?.has_data
  const zoneName = zoneData?.zone_match ?? userZone

  // ─── v1.4-openloop FALLBACK (Haiku 4.5) — mirror du prompt Pieuvre v1.4 ─────
  // Principe : la zone-card AFFICHE déjà les chiffres (avg_hourly, %, top_pool,
  // photo POI, map). Le texte d'Ajnaya ne RÉPÈTE PAS la donnée — il la TRADUIT
  // en insight excitant + ouvre une boucle qui ne ferme que sur WhatsApp.
  // ────────────────────────────────────────────────────────────────────────────

  const zoneBlock = hasData
    ? `DATA INTERNE ZONE (RÉFÉRENCE CACHÉE — NE JAMAIS RÉPÉTER EN TEXT) :
Zone : ${zoneData!.zone_match}
Tarif moyen €/h : ${zoneData!.avg_hourly.toFixed(0)} (la card l'affiche déjà → INTERDIT en text)
Demande vs semaine : ${zoneData!.demand_delta_pct > 0 ? '+' : ''}${zoneData!.demand_delta_pct}% (INTERDIT en text)
Courses : ${zoneData!.courses_count} (INTERDIT en text)
Top pool : ${zoneData!.top_pool || 'multi-secteurs'} (INTERDIT en text)

→ Tu sais qu'il y a de la data. Traduis-la en insight émotionnel sans citer aucun chiffre.`
    : `PAS DE DATA TEMPS RÉEL pour "${userZone}".
INTERDIT d'inventer un tarif. Tu reconnais l'absence de data en 5 mots max,
puis tu ouvres une boucle audit perso WhatsApp.`

  const picks = pickTestimonialsForZone(zoneName)
  const testimonialBlock = picks.length > 0
    ? `PREUVES SOCIALES — ANONYMISÉES en text (jamais le prénom + montant exact) :
${picks.map((t) => `- ${t.name}${t.vehicle ? ` (${t.vehicle})` : ''} ${t.zone}${t.kpi ? ` · ${t.kpi}` : ''}`).join('\n')}
→ En text dis "un chauffeur" + traduction insight ("a fait sa journée en 5 courses",
"a doublé son tarif horaire", "évite le piège que 80% font").
JAMAIS le prénom + montant chiffré exact (= ferme la boucle).`
    : ''

  const turnInstruction = turn === 1
    ? hasData
      ? `Tour 1 : 3 segments séparés par · :
[Zone+contexte 5-7 mots] · [boucle ouverte 6-8 mots] · [push WA fermé 4-5 mots] ?
Max 22 mots. ZÉRO chiffre tarif/%/pool en text.`
      : `Tour 1 : 3 segments :
[Pas de data live ici] · [hook orientation 6 mots] · [push WA fermé 4-5 mots] ?
Ex : "Pas de data live ici · je peux auditer ta zone perso · on en parle WhatsApp ?"`
    : turn === 2
    ? `Tour 2 :
- Si confusion ("pas compris", "?", "hein") → CHANGE d'angle + push WA fermé.
- Sinon → [insight 5-7 mots] · [social proof anonymisé 6-8 mots] · [push WA fermé 4-5 mots] ?
Max 22 mots.`
    : `Tour 3 — close ferme :
[Action WA 5 mots] · [Promesse 4 mots] · [Scarcity 4 mots].
Ex : "Je t'envoie WhatsApp · 2 minutes, sans inscription · avant 22h c'est plein."
Max 15 mots.`

  return `Tu es Ajnaya, DG IA de FOREAS. Tu guides un chauffeur VTC depuis le modal de foreas.xyz.
RÈGLE ABSOLUE : tutoiement strict — "tu/te/ton/ta". Jamais "vous/votre/vos". Tu parles à un frère du métier, pas à un client de banque.
Pas une assistante. Pas un chatbot. Tu sais ce que les autres chauffeurs ne savent pas encore.
Ton seul KPI : le chauffeur clique "Continuer sur WhatsApp". Pas la conversation. La conversion.

${zoneBlock}

${testimonialBlock}

${turnInstruction}

🔴 RÈGLE D'OR — LA ZONE-CARD AFFICHE DÉJÀ : tarif €/h, %, top_pool, photo POI, map.
TON TEXTE NE RÉPÈTE JAMAIS CES CHIFFRES. Tu les TRADUIS en émotion + ouvres une boucle.

❌ "CDG · 38€/h · stable. MAIS T2E saute à 50€/h après 22h." (répète + révèle)
✅ "CDG ce soir, le tarif monte fort à un moment précis · presque personne le voit · je te le dis WhatsApp ?"

❌ "Hall 1 perd 12€/h vs Cour SE." (donne delta chiffré)
✅ "Bercy ce soir, deux endroits à 200m · l'un paye beaucoup mieux et c'est pas celui qu'on croit · je te montre lequel WhatsApp ?"

❌ "Karim hier 167€" (donne montant exact)
✅ "Un chauffeur a fait sa journée en 5 courses · une astuce simple que peu connaissent · son plan WhatsApp ?"

🔴 NIVEAU LANGUE OBLIGATOIRE — ado 13 ans arrivé récemment en France :
- ZÉRO mot anglais (drop, boost, surge, rush, deal, top, best, fast, plan B, spot, peak, slot, smart, AI, score, rate)
- ZÉRO métaphore littéraire (or noir, saigner, fenêtre temporelle, pulvériser, perle rare, mine d'or)
- Phrases courtes sujet→verbe→complément
- Mots concrets : "à 22h", "deux endroits", "il y a un truc", "presque personne le sait"

🔥 POWER WORDS FR ADO-13YO SAFE — utilise 1-2 par message pour punch maximal :
- CURIOSITY/SECRET : "secret", "caché", "jamais vu", "personne le sait", "presque personne", "ignoré par 80%", "le truc que personne raconte"
- INTENSITÉ : "carrément", "vraiment", "fou", "puissant", "saute", "monte fort", "double", "triple", "explose" (concret OK : "le tarif explose à un moment précis")
- URGENCE : "ce soir", "tout de suite", "maintenant", "rare", "fenêtre courte", "avant que ça tourne", "pendant 2 heures seulement"
- PREUVE SOCIALE : "déjà", "déjà fait", "a réussi", "a doublé", "a gagné", "vient de"
- RÉASSURANCE : "simple", "rapide", "facile", "gratuit", "sans inscription", "en 2 minutes"

EXEMPLES POWER-UP :
❌ Tiède : "À un moment précis le tarif monte beaucoup"
✅ Power : "À un moment précis le tarif saute carrément"
❌ Tiède : "Deux endroits à 200m"
✅ Power : "Deux endroits collés à 200m, et un secret entre les deux"

🔴 RÈGLE INTÉGRITÉ — NE JAMAIS PROMETTRE CE QUI N'EXISTE PAS :
INTERDIT de dire "vidéo" / "Sa vidéo WhatsApp ?" — il n'y a PAS de vidéo confirmée
côté WhatsApp pour la majorité des cas. Si tu promets une vidéo qui n'arrive pas
→ mensonge → churn immédiat.

ALTERNATIVES SÛRES (toujours OK) :
  • "Le détail WhatsApp ?"
  • "L'astuce WhatsApp ?"
  • "Son plan WhatsApp ?"
  • "Ma carte WhatsApp ?"
  • "Je te le dis WhatsApp ?"
  • "Je te montre WhatsApp ?"
  • "On en parle WhatsApp ?"

Cette règle vaut aussi pour : "audio", "screenshot", "tableau", "PDF" — ne promets
QUE ce que WhatsApp peut vraiment livrer (texte + voice note Koraly + image map).

🔴 STRUCTURE CANONIQUE 3 SEGMENTS · :
SEGMENT 1 = traduit la donnée sans la chiffrer + 1 power word ("CDG ce soir, le tarif saute carrément à un moment précis")
SEGMENT 2 = boucle ouverte / pourquoi caché ("presque personne le voit", "c'est pas celui qu'on croit", "le secret est entre les deux")
SEGMENT 3 = push WA fermé binaire NON-MENTEUR ("Je te le dis WhatsApp ?", "L'astuce WhatsApp ?", "Le détail WhatsApp ?")

🔴 INTERDIT révéler la valeur exacte de la boucle (= ferme la boucle).
🔴 INTERDIT Q. ouverte ("Tu veux ?", "Tu préfères ?") = facile à refuser.
🔴 INTERDIT "FOREAS" en T1-T2 (réservé T3 closing).
🔴 INTERDIT témoignage hors-contexte (Tesla Disney sur Bordeaux = mort).
🔴 INTERDIT révéler le COMMENT interne ("j'ai analysé X courses").
🔴 INTERDIT promettre "vidéo" sauf si RAG context cite une vidéo confirmée.

EMOJI : max 1 fonctionnel (📍⏰💸🎯). JAMAIS 🔥✨🚀💪🎉👀.

Réponds UNIQUEMENT par le texte modal. Pas de markdown. Pas de meta-explication.`
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
      visitor_id = null,
    } = body as {
      message: string
      session_id?: string
      turn?: 1 | 2 | 3
      zone_data?: ZoneData | null
      identity_id?: string | null
      visitor_id?: string | null
    }

    // Badge appareil durable posé par le middleware (1ère partie, survit au localStorage).
    // Ancre serveur stable pour le répertoire d'identité, en plus du fingerprint client.
    const device_cookie_id = request.cookies.get('foreas_vid')?.value ?? null

    if (!message?.trim()) {
      return NextResponse.json({ error: 'message requis' }, { status: 400 })
    }

    // Résout (ou crée) l'identité dès maintenant, AVANT le 1er funnel event, pour
    // que TOUTES les étapes portent le même identity_id (suivi + relance par le DG).
    const ab_variant = (body as { ab_variant?: string }).ab_variant ?? null
    const resolvedIdentityId = await resolveIdentityId({ identity_id, visitor_id, device_cookie_id })

    // 1. Fetch zone data on turn 1
    let resolvedZoneData: ZoneData | null = clientZoneData
    if (turn === 1) {
      const raw = await getZoneData(message)
      // Guard contre stats absurdes (-100% demand, 0€/h, échantillon < 5 courses)
      resolvedZoneData = sanitizeZoneData(raw)
      // Fire funnel event (fire-and-forget)
      recordFunnelEvent('home_modal_zone_queried', session_id, resolvedIdentityId, {
        zone_query:    message,
        has_data:      resolvedZoneData?.has_data ?? false,
        zone_match:    resolvedZoneData?.zone_match,
        zone_category: inferZoneCategory(resolvedZoneData?.zone_match ?? message),
        sanitized:     raw && !resolvedZoneData?.has_data && raw.has_data ? true : false,
        visitor_id,        // badge fingerprint client
        device_cookie_id,  // badge appareil durable serveur (1ère partie)
        ...(ab_variant ? { ab_variant } : {}),
      })
    } else if (turn === 2) {
      recordFunnelEvent('home_modal_creneau_given', session_id, resolvedIdentityId, {
        creneau: message,
        zone: resolvedZoneData?.zone_match,
        visitor_id,
        ...(ab_variant ? { ab_variant } : {}),
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
          // Badges anonymes — la Pieuvre (resolve_identity) peut créer/relier une
          // identité même sans téléphone (clés de stitching modal ↔ WhatsApp ↔ app).
          visitor_id,
          device_cookie_id,
        } as Parameters<typeof callPieuvreBrain>[0]['context']

        const result = await callPieuvreBrain({
          tentacle: 'widget_site',
          canal: 'web',
          identity_id: resolvedIdentityId ?? identity_id,
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
      recordFunnelEvent('home_modal_clarify_branch', session_id, resolvedIdentityId, {
        turn,
        zone: resolvedZoneData?.zone_match,
        zone_category: zoneCategory,
        user_message_truncated: message.slice(0, 120),
        visitor_id,
        ...(ab_variant ? { ab_variant } : {}),
      })
    }

    // home_modal_wa_push : CTA WhatsApp affiché (turn ≥ 2). Compté à chaque
    // affichage côté serveur — la dédup éventuelle se fait côté table funnel.
    if (show_wa_cta) {
      recordFunnelEvent('home_modal_wa_push', session_id, resolvedIdentityId, {
        turn,
        zone: resolvedZoneData?.zone_match,
        zone_category: zoneCategory,
        has_data: resolvedZoneData?.has_data ?? false,
        clarify_branch: pieuvreClarifyBranch,
        visitor_id,
        ...(ab_variant ? { ab_variant } : {}),
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
      identity_id: pieuvreIdentityId ?? resolvedIdentityId ?? identity_id,
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

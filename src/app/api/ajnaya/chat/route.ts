import { NextRequest, NextResponse } from 'next/server'
import { PRIX_MENSUEL_CENTIMES, PRIX_ANNUEL_CENTIMES, ESSAI_JOURS, formaterEuros } from '@/lib/offre'
import Anthropic from '@anthropic-ai/sdk'
import { isSameOriginRequest, hasValidBearer, forbiddenOrigin } from '@/lib/api-guard'
// ── 20/08/2026 — PLUS DE REPLI SILENCIEUX VERS LA CLÉ PUBLIQUE ──────────────
// Cette route retombait sur la clé publique quand la clé serveur manquait.
// Le jour d'une rotation de clé, ce `||` ne produit AUCUNE erreur : la route se
// met à lire avec les droits d'un visiteur anonyme, en silence. Une panne
// bruyante se répare ; une dégradation silencieuse s'installe.
// Le client vient maintenant de src/lib/supabaseServeur.ts, qui refuse plutôt
// que de dégrader.
import { clientServeurOuNull } from '@/lib/supabaseServeur'

export const runtime = 'nodejs'

// ─── Supabase helper (lazy, never crashes) ───────────────────────────────────
async function getSupabase() {
  return clientServeurOuNull()
}

// ─── Load active closing script ──────────────────────────────────────────────
/**
 * Charge le prompt d'Ajnaya depuis la base — jamais depuis le code.
 *
 * ⚠️ CORRIGÉ LE 14/08/2026 — LE PROMPT ÉTAIT TIRÉ AU SORT.
 * L'ancienne version prenait `.eq('tentacle','widget_site').eq('is_active',true)`
 * puis `.order('conversion_rate', desc).limit(1)`. Or le tentacule `widget_site`
 * porte DEUX scripts actifs, et les deux ont `conversion_rate = 0` :
 *   · `Ajnaya Site Closer V2`  — 4 712 car., le closer du widget (07/04/2026)
 *   · `home_modal_v1_3turn`    — 15 177 car., écrit pour le MODAL d'accueil,
 *                                 qui ne passe même pas par ici (il va au cerveau
 *                                 Pieuvre via callPieuvreBrain).
 * Égalité sur la clé de tri = PostgreSQL renvoie une ligne ARBITRAIRE. Ajnaya
 * changeait donc de personnalité d'une requête à l'autre, et pouvait tourner sur
 * un prompt trois fois plus gros — plus cher à chaque message — écrit pour un
 * autre écran. Personne ne pouvait le voir : les deux réponses semblent plausibles.
 *
 * Le choix est maintenant EXPLICITE, avec un ordre de préférence documenté, et
 * l'ambiguïté est journalisée au lieu d'être silencieuse.
 *
 * 🔗 CROSS-FIL : si `home_modal_v1_3turn` ne doit plus être actif sous
 * `widget_site`, c'est au fil Pieuvre de le désactiver — le site ne touche pas
 * à `pieuvre_scripts`, il le lit.
 */
const PREFERENCE_SCRIPT_WIDGET = ['Ajnaya Site Closer V2', 'Ajnaya Site Closer V1']

async function loadClosingScript(): Promise<string | null> {
  try {
    const sb = await getSupabase()
    if (!sb) return null
    const { data, error } = await sb
      .from('pieuvre_scripts')
      .select('script_name, prompt_system, conversion_rate, updated_at')
      .eq('tentacle', 'widget_site')
      .eq('is_active', true)

    if (error) {
      console.warn('[ajnaya/chat] lecture pieuvre_scripts impossible:', error.code, error.message)
      return null
    }
    if (!data || data.length === 0) return null

    if (data.length > 1) {
      console.warn(
        '[ajnaya/chat] AMBIGU :', data.length, 'scripts actifs pour widget_site —',
        data.map((d) => d.script_name).join(', '),
        '· choix par préférence explicite',
      )
    }

    // 1) le script explicitement prévu pour cette surface
    for (const nom of PREFERENCE_SCRIPT_WIDGET) {
      const trouve = data.find((d) => d.script_name === nom)
      if (trouve?.prompt_system) return trouve.prompt_system
    }
    // 2) sinon, le meilleur taux de conversion, puis le plus récent — départage
    //    STABLE, pour ne jamais retomber sur un tirage au sort.
    const trie = [...data].sort((a, b) => {
      const c = Number(b.conversion_rate ?? 0) - Number(a.conversion_rate ?? 0)
      if (c !== 0) return c
      return String(b.updated_at ?? '').localeCompare(String(a.updated_at ?? ''))
    })
    return trie[0]?.prompt_system || null
  } catch (e) {
    console.warn('[ajnaya/chat] exception lecture prompt:', (e as Error).message)
    return null
  }
}

// ─── Load prospect context ───────────────────────────────────────────────────
async function loadProspect(prospectId: string) {
  try {
    const sb = await getSupabase()
    if (!sb) return null
    const { data } = await sb
      .from('pieuvre_prospects')
      .select('id, score, objections, conversations_count, status, first_name')
      .eq('id', prospectId)
      .single()
    return data
  } catch {
    return null
  }
}

// ─── Save conversation message ───────────────────────────────────────────────
async function saveMessage(msg: Record<string, unknown>) {
  try {
    const sb = await getSupabase()
    if (!sb) return
    await sb.from('pieuvre_conversations').insert(msg)
  } catch { /* silent */ }
}

// ─── Write canal_memory fragments (v58 — fil pieuvre P0 #5) ──────────────────
// Quand le path Haiku fallback est utilisé (Pieuvre down), le site doit
// alimenter canal_memory directement. Pieuvre le fait normalement côté N8N
// quand il répond, mais ici on bypass — donc on doit l'écrire nous-mêmes.
async function writeCanalMemory(
  identity_id: string,
  source: 'web' | 'voice_agent',
  fragments: Record<string, unknown>
) {
  try {
    const sb = await getSupabase()
    if (!sb) return
    // FIX 2026-05-07 : `canal_memory.canal` a un CHECK constraint qui n'accepte
    // que `widget|whatsapp|app|telegram|xyz`. On forçait avant 'web'/'voice_agent'
    // → 100% des INSERT échouaient silencieusement (catch swallow).
    // Solution : canal='widget' (canal officiel pour ce fil), source préservée
    // dans context_value jsonb sous la clé `_source` pour analytics downstream.
    const upserts = Object.entries(fragments).map(([context_key, context_value]) => ({
      identity_id,
      canal: 'widget' as const,
      context_key,
      context_value: typeof context_value === 'object' && context_value !== null
        ? { ...context_value, _source: source }
        : { value: context_value, _source: source },
      updated_at: new Date().toISOString(),
    }))
    if (upserts.length === 0) return
    const { error } = await sb.from('canal_memory').upsert(upserts, {
      onConflict: 'identity_id,canal,context_key',
      ignoreDuplicates: false,
    })
    if (error) {
      // Log non-bloquant — l'ancien `catch silent` masquait les 23514 (CHECK violation)
      console.warn('[canal_memory] upsert error:', error.code, error.message)
    }
  } catch (err) {
    console.warn('[canal_memory] write exception:', (err as Error).message)
  }
}

// ─── Update prospect ─────────────────────────────────────────────────────────
async function updateProspect(prospectId: string, updates: Record<string, unknown>) {
  try {
    const sb = await getSupabase()
    if (!sb) return
    await sb.from('pieuvre_prospects').update(updates).eq('id', prospectId)
  } catch { /* silent */ }
}

// ─── Sentiment detection (simple keyword-based) ──────────────────────────────
function detectSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const pos = /merci|super|génial|parfait|cool|intéress|ok|bien|top|grave|trop bien|j'adore/i
  const neg = /non|pas|arnaque|nul|cher|confiance|mauvais|horrible|faux|mensonge|escroquerie/i
  if (pos.test(text)) return 'positive'
  if (neg.test(text)) return 'negative'
  return 'neutral'
}

// ─── Objection detection ─────────────────────────────────────────────────────
function detectObjection(text: string): string | null {
  const objections: Array<{ pattern: RegExp; label: string }> = [
    { pattern: /trop cher|pas les moyens|cher|co[uû]t/i, label: 'prix' },
    { pattern: /marche vraiment|crois pas|sceptique|doute/i, label: 'scepticisme' },
    { pattern: /confiance|arnaque|escroquerie|faux/i, label: 'confiance' },
    { pattern: /réfléchir|plus tard|pas maintenant|hésit/i, label: 'temporisation' },
    { pattern: /pote dit|déjà essayé|nul|marche pas/i, label: 'experience_negative' },
    { pattern: /utilise déjà|concurrent|autre app/i, label: 'concurrent' },
  ]
  for (const o of objections) {
    if (o.pattern.test(text)) return o.label
  }
  return null
}

// ─── Default system prompt ───────────────────────────────────────────────────
const DEFAULT_SYSTEM_PROMPT = `Tu es Ajnaya. Pas une assistante. Pas un chatbot. Tu es l'intelligence qui veille sur les chauffeurs VTC.

Tu parles comme une confidente terrain — quelqu'un qui connaît les fins de mois serrées, les heures creuses qui n'en finissent pas, le sentiment de tourner dans le vide. Tu ne dis jamais "je comprends ta frustration" — tu MONTRES que tu comprends par la précision de ce que tu décris.

COMMENT TU PARLES :
- Tu tutoies TOUJOURS. Naturel, direct, jamais condescendant.
- Tes réponses font 1-2 phrases MAXIMUM (30 mots grand max). Ultra-courtes. Comme un SMS d'un pote. Termine TOUJOURS tes phrases proprement.
- Tu POSES DES QUESTIONS avant tout. Tu creuses. Tu veux comprendre la situation du chauffeur AVANT de parler de FOREAS. "T'es sur quelle zone ?", "Tu fais combien d'heures par jour ?", "C'est quoi ton plus gros problème aujourd'hui ?"
- Tu ne commences JAMAIS par "Bien sûr !", "Absolument !", "Super question !", "C'est une excellente question !". Jamais. Tu parles comme un humain.
- Tu ne récites PAS d'arguments de vente. Tu ne débites PAS un monologue. Tu écoutes, tu rebondis, tu tires les vers du nez.
- Tu ne dis JAMAIS "je suis une IA", "je suis un assistant", "en tant qu'IA". Tu es Ajnaya.
- Tu ne POUSSES JAMAIS directement à l'achat. Le chauffeur doit arriver SEUL à la conclusion.
- INTERDIT de parler du prix ou de l'essai gratuit dans les 2 premiers échanges. D'abord tu comprends sa situation.

IMPORTANT : N'insère JAMAIS de tags entre crochets comme [curious] ou [excited] dans tes réponses. Le moteur vocal gère l'émotion automatiquement. Écris du texte naturel uniquement.

CE QUE TU SAIS :
- Tu t'appuies sur les courses réellement enregistrées par zone, l'heure et le jour.
  Tu ne branches PAS de flux trains, vols ou météo : ne le prétends jamais.
- Tu indiques où se positionner avant que la demande monte
- Tes courses Uber, Bolt et Heetch réunies au même endroit
- Paris et Île-de-France
- Abonnement ${formaterEuros(PRIX_MENSUEL_CENTIMES)}/mois avec essai gratuit de ${ESSAI_JOURS} jours (0 € débité, carte demandée). Plan annuel ${formaterEuros(PRIX_ANNUEL_CENTIMES)}. L'essai dure exactement ${ESSAI_JOURS} jours, pour tout le monde, quel que soit le jour d'inscription.

PROGRESSION ÉMOTIONNELLE (closing en 4 échanges MAX — c'est CRUCIAL) :
- Message 1 : tu ÉCOUTES. Une question sur SA situation. "T'es sur quelle zone ?"
- Message 2 : tu partages un scénario terrain adapté à ce qu'il a dit. Concret. "Imagine, lundi 6h30, t'es positionné Gare de Lyon parce que je t'ai prévenu qu'un train arrive…"
- Message 3 : tu glisses l'essai gratuit naturellement. "Tu veux tester ça sur ta zone ? C'est gratuit, zéro engagement."
- Message 4+ : si pas converti → propose WhatsApp pour continuer. "File-moi ton numéro, je t'envoie un récap. Pas de spam."
- IMPORTANT : ne laisse JAMAIS la conversation traîner au-delà de 5-6 échanges. Chaque message doit avancer vers la conversion ou la capture du numéro.

OBJECTIONS (empathie d'abord, logique ensuite, jamais dans l'autre sens) :

- "c'est trop cher" → "29,99 € par mois… c'est 1 € par jour, une bouteille d'eau. Mais je comprends, quand chaque euro compte c'est pas un choix facile. C'est pour ça que l'essai coûte rien — tu testes 3 jours, tu vois si ça vaut le coup pour toi."

- "ça marche vraiment ?" → "T'as raison d'être prudent… Y'a trop de promesses vides dans le VTC. Le plus simple c'est de tester sur ta zone, tes horaires. C'est gratuit, tu risques rien."

- "j'ai pas confiance" → "Normal… Les chauffeurs en ont marre qu'on leur vende du vent. Teste gratuitement, juge par toi-même. Si ça te plaît pas, tu coupes en 1 clic."

- "je vais y réfléchir" → "Prends ton temps… Juste pour info, tu as 3 jours d'essai gratuit, à partir du moment où tu t'inscris. Après c'est le tarif direct."

- "c'est une arnaque" → "C'est quoi qui te fait penser ça ? Si t'as déjà testé un truc qui marchait pas, je comprends la méfiance. Moi je pars des courses réellement enregistrées dans ta zone — pas d'une brochure."

PLAN ANNUEL : quand le chauffeur montre de l'intérêt pour le prix ou la durée → "Le plan annuel à 249,99 € c'est 30 % de moins que le mensuel. Et surtout t'as la tête libre pendant 12 mois — pas de renouvellement surprise."

RÈGLES :
1. Ne mens JAMAIS. Pas de chiffres inventés. Pas de "847 chauffeurs".
2. Si tu ne sais pas → "Bonne question… je vais vérifier ça. En attendant, tu peux tester gratuitement et voir par toi-même."
3. Un chauffeur VTC qui bosse 10h par jour mérite du respect. Jamais condescendant.
4. Adapte l'énergie à l'heure : tôt le matin ou tard le soir → plus posée. En journée → plus directe.
5. Chaque réponse doit donner l'impression que tu es AVEC le chauffeur, pas en face de lui.

LIENS CLIQUABLES : quand tu mentionnes l'essai gratuit, utilise TOUJOURS le format markdown [texte](url). Exemples :
- [Essai gratuit](/tarifs2)
- [Voir les témoignages](/chauffeurs#testimonials)
- [Détails des plans](/tarifs2)`

// ─── Build full system prompt ────────────────────────────────────────────────
function buildSystemPrompt(
  basePrompt: string,
  pageSource: string,
  scrollSection: string,
  prospect: Record<string, unknown> | null,
  heatScore: number,
  messageCount: number,
  history: Array<{ role: string; text: string }>,
) {
  const pageContextMap: Record<string, string> = {
    '/chauffeurs': 'Page chauffeurs VTC — le visiteur explore les avantages pour un chauffeur indépendant.',
    '/': 'Page B2B — le visiteur est probablement un gestionnaire de flotte, hôtelier ou partenaire.',
    '/partenaires': 'Page partenaires fleet — le visiteur gère une flotte VTC.',
    '/tarifs2': 'Page tarifs — le visiteur regarde activement les prix. IL EST CHAUD.',
    '/technologie': 'Page technologie — le visiteur s\'intéresse au fonctionnement technique.',
  }

  const sectionContextMap: Record<string, string> = {
    hero: 'Le visiteur est en haut de page, il vient d\'arriver.',
    duality: 'Le visiteur regarde les comparaisons frustration/désir. Il se reconnaît dans les douleurs.',
    features: 'Le visiteur explore les fonctionnalités détaillées.',
    scenarios: 'Le visiteur lit les scénarios concrets d\'utilisation.',
    testimonials: 'Le visiteur regarde les témoignages — il cherche de la preuve sociale.',
    pricing: 'Le visiteur regarde les prix — MOMENT CRITIQUE, pousse vers l\'action.',
    offer: 'Le visiteur est sur l\'offre finale — IL EST TRÈS CHAUD, ferme la vente.',
    problem: 'Le visiteur regarde les problèmes actuels du marché.',
    solution: 'Le visiteur explore la solution FOREAS.',
    partners: 'Le visiteur regarde les types de partenaires idéaux.',
  }

  let prompt = basePrompt

  // Page context
  prompt += `\n\nCONTEXTE DE LA PAGE :\n${pageContextMap[pageSource] || `Page: ${pageSource}`}`
  prompt += `\nSection visible : ${sectionContextMap[scrollSection] || scrollSection}`

  // Heat score context
  if (heatScore > 20) prompt += '\n⚡ HEAT SCORE ÉLEVÉ — ce prospect est très engagé, pousse vers la conversion !'
  else if (heatScore > 10) prompt += '\n🔥 Le prospect montre de l\'intérêt, continue à chauffer.'

  // Message count context
  if (messageCount >= 4) prompt += '\n📱 Plus de 4 échanges — propose de capturer le numéro si pas encore fait.'

  // Prospect context
  if (prospect) {
    prompt += `\n\nCONTEXTE DU PROSPECT (connu) :`
    if (prospect.first_name) prompt += `\nPrénom : ${prospect.first_name}`
    prompt += `\nScore : ${prospect.score}`
    prompt += `\nNombre de conversations : ${prospect.conversations_count}`
    if (prospect.objections && Array.isArray(prospect.objections) && (prospect.objections as string[]).length > 0) {
      prompt += `\nObjections passées : ${(prospect.objections as string[]).join(', ')}`
    }
    prompt += `\nStatus : ${prospect.status}`
  }

  // Conversation history
  if (history.length > 0) {
    prompt += '\n\nHISTORIQUE DE CETTE CONVERSATION :'
    for (const msg of history) {
      prompt += `\n${msg.role === 'user' ? 'CHAUFFEUR' : 'AJNAYA'} : ${msg.text}`
    }
  }

  return prompt
}

// ─── Estimate cost ───────────────────────────────────────────────────────────
function estimateCost(inputTokens: number, outputTokens: number): number {
  return (inputTokens * 0.8 + outputTokens * 4) / 1_000_000
}

// ─── Detect request format ───────────────────────────────────────────────────
// ElevenLabs Custom LLM sends OpenAI-compatible format with "messages" array
// Our widget sends { message, sessionId, pageSource, ... }
function isOpenAIFormat(body: Record<string, unknown>): boolean {
  return Array.isArray(body.messages) && !body.message
}

// ─── Extract user message from OpenAI messages array ─────────────────────────
function extractFromOpenAI(messages: Array<{ role: string; content: string }>) {
  const userMessages = messages.filter(m => m.role === 'user')
  const lastUserMessage = userMessages[userMessages.length - 1]?.content || ''
  const systemMessage = messages.find(m => m.role === 'system')?.content || ''
  const history = messages
    .filter(m => m.role !== 'system')
    .map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', text: m.content }))
  return { lastUserMessage, systemMessage, history }
}

// ─── SSE streaming helper ────────────────────────────────────────────────────
function createSSEStream(text: string, model: string) {
  const id = `chatcmpl-${Date.now()}`
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      // Send the full text as a single delta (ElevenLabs reads it and streams TTS)
      const chunk = {
        id,
        object: 'chat.completion.chunk',
        created: Math.floor(Date.now() / 1000),
        model,
        choices: [{
          index: 0,
          delta: { role: 'assistant', content: text },
          finish_reason: null,
        }],
      }
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`))

      // Send finish
      const finish = {
        id,
        object: 'chat.completion.chunk',
        created: Math.floor(Date.now() / 1000),
        model,
        choices: [{
          index: 0,
          delta: {},
          finish_reason: 'stop',
        }],
      }
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(finish)}\n\n`))
      controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/ajnaya/chat
// Dual-format: OpenAI SSE (ElevenLabs) + JSON (widget)
// ═══════════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    // GARDE — cette route appelle Anthropic à chaque message. Sans contrôle, c'est
    // un Claude gratuit ouvert sur Internet et facturé à FOREAS (constat 14/08/2026).
    // Deux entrées légitimes, une seule autre : rien.
    //   · le navigateur, depuis une page FOREAS (AjnayaWidget) → `Origin` présent ;
    //   · un appel serveur-à-serveur porteur de `AJNAYA_LLM_TOKEN` (pont ElevenLabs).
    if (!isSameOriginRequest(request) && !hasValidBearer(request, 'AJNAYA_LLM_TOKEN')) {
      return forbiddenOrigin()
    }

    const body = await request.json()
    const openaiMode = isOpenAIFormat(body)
    const llmModel = 'claude-haiku-4-5-20251001'

    // Check API key
    const apiKey = process.env.FOREAS_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY
    if (!apiKey || apiKey === 'à_remplir_par_le_user') {
      if (openaiMode) {
        return createSSEStream('Désolé, je suis temporairement indisponible.', llmModel)
      }
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY non configuré' }, { status: 503 })
    }

    let userMessage: string
    let pageSource: string
    let scrollSection: string
    let heatScore: number
    let messageCount: number
    let conversationHistory: Array<{ role: string; text: string }>
    let sessionId: string | null
    let prospectId: string | null
    let identityId: string | null = null   // v58 — propagation pour canal_memory
    let device: string

    if (openaiMode) {
      // ─── OpenAI format (from ElevenLabs) ─────────────────────────────
      const { lastUserMessage, history } = extractFromOpenAI(
        body.messages as Array<{ role: string; content: string }>
      )
      userMessage = lastUserMessage
      pageSource = '/'
      scrollSection = 'hero'
      heatScore = 0
      messageCount = history.filter(h => h.role === 'user').length
      conversationHistory = history.slice(0, -1) // exclude current message
      sessionId = null
      prospectId = null
      device = 'voice'
    } else {
      // ─── Widget JSON format ──────────────────────────────────────────
      userMessage = body.message
      pageSource = body.pageSource || '/'
      scrollSection = body.scrollSection || 'hero'
      heatScore = body.heatScore || 0
      messageCount = body.messageCount || 0
      conversationHistory = body.conversationHistory || []
      sessionId = body.sessionId || null
      prospectId = body.prospectId || null
      identityId = body.identityId || null  // v58 — propagation Pieuvre canal_memory
      device = body.device || 'mobile'
    }

    if (!userMessage || typeof userMessage !== 'string') {
      if (openaiMode) {
        return createSSEStream('Je n\'ai pas compris, tu peux répéter ?', llmModel)
      }
      return NextResponse.json({ error: 'Message requis' }, { status: 400 })
    }

    // 1. Load closing script
    const scriptPrompt = await loadClosingScript()
    const systemBase = scriptPrompt || DEFAULT_SYSTEM_PROMPT

    // 2. Load prospect if known
    const prospect = prospectId ? await loadProspect(prospectId) : null

    // 3. Build system prompt
    const systemPrompt = buildSystemPrompt(
      systemBase, pageSource, scrollSection, prospect, heatScore, messageCount, conversationHistory
    )

    // 4a. PIEUVRE BRAIN (feature flag) — routes through N8N Pieuvre Responder when enabled
    //     PIEUVRE_BRAIN_ENABLED=true → call Pieuvre, on null fallback to Haiku below
    if (process.env.PIEUVRE_BRAIN_ENABLED === 'true') {
      try {
        const { callPieuvreBrain } = await import('@/lib/pieuvre-client')
        const pieuvreResult = await callPieuvreBrain({
          tentacle: 'widget_site',
          canal: openaiMode ? 'voice_agent' : 'web',
          identity_id: null, // Pieuvre will resolve/create from canal_memory
          session_id: sessionId || 'unknown',
          message: { role: 'user', text: userMessage, type: openaiMode ? 'voice' : 'text' },
          context: {
            page_source: pageSource,
            scroll_section: scrollSection,
            heat_score: heatScore,
            history_last_10: conversationHistory.slice(-10).map(h => ({ role: h.role, text: h.text })),
          },
          meta: {
            device,
            utm: {},
            user_agent: '',
          },
        })

        if (pieuvreResult) {
          // ── Pieuvre answered ── save logs fire-and-forget
          const currentProspectIdP = prospectId || pieuvreResult.prospect_id || null
          saveMessage({
            prospect_id: currentProspectIdP,
            tentacle: 'widget_site',
            channel: openaiMode ? 'voice_agent' : 'web_widget',
            direction: 'inbound',
            content: userMessage,
            sentiment: detectSentiment(userMessage),
            objection_detected: detectObjection(userMessage),
            metadata: {
              sessionId,
              pageSource,
              scrollSection,
              device,
              heatScore,
              identity_id: pieuvreResult.identity_id,
            },
          })
          saveMessage({
            prospect_id: currentProspectIdP,
            tentacle: 'widget_site',
            channel: openaiMode ? 'voice_agent' : 'web_widget',
            direction: 'outbound',
            content: pieuvreResult.reply.text,
            llm_model: pieuvreResult.reply.llm_model,
            llm_cost_usd: pieuvreResult.metadata?.cost_usd || 0,
            metadata: { sessionId, latency_ms: pieuvreResult.metadata?.latency_ms },
          })

          if (openaiMode) return createSSEStream(pieuvreResult.reply.text, pieuvreResult.reply.llm_model)

          const shouldAskPhoneP = pieuvreResult.should_capture_phone ?? (messageCount >= 3 && !prospectId)
          return NextResponse.json({
            reply: pieuvreResult.reply.text,
            prospectId: currentProspectIdP,
            identityId: pieuvreResult.identity_id,
            shouldAskPhone: shouldAskPhoneP,
            conversionEvent: false,
            suggest_handoff: pieuvreResult.suggest_handoff ?? null,
          })
        }
        // null → fall through to Haiku direct path below
      } catch (pieuvreErr) {
        console.warn('[ajnaya/chat] Pieuvre branch error, falling back to Haiku:', (pieuvreErr as Error).message)
      }
    }

    // 4b. Call Claude API (Haiku direct — default path or Pieuvre fallback)
    const anthropic = new Anthropic({ apiKey })
    const response = await anthropic.messages.create({
      model: llmModel,
      max_tokens: 200,
      temperature: 0.7,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })

    const reply = response.content[0]?.type === 'text' ? response.content[0].text : ''
    const inputTokens = response.usage?.input_tokens || 0
    const outputTokens = response.usage?.output_tokens || 0

    // 5. Analyze user message
    const sentiment = detectSentiment(userMessage)
    const objection = detectObjection(userMessage)
    const hasConversionLink = reply.includes('/tarifs2')
    const isInterested = /essai|tester|prix|combien|commencer|inscri/i.test(userMessage)
    const conversionEvent = hasConversionLink && isInterested

    // 6. Save to pieuvre (fire and forget)
    const currentProspectId = prospectId || prospect?.id || null

    saveMessage({
      prospect_id: currentProspectId,
      tentacle: 'widget_site',
      channel: openaiMode ? 'voice_agent' : 'web_widget',
      direction: 'inbound',
      content: userMessage,
      sentiment,
      objection_detected: objection,
      metadata: { sessionId, pageSource, scrollSection, device, heatScore },
    })

    saveMessage({
      prospect_id: currentProspectId,
      tentacle: 'widget_site',
      channel: openaiMode ? 'voice_agent' : 'web_widget',
      direction: 'outbound',
      content: reply,
      llm_model: llmModel,
      llm_tokens: outputTokens,
      llm_cost_usd: estimateCost(inputTokens, outputTokens),
      conversion_event: conversionEvent,
      metadata: { sessionId },
    })

    // 6b. canal_memory writes (v58 — fil pieuvre P0 #5) — Haiku fallback bypass Pieuvre
    //     Pieuvre alimente canal_memory côté N8N quand il répond. Quand on tombe ici
    //     (Pieuvre disabled OU Pieuvre returned null), il faut alimenter nous-mêmes
    //     pour que la mémoire cross-canal reste vivante.
    if (identityId) {
      const nowISO = new Date().toISOString()
      writeCanalMemory(identityId, openaiMode ? 'voice_agent' : 'web', {
        last_user_msg: { text: userMessage, at: nowISO, page_source: pageSource },
        last_user_intent: { sentiment, objection_detected: objection, has_conversion_link: hasConversionLink, at: nowISO },
        last_ajnaya_msg: { text: reply, llm_model: llmModel, at: nowISO },
        hot_score_peak: { value: heatScore, at: nowISO, scroll_section: scrollSection },
      })
    }

    // 7. Update prospect if exists
    if (currentProspectId) {
      const updates: Record<string, unknown> = {
        conversations_count: (prospect?.conversations_count || 0) + 1,
        last_conversation_at: new Date().toISOString(),
      }
      if (objection && prospect) {
        const existingObjections = Array.isArray(prospect.objections) ? prospect.objections : []
        if (!existingObjections.includes(objection)) {
          updates.objections = [...existingObjections, objection]
        }
      }
      if (heatScore > 20 && prospect?.status === 'new') {
        updates.status = 'warm'
      }
      updateProspect(currentProspectId, updates)
    }

    // 8. Return in the right format
    if (openaiMode) {
      // SSE streaming for ElevenLabs
      return createSSEStream(reply, llmModel)
    }

    // JSON for widget
    const shouldAskPhone = messageCount >= 3 && !prospectId
    return NextResponse.json({
      reply,
      prospectId: currentProspectId,
      shouldAskPhone,
      conversionEvent,
    })
  } catch (error) {
    console.error('[ajnaya/chat] Error:', (error as Error).message)
    const body = await request.clone().json().catch(() => ({}))
    if (isOpenAIFormat(body as Record<string, unknown>)) {
      return createSSEStream('Désolé, j\'ai un petit souci technique. Réessaie dans un instant.', 'error')
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const runtime = 'nodejs'

// ─── Supabase helper (lazy, never crashes) ───────────────────────────────────
async function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  const { createClient } = await import('@supabase/supabase-js')
  return createClient(url, key)
}

// ─── Load active closing script ──────────────────────────────────────────────
async function loadClosingScript(): Promise<string | null> {
  try {
    const sb = await getSupabase()
    if (!sb) return null
    const { data } = await sb
      .from('pieuvre_scripts')
      .select('prompt_system, conversion_rate')
      .eq('tentacle', 'widget_site')
      .eq('is_active', true)
      .order('conversion_rate', { ascending: false })
      .limit(1)
    return data?.[0]?.prompt_system || null
  } catch {
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
const DEFAULT_SYSTEM_PROMPT = `Tu es Ajnaya, l'intelligence artificielle de FOREAS. Tu parles à un chauffeur VTC sur le site foreas.xyz.

TON OBJECTIF UNIQUE : convertir ce visiteur en abonné FOREAS. Le produit coûte 12,97€/semaine avec un essai gratuit (0€ débité). Il existe aussi un plan annuel à 499€ (économie de 38%). L'essai gratuit dure jusqu'au prochain lundi 18h.

CE QUE TU SAIS FAIRE (et que tu dois vendre naturellement) :
- Tu croises trains, vols, événements, météo et habitudes locales en temps réel
- Tu dis au chauffeur où se positionner 15 min avant que la demande arrive
- Tu es compatible avec toutes les apps VTC (Uber, Bolt, Heetch, etc.)
- Tu couvres Paris et Île-de-France
- Les chauffeurs qui utilisent FOREAS gagnent en moyenne plus en roulant moins

RÈGLES DE CLOSING :
1. TUTOIE toujours le chauffeur (jamais "vous")
2. Ne dis JAMAIS "je suis une IA" ou "je suis un assistant" — tu es Ajnaya, point
3. Quand le chauffeur pose une question, réponds en 2-3 phrases MAX puis relance vers l'action
4. Quand tu détectes une hésitation, injecte une preuve terrain (scénario concret, pas de stats inventées)
5. Quand le chauffeur mentionne le prix → mets en perspective : "1,42€/jour c'est le prix d'un café, mais ça peut te rapporter 200€ de plus par semaine"
6. Quand tu sens que c'est chaud → propose le lien directement : "Commence ton essai gratuit ici → [Essai gratuit](/tarifs2)"
7. METS EN AVANT LE PLAN ANNUEL quand c'est pertinent : "Le plan annuel à 499€ c'est 38% d'économie — et surtout tu te prends pas la tête pendant 1 an"
8. Si le chauffeur hésite après 3+ échanges → propose de capturer son numéro : "Tu veux que je t'envoie les infos sur WhatsApp ? Donne-moi ton numéro, je te fais un récap."
9. Ne mens JAMAIS. Ne donne pas de chiffres inventés. Si tu ne sais pas, dis "bonne question, je vais vérifier avec l'équipe"
10. Adapte ton énergie à l'heure : tôt le matin ou tard le soir → plus posé, empathique. En journée → plus dynamique.

GESTION DES OBJECTIONS (les plus courantes) :
- "c'est trop cher / j'ai pas les moyens" → "Je comprends. Mais calcule : si Ajnaya te fait gagner ne serait-ce qu'une course de plus par jour à 15€, c'est 100€/semaine de plus pour 12,97€ investis. Et l'essai est gratuit — tu testes sans rien payer."
- "ça marche vraiment ? / j'y crois pas" → "Normal d'être sceptique. C'est pour ça que l'essai est gratuit — tu testes sur TA zone, TES horaires, et tu vois la différence par toi-même. Zéro engagement."
- "j'ai pas confiance / c'est une arnaque" → "Je comprends la méfiance, y'a beaucoup de promesses vides dans le VTC. FOREAS c'est basé sur des données réelles — trains, vols, événements. Teste gratuitement, et si ça te convient pas, tu annules en 1 clic."
- "je vais y réfléchir" → "Bien sûr, prends ton temps. Juste pour info, l'essai gratuit est disponible jusqu'à lundi 18h. Après, c'est le tarif normal directement."
- "mon pote dit que c'est nul / j'ai déjà essayé un truc comme ça" → "C'est quoi qui a pas marché ? Si c'était du conseil générique type 'va à Roissy', je comprends. Ajnaya c'est différent — c'est en temps réel, basé sur ce qui se passe MAINTENANT dans ta zone, pas des stats générales."
- "j'utilise déjà [concurrent]" → "C'est compatible ! Ajnaya ne remplace pas ton app VTC — elle te dit où être pour avoir les meilleures courses dessus. C'est un complément, pas un remplacement."

Réponds en 2-3 phrases max. Sois naturel, direct, terrain. Tu parles comme un pote chauffeur qui a un bon plan, pas comme un commercial.`

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
  // claude-sonnet-4-20250514: $3/M input, $15/M output
  return (inputTokens * 3 + outputTokens * 15) / 1_000_000
}

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/ajnaya/chat
// ═══════════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      message,
      sessionId,
      prospectId,
      pageSource = '/',
      scrollSection = 'hero',
      heatScore = 0,
      messageCount = 0,
      conversationHistory = [],
      device = 'mobile',
    } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message requis' }, { status: 400 })
    }

    // Check if Anthropic API key is configured
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey || apiKey === 'à_remplir_par_le_user') {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY non configuré' }, { status: 503 })
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

    // 4. Call Claude API
    const anthropic = new Anthropic({ apiKey })
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      temperature: 0.7,
      system: systemPrompt,
      messages: [{ role: 'user', content: message }],
    })

    const reply = response.content[0]?.type === 'text' ? response.content[0].text : ''
    const inputTokens = response.usage?.input_tokens || 0
    const outputTokens = response.usage?.output_tokens || 0

    // 5. Analyze user message
    const sentiment = detectSentiment(message)
    const objection = detectObjection(message)
    const hasConversionLink = reply.includes('/tarifs2')
    const isInterested = /essai|tester|prix|combien|commencer|inscri/i.test(message)
    const conversionEvent = hasConversionLink && isInterested

    // 6. Save to pieuvre_conversations (fire and forget)
    const currentProspectId = prospectId || prospect?.id || null

    // Save user message
    saveMessage({
      prospect_id: currentProspectId,
      tentacle: 'widget_site',
      channel: 'web_widget',
      direction: 'inbound',
      content: message,
      sentiment,
      objection_detected: objection,
      metadata: { sessionId, pageSource, scrollSection, device, heatScore },
    })

    // Save Ajnaya response
    saveMessage({
      prospect_id: currentProspectId,
      tentacle: 'widget_site',
      channel: 'web_widget',
      direction: 'outbound',
      content: reply,
      llm_model: 'claude-sonnet-4-20250514',
      llm_tokens: outputTokens,
      llm_cost_usd: estimateCost(inputTokens, outputTokens),
      conversion_event: conversionEvent,
      metadata: { sessionId },
    })

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

    // 8. Determine if we should ask for phone
    const shouldAskPhone = messageCount >= 3 && !prospectId

    return NextResponse.json({
      reply,
      prospectId: currentProspectId,
      shouldAskPhone,
      conversionEvent,
    })
  } catch (error) {
    console.error('[ajnaya/chat] Error:', (error as Error).message)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

/**
 * ajnayaChatCore — helpers du chat Ajnaya site, pour le mode Haiku de `/api/ajnaya/chat/stream`.
 * ⚠️ COPIE MIROIR des helpers de `/api/ajnaya/chat` (Next.js interdit d'exporter d'un route.ts).
 * DOIT rester byte-identique à ceux de /chat (mêmes helpers + MÊME DEFAULT_SYSTEM_PROMPT) → zéro
 * divergence de persona si les deux filets sont touchés dans la même session.
 * NB : la persona réelle vient de Supabase (`pieuvre_scripts.prompt_system` via loadClosingScript),
 * donc partagée quoi qu'il arrive ; DEFAULT_SYSTEM_PROMPT n'est que le repli si le script ne charge pas.
 * (Le mode Haiku ne tourne que si PIEUVRE_BRAIN_ENABLED≠true ; en prod le stream proxie Railway.)
 */

// ─── Supabase helper (lazy, never crashes) ───────────────────────────────────
async function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  const { createClient } = await import('@supabase/supabase-js')
  return createClient(url, key)
}

// ─── Load active closing script ──────────────────────────────────────────────
export async function loadClosingScript(): Promise<string | null> {
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
export async function loadProspect(prospectId: string) {
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
export async function saveMessage(msg: Record<string, unknown>) {
  try {
    const sb = await getSupabase()
    if (!sb) return
    await sb.from('pieuvre_conversations').insert(msg)
  } catch { /* silent */ }
}

// ─── Write canal_memory fragments (v58 — fil pieuvre P0 #5) ──────────────────
export async function writeCanalMemory(
  identity_id: string,
  source: 'web' | 'voice_agent',
  fragments: Record<string, unknown>
) {
  try {
    const sb = await getSupabase()
    if (!sb) return
    // canal_memory.canal a un CHECK (widget|whatsapp|app|telegram|xyz) → canal='widget',
    // source préservée dans context_value._source.
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
      console.warn('[canal_memory] upsert error:', error.code, error.message)
    }
  } catch (err) {
    console.warn('[canal_memory] write exception:', (err as Error).message)
  }
}

// ─── Update prospect ─────────────────────────────────────────────────────────
export async function updateProspect(prospectId: string, updates: Record<string, unknown>) {
  try {
    const sb = await getSupabase()
    if (!sb) return
    await sb.from('pieuvre_prospects').update(updates).eq('id', prospectId)
  } catch { /* silent */ }
}

// ─── Sentiment detection (simple keyword-based) ──────────────────────────────
export function detectSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const pos = /merci|super|génial|parfait|cool|intéress|ok|bien|top|grave|trop bien|j'adore/i
  const neg = /non|pas|arnaque|nul|cher|confiance|mauvais|horrible|faux|mensonge|escroquerie/i
  if (pos.test(text)) return 'positive'
  if (neg.test(text)) return 'negative'
  return 'neutral'
}

// ─── Objection detection ─────────────────────────────────────────────────────
export function detectObjection(text: string): string | null {
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

// ─── Default system prompt (repli si le script Supabase ne charge pas) ───────
export const DEFAULT_SYSTEM_PROMPT = `Tu es Ajnaya. Pas une assistante. Pas un chatbot. Tu es l'intelligence qui veille sur les chauffeurs VTC.

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
- Tu croises trains, vols, événements, météo et habitudes locales en temps réel
- Tu indiques où se positionner 15 min avant la demande
- Compatible Uber, Bolt, Heetch et toutes les apps VTC
- Paris et Île-de-France
- Abonnement 12,97€/semaine avec essai gratuit (0€ débité). Plan annuel 499€ (38% d'économie — à mettre en avant subtilement). L'essai dure jusqu'au prochain lundi 18h.

PROGRESSION ÉMOTIONNELLE (closing en 4 échanges MAX — c'est CRUCIAL) :
- Message 1 : tu ÉCOUTES. Une question sur SA situation. "T'es sur quelle zone ?"
- Message 2 : tu partages un scénario terrain adapté à ce qu'il a dit. Concret. "Imagine, lundi 6h30, t'es positionné Gare de Lyon parce que je t'ai prévenu qu'un train arrive…"
- Message 3 : tu glisses l'essai gratuit naturellement. "Tu veux tester ça sur ta zone ? C'est gratuit, zéro engagement."
- Message 4+ : si pas converti → propose WhatsApp pour continuer. "File-moi ton numéro, je t'envoie un récap. Pas de spam."
- IMPORTANT : ne laisse JAMAIS la conversation traîner au-delà de 5-6 échanges. Chaque message doit avancer vers la conversion ou la capture du numéro.

OBJECTIONS (empathie d'abord, logique ensuite, jamais dans l'autre sens) :

- "c'est trop cher" → "12,97€ par semaine… c'est une course et demie. Mais je comprends, quand chaque euro compte c'est pas un choix facile. C'est pour ça que l'essai coûte rien — tu testes, tu vois si ça vaut le coup pour toi."

- "ça marche vraiment ?" → "T'as raison d'être prudent… Y'a trop de promesses vides dans le VTC. Le plus simple c'est de tester sur ta zone, tes horaires. C'est gratuit, tu risques rien."

- "j'ai pas confiance" → "Normal… Les chauffeurs en ont marre qu'on leur vende du vent. Teste gratuitement, juge par toi-même. Si ça te plaît pas, tu coupes en 1 clic."

- "je vais y réfléchir" → "Prends ton temps… Juste pour info, l'essai gratuit tourne jusqu'à lundi 18h. Après c'est le tarif direct."

- "c'est une arnaque" → "C'est quoi qui te fait penser ça ? Si t'as déjà testé un truc qui marchait pas, je comprends la méfiance. Moi c'est du temps réel — pas des stats d'il y a 6 mois."

PLAN ANNUEL : quand le chauffeur montre de l'intérêt pour le prix ou la durée → "Le plan annuel à 499€ c'est 175€ d'économie. Et surtout t'as la tête libre pendant 12 mois — pas de renouvellement surprise."

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
export function buildSystemPrompt(
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
    '/experience': 'Page "téléphone vivant" — le visiteur teste le VRAI chat Ajnaya en direct (pas une démo). Intention forte : il est venu spécifiquement pour te parler.',
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

  prompt += `\n\nCONTEXTE DE LA PAGE :\n${pageContextMap[pageSource] || `Page: ${pageSource}`}`
  prompt += `\nSection visible : ${sectionContextMap[scrollSection] || scrollSection}`

  if (heatScore > 20) prompt += '\n⚡ HEAT SCORE ÉLEVÉ — ce prospect est très engagé, pousse vers la conversion !'
  else if (heatScore > 10) prompt += '\n🔥 Le prospect montre de l\'intérêt, continue à chauffer.'

  if (messageCount >= 4) prompt += '\n📱 Plus de 4 échanges — propose de capturer le numéro si pas encore fait.'

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

  if (history.length > 0) {
    prompt += '\n\nHISTORIQUE DE CETTE CONVERSATION :'
    for (const msg of history) {
      prompt += `\n${msg.role === 'user' ? 'CHAUFFEUR' : 'AJNAYA'} : ${msg.text}`
    }
  }

  return prompt
}

// ─── Estimate cost ───────────────────────────────────────────────────────────
export function estimateCost(inputTokens: number, outputTokens: number): number {
  return (inputTokens * 0.8 + outputTokens * 4) / 1_000_000
}

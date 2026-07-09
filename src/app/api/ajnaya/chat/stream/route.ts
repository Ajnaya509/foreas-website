import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import {
  loadClosingScript, loadProspect, saveMessage, writeCanalMemory, updateProspect,
  detectSentiment, detectObjection, estimateCost, buildSystemPrompt, DEFAULT_SYSTEM_PROMPT,
} from '@/lib/ajnayaChatCore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/ajnaya/chat/stream — version STREAMING (SSE) du chat widget site.
 * Contrat : FOREAS-SHARED/AJNAYA_CONTRACTS.md §7 + BRIEF_STREAMING_AJNAYA_2026-07-09.md.
 * Events : meta → delta* → tts → done  (ou error). Terminaison = EXACTEMENT un event terminal.
 * `done.full_text` == concat des `delta.text` (parité). Même cerveau que /api/ajnaya/chat
 * (persona Supabase via loadClosingScript). Le non-stream /chat reste le filet de repli du client.
 */

const LLM_MODEL = 'claude-haiku-4-5-20251001'
const enc = new TextEncoder()
const sse = (event: string, data: unknown) => enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)

export async function POST(request: NextRequest) {
  const apiKey = process.env.FOREAS_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY

  let body: Record<string, unknown> = {}
  try { body = await request.json() } catch { /* handled below */ }

  const userMessage = typeof body.message === 'string' ? body.message : ''
  const pageSource = (body.pageSource as string) || '/'
  const scrollSection = (body.scrollSection as string) || 'hero'
  const heatScore = Number(body.heatScore) || 0
  const messageCount = Number(body.messageCount) || 0
  const conversationHistory = Array.isArray(body.conversationHistory)
    ? (body.conversationHistory as Array<{ role: string; text: string }>) : []
  const sessionId = (body.sessionId as string) || null
  const prospectId = (body.prospectId as string) || null
  const identityId = (body.identityId as string) || null
  const device = (body.device as string) || 'mobile'

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false
      const send = (event: string, data: unknown) => { if (!closed) controller.enqueue(sse(event, data)) }
      const end = () => { if (!closed) { closed = true; controller.close() } }
      // Padding anti-buffer edge (~2 Ko de commentaire ignoré par le client) → force le 1er flush.
      if (!closed) controller.enqueue(enc.encode(`:${' '.repeat(2048)}\n\n`))

      // Garde-fous d'entrée → error (le client bascule sur /chat)
      if (!apiKey || apiKey === 'à_remplir_par_le_user') {
        send('error', { message: 'LLM indisponible', code: 'no_api_key' }); return end()
      }
      if (!userMessage) {
        send('error', { message: 'Message requis', code: 'bad_request' }); return end()
      }

      send('meta', { session_id: sessionId, llm_model: LLM_MODEL, identity_id: identityId })

      // Prompt (même logique que /chat → même persona)
      const scriptPrompt = await loadClosingScript()
      const systemBase = scriptPrompt || DEFAULT_SYSTEM_PROMPT
      const prospect = prospectId ? await loadProspect(prospectId) : null
      const systemPrompt = buildSystemPrompt(
        systemBase, pageSource, scrollSection, prospect as Record<string, unknown> | null,
        heatScore, messageCount, conversationHistory,
      )

      let fullText = ''
      let usage = { input_tokens: 0, output_tokens: 0 }
      try {
        const anthropic = new Anthropic({ apiKey })
        const llmStream = anthropic.messages.stream({
          model: LLM_MODEL, max_tokens: 200, temperature: 0.7,
          system: systemPrompt, messages: [{ role: 'user', content: userMessage }],
        })

        for await (const ev of llmStream) {
          if (request.signal.aborted) { llmStream.abort(); break } // honorer l'abandon client
          if (ev.type === 'content_block_delta' && ev.delta.type === 'text_delta' && ev.delta.text) {
            fullText += ev.delta.text
            send('delta', { text: ev.delta.text })
          }
        }

        if (request.signal.aborted) { return end() } // pas d'event terminal si le client est parti

        const finalMsg = await llmStream.finalMessage().catch(() => null)
        if (finalMsg?.usage) usage = { input_tokens: finalMsg.usage.input_tokens, output_tokens: finalMsg.usage.output_tokens }

        // Parité : si aucun texte n'a été streamé → traiter comme erreur honnête (pas de bulle vide)
        if (!fullText.trim()) { send('error', { message: 'Réponse vide', code: 'empty' }); return end() }

        // Side-effects IDENTIQUES à /chat (log + mémoire + prospect), fire-and-forget
        const sentiment = detectSentiment(userMessage)
        const objection = detectObjection(userMessage)
        const hasConversionLink = fullText.includes('/tarifs2')
        const isInterested = /essai|tester|prix|combien|commencer|inscri/i.test(userMessage)
        const conversionEvent = hasConversionLink && isInterested
        const currentProspectId = prospectId || (prospect as { id?: string } | null)?.id || null

        saveMessage({ prospect_id: currentProspectId, tentacle: 'widget_site', channel: 'web_widget', direction: 'inbound', content: userMessage, sentiment, objection_detected: objection, metadata: { sessionId, pageSource, scrollSection, device, heatScore, stream: true } })
        saveMessage({ prospect_id: currentProspectId, tentacle: 'widget_site', channel: 'web_widget', direction: 'outbound', content: fullText, llm_model: LLM_MODEL, llm_tokens: usage.output_tokens, llm_cost_usd: estimateCost(usage.input_tokens, usage.output_tokens), conversion_event: conversionEvent, metadata: { sessionId, stream: true } })
        if (identityId) {
          const nowISO = new Date().toISOString()
          writeCanalMemory(identityId, 'web', {
            last_user_msg: { text: userMessage, at: nowISO, page_source: pageSource },
            last_user_intent: { sentiment, objection_detected: objection, has_conversion_link: hasConversionLink, at: nowISO },
            last_ajnaya_msg: { text: fullText, llm_model: LLM_MODEL, at: nowISO },
            hot_score_peak: { value: heatScore, at: nowISO, scroll_section: scrollSection },
          })
        }
        if (currentProspectId) {
          const p = prospect as { conversations_count?: number; status?: string } | null
          updateProspect(currentProspectId, { conversations_count: (p?.conversations_count || 0) + 1, last_conversation_at: new Date().toISOString() })
        }

        // Texte propre pour le TTS (retire les tags [xxx] éventuels)
        const ttsText = fullText.replace(/\[[\w\s]+\]\s*/g, '')
        send('tts', { tts_text: ttsText, audio_url: null })
        send('done', {
          full_text: fullText,
          pieuvre_reply: { text: fullText, tts_text: ttsText, llm_model: LLM_MODEL, audio_url: null },
          expects_voice_response: false,
          intent_detected: objection || null,
          next_actions: [],
          prospect_id: currentProspectId,
          should_capture_phone: messageCount >= 3 && !prospectId,
          conversion_event: conversionEvent,
        })
        return end()
      } catch (err) {
        // Erreur LLM en cours de flux → honnêteté : jamais de texte inventé
        send('error', { message: (err as Error).message || 'Erreur LLM', code: 'llm_error' })
        return end()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Content-Encoding': 'identity',
    },
  })
}

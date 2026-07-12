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
 *
 * ⚠️ MÊME ROUTAGE QUE /api/ajnaya/chat (pas de cerveau parallèle — NORTH_STAR §4) :
 *   - PIEUVRE_BRAIN_ENABLED=true  → PROXY du stream Railway (vraie persona Pieuvre, streamée).
 *                                   Si indispo → event error → le widget replie sur /chat (Pieuvre).
 *   - sinon                       → stream Haiku local (le MÊME cerveau que le repli /chat Haiku).
 * Events : meta → delta* → tts → done  (ou error). `done.full_text` == Σ`delta`. /chat non-stream = filet.
 */

const LLM_MODEL = 'claude-haiku-4-5-20251001'
const RAILWAY = 'https://foreas-stripe-backend-production.up.railway.app'
const enc = new TextEncoder()
const sse = (event: string, data: unknown) => enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
const PAD = `:${' '.repeat(2048)}\n\n` // anti-buffer edge

const SSE_HEADERS = {
  'Content-Type': 'text/event-stream; charset=utf-8',
  'Cache-Control': 'no-cache, no-transform',
  'Connection': 'keep-alive',
  'X-Accel-Buffering': 'no',
  'Content-Encoding': 'identity',
}

// Réponse SSE à un seul event terminal `error` → le client bascule sur /chat (filet).
function sseError(code: string, message = 'stream indisponible') {
  return new Response(enc.encode(PAD + `event: error\ndata: ${JSON.stringify({ message, code })}\n\n`), { headers: SSE_HEADERS })
}

export async function POST(request: NextRequest) {
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
  // Donnée réelle optionnelle (ex. zone-stats) → transmise en live_context au cerveau Pieuvre,
  // pour que la réponse streamée soit ancrée sur de vrais chiffres, jamais une supposition du LLM.
  const liveContext = (body.liveContext && typeof body.liveContext === 'object') ? body.liveContext as Record<string, unknown> : undefined

  if (!userMessage) return sseError('bad_request', 'Message requis')

  // ─── Cerveau Pieuvre (prod) : proxy du stream Railway ────────────────────────
  if (process.env.PIEUVRE_BRAIN_ENABLED === 'true') {
    const key = process.env.FOREAS_SERVICE_KEY || process.env.PIEUVRE_API_KEY || ''
    if (key) {
      try {
        const rw = await fetch(`${RAILWAY}/api/ajnaya/chat/stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-FOREAS-SERVICE-KEY': key, 'Accept-Encoding': 'identity' },
          body: JSON.stringify({
            message: userMessage, text: userMessage,
            context: {
              channel: 'widget_site', platform: 'web', session_id: sessionId, identity_id: identityId,
              page_source: pageSource, scroll_section: scrollSection, heat_score: heatScore,
              ...(liveContext ? { live_context: liveContext } : {}),
            },
            history: conversationHistory.map(h => ({ role: h.role === 'ajnaya' ? 'assistant' : h.role, content: h.text })),
          }),
          // abandon client + timeout 1er octet 8s (Railway muet → sseError → repli /chat, jamais d'écran figé)
          signal: (AbortSignal as { any?: (s: AbortSignal[]) => AbortSignal }).any?.([request.signal, AbortSignal.timeout(8000)]) ?? AbortSignal.timeout(8000),
        })
        if (rw.ok && (rw.headers.get('content-type') || '').includes('text/event-stream') && rw.body) {
          return new Response(rw.body, { headers: SSE_HEADERS }) // pass-through Pieuvre streamé
        }
      } catch { /* → error ci-dessous → repli /chat */ }
    }
    // Pas de stream Pieuvre dispo (clé absente / Railway KO) → repli /chat (cerveau Pieuvre N8N)
    return sseError('pieuvre_stream_unavailable')
  }

  // ─── Mode Haiku (PIEUVRE_BRAIN off) : stream local, cohérent avec /chat Haiku ────
  const apiKey = process.env.FOREAS_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY
  if (!apiKey || apiKey === 'à_remplir_par_le_user') return sseError('no_api_key', 'LLM indisponible')

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false
      const send = (event: string, data: unknown) => { if (!closed) controller.enqueue(sse(event, data)) }
      const end = () => { if (!closed) { closed = true; controller.close() } }
      if (!closed) controller.enqueue(enc.encode(PAD))

      send('meta', { session_id: sessionId, llm_model: LLM_MODEL, identity_id: identityId })

      const scriptPrompt = await loadClosingScript()
      const systemBase = scriptPrompt || DEFAULT_SYSTEM_PROMPT
      const prospect = prospectId ? await loadProspect(prospectId) : null
      let systemPrompt = buildSystemPrompt(
        systemBase, pageSource, scrollSection, prospect as Record<string, unknown> | null,
        heatScore, messageCount, conversationHistory,
      )
      if (liveContext) {
        systemPrompt += `\n\nDONNÉES RÉELLES DISPONIBLES (utilise-les si pertinent, jamais d'autre chiffre inventé) :\n${JSON.stringify(liveContext)}`
      }

      let fullText = ''
      let usage = { input_tokens: 0, output_tokens: 0 }
      try {
        const anthropic = new Anthropic({ apiKey })
        const llmStream = anthropic.messages.stream({
          model: LLM_MODEL, max_tokens: 200, temperature: 0.7,
          system: systemPrompt, messages: [{ role: 'user', content: userMessage }],
        })

        for await (const ev of llmStream) {
          if (request.signal.aborted) { llmStream.abort(); break }
          if (ev.type === 'content_block_delta' && ev.delta.type === 'text_delta' && ev.delta.text) {
            fullText += ev.delta.text
            send('delta', { text: ev.delta.text })
          }
        }
        if (request.signal.aborted) { return end() } // client parti → pas d'event terminal

        const finalMsg = await llmStream.finalMessage().catch(() => null)
        if (finalMsg?.usage) usage = { input_tokens: finalMsg.usage.input_tokens, output_tokens: finalMsg.usage.output_tokens }
        if (!fullText.trim()) { send('error', { message: 'Réponse vide', code: 'empty' }); return end() }

        // Side-effects IDENTIQUES à /chat (log + mémoire + prospect complet)
        const sentiment = detectSentiment(userMessage)
        const objection = detectObjection(userMessage)
        const hasConversionLink = fullText.includes('/tarifs2')
        const conversionEvent = hasConversionLink && /essai|tester|prix|combien|commencer|inscri/i.test(userMessage)
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
          const p = prospect as { conversations_count?: number; status?: string; objections?: unknown } | null
          const updates: Record<string, unknown> = { conversations_count: (p?.conversations_count || 0) + 1, last_conversation_at: new Date().toISOString() }
          if (objection && p) {
            const existing = Array.isArray(p.objections) ? (p.objections as string[]) : []
            if (!existing.includes(objection)) updates.objections = [...existing, objection]
          }
          if (heatScore > 20 && p?.status === 'new') updates.status = 'warm'
          updateProspect(currentProspectId, updates)
        }

        const ttsText = fullText.replace(/\[[\w\s]+\]\s*/g, '')
        send('tts', { tts_text: ttsText, audio_url: null })
        send('done', {
          full_text: fullText,
          pieuvre_reply: { text: fullText, tts_text: ttsText, llm_model: LLM_MODEL, audio_url: null },
          expects_voice_response: false, intent_detected: objection || null, next_actions: [],
          prospect_id: currentProspectId, should_capture_phone: messageCount >= 3 && !prospectId, conversion_event: conversionEvent,
        })
        return end()
      } catch (err) {
        send('error', { message: (err as Error).message || 'Erreur LLM', code: 'llm_error' })
        return end()
      }
    },
  })

  return new Response(stream, { headers: SSE_HEADERS })
}

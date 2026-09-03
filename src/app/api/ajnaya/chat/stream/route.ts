import { NextRequest } from 'next/server'
import { isSameOriginRequest, forbiddenOrigin } from '@/lib/api-guard'
import { callPieuvreBrain } from '@/lib/pieuvre-client'
import { resolveSiteIdentity } from '@/lib/identityGate'
import { readAcquisitionFromRequest, persistAcquisition } from '@/lib/acquisitionServer'
import { clientServeurOuNull } from '@/lib/supabaseServeur'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Flux du site au lancement : un seul cerveau, P15.
 * P15 répond d'un bloc ; on garde le contrat SSE du navigateur avec un delta
 * unique. Aucun autre modèle ne prend la parole si la Pieuvre est indisponible.
 */

const enc = new TextEncoder()
const PAD = `:${' '.repeat(2048)}\n\n`
const sse = (event: string, data: unknown) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`

const SSE_HEADERS = {
  'Content-Type': 'text/event-stream; charset=utf-8',
  'Cache-Control': 'no-cache, no-transform',
  Connection: 'keep-alive',
  'X-Accel-Buffering': 'no',
  'Content-Encoding': 'identity',
}

function sseError(code: string, message = 'Ajnaya est momentanément indisponible.') {
  return new Response(enc.encode(PAD + sse('error', { code, message })), { headers: SSE_HEADERS })
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return forbiddenOrigin()

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return sseError('bad_request', 'Message illisible.')
  }

  const userMessage = typeof body.message === 'string' ? body.message.trim() : ''
  if (!userMessage) return sseError('bad_request', 'Message requis.')
  if (process.env.PIEUVRE_BRAIN_ENABLED !== 'true') return sseError('pieuvre_disabled')

  const pageSource = typeof body.pageSource === 'string' ? body.pageSource : '/'
  const scrollSection = typeof body.scrollSection === 'string' ? body.scrollSection : 'hero'
  const heatScore = Number(body.heatScore) || 0
  const sessionId = typeof body.sessionId === 'string' && body.sessionId
    ? body.sessionId
    : `site-stream-${Date.now()}`
  const visitorId = typeof body.visitor_id === 'string'
    ? body.visitor_id
    : typeof body.visitorId === 'string' ? body.visitorId : null
  const claimedIdentityId = typeof body.identityId === 'string'
    ? body.identityId
    : typeof body.identity_id === 'string' ? body.identity_id : null
  const device = typeof body.device === 'string' ? body.device : 'mobile'
  const history = Array.isArray(body.conversationHistory)
    ? (body.conversationHistory as Array<{ role?: string; text?: string }>)
        .filter((item) => typeof item?.text === 'string')
        .slice(-10)
        .map((item) => ({
          role: item.role === 'ajnaya' ? 'assistant' : item.role || 'user',
          text: item.text as string,
        }))
    : []
  const liveContext = body.liveContext && typeof body.liveContext === 'object'
    ? body.liveContext as Record<string, unknown>
    : undefined

  const identityId = await resolveSiteIdentity(request, {
    canal: 'widget',
    visitor_id: visitorId,
    claimed_identity_id: claimedIdentityId,
  })
  const acquisition = readAcquisitionFromRequest(request)
  const acquisitionMeta = Object.fromEntries(
    Object.entries(acquisition).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
  )
  if (identityId) {
    const sb = clientServeurOuNull()
    if (sb) await persistAcquisition(sb, identityId, 'widget_stream', acquisition)
  }

  const context = {
    page_source: pageSource,
    scroll_section: scrollSection,
    heat_score: heatScore,
    history_last_10: history,
    ...(visitorId ? { visitor_id: visitorId } : {}),
    ...(liveContext ? { live_context: liveContext } : {}),
  } as Parameters<typeof callPieuvreBrain>[0]['context']

  const result = await callPieuvreBrain({
    tentacle: 'widget_site',
    canal: 'web',
    identity_id: identityId,
    session_id: sessionId,
    message: { role: 'user', text: userMessage, type: 'text' },
    context,
    meta: {
      device,
      utm: acquisitionMeta,
      user_agent: request.headers.get('user-agent') || '',
    },
  })
  if (!result?.reply?.text) return sseError('pieuvre_indisponible')

  const fullText = result.reply.text
  const canonicalIdentityId = result.identity_id || identityId
  let responseBody = PAD
  responseBody += sse('meta', {
    session_id: sessionId,
    llm_model: result.reply.llm_model,
    identity_id: canonicalIdentityId,
  })
  responseBody += sse('delta', { text: fullText })
  if (result.reply.tts_text || result.reply.audio_url) {
    responseBody += sse('tts', {
      tts_text: result.reply.tts_text || fullText,
      audio_url: result.reply.audio_url || null,
    })
  }
  responseBody += sse('done', {
    full_text: fullText,
    pieuvre_reply: result.reply,
    intent_detected: result.intent_detected ?? null,
    next_actions: result.next_actions ?? [],
    prospect_id: result.prospect_id ?? null,
    should_capture_phone: result.should_capture_phone ?? false,
    conversion_event: false,
  })

  return new Response(enc.encode(responseBody), { headers: SSE_HEADERS })
}

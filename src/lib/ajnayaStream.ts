/**
 * ajnayaStream — client SSE navigateur pour /api/ajnaya/chat/stream.
 * Équivalent web de src/services/AjnayaStream.ts (app). Un contrat, deux afficheurs.
 * Contrat : FOREAS-SHARED/AJNAYA_CONTRACTS.md §7.
 *
 * Robustesse (à valider Fable 5) :
 *  - buffer de ligne (chunks coupés au milieu d'un event), TextDecoder stream (UTF-8 coupé)
 *  - keepalive `:` ignoré, `data:` multi-lignes concaténées
 *  - EXACTEMENT un event terminal (done XOR error) ; rien dispatché après
 *  - flux fermé sans done/error = anomalie → onError avec le Σdelta déjà reçu
 *  - watchdog d'inactivité inter-event, reader.cancel() anti-fuite, AbortController
 */

export interface StreamDone {
  full_text: string
  pieuvre_reply?: { text: string; tts_text?: string; llm_model?: string; audio_url?: string | null }
  expects_voice_response?: boolean
  intent_detected?: string | null
  next_actions?: unknown[]
  prospect_id?: string | null
  should_capture_phone?: boolean
  conversion_event?: boolean
}

export interface StreamCallbacks {
  onMeta?: (m: { session_id?: string | null; llm_model?: string; identity_id?: string | null }) => void
  onDelta: (text: string, acc: string) => void
  onTts?: (t: { tts_text?: string; audio_url?: string | null }) => void
  onDone: (d: StreamDone) => void
  /** message honnête ; streamedText = ce qui a déjà été affiché (à finaliser tel quel, jamais inventer) */
  onError: (message: string, streamedText: string) => void
}

/** Levée AVANT tout delta (endpoint indispo / mauvais content-type) → le caller REPLIE sur /chat. */
export class StreamUnavailableError extends Error {
  constructor(reason: string) { super(reason); this.name = 'StreamUnavailableError' }
}

const INACTIVITY_MS = 20_000 // pas d'event pendant 20 s → on coupe

function parseEvent(raw: string): { event: string | null; data: string | null } {
  let event: string | null = null
  const dataLines: string[] = []
  for (const line of raw.split('\n')) {
    if (line === '' || line.startsWith(':')) continue // commentaire / keepalive
    if (line.startsWith('event:')) event = line.slice(6).trim()
    else if (line.startsWith('data:')) dataLines.push(line.slice(5).replace(/^ /, ''))
  }
  return { event, data: dataLines.length ? dataLines.join('\n') : null }
}

export async function streamAjnayaChat(
  body: Record<string, unknown>,
  cb: StreamCallbacks,
  signal?: AbortSignal,
): Promise<void> {
  let res: Response
  try {
    res = await fetch('/api/ajnaya/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        'Accept-Encoding': 'identity', // pas de compression → pas de rebufferisation du flux
      },
      body: JSON.stringify(body),
      signal,
    })
  } catch (e) {
    if ((e as Error)?.name === 'AbortError') return
    throw new StreamUnavailableError('network') // → repli /chat
  }

  const ct = res.headers.get('content-type') || ''
  if (!res.ok || !res.body || !ct.includes('text/event-stream')) {
    throw new StreamUnavailableError(`bad_response_${res.status}`) // → repli /chat
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let acc = ''
  let terminal = false // done OU error vu

  const dispatch = (event: string | null, dataStr: string | null) => {
    if (terminal || !event) return
    let data: Record<string, unknown> = {}
    if (dataStr) { try { data = JSON.parse(dataStr) } catch { return } }
    switch (event) {
      case 'meta': cb.onMeta?.(data as never); break
      case 'delta': {
        const t = typeof data.text === 'string' ? data.text : ''
        if (t) { acc += t; cb.onDelta(t, acc) }
        break
      }
      case 'tts': cb.onTts?.(data as never); break
      case 'done': terminal = true; cb.onDone(data as unknown as StreamDone); break
      case 'error': terminal = true; cb.onError(String(data.message || 'error'), acc); break
    }
  }

  try {
    while (!terminal) {
      const { done, value } = await Promise.race([
        reader.read(),
        new Promise<never>((_, rej) => setTimeout(() => rej(new Error('inactivity')), INACTIVITY_MS)),
      ])
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      let idx: number
      // Sépare sur la frontière d'event `\n\n` (gère aussi `\r\n\r\n`)
      while ((idx = buffer.search(/\r?\n\r?\n/)) !== -1) {
        const end = idx + (buffer[idx] === '\r' ? 4 : 2)
        const raw = buffer.slice(0, idx)
        buffer = buffer.slice(end)
        const { event, data } = parseEvent(raw)
        dispatch(event, data)
        if (terminal) break
      }
    }
  } catch (e) {
    if ((e as Error)?.name === 'AbortError' || signal?.aborted) { try { await reader.cancel() } catch { /* noop */ } return }
    // inactivité / erreur réseau EN COURS de flux : on finalise honnêtement avec ce qui est affiché
    if (!terminal) { terminal = true; cb.onError((e as Error).message || 'stream_error', acc) }
  } finally {
    try { await reader.cancel() } catch { /* noop */ }
  }

  // Flux fermé sans event terminal = anomalie → on finalise avec le Σdelta (jamais inventer)
  if (!terminal) cb.onError('stream_closed_without_terminal', acc)
}

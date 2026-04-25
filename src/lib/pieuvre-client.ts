/**
 * Pieuvre Brain Client — HTTP client for the N8N Pieuvre Responder.
 *
 * When PIEUVRE_BRAIN_ENABLED=true, /api/ajnaya/chat routes through this
 * instead of calling Claude Haiku directly. Returns null on any failure
 * so the caller can fall back to the local Haiku path transparently.
 *
 * Conformité : AJNAYA_CONTRACTS.md §8 — Contrat Responder Pieuvre
 * Env vars required:
 *   PIEUVRE_RESPOND_URL         — base URL of Pieuvre N8N instance
 *   PIEUVRE_RESPOND_TIMEOUT_MS  — default 5000
 *   PIEUVRE_RESPOND_SECRET      — X-Foreas-Shared-Secret header value
 */

import { randomUUID } from 'node:crypto'

// ─── Types (mirrors AJNAYA_CONTRACTS.md §8) ───────────────────────────────────

export interface PieuvrePayload {
  tentacle: string           // 'widget_site'
  canal: string              // 'web'
  identity_id: string | null
  session_id: string
  message: {
    role: 'user'
    text: string
    type: 'text' | 'voice' | 'image'
  }
  context: {
    page_source: string
    scroll_section: string
    heat_score: number
    history_last_10: Array<{ role: string; text: string }>
  }
  meta: {
    device: string
    utm: Record<string, string>
    user_agent: string
  }
}

export interface PieuvreResponse {
  ok: boolean
  reply: {
    text: string
    audio_url?: string | null    // Koraly TTS — nullable
    llm_model: string
  }
  identity_id: string
  prospect_id?: string
  intent_detected?: string | null
  objection_detected?: string | null
  sentiment?: string
  next_actions?: Array<{ type: string; label: string; url: string }>
  should_capture_phone?: boolean
  suggest_handoff?: { target_canal: string; reason: string } | null
  metadata?: {
    latency_ms: number
    cost_usd: number
  }
}

// ─── Main function ────────────────────────────────────────────────────────────

/**
 * Call the Pieuvre Responder webhook.
 * Returns null on timeout, HTTP error, or malformed response.
 * Caller MUST fall back to local matchResponse() when null is returned.
 */
export async function callPieuvreBrain(
  payload: PieuvrePayload
): Promise<PieuvreResponse | null> {
  const rawUrl = (process.env.PIEUVRE_RESPOND_URL || '').replace(/\/$/, '')
  if (!rawUrl) {
    // Pieuvre URL not configured — silent skip, fall back to Haiku
    return null
  }
  // Accept both forms: base URL or full webhook URL — append path only if missing.
  // Site2026v38 fix: PIEUVRE_RESPOND_URL was stored as full webhook URL on Vercel,
  // causing double-path 404 → silent fallback to Haiku for all production traffic.
  const fetchUrl = rawUrl.endsWith('/webhook/ajnaya-respond')
    ? rawUrl
    : `${rawUrl}/webhook/ajnaya-respond`

  const timeoutMs = parseInt(process.env.PIEUVRE_RESPOND_TIMEOUT_MS || '5000', 10)
  const sharedSecret = process.env.PIEUVRE_RESPOND_SECRET || ''
  const idempotencyKey = randomUUID()

  const controller = new AbortController()
  const tid = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(fetchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
        ...(sharedSecret ? { 'X-Foreas-Shared-Secret': sharedSecret } : {}),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    clearTimeout(tid)

    if (!res.ok) {
      console.warn(`[pieuvre-client] HTTP ${res.status} from Pieuvre`)
      return null
    }

    const data = (await res.json()) as PieuvreResponse

    if (!data.ok || typeof data.reply?.text !== 'string' || !data.reply.text) {
      console.warn('[pieuvre-client] Malformed response from Pieuvre')
      return null
    }

    return data
  } catch (err) {
    clearTimeout(tid)
    const msg = (err as Error).message || ''
    if (controller.signal.aborted || msg.includes('abort') || msg.includes('timeout')) {
      console.warn(`[pieuvre-client] Pieuvre timeout after ${timeoutMs}ms — falling back to Haiku`)
    } else {
      console.error('[pieuvre-client] Network error:', msg)
    }
    return null
  }
}

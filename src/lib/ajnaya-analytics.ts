export interface WidgetMessage {
  role: 'user' | 'ajnaya'
  text: string
  timestamp: string
}

export interface WidgetConversation {
  session_id: string
  page_source: string
  device: string
  messages: WidgetMessage[]
  intents_detected: string[]
  cta_clicked_after: string | null
  conversation_duration_ms: number
}

let _sessionId: string | null = null

export function getSessionId(): string {
  if (!_sessionId) {
    _sessionId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  }
  return _sessionId
}

export function getDevice(): string {
  if (typeof window === 'undefined') return 'desktop'
  return window.innerWidth <= 768 ? 'mobile' : 'desktop'
}

export function sendWidgetAnalytics(data: WidgetConversation): void {
  try {
    const payload = JSON.stringify(data)
    // Prefer sendBeacon for reliability during page unload
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon('/api/widget-analytics', payload)
    } else {
      fetch('/api/widget-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {})
    }
  } catch {
    // Fire and forget — never break UX
  }
}

'use client'

/**
 * observe.ts — porte d'identité côté client (relais → /api/observe → Pieuvre).
 * Brief : FOREAS-SHARED/briefs/AJNAYA_CAPTURE_TOUTES_LES_PORTES.md
 *
 * • observeVisit(visitor_id) : à chaque visite CONSENTIE (gate appelant).
 * • observeContact({email,phone}) : à l'envoi d'un formulaire (PII hashée côté serveur).
 * • external_id (= notre visitor_id) renvoyé aux pixels Meta (via CAPI, voir tracking.ts) + TikTok.
 *
 * Fire-and-forget : jamais bloquant, jamais cassant pour l'UX.
 */

import { hasTrackingConsent } from './consent'

let _visitorId: string | null = null
export function getStoredVisitorId(): string | null { return _visitorId }

interface ObservePayload { visitor_id?: string; email?: string; phone?: string; canal?: string; consent_ipua?: boolean }

async function postObserve(payload: ObservePayload): Promise<void> {
  try {
    await fetch('/api/observe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ canal: 'site', ...payload }),
      keepalive: true,
    })
  } catch { /* fire-and-forget — on n'interrompt jamais l'utilisateur */ }
}

/** external_id (notre visitor_id) → TikTok pixel. Meta passe par la CAPI (tracking.ts). */
function identifyTikTok(visitorId: string): void {
  if (typeof window === 'undefined') return
  try {
    const w = window as unknown as { ttq?: { identify?: (o: Record<string, string>) => void } }
    w.ttq?.identify?.({ external_id: visitorId })
  } catch { /* noop */ }
}

/** Appelé à chaque visite — UNIQUEMENT si consentement tracking (fingerprint = CNIL). */
export function observeVisit(visitorId: string): void {
  if (!visitorId) return
  _visitorId = visitorId
  if (!hasTrackingConsent()) return // pas de consentement → on stocke pour le CAPI mais on n'observe pas l'ip/ua
  identifyTikTok(visitorId)
  void postObserve({ visitor_id: visitorId, consent_ipua: true })
}

/** Appelé à l'envoi d'un formulaire (email/phone fournis par l'utilisateur). */
export function observeContact(opts: { email?: string; phone?: string }): void {
  if (!opts.email && !opts.phone) return
  void postObserve({ ...opts, visitor_id: _visitorId ?? undefined })
}

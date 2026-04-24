'use client'

import { hasTrackingConsent } from './consent'

/**
 * Tracking dual : pixel client + CAPI server-side via /api/pixel/capi.
 *
 * Meta déduplique les 2 sources via event_id (UUID). Sans CAPI server, on perd
 * 40-60% des signaux à cause iOS 14.5+ / AdBlockers / ITP. Doubler les canaux
 * = attribution CTWA préservée en 2026.
 *
 * Usage basique (inchangé) :
 *   trackEvent('Lead')
 *   trackInitiateCheckout('Pro', 12.97)
 *
 * Usage avancé avec user data pour matching Meta :
 *   trackEvent('Lead', {}, { email: 'a@b.com', phone: '+33...' })
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventParams = Record<string, any>

interface UserMatchData {
  email?: string
  phone?: string
  firstName?: string
  lastName?: string
  city?: string
  country?: string
  zipCode?: string
  externalId?: string
}

function uuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Fallback simple
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function trackEvent(
  eventName: string,
  params?: EventParams,
  userData?: UserMatchData
) {
  if (!hasTrackingConsent()) return
  if (typeof window === 'undefined') return

  // Event ID partagé entre pixel client et CAPI server — Meta déduplique automatiquement
  const eventId = uuid()

  // ─── Meta Pixel (client) ────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any).fbq) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).fbq('track', eventName, params, { eventID: eventId })
  }

  // ─── Meta CAPI (server) ────────────────────────────────────────────────
  fetch('/api/pixel/capi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventName,
      eventId,
      eventSourceUrl: typeof window !== 'undefined' ? window.location.href : undefined,
      userData: userData || {},
      customData: params
        ? {
            value: typeof params.value === 'number' ? params.value : undefined,
            currency: typeof params.currency === 'string' ? params.currency : undefined,
            contentName: typeof params.content_name === 'string' ? params.content_name : undefined,
            contentIds: Array.isArray(params.content_ids) ? params.content_ids : undefined,
            contentType: typeof params.content_type === 'string' ? params.content_type : undefined,
          }
        : undefined,
    }),
    keepalive: true, // garantit l'envoi même si la page change
  }).catch(() => {
    /* silent — fallback pixel client */
  })

  // ─── TikTok Pixel (client) ─────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any).ttq) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).ttq.track(eventName, params)
  }
}

// Convenience wrappers for common events
export const trackPageView = (userData?: UserMatchData) => trackEvent('PageView', undefined, userData)
export const trackViewContent = (contentName?: string, userData?: UserMatchData) =>
  trackEvent('ViewContent', { content_name: contentName }, userData)
export const trackInitiateCheckout = (plan?: string, value?: number, userData?: UserMatchData) =>
  trackEvent('InitiateCheckout', { content_name: plan, value, currency: 'EUR' }, userData)
export const trackAddPaymentInfo = (userData?: UserMatchData) =>
  trackEvent('AddPaymentInfo', undefined, userData)
export const trackPurchase = (value: number, currency = 'EUR', userData?: UserMatchData) =>
  trackEvent('Purchase', { value, currency }, userData)
export const trackLead = (userData?: UserMatchData) => trackEvent('Lead', undefined, userData)

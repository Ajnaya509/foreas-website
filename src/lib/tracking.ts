'use client'

import { hasTrackingConsent } from './consent'
import { getStoredVisitorId } from './observe'

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

// Les composants du site appellent trackEvent() avec des noms d'events Meta
// ('Lead', 'Purchase', ...) — TikTok a sa propre nomenclature standard. Mappé ici,
// une seule fois, pour que tout le site (déjà écrit contre les noms Meta) envoie
// aussi TikTok sans que chaque appelant ait besoin de connaître les deux vocabulaires.
const META_TO_TIKTOK_EVENT: Record<string, string> = {
  PageView: 'ViewContent',
  ViewContent: 'ViewContent',
  InitiateCheckout: 'InitiateCheckout',
  AddPaymentInfo: 'AddPaymentInfo',
  Purchase: 'CompletePayment',
  Lead: 'SubmitForm',
  CompleteRegistration: 'CompleteRegistration',
  Contact: 'Contact',
  Subscribe: 'Subscribe',
  StartTrial: 'Subscribe', // TikTok n'a pas d'équivalent "StartTrial" standard
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
      // external_id (notre visitor_id) par défaut → Meta CAPI relie l'event à l'identité (brief observe).
      userData: { externalId: getStoredVisitorId() ?? undefined, ...(userData || {}) },
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
  // Même event_id que Meta pour la dédup pixel/CAPI TikTok — voir tiktok-events-api.ts.
  const tiktokEventName = META_TO_TIKTOK_EVENT[eventName] || eventName
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any).ttq) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).ttq.track(tiktokEventName, params, { event_id: eventId })
  }

  // ─── TikTok Events API (server) ────────────────────────────────────────
  // Miroir server-side, même logique que le bloc Meta CAPI ci-dessus. Sans clé
  // TikTok configurée, l'endpoint répond simplement { ok:false } — jamais d'erreur
  // visible côté visiteur (voir tiktok-events-api.ts, fail-open volontaire).
  fetch('/api/pixel/tiktok-capi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventName: tiktokEventName,
      eventId,
      eventSourceUrl: typeof window !== 'undefined' ? window.location.href : undefined,
      userData: { externalId: getStoredVisitorId() ?? undefined, ...(userData || {}) },
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
    keepalive: true,
  }).catch(() => {
    /* silent — fallback pixel client */
  })
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

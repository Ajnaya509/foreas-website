'use client'

import { hasTrackingConsent } from './consent'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function trackEvent(eventName: string, params?: Record<string, any>) {
  if (!hasTrackingConsent()) return

  if (typeof window === 'undefined') return

  // Meta Pixel
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any).fbq) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).fbq('track', eventName, params)
  }

  // TikTok Pixel
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any).ttq) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).ttq.track(eventName, params)
  }
}

// Convenience wrappers for common events
export const trackPageView = () => trackEvent('PageView')
export const trackViewContent = (contentName?: string) => trackEvent('ViewContent', { content_name: contentName })
export const trackInitiateCheckout = (plan?: string, value?: number) => trackEvent('InitiateCheckout', { content_name: plan, value })
export const trackAddPaymentInfo = () => trackEvent('AddPaymentInfo')
export const trackPurchase = (value: number, currency = 'EUR') => trackEvent('Purchase', { value, currency })
export const trackLead = () => trackEvent('Lead')

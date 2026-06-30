'use client'

/**
 * IdentityObserver — monté global (layout). À chaque visite CONSENTIE :
 *  1. récupère le visitor_id (fingerprint),
 *  2. l'observe via la porte universelle Pieuvre (/api/observe),
 *  3. le pose en external_id sur les pixels (TikTok direct + Meta via CAPI).
 *
 * Respecte le consentement (CNIL) : ne fait RIEN sans `foreas_consent_accepted`.
 * Réagit à l'acceptation de la bannière (même événement que les pixels).
 */

import { useEffect, useRef } from 'react'
import { getVisitorId } from '@/lib/zoneFingerprint'
import { observeVisit } from '@/lib/observe'
import { hasTrackingConsent } from '@/lib/consent'

export default function IdentityObserver() {
  const done = useRef(false)

  useEffect(() => {
    const run = async () => {
      if (done.current || !hasTrackingConsent()) return
      try {
        const { visitorId } = await getVisitorId()
        if (visitorId) {
          done.current = true
          observeVisit(visitorId)
        }
      } catch { /* fingerprint indispo — on ne casse rien */ }
    }
    run()
    window.addEventListener('foreas_consent_accepted', run)
    return () => window.removeEventListener('foreas_consent_accepted', run)
  }, [])

  return null
}

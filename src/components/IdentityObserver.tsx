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
import { captureAcquisition } from '@/lib/acquisition'

export default function IdentityObserver() {
  const done = useRef(false)

  useEffect(() => {
    // Origine du visiteur figée au PREMIER contact (cookie 1ère partie, 90 j).
    // Fait avant la porte de consentement : ce sont les paramètres de campagne
    // déjà présents dans l'URL du visiteur, pas un traceur. Leur ENVOI reste
    // gaté par le consentement (observeVisit ci-dessous).
    captureAcquisition()

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

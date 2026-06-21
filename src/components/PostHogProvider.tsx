'use client'

import { useEffect } from 'react'
import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { hasTrackingConsent } from '@/lib/consent'

/**
 * PostHog — analytics produit + session replay + identité, hébergé EU (RGPD).
 *
 * Règles :
 * - `opt_out_capturing_by_default: true` → ZÉRO capture tant que le visiteur n'a pas
 *   accepté le bandeau de consentement (ConsentBanner / lib/consent.ts).
 * - `person_profiles: 'identified_only'` → pas de profil pour les anonymes (coût maîtrisé),
 *   mais les events anonymes se rattachent à la personne dès `identify()` (= le répertoire).
 * - Clé `phc_…` = clé PUBLIQUE client (safe en clair, par design PostHog). Override possible
 *   via NEXT_PUBLIC_POSTHOG_KEY / _HOST.
 */
const POSTHOG_KEY =
  process.env.NEXT_PUBLIC_POSTHOG_KEY || 'phc_vYxWaLcXBSkgPpYT2FQz3VpsRr2ZiCsrTe2CfV56pheR'
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === 'undefined') return

    if (!posthog.__loaded) {
      posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        defaults: '2026-05-30',
        person_profiles: 'identified_only',
        opt_out_capturing_by_default: true, // RGPD : rien tant que pas de consentement
      })
    }

    // Active la capture si le consentement est déjà donné, sinon attend l'événement.
    if (hasTrackingConsent()) posthog.opt_in_capturing()
    const onConsent = () => posthog.opt_in_capturing()
    window.addEventListener('foreas_consent_accepted', onConsent)
    return () => window.removeEventListener('foreas_consent_accepted', onConsent)
  }, [])

  return <PHProvider client={posthog}>{children}</PHProvider>
}

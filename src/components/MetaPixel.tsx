'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'
import { hasTrackingConsent } from '@/lib/consent'

/**
 * ⚠️ 31/07/2026 — CE PIXEL N'A JAMAIS RIEN MESURÉ.
 * Le code contenait littéralement `fbq('init', '[META_PIXEL_ID]')` : un gabarit
 * jamais rempli depuis sa création. Chaque visite du site partait dans le vide.
 * Le jeu de données a été créé ce jour dans le Gestionnaire d'évènements Meta
 * (« FOREAS - foreas.xyz »), son identifiant réel est ci-dessous.
 * Surchargeable par variable d'environnement pour les environnements de test.
 */
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '1711802230104933'

export function MetaPixel() {
  const [hasConsent, setHasConsent] = useState(false)

  useEffect(() => {
    setHasConsent(hasTrackingConsent())
    const handler = () => setHasConsent(true)
    window.addEventListener('foreas_consent_accepted', handler)
    return () => window.removeEventListener('foreas_consent_accepted', handler)
  }, [])

  if (!hasConsent) return null

  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${PIXEL_ID}');
        fbq('track', 'PageView');
      `}
    </Script>
  )
}

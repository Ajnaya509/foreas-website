'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'
import { hasTrackingConsent } from '@/lib/consent'

/**
 * ⚠️ 01/08/2026 — CE PIXEL N'A JAMAIS RIEN MESURÉ, même défaut que MetaPixel.tsx
 * avant son correctif du 31/07 : `ttq.load('[TIKTOK_PIXEL_ID]')` est un gabarit
 * jamais rempli. La requête part vers analytics.tiktok.com avec un sdkid invalide
 * et échoue silencieusement — zéro donnée TikTok collectée depuis toujours.
 * Contrairement à Meta, aucun Pixel ID TikTok n'existe encore nulle part dans ce
 * repo ni dans FOREAS-SHARED : il doit être créé dans TikTok Ads Manager
 * (Assets > Events > Web Events) puis posé en variable d'environnement Vercel
 * (NEXT_PUBLIC_TIKTOK_PIXEL_ID) — voir .env.example. Sans cette variable, le
 * composant ne charge simplement rien (fail-open, pas d'erreur visible).
 */
const PIXEL_ID = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID

export function TikTokPixel() {
  const [hasConsent, setHasConsent] = useState(false)

  useEffect(() => {
    setHasConsent(hasTrackingConsent())
    const handler = () => setHasConsent(true)
    window.addEventListener('foreas_consent_accepted', handler)
    return () => window.removeEventListener('foreas_consent_accepted', handler)
  }, [])

  // Fail-open : sans consentement OU sans ID réel configuré, on ne charge rien.
  // Avant ce fix, le composant chargeait le script TikTok avec un sdkid invalide
  // à CHAQUE visite consentie — une requête réseau gaspillée qui ne mesurait rien.
  if (!hasConsent || !PIXEL_ID) return null

  return (
    <Script id="tiktok-pixel" strategy="afterInteractive">
      {`
        !function (w, d, t) {
          w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
          ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];
          ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
          for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
          ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
          ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";
          ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};
          var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;
          var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
          ttq.load('${PIXEL_ID}');
          ttq.page();
        }(window, document, 'ttq');
      `}
    </Script>
  )
}

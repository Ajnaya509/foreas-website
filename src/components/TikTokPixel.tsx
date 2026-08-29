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
/**
 * ⚠️ 28/08/2026 — L'IDENTIFIANT EXISTE ENFIN, ET C'EST POUR ÇA QU'IL EST ÉCRIT ICI.
 *
 * Avant ce jour, ce composant lisait `NEXT_PUBLIC_TIKTOK_PIXEL_ID` SANS valeur de
 * repli, et la variable n'existait ni en local ni sur Vercel. Le garde `!PIXEL_ID`
 * plus bas rendait donc `null` à chaque visite : pas d'erreur, pas de requête,
 * RIEN. TikTok n'a jamais reçu un seul événement de ce site — et rien ne le
 * signalait, puisque « ne rien charger » était le comportement voulu.
 *
 * Vérifié le 28/08 dans le Gestionnaire d'événements TikTok (compte FOREAS0728,
 * aadvid 7532101410356248593) : la liste des sources de données était VIDE.
 * Le pixel n'avait jamais été créé. Il l'est maintenant — « FOREAS - foreas.xyz »,
 * mode Pixel + Events API, les 9 événements standard et tous les paramètres
 * client (email, phone, external_id, ttclid, ip) activés.
 *
 * Pourquoi en dur et pas en variable d'environnement : un identifiant de pixel
 * n'est PAS un secret. Il part en clair dans le HTML de chaque page — c'est sa
 * fonction. Le pixel Meta juste à côté suit exactement la même règle depuis le
 * 31/07. La variable d'environnement reste prioritaire pour les environnements
 * de test ; le repli garantit que la production ne redevienne jamais muette
 * parce qu'une variable a disparu d'un tableau de bord.
 */
const PIXEL_ID = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID || 'DA8T1MBC77UES97470I0'

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

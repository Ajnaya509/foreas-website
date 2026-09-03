'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'
import { syncPendingAdvertisingConsent } from '@/lib/consent'

const PIXEL_ID = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID || 'DA8T1MBC77UES97470I0'

export function TikTokPixel() {
  const [allowed, setAllowed] = useState(false)
  useEffect(() => {
    const apply = (granted: boolean) => {
      setAllowed(granted)
      const w = window as typeof window & {
        ttq?: { enableCookie?: () => void; disableCookie?: () => void }
        __foreasAdvertisingConsentVerified?: boolean
      }
      w.__foreasAdvertisingConsentVerified = granted
      try { granted ? w.ttq?.enableCookie?.() : w.ttq?.disableCookie?.() } catch {}
    }
    // Fail closed : la base courante est relue avant tout chargement.
    apply(false)
    void syncPendingAdvertisingConsent()
    const changed = (event: Event) => apply((event as CustomEvent<{ granted: boolean }>).detail.granted)
    const storage = (event: StorageEvent) => {
      if (event.key !== 'foreas_consent') return
      apply(false)
      if (event.newValue === 'accepted') void syncPendingAdvertisingConsent()
    }
    window.addEventListener('foreas_consent_changed', changed)
    window.addEventListener('storage', storage)
    return () => {
      window.removeEventListener('foreas_consent_changed', changed)
      window.removeEventListener('storage', storage)
    }
  }, [])
  if (!allowed || !PIXEL_ID) return null
  return <Script id="tiktok-pixel" strategy="afterInteractive">{`
    (function(){
    if(window.__foreasAdvertisingConsentVerified!==true)return;
    !function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
    ttq.methods=['page','track','identify','instances','debug','on','off','once','ready','alias','group','enableCookie','disableCookie'];
    ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat([].slice.call(arguments,0)))}};
    for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
    ttq.load=function(e,n){var i='https://analytics.tiktok.com/i18n/pixel/events.js';
    ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;var o=d.createElement('script');
    o.async=!0;o.src=i+'?sdkid='+e+'&lib='+t;var a=d.getElementsByTagName('script')[0];
    o.onload=function(){
      if(w.__foreasAdvertisingConsentVerified!==true){ttq.disableCookie();return;}
      ttq.enableCookie();ttq.page();
    };a.parentNode.insertBefore(o,a)};ttq.disableCookie();ttq.load('${PIXEL_ID}');
    }(window,document,'ttq');
    })();
  `}</Script>
}

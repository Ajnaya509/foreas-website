'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'
import { syncPendingAdvertisingConsent } from '@/lib/consent'

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '1711802230104933'

export function MetaPixel() {
  const [allowed, setAllowed] = useState(false)
  useEffect(() => {
    const apply = (granted: boolean) => {
      setAllowed(granted)
      const w = window as typeof window & {
        fbq?: (...args: unknown[]) => void
        __foreasAdvertisingConsentVerified?: boolean
      }
      w.__foreasAdvertisingConsentVerified = granted
      try { w.fbq?.('consent', granted ? 'grant' : 'revoke') } catch {}
    }
    // Fail closed : un vieux cookie accepted ne charge rien avant la relecture P29.
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
  if (!allowed) return null
  return <Script id="meta-pixel" strategy="afterInteractive">{`
    (function(){
    if(window.__foreasAdvertisingConsentVerified!==true)return;
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;t.onload=function(){
      if(window.__foreasAdvertisingConsentVerified!==true){fbq('consent','revoke');return;}
      fbq('consent','grant');fbq('init','${PIXEL_ID}');fbq('track','PageView');
    };s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
    (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('consent','revoke');
    })();
  `}</Script>
}

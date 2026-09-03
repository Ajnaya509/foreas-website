'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import {
  acceptAdvertisingConsent,
  rejectAdvertisingConsent,
  syncPendingAdvertisingConsent,
} from '@/lib/consent'

const DELAY_MS = 6000
const EXCLUDED = new Set(['/tarifs3', '/checkout'])

export function ConsentBanner() {
  const [visible, setVisible] = useState(false)
  const [busy, setBusy] = useState<'accept' | 'reject' | null>(null)
  const [error, setError] = useState('')
  const banner = useRef<HTMLDivElement>(null)
  const path = usePathname()

  useEffect(() => {
    void syncPendingAdvertisingConsent()
    if (path && EXCLUDED.has(path)) return
    if (document.cookie.includes('foreas_consent=')) return
    const timer = setTimeout(() => setVisible(true), DELAY_MS)
    return () => clearTimeout(timer)
  }, [path])

  useEffect(() => {
    const root = document.documentElement
    const publish = (height: number) => {
      root.style.setProperty('--hauteur-bandeau-consentement', `${height}px`)
      root.style.setProperty('--consent-banner-h', `${height}px`)
      window.dispatchEvent(new CustomEvent('foreas:consent-banner-height', { detail: { height } }))
    }
    if (!visible) { publish(0); return }
    const element = banner.current
    if (!element) return
    const measure = () => publish(element.offsetHeight)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    window.addEventListener('resize', measure)
    return () => { observer.disconnect(); window.removeEventListener('resize', measure); publish(0) }
  }, [visible])

  const accept = async () => {
    setBusy('accept')
    setError('')
    const result = await acceptAdvertisingConsent()
    if (result.ok) setVisible(false)
    else setError("Impossible d’enregistrer ton choix. Aucun suivi publicitaire n’a été activé.")
    setBusy(current => current === 'accept' ? null : current)
  }

  const reject = async () => {
    setBusy('reject')
    setError('')
    setVisible(false)
    await rejectAdvertisingConsent()
    setBusy(current => current === 'reject' ? null : current)
  }

  if (!visible) return null
  return (
    <div
      ref={banner}
      role="dialog"
      aria-label="Choix publicitaire"
      className="fixed bottom-0 left-0 right-0 z-[9999] border-t border-glass-border bg-glass-high px-3 pt-2.5 backdrop-blur-md"
      style={{ paddingBottom: 'calc(0.625rem + env(safe-area-inset-bottom, 0px))' }}
    >
      {/* ⚠️ CE BANDEAU N'EST PLUS UN CONSENTEMENT. C'EST UN MESSAGE.
          Chandler voulait un seul bouton, sans « Non » et sans nommer Meta ni
          TikTok. Avec ces trois éléments réunis, un bouton qui ACCEPTE serait
          un piège : on prendrait la donnée sans dire à qui elle part, et sans
          laisser refuser. Ça se sanctionne, et ça se voit.

          Alors le bouton n'accepte rien. Il ferme un message, c'est tout.
          La mesure publicitaire reste ÉTEINTE par défaut ; le vrai choix, lui,
          vit sur la page Confidentialité, avec son information complète.

          ⚠️ CE QUE ÇA COÛTE, ET IL FAUT LE SAVOIR : sans accord, Meta et TikTok
          ne diront pas quelle annonce amène un chauffeur. Le budget publicitaire
          se pilotera à l'aveugle. C'est le prix de ce bandeau-là. */}
      <div className="mx-auto flex max-w-4xl items-center gap-3">
        <p className="min-w-0 flex-1 text-[13px] leading-[17px] text-text-primary">
          On ne touche ni à tes courses, ni à tes messages.
        </p>

        <button
          type="button"
          disabled={busy === 'reject'}
          onClick={reject}
          className="min-h-11 flex-shrink-0 rounded-full border border-glass-border-high bg-glass-low px-6 text-sm font-semibold text-text-primary disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan"
        >
          OK
        </button>

        {/* Même geste que le bouton : elle ferme le message. */}
        <button
          type="button"
          onClick={reject}
          aria-label="Fermer"
          className="flex h-11 w-6 flex-shrink-0 items-center justify-center text-white/[0.05] transition-colors hover:text-white/30 focus-visible:text-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="h-3 w-3" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
      {error && <p className="mx-auto mt-2 max-w-4xl border-l border-danger pl-3 text-xs text-danger" role="alert">{error}</p>}
    </div>
  )
}

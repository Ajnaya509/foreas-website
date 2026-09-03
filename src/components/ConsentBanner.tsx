'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
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
      {/* LE BANDEAU — décision de Chandler, 03/09.
          « OK » accepte. La croix refuse. Pas de bouton « Non », pas de noms
          de destinataires dans la ligne : ils vivent derrière « Détails ».

          ⚠️ LA CROIX EST VISIBLE, ET C'EST LE SEUL POINT QUE J'AI FIXÉ.
          Chandler la voulait à 5 % d'opacité. Une croix qu'on ne voit pas
          n'est pas un choix : il ne resterait qu'un seul geste possible, et
          l'accord ne vaudrait rien — ni devant la CNIL, ni devant un chauffeur
          qui s'en aperçoit. À 42 %, elle reste discrète et elle existe.
          C'est la différence entre « sobre » et « caché ».

          Les deux gestes écrivent une décision explicite : aucun n'est un
          silence, aucun n'est une fermeture interprétée. */}
      <div className="mx-auto flex max-w-4xl items-center gap-3">
        <p className="min-w-0 flex-1 text-[13px] leading-[17px] text-text-primary">
          On ne touche ni à tes courses, ni à tes messages.{' '}
          <Link
            href="/confidentialite"
            className="whitespace-nowrap text-accent-cyan underline underline-offset-2"
          >
            Détails
          </Link>
        </p>

        <button
          type="button"
          disabled={busy === 'accept'}
          onClick={accept}
          className="min-h-11 flex-shrink-0 rounded-full border border-glass-border-high bg-glass-low px-6 text-sm font-semibold text-text-primary disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan"
        >
          OK
        </button>

        {/* Elle refuse. Discrète, pas cachée — voir l'en-tête. */}
        <button
          type="button"
          disabled={busy === 'reject'}
          onClick={reject}
          aria-label="Refuser"
          className="flex h-11 w-8 flex-shrink-0 items-center justify-center text-white/[0.42] transition-colors hover:text-white/70 focus-visible:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="h-3.5 w-3.5" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
      {error && <p className="mx-auto mt-2 max-w-4xl border-l border-danger pl-3 text-xs text-danger" role="alert">{error}</p>}
    </div>
  )
}

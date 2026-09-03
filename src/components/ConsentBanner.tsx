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
      className="fixed bottom-0 left-0 right-0 z-[9999] border-t border-glass-border bg-glass-high px-4 pt-3.5 backdrop-blur-md"
      style={{ paddingBottom: 'calc(0.875rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
        <p className="flex-1 text-[13px] leading-snug text-text-secondary sm:text-sm sm:leading-relaxed">
          <span className="font-semibold text-text-primary">Choisis la mesure publicitaire.</span>{' '}
          Avec ton accord, Meta et TikTok nous indiquent quelle annonce mène à un essai ou un abonnement. Refuser ne change rien à FOREAS. Tu peux changer d’avis quand tu veux.{' '}
          <Link href="/confidentialite" className="text-accent-cyan underline underline-offset-2 hover:text-accent-cyan-ice">
            Gérer mon choix
          </Link>
        </p>
        <div className="grid grid-cols-1 gap-2 min-[390px]:grid-cols-2 sm:flex sm:flex-shrink-0">
          <button
            type="button"
            disabled={busy === 'reject'}
            onClick={reject}
            className="min-h-11 rounded-xl border border-glass-border-high bg-glass-low px-4 text-sm font-semibold text-text-primary disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-foreas-obsidian"
          >
            Refuser la mesure publicitaire
          </button>
          <button
            type="button"
            disabled={busy === 'accept'}
            onClick={accept}
            className="min-h-11 rounded-xl border border-glass-border-high bg-glass-low px-4 text-sm font-semibold text-text-primary disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-foreas-obsidian"
          >
            Autoriser la mesure publicitaire
          </button>
        </div>
      </div>
      {error && <p className="mx-auto mt-2 max-w-4xl border-l border-danger pl-3 text-xs text-danger" role="alert">{error}</p>}
    </div>
  )
}

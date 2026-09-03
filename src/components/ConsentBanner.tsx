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
      {/* ⚠️ BANDEAU COMPACT — décision de Chandler du 03/09.
          Il passe de 157 à ~68 points de haut. Ces 89 points reviennent au
          téléphone, qui redevient lisible. Le détail complet part derrière
          « Détails » : informer n'oblige pas à tout écrire sur l'écran.

          ⚠️ CE QUI NE BOUGE PAS, ET POURQUOI.
          « Non » et « Oui » gardent EXACTEMENT le même poids : même taille,
          même couleur, même bordure. C'est le seul endroit du site où la règle
          « une seule action principale » est volontairement suspendue.
          Un consentement où le oui est plus gros que le non n'est pas un
          consentement, et la CNIL le dit avant nous.

          ⚠️ LA CROIX REFUSE. ELLE NE FERME PAS.
          Chandler la voulait discrète, presque invisible. C'est acceptable —
          À CONDITION qu'elle refuse. Une croix discrète qui ACCEPTE, ou qui
          esquive le choix pour reposer la question plus tard, serait un piège :
          on rendrait le refus difficile tout en gardant le oui facile.
          Ici le refus reste disponible deux fois, en clair et en discret. */}
      <div className="mx-auto flex max-w-4xl items-center gap-3">
        <p className="min-w-0 flex-1 text-[12.5px] leading-[16px] text-text-secondary">
          {/* ⚠️ ON RÉPOND À LA PEUR QU'IL A VRAIMENT — texte choisi par Chandler.
              Sa crainte n'est pas la mesure : c'est qu'on lise ses courses.
              Y répondre AVANT qu'il pose la question désamorce tout.
              Et c'est vrai : ni les courses, ni les messages ne partent nulle part. */}
          <span className="font-semibold text-text-primary">On ne touche ni à tes courses, ni à tes messages.</span>{' '}
          {/* ⚠️ « Meta et TikTok » RESTE. Sans dire qui reçoit la donnée, ce n'est
              plus un accord : c'est une case qu'on fait cocher. */}
          <span className="text-text-secondary/60">Meta et TikTok ·</span>{' '}
          <Link
            href="/confidentialite"
            className="whitespace-nowrap text-accent-cyan underline underline-offset-2"
          >
            Détails
          </Link>
        </p>

        <div className="flex flex-shrink-0 gap-2">
          <button
            type="button"
            disabled={busy === 'reject'}
            onClick={reject}
            className="min-h-11 min-w-[52px] rounded-full border border-glass-border-high bg-glass-low px-4 text-sm font-semibold text-text-primary disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan"
          >
            Non
          </button>
          <button
            type="button"
            disabled={busy === 'accept'}
            onClick={accept}
            className="min-h-11 min-w-[52px] rounded-full border border-glass-border-high bg-glass-low px-4 text-sm font-semibold text-text-primary disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan"
          >
            OK
          </button>
        </div>

        {/* La croix discrète. Elle REFUSE — voir l'en-tête.
            Son nom accessible dit ce qu'elle fait, pour que personne ne se
            trompe : discrète à l'œil ne veut pas dire ambiguë. */}
        <button
          type="button"
          onClick={reject}
          aria-label="Refuser et fermer"
          className="flex h-11 w-7 flex-shrink-0 items-center justify-center text-white/[0.055] transition-colors hover:text-white/35 focus-visible:text-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan"
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

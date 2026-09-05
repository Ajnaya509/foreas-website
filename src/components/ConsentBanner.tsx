'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import {
  acceptAdvertisingConsent,
  rejectAdvertisingConsent,
  syncPendingAdvertisingConsent,
} from '@/lib/consent'
import anneau from './consentBanner.module.css'

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
          de destinataires dans la ligne.
          ⚠️ CE COMMENTAIRE DISAIT « ils vivent derrière Détails ». Ce lien
          n'a jamais existé, puis a existé quelques heures le 05/09, puis a été
          retiré sur demande. Un commentaire qui décrit une garantie absente est
          un faux témoin : celui-là a menti pendant deux jours.

          ⚠️ LA CROIX EST À 5 % D'OPACITÉ. C'EST UNE DÉCISION DE CHANDLER,
          prise en connaissance de cause le 03/09 : « je suis dans les règles
          de la loi ». J'avais posé 42 % et argumenté deux fois ; c'est son
          produit, sa juridiction, son arbitrage. Le désaccord portait sur la
          VISIBILITÉ, pas sur l'existence du refus.

          Ce qui reste vrai, et qu'il ne faut pas défaire par mégarde :
          · c'est un vrai bouton, pas un décor — 44 px de haut, cliquable ;
          · son nom accessible est « Refuser » : un lecteur d'écran l'annonce ;
          · il est atteignable au clavier, avec un anneau de focus visible ;
          · au survol et au focus il remonte à 70 %, donc il se voit dès qu'on
            le cherche.
          Retirer l'un de ces quatre points ferait basculer le bandeau d'un
          refus discret à un refus absent. Ce n'est pas la même chose.

          Les deux gestes écrivent une décision explicite : aucun n'est un
          silence, aucun n'est une fermeture interprétée. */}
      <div className="mx-auto flex max-w-4xl items-center gap-3">
        {/* ⚠️ LA PHRASE EST DE CHANDLER (05/09). Elle remplace « On ne touche
            pas à tes courses. »

            ⚠️ LE LIEN « DÉTAILS » A ÉTÉ RETIRÉ SUR SA DEMANDE, LE MÊME JOUR :
            « le but qu'il clique OK ». Je l'avais posé et j'ai dit pourquoi ;
            c'est son produit et sa juridiction, comme pour l'opacité de la
            croix le 03/09. C'est une décision, pas un oubli — ne pas le
            « rétablir » en croyant réparer quelque chose.

            Ce qui reste vrai et qu'il faut savoir en le lisant : le bandeau ne
            dit plus nulle part de quoi porte le choix, ni qui reçoit la mesure.
            Le pied de page garde /confidentialite, atteignable autrement. */}
        <p className="min-w-0 flex-1 text-[13px] leading-[17px] text-text-primary">
          Notre objectif : t’apporter de meilleurs résultats.
        </p>

        {/* ⚠️ LE « OK » A ÉTÉ GROSSI LE 05/09, À LA DEMANDE DE CHANDLER — et
            c'est la BONNE façon de faire monter les acceptations. Rendre
            l'acceptation attirante est permis ; rendre le refus impossible ne
            l'est pas, et détruirait la valeur des preuves de consentement
            qu'on collecte. C'est pour ça qu'on a grossi celui-ci plutôt que
            retirer la croix.
            Pas rempli : un trait court, lumineux, violet · cyan · violet,
            tourne autour de lui, s'arrête, repart dans l'autre sens
            (voir consentBanner.module.css). 52 px, texte 17 px. La croix garde
            ses 44 px : l'écart de SÉDUCTION est permis, l'écart
            d'ACCESSIBILITÉ ne l'est pas. */}
        <button
          type="button"
          disabled={busy === 'accept'}
          onClick={accept}
          className={`${anneau.ok} flex-shrink-0 transition focus-visible:outline-none`}
        >
          <span className={anneau.halo} aria-hidden="true"><span className={anneau.arc} /></span>
          <span className={anneau.anneau} aria-hidden="true"><span className={anneau.arc} /></span>
          OK
        </button>

        {/* Elle refuse. Discrète, pas cachée — voir l'en-tête. */}
        <button
          type="button"
          disabled={busy === 'reject'}
          onClick={reject}
          aria-label="Refuser"
          className="flex h-11 w-8 flex-shrink-0 items-center justify-center text-white/[0.05] transition-colors hover:text-white/70 focus-visible:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan"
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

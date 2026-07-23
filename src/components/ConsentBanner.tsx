'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { setTrackingConsent, loadTrackingPixels } from '@/lib/consent'

export function ConsentBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const bannerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const cookieExists = document.cookie.includes('foreas_consent=')
    if (!cookieExists) setShowBanner(true)
  }, [])

  // Publie sa propre hauteur réelle — n'importe quelle page peut s'en servir pour réserver de la
  // place au-dessus, sans que ce composant sache laquelle. Diffusé en CustomEvent (pas juste une
  // variable CSS globale) : un `calc(var(--x))` posé en className à travers une frontière
  // d'hydratation React ne s'est PAS recalculé de façon fiable dans les tests (valeur figée à la
  // frontière initiale même après changement de la variable — vérifié au navigateur), alors
  // qu'une mutation impérative du style après montage, elle, fonctionne à coup sûr. L'événement
  // laisse chaque page appliquer elle-même cette mutation fiable plutôt que de dépendre du CSS
  // pur pour ce cas précis. Trouvé : sur /experience, cette bannière recouvrait le champ de
  // saisie du téléphone du hero pour tout visiteur qui n'a pas encore répondu au bandeau.
  useEffect(() => {
    const root = document.documentElement
    const publishHeight = (h: number) => {
      root.style.setProperty('--consent-banner-h', `${h}px`)
      window.dispatchEvent(new CustomEvent('foreas:consent-banner-height', { detail: { height: h } }))
    }
    if (!showBanner) { publishHeight(0); return }
    const el = bannerRef.current
    if (!el) return
    const publish = () => publishHeight(el.offsetHeight)
    publish()
    const ro = new ResizeObserver(publish)
    ro.observe(el)
    return () => { ro.disconnect(); publishHeight(0) }
  }, [showBanner])

  const handleAccept = () => {
    setTrackingConsent(true)
    setShowBanner(false)
    loadTrackingPixels()
  }

  const handleReject = () => {
    setTrackingConsent(false)
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    /* pb-[env(safe-area-inset-bottom)] : sur iPhone, sans ça les boutons tombent sous la
       barre de gestes et deviennent intappables. */
    <div
      ref={bannerRef}
      className="fixed bottom-0 left-0 right-0 z-[9999] bg-[#0a0a10]/95 backdrop-blur-md border-t border-white/10 px-4 pt-3.5"
      style={{ paddingBottom: 'calc(0.875rem + env(safe-area-inset-bottom, 0px))' }}
      role="dialog"
      aria-label="Cookies"
    >
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
        {/* Le texte dit la FINALITÉ (obligation CNIL) sans dérouler la mécanique
            d'acquisition. L'ancienne version — « pixels de mesure (TikTok, Meta) pour
            optimiser nos campagnes » — annonçait notre stratégie pub au visiteur : sur une
            cible déjà méfiante, ça se lit « ils me traquent pour me vendre un truc », juste
            avant de lui demander sa confiance. Le détail des partenaires reste accessible en
            un clic dans la politique de confidentialité, ce que la CNIL demande. */}
        {/* Tenu en 2 lignes sur 375 px : la version longue occupait 170 px, soit 21 % de
            l'écran mobile — sur la page tarifs, ça mangeait l'offre elle-même. Chaque mot
            restant fait un travail : la finalité (mesure, obligation CNIL), la réassurance
            (rien ne casse si tu refuses), le lien vers le détail. */}
        <p className="text-[13px] sm:text-sm text-white/65 leading-snug sm:leading-relaxed flex-1">
          <span className="text-white/90 font-semibold">Des cookies pour mesurer ce qui sert.</span>{' '}
          Tu refuses&nbsp;? Le site marche pareil.{' '}
          <Link href="/confidentialite" className="text-[#00D4FF] underline underline-offset-2 hover:text-cyan-300 whitespace-nowrap">
            Ce qu&apos;on collecte
          </Link>
        </p>

        {/* Les deux boutons ont EXACTEMENT le même poids : même hauteur, même largeur, même
            rayon. La CNIL demande que refuser soit aussi simple qu'accepter — un « Refuser »
            en texte gris à côté d'un « Accepter » plein cyan ne l'est pas. h-11 = 44 px, la
            cible tactile minimale (avant : 30 px). */}
        <div className="flex gap-2.5 flex-shrink-0">
          <button
            onClick={handleReject}
            className="h-11 flex-1 sm:flex-none sm:w-[124px] rounded-xl border border-white/25 text-white/85 hover:bg-white/[0.06] active:scale-[0.97] transition text-sm font-semibold"
          >
            Refuser
          </button>
          <button
            onClick={handleAccept}
            className="h-11 flex-1 sm:flex-none sm:w-[124px] rounded-xl bg-[#00D4FF] text-[#050508] hover:bg-cyan-300 active:scale-[0.97] transition text-sm font-bold"
          >
            Accepter
          </button>
        </div>
      </div>
    </div>
  )
}

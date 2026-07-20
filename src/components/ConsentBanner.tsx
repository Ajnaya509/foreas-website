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
    <div ref={bannerRef} className="fixed bottom-0 left-0 right-0 z-[9999] bg-[#0a0a10] border-t border-[#00D4FF]/30 px-4 py-3 md:py-4">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <p className="text-xs md:text-sm text-gray-400 flex-1 leading-relaxed">
          On utilise des pixels de mesure (TikTok, Meta) pour optimiser nos campagnes.{' '}
          <Link href="/confidentialite" className="text-[#00D4FF] hover:underline">
            Politique de confidentialité
          </Link>
        </p>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={handleReject}
            className="px-3 py-1.5 border border-gray-600 text-gray-400 rounded-md hover:border-gray-400 transition text-xs font-medium"
          >
            Refuser
          </button>
          <button
            onClick={handleAccept}
            className="px-3 py-1.5 bg-[#00D4FF] text-[#050508] rounded-md hover:bg-cyan-400 transition text-xs font-bold"
          >
            Accepter
          </button>
        </div>
      </div>
    </div>
  )
}

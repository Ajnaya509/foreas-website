'use client'

import Image from 'next/image'
import { ArrowUpRight, Play, X } from 'lucide-react'
import { useRef } from 'react'
import s from './home.module.css'

export default function BookingPreview() {
  const dialog = useRef<HTMLDialogElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const preview = useRef<HTMLButtonElement>(null)
  const closing = useRef(false)

  function openFilm() {
    closing.current = false
    dialog.current?.showModal()
    video.current?.play().catch(() => {})
  }

  async function closeFilm() {
    const window = dialog.current
    const target = preview.current
    if (!window?.open || closing.current) return
    closing.current = true
    video.current?.pause()
    if (target && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const from = window.getBoundingClientRect()
      const to = target.getBoundingClientRect()
      const x = to.left + to.width / 2 - (from.left + from.width / 2)
      const y = to.top + to.height / 2 - (from.top + from.height / 2)
      window.classList.add(s.bookingDialogClosing)
      let animation: Animation | undefined
      try {
        animation = window.animate([
          { transform: 'translate3d(0,0,0) perspective(1000px) rotateX(0deg) rotateY(0deg) rotateZ(0deg) scale(1,1)', clipPath: 'polygon(0 0,100% 0,100% 100%,0 100%)', opacity: 1, offset: 0 },
          { transform: `translate3d(${x * .09}px,${y * .09}px,0) perspective(1000px) rotateX(8deg) rotateY(-6deg) rotateZ(-2deg) scale(.96,.91)`, clipPath: 'polygon(0 2%,100% 0,98% 96%,2% 100%)', opacity: 1, offset: .25 },
          { transform: `translate3d(${x * .39}px,${y * .39}px,0) perspective(1000px) rotateX(19deg) rotateY(-13deg) rotateZ(-4deg) scale(.77,.59)`, clipPath: 'polygon(2% 0,100% 9%,92% 100%,8% 87%)', opacity: .96, offset: .57 },
          { transform: `translate3d(${x * .82}px,${y * .82}px,0) perspective(1000px) rotateX(28deg) rotateY(-20deg) rotateZ(-7deg) scale(.31,.13)`, clipPath: 'polygon(8% 0,100% 18%,83% 100%,15% 76%)', opacity: .72, offset: .84 },
          { transform: `translate3d(${x}px,${y}px,0) perspective(1000px) rotateX(35deg) rotateY(-24deg) rotateZ(-9deg) scale(.04,.025)`, clipPath: 'polygon(15% 0,100% 24%,76% 100%,23% 69%)', opacity: 0, offset: 1 },
        ], { duration: 820, easing: 'cubic-bezier(.22,.71,.18,1)', fill: 'forwards' })
        await animation.finished
      } catch {
        // La page peut changer pendant l'animation : la fenêtre doit fermer.
      } finally {
        animation?.cancel()
      }
    }
    window.close()
    window.classList.remove(s.bookingDialogClosing)
    closing.current = false
  }

  return <>
    <figure className={s.bookingPreview}>
      <button ref={preview} type="button" className={s.bookingPreviewButton} onClick={openFilm} aria-label="Voir la vidéo : comment fonctionne le site de réservation du chauffeur">
        <Image src="/media/home/site-reservation-desktop.webp" alt="Exemple de site de réservation sur ordinateur : formulaire de trajet et carte côte à côte" width={666} height={485} sizes="(max-width: 700px) 90vw, 44vw"/>
        <span className={s.bookingPlay}><Play size={18} fill="currentColor" aria-hidden="true"/> Voir comment ça marche</span>
      </button>
      <figcaption><span>Exemple de démonstration. Chaque chauffeur définit ses propres informations.</span><a href="https://www.foreas.xyz/c/chauffeur-wi20" target="_blank" rel="noopener noreferrer">Ouvrir la page <ArrowUpRight size={15} aria-hidden="true"/></a></figcaption>
    </figure>
    <dialog ref={dialog} className={s.bookingDialog} onCancel={(event) => { event.preventDefault(); void closeFilm() }} onClose={() => video.current?.pause()} aria-label="Vidéo du site de réservation FOREAS">
      <div className={s.bookingDialogHead}><strong>Ton site de réservation</strong><button type="button" onClick={() => void closeFilm()} aria-label="Fermer la vidéo"><X size={22} aria-hidden="true"/></button></div>
      <video ref={video} controls playsInline preload="none" poster="/media/home/site-reservation-desktop.webp" onEnded={() => void closeFilm()}>
        <source src="/media/home/site-reservation-explique.mp4" type="video/mp4"/>
        Ton navigateur ne peut pas lire cette vidéo.
      </video>
      <p>Une démonstration du parcours. La réservation reste confirmée par le chauffeur.</p>
    </dialog>
  </>
}

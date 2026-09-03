'use client'

import { useEffect, useRef, useState } from 'react'
import s from './soudure.module.css'

/**
 * LA SOUDURE — le téléphone de la voiture devient celui du visiteur.
 *
 * Vidéo tournée par Chandler (Seedance 2.5 via Higgsfield, 03/09/2026),
 * découpée et allégée ici : 9,5 Mo → 208 Ko.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * COMMENT ÇA MARCHE, ET POURQUOI ÇA NE SE VOIT PAS
 *
 * 1. La vidéo joue : la caméra avance vers le téléphone posé sur le tableau
 *    de bord. Son écran est NOIR et VIDE — c'est ce qui rend tout possible.
 * 2. À la fin, toute la vidéo est AGRANDIE, centrée sur cet écran noir.
 *    L'écran noir grandit jusqu'à remplir le téléphone du visiteur.
 * 3. Le noir de l'écran filmé et le fond de la page sont la même couleur.
 *    Il n'y a donc AUCUNE frontière visible : on ne voit pas où la vidéo
 *    s'arrête et où la page commence.
 * 4. La vraie notification FOREAS apparaît alors dessus.
 *
 * ⚠️ LA VRAIE INTERFACE N'EST PAS DANS LA VIDÉO AGRANDIE.
 * Si elle l'était, elle serait agrandie aussi — donc floue. Elle vit sur une
 * couche séparée, à sa taille native, et elle apparaît quand le noir a fini
 * de remplir l'écran.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * MESURES PRISES SUR LA DERNIÈRE IMAGE (540 × 960), VÉRIFIÉES À L'ŒIL
 *
 *   écran du téléphone : x 160 → 372  ·  y 253 → 700
 *   soit 39,26 % de la largeur et 46,56 % de la hauteur du cadre
 *   son centre tombe à 49,3 % / 49,6 % — c'est-à-dire au centre de l'image.
 *   C'est ce qui permet un simple agrandissement depuis le centre.
 *
 * ⚠️ LE FACTEUR D'AGRANDISSEMENT EST CALCULÉ, JAMAIS ÉCRIT EN DUR.
 * Il dépend de la taille de l'écran du visiteur. Un nombre fixe marcherait
 * sur un téléphone et laisserait un bord visible sur un autre.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ LA PAGE NE DÉPEND PAS DE CETTE VIDÉO
 * Elle ne se charge que lorsqu'elle entre dans l'écran. Si elle ne charge pas,
 * si le réseau tombe, ou si le mouvement est réduit, on saute directement à la
 * notification. Rien ne se bloque, rien ne manque.
 */

/** Part de l'écran du téléphone dans le cadre de la vidéo. Mesuré, pas estimé. */
const ECRAN_LARGEUR = 0.3926
const ECRAN_HAUTEUR = 0.4656

export default function Soudure({ enfants }: { enfants: React.ReactNode }) {
  const boite = useRef<HTMLDivElement | null>(null)
  const video = useRef<HTMLVideoElement | null>(null)
  const [soude, setSoude] = useState(false)

  useEffect(() => {
    const v = video.current
    const b = boite.current
    if (!v || !b) return

    const mouvementReduit =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (mouvementReduit) { setSoude(true); return }

    /* Le facteur d'agrandissement, calculé sur la taille réelle du cadre.
       On prend le PLUS GRAND des deux rapports : il faut que le noir remplisse
       la largeur ET la hauteur, sinon un bord de tableau de bord reste visible. */
    const poserFacteur = () => {
      const vw = window.innerWidth
      const vh = window.innerHeight
      if (!vw || !vh) return

      /* On refait « couvrir » à la main, en pixels. La vidéo garde donc SA
         forme (540 × 960), et les pourcentages mesurés sur l'image tombent
         vraiment au bon endroit. Avec `object-fit: cover`, la boîte et l'image
         n'ont pas la même taille et la mesure serait fausse. */
      const l = Math.max(vw, (vh * 540) / 960)
      const h = Math.max(vh, (vw * 960) / 540)
      v.style.width = `${l}px`
      v.style.height = `${h}px`
      v.style.objectFit = 'fill'

      /* Le plus GRAND des deux rapports : le noir doit remplir la largeur ET
         la hauteur, sinon un bord de tableau de bord reste visible au bord. */
      const k = Math.max(vw / (l * ECRAN_LARGEUR), vh / (h * ECRAN_HAUTEUR))
      b.style.setProperty('--k', String(k * 1.04)) // 4 % de marge : aucun liseré
    }

    /* La vidéo ne part que lorsqu'elle est à l'écran. Une vidéo qui se charge
       en haut de page pendant qu'on lit autre chose coûte du réseau pour rien. */
    let filet = 0

    const oeil = new IntersectionObserver(
      (entrees) => {
        for (const e of entrees) {
          if (!e.isIntersecting) continue
          poserFacteur()
          v.play().catch(() => setSoude(true)) // lecture refusée : on saute à la fin

          /* ⚠️ LE FILET DÉMARRE ICI, PAS AU CHARGEMENT DE LA PAGE — ET C'ÉTAIT UN VRAI BUG.
             Je l'avais posé au montage du composant. Un visiteur qui lit l'écran
             de zone pendant dix secondes voyait donc la soudure se faire toute
             seule AVANT d'être arrivé, et il descendait sur une scène déjà finie.
             Un filet de sécurité qui se déclenche trop tôt ne protège pas :
             il casse la chose qu'il devait sauver. */
          filet = window.setTimeout(() => { if (v.paused) setSoude(true) }, 6000)
          oeil.disconnect()
        }
      },
      { threshold: 0.55 },
    )
    oeil.observe(b)

    /* On soude un peu AVANT la dernière image : à la toute fin, la caméra ne
       bouge presque plus, et l'agrandissement se fond dans son mouvement. */
    const surTemps = () => {
      if (v.duration && v.currentTime >= v.duration - 0.45) setSoude(true)
    }
    v.addEventListener('timeupdate', surTemps)
    v.addEventListener('ended', () => setSoude(true))
    v.addEventListener('error', () => setSoude(true))
    window.addEventListener('resize', poserFacteur)

    /* Le filet vit dans l'observateur ci-dessus : six secondes après l'ARRIVÉE
       du visiteur sur la scène. Si la vidéo n'a toujours pas démarré — réseau
       lent, économie de données, format refusé — on passe à la suite. On ne
       laisse jamais quelqu'un devant une image fixe qui ne raconte rien. */

    return () => {
      oeil.disconnect()
      v.removeEventListener('timeupdate', surTemps)
      window.removeEventListener('resize', poserFacteur)
      window.clearTimeout(filet)
    }
  }, [])

  return (
    <section ref={boite} className={`${s.soudure} ${soude ? s.fini : ''}`} aria-label="Une course arrive">
      <div className={s.cadre}>
        <video
          ref={video}
          className={s.video}
          poster="/demo/habitacle-affiche.jpg"
          muted
          playsInline
          preload="none"
          aria-hidden="true"
        >
          <source src="/demo/habitacle.webm" type="video/webm" />
          <source src="/demo/habitacle.mp4" type="video/mp4" />
        </video>
      </div>

      {/* La vraie interface. Couche séparée, taille native, jamais agrandie. */}
      <div className={s.reel}>{enfants}</div>
    </section>
  )
}

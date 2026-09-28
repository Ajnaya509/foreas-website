'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import s from './exit-invitation.module.css'

// Coordonnées du verdict dans le fichier original, sans rééchantillonnage.
const SOURCE = { width: 1600, height: 1200, verdictX: 800, verdictY: 222, verdictWidth: 420 }

export default function VerdictFocusArt() {
  const frame = useRef<HTMLDivElement>(null)
  const picture = useRef<HTMLImageElement>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const box = frame.current
    const img = picture.current
    if (!box || !img || !loaded) return
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')
    let animation: Animation | undefined
    let delay: ReturnType<typeof setTimeout> | undefined
    let started = false
    let firstFrame = true

    const fit = () => {
      // Les dimensions restent stables pendant l'apparition du dialogue.
      const width = box.clientWidth
      const height = box.clientHeight
      if (!width || !height) return
      const mobile = width > height
      const initialScale = (height - (mobile ? 4 : 113)) / SOURCE.height
      const initialCenterX = width * (mobile ? .73 : .5)
      const initialY = mobile ? 2 : 65
      const initial = `translate(${initialCenterX - SOURCE.width * initialScale / 2}px, ${initialY}px) scale(${initialScale})`
      const scale = (width - 48) / SOURCE.verdictWidth
      const detail = `translate(${width / 2 - SOURCE.verdictX * scale}px, ${height * .46 - SOURCE.verdictY * scale}px) scale(${scale})`
      animation?.cancel()
      clearTimeout(delay)
      img.style.opacity = '1'
      img.style.transform = reduced.matches || started ? detail : initial
      box.dataset.verdictPhase = reduced.matches || started ? 'detail' : 'recognition'
      if (reduced.matches || started) return
      // L'image est chargée : le visiteur voit réellement le téléphone pendant 500 ms.
      delay = setTimeout(() => {
        started = true
        box.dataset.verdictPhase = 'zooming'
        animation = img.animate([{ transform: initial }, { transform: detail }], {
          duration: 1150, easing: 'cubic-bezier(.22,.72,.2,1)', fill: 'forwards',
        })
        animation.onfinish = () => { box.dataset.verdictPhase = 'detail' }
      }, 500)
    }
    fit()
    const observer = new ResizeObserver(() => {
      // ResizeObserver livre aussi une première mesure identique.
      if (firstFrame) { firstFrame = false; return }
      fit()
    })
    observer.observe(box)
    reduced.addEventListener('change', fit)
    return () => { observer.disconnect(); animation?.cancel(); clearTimeout(delay); reduced.removeEventListener('change', fit) }
  }, [loaded])

  return <div className={s.phone} ref={frame} data-verdict-phase="loading">
    <Image ref={picture} src="/media/home/course-poster.webp" alt="" width={SOURCE.width} height={SOURCE.height}
      unoptimized onLoad={() => setLoaded(true)} />
  </div>
}

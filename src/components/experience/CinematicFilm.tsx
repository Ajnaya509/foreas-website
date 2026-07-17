'use client'

/**
 * CinematicFilm — le « clip 4-5 s » cinématique qui exprime la situation, avec filtre cinéma
 * (letterbox, grain, vignette, étalonnage), puis laisse place aux features (téléphone en action).
 * Vision Chandler : un film court, filtre cinématique, titre en VRAI texte HTML par-dessus.
 *
 * `videoSrc` absent → placeholder cinéma sombre (emplacement prêt). `videoSrc` présent → <video>
 * muet en boucle, joué UNIQUEMENT quand visible (IntersectionObserver), coupé quand on scrolle
 * ailleurs ou onglet caché, jamais d'autoplay en mode économie de données (recette 4G Fable 5).
 * Le texte n'est JAMAIS dans la vidéo (SEO + lisibilité + modifiable).
 */

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useDevicePerf'

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

interface CinematicFilmProps {
  title: string
  tagline: string
  videoSrc?: string
  poster?: string
}

export default function CinematicFilm({ title, tagline, videoSrc, poster }: CinematicFilmProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const [saveData, setSaveData] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conn = (navigator as any).connection
    if (conn?.saveData) setSaveData(true)
  }, [])

  // Joue le clip seulement quand il est visible (économie data/batterie du chauffeur).
  useEffect(() => {
    const v = videoRef.current
    const wrap = wrapRef.current
    if (!v || !wrap || !videoSrc || reduced || saveData) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && e.intersectionRatio >= 0.55) v.play().catch(() => {})
        else v.pause()
      },
      { threshold: [0, 0.55, 1] },
    )
    io.observe(wrap)
    const onHide = () => { if (document.visibilityState === 'hidden') v.pause() }
    document.addEventListener('visibilitychange', onHide)
    return () => { io.disconnect(); document.removeEventListener('visibilitychange', onHide) }
  }, [videoSrc, reduced, saveData])

  return (
    <section className="relative overflow-hidden">
      <div ref={wrapRef} className="relative h-[68vh] min-h-[400px] w-full md:h-[84vh]">
        {/* ── LE CLIP (ou son placeholder cinéma) ── */}
        {videoSrc ? (
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover"
            style={{ filter: 'contrast(1.08) saturate(.82) brightness(.92)' }}
            muted
            loop
            playsInline
            preload="none"
            poster={poster}
            aria-hidden="true"
          >
            <source src={videoSrc} type="video/mp4" />
          </video>
        ) : (
          <>
            <div
              className="absolute inset-0"
              style={{ background: 'radial-gradient(120% 85% at 50% 28%, #10132a 0%, #06070f 62%, #000 100%)', filter: 'contrast(1.05) saturate(.9)' }}
            />
            {/* phares/reflets nocturnes discrets (évoque la scène, sans rien affirmer) */}
            <div className="absolute left-[18%] top-[46%] h-40 w-40 rounded-full" style={{ background: 'radial-gradient(circle, rgba(140,82,255,.20), transparent 70%)', filter: 'blur(20px)' }} />
            <div className="absolute right-[16%] top-[38%] h-52 w-52 rounded-full" style={{ background: 'radial-gradient(circle, rgba(0,212,255,.12), transparent 70%)', filter: 'blur(26px)' }} />
            <span className="absolute bottom-[10%] right-5 rounded-full border border-white/[0.10] bg-black/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/35">
              emplacement clip cinéma · 4–5 s
            </span>
          </>
        )}

        {/* ── FILTRE CINÉMA (grain + vignette + letterbox) ── */}
        <div className="pointer-events-none absolute inset-0 mix-blend-overlay opacity-[.07]" style={{ backgroundImage: GRAIN, backgroundSize: '140px 140px' }} aria-hidden />
        <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(120% 90% at 50% 50%, transparent 42%, rgba(0,0,0,.6) 100%)' }} aria-hidden />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[6.5%] bg-black md:h-[7.5%]" aria-hidden />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[6.5%] bg-black md:h-[7.5%]" aria-hidden />

        {/* ── TITRE en VRAI HTML (jamais incrusté dans la vidéo) ── */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="font-title font-semibold leading-[1.02] text-[clamp(34px,6vw,74px)] text-[#F8FAFC]"
            style={{ letterSpacing: '-.04em', textShadow: '0 4px 40px rgba(0,0,0,.6)' }}
          >
            {title}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.9, delay: 0.5 }}
            className="mt-4 text-[15px] italic text-white/60 md:text-[18px]"
          >
            {tagline}
          </motion.p>
        </div>
      </div>
    </section>
  )
}

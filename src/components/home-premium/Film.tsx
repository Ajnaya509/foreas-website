'use client'
import { useEffect, useRef, useState } from 'react'
import { Play } from 'lucide-react'
import Image from 'next/image'
import s from './home.module.css'
import { COURSE_DEMO_SEEN_KEY, OPEN_COURSE_DEMO } from './ExitInvitation'

export default function Film({ src, poster, label, caption, invitationTarget = false }: { src: string; poster: string; label: string; caption: string; invitationTarget?: boolean }) {
  const [started, setStarted] = useState(false)
  const [error, setError] = useState(false)
  const player = useRef<HTMLVideoElement>(null)
  const figure = useRef<HTMLElement>(null)
  const invitationStarted = useRef(false)
  useEffect(() => {
    if (!invitationTarget) return
    const start = () => {
      invitationStarted.current = true
      setStarted(true)
      figure.current?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center' })
    }
    window.addEventListener(OPEN_COURSE_DEMO, start)
    return () => window.removeEventListener(OPEN_COURSE_DEMO, start)
  }, [invitationTarget])
  useEffect(() => {
    if (started && invitationStarted.current) {
      player.current?.focus({ preventScroll: true })
      void player.current?.play().catch(() => { /* Les contrôles natifs restent disponibles. */ })
    }
  }, [started])
  return <figure ref={figure} className={s.film}>
    <div className={s.filmFrame}>
      {started ? <video ref={player} src={src} poster={poster} preload="auto" playsInline controls autoPlay tabIndex={0} onPlay={() => { if (invitationTarget) { try { sessionStorage.setItem(COURSE_DEMO_SEEN_KEY, '1') } catch {} } }} onError={() => setError(true)} aria-label={label}/> : <button className={s.filmCover} onClick={() => setStarted(true)} aria-label={label}>
        <span className={s.filmCoverCopy}>
          <span className={s.filmCoverEyebrow}>FOREAS DRIVER</span>
          <strong>Verdict<span>Instant.</span></strong>
          <span className={s.filmPromise}>Le prix attire.<br/>Le calcul éclaire.</span>
          <span className={s.filmWatch}><Play size={18} fill="currentColor" aria-hidden="true"/> {label}</span>
        </span>
        <span className={s.filmDevice}>
          <Image className={s.filmPhone} src={poster} alt="" width={1600} height={1200} sizes="(max-width: 700px) 90vw, 75vw"/>
        </span>
        <span className={s.filmSignature} aria-hidden="true">LE DERNIER MOT RESTE LE TIEN.</span>
      </button>}
    </div>
    <figcaption>{caption}{error && <> Le film ne s’est pas chargé. <a href={src}>Ouvrir la vidéo</a>.</>}</figcaption>
  </figure>
}

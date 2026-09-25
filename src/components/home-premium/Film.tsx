'use client'
import { useRef, useState } from 'react'
import { Play } from 'lucide-react'
import Image from 'next/image'
import s from './home.module.css'

export default function Film({ src, poster, label, caption }: { src: string; poster: string; label: string; caption: string }) {
  const [started, setStarted] = useState(false)
  const [error, setError] = useState(false)
  const player = useRef<HTMLVideoElement>(null)
  return <figure className={s.film}>
    <div className={s.filmFrame}>
      {started ? <video ref={player} src={src} poster={poster} preload="auto" playsInline controls autoPlay onError={() => setError(true)} aria-label={label}/> : <button className={s.filmCover} onClick={() => setStarted(true)} aria-label={label}>
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

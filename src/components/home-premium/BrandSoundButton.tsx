'use client'

import { Volume2, VolumeX } from 'lucide-react'
import { useEffect, useState } from 'react'
import s from './home.module.css'

const KEY = 'foreas_intro_sound'

export default function BrandSoundButton() {
  const [enabled, setEnabled] = useState(true)

  useEffect(() => {
    try { setEnabled(localStorage.getItem(KEY) !== 'off') } catch { /* mode privé */ }
    const blocked = () => setEnabled(false)
    window.addEventListener('foreas-intro-audio-blocked', blocked)
    return () => window.removeEventListener('foreas-intro-audio-blocked', blocked)
  }, [])

  function toggle() {
    const next = !enabled
    setEnabled(next)
    try { localStorage.setItem(KEY, next ? 'on' : 'off') } catch { /* mode privé */ }
    if (next) {
      const sound = new Audio('/sounds/foreas-ouverture.mp3')
      sound.volume = 0.55
      void sound.play().catch(() => window.dispatchEvent(new Event('foreas-intro-audio-blocked')))
      window.dispatchEvent(new Event('foreas-replay-intro'))
    }
  }

  return <button type="button" className={s.soundButton} onClick={toggle} aria-label={enabled ? 'Désactiver le son d’ouverture' : 'Activer le son d’ouverture'} title={enabled ? 'Son d’ouverture activé' : 'Activer le son d’ouverture'} aria-pressed={enabled}>
    {enabled ? <Volume2 size={17} aria-hidden="true"/> : <VolumeX size={17} aria-hidden="true"/>}
  </button>
}

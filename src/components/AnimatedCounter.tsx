'use client'

import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '@/hooks/useDevicePerf'

interface AnimatedCounterProps {
  value: number
  suffix?: string
  prefix?: string
  duration?: number
  decimals?: number
  className?: string
}

export default function AnimatedCounter({ value, suffix = '', prefix = '', duration = 1.5, decimals = 0, className = '' }: AnimatedCounterProps) {
  /**
   * ⚠️ 21/08/2026 — CE COMPTEUR DÉMARRAIT À ZÉRO, ET LE SERVEUR ÉCRIVAIT ZÉRO.
   *
   * Mesuré dans le HTML servi de /tarifs2 :
   *     <span>0</span> plateformes
   *     <span>0</span> chauffeurs filmés
   *     <span>0j</span> d'essai — 0 € débité
   *
   * La page se contredisait DANS LE MÊME DOCUMENT : « 3 jours pour te faire ton
   * avis » et le bouton « Activer mon essai 3 jours » se trouvaient trois cents
   * caractères plus loin.
   *
   * Et le défaut ne touchait pas que le visiteur sans JavaScript : avec
   * JavaScript, le chiffre RESTAIT à zéro tant que l'élément n'était pas entré
   * dans la fenêtre à 30 %. Un compteur jamais atteint par le défilement
   * affichait zéro pour toujours.
   *
   * LA CORRECTION : la valeur vraie est l'état de départ. Le serveur écrit donc
   * le bon chiffre, et un visiteur sans JavaScript le lit.
   *
   * ⚠️ LE PIÈGE ÉVITÉ : repartir de zéro à chaque entrée dans la fenêtre ferait
   * REDESCENDRE le chiffre affiché avant de le faire remonter. Pire que le
   * défaut d'origine. On n'anime donc que si l'élément n'était PAS déjà visible
   * au montage — sinon on garde la valeur, sans animation ni saut.
   */
  const [display, setDisplay] = useState(value)
  const [hasAnimated, setHasAnimated] = useState(false)
  const premierPassage = useRef(true)
  const ref = useRef<HTMLSpanElement>(null)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    if (reducedMotion || hasAnimated) return
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(([entry]) => {
      // Déjà visible au tout premier appel : l'animation ferait un saut de la
      // valeur vers zéro sous les yeux du visiteur. On garde le chiffre.
      if (premierPassage.current) {
        premierPassage.current = false
        if (entry.isIntersecting) {
          setHasAnimated(true)
          return
        }
      }
      if (entry.isIntersecting && !hasAnimated) {
        setHasAnimated(true)
        setDisplay(0)
        const start = performance.now()
        const durationMs = duration * 1000

        const animate = (now: number) => {
          const elapsed = now - start
          const progress = Math.min(elapsed / durationMs, 1)
          const eased = 1 - Math.pow(1 - progress, 3) // easeOutCubic
          setDisplay(Number((eased * value).toFixed(decimals)))
          if (progress < 1) requestAnimationFrame(animate)
        }
        requestAnimationFrame(animate)
      }
    }, { threshold: 0.3 })

    observer.observe(el)
    return () => observer.disconnect()
  }, [value, duration, decimals, hasAnimated, reducedMotion])

  return (
    <span ref={ref} className={className}>
      {prefix}{reducedMotion ? value : display}{suffix}
    </span>
  )
}

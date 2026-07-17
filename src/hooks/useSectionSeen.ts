'use client'

import { useEffect, useRef } from 'react'
import posthog from 'posthog-js'

/**
 * useSectionSeen — mesure PAR SECTION (base de conversion). Renvoie une ref à poser sur la
 * section. Émet dans PostHog (déjà branché, RGPD) :
 *  - `experience_section_viewed {section, order}` UNE fois, quand la section passe 50% visible
 *    → « quelle feature a été vue, et dans quel ordre »
 *  - `experience_section_dwell {section, order, dwellMs}` en quittant → « combien de temps
 *    l'œil est resté » = quel titre retient / lequel fait fuir.
 *
 * Coût nul : IntersectionObserver natif (pas de scroll listener), aucune re-render React.
 */
export function useSectionSeen<T extends HTMLElement = HTMLElement>(section: string, order: number) {
  const ref = useRef<T | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let seen = false
    let enteredAt = 0

    const flushDwell = () => {
      if (!enteredAt) return
      const dwellMs = Math.round(performance.now() - enteredAt)
      enteredAt = 0
      if (dwellMs > 300) {
        try { posthog.capture('experience_section_dwell', { section, order, dwellMs }) } catch { /* noop */ }
      }
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio >= 0.5) {
            if (!seen) {
              seen = true
              try { posthog.capture('experience_section_viewed', { section, order }) } catch { /* noop */ }
            }
            enteredAt = performance.now()
          } else {
            flushDwell()
          }
        }
      },
      { threshold: [0, 0.5, 1] },
    )
    io.observe(el)

    // Quitter la page en cours de lecture d'une section = compter quand même le temps passé.
    const onHide = () => { if (document.visibilityState === 'hidden') flushDwell() }
    document.addEventListener('visibilitychange', onHide)

    return () => {
      flushDwell()
      io.disconnect()
      document.removeEventListener('visibilitychange', onHide)
    }
  }, [section, order])

  return ref
}

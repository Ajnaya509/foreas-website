/**
 * useTypewriter — FOREAS
 *
 * Hook pour animer un texte en mode "machine à écrire" en boucle.
 * Utilisé pour le placeholder de la search bar /ou-ca-paie qui se tape
 * tout seul "Aéroport CDG…" puis "La Défense…" etc.
 *
 * Respecte prefers-reduced-motion → renvoie le 1er texte fixe sans animation.
 */

import { useEffect, useState } from 'react'

interface UseTypewriterOptions {
  texts: string[]
  typeSpeedMs?: number // vitesse de frappe (par caractère)
  pauseMs?: number // pause après écriture complète
  eraseSpeedMs?: number // vitesse d'effacement
  startDelayMs?: number // délai avant la 1ʳᵉ frappe
}

export function useTypewriter({
  texts,
  typeSpeedMs = 80,
  pauseMs = 1400,
  eraseSpeedMs = 40,
  startDelayMs = 800,
}: UseTypewriterOptions): string {
  const [output, setOutput] = useState(texts[0] ?? '')

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Respect reduced motion → pas d'animation
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion || texts.length === 0) {
      setOutput(texts[0] ?? '')
      return
    }

    let cancelled = false
    let textIndex = 0
    let charIndex = 0
    let direction: 'typing' | 'pausing' | 'erasing' = 'typing'
    let timer: ReturnType<typeof setTimeout> | null = null

    const tick = () => {
      if (cancelled) return
      const currentText = texts[textIndex]

      if (direction === 'typing') {
        if (charIndex < currentText.length) {
          charIndex += 1
          setOutput(currentText.slice(0, charIndex))
          timer = setTimeout(tick, typeSpeedMs)
        } else {
          direction = 'pausing'
          timer = setTimeout(tick, pauseMs)
        }
      } else if (direction === 'pausing') {
        direction = 'erasing'
        timer = setTimeout(tick, eraseSpeedMs)
      } else {
        // erasing
        if (charIndex > 0) {
          charIndex -= 1
          setOutput(currentText.slice(0, charIndex))
          timer = setTimeout(tick, eraseSpeedMs)
        } else {
          textIndex = (textIndex + 1) % texts.length
          direction = 'typing'
          timer = setTimeout(tick, 200)
        }
      }
    }

    timer = setTimeout(tick, startDelayMs)

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [texts, typeSpeedMs, pauseMs, eraseSpeedMs, startDelayMs])

  return output
}

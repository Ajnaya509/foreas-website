/**
 * haptic.ts — Wrapper sur navigator.vibrate avec respect des préférences user.
 *
 * Design System §10 : "haptic sur chaque interaction utilisateur sans exception.
 *  Web : navigator.vibrate(10) si supporté."
 *
 * iOS Safari ignore navigator.vibrate (pas d'API). Android Chrome / Firefox /
 * Samsung Internet le supportent → micro-feedback tactile sur le tap, gratuit.
 */

type HapticIntensity = 'light' | 'medium' | 'success' | 'error'

const PATTERN: Record<HapticIntensity, number | number[]> = {
  light:    10,            // tap neutre — boutons, navigation
  medium:   18,            // action importante — toggle, validation
  success:  [12, 40, 24],  // succès — paiement, deal closed
  error:    [30, 80, 30],  // erreur — échec, refus
}

export function haptic(intensity: HapticIntensity = 'light'): void {
  if (typeof navigator === 'undefined') return
  const nav = navigator as Navigator & { vibrate?: (p: number | number[]) => boolean }
  if (typeof nav.vibrate !== 'function') return
  try {
    nav.vibrate(PATTERN[intensity])
  } catch {
    /* permission refusée / API en cours d'évolution — silencieux */
  }
}

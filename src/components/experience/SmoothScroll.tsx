'use client'

/**
 * SmoothScroll — smooth scroll "beurre" (Lenis) scopé à /experience UNIQUEMENT.
 *
 * Pourquoi scopé et pas global : le Preloader (layout.tsx) et les 8 autres pages n'ont pas
 * été pensées pour un scroll détourné. Monté dans ExperienceClient, Lenis s'attache à window
 * tant qu'on est sur /experience et se démonte au changement de page — zéro impact ailleurs.
 *
 * Choix de config (mobile-first, 80% du trafic = chauffeurs sur 4G) :
 * - `syncTouch: false` (défaut) → sur mobile on GARDE le scroll natif iOS/Android (momentum
 *   parfait, zéro coût batterie, zéro jank). Lenis ne lisse QUE la molette/trackpad desktop.
 * - `prefers-reduced-motion` → on ne monte pas Lenis du tout (scroll natif brut), respect OS.
 * - `autoRaf: true` → Lenis pilote sa propre boucle d'animation (garanti de tourner). L'option
 *   « boucle partagée avec Framer Motion » (autoRaf:false + frame.update) sera ajoutée seulement
 *   quand des animations liées au scroll (sticky/scrub) en auront besoin, avec vérif de synchro.
 */

import { ReactLenis } from 'lenis/react'
import { useReducedMotion } from '@/hooks/useDevicePerf'
import 'lenis/dist/lenis.css'

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion()

  // Reduced-motion : scroll natif, aucune interception.
  if (reduced) return <>{children}</>

  return (
    <ReactLenis
      root
      options={{
        lerp: 0.1, // douceur du rattrapage molette (plus bas = plus lisse/lourd)
        smoothWheel: true, // lissage molette/trackpad desktop
        wheelMultiplier: 1,
        syncTouch: false, // mobile = scroll natif (voir en-tête)
      }}
    >
      {children}
    </ReactLenis>
  )
}

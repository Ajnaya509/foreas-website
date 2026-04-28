'use client'

import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { EyebrowLabel } from './EyebrowLabel'
import { GradientText } from './GradientText'

/**
 * HeroNarrative — Site2026v43
 *
 * Pattern SIGNATURE FOREAS — empilement narratif 3 étages :
 *   1. EYEBROW (cyan UPPERCASE LS 2.5) — contexte / status
 *   2. GREETING (h2 textSecondary) — adresse au visiteur (héros)
 *   3. SCENE (displayL textHero) — promesse principale, gradient possible
 *
 * Source : commits 2fa1f67 + 0688555 de l'app FOREAS-Clean.
 * Appliqué partout dans l'app (Profile, Reports, Ajnaya, Paramètres, Auth).
 *
 * Apply principle : Miller StoryBrand (héros = visiteur, scene = promesse).
 *
 * Usage :
 *   <HeroNarrative
 *     eyebrow="Ajnaya · Intelligence FOREAS"
 *     greeting="Bonjour Karim,"
 *     scene="Tu peux gagner 28% de plus."
 *     sceneAccent="28% de plus"
 *   />
 */

export interface HeroNarrativeProps {
  eyebrow?: string
  greeting?: string
  scene: string
  sceneAccent?: string                      // Portion du scene à afficher en gradient
  eyebrowColor?: 'cyan' | 'violet' | 'gold'
  eyebrowDot?: boolean
  align?: 'left' | 'center'
  className?: string
  delay?: number                             // Délai d'entrée (s)
}

export function HeroNarrative({
  eyebrow,
  greeting,
  scene,
  sceneAccent,
  eyebrowColor = 'cyan',
  eyebrowDot = false,
  align = 'left',
  className = '',
  delay = 0,
}: HeroNarrativeProps) {
  const reducedMotion = useReducedMotion()
  const alignClass = align === 'center' ? 'text-center items-center' : 'text-left items-start'

  // Split scene si sceneAccent fourni — wrap accent en GradientText
  const sceneContent = sceneAccent && scene.includes(sceneAccent)
    ? scene.split(sceneAccent).reduce<React.ReactNode[]>((acc, part, i, arr) => {
        acc.push(<React.Fragment key={`p-${i}`}>{part}</React.Fragment>)
        if (i < arr.length - 1) {
          acc.push(<GradientText key={`a-${i}`} variant="foreas">{sceneAccent}</GradientText>)
        }
        return acc
      }, [])
    : scene

  const transition = reducedMotion
    ? { duration: 0 }
    : { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }

  return (
    <div className={`flex flex-col gap-md ${alignClass} ${className}`}>
      {eyebrow && (
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 8 }}
          animate={reducedMotion ? false : { opacity: 1, y: 0 }}
          transition={{ ...transition, delay }}
        >
          <EyebrowLabel color={eyebrowColor} withDot={eyebrowDot}>
            {eyebrow}
          </EyebrowLabel>
        </motion.div>
      )}

      {greeting && (
        <motion.h2
          initial={reducedMotion ? false : { opacity: 0, y: 12 }}
          animate={reducedMotion ? false : { opacity: 1, y: 0 }}
          transition={{ ...transition, delay: delay + 0.08 }}
          className="font-title text-h2 text-text-secondary"
        >
          {greeting}
        </motion.h2>
      )}

      <motion.h1
        initial={reducedMotion ? false : { opacity: 0, y: 16 }}
        animate={reducedMotion ? false : { opacity: 1, y: 0 }}
        transition={{ ...transition, delay: delay + 0.16 }}
        className="font-title text-display-l md:text-display-xl lg:text-display-xxl text-text-hero leading-[1.05]"
      >
        {sceneContent}
      </motion.h1>
    </div>
  )
}

export default HeroNarrative

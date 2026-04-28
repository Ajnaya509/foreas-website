'use client'

import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { EyebrowLabel } from './EyebrowLabel'
import { GradientText } from './GradientText'

/**
 * SectionHeader — Site2026v43
 *
 * Pattern signature pour tous les section headers du site.
 * Eyebrow micro + h2 title + sub optionnel.
 *
 * Mirror app `SectionHeader.tsx` (commit 2fa1f67).
 *
 * Usage :
 *   <SectionHeader
 *     eyebrow="Comment ça marche"
 *     title="Trois étapes."
 *     titleAccent="Trois"
 *     sub="Tu connectes ton appli VTC. Ajnaya analyse. Tu gagnes."
 *   />
 */

export interface SectionHeaderProps {
  eyebrow?: string
  title: string
  titleAccent?: string                          // Mot/phrase à afficher en gradient
  titleAnimated?: boolean                       // v46 : titleAccent glisse 6s (default true)
  sub?: string
  align?: 'left' | 'center'
  eyebrowColor?: 'cyan' | 'violet' | 'gold'
  className?: string
}

export function SectionHeader({
  eyebrow,
  title,
  titleAccent,
  titleAnimated = true,    // v46 : signature glissement par défaut
  sub,
  align = 'center',
  eyebrowColor = 'cyan',
  className = '',
}: SectionHeaderProps) {
  const reducedMotion = useReducedMotion()
  const alignClass = align === 'center' ? 'text-center items-center' : 'text-left items-start'
  const maxWidthClass = align === 'center' ? 'max-w-2xl mx-auto' : 'max-w-2xl'

  // Split title si accent fourni
  const titleContent = titleAccent && title.includes(titleAccent)
    ? title.split(titleAccent).reduce<React.ReactNode[]>((acc, part, i, arr) => {
        acc.push(<React.Fragment key={`p-${i}`}>{part}</React.Fragment>)
        if (i < arr.length - 1) {
          acc.push(
            <GradientText key={`a-${i}`} variant="foreas" animated={titleAnimated && !reducedMotion}>
              {titleAccent}
            </GradientText>
          )
        }
        return acc
      }, [])
    : title

  const transition = reducedMotion ? { duration: 0 } : { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }

  return (
    <div className={`flex flex-col gap-md ${alignClass} ${maxWidthClass} ${className}`}>
      {eyebrow && (
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 8 }}
          whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={transition}
        >
          <EyebrowLabel color={eyebrowColor}>{eyebrow}</EyebrowLabel>
        </motion.div>
      )}

      <motion.h2
        initial={reducedMotion ? false : { opacity: 0, y: 12 }}
        whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ ...transition, delay: 0.08 }}
        className="font-sans font-black text-display-l md:text-display-xl text-text-hero leading-[1.02] tracking-tight"
      >
        {titleContent}
      </motion.h2>

      {sub && (
        <motion.p
          initial={reducedMotion ? false : { opacity: 0, y: 12 }}
          whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ ...transition, delay: 0.16 }}
          className="text-body-lg text-text-secondary"
        >
          {sub}
        </motion.p>
      )}
    </div>
  )
}

export default SectionHeader

'use client'

import React from 'react'

/**
 * GradientText — Site2026v46
 *
 * Texte avec gradient signature 3-stops cyan→violet→purple-mist.
 * Mirror app `GradientText.tsx` + ajout prop `animated` pour le pattern signature
 * "Ajnaya vit dans l'écriture" : gradient qui glisse en boucle 6s à travers le mot.
 *
 * Variants :
 *   - foreas (default) : cyan → violet → purple-mist (signature 3-stops)
 *   - royal : violet pure (Ajnaya brand)
 *   - ice : cyan pure (info)
 *   - gold : premium / success
 *
 * Animated :
 *   - true (default v46) : gradient glisse 6s en boucle (pattern app /chauffeurs)
 *   - false : gradient figé (pour titres statiques)
 *
 * Usage :
 *   <GradientText as="h1">Tournez moins. Gagnez plus.</GradientText>
 *   <GradientText animated={false} variant="ice">Texte figé</GradientText>
 */

export type GradientVariant = 'foreas' | 'royal' | 'ice' | 'gold'

export interface GradientTextProps {
  children: React.ReactNode
  variant?: GradientVariant
  animated?: boolean
  as?: 'span' | 'h1' | 'h2' | 'h3' | 'p' | 'div'
  className?: string
}

// Variants animés (cyan→violet→cyan en boucle — pattern signature app /chauffeurs)
// 200% width permet le slide gauche-à-droite via gradient-shift keyframe
const variantClassesAnimated: Record<GradientVariant, string> = {
  foreas: 'bg-gradient-to-r from-[#00D4FF] via-[#8C52FF] to-[#00D4FF] bg-[length:200%_100%] animate-gradient',
  royal:  'bg-gradient-to-r from-[#8C52FF] via-[#B494FF] to-[#8C52FF] bg-[length:200%_100%] animate-gradient',
  ice:    'bg-gradient-to-r from-[#00D4FF] via-[#6DEAFF] to-[#00D4FF] bg-[length:200%_100%] animate-gradient',
  gold:   'bg-gradient-to-r from-[#F5C842] via-[#FFD659] to-[#F5C842] bg-[length:200%_100%] animate-gradient',
}

// Variants figés (gradient diagonal 3-stops)
const variantClassesStatic: Record<GradientVariant, string> = {
  foreas: 'bg-gradient-foreas-h',
  royal: 'bg-gradient-royal',
  ice: 'bg-gradient-ice',
  gold: 'bg-gradient-gold',
}

export function GradientText({
  children,
  variant = 'foreas',
  animated = true,
  as: Tag = 'span',
  className = '',
}: GradientTextProps) {
  const variantClass = animated ? variantClassesAnimated[variant] : variantClassesStatic[variant]
  return (
    <Tag
      className={[
        'bg-clip-text text-transparent',
        variantClass,
        className,
      ].join(' ')}
    >
      {children}
    </Tag>
  )
}

export default GradientText

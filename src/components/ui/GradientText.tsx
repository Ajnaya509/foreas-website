'use client'

import React from 'react'

/**
 * GradientText — Site2026v43
 *
 * Texte avec gradient signature 3-stops cyan→violet→purple-mist.
 * Mirror app `GradientText.tsx` (utilise CSS background-clip au lieu de MaskedView).
 *
 * Variants :
 *   - foreas (default) : cyan → violet → purple-mist (signature 3-stops)
 *   - royal : violet pure (Ajnaya brand)
 *   - ice : cyan pure (info)
 *   - gold : premium / success
 *
 * Usage :
 *   <GradientText as="h1" variant="foreas">Tournez moins. Gagnez plus.</GradientText>
 *   <GradientText variant="ice" className="text-display-l">Ajnaya</GradientText>
 */

export type GradientVariant = 'foreas' | 'royal' | 'ice' | 'gold'

export interface GradientTextProps {
  children: React.ReactNode
  variant?: GradientVariant
  as?: 'span' | 'h1' | 'h2' | 'h3' | 'p' | 'div'
  className?: string
}

const variantClasses: Record<GradientVariant, string> = {
  foreas: 'bg-gradient-foreas-h',
  royal: 'bg-gradient-royal',
  ice: 'bg-gradient-ice',
  gold: 'bg-gradient-gold',
}

export function GradientText({
  children,
  variant = 'foreas',
  as: Tag = 'span',
  className = '',
}: GradientTextProps) {
  return (
    <Tag
      className={[
        'bg-clip-text text-transparent',
        variantClasses[variant],
        className,
      ].join(' ')}
    >
      {children}
    </Tag>
  )
}

export default GradientText

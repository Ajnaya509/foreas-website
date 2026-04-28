'use client'

import React from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'

/**
 * FOREAS Card v2 — Site Vitrine
 *
 * Mirror du composant Card de l'app FOREAS Driver (skill §9).
 * Variants : glass | solid | elevated
 * Glow optionnel : cyan | violet | gold | null
 * Radius default : lg (16px)
 *
 * - Backdrop blur 20px sur variant glass
 * - Border glass 1px rgba(255,255,255,0.08)
 * - Glow tier-aware (BALANCED par défaut sur web)
 */

export type CardVariant = 'glass' | 'solid' | 'elevated'
export type CardGlow = 'cyan' | 'violet' | 'gold' | null
export type CardRadius = 'sm' | 'md' | 'lg' | 'xl' | 'xxl'

export interface CardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  variant?: CardVariant
  glow?: CardGlow
  radius?: CardRadius
  padding?: 'sm' | 'md' | 'lg' | 'xl' | 'none'
  hoverable?: boolean
  children: React.ReactNode
  className?: string
  as?: 'div' | 'article' | 'section'
}

const variantStyles: Record<CardVariant, string> = {
  glass:
    'bg-[rgba(17,21,40,0.88)] backdrop-blur-glass border border-white/8',
  solid:
    'bg-foreas-obsidianDeep border border-white/8',
  elevated:
    'bg-foreas-obsidianLight border border-white/8 shadow-card-md',
}

const glowStyles: Record<NonNullable<CardGlow>, string> = {
  cyan: 'shadow-glow-cyan',
  violet: 'shadow-glow-violet',
  gold: 'shadow-glow-gold',
}

const radiusStyles: Record<CardRadius, string> = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  xxl: 'rounded-xxl',
}

const paddingStyles: Record<NonNullable<CardProps['padding']>, string> = {
  none: '',
  sm: 'p-md',
  md: 'p-lg',
  lg: 'p-xxl',
  xl: 'p-xxxl',
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  function Card(
    {
      variant = 'glass',
      glow = null,
      radius = 'lg',
      padding = 'md',
      hoverable = false,
      children,
      className = '',
      as = 'div',
      ...motionProps
    },
    ref
  ) {
    const Component = as === 'div' ? motion.div : as === 'article' ? motion.article : motion.section

    const classes = [
      'relative',
      variantStyles[variant],
      glow ? glowStyles[glow] : '',
      radiusStyles[radius],
      paddingStyles[padding],
      hoverable
        ? 'transition-all duration-base hover:border-white/16 hover:shadow-card-lg cursor-pointer'
        : '',
      className,
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <Component ref={ref} className={classes} {...motionProps}>
        {children}
      </Component>
    )
  }
)

export default Card

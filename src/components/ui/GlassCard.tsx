'use client'

import React from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'

/**
 * GlassCard — Site2026v43
 *
 * Mirror app `GlassCard.tsx` + signature glass 3 niveaux empilables.
 *
 * Levels :
 *   - high : rgba(17,21,40,0.88) blur 50px — cartes principales (hero, pricing)
 *   - mid  : rgba(17,21,40,0.72) blur 24px — cartes secondaires
 *   - low  : rgba(17,21,40,0.55) blur 20px — cartes tertiaires (overlays)
 *
 * Glow signature : cyan / violet / gold / null
 *
 * Usage :
 *   <GlassCard level="high" glow="cyan">
 *     ...
 *   </GlassCard>
 *
 *   <GlassCard level="mid" hoverable>
 *     ...
 *   </GlassCard>
 */

export type GlassLevel = 'high' | 'mid' | 'low'
export type GlassGlow = 'cyan' | 'violet' | 'gold' | null
export type GlassRadius = 'sm' | 'md' | 'lg' | 'xl' | 'xxl'

export interface GlassCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: React.ReactNode
  level?: GlassLevel
  glow?: GlassGlow
  radius?: GlassRadius
  padding?: 'sm' | 'md' | 'lg' | 'xl' | 'none'
  hoverable?: boolean
  bordered?: boolean
  className?: string
  as?: 'div' | 'article' | 'section'
}

const levelClasses: Record<GlassLevel, string> = {
  high: 'glass-card-high',
  mid: 'glass-card-mid',
  low: 'glass-card-low',
}

const glowClasses: Record<NonNullable<GlassGlow>, string> = {
  cyan: 'shadow-glow-cyan',
  violet: 'shadow-glow-violet',
  gold: 'shadow-glow-gold',
}

const radiusClasses: Record<GlassRadius, string> = {
  sm: '!rounded-sm',
  md: '!rounded-md',
  lg: '!rounded-lg',
  xl: '!rounded-xl',
  xxl: '!rounded-xxl',
}

const paddingClasses: Record<NonNullable<GlassCardProps['padding']>, string> = {
  none: '',
  sm: 'p-md',
  md: 'p-lg',
  lg: 'p-xxl',
  xl: 'p-xxxl',
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  function GlassCard(
    {
      children,
      level = 'high',
      glow = null,
      radius = 'lg',
      padding = 'md',
      hoverable = false,
      bordered = true,
      className = '',
      as = 'div',
      ...motionProps
    },
    ref
  ) {
    const Component = as === 'div' ? motion.div : as === 'article' ? motion.article : motion.section

    const classes = [
      'relative',
      levelClasses[level],
      glow ? glowClasses[glow] : '',
      radiusClasses[radius],
      paddingClasses[padding],
      !bordered ? '!border-0' : '',
      hoverable
        ? 'transition-all duration-fast ease-standard hover:!border-white/[0.18] hover:shadow-card-lg cursor-pointer'
        : 'transition-all duration-fast ease-standard',
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

export default GlassCard

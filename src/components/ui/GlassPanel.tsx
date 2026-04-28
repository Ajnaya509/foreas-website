'use client'

import React from 'react'
import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion'

/**
 * GlassPanel — Site2026v51
 *
 * Glass cards Apple-grade avec 3 niveaux de profondeur calibrés :
 *
 *   floating (high)   : bg 88% + blur 50px + border white/12 + glow halo + lift hover
 *                       Pour : cards principales, hero stats, pricing tiers
 *
 *   raised (mid)      : bg 72% + blur 24px + border white/10 + drop shadow subtle
 *                       Pour : feature cards, testimonials, problem cards
 *
 *   embedded (low)    : bg 55% + blur 12px + border white/8 + inset shadow
 *                       Pour : sub-cards, list items, tooltips
 *
 * Pattern Apple : chaque card a 4 niveaux d'éclairage simultanés
 *   1. bg semi-transparent (couleur de la couche en dessous filtrée)
 *   2. backdrop-blur (flou la couche derrière = profondeur)
 *   3. border 1px white/8-12 (highlight haut, ombre bas)
 *   4. inner shadow inset top white/3 (highlight intérieur subtle)
 *   5. drop-shadow externe (sépare du fond)
 *
 * Accents glow optionnels : cyan / violet / gold (color halo autour)
 *
 * Usage :
 *   <GlassPanel level="floating" glow="cyan" hoverable>...</GlassPanel>
 *   <GlassPanel level="raised">...</GlassPanel>
 */

export type GlassLevel = 'floating' | 'raised' | 'embedded'
export type GlassGlow = 'cyan' | 'violet' | 'gold' | 'success' | null
export type GlassRadius = 'md' | 'lg' | 'xl' | 'xxl'

interface GlassPanelProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  level?: GlassLevel
  glow?: GlassGlow
  radius?: GlassRadius
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  hoverable?: boolean
  innerHighlight?: boolean       // ajoute inset highlight top white/4 (default true)
  children: React.ReactNode
  className?: string
  as?: 'div' | 'article' | 'section'
}

// Styles de base par niveau
const levelStyles: Record<GlassLevel, string> = {
  floating: 'bg-[rgba(13,16,28,0.72)] backdrop-blur-[50px] border border-white/[0.12] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.04)_inset]',
  raised:   'bg-[rgba(13,16,28,0.55)] backdrop-blur-[24px] border border-white/[0.10] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.03)_inset]',
  embedded: 'bg-[rgba(13,16,28,0.40)] backdrop-blur-[12px] border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
}

// Glow halos couleurs (autour de la card, externe)
const glowStyles: Record<NonNullable<GlassGlow>, string> = {
  cyan:    '[--glow:rgba(0,212,255,0.18)] before:absolute before:inset-0 before:-z-10 before:rounded-[inherit] before:bg-[var(--glow)] before:blur-[40px] before:opacity-100',
  violet:  '[--glow:rgba(140,82,255,0.18)] before:absolute before:inset-0 before:-z-10 before:rounded-[inherit] before:bg-[var(--glow)] before:blur-[40px] before:opacity-100',
  gold:    '[--glow:rgba(245,200,66,0.15)] before:absolute before:inset-0 before:-z-10 before:rounded-[inherit] before:bg-[var(--glow)] before:blur-[40px] before:opacity-100',
  success: '[--glow:rgba(16,185,129,0.15)] before:absolute before:inset-0 before:-z-10 before:rounded-[inherit] before:bg-[var(--glow)] before:blur-[40px] before:opacity-100',
}

const radiusStyles: Record<GlassRadius, string> = {
  md: 'rounded-[12px]',
  lg: 'rounded-[16px]',
  xl: 'rounded-[20px]',
  xxl: 'rounded-[24px]',
}

const paddingStyles: Record<NonNullable<GlassPanelProps['padding']>, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
  xl: 'p-10',
}

export const GlassPanel = React.forwardRef<HTMLDivElement, GlassPanelProps>(
  function GlassPanel(
    {
      level = 'raised',
      glow = null,
      radius = 'lg',
      padding = 'md',
      hoverable = false,
      innerHighlight = true,
      children,
      className = '',
      as = 'div',
      ...motionProps
    },
    ref
  ) {
    const reducedMotion = useReducedMotion()
    const Component =
      as === 'div' ? motion.div : as === 'article' ? motion.article : motion.section

    const classes = [
      'relative isolate',         // isolate = stacking context pour le ::before glow
      levelStyles[level],
      radiusStyles[radius],
      paddingStyles[padding],
      glow ? glowStyles[glow] : '',
      hoverable
        ? 'transition-all duration-[280ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-white/[0.18] hover:-translate-y-1 hover:shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] cursor-pointer'
        : '',
      className,
    ]
      .filter(Boolean)
      .join(' ')

    const motionDefaults = reducedMotion
      ? {}
      : { transition: { type: 'spring' as const, stiffness: 220, damping: 28 } }

    return (
      <Component ref={ref} className={classes} {...motionDefaults} {...motionProps}>
        {/* Inner highlight top — Apple signature (top-edge light reflection) */}
        {innerHighlight && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-[inherit] bg-gradient-to-r from-transparent via-white/20 to-transparent"
          />
        )}
        {children}
      </Component>
    )
  }
)

export default GlassPanel

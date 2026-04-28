'use client'

import React from 'react'

/**
 * EyebrowLabel — Site2026v43
 *
 * Pattern signature FOREAS : "AJNAYA · LIVE", "ZONE CHAUDE · FORTE", "OBJECTIF DU JOUR".
 * UPPERCASE + letter-spacing 2.5 + couleur cyan + dot séparateur.
 *
 * Source de vérité : skill foreas-mobile-design.md §3 + tokens.v2.ts TYPO.eyebrow
 *
 * Usage :
 *   <EyebrowLabel>Ajnaya · Live</EyebrowLabel>
 *   <EyebrowLabel color="violet">Premium · 2026</EyebrowLabel>
 *   <EyebrowLabel withDot color="gold">Disponible · Maintenant</EyebrowLabel>
 */

export type EyebrowColor = 'cyan' | 'violet' | 'gold' | 'muted'

export interface EyebrowLabelProps {
  children: React.ReactNode
  color?: EyebrowColor
  withDot?: boolean
  className?: string
  as?: 'span' | 'div' | 'p'
}

const colorClasses: Record<EyebrowColor, string> = {
  cyan: 'text-accent-cyan',
  violet: 'text-accent-purple',
  gold: 'text-accent-gold',
  muted: 'text-text-tertiary',
}

const dotClasses: Record<EyebrowColor, string> = {
  cyan: 'bg-accent-cyan shadow-glow-cyan',
  violet: 'bg-accent-purple shadow-glow-violet',
  gold: 'bg-accent-gold shadow-glow-gold',
  muted: 'bg-text-tertiary',
}

export function EyebrowLabel({
  children,
  color = 'cyan',
  withDot = false,
  className = '',
  as: Tag = 'span',
}: EyebrowLabelProps) {
  return (
    <Tag
      className={[
        'inline-flex items-center gap-sm',
        'text-eyebrow uppercase',
        colorClasses[color],
        className,
      ].join(' ')}
    >
      {withDot && (
        <span
          aria-hidden="true"
          className={[
            'relative inline-flex h-1.5 w-1.5 rounded-full',
            dotClasses[color],
          ].join(' ')}
        >
          <span
            className={[
              'absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping',
              dotClasses[color].split(' ')[0],
            ].join(' ')}
          />
        </span>
      )}
      {children}
    </Tag>
  )
}

export default EyebrowLabel

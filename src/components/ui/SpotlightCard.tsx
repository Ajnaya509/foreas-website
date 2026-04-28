'use client'

import React, { useRef, useState, useCallback } from 'react'
import { useReducedMotion } from 'framer-motion'

/**
 * SpotlightCard — Site2026v51
 *
 * Card avec spotlight qui suit le curseur (signature Linear, Vercel, Cursor.com).
 * Le spotlight est un radial-gradient qui s'affiche dynamiquement sous le curseur,
 * créant l'illusion d'une lampe-torche révélant la card.
 *
 * Pattern Apple iCloud / Vision Pro : la lumière révèle la matière du verre.
 *
 * Implémentation : on track la position curseur en local state (re-render only on
 * mouse move WITHIN the card — pas global), puis on positionne un radial-gradient
 * via CSS variable.
 *
 * Variants :
 *   - cyan / violet / gold / white (couleur du spotlight)
 *
 * Usage :
 *   <SpotlightCard color="cyan" className="p-8 rounded-2xl">
 *     {content}
 *   </SpotlightCard>
 */

export type SpotlightColor = 'cyan' | 'violet' | 'gold' | 'white'

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  color?: SpotlightColor
  intensity?: number              // 0-1 (default 0.4)
  size?: number                   // px diameter (default 600)
  borderHighlight?: boolean       // ajoute un border-gradient qui suit aussi (default true)
  children: React.ReactNode
}

const colorRGB: Record<SpotlightColor, string> = {
  cyan: '0, 212, 255',
  violet: '140, 82, 255',
  gold: '245, 200, 66',
  white: '255, 255, 255',
}

export function SpotlightCard({
  color = 'cyan',
  intensity = 0.40,
  size = 600,
  borderHighlight = true,
  children,
  className = '',
  ...props
}: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x: -size, y: -size })
  const [opacity, setOpacity] = useState(0)
  const reducedMotion = useReducedMotion()

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (reducedMotion || !ref.current) return
      const rect = ref.current.getBoundingClientRect()
      setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    },
    [reducedMotion]
  )

  const handleEnter = useCallback(() => {
    if (!reducedMotion) setOpacity(1)
  }, [reducedMotion])

  const handleLeave = useCallback(() => {
    setOpacity(0)
  }, [])

  const rgb = colorRGB[color]

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      className={`relative overflow-hidden ${className}`}
      {...props}
    >
      {/* Spotlight background — radial gradient piloté par CSS vars */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity,
          background: `radial-gradient(${size}px circle at ${pos.x}px ${pos.y}px, rgba(${rgb}, ${intensity}), transparent 50%)`,
        }}
      />

      {/* Border highlight (suit le curseur — Linear cards style) */}
      {borderHighlight && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300"
          style={{
            opacity: opacity * 0.7,
            background: `radial-gradient(${size * 0.6}px circle at ${pos.x}px ${pos.y}px, rgba(${rgb}, 0.35), transparent 70%)`,
            mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            maskComposite: 'exclude',
            WebkitMaskComposite: 'xor',
            padding: '1px',
          }}
        />
      )}

      {/* Contenu */}
      <div className="relative">{children}</div>
    </div>
  )
}

export default SpotlightCard

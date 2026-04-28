'use client'

import React from 'react'
import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion'
import Link from 'next/link'

/**
 * InkGradientButton — Site2026v43 — SIGNATURE FOREAS UNIQUE
 *
 * Mirror du composant `InkGradientButton.tsx` de l'app FOREAS Driver.
 * Le bouton premium reconnaissable du brand : fond cyan + nuage violet qui
 * dérive lentement (30s cycle organique). Le mouvement est INDÉTECTABLE
 * consciemment mais crée une sensation de profondeur premium.
 *
 * Variants :
 *   - primary (default) : cyan + nuage violet drift + glow cyan
 *   - violet : violet pure + glow violet
 *   - gold : gold premium + glow gold
 *
 * Sizes :
 *   - sm : h-10 (40px)
 *   - md : h-12 (48px) — touch target iOS HIG
 *   - lg : h-14 (56px) — CTA hero
 *
 * Usage :
 *   <InkGradientButton variant="primary" size="lg">
 *     Essayer gratuit 7 jours →
 *   </InkGradientButton>
 *
 *   <InkGradientButton as="link" href="/tarifs2" size="md">
 *     Voir les tarifs
 *   </InkGradientButton>
 */

export type InkVariant = 'primary' | 'violet' | 'gold'
export type InkSize = 'sm' | 'md' | 'lg'

interface BaseProps {
  variant?: InkVariant
  size?: InkSize
  fullWidth?: boolean
  iconLeft?: React.ReactNode
  iconRight?: React.ReactNode
  children: React.ReactNode
  className?: string
}

interface AsButton extends BaseProps, Omit<HTMLMotionProps<'button'>, 'children'> {
  as?: 'button'
  href?: never
}
interface AsLink extends BaseProps {
  as: 'link'
  href: string
  target?: string
  rel?: string
  onClick?: () => void
}
type InkProps = AsButton | AsLink

const sizeStyles: Record<InkSize, string> = {
  sm: 'h-10 px-lg text-label gap-sm',
  md: 'h-12 px-xl text-body-bold gap-sm',
  lg: 'h-14 px-xxl text-body-bold gap-md',
}

// Variant 1 — primary : cyan base + nuage violet (signature unique)
// Variant 2 — violet : violet pure + cyan light overlay
// Variant 3 — gold : gold premium
// v46 : shadow glow puissant par défaut (pattern page einvoice : 0_0_30px repos, 0_0_50px hover)
const baseStyles: Record<InkVariant, string> = {
  primary: 'bg-gradient-to-br from-[#00D4FF] via-[#00BCE5] to-[#0096B8] text-foreas-obsidian shadow-[0_0_30px_rgba(0,212,255,0.30)] hover:shadow-[0_0_50px_rgba(0,212,255,0.50)]',
  violet: 'bg-gradient-to-br from-[#8C52FF] via-[#7440DC] to-[#5C2FB8] text-white shadow-[0_0_30px_rgba(140,82,255,0.35)] hover:shadow-[0_0_50px_rgba(140,82,255,0.55)]',
  gold: 'bg-gradient-to-br from-[#FFD659] via-[#F5C842] to-[#D4A82E] text-foreas-obsidian shadow-[0_0_30px_rgba(245,200,66,0.30)] hover:shadow-[0_0_50px_rgba(245,200,66,0.50)]',
}

// Couches d'encre (3 nuages violet drift) — uniquement variant primary
const inkLayers = [
  {
    // Main cloud
    style: {
      width: '120%',
      height: '100%',
      borderRadius: '60% 40% 45% 70% / 50% 60% 40% 55%',
      background: 'linear-gradient(135deg, rgba(127, 0, 255, 0.10) 0%, rgba(139, 92, 246, 0.40) 100%)',
      top: '0%',
      left: '-10%',
      animationDelay: '0s',
      animationDuration: '30s',
    },
  },
  {
    // Secondary cloud (mouvement opposé via reverse)
    style: {
      width: '110%',
      height: '95%',
      borderRadius: '50% 60% 55% 45% / 60% 50% 65% 40%',
      background: 'linear-gradient(225deg, rgba(180, 148, 255, 0.30) 0%, rgba(127, 0, 255, 0.10) 100%)',
      top: '5%',
      left: '-5%',
      animationDelay: '-12s',
      animationDuration: '28s',
    },
  },
  {
    // Core cloud (densité max, centre)
    style: {
      width: '70%',
      height: '70%',
      borderRadius: '50% 50% 50% 50%',
      background: 'radial-gradient(circle, rgba(140, 82, 255, 0.45) 0%, transparent 70%)',
      top: '15%',
      left: '15%',
      animationDelay: '-6s',
      animationDuration: '32s',
    },
  },
]

export const InkGradientButton = React.forwardRef<HTMLButtonElement, InkProps>(
  function InkGradientButton(props, ref) {
    const {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      iconLeft,
      iconRight,
      children,
      className = '',
      ...rest
    } = props

    const reducedMotion = useReducedMotion()

    const baseClasses = [
      'relative inline-flex items-center justify-center',
      'rounded-xl',                        // pill-ish radius (24px)
      'font-black tracking-tight',         // v46 : font-black (900) au lieu de bold
      'overflow-hidden',                   // contient les nuages drift
      'transition-all duration-base ease-standard',  // v46 : transition-all pour shadow + transform
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-foreas-obsidian',
      'select-none',
      'hover:-translate-y-0.5',            // v46 : élévation hover signature (Norman feedback)
      sizeStyles[size],
      baseStyles[variant],
      fullWidth ? 'w-full' : '',
      className,
    ].join(' ')

    const motionProps = reducedMotion
      ? {}
      : {
          whileTap: { scale: 0.97 },
          transition: { type: 'spring' as const, stiffness: 380, damping: 30 },
        }

    const content = (
      <>
        {/* Couches d'encre violette drift — uniquement variant primary */}
        {variant === 'primary' && !reducedMotion && (
          <span className="absolute inset-0 pointer-events-none" aria-hidden="true">
            {inkLayers.map((layer, i) => (
              <span
                key={i}
                className="absolute animate-ink-drift"
                style={layer.style}
              />
            ))}
          </span>
        )}

        {/* Contenu */}
        <span className="relative z-10 inline-flex items-center gap-md">
          {iconLeft && <span className="inline-flex">{iconLeft}</span>}
          <span>{children}</span>
          {iconRight && <span className="inline-flex">{iconRight}</span>}
        </span>
      </>
    )

    if (props.as === 'link') {
      const { href, target, rel, onClick } = props
      return (
        <Link href={href} target={target} rel={rel} onClick={onClick} className={baseClasses}>
          {content}
        </Link>
      )
    }

    return (
      <motion.button
        ref={ref}
        type={(rest as React.ButtonHTMLAttributes<HTMLButtonElement>).type || 'button'}
        className={baseClasses}
        disabled={(rest as React.ButtonHTMLAttributes<HTMLButtonElement>).disabled}
        {...motionProps}
        {...(rest as Omit<HTMLMotionProps<'button'>, 'children'>)}
      >
        {content}
      </motion.button>
    )
  }
)

export default InkGradientButton

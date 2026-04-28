'use client'

import React from 'react'
import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion'
import Link from 'next/link'

/**
 * AppleCTA — Site2026v51
 *
 * Bouton signature FOREAS Apple-grade. Combine 5 layers d'éclairage :
 *   1. bg gradient principal (cyan→violet diagonal subtle)
 *   2. inner highlight top (white/20 → transparent)
 *   3. inner shadow bottom (black/20 → transparent) — forme "billiard ball"
 *   4. outer glow color (halo lumineux 30-50px)
 *   5. focus ring cyan (WCAG)
 *
 * Variants :
 *   - primary : cyan plein avec halo cyan + texte obsidian (max contraste)
 *   - violet  : violet plein avec halo violet + texte blanc
 *   - gold    : gold avec halo gold + texte obsidian
 *   - ghost   : transparent + border + texte blanc
 *
 * Sizes :
 *   - sm : h-10 (40px)
 *   - md : h-12 (48px)  ← default
 *   - lg : h-14 (56px)
 *   - xl : h-[60px]
 *
 * Animations :
 *   - hover : translateY -1px + glow renforcé
 *   - tap : scale 0.97 spring snappy
 */

export type AppleCTAVariant = 'primary' | 'violet' | 'gold' | 'ghost'
export type AppleCTASize = 'sm' | 'md' | 'lg' | 'xl'

interface BaseProps {
  variant?: AppleCTAVariant
  size?: AppleCTASize
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

type AppleCTAProps = AsButton | AsLink

const sizeStyles: Record<AppleCTASize, string> = {
  sm: 'h-10 px-5 text-[13px] gap-2',
  md: 'h-12 px-6 text-[15px] gap-2',
  lg: 'h-14 px-8 text-[16px] gap-2.5',
  xl: 'h-[60px] px-10 text-[17px] gap-3',
}

// Variant styles — each composes 5 light layers via box-shadow
const variantStyles: Record<AppleCTAVariant, string> = {
  primary: [
    // Background : cyan plein avec gradient subtil (haut plus clair)
    'bg-[#00D4FF]',
    'bg-gradient-to-b from-[#33DFFF] to-[#00B8E6]',
    'text-[#050508]',
    // Box-shadows multi-layers (Apple signature billiard ball + halo)
    'shadow-[inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-1px_0_rgba(0,0,0,0.15),0_0_0_1px_rgba(0,0,0,0.05),0_8px_24px_-4px_rgba(0,212,255,0.5),0_0_40px_rgba(0,212,255,0.25)]',
    'hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-1px_0_rgba(0,0,0,0.15),0_0_0_1px_rgba(0,0,0,0.05),0_12px_32px_-4px_rgba(0,212,255,0.65),0_0_60px_rgba(0,212,255,0.4)]',
  ].join(' '),

  violet: [
    'bg-[#8C52FF]',
    'bg-gradient-to-b from-[#A675FF] to-[#7440DC]',
    'text-white',
    'shadow-[inset_0_1px_0_rgba(255,255,255,0.25),inset_0_-1px_0_rgba(0,0,0,0.2),0_0_0_1px_rgba(0,0,0,0.05),0_8px_24px_-4px_rgba(140,82,255,0.5),0_0_40px_rgba(140,82,255,0.25)]',
    'hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.35),inset_0_-1px_0_rgba(0,0,0,0.2),0_0_0_1px_rgba(0,0,0,0.05),0_12px_32px_-4px_rgba(140,82,255,0.65),0_0_60px_rgba(140,82,255,0.4)]',
  ].join(' '),

  gold: [
    'bg-[#F5C842]',
    'bg-gradient-to-b from-[#FFD659] to-[#D4A82E]',
    'text-[#050508]',
    'shadow-[inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-1px_0_rgba(0,0,0,0.2),0_0_0_1px_rgba(0,0,0,0.05),0_8px_24px_-4px_rgba(245,200,66,0.4),0_0_40px_rgba(245,200,66,0.2)]',
    'hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-1px_0_rgba(0,0,0,0.2),0_0_0_1px_rgba(0,0,0,0.05),0_12px_32px_-4px_rgba(245,200,66,0.55),0_0_60px_rgba(245,200,66,0.3)]',
  ].join(' '),

  ghost: [
    'bg-white/[0.04]',
    'backdrop-blur-[12px]',
    'text-white',
    'border border-white/[0.14]',
    'shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]',
    'hover:bg-white/[0.07] hover:border-white/[0.22]',
  ].join(' '),
}

export const AppleCTA = React.forwardRef<HTMLButtonElement, AppleCTAProps>(
  function AppleCTA(props, ref) {
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
      'rounded-[14px]',                            // Apple radius signature
      'font-semibold tracking-[-0.011em]',         // Stripe LS
      'select-none whitespace-nowrap',
      'transition-[transform,box-shadow,background] duration-[280ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-[#050508]',
      'hover:-translate-y-0.5',
      'active:translate-y-0',
      sizeStyles[size],
      variantStyles[variant],
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
        {iconLeft && <span className="inline-flex shrink-0">{iconLeft}</span>}
        <span>{children}</span>
        {iconRight && <span className="inline-flex shrink-0">{iconRight}</span>}
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

export default AppleCTA

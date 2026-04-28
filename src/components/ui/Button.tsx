'use client'

import React from 'react'
import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion'
import Link from 'next/link'

/**
 * FOREAS Button v2 — Site Vitrine
 *
 * Mirror du composant Button de l'app FOREAS Driver (skill §9).
 * Variants : primary | secondary | ghost | destructive
 * Sizes    : sm (36) | md (48) | lg (56)
 *
 * - Scale press 0.97 via Framer Motion (équivalent app spring snappy)
 * - Focus ring cyan 2px (WCAG AA — skill §6)
 * - Respecte prefers-reduced-motion
 * - accessibilityRole/aria-label automatiques
 *
 * Usage :
 *   <Button variant="primary" size="md">Essai gratuit</Button>
 *   <Button as="link" href="/tarifs2" variant="primary">Voir les tarifs</Button>
 */

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive'
export type ButtonSize = 'sm' | 'md' | 'lg'

interface BaseProps {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  loading?: boolean
  iconLeft?: React.ReactNode
  iconRight?: React.ReactNode
  children: React.ReactNode
  className?: string
}

interface ButtonAsButton extends BaseProps, Omit<HTMLMotionProps<'button'>, 'children'> {
  as?: 'button'
  href?: never
}

interface ButtonAsLink extends BaseProps {
  as: 'link'
  href: string
  target?: string
  rel?: string
  onClick?: () => void
}

type ButtonProps = ButtonAsButton | ButtonAsLink

// ─── Styles ──────────────────────────────────────────────────────────────────
// Variant primary : gradient signature app cyan→violet→purple + glow violet
const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-foreas text-white shadow-glow-violet hover:shadow-glow-violet-strong',
  secondary:
    'bg-foreas-navy-card text-white border border-glass-border-soft hover:border-glass-border-hover hover:bg-foreas-navy-card/80',
  ghost:
    'bg-transparent text-white border border-glass-border-soft hover:bg-white/5 hover:border-glass-border-hover',
  destructive:
    'bg-danger text-white hover:bg-danger/90',
}

const sizeStyles: Record<ButtonSize, string> = {
  // Touch target ≥ 44pt iOS / 48dp Android (skill §4 §5) → on garde 48 minimum sur md
  sm: 'h-9 px-lg text-label gap-xs',     // 36px
  md: 'h-12 px-xl text-body-bold gap-sm', // 48px
  lg: 'h-14 px-xxl text-body-bold gap-sm', // 56px
}

// ─── Component ───────────────────────────────────────────────────────────────
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(props, ref) {
    const {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      iconLeft,
      iconRight,
      children,
      className = '',
      ...rest
    } = props

    const reducedMotion = useReducedMotion()

    const baseClasses = [
      'inline-flex items-center justify-center',
      'font-semibold rounded-pill',  // pill style signature app
      'transition-all duration-fast',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-foreas-navy',
      'select-none',
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
        {loading ? (
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" aria-label="Chargement" />
        ) : (
          <>
            {iconLeft && <span className="inline-flex">{iconLeft}</span>}
            <span>{children}</span>
            {iconRight && <span className="inline-flex">{iconRight}</span>}
          </>
        )}
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
        disabled={loading || (rest as React.ButtonHTMLAttributes<HTMLButtonElement>).disabled}
        {...motionProps}
        {...(rest as Omit<HTMLMotionProps<'button'>, 'children'>)}
      >
        {content}
      </motion.button>
    )
  }
)

export default Button

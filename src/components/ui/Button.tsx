'use client'

import React from 'react'
import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion'
import Link from 'next/link'

/**
 * Button — Site2026v43
 *
 * Bouton standard pour CTA secondaires (le bouton signature = InkGradientButton).
 *
 * Variants :
 *   - secondary : fond glass-mid + border + texte primary (alternative neutre)
 *   - ghost     : transparent + border + texte primary (tertiary action)
 *   - destructive : danger
 *
 * Sizes : sm (40) / md (48) / lg (56)
 *
 * Usage :
 *   <Button variant="ghost" size="lg">Voir la démo</Button>
 *   <Button as="link" href="/contact" variant="secondary">Contact</Button>
 */

export type ButtonVariant = 'secondary' | 'ghost' | 'destructive'
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
type ButtonProps = AsButton | AsLink

const variantStyles: Record<ButtonVariant, string> = {
  secondary:
    'glass-card-mid !rounded-xl text-text-primary hover:!border-white/[0.18]',
  ghost:
    'bg-transparent border border-glass-border text-text-primary hover:bg-white/5 hover:border-glass-border-high',
  destructive:
    'bg-danger text-white hover:bg-danger/90',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-10 px-lg text-label gap-sm',
  md: 'h-12 px-xl text-body-bold gap-sm',
  lg: 'h-14 px-xxl text-body-bold gap-md',
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(props, ref) {
    const {
      variant = 'secondary',
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
      'font-bold rounded-xl tracking-tight',
      'transition-all duration-fast ease-standard',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-foreas-obsidian',
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
          <span
            className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
            aria-label="Chargement"
          />
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

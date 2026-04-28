'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'

/**
 * AnimatedCounter — Site2026v43
 *
 * Compteur up animé scroll-triggered (1200ms easeOutCubic).
 * Mirror app `AnimatedCounter.tsx` (interpolation [0, value]).
 *
 * Conformité Cialdini Social Proof : chiffres frais et précis impriment confiance.
 *
 * Usage :
 *   <AnimatedCounter value={147} suffix=" chauffeurs" />
 *   <AnimatedCounter value={35} prefix="+" suffix="%" duration={1500} />
 */

export interface AnimatedCounterProps {
  value: number
  prefix?: string
  suffix?: string
  duration?: number    // ms
  decimals?: number
  className?: string
}

// easeOutCubic — classique premium (Apple-grade)
const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3)

export function AnimatedCounter({
  value,
  prefix = '',
  suffix = '',
  duration = 1200,
  decimals = 0,
  className = '',
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    if (!inView) return

    let start: number | null = null
    let raf = 0

    const step = (timestamp: number) => {
      if (start === null) start = timestamp
      const elapsed = timestamp - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = easeOutCubic(progress)
      setDisplayValue(value * eased)
      if (progress < 1) raf = requestAnimationFrame(step)
    }

    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [inView, value, duration])

  const formatted = decimals > 0
    ? displayValue.toFixed(decimals)
    : Math.round(displayValue).toString()

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  )
}

export default AnimatedCounter

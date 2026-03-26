'use client'

import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '@/hooks/useDevicePerf'

interface AnimatedCounterProps {
  value: number
  suffix?: string
  prefix?: string
  duration?: number
  decimals?: number
  className?: string
}

export default function AnimatedCounter({ value, suffix = '', prefix = '', duration = 1.5, decimals = 0, className = '' }: AnimatedCounterProps) {
  const [display, setDisplay] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    if (reducedMotion || hasAnimated) return
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !hasAnimated) {
        setHasAnimated(true)
        const start = performance.now()
        const durationMs = duration * 1000

        const animate = (now: number) => {
          const elapsed = now - start
          const progress = Math.min(elapsed / durationMs, 1)
          const eased = 1 - Math.pow(1 - progress, 3) // easeOutCubic
          setDisplay(Number((eased * value).toFixed(decimals)))
          if (progress < 1) requestAnimationFrame(animate)
        }
        requestAnimationFrame(animate)
      }
    }, { threshold: 0.3 })

    observer.observe(el)
    return () => observer.disconnect()
  }, [value, duration, decimals, hasAnimated, reducedMotion])

  return (
    <span ref={ref} className={className}>
      {prefix}{reducedMotion ? value : display}{suffix}
    </span>
  )
}

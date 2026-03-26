'use client'

import { motion } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useDevicePerf'
import { ReactNode } from 'react'

interface PulsingRingProps {
  color?: string
  children: ReactNode
}

export default function PulsingRing({ color = '#00D4FF', children }: PulsingRingProps) {
  const reducedMotion = useReducedMotion()

  return (
    <span className="relative inline-flex items-center justify-center">
      {!reducedMotion && (
        <motion.span
          className="absolute inset-0 rounded-full"
          style={{ border: `2px solid ${color}` }}
          animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      <span className="relative px-4 py-1 rounded-full" style={{ border: `1.5px solid ${color}30` }}>
        {children}
      </span>
    </span>
  )
}

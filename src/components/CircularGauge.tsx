'use client'

import { motion } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useDevicePerf'

interface CircularGaugeProps {
  value: number
  max: number
  label: string
  color?: string
  suffix?: string
}

export default function CircularGauge({ value, max, label, color = '#00D4FF', suffix = '%' }: CircularGaugeProps) {
  const reducedMotion = useReducedMotion()
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const progress = (value / max) * circumference

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
          {/* Animated progress */}
          <motion.circle
            cx="50" cy="50" r={radius}
            fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: reducedMotion ? circumference - progress : circumference }}
            whileInView={{ strokeDashoffset: circumference - progress }}
            viewport={{ once: true, margin: '-30px' }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-mono font-semibold text-white">{value}{suffix}</span>
        </div>
      </div>
      <span className="text-xs text-white/50 text-center font-body">{label}</span>
    </div>
  )
}

'use client'

import { motion } from 'framer-motion'

interface AnimatedBarProps {
  redValue: number
  redLabel: string
  cyanValue: number
  cyanLabel: string
}

export default function AnimatedBar({ redValue, redLabel, cyanValue, cyanLabel }: AnimatedBarProps) {
  const maxValue = Math.max(redValue, cyanValue)

  return (
    <div className="w-full max-w-md mx-auto py-6 space-y-4">
      {/* Red bar */}
      <div className="space-y-1.5">
        <span className="text-sm font-mono text-red-400/80">{redLabel}</span>
        <div className="h-8 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-red-500/60 to-red-400/40 rounded-full flex items-center justify-end pr-3"
            initial={{ width: 0 }}
            whileInView={{ width: `${(redValue / maxValue) * 100}%` }}
            viewport={{ once: true, margin: '-30px' }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="text-xs font-mono text-white/80">{redValue}€</span>
          </motion.div>
        </div>
      </div>

      {/* Cyan bar */}
      <div className="space-y-1.5">
        <span className="text-sm font-mono text-accent-cyan/80">{cyanLabel}</span>
        <div className="h-8 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-accent-cyan/60 to-accent-cyan/30 rounded-full flex items-center justify-end pr-3"
            initial={{ width: 0 }}
            whileInView={{ width: `${(cyanValue / maxValue) * 100}%` }}
            viewport={{ once: true, margin: '-30px' }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          >
            <span className="text-xs font-mono text-white/80">{cyanValue}€</span>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

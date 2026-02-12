'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const stats = [
  {
    value: '+35',
    suffix: '%',
    label: 'de CA',
    sublabel: 'mesuré sur 847 chauffeurs',
  },
  {
    value: '–2',
    suffix: 'h',
    label: 'de vide',
    sublabel: 'par jour',
  },
  {
    value: '87',
    suffix: '%',
    label: 'de précision',
    sublabel: 'validé terrain',
  },
  {
    value: '24',
    suffix: '/7',
    label: 'actif',
    sublabel: "même à 3h du mat'",
  },
]

export default function Stats() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section ref={ref} className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#08080d]" />

      {/* Gradient line top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-accent-purple/[0.03] rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="relative text-center lg:text-left"
            >
              {/* Divider for desktop */}
              {index > 0 && (
                <div className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 w-px h-16 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
              )}

              <div className="lg:pl-8">
                {/* Value */}
                <div className="flex items-baseline justify-center lg:justify-start gap-1 mb-2">
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : {}}
                    transition={{ duration: 0.8, delay: index * 0.1 + 0.3 }}
                    className="font-title text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight"
                  >
                    {stat.value}
                  </motion.span>
                  <span className="font-title text-2xl md:text-3xl lg:text-4xl font-bold text-accent-cyan">
                    {stat.suffix}
                  </span>
                </div>

                {/* Label */}
                <p className="font-body text-sm font-medium text-white/80 mb-1">
                  {stat.label}
                </p>
                <p className="font-body text-xs text-white/50">
                  {stat.sublabel}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Gradient line bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </section>
  )
}

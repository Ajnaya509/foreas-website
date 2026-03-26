'use client'

import { motion } from 'framer-motion'
import { useIsMobile, useReducedMotion } from '@/hooks/useDevicePerf'

export default function DashboardMockup() {
  const isMobile = useIsMobile()
  const reducedMotion = useReducedMotion()
  const skipFloat = isMobile || reducedMotion

  const metrics = [
    { label: 'Courses/jour', value: '47', trend: '+12%', color: '#00D4FF' },
    { label: 'Satisfaction', value: '4.8', trend: '/5', color: '#8C52FF' },
    { label: 'Revenus', value: '€2.4k', trend: '/sem', color: '#10B981' },
  ]

  return (
    <div className="relative">
      {/* Glow */}
      <div className="absolute -inset-6 bg-gradient-to-b from-accent-purple/15 via-accent-cyan/8 to-transparent rounded-3xl blur-[50px] opacity-60" />

      <motion.div
        animate={skipFloat ? undefined : { y: [0, -6, 0] }}
        transition={skipFloat ? undefined : { duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="relative"
      >
        {/* Tablet frame */}
        <div className="relative w-[300px] sm:w-[340px] lg:w-[380px] bg-gradient-to-b from-[#1a1a1f] to-[#0d0d12] rounded-2xl p-[2px] shadow-2xl shadow-black/50">
          <div className="absolute inset-0 rounded-2xl border border-white/10" />

          <div className="relative bg-[#050508] rounded-[14px] overflow-hidden p-4 space-y-4">
            {/* Top bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
                <span className="text-[10px] font-mono text-accent-green/80 uppercase tracking-wider">Live</span>
              </div>
              <span className="text-[10px] font-mono text-white/30">Dashboard Partenaire</span>
            </div>

            {/* Metrics row */}
            <div className="grid grid-cols-3 gap-2">
              {metrics.map((m, i) => (
                <div key={i} className="bg-white/[0.03] rounded-lg p-2.5 border border-white/[0.05]">
                  <div className="text-[9px] text-white/40 font-body mb-1">{m.label}</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-base font-mono font-semibold text-white">{m.value}</span>
                    <span className="text-[9px] font-mono" style={{ color: m.color }}>{m.trend}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Mini chart */}
            <div className="bg-white/[0.02] rounded-lg p-3 border border-white/[0.05]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] text-white/40 font-body">Revenus hebdomadaires</span>
                <span className="text-[9px] text-accent-cyan/60 font-mono">+18%</span>
              </div>
              <svg className="w-full h-12" viewBox="0 0 200 48" fill="none">
                {/* Grid lines */}
                <line x1="0" y1="12" x2="200" y2="12" stroke="rgba(255,255,255,0.03)" />
                <line x1="0" y1="24" x2="200" y2="24" stroke="rgba(255,255,255,0.03)" />
                <line x1="0" y1="36" x2="200" y2="36" stroke="rgba(255,255,255,0.03)" />
                {/* Area fill */}
                <motion.path
                  d="M0 42 L28 36 L57 38 L85 30 L114 26 L142 18 L171 14 L200 6 L200 48 L0 48 Z"
                  fill="url(#chartGrad)"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
                {/* Line */}
                <motion.path
                  d="M0 42 L28 36 L57 38 L85 30 L114 26 L142 18 L171 14 L200 6"
                  stroke="#00D4FF" strokeWidth="2" fill="none" strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                />
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="48">
                    <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#00D4FF" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Bottom row — mini stats */}
            <div className="flex items-center justify-between text-[9px] text-white/30 font-mono pt-1">
              <span>7j · Île-de-France</span>
              <span className="text-accent-purple/50">FOREAS Intelligence</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

'use client'

import { motion } from 'framer-motion'
import { useIsMobile, useReducedMotion } from '@/hooks/useDevicePerf'

const vehicles = [
  { cx: 82, cy: 55, color: '#10B981', status: 'en course', delay: 0 },
  { cx: 125, cy: 38, color: '#10B981', status: 'en course', delay: 0.3 },
  { cx: 155, cy: 72, color: '#10B981', status: 'en course', delay: 0.6 },
  { cx: 60, cy: 35, color: '#00D4FF', status: 'repositionnement IA', delay: 0.8 },
  { cx: 170, cy: 48, color: '#00D4FF', status: 'repositionnement IA', delay: 1.1 },
  { cx: 105, cy: 78, color: '#F59E0B', status: 'en attente', delay: 1.4 },
]

const legend = [
  { color: '#10B981', label: 'En course' },
  { color: '#00D4FF', label: 'Repositionnement IA' },
  { color: '#F59E0B', label: 'En attente' },
]

export default function FleetMapMockup() {
  const isMobile = useIsMobile()
  const reducedMotion = useReducedMotion()
  const skipFloat = isMobile || reducedMotion

  return (
    <div className="relative">
      {/* Glow */}
      <div className="absolute -inset-6 bg-gradient-to-b from-accent-cyan/12 via-accent-purple/6 to-transparent rounded-3xl blur-[50px] opacity-60" />

      <motion.div
        animate={skipFloat ? undefined : { y: [0, -6, 0] }}
        transition={skipFloat ? undefined : { duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="relative"
      >
        {/* Frame */}
        <div className="relative w-[280px] sm:w-[320px] lg:w-[360px] bg-gradient-to-b from-[#1a1a1f] to-[#0d0d12] rounded-2xl p-[2px] shadow-2xl shadow-black/50">
          <div className="absolute inset-0 rounded-2xl border border-white/10" />

          <div className="relative bg-[#050508] rounded-[14px] overflow-hidden p-4 space-y-3">
            {/* Top bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
                <span className="text-[10px] font-mono text-accent-green/80 uppercase tracking-wider">6 véhicules</span>
              </div>
              <span className="text-[10px] font-mono text-white/30">Fleet Manager</span>
            </div>

            {/* Map SVG */}
            <div className="relative bg-white/[0.02] rounded-xl border border-white/[0.05] overflow-hidden">
              <svg className="w-full" viewBox="0 0 240 110" fill="none">
                {/* Seine river */}
                <path
                  d="M0 60 Q40 45 80 55 Q120 65 160 50 Q200 35 240 45"
                  stroke="rgba(0,212,255,0.12)" strokeWidth="8" fill="none" strokeLinecap="round"
                />
                {/* Major roads */}
                <line x1="120" y1="0" x2="120" y2="110" stroke="rgba(255,255,255,0.04)" strokeWidth="1.5" />
                <line x1="0" y1="55" x2="240" y2="55" stroke="rgba(255,255,255,0.04)" strokeWidth="1.5" />
                <line x1="40" y1="0" x2="200" y2="110" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                <line x1="200" y1="0" x2="40" y2="110" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

                {/* Arrondissements labels */}
                <text x="70" y="30" fill="rgba(255,255,255,0.06)" fontSize="7" fontFamily="monospace">9e</text>
                <text x="135" y="30" fill="rgba(255,255,255,0.06)" fontSize="7" fontFamily="monospace">10e</text>
                <text x="90" y="68" fill="rgba(255,255,255,0.06)" fontSize="7" fontFamily="monospace">6e</text>
                <text x="150" y="90" fill="rgba(255,255,255,0.06)" fontSize="7" fontFamily="monospace">13e</text>

                {/* Vehicle dots with pulses */}
                {vehicles.map((v, i) => (
                  <g key={i}>
                    {/* Pulse ring */}
                    {!reducedMotion && (
                      <motion.circle
                        cx={v.cx} cy={v.cy} r="3"
                        fill="none" stroke={v.color} strokeWidth="1"
                        animate={{ r: [3, 8, 3], opacity: [0.6, 0, 0.6] }}
                        transition={{ duration: 2, repeat: Infinity, delay: v.delay, ease: 'easeInOut' }}
                      />
                    )}
                    {/* Solid dot */}
                    <motion.circle
                      cx={v.cx} cy={v.cy} r="3.5"
                      fill={v.color}
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: v.delay * 0.5 }}
                    />
                  </g>
                ))}

                {/* IA repositioning arrow */}
                {!reducedMotion && (
                  <motion.line
                    x1="60" y1="35" x2="90" y2="48"
                    stroke="#00D4FF" strokeWidth="1" strokeDasharray="3 3"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 0.4 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 1 }}
                  />
                )}
              </svg>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4">
              {legend.map((l, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />
                  <span className="text-[8px] text-white/40 font-mono">{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

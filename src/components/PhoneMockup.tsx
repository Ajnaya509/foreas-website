'use client'

import { motion } from 'framer-motion'
import { useIsMobile, useReducedMotion } from '@/hooks/useDevicePerf'

export default function PhoneMockup() {
  const isMobile = useIsMobile()
  const reducedMotion = useReducedMotion()
  const skipInfinite = isMobile || reducedMotion

  return (
    <div className="relative">
      {/* Outer glow layers — smaller on mobile */}
      <div className="absolute -inset-4 md:-inset-8 bg-gradient-to-b from-accent-purple/20 via-accent-cyan/10 to-transparent rounded-[4rem] blur-[40px] md:blur-[60px] opacity-60" />
      <div className="absolute -inset-2 md:-inset-4 bg-gradient-to-b from-accent-purple/10 to-transparent rounded-[4rem] blur-[25px] md:blur-[40px]" />

      {/* Phone container — float disabled on mobile for perf */}
      <motion.div
        animate={skipInfinite ? undefined : { y: [0, -8, 0] }}
        transition={skipInfinite ? undefined : { duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="relative"
      >
        {/* iPhone Frame - Compact for above-fold */}
        <div className="relative w-[200px] sm:w-[220px] md:w-[250px] lg:w-[270px] h-[420px] sm:h-[460px] md:h-[520px] lg:h-[540px] bg-gradient-to-b from-[#1a1a1f] to-[#0d0d12] rounded-[2rem] sm:rounded-[2.5rem] md:rounded-[3rem] p-[2px] md:p-[3px] shadow-2xl shadow-black/50">
          {/* Frame inner border */}
          <div className="absolute inset-0 rounded-[2rem] sm:rounded-[2.5rem] md:rounded-[3rem] border border-white/10" />

          {/* Screen area */}
          <div className="relative w-full h-full bg-[#050508] rounded-[1.8rem] sm:rounded-[2.3rem] md:rounded-[2.8rem] overflow-hidden">
            {/* Dynamic Island */}
            <div className="absolute top-2 sm:top-3 left-1/2 -translate-x-1/2 w-[70px] sm:w-[85px] md:w-[100px] h-[22px] sm:h-[26px] md:h-[32px] bg-black rounded-full z-20 flex items-center justify-center gap-1.5 md:gap-2">
              <div className="w-1.5 md:w-2 h-1.5 md:h-2 rounded-full bg-[#1a1a1a]" />
              <div className="w-2 md:w-3 h-2 md:h-3 rounded-full bg-[#1a1a1a]" />
            </div>

            {/* Status bar */}
            <div className="absolute top-2 sm:top-3 left-5 sm:left-7 right-5 sm:right-7 flex justify-between items-center text-white text-[9px] sm:text-[11px] font-medium z-10">
              <span>20:08</span>
              <div className="flex items-center gap-1.5 opacity-80">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/>
                </svg>
                <svg className="w-6 h-3.5" viewBox="0 0 28 14">
                  <rect x="0" y="0" width="24" height="14" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                  <rect x="2" y="2" width="17" height="10" rx="1.5" fill="currentColor"/>
                  <rect x="25" y="4" width="2.5" height="6" rx="1" fill="currentColor" opacity="0.5"/>
                </svg>
              </div>
            </div>

            {/* App Content */}
            <div className="absolute inset-0 pt-10 sm:pt-14">
              {/* Map Area - Paris Style */}
              <div className="h-[48%] sm:h-[42%] relative bg-[#0a0a12] overflow-hidden">
                {/* Paris-style map background */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 220" preserveAspectRatio="xMidYMid slice">
                  <defs>
                    <linearGradient id="seineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#1a3a5c" stopOpacity="0.3"/>
                      <stop offset="50%" stopColor="#2a5a8c" stopOpacity="0.4"/>
                      <stop offset="100%" stopColor="#1a3a5c" stopOpacity="0.3"/>
                    </linearGradient>
                    <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#00D4FF"/>
                      <stop offset="100%" stopColor="#8C52FF"/>
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                      <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                  </defs>

                  {/* Background blocks (buildings) */}
                  <rect x="20" y="20" width="35" height="45" fill="#0f0f18" rx="2"/>
                  <rect x="65" y="15" width="50" height="55" fill="#0d0d15" rx="2"/>
                  <rect x="125" y="25" width="40" height="35" fill="#0f0f18" rx="2"/>
                  <rect x="175" y="10" width="55" height="50" fill="#0d0d15" rx="2"/>
                  <rect x="240" y="20" width="45" height="40" fill="#0f0f18" rx="2"/>

                  <rect x="15" y="85" width="45" height="40" fill="#0d0d15" rx="2"/>
                  <rect x="180" y="80" width="50" height="45" fill="#0f0f18" rx="2"/>
                  <rect x="245" y="75" width="40" height="50" fill="#0d0d15" rx="2"/>

                  <rect x="25" y="145" width="55" height="50" fill="#0f0f18" rx="2"/>
                  <rect x="95" y="150" width="40" height="45" fill="#0d0d15" rx="2"/>
                  <rect x="150" y="140" width="60" height="55" fill="#0f0f18" rx="2"/>
                  <rect x="225" y="145" width="50" height="50" fill="#0d0d15" rx="2"/>

                  {/* Seine river curve */}
                  <path d="M -10 200 Q 80 170 150 180 Q 220 190 310 160" stroke="url(#seineGrad)" strokeWidth="18" fill="none" opacity="0.6"/>

                  {/* Street grid */}
                  <path d="M 0 70 L 300 70" stroke="#1a1a25" strokeWidth="2"/>
                  <path d="M 0 130 L 300 130" stroke="#1a1a25" strokeWidth="2"/>
                  <path d="M 60 0 L 60 220" stroke="#1a1a25" strokeWidth="2"/>
                  <path d="M 170 0 L 170 220" stroke="#1a1a25" strokeWidth="2"/>
                  <path d="M 240 0 L 240 220" stroke="#1a1a25" strokeWidth="2"/>

                  {/* Diagonal boulevards */}
                  <path d="M 0 0 L 170 130" stroke="#15152a" strokeWidth="3" opacity="0.5"/>
                  <path d="M 300 50 L 170 130" stroke="#15152a" strokeWidth="3" opacity="0.5"/>
                </svg>

                {/* === HOT ZONE - Red/Orange with pulse === */}
                <div className="absolute top-[35%] left-[55%] -translate-x-1/2 -translate-y-1/2">
                  {/* Outer pulse — disabled on mobile */}
                  {!skipInfinite && (
                    <motion.div
                      animate={{ scale: [1, 1.8, 1], opacity: [0.4, 0, 0.4] }}
                      transition={{ duration: 2.5, repeat: Infinity }}
                      className="absolute inset-0 w-24 h-24 -translate-x-[25%] -translate-y-[25%] rounded-full bg-red-500/40"
                    />
                  )}
                  {/* Middle glow — static on mobile */}
                  <div className="absolute inset-0 w-10 h-10 sm:w-16 sm:h-16 -translate-x-[12%] -translate-y-[12%] rounded-full bg-gradient-to-br from-orange-500/50 to-red-600/50 opacity-50" />
                  {/* Inner hot zone */}
                  <div
                    className="relative w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-orange-400 to-red-500 shadow-lg shadow-red-500/50 border border-orange-300/30 flex items-center justify-center"
                  >
                    {/* +35% inside hot zone for clarity */}
                    <span className="text-white font-bold text-[7px] sm:text-[10px]">+35%</span>
                  </div>
                </div>

                {/* Zone label - RÉPUBLIQUE */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="absolute top-[16%] left-[55%] -translate-x-1/2"
                >
                  <span className="text-[8px] sm:text-[11px] text-white font-bold tracking-wide bg-red-500/90 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded sm:rounded-md shadow-lg shadow-red-500/30">RÉPUBLIQUE</span>
                </motion.div>

                {/* === USER POSITION - Cyan marker === */}
                <div className="absolute top-[62%] left-[22%]">
                  {/* Pulse around user — disabled on mobile */}
                  {!skipInfinite && (
                    <motion.div
                      animate={{ scale: [1, 2.5, 1], opacity: [0.6, 0, 0.6] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 w-8 h-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-cyan"
                    />
                  )}
                  {/* User marker */}
                  <div className="relative w-4 h-4 sm:w-6 sm:h-6 -translate-x-1/2 -translate-y-1/2 bg-accent-cyan rounded-full shadow-lg shadow-accent-cyan/60 border-[1.5px] sm:border-2 border-white flex items-center justify-center">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full" />
                  </div>
                </div>

                {/* "VOUS" label */}
                <div className="absolute top-[74%] left-[22%] -translate-x-1/2">
                  <span className="text-[8px] sm:text-[10px] text-white font-bold tracking-wide bg-accent-cyan/90 px-1.5 sm:px-2 py-0.5 rounded shadow-lg shadow-accent-cyan/30">VOUS</span>
                </div>

                {/* === ROUTE LINE - Cyan to Purple === */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 300 220">
                  <defs>
                    <linearGradient id="routeLine" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#00D4FF"/>
                      <stop offset="100%" stopColor="#8C52FF"/>
                    </linearGradient>
                    <marker id="routeArrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                      <path d="M0,0 L0,6 L6,3 z" fill="#8C52FF" opacity="0.89"/>
                    </marker>
                  </defs>

                  {/* Animated route path */}
                  <motion.path
                    d="M 66 145 C 90 135 110 110 130 95 S 148 82 155 78"
                    fill="none"
                    stroke="url(#routeLine)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    markerEnd="url(#routeArrow)"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 1.2, ease: "easeOut" }}
                  />

                  {/* Moving dot along route — disabled on mobile */}
                  {!skipInfinite && (
                    <motion.circle
                      r="3.5"
                      fill="#00D4FF"
                      filter="url(#glow)"
                      animate={{
                        cx: [66, 90, 130, 155],
                        cy: [145, 135, 95, 78],
                        opacity: [1, 1, 1, 0]
                      }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                  )}
                </svg>

                {/* Location badge - Paris 11e */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="absolute top-1.5 sm:top-3 left-1.5 sm:left-3 flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-[#0f0f18] md:bg-[#0f0f18]/90 md:backdrop-blur-sm rounded sm:rounded-lg border border-white/10"
                >
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-accent-cyan rounded-full" />
                  <span className="text-white/70 text-[8px] sm:text-[10px] font-medium">Paris 11e</span>
                </motion.div>

                {/* Time badge */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="absolute top-1.5 sm:top-3 right-1.5 sm:right-3 flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-[#0f0f18] md:bg-[#0f0f18]/90 md:backdrop-blur-sm rounded sm:rounded-lg border border-white/10"
                >
                  <span className="text-accent-purple text-[8px] sm:text-[10px]">⏱</span>
                  <span className="text-white text-[8px] sm:text-[10px] font-bold">12 min</span>
                </motion.div>
              </div>

              {/* Ajnaya Card - Cyan/Purple theme */}
              <div className="absolute bottom-[52px] sm:bottom-[72px] left-2 right-2 sm:left-3 sm:right-3">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="bg-gradient-to-br from-[#12121a] to-[#0a0a10] md:backdrop-blur-xl rounded-xl sm:rounded-2xl p-2.5 sm:p-4 border border-white/[0.08] shadow-xl"
                >
                  {/* Header with Ajnaya branding */}
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-3">
                    <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-md sm:rounded-lg bg-gradient-to-br from-accent-purple to-accent-cyan flex items-center justify-center">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z"/>
                      </svg>
                    </div>
                    <span className="text-white/50 text-[9px] sm:text-[11px] font-medium">Ajnaya recommande</span>
                  </div>

                  {/* Recommendation */}
                  <div className="flex items-center justify-between mb-1.5 sm:mb-3">
                    <div>
                      <p className="text-white font-semibold text-[11px] sm:text-[14px]">République • 12 min</p>
                      <p className="text-white/40 text-[9px] sm:text-[11px]">Zone chaude détectée</p>
                    </div>
                    <div className="text-right">
                      <p className="text-accent-cyan font-bold text-[13px] sm:text-[16px]">+35%</p>
                      <p className="text-white/30 text-[8px] sm:text-[10px]">vs ici</p>
                    </div>
                  </div>

                  {/* CTA Button - Gradient */}
                  <button className="w-full py-1.5 sm:py-2.5 bg-gradient-to-r from-accent-purple to-accent-cyan rounded-lg sm:rounded-xl text-white font-semibold text-[11px] sm:text-[13px] flex items-center justify-center gap-1.5 sm:gap-2 shadow-lg shadow-accent-purple/20 hover:opacity-90 transition-opacity">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                    Y aller
                  </button>
                </motion.div>
              </div>

              {/* Bottom Navigation */}
              <div className="absolute bottom-0 left-0 right-0 h-[50px] sm:h-[68px] bg-[#0a0a10] md:bg-[#0a0a10]/95 md:backdrop-blur-xl border-t border-white/[0.05] flex items-center justify-around px-1 sm:px-2">
                {[
                  { icon: 'home', label: 'Accueil', active: true },
                  { icon: 'sparkle', label: 'Ajnaya', active: false },
                  { icon: 'users', label: 'Social', active: false },
                  { icon: 'chart', label: 'Stats', active: false },
                  { icon: 'user', label: 'Profil', active: false },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`flex flex-col items-center gap-0.5 sm:gap-1 py-1 sm:py-2 px-1.5 sm:px-3 rounded-lg sm:rounded-xl transition-colors ${
                      item.active ? 'text-white' : 'text-white/30'
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 sm:w-5 sm:h-5 ${item.active ? 'text-accent-cyan' : ''}`}>
                      {item.icon === 'home' && (
                        <svg fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
                      )}
                      {item.icon === 'sparkle' && (
                        <svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z"/></svg>
                      )}
                      {item.icon === 'users' && (
                        <svg fill="currentColor" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
                      )}
                      {item.icon === 'chart' && (
                        <svg fill="currentColor" viewBox="0 0 24 24"><path d="M3 13h2v8H3v-8zm4-6h2v14H7V7zm4-4h2v18h-2V3zm4 8h2v10h-2V11zm4-3h2v13h-2V8z"/></svg>
                      )}
                      {item.icon === 'user' && (
                        <svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                      )}
                    </div>
                    <span className="text-[7px] sm:text-[9px] font-medium">{item.label}</span>
                    {item.active && (
                      <div className="absolute bottom-1 w-1 h-1 bg-accent-cyan rounded-full" />
                    )}
                  </div>
                ))}
              </div>

              {/* Home indicator */}
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/20 rounded-full" />
            </div>
          </div>
        </div>

        {/* Reflection */}
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-[200px] h-[60px] bg-gradient-to-t from-transparent via-accent-purple/5 to-transparent blur-2xl rounded-full" />
      </motion.div>
    </div>
  )
}

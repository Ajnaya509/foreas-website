'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { useIsMobile, useReducedMotion } from '@/hooks/useDevicePerf'

export default function ScrollMapAnimation() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()
  const reducedMotion = useReducedMotion()
  const skipInfinite = isMobile || reducedMotion

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  })

  // ─── Global section visibility ──────────────────────────
  const sectionOpacity = useTransform(scrollYProgress, [0, 0.08, 0.85, 0.95], [0, 1, 1, 0])

  // ─── Car position: zone vide (bas-gauche) → zone chaude (haut-droite) ──
  // Coordinates in SVG viewBox 0-300 x 0-220
  const carProgress = useTransform(scrollYProgress, [0.12, 0.72], [0, 1])
  const carX = useTransform(carProgress, [0, 0.3, 0.6, 1], [55, 100, 170, 225])
  const carY = useTransform(carProgress, [0, 0.3, 0.6, 1], [160, 140, 100, 60])

  // ─── Zone opacities ─────────────────────────────────────
  const emptyZoneOpacity = useTransform(scrollYProgress, [0.08, 0.15, 0.45], [0, 0.8, 0.15])
  const hotZoneOpacity = useTransform(scrollYProgress, [0.35, 0.55, 0.75], [0.15, 0.6, 1])

  // ─── Route path reveal ──────────────────────────────────
  const routeLength = useTransform(scrollYProgress, [0.10, 0.70], [0, 1])

  // ─── Step cards — horizontal slide: enter from side → visible center → exit other side ──
  // Each card has: translateX (slide), opacity (fade in/out)
  // Card 1: Détection — enters from LEFT
  const card1X = useTransform(scrollYProgress, [0.10, 0.18, 0.30, 0.38], [-120, 0, 0, 120])
  const card1Opacity = useTransform(scrollYProgress, [0.10, 0.18, 0.30, 0.38], [0, 1, 1, 0])

  // Card 2: Analyse — enters from RIGHT
  const card2X = useTransform(scrollYProgress, [0.34, 0.42, 0.54, 0.62], [120, 0, 0, -120])
  const card2Opacity = useTransform(scrollYProgress, [0.34, 0.42, 0.54, 0.62], [0, 1, 1, 0])

  // Card 3: Guidage — enters from LEFT, stays visible
  const card3X = useTransform(scrollYProgress, [0.58, 0.66, 0.80], [-120, 0, 0])
  const card3Opacity = useTransform(scrollYProgress, [0.58, 0.66, 0.85, 0.92], [0, 1, 1, 0])

  return (
    <section ref={containerRef} className={`relative bg-foreas-deepblack ${isMobile ? 'h-[250vh]' : 'h-[350vh]'}`}>
      <div className="sticky top-0 h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-foreas-deepblack via-foreas-black to-foreas-deepblack" />

        {/* Title */}
        <motion.div
          style={{ opacity: sectionOpacity }}
          className="relative text-center z-20 px-4 mb-4 sm:mb-6"
        >
          <h2 className="font-title text-2xl sm:text-3xl md:text-5xl text-white mb-1 sm:mb-3">
            Comment <span className="text-accent-cyan">Ajnaya</span> vous guide
          </h2>
          <p className="text-white/50 text-xs sm:text-sm md:text-lg">
            De la zone vide vers l'opportunité
          </p>
        </motion.div>

        {/* ─── Phone mockup with map ─────────────────────── */}
        <motion.div
          style={{ opacity: sectionOpacity }}
          className="relative z-10"
        >
          {/* Phone frame */}
          <div className="relative w-[260px] sm:w-[300px] md:w-[340px] h-[440px] sm:h-[500px] md:h-[540px] bg-gradient-to-b from-[#1a1a1f] to-[#0d0d12] rounded-[2.2rem] sm:rounded-[2.8rem] p-[2px] sm:p-[3px] shadow-2xl shadow-black/50">
            <div className="absolute inset-0 rounded-[2.2rem] sm:rounded-[2.8rem] border border-white/[0.08]" />

            {/* Screen */}
            <div className="relative w-full h-full bg-[#050508] rounded-[2rem] sm:rounded-[2.6rem]" style={{ overflow: 'hidden', isolation: 'isolate' }}>
              {/* Dynamic Island */}
              <div className="absolute top-2 sm:top-3 left-1/2 -translate-x-1/2 w-[70px] sm:w-[90px] h-[22px] sm:h-[28px] bg-black rounded-full z-30" />

              {/* Status bar */}
              <div className="absolute top-2 sm:top-3 left-5 sm:left-7 right-5 sm:right-7 flex justify-between items-center text-white text-[9px] sm:text-[11px] font-medium z-20">
                <span>20:08</span>
                <div className="flex items-center gap-1 opacity-70">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/>
                  </svg>
                  <svg className="w-5 h-3" viewBox="0 0 28 14">
                    <rect x="0" y="0" width="24" height="14" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                    <rect x="2" y="2" width="17" height="10" rx="1.5" fill="currentColor"/>
                  </svg>
                </div>
              </div>

              {/* ─── Full-screen map ─────────────────────── */}
              <div className="absolute inset-0 pt-10 sm:pt-12 bg-[#0a0a12]">
                <svg className="w-full h-full" viewBox="0 0 300 220" preserveAspectRatio="xMidYMid slice">
                  <defs>
                    <linearGradient id="scrollRouteGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#00D4FF" />
                      <stop offset="100%" stopColor="#8C52FF" />
                    </linearGradient>
                    <linearGradient id="seineGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#1a3a5c" stopOpacity="0.3"/>
                      <stop offset="50%" stopColor="#2a5a8c" stopOpacity="0.4"/>
                      <stop offset="100%" stopColor="#1a3a5c" stopOpacity="0.3"/>
                    </linearGradient>
                  </defs>

                  {/* Building blocks */}
                  <rect x="15" y="15" width="40" height="35" fill="#0d0d15" rx="2"/>
                  <rect x="70" y="10" width="50" height="45" fill="#0f0f18" rx="2"/>
                  <rect x="140" y="20" width="35" height="30" fill="#0d0d15" rx="2"/>
                  <rect x="195" y="8" width="50" height="40" fill="#0f0f18" rx="2"/>
                  <rect x="255" y="15" width="35" height="35" fill="#0d0d15" rx="2"/>
                  <rect x="10" y="75" width="40" height="35" fill="#0f0f18" rx="2"/>
                  <rect x="195" y="70" width="45" height="38" fill="#0d0d15" rx="2"/>
                  <rect x="250" y="68" width="38" height="42" fill="#0f0f18" rx="2"/>
                  <rect x="20" y="135" width="50" height="42" fill="#0d0d15" rx="2"/>
                  <rect x="90" y="140" width="35" height="38" fill="#0f0f18" rx="2"/>
                  <rect x="155" y="130" width="55" height="48" fill="#0d0d15" rx="2"/>
                  <rect x="230" y="138" width="45" height="42" fill="#0f0f18" rx="2"/>

                  {/* Seine river */}
                  <path d="M -10 195 Q 80 165 150 175 Q 220 185 310 155" stroke="url(#seineGrad2)" strokeWidth="14" fill="none" opacity="0.5"/>

                  {/* Street grid */}
                  <path d="M 0 65 L 300 65" stroke="#1a1a25" strokeWidth="1.5" />
                  <path d="M 0 125 L 300 125" stroke="#1a1a25" strokeWidth="1.5" />
                  <path d="M 75 0 L 75 220" stroke="#1a1a25" strokeWidth="1.5" />
                  <path d="M 185 0 L 185 220" stroke="#1a1a25" strokeWidth="1.5" />

                  {/* Diagonal boulevard */}
                  <path d="M 30 200 Q 100 160 180 110 Q 240 70 280 50" stroke="#15152a" strokeWidth="2.5" fill="none" opacity="0.5" />

                  {/* Route — progressive reveal */}
                  <motion.path
                    d="M 55 160 Q 100 145 150 115 Q 195 90 225 60"
                    fill="none"
                    stroke="url(#scrollRouteGrad)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray="6 3"
                    style={{ pathLength: routeLength }}
                  />

                  {/* Empty zone circle — bottom left */}
                  <motion.circle
                    cx="55" cy="160" r="28"
                    fill="none"
                    stroke="#666"
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                    style={{ opacity: emptyZoneOpacity }}
                  />
                  <motion.text
                    x="55" y="157" textAnchor="middle" fill="#888"
                    fontSize="8" fontWeight="600" style={{ opacity: emptyZoneOpacity }}
                  >ZONE VIDE</motion.text>
                  <motion.text
                    x="55" y="168" textAnchor="middle" fill="#666"
                    fontSize="6" style={{ opacity: emptyZoneOpacity }}
                  >0 demande</motion.text>

                  {/* Hot zone — top right */}
                  <motion.circle
                    cx="225" cy="60" r="30"
                    fill="rgba(239,68,68,0.12)"
                    stroke="rgba(239,68,68,0.5)"
                    strokeWidth="1.5"
                    style={{ opacity: hotZoneOpacity }}
                  />
                  {/* Hot zone pulse — desktop only */}
                  {!skipInfinite && (
                    <motion.circle
                      cx="225" cy="60" r="30"
                      fill="none"
                      stroke="rgba(239,68,68,0.3)"
                      strokeWidth="1"
                      animate={{ r: [30, 45, 30], opacity: [0.4, 0, 0.4] }}
                      transition={{ duration: 2.5, repeat: Infinity }}
                    />
                  )}
                  <motion.text
                    x="225" y="55" textAnchor="middle" fill="#f87171"
                    fontSize="7" fontWeight="700" style={{ opacity: hotZoneOpacity }}
                  >ZONE CHAUDE</motion.text>
                  <motion.text
                    x="225" y="68" textAnchor="middle" fill="#fff"
                    fontSize="11" fontWeight="800" style={{ opacity: hotZoneOpacity }}
                  >+35%</motion.text>

                  {/* People dots around hot zone */}
                  {[0, 1, 2, 3, 4].map(i => {
                    const angle = (i / 5) * Math.PI * 2 - Math.PI / 2
                    const cx = 225 + Math.cos(angle) * 38
                    const cy = 60 + Math.sin(angle) * 38
                    return (
                      <motion.circle
                        key={i}
                        cx={cx} cy={cy} r="2.5"
                        fill="#00D4FF"
                        style={{ opacity: hotZoneOpacity }}
                      />
                    )
                  })}

                  {/* Car / driver cursor */}
                  <motion.circle
                    style={{ cx: carX, cy: carY }}
                    r="7"
                    fill="#00D4FF"
                    opacity="0.2"
                  />
                  <motion.circle
                    style={{ cx: carX, cy: carY }}
                    r="5"
                    fill="#00D4FF"
                    stroke="#fff"
                    strokeWidth="1.5"
                  />
                  <motion.text
                    style={{ x: carX, y: useTransform(carY, v => v + 15) }}
                    textAnchor="middle"
                    fill="#00D4FF"
                    fontSize="6"
                    fontWeight="700"
                  >VOUS</motion.text>
                </svg>

                {/* ─── Horizontal sliding step cards ─────── */}
                {/* These cards slide IN from a side, hover over the map, then slide OUT */}

                {/* Card 1: Détection — from left */}
                <motion.div
                  style={{ x: card1X, opacity: card1Opacity }}
                  className="absolute bottom-16 sm:bottom-20 left-3 sm:left-4 right-3 sm:right-4"
                >
                  <div className="bg-[#0c0c16]/90 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 border border-white/10 shadow-xl">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-accent-cyan/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-accent-cyan text-xs sm:text-sm font-bold">1</span>
                      </div>
                      <div>
                        <p className="text-white font-semibold text-[11px] sm:text-sm">Détection</p>
                        <p className="text-white/50 text-[9px] sm:text-xs">Votre zone actuelle est vide — 0 demande à proximité.</p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Card 2: Analyse — from right */}
                <motion.div
                  style={{ x: card2X, opacity: card2Opacity }}
                  className="absolute bottom-16 sm:bottom-20 left-3 sm:left-4 right-3 sm:right-4"
                >
                  <div className="bg-[#0c0c16]/90 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 border border-accent-purple/20 shadow-xl">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-accent-purple/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-accent-purple text-xs sm:text-sm font-bold">2</span>
                      </div>
                      <div>
                        <p className="text-white font-semibold text-[11px] sm:text-sm">Analyse IA</p>
                        <p className="text-white/50 text-[9px] sm:text-xs">Zone chaude détectée à 12 min — <span className="text-green-400 font-semibold">+35%</span> de demande.</p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Card 3: Guidage — from left, final */}
                <motion.div
                  style={{ x: card3X, opacity: card3Opacity }}
                  className="absolute bottom-16 sm:bottom-20 left-3 sm:left-4 right-3 sm:right-4"
                >
                  <div className="bg-gradient-to-r from-[#0c0c16]/90 to-[#0a1218]/90 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 border border-accent-cyan/25 shadow-xl shadow-accent-cyan/5">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-green-400 text-xs sm:text-sm font-bold">✓</span>
                      </div>
                      <div>
                        <p className="text-white font-semibold text-[11px] sm:text-sm">Repositionné</p>
                        <p className="text-white/50 text-[9px] sm:text-xs">Arrivé avant les autres. <span className="text-accent-cyan font-semibold">Course garantie.</span></p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Bottom nav bar — same style as PhoneMockup */}
                <div className="absolute bottom-0 left-0 right-0 h-[42px] sm:h-[52px] bg-[#0a0a10] border-t border-white/[0.05] flex items-center justify-around px-2">
                  {['Accueil', 'Ajnaya', 'Social', 'Stats', 'Profil'].map((label, i) => (
                    <div key={label} className={`flex flex-col items-center gap-0.5 ${i === 0 ? 'text-accent-cyan' : 'text-white/25'}`}>
                      <div className="w-3 h-3 sm:w-4 sm:h-4">
                        {i === 0 && <svg fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>}
                        {i === 1 && <svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z"/></svg>}
                        {i === 2 && <svg fill="currentColor" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>}
                        {i === 3 && <svg fill="currentColor" viewBox="0 0 24 24"><path d="M3 13h2v8H3v-8zm4-6h2v14H7V7zm4-4h2v18h-2V3zm4 8h2v10h-2V11zm4-3h2v13h-2V8z"/></svg>}
                        {i === 4 && <svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>}
                      </div>
                      <span className="text-[6px] sm:text-[7px] font-medium">{label}</span>
                    </div>
                  ))}
                </div>

                {/* Home indicator */}
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-24 sm:w-28 h-[3px] bg-white/15 rounded-full z-20" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          style={{ opacity: useTransform(scrollYProgress, [0, 0.08], [1, 0]) }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5"
        >
          <span className="text-white/40 text-xs">Scrollez</span>
          <motion.div
            animate={skipInfinite ? undefined : { y: [0, 6, 0] }}
            transition={skipInfinite ? undefined : { duration: 1.5, repeat: Infinity }}
            className="w-5 h-8 border-2 border-white/15 rounded-full flex justify-center pt-1.5"
          >
            <div className="w-1 h-2 bg-white/25 rounded-full" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

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

  // ─── Map pan: the entire map translates left as user scrolls ──
  // This creates the effect of moving from zone vide (left) to zone chaude (right)
  // on the visitor's REAL screen — no phone mockup, full immersion
  const mapTranslateX = useTransform(scrollYProgress, [0.08, 0.75], ['0%', '-45%'])

  // ─── Car cursor — only appears AFTER map is fully visible & settled ──
  // Map arrives at 0.08, so car starts moving at 0.18 (well after map is centered)
  const carOpacity = useTransform(scrollYProgress, [0.16, 0.20], [0, 1])
  const carProgress = useTransform(scrollYProgress, [0.20, 0.72], [0, 1])
  const carX = useTransform(carProgress, [0, 0.3, 0.6, 1], [180, 320, 500, 650])
  const carY = useTransform(carProgress, [0, 0.3, 0.6, 1], [320, 280, 200, 130])

  // ─── Zone opacities ─────────────────────────────────────
  const emptyZoneOpacity = useTransform(scrollYProgress, [0.08, 0.15, 0.50], [0, 0.9, 0.15])
  const hotZoneOpacity = useTransform(scrollYProgress, [0.30, 0.50, 0.75], [0.1, 0.6, 1])

  // ─── Route path reveal ──────────────────────────────────
  const routeLength = useTransform(scrollYProgress, [0.10, 0.72], [0, 1])

  // ─── Step cards — horizontal slide ──────────────────────
  const card1X = useTransform(scrollYProgress, [0.10, 0.18, 0.30, 0.38], [-120, 0, 0, 120])
  const card1Opacity = useTransform(scrollYProgress, [0.10, 0.18, 0.30, 0.38], [0, 1, 1, 0])

  const card2X = useTransform(scrollYProgress, [0.34, 0.42, 0.54, 0.62], [120, 0, 0, -120])
  const card2Opacity = useTransform(scrollYProgress, [0.34, 0.42, 0.54, 0.62], [0, 1, 1, 0])

  const card3X = useTransform(scrollYProgress, [0.58, 0.66, 0.80], [-120, 0, 0])
  const card3Opacity = useTransform(scrollYProgress, [0.58, 0.66, 0.85, 0.92], [0, 1, 1, 0])

  return (
    <section ref={containerRef} className={`relative bg-[#060610] ${isMobile ? 'h-[250vh]' : 'h-[350vh]'}`}>
      <div className="sticky top-0 h-screen flex flex-col items-center justify-center overflow-hidden">

        {/* ─── FULLSCREEN MAP — IS the background, no mockup ─── */}
        {/* The map covers the entire screen. The visitor's phone IS the viewport. */}
        <motion.div
          style={{ opacity: sectionOpacity }}
          className="absolute inset-0"
        >
          {/* Map container — wider than viewport, pans horizontally */}
          <motion.div
            style={{ x: mapTranslateX }}
            className="absolute inset-0 w-[180%] sm:w-[170%] md:w-[160%] h-full"
          >
            <svg
              className="w-full h-full"
              viewBox="0 0 900 500"
              preserveAspectRatio="xMidYMid slice"
            >
              {/* Background fill */}
              <rect width="900" height="500" fill="#060610" />

              <defs>
                <linearGradient id="immRouteGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00D4FF" />
                  <stop offset="100%" stopColor="#8C52FF" />
                </linearGradient>
                <linearGradient id="immSeineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0a1a2e" stopOpacity="0.4"/>
                  <stop offset="50%" stopColor="#1a3a6c" stopOpacity="0.35"/>
                  <stop offset="100%" stopColor="#0a1a2e" stopOpacity="0.3"/>
                </linearGradient>
                <radialGradient id="hotGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.15"/>
                  <stop offset="70%" stopColor="#ef4444" stopOpacity="0.05"/>
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0"/>
                </radialGradient>
              </defs>

              {/* ─── Street grid — covers full width ─── */}
              {/* Horizontal streets */}
              <path d="M 0 100 L 900 100" stroke="#12121e" strokeWidth="1.2" />
              <path d="M 0 200 L 900 200" stroke="#14142a" strokeWidth="2" />
              <path d="M 0 300 L 900 300" stroke="#12121e" strokeWidth="1.2" />
              <path d="M 0 400 L 900 400" stroke="#14142a" strokeWidth="2" />

              {/* Vertical streets */}
              <path d="M 100 0 L 100 500" stroke="#12121e" strokeWidth="1.2" />
              <path d="M 225 0 L 225 500" stroke="#14142a" strokeWidth="2" />
              <path d="M 350 0 L 350 500" stroke="#12121e" strokeWidth="1.2" />
              <path d="M 475 0 L 475 500" stroke="#14142a" strokeWidth="2" />
              <path d="M 600 0 L 600 500" stroke="#12121e" strokeWidth="1.2" />
              <path d="M 725 0 L 725 500" stroke="#14142a" strokeWidth="2" />
              <path d="M 850 0 L 850 500" stroke="#12121e" strokeWidth="1.2" />

              {/* Diagonal boulevards */}
              <path d="M 50 450 Q 250 350 450 250 Q 650 150 850 80" stroke="#15152a" strokeWidth="3" fill="none" opacity="0.4" />
              <path d="M 0 350 Q 200 300 400 200 Q 550 130 700 50" stroke="#15152a" strokeWidth="2" fill="none" opacity="0.3" />

              {/* Seine river — curved, wide */}
              <path d="M -20 420 Q 150 370 300 385 Q 450 400 600 360 Q 750 320 920 350" stroke="url(#immSeineGrad)" strokeWidth="22" fill="none" />

              {/* Building blocks — dark rectangles scattered */}
              <rect x="30" y="30" width="55" height="50" fill="#0a0a14" rx="3" opacity="0.8"/>
              <rect x="120" y="15" width="70" height="65" fill="#0c0c18" rx="3" opacity="0.7"/>
              <rect x="250" y="40" width="50" height="45" fill="#0a0a14" rx="3" opacity="0.8"/>
              <rect x="370" y="20" width="65" height="55" fill="#0c0c18" rx="3" opacity="0.7"/>
              <rect x="510" y="30" width="55" height="50" fill="#0a0a14" rx="3" opacity="0.8"/>
              <rect x="640" y="15" width="70" height="60" fill="#0c0c18" rx="3" opacity="0.7"/>
              <rect x="780" y="35" width="55" height="45" fill="#0a0a14" rx="3" opacity="0.8"/>

              <rect x="40" y="130" width="50" height="50" fill="#0c0c18" rx="3" opacity="0.6"/>
              <rect x="160" y="120" width="45" height="55" fill="#0a0a14" rx="3" opacity="0.7"/>
              <rect x="320" y="110" width="60" height="65" fill="#0c0c18" rx="3" opacity="0.6"/>
              <rect x="500" y="105" width="50" height="55" fill="#0a0a14" rx="3" opacity="0.7"/>
              <rect x="660" y="115" width="55" height="50" fill="#0c0c18" rx="3" opacity="0.6"/>
              <rect x="810" y="100" width="60" height="60" fill="#0a0a14" rx="3" opacity="0.7"/>

              <rect x="50" y="230" width="60" height="50" fill="#0a0a14" rx="3" opacity="0.7"/>
              <rect x="190" y="220" width="50" height="55" fill="#0c0c18" rx="3" opacity="0.6"/>
              <rect x="400" y="210" width="55" height="60" fill="#0a0a14" rx="3" opacity="0.7"/>
              <rect x="560" y="225" width="50" height="50" fill="#0c0c18" rx="3" opacity="0.6"/>
              <rect x="700" y="210" width="60" height="55" fill="#0a0a14" rx="3" opacity="0.7"/>

              {/* ─── ZONE VIDE — left area, grey, dashed circle ─── */}
              <motion.g style={{ opacity: emptyZoneOpacity }}>
                <circle cx="180" cy="320" r="55" fill="none" stroke="#555" strokeWidth="1.5" strokeDasharray="6 4" />
                <circle cx="180" cy="320" r="55" fill="#333" fillOpacity="0.08" />
                <text x="180" y="312" textAnchor="middle" fill="#777" fontSize="13" fontWeight="700" fontFamily="system-ui">ZONE VIDE</text>
                <text x="180" y="332" textAnchor="middle" fill="#555" fontSize="10" fontFamily="system-ui">0 demande</text>
              </motion.g>

              {/* ─── ZONE CHAUDE — right area, red glow ─── */}
              <motion.g style={{ opacity: hotZoneOpacity }}>
                {/* Large glow */}
                <circle cx="650" cy="130" r="90" fill="url(#hotGlow)" />
                {/* Main circle */}
                <circle cx="650" cy="130" r="55" fill="rgba(239,68,68,0.08)" stroke="rgba(239,68,68,0.45)" strokeWidth="2" />
                {/* Pulse ring — desktop only */}
                {!skipInfinite && (
                  <motion.circle
                    cx="650" cy="130" r="55"
                    fill="none"
                    stroke="rgba(239,68,68,0.25)"
                    strokeWidth="1"
                    animate={{ r: [55, 80, 55], opacity: [0.3, 0, 0.3] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                  />
                )}
                <text x="650" y="120" textAnchor="middle" fill="#f87171" fontSize="12" fontWeight="700" fontFamily="system-ui">ZONE CHAUDE</text>
                <text x="650" y="148" textAnchor="middle" fill="#fff" fontSize="20" fontWeight="800" fontFamily="system-ui">+35%</text>

                {/* People dots around hot zone */}
                {[0, 1, 2, 3, 4, 5, 6].map(i => {
                  const angle = (i / 7) * Math.PI * 2 - Math.PI / 2
                  const cx = 650 + Math.cos(angle) * 70
                  const cy = 130 + Math.sin(angle) * 70
                  return (
                    <circle key={i} cx={cx} cy={cy} r="3.5" fill="#00D4FF" opacity="0.6" />
                  )
                })}
              </motion.g>

              {/* ─── Route — progressive reveal ─── */}
              <motion.path
                d="M 180 320 Q 300 290 400 240 Q 520 180 650 130"
                fill="none"
                stroke="url(#immRouteGrad)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeDasharray="8 4"
                style={{ pathLength: routeLength }}
              />

              {/* ─── Car / driver cursor — appears only after map is settled ─── */}
              <motion.g style={{ opacity: carOpacity }}>
                <motion.circle
                  style={{ cx: carX, cy: carY }}
                  r="12"
                  fill="#00D4FF"
                  opacity="0.15"
                />
                <motion.circle
                  style={{ cx: carX, cy: carY }}
                  r="8"
                  fill="#00D4FF"
                  stroke="#fff"
                  strokeWidth="2.5"
                />
                <motion.text
                  style={{ x: carX, y: useTransform(carY, v => v + 22) }}
                  textAnchor="middle"
                  fill="#00D4FF"
                  fontSize="10"
                  fontWeight="700"
                  fontFamily="system-ui"
                >VOUS</motion.text>
              </motion.g>
            </svg>
          </motion.div>

          {/* ─── Vignette edges — fade to black at screen borders for clean blend ─── */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#060610] to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#060610] to-transparent" />
            <div className="absolute top-0 bottom-0 left-0 w-16 bg-gradient-to-r from-[#060610] to-transparent" />
            <div className="absolute top-0 bottom-0 right-0 w-16 bg-gradient-to-l from-[#060610] to-transparent" />
          </div>
        </motion.div>

        {/* ─── Title — overlaid on the map ─── */}
        <motion.div
          style={{ opacity: sectionOpacity }}
          className="relative text-center z-20 px-4 mb-auto pt-12 sm:pt-16 md:pt-20"
        >
          <h2 className="font-title text-2xl sm:text-3xl md:text-5xl text-white mb-1 sm:mb-3 drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
            Comment <span className="text-accent-cyan">Ajnaya</span> vous guide
          </h2>
          <p className="text-white/60 text-xs sm:text-sm md:text-lg drop-shadow-[0_1px_8px_rgba(0,0,0,0.8)]">
            De la zone vide vers l&apos;opportunité
          </p>
        </motion.div>

        {/* ─── Horizontal sliding step cards — over the map ─── */}
        <div className="relative z-20 w-full max-w-lg px-4 sm:px-6 mt-auto mb-20 sm:mb-24">
          {/* Card 1: Détection — from left */}
          <motion.div
            style={{ x: card1X, opacity: card1Opacity }}
            className="absolute bottom-0 left-4 right-4"
          >
            <div className="bg-[#0a0a14]/85 backdrop-blur-sm rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-4 border border-white/10 shadow-2xl shadow-black/40">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-accent-cyan/15 flex items-center justify-center flex-shrink-0 border border-accent-cyan/20">
                  <span className="text-accent-cyan text-sm sm:text-base font-bold">1</span>
                </div>
                <div>
                  <p className="text-white font-semibold text-xs sm:text-sm">Détection</p>
                  <p className="text-white/50 text-[10px] sm:text-xs">Votre zone actuelle est vide — 0 demande à proximité.</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Analyse — from right */}
          <motion.div
            style={{ x: card2X, opacity: card2Opacity }}
            className="absolute bottom-0 left-4 right-4"
          >
            <div className="bg-[#0a0a14]/85 backdrop-blur-sm rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-4 border border-accent-purple/20 shadow-2xl shadow-black/40">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-accent-purple/15 flex items-center justify-center flex-shrink-0 border border-accent-purple/20">
                  <span className="text-accent-purple text-sm sm:text-base font-bold">2</span>
                </div>
                <div>
                  <p className="text-white font-semibold text-xs sm:text-sm">Analyse IA</p>
                  <p className="text-white/50 text-[10px] sm:text-xs">Zone chaude détectée à 12 min — <span className="text-green-400 font-semibold">+35%</span> de demande.</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 3: Repositionné — from left, final */}
          <motion.div
            style={{ x: card3X, opacity: card3Opacity }}
            className="absolute bottom-0 left-4 right-4"
          >
            <div className="bg-[#0a0a14]/85 backdrop-blur-sm rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-4 border border-green-500/20 shadow-2xl shadow-green-500/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-500/15 flex items-center justify-center flex-shrink-0 border border-green-500/20">
                  <span className="text-green-400 text-sm sm:text-base font-bold">✓</span>
                </div>
                <div>
                  <p className="text-white font-semibold text-xs sm:text-sm">Repositionné</p>
                  <p className="text-white/50 text-[10px] sm:text-xs">Arrivé avant les autres. <span className="text-accent-cyan font-semibold">Course garantie.</span></p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          style={{ opacity: useTransform(scrollYProgress, [0, 0.08], [1, 0]) }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 z-20"
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

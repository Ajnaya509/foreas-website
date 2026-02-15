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

  // ═══════════════════════════════════════════════════════════
  // SCROLL TIMELINE — perfectly synchronized
  // ═══════════════════════════════════════════════════════════
  // 0.00-0.08  Section fade in
  // 0.08-0.14  Map appears, zone vide appears, map starts panning
  // 0.14-0.18  Car fades in at zone vide
  // 0.15-0.30  ▶ CARD 1 "Détection" — car stationary at zone vide
  // 0.28-0.62  Car moves from zone vide → zone chaude
  // 0.30-0.45  Hot zone starts glowing
  // 0.33-0.55  ▶ CARD 2 "Analyse IA" — car in transit, hot zone glowing
  // 0.60-0.62  Car arrives at hot zone
  // 0.60-0.82  ▶ CARD 3 "Repositionné" — car at destination
  // 0.85-0.95  Section fade out
  // ═══════════════════════════════════════════════════════════

  // ─── Map pan ──────────────────────────────────────────────
  // Mobile: smaller pan (180px) for wider viewBox
  // Desktop: moderate pan (220px) with 130vw SVG width
  const mapPanPx = isMobile ? -180 : -220
  const mapTranslateX = useTransform(scrollYProgress, [0.08, 0.65], [0, mapPanPx])

  // ─── Car cursor — appears at zone vide, stays stationary, then moves ──
  const carOpacity = useTransform(scrollYProgress, [0.14, 0.18], [0, 1])
  // Car starts moving at 0.28 (after Card 1 is shown), arrives at 0.62 (before Card 3)
  const carProgress = useTransform(scrollYProgress, [0.28, 0.62], [0, 1])
  // Car path: zone vide (250,320) → zone chaude (750,160)
  const carX = useTransform(carProgress, [0, 0.25, 0.55, 1], [250, 400, 600, 750])
  const carY = useTransform(carProgress, [0, 0.25, 0.55, 1], [320, 280, 220, 160])

  // ─── Zone opacities ─────────────────────────────────────
  // Zone vide: visible during Card 1, fades as car leaves
  const emptyZoneOpacity = useTransform(scrollYProgress, [0.08, 0.14, 0.35, 0.50], [0, 0.9, 0.5, 0.1])
  // Zone chaude: starts glowing during Card 2, full at Card 3
  const hotZoneOpacity = useTransform(scrollYProgress, [0.30, 0.45, 0.60], [0.05, 0.5, 1])

  // ─── Route path reveal — synced with car movement ────────
  const routeLength = useTransform(scrollYProgress, [0.12, 0.62], [0, 1])

  // ═══════════════════════════════════════════════════════════
  // STEP CARDS — PERFECTLY SYNCED with map events
  // ═══════════════════════════════════════════════════════════

  // CARD 1: "Détection" — appears while car is at zone vide
  // Slides from left on mobile, from left on desktop
  const card1Slide = useTransform(scrollYProgress,
    [0.13, 0.18, 0.28, 0.32],
    isMobile ? [60, 0, 0, -60] : [-120, 0, 0, 120]
  )
  const card1Opacity = useTransform(scrollYProgress, [0.13, 0.18, 0.28, 0.32], [0, 1, 1, 0])

  // CARD 2: "Analyse IA" — appears as hot zone starts glowing, car in transit
  const card2Slide = useTransform(scrollYProgress,
    [0.33, 0.38, 0.52, 0.56],
    isMobile ? [-60, 0, 0, 60] : [120, 0, 0, -120]
  )
  const card2Opacity = useTransform(scrollYProgress, [0.33, 0.38, 0.52, 0.56], [0, 1, 1, 0])

  // CARD 3: "Repositionné" — appears exactly when car reaches hot zone
  const card3Slide = useTransform(scrollYProgress,
    [0.59, 0.64, 0.80],
    isMobile ? [60, 0, 0] : [-120, 0, 0]
  )
  const card3Opacity = useTransform(scrollYProgress, [0.59, 0.64, 0.82, 0.88], [0, 1, 1, 0])

  // Mobile: cards slide vertically from bottom
  const card1Y = useTransform(scrollYProgress, [0.13, 0.18, 0.28, 0.32], isMobile ? [30, 0, 0, -20] : [0, 0, 0, 0])
  const card2Y = useTransform(scrollYProgress, [0.33, 0.38, 0.52, 0.56], isMobile ? [30, 0, 0, -20] : [0, 0, 0, 0])
  const card3Y = useTransform(scrollYProgress, [0.59, 0.64, 0.80], isMobile ? [30, 0, 0] : [0, 0, 0])

  return (
    <section ref={containerRef} className={`relative bg-[#060610] ${isMobile ? 'h-[280vh]' : 'h-[350vh]'}`}>
      <div className="sticky top-0 h-screen flex flex-col items-center justify-center overflow-hidden">

        {/* ─── FULLSCREEN MAP ─── */}
        <motion.div
          style={{ opacity: sectionOpacity }}
          className="absolute inset-0"
        >
          <motion.div
            style={{ x: mapTranslateX }}
            className="absolute top-0 bottom-0 left-0"
          >
            <svg
              className="h-full"
              style={{ width: isMobile ? '170vw' : '130vw' }}
              viewBox="0 0 1000 500"
              preserveAspectRatio="xMidYMid meet"
            >
              <rect width="1000" height="500" fill="#060610" />

              <defs>
                <linearGradient id="immRouteGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00D4FF" />
                  <stop offset="100%" stopColor="#8C52FF" />
                </linearGradient>
                <linearGradient id="immSeineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0a1a2e" stopOpacity="0.5"/>
                  <stop offset="50%" stopColor="#1a3a6c" stopOpacity="0.4"/>
                  <stop offset="100%" stopColor="#0a1a2e" stopOpacity="0.4"/>
                </linearGradient>
                <radialGradient id="hotGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.25"/>
                  <stop offset="60%" stopColor="#ef4444" stopOpacity="0.1"/>
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0"/>
                </radialGradient>
              </defs>

              {/* ─── Street grid ─── */}
              <path d="M 0 100 L 1000 100" stroke="#1a1a2e" strokeWidth="1.5" />
              <path d="M 0 200 L 1000 200" stroke="#1e1e35" strokeWidth="2.5" />
              <path d="M 0 300 L 1000 300" stroke="#1a1a2e" strokeWidth="1.5" />
              <path d="M 0 400 L 1000 400" stroke="#1e1e35" strokeWidth="2.5" />

              <path d="M 90 0 L 90 500" stroke="#1a1a2e" strokeWidth="1.5" />
              <path d="M 200 0 L 200 500" stroke="#1e1e35" strokeWidth="2.5" />
              <path d="M 310 0 L 310 500" stroke="#1a1a2e" strokeWidth="1.5" />
              <path d="M 420 0 L 420 500" stroke="#1e1e35" strokeWidth="2.5" />
              <path d="M 530 0 L 530 500" stroke="#1a1a2e" strokeWidth="1.5" />
              <path d="M 640 0 L 640 500" stroke="#1e1e35" strokeWidth="2.5" />
              <path d="M 750 0 L 750 500" stroke="#1a1a2e" strokeWidth="1.5" />
              <path d="M 860 0 L 860 500" stroke="#1e1e35" strokeWidth="2.5" />
              <path d="M 970 0 L 970 500" stroke="#1a1a2e" strokeWidth="1.5" />

              {/* Diagonal boulevard */}
              <path d="M 40 430 Q 250 340 450 230 Q 650 150 950 70" stroke="#1a1a35" strokeWidth="3.5" fill="none" opacity="0.5" />

              {/* Seine river */}
              <path d="M -10 420 Q 180 370 360 385 Q 500 400 650 355 Q 800 310 1020 340" stroke="url(#immSeineGrad)" strokeWidth="28" fill="none" />

              {/* Building blocks */}
              <rect x="20" y="25" width="50" height="50" fill="#0c0c1a" rx="3"/>
              <rect x="110" y="15" width="60" height="60" fill="#0e0e20" rx="3"/>
              <rect x="220" y="30" width="50" height="45" fill="#0c0c1a" rx="3"/>
              <rect x="340" y="15" width="55" height="55" fill="#0e0e20" rx="3"/>
              <rect x="460" y="25" width="50" height="50" fill="#0c0c1a" rx="3"/>
              <rect x="570" y="10" width="55" height="58" fill="#0e0e20" rx="3"/>
              <rect x="700" y="20" width="50" height="55" fill="#0c0c1a" rx="3"/>
              <rect x="820" y="15" width="60" height="50" fill="#0e0e20" rx="3"/>
              <rect x="920" y="25" width="55" height="48" fill="#0c0c1a" rx="3"/>

              <rect x="30" y="120" width="45" height="55" fill="#0e0e20" rx="3"/>
              <rect x="140" y="115" width="40" height="50" fill="#0c0c1a" rx="3"/>
              <rect x="280" y="108" width="55" height="60" fill="#0e0e20" rx="3"/>
              <rect x="440" y="110" width="48" height="52" fill="#0c0c1a" rx="3"/>
              <rect x="580" y="105" width="50" height="55" fill="#0e0e20" rx="3"/>
              <rect x="710" y="115" width="50" height="50" fill="#0c0c1a" rx="3"/>
              <rect x="830" y="110" width="55" height="60" fill="#0e0e20" rx="3"/>
              <rect x="930" y="118" width="45" height="48" fill="#0c0c1a" rx="3"/>

              <rect x="40" y="225" width="55" height="48" fill="#0c0c1a" rx="3"/>
              <rect x="170" y="218" width="48" height="52" fill="#0e0e20" rx="3"/>
              <rect x="350" y="210" width="50" height="55" fill="#0c0c1a" rx="3"/>
              <rect x="490" y="222" width="45" height="48" fill="#0e0e20" rx="3"/>
              <rect x="620" y="215" width="52" height="50" fill="#0c0c1a" rx="3"/>
              <rect x="730" y="220" width="50" height="50" fill="#0e0e20" rx="3"/>
              <rect x="850" y="210" width="55" height="55" fill="#0c0c1a" rx="3"/>
              <rect x="950" y="225" width="45" height="48" fill="#0e0e20" rx="3"/>

              {/* ─── ZONE VIDE — left side ─── */}
              <motion.g style={{ opacity: emptyZoneOpacity }}>
                <circle cx="250" cy="320" r="60" fill="#333" fillOpacity="0.12" />
                <circle cx="250" cy="320" r="60" fill="none" stroke="#666" strokeWidth="2" strokeDasharray="8 5" />
                <text x="250" y="310" textAnchor="middle" fill="#999" fontSize="16" fontWeight="700" fontFamily="system-ui">ZONE VIDE</text>
                <text x="250" y="336" textAnchor="middle" fill="#666" fontSize="12" fontFamily="system-ui">0 demande</text>
              </motion.g>

              {/* ─── ZONE CHAUDE — repositioned to cx=750 for visibility ─── */}
              <motion.g style={{ opacity: hotZoneOpacity }}>
                <circle cx="750" cy="160" r="100" fill="url(#hotGlow)" />
                <circle cx="750" cy="160" r="60" fill="rgba(239,68,68,0.1)" stroke="rgba(239,68,68,0.5)" strokeWidth="2.5" />
                {!skipInfinite && (
                  <motion.circle
                    cx="750" cy="160" r="60"
                    fill="none"
                    stroke="rgba(239,68,68,0.3)"
                    strokeWidth="1.5"
                    animate={{ r: [60, 90, 60], opacity: [0.3, 0, 0.3] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                  />
                )}
                <text x="750" y="148" textAnchor="middle" fill="#f87171" fontSize="14" fontWeight="700" fontFamily="system-ui">ZONE CHAUDE</text>
                <text x="750" y="180" textAnchor="middle" fill="#fff" fontSize="24" fontWeight="800" fontFamily="system-ui">+35%</text>

                {/* People dots */}
                {[0, 1, 2, 3, 4, 5].map(i => {
                  const angle = (i / 6) * Math.PI * 2 - Math.PI / 2
                  const cx = 750 + Math.cos(angle) * 78
                  const cy = 160 + Math.sin(angle) * 78
                  return <circle key={i} cx={cx} cy={cy} r="4" fill="#00D4FF" opacity="0.7" />
                })}
              </motion.g>

              {/* ─── Route — progressive reveal synced to car ─── */}
              <motion.path
                d="M 250 320 Q 400 280 550 230 Q 650 195 750 160"
                fill="none"
                stroke="url(#immRouteGrad)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="10 5"
                style={{ pathLength: routeLength }}
              />

              {/* ─── Car / driver cursor ─── */}
              <motion.g style={{ opacity: carOpacity }}>
                <motion.circle
                  style={{ cx: carX, cy: carY }}
                  r="14"
                  fill="#00D4FF"
                  opacity="0.2"
                />
                <motion.circle
                  style={{ cx: carX, cy: carY }}
                  r="9"
                  fill="#00D4FF"
                  stroke="#fff"
                  strokeWidth="3"
                />
                <motion.text
                  style={{ x: carX, y: useTransform(carY, v => v + 26) }}
                  textAnchor="middle"
                  fill="#00D4FF"
                  fontSize="12"
                  fontWeight="800"
                  fontFamily="system-ui"
                >VOUS</motion.text>
              </motion.g>
            </svg>
          </motion.div>

          {/* ─── Vignette edges ─── */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-[#060610] to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-[#060610] to-transparent" />
            <div className="absolute top-0 bottom-0 left-0 w-12 bg-gradient-to-r from-[#060610] to-transparent" />
            <div className="absolute top-0 bottom-0 right-0 w-12 bg-gradient-to-l from-[#060610] to-transparent" />
          </div>
        </motion.div>

        {/* ─── Title ─── */}
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

        {/* ═══ STEP CARDS ═══ */}
        {/* Desktop: centered bottom card, slides left/right */}
        {/* Mobile: full-width bottom card, slides up with slight horizontal offset */}
        <div className={`relative z-20 w-full mt-auto ${
          isMobile
            ? 'px-3 mb-16'
            : 'max-w-lg px-6 mb-24'
        }`}>
          {/* CARD 1: Détection */}
          <motion.div
            style={{
              x: card1Slide,
              y: card1Y,
              opacity: card1Opacity
            }}
            className={`absolute bottom-0 ${isMobile ? 'left-3 right-3' : 'left-4 right-4'}`}
          >
            <div className={`backdrop-blur-sm border border-white/10 shadow-2xl shadow-black/40 ${
              isMobile
                ? 'bg-[#0a0a14]/90 rounded-xl px-3.5 py-2.5'
                : 'bg-[#0a0a14]/85 rounded-2xl px-5 py-4'
            }`}>
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className={`rounded-full bg-accent-cyan/15 flex items-center justify-center flex-shrink-0 border border-accent-cyan/20 ${
                  isMobile ? 'w-7 h-7' : 'w-10 h-10'
                }`}>
                  <span className={`text-accent-cyan font-bold ${isMobile ? 'text-xs' : 'text-base'}`}>1</span>
                </div>
                <div className="min-w-0">
                  <p className={`text-white font-semibold ${isMobile ? 'text-[11px]' : 'text-sm'}`}>Détection</p>
                  <p className={`text-white/50 ${isMobile ? 'text-[10px] leading-tight' : 'text-xs'}`}>Votre zone actuelle est vide — 0 demande à proximité.</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* CARD 2: Analyse IA */}
          <motion.div
            style={{
              x: card2Slide,
              y: card2Y,
              opacity: card2Opacity
            }}
            className={`absolute bottom-0 ${isMobile ? 'left-3 right-3' : 'left-4 right-4'}`}
          >
            <div className={`backdrop-blur-sm border border-accent-purple/20 shadow-2xl shadow-black/40 ${
              isMobile
                ? 'bg-[#0a0a14]/90 rounded-xl px-3.5 py-2.5'
                : 'bg-[#0a0a14]/85 rounded-2xl px-5 py-4'
            }`}>
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className={`rounded-full bg-accent-purple/15 flex items-center justify-center flex-shrink-0 border border-accent-purple/20 ${
                  isMobile ? 'w-7 h-7' : 'w-10 h-10'
                }`}>
                  <span className={`text-accent-purple font-bold ${isMobile ? 'text-xs' : 'text-base'}`}>2</span>
                </div>
                <div className="min-w-0">
                  <p className={`text-white font-semibold ${isMobile ? 'text-[11px]' : 'text-sm'}`}>Analyse IA</p>
                  <p className={`text-white/50 ${isMobile ? 'text-[10px] leading-tight' : 'text-xs'}`}>Zone chaude détectée à 12 min — <span className="text-green-400 font-semibold">+35%</span> de demande.</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* CARD 3: Repositionné */}
          <motion.div
            style={{
              x: card3Slide,
              y: card3Y,
              opacity: card3Opacity
            }}
            className={`absolute bottom-0 ${isMobile ? 'left-3 right-3' : 'left-4 right-4'}`}
          >
            <div className={`backdrop-blur-sm border border-green-500/20 shadow-2xl shadow-green-500/5 ${
              isMobile
                ? 'bg-[#0a0a14]/90 rounded-xl px-3.5 py-2.5'
                : 'bg-[#0a0a14]/85 rounded-2xl px-5 py-4'
            }`}>
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className={`rounded-full bg-green-500/15 flex items-center justify-center flex-shrink-0 border border-green-500/20 ${
                  isMobile ? 'w-7 h-7' : 'w-10 h-10'
                }`}>
                  <span className={`text-green-400 font-bold ${isMobile ? 'text-xs' : 'text-base'}`}>✓</span>
                </div>
                <div className="min-w-0">
                  <p className={`text-white font-semibold ${isMobile ? 'text-[11px]' : 'text-sm'}`}>Repositionné</p>
                  <p className={`text-white/50 ${isMobile ? 'text-[10px] leading-tight' : 'text-xs'}`}>Arrivé avant les autres. <span className="text-accent-cyan font-semibold">Course garantie.</span></p>
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

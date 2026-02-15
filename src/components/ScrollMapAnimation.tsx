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

  // ─── Map pan — pixel-based for reliable mobile behavior ──
  // Mobile: pan 350px left (shows zone vide first, zone chaude enters from right)
  // Desktop: pan 500px left (wider screen = more travel needed)
  const mapPanPx = isMobile ? -350 : -500
  const mapTranslateX = useTransform(scrollYProgress, [0.08, 0.75], [0, mapPanPx])

  // ─── Car cursor — appears AFTER map is settled ──────────
  const carOpacity = useTransform(scrollYProgress, [0.16, 0.20], [0, 1])
  const carProgress = useTransform(scrollYProgress, [0.20, 0.72], [0, 1])
  // Car moves from zone vide (left) to zone chaude (right) within the SVG
  const carX = useTransform(carProgress, [0, 0.3, 0.6, 1], [160, 280, 420, 540])
  const carY = useTransform(carProgress, [0, 0.3, 0.6, 1], [300, 260, 190, 120])

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

        {/* ─── FULLSCREEN MAP — the map IS the background ─── */}
        <motion.div
          style={{ opacity: sectionOpacity }}
          className="absolute inset-0"
        >
          {/* Map container — wider than viewport, pans with pixel translateX */}
          <motion.div
            style={{ x: mapTranslateX }}
            className="absolute top-0 bottom-0 left-0"
            /* Fixed pixel width: 200vw on mobile, 180vw on desktop via inline style */
          >
            <svg
              className="h-full"
              style={{ width: isMobile ? '200vw' : '180vw' }}
              viewBox="0 0 750 500"
              preserveAspectRatio="xMinYMid slice"
            >
              {/* Background */}
              <rect width="750" height="500" fill="#060610" />

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
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.2"/>
                  <stop offset="60%" stopColor="#ef4444" stopOpacity="0.08"/>
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0"/>
                </radialGradient>
              </defs>

              {/* ─── Street grid — brighter for visibility ─── */}
              <path d="M 0 100 L 750 100" stroke="#1a1a2e" strokeWidth="1.5" />
              <path d="M 0 200 L 750 200" stroke="#1e1e35" strokeWidth="2.5" />
              <path d="M 0 300 L 750 300" stroke="#1a1a2e" strokeWidth="1.5" />
              <path d="M 0 400 L 750 400" stroke="#1e1e35" strokeWidth="2.5" />

              <path d="M 90 0 L 90 500" stroke="#1a1a2e" strokeWidth="1.5" />
              <path d="M 200 0 L 200 500" stroke="#1e1e35" strokeWidth="2.5" />
              <path d="M 310 0 L 310 500" stroke="#1a1a2e" strokeWidth="1.5" />
              <path d="M 420 0 L 420 500" stroke="#1e1e35" strokeWidth="2.5" />
              <path d="M 530 0 L 530 500" stroke="#1a1a2e" strokeWidth="1.5" />
              <path d="M 640 0 L 640 500" stroke="#1e1e35" strokeWidth="2.5" />

              {/* Diagonal boulevard */}
              <path d="M 40 430 Q 200 340 380 230 Q 540 140 700 70" stroke="#1a1a35" strokeWidth="3.5" fill="none" opacity="0.5" />

              {/* Seine river */}
              <path d="M -10 420 Q 130 370 260 385 Q 400 400 520 355 Q 650 310 770 340" stroke="url(#immSeineGrad)" strokeWidth="28" fill="none" />

              {/* Building blocks — slightly brighter for mobile */}
              <rect x="20" y="25" width="50" height="50" fill="#0c0c1a" rx="3"/>
              <rect x="110" y="15" width="60" height="60" fill="#0e0e20" rx="3"/>
              <rect x="220" y="30" width="50" height="45" fill="#0c0c1a" rx="3"/>
              <rect x="340" y="15" width="55" height="55" fill="#0e0e20" rx="3"/>
              <rect x="460" y="25" width="50" height="50" fill="#0c0c1a" rx="3"/>
              <rect x="570" y="10" width="55" height="58" fill="#0e0e20" rx="3"/>
              <rect x="680" y="28" width="50" height="45" fill="#0c0c1a" rx="3"/>

              <rect x="30" y="120" width="45" height="55" fill="#0e0e20" rx="3"/>
              <rect x="140" y="115" width="40" height="50" fill="#0c0c1a" rx="3"/>
              <rect x="280" y="108" width="55" height="60" fill="#0e0e20" rx="3"/>
              <rect x="440" y="110" width="48" height="52" fill="#0c0c1a" rx="3"/>
              <rect x="580" y="105" width="50" height="55" fill="#0e0e20" rx="3"/>

              <rect x="40" y="225" width="55" height="48" fill="#0c0c1a" rx="3"/>
              <rect x="170" y="218" width="48" height="52" fill="#0e0e20" rx="3"/>
              <rect x="350" y="210" width="50" height="55" fill="#0c0c1a" rx="3"/>
              <rect x="490" y="222" width="45" height="48" fill="#0e0e20" rx="3"/>
              <rect x="620" y="215" width="52" height="50" fill="#0c0c1a" rx="3"/>

              {/* ─── ZONE VIDE — left side, grey dashed circle ─── */}
              <motion.g style={{ opacity: emptyZoneOpacity }}>
                <circle cx="160" cy="300" r="60" fill="#333" fillOpacity="0.12" />
                <circle cx="160" cy="300" r="60" fill="none" stroke="#666" strokeWidth="2" strokeDasharray="8 5" />
                <text x="160" y="290" textAnchor="middle" fill="#999" fontSize="16" fontWeight="700" fontFamily="system-ui">ZONE VIDE</text>
                <text x="160" y="316" textAnchor="middle" fill="#666" fontSize="12" fontFamily="system-ui">0 demande</text>
              </motion.g>

              {/* ─── ZONE CHAUDE — right side, red glow ─── */}
              <motion.g style={{ opacity: hotZoneOpacity }}>
                <circle cx="540" cy="120" r="100" fill="url(#hotGlow)" />
                <circle cx="540" cy="120" r="60" fill="rgba(239,68,68,0.1)" stroke="rgba(239,68,68,0.5)" strokeWidth="2.5" />
                {!skipInfinite && (
                  <motion.circle
                    cx="540" cy="120" r="60"
                    fill="none"
                    stroke="rgba(239,68,68,0.3)"
                    strokeWidth="1.5"
                    animate={{ r: [60, 90, 60], opacity: [0.3, 0, 0.3] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                  />
                )}
                <text x="540" y="108" textAnchor="middle" fill="#f87171" fontSize="14" fontWeight="700" fontFamily="system-ui">ZONE CHAUDE</text>
                <text x="540" y="140" textAnchor="middle" fill="#fff" fontSize="24" fontWeight="800" fontFamily="system-ui">+35%</text>

                {/* People dots */}
                {[0, 1, 2, 3, 4, 5].map(i => {
                  const angle = (i / 6) * Math.PI * 2 - Math.PI / 2
                  const cx = 540 + Math.cos(angle) * 78
                  const cy = 120 + Math.sin(angle) * 78
                  return <circle key={i} cx={cx} cy={cy} r="4" fill="#00D4FF" opacity="0.7" />
                })}
              </motion.g>

              {/* ─── Route — progressive reveal ─── */}
              <motion.path
                d="M 160 300 Q 260 270 350 220 Q 440 170 540 120"
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

        {/* ─── Horizontal sliding step cards ─── */}
        <div className="relative z-20 w-full max-w-lg px-4 sm:px-6 mt-auto mb-20 sm:mb-24">
          <motion.div style={{ x: card1X, opacity: card1Opacity }} className="absolute bottom-0 left-4 right-4">
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

          <motion.div style={{ x: card2X, opacity: card2Opacity }} className="absolute bottom-0 left-4 right-4">
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

          <motion.div style={{ x: card3X, opacity: card3Opacity }} className="absolute bottom-0 left-4 right-4">
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

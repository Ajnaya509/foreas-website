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

  // Transform values based on scroll
  const scale = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.6, 1, 1, 0.8])
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0])

  // Car position along the path - finit directement sur la zone chaude
  const carX = useTransform(scrollYProgress, [0.2, 0.75], [80, 480])
  const carY = useTransform(scrollYProgress, [0.2, 0.75], [280, 80])

  // Zone pulse intensity
  const emptyZoneOpacity = useTransform(scrollYProgress, [0.2, 0.5], [0.8, 0.2])
  const busyZoneOpacity = useTransform(scrollYProgress, [0.4, 0.7], [0.2, 1])

  // Step indicators
  const step1Opacity = useTransform(scrollYProgress, [0.15, 0.25, 0.4], [0, 1, 0])
  const step2Opacity = useTransform(scrollYProgress, [0.35, 0.45, 0.6], [0, 1, 0])
  const step3Opacity = useTransform(scrollYProgress, [0.55, 0.65, 0.8], [0, 1, 1])

  return (
    <section ref={containerRef} className={`relative bg-foreas-deepblack ${isMobile ? 'h-[200vh]' : 'h-[350vh]'}`}>
      {/* Sticky container */}
      <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-foreas-deepblack via-foreas-black to-foreas-deepblack" />

        {/* Title */}
        <motion.div
          style={{ opacity }}
          className="absolute top-20 left-1/2 -translate-x-1/2 text-center z-20"
        >
          <h2 className="font-title text-3xl md:text-5xl text-white mb-4">
            Comment <span className="text-accent-cyan">Ajnaya</span> vous guide
          </h2>
          <p className="text-white/70 text-lg">
            De la zone vide vers l'opportunité
          </p>
        </motion.div>

        {/* Main map container */}
        <motion.div
          style={{ scale, opacity }}
          className="relative w-[90vw] max-w-4xl h-[60vh] max-h-[500px]"
        >
          {/* Map background */}
          <div className="absolute inset-0 bg-[#0a0a12] rounded-3xl border border-white/10 overflow-hidden">
            {/* Grid streets */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice">
              <defs>
                <linearGradient id="roadGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#1a1a2a" />
                  <stop offset="100%" stopColor="#1a1a2a" />
                </linearGradient>
                <linearGradient id="pathGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00D4FF" />
                  <stop offset="100%" stopColor="#8C52FF" />
                </linearGradient>
              </defs>

              {/* Horizontal roads */}
              <path d="M 0 100 L 600 100" stroke="#1a1a25" strokeWidth="3" />
              <path d="M 0 200 L 600 200" stroke="#1a1a25" strokeWidth="3" />
              <path d="M 0 300 L 600 300" stroke="#1a1a25" strokeWidth="3" />

              {/* Vertical roads */}
              <path d="M 100 0 L 100 400" stroke="#1a1a25" strokeWidth="3" />
              <path d="M 300 0 L 300 400" stroke="#1a1a25" strokeWidth="3" />
              <path d="M 500 0 L 500 400" stroke="#1a1a25" strokeWidth="3" />

              {/* Diagonal boulevard */}
              <path d="M 50 350 Q 200 250 350 180 Q 450 130 550 100" stroke="#15152a" strokeWidth="4" fill="none" />

              {/* Animated route path */}
              <motion.path
                d="M 80 280 Q 200 250 350 180 Q 450 130 520 120"
                fill="none"
                stroke="url(#pathGrad)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="8 4"
                initial={{ pathLength: 0 }}
                style={{ pathLength: scrollYProgress }}
              />
            </svg>

            {/* Empty zone (left) */}
            <motion.div
              style={{ opacity: emptyZoneOpacity }}
              className="absolute top-[60%] left-[10%] w-32 h-32 rounded-full bg-gray-500/20 border-2 border-gray-500/30 flex items-center justify-center"
            >
              <div className="text-center">
                <span className="text-gray-400 text-xs font-medium">ZONE VIDE</span>
                <p className="text-gray-500 text-[10px] mt-1">0 demande</p>
              </div>
            </motion.div>

            {/* Busy zone (right) - with people icons */}
            <motion.div
              style={{ opacity: busyZoneOpacity }}
              className="absolute top-[15%] right-[10%]"
            >
              {/* Pulse effect — disabled on mobile */}
              {!skipInfinite && (
                <motion.div
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 w-40 h-40 -translate-x-4 -translate-y-4 rounded-full bg-red-500/30"
                />
              )}

              <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-orange-500/30 to-red-500/30 border-2 border-red-500/50 flex items-center justify-center">
                <div className="text-center">
                  <span className="text-red-400 text-xs font-bold">ZONE CHAUDE</span>
                  <p className="text-white text-lg font-bold">+35%</p>
                </div>
              </div>

              {/* People waiting icons */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="w-3 h-3 rounded-full bg-accent-cyan"
                  />
                ))}
              </div>
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-accent-cyan text-[10px] whitespace-nowrap">
                12 personnes attendent
              </span>
            </motion.div>

            {/* Car icon */}
            <motion.div
              style={{ x: carX, y: carY }}
              className="absolute w-10 h-10"
            >
              <div className="relative">
                {/* Glow */}
                <div className="absolute inset-0 w-10 h-10 bg-accent-cyan rounded-full blur-md opacity-60" />
                {/* Car */}
                <div className="relative w-10 h-10 bg-accent-cyan rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
                  </svg>
                </div>
              </div>
              <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-white text-[10px] font-bold bg-accent-cyan/90 px-2 py-0.5 rounded whitespace-nowrap">
                VOUS
              </span>
            </motion.div>
          </div>

          {/* Step indicators - plus visibles */}
          <motion.div
            style={{ opacity: step1Opacity }}
            className="absolute -left-8 top-1/2 -translate-y-1/2 bg-[#12121a] md:bg-[#12121a]/95 md:backdrop-blur-md rounded-2xl p-5 border border-white/20 max-w-[220px] shadow-xl"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-accent-cyan/30 flex items-center justify-center text-accent-cyan text-sm font-bold">1</div>
              <span className="text-white font-semibold">Détection</span>
            </div>
            <p className="text-white/70 text-sm leading-relaxed">Ajnaya détecte que votre zone actuelle est vide.</p>
          </motion.div>

          <motion.div
            style={{ opacity: step2Opacity }}
            className="absolute left-1/2 -translate-x-1/2 -bottom-8 bg-[#12121a] md:bg-[#12121a]/95 md:backdrop-blur-md rounded-2xl p-5 border border-white/20 max-w-[240px] shadow-xl"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-accent-purple/30 flex items-center justify-center text-accent-purple text-sm font-bold">2</div>
              <span className="text-white font-semibold">Analyse</span>
            </div>
            <p className="text-white/70 text-sm leading-relaxed">L'IA calcule la meilleure zone avec <span className="text-green-400 font-bold">+35%</span> de demande.</p>
          </motion.div>

          <motion.div
            style={{ opacity: step3Opacity }}
            className="absolute -right-8 top-1/4 bg-gradient-to-br from-[#12121a] to-[#0a0a12] md:from-[#12121a]/95 md:to-[#0a0a12]/95 md:backdrop-blur-md rounded-2xl p-5 border border-accent-cyan/30 max-w-[220px] shadow-xl shadow-accent-cyan/10"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-green-500/30 flex items-center justify-center text-green-400 text-sm font-bold">3</div>
              <span className="text-white font-semibold">Guidage</span>
            </div>
            <p className="text-white/70 text-sm leading-relaxed">Vous arrivez avant les autres. <span className="text-accent-cyan font-medium">Course garantie.</span></p>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          style={{ opacity: useTransform(scrollYProgress, [0, 0.1], [1, 0]) }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-white/60 text-sm font-medium">Scrollez pour voir</span>
          <motion.div
            animate={skipInfinite ? undefined : { y: [0, 8, 0] }}
            transition={skipInfinite ? undefined : { duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 border-2 border-white/20 rounded-full flex justify-center pt-2"
          >
            <div className="w-1.5 h-3 bg-white/40 rounded-full" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

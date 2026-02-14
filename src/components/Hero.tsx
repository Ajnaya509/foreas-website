'use client'

import { motion } from 'framer-motion'
import PhoneMockup from './PhoneMockup'

export default function Hero() {
  return (
    <section className="relative min-h-[100dvh] lg:h-screen flex items-center overflow-hidden">
      {/* Background - Cinematic dark gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 120% 60% at 50% -20%, rgba(140, 82, 255, 0.08) 0%, transparent 50%),
            radial-gradient(ellipse 80% 50% at 80% 50%, rgba(0, 212, 255, 0.04) 0%, transparent 40%),
            linear-gradient(180deg, #050508 0%, #08080d 50%, #050508 100%)
          `
        }}
      />

      {/* Floating orbs - Subtle depth */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-accent-purple/[0.03] rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-accent-cyan/[0.02] rounded-full blur-[120px] pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 pt-24 lg:pt-20 pb-12">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left: Typography-first content */}
          <div className="text-center lg:text-left">

            {/* Eyebrow - Subtle credibility signal */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-5 lg:mb-6"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium tracking-wider uppercase text-accent-cyan/80 border border-accent-cyan/20 rounded-full backdrop-blur-sm">
                <span className="w-1.5 h-1.5 bg-accent-green rounded-full animate-pulse" />
                Disponible sur iOS & Android
              </span>
            </motion.div>

            {/* Main headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-title text-4xl md:text-5xl lg:text-6xl font-semibold leading-[1.05] tracking-tight mb-4 lg:mb-5"
            >
              <span className="block text-white">Tournez moins.</span>
              <span className="block bg-gradient-to-r from-accent-cyan to-accent-purple bg-clip-text text-transparent">Gagnez plus.</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="font-body text-base md:text-lg text-white/50 max-w-md mx-auto lg:mx-0 mb-6 lg:mb-8"
            >
              L'IA qui voit la demande avant qu'elle arrive.
            </motion.p>

            {/* Stats pill - Preuve sociale chiffrée */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex items-center gap-4 md:gap-6 justify-center lg:justify-start mb-8 lg:mb-10"
            >
              <div className="flex items-baseline gap-1">
                <span className="font-title text-3xl md:text-4xl font-bold text-white">+35</span>
                <span className="font-title text-xl md:text-2xl font-bold text-accent-cyan">%</span>
              </div>
              <div className="h-8 md:h-10 w-px bg-white/10" />
              <p className="text-xs md:text-sm text-white/60 text-left">
                de CA<br />
                <span className="text-white/60">847 chauffeurs</span>
              </p>
            </motion.div>

            {/* CTA - Engagement progressif */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start"
            >
              <a
                href="#telecharger"
                className="group relative inline-flex items-center justify-center gap-2 px-6 py-3 md:px-8 md:py-4 text-sm md:text-base font-semibold text-white overflow-hidden rounded-xl md:rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                {/* Button gradient background */}
                <div className="absolute inset-0 bg-gradient-to-r from-accent-purple to-accent-purple/80 transition-all duration-300 group-hover:from-accent-purple group-hover:to-accent-cyan/80" />
                <span className="relative">Essayer gratuitement</span>
                <svg className="relative w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>

              <a
                href="#demo"
                className="group inline-flex items-center justify-center gap-2 px-6 py-3 md:px-8 md:py-4 text-sm md:text-base font-medium text-white/70 hover:text-white border border-white/10 hover:border-white/20 rounded-xl md:rounded-2xl transition-all duration-300 backdrop-blur-sm"
              >
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                Voir la démo
              </a>
            </motion.div>
          </div>

          {/* Right: Phone with premium glow */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex justify-center lg:justify-end mt-4 lg:mt-0"
          >
            {/* Glow behind phone */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[400px] h-[400px] md:h-[500px] bg-gradient-to-b from-accent-purple/20 via-accent-cyan/10 to-transparent rounded-full blur-[80px] md:blur-[100px] pointer-events-none" />

            <PhoneMockup />
          </motion.div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#050508] to-transparent pointer-events-none" />
    </section>
  )
}

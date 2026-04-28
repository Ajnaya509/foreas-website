'use client'

import { motion } from 'framer-motion'
import PhoneMockup from './PhoneMockup'
import { useIsMobile } from '@/hooks/useDevicePerf'
import { Button } from '@/components/ui'

/**
 * Hero — Site2026v42
 *
 * Refonte VISUELLE = même langage que l'app FOREAS Driver v110 :
 * - Background navy `#080C18` (même que HomeScreen)
 * - Mesh gradient signature radial cyan/violet/purple
 * - Marker pulse rings (HomeScreen .pr) — élément signature
 * - Gradient text 3 stops cyan → violet → purple
 * - Glass card eyebrow avec backdrop-blur 24px
 * - Stats card avec border glass + glow violet subtil
 */
export default function Hero() {
  const isMobile = useIsMobile()

  return (
    <section className="relative min-h-[100dvh] lg:h-screen flex items-center overflow-hidden bg-foreas-navy">
      {/* Background — Mesh signature app (cyan/violet/purple radial) */}
      <div
        className="absolute inset-0"
        aria-hidden="true"
        style={{
          background: `
            radial-gradient(ellipse 120% 60% at 50% -10%, rgba(0, 201, 255, 0.10) 0%, transparent 50%),
            radial-gradient(ellipse 100% 70% at 80% 50%, rgba(108, 60, 224, 0.12) 0%, transparent 45%),
            radial-gradient(ellipse 80% 50% at 30% 100%, rgba(168, 85, 247, 0.08) 0%, transparent 50%),
            linear-gradient(180deg, #080C18 0%, #0B0F1A 50%, #080C18 100%)
          `
        }}
      />

      {/* Floating orbs — desktop only (GPU heavy) */}
      {!isMobile && (
        <>
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-accent-cyan/[0.04] rounded-full blur-[150px] pointer-events-none" aria-hidden="true" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-accent-purple/[0.05] rounded-full blur-[120px] pointer-events-none" aria-hidden="true" />
          <div className="absolute top-1/2 right-1/3 w-[400px] h-[400px] bg-[#A855F7]/[0.04] rounded-full blur-[100px] pointer-events-none" aria-hidden="true" />
        </>
      )}

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-lg lg:px-xxl pt-xxxl lg:pt-xl pb-xxxl">
        <div className="grid lg:grid-cols-2 gap-xxxl lg:gap-huge items-center">

          {/* Left: Typography-first content */}
          <div className="text-center lg:text-left">

            {/* Eyebrow — glass capsule signature app */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-lg lg:mb-xl"
            >
              <span className="inline-flex items-center gap-sm px-lg py-sm text-eyebrow text-accent-cyan border border-accent-cyan/30 rounded-pill bg-accent-cyan/[0.05] backdrop-blur-glass-light">
                <span className="relative flex h-2 w-2" aria-hidden="true">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-cyan opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-cyan" />
                </span>
                Disponible sur iOS &amp; Android
              </span>
            </motion.div>

            {/* Main headline — gradient signature 3 stops cyan→violet→purple */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="font-title text-display-l md:text-display-xl lg:text-display-xxl font-bold leading-[1.05] tracking-tight mb-md lg:mb-lg"
            >
              <span className="block text-text-primary">Tournez moins.</span>
              <span className="block bg-gradient-foreas-h bg-clip-text text-transparent">Gagnez plus.</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="font-body text-body-lg text-text-tertiary max-w-md mx-auto lg:mx-0 mb-xl lg:mb-xxl"
            >
              Ajnaya voit la demande avant qu&apos;elle arrive.
            </motion.p>

            {/* Stats card — glass multi-couche + marker pulse signature */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="inline-flex items-center gap-lg md:gap-xl px-lg md:px-xl py-md md:py-lg justify-center lg:justify-start mb-xxl lg:mb-xxxl rounded-lg bg-glass-light backdrop-blur-glass-heavy border border-white/8 shadow-glow-violet"
            >
              {/* Marker pulse signature (HomeScreen .pr ring expansion) */}
              <div className="relative w-10 h-10 md:w-12 md:h-12 flex items-center justify-center" aria-hidden="true">
                <span className="marker-ring marker-ring-1" />
                <span className="marker-ring marker-ring-2" />
                <span className="marker-ring marker-ring-3" />
                <span className="marker-dot" />
              </div>
              <div className="flex items-baseline gap-xxs">
                <span className="font-title text-h1 md:text-display-l font-bold text-text-primary">+35</span>
                <span className="font-title text-h2 md:text-h1 font-bold bg-gradient-foreas-h bg-clip-text text-transparent">%</span>
              </div>
              <div className="h-10 md:h-12 w-px bg-white/8" aria-hidden="true" />
              <p className="text-caption md:text-label text-text-secondary text-left">
                de CA visé<br />
                <span className="text-text-tertiary">Pilotage Ajnaya</span>
              </p>
            </motion.div>

            {/* CTA — engagement progressif */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-md justify-center lg:justify-start"
            >
              <Button
                as="link"
                href="/tarifs2"
                variant="primary"
                size="lg"
                iconRight={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                }
              >
                Essayer gratuitement
              </Button>

              <Button
                as="link"
                href="#demo"
                variant="ghost"
                size="lg"
                iconLeft={
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                }
              >
                Voir la démo
              </Button>
            </motion.div>
          </div>

          {/* Right: Phone with premium glow (cyan + violet + purple — app live) */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex justify-center lg:justify-end mt-md lg:mt-0"
          >
            {!isMobile && (
              <>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[400px] h-[400px] md:h-[500px] bg-gradient-to-b from-accent-cyan/30 via-accent-purple/20 to-transparent rounded-full blur-[80px] md:blur-[100px] pointer-events-none" aria-hidden="true" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] md:w-[300px] h-[300px] md:h-[400px] bg-[#A855F7]/15 rounded-full blur-[60px] md:blur-[80px] pointer-events-none" aria-hidden="true" />
              </>
            )}
            <PhoneMockup />
          </motion.div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-foreas-navy to-transparent pointer-events-none" aria-hidden="true" />
    </section>
  )
}

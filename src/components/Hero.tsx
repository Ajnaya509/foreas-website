'use client'

import { motion } from 'framer-motion'
import PhoneMockup from './PhoneMockup'
import { useIsMobile } from '@/hooks/useDevicePerf'
import { Button } from '@/components/ui'

/**
 * Hero — Site2026v41
 *
 * Aligné design system v2 :
 * - Tokens v2 (foreas-obsidian, accent-cyan/purple/gold)
 * - Typo Genos (display) + Montserrat (body) avec niveaux canoniques
 * - Copywriting audité : zéro mot banni, scènes concrètes
 * - Boutons via composant Button (focus rings WCAG AA)
 * - Backgrounds layered avec mesh-foreas signature
 *
 * Public : multi-audience (homepage). Tagline B2C-friendly.
 */
export default function Hero() {
  const isMobile = useIsMobile()

  return (
    <section className="relative min-h-[100dvh] lg:h-screen flex items-center overflow-hidden">
      {/* Background — Cinematic dark gradient */}
      <div
        className="absolute inset-0"
        aria-hidden="true"
        style={{
          background: `
            radial-gradient(ellipse 120% 60% at 50% -20%, rgba(140, 82, 255, 0.10) 0%, transparent 50%),
            radial-gradient(ellipse 80% 50% at 80% 50%, rgba(0, 212, 255, 0.06) 0%, transparent 40%),
            linear-gradient(180deg, #060610 0%, #070A14 50%, #060610 100%)
          `
        }}
      />

      {/* Floating orbs — desktop only (GPU heavy) */}
      {!isMobile && (
        <>
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-accent-purple/[0.04] rounded-full blur-[150px] pointer-events-none" aria-hidden="true" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-accent-cyan/[0.03] rounded-full blur-[120px] pointer-events-none" aria-hidden="true" />
        </>
      )}

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-lg lg:px-xxxl pt-massive lg:pt-xl pb-huge">
        <div className="grid lg:grid-cols-2 gap-huge lg:gap-massive items-center">

          {/* Left: Typography-first content */}
          <div className="text-center lg:text-left">

            {/* Eyebrow — credibility signal */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.48 }}
              className="mb-lg lg:mb-xl"
            >
              <span className="inline-flex items-center gap-sm px-lg py-sm text-eyebrow text-accent-cyan/80 border border-accent-cyan/20 rounded-full md:backdrop-blur-glass">
                <span className="w-1.5 h-1.5 bg-accent-gold rounded-full md:animate-pulse" aria-hidden="true" />
                Disponible sur iOS &amp; Android
              </span>
            </motion.div>

            {/* Main headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-title text-display-l md:text-display-xl lg:text-display-xxl font-semibold leading-[1.05] tracking-tight mb-md lg:mb-lg"
            >
              <span className="block text-text-primary">Tournez moins.</span>
              <span className="block bg-gradient-to-r from-accent-cyan to-accent-purple bg-clip-text text-transparent">Gagnez plus.</span>
            </motion.h1>

            {/* Subheadline — Mot banni "IA" remplacé par Ajnaya (skill §7) */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="font-body text-body-lg text-text-tertiary max-w-md mx-auto lg:mx-0 mb-xl lg:mb-xxl"
            >
              Ajnaya voit la demande avant qu&apos;elle arrive.
            </motion.p>

            {/* Stats pill — preuve sociale chiffrée */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex items-center gap-lg md:gap-xxl justify-center lg:justify-start mb-xxl lg:mb-xxxl"
            >
              <div className="flex items-baseline gap-xxs">
                <span className="font-title text-h1 md:text-display-l font-bold text-text-primary">+35</span>
                <span className="font-title text-h2 md:text-h1 font-bold text-accent-cyan">%</span>
              </div>
              <div className="h-8 md:h-10 w-px bg-white/8" aria-hidden="true" />
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

          {/* Right: Phone with premium glow */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex justify-center lg:justify-end mt-md lg:mt-0"
          >
            {!isMobile && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[400px] h-[400px] md:h-[500px] bg-gradient-to-b from-accent-purple/20 via-accent-cyan/10 to-transparent rounded-full blur-[80px] md:blur-[100px] pointer-events-none" aria-hidden="true" />
            )}
            <PhoneMockup />
          </motion.div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-foreas-obsidian to-transparent pointer-events-none" aria-hidden="true" />
    </section>
  )
}

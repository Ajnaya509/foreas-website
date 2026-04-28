'use client'

import { motion } from 'framer-motion'
import { SectionHeader, EyebrowLabel } from '@/components/ui'

/**
 * CTA — Site2026v44 (Phase 3.2)
 *
 * Aligné design system v43 :
 * - SectionHeader (eyebrow + title gradient + sub) — pattern signature
 * - Touch targets 56pt sur boutons download (Norman + iOS HIG)
 * - Vrais liens stores (App Store + Google Play)
 * - Trust line : "Résiliable en 1 clic · Tes données restent les tiennes"
 * - bg-foreas-obsidian (canonique) — plus de #050508 hardcodé
 */
export default function CTA() {
  return (
    <section
      id="telecharger"
      className="relative py-section md:py-section overflow-hidden bg-foreas-obsidian"
    >
      {/* Mesh gradient signature subtil */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[300px] md:w-[1000px] md:h-[600px] bg-gradient-to-b from-accent-purple/10 via-accent-cyan/5 to-transparent rounded-full blur-[60px] md:blur-[120px] pointer-events-none"
        aria-hidden="true"
      />

      {/* Grid pattern signature (~constellation) */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        aria-hidden="true"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative max-w-4xl mx-auto px-lg lg:px-xxxl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center"
        >
          {/* Badge "Disponible maintenant" — gold (signature premium) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.32 }}
            className="mb-xxl"
          >
            <EyebrowLabel color="gold" withDot>Disponible · Maintenant</EyebrowLabel>
          </motion.div>

          {/* SectionHeader signature — title avec accent gradient */}
          <SectionHeader
            title="Demain, tu tournes différemment."
            titleAccent="différemment."
            sub="Rejoins les premiers chauffeurs."
            align="center"
          />

          {/* Download cards — touch target ≥ 56pt (iOS HIG + Norman) */}
          <div className="flex flex-col sm:flex-row gap-md justify-center mt-huge mb-xxl">
            <motion.a
              href="https://apps.apple.com/app/foreas-driver"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className="group flex items-center gap-md px-xl py-lg bg-white rounded-xl transition-colors duration-fast ease-standard hover:bg-white/95 min-h-[56px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-foreas-obsidian"
              aria-label="Télécharger FOREAS Driver sur l'App Store"
            >
              <svg className="w-10 h-10 text-foreas-obsidian" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              <div className="text-left">
                <p className="text-micro text-foreas-obsidian/50 font-semibold uppercase">Télécharger sur</p>
                <p className="text-body-bold text-foreas-obsidian -mt-xxs">App Store</p>
              </div>
            </motion.a>

            <motion.a
              href="https://play.google.com/store/apps/details?id=com.chandler509.foreasdriver"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className="group flex items-center gap-md px-xl py-lg bg-white rounded-xl transition-colors duration-fast ease-standard hover:bg-white/95 min-h-[56px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-foreas-obsidian"
              aria-label="Télécharger FOREAS Driver sur Google Play"
            >
              <svg className="w-10 h-10 text-foreas-obsidian" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M3 20.5V3.5C3 2.91 3.34 2.39 3.84 2.15L13.69 12L3.84 21.85C3.34 21.6 3 21.09 3 20.5ZM16.81 15.12L6.05 21.34L14.54 12.85L16.81 15.12ZM20.16 10.81C20.5 11.08 20.75 11.5 20.75 12C20.75 12.5 20.53 12.9 20.18 13.18L17.89 14.5L15.39 12L17.89 9.5L20.16 10.81ZM6.05 2.66L16.81 8.88L14.54 11.15L6.05 2.66Z"/>
              </svg>
              <div className="text-left">
                <p className="text-micro text-foreas-obsidian/50 font-semibold uppercase">Disponible sur</p>
                <p className="text-body-bold text-foreas-obsidian -mt-xxs">Google Play</p>
              </div>
            </motion.a>
          </div>

          {/* Trust line */}
          <p className="text-text-tertiary text-label">
            Résiliable en 1 clic <span className="mx-sm text-text-muted" aria-hidden="true">·</span> Tes données restent les tiennes
          </p>
        </motion.div>
      </div>
    </section>
  )
}

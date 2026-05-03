'use client'

import { motion } from 'framer-motion'

/**
 * HomeBigDomino — Section transition crème → noir
 *
 * Spec Chandler validée :
 * - Big Domino Option C (identification stratégique + crédibilité)
 *   "247 chauffeurs FOREAS savent où aller ce soir.
 *    Vous, vous tâtonnez encore ?"
 * - Sub-line crédibilité : "Données réelles · S18 · 51 zones couvertes"
 * - Fond dégradé crème (#F8F4ED) → noir Apple absolu (#000000)
 * - Vidéo Haitham teaser muette en background subtle (loop start_sec=5 end_sec=18)
 *   [Phase 2 — pour l'instant, halo pur]
 *
 * Skill foreas-design-system :
 * - Bg-cream-to-black gradient (200vh transition)
 * - Eyebrow cyanElectric letter-spacing 0.32em
 * - H2 displayXXL letter-spacing -0.045em
 * - Couleur progressive (cream-fg → ivoire #F8FAFC)
 *
 * Skill foreas-copy-atomic :
 * - Cialdini unité (247 chauffeurs FOREAS savent)
 * - Cialdini douleur (Vous, vous tâtonnez encore ?)
 * - Question rhétorique qui pique (provoque réflexion)
 * - Crédibilité chiffrée (51 zones · S18 · maj toutes les heures)
 */
export default function HomeBigDomino() {
  return (
    <section
      className="relative bg-cream-to-black py-32 sm:py-44 px-5 overflow-hidden"
      aria-label="L'argument central — 247 chauffeurs savent où aller"
    >
      {/* Halos transition (cream halos qui se transforment en violet/cyan) */}
      <div
        className="absolute inset-0 pointer-events-none animate-halo-pulse"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 30%, rgba(255, 191, 122, 0.18) 0%, transparent 70%),' +
            'radial-gradient(ellipse 50% 45% at 50% 80%, rgba(140, 82, 255, 0.18) 0%, transparent 70%)',
        }}
      />

      <div className="relative max-w-4xl mx-auto text-center">
        {/* Eyebrow — passe de gris-cream à cyan electric (transition ton) */}
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-[10px] sm:text-[11px] font-extrabold uppercase mb-6 sm:mb-8"
          style={{
            letterSpacing: '0.32em',
            color: 'rgba(140, 82, 255, 0.85)',
          }}
        >
          LE CHIFFRE QUI CHANGE TOUT
        </motion.p>

        {/* H2 — Big Domino */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="font-black leading-[0.98] mb-7 sm:mb-9"
          style={{
            letterSpacing: '-0.04em',
            fontSize: 'clamp(2.25rem, 7.5vw, 5rem)',
          }}
        >
          <span style={{ color: 'rgba(248, 250, 252, 0.96)' }}>
            247 chauffeurs FOREAS savent
          </span>
          <br />
          <span className="bg-gradient-to-r from-violet-300 via-cyan-200 to-violet-300 bg-clip-text text-transparent">
            où aller ce soir.
          </span>
          <br />
          <span
            className="inline-block mt-3 sm:mt-4"
            style={{
              color: 'rgba(248, 250, 252, 0.55)',
              fontStyle: 'italic',
              fontWeight: 700,
            }}
          >
            Vous, vous tâtonnez encore&nbsp;?
          </span>
        </motion.h2>

        {/* Sub-line crédibilité */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 rounded-full backdrop-blur-sm"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <span className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold tabular-nums" style={{ color: 'rgba(248, 250, 252, 0.85)' }}>
            <span className="relative flex w-2 h-2" aria-hidden="true">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
            </span>
            Données réelles
          </span>
          <span className="text-white/30" aria-hidden="true">·</span>
          <span className="text-[11px] sm:text-xs font-semibold tabular-nums" style={{ color: 'rgba(248, 250, 252, 0.85)' }}>
            S{currentWeekISO()}
          </span>
          <span className="text-white/30" aria-hidden="true">·</span>
          <span className="text-[11px] sm:text-xs font-semibold tabular-nums" style={{ color: 'rgba(248, 250, 252, 0.85)' }}>
            51 zones
          </span>
          <span className="text-white/30" aria-hidden="true">·</span>
          <span className="text-[11px] sm:text-xs font-semibold" style={{ color: 'rgba(248, 250, 252, 0.85)' }}>
            maj toutes les heures
          </span>
        </motion.div>
      </div>
    </section>
  )
}

function currentWeekISO(): string {
  const now = new Date()
  const oneJan = new Date(Date.UTC(now.getUTCFullYear(), 0, 1))
  const numberOfDays = Math.floor((now.getTime() - oneJan.getTime()) / 86_400_000)
  const week = Math.ceil((numberOfDays + oneJan.getUTCDay() + 1) / 7)
  return String(week).padStart(2, '0')
}

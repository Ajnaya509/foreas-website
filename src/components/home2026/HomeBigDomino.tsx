'use client'

import { motion } from 'framer-motion'

/**
 * HomeBigDomino — Section transition crème → noir
 *
 * Spec Chandler validée :
 * - Big Domino (identification stratégique + crédibilité)
 *   "Pendant que tu tournes à vide,
 *    l'appli sait déjà où sont les courses."
 * - Sub-line crédibilité : "Ajnaya lit la demande en temps réel sur 51 zones.
 *    Toi, tu conduis. Elle, elle calcule."
 * - Fond dégradé crème (#F8F4ED) → noir Apple absolu (#000000)
 *
 * Skill foreas-design-system :
 * - Bg-cream-to-black gradient (200vh transition)
 * - Eyebrow letter-spacing 0.32em
 * - H2 displayXXL letter-spacing -0.04em
 * - Couleur progressive (cream-fg → ivoire #F8FAFC)
 * - 1 seul héros : gradient sur "sait déjà où sont les courses" uniquement
 *
 * Skill foreas-copy-atomic :
 * - Tutoiement professionnel, sobre
 * - Tension douleur (tourner à vide) → résolution (l'appli sait déjà)
 * - Crédibilité honnête (51 zones, pas de pastille "live" mensongère)
 */
export default function HomeBigDomino() {
  return (
    <section
      className="relative bg-cream-to-black py-32 sm:py-44 px-5 overflow-hidden"
      aria-label="L'argument central — l'appli sait déjà où sont les courses"
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
          className="t-eyebrow mb-6 sm:mb-8"
          style={{
            letterSpacing: '0.32em',
            color: 'rgba(140, 82, 255, 0.85)',
          }}
        >
          LE VRAI SUJET
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
            Pendant que tu tournes à vide, l&rsquo;appli{' '}
          </span>
          <span className="bg-gradient-to-r from-violet-300 via-cyan-200 to-violet-300 bg-clip-text text-transparent">
            sait déjà où sont les courses.
          </span>
        </motion.h2>

        {/* Sub-line crédibilité — sobre, honnête, non datée */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mx-auto max-w-2xl t-bodylg"
          style={{ color: 'rgba(248, 250, 252, 0.7)' }}
        >
          Ajnaya lit la demande en temps réel sur{' '}
          <span className="tabular-nums" style={{ color: 'rgba(248, 250, 252, 0.92)' }}>
            51&nbsp;zones
          </span>
          . Toi, tu conduis. Elle, elle calcule.
        </motion.p>
      </div>
    </section>
  )
}

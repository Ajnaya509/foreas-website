'use client'

import { motion } from 'framer-motion'
import { Layers, Database, CreditCard, LogOut, MessageSquare } from 'lucide-react'

/**
 * HomeProofStrip — bande preuve sociale entre Hero crème et Big Domino
 *
 * Spec :
 * - Fond crème edge (#EAE4D5) — transition douce vers le noir
 * - 6 micro-credentials VRAIS en horizontal : Fait en France · 7 plateformes lues ·
 *   Données réelles · 0€ pour tester · Tu pars quand tu veux · WhatsApp
 * - Mobile : grid 2x3, scroll horizontal possible
 * - Desktop : ligne unique avec séparateurs subtils
 *
 * Skill foreas-copy-atomic : ancrage crédibilité immédiat avant le scroll
 *                            (anti-objection chauffeur méfiant "c'est qui derrière ?")
 *                            Aucun chiffre faux — la bande chuchote des faits vérifiables.
 */
export default function HomeProofStrip() {
  const items = [
    {
      icon: '🇫🇷',
      label: 'Fait en France',
      detail: 'code écrit à Paris',
    },
    {
      icon: Layers,
      label: '7 plateformes lues',
      detail: 'Uber, Bolt, Heetch…',
    },
    {
      icon: Database,
      label: 'Données réelles',
      detail: 'pas une promesse',
    },
    {
      icon: CreditCard,
      label: '0€ pour tester',
      detail: 'carte, mais 0€ débité',
    },
    {
      icon: LogOut,
      label: 'Tu pars quand tu veux',
      detail: 'résiliation 1 clic',
    },
    {
      icon: MessageSquare,
      label: 'WhatsApp',
      detail: 'sans inscription',
    },
  ] as const

  return (
    <section
      className="relative py-8 sm:py-10 px-5 border-y"
      style={{
        backgroundColor: 'transparent',
        borderColor: 'rgba(255, 255, 255, 0.08)',
      }}
      aria-label="Preuves de crédibilité FOREAS"
    >
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-4 gap-y-5 sm:gap-x-6"
        >
          {items.map((item) => {
            const Icon = typeof item.icon === 'string' ? null : item.icon
            return (
              <div
                key={item.label}
                className="flex flex-col items-center text-center"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  {Icon ? (
                    <Icon
                      className="w-4 h-4"
                      style={{ color: 'rgba(76, 47, 137, 0.75)' }}
                    />
                  ) : (
                    <span className="text-base leading-none" aria-hidden="true">
                      {item.icon as string}
                    </span>
                  )}
                  <p
                    className="t-body-bold t-stat"
                    style={{ color: '#F8FAFC' }}
                  >
                    {item.label}
                  </p>
                </div>
                <p
                  className="t-micro t-stat uppercase"
                  style={{
                    letterSpacing: '0.16em',
                    color: 'rgba(248,250,252,0.5)',
                  }}
                >
                  {item.detail}
                </p>
              </div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}

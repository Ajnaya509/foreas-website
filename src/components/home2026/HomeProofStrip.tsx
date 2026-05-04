'use client'

import { motion } from 'framer-motion'
import { Star, Users, MapPin, Video, MessageSquare } from 'lucide-react'

/**
 * HomeProofStrip — bande preuve sociale entre Hero crème et Big Domino
 *
 * Spec :
 * - Fond crème edge (#EAE4D5) — transition douce vers le noir
 * - 5 micro-credentials en horizontal : Made in France · 247 chauffeurs ·
 *   51 zones · 4,9/5 · 6 témoignages vidéo
 * - Mobile : grid 2x3, scroll horizontal possible
 * - Desktop : ligne unique avec séparateurs subtils
 *
 * Skill foreas-copy-atomic : ancrage crédibilité immédiat avant le scroll
 *                            (anti-objection chauffeur méfiant "vous êtes qui ?")
 */
export default function HomeProofStrip() {
  const items = [
    {
      icon: '🇫🇷',
      label: 'Made in France',
      detail: 'Paris · Lyon · Marseille',
    },
    {
      icon: Users,
      label: '247 chauffeurs',
      detail: 'actifs ce mois',
    },
    {
      icon: MapPin,
      label: '51 zones',
      detail: 'temps réel',
    },
    {
      icon: Star,
      label: '4,9/5',
      detail: '247 avis',
    },
    {
      icon: Video,
      label: '6 témoignages',
      detail: 'face caméra',
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
        backgroundColor: 'var(--bg-cream-warm-edge)',
        borderColor: 'rgba(42, 37, 32, 0.10)',
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
          {items.map((item, i) => {
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
                    className="text-sm sm:text-base font-bold tabular-nums"
                    style={{ color: 'var(--text-cream-fg)' }}
                  >
                    {item.label}
                  </p>
                </div>
                <p
                  className="text-[10px] sm:text-[11px] uppercase font-semibold tabular-nums"
                  style={{
                    letterSpacing: '0.16em',
                    color: 'var(--text-cream-fg-muted)',
                  }}
                >
                  {item.detail}
                </p>
                {/* Hide separator on last item */}
                {i < items.length - 1 && (
                  <div className="hidden lg:block absolute"
                    aria-hidden="true"
                  />
                )}
              </div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}

'use client'

import { motion } from 'framer-motion'
import { ArrowRight, MessageCircle } from 'lucide-react'
import { buildWAUrl } from '@/lib/whatsappLink'
import TestimonialCarousel from './TestimonialCarousel'

/**
 * ZoneSocialProof — Section 4 témoignages chauffeurs (vidéos Mux LIVE)
 *
 * Cialdini preuve sociale × Heath Stories × Halbert Specifics.
 * 6 vraies vidéos hébergées Mux (policy=public) avec MuxPlayer React.
 * Click-to-play (lazy load) → pas de bandwidth gaspillée.
 * Caption autorité humaine en bas (consent explicite des chauffeurs).
 *
 * Layout :
 * - Mobile : 1 colonne, scroll vertical
 * - Tablet : 2 colonnes
 * - Desktop : 3 colonnes (les 6 vidéos sur 2 rangées)
 */
export default function ZoneSocialProof() {
  const handleWAClick = () => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('trackCustom', 'WhatsAppLinkClicked', {
        section: 'social_proof',
      })
    }
  }

  const waUrl = buildWAUrl({ section: 'social_proof' })

  return (
    <section className="relative py-16 sm:py-24 px-4 border-b border-white/[0.06]">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <p
            className="text-[#00D4FF]/85 text-[10px] font-extrabold uppercase mb-3"
            style={{ letterSpacing: '0.28em' }}
          >
            6 CHAUFFEURS · LEUR VISAGE · LEUR VOIX
          </p>
          <h2
            className="text-3xl sm:text-4xl font-black text-[#F8FAFC] mb-3"
            style={{ letterSpacing: '-0.035em' }}
          >
            Pas moi qui le dis.{' '}
            <span className="bg-gradient-to-r from-violet-300 to-cyan-300 bg-clip-text text-transparent">
              Eux.
            </span>
          </h2>
          <p className="text-white/55 text-sm">
            Des chauffeurs comme toi. Tu cliques, tu les écoutes. Personne ne lit un script.
          </p>
        </motion.div>

        {/* Carrousel défilement infini auto-play 5s — embla */}
        <div className="mb-10">
          <TestimonialCarousel />
        </div>

        {/* Caption autorité humaine */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center text-white/45 text-xs mb-6 max-w-xl mx-auto"
        >
          Ces 6 chauffeurs ont accepté que leur visage et leur voix apparaissent. Tu peux leur écrire — l&apos;app FOREAS leur ouvre le DM si tu rejoins.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center"
        >
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleWAClick}
            className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-2xl text-sm font-bold transition-all bg-white/[0.06] border border-white/[0.10] hover:bg-white/[0.10] hover:border-white/[0.18] text-[#F8FAFC]"
          >
            <MessageCircle className="w-4 h-4" />
            Demander à Ajnaya 12 autres cas
            <ArrowRight className="w-4 h-4" />
          </a>
        </motion.div>
      </div>
    </section>
  )
}

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}

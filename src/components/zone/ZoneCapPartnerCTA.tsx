'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Handshake } from 'lucide-react'
import Link from 'next/link'

/**
 * ZoneCapPartnerCTA — Section 6 CAP / Partenaires
 *
 * Variant warm (rose subtle 0.07) — distinction nette de la home B2C.
 * Mapping design system §13 : page CAP variant warm.
 * Lien interne vers /devenir-partenaire (pas WhatsApp — c'est un parcours formulaire).
 */
export default function ZoneCapPartnerCTA() {
  return (
    <section className="relative py-12 sm:py-16 px-4 border-b border-white/[0.06]">
      {/* Halo warm rose */}
      <div
        className="absolute inset-0 pointer-events-none animate-halo-pulse"
        style={{
          background:
            'radial-gradient(ellipse 50% 40% at 50% 50%, rgba(255,102,153,0.10) 0%, transparent 70%),' +
            'radial-gradient(ellipse 40% 35% at 30% 70%, rgba(140,82,255,0.10) 0%, transparent 70%)',
        }}
      />

      <div className="relative max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl p-6 sm:p-8 border border-rose-500/20 bg-gradient-to-br from-rose-500/[0.06] to-violet-900/[0.10] backdrop-blur-sm"
        >
          <div className="flex items-start gap-4">
            <div
              className="hidden sm:flex w-12 h-12 rounded-xl bg-rose-500/15 items-center justify-center flex-shrink-0"
              style={{ boxShadow: '0 0 24px rgba(255,102,153,0.18)' }}
            >
              <Handshake className="w-5 h-5 text-rose-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-rose-300/85 text-[10px] font-extrabold uppercase mb-2"
                style={{ letterSpacing: '0.28em' }}
              >
                VOUS PILOTEZ UNE FLOTTE / UN GROUPE&nbsp;?
              </p>
              <h2
                className="text-xl sm:text-2xl font-black text-[#F8FAFC] mb-2 leading-tight"
                style={{ letterSpacing: '-0.025em' }}
              >
                La même intelligence,{' '}
                <span className="bg-gradient-to-r from-rose-300 to-violet-300 bg-clip-text text-transparent">
                  mais en cascade.
                </span>
              </h2>
              <p className="text-white/70 text-sm sm:text-base leading-relaxed mb-5">
                Vous en haut, vos recrues en dessous. Cascade <span className="font-semibold tabular-nums text-[#F8FAFC]">10&nbsp;€ / 4&nbsp;€ / 2&nbsp;€</span>{' '}
                à vie sur 3 niveaux.
              </p>
              <Link
                href="/devenir-partenaire"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all bg-white/[0.06] border border-white/[0.10] hover:bg-white/[0.10] hover:border-rose-500/40 text-[#F8FAFC]"
              >
                Voir le programme CAP
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

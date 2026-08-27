'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Handshake } from 'lucide-react'
import Link from 'next/link'
import { PARRAINAGE } from '@/lib/verite-commerciale'

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
                className="text-rose-300/85 t-eyebrow mb-2"
                style={{ letterSpacing: '0.28em' }}
              >
                VOUS PILOTEZ UNE FLOTTE / UN GROUPE&nbsp;?
              </p>
              {/* CE QUI ÉTAIT FAUX — mesuré le 14/08/2026 :
                  · « Cascade 10 € / 4 € / 2 € à vie sur 3 niveaux » ne correspond à AUCUNE
                    source. ⚠️ 27/08 : `referral_program_tiers` porte les paliers de REMISE au filleul
                    PALIERS DE VOLUME, pas des niveaux de pyramide : présenter la table comme
                    « vous en haut, vos recrues en dessous » en inverse la lecture.
                  · `referral_tree` → 0 ligne et `referral_commissions` → 0 ligne : il n'existe
                    ni arbre de parrainage, ni reversement sur le filleul d'un filleul. La
                    mécanique multi-niveaux est retirée tant qu'elle n'est pas implémentée,
                    chiffrée en base et encadrée par les CGU.
                  · « à vie » n'est adossé à aucune clause : les CGU ne prévoient aucune durée.
                  Trois barèmes incompatibles cohabitaient en production (ici 10/4/2, /cap
                  10 €/filleul, /tarifs2 25/8/2). Les montants viennent maintenant de
                  src/lib/verite-commerciale.ts, seule source autorisée. */}
              <h2
                className="t-h1 text-[#F8FAFC] mb-2 leading-tight"
                style={{ letterSpacing: '-0.025em' }}
              >
                La même intelligence,{' '}
                <span className="bg-gradient-to-r from-rose-300 to-violet-300 bg-clip-text text-transparent">
                  pour toute votre flotte.
                </span>
              </h2>
              <p className="text-white/70 t-body leading-relaxed mb-5">
                Chaque chauffeur que vous amenez vous rapporte{' '}
                <span className="font-semibold tabular-nums text-[#F8FAFC]">
                  {`${PARRAINAGE.mensuelParMoisPayeEur} €/mois ou ${PARRAINAGE.annuelUneFoisEur} € à l’année`}
                </span>{' '}
                selon votre palier de volume.
              </p>
              <Link
                href="/devenir-partenaire"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl t-body-bold transition-all bg-white/[0.06] border border-white/[0.10] hover:bg-white/[0.10] hover:border-rose-500/40 text-[#F8FAFC]"
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

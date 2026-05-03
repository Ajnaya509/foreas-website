'use client'

import { motion } from 'framer-motion'
import { ArrowRight, MessageCircle } from 'lucide-react'
import { buildWAUrl } from '@/lib/whatsappLink'

/**
 * ZoneSocialProof — Section 4 témoignages chauffeurs
 *
 * Cialdini preuve sociale × Heath Stories × Halbert Specifics
 * 3 témoignages avec détails atomiques (jour, heure, vol, gain).
 * Caption autorité humaine en bas (consent explicite des chauffeurs).
 */

const TESTIMONIALS = [
  {
    name: 'Haitham B.',
    city: 'Paris · 4 ans VTC',
    avatar: 'HB',
    gain: 'Lien humain · CDG',
    detail: 'Vendredi 18h, CDG',
    quote:
      "Avant je tournais en rond. Maintenant Ajnaya me dit 'pose-toi à Roissy à 18h25, vol AF1234 atterrit'. Je me retrouve premier sur la file. Et le truc, c'est qu'on est plus seul.",
    stars: 5,
  },
  {
    name: 'Binate M.',
    city: 'Paris · Tesla',
    avatar: 'BM',
    gain: '+35 % CA',
    detail: 'Tesla payée · clientèle privée',
    quote:
      "Avec FOREAS, j'ai développé ma clientèle privée. +35 % de CA en 11 mois. La Tesla est payée. Aujourd'hui je sais ce que je vaux.",
    stars: 5,
  },
  {
    name: 'Théodore R.',
    city: 'Bordeaux · 6 ans VTC',
    avatar: 'TR',
    gain: '−3h/jour à vide',
    detail: '8h au lieu de 11h',
    quote:
      "Le vrai gain n'est pas dans mon compte. Il est dans ma tête. Je conduis 3h de moins, je gagne autant. Mes lombaires me remercient.",
    stars: 5,
  },
] as const

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
      <div className="max-w-5xl mx-auto">
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
            VRAIS CHAUFFEURS · VRAIS VIREMENTS
          </p>
          <h2
            className="text-3xl sm:text-4xl font-black text-[#F8FAFC] mb-3"
            style={{ letterSpacing: '-0.035em' }}
          >
            Pas des promesses.{' '}
            <span className="bg-gradient-to-r from-violet-300 to-cyan-300 bg-clip-text text-transparent">
              Des virements.
            </span>
          </h2>
          <p className="text-white/55 text-sm">3 chauffeurs. 3 villes. 3 trajectoires.</p>
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-4 sm:gap-5 mb-8">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="rounded-2xl p-5 border border-white/[0.06] bg-white/[0.04] backdrop-blur-sm hover:border-violet-500/30 transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                  style={{ boxShadow: '0 4px 12px rgba(140,82,255,0.30)' }}
                >
                  {t.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#F8FAFC] text-sm truncate">{t.name}</p>
                  <p className="text-white/55 text-[11px] truncate">{t.city}</p>
                </div>
                <span className="bg-green-500/15 text-green-400 text-[11px] px-2 py-0.5 rounded-full font-bold tabular-nums whitespace-nowrap">
                  {t.gain}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <span key={j} className="text-yellow-400 text-sm">
                      ★
                    </span>
                  ))}
                </div>
                <span
                  className="text-white/35 text-[10px] uppercase"
                  style={{ letterSpacing: '0.15em' }}
                >
                  · {t.detail}
                </span>
              </div>
              <p className="text-white/75 text-[13px] leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
            </motion.div>
          ))}
        </div>

        {/* Caption autorité humaine */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center text-white/45 text-xs mb-6 max-w-xl mx-auto"
        >
          Ces 3 chauffeurs ont accepté que leur prénom et leur photo apparaissent. Vous pouvez leur écrire — l&apos;app FOREAS leur ouvre le DM si vous rejoignez.
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

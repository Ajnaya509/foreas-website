'use client'

import { motion } from 'framer-motion'
import { Satellite, Brain, MessageSquare, ArrowRight, MessageCircle } from 'lucide-react'
import { buildWAUrl } from '@/lib/whatsappLink'

/**
 * ZoneMechanismVisual — Section 3 mécanisme Ajnaya
 *
 * Schwartz N3-N4 : pas un dashboard de plus, le mécanisme rendu visible.
 * Design system : variant pulse 0.9s (Ajnaya réfléchit en temps réel),
 *                 3 colonnes glass cards CAPTE / ANALYSE / PARLE.
 * Anti-pattern Schwartz : bannit "solution" en faveur du verbe d'action.
 */
export default function ZoneMechanismVisual() {
  const handleWAClick = () => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('trackCustom', 'WhatsAppLinkClicked', {
        section: 'mechanism',
      })
    }
  }

  const waUrl = buildWAUrl({ section: 'mechanism' })

  return (
    <section className="relative py-16 sm:py-24 px-4 border-y border-white/[0.06]">
      {/* Halos pulse animés */}
      <div
        className="absolute inset-0 pointer-events-none animate-halo-pulse-fast"
        style={{
          background:
            'radial-gradient(ellipse 50% 40% at 30% 30%, rgba(140,82,255,0.18) 0%, transparent 70%),' +
            'radial-gradient(ellipse 50% 40% at 70% 60%, rgba(0,212,255,0.14) 0%, transparent 70%)',
        }}
      />

      <div className="relative max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <p
            className="text-[#00D4FF]/85 t-eyebrow mb-3"
            style={{ letterSpacing: '0.28em' }}
          >
            COMMENT ELLE FAIT
          </p>
          <h2
            className="t-display-l text-[#F8FAFC] leading-tight mb-4"
            style={{ letterSpacing: '-0.035em' }}
          >
            Pas un dashboard de plus.<br />
            <span className="bg-gradient-to-r from-violet-300 via-cyan-200 to-violet-300 bg-clip-text text-transparent">
              L&apos;IA qui te dit où aller — avant les autres.
            </span>
          </h2>
        </motion.div>

        {/* Cercles concentriques pulsants — variant pulse 0.9s */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative h-32 sm:h-40 flex items-center justify-center mb-10"
          aria-hidden="true"
        >
          <div className="absolute w-32 h-32 sm:w-40 sm:h-40 rounded-full border border-violet-500/30 animate-halo-pulse-fast" />
          <div className="absolute w-24 h-24 sm:w-28 sm:h-28 rounded-full border border-cyan-400/40 animate-halo-pulse" />
          <div
            className="absolute w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center"
            style={{ boxShadow: '0 0 40px rgba(140,82,255,0.55)' }}
          >
            <span className="text-white font-black text-lg">F</span>
          </div>
        </motion.div>

        {/* 3 colonnes : CAPTE / ANALYSE / PARLE */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 mb-10">
          <MechanismCard
            icon={Satellite}
            label="CAPTE"
            title="7 plateformes, en même temps"
            desc="Uber, Bolt, Heetch, FreeNow + le trafic, les vols, les événements, la météo."
            delay={0}
          />
          <MechanismCard
            icon={Brain}
            label="ANALYSE"
            title="Elle a un coup d'avance"
            desc="Une zone se réveille à 800 m de toi ? Elle le sait avant que ton appli te le dise."
            delay={0.1}
          />
          <MechanismCard
            icon={MessageSquare}
            label="PARLE"
            title="Elle parle, tu conduis"
            desc="Vocal ou texte, comme tu veux. Pendant que tu roules, elle bosse pour toi."
            delay={0.2}
          />
        </div>

        {/* Sub paragraphe ivoire */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-[#F8FAFC]/80 t-bodylg leading-relaxed text-center max-w-2xl mx-auto mb-8"
        >
          Pendant que tu conduis, Ajnaya regarde 7 applis en parallèle. Quand une zone se réveille à 800 m de toi, elle te le dit avant les autres.{' '}
          <span className="text-[#F8FAFC] font-semibold">C&apos;est tout.</span>
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
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl t-body-bold transition-all bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white"
            style={{ boxShadow: '0 0 32px rgba(16,185,129,0.40)' }}
          >
            <MessageCircle className="w-4 h-4" />
            Demander à Ajnaya une démo en 90 sec
            <ArrowRight className="w-4 h-4" />
          </a>
        </motion.div>
      </div>
    </section>
  )
}

function MechanismCard({
  icon: Icon,
  label,
  title,
  desc,
  delay,
}: {
  icon: React.ElementType
  label: string
  title: string
  desc: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="rounded-2xl p-6 sm:p-7 border border-white/[0.06] bg-white/[0.04] backdrop-blur-sm hover:border-violet-500/30 transition-all"
    >
      <div
        className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-400/20 flex items-center justify-center mb-4 ring-1 ring-violet-400/30"
        style={{ boxShadow: '0 0 20px rgba(140,82,255,0.20)' }}
      >
        <Icon className="w-5 h-5 text-violet-200" />
      </div>
      <p
        className="text-[#00D4FF] t-eyebrow mb-2"
        style={{ letterSpacing: '0.28em' }}
      >
        {label}
      </p>
      <h3
        className="t-h3 text-[#F8FAFC] mb-2 leading-tight"
        style={{ letterSpacing: '-0.02em' }}
      >
        {title}
      </h3>
      <p className="text-white/65 t-body leading-relaxed">{desc}</p>
    </motion.div>
  )
}

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}

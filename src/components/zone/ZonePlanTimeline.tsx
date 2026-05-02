'use client'

import { motion } from 'framer-motion'
import { ArrowRight, MessageCircle } from 'lucide-react'
import { buildWAUrl } from '@/lib/whatsappLink'

/**
 * ZonePlanTimeline — Section 5 plan en 3 étapes (Miller StoryBrand SB7)
 *
 * Design system : timeline horizontale avec dots pulse cyan.
 * Copy-atomic : 3 étapes max, chaque étape = timestamp + effort minimal.
 * Risk reversal explicite Hormozi : "Si c'est pareil, tu pars sans rien payer".
 */
export default function ZonePlanTimeline() {
  const handleWAClick = () => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('trackCustom', 'WhatsAppLinkClicked', {
        section: 'plan',
      })
    }
  }

  const waUrl = buildWAUrl({ section: 'plan' })

  return (
    <section className="relative py-16 sm:py-24 px-4">
      {/* Halo cyan subtle */}
      <div
        className="absolute inset-0 pointer-events-none animate-halo-pulse"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 30%, rgba(0,212,255,0.10) 0%, transparent 70%)',
        }}
      />

      <div className="relative max-w-4xl mx-auto">
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
            LE PLAN — 3 ÉTAPES
          </p>
          <h2
            className="text-3xl sm:text-4xl font-black text-[#F8FAFC] leading-tight"
            style={{ letterSpacing: '-0.035em' }}
          >
            Tu cliques. Ajnaya te briefe.<br />
            <span className="bg-gradient-to-r from-violet-300 via-cyan-200 to-violet-300 bg-clip-text text-transparent">
              Vendredi t&apos;as ta réponse.
            </span>
          </h2>
        </motion.div>

        {/* Timeline 3 steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 mb-10">
          <PlanStep
            n={1}
            timestamp="AUJOURD'HUI · 90 SEC"
            title="Tu rejoins via WhatsApp"
            desc="Pas de carte. Pas de formulaire. Tu envoies « go » — c'est tout."
            delay={0}
          />
          <PlanStep
            n={2}
            timestamp="DEMAIN · 1 MESSAGE"
            title="Ajnaya t'envoie tes 3 zones"
            desc="Au réveil. Avec l'ordre optimal pour ta journée."
            delay={0.1}
          />
          <PlanStep
            n={3}
            timestamp="VENDREDI · 1 CHIFFRE"
            title="Tu compares ton net"
            desc="Si c'est mieux, tu restes. Si c'est pareil, tu pars sans rien payer."
            delay={0.2}
            highlight
          />
        </div>

        {/* CTA gros */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center"
        >
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleWAClick}
            className="inline-flex items-center justify-center gap-2 sm:gap-3 px-8 sm:px-12 py-4 rounded-2xl text-base sm:text-lg font-extrabold transition-all bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white"
            style={{ boxShadow: '0 0 80px rgba(16,185,129,0.45), 0 4px 20px rgba(0,0,0,0.4)' }}
          >
            <MessageCircle className="w-5 h-5" />
            Démarrer maintenant — 0 € — 0 inscription
            <ArrowRight className="w-5 h-5" />
          </a>
          <p className="text-white/45 text-xs mt-4 tabular-nums">
            🔒 Stripe SSL · ✓ 0 € aujourd&apos;hui · 🛡️ Annulation 1 clic · ⭐ 4,9/5
          </p>
        </motion.div>
      </div>
    </section>
  )
}

function PlanStep({
  n,
  timestamp,
  title,
  desc,
  delay,
  highlight = false,
}: {
  n: number
  timestamp: string
  title: string
  desc: string
  delay: number
  highlight?: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className={`relative rounded-2xl p-6 sm:p-7 border backdrop-blur-sm transition-all ${
        highlight
          ? 'border-violet-500/30 bg-gradient-to-b from-violet-900/15 to-black'
          : 'border-white/[0.06] bg-white/[0.04]'
      }`}
      style={
        highlight ? { boxShadow: '0 0 40px rgba(140,82,255,0.15)' } : undefined
      }
    >
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center mb-4 font-black text-lg tabular-nums ${
          highlight
            ? 'bg-violet-500/25 text-violet-100 ring-1 ring-violet-400/30'
            : 'bg-white/[0.06] text-white/70'
        }`}
      >
        {n}
      </div>
      <p
        className={`text-[10px] font-extrabold uppercase mb-2 ${
          highlight ? 'text-cyan-300' : 'text-white/55'
        }`}
        style={{ letterSpacing: '0.22em' }}
      >
        {timestamp}
      </p>
      <h3
        className="text-lg sm:text-xl font-bold text-[#F8FAFC] mb-2 leading-tight"
        style={{ letterSpacing: '-0.02em' }}
      >
        {title}
      </h3>
      <p className="text-white/65 text-sm leading-relaxed">{desc}</p>
    </motion.div>
  )
}

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}

'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, MessageCircle, AlertTriangle } from 'lucide-react'
import { buildWAUrl } from '@/lib/whatsappLink'

/**
 * ZonePainCalculator — Section 2 douleur
 *
 * Schwartz problem-aware révélé : "tu donnes combien à Uber, en vrai ?"
 * Calcul live du net après commission/TVA/cotisations/gasoil.
 * Héros = la commission Uber perdue (rouge danger), pas le net.
 *
 * Design system : variant warm (rose subtle 0.07) — douleur reconnue,
 * pas froide. Heath Concrete : tous les chiffres tabular-nums.
 *
 * Source commission : table FOREAS platform_commission_rates — Uber 0,45.
 */
export default function ZonePainCalculator() {
  const [grossFare, setGrossFare] = useState(25)

  // Calcul net (commission Uber 45% + TVA 20% + cotisations URSSAF 11% + gasoil ~6%)
  const UBER_COMMISSION_RATE = 0.45
  const breakdown = useMemo(() => {
    const commission = grossFare * UBER_COMMISSION_RATE
    const afterCommission = grossFare - commission
    const tva = afterCommission * 0.166
    const afterTva = afterCommission - tva
    const cotisations = afterTva * 0.11
    const fuel = grossFare * 0.06
    const net = afterTva - cotisations - fuel

    return {
      commission,
      tva,
      cotisations,
      fuel,
      net: Math.max(0, net),
    }
  }, [grossFare])

  const handleWAClick = () => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('trackCustom', 'WhatsAppLinkClicked', {
        section: 'pain',
        gross_fare: grossFare,
      })
    }
  }

  const waUrl = buildWAUrl({ section: 'pain', amount: grossFare })

  return (
    <section className="relative py-16 sm:py-24 px-4 border-y border-white/[0.06]">
      {/* Halo rose subtle — variant warm douleur */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 50% 40% at 30% 50%, rgba(255,102,153,0.06) 0%, transparent 70%)',
        }}
      />

      <div className="relative max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <p
            className="text-rose-300/85 text-[10px] font-extrabold uppercase mb-3"
            style={{ letterSpacing: '0.28em' }}
          >
            LA RÉALITÉ DU MÉTIER · 2026
          </p>
          <h2
            className="text-3xl sm:text-4xl font-black text-[#F8FAFC] leading-tight"
            style={{ letterSpacing: '-0.035em' }}
          >
            Sur une course de{' '}
            <span className="tabular-nums">{grossFare}&nbsp;€</span>, Uber t'en prend
            jusqu'à{' '}
            <span className="text-[#EF4444] tabular-nums">
              {breakdown.commission.toFixed(2).replace('.', ',')}&nbsp;€
            </span>
            <span className="text-white/65 font-bold">.</span>
          </h2>
        </motion.div>

        {/* Slider + breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-2xl p-6 sm:p-8 border border-white/[0.06] bg-white/[0.04] backdrop-blur-sm mb-6"
        >
          {/* Slider input */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <p
                className="text-white/55 text-[10px] uppercase font-extrabold"
                style={{ letterSpacing: '0.2em' }}
              >
                Course brute
              </p>
              <p
                className="text-2xl sm:text-3xl font-black text-[#F8FAFC] tabular-nums"
                style={{ letterSpacing: '-0.03em' }}
              >
                {grossFare}&nbsp;€
              </p>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              step={1}
              value={grossFare}
              onChange={(e) => setGrossFare(Number(e.target.value))}
              className="w-full h-1.5 rounded-full bg-white/[0.08] appearance-none cursor-pointer accent-rose-400"
              aria-label="Montant de la course"
            />
          </div>

          {/* HÉROS — la commission Uber perdue, rouge danger, dominant */}
          <div
            className="rounded-xl p-5 sm:p-6 mb-5 border border-[#EF4444]/30 bg-[#EF4444]/[0.07]"
          >
            <p
              className="text-[#EF4444]/90 text-[11px] uppercase font-extrabold flex items-center gap-2 mb-1.5"
              style={{ letterSpacing: '0.2em' }}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-[#EF4444]" />
              Ce qu'Uber te prend
            </p>
            <p
              className="text-5xl sm:text-6xl font-black text-[#EF4444] tabular-nums leading-none"
              style={{ letterSpacing: '-0.04em' }}
            >
              −{breakdown.commission.toFixed(2).replace('.', ',')}&nbsp;€
            </p>
            <p className="text-white/45 text-xs mt-2">
              Commission de 45 % sur ta course brute.
            </p>
          </div>

          {/* Breakdown — chaque ligne tabular-nums */}
          <div className="space-y-2.5 mb-5">
            <BreakdownLine label="Commission Uber (45 %)" value={breakdown.commission} negative />
            <BreakdownLine label="TVA (≈ 16,6 % sur net)" value={breakdown.tva} negative />
            <BreakdownLine label="Cotisations URSSAF (≈ 11 %)" value={breakdown.cotisations} negative />
            <BreakdownLine label="Gasoil estimé" value={breakdown.fuel} negative />
          </div>

          <div className="h-px bg-white/[0.08] my-4" />

          {/* Résultat net — secondaire, plus discret que le héros */}
          <div className="flex items-center justify-between">
            <p
              className="text-white/65 text-xs uppercase font-extrabold"
              style={{ letterSpacing: '0.2em' }}
            >
              Ce qu'il te reste dans la poche
            </p>
            <p
              className="text-2xl sm:text-3xl font-black text-white/80 tabular-nums"
              style={{ letterSpacing: '-0.03em' }}
            >
              {breakdown.net.toFixed(2).replace('.', ',')}&nbsp;€
            </p>
          </div>
        </motion.div>

        {/* Bandeau bénéfice Ajnaya */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="rounded-2xl p-6 sm:p-7 border border-violet-500/30 bg-gradient-to-b from-violet-900/15 to-black backdrop-blur-sm"
          style={{ boxShadow: '0 0 40px rgba(140,82,255,0.15)' }}
        >
          <p className="text-[#F8FAFC] text-base sm:text-lg leading-relaxed mb-5">
            Tu bosses bien. Le problème, c'est pas toi — c'est les courses à vide
            qu'on te refile. Ajnaya repère, en temps réel, celles qui te laissent
            le plus en net. <span className="text-[#F8FAFC] font-semibold">Même volant, mieux placé.</span>
          </p>

          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleWAClick}
            className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-bold transition-all bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white"
            style={{ boxShadow: '0 0 28px rgba(16,185,129,0.40)' }}
          >
            <MessageCircle className="w-4 h-4" />
            Voir mes vraies courses rentables
            <ArrowRight className="w-4 h-4" />
          </a>
        </motion.div>
      </div>
    </section>
  )
}

function BreakdownLine({
  label,
  value,
  negative = false,
}: {
  label: string
  value: number
  negative?: boolean
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-white/65">{label}</span>
      <span className={`tabular-nums font-semibold ${negative ? 'text-white/50' : 'text-white/80'}`}>
        {negative ? '−' : ''}
        {value.toFixed(2).replace('.', ',')}&nbsp;€
      </span>
    </div>
  )
}

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}

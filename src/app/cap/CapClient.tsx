'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { CheckCircle2, Zap, Users, TrendingUp, Star, ArrowRight, Gift } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
interface PartnerData {
  partner: {
    company_name: string
    company_type: string
    referral_code: string
    landing_message?: string
    landing_hero_url?: string
  }
  discount: {
    percent: number
    duration_months: number
  } | null
}

interface CapClientProps {
  referralCode: string | null
  partnerData: PartnerData | null
}

// ─── Plans (warm variant — with discount applied) ─────────────────────────────
const PLANS = [
  {
    id: 'essentiel',
    name: 'Essentiel',
    weeklyFull: 12.97,
    annualFull: 539.55,
    description: 'Pour démarrer et tester FOREAS',
    features: ['Dashboard temps réel', 'Zones chaudes IA', 'Tracking multi-plateforme', 'Support email'],
  },
  {
    id: 'pro',
    name: 'Pro',
    weeklyFull: 14.97,
    annualFull: 622.75,
    description: 'Le choix de la majorité des chauffeurs',
    popular: true,
    features: ['Tout Essentiel +', 'Ajnaya IA illimitée', 'Site chauffeur perso', 'Parrainage 10€/filleul', 'Conciergerie clients'],
  },
  {
    id: 'elite',
    name: 'Elite',
    weeklyFull: 34.97,
    annualFull: 1454.75,
    description: 'Acquisition B2B + clone vocal',
    features: ['Tout Pro +', 'Voice Clone Ajnaya', 'Acquisition B2B clients', 'Support prioritaire 24/7', 'Coaching revenue mensuel'],
  },
]

const BENEFITS = [
  { icon: Zap, label: 'IA positionnement temps réel', sub: 'Sais où être 15 min avant la demande' },
  { icon: TrendingUp, label: '+35% CA moyen documenté', sub: 'Sur les 3 premiers mois d\'utilisation' },
  { icon: Users, label: 'Parrainage à vie', sub: '10€/mois par chauffeur filleul actif' },
  { icon: Star, label: 'Essai sans risque', sub: '0€ prélevé avant le prochain lundi 18h' },
]

// ─── Cookie setter (client-only side effect) ──────────────────────────────────
function useCookieSetter(referralCode: string | null) {
  const set = useRef(false)
  useEffect(() => {
    if (!referralCode || set.current) return
    set.current = true
    // 30 days = 2592000 seconds
    document.cookie = `foreas_partner_ref=${encodeURIComponent(referralCode)}; max-age=2592000; path=/; SameSite=Lax`
  }, [referralCode])
}

// ─── Pricing card ─────────────────────────────────────────────────────────────
function PricingCard({
  plan,
  discountPct,
  referralCode,
}: {
  plan: (typeof PLANS)[number]
  discountPct: number
  referralCode: string | null
}) {
  const hasDiscount = discountPct > 0
  const discountedWeekly = hasDiscount ? plan.weeklyFull * (1 - discountPct / 100) : plan.weeklyFull

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={`relative rounded-2xl p-6 flex flex-col ${
        plan.popular
          ? 'border border-violet-500/40 bg-violet-500/[0.06]'
          : 'border border-white/[0.06] bg-white/[0.03]'
      }`}
      style={
        plan.popular
          ? { boxShadow: '0 0 40px rgba(140,82,255,0.12), 0 0 80px rgba(255,102,153,0.06)' }
          : {}
      }
    >
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-gradient-to-r from-violet-500 to-rose-500 text-white text-[11px] font-semibold px-3 py-1 rounded-full">
            Le plus populaire
          </span>
        </div>
      )}

      <div className="mb-4">
        <h3 className="font-title text-xl font-semibold text-white mb-1">{plan.name}</h3>
        <p className="font-body text-sm text-white/40">{plan.description}</p>
      </div>

      {/* Pricing */}
      <div className="mb-5">
        {hasDiscount ? (
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="font-title text-3xl font-bold text-white">
              {discountedWeekly.toFixed(2).replace('.', ',')}€
            </span>
            <span className="font-body text-sm text-white/40">/sem</span>
            <span className="line-through text-white/30 text-sm">{plan.weeklyFull.toFixed(2).replace('.', ',')}€</span>
            <span className="text-rose-400 text-xs font-semibold bg-rose-500/10 px-2 py-0.5 rounded-full">
              -{discountPct}%
            </span>
          </div>
        ) : (
          <div className="flex items-baseline gap-2">
            <span className="font-title text-3xl font-bold text-white">
              {plan.weeklyFull.toFixed(2).replace('.', ',')}€
            </span>
            <span className="font-body text-sm text-white/40">/semaine</span>
          </div>
        )}
      </div>

      {/* Features */}
      <ul className="space-y-2.5 mb-6 flex-1">
        {plan.features.map((f) => (
          <li key={f} className="flex items-center gap-2.5 font-body text-sm text-white/70">
            <CheckCircle2 className="w-4 h-4 text-violet-400 flex-shrink-0" />
            {f}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Link
        href={`/tarifs2${referralCode ? `?ref=${referralCode}` : ''}`}
        className={`block text-center py-3 px-5 rounded-xl font-body font-semibold text-sm transition-all duration-200 ${
          plan.popular
            ? 'bg-gradient-to-r from-violet-600 to-rose-600 text-white hover:from-violet-500 hover:to-rose-500 shadow-lg shadow-violet-900/20'
            : 'border border-white/10 text-white/80 hover:border-white/20 hover:text-white'
        }`}
      >
        {hasDiscount ? `Commencer — ${discountPct}% off` : 'Commencer l\'essai gratuit'}
      </Link>
    </motion.div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function CapClient({ referralCode, partnerData }: CapClientProps) {
  useCookieSetter(referralCode)

  const partner = partnerData?.partner
  const discount = partnerData?.discount
  const discountPct = discount?.percent || 0
  const discountMonths = discount?.duration_months || 0

  const isValidCode = !!partner
  const partnerName = partner?.company_name || 'Un partenaire FOREAS'

  return (
    <main className="min-h-screen bg-black text-white overflow-x-hidden">
      <Header />

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-16 md:pt-36 md:pb-20 px-6 lg:px-8 overflow-hidden">
        {/* Warm background halos — variant warm spec: violet 0.22 + rose 0.14 */}
        <div
          className="absolute inset-0 pointer-events-none animate-halo-pulse"
          aria-hidden
          style={{
            background:
              'radial-gradient(ellipse 70% 60% at 30% 20%, rgba(140,82,255,0.22) 0%, transparent 70%),' +
              'radial-gradient(ellipse 50% 50% at 80% 80%, rgba(255,102,153,0.14) 0%, transparent 70%)',
          }}
        />

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Partner badge */}
          {isValidCode && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2.5 mb-6 px-4 py-2 rounded-full border border-violet-500/30 bg-violet-500/[0.08] font-body text-sm"
            >
              <Gift className="w-4 h-4 text-violet-400" />
              <span className="text-white/70">Invité par</span>
              <span className="text-white font-medium">{partnerName}</span>
            </motion.div>
          )}

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-title text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight mb-5"
          >
            {discount ? (
              <>
                <span className="text-white">L&apos;IA qui multiplie</span>
                <br />
                <span
                  style={{
                    background: 'linear-gradient(135deg, #8C52FF 0%, #FF6699 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  vos courses VTC —{' '}
                  <span className="whitespace-nowrap">-{discountPct}% offerts</span>
                </span>
              </>
            ) : (
              <>
                <span className="text-white">L&apos;IA qui multiplie</span>
                <br />
                <span
                  style={{
                    background: 'linear-gradient(135deg, #8C52FF 0%, #FF6699 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  vos courses VTC
                </span>
              </>
            )}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="font-body text-base md:text-lg text-white/55 max-w-2xl mx-auto mb-8"
          >
            {partner?.landing_message ||
              (discount
                ? `${partnerName} vous offre ${discountPct}% de réduction pendant ${discountMonths} mois. FOREAS analyse la demande en temps réel pour vous dire où vous positionner — 15 minutes à l'avance.`
                : 'FOREAS analyse la demande en temps réel pour vous dire où vous positionner — 15 minutes à l\'avance. Essai gratuit, 0€ débité.')}
          </motion.p>

          {/* Discount banner */}
          {discount && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="inline-flex items-center gap-3 mb-8 px-5 py-3 rounded-2xl border border-rose-500/30 bg-rose-500/[0.06]"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #8C52FF, #FF6699)' }}
              >
                <span className="text-white text-sm font-bold">%</span>
              </div>
              <div className="text-left">
                <p className="font-body text-sm font-semibold text-white">
                  -{discountPct}% les {discountMonths} premiers mois
                </p>
                <p className="font-body text-xs text-white/40">
                  Offre exclusive via {partnerName} · Code : {referralCode}
                </p>
              </div>
            </motion.div>
          )}

          {/* Primary CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="flex flex-col sm:flex-row gap-3 justify-center items-center"
          >
            <Link
              href={`/tarifs2${referralCode ? `?ref=${referralCode}` : ''}`}
              className="group relative inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-body font-semibold text-sm text-white overflow-hidden transition-all duration-200"
              style={{
                background: 'linear-gradient(135deg, #8C52FF 0%, #FF6699 100%)',
                boxShadow: '0 4px 24px rgba(140,82,255,0.35)',
              }}
            >
              <span>S&apos;inscrire — Essai gratuit</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <p className="font-body text-xs text-white/35">
              0€ débité avant lundi 18h · Annulation en 1 clic
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Benefits ──────────────────────────────────────────────────────────── */}
      <section className="py-16 md:py-20 px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {BENEFITS.map((b, i) => (
              <motion.div
                key={b.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="p-4 md:p-5 rounded-2xl border border-white/[0.06] bg-white/[0.03] text-center"
              >
                <div
                  className="w-9 h-9 rounded-xl mx-auto mb-3 flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, rgba(140,82,255,0.2), rgba(255,102,153,0.15))' }}
                >
                  <b.icon className="w-4.5 h-4.5 text-violet-400" />
                </div>
                <p className="font-body text-sm font-semibold text-white/90 mb-1">{b.label}</p>
                <p className="font-body text-xs text-white/40 leading-relaxed">{b.sub}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────────────────── */}
      <section className="py-16 md:py-20 px-6 lg:px-8 relative">
        <div
          className="absolute inset-0 pointer-events-none animate-halo-pulse"
          aria-hidden
          style={{
            background:
              'radial-gradient(ellipse 60% 50% at 70% 50%, rgba(255,102,153,0.14) 0%, transparent 70%)',
          }}
        />
        <div className="max-w-5xl mx-auto relative">
          {/* Section header */}
          <div className="text-center mb-12">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="font-body text-xs font-semibold uppercase tracking-widest text-violet-400 mb-3"
            >
              Tarifs
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="font-title text-3xl md:text-4xl font-bold text-white mb-3"
            >
              {discount
                ? `Votre offre exclusive — -${discountPct}% pendant ${discountMonths} mois`
                : 'Choisissez votre plan'}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="font-body text-sm text-white/45"
            >
              Hebdomadaire · Annuel disponible (−20%) · 0€ débité avant le premier lundi 18h
            </motion.p>
          </div>

          {/* Plans grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PLANS.map((plan) => (
              <PricingCard
                key={plan.id}
                plan={plan}
                discountPct={discountPct}
                referralCode={referralCode}
              />
            ))}
          </div>

          {/* Fine print */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center font-body text-xs text-white/25 mt-6"
          >
            Réduction appliquée automatiquement via votre code partenaire. Annulation sans frais à tout moment.
          </motion.p>
        </div>
      </section>

      {/* ── Social proof ──────────────────────────────────────────────────────── */}
      <section className="py-16 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: 'Karim B.', city: 'Paris 11e', quote: '+38% de CA en 2 mois', detail: 'Zone aéroport + événements pro' },
              { name: 'Soufiane M.', city: 'Lyon', quote: '+412€/mois', detail: 'Positionnement gare + nightlife' },
              { name: 'Théodore R.', city: 'Bordeaux', quote: '-28% de km à vide', detail: 'Optimisation retours à vide' },
            ].map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02]"
              >
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-3.5 h-3.5 fill-violet-400 text-violet-400" />
                  ))}
                </div>
                <p className="font-title text-xl font-bold text-white mb-1">{t.quote}</p>
                <p className="font-body text-xs text-white/40 mb-3">{t.detail}</p>
                <p className="font-body text-sm font-medium text-white/70">
                  {t.name} · <span className="text-white/35">{t.city}</span>
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────────── */}
      <section className="py-16 md:py-20 px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 md:p-10 rounded-3xl border border-violet-500/25 bg-violet-500/[0.04]"
            style={{ boxShadow: '0 0 60px rgba(140,82,255,0.10), 0 0 120px rgba(255,102,153,0.06)' }}
          >
            <h2 className="font-title text-3xl md:text-4xl font-bold text-white mb-3">
              Prêt à rouler plus intelligemment ?
            </h2>
            <p className="font-body text-sm text-white/50 mb-7">
              {discount
                ? `Profitez de votre -${discountPct}% pendant ${discountMonths} mois via ${partnerName}.`
                : 'Essai gratuit. 0€ débité. Annulation en 1 clic.'}
            </p>
            <Link
              href={`/tarifs2${referralCode ? `?ref=${referralCode}` : ''}`}
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl font-body font-semibold text-sm text-white transition-all duration-200"
              style={{
                background: 'linear-gradient(135deg, #8C52FF 0%, #FF6699 100%)',
                boxShadow: '0 4px 28px rgba(140,82,255,0.40)',
              }}
            >
              Commencer mon essai gratuit
              <ArrowRight className="w-4 h-4" />
            </Link>
            {discount && (
              <p className="font-body text-xs text-white/25 mt-4">
                Code : {referralCode} · Réduction appliquée automatiquement
              </p>
            )}
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  )
}

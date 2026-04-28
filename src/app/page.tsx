'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import dynamic from 'next/dynamic'
import Header from '@/components/Header'
import GradientLine from '@/components/GradientLine'
import Footer from '@/components/Footer'
import TiltCard from '@/components/TiltCard'
import { useIsMobile, useReducedMotion } from '@/hooks/useDevicePerf'
import { Clock, ShieldQuestion, TrendingDown, Brain, BarChart3, Palette, Wallet } from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════════════════
// FOREAS HOME GÉNÉRALE — BIG DOMINO B2B / AUTORITÉ
// Audience : hôtels, Airbnb hosts, conciergeries, entreprises qui cherchent
// un partenaire transport premium pour leurs clients.
// Objectif : quand un prospect Private Hunter google "FOREAS", il tombe ici
// et voit une opération crédible, technologique, d'envergure.
// ═══════════════════════════════════════════════════════════════════════════════

const Testimonials = dynamic(() => import('@/components/Testimonials'))
const DashboardMockup = dynamic(() => import('@/components/DashboardMockup'))

// ─── Animated Counter ────────────────────────────────────────────────────────
function AnimatedStat({ value, label, suffix = '' }: { value: string; label: string; suffix?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="text-center"
    >
      <div className="font-title text-3xl md:text-5xl font-bold text-white mb-1">
        {value}<span className="text-accent-cyan">{suffix}</span>
      </div>
      <div className="font-body text-xs md:text-sm text-white/40">{label}</div>
    </motion.div>
  )
}

// ─── Partner Logo Placeholder ────────────────────────────────────────────────
function PartnerCategory({ icon, name, desc }: { icon: string; name: string; desc: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="p-[1px] rounded-2xl bg-gradient-to-r from-white/[0.05] to-white/[0.05] hover:from-accent-purple/30 hover:to-accent-cyan/30 transition-all duration-500"
    >
      <div className="p-6 md:p-8 rounded-[15px] bg-[#08080d] h-full group">
        <div className="text-3xl mb-4">{icon}</div>
        <h3 className="font-title text-lg md:text-xl font-semibold text-white mb-2">{name}</h3>
        <p className="font-body text-sm text-white/45 leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  )
}

// ─── Value Prop Block (glassmorphism card for horizontal scroll) ─────────────
function ValueProp({ number, title, desc, accent = 'accent-cyan', icon: Icon }: {
  number: string; title: string; desc: string; accent?: string; icon?: React.ElementType
}) {
  return (
    <div className="group flex-shrink-0 w-[300px] md:w-[400px] p-5 md:p-7 rounded-2xl border border-white/[0.08] bg-[#0a0a12]/95 md:bg-white/[0.03] md:backdrop-blur-sm hover:border-accent-cyan/20 transition-all snap-start">
      <div className="mb-4">
        {Icon ? (
          <div className={`w-10 h-10 rounded-full bg-${accent}/10 flex items-center justify-center`}>
            <Icon className={`w-5 h-5 text-${accent}`} />
          </div>
        ) : (
          <div className={`w-3 h-3 rounded-full bg-${accent}`} />
        )}
      </div>
      <span className="font-mono text-xs text-white/30 uppercase tracking-widest">{number}</span>
      <h3 className="font-title text-xl md:text-2xl font-semibold text-white mt-2 mb-3">{title}</h3>
      <p className="font-body text-sm md:text-base text-white/50 leading-relaxed">{desc}</p>
    </div>
  )
}

// ─── Horizontal Sticky Scroll for Solution Section ───────────────────────────
function HorizontalValueProps() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()
  const cardWidth = 400
  const gap = 24
  const cardCount = 4
  const totalWidth = cardCount * cardWidth + (cardCount - 1) * gap

  // Desktop-only: useScroll + useTransform (max 2 useScroll on desktop: hero + this)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  const x = useTransform(
    scrollYProgress,
    [0, 1],
    [0, -(totalWidth - 800)]
  )

  const sectionHeading = (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="text-center mb-10 md:mb-14"
    >
      <span className="inline-block text-xs font-mono uppercase tracking-widest text-accent-cyan/50 mb-4">
        La solution
      </span>
      <h2 className="font-title text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-white mb-5">
        Un réseau intelligent
        <span className="block bg-gradient-to-r from-accent-cyan to-accent-purple bg-clip-text text-transparent">
          au service de votre marque.
        </span>
      </h2>
    </motion.div>
  )

  const cards = (
    <>
      <ValueProp
        number="01"
        icon={Brain}
        title="Chauffeurs repositionnés en temps réel par l'IA"
        desc="Ajnaya, notre IA, anticipe la demande et positionne les chauffeurs AVANT que vos clients appellent. Temps d'attente moyen visé : moins de 4 minutes. Pas de promesse vide — de la data en temps réel."
      />
      <ValueProp
        number="02"
        icon={BarChart3}
        title="Qualité traçable, chauffeur par chauffeur"
        desc="Chaque course est scorée. Ponctualité, propreté, avis client. Vous accédez à un dashboard partenaire avec vos métriques en temps réel. Plus jamais un trajet anonyme."
        accent="accent-purple"
      />
      <ValueProp
        number="03"
        icon={Palette}
        title="Votre marque, jusqu'au dernier kilomètre"
        desc="Co-branding optionnel dans l'app. Votre client voit votre nom, pas le nôtre. Message de bienvenue personnalisé, itinéraire pré-configuré, suivi partagé."
      />
      <ValueProp
        number="04"
        icon={Wallet}
        title="Un flux de revenus passif sur chaque course"
        desc="Commission partenaire sur chaque trajet généré via votre établissement. Le transport passe d'un centre de coût à une ligne de revenu."
        accent="accent-purple"
      />
    </>
  )

  // ── Mobile: native CSS horizontal scroll (zero useScroll) ──
  if (isMobile) {
    return (
      <div className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          {sectionHeading}
          <div
            className="flex gap-6 overflow-x-auto pb-4 -mx-6 px-6 snap-x snap-mandatory"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {cards}
          </div>
        </div>
      </div>
    )
  }

  // ── Desktop: sticky horizontal scroll with useScroll + useTransform ──
  return (
    <div ref={containerRef} className="relative" style={{ height: '250vh' }}>
      <div className="sticky top-0 h-screen flex items-center overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 lg:px-8 w-full">
          {sectionHeading}
          <motion.div style={{ x, willChange: 'transform' }} className="flex gap-6">
            {cards}
          </motion.div>
        </div>
      </div>
    </div>
  )
}


// ═══════════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function HomePage() {
  const heroRef = useRef<HTMLElement>(null)
  const isMobile = useIsMobile()
  const reducedMotion = useReducedMotion()

  // Desktop-only: useScroll for hero parallax (max 2 useScroll on desktop: hero + horizontal)
  const { scrollYProgress: heroScrollProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })

  // Parallax layers — desktop only
  const glowY = useTransform(heroScrollProgress, [0, 1], [0, 50])
  const titleY = useTransform(heroScrollProgress, [0, 1], [0, 100])
  const mockupY = useTransform(heroScrollProgress, [0, 1], [0, 150])

  return (
    <main className="min-h-screen bg-[#050508]">
      <Header />

      {/* ═══════════════════════════════════════════════════════════════
          1. HERO — Autorité immédiate + Parallax (desktop) / Static fade-in (mobile)
          Big Domino B2B : "Il existe un système d'intelligence mobilité
          qui peut transformer chaque déplacement de vos clients
          en expérience premium."
          ═══════════════════════════════════════════════════════════════ */}

      {isMobile ? (
        /* ── MOBILE HERO: static, simple whileInView fade-in, zero useScroll ── */
        <section data-section="hero" className="relative pt-28 pb-24 overflow-hidden">
          {/* Background glows — static on mobile */}
          <div className="pointer-events-none">
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-accent-purple/6 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-accent-cyan/4 rounded-full blur-[80px]" />
          </div>

          <div className="relative max-w-6xl mx-auto px-6">
            <div className="text-center">
              {/* Eyebrow */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="mb-6"
              >
                <span className="inline-flex items-center gap-3 px-5 py-2.5 text-xs font-medium tracking-wider uppercase border border-white/10 rounded-full text-white/50">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-green opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-green" />
                  </span>
                  Intelligence Mobilité · Paris
                </span>
              </motion.div>

              {/* Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                className="font-title text-4xl font-semibold leading-[1.05] tracking-tight mb-6"
              >
                <span className="text-white">Offrez à vos clients</span>
                <br />
                <span className="bg-gradient-to-r from-[#8C52FF] via-[#00D4FF] to-[#8C52FF] bg-clip-text text-transparent bg-[length:200%_100%] animate-gradient">
                  le transport qu&apos;ils méritent.
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="font-body text-base text-white/50 max-w-2xl mx-auto mb-10"
              >
                FOREAS connecte hôtels, conciergeries et entreprises à un réseau de chauffeurs VTC
                pilotés par l&apos;IA — ponctualité, qualité, traçabilité. Zéro friction.
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
              >
                <a
                  href="/contact"
                  className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white overflow-hidden rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-accent-purple to-accent-cyan transition-all duration-300" />
                  <span className="relative">Devenir partenaire</span>
                  <svg className="relative w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
                <a
                  href="/chauffeurs"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-medium text-white/70 hover:text-white border border-white/10 hover:border-white/20 rounded-2xl transition-all"
                >
                  Je suis chauffeur
                </a>
              </motion.div>

              {/* DashboardMockup — mobile: below CTAs */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="flex justify-center mb-10"
              >
                <div className="max-w-[300px] mx-auto">
                  <DashboardMockup />
                </div>
              </motion.div>

              {/* Authority signals */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-white/25 text-xs"
              >
                <span>Paris & Île-de-France</span>
                <span className="w-px h-3 bg-white/10" />
                <span>IA temps réel</span>
                <span className="w-px h-3 bg-white/10" />
                <span>Chauffeurs certifiés</span>
                <span className="w-px h-3 bg-white/10" />
                <span>API disponible</span>
              </motion.div>
            </div>
          </div>
        </section>
      ) : (
        /* ── DESKTOP HERO: parallax with useScroll + useTransform + will-change ── */
        <section ref={heroRef} data-section="hero" className="relative pt-40 pb-32 overflow-hidden">
          {/* Background glows — parallax layer 1 */}
          <motion.div
            style={reducedMotion ? {} : { y: glowY, willChange: 'transform' }}
            className="pointer-events-none"
          >
            <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-accent-purple/6 rounded-full blur-[200px]" />
            <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-accent-cyan/4 rounded-full blur-[160px]" />
          </motion.div>

          <div className="relative max-w-6xl mx-auto px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              {/* Left col — text — parallax layer 2 */}
              <motion.div
                style={reducedMotion ? {} : { y: titleY, willChange: 'transform' }}
                className="text-center lg:text-left"
              >
                {/* Eyebrow */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="mb-8"
                >
                  <span className="inline-flex items-center gap-3 px-5 py-2.5 text-xs font-medium tracking-wider uppercase border border-white/10 rounded-full text-white/50">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-green opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-green" />
                    </span>
                    Intelligence Mobilité · Paris
                  </span>
                </motion.div>

                {/* Headline */}
                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                  className="font-title text-6xl lg:text-7xl font-semibold leading-[1.05] tracking-tight mb-6"
                >
                  <span className="text-white">Offrez à vos clients</span>
                  <br />
                  <span className="bg-gradient-to-r from-[#8C52FF] via-[#00D4FF] to-[#8C52FF] bg-clip-text text-transparent bg-[length:200%_100%] animate-gradient">
                    le transport qu&apos;ils méritent.
                  </span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.35 }}
                  className="font-body text-lg lg:text-xl text-white/50 mb-10"
                >
                  FOREAS connecte hôtels, conciergeries et entreprises à un réseau de chauffeurs VTC
                  pilotés par l&apos;IA — ponctualité, qualité, traçabilité. Zéro friction.
                </motion.p>

                {/* CTAs */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12"
                >
                  <a
                    href="/contact"
                    className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white overflow-hidden rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-accent-purple to-accent-cyan transition-all duration-300" />
                    <span className="relative">Devenir partenaire</span>
                    <svg className="relative w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </a>
                  <a
                    href="/chauffeurs"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-medium text-white/70 hover:text-white border border-white/10 hover:border-white/20 rounded-2xl transition-all"
                  >
                    Je suis chauffeur
                  </a>
                </motion.div>

                {/* Authority signals */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 text-white/25 text-xs"
                >
                  <span>Paris & Île-de-France</span>
                  <span className="w-px h-3 bg-white/10" />
                  <span>IA temps réel</span>
                  <span className="w-px h-3 bg-white/10" />
                  <span>Chauffeurs certifiés</span>
                  <span className="w-px h-3 bg-white/10" />
                  <span>API disponible</span>
                </motion.div>
              </motion.div>

              {/* Right col — DashboardMockup — parallax layer 3 (desktop only) */}
              <motion.div
                style={reducedMotion ? {} : { y: mockupY, willChange: 'transform' }}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="hidden lg:flex justify-center lg:justify-end"
              >
                <DashboardMockup />
              </motion.div>
            </div>
          </div>
        </section>
      )}


      {/* ═══════════════════════════════════════════════════════════════
          2. PROBLÈME B2B — La douleur du partenaire
          "Vos clients méritent mieux que ce qu'ils ont aujourd'hui."
          ═══════════════════════════════════════════════════════════════ */}
      <section data-section="problem" className="relative py-20 md:py-28 bg-[#08080d]">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-14 md:mb-20"
          >
            <span className="inline-block text-xs font-mono uppercase tracking-widest text-accent-purple/50 mb-4">
              Le problème
            </span>
            <h2 className="font-title text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-white mb-5">
              Le transport de vos clients
              <span className="block bg-gradient-to-r from-red-400 to-red-500/70 bg-clip-text text-transparent">
                est votre angle mort.
              </span>
            </h2>
            <p className="font-body text-base md:text-lg text-white/45 max-w-2xl mx-auto">
              Vous investissez dans l&apos;accueil, le design, l&apos;expérience. Mais le premier et le dernier contact de votre client
              avec votre ville — le trajet — échappe totalement à votre contrôle.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0 }}
              className="p-6 rounded-2xl border border-red-500/10 bg-[#0a0a12]/95 md:bg-transparent md:backdrop-blur-sm bg-red-500/[0.03] animate-red-pulse-border transition-transform duration-150 hover:[transform:rotate(0.5deg)]"
            >
              <Clock className="w-8 h-8 text-red-400/40 mb-3" />
              <div className="text-red-400/60 text-xs font-mono uppercase tracking-widest mb-3">Expérience dégradée</div>
              <h3 className="font-title text-lg font-semibold text-white mb-2">Votre client attend 15 min sous la pluie.</h3>
              <p className="text-sm text-white/45">Il vient de quitter votre hôtel 5 étoiles. Son VTC est en retard. Sa première note Google mentionne le transport.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="p-6 rounded-2xl border border-red-500/10 bg-[#0a0a12]/95 md:bg-transparent md:backdrop-blur-sm bg-red-500/[0.03] animate-red-pulse-border transition-transform duration-150 hover:[transform:rotate(-0.5deg)]"
            >
              <ShieldQuestion className="w-8 h-8 text-red-400/40 mb-3" />
              <div className="text-red-400/60 text-xs font-mono uppercase tracking-widest mb-3">Zéro contrôle</div>
              <h3 className="font-title text-lg font-semibold text-white mb-2">Vous ne savez pas qui conduit vos clients.</h3>
              <p className="text-sm text-white/45">Pas de suivi, pas de qualité garantie, pas de data. Le chauffeur est un inconnu. Votre marque en dépend pourtant.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="p-6 rounded-2xl border border-red-500/10 bg-[#0a0a12]/95 md:bg-transparent md:backdrop-blur-sm bg-red-500/[0.03] animate-red-pulse-border transition-transform duration-150 hover:[transform:rotate(0.5deg)]"
            >
              <TrendingDown className="w-8 h-8 text-red-400/40 mb-3" />
              <div className="text-red-400/60 text-xs font-mono uppercase tracking-widest mb-3">Revenu manqué</div>
              <h3 className="font-title text-lg font-semibold text-white mb-2">Le transport génère 0€ pour vous.</h3>
              <p className="text-sm text-white/45">Vos clients prennent des VTC chaque jour. Mais c&apos;est Uber qui encaisse, pas vous. Aucune commission, aucun partenariat.</p>
            </motion.div>
          </div>
        </div>
      </section>

      <GradientLine className="py-4" />


      {/* ═══════════════════════════════════════════════════════════════
          3. SOLUTION — Ce que FOREAS change (Horizontal Sticky Scroll)
          Le miroir positif : chaque douleur a sa réponse
          ═══════════════════════════════════════════════════════════════ */}
      <section data-section="solution" className="relative">
        <HorizontalValueProps />
      </section>

      <GradientLine className="py-4" />


      {/* ═══════════════════════════════════════════════════════════════
          4. QUI SONT NOS PARTENAIRES — Catégories cibles
          Hôtels, Airbnb, conciergeries, entreprises
          ═══════════════════════════════════════════════════════════════ */}
      <section data-section="partners" className="relative py-20 md:py-28 bg-[#08080d]">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14 md:mb-20"
          >
            <span className="inline-block text-xs font-mono uppercase tracking-widest text-accent-cyan/50 mb-4">
              Partenaires idéaux
            </span>
            <h2 className="font-title text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-white">
              Conçu pour ceux qui
              <span className="block bg-gradient-to-r from-accent-purple to-accent-cyan bg-clip-text text-transparent">
                ne transigent pas sur l&apos;expérience.
              </span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <TiltCard>
              <PartnerCategory
                icon="🏨"
                name="Hôtels & Résidences"
                desc="Du palace au boutique-hôtel. Offrez un service navette IA à vos clients : arrivée aéroport, transferts, sorties. Votre conciergerie devient digitale."
              />
            </TiltCard>
            <TiltCard>
              <PartnerCategory
                icon="🏠"
                name="Airbnb & Locations courte durée"
                desc="Vos voyageurs ne connaissent pas Paris. Intégrez un lien FOREAS dans votre livret d'accueil. Transport premium, zéro effort de votre côté."
              />
            </TiltCard>
            <TiltCard>
              <PartnerCategory
                icon="🎩"
                name="Conciergeries & Services premium"
                desc="Vos clients veulent du sur-mesure. FOREAS fournit le transport avec la même exigence : ponctualité, discrétion, traçabilité complète."
              />
            </TiltCard>
            <TiltCard>
              <PartnerCategory
                icon="🏢"
                name="Entreprises & Événementiel"
                desc="Séminaires, salons, déplacements corporate. API d'intégration, facturation centralisée, reporting complet. Le transport devient un service managé."
              />
            </TiltCard>
          </div>
        </div>
      </section>

      <GradientLine className="py-4" />


      {/* ═══════════════════════════════════════════════════════════════
          5. TECHNOLOGIE — L'avantage FOREAS
          Montrer la profondeur tech pour crédibiliser
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative py-20 md:py-28">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14 md:mb-20"
          >
            <span className="inline-block text-xs font-mono uppercase tracking-widest text-accent-purple/50 mb-4">
              Sous le capot
            </span>
            <h2 className="font-title text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-white mb-5">
              Pas un simple service VTC.
              <span className="block bg-gradient-to-r from-accent-cyan to-accent-purple bg-clip-text text-transparent">
                Un système d&apos;intelligence.
              </span>
            </h2>
            <p className="font-body text-base md:text-lg text-white/45 max-w-2xl mx-auto">
              FOREAS fusionne données temps réel, analyse prédictive et optimisation IA
              pour créer le réseau de transport le plus réactif du marché.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-6 rounded-2xl border border-accent-cyan/10 bg-accent-cyan/[0.03]"
            >
              <div className="w-12 h-12 mb-4 rounded-xl bg-accent-cyan/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-accent-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                </svg>
              </div>
              <h3 className="font-title text-lg font-semibold text-white mb-2">IA Prédictive</h3>
              <p className="text-sm text-white/45">Trains, vols, événements, météo — Ajnaya anticipe la demande 15 à 30 minutes avant qu&apos;elle se matérialise.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="p-6 rounded-2xl border border-accent-purple/10 bg-accent-purple/[0.03]"
            >
              <div className="w-12 h-12 mb-4 rounded-xl bg-accent-purple/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-accent-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              </div>
              <h3 className="font-title text-lg font-semibold text-white mb-2">Dashboard Partenaire</h3>
              <p className="text-sm text-white/45">Métriques en temps réel : courses générées, satisfaction, revenus. Vous pilotez le transport comme vous pilotez votre RevPAR.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="p-6 rounded-2xl border border-accent-green/10 bg-accent-green/[0.03]"
            >
              <div className="w-12 h-12 mb-4 rounded-xl bg-accent-green/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                </svg>
              </div>
              <h3 className="font-title text-lg font-semibold text-white mb-2">API & Intégrations</h3>
              <p className="text-sm text-white/45">Intégrez FOREAS dans votre app, votre site ou votre PMS. Endpoints REST, webhooks, documentation complète.</p>
            </motion.div>
          </div>
        </div>
      </section>

      <GradientLine className="py-4" />


      {/* ═══════════════════════════════════════════════════════════════
          6. SOCIAL PROOF — Témoignages chauffeurs
          Même si B2B, montrer que les chauffeurs sont vrais et contents
          = preuve que le réseau fonctionne
          ═══════════════════════════════════════════════════════════════ */}
      <Testimonials />

      <GradientLine className="py-4" />


      {/* ═══════════════════════════════════════════════════════════════
          7. CTA FINAL — Devenir partenaire
          Pas de Stripe ici. Contact / démo.
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative py-32 lg:py-40 overflow-hidden">
        <div className="absolute inset-0 bg-[#050508]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[300px] md:w-[1000px] md:h-[600px] bg-gradient-to-b from-accent-purple/10 via-accent-cyan/5 to-transparent rounded-full blur-[60px] md:blur-[120px] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-center"
          >
            <h2 className="font-title text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-white mb-6">
              Le transport de vos clients,
              <span className="block bg-gradient-to-r from-accent-purple to-accent-cyan bg-clip-text text-transparent">
                réinventé.
              </span>
            </h2>

            <p className="font-body text-lg text-white/55 max-w-xl mx-auto mb-10">
              Rejoignez les établissements qui transforment le déplacement
              en expérience premium — et en source de revenus.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <a
                href="/contact"
                className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-accent-purple to-accent-cyan" />
                <span className="relative">Demander une démo</span>
                <svg className="relative w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
              <a
                href="/chauffeurs"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-medium text-white/70 hover:text-white border border-white/10 hover:border-white/20 rounded-2xl transition-all duration-300"
              >
                Espace chauffeur
              </a>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-white/35 text-sm">
              <span>Paris & Île-de-France</span>
              <span>Partenariat sur mesure</span>
              <span>Intégration en 48h</span>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  )
}

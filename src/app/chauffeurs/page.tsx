'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import Header from '@/components/Header'
import GradientLine from '@/components/GradientLine'
import Footer from '@/components/Footer'
import { Smartphone, Fuel, Brain, BarChart3, CloudRain, Target } from 'lucide-react'
import { useIsMobile, useReducedMotion } from '@/hooks/useDevicePerf'

// ═══════════════════════════════════════════════════════════════════════════════
// FOREAS /chauffeurs — BIG DOMINO CHAUFFEUR
// Structure : Frustration ↔ Désir → Ajnaya = solution
// Deep scroll : primaire → secondaire → tertiaire → preuve → close
// Mobile-first, 99% du trafic chauffeur est mobile
// ═══════════════════════════════════════════════════════════════════════════════

// Lazy-load heavy visual components
const ScrollMapAnimation = dynamic(() => import('@/components/ScrollMapAnimation'))
const AjnayaChatScroll = dynamic(() => import('@/components/AjnayaChatScroll'))
const AppDemo = dynamic(() => import('@/components/AppDemo'))
const RevenueSimulator = dynamic(() => import('@/components/RevenueSimulator'))
const Testimonials = dynamic(() => import('@/components/Testimonials'))
const PhoneMockup = dynamic(() => import('@/components/PhoneMockup'))
const FloatingParticles = dynamic(() => import('@/components/FloatingParticles'))
const AnimatedBar = dynamic(() => import('@/components/AnimatedBar'))
const CircularGauge = dynamic(() => import('@/components/CircularGauge'))
const PulsingRing = dynamic(() => import('@/components/PulsingRing'))
const AjnayaNotification = dynamic(() => import('@/components/AjnayaNotification'))

// ─── Shared animation presets ────────────────────────────────────────────────
const fadeInView = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-100px' as const },
  transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
} as const

// ─── Dynamic Trial (mirrors /api/checkout) ───────────────────────────────────
function getNextMonday18hParis(): Date {
  const now = new Date()
  const dayOfWeek = now.getUTCDay()
  const daysMap: Record<number, number> = { 0: 1, 1: 7, 2: 6, 3: 5, 4: 4, 5: 3, 6: 2 }
  let daysToAdd = daysMap[dayOfWeek]
  if (daysToAdd < 2) daysToAdd += 7
  const monday = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000)
  const year = monday.getUTCFullYear()
  const marchLast = new Date(Date.UTC(year, 2, 31))
  const lastSundayMarch = 31 - (marchLast.getUTCDay() % 7)
  const dstStart = new Date(Date.UTC(year, 2, lastSundayMarch, 1, 0, 0))
  const octLast = new Date(Date.UTC(year, 9, 31))
  const lastSundayOct = 31 - (octLast.getUTCDay() % 7)
  const dstEnd = new Date(Date.UTC(year, 9, lastSundayOct, 1, 0, 0))
  const isSummer = monday.getTime() >= dstStart.getTime() && monday.getTime() < dstEnd.getTime()
  monday.setUTCHours(isSummer ? 16 : 17, 0, 0, 0)
  return monday
}

function useTrialInfo() {
  const [info, setInfo] = useState({ days: 0, dateLabel: '', ready: false })
  useEffect(() => {
    const monday = getNextMonday18hParis()
    const days = Math.max(1, Math.round((monday.getTime() - Date.now()) / 86400000))
    const dateLabel = monday.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
    setInfo({ days, dateLabel, ready: true })
  }, [])
  return info
}

// ─── Sticky Mobile CTA ───────────────────────────────────────────────────────
function StickyMobileCTA() {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > window.innerHeight * 0.6)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
        >
          <div className="bg-foreas-deepblack/95 backdrop-blur-lg border-t border-accent-cyan/20">
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-white text-xs font-semibold">Essai gratuit · 0€ débité</p>
                <p className="text-white/40 text-[10px]">Résiliable en 1 clic</p>
              </div>
              <a href="/tarifs2" className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent-purple to-accent-cyan text-white text-sm font-semibold hover:opacity-90 transition-opacity">
                Commencer →
              </a>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Dualité Card (frustration vs désir) — whileInView reveal ────────────────
// OPTIMIZATION B: Replaced useScroll/useTransform clip-path with simple whileInView
function DualityBlock({
  frustration,
  desir,
  delay = 0,
}: {
  frustration: { title: string; desc: string }
  desir: { title: string; desc: string }
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"
    >
      {/* Frustration */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.8, delay: delay + 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="relative p-6 md:p-8 rounded-2xl border border-red-500/10 bg-red-500/[0.03] overflow-hidden group"
      >
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-red-500/60 to-transparent" />
        <div className="text-red-400/60 text-xs font-mono uppercase tracking-widest mb-3">Frustration</div>
        <h3 className="font-title text-xl md:text-2xl font-semibold text-white mb-2">{frustration.title}</h3>
        <p className="font-body text-sm md:text-base text-white/50 leading-relaxed">{frustration.desc}</p>
      </motion.div>

      {/* Désir */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.8, delay: delay + 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="relative p-6 md:p-8 rounded-2xl border border-accent-cyan/10 bg-accent-cyan/[0.03] overflow-hidden group"
      >
        <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-accent-cyan/60 to-transparent" />
        <div className="text-accent-cyan/60 text-xs font-mono uppercase tracking-widest mb-3">Désir</div>
        <h3 className="font-title text-xl md:text-2xl font-semibold text-white mb-2">{desir.title}</h3>
        <p className="font-body text-sm md:text-base text-white/50 leading-relaxed">{desir.desc}</p>
      </motion.div>
    </motion.div>
  )
}

// ─── Section Title ───────────────────────────────────────────────────────────
function SectionTitle({ eyebrow, title, gradient, subtitle }: {
  eyebrow?: string
  title: string
  gradient?: string
  subtitle?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="text-center mb-12 md:mb-16"
    >
      {eyebrow && (
        <span className="inline-block text-xs font-mono uppercase tracking-widest text-accent-cyan/50 mb-4">
          {eyebrow}
        </span>
      )}
      <h2 className="font-title text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-white mb-4">
        {title}
        {gradient && (
          <span className="block bg-gradient-to-r from-accent-purple to-accent-cyan bg-clip-text text-transparent">
            {gradient}
          </span>
        )}
      </h2>
      {subtitle && (
        <p className="font-body text-base md:text-lg text-white/45 max-w-xl mx-auto">{subtitle}</p>
      )}
    </motion.div>
  )
}

// ─── Micro-detail Card (for horizontal scroll) ─────────────────────────────
function MicroDetail({ icon: Icon, title, desc, stat, delay = 0 }: {
  icon: React.ElementType
  title: string
  desc: string
  stat?: string
  delay?: number
}) {
  return (
    <div className="group flex-shrink-0 w-[280px] md:w-[360px] p-5 md:p-6 rounded-2xl border border-white/[0.05] bg-[#0a0a12]/95 md:bg-white/[0.03] md:backdrop-blur-sm hover:border-accent-cyan/20 transition-all">
      <div className="w-10 h-10 rounded-xl bg-accent-cyan/10 flex items-center justify-center mb-3 transition-shadow group-hover:shadow-[0_0_20px_rgba(0,212,255,0.2)]">
        <Icon className="w-5 h-5 text-accent-cyan" />
      </div>
      {stat && <div className="font-mono text-lg font-bold text-accent-cyan mb-1">{stat}</div>}
      <h4 className="font-title text-base md:text-lg font-semibold text-white mb-1.5">{title}</h4>
      <p className="font-body text-sm text-white/45 leading-relaxed">{desc}</p>
    </div>
  )
}

// ─── Micro-details cards data ────────────────────────────────────────────────
const microDetailsCards = [
  {
    icon: Smartphone,
    title: '3 apps ouvertes en permanence',
    desc: 'Uber, Bolt, Heetch — tu switches toute la journée. Aucune ne te dit où aller ENTRE les courses.',
    stat: '3 apps',
  },
  {
    icon: Fuel,
    title: '15-20% de ton carburant = du vide',
    desc: 'Tu roules sans passager. Pas parce que t\'es mauvais, mais parce que personne ne te montre les zones chaudes en avance.',
    stat: '15-20%',
  },
  {
    icon: Brain,
    title: 'La fatigue décisionnelle',
    desc: 'Où aller ? Quelle app ? Attendre ou bouger ? 200 micro-décisions par jour qui épuisent ton cerveau avant ton corps.',
    stat: '200+/jour',
  },
  {
    icon: BarChart3,
    title: 'Zéro visibilité sur tes vrais chiffres',
    desc: 'Tu sais combien tu gagnes. Mais ton €/km réel ? Ton taux de vide ? Tes meilleurs créneaux ? Aucune app ne te le dit.',
    stat: '0 data',
  },
  {
    icon: CloudRain,
    title: 'La météo change, pas ta stratégie',
    desc: 'Quand il pleut, la demande explose à certains endroits. Tu le sais d\'instinct, mais tu n\'as pas les données pour en profiter.',
  },
  {
    icon: Target,
    title: 'Tu subis la course au lieu de la choisir',
    desc: 'Tu prends ce qui vient. Mais les chauffeurs qui gagnent +35% ne prennent pas ce qui vient — ils se positionnent.',
    stat: '+35%',
  },
] as const

// ─── Horizontal Scroll Section — OPTIMIZATION C: Desktop sticky, Mobile native scroll ──
function HorizontalMicroDetails() {
  const isMobile = useIsMobile()

  // Mobile: native CSS horizontal scroll (no useScroll, no sticky)
  if (isMobile) {
    return (
      <div className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <SectionTitle
            eyebrow="Les problèmes qu'on n'avoue pas"
            title="Tout ce qui te coûte"
            gradient="sans que tu le voies."
          />
          <div
            className="flex gap-4 overflow-x-auto pb-4"
            style={{
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {microDetailsCards.map((card, i) => (
              <div key={i} className="scroll-snap-align-start flex-shrink-0 w-[280px]">
                <MicroDetail
                  icon={card.icon}
                  title={card.title}
                  desc={card.desc}
                  stat={'stat' in card ? (card as { stat: string }).stat : undefined}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Desktop: sticky horizontal scroll with useScroll (1 of max 2 useScroll on page)
  return <HorizontalMicroDetailsDesktop />
}

function HorizontalMicroDetailsDesktop() {
  const containerRef = useRef<HTMLDivElement>(null)
  const cardWidth = 360
  const gap = 24
  const cardCount = 6
  const totalWidth = cardCount * cardWidth + (cardCount - 1) * gap

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  const x = useTransform(
    scrollYProgress,
    [0, 1],
    [0, -(totalWidth - 800)]
  )

  return (
    <div ref={containerRef} className="relative" style={{ height: '300vh' }}>
      <div className="sticky top-0 h-screen flex items-center overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 lg:px-8 w-full">
          <SectionTitle
            eyebrow="Les problèmes qu'on n'avoue pas"
            title="Tout ce qui te coûte"
            gradient="sans que tu le voies."
          />
          <motion.div style={{ x, willChange: 'transform' }} className="flex gap-6">
            {microDetailsCards.map((card, i) => (
              <div key={i} style={{ willChange: 'transform' }}>
                <MicroDetail
                  icon={card.icon}
                  title={card.title}
                  desc={card.desc}
                  stat={'stat' in card ? (card as { stat: string }).stat : undefined}
                  delay={i * 0.05}
                />
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

// ─── Scenario Timeline Block — OPTIMIZATION E: CSS pulse, whileInView cards ──
function ScenarioTimeline({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {/* Central vertical line — static gradient (not animated) */}
      <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-accent-cyan/30 to-transparent" />
      <div className="space-y-12 md:space-y-16">
        {children}
      </div>
    </div>
  )
}

function ScenarioCard({
  time,
  timeColor,
  title,
  children,
  index,
}: {
  time: string
  timeColor: 'purple' | 'cyan' | 'green'
  title: string
  children: React.ReactNode
  index: number
}) {
  const isEven = index % 2 === 1
  const colorMap = {
    purple: { bg: 'bg-accent-purple/10', border: 'border-accent-purple/20', text: 'text-accent-purple' },
    cyan: { bg: 'bg-accent-cyan/10', border: 'border-accent-cyan/20', text: 'text-accent-cyan' },
    green: { bg: 'bg-accent-green/10', border: 'border-accent-green/20', text: 'text-accent-green' },
  }
  const colors = colorMap[timeColor]

  return (
    <div
      className={`relative flex items-start gap-4 md:gap-0 ${isEven ? 'md:flex-row-reverse' : ''}`}
    >
      {/* Dot on the line — CSS animation for pulse (not framer-motion) */}
      <div className="absolute left-4 md:left-1/2 top-6 -translate-x-1/2 z-10 flex flex-col items-center">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${colors.bg} ${colors.border} border mb-2`}>
          <span className={`font-mono text-xs ${colors.text}`}>{time}</span>
        </span>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-cyan opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-cyan" />
        </span>
      </div>

      {/* Spacer for the line area */}
      <div className="w-8 md:w-1/2 flex-shrink-0" />

      {/* Card — simple whileInView fade-in (not clip-path) */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={`flex-1 p-6 md:p-8 rounded-2xl border border-white/[0.05] bg-white/[0.02] ${isEven ? 'md:mr-8' : 'md:ml-8'} ml-4 md:ml-0`}
      >
        <h4 className="font-title text-lg md:text-xl font-semibold text-white mb-2 flex items-center gap-2">
          {title}
        </h4>
        <div className="font-body text-sm md:text-base text-white/50 leading-relaxed">
          {children}
        </div>
      </motion.div>
    </div>
  )
}

// ─── Price Ring SVG ─────────────────────────────────────────────────────────
function PriceRingSVG({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="absolute w-48 h-48 md:w-56 md:h-56" viewBox="0 0 200 200">
        <circle
          cx="100" cy="100" r="80"
          fill="none"
          stroke="rgba(0,212,255,0.15)"
          strokeWidth="2"
        />
        <circle
          cx="100" cy="100" r="80"
          fill="none"
          stroke="url(#priceGradientCyan)"
          strokeWidth="2"
          strokeDasharray="180 320"
          className="animate-[spin_8s_linear_infinite]"
        />
        <circle
          cx="100" cy="100" r="80"
          fill="none"
          stroke="url(#priceGradientPurple)"
          strokeWidth="2"
          strokeDasharray="120 380"
          strokeDashoffset="200"
          className="animate-[spin_8s_linear_infinite_reverse]"
        />
        <defs>
          <linearGradient id="priceGradientCyan" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#00D4FF" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="priceGradientPurple" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#8C52FF" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#8C52FF" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
      <div className="relative z-10 flex flex-col items-center">
        {children}
      </div>
    </div>
  )
}


// ═══════════════════════════════════════════════════════════════════════════════
// PAGE CHAUFFEURS — BIG DOMINO
// ═══════════════════════════════════════════════════════════════════════════════

export default function ChauffeursPage() {
  const trial = useTrialInfo()
  const isMobile = useIsMobile()
  const reducedMotion = useReducedMotion()

  return (
    <main className="min-h-screen bg-[#050508]">
      <Header />
      <StickyMobileCTA />

      {/* ═══════════════════════════════════════════════════════════════
          1. ABOVE FOLD — Le Big Domino (PARALLAX MULTI-COUCHES)
          La SEULE croyance à abattre : "Je peux pas faire mieux,
          c'est le marché qui décide."
          Miroir parfait : ta plus grande douleur ↔ ton plus grand désir
          ═══════════════════════════════════════════════════════════════ */}
      {/* OPTIMIZATION A: Desktop parallax hero vs Mobile static hero */}
      {isMobile ? (
        <MobileHero />
      ) : (
        <DesktopParallaxHero reducedMotion={reducedMotion} />
      )}


      {/* ═══════════════════════════════════════════════════════════════
          2. DOULEUR PRIMAIRE — Amplification
          "On sait exactement ce que tu vis."
          Frustration vs Désir — le miroir parfait
          ═══════════════════════════════════════════════════════════════ */}
      <section id="douleur" className="relative py-20 md:py-28 bg-[#08080d]">
        <FloatingParticles count={12} className="z-0" />
        <div className="relative max-w-5xl mx-auto px-6 lg:px-8">
          <SectionTitle
            eyebrow="Ce que tu vis chaque jour"
            title="La réalité du terrain."
            gradient="Ce qu'elle pourrait devenir."
            subtitle="Chaque colonne est un miroir. À gauche, ta journée actuelle. À droite, ta journée avec Ajnaya."
          />

          <div className="space-y-5 md:space-y-6">
            <DualityBlock
              frustration={{
                title: 'Tu tournes pendant 45 minutes sans course.',
                desc: 'L\'app est silencieuse. Tu brûles du carburant. Tu stresses. Le compteur ne tourne pas mais le plein, lui, descend.',
              }}
              desir={{
                title: 'Tu te repositionnes 8 min avant le pic.',
                desc: 'Ajnaya a détecté 3 Intercités qui arrivent Gare de Lyon. Tu es déjà là. Première course en 4 minutes.',
              }}
              delay={0}
            />

            {/* Visual intercalé 1 — AjnayaNotification */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center py-6"
            >
              <AjnayaNotification />
            </motion.div>

            <DualityBlock
              frustration={{
                title: 'Tu acceptes une course à 7€ par défaut.',
                desc: 'Parce que tu avais rien depuis 20 minutes. Course courte, mauvaise direction, et maintenant tu es coincé dans une zone morte.',
              }}
              desir={{
                title: 'Tu refuses intelligemment et tu gagnes 34€.',
                desc: 'Ajnaya t\'avait prévenu : dans 12 minutes, un événement se termine à 800m. Tu as attendu. La course vaut 5x plus.',
              }}
              delay={0.1}
            />

            {/* Visual intercalé 2 — Barres comparatives 7€ vs 34€ (whileInView) */}
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              whileInView={{ opacity: 1, scaleX: 1 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformOrigin: 'left' }}
            >
              <AnimatedBar redValue={7} redLabel="Course par défaut" cyanValue={34} cyanLabel="Course stratégique Ajnaya" />
            </motion.div>

            <DualityBlock
              frustration={{
                title: 'Tu finis ta journée à 22h, épuisé, avec 180€.',
                desc: '12 heures de route. 3 heures de vide. Tu te demandes si ça vaut le coup. Le corps lâche avant le mental.',
              }}
              desir={{
                title: 'Tu finis à 20h avec 240€. Même effort, moins de km.',
                desc: 'Moins de trajets vides, des courses mieux payées, des enchaînements plus courts. Le CA monte, les km baissent.',
              }}
              delay={0.2}
            />

            {/* Visual intercalé 3 — Jauges circulaires CA vs km (whileInView) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="flex justify-center gap-8 md:gap-12 py-6"
            >
              <CircularGauge value={33} max={100} label="CA/heure en hausse" color="#00D4FF" suffix="%" />
              <CircularGauge value={40} max={100} label="km à vide réduits" color="#8C52FF" suffix="%" />
            </motion.div>
          </div>
        </div>
      </section>

      <GradientLine className="py-4" />


      {/* ═══════════════════════════════════════════════════════════════
          3. PREUVE VISUELLE — ScrollMapAnimation
          LE composant le plus puissant.
          Zone vide → voiture qui bouge → zone chaude.
          Pas besoin de lire. Tu VOIS le concept.
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative">
        <div className="max-w-5xl mx-auto px-6 lg:px-8 pt-16 md:pt-24">
          <SectionTitle
            eyebrow="Comment ça marche"
            title="L'IA qui voit"
            gradient="avant la demande."
            subtitle="Pas de magie. Des données en temps réel : trains, événements, météo, habitudes locales."
          />
        </div>
        <ScrollMapAnimation />
      </section>

      <GradientLine className="py-4" />


      {/* ═══════════════════════════════════════════════════════════════
          4. DOULEURS SECONDAIRES — Horizontal Sticky Scroll
          Multi-app chaos, fatigue, manque de visibilité
          Chaque micro-frustration = preuve qu'on connaît le métier
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative bg-[#08080d]">
        <HorizontalMicroDetails />
      </section>

      <GradientLine className="py-4" />


      {/* ═══════════════════════════════════════════════════════════════
          5. EPIPHANY BRIDGE — La conversation Ajnaya
          Le moment où le chauffeur se dit "putain c'est ça."
          Il VOIT une conversation réelle. Gare de Lyon, 34€.
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative">
        <div className="max-w-5xl mx-auto px-6 lg:px-8 pt-16 md:pt-24">
          <SectionTitle
            eyebrow="En conditions réelles"
            title="Voilà ce que voit"
            gradient="un chauffeur FOREAS."
            subtitle="Mardi, 17h42. Gare de Lyon. 3 Intercités arrivent dans 12 minutes."
          />
        </div>
        <AjnayaChatScroll />
      </section>

      <GradientLine className="py-4" />


      {/* ═══════════════════════════════════════════════════════════════
          6. DOULEURS TERTIAIRES — Timeline Verticale
          On prouve qu'on connaît le métier dans les moindres détails
          Chaque bloc = un chauffeur qui se dit "il parle de MOI"
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative py-20 md:py-28">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <SectionTitle
            eyebrow="On connaît ton quotidien"
            title="Chaque détail"
            gradient="de ta journée."
          />

          <ScenarioTimeline>
            {/* Scenario 1 */}
            <ScenarioCard time="06:30" timeColor="purple" title="Lundi matin, 6h30" index={0}>
              <p>
                Tu te lèves. Tu ouvres Uber. Zéro visibilité. Où aller ? CDG ? Orly ? Gare du Nord ?
                Ajnaya te dit : <span className="text-accent-cyan">&quot;3 vols arrivent à Orly T4 à 7h15, surge prévu +1.8x, 22 min de route.&quot;</span>
                Tu sais exactement où être et pourquoi.
              </p>
            </ScenarioCard>

            {/* Scenario 2 */}
            <ScenarioCard time="22:45" timeColor="cyan" title="Mercredi soir, 22h45" index={1}>
              <p>
                Match au Parc des Princes, 48 000 personnes sortent en 20 minutes. Les chauffeurs lambda foncent tous Porte d&apos;Auteuil.
                Ajnaya te positionne <span className="text-accent-cyan">Porte de Saint-Cloud, côté Boulogne</span> — moins saturé, courses plus longues, clients moins stressés.
              </p>
            </ScenarioCard>

            {/* Scenario 3 */}
            <ScenarioCard time="13:00" timeColor="green" title="Vendredi, 13h — pluie annoncée" index={2}>
              <p>
                Météo France annonce de la pluie à 14h sur le 8ème. La demande VTC explose toujours 15 min après les premières gouttes.
                Ajnaya t&apos;envoie : <span className="text-accent-cyan">&quot;Positionne-toi Champs-Élysées dans 25 min. Surge prévu.&quot;</span>
                Tu es le premier sur zone.
              </p>
            </ScenarioCard>

            {/* Scenario 4 */}
            <ScenarioCard time="23:30" timeColor="purple" title="Samedi, 23h30 — fin de spectacle" index={3}>
              <p>
                Trois théâtres se vident simultanément dans le 9ème. Ajnaya croise les horaires de fin, la capacité des salles et la météo.
                Résultat : <span className="text-accent-cyan">elle te place Rue de Mogador, pas Boulevard Haussmann</span>. Moins de concurrence, mêmes clients.
              </p>
            </ScenarioCard>
          </ScenarioTimeline>
        </div>
      </section>

      <GradientLine className="py-4" />


      {/* ═══════════════════════════════════════════════════════════════
          7. PREUVE INTERACTIVE — App Demo
          Show don't tell. Le visiteur manipule l'app.
          ═══════════════════════════════════════════════════════════════ */}
      <AppDemo />

      <GradientLine className="py-4" />


      {/* ═══════════════════════════════════════════════════════════════
          8. PREUVE SOCIALE — Témoignages vidéo réels
          Des vrais chauffeurs. Pas des acteurs. Pas des scripts.
          ═══════════════════════════════════════════════════════════════ */}
      <Testimonials />

      <GradientLine className="py-4" />


      {/* ═══════════════════════════════════════════════════════════════
          9. PERSONNALISATION — Calculateur ROI
          Endowment effect : une fois qu'il voit +14 560€/an,
          c'est "son" argent qu'il perd en ne souscrivant pas.
          ═══════════════════════════════════════════════════════════════ */}
      <RevenueSimulator />

      <GradientLine className="py-4" />


      {/* ═══════════════════════════════════════════════════════════════
          10. OFFER — Le close. Trial dynamique Stripe.
          Urgence réelle (pas fake). Logique après l'émotion.
          whileInView reveal (no clip-path scroll).
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative py-32 lg:py-40 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 bg-[#050508]"
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[300px] md:w-[1000px] md:h-[600px] bg-gradient-to-b from-accent-purple/10 via-accent-cyan/5 to-transparent rounded-full blur-[60px] md:blur-[120px] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-center"
          >
            {/* Badge dynamique */}
            {trial.ready && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full border border-accent-green/20 bg-accent-green/5 animate-gradient bg-gradient-to-r from-accent-green/5 via-accent-cyan/5 to-accent-green/5 bg-[length:200%_100%]"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-green opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-green" />
                </span>
                <span className="text-sm font-medium text-accent-green">
                  {trial.days} jour{trial.days > 1 ? 's' : ''} d&apos;essai gratuit — jusqu&apos;au {trial.dateLabel}
                </span>
              </motion.div>
            )}

            {/* Headline */}
            <h2 className="font-title text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-white mb-6">
              Arrête de tourner.
              <span className="block bg-gradient-to-r from-accent-purple to-accent-cyan bg-clip-text text-transparent">
                Commence à gagner.
              </span>
            </h2>

            <p className="font-body text-lg text-white/60 max-w-xl mx-auto mb-4">
              Pour le prix d&apos;un café par jour.
            </p>

            {/* Price anchor — SVG ring */}
            <div className="flex items-center justify-center mb-10">
              <PriceRingSVG>
                <span className="font-title text-5xl md:text-6xl font-bold text-accent-cyan">1,42€</span>
                <span className="text-white/40 text-lg">/jour</span>
              </PriceRingSVG>
            </div>

            {/* CTA → Stripe Checkout via /tarifs2 */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <a
                href="/tarifs2"
                className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-accent-purple to-accent-cyan transition-all duration-300 group-hover:from-accent-purple group-hover:to-accent-purple/80" />
                <span className="relative">Commencer l&apos;essai gratuit</span>
                <svg className="relative w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>

              <a
                href="/tarifs2"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-medium text-white/70 hover:text-white border border-white/10 hover:border-white/20 rounded-2xl transition-all duration-300"
              >
                Voir les tarifs
              </a>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-white/40 text-sm">
              <span>0€ débité aujourd&apos;hui</span>
              <span>Annulation en 1 clic</span>
              <span>Compatible toutes apps VTC</span>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  )
}


// ═══════════════════════════════════════════════════════════════════════════════
// HERO VARIANTS — OPTIMIZATION A
// ═══════════════════════════════════════════════════════════════════════════════

// Mobile Hero — static, no useScroll, no useTransform, no sticky
function MobileHero() {
  return (
    <section className="relative pt-28 pb-20 overflow-hidden">
      {/* Background glow — static */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-b from-accent-purple/8 via-accent-cyan/4 to-transparent rounded-full blur-[80px] pointer-events-none" />
      <FloatingParticles className="z-0" />

      <div className="relative max-w-6xl mx-auto px-6">
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium tracking-wider uppercase text-accent-cyan/80 border border-accent-cyan/15 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-green opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-green" />
            </span>
            Pour chauffeurs VTC
          </span>
        </motion.div>

        {/* Hero headline — Big Domino statement */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="font-title text-4xl font-semibold leading-[1.05] tracking-tight mb-6"
        >
          <span className="text-white">Tu tournes à vide.</span>
          <br />
          <span className="animate-gradient bg-gradient-to-r from-[#00D4FF] via-[#8C52FF] to-[#00D4FF] bg-[length:200%_100%] bg-clip-text text-transparent">
            Ajnaya sait où aller.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="font-body text-base text-white/50 max-w-lg mb-8"
        >
          Le premier système qui voit la demande avant qu'elle arrive
          et te repositionne en avance.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-3 sm:gap-4"
        >
          <a
            href="/tarifs2"
            className="group relative inline-flex items-center justify-center gap-2 px-7 py-4 text-sm font-semibold text-white overflow-hidden rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-accent-purple to-accent-cyan transition-all duration-300 group-hover:from-accent-purple group-hover:to-accent-purple/80" />
            <span className="relative">Essayer gratuitement</span>
            <svg className="relative w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
          <a
            href="#douleur"
            className="inline-flex items-center justify-center gap-2 px-7 py-4 text-sm font-medium text-white/70 hover:text-white border border-white/10 hover:border-white/20 rounded-2xl transition-all"
          >
            Voir pourquoi ça marche
          </a>
        </motion.div>

        {/* Trust signal */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-8 text-white/30 text-xs"
        >
          <span>0€ débité</span>
          <span className="w-px h-3 bg-white/10" />
          <span>Annulation en 1 clic</span>
          <span className="w-px h-3 bg-white/10" />
          <span>Compatible Uber, Bolt, Heetch</span>
        </motion.div>

        {/* PhoneMockup below CTAs on mobile */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex justify-center mt-12"
        >
          <PhoneMockup />
        </motion.div>
      </div>
    </section>
  )
}

// Desktop Hero — parallax with useScroll/useTransform (1 of max 2 useScroll on page)
function DesktopParallaxHero({ reducedMotion }: { reducedMotion: boolean }) {
  const heroRef = useRef<HTMLElement>(null)
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })

  const heroGlowY = useTransform(heroProgress, [0, 1], [0, 50])
  const heroTitleY = useTransform(heroProgress, [0, 1], [0, 100])
  const heroPhoneY = useTransform(heroProgress, [0, 1], [0, 150])

  return (
    <section ref={heroRef} className="relative pt-36 pb-28 overflow-hidden">
      {/* Background glow — parallax layer 1 */}
      <motion.div
        style={{ y: reducedMotion ? 0 : heroGlowY, willChange: 'transform' }}
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[700px] bg-gradient-to-b from-accent-purple/8 via-accent-cyan/4 to-transparent rounded-full blur-[150px] pointer-events-none"
      />
      <FloatingParticles className="z-0" />

      <div className="relative max-w-6xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left col — text — parallax layer 2 */}
          <motion.div style={{ y: reducedMotion ? 0 : heroTitleY, willChange: 'transform' }}>
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-8"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium tracking-wider uppercase text-accent-cyan/80 border border-accent-cyan/15 rounded-full">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-green opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-green" />
                </span>
                Pour chauffeurs VTC
              </span>
            </motion.div>

            {/* Hero headline — Big Domino statement */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="font-title text-6xl lg:text-7xl font-semibold leading-[1.05] tracking-tight mb-6"
            >
              <span className="text-white">Tu tournes à vide.</span>
              <br />
              <span className="animate-gradient bg-gradient-to-r from-[#00D4FF] via-[#8C52FF] to-[#00D4FF] bg-[length:200%_100%] bg-clip-text text-transparent">
                Ajnaya sait où aller.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="font-body text-lg text-white/50 max-w-lg mb-10"
            >
              Le premier système qui voit la demande avant qu'elle arrive
              et te repositionne en avance.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4"
            >
              <a
                href="/tarifs2"
                className="group relative inline-flex items-center justify-center gap-2 px-7 py-4 text-base font-semibold text-white overflow-hidden rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-accent-purple to-accent-cyan transition-all duration-300 group-hover:from-accent-purple group-hover:to-accent-purple/80" />
                <span className="relative">Essayer gratuitement</span>
                <svg className="relative w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
              <a
                href="#douleur"
                className="inline-flex items-center justify-center gap-2 px-7 py-4 text-base font-medium text-white/70 hover:text-white border border-white/10 hover:border-white/20 rounded-2xl transition-all"
              >
                Voir pourquoi ça marche
              </a>
            </motion.div>

            {/* Trust signal */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-8 text-white/30 text-xs"
            >
              <span>0€ débité</span>
              <span className="w-px h-3 bg-white/10" />
              <span>Annulation en 1 clic</span>
              <span className="w-px h-3 bg-white/10" />
              <span>Compatible Uber, Bolt, Heetch</span>
            </motion.div>
          </motion.div>

          {/* Right col — PhoneMockup — parallax layer 3 */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{ y: reducedMotion ? 0 : heroPhoneY, willChange: 'transform' }}
            className="flex justify-center lg:justify-end"
          >
            <PhoneMockup />
          </motion.div>
        </div>
      </div>
    </section>
  )
}

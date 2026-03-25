'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import PhoneMockup from '@/components/PhoneMockup'
import { useIsMobile } from '@/hooks/useDevicePerf'

// ═══════════════════════════════════════════════════════════════════════════════
// FOREAS V2 — Homepage Brunson: Hook → Story → Offer
// Arc émotionnel : Douleur → Épiphanie → Preuve → Personnalisation → Offre
// Tous les CTA → /tarifs2 (Stripe Checkout dynamique)
// TU partout. Zéro chiffre inventé. Zéro "IA" seule.
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Dynamic Trial Calculation (mirrors /api/checkout logic) ─────────────────
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

// ─── Animated counter ────────────────────────────────────────────────────────
function CountUp({ target, suffix = '', prefix = '', duration = 1800 }: { target: number; suffix?: string; prefix?: string; duration?: number }) {
  const [value, setValue] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true
        const start = performance.now()
        const animate = (now: number) => {
          const p = Math.min((now - start) / duration, 1)
          setValue(Math.round((1 - Math.pow(1 - p, 3)) * target))
          if (p < 1) requestAnimationFrame(animate)
        }
        requestAnimationFrame(animate)
      }
    }, { threshold: 0.3 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target, duration])
  return <span ref={ref}>{prefix}{value}{suffix}</span>
}

// ─── Typewriter chat ─────────────────────────────────────────────────────────
interface ChatMsg {
  sender: 'driver' | 'ajnaya'
  text: string
  time: string
  highlight?: boolean
}

const chatMessages: ChatMsg[] = [
  { sender: 'driver', text: 'Où est-ce que je gagne plus là maintenant ?', time: '20:03' },
  { sender: 'ajnaya', text: 'Gare de Lyon. 800m de toi. 3 Intercités arrivent à 20:15 — la demande monte dans 12 min.', time: '20:03' },
  { sender: 'ajnaya', text: 'Pars maintenant, tu arrives avant le pic.', time: '20:03', highlight: true },
  { sender: 'driver', text: "C'est parti.", time: '20:04' },
  { sender: 'ajnaya', text: 'Course assignée. Gare de Lyon → Neuilly. 34€ estimé.', time: '20:16', highlight: true },
  { sender: 'ajnaya', text: 'Neuilly : concert à 21h. Enchaînement dans 8 min. On y va ?', time: '20:42' },
]

function TypewriterChat() {
  const [visibleCount, setVisibleCount] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, margin: '-80px' })

  useEffect(() => {
    if (!isInView) return
    let i = 0
    const interval = setInterval(() => {
      i++
      setVisibleCount(i)
      if (i >= chatMessages.length) clearInterval(interval)
    }, 900)
    return () => clearInterval(interval)
  }, [isInView])

  return (
    <div ref={containerRef} className="w-full max-w-sm mx-auto">
      {/* Chat header */}
      <div className="flex items-center gap-3 mb-4 px-1">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-cyan to-accent-purple flex items-center justify-center">
          <span className="text-xs font-bold text-white">A</span>
        </div>
        <div>
          <p className="text-white text-sm font-semibold">Ajnaya</p>
          <p className="text-accent-green text-[11px]">En ligne</p>
        </div>
      </div>

      {/* Messages */}
      <div className="space-y-2.5 min-h-[320px]">
        {chatMessages.slice(0, visibleCount).map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className={`flex ${msg.sender === 'driver' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
              msg.sender === 'driver'
                ? 'bg-accent-purple/20 text-white/90 rounded-br-md'
                : msg.highlight
                  ? 'bg-gradient-to-r from-accent-cyan/15 to-accent-purple/10 border border-accent-cyan/20 text-white rounded-bl-md'
                  : 'bg-white/[0.07] text-white/80 rounded-bl-md'
            }`}>
              {msg.text}
              <span className="block text-[10px] text-white/30 mt-1 text-right">{msg.time}</span>
            </div>
          </motion.div>
        ))}
        {visibleCount < chatMessages.length && visibleCount > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="px-4 py-2 rounded-2xl bg-white/[0.05] rounded-bl-md">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

// ─── Revenue Simulator (TU version) ─────────────────────────────────────────
function SimulateurGains() {
  const [heures, setHeures] = useState(40)
  const [caHebdo, setCaHebdo] = useState(800)

  const results = useMemo(() => {
    const gainHebdo = Math.round(caHebdo * 0.35)
    const gainMensuel = gainHebdo * 4
    const gainAnnuel = gainHebdo * 52
    const tauxAvant = (caHebdo / heures).toFixed(0)
    const tauxApres = ((caHebdo + gainHebdo) / heures).toFixed(0)
    return { gainHebdo, gainMensuel, gainAnnuel, tauxAvant, tauxApres, newHebdo: caHebdo + gainHebdo }
  }, [heures, caHebdo])

  return (
    <div className="grid lg:grid-cols-2 gap-6 items-start">
      {/* Inputs */}
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
        <h3 className="text-white font-semibold text-sm mb-5">Ta situation actuelle</h3>
        <div className="space-y-6">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-white/60">Heures par semaine</span>
              <span className="text-white font-mono">{heures}h</span>
            </div>
            <input type="range" min={20} max={70} value={heures} onChange={e => setHeures(+e.target.value)}
              className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-accent-cyan" />
            <div className="flex justify-between text-[11px] text-white/30 mt-1"><span>20h</span><span>70h</span></div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-white/60">CA hebdo actuel</span>
              <span className="text-white font-mono">{caHebdo}€</span>
            </div>
            <input type="range" min={400} max={2000} step={50} value={caHebdo} onChange={e => setCaHebdo(+e.target.value)}
              className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-accent-cyan" />
            <div className="flex justify-between text-[11px] text-white/30 mt-1"><span>400€</span><span>2000€</span></div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="bg-gradient-to-b from-accent-cyan/[0.06] to-transparent border border-accent-cyan/20 rounded-2xl p-6">
        <p className="text-white/50 text-xs uppercase tracking-wider mb-3">Avec FOREAS</p>
        <div className="flex items-baseline gap-2 mb-5">
          <span className="font-title text-4xl font-bold text-white">{results.newHebdo}€</span>
          <span className="text-white/40 text-sm">/semaine</span>
          <span className="ml-auto text-accent-green text-sm font-semibold">+{results.gainHebdo}€</span>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-white/[0.04] rounded-xl p-3">
            <p className="text-white/40 text-[11px]">Gain mensuel</p>
            <p className="text-white font-semibold">+{results.gainMensuel}€</p>
          </div>
          <div className="bg-white/[0.04] rounded-xl p-3">
            <p className="text-white/40 text-[11px]">Gain annuel</p>
            <p className="text-white font-semibold">+{results.gainAnnuel}€</p>
          </div>
          <div className="bg-white/[0.04] rounded-xl p-3">
            <p className="text-white/40 text-[11px]">Taux horaire</p>
            <p className="text-white font-semibold">{results.tauxAvant}€ → <span className="text-accent-cyan">{results.tauxApres}€</span></p>
          </div>
          <div className="bg-white/[0.04] rounded-xl p-3">
            <p className="text-white/40 text-[11px]">Rentabilisé en</p>
            <p className="text-white font-semibold">~1 course</p>
          </div>
        </div>
        <p className="text-white/30 text-[11px] mb-4">Estimations basées sur +35% visé. Résultats variables selon zone, horaires et usage.</p>
        <a href="/tarifs2" className="block w-full text-center py-3 rounded-xl bg-gradient-to-r from-accent-purple to-accent-cyan text-white font-semibold text-sm hover:opacity-90 transition-opacity">
          Voir les tarifs →
        </a>
      </div>
    </div>
  )
}

// ─── Sticky Mobile CTA ───────────────────────────────────────────────────────
function StickyMobileCTA() {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > window.innerHeight * 0.5)
    }
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

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function HomepageV2() {
  const isMobile = useIsMobile()
  const trial = useTrialInfo()

  // Scroll progress for parallax
  const { scrollYProgress } = useScroll()
  const heroParallax = useTransform(scrollYProgress, [0, 0.2], [0, -50])

  return (
    <main className="min-h-screen bg-foreas-deepblack text-white overflow-x-hidden">
      <Header />
      <StickyMobileCTA />

      {/* ═══════════════════════════════════════════════════════════
          SECTION 1 — HOOK (Hero)
          Brunson: Le Hook attrape l'attention en < 3 secondes.
          "Tourne moins. Gagne plus." = miroir + promesse.
          Le mockup = show don't tell instantané.
          ═══════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[100dvh] flex items-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0" style={{
          background: `
            radial-gradient(ellipse 120% 60% at 50% -20%, rgba(140, 82, 255, 0.08) 0%, transparent 50%),
            radial-gradient(ellipse 80% 50% at 80% 50%, rgba(0, 212, 255, 0.04) 0%, transparent 40%),
            linear-gradient(180deg, #050508 0%, #08080d 50%, #050508 100%)
          `
        }} />
        {!isMobile && (
          <>
            <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-accent-purple/[0.03] rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-accent-cyan/[0.02] rounded-full blur-[120px] pointer-events-none" />
          </>
        )}

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 pt-24 lg:pt-20 pb-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Copy */}
            <div className="text-center lg:text-left">
              {/* Eyebrow */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-5">
                <span className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium tracking-wider uppercase text-accent-cyan/80 border border-accent-cyan/20 rounded-full">
                  <span className="w-1.5 h-1.5 bg-accent-green rounded-full animate-pulse" />
                  Lancement Paris — essai gratuit
                </span>
              </motion.div>

              {/* Headline */}
              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
                className="font-title text-4xl md:text-5xl lg:text-6xl font-semibold leading-[1.05] tracking-tight mb-4 lg:mb-5">
                <span className="block text-white">Tourne moins.</span>
                <span className="block bg-gradient-to-r from-accent-cyan to-accent-purple bg-clip-text text-transparent">Gagne plus.</span>
              </motion.h1>

              {/* Subheadline */}
              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
                className="font-body text-base md:text-lg text-white/50 max-w-md mx-auto lg:mx-0 mb-6 lg:mb-8">
                Ajnaya te dit où aller pour gagner plus. En temps réel.
              </motion.p>

              {/* Stats — only verified claims */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
                className="flex items-center gap-6 justify-center lg:justify-start mb-8 lg:mb-10">
                <div className="flex items-baseline gap-1">
                  <span className="font-title text-3xl md:text-4xl font-bold text-white">+35</span>
                  <span className="font-title text-xl md:text-2xl font-bold text-accent-cyan">%</span>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <p className="text-xs text-white/50 text-left">
                  de CA visé<br />
                  <span className="text-white/30">Résultats variables*</span>
                </p>
              </motion.div>

              {/* CTAs */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <a href="/tarifs2"
                  className="group relative inline-flex items-center justify-center gap-2 px-6 py-3 md:px-8 md:py-4 text-sm md:text-base font-semibold text-white overflow-hidden rounded-xl md:rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
                  <div className="absolute inset-0 bg-gradient-to-r from-accent-purple to-accent-purple/80 transition-all duration-300 group-hover:from-accent-purple group-hover:to-accent-cyan/80" />
                  <span className="relative">Essayer gratuitement</span>
                  <svg className="relative w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
                <a href="#decouvrir"
                  className="group inline-flex items-center justify-center gap-2 px-6 py-3 md:px-8 md:py-4 text-sm md:text-base font-medium text-white/70 hover:text-white border border-white/10 hover:border-white/20 rounded-xl md:rounded-2xl transition-all duration-300">
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  Découvrir
                </a>
              </motion.div>

              {/* Trust micro-copy */}
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
                className="text-white/25 text-[11px] mt-4 text-center lg:text-left">
                0€ débité · Résiliable en 1 clic · {trial.ready ? `${trial.days} jours d'essai` : 'Essai gratuit'}
              </motion.p>
            </div>

            {/* Right: Phone */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex justify-center lg:justify-end mt-4 lg:mt-0"
            >
              {!isMobile && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[500px] bg-gradient-to-b from-accent-purple/20 via-accent-cyan/10 to-transparent rounded-full blur-[100px] pointer-events-none" />
              )}
              <PhoneMockup />
            </motion.div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#050508] to-transparent pointer-events-none" />
      </section>


      {/* ═══════════════════════════════════════════════════════════
          SECTION 2 — STORY Part 1: THE PAIN
          Brunson: Avant de vendre la solution, amplifie la douleur.
          Loss aversion (Kahneman) : perdre 200€ > gagner 200€.
          ═══════════════════════════════════════════════════════════ */}
      <section id="decouvrir" className="relative py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-[#050508]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <div className="relative z-10 max-w-3xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
            {/* Headline douleur */}
            <h2 className="font-title text-3xl md:text-4xl lg:text-5xl font-semibold text-white text-center mb-12">
              Chaque heure à vide{' '}
              <span className="text-red-400">te coûte 20€.</span>
            </h2>

            {/* 3 Pain points — vertical blocks, Brunson "agitate" */}
            <div className="space-y-6">
              {[
                {
                  icon: '⏱',
                  title: '2h de vide par jour',
                  text: 'Tu tournes. Tu attends. Tu espères. Pendant ce temps, d\'autres enchaînent.',
                  metric: '~200€/semaine perdus',
                },
                {
                  icon: '📍',
                  title: 'Toujours en retard sur les zones',
                  text: 'Quand tu arrives, la demande est partie. Tu réagis au lieu d\'anticiper.',
                  metric: 'Les bons spots sont pris',
                },
                {
                  icon: '🧠',
                  title: 'Décisions au feeling',
                  text: 'Uber, Bolt, Heetch — 3 apps, 0 vision d\'ensemble. Tu choisis au hasard. Ça se voit sur ton CA.',
                  metric: 'Aucune donnée terrain',
                },
              ].map((pain, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.5 }}
                  className="flex gap-4 items-start p-5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-red-500/20 transition-colors"
                >
                  <span className="text-2xl flex-shrink-0 mt-0.5">{pain.icon}</span>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-sm mb-1">{pain.title}</h3>
                    <p className="text-white/50 text-sm leading-relaxed">{pain.text}</p>
                  </div>
                  <span className="text-red-400/70 text-[11px] font-mono whitespace-nowrap hidden sm:block">{pain.metric}</span>
                </motion.div>
              ))}
            </div>

            {/* Transition — Pre-Suasion (Cialdini) */}
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="text-center text-white/40 text-base mt-14 mb-0"
            >
              Et si quelqu'un faisait ce travail pour toi ?
            </motion.p>
          </motion.div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════
          SECTION 3 — STORY Part 2: THE EPIPHANY
          Brunson: "L'Epiphany Bridge" — montre le moment où tout change.
          Ici = la conversation Ajnaya. Le visiteur VOIT le résultat.
          C'est pas une feature list. C'est une scène.
          ═══════════════════════════════════════════════════════════ */}
      <section className="relative py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0" style={{
          background: `
            radial-gradient(ellipse 60% 40% at 50% 50%, rgba(0, 212, 255, 0.04) 0%, transparent 60%),
            linear-gradient(180deg, #050508 0%, #08080d 50%, #050508 100%)
          `
        }} />

        <div className="relative z-10 max-w-5xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: The reveal */}
            <div>
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <h2 className="font-title text-3xl md:text-4xl lg:text-5xl font-semibold text-white mb-4">
                  Ajnaya.
                </h2>
                <p className="text-white/50 text-base md:text-lg mb-8">
                  Ton copilote qui voit la demande avant qu'elle arrive.
                </p>
              </motion.div>

              {/* 3 key differentiators */}
              <div className="space-y-4">
                {[
                  { icon: '🔮', text: 'Prédit la demande en temps réel — trains, événements, météo, habitudes locales', color: 'text-accent-cyan' },
                  { icon: '🗣️', text: 'Tu parles, elle agit. Voix ou texte, comme un vrai copilote.', color: 'text-accent-purple' },
                  { icon: '🔄', text: 'Chaque course mène à la suivante. Zéro temps mort entre deux clients.', color: 'text-accent-green' },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -15 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 + 0.3 }}
                    className="flex gap-3 items-start"
                  >
                    <span className="text-lg">{item.icon}</span>
                    <p className={`text-sm ${item.color} leading-relaxed`}>{item.text}</p>
                  </motion.div>
                ))}
              </div>

              {/* Metrics under */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 }}
                className="flex gap-6 mt-8"
              >
                <div>
                  <p className="font-title text-2xl font-bold text-accent-cyan">+35%</p>
                  <p className="text-white/30 text-[11px]">CA visé</p>
                </div>
                <div className="w-px bg-white/10" />
                <div>
                  <p className="font-title text-2xl font-bold text-accent-purple">-2h</p>
                  <p className="text-white/30 text-[11px]">de vide/jour</p>
                </div>
                <div className="w-px bg-white/10" />
                <div>
                  <p className="font-title text-2xl font-bold text-accent-green">24/7</p>
                  <p className="text-white/30 text-[11px]">temps réel</p>
                </div>
              </motion.div>
              <p className="text-white/20 text-[10px] mt-2">Objectifs visés. Résultats variables selon zone et usage.</p>
            </div>

            {/* Right: Chat conversation — the STORY */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 md:p-6"
            >
              <TypewriterChat />
            </motion.div>
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════
          SECTION 4 — STORY Part 3: THE PROOF
          Brunson: "Social proof removes doubt."
          Vrais chauffeurs, vrais témoignages, zéro chiffre inventé.
          ═══════════════════════════════════════════════════════════ */}
      <section className="relative py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-[#050508]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="font-title text-3xl md:text-4xl font-semibold text-white mb-3">
              Des chauffeurs. Des résultats.
            </h2>
            <p className="text-white/40 text-base">Pas de scripts. Pas de faux avis. Du terrain.</p>
          </motion.div>

          {/* Testimonial cards — simplified, impactful */}
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { name: 'Binate', city: 'Paris', quote: "FOREAS a changé ma manière de travailler. Je sais exactement où aller.", accent: 'border-accent-cyan/30' },
              { name: 'Kitenge', city: 'Paris', quote: "J'ai transformé ma vision du métier. Je sais où aller, quand y aller.", accent: 'border-accent-purple/30' },
              { name: 'Haitham', city: 'Île-de-France', quote: "Moins de temps à attendre, plus de temps à rouler. C'est concret.", accent: 'border-accent-green/30' },
            ].map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`bg-white/[0.03] border ${t.accent} rounded-xl p-5 hover:bg-white/[0.05] transition-colors`}
              >
                <p className="text-white/70 text-sm leading-relaxed mb-4">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-cyan to-accent-purple flex items-center justify-center">
                    <span className="text-[11px] font-bold text-white">{t.name[0]}</span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{t.name}</p>
                    <p className="text-white/30 text-[11px]">Chauffeur VTC · {t.city}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-6 mt-8 text-[11px] text-white/25">
            <span>🎬 Tournés sur le terrain</span>
            <span>🤝 Sans script</span>
            <span>🔒 Données protégées</span>
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════
          SECTION 5 — STORY Part 4: PERSONALIZATION
          Brunson: "Make them see themselves with the product."
          Le calculateur = endowment effect. Ses chiffres. Ses gains.
          ═══════════════════════════════════════════════════════════ */}
      <section id="simulateur" className="relative py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0" style={{
          background: `radial-gradient(ellipse 50% 30% at 50% 50%, rgba(0, 212, 255, 0.03) 0%, transparent 60%), #050508`
        }} />

        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
            <h2 className="font-title text-3xl md:text-4xl font-semibold text-white mb-3">
              Simule <span className="text-accent-cyan">tes</span> gains.
            </h2>
            <p className="text-white/40 text-base">Entre tes données. Découvre ce qu'Ajnaya change.</p>
          </motion.div>

          <SimulateurGains />
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════
          SECTION 6 — THE OFFER
          Brunson: "L'offre doit être irrésistible."
          Trial dynamique + prix ancré + urgence naturelle.
          ═══════════════════════════════════════════════════════════ */}
      <section className="relative py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-[#050508]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-cyan/20 to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-b from-accent-purple/8 to-transparent rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
            {/* Headline */}
            <h2 className="font-title text-3xl md:text-4xl lg:text-5xl font-semibold text-white mb-4">
              Demain, tu conduis{' '}
              <span className="bg-gradient-to-r from-accent-purple to-accent-cyan bg-clip-text text-transparent">différemment.</span>
            </h2>
            <p className="text-white/50 text-lg mb-8">Pour le prix d'un café par jour.</p>

            {/* Price anchor */}
            <div className="inline-flex items-baseline gap-1 mb-6">
              <span className="font-title text-5xl md:text-6xl font-bold text-accent-cyan">1,42€</span>
              <span className="text-white/40 text-lg">/jour</span>
            </div>

            {/* Dynamic trial */}
            {trial.ready && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent-green/10 border border-accent-green/20 mb-8"
              >
                <span className="w-2 h-2 bg-accent-green rounded-full animate-pulse" />
                <span className="text-accent-green text-sm font-medium">
                  {trial.days} jour{trial.days > 1 ? 's' : ''} d'essai gratuit — jusqu'au {trial.dateLabel}
                </span>
              </motion.div>
            )}

            <div className="block mb-8">
              {/* CTA */}
              <a href="/tarifs2"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-accent-purple to-accent-cyan rounded-2xl hover:opacity-90 transition-all hover:scale-[1.02] active:scale-[0.98]">
                Commencer l'essai gratuit
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-white/30 text-xs">
              <span className="flex items-center gap-1.5"><span>🔒</span> Chiffrement SSL</span>
              <span className="flex items-center gap-1.5"><span>✓</span> 0€ débité aujourd'hui</span>
              <span className="flex items-center gap-1.5"><span>↩️</span> Annulation en 1 clic</span>
            </div>
          </motion.div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════
          SECTION 7 — CLOSE (Urgency + Email capture)
          Pour ceux qui ne sont pas prêts à payer :
          capturer l'email → ActiveCampaign → nurture
          ═══════════════════════════════════════════════════════════ */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0" style={{
          background: `linear-gradient(180deg, #050508 0%, #08080d 100%)`
        }} />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <div className="relative z-10 max-w-xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <p className="text-white/30 text-xs uppercase tracking-wider mb-4">Pas encore prêt ?</p>
            <h3 className="font-title text-xl md:text-2xl font-semibold text-white mb-3">
              Reçois les meilleures zones de ta ville. Gratuitement.
            </h3>
            <p className="text-white/40 text-sm mb-6">
              Un email par semaine. Des pépites terrain. Zéro spam.
            </p>

            {/* Email capture form */}
            <form onSubmit={(e) => { e.preventDefault() }} className="flex gap-2 max-w-sm mx-auto">
              <input
                type="email"
                placeholder="Ton email"
                className="flex-1 px-4 py-3 bg-white/[0.05] border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-accent-cyan/40 transition-colors"
              />
              <button type="submit" className="px-5 py-3 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl text-white text-sm font-medium transition-colors">
                S'inscrire
              </button>
            </form>
            <p className="text-white/20 text-[10px] mt-3">Pas de spam. Désinscription en 1 clic.</p>
          </motion.div>
        </div>
      </section>


      <Footer />
    </main>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import Header from '@/components/Header'
import Hero from '@/components/Hero'
import GradientLine from '@/components/GradientLine'
import Footer from '@/components/Footer'

// ═══════════════════════════════════════════════════════════════════════════════
// FOREAS V2 — Restructuration Brunson : Hook → Story → Offer
// MÊME visuels que V1 (les composants parlent d'eux-mêmes)
// + Fix CTAs → /tarifs2 + dynamic trial + sticky CTA mobile
// ═══════════════════════════════════════════════════════════════════════════════

// Lazy load below-fold (comme V1 — performance)
const ScrollMapAnimation = dynamic(() => import('@/components/ScrollMapAnimation'))
const AjnayaChatScroll = dynamic(() => import('@/components/AjnayaChatScroll'))
const AppDemo = dynamic(() => import('@/components/AppDemo'))
const RevenueSimulator = dynamic(() => import('@/components/RevenueSimulator'))
const Testimonials = dynamic(() => import('@/components/Testimonials'))

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
    const handleScroll = () => setVisible(window.scrollY > window.innerHeight * 0.5)
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
// PAGE V2
// ═══════════════════════════════════════════════════════════════════════════════

export default function HomepageV2() {
  const trial = useTrialInfo()

  return (
    <main className="min-h-screen">
      <Header />
      <StickyMobileCTA />

      {/* ═══════════════════════════════════════════════════════════
          1. HOOK — Le Hero actuel est déjà excellent.
          "Tournez moins. Gagnez plus." + PhoneMockup.
          Le mockup parle tout seul. Le texte appuie.
          ═══════════════════════════════════════════════════════════ */}
      <Hero />

      {/* Pas de Stats (chiffres à vérifier) — direct dans le visuel */}
      <GradientLine className="py-4" />

      {/* ═══════════════════════════════════════════════════════════
          2. STORY Part 1 — ScrollMapAnimation
          LE composant le plus puissant du site.
          Zone vide → voiture qui bouge → zone chaude.
          Un analphabète comprend : "Ah, ça me déplace vers l'argent."
          Pas besoin de texte. Le visuel EST le message.
          ═══════════════════════════════════════════════════════════ */}
      <ScrollMapAnimation />

      <GradientLine className="py-4" />

      {/* ═══════════════════════════════════════════════════════════
          3. STORY Part 2 — La conversation Ajnaya
          Le visiteur VOIT une conversation réelle.
          Gare de Lyon, 3 Intercités, 34€.
          C'est le "Epiphany Bridge" de Brunson :
          le moment où le chauffeur se dit "putain c'est ça."
          ═══════════════════════════════════════════════════════════ */}
      <AjnayaChatScroll />

      <GradientLine className="py-4" />

      {/* ═══════════════════════════════════════════════════════════
          4. STORY Part 3 — Démo interactive
          Le phone interactif avec les onglets cliquables.
          Show don't tell. Le visiteur manipule l'app.
          ═══════════════════════════════════════════════════════════ */}
      <AppDemo />

      {/* ═══════════════════════════════════════════════════════════
          5. PROOF — Témoignages vidéo réels
          Mux, vrais chauffeurs, pas de scripts.
          La vidéo est la preuve ultime — impossible à faker.
          ═══════════════════════════════════════════════════════════ */}
      <Testimonials />

      <GradientLine className="py-4" />

      {/* ═══════════════════════════════════════════════════════════
          6. PERSONALIZATION — Calculateur ROI
          "Simule tes gains" — Le chauffeur voit SES chiffres.
          Endowment effect : une fois qu'il a vu +14 560€/an,
          c'est "son" argent qu'il perd en ne souscrivant pas.
          ═══════════════════════════════════════════════════════════ */}
      <RevenueSimulator />

      <GradientLine className="py-4" />

      {/* ═══════════════════════════════════════════════════════════
          7. OFFER — Le close. Trial dynamique Stripe.
          Pas de "Bientôt disponible". Pas de bouton mort.
          CTA → /tarifs2 → Stripe Checkout.
          ═══════════════════════════════════════════════════════════ */}
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
            {/* Badge dynamique */}
            {trial.ready && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full border border-accent-green/20 bg-accent-green/5"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-green opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-green" />
                </span>
                <span className="text-sm font-medium text-accent-green">
                  {trial.days} jour{trial.days > 1 ? 's' : ''} d'essai gratuit — jusqu'au {trial.dateLabel}
                </span>
              </motion.div>
            )}

            {/* Headline */}
            <h2 className="font-title text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-white mb-6">
              Demain, vous tournez
              <span className="block bg-gradient-to-r from-accent-purple to-accent-cyan bg-clip-text text-transparent">
                différemment.
              </span>
            </h2>

            <p className="font-body text-lg text-white/60 max-w-xl mx-auto mb-4">
              Pour le prix d'un café par jour.
            </p>

            {/* Price anchor */}
            <div className="flex items-baseline justify-center gap-1 mb-10">
              <span className="font-title text-5xl md:text-6xl font-bold text-accent-cyan">1,42€</span>
              <span className="text-white/40 text-lg">/jour</span>
            </div>

            {/* CTA → Stripe Checkout via /tarifs2 */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <a
                href="/tarifs2"
                className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-accent-purple to-accent-cyan transition-all duration-300 group-hover:from-accent-purple group-hover:to-accent-purple/80" />
                <span className="relative">Commencer l'essai gratuit</span>
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
              <span>🔒 Chiffrement SSL</span>
              <span>✓ 0€ débité aujourd'hui</span>
              <span>↩️ Annulation en 1 clic</span>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  )
}

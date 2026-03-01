'use client'

import { useState, useEffect, useRef, Suspense, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { loadStripe } from '@stripe/stripe-js'
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js'
import { useSearchParams } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

// Calcule le prochain lundi 18h Paris (côté client)
function getNextMonday18hParis(): Date {
  const now = new Date()
  const dayOfWeek = now.getDay() // 0=dim, 1=lun...
  const daysToAdd = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 7 : 8 - dayOfWeek
  const monday = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000)
  monday.setHours(18, 0, 0, 0)
  return monday
}

function formatDateFR(d: Date): string {
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

function AnimatedCounter({ target, suffix = '', duration = 2000 }: { target: number; suffix?: string; duration?: number }) {
  const [value, setValue] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true
        const start = performance.now()
        const animate = (now: number) => {
          const progress = Math.min((now - start) / duration, 1)
          const ease = 1 - Math.pow(1 - progress, 3)
          setValue(Math.round(ease * target))
          if (progress < 1) requestAnimationFrame(animate)
        }
        requestAnimationFrame(animate)
      }
    }, { threshold: 0.3 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target, duration])
  return <span ref={ref}>{value}{suffix}</span>
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-white/10">
      <button onClick={() => setOpen(o => !o)} className="w-full flex justify-between items-center py-5 text-left gap-4 group">
        <span className="text-white/90 font-medium text-sm sm:text-base group-hover:text-white transition-colors">{q}</span>
        <span className={`text-violet-400 text-xl transition-transform flex-shrink-0 ${open ? 'rotate-45' : ''}`}>+</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
            <p className="text-white/60 text-sm pb-5 leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}


// ─── TRIAL BRIDGE ──────────────────────────────────────────────────────────────
// Écran interstitiel AVANT Stripe — explique clairement la timeline de facturation
function TrialBridge({ plan, onConfirm, onClose }: { plan: 'weekly' | 'annual'; onConfirm: () => void; onClose: () => void }) {
  const nextMonday = getNextMonday18hParis()
  const trialDays = Math.max(1, Math.round((nextMonday.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
  const price = plan === 'weekly' ? '12,97€' : '9,97€'
  const period = plan === 'weekly' ? 'semaine' : 'semaine (annuel)'

  const steps = [
    { icon: '🎁', label: "Aujourd'hui", sublabel: 'Accès complet immédiat à FOREAS', highlight: '0€ débité', hColor: 'text-green-400 bg-green-500/10', active: true },
    { icon: '📱', label: trialDays + ' jour' + (trialDays > 1 ? 's' : '') + ' d\'utilisation', sublabel: 'Testez Ajnaya sur vos vraies courses', highlight: null, hColor: '', active: false },
    { icon: '📅', label: formatDateFR(nextMonday) + ' à 18h', sublabel: "Fin de l'essai gratuit", highlight: 'Annulez avant → 0€ total', hColor: 'text-violet-300 bg-violet-500/10', active: false },
    { icon: '💳', label: 'Premier débit (si vous continuez)', sublabel: price + ' par ' + period, highlight: 'Annulable en 1 clic à tout moment', hColor: 'text-white/40 bg-white/5', active: false },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-md bg-[#0d0d1a] border border-violet-500/30 rounded-2xl overflow-hidden shadow-2xl shadow-violet-900/40"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-gradient-to-r from-violet-900/30 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">F</span>
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Comment fonctionne l'essai ?</p>
              <p className="text-violet-300 text-xs">Transparent — aucune surprise</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10">×</button>
        </div>

        <div className="px-5 pt-5 pb-6">
          {/* Timeline */}
          <div className="space-y-0 mb-6">
            {steps.map((step, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={'w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ' + (step.active ? 'bg-green-500/20 ring-2 ring-green-500/40' : 'bg-white/5')}>
                    {step.icon}
                  </div>
                  {i < steps.length - 1 && <div className="w-px flex-1 my-1 bg-white/10" style={{ minHeight: '20px' }} />}
                </div>
                <div className="pb-4 pt-0.5 flex-1 min-w-0">
                  <p className={'text-sm font-semibold leading-tight ' + (step.active ? 'text-white' : 'text-white/70')}>{step.label}</p>
                  <p className="text-white/40 text-xs mt-0.5">{step.sublabel}</p>
                  {step.highlight && (
                    <span className={'inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ' + step.hColor}>
                      {step.highlight}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Explication carte */}
          <div className="bg-violet-500/8 border border-violet-500/15 rounded-xl p-4 mb-5">
            <div className="flex items-start gap-2.5">
              <span className="text-base mt-0.5 flex-shrink-0">🔒</span>
              <div>
                <p className="text-white/90 text-sm font-semibold mb-1">Pourquoi votre carte est demandée ?</p>
                <p className="text-white/55 text-xs leading-relaxed">
                  Stripe demande vos coordonnées pour préparer l'abonnement <strong className="text-white/80">après</strong> l'essai.
                  {' '}<strong className="text-white/80">Aucun montant débité aujourd'hui.</strong>
                  {' '}Annulez avant le {formatDateFR(nextMonday)} — c'est zéro euro, garanti.
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={onConfirm}
            className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-violet-900/40 mb-3"
          >
            Commencer {trialDays} jour{trialDays > 1 ? 's' : ''} gratuit{trialDays > 1 ? 's' : ''} →
          </motion.button>
          <p className="text-center text-white/30 text-xs">0€ débité maintenant · Annulation 1 clic · Remboursement 30j</p>
        </div>
      </motion.div>
    </motion.div>
  )
}


// ─── CHECKOUT MODAL ────────────────────────────────────────────────────────────
function CheckoutModal({ plan, onClose }: { plan: 'weekly' | 'annual'; onClose: () => void }) {
  const nextMonday = getNextMonday18hParis()
  const fetchClientSecret = useCallback(async () => {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan, mode: 'embedded' }),
    })
    const data = await res.json()
    return data.clientSecret
  }, [plan])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <motion.div initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0, y: 20 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="relative w-full max-w-xl bg-[#0d0d1a] border border-violet-500/30 rounded-2xl overflow-hidden shadow-2xl shadow-violet-900/40" style={{ maxHeight: '90vh' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-gradient-to-r from-violet-900/30 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">F</span>
            </div>
            <div>
              <p className="text-white font-semibold text-sm">FOREAS — Entrez vos coordonnées</p>
              <p className="text-green-400 text-xs font-medium">0€ débité aujourd'hui · Premier débit le {formatDateFR(nextMonday)}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10">×</button>
        </div>
        <div className="flex items-center justify-center gap-4 px-5 py-2.5 bg-green-500/5 border-b border-green-500/10">
          {['SSL chiffré', 'Annulation 1 clic', 'Remboursement 30j'].map(t => (
            <span key={t} className="flex items-center gap-1.5 text-green-400 text-xs">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
              {t}
            </span>
          ))}
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 130px)' }}>
          <EmbeddedCheckoutProvider stripe={stripePromise} options={{ fetchClientSecret }}>
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>
      </motion.div>
    </motion.div>
  )
}

function SuccessBanner() {
  return (
    <motion.div initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-green-600 to-emerald-500 py-4 px-5 text-center shadow-xl">
      <p className="text-white font-semibold text-sm">🎉 Bienvenue dans FOREAS ! Votre abonnement est actif. Téléchargez l'app pour commencer.</p>
    </motion.div>
  )
}


// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────
function TarifsContent() {
  const searchParams = useSearchParams()
  const isSuccess = searchParams.get('success') === 'true'
  const [billingCycle, setBillingCycle] = useState<'weekly' | 'annual'>('weekly')
  const [flowState, setFlowState] = useState<'idle' | 'bridge' | 'checkout'>('idle')

  const openCheckout = () => setFlowState('bridge')
  const closeAll = () => setFlowState('idle')
  const confirmCheckout = () => setFlowState('checkout')

  const pricing: Record<'weekly' | 'annual', { price: number; perDay: number; period: string; savings: string | null; total?: number }> = {
    weekly: { price: 12.97, perDay: 1.85, period: '/semaine', savings: null },
    annual: { price: 9.97,  perDay: 1.42, period: '/semaine', savings: '23%', total: 518.44 },
  }
  const current = pricing[billingCycle]

  const features = [
    { icon: '🧠', title: 'Ajnaya IA Prédictive', desc: 'Anticipe les zones les plus rentables avant que la concurrence y arrive.', badge: '+35% CA' },
    { icon: '🗺️', title: 'Cartographie temps réel', desc: 'Snapshots géographiques Mapbox — événements, météo, affluence.', badge: 'Exclusif' },
    { icon: '⚡', title: 'Multi-plateformes', desc: 'Vue unifiée Uber, Bolt, Heetch — une seule app, zéro jonglage.', badge: '-23% temps mort' },
    { icon: '🔔', title: 'Alertes intelligentes', desc: 'Notifications contextuelles : "Aéroport dans 12 min — 5 chauffeurs seulement."', badge: 'Temps réel' },
    { icon: '📊', title: 'Performance & Analytics', desc: "Vos stats en un coup d'oeil. Comparez, ajustez, progressez.", badge: 'Insights pro' },
    { icon: '🌙', title: 'Mode nuit optimisé', desc: 'Stratégies adaptées aux pics nocturnes. Gagnez plus, dormez mieux.', badge: 'Nuit = x2' },
  ]

  const testimonials = [
    { name: 'Karim B.', city: 'Paris 15e', avatar: 'KB', gain: '+38% CA', quote: "Avant FOREAS je perdais 2h par jour en zones creuses. Maintenant Ajnaya me dit exactement où aller. C'est comme avoir un copilote qui connaît Paris mieux que moi.", stars: 5 },
    { name: 'Soufiane M.', city: 'Lyon Part-Dieu', avatar: 'SM', gain: '+412€/mois', quote: "J'étais sceptique au début. Résultat : 412€ de plus par mois. L'abonnement se paye en moins d'une course. C'est mathématique.", stars: 5 },
    { name: 'Théodore R.', city: 'Bordeaux Gare', avatar: 'TR', gain: '-28% fatigue', quote: "Le vrai gain c'est mental. Je prends moins de décisions inutiles. FOREAS pense pour moi sur les zones, moi je me concentre sur la conduite.", stars: 5 },
  ]

  const faqs = [
    { q: "Pourquoi vous demandez ma carte si c'est gratuit ?", a: "C'est la bonne question — on la comprend. Stripe (notre système de paiement) demande votre carte pour préparer l'abonnement APRÈS l'essai. Mais aucun montant n'est prélevé avant le premier lundi 18h suivant votre inscription. Si vous annulez avant cette date, vous ne payez absolument rien. C'est garanti et vérifiable sur votre relevé." },
    { q: "Combien de jours d'essai gratuit ?", a: "Entre 1 et 7 jours selon le jour de votre inscription. L'essai se termine toujours le lundi à 18h Paris — la date exacte vous est affichée avant de saisir votre carte." },
    { q: "L'IA fait des promesses réalistes ?", a: "Oui. FOREAS distingue données confirmées, estimations et simulations. Les +35% viennent des données réelles de nos 147 chauffeurs actifs." },
    { q: 'Puis-je annuler à tout moment ?', a: "Absolument. Pas de préavis, pas de frais. Depuis l'app ou par email en moins de 2 minutes." },
    { q: 'FOREAS remplace-t-il mes apps VTC ?', a: "Non — il les amplifie. Vous continuez à recevoir vos courses via Uber, Bolt ou Heetch. FOREAS se superpose pour vous aider entre les courses." },
    { q: 'Disponible sur iOS et Android ?', a: "Oui, les deux. Interface minimaliste et vocale, optimisée pour la conduite." },
  ]

  return (
    <div className="min-h-screen bg-[#070714] text-white overflow-x-hidden">
      {isSuccess && <SuccessBanner />}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-violet-800/15 rounded-full blur-[100px]" />
      </div>
      <Header />

      {/* Live bar */}
      <div className="relative border-b border-white/5 bg-black/30 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-center gap-3">
          <span className="flex items-center gap-1.5 text-green-400 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />147 chauffeurs actifs ce soir
          </span>
          <span className="text-white/20">·</span>
          <span className="text-white/50 text-xs">Plus que <span className="text-orange-400 font-semibold">23 places</span> au tarif découverte</span>
        </div>
      </div>

      {/* HERO */}
      <section className="relative pt-16 pb-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            {/* Badge — honnête, plus de "Aucune CB requise" */}
            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-1.5 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-300 text-xs font-semibold tracking-wide uppercase">0€ débité aujourd'hui · Essai gratuit jusqu'au lundi 18h</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-4">
              Vos concurrents gagnent{' '}
              <span className="bg-gradient-to-r from-violet-400 via-cyan-300 to-violet-400 bg-clip-text text-transparent">35% de plus.</span>
            </h1>
            <p className="text-white/60 text-lg sm:text-xl mb-2 max-w-2xl mx-auto leading-relaxed">
              Parce qu'ils ont FOREAS. L'IA qui prédit les zones, élimine le temps mort, et transforme chaque heure en chiffre d'affaires.
            </p>
            <p className="text-white/40 text-sm mb-10">147 chauffeurs · 3 villes · +38% CA moyen documenté</p>

            {/* Toggle */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <span className={'text-sm font-medium transition-colors ' + (billingCycle === 'weekly' ? 'text-white' : 'text-white/40')}>Hebdomadaire</span>
              <button onClick={() => setBillingCycle(c => c === 'weekly' ? 'annual' : 'weekly')} className={'relative w-12 h-6 rounded-full transition-colors ' + (billingCycle === 'annual' ? 'bg-violet-500' : 'bg-white/20')}>
                <span className={'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ' + (billingCycle === 'annual' ? 'translate-x-6' : '')} />
              </button>
              <span className={'text-sm font-medium transition-colors flex items-center gap-2 ' + (billingCycle === 'annual' ? 'text-white' : 'text-white/40')}>
                Annuel <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full font-semibold">-23%</span>
              </span>
            </div>

            {/* Price */}
            <motion.div key={billingCycle} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }} className="mb-8">
              <div className="flex items-end justify-center gap-2 mb-1">
                <span className="text-6xl sm:text-7xl font-black text-white">{current.price.toFixed(2).replace('.', ',')}€</span>
                <span className="text-white/50 text-lg mb-3">{current.period}</span>
              </div>
              <p className="text-violet-300 text-sm font-medium">soit {current.perDay.toFixed(2).replace('.', ',')}€/jour — le prix d'un café</p>
              {billingCycle === 'annual' && <p className="text-white/40 text-xs mt-1">Facturé {current.total?.toFixed(2).replace('.', ',')}€/an</p>}
            </motion.div>

            {/* CTA principal */}
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={openCheckout}
              className="relative overflow-hidden bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white font-bold py-4 px-10 rounded-2xl text-lg transition-all shadow-xl shadow-violet-900/50 mb-3"
              style={{ boxShadow: '0 0 40px rgba(139,92,246,0.4)' }}
            >
              Démarrer gratuitement →
            </motion.button>
            {/* Micro-texte honnête : carte requise mais 0€ maintenant */}
            <p className="text-white/35 text-xs mb-2">
              Carte requise · <strong className="text-white/55">0€ débité maintenant</strong> · Premier débit le lundi suivant à 18h
            </p>
            <div className="flex items-center justify-center gap-4 text-white/25 text-xs">
              <span>✓ Sans engagement</span><span>·</span><span>✓ Annulation 1 clic</span><span>·</span><span>✓ Remboursement 30j</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* KPIs */}
      <section className="py-12 px-4 border-y border-white/5">
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-4 sm:gap-8 text-center">
          {[
            { target: 35, suffix: '%', label: 'CA moyen en plus', color: 'from-violet-400 to-violet-300' },
            { target: 23, suffix: '%', label: 'Temps mort réduit', color: 'from-cyan-400 to-cyan-300' },
            { target: 2,  suffix: 'min', label: 'Pour voir les premières zones', color: 'from-green-400 to-green-300' },
          ].map((kpi, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
              <div className={'text-3xl sm:text-5xl font-extrabold bg-gradient-to-r ' + kpi.color + ' bg-clip-text text-transparent mb-1'}>
                <AnimatedCounter target={kpi.target} suffix={kpi.suffix} />
              </div>
              <p className="text-white/50 text-xs sm:text-sm">{kpi.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">Tout ce qu'Ajnaya fait pour vous</h2>
            <p className="text-white/50">Pendant que vous conduisez, l'IA travaille.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }} className="relative bg-white/3 border border-white/8 rounded-2xl p-5 hover:border-violet-500/30 hover:bg-violet-500/5 transition-all">
                <span className="absolute top-4 right-4 text-xs bg-violet-500/15 text-violet-300 px-2 py-0.5 rounded-full font-semibold">{f.badge}</span>
                <div className="text-2xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-white mb-1.5 text-sm">{f.title}</h3>
                <p className="text-white/50 text-xs leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-16 px-4 bg-white/2 border-y border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">Ils ont changé leur quotidien</h2>
            <p className="text-white/50">Des chauffeurs réels. Des chiffres réels.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-gradient-to-br from-white/5 to-white/2 border border-white/10 rounded-2xl p-5 hover:border-violet-500/20 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">{t.avatar}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm truncate">{t.name}</p>
                    <p className="text-white/40 text-xs truncate">{t.city}</p>
                  </div>
                  <span className="flex-shrink-0 bg-green-500/15 text-green-400 text-xs px-2 py-0.5 rounded-full font-bold">{t.gain}</span>
                </div>
                <div className="flex mb-3">{Array.from({ length: t.stars }).map((_, j) => <span key={j} className="text-yellow-400 text-sm">★</span>)}</div>
                <p className="text-white/70 text-xs leading-relaxed italic">"{t.quote}"</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PLAN CARD */}
      <section className="py-16 px-4">
        <div className="max-w-md mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-cyan-500 rounded-3xl blur opacity-25" />
            <div className="relative bg-gradient-to-br from-[#110c28] to-[#0d0d1a] border border-violet-500/30 rounded-2xl p-6 sm:p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <span className="text-xs font-bold text-violet-300 uppercase tracking-widest">FOREAS Pro</span>
                  <h3 className="text-2xl font-extrabold text-white mt-1">Tout inclus</h3>
                </div>
                <div className="bg-violet-500/15 border border-violet-500/20 rounded-xl px-3 py-1.5 text-center">
                  <p className="text-violet-300 text-xs font-medium">Essai</p>
                  <p className="text-violet-200 text-lg font-bold">Gratuit</p>
                </div>
              </div>
              <div className="space-y-3 mb-8">
                {['Ajnaya IA prédictive (temps réel)', 'Cartographie Mapbox HD', 'Multi-plateformes (Uber, Bolt, Heetch…)', 'Alertes intelligentes contextuelles', 'Analytics & historique complet', 'Mode nuit & événements locaux', 'Support prioritaire < 2h', 'Mises à jour IA continues'].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="text-white/80 text-sm">{item}</span>
                  </div>
                ))}
              </div>
              <motion.div key={billingCycle} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 p-4 bg-white/5 rounded-xl">
                <div className="flex items-end gap-2 mb-1">
                  <span className="text-4xl font-extrabold text-white">{current.price.toFixed(2).replace('.', ',')}€</span>
                  <span className="text-white/40 text-sm mb-1.5">{current.period}</span>
                  {billingCycle === 'annual' && <span className="mb-1.5 ml-auto bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full font-bold">-23%</span>}
                </div>
                <p className="text-violet-300 text-xs">= {current.perDay.toFixed(2).replace('.', ',')}€/jour · <strong>0€ débité avant le lundi 18h</strong></p>
              </motion.div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={openCheckout} className="w-full py-4 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white font-bold rounded-xl text-base transition-all shadow-lg shadow-violet-900/40">
                Commencer l'essai gratuit →
              </motion.button>
              <p className="text-center text-white/30 text-xs mt-4">Carte requise · 0€ débité maintenant · Annulation en 1 clic</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 border-t border-white/5">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3">Questions fréquentes</h2>
            <p className="text-white/40 text-sm">Tout ce que vous voulez savoir avant de commencer.</p>
          </div>
          {faqs.map((faq, i) => <FaqItem key={i} q={faq.q} a={faq.a} />)}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 leading-tight">
              Demain, vous pouvez gagner{' '}
              <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">35% de plus.</span>
            </h2>
            <p className="text-white/60 text-base mb-8">Ou continuer à chercher les zones au hasard.<br />Le choix vous appartient.</p>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={openCheckout} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white font-bold py-4 px-12 rounded-2xl text-lg transition-all" style={{ boxShadow: '0 0 60px rgba(139,92,246,0.5)' }}>
              Démarrer gratuitement →
            </motion.button>
            <div className="flex items-center justify-center gap-6 mt-6 text-white/30 text-xs">
              <span>🔒 SSL</span><span>✓ 0€ débité maintenant</span><span>🛡️ 30j remboursé</span><span>⭐ 4.9/5</span>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />

      {/* ─── FLOW : bridge → checkout ─── */}
      <AnimatePresence>
        {flowState === 'bridge' && (
          <TrialBridge plan={billingCycle} onConfirm={confirmCheckout} onClose={closeAll} />
        )}
        {flowState === 'checkout' && (
          <CheckoutModal plan={billingCycle} onClose={closeAll} />
        )}
      </AnimatePresence>
    </div>
  )
}

export default function TarifsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070714] flex items-center justify-center"><div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <TarifsContent />
    </Suspense>
  )
}

'use client'

import { useState, useEffect, useRef, Suspense, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { loadStripe } from '@stripe/stripe-js'
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js'
import { useSearchParams } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

// ─── Utils ───────────────────────────────────────────────────────────────────
function getNextMonday18hParis(): Date {
  const now = new Date()
  const dayOfWeek = now.getUTCDay()
  const daysToAdd = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 7 : 8 - dayOfWeek
  const monday = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000)
  const m = monday.getUTCMonth()
  const utcHour = (m >= 2 && m <= 9) ? 16 : 17
  monday.setUTCHours(utcHour, 0, 0, 0)
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

// ─── Trial Bridge ────────────────────────────────────────────────────────────
function TrialBridge({ planName, onConfirm, onClose }: { planName: string; onConfirm: () => void; onClose: () => void }) {
  const nextMonday = getNextMonday18hParis()
  const trialDays = Math.max(1, Math.round((nextMonday.getTime() - Date.now()) / 86400000))

  const steps = [
    { icon: '🎁', label: "Aujourd'hui", sub: `Accès complet FOREAS ${planName}`, hl: '0€ débité', hlC: 'text-green-400 bg-green-500/10', active: true },
    { icon: '📱', label: `${trialDays} jour${trialDays > 1 ? 's' : ''} d'essai`, sub: 'Testez Ajnaya sur vos vraies courses', hl: null, hlC: '', active: false },
    { icon: '📅', label: `${formatDateFR(nextMonday)} à 18h`, sub: "Fin de l'essai", hl: 'Annulez avant → 0€', hlC: 'text-blue-300 bg-blue-500/10', active: false },
    { icon: '💳', label: 'Premier débit', sub: 'Annulable en 1 clic', hl: null, hlC: '', active: false },
  ]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <motion.div initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0, y: 20 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="relative w-full max-w-md bg-[#0d0d1a] border border-blue-500/30 rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-blue-500/10 bg-gradient-to-r from-blue-900/30 to-transparent">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/30"><span className="text-sm font-black text-white">F</span><div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-[#0d0d1a]" /></div>
            <div><p className="text-white font-bold text-sm">FOREAS {planName}</p><p className="text-blue-300 text-xs font-medium">Paiement sécurisé · Transparent</p></div>
          </div>
          <button onClick={onClose} className="text-white/55 hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10">×</button>
        </div>
        <div className="px-5 pt-5 pb-6">
          <div className="space-y-0 mb-6">
            {steps.map((s, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={'w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ' + (s.active ? 'bg-green-500/20 ring-2 ring-green-500/40' : 'bg-white/5')}>{s.icon}</div>
                  {i < steps.length - 1 && <div className="w-px flex-1 my-1 bg-white/10" style={{ minHeight: '20px' }} />}
                </div>
                <div className="pb-4 pt-0.5 flex-1">
                  <p className={'text-sm font-semibold ' + (s.active ? 'text-white' : 'text-white/70')}>{s.label}</p>
                  <p className="text-white/60 text-xs mt-0.5">{s.sub}</p>
                  {s.hl && <span className={'inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ' + s.hlC}>{s.hl}</span>}
                </div>
              </div>
            ))}
          </div>
          <div className="bg-blue-500/[0.08] border border-blue-500/15 rounded-xl p-4 mb-5">
            <div className="flex items-start gap-2.5">
              <span className="text-base mt-0.5">🔒</span>
              <div>
                <p className="text-white/90 text-sm font-semibold mb-1">Pourquoi votre carte est demandée ?</p>
                <p className="text-white/55 text-xs leading-relaxed">Stripe prépare l'abonnement <strong className="text-white/80">après</strong> l'essai. <strong className="text-white/80">Aucun montant débité aujourd'hui.</strong> Annulez avant le {formatDateFR(nextMonday)} — c'est zéro euro, garanti.</p>
              </div>
            </div>
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={onConfirm} className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-blue-900/40 mb-3">
            Commencer {trialDays} jour{trialDays > 1 ? 's' : ''} gratuit{trialDays > 1 ? 's' : ''} →
          </motion.button>
          <p className="text-center text-white/50 text-xs">0€ débité maintenant · Annulation 1 clic · Remboursement 30j</p>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Checkout Modal ──────────────────────────────────────────────────────────
function CheckoutModal({ planId, billing, onClose }: { planId: string; billing: 'weekly' | 'annual'; onClose: () => void }) {
  const nextMonday = getNextMonday18hParis()
  const fetchClientSecret = useCallback(async () => {
    const res = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan: `${planId}_${billing}`, mode: 'embedded' }) })
    const data = await res.json()
    return data.clientSecret
  }, [planId, billing])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <motion.div initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0, y: 20 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="relative w-full max-w-xl bg-[#0d0d1a] border border-violet-500/30 rounded-2xl overflow-hidden shadow-2xl" style={{ maxHeight: '90vh' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-gradient-to-r from-violet-900/30 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center"><span className="text-[10px] font-bold text-white">F</span></div>
            <div><p className="text-white font-semibold text-sm">FOREAS — Coordonnées</p><p className="text-green-400 text-xs font-medium">0€ débité · Premier débit le {formatDateFR(nextMonday)}</p></div>
          </div>
          <button onClick={onClose} className="text-white/55 hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10">×</button>
        </div>
        <div className="flex items-center justify-center gap-4 px-5 py-2.5 bg-green-500/5 border-b border-green-500/10">
          {['SSL chiffré', 'Annulation 1 clic', 'Remboursement 30j'].map(t => (
            <span key={t} className="flex items-center gap-1.5 text-green-400 text-xs">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>{t}
            </span>
          ))}
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 130px)' }}>
          <EmbeddedCheckoutProvider stripe={stripePromise} options={{ fetchClientSecret }}><EmbeddedCheckout /></EmbeddedCheckoutProvider>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Plan Data ───────────────────────────────────────────────────────────────
interface Plan {
  id: string; name: string; tagline: string
  weeklyPrice: number; annualWeeklyPrice: number
  features: { text: string; ok: boolean; star?: boolean }[]
  cta: string; style: string; popular?: boolean
}

const PLANS: Plan[] = [
  {
    id: 'essentiel', name: 'Essentiel', tagline: 'Pour démarrer sereinement',
    weeklyPrice: 9.97, annualWeeklyPrice: 7.97,
    features: [
      { text: 'Tableau de bord courses', ok: true },
      { text: 'Suivi revenus multi-plateformes', ok: true },
      { text: 'Communauté chauffeurs', ok: true },
      { text: 'Abonnement VTC inclus', ok: true },
      { text: 'Ajnaya IA conduite + voix', ok: false },
      { text: 'Site driver perso + QR code', ok: false },
      { text: 'Parrainage 10€/filleul (à vie)', ok: false },
      { text: 'Compta IA', ok: false },
    ],
    cta: 'Commencer', style: 'bg-white/[0.06] border border-white/15 hover:bg-white/10 text-white',
  },
  {
    id: 'pro', name: 'Pro', tagline: 'Tout pour dominer le terrain',
    weeklyPrice: 12.97, annualWeeklyPrice: 10.37, popular: true,
    features: [
      { text: 'Tout Essentiel inclus', ok: true, star: true },
      { text: 'Ajnaya IA conduite + voix', ok: true, star: true },
      { text: 'Site driver perso + QR code', ok: true, star: true },
      { text: 'Parrainage 10€/filleul (à vie)', ok: true },
      { text: 'Données temps réel Sonar + Bolt', ok: true },
      { text: 'Zones chaudes + alertes surge', ok: true },
      { text: 'Stats avancées €/h, €/km', ok: true },
      { text: 'Compta IA illimitée', ok: false },
    ],
    cta: 'Choisir Pro', style: 'bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white shadow-lg shadow-violet-900/40',
  },
  {
    id: 'vip', name: 'VIP', tagline: "L'avantage unfair. Sans limites.",
    weeklyPrice: 24.97, annualWeeklyPrice: 19.97,
    features: [
      { text: 'Tout Pro inclus', ok: true, star: true },
      { text: 'Compta IA illimitée + export fiscal', ok: true, star: true },
      { text: 'Support prioritaire 24/7', ok: true, star: true },
      { text: 'Badge VIP communauté', ok: true },
      { text: 'Accès beta nouvelles fonctions', ok: true },
      { text: 'Coaching IA personnalisé', ok: true },
      { text: 'Parrainage 3 niveaux complet', ok: true },
      { text: 'Analytics prédictives avancées', ok: true },
    ],
    cta: 'Devenir VIP', style: 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold shadow-lg shadow-amber-900/30',
  },
]

// ─── Main ────────────────────────────────────────────────────────────────────
function TarifsContent() {
  const searchParams = useSearchParams()
  const isSuccess = searchParams.get('success') === 'true'
  const [billing, setBilling] = useState<'weekly' | 'annual'>('weekly')
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [flowState, setFlowState] = useState<'idle' | 'bridge' | 'checkout'>('idle')

  const openFlow = (plan: Plan) => { setSelectedPlan(plan); setFlowState('bridge') }
  const closeAll = () => { setFlowState('idle'); setSelectedPlan(null) }
  const confirmCheckout = () => setFlowState('checkout')

  const faqs = [
    { q: 'Quelle différence entre les 3 plans ?', a: "Essentiel = tableau de bord + suivi. Pro = tout + Ajnaya IA + site driver + parrainage. VIP = Pro + compta IA illimitée + support 24/7 + coaching. 80% des chauffeurs choisissent Pro." },
    { q: "Pourquoi la carte est demandée si c'est gratuit ?", a: "Stripe prépare l'abonnement après l'essai. Aucun montant débité avant le premier lundi 18h. Annulez avant = 0€." },
    { q: "Le parrainage, c'est vraiment à vie ?", a: "Oui. Tant que ton filleul reste abonné et que toi aussi. 10€/filleul direct (N1), 4€ au N2, 2€ au N3. Versement après 4 semaines complètes." },
    { q: 'Puis-je changer de plan ?', a: "Oui, upgrade ou downgrade à tout moment. Prorata automatique." },
    { q: "C'est quoi Ajnaya ?", a: "Ton copilote IA conduite. Analyse zones, trafic, événements en temps réel. Utilisable en vocal. Disponible à partir du plan Pro." },
    { q: 'Puis-je annuler à tout moment ?', a: "Sans engagement. Annulation 1 clic depuis l'app." },
  ]

  return (
    <div className="min-h-screen bg-[#070714] text-white overflow-x-hidden">
      {isSuccess && (
        <motion.div initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-green-600 to-emerald-500 py-4 px-5 text-center shadow-xl">
          <p className="text-white font-semibold text-sm">🎉 Bienvenue ! Votre abonnement est actif. Téléchargez l'app.</p>
        </motion.div>
      )}

      {/* Background blurs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-violet-800/15 rounded-full blur-[100px]" />
      </div>

      <Header />

      {/* Live bar */}
      <div className="relative border-b border-white/5 bg-black/30 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-center gap-3">
          <span className="flex items-center gap-1.5 text-green-400 text-xs font-medium"><span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />847 chauffeurs actifs</span>
          <span className="text-white/20">·</span>
          <span className="text-white/50 text-xs">Plus que <span className="text-orange-400 font-semibold">23 places</span> au tarif découverte</span>
        </div>
      </div>

      {/* ── HERO ── */}
      <section className="relative pt-16 pb-8 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-1.5 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-300 text-xs font-semibold tracking-wide uppercase">0€ débité aujourd'hui · Essai gratuit</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-4">
              Choisis ton{' '}
              <span className="bg-gradient-to-r from-violet-400 via-cyan-300 to-violet-400 bg-clip-text text-transparent">avantage.</span>
            </h1>
            <p className="text-white/60 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
              3 plans. 1 seul objectif : que chaque heure de conduite te rapporte plus.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── TOGGLE ── */}
      <div className="flex items-center justify-center gap-4 mb-10">
        <span className={'text-sm font-medium transition-colors ' + (billing === 'weekly' ? 'text-white' : 'text-white/40')}>Hebdomadaire</span>
        <button onClick={() => setBilling(c => c === 'weekly' ? 'annual' : 'weekly')} className={'relative w-12 h-6 rounded-full transition-colors ' + (billing === 'annual' ? 'bg-violet-500' : 'bg-white/20')}>
          <span className={'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ' + (billing === 'annual' ? 'translate-x-6' : '')} />
        </button>
        <span className={'text-sm font-medium transition-colors flex items-center gap-2 ' + (billing === 'annual' ? 'text-white' : 'text-white/40')}>
          Annuel <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full font-semibold">-20%</span>
        </span>
      </div>

      {/* ── 3 PRICING CARDS ── */}
      <section className="px-4 pb-20">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
          {PLANS.map((plan, i) => {
            const price = billing === 'weekly' ? plan.weeklyPrice : plan.annualWeeklyPrice
            const perDay = (price / 7).toFixed(2).replace('.', ',')
            return (
              <motion.div key={plan.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1, duration: 0.5 }}
                className={`relative rounded-2xl p-6 sm:p-7 border transition-all ${plan.popular ? 'border-violet-500/40 bg-gradient-to-b from-violet-900/15 to-[#0d0d1a] shadow-xl shadow-violet-900/20 md:-mt-4 md:pb-10' : 'border-white/[0.08] bg-white/[0.02] hover:border-white/15'}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-600 to-violet-500 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1 rounded-full whitespace-nowrap">Le plus populaire</div>
                )}
                <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-1">{plan.name}</p>
                <p className="text-sm text-white/70 mb-5 min-h-[36px]">{plan.tagline}</p>

                <motion.div key={billing} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}>
                  <div className="flex items-end gap-1.5 mb-1">
                    {billing === 'annual' && <span className="text-white/30 line-through text-lg mb-1">{plan.weeklyPrice.toFixed(2).replace('.', ',')}€</span>}
                    <span className="text-4xl sm:text-5xl font-black text-white">{price.toFixed(2).replace('.', ',')}€</span>
                    <span className="text-white/50 text-sm mb-2">/sem</span>
                  </div>
                  <p className="text-violet-300/70 text-xs mb-1">
                    soit {perDay}€/jour {plan.popular && <span className="text-violet-300 font-semibold">— moins cher qu'un café ☕</span>}
                  </p>
                  {plan.popular && (
                    <p className="text-green-400/80 text-[11px] font-medium mt-1">💡 Se rembourse en moins d'une course supplémentaire</p>
                  )}
                  {billing === 'annual' && <p className="text-white/40 text-xs mt-1">Facturé {(plan.annualWeeklyPrice * 52).toFixed(2).replace('.', ',')}€/an</p>}
                </motion.div>

                <div className="h-px bg-white/[0.08] my-5" />

                <div className="space-y-1 mb-6">
                  {plan.features.map((f, j) => (
                    <div key={j} className="flex items-start gap-2.5 py-0.5">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${f.ok ? (f.star ? 'bg-violet-500/25' : 'bg-violet-500/15') : 'bg-white/5'}`}>
                        {f.ok ? (
                          <svg className={`w-3 h-3 ${f.star ? 'text-violet-300' : 'text-violet-400/80'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        ) : (
                          <span className="text-white/20 text-xs">×</span>
                        )}
                      </div>
                      <span className={`text-sm leading-tight ${f.ok ? (f.star ? 'text-white font-semibold' : 'text-white/75') : 'text-white/30 line-through'}`}>{f.text}</span>
                    </div>
                  ))}
                </div>

                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => openFlow(plan)} className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all ${plan.style}`}>
                  {plan.cta} →
                </motion.button>
                <p className="text-center text-white/40 text-[10px] mt-3">0€ débité · Essai gratuit · Sans engagement</p>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* ── KPIs ── */}
      <section className="py-12 px-4 border-y border-white/5">
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-4 sm:gap-8 text-center">
          {[
            { target: 35, suffix: '%', label: 'CA moyen en plus', color: 'from-violet-400 to-violet-300' },
            { target: 23, suffix: '%', label: 'Temps mort réduit', color: 'from-cyan-400 to-cyan-300' },
            { target: 2, suffix: 'min', label: 'Pour voir les zones', color: 'from-green-400 to-green-300' },
          ].map((kpi, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
              <div className={'text-3xl sm:text-5xl font-extrabold bg-gradient-to-r ' + kpi.color + ' bg-clip-text text-transparent mb-1'}><AnimatedCounter target={kpi.target} suffix={kpi.suffix} /></div>
              <p className="text-white/50 text-xs sm:text-sm">{kpi.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-16 px-4 bg-white/[0.02] border-b border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">Ils ont changé leur quotidien</h2>
            <p className="text-white/50">Des chauffeurs réels. Des chiffres réels.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { name: 'Karim B.', city: 'Paris 15e', avatar: 'KB', gain: '+38% CA', quote: "Ajnaya me dit exactement où aller. C'est comme un copilote qui connaît Paris mieux que moi.", stars: 5 },
              { name: 'Soufiane M.', city: 'Lyon', avatar: 'SM', gain: '+412€/mois', quote: "412€ de plus par mois. L'abonnement se paye en moins d'une course. C'est mathématique.", stars: 5 },
              { name: 'Théodore R.', city: 'Bordeaux', avatar: 'TR', gain: '-28% fatigue', quote: "Le vrai gain c'est mental. FOREAS pense pour moi sur les zones, moi je conduis.", stars: 5 },
            ].map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-5 hover:border-violet-500/20 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">{t.avatar}</div>
                  <div className="flex-1 min-w-0"><p className="font-semibold text-white text-sm truncate">{t.name}</p><p className="text-white/60 text-xs truncate">{t.city}</p></div>
                  <span className="bg-green-500/15 text-green-400 text-xs px-2 py-0.5 rounded-full font-bold">{t.gain}</span>
                </div>
                <div className="flex mb-3">{Array.from({ length: t.stars }).map((_, j) => <span key={j} className="text-yellow-400 text-sm">★</span>)}</div>
                <p className="text-white/70 text-xs leading-relaxed italic">"{t.quote}"</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GUARANTEE ── */}
      <section className="py-12 px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8">
            <div className="text-4xl mb-4">🛡️</div>
            <h3 className="text-xl font-bold mb-2">Satisfait ou remboursé. 14 jours.</h3>
            <p className="text-white/55 text-sm leading-relaxed">Teste FOREAS sans risque. Pas convaincu ? Remboursement intégral. Sans question.</p>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 px-4 border-t border-white/5">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3">Questions fréquentes</h2>
            <p className="text-white/60 text-sm">Tout ce que tu veux savoir avant de commencer.</p>
          </div>
          {faqs.map((faq, i) => <FaqItem key={i} q={faq.q} a={faq.a} />)}
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 leading-tight">
              Demain, tu peux gagner{' '}
              <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">35% de plus.</span>
            </h2>
            <p className="text-white/60 text-base mb-3">Ou continuer à chercher les zones au hasard.</p>
            <p className="text-violet-300/70 text-sm mb-8">Pour le prix d'un café par jour, Ajnaya te trouve les zones qui payent. ☕</p>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={() => openFlow(PLANS[1])} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white font-bold py-4 px-12 rounded-2xl text-lg transition-all" style={{ boxShadow: '0 0 60px rgba(139,92,246,0.5)' }}>
              Démarrer gratuitement →
            </motion.button>
            <div className="flex items-center justify-center gap-6 mt-6 text-white/50 text-xs">
              <span>🔒 SSL</span><span>✓ 0€ débité</span><span>🛡️ 30j remboursé</span><span>⭐ 4.9/5</span>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />

      {/* ── Flow bridge → checkout ── */}
      <AnimatePresence>
        {flowState === 'bridge' && selectedPlan && <TrialBridge planName={selectedPlan.name} onConfirm={confirmCheckout} onClose={closeAll} />}
        {flowState === 'checkout' && selectedPlan && <CheckoutModal planId={selectedPlan.id} billing={billing} onClose={closeAll} />}
      </AnimatePresence>
    </div>
  )
}

export default function Tarifs2Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070714] flex items-center justify-center"><div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <TarifsContent />
    </Suspense>
  )
}

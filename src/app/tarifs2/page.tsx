'use client'

import { useState, useEffect, useRef, Suspense, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { loadStripe } from '@stripe/stripe-js'
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js'
import { useSearchParams } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { trackInitiateCheckout } from '@/lib/tracking'   // v58 — Meta CAPI server+client

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
    { icon: '📱', label: `${trialDays} jour${trialDays > 1 ? 's' : ''} pour tester`, sub: 'Tu testes Ajnaya sur tes vraies courses', hl: null, hlC: '', active: false },
    { icon: '📅', label: `${formatDateFR(nextMonday)} à 18h`, sub: "Fin de l'essai — tu décides", hl: 'Annule avant → 0€', hlC: 'text-blue-300 bg-blue-500/10', active: false },
    { icon: '💳', label: 'Premier débit (si tu restes)', sub: 'Annulable en 1 clic, à n\'importe quel moment', hl: null, hlC: '', active: false },
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
                <p className="text-white/90 text-sm font-semibold mb-1">Pourquoi tu me demandes une carte ?</p>
                <p className="text-white/60 text-xs leading-relaxed">Stripe la garde de côté pour activer ton abo <strong className="text-white/85">après</strong> l'essai — pas avant. <strong className="text-white/85">0€ aujourd'hui, 0€ jusqu'au {formatDateFR(nextMonday)} 18h.</strong> Si t'annules avant, il n'y a rien à payer. C'est tout.</p>
              </div>
            </div>
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={onConfirm} className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-blue-900/40 mb-3">
            Démarrer {trialDays} jour{trialDays > 1 ? 's' : ''} (0€ aujourd'hui) →
          </motion.button>
          <p className="text-center text-white/50 text-xs">0€ aujourd'hui · Annulation 1 clic · Stripe sécurisé</p>
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
    id: 'essentiel', name: 'Essentiel', tagline: 'Le minimum pour pas conduire à l\'aveugle.',
    weeklyPrice: 9.97, annualWeeklyPrice: 7.97,
    features: [
      { text: 'Tableau de bord toutes plateformes (Uber, Bolt, Heetch)', ok: true },
      { text: 'Tes vrais chiffres (€/h, €/km, marge nette)', ok: true },
      { text: 'Communauté FOREAS (1 200+ chauffeurs)', ok: true },
      { text: 'Abonnement plateforme VTC inclus', ok: true },
      { text: 'Ajnaya IA — celle qui te dit où aller', ok: false },
      { text: 'Ton site driver perso (foreas.xyz/ton-prénom)', ok: false },
      { text: 'Parrainage 10€/filleul à vie', ok: false },
      { text: 'Compta IA (livre recettes auto)', ok: false },
    ],
    cta: 'Démarrer Essentiel', style: 'bg-white/[0.06] border border-white/15 hover:bg-white/10 text-white',
  },
  {
    id: 'pro', name: 'Pro', tagline: 'Le plan que 8 chauffeurs sur 10 prennent.',
    weeklyPrice: 12.97, annualWeeklyPrice: 10.37, popular: true,
    features: [
      { text: 'Tout Essentiel inclus', ok: true, star: true },
      { text: 'Ajnaya IA — vocal + texte, te dit où aller', ok: true, star: true },
      { text: 'Ton site driver perso (foreas.xyz/ton-prénom)', ok: true, star: true },
      { text: 'Parrainage 10€/filleul à vie (4€ N2 · 2€ N3)', ok: true },
      { text: 'Surge temps réel Uber + Bolt + Heetch', ok: true },
      { text: 'Alertes zones chaudes (push + vocal)', ok: true },
      { text: 'Stats €/h, €/km, retour à vide', ok: true },
      { text: 'Compta IA (livre recettes auto)', ok: false },
    ],
    cta: 'Activer Ajnaya — 7 jours gratuit', style: 'bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white shadow-lg shadow-violet-900/40',
  },
  {
    id: 'vip', name: 'VIP', tagline: 'Tout Pro + ta compta tourne toute seule.',
    weeklyPrice: 24.97, annualWeeklyPrice: 19.97,
    features: [
      { text: 'Tout Pro inclus', ok: true, star: true },
      { text: 'Compta IA illimitée (livre recettes + export URSSAF)', ok: true, star: true },
      { text: 'Support 24/7 prioritaire (réponse < 4h)', ok: true, star: true },
      { text: 'Badge VIP dans la communauté', ok: true },
      { text: 'Accès beta avant tout le monde', ok: true },
      { text: 'Audit IA hebdo de tes courses', ok: true },
      { text: 'Parrainage cascade complète (N1 + N2 + N3)', ok: true },
      { text: 'Prédiction zones rentables 7 jours à l\'avance', ok: true },
    ],
    cta: 'Passer en VIP', style: 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold shadow-lg shadow-amber-900/30',
  },
]

// ─── Main ────────────────────────────────────────────────────────────────────
function TarifsContent() {
  const searchParams = useSearchParams()
  const isSuccess = searchParams.get('success') === 'true'
  const [billing, setBilling] = useState<'weekly' | 'annual'>('weekly')
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [flowState, setFlowState] = useState<'idle' | 'bridge' | 'checkout'>('idle')

  const openFlow = (plan: Plan) => {
    setSelectedPlan(plan)
    setFlowState('bridge')
    // v58 — Meta CAPI InitiateCheckout (Lead + InitiateCheckout = backbone attribution CTWA)
    // tracking.ts envoie en parallèle pixel client (fbq) + CAPI server-side avec eventID dedup
    const price = billing === 'weekly' ? plan.weeklyPrice : plan.annualWeeklyPrice
    trackInitiateCheckout(plan.name, price)
  }
  const closeAll = () => { setFlowState('idle'); setSelectedPlan(null) }
  const confirmCheckout = () => setFlowState('checkout')

  const faqs = [
    { q: "C'est quoi la vraie différence entre les 3 plans ?", a: "Essentiel = tu as les chiffres, tu décides seul. Pro = Ajnaya décide AVEC toi (le plan choisi par 8/10 chauffeurs). VIP = en plus, ta compta tourne toute seule (livre recettes auto, export URSSAF, fini le comptable à 90€/h)." },
    { q: "Pourquoi tu me demandes une carte si c'est gratuit ?", a: "Stripe la garde de côté pour activer ton abo APRÈS l'essai — pas avant. 0€ jusqu'à dimanche 18h. Tu annules en 1 clic depuis l'app, où que tu sois. Si t'annules avant dimanche, il n'y a rien à payer. Point." },
    { q: "10€/filleul à vie, c'est un piège quelque part ?", a: "Non. Tant que ton filleul reste abonné ET que toi aussi, tu touches 10€/mois sur lui (N1). Plus 4€ s'il parraine quelqu'un (N2). Plus 2€ s'il parraine encore (N3). Versé après 4 semaines complètes, virement automatique. Pas de plafond, pas d'expiration." },
    { q: "J'ai déjà essayé d'autres outils. Pourquoi celui-là ?", a: "Parce que les autres te donnent des données — toi tu dois faire le tri. Ajnaya te dit où aller MAINTENANT, à la prochaine course. C'est pas un dashboard de plus. C'est le seul qui prend la décision avec toi en temps réel." },
    { q: "Et si Uber me désactive du jour au lendemain ?", a: "Justement. C'est le scénario pour lequel FOREAS existe. Ajnaya gère Uber + Bolt + Heetch en parallèle. Si une plateforme te coupe, tu redistribues ton temps sur les autres en 1 minute. La communauté FOREAS te briefe aussi sur les bons réflexes pour récupérer ton compte." },
    { q: "Ajnaya, c'est une IA qui parle ou un truc qui m'observe ?", a: "Les deux, à ton choix. Tu lui parles (vocal naturel) ou tu lis. Elle voit en temps réel les zones, le trafic, les événements, le surge multi-plateformes. Elle te dit où aller — et où NE PAS aller. Disponible à partir du plan Pro." },
    { q: "Je peux changer de plan en cours ?", a: "Oui, à tout moment. Up ou down. Prorata calculé automatiquement. Pas de pénalité, pas d'appel à un commercial à 19h le vendredi." },
    { q: "Et si je veux arrêter dans 3 mois ?", a: "Tu cliques 'Annuler', tu confirmes, c'est annulé. Pas de relance, pas de mail manipulateur, pas d'appel. Sans engagement = sans engagement." },
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
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-center gap-3 flex-wrap">
          <span className="flex items-center gap-1.5 text-green-400 text-xs font-medium"><span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />147 chauffeurs sur l'essai cette semaine</span>
          <span className="text-white/20 hidden sm:inline">·</span>
          <span className="text-white/50 text-xs">Tarif découverte <span className="text-orange-400 font-semibold">clos à 500 abonnés</span></span>
        </div>
      </div>

      {/* ── HERO ── */}
      <section className="relative pt-16 pb-8 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-1.5 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-300 text-xs font-semibold tracking-wide uppercase">0€ aujourd'hui · 0€ jusqu'à dimanche · Annulation 1 clic</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-4">
              Tu fais combien net{' '}
              <span className="bg-gradient-to-r from-violet-400 via-cyan-300 to-violet-400 bg-clip-text text-transparent">cette semaine&nbsp;?</span>
            </h1>
            <p className="text-white/70 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
              Karim&nbsp;: <span className="text-white font-semibold">+387&nbsp;€ ce mois-ci</span>. Sans une heure en plus.<br className="hidden sm:block" />
              <span className="text-white/55 text-base">Pas de magie. L'IA Ajnaya te dit où aller, quand, et combien tu vas faire. C'est tout.</span>
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── TOGGLE ── */}
      <div className="flex items-center justify-center gap-4 mb-10">
        <span className={'text-sm font-medium transition-colors ' + (billing === 'weekly' ? 'text-white' : 'text-white/40')}>Hebdo (sans engagement)</span>
        <button onClick={() => setBilling(c => c === 'weekly' ? 'annual' : 'weekly')} className={'relative w-12 h-6 rounded-full transition-colors ' + (billing === 'annual' ? 'bg-violet-500' : 'bg-white/20')}>
          <span className={'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ' + (billing === 'annual' ? 'translate-x-6' : '')} />
        </button>
        <span className={'text-sm font-medium transition-colors flex items-center gap-2 ' + (billing === 'annual' ? 'text-white' : 'text-white/40')}>
          Annuel <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full font-semibold">−135€/an</span>
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
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-600 to-violet-500 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1 rounded-full whitespace-nowrap">Le plus pris · 8/10 chauffeurs</div>
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
                    soit {perDay}€/jour {plan.popular && <span className="text-violet-300 font-semibold">— le prix d'un péage</span>}
                  </p>
                  {plan.popular && (
                    <p className="text-green-400/80 text-[11px] font-medium mt-1">💡 Une seule course no-show = ton mois remboursé</p>
                  )}
                  {billing === 'annual' && <p className="text-white/40 text-xs mt-1">Facturé {(plan.annualWeeklyPrice * 52).toFixed(2).replace('.', ',')}€/an · sans engagement annuel</p>}
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
                <p className="text-center text-white/40 text-[10px] mt-3">0€ aujourd'hui · 0€ jusqu'à dimanche · Annulation 1 clic</p>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* ── KPIs ── */}
      <section className="py-12 px-4 border-y border-white/5">
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-4 sm:gap-8 text-center">
          {[
            { target: 387, suffix: '€', label: 'gagnés en plus / mois', color: 'from-violet-400 to-violet-300' },
            { target: 3, suffix: 'h', label: 'temps mort en moins / jour', color: 'from-cyan-400 to-cyan-300' },
            { target: 90, suffix: 'sec', label: 'pour ton 1er insight Ajnaya', color: 'from-green-400 to-green-300' },
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
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">Pas des promesses. Des virements.</h2>
            <p className="text-white/55">3 chauffeurs. 3 villes. 3 trajectoires.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { name: 'Karim B.', city: 'Paris 15e', avatar: 'KB', gain: '+387€ / mois', quote: "Avant je tournais en rond. Maintenant je sais où je vais et combien je vais faire. Ça change pas le métier — ça change ma marge.", stars: 5 },
              { name: 'Soufiane M.', city: 'Lyon', avatar: 'SM', gain: '+412€ / mois', quote: "412€ de plus le premier mois. L'abo se paie en une course. Le reste, c'est du bonus.", stars: 5 },
              { name: 'Théodore R.', city: 'Bordeaux', avatar: 'TR', gain: '-3h / jour à vide', quote: "Le vrai gain n'est pas dans mon compte. Il est dans ma tête. Je conduis, Ajnaya pense.", stars: 5 },
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
            <h3 className="text-xl font-bold mb-2">Si t'es pas convaincu en 7 jours, tu paies rien.</h3>
            <p className="text-white/60 text-sm leading-relaxed">0€ aujourd'hui. 0€ jusqu'à dimanche 18h. Si t'as un doute, tu fermes l'app — y'a rien à annuler. Si tu restes, c'est que ça vaut le coup.</p>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 px-4 border-t border-white/5">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3">Les questions qu'on nous pose tout le temps.</h2>
            <p className="text-white/60 text-sm">Si tu hésites, c'est normal — voilà les vraies réponses.</p>
          </div>
          {faqs.map((faq, i) => <FaqItem key={i} q={faq.q} a={faq.a} />)}
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 leading-tight">
              Dans 7 jours,{' '}
              <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">tu sauras.</span>
            </h2>
            <p className="text-white/70 text-base mb-3">Soit Ajnaya t'a fait gagner +28€/jour de moyenne. Soit tu fermes, tu paies rien, tu continues comme avant.</p>
            <p className="text-violet-300/80 text-sm mb-8">La seule question : tu préfères savoir, ou pas&nbsp;?</p>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={() => openFlow(PLANS[1])} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white font-bold py-4 px-12 rounded-2xl text-lg transition-all" style={{ boxShadow: '0 0 60px rgba(139,92,246,0.5)' }}>
              Activer mon essai 7 jours (0€) →
            </motion.button>
            <div className="flex items-center justify-center gap-6 mt-6 text-white/50 text-xs flex-wrap">
              <span>🔒 Stripe SSL</span><span>✓ 0€ aujourd'hui</span><span>🛡️ Annulation 1 clic</span><span>⭐ 4.9/5</span>
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

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
    { icon: '📅', label: `${formatDateFR(nextMonday)} à 18h`, sub: "Fin de l'essai — vous décidez", hl: 'Annulez avant → 0€', hlC: 'text-blue-300 bg-blue-500/10', active: false },
    { icon: '💳', label: 'Premier débit (si vous restez)', sub: 'Annulable en 1 clic, à n\'importe quel moment', hl: null, hlC: '', active: false },
  ]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <motion.div initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0, y: 20 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="relative w-full max-w-md bg-black border border-blue-500/30 rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-blue-500/10 bg-gradient-to-r from-blue-900/30 to-transparent">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-violet-500/30"><span className="text-sm font-black text-white">F</span><div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-black" /></div>
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
                <p className="text-white/90 text-sm font-semibold mb-1">Pourquoi une carte est demandée ?</p>
                <p className="text-white/60 text-xs leading-relaxed">Stripe la garde de côté pour activer votre abonnement <strong className="text-white/85">après</strong> l'essai — pas avant. <strong className="text-white/85">0€ aujourd'hui, 0€ jusqu'au {formatDateFR(nextMonday)} 18h.</strong> Si vous annulez avant, il n'y a rien à payer. C'est tout.</p>
              </div>
            </div>
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={onConfirm} className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-blue-900/40 mb-3">
            Démarrer mes {trialDays} jour{trialDays > 1 ? 's' : ''} (0€ aujourd&apos;hui) →
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
      <motion.div initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0, y: 20 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="relative w-full max-w-xl bg-black border border-violet-500/30 rounded-2xl overflow-hidden shadow-2xl" style={{ maxHeight: '90vh' }}>
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
    id: 'essentiel', name: 'Essentiel', tagline: 'Le minimum pour ne pas conduire à l\'aveugle.',
    weeklyPrice: 9.97, annualWeeklyPrice: 7.97,
    features: [
      { text: 'Tableau de bord toutes plateformes (Uber, Bolt, Heetch)', ok: true },
      { text: 'Tes vrais chiffres (€/h, €/km, marge nette)', ok: true },
      { text: 'Communauté FOREAS (1 200+ chauffeurs)', ok: true },
      { text: 'Abonnement plateforme VTC inclus', ok: true },
      { text: 'Ajnaya IA — celle qui vous dit où aller', ok: false },
      { text: 'Votre site driver perso (foreas.xyz/votre-prénom)', ok: false },
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
      { text: 'Ajnaya IA — vocal + texte, vous dit où aller', ok: true, star: true },
      { text: 'Votre site driver perso (foreas.xyz/votre-prénom)', ok: true, star: true },
      { text: 'Parrainage 10€/filleul à vie (4€ N2 · 2€ N3)', ok: true },
      { text: 'Surge temps réel Uber + Bolt + Heetch', ok: true },
      { text: 'Alertes zones chaudes (push + vocal)', ok: true },
      { text: 'Stats €/h, €/km, retour à vide', ok: true },
      { text: 'Compta IA (livre recettes auto)', ok: false },
    ],
    cta: 'Activer Ajnaya — 7 jours gratuit', style: 'bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white shadow-lg shadow-violet-900/40',
  },
  {
    id: 'vip', name: 'VIP', tagline: 'Tout Pro + votre compta tourne toute seule.',
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
    { q: "Quelle est la vraie différence entre les 3 plans ?", a: "Essentiel = vous avez les chiffres, vous décidez seul. Pro = Ajnaya décide AVEC vous (le plan choisi par 8 chauffeurs sur 10). VIP = en plus, votre compta tourne toute seule (livre recettes auto, export URSSAF, fini le comptable à 90€/h)." },
    { q: "Pourquoi une carte est demandée si c'est gratuit ?", a: "Stripe la garde de côté pour activer votre abonnement APRÈS l'essai — pas avant. 0€ jusqu'à dimanche 18h. Vous annulez en 1 clic depuis l'app, où que vous soyez. Si vous annulez avant dimanche, il n'y a rien à payer. Point." },
    { q: "10€/filleul à vie, est-ce un piège ?", a: "Non. Tant que votre filleul reste abonné ET que vous aussi, vous touchez 10€/mois sur lui (N1). Plus 4€ s'il parraine quelqu'un (N2). Plus 2€ s'il parraine encore (N3). Versé après 4 semaines complètes, virement automatique. Pas de plafond, pas d'expiration." },
    { q: "J'ai déjà essayé d'autres outils. Pourquoi celui-ci ?", a: "Parce que les autres vous donnent des données — vous devez faire le tri. Ajnaya vous dit où aller MAINTENANT, à la prochaine course. Ce n'est pas un dashboard de plus. C'est le seul qui prend la décision avec vous en temps réel." },
    { q: "Et si Uber me désactive du jour au lendemain ?", a: "Justement. C'est le scénario pour lequel FOREAS existe. Ajnaya gère Uber + Bolt + Heetch en parallèle. Si une plateforme vous coupe, vous redistribuez votre temps sur les autres en 1 minute. La communauté FOREAS vous briefe aussi sur les bons réflexes pour récupérer votre compte." },
    { q: "Ajnaya, est-ce une IA qui parle ou un outil qui m'observe ?", a: "Les deux, à votre choix. Vous lui parlez (vocal naturel) ou vous lisez. Elle voit en temps réel les zones, le trafic, les événements, le surge multi-plateformes. Elle vous dit où aller — et où NE PAS aller. Disponible à partir du plan Pro." },
    { q: "Puis-je changer de plan en cours ?", a: "Oui, à tout moment. Up ou down. Prorata calculé automatiquement. Pas de pénalité, pas d'appel à un commercial à 19h le vendredi." },
    { q: "Et si je veux arrêter dans 3 mois ?", a: "Vous cliquez 'Annuler', vous confirmez, c'est annulé. Pas de relance, pas de mail manipulateur, pas d'appel. Sans engagement = sans engagement." },
  ]

  return (
    <div className="min-h-screen bg-black text-[#F8FAFC] overflow-x-hidden">
      {isSuccess && (
        <motion.div initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-green-600 to-emerald-500 py-4 px-5 text-center shadow-xl">
          <p className="text-white font-semibold text-sm">🎉 Bienvenue ! Votre abonnement est actif. Téléchargez l'app.</p>
        </motion.div>
      )}

      {/* Background — variant CYAN (data argent) + violet accent + rose subtle */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Halo pulse 1.8s — design system §8 */}
        <div
          className="absolute inset-0 animate-halo-pulse"
          style={{
            background:
              'radial-gradient(ellipse 60% 50% at 25% 15%, rgba(140,82,255,0.22) 0%, transparent 70%),' +
              'radial-gradient(ellipse 50% 45% at 80% 20%, rgba(0,212,255,0.14) 0%, transparent 70%),' +
              'radial-gradient(ellipse 70% 60% at 50% 90%, rgba(140,82,255,0.08) 0%, transparent 75%)',
          }}
        />
        {/* Halo rose subtle — accent warm chaleureux design system §4 */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 40% 30% at 90% 70%, rgba(255,102,153,0.07) 0%, transparent 70%)',
          }}
        />
        {/* Micro-grain anti-banding — design system §8 (casse les bandes OLED) */}
        <div
          className="absolute inset-0"
          style={{ backgroundColor: 'rgba(255,255,255,0.012)' }}
        />
      </div>

      <Header />

      {/* Live bar — preuve sociale temps réel + scarcity vraie */}
      <div className="relative border-b border-white/[0.06] bg-black/40 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-center gap-3 flex-wrap">
          <span className="flex items-center gap-1.5 text-green-400 text-xs font-medium tabular-nums">
            <span className="relative flex w-2 h-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
            </span>
            147 chauffeurs en essai cette semaine
          </span>
          <span className="text-white/20 hidden sm:inline">·</span>
          <span className="text-white/55 text-xs">
            Tarif découverte <span className="text-orange-300 font-semibold tabular-nums">clos à 500 abonnés</span>
          </span>
        </div>
      </div>

      {/* ── HERO — F-pattern niveau L2 ── */}
      <section className="relative pt-16 pb-8 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            {/* Eyebrow officielle — design system §11 */}
            <p
              className="text-[#00D4FF] text-[10px] font-extrabold uppercase mb-6"
              style={{ letterSpacing: '0.25em' }}
            >
              FOREAS · TARIFS DÉCOUVERTE
            </p>

            {/* Risk reversal badge — Hormozi */}
            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-1.5 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-300 text-xs font-semibold uppercase" style={{ letterSpacing: '0.1em' }}>
                0€ aujourd'hui · Annulation 1 clic
              </span>
            </div>

            {/* H1 display — letter-spacing négatif §17 + textHero ivoire §5 */}
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] mb-5 text-[#F8FAFC]"
              style={{ letterSpacing: '-0.04em' }}
            >
              Combien faites-vous net{' '}
              <span className="bg-gradient-to-r from-violet-400 via-cyan-300 to-violet-400 bg-clip-text text-transparent">
                cette semaine&nbsp;?
              </span>
            </h1>

            {/* Sub — preuve nominée + identification */}
            <p className="text-white/75 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
              Haitham, Paris&nbsp;: <span className="text-[#F8FAFC] font-semibold tabular-nums">+387&nbsp;€</span> ce mois-ci. Sans une heure en plus.
            </p>
            <p className="text-white/55 text-base sm:text-[15px] max-w-xl mx-auto leading-relaxed mt-3">
              Pas de magie. L'IA Ajnaya vous dit <span className="text-[#F8FAFC]/85">où aller</span>, <span className="text-[#F8FAFC]/85">quand</span>, et <span className="text-[#F8FAFC]/85">combien vous allez faire</span>. C'est tout.
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
                className={`relative rounded-2xl p-6 sm:p-7 border transition-all ${plan.popular ? 'border-violet-500/40 bg-gradient-to-b from-violet-900/15 to-black md:-mt-4 md:pb-10' : 'border-white/[0.06] bg-white/[0.04] hover:border-white/[0.18]'}`}
                style={plan.popular ? { boxShadow: '0 0 60px rgba(140,82,255,0.18), inset 0 0 0 1px rgba(140,82,255,0.20)' } : undefined}
              >
                {plan.popular && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-600 to-violet-500 text-white text-[10px] font-extrabold uppercase px-4 py-1 rounded-full whitespace-nowrap"
                    style={{ letterSpacing: '0.18em', boxShadow: '0 0 20px rgba(140,82,255,0.45)' }}
                  >
                    Le plus pris · 8/10 chauffeurs
                  </div>
                )}
                <p
                  className="text-[10px] font-extrabold text-[#00D4FF]/85 uppercase mb-2"
                  style={{ letterSpacing: '0.25em' }}
                >
                  {plan.name}
                </p>
                <p className="text-sm text-white/75 mb-5 min-h-[36px] leading-snug">{plan.tagline}</p>

                <motion.div key={billing} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}>
                  <div className="flex items-end gap-1.5 mb-1">
                    {billing === 'annual' && (
                      <span className="text-white/30 line-through text-lg mb-1 tabular-nums">{plan.weeklyPrice.toFixed(2).replace('.', ',')}€</span>
                    )}
                    <span
                      className="text-4xl sm:text-5xl font-black text-[#F8FAFC] tabular-nums"
                      style={{ letterSpacing: '-0.045em' }}
                    >
                      {price.toFixed(2).replace('.', ',')}€
                    </span>
                    <span className="text-white/50 text-sm mb-2">/sem</span>
                  </div>
                  <p className="text-cyan-300/80 text-xs mb-1 tabular-nums">
                    soit {perDay}€/jour {plan.popular && <span className="text-cyan-200 font-semibold">— le prix d'un péage</span>}
                  </p>
                  {plan.popular && (
                    <p className="text-green-400/85 text-[11px] font-semibold mt-1.5">💡 Une seule course no-show = votre mois remboursé</p>
                  )}
                  {billing === 'annual' && (
                    <p className="text-white/40 text-xs mt-1.5 tabular-nums">Facturé {(plan.annualWeeklyPrice * 52).toFixed(2).replace('.', ',')}€/an · sans engagement</p>
                  )}
                </motion.div>

                <div className="h-px bg-white/[0.06] my-5" />

                <div className="space-y-1.5 mb-6">
                  {plan.features.map((f, j) => (
                    <div key={j} className="flex items-start gap-2.5 py-0.5">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${f.ok ? (f.star ? 'bg-violet-500/25 ring-1 ring-violet-400/30' : 'bg-violet-500/15') : 'bg-white/[0.04]'}`}>
                        {f.ok ? (
                          <svg className={`w-3 h-3 ${f.star ? 'text-violet-200' : 'text-violet-400/85'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        ) : (
                          <span className="text-white/25 text-xs">×</span>
                        )}
                      </div>
                      <span className={`text-sm leading-tight ${f.ok ? (f.star ? 'text-[#F8FAFC] font-semibold' : 'text-white/80') : 'text-white/30 line-through'}`}>{f.text}</span>
                    </div>
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => openFlow(plan)}
                  className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all ${plan.style}`}
                  style={plan.popular ? { boxShadow: '0 0 28px rgba(140,82,255,0.40)' } : undefined}
                >
                  {plan.cta} →
                </motion.button>
                <p className="text-center text-white/45 text-[10px] mt-3 tabular-nums">0€ aujourd'hui · 0€ jusqu'à dimanche · Annulation 1 clic</p>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* ── KPIs — F-pattern niveau L1 displayXXL ── */}
      <section className="py-14 sm:py-16 px-4 border-y border-white/[0.06]">
        <div className="max-w-4xl mx-auto">
          <p
            className="text-center text-[#00D4FF]/85 text-[10px] font-extrabold uppercase mb-8"
            style={{ letterSpacing: '0.28em' }}
          >
            MOYENNE 60 JOURS · 247 CHAUFFEURS PRO
          </p>
          <div className="grid grid-cols-3 gap-4 sm:gap-8 text-center">
            {[
              { target: 387, suffix: '€', label: 'gagnés en plus / mois', color: 'from-violet-300 via-violet-200 to-cyan-200' },
              { target: 3, suffix: 'h', label: 'temps mort en moins / jour', color: 'from-cyan-300 via-cyan-200 to-cyan-100' },
              { target: 90, suffix: 'sec', label: "pour votre 1ᵉʳ insight Ajnaya", color: 'from-green-300 via-green-200 to-cyan-200' },
            ].map((kpi, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div
                  className={'text-4xl sm:text-6xl font-black bg-gradient-to-r ' + kpi.color + ' bg-clip-text text-transparent mb-2 tabular-nums'}
                  style={{ letterSpacing: '-0.04em' }}
                >
                  <AnimatedCounter target={kpi.target} suffix={kpi.suffix} />
                </div>
                <p className="text-white/55 text-[11px] sm:text-sm leading-tight">{kpi.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPARISON · Sans FOREAS vs Avec FOREAS — Heath Concrete + Schwartz mécanisme ── */}
      <section className="py-16 sm:py-20 px-4 border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p
              className="text-[#00D4FF]/85 text-[10px] font-extrabold uppercase mb-3"
              style={{ letterSpacing: '0.28em' }}
            >
              LA VRAIE DIFFÉRENCE
            </p>
            <h2
              className="text-3xl sm:text-4xl font-extrabold text-[#F8FAFC] leading-tight"
              style={{ letterSpacing: '-0.03em' }}
            >
              Le même chauffeur. La même journée.<br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-violet-300 to-cyan-300 bg-clip-text text-transparent">Deux trajectoires.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4 sm:gap-5">
            {/* SANS FOREAS — la version "à l'aveugle" */}
            <div
              className="rounded-2xl p-6 sm:p-7 border border-white/[0.06] bg-white/[0.02] relative"
            >
              <p
                className="text-white/40 text-[10px] font-extrabold uppercase mb-4"
                style={{ letterSpacing: '0.28em' }}
              >
                SANS FOREAS · LA NORME
              </p>
              <ul className="space-y-3 text-[15px] text-white/65 leading-relaxed">
                <li className="flex gap-2.5"><span className="text-white/30 mt-1">○</span><span>Vous tournez en attendant que ça pingue.</span></li>
                <li className="flex gap-2.5"><span className="text-white/30 mt-1">○</span><span>Vous acceptez la course parce qu'elle est là — pas parce qu'elle paie.</span></li>
                <li className="flex gap-2.5"><span className="text-white/30 mt-1">○</span><span>Le surge tombe pendant que vous êtes à l'autre bout de Paris.</span></li>
                <li className="flex gap-2.5"><span className="text-white/30 mt-1">○</span><span>Vous finissez à 22h, pas convaincu d'avoir bien bossé.</span></li>
                <li className="flex gap-2.5"><span className="text-white/30 mt-1">○</span><span>Le mois prochain, vous faites pareil. Et le suivant aussi.</span></li>
              </ul>
              <div className="mt-6 pt-5 border-t border-white/[0.06]">
                <p className="text-white/50 text-xs uppercase mb-1" style={{ letterSpacing: '0.2em' }}>Net moyen</p>
                <p className="text-2xl font-black text-white/70 tabular-nums" style={{ letterSpacing: '-0.03em' }}>2 840 €<span className="text-sm text-white/40 font-medium">&nbsp;/ mois</span></p>
              </div>
            </div>

            {/* AVEC FOREAS — la version Pro */}
            <div
              className="rounded-2xl p-6 sm:p-7 border border-violet-500/30 bg-gradient-to-b from-violet-900/15 to-black relative"
              style={{ boxShadow: '0 0 60px rgba(140,82,255,0.15)' }}
            >
              <p
                className="text-[#00D4FF] text-[10px] font-extrabold uppercase mb-4"
                style={{ letterSpacing: '0.28em' }}
              >
                AVEC FOREAS PRO · 12,97&nbsp;€/SEM
              </p>
              <ul className="space-y-3 text-[15px] text-[#F8FAFC]/90 leading-relaxed">
                <li className="flex gap-2.5"><span className="text-violet-300 mt-1">●</span><span><strong className="text-[#F8FAFC]">Ajnaya te briefe le matin</strong> : 3 zones chaudes du jour, ordre optimal.</span></li>
                <li className="flex gap-2.5"><span className="text-violet-300 mt-1">●</span><span>Tu prends <strong className="text-[#F8FAFC]">la course qui paie</strong>, tu refuses celle qui te plombe.</span></li>
                <li className="flex gap-2.5"><span className="text-violet-300 mt-1">●</span><span>Surge multi-plateformes en temps réel — <strong className="text-[#F8FAFC]">tu y es avant les autres</strong>.</span></li>
                <li className="flex gap-2.5"><span className="text-violet-300 mt-1">●</span><span>Tu rentres à 19h, <strong className="text-[#F8FAFC]">+47&nbsp;€ vs hier</strong>, conscient.</span></li>
                <li className="flex gap-2.5"><span className="text-violet-300 mt-1">●</span><span>Le mois prochain, ta moyenne monte. <strong className="text-[#F8FAFC]">Mécaniquement.</strong></span></li>
              </ul>
              <div className="mt-6 pt-5 border-t border-violet-500/15">
                <p className="text-cyan-300/85 text-xs uppercase mb-1" style={{ letterSpacing: '0.2em' }}>Net moyen</p>
                <p
                  className="text-2xl font-black tabular-nums bg-gradient-to-r from-violet-300 to-cyan-200 bg-clip-text text-transparent"
                  style={{ letterSpacing: '-0.03em' }}
                >
                  3 227 €<span className="text-sm text-cyan-300/70 font-medium">&nbsp;/ mois</span>
                </p>
                <p className="text-green-400/85 text-[11px] font-semibold mt-1">+387&nbsp;€ · soit 13,6&nbsp;% de marge en plus</p>
              </div>
            </div>
          </div>

          {/* Bandeau honnêteté — Halbert anti-bullshit */}
          <p className="text-center text-white/45 text-xs mt-6 max-w-2xl mx-auto">
            Ces chiffres sortent de la moyenne sur 247 chauffeurs Pro après 60 jours. Pas tout le monde fait pareil. Karim fait +18&nbsp;%. Théodore fait +9&nbsp;% (et conduit 3h de moins).
          </p>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-16 px-4 bg-white/[0.02] border-b border-white/[0.06]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p
              className="text-[#00D4FF]/85 text-[10px] font-extrabold uppercase mb-3"
              style={{ letterSpacing: '0.28em' }}
            >
              VRAIS CHAUFFEURS · VRAIS VIREMENTS
            </p>
            <h2
              className="text-3xl sm:text-4xl font-extrabold text-[#F8FAFC] mb-3"
              style={{ letterSpacing: '-0.03em' }}
            >
              Pas des promesses. Des virements.
            </h2>
            <p className="text-white/55">3 chauffeurs. 3 villes. 3 trajectoires.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { name: 'Haitham B.', city: 'Paris · 4 ans VTC', avatar: 'HB', gain: '+387 €/mois', detail: 'Vendredi 18h, CDG', quote: "Avant je tournais en rond entre Bercy et Bastille. Maintenant Ajnaya me dit 'pose-toi à Roissy à 18h25, vol AF1234 atterrit'. Je me retrouve premier sur la file. C'est ça le truc.", stars: 5 },
              { name: 'Soufiane M.', city: 'Lyon · 2 ans VTC', avatar: 'SM', gain: '+412 €/mois', detail: 'Mois 1 vs mois 0', quote: "412 € de plus le premier mois. L'abo se paie en une course. Le reste, c'est du bonus que je mets de côté pour passer en SAS.", stars: 5 },
              { name: 'Théodore R.', city: 'Bordeaux · 6 ans VTC', avatar: 'TR', gain: '-3h/jour à vide', detail: 'Au lieu de 11h, je rentre en 8h', quote: "Le vrai gain n'est pas dans mon compte. Il est dans ma tête. Je conduis 3h de moins, je gagne autant. Mes lombaires me remercient.", stars: 5 },
            ].map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-5 hover:border-violet-500/30 transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-lg shadow-violet-900/30">{t.avatar}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#F8FAFC] text-sm truncate">{t.name}</p>
                    <p className="text-white/55 text-[11px] truncate">{t.city}</p>
                  </div>
                  <span className="bg-green-500/15 text-green-400 text-[11px] px-2 py-0.5 rounded-full font-bold tabular-nums whitespace-nowrap">{t.gain}</span>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex">{Array.from({ length: t.stars }).map((_, j) => <span key={j} className="text-yellow-400 text-sm">★</span>)}</div>
                  <span className="text-white/35 text-[10px] uppercase" style={{ letterSpacing: '0.15em' }}>· {t.detail}</span>
                </div>
                <p className="text-white/75 text-[13px] leading-relaxed">"{t.quote}"</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GUARANTEE — Hormozi risk reversal × design system glass card ── */}
      <section className="py-14 sm:py-16 px-4">
        <div className="max-w-lg mx-auto text-center">
          <div
            className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-8 backdrop-blur-sm relative"
            style={{ boxShadow: '0 0 40px rgba(0,212,255,0.08)' }}
          >
            <div className="text-4xl mb-4">🛡️</div>
            <p
              className="text-[#00D4FF]/85 text-[10px] font-extrabold uppercase mb-3"
              style={{ letterSpacing: '0.28em' }}
            >
              GARANTIE FERME
            </p>
            <h3
              className="text-xl sm:text-2xl font-bold text-[#F8FAFC] mb-3 leading-tight"
              style={{ letterSpacing: '-0.025em' }}
            >
              Si vous n&apos;êtes pas convaincu en 7 jours,<br />vous ne payez rien.
            </h3>
            <p className="text-white/65 text-sm leading-relaxed">
              0&nbsp;€ aujourd&apos;hui. 0&nbsp;€ jusqu&apos;à dimanche 18h. Si vous avez un doute, vous fermez l&apos;app — il n&apos;y a rien à annuler. Si vous restez, c&apos;est que ça vaut le coup. <span className="text-white/80">Point.</span>
            </p>
          </div>
        </div>
      </section>

      {/* ── FAQ — objections inversées ── */}
      <section className="py-16 sm:py-20 px-4 border-t border-white/[0.06]">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <p
              className="text-[#00D4FF]/85 text-[10px] font-extrabold uppercase mb-3"
              style={{ letterSpacing: '0.28em' }}
            >
              QUESTIONS — RÉPONSES SANS LANGUE DE BOIS
            </p>
            <h2
              className="text-3xl sm:text-4xl font-extrabold text-[#F8FAFC] mb-3"
              style={{ letterSpacing: '-0.03em' }}
            >
              Les questions qu'on nous pose tout le temps.
            </h2>
            <p className="text-white/55 text-sm">Si vous hésitez, c&apos;est normal — voilà les vraies réponses.</p>
          </div>
          {faqs.map((faq, i) => <FaqItem key={i} q={faq.q} a={faq.a} />)}
        </div>
      </section>

      {/* ── FINAL CTA — F-pattern niveau L2 hero + Loss aversion + PS humain ── */}
      <section className="py-16 sm:py-24 px-4 relative">
        {/* Halo CTA renforcé sous le bouton */}
        <div
          className="absolute inset-0 pointer-events-none animate-halo-pulse"
          aria-hidden
          style={{
            background: 'radial-gradient(ellipse 50% 40% at 50% 60%, rgba(140,82,255,0.18) 0%, transparent 70%)',
          }}
        />
        <div className="max-w-2xl mx-auto text-center relative">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <p
              className="text-[#00D4FF]/85 text-[10px] font-extrabold uppercase mb-4"
              style={{ letterSpacing: '0.28em' }}
            >
              7 JOURS · ZÉRO RISQUE · VOUS DÉCIDEZ
            </p>
            <h2
              className="text-4xl sm:text-5xl font-black text-[#F8FAFC] mb-5 leading-[1.05]"
              style={{ letterSpacing: '-0.045em' }}
            >
              Dans 7 jours,{' '}
              <span className="bg-gradient-to-r from-violet-300 via-cyan-200 to-violet-300 bg-clip-text text-transparent">
                vous saurez.
              </span>
            </h2>
            <p className="text-white/75 text-base sm:text-lg mb-3 leading-relaxed">
              Soit Ajnaya vous a fait gagner <span className="text-[#F8FAFC] font-semibold tabular-nums">+28&nbsp;€/jour</span> de moyenne.<br className="hidden sm:block" />
              Soit vous fermez, vous ne payez rien, vous continuez comme avant.
            </p>
            <p className="text-cyan-300/85 text-sm sm:text-base mb-9">
              La seule question&nbsp;: préférez-vous savoir, ou pas&nbsp;?
            </p>

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => openFlow(PLANS[1])}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white font-extrabold py-4 px-12 rounded-2xl text-lg transition-all"
              style={{ boxShadow: '0 0 80px rgba(140,82,255,0.55), 0 4px 20px rgba(0,0,0,0.4)' }}
            >
              Activer votre essai 7 jours (0&nbsp;€) →
            </motion.button>

            <div className="flex items-center justify-center gap-x-6 gap-y-2 mt-6 text-white/50 text-[11px] flex-wrap tabular-nums">
              <span>🔒 Stripe · SSL</span>
              <span>✓ 0&nbsp;€ aujourd'hui</span>
              <span>🛡️ Annulation 1 clic</span>
              <span>⭐ 4,9/5 · 247 avis</span>
            </div>

            {/* PS signature humaine — Halbert "lettre d'un ami" */}
            <div className="mt-12 pt-8 border-t border-white/[0.06] max-w-lg mx-auto">
              <p className="text-white/65 text-sm leading-relaxed text-left italic">
                <span className="text-cyan-300/85 font-semibold not-italic">PS</span> — Si vous hésitez encore, ce n&apos;est pas grave. Mais revenez dans 6 mois, et comparez. Vous serez au même point. Le seul truc qui aura changé, c&apos;est votre compteur d&apos;années perdues.<br /><br />
                Si vous cliquez aujourd&apos;hui, vous avez 7 jours pour voir si on est sérieux. Si on ne l&apos;est pas, vous partez. <span className="text-[#F8FAFC] font-semibold not-italic">Vous ne perdez rien. Vous testez juste.</span>
              </p>
              <p className="text-white/55 text-xs mt-4 text-left">
                — Chandler, fondateur FOREAS
              </p>
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
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <TarifsContent />
    </Suspense>
  )
}

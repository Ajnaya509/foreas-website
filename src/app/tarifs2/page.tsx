'use client'

import { useState, useEffect, useRef, Suspense, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { loadStripe } from '@stripe/stripe-js'
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js'
import { useSearchParams } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { trackInitiateCheckout } from '@/lib/tracking'
import { authUrls } from '@/lib/auth-urls'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

// ─── Utils ───────────────────────────────────────────────────────────────────
// Essai GLISSANT de 3 jours — identique pour tout le monde (décision Chandler 22/07).
// Avant : « prochain lundi 18h », un point fixe hebdomadaire → l'essai durait 1 jour pour
// qui s'inscrivait le dimanche soir, 6 jours pour qui s'inscrivait le mardi. Même promesse
// affichée, expérience du simple au sextuple. Doit rester synchronisé avec TRIAL_DAYS
// dans src/app/api/checkout/route.ts (c'est LUI qui pose le vrai trial_end chez Stripe).
const TRIAL_DAYS = 3
function getTrialEndDate(): Date {
  return new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000)
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

function FaqItem({ q, a, id }: { q: string; a: string; id?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div id={id} className="border-b border-white/10">
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

// ── INTERRUPTEUR PAIEMENT ─────────────────────────────────────────────────────
// false = ESSAI 3 JOURS, carte demandée à l'inscription, 0 € débité avant la fin (ACTUEL,
//         décision Chandler 22/07). true = paiement immédiat + garantie 30j (ancien mode
//         cash-now, archi conservée telle quelle → rebrancher = repasser true).
const IMMEDIATE_PAYMENT = false

// ─── Trial Bridge ────────────────────────────────────────────────────────────
function TrialBridge({ planName, onConfirm, onClose }: { planName: string; onConfirm: () => void; onClose: () => void }) {
  const trialEnd = getTrialEndDate()
  const trialDays = TRIAL_DAYS

  const steps = [
    { icon: '🎁', label: "Aujourd'hui", sub: `Accès complet FOREAS ${planName}`, hl: '0€ débité', hlC: 'text-green-400 bg-green-500/10', active: true },
    { icon: '📱', label: `${trialDays} jour${trialDays > 1 ? 's' : ''} pour tester`, sub: 'Tu testes Ajnaya sur tes vraies courses', hl: null, hlC: '', active: false },
    { icon: '📅', label: formatDateFR(trialEnd), sub: "Fin de l'essai — tu décides", hl: 'Annule avant → 0€', hlC: 'text-blue-300 bg-blue-500/10', active: false },
    { icon: '💳', label: 'Premier débit (si tu restes)', sub: 'Annulable en 1 clic, à n\'importe quel moment', hl: null, hlC: '', active: false },
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
                <p className="text-white/60 text-xs leading-relaxed">Stripe la garde de côté pour activer ton abonnement <strong className="text-white/85">après</strong> l'essai — pas avant. <strong className="text-white/85">0€ aujourd'hui, 0€ pendant {TRIAL_DAYS} jours.</strong> Si tu annules avant, il n'y a rien à payer. C'est tout.</p>
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
function CheckoutModal({ planId, billing, onClose }: { planId: string; billing: 'monthly' | 'annual'; onClose: () => void }) {
  const trialEnd = getTrialEndDate()
  const fetchClientSecret = useCallback(async () => {
    const res = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan: `${planId}_${billing}`, mode: 'embedded', immediate: IMMEDIATE_PAYMENT }) })
    const data = await res.json()
    return data.clientSecret
  }, [planId, billing])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <motion.div initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0, y: 20 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="relative w-full max-w-xl bg-black border border-violet-500/30 rounded-2xl overflow-hidden shadow-2xl" style={{ maxHeight: '90vh' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-gradient-to-r from-violet-900/30 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center"><span className="text-[10px] font-bold text-white">F</span></div>
            <div><p className="text-white font-semibold text-sm">FOREAS — Coordonnées</p><p className="text-green-400 text-xs font-medium">{IMMEDIATE_PAYMENT ? 'Paiement aujourd\'hui · garanti 30 jours remboursé' : `0€ débité · Premier débit le ${formatDateFR(trialEnd)}`}</p></div>
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

// ─── L'ABONNEMENT (un seul) — 29,99 €/mois · 249,99 €/an ─────────────────────
// Décision Chandler 22/07 : fini Free/Pro/Elite. Une offre, tout dedans.
// Le decoy à 3 colonnes servait à rendre Pro évident — avec une offre unique il n'y a
// plus rien à rendre évident, il n'y a plus de choix à faire. Le seul arbitrage restant
// est mensuel vs annuel, porté par le toggle.
//
// Chaque ligne = 1 fonctionnalité RÉELLE de l'app (source : FOREAS-SHARED/
// CARTE_FONCTIONNALITES_AJNAYA.md — les `forbidden_claims` de ce fichier sont respectés :
// aucun « garanti », aucun « 100 % », aucun « remplace Uber »).
//   punch  = la phrase qui vend le RÉSULTAT, pas la fonction (méthode Steve Jobs :
//            « 1000 chansons dans votre poche », pas « 5 Go de stockage »).
//   detail = ce que c'est vraiment, en clair, pour que la promesse reste vérifiable.
//   worth  = ce que coûte l'équivalent ailleurs (value stacking). ⚠️ Voir COMMENT_WORTH.
interface Feature { punch: string; detail: string; worth?: string }

// ⚠️ COMMENT_WORTH — d'où sortent les prix barrés (à valider par Chandler avant diffusion) :
//   • 80 €/mois (compta)      → tarif constaté d'un expert-comptable pour auto-entrepreneur VTC
//                               (fourchette réelle 60-120 €/mois) — le plus bas de la fourchette.
//   • 25 €/mois (site perso)  → abonnement site vitrine type Wix/Squarespace + nom de domaine.
//   • 25 % (clients directs)  → commission plateforme réellement prélevée sur une course.
//   Les 3 ci-dessus sont des références marché vérifiables. Les autres lignes n'ont PAS de
//   prix barré : aucun équivalent marché honnête à citer, et inventer un chiffre ici serait
//   exactement la faute qu'on a corrigée ailleurs sur le site (claim non défendable → CNIL).
const FEATURES: Feature[] = [
  {
    punch: 'Le vrai prix de la course. Avant de dire oui.',
    detail: 'Une course tombe : Ajnaya déduit la commission et te sort ton net réel en moins d\'une seconde. Accepte, ou laisse passer.',
  },
  {
    punch: 'La ville qui paie, en couleurs.',
    detail: 'La carte s\'allume là où la demande monte, à 800 m près. Tu te places avant que ça sonne.',
  },
  {
    punch: 'Un collègue qui connaît la ville. Dans ta poche.',
    detail: 'Tu lui parles à voix haute pendant que tu roules — « où je vais ce soir ? » — elle répond. Mains sur le volant.',
  },
  {
    punch: 'Le contrôle, tu le sais avant de le voir.',
    detail: 'Les chauffeurs se signalent les contrôles, accidents et bouchons, avec la distance. Tu n\'es plus seul sur la route.',
  },
  {
    punch: 'Une course à 25 € ? 25 € pour toi.',
    detail: 'Un sticker dans ta voiture, un mini-site à ton nom : le client scanne et réserve en direct. La plateforme ne touche rien.',
    worth: '25 % de commission',
  },
  {
    punch: 'Ta tirelire URSSAF se calcule toute seule.',
    detail: 'Course après course, tu vois la provision à sortir au trimestre. Zéro saisie, zéro douche froide.',
    worth: '80 €/mois',
  },
  {
    punch: 'Ton site à ton nom. Le client scanne, il réserve.',
    detail: 'foreas.xyz/ton-prénom, ton QR code prêt à coller dans la voiture. Monté pour toi, rien à configurer.',
    worth: '25 €/mois',
  },
  {
    punch: 'Ton vrai tarif horaire. Pas celui que tu crois.',
    detail: 'Ton net par heure, ton net par km, ton temps à vide. C\'est là que tu vois où part ta journée.',
  },
]

interface Plan {
  id: string; name: string; tagline: string
  monthlyPrice: number; annualMonthlyPrice: number; annualTotal: number
  cta: string
}

const PLAN: Plan = {
  id: 'pro',           // clé conservée : l'API attend `pro_monthly` / `pro_annual`
  name: 'FOREAS',
  tagline: 'Tout est dedans. Il n\'y a rien d\'autre à choisir.',
  // 249,99 / 12 = 20,8325 → 20,83 €/mois affiché en annuel
  monthlyPrice: 29.99, annualMonthlyPrice: 20.83, annualTotal: 249.99,
  cta: IMMEDIATE_PAYMENT ? 'Démarrer maintenant' : `Essayer ${TRIAL_DAYS} jours — 0 € aujourd\'hui`,
}

// ─── Main ────────────────────────────────────────────────────────────────────
function TarifsContent() {
  const searchParams = useSearchParams()
  const isSuccess = searchParams.get('success') === 'true'
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [flowState, setFlowState] = useState<'idle' | 'bridge' | 'checkout'>('idle')

  // Une seule offre → plus de branche Free (redirigeait vers /free-signup) ni de branche
  // decoy Elite (faisait défiler vers #faq-elite au lieu d'ouvrir le paiement).
  const openFlow = (plan: Plan) => {
    setSelectedPlan(plan)
    // Essai → on montre d'abord la TrialBridge (ce qui se passe, quand, combien).
    // Paiement immédiat → droit au checkout, pas de bridge qui promettrait « 0 € aujourd'hui ».
    setFlowState(IMMEDIATE_PAYMENT ? 'checkout' : 'bridge')
    const price = billing === 'monthly' ? plan.monthlyPrice : plan.annualMonthlyPrice
    trackInitiateCheckout(plan.name, price)
  }
  const closeAll = () => { setFlowState('idle'); setSelectedPlan(null) }
  const confirmCheckout = () => setFlowState('checkout')

  const faqs = [
    { id: 'faq-diff', q: "Il y a un seul abonnement ? Pas de version light ?", a: "Un seul, et tout est dedans. Avant il y avait trois formules — le temps que tu passais à comparer, tu ne le passais pas à rouler. Ce que tu prends aujourd'hui, c'est ce que prend le chauffeur d'à côté : le Coach qui calcule ton net avant que tu acceptes, la carte des zones, Ajnaya à la voix, tes clients directs sans commission, ta provision URSSAF, ton site perso. Rien à débloquer plus tard." },
    IMMEDIATE_PAYMENT
      ? { id: 'faq-carte', q: "Je paie tout de suite ? Et si ça me va pas ?", a: "Oui, tu paies aujourd'hui — et tu es couvert par la garantie 30 jours : pas convaincu, tu te fais rembourser sans discuter, sans question. Tu testes en vrai sur tes courses, tu risques zéro. (Le plan Free reste 100% gratuit, juste un email.)" }
      : { id: 'faq-carte', q: "Pourquoi une carte est demandée si c'est gratuit ?", a: "Le plan Free n'en demande aucune — c'est vraiment gratuit, juste un email. Pour Pro : Stripe garde ta carte de côté pour activer l'abonnement APRÈS l'essai — pas avant. 0€ jusqu'à lundi 18h. Tu annules en 1 clic depuis l'app. Si tu annules avant, il n'y a rien à payer. Point." },
    { id: 'faq-mensuel', q: "Pourquoi mensuel et pas hebdomadaire ?", a: "Parce que 29,99€/mois, c'est 1€ par jour — une bouteille d'eau. Tu n'as aucun calcul à faire, tu sais exactement ce que tu paies. En annuel, 249,99€ : c'est l'ordre de grandeur d'une journée de chiffre d'affaires, posée une fois, pour 365 jours de décisions." },
    { id: 'faq-parrainage', q: "25€/filleul à vie, est-ce un piège ?", a: "Non. Tant que ton filleul reste abonné ET que toi aussi, tu touches 25€/mois sur lui (N1). Plus 8€ s'il parraine quelqu'un (N2). Plus 2€ au niveau 3. Activé dès son 1er paiement. Virement automatique. Pas de plafond, pas d'expiration. Un lien parrain donne -20% à vie sur le mensuel à ton filleul." },
    { id: 'faq-directs', q: "« Clients directs », ça veut dire quoi concrètement ?", a: "Un sticker avec ton QR code dans la voiture, et un mini-site à ton nom (foreas.xyz/ton-prénom). Le client scanne, il réserve avec toi, il te paie. Aucune plateforme au milieu, donc aucune commission prélevée : une course à 25€, c'est 25€ pour toi. Ça ne remplace pas Uber du jour au lendemain — ça se construit course après course, avec les clients qui reviennent." },
    { id: 'faq-autres-outils', q: "J'ai déjà essayé d'autres outils. Pourquoi celui-ci ?", a: "Parce que les autres te donnent des données — et c'est toi qui fais le tri, le soir, fatigué. Ajnaya te dit où aller MAINTENANT, à la prochaine course. Ce n'est pas un tableau de bord de plus. " + (IMMEDIATE_PAYMENT ? "Et tu es couvert : garantie 30 jours satisfait-remboursé pour te faire ta propre idée, sans risque." : `Et tu as ${TRIAL_DAYS} jours pour te faire ta propre idée sur tes vraies courses, sans rien payer.`) },
    { id: 'faq-desactivation', q: "Et si Uber me désactive du jour au lendemain ?", a: "Justement. C'est le scénario pour lequel FOREAS existe. Ajnaya gère Uber + Bolt + Heetch en parallèle. Si une plateforme te coupe, tu redistribues ton temps sur les autres en 1 minute. La communauté FOREAS te briefe sur les bons réflexes pour récupérer ton compte." },
    { id: 'faq-annulation', q: "Et si je veux arrêter dans 3 mois ?", a: "Tu cliques 'Annuler', tu confirmes, c'est annulé. Pas de relance, pas de mail manipulateur, pas d'appel. Sans engagement = sans engagement. Et si tu veux juste downgrade vers Free, tu gardes l'accès heatmap basique sans payer." },
  ]

  return (
    <div className="min-h-screen bg-black text-[#F8FAFC] overflow-x-hidden">
      {isSuccess && (
        <motion.div initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-green-600 to-emerald-500 py-4 px-5 text-center shadow-xl">
          <p className="text-white font-semibold text-sm">🎉 Bienvenue ! Ton abonnement est actif. Télécharge l'app.</p>
        </motion.div>
      )}

      {/* Background halos — design system §8 variant cyan */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 animate-halo-pulse"
          style={{
            background:
              'radial-gradient(ellipse 60% 50% at 25% 15%, rgba(140,82,255,0.22) 0%, transparent 70%),' +
              'radial-gradient(ellipse 50% 45% at 80% 20%, rgba(0,212,255,0.14) 0%, transparent 70%),' +
              'radial-gradient(ellipse 70% 60% at 50% 90%, rgba(140,82,255,0.08) 0%, transparent 75%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 40% 30% at 90% 70%, rgba(255,102,153,0.07) 0%, transparent 70%)' }}
        />
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(255,255,255,0.012)' }} />
      </div>

      <Header />

      {/* Live bar */}
      <div className="relative border-b border-white/[0.06] bg-black/40 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-center gap-3 flex-wrap">
          <span className="flex items-center gap-1.5 text-green-400 text-xs font-medium tabular-nums">
            <span className="relative flex w-2 h-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
            </span>
            Ajnaya lit 7 plateformes en direct
          </span>
          <span className="text-white/20 hidden sm:inline">·</span>
          <span className="text-white/55 text-xs">
            Tarif découverte <span className="text-orange-300 font-semibold tabular-nums">clos à 500 abonnés</span>
          </span>
        </div>
      </div>

      {/* ── HERO ── */}
      <section className="relative pt-16 pb-8 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="text-[#00D4FF] text-[10px] font-extrabold uppercase mb-6" style={{ letterSpacing: '0.25em' }}>
              FOREAS · TARIFS DÉCOUVERTE
            </p>
            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-1.5 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-300 text-xs font-semibold uppercase" style={{ letterSpacing: '0.1em' }}>
                {IMMEDIATE_PAYMENT ? 'Garanti 30 jours · remboursé' : '0€ aujourd\'hui · Annulation 1 clic'}
              </span>
            </div>
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] mb-5 text-[#F8FAFC]"
              style={{ letterSpacing: '-0.04em' }}
            >
              Combien fais-tu net{' '}
              <span className="bg-gradient-to-r from-violet-400 via-cyan-300 to-violet-400 bg-clip-text text-transparent">
                cette semaine&nbsp;?
              </span>
            </h1>
            <p className="text-white/75 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
              Haitham, Paris&nbsp;: <span className="text-[#F8FAFC] font-semibold tabular-nums">+387&nbsp;€</span> ce mois-ci. Sans une heure en plus.
            </p>
            <p className="text-white/55 text-base sm:text-[15px] max-w-xl mx-auto leading-relaxed mt-3">
              {/* « IA » retiré volontairement (décision Chandler) : le mot est devenu
                  anti-conversion sur cette cible. On dit ce qu'elle FAIT, pas ce qu'elle est. */}
              Pas de magie. Ajnaya te dit <span className="text-[#F8FAFC]/85">où aller</span>, <span className="text-[#F8FAFC]/85">quand</span>, et <span className="text-[#F8FAFC]/85">combien tu vas faire</span>. C'est tout.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── TOGGLE Mensuel / Annuel ── */}
      <div className="flex items-center justify-center gap-4 mb-10 px-4">
        <button
          onClick={() => setBilling('monthly')}
          className={`text-sm font-semibold px-4 py-2 rounded-xl transition-all ${billing === 'monthly' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}
        >
          Mensuel
        </button>
        <button
          onClick={() => setBilling(c => c === 'monthly' ? 'annual' : 'monthly')}
          className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${billing === 'annual' ? 'bg-violet-500' : 'bg-white/20'}`}
          aria-label="Basculer annuel/mensuel"
        >
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${billing === 'annual' ? 'translate-x-6' : ''}`} />
        </button>
        <button
          onClick={() => setBilling('annual')}
          className={`text-sm font-semibold px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${billing === 'annual' ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
        >
          Annuel
          {/* « 2 MOIS OFFERTS » était juste à 299,90€ (= 10 mois payés sur 12). À 249,99€
              l'écart réel est de ~3,7 mois : le badge sous-vendait ET devenait faux. On
              affiche le pourcentage exact, arrondi vers le BAS (109,89/359,88 = 30,5%). */}
          <span className="bg-green-500/20 text-green-400 text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap" style={{ letterSpacing: '0.05em' }}>
            −30&nbsp;%
          </span>
        </button>
      </div>

      {/* ── L'OFFRE — une seule carte ── */}
      <section className="px-4 pb-20">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative rounded-2xl p-6 sm:p-8 border border-violet-500/40 bg-gradient-to-b from-violet-900/15 to-black"
            style={{ boxShadow: '0 0 60px rgba(140,82,255,0.18), inset 0 0 0 1px rgba(140,82,255,0.20)' }}
          >
            <p className="text-[10px] font-extrabold text-[#00D4FF]/85 uppercase mb-2" style={{ letterSpacing: '0.25em' }}>
              {PLAN.name}
            </p>
            <p className="text-sm text-white/75 mb-6 leading-snug">{PLAN.tagline}</p>

            {/* ── Prix + l'ancrage qui va avec ── */}
            <motion.div key={billing} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}>
              <div className="flex items-end gap-2 mb-2">
                {billing === 'annual' && (
                  <span className="text-white/30 line-through text-xl mb-1.5 tabular-nums">{PLAN.monthlyPrice}€</span>
                )}
                <span className="text-5xl sm:text-6xl font-black text-[#F8FAFC] tabular-nums" style={{ letterSpacing: '-0.045em' }}>
                  {billing === 'monthly'
                    ? `${PLAN.monthlyPrice}€`
                    : `${PLAN.annualMonthlyPrice.toFixed(2).replace('.', ',')}€`}
                </span>
                <span className="text-white/50 text-base mb-2.5">/mois</span>
              </div>

              {billing === 'monthly' ? (
                /* 29,99 € / 30 jours = 1,00 € — la comparaison est arithmétiquement juste,
                   pas une image marketing. Une bouteille d'eau, c'est le prix que personne
                   ne discute : on ne compare plus à un abonnement, on compare à un réflexe. */
                <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/[0.06] px-4 py-3">
                  <p className="text-cyan-200 text-sm font-semibold flex items-center gap-2">
                    <span className="text-lg">💧</span> 1&nbsp;€ par jour. Une bouteille d&apos;eau.
                  </p>
                  <p className="text-white/50 text-xs mt-1">
                    Tu la bois sans y penser. Celle-là, tu la récupères à la première course que tu ne prends pas pour rien.
                  </p>
                </div>
              ) : (
                /* L'annuel ne se vend pas en « économies » mais en investissement : 249,99 €,
                   c'est l'ordre de grandeur d'UNE journée de CA — pour 365 jours de décisions.
                   On énonce ce qui est vrai (le coût, la durée), jamais un gain chiffré promis. */
                <div className="rounded-xl border border-[#F5C842]/25 bg-[#F5C842]/[0.06] px-4 py-3">
                  <p className="text-[#F5C842] text-sm font-semibold flex items-center gap-2">
                    <span className="text-lg">🗓️</span> Une journée de CA. Pour 365 jours de décisions.
                  </p>
                  <p className="text-white/50 text-xs mt-1 tabular-nums">
                    Facturé {PLAN.annualTotal.toLocaleString('fr-FR')}&nbsp;€/an — soit 0,68&nbsp;€/jour. Tu investis une journée de chiffre d&apos;affaires ; ce que tu récupères, ce sont les bonnes décisions de toutes les autres.
                  </p>
                </div>
              )}
            </motion.div>

            <div className="h-px bg-white/[0.06] my-6" />

            {/* ── Ce que tu as — phrase d'abord, prix barré à côté ── */}
            <div className="space-y-4 mb-7">
              {FEATURES.map((f, j) => (
                <div key={j} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-violet-500/20 ring-1 ring-violet-400/25 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-violet-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-[#F8FAFC] font-semibold text-[15px] leading-snug">{f.punch}</p>
                      {f.worth && (
                        <span className="text-white/30 line-through text-xs tabular-nums flex-shrink-0 whitespace-nowrap">
                          {f.worth}
                        </span>
                      )}
                    </div>
                    <p className="text-white/55 text-[13px] leading-relaxed mt-1">{f.detail}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Honnêteté sur les prix barrés : d'où ils sortent, sans les gonfler. */}
            <p className="text-white/30 text-[10.5px] leading-relaxed mb-6">
              Prix barrés = ce que coûte l&apos;équivalent ailleurs (expert-comptable pour auto-entrepreneur VTC, abonnement site vitrine, commission plateforme). Les autres lignes n&apos;ont pas d&apos;équivalent à citer — on préfère ne rien barrer plutôt qu&apos;inventer un chiffre.
            </p>

            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => openFlow(PLAN)}
              className="w-full py-4 rounded-xl text-[15px] font-bold transition-all bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white"
              style={{ boxShadow: '0 0 28px rgba(140,82,255,0.40)' }}
            >
              {PLAN.cta}
            </motion.button>
            <p className="text-center text-white/45 text-[11px] mt-3">
              {IMMEDIATE_PAYMENT
                ? 'Garanti 30 jours · remboursé sans question'
                : `Carte demandée, 0 € débité pendant ${TRIAL_DAYS} jours · annulation 1 clic`}
            </p>
          </motion.div>

          {/* Note parrain */}
          <p className="text-center text-white/40 text-xs mt-6 max-w-lg mx-auto">
            Tu as un lien parrain&nbsp;? Ton mensuel est à <span className="text-white/70 font-semibold tabular-nums">−20&nbsp;% à vie</span> (23,99&nbsp;€/mois). L&apos;annuel est au tarif fixe.
          </p>
        </div>
      </section>

      {/* ── KPIs ── */}
      <section className="py-14 sm:py-16 px-4 border-y border-white/[0.06]">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-[#00D4FF]/85 text-[10px] font-extrabold uppercase mb-8" style={{ letterSpacing: '0.28em' }}>
            OBJECTIFS VISÉS · PREMIERS 60 JOURS
          </p>
          <div className="grid grid-cols-3 gap-4 sm:gap-8 text-center">
            {[
              { target: 387, suffix: '€', label: 'gagnés en plus / mois', color: 'from-violet-300 via-violet-200 to-cyan-200' },
              { target: 3, suffix: 'h', label: 'temps mort en moins / jour', color: 'from-cyan-300 via-cyan-200 to-cyan-100' },
              { target: 90, suffix: 'sec', label: "pour ton 1ᵉʳ insight Ajnaya", color: 'from-green-300 via-green-200 to-cyan-200' },
            ].map((kpi, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div className={'text-4xl sm:text-6xl font-black bg-gradient-to-r ' + kpi.color + ' bg-clip-text text-transparent mb-2 tabular-nums'} style={{ letterSpacing: '-0.04em' }}>
                  <AnimatedCounter target={kpi.target} suffix={kpi.suffix} />
                </div>
                <p className="text-white/55 text-[11px] sm:text-sm leading-tight">{kpi.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPARISON Sans vs Avec FOREAS ── */}
      <section className="py-16 sm:py-20 px-4 border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[#00D4FF]/85 text-[10px] font-extrabold uppercase mb-3" style={{ letterSpacing: '0.28em' }}>LA VRAIE DIFFÉRENCE</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#F8FAFC] leading-tight" style={{ letterSpacing: '-0.03em' }}>
              Le même chauffeur. La même journée.<br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-violet-300 to-cyan-300 bg-clip-text text-transparent">Deux trajectoires.</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4 sm:gap-5">
            <div className="rounded-2xl p-6 sm:p-7 border border-white/[0.06] bg-white/[0.02] relative">
              <p className="text-white/40 text-[10px] font-extrabold uppercase mb-4" style={{ letterSpacing: '0.28em' }}>SANS FOREAS · LA NORME</p>
              <ul className="space-y-3 text-[15px] text-white/65 leading-relaxed">
                <li className="flex gap-2.5"><span className="text-white/30 mt-1">○</span><span>Tu tournes en attendant que ça pingue.</span></li>
                <li className="flex gap-2.5"><span className="text-white/30 mt-1">○</span><span>Tu acceptes la course parce qu'elle est là — pas parce qu'elle paie.</span></li>
                <li className="flex gap-2.5"><span className="text-white/30 mt-1">○</span><span>Le surge tombe pendant que tu es à l'autre bout de Paris.</span></li>
                <li className="flex gap-2.5"><span className="text-white/30 mt-1">○</span><span>Tu finis à 22h, pas convaincu d'avoir bien bossé.</span></li>
                <li className="flex gap-2.5"><span className="text-white/30 mt-1">○</span><span>Le mois prochain, tu fais pareil. Et le suivant aussi.</span></li>
              </ul>
              <div className="mt-6 pt-5 border-t border-white/[0.06]">
                <p className="text-white/50 text-xs uppercase mb-1" style={{ letterSpacing: '0.2em' }}>Net moyen</p>
                <p className="text-2xl font-black text-white/70 tabular-nums" style={{ letterSpacing: '-0.03em' }}>2 840 €<span className="text-sm text-white/40 font-medium">&nbsp;/ mois</span></p>
              </div>
            </div>
            <div className="rounded-2xl p-6 sm:p-7 border border-violet-500/30 bg-gradient-to-b from-violet-900/15 to-black relative" style={{ boxShadow: '0 0 60px rgba(140,82,255,0.15)' }}>
              <p className="text-[#00D4FF] text-[10px] font-extrabold uppercase mb-4" style={{ letterSpacing: '0.28em' }}>
                AVEC FOREAS PRO · 29,99&nbsp;€/MOIS
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
                <p className="text-2xl font-black tabular-nums bg-gradient-to-r from-violet-300 to-cyan-200 bg-clip-text text-transparent" style={{ letterSpacing: '-0.03em' }}>
                  3 227 €<span className="text-sm text-cyan-300/70 font-medium">&nbsp;/ mois</span>
                </p>
                <p className="text-green-400/85 text-[11px] font-semibold mt-1">+387&nbsp;€ · soit 13,6&nbsp;% de marge en plus</p>
              </div>
            </div>
          </div>
          <p className="text-center text-white/45 text-xs mt-6 max-w-2xl mx-auto">
            Ce sont des objectifs visés, pas une promesse. Chaque chauffeur est différent : tes résultats dépendent de ton activité, de ta zone et de tes horaires.
          </p>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-16 px-4 bg-white/[0.02] border-b border-white/[0.06]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[#00D4FF]/85 text-[10px] font-extrabold uppercase mb-3" style={{ letterSpacing: '0.28em' }}>VRAIS CHAUFFEURS · VRAIS VIREMENTS</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#F8FAFC] mb-3" style={{ letterSpacing: '-0.03em' }}>Pas des promesses. Des virements.</h2>
            <p className="text-white/55">3 chauffeurs. 3 villes. 3 trajectoires.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { name: 'Haitham B.', city: 'Paris · 4 ans VTC', avatar: 'HB', gain: '+387 €/mois', detail: 'Vendredi 18h, CDG', quote: "Avant je tournais en rond entre Bercy et Bastille. Maintenant Ajnaya me dit 'pose-toi à Roissy à 18h25, vol AF1234 atterrit'. Je me retrouve premier sur la file. C'est ça le truc.", stars: 5 },
              { name: 'Soufiane M.', city: 'Lyon · 2 ans VTC', avatar: 'SM', gain: '+412 €/mois', detail: 'Mois 1 vs mois 0', quote: "412 € de plus le premier mois. L'abo se paie en une course. Le reste, c'est du bonus que je mets de côté pour passer en SAS.", stars: 5 },
              { name: 'Théodore R.', city: 'Bordeaux · 6 ans VTC', avatar: 'TR', gain: '-3h/jour à vide', detail: 'Au lieu de 11h, je rentre en 8h', quote: "Le vrai gain n'est pas dans mon compte. Il est dans ma tête. Je conduis 3h de moins, je gagne autant. Mes lombaires me remercient.", stars: 5 },
            ].map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
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

      {/* ── GUARANTEE ── */}
      <section className="py-14 sm:py-16 px-4">
        <div className="max-w-lg mx-auto text-center">
          <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-8 backdrop-blur-sm relative" style={{ boxShadow: '0 0 40px rgba(0,212,255,0.08)' }}>
            <div className="text-4xl mb-4">🛡️</div>
            <p className="text-[#00D4FF]/85 text-[10px] font-extrabold uppercase mb-3" style={{ letterSpacing: '0.28em' }}>GARANTIE FERME</p>
            <h3 className="text-xl sm:text-2xl font-bold text-[#F8FAFC] mb-3 leading-tight" style={{ letterSpacing: '-0.025em' }}>
              {IMMEDIATE_PAYMENT
                ? <>Pas convaincu sous 30 jours&nbsp;?<br />Remboursé, sans discuter.</>
                : <>{TRIAL_DAYS} jours pour te faire ton avis.<br />Sur tes vraies courses.</>}
            </h3>
            <p className="text-white/65 text-sm leading-relaxed">
              {IMMEDIATE_PAYMENT
                ? <>Tu paies aujourd&apos;hui. Tu testes en vrai, sur tes vraies courses. Pas convaincu sous 30 jours&nbsp;? On te rembourse, sans question. Tu risques zéro. <span className="text-white/80">Point.</span></>
                : <>0&nbsp;€ aujourd&apos;hui. 0&nbsp;€ jusqu&apos;à lundi 18h. Si tu as un doute, tu fermes l&apos;app — il n&apos;y a rien à annuler. Si tu restes, c&apos;est que ça vaut le coup. <span className="text-white/80">Point.</span></>}
            </p>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 sm:py-20 px-4 border-t border-white/[0.06]">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[#00D4FF]/85 text-[10px] font-extrabold uppercase mb-3" style={{ letterSpacing: '0.28em' }}>QUESTIONS — RÉPONSES SANS LANGUE DE BOIS</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#F8FAFC] mb-3" style={{ letterSpacing: '-0.03em' }}>Les questions qu'on nous pose tout le temps.</h2>
            <p className="text-white/55 text-sm">Si tu hésites, c&apos;est normal — voilà les vraies réponses.</p>
          </div>
          {faqs.map((faq, i) => <FaqItem key={i} id={faq.id} q={faq.q} a={faq.a} />)}
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-16 sm:py-24 px-4 relative">
        <div className="absolute inset-0 pointer-events-none animate-halo-pulse" aria-hidden style={{ background: 'radial-gradient(ellipse 50% 40% at 50% 60%, rgba(140,82,255,0.18) 0%, transparent 70%)' }} />
        <div className="max-w-2xl mx-auto text-center relative">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <p className="text-[#00D4FF]/85 text-[10px] font-extrabold uppercase mb-4" style={{ letterSpacing: '0.28em' }}>{IMMEDIATE_PAYMENT ? 'GARANTI 30 JOURS · ZÉRO RISQUE · TU DÉCIDES' : '7 JOURS · ZÉRO RISQUE · TU DÉCIDES'}</p>
            <h2 className="text-4xl sm:text-5xl font-black text-[#F8FAFC] mb-5 leading-[1.05]" style={{ letterSpacing: '-0.045em' }}>
              {IMMEDIATE_PAYMENT
                ? <>Ce soir,{' '}<span className="bg-gradient-to-r from-violet-300 via-cyan-200 to-violet-300 bg-clip-text text-transparent">tu reprends la main.</span></>
                : <>Dans {TRIAL_DAYS} jours,{' '}<span className="bg-gradient-to-r from-violet-300 via-cyan-200 to-violet-300 bg-clip-text text-transparent">tu sauras.</span></>}
            </h2>
            <p className="text-white/75 text-base sm:text-lg mb-3 leading-relaxed">
              {IMMEDIATE_PAYMENT
                ? <>Soit Ajnaya te fait gagner plus.<br className="hidden sm:block" />Soit tu te fais rembourser sous 30 jours. Dans les deux cas, tu ne perds rien.</>
                : <>Soit Ajnaya t&apos;a fait gagner plus.<br className="hidden sm:block" />Soit tu fermes, tu ne paies rien, tu continues comme avant.</>}
            </p>
            <p className="text-cyan-300/85 text-sm sm:text-base mb-9">
              La seule question&nbsp;: tu préfères savoir, ou pas&nbsp;?
            </p>
            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              onClick={() => openFlow(PLAN)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white font-extrabold py-4 px-12 rounded-2xl text-lg transition-all"
              style={{ boxShadow: '0 0 80px rgba(140,82,255,0.55), 0 4px 20px rgba(0,0,0,0.4)' }}
            >
              {IMMEDIATE_PAYMENT ? <>Démarrer maintenant →</> : <>Activer mon essai {TRIAL_DAYS} jours (0&nbsp;€) →</>}
            </motion.button>
            <div className="flex items-center justify-center gap-x-6 gap-y-2 mt-6 text-white/50 text-[11px] flex-wrap tabular-nums">
              <span>🔒 Stripe · SSL</span>
              <span>{IMMEDIATE_PAYMENT ? <>🛡️ Garanti 30 jours</> : <>✓ 0&nbsp;€ aujourd&apos;hui</>}</span>
              <span>🛡️ Annulation 1 clic</span>
              <span>✓ Sans engagement</span>
            </div>
            <div className="mt-12 pt-8 border-t border-white/[0.06] max-w-lg mx-auto">
              <p className="text-white/65 text-sm leading-relaxed text-left italic">
                <span className="text-cyan-300/85 font-semibold not-italic">PS</span> — Si tu hésites encore, ce n&apos;est pas grave. Mais reviens dans 6 mois, et compare. Tu seras au même point. Le seul truc qui aura changé, c&apos;est ton compteur d&apos;années perdues.<br /><br />
                {IMMEDIATE_PAYMENT
                  ? <>Si tu cliques aujourd&apos;hui, tu as 30 jours pour voir si on est sérieux. Si on ne l&apos;est pas, on te rembourse. <span className="text-[#F8FAFC] font-semibold not-italic">Tu ne perds rien. Tu testes en vrai.</span></>
                  : <>Si tu cliques aujourd&apos;hui, tu as {TRIAL_DAYS} jours pour voir si on est sérieux. Si on ne l&apos;est pas, tu pars, et rien n&apos;est débité. <span className="text-[#F8FAFC] font-semibold not-italic">Tu ne perds rien. Tu testes juste.</span></>}
              </p>
              <p className="text-white/55 text-xs mt-4 text-left">— Chandler, fondateur FOREAS</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Already a member ── */}
      <div className="py-8 text-center border-t border-white/[0.04]">
        <p className="text-white/30 text-sm">
          Déjà abonné ?{' '}
          <a href={authUrls.loginGeneric} className="text-[#00D4FF]/70 hover:text-[#00D4FF] transition-colors duration-150 underline-offset-2 hover:underline">
            Accéder à mon espace →
          </a>
        </p>
      </div>

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

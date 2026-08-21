'use client'

import { useState, useEffect, useRef, Suspense, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { loadStripe } from '@stripe/stripe-js'
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { trackInitiateCheckout } from '@/lib/tracking'
import { mesurer } from '@/lib/mesure'
import { authUrls } from '@/lib/auth-urls'
// 14/08/2026 — les montants et la durée d'essai ne sont plus écrits à la main dans cette
// page. Ils viennent des DEUX sources uniques : offre.ts (ce qu'on facture) et
// verite-commerciale.ts (ce qu'on a le droit d'affirmer, avec la requête qui le prouve).
// C'est exactement le mécanisme qui produisait les faux : un chiffre plausible recopié
// dans un .tsx, plus relié à rien, qui dérive dès que la vraie valeur bouge.
import { PRIX_MENSUEL_CENTIMES, PRIX_ANNUEL_CENTIMES, ESSAI_JOURS, formaterEuros } from '@/lib/offre'
import { PARRAINAGE, PLATEFORMES, COMMUNAUTE, garantieAffichable } from '@/lib/verite-commerciale'
// ── 20/08/2026 — LES CITATIONS VIENNENT DU REGISTRE, PLUS DU FICHIER ────────
// Mesuré : la parole de la même personne existait en quatre versions dans trois
// fichiers. Chacune était un raccourci « pour que ça tienne » — et chacune faisait
// dire à quelqu'un ce qu'il n'a pas dit. Le texte vit maintenant dans
// src/lib/consentements.ts, et lui seul. Réécrire une citation ici est refusé par
// `npm run canon`.
import { citationDe, temoignagePubliable, temoignagePubliableParNom } from '@/lib/consentements'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

// ─── Utils ───────────────────────────────────────────────────────────────────
// Essai GLISSANT de 3 jours — identique pour tout le monde (décision Chandler 22/07).
// Avant : « prochain lundi 18h », un point fixe hebdomadaire → l'essai durait 1 jour pour
// qui s'inscrivait le dimanche soir, 6 jours pour qui s'inscrivait le mardi. Même promesse
// affichée, expérience du simple au sextuple. Doit rester synchronisé avec TRIAL_DAYS
// dans src/app/api/checkout/route.ts (c'est LUI qui pose le vrai trial_end chez Stripe).
// 14/08/2026 — la durée n'est plus recopiée ici : elle vient d'offre.ts, comme
// /api/checkout. C'est cette recopie qui laissait « 7 JOURS » vivre en bas de page
// pendant que Stripe posait un trial_end à J+3 (GET /api/checkout → trialDays: 3).
const TRIAL_DAYS = ESSAI_JOURS
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
    // 14/08/2026 — « si tu restes » laissait croire qu'il fallait FAIRE quelque chose pour
    // être débité. Le code déployé dit l'inverse : /api/checkout crée une session
    // mode:'subscription' avec subscription_data.trial_end ET payment_method_collection
    // 'always' — l'abonnement démarre tout seul, c'est l'annulation qui demande un geste.
    { icon: '💳', label: 'Premier débit — sauf si tu as annulé avant', sub: 'Annulable en 1 clic, à n\'importe quel moment', hl: null, hlC: '', active: false },
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
          {/* 14/08/2026 — « Remboursement 30j » s'affichait dans les DEUX modes, y compris en
              mode essai (IMMEDIATE_PAYMENT = false), où aucune garantie 30 jours n'existe :
              ni sur cette page, ni dans le parcours Stripe. Promesse affichée au moment
              exact où on demande la carte, sans rien derrière. Le badge suit le mode. */}
          {['SSL chiffré', 'Annulation 1 clic', IMMEDIATE_PAYMENT ? 'Remboursement 30j' : `0 € pendant ${TRIAL_DAYS} jours`].map(t => (
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
//   worth  = ce que coûte l'équivalent ailleurs (value stacking). Voir COMMENT_WORTH.
interface Feature { punch: string; detail: string; worth?: string }

// COMMENT_WORTH — d'où sortent les prix barrés. ✅ VALIDÉS PAR CHANDLER le 23/07/2026.
// Ce sont des références marché, pas des tarifs FOREAS : si l'un d'eux est contesté un jour,
// c'est cette liste qui sert de justificatif. Ne pas les gonfler, ne pas en ajouter sans
// source vérifiable — la mention affichée sous la liste engage publiquement leur provenance.
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
    // 14/08/2026 — disait « La carte s'allume là où la demande monte, à 800 m près ».
    // La même promesse a été passée au futur dans StickyFeatures.tsx et
    // ZoneMechanismVisual.tsx sur cette mesure exacte : pieuvre_h3_demand_zones → 0,
    // pieuvre_surge_predictions → 0, extracted_surge_data → 0, bandit_top_zones → 0.
    // Elle avait survécu ICI, au présent, avec la distance au mètre près — sur la page
    // qui demande la carte. Corriger la vitrine et laisser la caisse est le pire des deux.
    detail: 'La carte te montre les zones où tes courses ont vraiment payé, à cette heure-ci. Tu choisis où te poser.',
  },
  {
    punch: 'Un collègue qui connaît la ville. Dans ta poche.',
    detail: 'Tu lui parles à voix haute pendant que tu roules — « où je vais ce soir ? » — elle répond. Mains sur le volant.',
  },
  {
    punch: 'Le contrôle, tu le sais avant de le voir.',
    // 14/08/2026 — disait « Les chauffeurs se signalent les contrôles, accidents et
    // bouchons ». Mesure : community_alerts → 1 074 lignes, source='telegram_scrape'
    // à 100 %, created_by NULL sur la TOTALITÉ — aucun chauffeur n'a jamais signalé
    // quoi que ce soit. tokens_sent → 0, push_notifications sum(sent_count) → 0 sur
    // 990 lignes, community_members → 0. CinematicSequence.tsx a été passé au futur
    // sur cette mesure dans la même passe ; cette phrase-ci était restée au présent,
    // sur la page de paiement.
    detail: 'Les alertes route de ta zone — contrôles, accidents, bouchons — remontées au fil de l\'eau. Et bientôt, celles que les chauffeurs FOREAS se passeront entre eux.',
  },
  {
    punch: 'Une course à 25 € ? 25 € pour toi.',
    detail: 'Un sticker dans ta voiture, un mini-site à ton nom : le client scanne et réserve en direct. La plateforme ne touche rien.',
    worth: '25 % de commission',
  },
  // 14/08/2026 — « tirelire » promettait un service financier que FOREAS ne rend pas :
  // aucune table de portefeuille, aucun compte de cantonnement, aucun mouvement d'argent
  // n'existe. L'URSSAF SE CALCULE, elle ne se met pas de côté. FOREAS est copilote de
  // gestion, jamais expert-comptable (ordonnance du 19 sept. 1945, art. 20).
  {
    punch: 'Ce que tu devras à l\'URSSAF, calculé au fil des courses.',
    detail: 'Course après course, tu vois la provision à garder pour le trimestre. C\'est ton argent, il reste sur ton compte — on calcule, on n\'y touche pas.',
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

// 14/08/2026 — les trois montants étaient écrits en dur ici. Ils descendent maintenant
// d'offre.ts (source unique, alignée sur ce que Stripe facture réellement).
// 249,99 / 12 = 20,8325 → 20,83 €/mois affiché en annuel.
const PLAN: Plan = {
  id: 'pro',           // clé conservée : l'API attend `pro_monthly` / `pro_annual`
  name: 'FOREAS',
  tagline: 'Tout est dedans. Il n\'y a rien d\'autre à choisir.',
  monthlyPrice: PRIX_MENSUEL_CENTIMES / 100,
  annualMonthlyPrice: Math.round(PRIX_ANNUEL_CENTIMES / 12) / 100,
  annualTotal: PRIX_ANNUEL_CENTIMES / 100,
  cta: IMMEDIATE_PAYMENT ? 'Démarrer maintenant' : `Essayer ${TRIAL_DAYS} jours — 0 € aujourd\'hui`,
}

// Remise annuelle réelle, arrondie vers le BAS : 1 − 249,99/(29,99×12) = 30,5 % → 30 %.
const REMISE_ANNUELLE_PCT = Math.floor((1 - PRIX_ANNUEL_CENTIMES / (PRIX_MENSUEL_CENTIMES * 12)) * 100)

// 14/08/2026 — le site annonçait « −20 % à vie » au filleul. Aucun palier à 20 % n'existe :
// `select tier, commission_eur, discount_pct from referral_program_tiers` → 25 €/−10 %,
// 35 €/−15 %, 50 €/−18 %, et `get_referral_discount_for_code` renvoie COALESCE(v_pct, 10).
// Un code chauffeur donne donc 10 %, 18 % au mieux — jamais 20 %.
const REMISE_PARRAIN_MIN_PCT = PARRAINAGE.paliers[0].remisePct
const REMISE_PARRAIN_MAX_PCT = PARRAINAGE.paliers[PARRAINAGE.paliers.length - 1].remisePct
const PRIX_AVEC_PARRAIN = formaterEuros(Math.round(PRIX_MENSUEL_CENTIMES * (1 - REMISE_PARRAIN_MIN_PCT / 100)))

// ─── Main ────────────────────────────────────────────────────────────────────
function TarifsContent() {
  // ⚠️ 21/08/2026 — CETTE PAGE SERVAIT 26 128 OCTETS SANS UN SEUL MOT.
  //
  // Pas de balise de titre, pas le prix, pas le mot « essai ». Mesuré : le
  // texte du corps faisait 28 caractères avant JavaScript, 6 310 après. Le
  // prix 29,99 € n'apparaissait dans AUCUN des 26 128 octets, ni dans aucun
  // des 23 scripts de la page.
  //
  // LA CAUSE : le crochet qui lit la chaîne de requête, appelé pendant le
  // pré-rendu, lève une erreur de repli côté navigateur et FIGE la frontière
  // d'attente la plus proche sur son écran de chargement. Le serveur n'a donc
  // jamais rendu la page — il a rendu la roue qui tourne. Onze autres pages du
  // site avaient exactement le même défaut.
  //
  // LA CORRECTION : on lit l'adresse DANS L'EFFET, jamais pendant le rendu.
  //
  // ⚠️ NE PAS « SIMPLIFIER » en lisant window.location dans l'initialiseur du
  // useState : `window` n'existe pas au pré-rendu. La page ne serait plus vide,
  // elle ne se construirait plus du tout.
  const [isSuccess, setIsSuccess] = useState(false)
  useEffect(() => {
    setIsSuccess(new URLSearchParams(window.location.search).get('success') === 'true')
  }, [])

  // La vue de la page de prix. C'est le dénominateur de tout : sans elle, on
  // ne peut pas dire si les gens n'arrivent pas jusqu'ici, ou s'ils arrivent
  // et repartent. Les deux problèmes se soignent différemment.
  const vueComptee = useRef(false)
  useEffect(() => {
    if (vueComptee.current) return
    vueComptee.current = true
    mesurer('PricingView', { page: '/tarifs2', intention: 'general', audience: 'chauffeur' })
  }, [])
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
    // Deux destinations, volontairement. `trackInitiateCheckout` part vers
    // Meta — utile le jour où l'identifiant existera. `mesurer` écrit chez
    // nous, aujourd'hui. Le même `event_id` des deux côtés évitera de compter
    // l'achat deux fois quand les deux chemins seront vivants.
    trackInitiateCheckout(plan.name, price)
    mesurer('InitiateCheckout', {
      page: '/tarifs2',
      intention: 'general',
      audience: 'chauffeur',
      promesse: plan.name,
      detail: { prix_centimes: Math.round(price * 100) },
    })
  }
  const closeAll = () => { setFlowState('idle'); setSelectedPlan(null) }
  const confirmCheckout = () => setFlowState('checkout')

  const faqs = [
    { id: 'faq-diff', q: "Il y a un seul abonnement ? Pas de version light ?", a: "Un seul, et tout est dedans. Avant il y avait trois formules — le temps que tu passais à comparer, tu ne le passais pas à rouler. Ce que tu prends aujourd'hui, c'est ce que prend le chauffeur d'à côté : le Coach qui calcule ton net avant que tu acceptes, la carte des zones, Ajnaya à la voix, tes clients directs sans commission, ta provision URSSAF, ton site perso. Rien à débloquer plus tard." },
    // 14/08/2026 — ces réponses vendaient un « plan Free » et un « plan Pro » qui n'existent
    // plus : offre.ts ne connaît que `mensuel` et `annuel` (« les deux seules formules
    // vendables aujourd'hui »). Un prospect qui vient chercher la version gratuite ne trouve
    // rien, et repart. Réponse refaite sur ce qui est réellement facturé.
    IMMEDIATE_PAYMENT
      // ⚠️ Branche endormie (IMMEDIATE_PAYMENT vaut false), mais elle porterait la
      // garantie si le drapeau changeait. Elle passe donc par la même source :
      // une promesse ne doit pas pouvoir se rallumer par effet de bord.
      ? { id: 'faq-carte', q: "Je paie tout de suite ? Et si ça me va pas ?", a: garantieAffichable()
          ? "Oui, tu paies aujourd'hui — et tu es couvert par la garantie 30 jours : pas convaincu, tu te fais rembourser sans discuter, sans question. Tu testes en vrai sur tes courses, tu risques zéro."
          : "Oui, tu paies aujourd'hui. Tu testes en vrai sur tes courses, et tu résilies quand tu veux depuis ton espace, sans avoir à te justifier." }
      : { id: 'faq-carte', q: "Pourquoi une carte est demandée si je ne paie rien ?", a: `Parce que Stripe la garde de côté pour activer ton abonnement APRÈS l'essai — pas avant. 0 € aujourd'hui, 0 € pendant tes ${TRIAL_DAYS} jours. À la fin, l'abonnement démarre tout seul : si tu ne veux pas continuer, tu annules en 1 clic depuis l'app avant la fin de l'essai, et rien n'est débité. On te le dit maintenant plutôt que de te le faire découvrir sur ton relevé.` },
    { id: 'faq-mensuel', q: "Pourquoi mensuel et pas hebdomadaire ?", a: `Parce que ${formaterEuros(PRIX_MENSUEL_CENTIMES)}/mois, c'est 1 € par jour — une bouteille d'eau. Tu n'as aucun calcul à faire, tu sais exactement ce que tu paies. En annuel, ${formaterEuros(PRIX_ANNUEL_CENTIMES)} : c'est l'ordre de grandeur d'une journée de chiffre d'affaires, posée une fois, pour 365 jours de décisions.` },
    // 14/08/2026 — la cascade N1 25 € / N2 8 € / N3 2 € n'existe nulle part.
    // `select * from referral_program_tiers` → 3 lignes, et ce sont des PALIERS DE VOLUME
    // (0-14 filleuls : 25 € · 15-49 : 35 € · 50+ : 50 €), pas des niveaux de pyramide :
    // aucun reversement sur le filleul de ton filleul. « Virement automatique » non plus :
    // `select count(*) from referral_commissions` → 0, aucune commission n'a jamais été
    // versée. Le dire franchement vaut mieux que de le faire découvrir au premier filleul.
    { id: 'faq-parrainage', q: `${PARRAINAGE.paliers[0].commissionEur}€/filleul à vie, est-ce un piège ?`, a: `Non, et voilà exactement comment ça marche. Tant que ton filleul reste abonné ET que toi aussi, tu touches ${PARRAINAGE.paliers[0].commissionEur} € par mois sur lui. À partir de 15 filleuls, c'est ${PARRAINAGE.paliers[1].commissionEur} €. À partir de 50, c'est ${PARRAINAGE.paliers[2].commissionEur} €. Ce sont des paliers de volume, pas une pyramide : on ne te promet rien sur les filleuls de tes filleuls. Ton filleul, lui, a −${REMISE_PARRAIN_MIN_PCT} % à vie sur le mensuel, jusqu'à −${REMISE_PARRAIN_MAX_PCT} % selon ton palier. Et on est cash : le programme vient d'ouvrir, aucune commission n'a encore été versée. Tu serais dans les premiers.` },
    { id: 'faq-directs', q: "« Clients directs », ça veut dire quoi concrètement ?", a: "Un sticker avec ton QR code dans la voiture, et un mini-site à ton nom (foreas.xyz/ton-prénom). Le client scanne, il réserve avec toi, il te paie. Aucune plateforme au milieu, donc aucune commission prélevée : une course à 25€, c'est 25€ pour toi. Ça ne remplace pas Uber du jour au lendemain — ça se construit course après course, avec les clients qui reviennent." },
    { id: 'faq-autres-outils', q: "J'ai déjà essayé d'autres outils. Pourquoi celui-ci ?", a: "Parce que les autres te donnent des données — et c'est toi qui fais le tri, le soir, fatigué. Ajnaya te dit où aller MAINTENANT, à la prochaine course. Ce n'est pas un tableau de bord de plus. " + (IMMEDIATE_PAYMENT ? (garantieAffichable() ? "Et tu es couvert : garantie 30 jours satisfait-remboursé pour te faire ta propre idée, sans risque." : "Et tu résilies quand tu veux, depuis ton espace, sans avoir à te justifier.") : `Et tu as ${TRIAL_DAYS} jours pour te faire ta propre idée sur tes vraies courses, sans rien payer.`) },
    { id: 'faq-desactivation', q: "Et si Uber me désactive du jour au lendemain ?", a: "Justement. C'est le scénario pour lequel FOREAS existe. Ajnaya gère Uber + Bolt + Heetch en parallèle. Si une plateforme te coupe, tu redistribues ton temps sur les autres en 1 minute. La communauté FOREAS te briefe sur les bons réflexes pour récupérer ton compte." },
    // 14/08/2026 — « downgrade vers Free » promettait une formule gratuite qui n'existe pas
    // (offre.ts : seules `mensuel` et `annuel` sont vendables). Retiré, pas remplacé.
    { id: 'faq-annulation', q: "Et si je veux arrêter dans 3 mois ?", a: "Tu cliques 'Annuler', tu confirmes, c'est annulé. Pas de relance, pas de mail manipulateur, pas d'appel. Sans engagement = sans engagement. Tu gardes l'accès jusqu'à la fin de la période déjà payée." },
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

      {/* Cale de la hauteur EXACTE du header (h-16 / lg:h-20, cf. Header.tsx).
          Sans elle, le bandeau live démarrait à y=0, donc SOUS le header qui est `fixed top-0`
          et transparent tant qu'on n'a pas scrollé : sur mobile le logo se dessinait
          littéralement par-dessus le texte du bandeau (65 px de recouvrement, mesuré au
          navigateur en 375 px), sur desktop le bandeau et les liens de nav se retrouvaient
          empilés dans la même bande. Défaut préexistant à la refonte tarifs unique.
          Cale locale à cette page : le Header est partagé par tout le site, on ne le touche pas. */}
      <div className="h-16 lg:h-20" aria-hidden />

      {/* Live bar */}
      <div className="relative border-b border-white/[0.06] bg-black/40 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-center gap-3 flex-wrap">
          <span className="flex items-center gap-1.5 text-green-400 text-xs font-medium tabular-nums">
            <span className="relative flex w-2 h-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
            </span>
            {/* 14/08/2026 — « Ajnaya lit 7 plateformes en direct » était deux faux en une
                phrase. Le compte : `select distinct platform from rides` → Uber, Bolt,
                Heetch, Private (« Private » = course directe du chauffeur, pas une
                plateforme tierce) → 3, jamais 7. Et « en direct » : la table qui porterait
                une lecture continue, `driver_ride_features`, est VIDE (0 ligne), tout comme
                `extracted_surge_data`. Nommer les 3 rend la promesse vérifiable par
                n'importe quel chauffeur — c'est le but. */}
            Tes courses {PLATEFORMES.reellementVues.join(', ')} au même endroit
          </span>
          <span className="text-white/20 hidden sm:inline">·</span>
          <span className="text-white/55 text-xs">
            Tarif découverte <span className="text-orange-300 font-semibold tabular-nums">clos à 500 abonnés</span>
          </span>
        </div>
      </div>

      {/* ── HERO ── */}
      {/* pt réduit de 16 → 8 : le pt-16 d'origine servait à compenser le header fixe, rôle
          désormais tenu par la cale au-dessus du bandeau. Le garder aurait cumulé les deux et
          repoussé le prix hors du premier écran sur mobile (80 % du trafic). */}
      <section className="relative pt-8 pb-8 px-4">
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
            {/* 14/08/2026 — « Haitham, Paris : +387 € ce mois-ci » n'existe nulle part :
                `select * from pieuvre_closer_testimonials where driver_name ilike '%haitham%'`
                → 0 ligne, et sa fiche documentée (src/components/zone/testimonials.data.ts,
                Haitham B.) ne porte AUCUN chiffre de gain (gainBadge « Liberté + lien »).
                Une personne identifiable + un gain chiffré sans source, c'est le combo qui
                se paie devant la DGCCRF. Remplacé par la seule phrase chiffrée qu'on peut
                produire : celle que Binate A. dit lui-même, face caméra, dans une vidéo
                publiée sur ce site. Son chiffre, pas le nôtre — et c'est dit tel quel. */}
            {/* ⚠️ 21/08/2026 — la parole vient bien du registre, mais l'accord de
                cette personne est « en attente ». Elle disparaît tant qu'il n'est
                pas signé, comme les vidéos et les notifications nominatives. */}
            {temoignagePubliable('binate') && (
              <p className="text-white/75 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
                Binate A., Marne-la-Vallée&nbsp;: <span className="text-[#F8FAFC] font-semibold">«&nbsp;{citationDe('binate')}&nbsp;»</span> Son chiffre, dit face caméra.
              </p>
            )}
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
            −{REMISE_ANNUELLE_PCT}&nbsp;%
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
                  <span className="text-white/30 line-through text-xl mb-1.5 tabular-nums">{PLAN.monthlyPrice.toFixed(2).replace('.', ',')}€</span>
                )}
                <span className="text-5xl sm:text-6xl font-black text-[#F8FAFC] tabular-nums" style={{ letterSpacing: '-0.045em' }}>
                  {billing === 'monthly'
                    ? `${PLAN.monthlyPrice.toFixed(2).replace('.', ',')}€`
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

            {/* ── Ce que tu as ──────────────────────────────────────────────────
                Détail affiché d'emblée (retour Chandler) : le replier derrière un « ? »
                obligeait à 8 gestes pour lire ce qu'on vend. Un chauffeur qui compare ne
                déplie pas — il scanne. Tout est dit, tout de suite.
                Design system : #F8FAFC sur la promesse (jamais blanc pur), jamais de
                graisse < 500 sur fond noir, opacité de texte jamais sous 0.60 (le prix
                barré est la seule exception assumée — il DOIT s'effacer derrière la
                promesse tout en restant lisible), grille d'espacement 4 pt, tabular-nums
                sur tous les chiffres. */}
            <div className="mb-7 space-y-4">
              {FEATURES.map((f, j) => (
                <div key={j} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-violet-500/20 ring-1 ring-violet-400/25 flex items-center justify-center flex-shrink-0 mt-[3px]">
                    <svg className="w-3 h-3 text-violet-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>

                  <div className="min-w-0 flex-1">
                    {/* flex-wrap : sur 375 px, le prix barré côte à côte écrasait la
                        promesse à 2-3 mots par ligne. Il passe dessous, elle respire. */}
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                      <p className="text-[#F8FAFC] font-semibold text-[15px] sm:text-base leading-snug">
                        {f.punch}
                      </p>
                      {f.worth && (
                        <span className="text-white/45 line-through text-[11px] sm:text-xs font-medium tabular-nums whitespace-nowrap">
                          {f.worth}
                        </span>
                      )}
                    </div>
                    <p className="text-white/65 font-medium text-[13px] sm:text-[13.5px] leading-relaxed mt-1">
                      {f.detail}
                    </p>
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

          {/* Note parrain — 14/08/2026 : « −20 % à vie (23,99 €/mois) » annonçait une remise
              qui n'existe dans aucun palier. La fonction en base
              `get_referral_discount_for_code` renvoie COALESCE(v_pct, 10) et les paliers
              plafonnent à 18 % : un chauffeur arrivé par un lien parrain aurait vu 26,99 €
              au checkout après avoir lu 23,99 € ici. Perdu au pire moment, sur 3 € d'écart. */}
          <p className="text-center text-white/40 text-xs mt-6 max-w-lg mx-auto">
            Tu as un lien parrain&nbsp;? Ton mensuel est à <span className="text-white/70 font-semibold tabular-nums">−{REMISE_PARRAIN_MIN_PCT}&nbsp;% à vie</span> ({PRIX_AVEC_PARRAIN}/mois), et jusqu&apos;à −{REMISE_PARRAIN_MAX_PCT}&nbsp;% selon le palier de ton parrain. L&apos;annuel est au tarif fixe.
          </p>
        </div>
      </section>

      {/* ── KPIs ── */}
      <section className="py-14 sm:py-16 px-4 border-y border-white/[0.06]">
        <div className="max-w-4xl mx-auto">
          {/* 14/08/2026 — ces trois compteurs annonçaient « 387 € gagnés en plus / mois »,
              « 3h de temps mort en moins / jour » et « 90 sec pour ton 1ᵉʳ insight ». Aucun
              des trois ne se mesure : `driver_ride_features` → 0 ligne,
              `driver_ride_features_daily_stats` → 0 ligne, et il n'existe AUCUNE colonne de
              temps à vide dans le schéma. Le mot « objectifs visés » ne sauve pas un gain
              chiffré affiché en 6xl — c'est ce que la DGCCRF regarde. On garde trois
              compteurs, mais chacun porte un chiffre qu'un chauffeur peut vérifier seul
              (src/lib/verite-commerciale.ts : plateformes réellement vues, témoignages
              filmés, durée d'essai réellement posée chez Stripe). */}
          <p className="text-center text-[#00D4FF]/85 text-[10px] font-extrabold uppercase mb-8" style={{ letterSpacing: '0.28em' }}>
            TROIS CHIFFRES · TOUS VÉRIFIABLES
          </p>
          <div className="grid grid-cols-3 gap-4 sm:gap-8 text-center">
            {[
              { target: PLATEFORMES.nombre, suffix: '', label: `plateformes : ${PLATEFORMES.reellementVues.join(', ')}`, color: 'from-violet-300 via-violet-200 to-cyan-200' },
              { target: COMMUNAUTE.temoignagesVideoReels, suffix: '', label: 'chauffeurs filmés, à visage découvert', color: 'from-cyan-300 via-cyan-200 to-cyan-100' },
              { target: TRIAL_DAYS, suffix: 'j', label: "d'essai — 0 € débité", color: 'from-green-300 via-green-200 to-cyan-200' },
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
              {/* 14/08/2026 — « Net moyen 2 840 € » vs « 3 227 € » était un écart fabriqué :
                  aucun agrégat de revenu chauffeur n'existe en base (`driver_ride_features`
                  et `driver_ride_features_daily_stats` → 0 ligne). Les deux colonnes
                  comparent maintenant ce qui est vrai et vérifiable en une soirée : ce que
                  tu SAIS en rentrant. */}
              <div className="mt-6 pt-5 border-t border-white/[0.06]">
                <p className="text-white/50 text-xs uppercase mb-1" style={{ letterSpacing: '0.2em' }}>Ce que tu sais en rentrant</p>
                <p className="text-2xl font-black text-white/70" style={{ letterSpacing: '-0.03em' }}>À peu près<span className="text-sm text-white/40 font-medium">&nbsp;— au feeling</span></p>
              </div>
            </div>
            <div className="rounded-2xl p-6 sm:p-7 border border-violet-500/30 bg-gradient-to-b from-violet-900/15 to-black relative" style={{ boxShadow: '0 0 60px rgba(140,82,255,0.15)' }}>
              {/* 14/08/2026 — trois faux dans cette colonne.
                  · « FOREAS PRO » : la formule Pro n'existe plus, il y a UNE offre (offre.ts).
                  · « Surge multi-plateformes en temps réel » : `extracted_surge_data` → 0
                    ligne, `pieuvre_surge_predictions` → 0 ligne, `driver_ride_features` → 0
                    ligne. Aucune donnée de surge, d'aucune plateforme, à aucune date.
                  · « +47 € vs hier » et « ta moyenne monte mécaniquement » : gains chiffrés
                    et promesse de résultat, invérifiables et interdits (CNIL/DGCCRF).
                  Ce qui reste est ce que l'app fait vraiment : elle t'aide à décider. */}
              <p className="text-[#00D4FF] text-[10px] font-extrabold uppercase mb-4" style={{ letterSpacing: '0.28em' }}>
                AVEC FOREAS · {formaterEuros(PRIX_MENSUEL_CENTIMES)}/MOIS
              </p>
              <ul className="space-y-3 text-[15px] text-[#F8FAFC]/90 leading-relaxed">
                <li className="flex gap-2.5"><span className="text-violet-300 mt-1">●</span><span><strong className="text-[#F8FAFC]">Ajnaya te briefe le matin</strong> : 3 zones chaudes du jour, ordre optimal.</span></li>
                <li className="flex gap-2.5"><span className="text-violet-300 mt-1">●</span><span>Tu prends <strong className="text-[#F8FAFC]">la course qui paie</strong>, tu refuses celle qui te plombe.</span></li>
                <li className="flex gap-2.5"><span className="text-violet-300 mt-1">●</span><span>Tu vois <strong className="text-[#F8FAFC]">les zones qui montent</strong> avant de bouger, au lieu de tourner au hasard.</span></li>
                <li className="flex gap-2.5"><span className="text-violet-300 mt-1">●</span><span>Tu rentres quand ta journée est faite — et <strong className="text-[#F8FAFC]">tu sais ce qu&apos;elle t&apos;a rapporté</strong>.</span></li>
                <li className="flex gap-2.5"><span className="text-violet-300 mt-1">●</span><span>Le mois prochain, tu décides avec <strong className="text-[#F8FAFC]">ce que ce mois-ci t&apos;a appris</strong>.</span></li>
              </ul>
              <div className="mt-6 pt-5 border-t border-violet-500/15">
                <p className="text-cyan-300/85 text-xs uppercase mb-1" style={{ letterSpacing: '0.2em' }}>Ce que tu sais en rentrant</p>
                <p className="text-2xl font-black bg-gradient-to-r from-violet-300 to-cyan-200 bg-clip-text text-transparent" style={{ letterSpacing: '-0.03em' }}>
                  Ton net exact<span className="text-sm text-cyan-300/70 font-medium">&nbsp;— au centime</span>
                </p>
                <p className="text-green-400/85 text-[11px] font-semibold mt-1">Par heure, par km, par course.</p>
              </div>
            </div>
          </div>
          <p className="text-center text-white/45 text-xs mt-6 max-w-2xl mx-auto">
            On ne te promet aucun chiffre. Ce qui change, c&apos;est ce que tu sais avant de décider. Le reste dépend de ton activité, de ta zone et de tes horaires.
          </p>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-16 px-4 bg-white/[0.02] border-b border-white/[0.06]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            {/* 14/08/2026 — « VRAIS VIREMENTS » / « Pas des promesses. Des virements. » :
                aucun virement n'a jamais été émis (`select count(*) from
                referral_commissions` → 0), et FOREAS ne verse rien à un chauffeur abonné.
                Ce qu'on a vraiment, et qui vaut mieux : 6 chauffeurs filmés à visage
                découvert (src/components/zone/testimonials.data.ts). */}
            <p className="text-[#00D4FF]/85 text-[10px] font-extrabold uppercase mb-3" style={{ letterSpacing: '0.28em' }}>VRAIS CHAUFFEURS · FILMÉS À VISAGE DÉCOUVERT</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#F8FAFC] mb-3" style={{ letterSpacing: '-0.03em' }}>Pas des promesses. Des visages.</h2>
            <p className="text-white/55">3 des {COMMUNAUTE.temoignagesVideoReels} chauffeurs qu&apos;on a filmés. Leurs mots, pas les nôtres.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {/* 14/08/2026 — les trois témoignages affichés ici étaient inventés, chiffres compris.
                · Haitham B. : « +387 €/mois », « Paris · 4 ans », un vol AF1234 suivi en direct.
                  Sa vraie fiche (src/components/zone/testimonials.data.ts) dit « Paris · 7 ans »,
                  gainBadge « Liberté + lien », aucun chiffre — et aucun connecteur de suivi
                  aérien n'existe nulle part dans le code (grep 'AF1234|flight|vol_' sur src/
                  → cette ligne, et rien d'autre).
                · Soufiane M. « Lyon », « +412 €/mois » : `pieuvre_closer_testimonials` → 0 ligne,
                  absent des 6 vidéos, et placé à « Paris 11ᵉ » dans un autre composant du
                  même site.
                · Théodore R. « Bordeaux », « -3h/jour à vide » : 0 ligne en base, « Marseille »
                  ailleurs sur le site, et AUCUNE colonne de temps à vide n'existe dans le schéma.
                Personne identifiable + gain chiffré + zéro consentement (`driver_consent` ne
                porte aucun champ image ni témoignage) = le combo qui se paie devant la CNIL.
                Remplacés par 3 des 6 chauffeurs réellement filmés, avec LEURS mots et LEURS
                badges, copiés depuis testimonials.data.ts. */}
            {[
              { name: 'Haitham B.', city: 'Paris · 7 ans VTC', avatar: 'HB', gain: 'Liberté + lien', detail: '7 ans · Paris', quote: citationDe('haitham') },
              { name: 'Dragan P.', city: 'Paris · 9 ans VTC', avatar: 'DP', gain: '2 ans, il reste', detail: '9 ans VTC · 2 ans FOREAS', quote: citationDe('dragan') },
              { name: 'Hadietou', city: 'Banlieue parisienne · 9 ans VTC', avatar: 'HD', gain: 'Il recommande', detail: 'Indépendant · 9 ans VTC', quote: citationDe('hadietou') },
            ].filter((t) => temoignagePubliableParNom(t.name)).map((t, i) => (
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
                  {/*
                    20/08/2026 — LES ÉTOILES SONT PARTIES. Elles valaient 5 pour tout le
                    monde, écrites en dur, et aucune note n'existe nulle part. Cinq étoiles
                    sous le visage de quelqu'un se lisent comme SA note ; ce n'en était pas
                    une. « Filmé » est vrai et se vérifie.
                  */}
                  <span className="text-white/35 text-[10px] uppercase" style={{ letterSpacing: '0.15em' }}>Filmé</span>
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
                ? (garantieAffichable()
                    ? <>Pas convaincu sous 30&nbsp;jours&nbsp;?<br />Remboursé, sans discuter.</>
                    : <>Tu changes d&apos;avis&nbsp;?<br />Tu résilies, quand tu veux.</>)
                : <>{TRIAL_DAYS} jours pour te faire ton avis.<br />Sur tes vraies courses.</>}
            </h3>
            {/* 14/08/2026 — « tu fermes l'app, il n'y a rien à annuler » était faux, et c'est
                le pire endroit du site pour l'être : /api/checkout crée une session
                mode:'subscription' avec subscription_data.trial_end ET
                payment_method_collection:'always'. Un abonnement Stripe EST créé, la carte
                EST enregistrée : ne rien faire, c'est être débité à J+3. Le chauffeur qui
                ferme l'app en confiance découvre le prélèvement sur son relevé. */}
            <p className="text-white/65 text-sm leading-relaxed">
              {IMMEDIATE_PAYMENT
                ? (garantieAffichable()
                    ? <>Tu paies aujourd&apos;hui. Tu testes en vrai, sur tes vraies courses. Pas convaincu sous 30&nbsp;jours&nbsp;? On te rembourse, sans question. Tu risques zéro. <span className="text-white/80">Point.</span></>
                    : <>Tu paies aujourd&apos;hui. Tu testes en vrai, sur tes vraies courses. Et tu résilies quand tu veux, depuis ton espace. <span className="text-white/80">Point.</span></>)
                : <>0&nbsp;€ aujourd&apos;hui. 0&nbsp;€ pendant {TRIAL_DAYS} jours. À la fin de l&apos;essai, ton abonnement démarre tout seul&nbsp;: si tu ne veux pas continuer, tu annules en 1 clic avant, et rien n&apos;est débité. <span className="text-white/80">On te le dit avant, pas après.</span></>}
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
            {/* 14/08/2026 — « 7 JOURS » : l'essai en dure 3. Mesuré sur l'API de prod
                (GET /api/checkout → trialDays: 3, trialEndsAt = J+3) et contredit par le
                reste de la page, qui affichait déjà 3 jours partout ailleurs. Un chauffeur
                qui lit 7 et se fait débiter à J+3 ne revient pas. La valeur vient
                maintenant d'offre.ts, elle ne peut plus diverger. */}
            <p className="text-[#00D4FF]/85 text-[10px] font-extrabold uppercase mb-4" style={{ letterSpacing: '0.28em' }}>{IMMEDIATE_PAYMENT ? 'GARANTI 30 JOURS · ZÉRO RISQUE · TU DÉCIDES' : `${TRIAL_DAYS} JOURS · ZÉRO RISQUE · TU DÉCIDES`}</p>
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

'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { CheckCircle2, Zap, Users, TrendingUp, Star, ArrowRight, Gift } from 'lucide-react'
import { authUrls, loginWithNext } from '@/lib/auth-urls'
import {
  PRIX_MENSUEL_CENTIMES,
  PRIX_ANNUEL_CENTIMES,
  ESSAI_JOURS,
  FORMULES,
  formaterEuros,
} from '@/lib/offre'
import { PLATEFORMES, PARRAINAGE, COMPTA_PHRASES } from '@/lib/verite-commerciale'

import { citationDe, personneDe, villeDe, temoignagePubliable } from '@/lib/consentements'

/**
 * Les témoignages que cette page a le DROIT d'afficher.
 *
 * Le filtre est ici, hors du rendu, pour qu'il ne puisse pas être « oublié »
 * dans une branche du composant : il n'y a plus qu'une seule liste, et elle est
 * déjà filtrée quand elle arrive à l'écran.
 *
 * Tant que les accords sont « en attente », cette liste est VIDE et la section
 * entière disparaît. C'est le comportement voulu : le jour où un accord est
 * signé dans src/lib/consentements.ts, la personne réapparaît toute seule, sans
 * qu'on touche à ce fichier.
 */
const TEMOIGNAGES_CAP = [
  { id: 'binate', detail: 'Tesla · 5 ans VTC · témoignage filmé' },
  { id: 'dragan', detail: '9 ans VTC · témoignage filmé' },
  { id: 'haitham', detail: '7 ans VTC · témoignage filmé' },
]
  .filter(({ id }) => temoignagePubliable(id))
  .map(({ id, detail }) => ({
    name: personneDe(id),
    city: villeDe(id) ?? '',
    quote: '« ' + citationDe(id) + ' »',
    detail,
  }))
// ─── Types ────────────────────────────────────────────────────────────────────
interface PartnerData {
  partner: {
    company_name: string
    company_type: string
    referral_code: string
    landing_message?: string
    landing_hero_url?: string
  }
  discount: {
    percent: number
    duration_months: number
  } | null
}

interface CapClientProps {
  referralCode: string | null
  partnerData: PartnerData | null
}

// ─── Plans (warm variant — with discount applied) ─────────────────────────────
// CE QUI ÉTAIT FAUX : trois formules HEBDOMADAIRES — Essentiel 12,97 €, Pro 14,97 €,
// Elite 34,97 €. Aucune n'est encaissable. MESURE 14/08/2026 : `src/app/api/checkout/route.ts`
// ne connaît que PRIX_MENSUEL_CENTIMES (2999) et PRIX_ANNUEL_CENTIMES (24999) ; le mapping
// PRICE_IDS des anciennes formules a été retiré le 22/07 (commentaire lignes 6-14 du même
// fichier). Et /tarifs2 — où mène le bouton de cette carte — répond en production « Un seul,
// et tout est dedans ». Deux pages en ligne se contredisaient : trois formules ici, une seule
// là-bas, à un autre prix et à une autre périodicité.
// RÈGLE : plus aucun montant en dur ici. Tout vient de src/lib/offre.ts.
const ECONOMIE_ANNUELLE_CENTIMES = PRIX_MENSUEL_CENTIMES * 12 - PRIX_ANNUEL_CENTIMES
const ANNUEL_PAR_MOIS_CENTIMES = Math.round(PRIX_ANNUEL_CENTIMES / 12)

// Un seul abonnement : les deux cartes sont la MÊME offre, payée au mois ou à l'année.
// D'où une liste d'inclus unique — il n'y a rien à débloquer plus tard.
// « Zones chaudes IA », « Ajnaya IA illimitée » : le mot IA est banni du site, Ajnaya a un nom.
// « Parrainage 10€/filleul » : aucun montant à 10 € n'existe — `referral_program_tiers`
// (14/08/2026) → 25 € / 35 € / 50 €.
// URSSAF : formulation imposée par le garde-fou légal (ordonnance du 19 sept. 1945, art. 20) —
// FOREAS calcule ce qui sera dû, FOREAS ne met rien de côté et n'est pas expert-comptable.
const INCLUS = [
  `Vos courses ${PLATEFORMES.reellementVues.join(', ')} au même endroit`,
  'La carte des zones',
  'Ajnaya, à la voix ou au clavier',
  'Le net de la course, calculé avant que vous acceptiez',
  // Formulation impersonnelle volontaire : FOREAS calcule ce qui sera dû. FOREAS ne met
  // rien de côté (aucun compte de cantonnement n'existe) et n'est pas expert-comptable.
  `${COMPTA_PHRASES.titre} : ce qui sera dû, calculé au fil des courses`,
  'Vos clients directs, sans commission — votre site à votre nom',
  `Parrainage : ${PARRAINAGE.paliers[0].commissionEur} € par chauffeur que vous amenez`,
]

const PLANS = [
  {
    id: 'mensuel',
    name: FORMULES.mensuel.libelle,
    centimes: PRIX_MENSUEL_CENTIMES,
    periode: 'par mois',
    // AVANT : « Le choix de la majorité des chauffeurs ». Il n'existe aucune majorité à
    // constater — 5 abonnements actifs sur 30 chauffeurs au 14/08/2026, et aucune ventilation
    // par formule puisque les formules hebdomadaires ne sont plus facturables.
    description: FORMULES.mensuel.sousTitre,
    miseEnAvant: true,
    // AVANT : badge « Le plus populaire », piloté par un `popular: true` écrit à la main —
    // aucun agrégat de souscriptions n'alimente cette page (aucun fetch dans le fichier).
    // Remplacé par un fait vérifiable : l'annulation en un clic, sans engagement.
    badge: 'Sans engagement',
    features: INCLUS,
  },
  {
    id: 'annuel',
    name: FORMULES.annuel.libelle,
    centimes: PRIX_ANNUEL_CENTIMES,
    periode: 'par an',
    // Économie calculée à partir des deux montants canoniques, jamais écrite à la main.
    description: `soit ${formaterEuros(ANNUEL_PAR_MOIS_CENTIMES)} par mois — ${formaterEuros(
      ECONOMIE_ANNUELLE_CENTIMES,
    )} d’économie sur l’année`,
    miseEnAvant: false,
    badge: null,
    features: INCLUS,
  },
]

// CE QUI ÉTAIT FAUX ici :
// · « Ajnaya lit 7 plateformes » + « en direct » → `select distinct platform from rides`
//   (14/08/2026) renvoie Uber, Bolt, Heetch et « Private » (course directe, pas une
//   plateforme) : 3 plateformes réelles, jamais 7. Et la table qui porterait une lecture
//   continue (`driver_ride_features`) est VIDE. Nommer les 3 rend la promesse vérifiable.
// · « Parrainage à vie · 10€/mois par filleul actif » → `referral_program_tiers` : 25/35/50 €
//   par palier de volume. Ni 10 €, ni « à vie », ni mensuel.
// · « IA positionnement temps réel » → mot banni + promesse de précision (« 15 min avant »)
//   qu'aucune mesure ne soutient.
const BENEFITS = [
  { icon: Zap, label: 'Tu sais où te poser', sub: 'La carte des zones plutôt que ton intuition' },
  {
    icon: TrendingUp,
    label: 'Tes courses au même endroit',
    sub: `${PLATEFORMES.reellementVues.join(', ')} — tu choisis, tu ne subis pas`,
  },
  {
    icon: Users,
    label: 'Tu parraines, tu touches',
    sub: `${PARRAINAGE.paliers[0].commissionEur} € par chauffeur que tu amènes, jusqu’à ${PARRAINAGE.paliers[2].commissionEur} € selon ton volume`,
  },
  {
    icon: Star,
    label: `${ESSAI_JOURS} jours d’essai`,
    sub: 'Carte demandée, 0 € prélevé. Tu annules en un clic.',
  },
]

// ─── Cookie setter (client-only side effect) ──────────────────────────────────
function useCookieSetter(referralCode: string | null) {
  const set = useRef(false)
  useEffect(() => {
    if (!referralCode || set.current) return
    set.current = true
    // 30 days = 2592000 seconds
    document.cookie = `foreas_partner_ref=${encodeURIComponent(referralCode)}; max-age=2592000; path=/; SameSite=Lax`
  }, [referralCode])
}

// ─── Pricing card ─────────────────────────────────────────────────────────────
function PricingCard({
  plan,
  discountPct,
  referralCode,
}: {
  plan: (typeof PLANS)[number]
  discountPct: number
  referralCode: string | null
}) {
  const hasDiscount = discountPct > 0
  // La remise partenaire est réelle : /api/checkout crée le coupon Stripe `foreas_ref_{pct}`
  // à partir du même pourcentage. On l'applique donc au prix CANONIQUE, plus à un tarif
  // hebdomadaire qui n'existe plus.
  const centimesAffiches = hasDiscount
    ? Math.round(plan.centimes * (1 - discountPct / 100))
    : plan.centimes

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={`relative rounded-2xl p-6 flex flex-col ${
        plan.miseEnAvant
          ? 'border border-violet-500/40 bg-violet-500/[0.06]'
          : 'border border-white/[0.06] bg-white/[0.03]'
      }`}
      style={
        plan.miseEnAvant
          ? { boxShadow: '0 0 40px rgba(140,82,255,0.12), 0 0 80px rgba(255,102,153,0.06)' }
          : {}
      }
    >
      {plan.miseEnAvant && plan.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-gradient-to-r from-violet-500 to-rose-500 text-white text-[11px] font-semibold px-3 py-1 rounded-full">
            {plan.badge}
          </span>
        </div>
      )}

      <div className="mb-4">
        <h3 className="font-title text-xl font-semibold text-white mb-1">{plan.name}</h3>
        <p className="font-body text-sm text-white/40">{plan.description}</p>
      </div>

      {/* Pricing */}
      <div className="mb-5">
        {hasDiscount ? (
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="font-title text-3xl font-bold text-white">
              {formaterEuros(centimesAffiches)}
            </span>
            <span className="font-body text-sm text-white/40">{plan.periode}</span>
            <span className="line-through text-white/30 text-sm">{formaterEuros(plan.centimes)}</span>
            <span className="text-rose-400 text-xs font-semibold bg-rose-500/10 px-2 py-0.5 rounded-full">
              -{discountPct}%
            </span>
          </div>
        ) : (
          <div className="flex items-baseline gap-2">
            <span className="font-title text-3xl font-bold text-white">
              {formaterEuros(plan.centimes)}
            </span>
            <span className="font-body text-sm text-white/40">{plan.periode}</span>
          </div>
        )}
      </div>

      {/* Features */}
      <ul className="space-y-2.5 mb-6 flex-1">
        {plan.features.map((f) => (
          <li key={f} className="flex items-center gap-2.5 font-body text-sm text-white/70">
            <CheckCircle2 className="w-4 h-4 text-violet-400 flex-shrink-0" />
            {f}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Link
        href={`/tarifs2${referralCode ? `?ref=${referralCode}` : ''}`}
        className={`block text-center py-3 px-5 rounded-xl font-body font-semibold text-sm transition-all duration-200 ${
          plan.miseEnAvant
            ? 'bg-gradient-to-r from-violet-600 to-rose-600 text-white hover:from-violet-500 hover:to-rose-500 shadow-lg shadow-violet-900/20'
            : 'border border-white/10 text-white/80 hover:border-white/20 hover:text-white'
        }`}
      >
        {/* « Essai gratuit » sans autre précision laissait croire qu'aucune carte n'est
            demandée : /api/checkout est en `payment_method_collection: 'always'`. La carte
            est enregistrée, 0 € est prélevé pendant l'essai. On l'écrit. */}
        {hasDiscount
          ? `Commencer — ${discountPct}% en moins`
          : `Essayer ${ESSAI_JOURS} jours — 0 € aujourd’hui`}
      </Link>
    </motion.div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function CapClient({ referralCode, partnerData }: CapClientProps) {
  useCookieSetter(referralCode)

  const partner = partnerData?.partner
  const discount = partnerData?.discount
  const discountPct = discount?.percent || 0
  const discountMonths = discount?.duration_months || 0

  const isValidCode = !!partner
  const partnerName = partner?.company_name || 'Un partenaire FOREAS'

  return (
    <main id="main-content" className="min-h-screen bg-black text-white overflow-x-hidden">
      <Header />

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-16 md:pt-36 md:pb-20 px-6 lg:px-8 overflow-hidden">
        {/* Warm background halos — variant warm spec: violet 0.22 + rose 0.14 */}
        <div
          className="absolute inset-0 pointer-events-none animate-halo-pulse"
          aria-hidden
          style={{
            background:
              'radial-gradient(ellipse 70% 60% at 30% 20%, rgba(140,82,255,0.22) 0%, transparent 70%),' +
              'radial-gradient(ellipse 50% 50% at 80% 80%, rgba(255,102,153,0.14) 0%, transparent 70%)',
          }}
        />

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Partner badge */}
          {isValidCode && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2.5 mb-6 px-4 py-2 rounded-full border border-violet-500/30 bg-violet-500/[0.08] font-body text-sm"
            >
              <Gift className="w-4 h-4 text-violet-400" />
              <span className="text-white/70">Invité par</span>
              <span className="text-white font-medium">{partnerName}</span>
            </motion.div>
          )}

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-title text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight mb-5"
          >
            {/* AVANT : « L'IA qui multiplie vos courses VTC ». Deux problèmes. Le mot « IA »
                est banni du site (Ajnaya a un nom, on l'emploie). Et « multiplie vos courses »
                promet un résultat qu'aucune mesure ne soutient : `rides` ne contient que
                18 lignes au 14/08/2026, tous chauffeurs confondus — il n'existe aucun
                avant/après à comparer. Ce qui reste, et qui est vrai : Ajnaya dit où se poser. */}
            {discount ? (
              <>
                <span className="text-white">Vous ne roulez plus au hasard.</span>
                <br />
                <span
                  style={{
                    background: 'linear-gradient(135deg, #8C52FF 0%, #FF6699 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Ajnaya vous dit où vous poser —{' '}
                  <span className="whitespace-nowrap">-{discountPct}% offerts</span>
                </span>
              </>
            ) : (
              <>
                <span className="text-white">Vous ne roulez plus au hasard.</span>
                <br />
                <span
                  style={{
                    background: 'linear-gradient(135deg, #8C52FF 0%, #FF6699 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Ajnaya vous dit où vous poser
                </span>
              </>
            )}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="font-body text-base md:text-lg text-white/55 max-w-2xl mx-auto mb-8"
          >
            {/* AVANT : « FOREAS analyse la demande en temps réel [...] 15 minutes à l'avance ».
                Deux affirmations non tenues : la table qui porterait une lecture continue
                (`driver_ride_features`) est VIDE au 14/08/2026, et aucune prédiction n'est
                vérifiée (`was_right` NULL sur les 169 lignes). On garde ce que le produit fait
                vraiment : conseiller une zone, et calculer le net avant d'accepter. */}
            {partner?.landing_message ||
              (discount
                ? `${partnerName} vous offre ${discountPct}% de réduction pendant ${discountMonths} mois. Ajnaya vous conseille une zone et calcule ce que la course vous laisse vraiment, avant que vous acceptiez.`
                : `Ajnaya vous conseille une zone et calcule ce que la course vous laisse vraiment, avant que vous acceptiez. ${ESSAI_JOURS} jours d’essai, 0 € prélevé.`)}
          </motion.p>

          {/* Discount banner */}
          {discount && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="inline-flex items-center gap-3 mb-8 px-5 py-3 rounded-2xl border border-rose-500/30 bg-rose-500/[0.06]"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #8C52FF, #FF6699)' }}
              >
                <span className="text-white text-sm font-bold">%</span>
              </div>
              <div className="text-left">
                <p className="font-body text-sm font-semibold text-white">
                  -{discountPct}% les {discountMonths} premiers mois
                </p>
                <p className="font-body text-xs text-white/40">
                  Offre exclusive via {partnerName} · Code : {referralCode}
                </p>
              </div>
            </motion.div>
          )}

          {/* Primary CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="flex flex-col sm:flex-row gap-3 justify-center items-center"
          >
            <Link
              href={`/tarifs2${referralCode ? `?ref=${referralCode}` : ''}`}
              className="group relative inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-body font-semibold text-sm text-white overflow-hidden transition-all duration-200"
              style={{
                background: 'linear-gradient(135deg, #8C52FF 0%, #FF6699 100%)',
                boxShadow: '0 4px 24px rgba(140,82,255,0.35)',
              }}
            >
              <span>S&apos;inscrire — {ESSAI_JOURS} jours d&apos;essai</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            {/* La durée vient de src/lib/offre.ts (ESSAI_JOURS), pas d'un 3 écrit à la main.
                Et on annonce la carte : /api/checkout est en `payment_method_collection:
                'always'` — la carte EST enregistrée, l'abonnement Stripe EST créé. */}
            <p className="font-body text-xs text-white/35">
              Carte demandée · 0 € prélevé pendant {ESSAI_JOURS} jours · Annulation en 1 clic
            </p>
          </motion.div>

          {/* Already a driver — secondary link */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="font-body text-xs text-white/25 mt-4"
          >
            Déjà chauffeur FOREAS ?{' '}
            <a
              href={loginWithNext('driver', '/driver')}
              className="text-[#00D4FF]/60 hover:text-[#00D4FF] transition-colors duration-150 underline-offset-2 hover:underline"
            >
              Mon espace chauffeur
            </a>
            {' · '}
            <a
              href={authUrls.loginPartner}
              className="text-violet-400/60 hover:text-violet-400 transition-colors duration-150 underline-offset-2 hover:underline"
            >
              Espace Directeur
            </a>
          </motion.p>
        </div>
      </section>

      {/* ── Benefits ──────────────────────────────────────────────────────────── */}
      <section className="py-16 md:py-20 px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {BENEFITS.map((b, i) => (
              <motion.div
                key={b.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="p-4 md:p-5 rounded-2xl border border-white/[0.06] bg-white/[0.03] text-center"
              >
                <div
                  className="w-9 h-9 rounded-xl mx-auto mb-3 flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, rgba(140,82,255,0.2), rgba(255,102,153,0.15))' }}
                >
                  <b.icon className="w-4.5 h-4.5 text-violet-400" />
                </div>
                <p className="font-body text-sm font-semibold text-white/90 mb-1">{b.label}</p>
                <p className="font-body text-xs text-white/40 leading-relaxed">{b.sub}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────────────────── */}
      <section className="py-16 md:py-20 px-6 lg:px-8 relative">
        <div
          className="absolute inset-0 pointer-events-none animate-halo-pulse"
          aria-hidden
          style={{
            background:
              'radial-gradient(ellipse 60% 50% at 70% 50%, rgba(255,102,153,0.14) 0%, transparent 70%)',
          }}
        />
        <div className="max-w-5xl mx-auto relative">
          {/* Section header */}
          <div className="text-center mb-12">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="font-body text-xs font-semibold uppercase tracking-widest text-violet-400 mb-3"
            >
              Tarifs
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="font-title text-3xl md:text-4xl font-bold text-white mb-3"
            >
              {/* « Choisissez votre plan » n'a plus d'objet : il n'y a qu'un abonnement,
                  au mois ou à l'année (src/lib/offre.ts). C'est aussi ce que répond /tarifs2. */}
              {discount
                ? `Votre offre exclusive — -${discountPct}% pendant ${discountMonths} mois`
                : 'Un seul abonnement, tout est dedans'}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="font-body text-sm text-white/45"
            >
              {/* « −30 % » était un chiffre écrit à la main : l'économie réelle se calcule
                  à partir des deux montants canoniques, elle ne se devine pas. */}
              Au mois ou à l&apos;année · {formaterEuros(ECONOMIE_ANNUELLE_CENTIMES)} d&apos;économie
              en annuel · Carte demandée, 0 € prélevé pendant {ESSAI_JOURS} jours
            </motion.p>
          </div>

          {/* Plans grid — 2 colonnes depuis la suppression des formules Essentiel/Pro/Elite :
              une grille de 3 laisserait une colonne vide et casserait le rendu. */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto">
            {PLANS.map((plan) => (
              <PricingCard
                key={plan.id}
                plan={plan}
                discountPct={discountPct}
                referralCode={referralCode}
              />
            ))}
          </div>

          {/* Fine print */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center font-body text-xs text-white/25 mt-6"
          >
            {/* La phrase « Réduction appliquée automatiquement » s'affichait même sans code
                partenaire valide, donc sans aucune réduction. Elle est maintenant conditionnée
                au cas où la remise existe réellement (coupon Stripe `foreas_ref_{pct}`). */}
            {discountPct > 0
              ? 'Réduction appliquée automatiquement via votre code partenaire. Annulation sans frais à tout moment.'
              : 'Annulation sans frais à tout moment, en un clic.'}
          </motion.p>
        </div>
      </section>

      {/* ── Social proof ──────────────────────────────────────────────────────── */}
      {/* ⚠️ 21/08/2026 — CETTE SECTION SERVAIT TROIS PERSONNES RÉELLES SANS ACCORD.
          Binate, Dragan et Haitham étaient nommés, cités et localisés sur cette
          page en ligne, avec « Mes revenus sont montés de 30 % ».

          Le commentaire ci-dessous DISAIT DÉJÀ que les six accords sont « en
          attente » et qu'aucun n'est signé. Le fichier importait même le
          registre — pour y lire la parole, jamais pour demander la permission.
          Un commentaire qui constate le problème pendant que le code le commet
          est la pire configuration possible : il donne l'illusion que quelqu'un
          a regardé.

          Le garde `temoignagePubliable()` existait et était appelé dans CINQ
          autres fichiers. Celui-ci était le sixième, et le seul oublié. Septième
          fois que le piège du jumeau se referme dans ce projet.

          Toute la section disparaît quand personne n'est publiable — laisser un
          titre « ils en parlent » au-dessus du vide serait pire que rien. */}
      {TEMOIGNAGES_CAP.length > 0 && (
      <section className="py-16 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* CE QUI ÉTAIT FAUX — les trois témoignages étaient invraisemblables, mesuré le
                14/08/2026 :
                · « Karim B. — +38% de CA en 2 mois » : le chauffeur existe en base, avec un
                  abonnement INACTIF et une carte VTC NON vérifiée. Aucune fiche à son nom dans
                  `pieuvre_closer_testimonials` → aucun transcript, aucun consentement, aucun
                  calcul. Et `rides` ne contient que 18 lignes au total, tous chauffeurs
                  confondus : il n'existe aucun avant/après à comparer.
                · « Soufiane M. — +412€/mois » : 0 ligne dans `drivers`, 0 dans
                  `pieuvre_closer_testimonials`. Le même nom portait des attributs différents
                  sur /tarifs2 — deux versions du même homme en production.
                · « Théodore R. — -28% de km à vide » : 0 ligne en base, et la métrique est
                  structurellement impossible : `rides` ne porte ni distance à vide, ni trace
                  GPS entre deux courses. Le CLAUDE.md du dépôt lui attribue en plus un autre
                  chiffre (« -28% fatigue »).
                REMPLACÉS par trois chauffeurs filmés à visage découvert.

                ⚠️ 21/08/2026 — DEUX CHOSES ÉTAIENT FAUSSES DANS CE COMMENTAIRE.

                1. IL DISAIT « CONSENTIS ». Les six accords sont au statut
                   « en attente » depuis le premier jour. Aucun n'est signé.

                2. LA CITATION DE HAITHAM ÉTAIT ALTÉRÉE, PAS RACCOURCIE.
                   registre : « Foreas m'aide à me concentrer à 100 % sur mon
                               boulot. Quand on a besoin de quoi que ce soit, on
                               a une réponse instantanément. »
                   ici      : « Je me concentre à 100 % sur mon boulot. »
                   Retirer « Foreas m'aide à » lui retire son sujet : la phrase
                   ne dit plus que FOREAS l'aide, elle dit qu'il se concentre.
                   On lui faisait décrire sa propre discipline et on l'affichait
                   comme un témoignage produit.

                   Même famille que l'incident du 14/08 (« aucun souci » devenu
                   « aucun souci de PAIEMENT »). Et la règle du canon ne l'a pas
                   vue : elle cherche des COPIES du verbatim, or une réécriture
                   n'est pas une copie.

                Ce fichier n'importait même pas le registre. Il le fait
                maintenant : la parole et la ville viennent de là, et de nulle
                part ailleurs. */}
            {TEMOIGNAGES_CAP.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02]"
              >
                {/* Les 5 étoiles affichées ici étaient une note que personne n'a jamais
                    donnée : aucune table d'avis, aucune colonne de satisfaction n'existe
                    (mesuré le 14/08/2026). Une note inventée sur un vrai chauffeur est pire
                    qu'un témoignage inventé — le bloc est retiré, le verbatim reste. */}
                <p className="font-title text-xl font-bold text-white mb-1">{t.quote}</p>
                <p className="font-body text-xs text-white/40 mb-3">{t.detail}</p>
                <p className="font-body text-sm font-medium text-white/70">
                  {t.name} · <span className="text-white/35">{t.city}</span>
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* ── Final CTA ─────────────────────────────────────────────────────────── */}
      <section className="py-16 md:py-20 px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 md:p-10 rounded-3xl border border-violet-500/25 bg-violet-500/[0.04]"
            style={{ boxShadow: '0 0 60px rgba(140,82,255,0.10), 0 0 120px rgba(255,102,153,0.06)' }}
          >
            <h2 className="font-title text-3xl md:text-4xl font-bold text-white mb-3">
              Prêt à rouler plus intelligemment ?
            </h2>
            {/* « Essai gratuit » seul laissait entendre qu'aucune carte n'est demandée.
                Elle l'est (`payment_method_collection: 'always'`), et un abonnement Stripe
                est créé dès l'inscription : il faut l'annuler, ce n'est pas « rien à faire ». */}
            <p className="font-body text-sm text-white/50 mb-7">
              {discount
                ? `Profitez de votre -${discountPct}% pendant ${discountMonths} mois via ${partnerName}.`
                : `${ESSAI_JOURS} jours d’essai. Carte demandée, 0 € prélevé. Vous annulez en un clic avant la fin, vous n’êtes pas débité.`}
            </p>
            <Link
              href={`/tarifs2${referralCode ? `?ref=${referralCode}` : ''}`}
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl font-body font-semibold text-sm text-white transition-all duration-200"
              style={{
                background: 'linear-gradient(135deg, #8C52FF 0%, #FF6699 100%)',
                boxShadow: '0 4px 28px rgba(140,82,255,0.40)',
              }}
            >
              Commencer mes {ESSAI_JOURS} jours d&apos;essai
              <ArrowRight className="w-4 h-4" />
            </Link>
            {discount && (
              <p className="font-body text-xs text-white/25 mt-4">
                Code : {referralCode} · Réduction appliquée automatiquement
              </p>
            )}
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  )
}

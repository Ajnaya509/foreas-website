'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import dynamic from 'next/dynamic'
import Header from '@/components/Header'
import GradientLine from '@/components/GradientLine'
import Footer from '@/components/Footer'
import TiltCard from '@/components/TiltCard'
import { useIsMobile, useReducedMotion } from '@/hooks/useDevicePerf'
import { Clock, ShieldQuestion, TrendingDown, Brain, BarChart3, Palette, Wallet } from 'lucide-react'
// Site2026v58 — 14/08/2026 : tout chiffre affiché ici vient de `verite-commerciale.ts`,
// jamais d'une constante écrite à la main dans le JSX. C'est exactement comme ça que
// « 147 actifs · Paris » a pu vivre deux ans sur cette page sans être relié à rien.
import { COMMUNAUTE_PHRASES } from '@/lib/verite-commerciale'
// Site2026v51 — Apple-grade depth system
// Site2026v55 — Müller-Brockmann grid system (Container, Grid 12-col)
import {
  HeroNarrative,
  EyebrowLabel,
  AppleCTA,
  MarkerPulse,
  GlassPanel,
  DepthBackground,
  Container,
  Grid,
} from '@/components/ui'

// ═══════════════════════════════════════════════════════════════════════════════
// FOREAS /professionnels — BIG DOMINO B2B / AUTORITÉ
// (Anciennement la home `/`. Déplacée le 03/05/2026 pour laisser la place
//  à la home chauffeur B2C avec search bar Ajnaya. Préservation totale des
//  mockups + architecture parallax existante.)
//
// Audience : hôtels, Airbnb hosts, conciergeries, entreprises qui cherchent
// un partenaire transport premium pour leurs clients.
// Objectif : quand un prospect Private Hunter google "FOREAS partenaires VTC",
// il tombe ici et voit une opération crédible, technologique, d'envergure.
// ═══════════════════════════════════════════════════════════════════════════════
//
// Le composant exporté reste `HomePage` car réutilisé tel quel — Next.js
// route via le path `/professionnels`, le nom du composant n'a pas d'effet.

const Testimonials = dynamic(() => import('@/components/Testimonials'))
const DashboardMockup = dynamic(() => import('@/components/DashboardMockup'))

// ─── Animated Counter ────────────────────────────────────────────────────────
function AnimatedStat({ value, label, suffix = '' }: { value: string; label: string; suffix?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="text-center"
    >
      <div className="font-title text-3xl md:text-5xl font-bold text-white mb-1">
        {value}<span className="text-accent-cyan">{suffix}</span>
      </div>
      <div className="font-body text-xs md:text-sm text-white/40">{label}</div>
    </motion.div>
  )
}

// ─── Partner Logo Placeholder ────────────────────────────────────────────────
function PartnerCategory({ icon, name, desc }: { icon: string; name: string; desc: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="p-[1px] rounded-2xl bg-gradient-to-r from-white/[0.05] to-white/[0.05] hover:from-accent-purple/30 hover:to-accent-cyan/30 transition-all duration-500"
    >
      <div className="p-6 md:p-8 rounded-[15px] bg-[#08080d] h-full group">
        <div className="text-3xl mb-4">{icon}</div>
        <h3 className="font-title text-lg md:text-xl font-semibold text-white mb-2">{name}</h3>
        <p className="font-body text-sm text-white/45 leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  )
}

// ─── Value Prop Block (glassmorphism card for horizontal scroll) ─────────────
function ValueProp({ number, title, desc, accent = 'accent-cyan', icon: Icon }: {
  number: string; title: string; desc: string; accent?: string; icon?: React.ElementType
}) {
  return (
    <div className="group flex-shrink-0 w-[300px] md:w-[400px] p-5 md:p-7 rounded-2xl border border-white/[0.08] bg-[#0a0a12]/95 md:bg-white/[0.03] md:backdrop-blur-sm hover:border-accent-cyan/20 transition-all snap-start">
      <div className="mb-4">
        {Icon ? (
          <div className={`w-10 h-10 rounded-full bg-${accent}/10 flex items-center justify-center`}>
            <Icon className={`w-5 h-5 text-${accent}`} />
          </div>
        ) : (
          <div className={`w-3 h-3 rounded-full bg-${accent}`} />
        )}
      </div>
      <span className="font-mono text-xs text-white/30 uppercase tracking-widest">{number}</span>
      <h3 className="font-title text-xl md:text-2xl font-semibold text-white mt-2 mb-3">{title}</h3>
      <p className="font-body text-sm md:text-base text-white/50 leading-relaxed">{desc}</p>
    </div>
  )
}

// ─── Horizontal Sticky Scroll for Solution Section ───────────────────────────
function HorizontalValueProps() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()
  const cardWidth = 400
  const gap = 24
  const cardCount = 4
  const totalWidth = cardCount * cardWidth + (cardCount - 1) * gap

  // Desktop-only: useScroll + useTransform (max 2 useScroll on desktop: hero + this)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  const x = useTransform(
    scrollYProgress,
    [0, 1],
    [0, -(totalWidth - 800)]
  )

  const sectionHeading = (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="text-center mb-10 md:mb-14"
    >
      <span className="inline-block text-xs font-mono uppercase tracking-widest text-accent-cyan/50 mb-4">
        La solution
      </span>
      <h2 className="font-title text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-white mb-5">
        {/* 20/08/2026 — disait « Un réseau intelligent », au présent de l'indicatif.
            partner_referrals → 0 ligne, partner_applications → 0 ligne : le réseau
            n'existe pas encore. Le PROGRAMME, lui, existe et s'ouvre — c'est ce
            qu'on annonce. Une page qui dit vrai sur son stade attire des partenaires
            fondateurs ; une page qui exagère les perd au premier rendez-vous. */}
        Le réseau que nous construisons,
        <span className="block bg-gradient-to-r from-accent-cyan to-accent-purple bg-clip-text text-transparent">
          au service de votre marque.
        </span>
      </h2>
    </motion.div>
  )

  const cards = (
    <>
      {/* CORRIGÉ 14/08/2026 — deux mensonges dans une seule carte.
          (1) « par l'IA » / « notre IA » : le mot est banni du site, Ajnaya a un nom.
          (2) « de la data en temps réel » : FAUX, mesuré. La table qui porterait une
              lecture continue, `driver_ride_features`, est VIDE (0 ligne) —
              cf. verite-commerciale.ts §2, `PLATEFORMES.lectureEnDirect = false`.
          (3) « positionne les chauffeurs » : FOREAS est un assistant d'aide à la
              décision (cgu/page.tsx:39), pas un dispatcher qui déplace une flotte.
          Le chiffre « moins de 4 minutes » est retiré : aucune mesure ne l'appuie. */}
      <ValueProp
        number="01"
        icon={Brain}
        title="Ajnaya prévient les chauffeurs avant l'appel"
        desc="Ajnaya anticipe la demande et signale aux chauffeurs où se placer avant que vos clients appellent. Des indépendants prévenus tôt, plutôt qu'une voiture qu'on cherche au dernier moment."
      />
      {/* CORRIGÉ 14/08/2026 — « Chaque course est scorée. Ponctualité, propreté,
          avis client » : AUCUNE de ces trois données n'existe. Aucune table de
          scoring qualité en base (information_schema : bandit_top_zones,
          chronos_vigie_scores, fraud_risk_scores, pieuvre_churn_scores — aucune
          ne porte ponctualité, propreté ni avis) ; les colonnes de `rides` ne
          contiennent ni note ni avis. Ce qui EST vrai et reste : la traçabilité
          (rides → 18 lignes, dont 10 rattachées à un partner_id). */}
      <ValueProp
        number="02"
        icon={BarChart3}
        title="Traçable, course par course"
        desc="Chaque course passée par votre établissement est tracée : horodatage, trajet, chauffeur identifié. Le scoring qualité — ponctualité, propreté, avis client — arrivera avec les premiers partenaires. Plus jamais un trajet anonyme."
        accent="accent-purple"
      />
      {/* CORRIGÉ 14/08/2026 — « Co-branding dans l'app » : le seul white-label qui
          existe est une landing WEB. Les deux seules colonnes de branding de la table
          `partners` (landing_message, landing_hero_url) sont lues UNIQUEMENT par
          src/app/cap/CapClient.tsx:17-18 et :259. Rien dans l'app chauffeur.
          « Itinéraire pré-configuré » et « suivi partagé » n'existent nulle part. */}
      <ValueProp
        number="03"
        icon={Palette}
        title="Votre marque, dès la réservation"
        desc="Co-branding sur votre page de réservation FOREAS : votre nom, votre visuel, votre message d'accueil. Votre client part de chez vous, pas de chez nous. L'intégration dans l'application chauffeur est en préparation."
      />
      <ValueProp
        number="04"
        icon={Wallet}
        title="Un flux de revenus passif sur chaque course"
        desc="Commission partenaire sur chaque trajet généré via votre établissement. Le transport passe d'un centre de coût à une ligne de revenu."
        accent="accent-purple"
      />
    </>
  )

  // ── Mobile: native CSS horizontal scroll (zero useScroll) ──
  if (isMobile) {
    return (
      <div className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          {sectionHeading}
          <div
            className="flex gap-6 overflow-x-auto pb-4 -mx-6 px-6 snap-x snap-mandatory"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {cards}
          </div>
        </div>
      </div>
    )
  }

  // ── Desktop: sticky horizontal scroll with useScroll + useTransform ──
  return (
    <div ref={containerRef} className="relative" style={{ height: '250vh' }}>
      <div className="sticky top-0 h-screen flex items-center overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 lg:px-8 w-full">
          {sectionHeading}
          <motion.div style={{ x, willChange: 'transform' }} className="flex gap-6">
            {cards}
          </motion.div>
        </div>
      </div>
    </div>
  )
}


// ═══════════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function HomePage() {
  const heroRef = useRef<HTMLElement>(null)
  const isMobile = useIsMobile()
  const reducedMotion = useReducedMotion()

  // Desktop-only: useScroll for hero parallax (max 2 useScroll on desktop: hero + horizontal)
  const { scrollYProgress: heroScrollProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })

  // Parallax layers — desktop only
  const glowY = useTransform(heroScrollProgress, [0, 1], [0, 50])
  const titleY = useTransform(heroScrollProgress, [0, 1], [0, 100])
  const mockupY = useTransform(heroScrollProgress, [0, 1], [0, 150])

  return (
    <main className="min-h-screen bg-foreas-obsidian">
      <Header />

      {/* ═══════════════════════════════════════════════════════════════
          1. HERO — Autorité immédiate + Parallax (desktop) / Static fade-in (mobile)
          Big Domino B2B : "Il existe un système d'intelligence mobilité
          qui peut transformer chaque déplacement de vos clients
          en expérience premium."
          ═══════════════════════════════════════════════════════════════ */}

      {/* ── HERO Apple-grade v51 (DepthBackground + GlassPanel + AppleCTA) ─────
          Mobile et Desktop unifiés (responsive single section)
          Layers Z-stack :
            0. bg solid #050508 (body)
            1. DepthBackground variant="hero" (mesh + grain + 5 orbes parallax + vignette)
            2. Content (text + CTAs + DashboardMockup)
            3. GlassPanel "Ajnaya · Réseau Paris" floating au-dessus du mockup
               (était "Ajnaya · Live" — retiré le 14/08/2026, rien de live ici)
          ───────────────────────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        data-section="hero"
        className="relative overflow-hidden pt-32 pb-24 md:pt-40 md:pb-32"
      >
        {/* Layer 1 — Background depth system */}
        <DepthBackground variant="hero" parallax={!isMobile} />

        {/* Layer 2 — Content via Müller-Brockmann grid 12-col */}
        <Container className="relative z-10">
          <Grid gap="xl" className="items-center">
            {/* Text column — 12 cols mobile / 7 cols desktop */}
            <motion.div
              style={reducedMotion || isMobile ? {} : { y: titleY, willChange: 'transform' }}
              className="col-span-12 lg:col-span-7 text-center lg:text-left"
            >
              <HeroNarrative
                eyebrow="Ajnaya · Intelligence Mobilité"
                eyebrowDot
                eyebrowColor="cyan"
                scene="Offrez à vos clients le transport qu'ils méritent."
                sceneAccent="qu'ils méritent."
                align={isMobile ? 'center' : 'left'}
                className="mb-8"
              />

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.32, ease: [0.16, 1, 0.3, 1] }}
                className="font-body text-body-lg text-text-secondary measure mx-auto lg:mx-0 mb-10"
              >
                {/* CORRIGÉ 14/08/2026 — « FOREAS connecte » était au présent de
                    l'indicatif : ça affirme un état actuel. Mesuré le 14/08 :
                    partner_referrals → 0, partner_applications → 0, et les 3 seules
                    lignes de `partners` sont des comptes internes (FOREAS Test,
                    FOREAS HQ Paris, Apple Review Partenaire). Aucun hôtel, aucune
                    conciergerie, aucune entreprise n'est connectée.
                    « Pilotés par Ajnaya » était faux aussi : FOREAS est un assistant
                    d'aide à la décision pour chauffeurs INDÉPENDANTS (cgu/page.tsx:39),
                    pas un dispatcher de flotte. Ce qui se construit s'écrit au futur. */}
                FOREAS relie votre établissement à des chauffeurs VTC indépendants équipés
                d&apos;Ajnaya — ponctualité, qualité, traçabilité. Le réseau partenaire se
                construit maintenant : vous pouvez en être parmi les premiers.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.45 }}
                className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-12"
              >
                <AppleCTA
                  as="link"
                  href="/contact"
                  variant="primary"
                  size="lg"
                  iconRight={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  }
                >
                  Devenir partenaire
                </AppleCTA>
                <AppleCTA as="link" href="/chauffeurs" variant="ghost" size="lg">
                  Je suis chauffeur
                </AppleCTA>
              </motion.div>

              {/* Authority signals — Cialdini précis (Site2026v57)
                  CORRIGÉ 14/08/2026 — trois des quatre chips étaient faux :
                  · « Maroc » : aucune activité. zones_canonical → 52 zones, dont 0 au
                    Maroc (aucun name ILIKE '%maroc%' / '%casablanca%' / '%marrakech%' /
                    '%rabat%'). Aucune page, aucun tarif, aucun contenu marocain dans
                    tout le dépôt — et la même page annonçait « Paris & Île-de-France »
                    plus bas. On garde le périmètre réel.
                  · « Pilotage Ajnaya 24/7 » : même mensonge que le paragraphe hero.
                    FOREAS ne pilote aucune flotte, il équipe des indépendants.
                  · « API REST + Webhooks » : n'existe pas. ls src/app/api/partner/ →
                    `apply` UNIQUEMENT (formulaire de candidature). Aucune route
                    versionnée, aucun endpoint de lecture de courses, aucun registre de
                    webhooks sortants, aucune doc publique (sitemap → 0 URL /docs).
                  Ces libellés sont lus par un prospect B2B qui peut tout vérifier. */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="hidden sm:flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2"
              >
                <EyebrowLabel color="muted" as="span">Paris · Île-de-France</EyebrowLabel>
                <span className="w-px h-3 bg-white/10" aria-hidden="true" />
                <EyebrowLabel color="muted" as="span">Chauffeurs équipés d&apos;Ajnaya</EyebrowLabel>
                <span className="w-px h-3 bg-white/10" aria-hidden="true" />
                <EyebrowLabel color="muted" as="span">Carte pro VTC requise</EyebrowLabel>
                <span className="w-px h-3 bg-white/10" aria-hidden="true" />
                <EyebrowLabel color="muted" as="span">Intégration sur mesure</EyebrowLabel>
              </motion.div>

              {/* Mobile authority — grid 2x2 (mêmes libellés, même correction) */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="sm:hidden grid grid-cols-2 gap-3"
              >
                <EyebrowLabel color="muted" as="span">Paris · Île-de-France</EyebrowLabel>
                <EyebrowLabel color="muted" as="span">Chauffeurs équipés d&apos;Ajnaya</EyebrowLabel>
                <EyebrowLabel color="muted" as="span">Carte pro VTC requise</EyebrowLabel>
                <EyebrowLabel color="muted" as="span">Intégration sur mesure</EyebrowLabel>
              </motion.div>
            </motion.div>

            {/* DashboardMockup column — 12 cols mobile / 5 cols desktop (Grid Müller-Brockmann) */}
            <motion.div
              style={reducedMotion || isMobile ? {} : { y: mockupY, willChange: 'transform' }}
              initial={{ opacity: 0, x: isMobile ? 0 : 40, y: isMobile ? 40 : 0 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 0.9, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="col-span-12 lg:col-span-5 relative flex justify-center lg:justify-end"
            >
              <div className="relative max-w-[300px] lg:max-w-[400px]">
                <DashboardMockup />

                {/* Glass card flottante — CORRIGÉ 14/08/2026.
                    Elle affichait « Ajnaya · Live » + « 147 actifs · Paris ».
                    Les deux étaient faux, et le second prouvait le premier :
                    · 147 était une CONSTANTE LITTÉRALE dans ce JSX. Aucun fetch, aucun
                      useEffect dans ce fichier — rien de « live » n'alimentait ce bloc.
                    · La mesure du 14/08 : drivers → 30 au total, 9 marqués actifs, et
                      count(*) filter (where last_active > now()-interval '24 hours')
                      → **0**. Pas 147. Pas même 1.
                    · La seule route « live » du site, /api/live-driver-count, n'est
                      jamais appelée d'ici et renvoie elle-même source="fallback"
                      (un jitter déterministe 140-160, route.ts:33-40).
                    Le chiffre vient désormais de verite-commerciale.ts, qui porte sa
                    requête et sa date. 30, c'est petit — et ça se défend devant
                    n'importe quel hôtelier qui demande à voir. 147 ne se défendait pas. */}
                <GlassPanel
                  level="floating"
                  glow="cyan"
                  radius="lg"
                  padding="sm"
                  className="absolute -top-3 -right-3 lg:-top-4 lg:-right-4 flex items-center gap-3 z-20"
                >
                  <MarkerPulse size={28} />
                  <div className="text-left pr-1">
                    <EyebrowLabel color="cyan">Ajnaya · Réseau Paris</EyebrowLabel>
                    <p className="text-[12px] text-text-secondary mt-0.5 tabular-nums">
                      {COMMUNAUTE_PHRASES.tailleHonnete}
                    </p>
                  </div>
                </GlassPanel>
              </div>
            </motion.div>
          </Grid>
        </Container>
      </section>


      {/* ═══════════════════════════════════════════════════════════════
          1.5 BANDE DE PREUVE — RETIRÉE ET REMPLACÉE LE 14/08/2026

          Ce qu'il y avait ici : une bande « Soutenu par les acteurs du transport
          & de l'hospitalité » affichant FRENCH TECH 120, Bpifrance, Sista Network,
          TechCrunch et Les Échos, suivie de la mention « Logos sous accord —
          communiqués officiels disponibles sur demande ».

          Aucun de ces cinq organismes n'apparaît NULLE PART ailleurs dans le dépôt :
          aucun accord, aucun communiqué, aucune trace. Le commentaire du code disait
          lui-même « Placeholders pour l'instant — remplir avec vrais logos quand
          partenariats annoncés » : des bouchons partis en production.

          Ce n'est pas un oubli cosmétique. Faire croire qu'on est agréé ou soutenu
          par un organisme public (Bpifrance est une banque publique, French Tech 120
          un programme d'État) est une pratique commerciale trompeuse EXPLICITEMENT
          listée par le code de la consommation. Et « communiqués disponibles sur
          demande » transforme un bouchon en affirmation active.

          Remplacé par ce qui est VRAI et vérifiable en trente secondes par le lecteur.
          Socle : FOREAS-SHARED/VERITE_COMMERCIALE_2026-08-14.md
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative py-12 md:py-16 border-t border-b border-white/[0.04]">
        <Container>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center text-eyebrow text-text-muted mb-8"
          >
            Ce que vous pouvez vérifier vous-même
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 md:gap-x-14"
          >
            {[
              { chiffre: 'App Store', detail: 'application publiée' },
              { chiffre: 'Google Play', detail: 'application publiée' },
              { chiffre: '6', detail: 'chauffeurs filmés, à visage découvert' },
              { chiffre: 'France', detail: 'conçu et hébergé en Europe' },
            ].map((item) => (
              <span key={item.chiffre} className="text-center select-none">
                <span className="block font-title text-lg md:text-xl text-text-secondary tracking-wide tabular-nums">
                  {item.chiffre}
                </span>
                <span className="block text-[11px] text-text-muted mt-1">{item.detail}</span>
              </span>
            ))}
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-center text-[11px] text-text-muted mt-6"
          >
            Nous ne revendiquons aucun label ni soutien institutionnel.
          </motion.p>
        </Container>
      </section>


      {/* ═══════════════════════════════════════════════════════════════
          2. PROBLÈME B2B — La douleur du partenaire
          "Vos clients méritent mieux que ce qu'ils ont aujourd'hui."
          ═══════════════════════════════════════════════════════════════ */}
      <section data-section="problem" className="relative py-20 md:py-28 bg-[#08080d]">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-14 md:mb-20"
          >
            <span className="inline-block text-xs font-mono uppercase tracking-widest text-accent-purple/50 mb-4">
              Le problème
            </span>
            <h2 className="font-title text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-white mb-5">
              Le transport de vos clients
              <span className="block bg-gradient-to-r from-red-400 to-red-500/70 bg-clip-text text-transparent">
                est votre angle mort.
              </span>
            </h2>
            <p className="font-body text-base md:text-lg text-white/45 max-w-2xl mx-auto">
              Vous investissez dans l&apos;accueil, le design, l&apos;expérience. Mais le premier et le dernier contact de votre client
              avec votre ville — le trajet — échappe totalement à votre contrôle.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0 }}
              className="p-6 rounded-2xl border border-red-500/10 bg-[#0a0a12]/95 md:bg-transparent md:backdrop-blur-sm bg-red-500/[0.03] animate-red-pulse-border transition-transform duration-150 hover:[transform:rotate(0.5deg)]"
            >
              <Clock className="w-8 h-8 text-red-400/40 mb-3" />
              <div className="text-red-400/60 text-xs font-mono uppercase tracking-widest mb-3">Expérience dégradée</div>
              <h3 className="font-title text-lg font-semibold text-white mb-2">Votre client attend 15 min sous la pluie.</h3>
              <p className="text-sm text-white/45">Il vient de quitter votre hôtel 5 étoiles. Son VTC est en retard. Sa première note Google mentionne le transport.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="p-6 rounded-2xl border border-red-500/10 bg-[#0a0a12]/95 md:bg-transparent md:backdrop-blur-sm bg-red-500/[0.03] animate-red-pulse-border transition-transform duration-150 hover:[transform:rotate(-0.5deg)]"
            >
              <ShieldQuestion className="w-8 h-8 text-red-400/40 mb-3" />
              <div className="text-red-400/60 text-xs font-mono uppercase tracking-widest mb-3">Zéro contrôle</div>
              <h3 className="font-title text-lg font-semibold text-white mb-2">Vous ne savez pas qui conduit vos clients.</h3>
              <p className="text-sm text-white/45">Pas de suivi, pas de qualité garantie, pas de data. Le chauffeur est un inconnu. Votre marque en dépend pourtant.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="p-6 rounded-2xl border border-red-500/10 bg-[#0a0a12]/95 md:bg-transparent md:backdrop-blur-sm bg-red-500/[0.03] animate-red-pulse-border transition-transform duration-150 hover:[transform:rotate(0.5deg)]"
            >
              <TrendingDown className="w-8 h-8 text-red-400/40 mb-3" />
              <div className="text-red-400/60 text-xs font-mono uppercase tracking-widest mb-3">Revenu manqué</div>
              <h3 className="font-title text-lg font-semibold text-white mb-2">Le transport génère 0€ pour vous.</h3>
              <p className="text-sm text-white/45">Vos clients prennent des VTC chaque jour. Mais c&apos;est Uber qui encaisse, pas vous. Aucune commission, aucun partenariat.</p>
            </motion.div>
          </div>
        </div>
      </section>

      <GradientLine className="py-4" />


      {/* ═══════════════════════════════════════════════════════════════
          3. SOLUTION — Ce que FOREAS change (Horizontal Sticky Scroll)
          Le miroir positif : chaque douleur a sa réponse
          ═══════════════════════════════════════════════════════════════ */}
      <section data-section="solution" className="relative">
        <HorizontalValueProps />
      </section>

      <GradientLine className="py-4" />


      {/* ═══════════════════════════════════════════════════════════════
          4. QUI SONT NOS PARTENAIRES — Catégories cibles
          Hôtels, Airbnb, conciergeries, entreprises
          ═══════════════════════════════════════════════════════════════ */}
      <section data-section="partners" className="relative py-20 md:py-28 bg-[#08080d]">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14 md:mb-20"
          >
            <span className="inline-block text-xs font-mono uppercase tracking-widest text-accent-cyan/50 mb-4">
              Partenaires idéaux
            </span>
            <h2 className="font-title text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-white">
              Conçu pour ceux qui
              <span className="block bg-gradient-to-r from-accent-purple to-accent-cyan bg-clip-text text-transparent">
                ne transigent pas sur l&apos;expérience.
              </span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <TiltCard>
              <PartnerCategory
                icon="🏨"
                /* CORRIGÉ 14/08/2026 — « service navette IA » : le mot « IA » est banni
                   du site (Ajnaya a un nom), et FOREAS n'exploite aucune navette. */
                name="Hôtels & Résidences"
                desc="Du palace au boutique-hôtel. Offrez à vos clients un transport préparé avec Ajnaya : arrivée aéroport, transferts, sorties. Votre conciergerie devient digitale."
              />
            </TiltCard>
            <TiltCard>
              <PartnerCategory
                icon="🏠"
                name="Airbnb & Locations courte durée"
                desc="Vos voyageurs ne connaissent pas Paris. Intégrez un lien FOREAS dans votre livret d'accueil. Transport premium, zéro effort de votre côté."
              />
            </TiltCard>
            <TiltCard>
              <PartnerCategory
                icon="🎩"
                name="Conciergeries & Services premium"
                desc="Vos clients veulent du sur-mesure. FOREAS fournit le transport avec la même exigence : ponctualité, discrétion, traçabilité complète."
              />
            </TiltCard>
            <TiltCard>
              <PartnerCategory
                icon="🏢"
                /* CORRIGÉ 14/08/2026 — « API d'intégration » : il n'y en a pas.
                   ls src/app/api/partner/ → `apply` uniquement. Même mesure que les
                   chips du hero et que la carte « API & Intégrations » plus bas :
                   aucune route partenaire, aucun webhook sortant, aucune doc. */
                name="Entreprises & Événementiel"
                desc="Séminaires, salons, déplacements corporate. Intégration construite avec vous, facturation centralisée, suivi des trajets. Le transport devient un service managé."
              />
            </TiltCard>
          </div>
        </div>
      </section>

      <GradientLine className="py-4" />


      {/* ═══════════════════════════════════════════════════════════════
          5. TECHNOLOGIE — L'avantage FOREAS
          Montrer la profondeur tech pour crédibiliser
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative py-20 md:py-28">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14 md:mb-20"
          >
            <span className="inline-block text-xs font-mono uppercase tracking-widest text-accent-purple/50 mb-4">
              Sous le capot
            </span>
            <h2 className="font-title text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-white mb-5">
              Pas un simple service VTC.
              <span className="block bg-gradient-to-r from-accent-cyan to-accent-purple bg-clip-text text-transparent">
                Un système d&apos;intelligence.
              </span>
            </h2>
            {/* CORRIGÉ 14/08/2026 — trois problèmes en deux lignes :
                « données temps réel » (la table de lecture continue
                `driver_ride_features` est VIDE — verite-commerciale.ts §2),
                « optimisation IA » (mot banni : Ajnaya a un nom), et
                « le plus réactif du marché » (superlatif comparatif invérifiable,
                exactement ce que la DGCCRF appelle une allégation trompeuse). */}
            <p className="font-body text-base md:text-lg text-white/45 max-w-2xl mx-auto">
              FOREAS réunit les signaux terrain, l&apos;analyse prédictive et les décisions
              d&apos;Ajnaya pour rendre le transport de vos clients prévisible.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-6 rounded-2xl border border-accent-cyan/10 bg-accent-cyan/[0.03]"
            >
              <div className="w-12 h-12 mb-4 rounded-xl bg-accent-cyan/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-accent-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                </svg>
              </div>
              {/* CORRIGÉ 14/08/2026 — « IA Prédictive » : le mot « IA » est banni du
                  site. Ajnaya a un nom, on l'emploie. */}
              <h3 className="font-title text-lg font-semibold text-white mb-2">Anticipation Ajnaya</h3>
              <p className="text-sm text-white/45">Trains, vols, événements, météo — Ajnaya anticipe la demande 15 à 30 minutes avant qu&apos;elle se matérialise.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="p-6 rounded-2xl border border-accent-purple/10 bg-accent-purple/[0.03]"
            >
              <div className="w-12 h-12 mb-4 rounded-xl bg-accent-purple/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-accent-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              </div>
              {/* CORRIGÉ 14/08/2026 — l'espace partenaire existe, mais la métrique
                  « satisfaction » n'existe NULLE PART : grep -rin 'satisfaction'
                  src/app/dashboard/partner/ → aucun résultat, aucune table de rating
                  ou d'avis en base, aucune colonne de note dans `rides`. « Temps réel »
                  est retiré aussi : partner_referrals → 0, et les 3 seuls comptes de
                  `partners` sont internes — aucun partenaire réel n'a jamais ouvert
                  cet écran. Restent les deux données qui, elles, sont portées par la
                  table `partners` : total_drivers / pending_commission / total_earned. */}
              <h3 className="font-title text-lg font-semibold text-white mb-2">Dashboard Partenaire</h3>
              <p className="text-sm text-white/45">Espace partenaire : les courses générées via votre établissement et la commission qui vous revient. Le suivi de satisfaction client arrivera avec les premiers établissements. Vous pilotez le transport comme vous pilotez votre RevPAR.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="p-6 rounded-2xl border border-accent-green/10 bg-accent-green/[0.03]"
            >
              <div className="w-12 h-12 mb-4 rounded-xl bg-accent-green/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                </svg>
              </div>
              {/* CORRIGÉ 14/08/2026 — « Endpoints REST, webhooks, documentation
                  complète » : rien de tout ça n'existe. ls src/app/api/partner/ →
                  `apply` uniquement ; aucune route versionnée, aucun endpoint de
                  lecture/écriture de courses, aucun registre de webhooks sortants ;
                  aucun connecteur PMS (ni Opera, ni Mews, ni Protel) ; et le sitemap
                  de production ne référence AUCUNE page /docs ou /developer — il n'y
                  avait littéralement aucune URL à donner au prospect qui la demande.
                  Le titre perd « API » pour la même raison. */}
              <h3 className="font-title text-lg font-semibold text-white mb-2">Intégration sur mesure</h3>
              <p className="text-sm text-white/45">Intégrez FOREAS dans votre app, votre site ou votre PMS. Le connecteur est développé avec vous pendant l&apos;onboarding — l&apos;API partenaire publique viendra ensuite.</p>
            </motion.div>
          </div>
        </div>
      </section>

      <GradientLine className="py-4" />


      {/* ═══════════════════════════════════════════════════════════════
          6. SOCIAL PROOF — Témoignages chauffeurs
          Même si B2B, montrer que les chauffeurs sont vrais et contents
          = preuve que le réseau fonctionne
          ═══════════════════════════════════════════════════════════════ */}
      <Testimonials />

      <GradientLine className="py-4" />


      {/* ═══════════════════════════════════════════════════════════════
          7. CTA FINAL — Devenir partenaire
          Pas de Stripe ici. Contact / démo.
          ═══════════════════════════════════════════════════════════════ */}
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
            <h2 className="font-title text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-white mb-6">
              Le transport de vos clients,
              <span className="block bg-gradient-to-r from-accent-purple to-accent-cyan bg-clip-text text-transparent">
                réinventé.
              </span>
            </h2>

            {/* CORRIGÉ 14/08/2026 — « Rejoignez les établissements qui… » affirmait
                l'existence d'un groupe de partenaires. Mesuré : partner_referrals → 0,
                partner_applications → 0, et les 3 lignes de `partners` sont des comptes
                internes (FOREAS Test, FOREAS HQ Paris, Apple Review Partenaire).
                Il n'y a personne à rejoindre. Assumer qu'on démarre est vrai — et c'est
                un meilleur argument : l'avance se prend au début, pas dans la foule. */}
            <p className="font-body text-lg text-white/55 max-w-xl mx-auto mb-10">
              Le réseau partenaire démarre. Vous ne rejoignez pas une foule — vous prenez
              de l&apos;avance sur les établissements qui subissent encore le transport
              de leurs clients.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <a
                href="/contact"
                className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-accent-purple to-accent-cyan" />
                <span className="relative">Demander une démo</span>
                <svg className="relative w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
              <a
                href="/chauffeurs"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-medium text-white/70 hover:text-white border border-white/10 hover:border-white/20 rounded-2xl transition-all duration-300"
              >
                Espace chauffeur
              </a>
            </div>

            {/* CORRIGÉ 14/08/2026 — « Intégration en 48h » : un délai chiffré, promis
                au pied du CTA, alors qu'AUCUN établissement n'a jamais été intégré
                (partner_applications → 0, partner_referrals → 0) et qu'il n'existe
                aucun connecteur prêt à brancher (ls src/app/api/partner/ → `apply`).
                Un délai qu'on n'a jamais tenu une seule fois ne s'affiche pas. */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-white/35 text-sm">
              <span>Paris & Île-de-France</span>
              <span>Partenariat sur mesure</span>
              <span>Onboarding accompagné</span>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  )
}

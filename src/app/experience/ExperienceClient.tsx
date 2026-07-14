'use client'

/**
 * /experience — page "découverte produit" (Apple-style scrollytelling, mobile-first).
 * Centrée sur le téléphone vivant (LivePhone) plutôt que sur le funnel zone déjà testé sur / —
 * c'est un A/B distinct, pas un doublon (comparer 2 mécaniques de hero, pas 2 copies).
 *
 * Sections "feature" = illustrations CSS honnêtes (mêmes que le mockup validé), PAS des captures
 * d'écran réelles pour l'instant. À remplacer par les vidéos Screen Studio/Rotato de Chandler
 * quand elles seront prêtes (le squelette scroll-reveal est déjà en place, GSAP ScrollTrigger +
 * Lenis pour le scrub vidéo desktop = phase suivante, pas installé tant qu'il n'y a pas de vidéo
 * à scrubber — cf. recap).
 *
 * Design : tokens réels (tailwind.config.ts), pas d'approximation. Copy : copy-atomic (tutoiement,
 * chiffres honnêtes, zéro promesse non prouvée). Tracking : posthog.capture (même convention que
 * home_modal_*).
 */

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { motion } from 'framer-motion'
import posthog from 'posthog-js'
import { MessageCircle, MapPin, ArrowRight } from 'lucide-react'
import ForeasLogo from '@/components/experience/ForeasLogo'
import LivePhone, { orderZonesByCity } from '@/components/experience/LivePhone'
import ExperiencePhoneToasts from '@/components/experience/ExperiencePhoneToasts'
import TestimonialVideoCard from '@/components/zone/TestimonialVideoCard'
import { TESTIMONIALS } from '@/components/zone/testimonials.data'
import { InkGradientButton } from '@/components/ui'
import { buildWAUrl } from '@/lib/whatsappLink'
import { useIsMobile } from '@/hooks/useDevicePerf'

// Même modale que la home (HomeHeroCream.tsx) — pas une réinvention. Chandler : "je veux la même".
const AjnayaConversationModal = dynamic(() => import('@/components/home2026/AjnayaConversationModal'), { ssr: false })
// Même pop-up anti-départ que la home — réutilisé tel quel, déjà générique (WhatsApp + garde-fous propres).
const ExitIntentModal = dynamic(() => import('@/components/home2026/ExitIntentModal'))

const reveal = {
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const },
}

// Entrée immédiate (pas whileInView — le hero est au-dessus de la ligne de flottaison)
const heroReveal = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
}

const BINATE = TESTIMONIALS.find((t) => t.name.startsWith('Binate')) ?? TESTIMONIALS[0]

const FEATURES = [
  {
    tag: 'L’app · en action',
    eyebrow: 'Où ça paie',
    title: 'La carte voit avant toi.',
    sub: 'Une zone se réveille à 800 m de toi ? Elle s’allume — avant que ton appli sonne.',
    illus: 'map' as const,
  },
  {
    tag: 'Coach de course',
    eyebrow: 'Coach de course',
    title: 'Accepter ou refuser. 0,3 seconde.',
    sub: 'Chaque course est pesée pendant qu’elle sonne. Toi, tu gardes les yeux sur la route.',
    illus: 'coach' as const,
  },
  {
    tag: 'Ajnaya vocale',
    eyebrow: 'Mains sur le volant',
    title: 'Elle parle. Tu conduis.',
    sub: 'Vocal ou texte, comme tu veux. Pendant que tu roules, elle bosse.',
    illus: 'voice' as const,
  },
  {
    tag: 'Copilote compta',
    eyebrow: 'Zéro saisie',
    title: 'Ta tirelire URSSAF se calcule toute seule.',
    sub: 'Ton copilote de gestion calcule ce que tu dois mettre de côté, course après course. Fini la mauvaise surprise du trimestre.',
    illus: 'compta' as const,
  },
  {
    tag: 'Tes clients à toi',
    eyebrow: 'Client direct',
    title: 'Ton QR. Ton client. Zéro commission plateforme.',
    sub: 'Un sticker dans ta voiture, un mini-site à ton nom, les réservations arrivent en direct.',
    illus: 'qr' as const,
  },
]

function FeatureIllus({ kind }: { kind: (typeof FEATURES)[number]['illus'] }) {
  if (kind === 'map') {
    return (
      <div className="relative h-full w-full overflow-hidden" style={{ background: 'linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px) 0 0/28px 28px, linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px) 0 0/28px 28px, #0A0D18' }}>
        <span className="absolute h-16 w-16 animate-ping rounded-full" style={{ left: '18%', top: '24%', background: 'radial-gradient(circle, rgba(140,82,255,.5), transparent 70%)', animationDuration: '2.4s' }} />
        <span className="absolute h-24 w-24 animate-ping rounded-full" style={{ left: '54%', top: '44%', background: 'radial-gradient(circle, rgba(0,212,255,.45), transparent 70%)', animationDuration: '2.4s', animationDelay: '.6s' }} />
        <span className="absolute rounded-lg border border-accent-cyan/35 bg-foreas-obsidian/80 px-2.5 py-1.5 text-[10px] font-bold text-[#F8FAFC]" style={{ left: '52%', top: '30%' }}>
          Gare de Lyon <b className="text-accent-cyan tabular-nums">▲ ce soir</b>
        </span>
      </div>
    )
  }
  if (kind === 'coach') {
    return (
      <div className="relative flex h-full w-full flex-col justify-between p-4">
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.045] p-3.5 text-[12px] text-white/70">
          <div className="flex justify-between py-0.5"><span>Course entrante</span><b className="text-[#F8FAFC] tabular-nums">Uber · 14,2 km</b></div>
          <div className="flex justify-between py-0.5"><span>Estimation</span><b className="text-[#F8FAFC] tabular-nums">≈ 31 €/h</b></div>
          <div className="flex justify-between py-0.5"><span>Retour à vide</span><b className="text-[#F8FAFC]">faible</b></div>
        </div>
        <div className="rounded-2xl border border-success/40 bg-success/10 py-2.5 text-center text-[14px] font-extrabold text-[#34D399]">✓ ELLE VAUT LE COUP</div>
      </div>
    )
  }
  if (kind === 'voice') {
    return (
      <div className="relative flex h-full w-full flex-col items-center justify-center gap-4">
        <div className="flex items-center gap-1">
          {[22, 44, 60, 34, 52, 26, 46, 30].map((h, i) => (
            <span key={i} className="w-1.5 animate-pulse rounded-sm bg-gradient-to-b from-accent-cyan to-accent-purple" style={{ height: h, animationDelay: `${i * 0.08}s` }} />
          ))}
        </div>
        <p className="px-6 text-center text-[12.5px] italic text-white/70">« Reste pas à Châtelet. Gare de Lyon dans 20 minutes. »</p>
      </div>
    )
  }
  if (kind === 'compta') {
    return (
      <div className="relative flex h-full w-full flex-col items-center justify-center gap-2.5">
        <div className="relative h-[104px] w-[104px] rounded-full" style={{ background: 'conic-gradient(#F5C842 72%, rgba(255,255,255,.06) 0)' }}>
          <div className="absolute inset-2 flex items-center justify-center rounded-full bg-[#0B0E1A] text-[18px] font-extrabold tabular-nums">72 %</div>
        </div>
        <p className="text-[11px] text-white/50">Tirelire URSSAF — calculée à chaque course</p>
      </div>
    )
  }
  return (
    <div className="relative flex h-full w-full items-center justify-center gap-4 px-6">
      <div className="h-[76px] w-[76px] flex-none rounded-xl border-4 border-white bg-white/90" style={{ backgroundImage: 'conic-gradient(from 90deg at 3px 3px, transparent 25%, #0B0E1A 0)', backgroundSize: '13px 13px' }} />
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.045] p-3 text-[11px] text-white/70">
        <b className="mb-1 block text-[12px] text-[#34D399]">✓ Réservation reçue</b>
        Sarah · CDG → Paris 11ᵉ<br />Demain <span className="tabular-nums">09:40</span> · prix fixe
      </div>
    </div>
  )
}

interface ExperienceClientProps { geoCity?: string | null }

export default function ExperienceClient({ geoCity }: ExperienceClientProps) {
  const [showCta, setShowCta] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalZone, setModalZone] = useState('')
  const [desktopInput, setDesktopInput] = useState('')
  const waFinal = buildWAUrl({ section: 'final' })
  // Desktop (≥768px, seuil aligné sur les breakpoints md: de la page) : la modale de la home
  // (AjnayaConversationModal) remplace le mockup téléphone — le format phone-frame ne doit
  // exister QUE sur mobile (retour Chandler explicite).
  const isMobile = useIsMobile()
  const desktopZoneChips = orderZonesByCity(geoCity).slice(0, 4)
  const openModal = (zone?: string) => {
    setModalZone(zone || '')
    setModalOpen(true)
    try { posthog.capture('experience_desktop_modal_opened', { zone: zone || null }) } catch { /* noop */ }
  }

  useEffect(() => {
    try { posthog.capture('experience_page_view') } catch { /* noop */ }
    const onScroll = () => setShowCta(window.scrollY > 480)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-foreas-obsidian text-[#F8FAFC]">
      {/* halo + micro-grain — mêmes tokens que checkout/tarifs2 */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute inset-0 animate-halo-pulse"
          style={{ background: 'radial-gradient(120% 46% at 22% -4%, rgba(140,82,255,.20) 0%, transparent 62%), radial-gradient(90% 40% at 88% 4%, rgba(0,212,255,.11) 0%, transparent 60%)' }}
        />
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(255,255,255,.012)' }} />
      </div>

      {/* header — le fond (blur/gradient) reste plein-largeur, le contenu se recentre à md: */}
      <header className="sticky top-0 z-40 backdrop-blur-md" style={{ background: 'linear-gradient(180deg, rgba(6,6,16,.92), rgba(6,6,16,.5) 80%, transparent)' }}>
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 md:px-8">
          <Link href="/" aria-label="FOREAS — Accueil">
            <ForeasLogo variant="mini" className="h-6 w-auto text-[#F8FAFC]" />
          </Link>
          <a href={waFinal} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/[0.14] bg-white/[0.04] px-3.5 py-1.5 text-[11px] font-bold">
            WhatsApp
          </a>
        </div>
      </header>

      {/* ═══ HERO — téléphone vivant. Logo retiré (quiet-tech R4, redondant avec le header) ET eyebrow
          "Pour les chauffeurs VTC" retiré (même règle — le H1 seul porte le message) — Fable 5. ═══ */}
      <section id="hero" className="relative z-10 px-5 pb-10 pt-10 sm:pt-16 md:pt-24 md:pb-16">
        {/* Halo mobile (léger, scopé au H1) — les 4 blobs Vision Pro ci-dessous prennent le relais
            à md: (desktop), même animation que la home (HomeHeroCream.tsx @keyframes vision-drift-*,
            globals.css) : demande explicite Chandler "la même animation qu'autour de la home". */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 h-[280px] w-[520px] -translate-x-1/2 md:hidden"
          style={{ background: 'radial-gradient(60% 55% at 50% 0%, rgba(140,82,255,.16) 0%, transparent 72%)', filter: 'blur(2px)' }}
        />
        {/* Desktop uniquement — 4 blobs colorés qui dérivent lentement, identiques à la home */}
        <div aria-hidden className="pointer-events-none absolute inset-0 hidden overflow-hidden md:block">
          <div
            className="animate-vision-a absolute -left-[10%] -top-[15%] h-[55%] w-[55%] rounded-full"
            style={{ background: 'radial-gradient(circle at 50% 50%, rgba(140,82,255,.28) 0%, rgba(140,82,255,.06) 50%, transparent 80%)', filter: 'blur(40px)', willChange: 'transform' }}
          />
          <div
            className="animate-vision-b absolute -right-[12%] -top-[5%] h-[48%] w-[48%] rounded-full"
            style={{ background: 'radial-gradient(circle at 50% 50%, rgba(108,60,224,.18) 0%, rgba(108,60,224,.04) 55%, transparent 80%)', filter: 'blur(48px)', willChange: 'transform' }}
          />
          <div
            className="animate-vision-c absolute -bottom-[20%] left-[25%] h-[55%] w-[60%] rounded-full"
            style={{ background: 'radial-gradient(circle at 50% 50%, rgba(255,102,153,.15) 0%, rgba(255,102,153,.04) 55%, transparent 80%)', filter: 'blur(56px)', willChange: 'transform' }}
          />
          <div
            className="animate-vision-a absolute -left-[15%] top-[40%] h-[35%] w-[35%] rounded-full"
            style={{ background: 'radial-gradient(circle at 50% 50%, rgba(245,200,66,.12) 0%, rgba(245,200,66,.03) 55%, transparent 80%)', filter: 'blur(50px)', animationDelay: '4s', willChange: 'transform' }}
          />
        </div>
        {/* vignette — concentre l'œil sur titre + téléphone */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(120% 75% at 50% 20%, transparent 55%, rgba(0,0,0,.28) 100%)' }}
        />

        <motion.div {...heroReveal} className="relative mx-auto max-w-xl text-center md:max-w-2xl">
          {/* Badge live — même claim/mécanique que le chip de la home (HomeHeroCream.tsx), recoloré
              glass sombre. Pas un doublon de l'eyebrow retiré : ceci est un statut système (point qui
              pulse), pas un label d'audience. */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.05] px-3.5 py-1.5">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            <span className="text-[11px] font-semibold text-white/80 sm:text-xs">
              Ajnaya lit <span className="tabular-nums">7</span> plateformes en direct
            </span>
          </div>

          {/* H1 — même traitement que la home (HomeHeroCream.tsx) : Genos (font-title, 137 usages
              historiques du token, letter-spacing -0.04em display ≥56px déjà établi) + "roule moins."
              italique. Couleur cyan (pas violet) : décision Chandler propre à /experience, cohérente
              avec le cyan déjà dominant sur cette page (badges, eyebrows). */}
          <h1 className="font-title text-[38px] font-semibold leading-[1.05] sm:text-[52px] md:text-[64px] lg:text-[72px]" style={{ letterSpacing: '-.04em' }}>
            Gagne plus,
            <br />
            <span style={{ fontStyle: 'italic', color: '#00D4FF' }}>roule moins.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-md text-[15.5px] leading-relaxed text-white/70 md:max-w-lg md:text-[17px]">
            Écris à Ajnaya, là, tout de suite. Ce n&apos;est pas une démo — c&apos;est le vrai cerveau qui répond.
          </p>
        </motion.div>

        <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.15 }} className="relative mt-10">
          {isMobile ? (
            <LivePhone geoCity={geoCity} />
          ) : (
            /* Desktop : LE MÊME mécanisme que la home (search bar → AjnayaConversationModal),
               pas une invention à côté — juste rethémé sombre. Chandler : "reprends la même chose". */
            <div className="mx-auto max-w-xl">
              {/* Search bar — DESIGN_SYSTEM_MASTER.md §11.8 : glass par défaut, cyan + glowCyan
                  QU'AU FOCUS (§8.6 R2/R8 — pas de chrome qui boucle en permanence, le premium vient
                  du verre pas de l'effet ajouté). Retiré l'anneau conic-gradient permanent. */}
              <form
                onSubmit={(e) => { e.preventDefault(); if (desktopInput.trim()) openModal(desktopInput.trim()) }}
                className="group flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 backdrop-blur-md transition-all duration-300 focus-within:border-accent-cyan focus-within:shadow-[0_0_24px_-4px_rgba(0,212,255,.5)] sm:px-5 sm:py-4"
              >
                  <MapPin className="h-5 w-5 flex-none text-accent-cyan" />
                  <input
                    value={desktopInput}
                    onChange={(e) => setDesktopInput(e.target.value)}
                    placeholder="Ta zone…"
                    aria-label="Ta zone"
                    className="min-w-0 flex-1 bg-transparent text-base font-medium text-[#F8FAFC] placeholder-white/30 outline-none focus-visible:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!desktopInput.trim()}
                    className="flex flex-none items-center gap-1.5 rounded-xl bg-gradient-to-r from-accent-purple to-accent-purple-deep px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                  >
                    Discuter <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-white/40">Essaie :</span>
                {desktopZoneChips.map((z) => (
                  <button
                    key={z}
                    type="button"
                    onClick={() => openModal(z)}
                    className="rounded-full border border-white/[0.10] bg-white/[0.03] px-3 py-1.5 text-[12.5px] text-white/70 transition hover:border-white/[0.20] hover:bg-white/[0.06]"
                  >
                    {z}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-center text-[10.5px] text-text-tertiary">Réponse en moins d&apos;1 min · gratuit</p>
            </div>
          )}
        </motion.div>
      </section>

      {/* Modale desktop — même composant que la home (AjnayaConversationModal), pas une réinvention. */}
      {!isMobile && (
        <AjnayaConversationModal isOpen={modalOpen} onClose={() => setModalOpen(false)} initialZone={modalZone} />
      )}

      {/* ═══ FEATURES — illustrations honnêtes, prêtes pour vidéo réelle ═══ */}
      {FEATURES.map((f, i) => (
        <motion.section key={i} {...reveal} className="relative z-10 border-t border-white/[0.05] px-5 py-10 md:py-16">
          <div className="mx-auto max-w-md md:max-w-xl">
            <div className="relative h-[220px] overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0B0E1A] md:h-[280px]">
              <span className="absolute left-3 top-2.5 z-10 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/45">{f.tag}</span>
              <FeatureIllus kind={f.illus} />
            </div>
            <p className="mb-2 mt-6 text-[10px] font-extrabold uppercase text-accent-cyan" style={{ letterSpacing: '.22em' }}>{f.eyebrow}</p>
            <h2 className="font-sans text-[25px] font-bold leading-tight md:text-[32px]" style={{ letterSpacing: '-.03em' }}>{f.title}</h2>
            <p className="mt-2.5 max-w-[34ch] text-[14.5px] leading-relaxed text-white/70">{f.sub}</p>
          </div>
        </motion.section>
      ))}

      {/* ═══ PREUVE — vraie vidéo Binaté (source unique testimonials.data.ts) ═══ */}
      <motion.section {...reveal} className="relative z-10 border-t border-white/[0.05] px-5 py-10 md:py-14">
        <div className="mx-auto max-w-md md:max-w-xl">
          <p className="mb-4 text-[10px] font-extrabold uppercase text-accent-cyan" style={{ letterSpacing: '.22em' }}>Pas moi qui le dis. Eux.</p>
          <TestimonialVideoCard testimonial={BINATE} showQuote />
        </div>
      </motion.section>

      {/* ═══ OFFRE — 29,99€/mois ═══ */}
      <motion.section {...reveal} className="relative z-10 border-t border-white/[0.05] px-5 py-10 md:py-14">
        <div className="mx-auto max-w-md md:max-w-xl">
          <p className="mb-4 text-[10px] font-extrabold uppercase text-accent-cyan" style={{ letterSpacing: '.22em' }}>L&apos;offre</p>
          <div className="rounded-3xl border border-accent-cyan/25 p-6 text-center" style={{ background: 'linear-gradient(180deg, rgba(0,212,255,.08), rgba(140,82,255,.02))' }}>
            <div className="text-[44px] font-extrabold tabular-nums md:text-[56px]" style={{ letterSpacing: '-.04em' }}>
              29,99&nbsp;€<small className="text-[15px] font-semibold text-white/45">/mois</small>
            </div>
            <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-accent-cyan/25 bg-accent-cyan/10 px-3 py-1.5 text-[12.5px] tabular-nums text-accent-cyan">
              ≈ 1&nbsp;€ par jour · moins qu&apos;un café
            </div>
            <p className="mt-3.5 text-[12px] text-white/50">
              En annuel&nbsp;: <b className="text-[#F5C842] tabular-nums">2 mois offerts</b> — 299,90&nbsp;€/an au lieu de 359,88&nbsp;€
            </p>
            <div className="mt-3 inline-flex rounded-full border border-success/40 bg-success/10 px-3 py-1.5 text-[11.5px] font-semibold text-[#34D399]">
              ✓ Garanti 30 jours — remboursé sans discuter
            </div>

            <div className="mt-5 flex items-start gap-3 border-t border-dashed border-white/[0.12] pt-5 text-left">
              <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.05] text-[19px]">📱</span>
              <p className="text-[12.5px] leading-relaxed text-white/70">
                <b className="text-[#F8FAFC]">Un an de FOREAS (299,90&nbsp;€)</b> coûte moins qu&apos;un téléphone reconditionné à 500-600&nbsp;€. Lui ne te fait gagner aucun euro de plus. FOREAS, si.
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ═══ FAQ ═══ */}
      <motion.section {...reveal} className="relative z-10 border-t border-white/[0.05] px-5 py-10 md:py-14">
        <div className="mx-auto max-w-md md:max-w-xl">
          <p className="mb-3 text-[10px] font-extrabold uppercase text-accent-cyan" style={{ letterSpacing: '.22em' }}>Questions directes</p>
          {[
            ['Comment tu sais où ça paie ?', 'Ajnaya lit 7 plateformes en même temps, en direct. Comment exactement ? C’est notre secret — toi, tu vois le résultat.'],
            ['29,99 €, c’est cher ?', 'C’est moins d’1 € par jour. Une bonne course de plus dans le mois et c’est remboursé. Sinon : 30 jours, remboursé.'],
            ['Je peux annuler quand ?', 'Quand tu veux, en 1 clic. Pas d’appel, pas de mail de rétention.'],
          ].map(([q, a], i) => (
            <details key={i} className="border-b border-white/[0.08] py-3.5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[14px] font-bold marker:content-none">
                {q}
                <span className="text-accent-cyan" aria-hidden>+</span>
              </summary>
              <p className="mt-2 text-[13px] leading-relaxed text-white/70">{a}</p>
            </details>
          ))}
        </div>
      </motion.section>

      <footer className="relative z-10 px-5 pb-32 pt-6 text-center text-[11px] text-white/30">
        FOREAS · Fait en France 🇫🇷
      </footer>

      {/* ═══ Preuve sociale bas-gauche — oriente vers WhatsApp (capture du numéro) ═══ */}
      <ExperiencePhoneToasts />

      {/* ═══ Pop-up anti-départ — même composant que la home ═══ */}
      <ExitIntentModal />

      {/* ═══ CTA persistant — bord-à-bord mobile, pilule centrée à md: (les translate-x/y Tailwind
          se composent via les mêmes variables --tw-translate-*, aucune collision) ═══ */}
      <div
        className={`fixed inset-x-4 bottom-4 z-50 flex gap-2.5 transition-all duration-300 md:inset-x-auto md:left-1/2 md:w-full md:max-w-md md:-translate-x-1/2 ${showCta ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'}`}
      >
        <InkGradientButton as="link" href="#hero" variant="primary" size="lg" fullWidth
          onClick={() => { try { posthog.capture('experience_sticky_cta_clicked') } catch { /* noop */ } }}
        >
          Discuter avec Ajnaya
        </InkGradientButton>
        <a
          href={waFinal}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp"
          className="flex h-14 w-14 flex-none items-center justify-center rounded-xl border border-white/[0.14]"
          style={{ background: 'rgba(10,12,20,.92)' }}
        >
          <MessageCircle size={20} className="text-[#F8FAFC]" />
        </a>
      </div>
    </main>
  )
}

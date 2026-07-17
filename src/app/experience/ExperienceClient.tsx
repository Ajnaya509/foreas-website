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
import { useTypewriter } from '@/hooks/useTypewriter'
import TestimonialVideoCard from '@/components/zone/TestimonialVideoCard'
import { TESTIMONIALS } from '@/components/zone/testimonials.data'
import { InkGradientButton } from '@/components/ui'
import { buildWAUrl } from '@/lib/whatsappLink'
import { useIsMobile } from '@/hooks/useDevicePerf'
import SmoothScroll from '@/components/experience/SmoothScroll'
import StickyFeatures from '@/components/experience/StickyFeatures'

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
  // Même écriture dynamique que le téléphone mobile (useTypewriter, LivePhone.tsx) — cohérence
  // demandée par Chandler entre les deux versions.
  const desktopPlaceholderTexts = ['Écris ta zone…', ...orderZonesByCity(geoCity).map((z) => `${z}…`)]
  const desktopAnimatedPlaceholder = useTypewriter({ texts: desktopPlaceholderTexts, typeSpeedMs: 75, pauseMs: 1300, eraseSpeedMs: 32, startDelayMs: 900 })
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
    <SmoothScroll>
    {/* overflow-x-CLIP (pas hidden) : `hidden` crée un conteneur de scroll qui empêche
        position:sticky des sections features de coller. `clip` masque le débord sans conteneur
        de scroll → le sticky desktop fonctionnera (audit Fable 5). */}
    <main className="relative min-h-screen overflow-x-clip bg-foreas-obsidian text-[#F8FAFC]">
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
              {/* Search bar — anneau dégradé permanent, même mécanique que le téléphone mobile
                  (@keyframes foreas-border-comet). Fond quasi-opaque pour masquer le cône et ne
                  laisser voir qu'un fin trait (sinon la lumière traverse et fait une tache). */}
              <div className="relative">
                <div className="pointer-events-none absolute -inset-[1.5px] overflow-hidden rounded-2xl" aria-hidden="true">
                  <div
                    className="absolute left-1/2 top-1/2 aspect-square w-[150%]"
                    style={{
                      background: 'conic-gradient(from 0deg, transparent 0deg 296deg, rgba(140,82,255,0.95) 318deg, rgba(0,212,255,1) 338deg, rgba(140,82,255,0.95) 358deg, transparent 360deg)',
                      animation: 'foreas-border-comet 3.6s ease-in-out infinite alternate',
                      willChange: 'transform',
                    }}
                  />
                </div>
                <form
                  onSubmit={(e) => { e.preventDefault(); if (desktopInput.trim()) openModal(desktopInput.trim()) }}
                  className="group relative z-10 flex items-center gap-2 rounded-2xl border border-white/[0.10] px-4 py-3 sm:px-5 sm:py-4"
                  style={{ backgroundColor: 'rgba(10,11,20,.94)' }}
                >
                  <MapPin className="h-5 w-5 flex-none text-accent-cyan" />
                  <input
                    value={desktopInput}
                    onChange={(e) => setDesktopInput(e.target.value)}
                    placeholder={desktopInput ? 'Ta zone…' : desktopAnimatedPlaceholder}
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
              </div>
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

      {/* ═══ FEATURES — « visite produit » : téléphone collant + texte qui défile (desktop),
          empilé (mobile). Titres +100/100 (copy-atomic Fable 5). Illustrations = placeholders,
          prêtes pour les vidéos verticales ScreenStudio. ═══ */}
      <section className="border-t border-white/[0.05] py-10 md:py-24">
        <StickyFeatures isMobile={isMobile} />
      </section>

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
    </SmoothScroll>
  )
}

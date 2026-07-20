'use client'

/**
 * CinematicSequence — SCÈNE 2 : l'alerte contrôle (la communauté).
 * La seule scène où le chauffeur n'est pas seul : c'est la respiration collective du film.
 *
 * Même moteur que VerdictSequence (hooks partagés useCinemaVideo) :
 *   - le clip est PILOTÉ PAR LE SCROLL, mobile comme desktop (rien ne bouge tout seul)
 *   - le voile sombre vit DU CÔTÉ du texte (haut sur mobile, gauche sur desktop)
 *   - le contenu réserve la place du CTA fixe via --cta-clearance
 *   - le mockup joue le VRAI clip de notification (boers-cdg), muet, une seule fois
 */

import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform, useMotionValueEvent, type MotionValue } from 'framer-motion'
import posthog from 'posthog-js'
import PhoneFrame from './PhoneFrame'
import { useSectionSeen } from '@/hooks/useSectionSeen'
import { useReducedMotion } from '@/hooks/useDevicePerf'
import {
  useScrubbedVideo, useScrollTriggeredClip, useSectionActive, useNearbyPreload, useMutedVideoRef,
} from '@/hooks/useCinemaVideo'

const V = '/videos/experience'
const VINTAGE = 'sepia(.12) contrast(1.12) saturate(.72) brightness(.88) hue-rotate(-4deg)'
const TEXT_SHADOW = '0 2px 24px rgba(6,6,16,.9)'

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

const T = {
  scrubFrom: 0.05, scrubTo: 0.52,
  dimAt: 0.54,
  mockupAt: 0.60, mockupRearm: 0.50,
  beats: [
    { in: 0.08, out: 0.30, lead: 'Terminal 2D. Ce matin.', punch: 'Contrôle.', emoji: '🙄' },
    { in: 0.34, out: 0.56, lead: 'Lui,', punch: 'personne ne l’a prévenu.', emoji: '😏' },
    { in: 0.66, out: 1.10, lead: 'Toi,', punch: 'ton téléphone a vibré.', emoji: '😌' },
  ],
  conclusionAt: 0.84,
} as const

function Beat({
  beat, progress, sizeClass,
}: {
  beat: (typeof T.beats)[number]
  progress: MotionValue<number>
  sizeClass: string
}) {
  const opacity = useTransform(progress, [beat.in - 0.04, beat.in + 0.02, beat.out - 0.03, beat.out + 0.03], [0, 1, 1, 0])
  const y = useTransform(progress, [beat.in - 0.04, beat.in + 0.02, beat.out - 0.03, beat.out + 0.03], [26, 0, 0, -28])
  // Emoji calé sur le MÊME progress que le carton (réversible au scroll arrière, comme le reste
  // de la scène) — un whileInView à sens unique le figeait après sa 1ère apparition.
  const emojiRotate = useTransform(progress, [beat.in - 0.01, beat.in + 0.05], [-8, 0])
  const emojiScale = useTransform(progress, [beat.in - 0.01, beat.in + 0.05], [0.8, 1])
  const emojiOpacity = useTransform(progress, [beat.in - 0.01, beat.in + 0.05], [0, 1])
  return (
    <motion.div className="absolute inset-x-0" style={{ opacity, y }}>
      <h2 className={`font-sans font-extrabold leading-[1.0] text-[#F8FAFC] ${sizeClass}`} style={{ letterSpacing: '-.02em', textShadow: TEXT_SHADOW }}>
        <span className="block">{beat.lead}</span>
        <span className="block text-accent-cyan">
          {beat.punch}{' '}
          <motion.span
            className="inline-block align-baseline text-[0.72em]"
            aria-hidden="true"
            style={{ rotate: emojiRotate, scale: emojiScale, opacity: emojiOpacity }}
          >
            {beat.emoji}
          </motion.span>
        </span>
      </h2>
    </motion.div>
  )
}

function CinemaGrain() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 z-20 opacity-[.08] mix-blend-overlay" style={{ backgroundImage: GRAIN, backgroundSize: '140px 140px' }} aria-hidden />
      <div className="pointer-events-none absolute inset-0 z-20" style={{ background: 'radial-gradient(115% 90% at 50% 50%, transparent 42%, rgba(0,0,0,.55) 100%)' }} aria-hidden />
    </>
  )
}

const CONCLUSION = (
  <>
    Un chauffeur signale, tout le monde est prévenu.<br />
    Demande à Ajnaya ce qui bouge sur ta zone.
  </>
)

/* ═══ MOBILE ═════════════════════════════════════════════════════════════════════════════════ */
function MobileSequence() {
  const sectionRef = useRef<HTMLElement>(null)
  const seenRef = useSectionSeen<HTMLDivElement>('alerte_controle', 1)
  const [filmRef, setFilmRef] = useMutedVideoRef()
  const [notifRef, setNotifRef] = useMutedVideoRef()
  const [mockupOn, setMockupOn] = useState(false)
  const payoffFiredRef = useRef(false) // 1 seul événement par visite, pas 1 par frame de scroll

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] })
  const activeRef = useSectionActive(sectionRef)
  useNearbyPreload(sectionRef, [filmRef, notifRef])

  useScrubbedVideo(filmRef, scrollYProgress, { from: T.scrubFrom, to: T.scrubTo, fps: 30, activeRef })
  useScrollTriggeredClip(notifRef, scrollYProgress, { at: T.mockupAt, rearmAt: T.mockupRearm, activeRef })

  const dim = useTransform(scrollYProgress, [T.dimAt, T.dimAt + 0.06], [0, 0.5])
  const mockupX = useTransform(scrollYProgress, [T.mockupAt - 0.04, T.mockupAt + 0.05], [60, 0])
  const mockupOpacity = useTransform(scrollYProgress, [T.mockupAt - 0.04, T.mockupAt + 0.05], [0, 1])
  const conclusionOpacity = useTransform(scrollYProgress, [T.conclusionAt, T.conclusionAt + 0.06], [0, 1])

  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    const on = p >= T.mockupAt
    setMockupOn((prev) => (prev === on ? prev : on))
    // posthog.capture vivait ICI sans garde : à chaque frame de scroll tant que p >= mockupAt,
    // donc des dizaines à des centaines d'événements pour un seul geste — en plein pendant la
    // scène la plus lourde (vidéo scrub + clip + grain), jank injecté au moment du payoff.
    if (on && !payoffFiredRef.current) {
      payoffFiredRef.current = true
      try { posthog.capture('experience_cinematic_payoff_viewed', { scene: 'alerte_controle', variant: 'mobile' }) } catch { /* noop */ }
    }
  })

  return (
    <section ref={sectionRef} className="relative h-[400svh]">
      <div ref={seenRef} className="sticky top-0 z-30 h-[100dvh] overflow-clip bg-foreas-obsidian">
        <motion.video
          ref={setFilmRef}
          className="absolute inset-0 z-0 h-full w-full object-cover"
          style={{ filter: VINTAGE }}
          src={`${V}/alerte-mobile.scrub.mp4`}
          poster={`${V}/alerte-mobile.poster.jpg`}
          muted playsInline preload="none" disableRemotePlayback aria-hidden="true"
        />
        <motion.div className="absolute inset-0 z-10 bg-black" style={{ opacity: dim }} aria-hidden />

        {/* voile EN HAUT — là où vit le texte */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[46%]"
          style={{ background: 'linear-gradient(180deg,#060610 0%,rgba(6,6,16,.85) 52%,transparent 100%)' }}
          aria-hidden
        />
        <CinemaGrain />

        <div
          className="absolute inset-0 z-30 flex flex-col px-5 pt-[68px]"
          style={{ paddingBottom: 'calc(var(--cta-clearance) + 8px)' }}
        >
          <p className="t-eyebrow mb-4 font-sans text-accent-cyan">Entre chauffeurs</p>
          <div className="relative min-h-[132px]">
            {T.beats.map((b, i) => (
              <Beat key={i} beat={b} progress={scrollYProgress} sizeClass="text-[clamp(28px,7.6vw,38px)]" />
            ))}
          </div>

          {/* mt-2 : même respiration que la scène Verdict entre les cartons et le téléphone.
              Sans elle, le téléphone démarrait pile là où finit le bloc de cartons (mesuré à
              0px de marge) — ils se toucheraient dès qu'un carton dépasse son min-h. */}
          <div className="relative mt-2 flex-1">
            {/* Ancré en HAUT et dimensionné par la LARGEUR — même raison que la scène Verdict :
                la notification vit dans le tiers haut de l'écran, donc on déborde par le bas
                (biseau + barre d'accueil) plutôt que par le haut (les cartons de texte). */}
            <motion.div
              className="absolute inset-x-0 top-0 flex justify-center"
              style={{ x: mockupX, opacity: mockupOpacity }}
            >
              <motion.div
                animate={mockupOn ? { rotate: [0, -1.2, 1.6, -1, 0.6, 0], x: [0, -2, 3, -2, 1, 0] } : { rotate: 0, x: 0 }}
                transition={{ duration: 0.55, delay: 0.3 }}
              >
                <PhoneFrame widthClassName="w-[min(300px,84vw)]">
                  <video
                    ref={setNotifRef}
                    className="h-full w-full object-cover"
                    src={`${V}/boers-cdg.play.mp4`}
                    poster={`${V}/boers-cdg.poster.jpg`}
                    muted playsInline preload="none" disableRemotePlayback
                    role="img" aria-label="Notification FOREAS : contrôle signalé au Terminal 2D"
                  />
                </PhoneFrame>
              </motion.div>
            </motion.div>
          </div>

          {/* Sortie du flux (le téléphone déborde par le bas). `bottom-0` serait faux : un
              élément absolu se positionne sur le PADDING box, il tomberait sous la barre CTA —
              on ancre donc explicitement sur la clearance. */}
          <motion.p
            className="absolute inset-x-5 z-10 pt-10 text-[14.5px] font-medium leading-relaxed text-white/70"
            style={{
              opacity: conclusionOpacity,
              textShadow: TEXT_SHADOW,
              bottom: 'calc(var(--cta-clearance) + 8px)',
              background: 'linear-gradient(180deg,transparent 0%,#060610 42%)',
            }}
          >
            {CONCLUSION}
          </motion.p>
        </div>
      </div>
    </section>
  )
}

/* ═══ DESKTOP ════════════════════════════════════════════════════════════════════════════════ */
function DesktopSequence() {
  const sectionRef = useRef<HTMLElement>(null)
  const seenRef = useSectionSeen<HTMLDivElement>('alerte_controle', 1)
  const [filmRef, setFilmRef] = useMutedVideoRef()
  const [notifRef, setNotifRef] = useMutedVideoRef()
  const [mockupOn, setMockupOn] = useState(false)
  const payoffFiredRef = useRef(false)

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] })
  const activeRef = useSectionActive(sectionRef)
  useNearbyPreload(sectionRef, [filmRef, notifRef])

  useScrubbedVideo(filmRef, scrollYProgress, { from: T.scrubFrom, to: T.scrubTo, fps: 30, activeRef })
  useScrollTriggeredClip(notifRef, scrollYProgress, { at: T.mockupAt, rearmAt: T.mockupRearm, activeRef })

  const dim = useTransform(scrollYProgress, [T.dimAt, T.dimAt + 0.06], [0, 0.55])
  const mockupX = useTransform(scrollYProgress, [T.mockupAt - 0.04, T.mockupAt + 0.05], [-70, 0])
  const mockupOpacity = useTransform(scrollYProgress, [T.mockupAt - 0.04, T.mockupAt + 0.05], [0, 1])
  const payoffOpacity = useTransform(scrollYProgress, [T.conclusionAt, T.conclusionAt + 0.06], [0, 1])

  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    const on = p >= T.mockupAt
    setMockupOn((prev) => (prev === on ? prev : on))
    if (on && !payoffFiredRef.current) {
      payoffFiredRef.current = true
      try { posthog.capture('experience_cinematic_payoff_viewed', { scene: 'alerte_controle' }) } catch { /* noop */ }
    }
  })

  return (
    <section ref={sectionRef} className="relative h-[400vh]">
      <div ref={seenRef} className="sticky top-0 z-30 h-dvh overflow-clip bg-foreas-obsidian">
        <motion.video
          ref={setFilmRef}
          className="absolute inset-y-0 right-0 z-0 h-full w-[72%] object-cover"
          style={{ filter: VINTAGE }}
          src={`${V}/alerte-desktop.scrub.mp4`}
          poster={`${V}/alerte-desktop.poster.jpg`}
          muted playsInline preload="none" disableRemotePlayback aria-hidden="true"
        />
        <motion.div className="absolute inset-y-0 right-0 z-10 w-[72%] bg-black" style={{ opacity: dim }} aria-hidden />

        {/* voile STATIQUE côté texte : plus jamais un carton sur l'image nue */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-20 w-[55%]"
          style={{ background: 'linear-gradient(90deg,#060610 0%,#060610 55%,rgba(6,6,16,.8) 78%,transparent 100%)' }}
          aria-hidden
        />
        <CinemaGrain />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[6.5%] bg-black" aria-hidden />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[6.5%] bg-black" aria-hidden />

        <div className="absolute inset-y-0 left-[7%] z-30 flex w-[32%] flex-col justify-center">
          <p className="t-eyebrow mb-6 font-sans text-accent-cyan">Entre chauffeurs</p>
          <div className="relative min-h-[200px]">
            {T.beats.map((b, i) => (
              <Beat key={i} beat={b} progress={scrollYProgress} sizeClass="text-[clamp(32px,3.2vw,52px)]" />
            ))}
          </div>
          <motion.p
            className="mt-8 max-w-[36ch] text-[17px] font-medium leading-relaxed text-white/70"
            style={{ opacity: payoffOpacity, textShadow: TEXT_SHADOW }}
          >
            {CONCLUSION}
          </motion.p>
        </div>

        {/* mockup — taille pilotée par la HAUTEUR (jamais de collision avec le CTA) */}
        <motion.div
          className="absolute inset-y-0 right-[8%] z-30 flex items-center"
          style={{ x: mockupX, opacity: mockupOpacity }}
        >
          <motion.div
            animate={mockupOn ? { rotate: [0, -1.2, 1.6, -1, 0.6, 0], x: [0, -2, 3, -2, 1, 0] } : { rotate: 0, x: 0 }}
            transition={{ duration: 0.55, delay: 0.3 }}
          >
            <PhoneFrame widthClassName="h-[min(66vh,560px)] w-auto">
              <video
                ref={setNotifRef}
                className="h-full w-full object-cover"
                src={`${V}/boers-cdg.play.mp4`}
                poster={`${V}/boers-cdg.poster.jpg`}
                muted playsInline preload="none" disableRemotePlayback
                role="img" aria-label="Notification FOREAS : contrôle signalé au Terminal 2D"
              />
            </PhoneFrame>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

/* ═══ Repli sans scroll-story ═══════════════════════════════════════════════════════════════ */
function StaticSequence() {
  const seenRef = useSectionSeen<HTMLElement>('alerte_controle', 1)
  return (
    <section
      ref={seenRef}
      className="mx-auto w-full max-w-2xl bg-foreas-obsidian px-5 py-14"
      style={{ paddingBottom: 'calc(var(--cta-clearance) + 24px)' }}
    >
      <p className="t-eyebrow mb-5 font-sans text-accent-cyan">Entre chauffeurs</p>
      {T.beats.map((b, i) => (
        <h2 key={i} className="mb-6 font-sans text-[30px] font-extrabold leading-[1.05] text-[#F8FAFC]" style={{ letterSpacing: '-.02em' }}>
          <span className="block">{b.lead}</span>
          <span className="block text-accent-cyan">{b.punch} <span aria-hidden="true">{b.emoji}</span></span>
        </h2>
      ))}
      <div className="my-8">
        <PhoneFrame widthClassName="w-[260px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${V}/boers-cdg.poster.jpg`} alt="Notification FOREAS : contrôle signalé au Terminal 2D" className="h-full w-full object-cover" />
        </PhoneFrame>
      </div>
      <p className="max-w-[36ch] text-[15px] font-medium leading-relaxed text-white/70">{CONCLUSION}</p>
    </section>
  )
}

/* ─── Repli avant montage — réserve la hauteur pour Lenis avec du contenu réel (pas un div
   aria-hidden vide, servi pendant toute la fenêtre d'hydratation). ─── */
function SequencePlaceholder() {
  return (
    <div className="relative min-h-[400svh] bg-foreas-obsidian">
      <div className="sticky top-0 flex h-[100dvh] flex-col justify-center overflow-clip px-5" style={{ paddingBottom: 'calc(var(--cta-clearance) + 8px)' }}>
        <img
          src={`${V}/alerte-mobile.poster.jpg`}
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-40"
          style={{ filter: VINTAGE }}
        />
        <div className="relative z-10">
          <p className="t-eyebrow mb-4 font-sans text-accent-cyan">Entre chauffeurs</p>
          <h2 className="font-sans text-[clamp(28px,7.6vw,38px)] font-extrabold leading-[1.0] text-[#F8FAFC]" style={{ letterSpacing: '-.02em', textShadow: TEXT_SHADOW }}>
            <span className="block">{T.beats[0].lead}</span>
            <span className="block text-accent-cyan">{T.beats[0].punch} <span aria-hidden="true">{T.beats[0].emoji}</span></span>
          </h2>
        </div>
      </div>
    </div>
  )
}

export default function CinematicSequence({ isMobile }: { isMobile: boolean }) {
  const reduced = useReducedMotion()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <SequencePlaceholder />
  if (reduced) return <StaticSequence />
  return isMobile ? <MobileSequence /> : <DesktopSequence />
}

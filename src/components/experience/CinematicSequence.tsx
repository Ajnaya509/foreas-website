'use client'

/**
 * CinematicSequence — LA séquence cinéma de /experience (vision Chandler, premier jet à valider).
 *
 * DESKTOP (≥768px) — un « film scrollable » épinglé plein écran :
 *   1. La vidéo (clip Mux 5 s, filtre cinéma + grain + letterbox) joue AU RYTHME DU SCROLL,
 *      calée à droite. À gauche, un dégradé noir (#060610 → transparent) porte les titres-chocs
 *      qui apparaissent au fur et à mesure du déroulé.
 *   2. Au moment où il regarde la caméra : zoom léger sur le visage (fenêtre + origine réglables
 *      dans SCENE.zoom — à caler après visionnage).
 *   3. La vidéo se fige et s'assombrit → le mockup iPhone entre à GAUCHE (avec une micro-secousse
 *      « vibration » — le titre dit « ton téléphone a vibré », le téléphone vibre vraiment),
 *      la description continue à DROITE.
 *
 * MOBILE — pas de scrub (recette 4G) : clip en lecture auto quand visible (pause sinon),
 *   titres en arrivée horizontale, mockup + description en dessous. Le clip VERTICAL de Chandler
 *   remplacera le 16:9 via SCENE.clip.verticalMp4Url quand il existera.
 *
 * Perf (audit Fable 5) : sticky CSS natif (pas de pinning JS), scrub via ref + useAnimationFrame
 * (JAMAIS de setState par frame), MP4 progressif Mux capped-1080p (~2-4 Mo, préchargé desktop
 * uniquement à l'approche), saveData/reduced-motion → variante empilée sans scrub.
 *
 * Le texte n'est JAMAIS incrusté dans la vidéo (SEO, lisibilité, modifiable).
 */

import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform, useSpring, useMotionValueEvent, useAnimationFrame } from 'framer-motion'
import posthog from 'posthog-js'
import PhoneFrame from './PhoneFrame'
import { useReducedMotion } from '@/hooks/useDevicePerf'
import { useSectionSeen } from '@/hooks/useSectionSeen'

/* ═══ SCÈNE — Alerte contrôle Terminal 2D (1er clip réel de Chandler) ══════════════════════════
   NOTE ORDRE FINAL (décision Chandler) : le Verdict Instant sera la 1ʳᵉ séquence quand son clip
   existera ; cette séquence Alerte passera en 2ᵉ. On valide ici le MÉCANISME avec le clip dispo.
   Pour dupliquer : copier SCENE, changer clip/beats/payoff — voir docs/claude-code/05_*.md. */
const MUX_PLAYBACK_ID = 'WpmrheUgL7J8GLgCyr3sMJXsbqgoLm01mGII7JnbdiT00'
const SCENE = {
  eyebrow: 'Entre chauffeurs',
  clip: {
    mp4Url: `https://stream.mux.com/${MUX_PLAYBACK_ID}/capped-1080p.mp4`,
    posterUrl: `https://image.mux.com/${MUX_PLAYBACK_ID}/thumbnail.webp?time=1.2&width=1600`,
    /** Poster allégé mobile (rendu ≤430px — 1600px serait du gâchis 4G). */
    posterUrlMobile: `https://image.mux.com/${MUX_PLAYBACK_ID}/thumbnail.webp?time=1.2&width=800`,
    /** Fallback seulement — la frame-loop lit v.duration en priorité (clip re-trimmable). */
    durationSec: 5.13,
    /** Clip vertical 9:16 (à fournir par Chandler) — remplacera le 16:9 sur mobile. */
    verticalMp4Url: null as string | null,
  },
  /** Titres-chocs (gauche) — fenêtres de progression [in, out] sur la section. */
  beats: [
    { in: 0.05, out: 0.2, text: 'Terminal 2D. Ce matin.' },
    { in: 0.24, out: 0.4, text: 'Lui, personne ne l’a prévenu.' },
  ],
  /** ⚠️ RÉGLAGES À CALER APRÈS VISIONNAGE : fenêtre du regard-caméra + point du visage. */
  zoom: { start: 0.34, end: 0.5, scale: 1.14, origin: '58% 32%' },
  /** La vidéo a fini de se dérouler ici (le scrub mappe [0 → videoEnd] sur [0 → durée]). */
  videoEnd: 0.5,
  /** Entrée du mockup (gauche) + bascule description (droite). */
  mockupAt: 0.52,
  payoff: {
    title: 'Toi, ton téléphone a vibré.',
    body: 'Un chauffeur signale un contrôle — tous ceux dans le coin reçoivent l’alerte. En direct, entre chauffeurs.',
  },
  /** Vidéo ScreenStudio de la notification (à fournir) — remplace le mockup CSS ci-dessous. */
  mockupVideoSrc: null as string | null,
}

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

/* ─── Écran de notification (placeholder CSS fidèle, remplacé par la vidéo ScreenStudio) ────── */
function NotificationScreen() {
  return (
    <div className="flex h-full w-full flex-col bg-gradient-to-b from-[#0B0F1E] to-foreas-obsidian px-4 pt-14">
      <p className="text-center font-sans text-[44px] font-semibold leading-none text-[#F8FAFC] tabular-nums">09:41</p>
      {/* samedi = le vrai jour du 18 juillet 2026 (nano-détail : un couple jour/date impossible
          crie « faux mockup » à l'œil méfiant du chauffeur) */}
      <p className="mt-1 text-center text-[11.5px] text-white/45">samedi 18 juillet</p>
      {/* fond = glass réel §0.2 (rgba(17,21,40,.88)) — pas de token Tailwind dédié, valeur exacte */}
      <div className="mt-6 rounded-[18px] border border-white/[0.08] p-3" style={{ backgroundColor: 'rgba(17,21,40,0.88)' }}>
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 flex-none items-center justify-center rounded-[8px] bg-gradient-to-br from-accent-purple to-accent-purple-deep font-title text-[13px] font-bold text-white">F/</span>
          <span className="flex-1 text-[11px] font-semibold uppercase tracking-wide text-white/55">FOREAS</span>
          <span className="text-[11px] text-white/40">il y a 2 min</span>
        </div>
        <p className="mt-2 text-[13.5px] font-bold leading-snug text-[#F8FAFC]">🚨 Contrôle signalé — Terminal 2D</p>
        {/* « par un chauffeur du coin » : dé-doublonne « signalé », garde l'ancre de confiance,
            écho lexical au « dans le coin » du payoff (audit juge:copy) */}
        <p className="mt-0.5 text-[12px] leading-snug text-white/65">À 400 m de toi · par un chauffeur du coin</p>
      </div>
    </div>
  )
}

function MockupScreen() {
  return SCENE.mockupVideoSrc ? (
    <video className="h-full w-full object-cover" src={SCENE.mockupVideoSrc} muted loop playsInline autoPlay preload="metadata" aria-hidden="true" />
  ) : (
    <NotificationScreen />
  )
}

/* ─── Filtre cinéma commun (grain + vignette + letterbox) ───────────────────────────────────── */
function CinemaFilter() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 z-20 mix-blend-overlay opacity-[.07]" style={{ backgroundImage: GRAIN, backgroundSize: '140px 140px' }} aria-hidden />
      <div className="pointer-events-none absolute inset-0 z-20" style={{ background: 'radial-gradient(115% 90% at 50% 50%, transparent 45%, rgba(0,0,0,.55) 100%)' }} aria-hidden />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 h-[6.5%] bg-black" aria-hidden />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-[6.5%] bg-black" aria-hidden />
    </>
  )
}

/* ═══ DESKTOP — le film scrollable épinglé ═══════════════════════════════════════════════════ */
function DesktopSequence() {
  const sectionRef = useRef<HTMLElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const targetRatio = useRef(0)
  const activeRef = useRef(false)
  const loadedRef = useRef(false)
  const payoffCaptured = useRef(false)
  const [mockupOn, setMockupOn] = useState(false)
  const seenRef = useSectionSeen<HTMLDivElement>('cinema_alerte_controle', 0)

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] })

  // Zoom visage (lissé) — origine réglée sur le point du regard (SCENE.zoom.origin).
  const zoomRaw = useTransform(scrollYProgress, [SCENE.zoom.start, SCENE.zoom.end], [1, SCENE.zoom.scale])
  const zoom = useSpring(zoomRaw, { stiffness: 120, damping: 28 })
  // Assombrissement de la vidéo quand le mockup prend la scène.
  const dimOpacity = useTransform(scrollYProgress, [SCENE.mockupAt - 0.04, SCENE.mockupAt + 0.06], [0, 0.55])
  // Titres-chocs : opacité/translation par fenêtre de beat.
  const beat0Opacity = useTransform(scrollYProgress, [SCENE.beats[0].in - 0.03, SCENE.beats[0].in, SCENE.beats[0].out, SCENE.beats[0].out + 0.04], [0, 1, 1, 0])
  const beat0Y = useTransform(scrollYProgress, [SCENE.beats[0].in - 0.03, SCENE.beats[0].in], [24, 0])
  const beat1Opacity = useTransform(scrollYProgress, [SCENE.beats[1].in - 0.03, SCENE.beats[1].in, SCENE.beats[1].out, SCENE.beats[1].out + 0.04], [0, 1, 1, 0])
  const beat1Y = useTransform(scrollYProgress, [SCENE.beats[1].in - 0.03, SCENE.beats[1].in], [24, 0])
  const payoffOpacity = useTransform(scrollYProgress, [SCENE.mockupAt + 0.05, SCENE.mockupAt + 0.14], [0, 1])
  const payoffY = useTransform(scrollYProgress, [SCENE.mockupAt + 0.05, SCENE.mockupAt + 0.14], [26, 0])

  // Scrub : le scroll écrit un RATIO cible dans une ref, la frame-loop applique (jamais de
  // setState par frame). La durée est lue sur v.duration (fallback constante) et clampée à
  // −0.05s : un seek pile à la durée exacte peut afficher une frame noire sur Safari.
  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    targetRatio.current = Math.min(1, Math.max(0, p / SCENE.videoEnd))
    const on = p >= SCENE.mockupAt
    setMockupOn((prev) => (prev === on ? prev : on))
    if (on && !payoffCaptured.current) {
      payoffCaptured.current = true
      try { posthog.capture('experience_cinematic_payoff_viewed', { scene: 'alerte_controle_2d' }) } catch { /* noop */ }
    }
  })
  useAnimationFrame(() => {
    if (!activeRef.current) return // section hors écran → zéro travail par frame
    const v = videoRef.current
    if (!v || v.readyState < 2) return
    const dur = Math.max(0.1, (v.duration || SCENE.clip.durationSec) - 0.05)
    const t = targetRatio.current * dur
    if (Math.abs(v.currentTime - t) > 1 / 30) v.currentTime = t
  })

  // Approche de la section : précharge le MP4 UNE fois (~2-4 Mo, desktop only) et gate la
  // frame-loop (activeRef) — l'observer reste branché pour couper le travail hors écran.
  useEffect(() => {
    const el = sectionRef.current
    const v = videoRef.current
    if (!el || !v) return
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[entries.length - 1] // dernière entrée = état réel (fling rapide)
        activeRef.current = e.isIntersecting
        if (e.isIntersecting && !loadedRef.current) {
          loadedRef.current = true
          v.preload = 'auto'
          v.load()
        }
      },
      { rootMargin: '900px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    // Piste de 320vh : le stage reste épinglé pendant ~2 écrans de défilement (rythme cinéma).
    <section ref={sectionRef} className="relative h-[320vh]">
      <div ref={seenRef} className="sticky top-0 h-dvh overflow-clip bg-foreas-obsidian">
        {/* ── LA VIDÉO — calée à droite, scrubbing au scroll, zoom visage ── */}
        <motion.video
          ref={videoRef}
          className="absolute inset-y-0 right-0 z-0 h-full w-[70%] object-cover"
          style={{ scale: zoom, transformOrigin: SCENE.zoom.origin, filter: 'contrast(1.08) saturate(.78) brightness(.9)', willChange: 'transform' }}
          src={SCENE.clip.mp4Url}
          poster={SCENE.clip.posterUrl}
          muted
          playsInline
          preload="none" // le vrai chargement = l'IO à 900px (évite le fetch parasite du HTML SSR sur mobile + le double-fetch desktop)
          aria-hidden="true"
        />
        {/* assombrissement en phase mockup */}
        <motion.div className="absolute inset-y-0 right-0 z-10 w-[70%] bg-black" style={{ opacity: dimOpacity }} aria-hidden />
        {/* ── LE DÉGRADÉ — le noir qui va vers la vidéo (sépare l'écriture du film) ── */}
        <div className="absolute inset-0 z-10" style={{ background: 'linear-gradient(90deg, #060610 0%, #060610 27%, rgba(6,6,16,.55) 46%, transparent 64%)' }} aria-hidden />

        <CinemaFilter />

        {/* ── TITRES-CHOCS (gauche, sur le dégradé) ── */}
        <div className="absolute inset-y-0 left-[7%] z-40 flex w-[36%] flex-col justify-center">
          <p className="t-eyebrow mb-4 font-sans text-accent-cyan">{SCENE.eyebrow}</p>
          <div className="relative min-h-[180px]">
            <motion.h2 className="absolute font-title font-semibold leading-[1.04] text-[clamp(36px,3.6vw,58px)] text-[#F8FAFC]" style={{ opacity: beat0Opacity, y: beat0Y, letterSpacing: '-.04em' }}>
              {SCENE.beats[0].text}
            </motion.h2>
            <motion.h2 className="absolute font-title font-semibold leading-[1.04] text-[clamp(36px,3.6vw,58px)] text-[#F8FAFC]" style={{ opacity: beat1Opacity, y: beat1Y, letterSpacing: '-.04em' }}>
              {SCENE.beats[1].text}
            </motion.h2>
          </div>
        </div>

        {/* ── LE MOCKUP — entre à GAUCHE quand la vidéo se fige, avec la micro-vibration ── */}
        <motion.div
          className="absolute inset-y-0 left-[8%] z-40 flex items-center"
          initial={false}
          animate={mockupOn ? { opacity: 1, x: 0 } : { opacity: 0, x: -80 }}
          transition={{ type: 'spring', stiffness: 120, damping: 26 }}
        >
          <motion.div
            animate={mockupOn ? { rotate: [0, -1.2, 1.6, -1, 0.6, 0], x: [0, -2, 3, -2, 1, 0] } : { rotate: 0, x: 0 }}
            transition={{ duration: 0.55, delay: 0.35 }}
          >
            <PhoneFrame widthClassName="w-[290px] lg:w-[320px]">
              <MockupScreen />
            </PhoneFrame>
          </motion.div>
        </motion.div>

        {/* ── LA DESCRIPTION — continue à DROITE, sur la vidéo assombrie ── */}
        <motion.div className="absolute inset-y-0 right-[7%] z-40 flex w-[34%] flex-col justify-center" style={{ opacity: payoffOpacity, y: payoffY }}>
          <h2 className="font-title font-semibold leading-[1.04] text-[clamp(36px,3.6vw,56px)] text-[#F8FAFC]" style={{ letterSpacing: '-.04em' }}>
            {SCENE.payoff.title}
          </h2>
          <p className="mt-5 max-w-[36ch] text-[17px] leading-relaxed text-white/70">{SCENE.payoff.body}</p>
        </motion.div>
      </div>
    </section>
  )
}

/* ═══ MOBILE — empilé, clip auto quand visible, titres en arrivée horizontale ═══════════════ */
function MobileSequence() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const seenRef = useSectionSeen<HTMLElement>('cinema_alerte_controle', 0)
  const [canAutoplay, setCanAutoplay] = useState(true)

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((navigator as any).connection?.saveData) setCanAutoplay(false)
  }, [])

  useEffect(() => {
    const v = videoRef.current
    const wrap = wrapRef.current
    if (!v || !wrap || !canAutoplay) return
    const io = new IntersectionObserver(
      (entries) => {
        // Dernière entrée = état réel : un fling rapide livre [entrée, sortie] groupées — lire
        // la première laisserait la vidéo jouer (et télécharger) hors écran (audit juge:code).
        const e = entries[entries.length - 1]
        if (e.isIntersecting && e.intersectionRatio >= 0.5) v.play().catch(() => {})
        else v.pause()
      },
      { threshold: [0, 0.5, 1] },
    )
    io.observe(wrap)
    const onHide = () => { if (document.visibilityState === 'hidden') v.pause() }
    document.addEventListener('visibilitychange', onHide)
    return () => { v.pause(); io.disconnect(); document.removeEventListener('visibilitychange', onHide) }
  }, [canAutoplay])

  const slideIn = (delay = 0) => ({
    initial: { opacity: 0, x: -28 },
    whileInView: { opacity: 1, x: 0 },
    viewport: { once: true, margin: '-40px' },
    transition: { duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] as const },
  })

  return (
    // md:max-w-2xl : ne concerne QUE le cas desktop+prefers-reduced-motion (cette variante sert
    // aussi de repli sans scrub) — invisible sur vrai mobile.
    <section ref={seenRef} className="relative mx-auto w-full overflow-hidden bg-foreas-obsidian md:max-w-2xl">
      {/* clip — vertical quand Chandler le fournit, 16:9 letterboxé en attendant */}
      <div ref={wrapRef} className="relative">
        <video
          ref={videoRef}
          className="w-full object-cover"
          style={{ aspectRatio: SCENE.clip.verticalMp4Url ? '9 / 16' : '16 / 10', filter: 'contrast(1.08) saturate(.78) brightness(.9)' }}
          src={SCENE.clip.verticalMp4Url ?? SCENE.clip.mp4Url}
          poster={SCENE.clip.posterUrlMobile}
          muted
          loop
          playsInline
          preload="none"
          aria-hidden="true"
        />
        <CinemaFilter />
      </div>

      <div className="px-5 pb-12 pt-8">
        <motion.p {...slideIn()} className="t-eyebrow mb-4 font-sans text-accent-cyan">{SCENE.eyebrow}</motion.p>
        <motion.h2 {...slideIn(0.08)} className="font-title font-semibold leading-[1.05] text-[32px] text-[#F8FAFC]" style={{ letterSpacing: '-.03em' }}>
          {SCENE.beats[0].text}
        </motion.h2>
        <motion.h2 {...slideIn(0.16)} className="mt-1.5 font-title font-semibold leading-[1.05] text-[32px] text-white/75" style={{ letterSpacing: '-.03em' }}>
          {SCENE.beats[1].text}
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10"
        >
          <PhoneFrame widthClassName="w-[240px]">
            <MockupScreen />
          </PhoneFrame>
        </motion.div>

        <motion.h2 {...slideIn(0.1)} className="mt-8 text-center font-title font-semibold leading-[1.05] text-[34px] text-[#F8FAFC]" style={{ letterSpacing: '-.03em' }}>
          {SCENE.payoff.title}
        </motion.h2>
        <motion.p {...slideIn(0.18)} className="mx-auto mt-3 max-w-[34ch] text-center text-[15px] leading-relaxed text-white/70">
          {SCENE.payoff.body}
        </motion.p>
      </div>
    </section>
  )
}

/* ═══ Export — choisit la variante (mobile / reduced-motion → empilée) ══════════════════════
   `mounted` d'abord : useIsMobile démarre à false → sans ce garde, un téléphone rendrait la
   variante desktop 1 frame et son IntersectionObserver lancerait le téléchargement du MP4
   (2-4 Mo) sur la 4G du chauffeur avant la bascule. La section est sous la ligne de flottaison,
   le rendu différé d'une frame est invisible. */
export default function CinematicSequence({ isMobile }: { isMobile: boolean }) {
  const reduced = useReducedMotion()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="min-h-dvh bg-foreas-obsidian" aria-hidden />
  if (isMobile || reduced) return <MobileSequence />
  return <DesktopSequence />
}

'use client'

/**
 * CinematicSequence — LA séquence cinéma de /experience (vision Chandler).
 *
 * ═══ PSYCHOLOGIE DU RYTHME (pourquoi cette typo, pas une autre) ═══
 * Un titre-choc doit être lu en UNE saccade oculaire, pas déchiffré. D'où la découpe en
 * DEUX temps par beat, avec un retour à la ligne qui force une micro-pause mentale :
 *
 *    Terminal 2D.          ← LE DÉCOR (ivoire, neutre — le cerveau situe la scène)
 *    Ce matin.             ← LE COUP (cyan, accentué — l'info qui pique)
 *
 *    Lui,                  ← LE SUJET (plus grand, la virgule suspend — « lui, pas toi »)
 *    personne ne l'a       ← LA CHUTE (cyan — l'injustice nommée)
 *    prévenu.
 *
 * Le cyan ne décore pas : il marque TOUJOURS le mot qui porte l'enjeu. Un seul accent par
 * beat (§15 : jamais deux candidats au niveau 1). L'émoji arrive APRÈS la chute, jamais
 * avant — il commente, il n'annonce pas (sinon il spoile l'émotion et tue le beat).
 *
 * ═══ MÉCANIQUE ═══
 * DESKTOP : stage épinglé. La vidéo (droite) joue au rythme du scroll. Un dégradé noir
 *   BALAIE depuis la gauche jusqu'au centre pendant que le beat est lu, puis se retire vers
 *   le bas — la vidéo continue de s'animer, le beat suivant prend sa place.
 *   Zoom sur le visage PILE au regard-caméra, calé sur le beat « Lui, personne… », enchaîné
 *   jusqu'au mockup qui entre à gauche (avec vraie vibration) + description à droite.
 * MOBILE : clip VERTICAL 9:16 (asset dédié), stage épinglé aussi — même dramaturgie, beats
 *   qui montent depuis le bas sur un voile qui balaie du bas vers le haut. Pas de scrub vidéo
 *   (coûteux en 4G) : lecture continue en boucle + beats pilotés au scroll.
 *
 * Perf : sticky CSS natif, scrub par ref + useAnimationFrame (JAMAIS de setState par frame),
 * MP4 progressif Mux, frame-loop gatée hors viewport, saveData/reduced-motion → repli simple.
 * Le texte n'est JAMAIS incrusté dans la vidéo (SEO, lisibilité, modifiable).
 */

import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform, useSpring, useMotionValueEvent, useAnimationFrame, type MotionValue } from 'framer-motion'
import posthog from 'posthog-js'
import PhoneFrame from './PhoneFrame'
import { useReducedMotion } from '@/hooks/useDevicePerf'
import { useSectionSeen } from '@/hooks/useSectionSeen'

/* ═══ SCÈNE — Alerte contrôle Terminal 2D ═════════════════════════════════════════════════════
   ⚠️ ORDRE FINAL (décision Chandler) : le Verdict Instant sera la 1ʳᵉ séquence quand son clip
   existera ; cette séquence Alerte passera en 2ᵉ. Duplication : voir docs/claude-code/05_*.md */
const MUX_LANDSCAPE = 'WpmrheUgL7J8GLgCyr3sMJXsbqgoLm01mGII7JnbdiT00'
const MUX_VERTICAL = '7YomMmttdmQ402t1tmYdhZT5mhkK00z3sEqMaCRR02ddpg'

const SCENE = {
  eyebrow: 'Entre chauffeurs',
  clip: {
    mp4Url: `https://stream.mux.com/${MUX_LANDSCAPE}/capped-1080p.mp4`,
    posterUrl: `https://image.mux.com/${MUX_LANDSCAPE}/thumbnail.webp?time=1.2&width=1600`,
    verticalMp4Url: `https://stream.mux.com/${MUX_VERTICAL}/capped-1080p.mp4`,
    verticalPosterUrl: `https://image.mux.com/${MUX_VERTICAL}/thumbnail.webp?time=1.2&width=800`,
    /** Fallback — la frame-loop lit v.duration en priorité (clip re-trimmable sans toucher au code). */
    durationSec: 5.13,
  },
  /**
   * Beats : `lead` = décor (ivoire) · `punch` = l'enjeu (cyan) · `emoji` = commentaire après la chute.
   * `leadScale` agrandit légèrement le sujet sans majuscule (« Lui, » — demande Chandler).
   */
  beats: [
    { in: 0.04, out: 0.30, lead: 'Terminal 2D.', punch: 'Ce matin.', emoji: '🙄', leadScale: 1 },
    { in: 0.34, out: 0.60, lead: 'Lui,', punch: 'personne ne l’a prévenu.', emoji: '😏', leadScale: 1.18 },
  ],
  /** Zoom PILE au regard-caméra — calé sur le beat 2 (« Lui, personne… »), enchaîné au mockup. */
  zoom: { start: 0.34, end: 0.62, scale: 1.16, origin: '52% 30%' },
  /** Progression à laquelle le clip a fini de se dérouler (le scrub mappe [0 → videoEnd]). */
  videoEnd: 0.62,
  /** Entrée du mockup (gauche) + bascule de la description (droite). */
  mockupAt: 0.66,
  payoff: {
    lead: 'Toi,',
    punch: 'ton téléphone a vibré.',
    emoji: '😌',
    body: 'Un chauffeur signale un contrôle — tous ceux dans le coin reçoivent l’alerte. En direct, entre chauffeurs.',
  },
  /** Vidéo ScreenStudio de la notification (fournie par Chandler) — remplace le mockup CSS. */
  mockupVideoSrc: null as string | null,
}

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

/** Étalonnage vintage : sépia léger + contraste + désaturation + chaleur. Le sépia (12%) porte
 *  le « vieux film » sans virer jaune ; le reste garde le noir profond du design system. */
const VINTAGE = 'sepia(.12) contrast(1.12) saturate(.72) brightness(.88) hue-rotate(-4deg)'

/* ─── Écran de notification (placeholder fidèle, remplacé par la capture ScreenStudio) ──────── */
function NotificationScreen() {
  return (
    <div className="flex h-full w-full flex-col bg-gradient-to-b from-[#0B0F1E] to-foreas-obsidian px-4 pt-14">
      <p className="text-center font-sans text-[44px] font-semibold leading-none tabular-nums text-[#F8FAFC]">09:41</p>
      <p className="mt-1 text-center text-[11.5px] text-white/45">samedi 18 juillet</p>
      <div className="mt-6 rounded-[18px] border border-white/[0.08] p-3" style={{ backgroundColor: 'rgba(17,21,40,0.88)' }}>
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 flex-none items-center justify-center rounded-[8px] bg-gradient-to-br from-accent-purple to-accent-purple-deep font-title text-[13px] font-bold text-white">F/</span>
          <span className="flex-1 text-[11px] font-semibold uppercase tracking-wide text-white/55">FOREAS</span>
          <span className="text-[11px] text-white/40">il y a 2 min</span>
        </div>
        <p className="mt-2 text-[13.5px] font-bold leading-snug text-[#F8FAFC]">🚨 Contrôle signalé — Terminal 2D</p>
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

/* ─── Filtre cinéma : grain + vignette + letterbox ──────────────────────────────────────────── */
function CinemaFilter() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 z-20 opacity-[.08] mix-blend-overlay" style={{ backgroundImage: GRAIN, backgroundSize: '140px 140px' }} aria-hidden />
      <div className="pointer-events-none absolute inset-0 z-20" style={{ background: 'radial-gradient(115% 90% at 50% 50%, transparent 42%, rgba(0,0,0,.6) 100%)' }} aria-hidden />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 h-[6.5%] bg-black" aria-hidden />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-[6.5%] bg-black" aria-hidden />
    </>
  )
}

/** Émoji qui « respire » discrètement — commente le beat sans voler la vedette au texte. */
function BeatEmoji({ char, className = '' }: { char: string; className?: string }) {
  return (
    <motion.span
      className={`inline-block ${className}`}
      aria-hidden="true"
      animate={{ rotate: [0, -6, 5, 0], scale: [1, 1.08, 1] }}
      transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 1.6, ease: 'easeInOut' }}
    >
      {char}
    </motion.span>
  )
}

/* ═══ DESKTOP ════════════════════════════════════════════════════════════════════════════════ */
function DesktopBeat({
  beat,
  progress,
}: {
  beat: (typeof SCENE.beats)[number]
  progress: MotionValue<number>
}) {
  // Le texte entre, tient, puis se retire VERS LE BAS (le beat suivant prend sa place).
  const opacity = useTransform(progress, [beat.in - 0.04, beat.in + 0.02, beat.out - 0.03, beat.out + 0.03], [0, 1, 1, 0])
  const y = useTransform(progress, [beat.in - 0.04, beat.in + 0.02, beat.out - 0.03, beat.out + 0.03], [26, 0, 0, -34])

  return (
    <motion.div className="absolute" style={{ opacity, y }}>
      <h2 className="font-title font-semibold leading-[0.98] text-[#F8FAFC]" style={{ letterSpacing: '-.045em' }}>
        <span className="block" style={{ fontSize: `calc(clamp(38px,3.9vw,64px) * ${beat.leadScale})` }}>
          {beat.lead}
        </span>
        <span className="block text-accent-cyan" style={{ fontSize: 'clamp(38px,3.9vw,64px)' }}>
          {beat.punch}{' '}
          <BeatEmoji char={beat.emoji} className="align-baseline text-[0.72em]" />
        </span>
      </h2>
    </motion.div>
  )
}

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

  // Zoom visage — démarre pile au regard-caméra (beat 2) et file jusqu'au mockup.
  const zoom = useSpring(useTransform(scrollYProgress, [SCENE.zoom.start, SCENE.zoom.end], [1, SCENE.zoom.scale]), { stiffness: 110, damping: 30 })
  // Assombrissement quand le mockup prend la scène.
  const dimOpacity = useTransform(scrollYProgress, [SCENE.mockupAt - 0.05, SCENE.mockupAt + 0.06], [0, 0.62])

  // ── LE DÉGRADÉ QUI BALAIE ──
  // Il avance depuis la gauche jusqu'au centre pendant les beats (couvre le texte d'un noir
  // dense), puis se RETIRE VERS LE BAS quand le mockup arrive : la vidéo respire à nouveau.
  const veilWidth = useTransform(scrollYProgress, [0, 0.08, SCENE.beats[1].out, SCENE.mockupAt], ['18%', '52%', '52%', '46%'])
  const veilY = useTransform(scrollYProgress, [SCENE.mockupAt - 0.02, SCENE.mockupAt + 0.1], ['0%', '4%'])
  const veilOpacity = useTransform(scrollYProgress, [0, 0.06, SCENE.mockupAt, SCENE.mockupAt + 0.12], [0.75, 1, 1, 0.9])

  const payoffOpacity = useTransform(scrollYProgress, [SCENE.mockupAt + 0.04, SCENE.mockupAt + 0.13], [0, 1])
  const payoffY = useTransform(scrollYProgress, [SCENE.mockupAt + 0.04, SCENE.mockupAt + 0.13], [28, 0])

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
    if (!activeRef.current) return // hors écran → zéro travail par frame
    const v = videoRef.current
    if (!v || v.readyState < 2) return
    const dur = Math.max(0.1, (v.duration || SCENE.clip.durationSec) - 0.05)
    const t = targetRatio.current * dur
    if (Math.abs(v.currentTime - t) > 1 / 30) v.currentTime = t
  })

  useEffect(() => {
    const el = sectionRef.current
    const v = videoRef.current
    if (!el || !v) return
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[entries.length - 1] // dernière entrée = état réel après un fling
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
    <section ref={sectionRef} className="relative h-[360vh]">
      <div ref={seenRef} className="sticky top-0 h-dvh overflow-clip bg-foreas-obsidian">
        {/* ── LA VIDÉO (droite), scrub au scroll, zoom visage, étalonnage vintage ── */}
        <motion.video
          ref={videoRef}
          className="absolute inset-y-0 right-0 z-0 h-full w-[72%] object-cover"
          style={{ scale: zoom, transformOrigin: SCENE.zoom.origin, filter: VINTAGE, willChange: 'transform' }}
          src={SCENE.clip.mp4Url}
          poster={SCENE.clip.posterUrl}
          muted
          playsInline
          preload="none"
          aria-hidden="true"
        />
        <motion.div className="absolute inset-y-0 right-0 z-10 w-[72%] bg-black" style={{ opacity: dimOpacity }} aria-hidden />

        {/* ── LE DÉGRADÉ QUI BALAIE (gauche → centre, puis se retire vers le bas) ── */}
        <motion.div
          className="absolute inset-y-0 left-0 z-20"
          style={{
            width: veilWidth,
            y: veilY,
            opacity: veilOpacity,
            background: 'linear-gradient(90deg, #060610 0%, #060610 46%, rgba(6,6,16,.72) 74%, transparent 100%)',
          }}
          aria-hidden
        />

        <CinemaFilter />

        {/* ── LES BEATS (gauche, sur le voile) ── */}
        <div className="absolute inset-y-0 left-[7%] z-40 flex w-[40%] flex-col justify-center">
          <p className="t-eyebrow mb-6 font-sans text-accent-cyan">{SCENE.eyebrow}</p>
          <div className="relative min-h-[210px]">
            {SCENE.beats.map((b, i) => (
              <DesktopBeat key={i} beat={b} progress={scrollYProgress} />
            ))}
          </div>
        </div>

        {/* ── LE MOCKUP (entre à gauche, vibre pour de vrai) ── */}
        <motion.div
          className="absolute inset-y-0 left-[9%] z-40 flex items-center"
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

        {/* ── LA DESCRIPTION (droite, sur la vidéo assombrie) ── */}
        <motion.div className="absolute inset-y-0 right-[7%] z-40 flex w-[34%] flex-col justify-center" style={{ opacity: payoffOpacity, y: payoffY }}>
          <h2 className="font-title font-semibold leading-[0.98] text-[#F8FAFC]" style={{ letterSpacing: '-.045em' }}>
            <span className="block" style={{ fontSize: 'clamp(38px,3.9vw,62px)' }}>{SCENE.payoff.lead}</span>
            <span className="block text-accent-cyan" style={{ fontSize: 'clamp(38px,3.9vw,62px)' }}>
              {SCENE.payoff.punch} <BeatEmoji char={SCENE.payoff.emoji} className="align-baseline text-[0.72em]" />
            </span>
          </h2>
          <p className="mt-6 max-w-[34ch] text-[17px] leading-relaxed text-white/70">{SCENE.payoff.body}</p>
        </motion.div>
      </div>
    </section>
  )
}

/* ═══ MOBILE — même dramaturgie, clip VERTICAL, voile qui balaie du bas ══════════════════════ */
function MobileBeat({ beat, progress }: { beat: (typeof SCENE.beats)[number]; progress: MotionValue<number> }) {
  const opacity = useTransform(progress, [beat.in - 0.04, beat.in + 0.02, beat.out - 0.03, beat.out + 0.03], [0, 1, 1, 0])
  const y = useTransform(progress, [beat.in - 0.04, beat.in + 0.02, beat.out - 0.03, beat.out + 0.03], [30, 0, 0, -26])
  return (
    <motion.div className="absolute inset-x-0" style={{ opacity, y }}>
      <h2 className="font-title font-semibold leading-[0.98] text-[#F8FAFC]" style={{ letterSpacing: '-.04em' }}>
        <span className="block" style={{ fontSize: `calc(clamp(34px,9vw,46px) * ${beat.leadScale})` }}>{beat.lead}</span>
        <span className="block text-accent-cyan" style={{ fontSize: 'clamp(34px,9vw,46px)' }}>
          {beat.punch} <BeatEmoji char={beat.emoji} className="align-baseline text-[0.7em]" />
        </span>
      </h2>
    </motion.div>
  )
}

function MobileSequence() {
  const sectionRef = useRef<HTMLElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const activeRef = useRef(false)
  const payoffCaptured = useRef(false)
  const [mockupOn, setMockupOn] = useState(false)
  const [canAutoplay, setCanAutoplay] = useState(true)
  const seenRef = useSectionSeen<HTMLDivElement>('cinema_alerte_controle', 0)

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] })

  // Le voile monte depuis le bas et couvre la moitié basse pendant les beats, puis recule.
  const veilHeight = useTransform(scrollYProgress, [0, 0.08, SCENE.beats[1].out, SCENE.mockupAt], ['34%', '62%', '62%', '54%'])
  const veilOpacity = useTransform(scrollYProgress, [0, 0.06, SCENE.mockupAt + 0.14], [0.8, 1, 0.94])
  const zoom = useSpring(useTransform(scrollYProgress, [SCENE.zoom.start, SCENE.zoom.end], [1, SCENE.zoom.scale]), { stiffness: 110, damping: 30 })
  const dimOpacity = useTransform(scrollYProgress, [SCENE.mockupAt - 0.05, SCENE.mockupAt + 0.06], [0, 0.5])
  const payoffOpacity = useTransform(scrollYProgress, [SCENE.mockupAt + 0.04, SCENE.mockupAt + 0.13], [0, 1])
  const payoffY = useTransform(scrollYProgress, [SCENE.mockupAt + 0.04, SCENE.mockupAt + 0.13], [26, 0])

  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    const on = p >= SCENE.mockupAt
    setMockupOn((prev) => (prev === on ? prev : on))
    if (on && !payoffCaptured.current) {
      payoffCaptured.current = true
      try { posthog.capture('experience_cinematic_payoff_viewed', { scene: 'alerte_controle_2d', variant: 'mobile' }) } catch { /* noop */ }
    }
  })

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((navigator as any).connection?.saveData) setCanAutoplay(false)
  }, [])

  // Lecture continue tant que la section est visible (pas de scrub : trop coûteux en 4G).
  useEffect(() => {
    const el = sectionRef.current
    const v = videoRef.current
    if (!el || !v || !canAutoplay) return
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[entries.length - 1]
        activeRef.current = e.isIntersecting
        if (e.isIntersecting) v.play().catch(() => {})
        else v.pause()
      },
      { threshold: [0, 0.25, 1] },
    )
    io.observe(el)
    const onHide = () => { if (document.visibilityState === 'hidden') v.pause() }
    document.addEventListener('visibilitychange', onHide)
    return () => { v.pause(); io.disconnect(); document.removeEventListener('visibilitychange', onHide) }
  }, [canAutoplay])

  return (
    <section ref={sectionRef} className="relative h-[300vh]">
      <div ref={seenRef} className="sticky top-0 h-dvh overflow-clip bg-foreas-obsidian">
        {/* clip VERTICAL 9:16 — plein cadre, étalonnage vintage */}
        <motion.video
          ref={videoRef}
          className="absolute inset-0 z-0 h-full w-full object-cover"
          style={{ scale: zoom, transformOrigin: SCENE.zoom.origin, filter: VINTAGE, willChange: 'transform' }}
          src={SCENE.clip.verticalMp4Url}
          poster={SCENE.clip.verticalPosterUrl}
          muted
          loop
          playsInline
          preload="none"
          aria-hidden="true"
        />
        <motion.div className="absolute inset-0 z-10 bg-black" style={{ opacity: dimOpacity }} aria-hidden />

        {/* voile qui balaie depuis le bas */}
        <motion.div
          className="absolute inset-x-0 bottom-0 z-20"
          style={{
            height: veilHeight,
            opacity: veilOpacity,
            background: 'linear-gradient(0deg, #060610 0%, #060610 44%, rgba(6,6,16,.7) 76%, transparent 100%)',
          }}
          aria-hidden
        />

        <CinemaFilter />

        {/* beats — bas de l'écran, là où le pouce ne masque pas */}
        <div className="absolute inset-x-0 bottom-[16%] z-40 px-5">
          <p className="t-eyebrow mb-4 font-sans text-accent-cyan">{SCENE.eyebrow}</p>
          <div className="relative min-h-[150px]">
            {SCENE.beats.map((b, i) => (
              <MobileBeat key={i} beat={b} progress={scrollYProgress} />
            ))}
            <motion.div className="absolute inset-x-0" style={{ opacity: payoffOpacity, y: payoffY }}>
              <h2 className="font-title font-semibold leading-[0.98] text-[#F8FAFC]" style={{ letterSpacing: '-.04em' }}>
                <span className="block" style={{ fontSize: 'clamp(34px,9vw,46px)' }}>{SCENE.payoff.lead}</span>
                <span className="block text-accent-cyan" style={{ fontSize: 'clamp(34px,9vw,46px)' }}>
                  {SCENE.payoff.punch} <BeatEmoji char={SCENE.payoff.emoji} className="align-baseline text-[0.7em]" />
                </span>
              </h2>
              <p className="mt-3 max-w-[34ch] text-[14.5px] leading-relaxed text-white/70">{SCENE.payoff.body}</p>
            </motion.div>
          </div>
        </div>

        {/* mockup — monte depuis le bas quand la vidéo se fige, décalé pour ne pas manger le texte */}
        <motion.div
          className="absolute inset-x-0 top-[6%] z-30 flex justify-center"
          initial={false}
          animate={mockupOn ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
          transition={{ type: 'spring', stiffness: 120, damping: 26 }}
        >
          <motion.div
            animate={mockupOn ? { rotate: [0, -1.2, 1.6, -1, 0.6, 0], x: [0, -2, 3, -2, 1, 0] } : { rotate: 0, x: 0 }}
            transition={{ duration: 0.55, delay: 0.35 }}
          >
            <PhoneFrame widthClassName="w-[190px]">
              <MockupScreen />
            </PhoneFrame>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

/* ═══ Repli sans scroll-story (reduced-motion) ══════════════════════════════════════════════ */
function StaticSequence() {
  const seenRef = useSectionSeen<HTMLElement>('cinema_alerte_controle', 0)
  return (
    <section ref={seenRef} className="mx-auto w-full max-w-2xl bg-foreas-obsidian px-5 py-14">
      <p className="t-eyebrow mb-5 font-sans text-accent-cyan">{SCENE.eyebrow}</p>
      {[...SCENE.beats, SCENE.payoff].map((b, i) => (
        <h2 key={i} className="mb-6 font-title font-semibold leading-[1] text-[#F8FAFC]" style={{ letterSpacing: '-.04em' }}>
          <span className="block text-[34px]">{b.lead}</span>
          <span className="block text-[34px] text-accent-cyan">{b.punch}</span>
        </h2>
      ))}
      <p className="mb-8 max-w-[34ch] text-[15px] leading-relaxed text-white/70">{SCENE.payoff.body}</p>
      <PhoneFrame widthClassName="w-[230px]">
        <MockupScreen />
      </PhoneFrame>
    </section>
  )
}

/* ═══ Export ════════════════════════════════════════════════════════════════════════════════
   `mounted` d'abord : useIsMobile démarre à false → sans ce garde, un téléphone rendrait la
   variante desktop 1 frame et son observer lancerait le MP4 paysage sur la 4G du chauffeur. */
export default function CinematicSequence({ isMobile }: { isMobile: boolean }) {
  const reduced = useReducedMotion()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="min-h-dvh bg-foreas-obsidian" aria-hidden />
  if (reduced) return <StaticSequence />
  return isMobile ? <MobileSequence /> : <DesktopSequence />
}

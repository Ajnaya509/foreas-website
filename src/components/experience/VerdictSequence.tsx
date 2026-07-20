'use client'

/**
 * VerdictSequence — SCÈNE 1 de la page : « Prends ou laisse — avant la fin de la sonnerie. »
 * La feature la plus forte du produit, donc la première vue après le hero.
 *
 * LA DRAMATURGIE (3 temps, 3 clips réels de Chandler) :
 *   1. Il attend, il hésite  → clip Hésitation, PILOTÉ PAR LE SCROLL (le doigt est le projecteur)
 *   2. « PAS RENTABLE »      → bandeau qui entre par la GAUCHE, joue une fois, AVEC son
 *   3. « RENTABLE »          → mockup qui entre par la DROITE, joue une fois, AVEC son
 *
 * RÈGLES DE FOND (spec Fable, tirées de 3 échecs précédents) :
 * - Rien ne bouge jamais tout seul : tout est piloté par le scroll, mobile ET desktop.
 * - Le voile sombre vit DU CÔTÉ du texte (en haut sur mobile, à gauche sur desktop) —
 *   l'inverse exact du bug « les textes sont par-dessus la vidéo ».
 * - Le contenu réserve la place de la barre « Discuter avec Ajnaya » via --cta-clearance :
 *   plus jamais un mockup coupé par le CTA.
 * - Le son est un BONUS opt-in : la scène se comprend à 100% en silence (les verdicts sont
 *   écrits dans les pixels). Le scroll n'est jamais un geste utilisateur au sens navigateur,
 *   donc l'audio ne peut pas démarrer seul — d'où la pastille « Mets le son ».
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform, useMotionValueEvent, type MotionValue } from 'framer-motion'
import posthog from 'posthog-js'
import PhoneFrame from './PhoneFrame'
import { useSectionSeen } from '@/hooks/useSectionSeen'
import { useReducedMotion } from '@/hooks/useDevicePerf'
import {
  useScrubbedVideo, useScrollTriggeredClip, useSectionActive, useNearbyPreload,
  useMutedVideoRef, useAudioUnlocked, unlockAudio,
} from '@/hooks/useCinemaVideo'

const V = '/videos/experience'

/** Étalonnage vintage — uniquement sur le plan de réalité (jamais sur les écrans d'app). */
const VINTAGE = 'sepia(.12) contrast(1.12) saturate(.72) brightness(.88) hue-rotate(-4deg)'

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

/** Chorégraphie : une seule piste de progression 0→1, partagée mobile/desktop. */
const T = {
  scrubFrom: 0.05, scrubTo: 0.32,   // le clip Hésitation se déroule ici
  dimAt: 0.32,                       // la réalité s'assombrit, place aux notifications
  refuseAt: 0.38, refuseRearm: 0.30, // le bandeau REFUSE entre par la gauche
  refuseOut: 0.56,
  accepteAt: 0.60, accepteRearm: 0.50, // le mockup ACCEPTE entre par la droite
  beats: [
    { in: 0.08, out: 0.29, lead: 'Ça sonne. Tu regardes l’écran.', punch: 'Rentable ? Aucune idée.', emoji: '🙄' },
    { in: 0.42, out: 0.55, lead: 'Celle-là, tu l’aurais prise.', punch: 'Tu viens de l’esquiver.', emoji: '🤫' },
    // out 0.96 (pas 1.10) : la progression plafonne à 1.0 — un out au-delà ne s'atteint jamais,
    // le carton restait donc plein écran quand le sticky se libère et remontait sous le header
    // (fantôme flouté vu dans le simulateur iOS). 0.96 = fondu AVANT la libération.
    { in: 0.66, out: 0.96, lead: 'Celle-là est bonne.', punch: 'Tu pars. Sans y penser.', emoji: '😌' },
  ],
  conclusionAt: 0.86,
} as const

const TEXT_SHADOW = '0 2px 24px rgba(6,6,16,.9)'

/* ─── Un carton (deux temps : décor ivoire, puis l'enjeu en cyan) ──────────────────────────── */
function Beat({
  beat, progress, sizeClass,
}: {
  beat: (typeof T.beats)[number]
  progress: MotionValue<number>
  sizeClass: string
}) {
  const opacity = useTransform(progress, [beat.in - 0.04, beat.in + 0.02, beat.out - 0.03, beat.out + 0.03], [0, 1, 1, 0])
  const y = useTransform(progress, [beat.in - 0.04, beat.in + 0.02, beat.out - 0.03, beat.out + 0.03], [26, 0, 0, -28])
  // Emoji calé sur le MÊME progress que le reste du carton (réversible au scroll arrière comme
  // tout le reste de la scène) — avant, un whileInView à sens unique le figeait après sa 1ère
  // apparition, en décalage avec un carton qui, lui, réapparaît si on remonte. Léger décalage
  // après beat.in : l'emoji ponctue le texte, il n'arrive pas en même temps que lui.
  const emojiRotate = useTransform(progress, [beat.in - 0.01, beat.in + 0.05], [-8, 0])
  const emojiScale = useTransform(progress, [beat.in - 0.01, beat.in + 0.05], [0.8, 1])
  const emojiOpacity = useTransform(progress, [beat.in - 0.01, beat.in + 0.05], [0, 1])
  // Le dernier mot et l'emoji sont soudés (whitespace-nowrap) : sur 375px, l'emoji passait
  // seul à la ligne — un orphelin d'un caractère sous le carton (vu dans le simulateur iOS).
  const words = beat.punch.split(' ')
  const lastWord = words.pop()
  const head = words.join(' ')
  return (
    <motion.div className="absolute inset-x-0" style={{ opacity, y }}>
      <h2 className={`font-sans font-extrabold leading-[1.0] text-[#F8FAFC] ${sizeClass}`} style={{ letterSpacing: '-.02em', textShadow: TEXT_SHADOW }}>
        <span className="block">{beat.lead}</span>
        <span className="block text-accent-cyan">
          {head && `${head} `}
          <span className="whitespace-nowrap">
            {lastWord}{' '}
            <motion.span
              className="inline-block align-baseline text-[0.72em]"
              aria-hidden="true"
              style={{ rotate: emojiRotate, scale: emojiScale, opacity: emojiOpacity }}
            >
              {beat.emoji}
            </motion.span>
          </span>
        </span>
      </h2>
    </motion.div>
  )
}

/* ─── Pastille son (le seul moyen légal d'avoir du son : un vrai tap) ──────────────────────── */
function SoundPill({ onUnlock, visible }: { onUnlock: () => void; visible: boolean }) {
  const unlocked = useAudioUnlocked()
  if (!visible) return null
  return (
    <motion.button
      type="button"
      onClick={onUnlock}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute right-4 z-[45] rounded-full border border-white/[0.14] px-3 py-1.5 text-[12px] font-semibold text-[#F8FAFC] backdrop-blur-md"
      // top 62 : alignée sur la LIGNE DE L'EYEBROW (courte, à gauche) — à 76px elle chevauchait
      // la première ligne des cartons (vu dans le simulateur iOS).
      style={{ top: 62, backgroundColor: 'rgba(10,12,20,.92)' }}
      aria-label={unlocked ? 'Son activé' : 'Activer le son'}
    >
      {unlocked ? '🔊' : '🔊 Mets le son'}
    </motion.button>
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

/* ═══ MOBILE ═════════════════════════════════════════════════════════════════════════════════ */
function MobileVerdict() {
  const sectionRef = useRef<HTMLElement>(null)
  const seenRef = useSectionSeen<HTMLDivElement>('verdict_instant', 0)
  const [hesitationRef, setHesitationRef] = useMutedVideoRef()
  const [refuseRef, setRefuseRef] = useMutedVideoRef()
  const [accepteRef, setAccepteRef] = useMutedVideoRef()
  const [pillVisible, setPillVisible] = useState(false)

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] })
  const activeRef = useSectionActive(sectionRef)
  useNearbyPreload(sectionRef, [hesitationRef, refuseRef, accepteRef])

  useScrubbedVideo(hesitationRef, scrollYProgress, { from: T.scrubFrom, to: T.scrubTo, fps: 24, activeRef })
  const refuse = useScrollTriggeredClip(refuseRef, scrollYProgress, { at: T.refuseAt, rearmAt: T.refuseRearm, activeRef })
  useScrollTriggeredClip(accepteRef, scrollYProgress, { at: T.accepteAt, rearmAt: T.accepteRearm, activeRef })

  const dim = useTransform(scrollYProgress, [T.dimAt, T.dimAt + 0.06], [0, 0.5])
  const refuseX = useTransform(scrollYProgress, [T.refuseAt - 0.03, T.refuseAt + 0.04, T.refuseOut, T.refuseOut + 0.04], [-70, 0, 0, -50])
  const refuseOpacity = useTransform(scrollYProgress, [T.refuseAt - 0.03, T.refuseAt + 0.04, T.refuseOut, T.refuseOut + 0.04], [0, 1, 1, 0])
  const accepteX = useTransform(scrollYProgress, [T.accepteAt - 0.03, T.accepteAt + 0.05], [70, 0])
  const accepteOpacity = useTransform(scrollYProgress, [T.accepteAt - 0.03, T.accepteAt + 0.05], [0, 1])
  const conclusionOpacity = useTransform(scrollYProgress, [T.conclusionAt, T.conclusionAt + 0.06], [0, 1])

  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    setPillVisible((prev) => (prev === (p > 0.02 && p < 0.9) ? prev : p > 0.02 && p < 0.9))
    if (p >= T.accepteAt) refuse.silence() // jamais deux sons en même temps
  })

  const handleUnlock = useCallback(() => {
    unlockAudio(refuseRef.current)
    try { posthog.capture('experience_sound_unlocked', { scene: 'verdict' }) } catch { /* noop */ }
  }, [refuseRef])

  // h-[400svh] sur la section (piste de scroll figée — la progression scrubée ne doit jamais
  // sauter), h-[100dvh] sur l'enfant collant (pas svh) : svh = hauteur PETITE du viewport, celle
  // mesurée barre d'URL Safari déployée. Une fois la barre rétractée au scroll, un enfant en svh
  // laisse une bande noire en bas ; dvh suit la hauteur réellement visible.
  return (
    <section ref={sectionRef} data-cinema-scene className="relative h-[400svh]">
      <div ref={seenRef} className="sticky top-0 z-30 h-[100dvh] overflow-clip bg-foreas-obsidian">
        {/* le film — piloté par le doigt */}
        <motion.video
          ref={setHesitationRef}
          className="absolute inset-0 z-0 h-full w-full object-cover"
          style={{ filter: VINTAGE }}
          src={`${V}/hesitation.scrub.mp4`}
          poster={`${V}/hesitation.poster.jpg`}
          muted playsInline preload="none" disableRemotePlayback aria-hidden="true"
        />
        <motion.div className="absolute inset-0 z-10 bg-black" style={{ opacity: dim }} aria-hidden />

        {/* le voile est DU CÔTÉ DU TEXTE (en haut) — c'est ce qui rend les cartons lisibles */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[46%]"
          style={{ background: 'linear-gradient(180deg,#060610 0%,rgba(6,6,16,.85) 52%,transparent 100%)' }}
          aria-hidden
        />
        <CinemaGrain />
        <SoundPill onUnlock={handleUnlock} visible={pillVisible} />

        {/* contenu — réserve la place du CTA fixe, ne peut donc jamais être coupé */}
        <div
          className="absolute inset-0 z-30 flex flex-col px-5 pt-[68px]"
          style={{ paddingBottom: 'calc(var(--cta-clearance) + 8px)' }}
        >
          <p className="t-eyebrow mb-4 font-sans text-accent-cyan">Verdict instant</p>

          <div className="relative min-h-[132px]">
            {T.beats.map((b, i) => (
              <Beat key={i} beat={b} progress={scrollYProgress} sizeClass="text-[clamp(28px,7.6vw,38px)]" />
            ))}
          </div>

          <div className="relative mt-2 flex-1">
            {/* REFUSE — bandeau seul, entre par la GAUCHE */}
            <motion.div
              className="absolute left-0 top-[4%] w-[86%] max-w-[340px]"
              style={{ x: refuseX, opacity: refuseOpacity }}
            >
              <video
                ref={setRefuseRef}
                className="w-full rounded-2xl border border-white/[0.10] shadow-2xl"
                src={`${V}/coach-refuse.play.mp4`}
                poster={`${V}/coach-refuse.poster.jpg`}
                muted playsInline preload="none" disableRemotePlayback
                role="img" aria-label="Notification FOREAS : course pas rentable, refusée"
              />
            </motion.div>

            {/* ACCEPTE — dans le téléphone, entre par la DROITE.
                Ancré en HAUT (pas en bas) et dimensionné par la LARGEUR : le contenu utile est
                la notification, qui vit dans le tiers haut de l'écran. En l'ancrant en bas, tout
                agrandissement poussait le téléphone vers le haut, dans les cartons de texte.
                Ancré en haut, il déborde par le bas — on ne perd que le biseau et la barre
                d'accueil, et la largeur passe de 191px à 300px (échelle ×1,57). */}
            <motion.div
              className="absolute inset-x-0 top-0 flex justify-center"
              style={{ x: accepteX, opacity: accepteOpacity }}
            >
              <PhoneFrame widthClassName="w-[min(300px,84vw)]">
                <video
                  ref={setAccepteRef}
                  className="h-full w-full object-cover"
                  src={`${V}/coach-accepte.play.mp4`}
                  poster={`${V}/coach-accepte.poster.jpg`}
                  muted playsInline preload="none" disableRemotePlayback
                  role="img" aria-label="Notification FOREAS : course rentable à 13,90 €, acceptée"
                />
              </PhoneFrame>
            </motion.div>
          </div>

          {/* Sortie du flux : le téléphone déborde maintenant vers le bas et passerait dessous.
              ⚠️ `bottom-0` serait FAUX ici — un élément absolu se positionne sur le PADDING box
              du parent, donc bottom:0 tomberait SOUS le paddingBottom de clearance, c'est-à-dire
              sous la barre CTA (la régression déjà corrigée deux fois). On ancre donc
              explicitement sur la même valeur de clearance. Le dégradé rend le texte lisible
              par-dessus la vidéo du téléphone. */}
          <motion.p
            className="absolute inset-x-5 z-10 pt-10 text-[14.5px] font-medium leading-relaxed text-white/70"
            style={{
              opacity: conclusionOpacity,
              textShadow: TEXT_SHADOW,
              bottom: 'calc(var(--cta-clearance) + 8px)',
              background: 'linear-gradient(180deg,transparent 0%,#060610 42%)',
            }}
          >
            Tu ne devines plus : tu sais avant d’accepter.<br />
            Ajnaya est là — demande-lui pour ta prochaine course.
          </motion.p>
        </div>
      </div>
    </section>
  )
}

/* ═══ DESKTOP ════════════════════════════════════════════════════════════════════════════════ */
function DesktopVerdict() {
  const sectionRef = useRef<HTMLElement>(null)
  const seenRef = useSectionSeen<HTMLDivElement>('verdict_instant', 0)
  const [hesitationRef, setHesitationRef] = useMutedVideoRef()
  const [refuseRef, setRefuseRef] = useMutedVideoRef()
  const [accepteRef, setAccepteRef] = useMutedVideoRef()
  const [pillVisible, setPillVisible] = useState(false)

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] })
  const activeRef = useSectionActive(sectionRef)
  useNearbyPreload(sectionRef, [hesitationRef, refuseRef, accepteRef])

  useScrubbedVideo(hesitationRef, scrollYProgress, { from: T.scrubFrom, to: T.scrubTo, fps: 24, activeRef })
  const refuse = useScrollTriggeredClip(refuseRef, scrollYProgress, { at: T.refuseAt, rearmAt: T.refuseRearm, activeRef })
  useScrollTriggeredClip(accepteRef, scrollYProgress, { at: T.accepteAt, rearmAt: T.accepteRearm, activeRef })

  const dim = useTransform(scrollYProgress, [T.dimAt, T.dimAt + 0.06], [0, 0.55])
  const refuseX = useTransform(scrollYProgress, [T.refuseAt - 0.03, T.refuseAt + 0.04, T.refuseOut, T.refuseOut + 0.04], [-70, 0, 0, -50])
  const refuseOpacity = useTransform(scrollYProgress, [T.refuseAt - 0.03, T.refuseAt + 0.04, T.refuseOut, T.refuseOut + 0.04], [0, 1, 1, 0])
  const accepteX = useTransform(scrollYProgress, [T.accepteAt - 0.03, T.accepteAt + 0.05], [70, 0])
  const accepteOpacity = useTransform(scrollYProgress, [T.accepteAt - 0.03, T.accepteAt + 0.05], [0, 1])
  const conclusionOpacity = useTransform(scrollYProgress, [T.conclusionAt, T.conclusionAt + 0.06], [0, 1])

  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    setPillVisible((prev) => (prev === (p > 0.02 && p < 0.9) ? prev : p > 0.02 && p < 0.9))
    if (p >= T.accepteAt) refuse.silence()
  })

  const handleUnlock = useCallback(() => {
    unlockAudio(refuseRef.current)
    try { posthog.capture('experience_sound_unlocked', { scene: 'verdict' }) } catch { /* noop */ }
  }, [refuseRef])

  return (
    <section ref={sectionRef} className="relative h-[400vh]">
      <div ref={seenRef} className="sticky top-0 z-30 h-dvh overflow-clip bg-foreas-obsidian">
        <motion.video
          ref={setHesitationRef}
          className="absolute inset-y-0 right-0 z-0 h-full w-[72%] object-cover"
          style={{ filter: VINTAGE }}
          src={`${V}/hesitation.scrub.mp4`}
          poster={`${V}/hesitation.poster.jpg`}
          muted playsInline preload="none" disableRemotePlayback aria-hidden="true"
        />
        <motion.div className="absolute inset-y-0 right-0 z-10 w-[72%] bg-black" style={{ opacity: dim }} aria-hidden />

        {/* voile STATIQUE côté texte : le carton 1 n'est jamais sur l'image nue */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-20 w-[55%]"
          style={{ background: 'linear-gradient(90deg,#060610 0%,#060610 55%,rgba(6,6,16,.8) 78%,transparent 100%)' }}
          aria-hidden
        />
        <CinemaGrain />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[6.5%] bg-black" aria-hidden />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[6.5%] bg-black" aria-hidden />
        <SoundPill onUnlock={handleUnlock} visible={pillVisible} />

        {/* cartons — largeur 30% : la ligne la plus longue reste en zone opaque */}
        <div className="absolute inset-y-0 left-[7%] z-30 flex w-[32%] flex-col justify-center">
          <p className="t-eyebrow mb-6 font-sans text-accent-cyan">Verdict instant</p>
          <div className="relative min-h-[200px]">
            {T.beats.map((b, i) => (
              <Beat key={i} beat={b} progress={scrollYProgress} sizeClass="text-[clamp(32px,3.2vw,52px)]" />
            ))}
          </div>
          <motion.p
            className="mt-8 max-w-[36ch] text-[17px] font-medium leading-relaxed text-white/70"
            style={{ opacity: conclusionOpacity, textShadow: TEXT_SHADOW }}
          >
            Tu ne devines plus : tu sais avant d’accepter.<br />
            Ajnaya est là — demande-lui pour ta prochaine course.
          </motion.p>
        </div>

        {/* REFUSE — bandeau, entre par la gauche, au-dessus du film */}
        <motion.div
          className="absolute left-[42%] top-[18%] z-30 w-[min(30vw,400px)]"
          style={{ x: refuseX, opacity: refuseOpacity }}
        >
          <video
            ref={setRefuseRef}
            className="w-full rounded-2xl border border-white/[0.10] shadow-2xl"
            src={`${V}/coach-refuse.play.mp4`}
            poster={`${V}/coach-refuse.poster.jpg`}
            muted playsInline preload="none" disableRemotePlayback
            role="img" aria-label="Notification FOREAS : course pas rentable, refusée"
          />
        </motion.div>

        {/* ACCEPTE — le téléphone, piloté par la HAUTEUR (jamais de collision avec le CTA) */}
        <motion.div
          className="absolute inset-y-0 right-[6%] z-30 flex items-center"
          style={{ x: accepteX, opacity: accepteOpacity }}
        >
          <PhoneFrame widthClassName="h-[min(66vh,560px)] w-auto">
            <video
              ref={setAccepteRef}
              className="h-full w-full object-cover"
              src={`${V}/coach-accepte.play.mp4`}
              poster={`${V}/coach-accepte.poster.jpg`}
              muted playsInline preload="none" disableRemotePlayback
              role="img" aria-label="Notification FOREAS : course rentable à 13,90 €, acceptée"
            />
          </PhoneFrame>
        </motion.div>
      </div>
    </section>
  )
}

/* ═══ Repli sans scroll-story (reduced-motion) — tout reste compréhensible ══════════════════ */
function StaticVerdict() {
  const seenRef = useSectionSeen<HTMLElement>('verdict_instant', 0)
  return (
    <section
      ref={seenRef}
      className="mx-auto w-full max-w-2xl bg-foreas-obsidian px-5 py-14"
      style={{ paddingBottom: 'calc(var(--cta-clearance) + 24px)' }}
    >
      <p className="t-eyebrow mb-5 font-sans text-accent-cyan">Verdict instant</p>
      {T.beats.map((b, i) => (
        <div key={i} className="mb-10">
          <h2 className="mb-4 font-sans text-[30px] font-extrabold leading-[1.05] text-[#F8FAFC]" style={{ letterSpacing: '-.02em' }}>
            <span className="block">{b.lead}</span>
            <span className="block text-accent-cyan">{b.punch} <span aria-hidden="true">{b.emoji}</span></span>
          </h2>
          {i === 1 && (
            <img src={`${V}/coach-refuse.poster.jpg`} alt="Notification FOREAS : course pas rentable, refusée" className="w-full max-w-[340px] rounded-2xl border border-white/[0.10]" />
          )}
          {i === 2 && (
            <PhoneFrame widthClassName="w-[260px]">
              <img src={`${V}/coach-accepte.poster.jpg`} alt="Notification FOREAS : course rentable à 13,90 €, acceptée" className="h-full w-full object-cover" />
            </PhoneFrame>
          )}
        </div>
      ))}
      <p className="max-w-[36ch] text-[15px] font-medium leading-relaxed text-white/70">
        Tu ne devines plus : tu sais avant d’accepter.<br />
        Ajnaya est là — demande-lui pour ta prochaine course.
      </p>
    </section>
  )
}

/* ─── Repli avant montage — réserve la hauteur pour Lenis, mais reste du contenu réel : un
   div aria-hidden vide y était avant, servi pendant toute la fenêtre d'hydratation, jamais
   visible aux lecteurs d'écran ni aux moteurs qui n'exécutent pas le JS. ─── */
function VerdictPlaceholder() {
  return (
    <div className="relative min-h-[400svh] bg-foreas-obsidian">
      <div className="sticky top-0 flex h-[100dvh] flex-col justify-center overflow-clip px-5" style={{ paddingBottom: 'calc(var(--cta-clearance) + 8px)' }}>
        <img
          src={`${V}/hesitation.poster.jpg`}
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-40"
          style={{ filter: VINTAGE }}
        />
        <div className="relative z-10">
          <p className="t-eyebrow mb-4 font-sans text-accent-cyan">Verdict instant</p>
          <h2 className="font-sans text-[clamp(28px,7.6vw,38px)] font-extrabold leading-[1.0] text-[#F8FAFC]" style={{ letterSpacing: '-.02em', textShadow: TEXT_SHADOW }}>
            <span className="block">{T.beats[0].lead}</span>
            <span className="block text-accent-cyan">{T.beats[0].punch} <span aria-hidden="true">{T.beats[0].emoji}</span></span>
          </h2>
        </div>
      </div>
    </div>
  )
}

export default function VerdictSequence({ isMobile }: { isMobile: boolean }) {
  const reduced = useReducedMotion()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  // Le placeholder réserve la VRAIE hauteur (400svh) dès le serveur : sinon la page grandit
  // ×4 à l'hydratation et Lenis recalcule sa limite (saut de scroll au rechargement).
  if (!mounted) return <VerdictPlaceholder />
  if (reduced) return <StaticVerdict />
  return isMobile ? <MobileVerdict /> : <DesktopVerdict />
}

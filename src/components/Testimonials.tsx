'use client'

import { motion } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import { useIsMobile } from '@/hooks/useDevicePerf'
import dynamic from 'next/dynamic'

// Lazy load Mux Player — heavy component, only load when needed
const MuxPlayer = dynamic(() => import('@mux/mux-player-react'), { ssr: false })

/* ─── Testimonial data ─────────────────────────────────────────
 * playbackId: Mux public playback ID
 * Pour ajouter une vidéo: upload sur Mux → copier le Playback ID → ajouter ici
 * Thumbnail auto-générée par Mux via: image.mux.com/{playbackId}/thumbnail.webp
 * ─────────────────────────────────────────────────────────────── */
interface Testimonial {
  id: number
  name: string
  city: string
  since: string
  stat: { value: string; label: string }
  quote: string
  playbackId: string
  accentColor: string
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    name: 'Kitenge',
    city: 'Paris',
    since: 'Chauffeur VTC',
    stat: { value: '+35%', label: 'de CA' },
    quote: "FOREAS a transformé ma vision du métier. Je sais où aller, quand y aller.",
    playbackId: 'vX1Hg6jKGiFpSJvQW900FrKMrDIfhxHQgxCGYAD3wjEY',
    accentColor: '#00d4ff',
  },
  {
    id: 2,
    name: 'Haitham',
    city: 'Île-de-France',
    since: 'Chauffeur VTC',
    stat: { value: '-40%', label: 'temps mort' },
    quote: "Moins de temps à attendre, plus de temps à rouler. C'est concret.",
    playbackId: '8nSxSV4hNxSuC8muZ02djVGZVFh3SgeybyCnfbAJ801r00',
    accentColor: '#a855f7',
  },
  {
    id: 3,
    name: 'Nikolic',
    city: 'Paris',
    since: 'Chauffeur VTC',
    stat: { value: '+28%', label: 'courses/jour' },
    quote: "FOREAS c'est du sérieux. On sent que c'est pensé par des gens qui comprennent le terrain.",
    playbackId: '6PbitAE7sjbgTlMsdjI7EYJ01OsX9GnBbQNvj1TFhsow',
    accentColor: '#22c55e',
  },
  {
    id: 4,
    name: 'Hadietou',
    city: 'Paris',
    since: 'Chauffeur VTC',
    stat: { value: '+22%', label: 'revenus nets' },
    quote: "Je recommande FOREAS à tous les chauffeurs qui veulent travailler intelligemment.",
    playbackId: 'tjnuX01n9h01GfOA501C02a9lIVVbGnib02Z017POgodDpfj4',
    accentColor: '#f59e0b',
  },
  {
    id: 5,
    name: 'Dragan',
    city: 'Île-de-France',
    since: 'Chauffeur VTC',
    stat: { value: '-35%', label: 'km à vide' },
    quote: "Avant je tournais en rond. Maintenant chaque kilomètre compte.",
    playbackId: 'SeKV8Lpn7H2XhfYF1oKO54zP008A3Dv4qPuCKizybyA4',
    accentColor: '#ef4444',
  },
  {
    id: 6,
    name: 'Binate',
    city: 'Paris',
    since: 'Chauffeur VTC',
    stat: { value: '+35%', label: 'de CA' },
    quote: "FOREAS a changé ma manière de travailler. Je sais exactement où aller.",
    playbackId: 'i9Bm4N9eyzCeQN1Ku7wutBb9yj7nUtr1pSrGJYQBfKI',
    accentColor: '#06b6d4',
  },
]

/* ─── Premium Play Button Overlay ──────────────────────────────────── */
function PremiumPlayButton({ isVisible }: { isVisible: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0.8 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none group"
    >
      <motion.div
        animate={{ scale: isVisible ? [1, 1.1, 1] : 1 }}
        transition={{ duration: 2, repeat: Infinity, repeatType: 'loop' }}
        className="w-20 h-20 rounded-full bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-md border border-white/30 flex items-center justify-center group-hover:from-white/30 group-hover:to-white/10 transition-all duration-300"
      >
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="ml-1">
          <path d="M6 4.5L26 16L6 27.5V4.5Z" fill="white" />
        </svg>
      </motion.div>
    </motion.div>
  )
}

/* ─── Stat Badge — Floating over video ─────────────────── */
function StatBadge({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl backdrop-blur-md border"
      style={{
        background: `${color}12`,
        border: `1.5px solid ${color}40`,
      }}
    >
      <motion.svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </motion.svg>
      <span className="text-sm font-bold tracking-tight" style={{ color }}>
        {value}
      </span>
      <span className="text-xs font-medium" style={{ color: `${color}cc` }}>
        {label}
      </span>
    </motion.div>
  )
}

/* ─── Premium Cinematic Video Card ───────────────────────────────────────────── */
function CinematicVideoCard({ testimonial, onVideoPlay }: { testimonial: Testimonial; onVideoPlay?: () => void }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const muxPlayerRef = useRef<any>(null)
  const isMobile = useIsMobile()

  const handlePlayPause = () => {
    if (muxPlayerRef.current) {
      if (isPlaying) {
        muxPlayerRef.current.pause()
      } else {
        muxPlayerRef.current.play()
        onVideoPlay?.() // Stop carousel autoplay when video starts
      }
      setIsPlaying(!isPlaying)
    }
  }

  return (
    <div className="w-full">
      {/* Desktop: Cinematic layout with video left, info right */}
      {!isMobile && (
        <div className="flex gap-10 items-start max-w-5xl mx-auto">
          {/* Video Card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex-1 min-w-0"
          >
            {/* Glow background */}
            <div className="absolute -inset-8 bg-gradient-to-br from-accent-cyan/10 via-accent-purple/5 to-transparent rounded-3xl blur-3xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Video container with glassmorphism border */}
            <div
              className="relative w-full rounded-3xl overflow-hidden shadow-2xl group"
              style={{
                aspectRatio: '16/9',
                background: '#0a0a14',
                border: `1.5px solid rgba(0, 212, 255, 0.15)`,
                boxShadow: '0 0 60px rgba(0, 212, 255, 0.05), inset 0 0 30px rgba(255, 255, 255, 0.05)',
              }}
            >
              {/* Mux Player with custom styling */}
              <MuxPlayer
                ref={muxPlayerRef}
                playbackId={testimonial.playbackId}
                streamType="on-demand"
                thumbnailTime={2}
                primaryColor="#ffffff"
                secondaryColor="#000000"
                accentColor={testimonial.accentColor}
                preload="metadata"
                paused={!isPlaying}
                onPlay={() => { setIsPlaying(true); onVideoPlay?.() }}
                onPause={() => setIsPlaying(false)}
                style={{
                  width: '100%',
                  height: '100%',
                  aspectRatio: '16/9',
                  '--controls': 'none',
                } as any}
              />

              {/* Custom play button overlay */}
              <PremiumPlayButton isVisible={!isPlaying} />

              {/* Click handler */}
              <div
                className="absolute inset-0 z-10 cursor-pointer"
                onClick={handlePlayPause}
              />

              {/* Gradient overlay (top) - for premium feel */}
              <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/40 to-transparent z-[5] pointer-events-none" />

              {/* Stat Badge - floating top right */}
              <div className="absolute top-6 right-6 z-20">
                <StatBadge
                  value={testimonial.stat.value}
                  label={testimonial.stat.label}
                  color={testimonial.accentColor}
                />
              </div>
            </div>
          </motion.div>

          {/* Info Section - Right side */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="flex-1 flex flex-col justify-start pt-8"
          >
            {/* Driver Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg text-white"
                  style={{
                    background: `linear-gradient(135deg, ${testimonial.accentColor}, ${testimonial.accentColor}99)`,
                  }}
                >
                  {testimonial.name[0]}
                </div>
                <div>
                  <h3 className="text-white text-xl font-bold">{testimonial.name}</h3>
                  <p className="text-white/50 text-sm">{testimonial.city}</p>
                </div>
              </div>
              <p className="text-white/40 text-sm mt-4">{testimonial.since}</p>
            </div>

            {/* Quote */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                className="opacity-20 mb-4"
                style={{ color: testimonial.accentColor }}
              >
                <path
                  d="M7.5 10.5c-2 0-3 1.5-3 4s1 6 3 8m10-12c-2 0-3 1.5-3 4s1 6 3 8"
                  stroke={testimonial.accentColor}
                  strokeWidth="1.5"
                  fill="none"
                />
              </svg>
              <p className="text-white text-lg font-light leading-relaxed italic">
                {testimonial.quote}
              </p>
            </motion.div>
          </motion.div>
        </div>
      )}

      {/* Mobile: Stacked layout */}
      {isMobile && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="w-full px-4 space-y-6"
        >
          {/* Video container */}
          <div
            className="relative w-full rounded-2xl overflow-hidden shadow-xl"
            style={{
              aspectRatio: '16/9',
              background: '#0a0a14',
              border: `1px solid rgba(0, 212, 255, 0.15)`,
              boxShadow: '0 0 40px rgba(0, 212, 255, 0.03)',
            }}
          >
            {/* Mux Player */}
            <MuxPlayer
              ref={muxPlayerRef}
              playbackId={testimonial.playbackId}
              streamType="on-demand"
              thumbnailTime={2}
              primaryColor="#ffffff"
              secondaryColor="#000000"
              accentColor={testimonial.accentColor}
              preload="metadata"
              paused={!isPlaying}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              style={{
                width: '100%',
                height: '100%',
                aspectRatio: '16/9',
                '--controls': 'none',
              } as any}
            />

            {/* Custom play button overlay */}
            <PremiumPlayButton isVisible={!isPlaying} />

            {/* Click handler */}
            <div
              className="absolute inset-0 z-10 cursor-pointer"
              onClick={handlePlayPause}
            />

            {/* Stat Badge - floating */}
            <div className="absolute bottom-4 left-4 z-20">
              <StatBadge
                value={testimonial.stat.value}
                label={testimonial.stat.label}
                color={testimonial.accentColor}
              />
            </div>
          </div>

          {/* Info Section */}
          <div className="space-y-4">
            {/* Driver Header */}
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg text-white flex-shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${testimonial.accentColor}, ${testimonial.accentColor}99)`,
                }}
              >
                {testimonial.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white text-lg font-bold">{testimonial.name}</h3>
                <div className="flex items-center gap-2 text-white/50 text-sm">
                  <span>{testimonial.city}</span>
                  <span>•</span>
                  <span>{testimonial.since}</span>
                </div>
              </div>
            </div>

            {/* Quote */}
            <p className="text-white/70 text-sm leading-relaxed italic">
              "{testimonial.quote}"
            </p>
          </div>
        </motion.div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
 *  MAIN SECTION
 * ═══════════════════════════════════════════════════════════════ */
/* ─── Navigation Arrow ─────────────────────────────────────── */
function NavArrow({ direction, onClick, disabled }: { direction: 'left' | 'right'; onClick: () => void; disabled: boolean }) {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.1 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      onClick={onClick}
      disabled={disabled}
      className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all duration-300 ${
        disabled
          ? 'border-white/5 bg-white/[0.02] cursor-not-allowed'
          : 'border-white/15 bg-white/[0.05] hover:bg-white/10 hover:border-accent-cyan/30 cursor-pointer'
      }`}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        className={`transition-colors ${disabled ? 'text-white/10' : 'text-white/60'}`}
      >
        {direction === 'left' ? (
          <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
    </motion.button>
  )
}

export default function Testimonials() {
  const isMobile = useIsMobile()
  const [activeIndex, setActiveIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const goTo = (idx: number) => {
    setActiveIndex(idx)
    setIsAutoPlaying(false) // Pause autoplay on manual nav
  }

  const goNext = () => {
    setActiveIndex((prev) => (prev + 1) % TESTIMONIALS.length)
  }

  const goPrev = () => {
    setActiveIndex((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)
  }

  // Autoplay every 8s — stops permanently once user interacts (click, play video)
  useEffect(() => {
    if (!isAutoPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(goNext, 8000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isAutoPlaying])

  return (
    <section className="relative py-20 md:py-32 bg-foreas-deepblack overflow-hidden">
      {/* Premium background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-accent-cyan/[0.05] rounded-full blur-[100px]"
        />
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.2 }}
          className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent-purple/[0.04] rounded-full blur-[100px]"
        />
      </div>

      <div className="relative z-10">
        {/* ═══ HEADER ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center px-6 mb-16 md:mb-20"
        >
          {/* Social proof chip */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 border border-accent-cyan/20 rounded-full mb-6 backdrop-blur-sm"
          >
            <div className="flex -space-x-2">
              {['K', 'H', 'B'].map((letter, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="w-6 h-6 rounded-full border-2 border-foreas-deepblack flex items-center justify-center text-[10px] text-white font-bold relative"
                  style={{
                    background:
                      i === 0
                        ? 'linear-gradient(135deg, #00d4ff, #0066ff)'
                        : i === 1
                          ? 'linear-gradient(135deg, #a855f7, #6b21a8)'
                          : 'linear-gradient(135deg, #22c55e, #15803d)',
                    zIndex: 3 - i,
                  }}
                >
                  {letter}
                </motion.div>
              ))}
            </div>
            <span className="text-white/60 text-xs font-medium tracking-wide">
              6 témoignages terrain
            </span>
          </motion.div>

          <h2 className="font-title text-3xl md:text-6xl text-white mb-3 leading-tight">
            Ils témoignent.{' '}
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-accent-cyan"
            >
              En toute transparence.
            </motion.span>
          </h2>
          <p className="text-white/50 text-base md:text-lg max-w-2xl mx-auto">
            Des chauffeurs VTC parlent de FOREAS, de leur expérience et du sérieux
            de notre démarche. Sans filtre, sans script.
          </p>
        </motion.div>

        {/* ═══ CAROUSEL ═══ */}
        <div className="px-4 md:px-6 mb-12 md:mb-16">
          <div className="relative max-w-5xl mx-auto">
            {/* Active testimonial with AnimatePresence */}
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <CinematicVideoCard testimonial={TESTIMONIALS[activeIndex]} onVideoPlay={() => setIsAutoPlaying(false)} />
            </motion.div>

            {/* Desktop navigation arrows */}
            {!isMobile && (
              <>
                <div className="absolute top-1/2 -left-16 -translate-y-1/2">
                  <NavArrow direction="left" onClick={() => { goPrev(); setIsAutoPlaying(false) }} disabled={false} />
                </div>
                <div className="absolute top-1/2 -right-16 -translate-y-1/2">
                  <NavArrow direction="right" onClick={() => { goNext(); setIsAutoPlaying(false) }} disabled={false} />
                </div>
              </>
            )}
          </div>

          {/* Navigation: dots + counter + mobile arrows */}
          <div className="flex items-center justify-center gap-6 mt-10">
            {/* Mobile prev */}
            {isMobile && (
              <NavArrow direction="left" onClick={() => { goPrev(); setIsAutoPlaying(false) }} disabled={false} />
            )}

            <div className="flex items-center gap-4">
              {/* Dots */}
              <div className="flex gap-2">
                {TESTIMONIALS.map((t, i) => (
                  <motion.button
                    key={t.id}
                    onClick={() => goTo(i)}
                    animate={{
                      width: i === activeIndex ? 28 : 8,
                      backgroundColor: i === activeIndex ? t.accentColor : 'rgba(255,255,255,0.15)',
                    }}
                    transition={{ duration: 0.3 }}
                    className="h-2 rounded-full cursor-pointer"
                  />
                ))}
              </div>

              {/* Counter */}
              <span className="text-white/30 text-sm font-mono tabular-nums">
                {activeIndex + 1}/{TESTIMONIALS.length}
              </span>
            </div>

            {/* Mobile next */}
            {isMobile && (
              <NavArrow direction="right" onClick={() => { goNext(); setIsAutoPlaying(false) }} disabled={false} />
            )}
          </div>
        </div>

        {/* ═══ TRUST BAR ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="flex justify-center gap-8 md:gap-12 px-6 flex-wrap max-w-3xl mx-auto"
        >
          {[
            { icon: '🎬', text: 'Tournés sur le terrain' },
            { icon: '🤝', text: 'Témoignages authentiques' },
            { icon: '🔒', text: 'Données protégées' },
          ].map((badge, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex items-center gap-2 text-white/40 text-sm"
            >
              <span className="text-lg">{badge.icon}</span>
              <span className="font-medium">{badge.text}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Disclaimer */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-center text-white/20 text-xs mt-10 px-6 max-w-2xl mx-auto leading-relaxed"
        >
          Témoignages recueillis auprès de chauffeurs VTC utilisant FOREAS.
          Les résultats varient selon la zone, les horaires et l&apos;usage de l&apos;application.
        </motion.p>
      </div>
    </section>
  )
}

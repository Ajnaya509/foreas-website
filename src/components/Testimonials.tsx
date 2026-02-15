'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef, useState, useEffect, useCallback } from 'react'
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
    name: 'Binate',
    city: 'Paris',
    since: 'Chauffeur VTC',
    stat: { value: '+35%', label: 'de CA' },
    quote: "FOREAS a changé ma manière de travailler. Je sais exactement où aller.",
    playbackId: '6nQGxaDK00IFLHD39mhm0042qxb00RO8D4FKuL01cqv00Zo8',
    accentColor: '#00d4ff',
  },
  // Ajouter les 5 autres vidéos ici quand elles seront uploadées sur Mux:
  // {
  //   id: 2,
  //   name: 'Prénom',
  //   city: 'Ville',
  //   since: 'Chauffeur VTC',
  //   stat: { value: '+XX%', label: 'description' },
  //   quote: "Citation courte...",
  //   playbackId: 'MUX_PLAYBACK_ID_ICI',
  //   accentColor: '#a855f7',
  // },
]

/* ─── Play button overlay ──────────────────────────────────── */
function PlayButton() {
  return (
    <div className="w-14 h-14 rounded-full bg-black/60 backdrop-blur-sm border-2 border-white/20 flex items-center justify-center transition-transform duration-200 hover:scale-110 hover:bg-accent-cyan/30">
      <svg width="20" height="24" viewBox="0 0 20 24" fill="none">
        <path d="M2 1.5L18.5 12L2 22.5V1.5Z" fill="white" />
      </svg>
    </div>
  )
}

/* ─── Stat badge — visible BEFORE watching ─────────────────── */
function StatBadge({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
      style={{ background: `${color}15`, border: `1px solid ${color}30` }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
        <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
      <span className="text-sm font-semibold" style={{ color }}>{value}</span>
      <span className="text-xs" style={{ color: `${color}99` }}>{label}</span>
    </div>
  )
}

/* ─── Video Card ───────────────────────────────────────────── */
function VideoCard({ testimonial, isActive, isMobile }: { testimonial: Testimonial; isActive: boolean; isMobile: boolean }) {
  const cardWidth = isMobile ? 240 : 280

  return (
    <div
      className="flex-shrink-0 transition-all duration-400"
      style={{
        width: cardWidth,
        scrollSnapAlign: 'center',
        opacity: isActive ? 1 : 0.5,
        transform: isActive ? 'scale(1)' : 'scale(0.92)',
      }}
    >
      {/* Video — Mux Player with built-in poster/thumbnail */}
      <div
        className="relative w-full rounded-2xl overflow-hidden"
        style={{
          aspectRatio: '9/14',
          border: isActive ? `1px solid ${testimonial.accentColor}30` : '1px solid rgba(255,255,255,0.06)',
          background: '#0a0a14',
        }}
      >
        {/* Mux Player — paused by default, shows poster frame automatically */}
        <MuxPlayer
          playbackId={testimonial.playbackId}
          streamType="on-demand"
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            inset: 0,
          } as any}
          thumbnailTime={2}
          primaryColor="#ffffff"
          secondaryColor="#000000"
          accentColor={testimonial.accentColor}
          preload="metadata"
        />

        {/* Stat badge overlay — always visible */}
        <div className="absolute bottom-4 left-3 right-3 z-10 pointer-events-none">
          <StatBadge value={testimonial.stat.value} label={testimonial.stat.label} color={testimonial.accentColor} />
        </div>

        {/* Bottom gradient for badge readability */}
        <div className="absolute bottom-0 left-0 right-0 h-[40%] bg-gradient-to-t from-black/80 to-transparent z-[5] pointer-events-none" />
      </div>

      {/* Driver info + quote */}
      <div className="pt-3 px-1">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-white text-[15px] font-semibold">{testimonial.name}</span>
          <span className="text-white/30 text-[13px]">•</span>
          <span className="text-white/40 text-[13px]">{testimonial.city}</span>
        </div>
        <p className="text-white/50 text-[13px] leading-relaxed">
          « {testimonial.quote} »
        </p>
        <p className="text-white/25 text-[11px] mt-1.5">{testimonial.since}</p>
      </div>
    </div>
  )
}

/* ─── Dot indicators ───────────────────────────────────────── */
function DotIndicator({ count, active }: { count: number; active: number }) {
  return (
    <div className="flex gap-2 justify-center mt-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-1.5 rounded-full transition-all duration-300"
          style={{
            width: i === active ? 24 : 6,
            background: i === active ? '#00d4ff' : 'rgba(255,255,255,0.15)',
          }}
        />
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
 *  MAIN SECTION
 * ═══════════════════════════════════════════════════════════════ */
export default function Testimonials() {
  const isMobile = useIsMobile()
  const [activeIndex, setActiveIndex] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  const cardWidth = isMobile ? 240 : 280
  const gap = 20

  // Handle scroll to detect active card
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const handleScroll = () => {
      const center = el.scrollLeft + el.clientWidth / 2
      const idx = Math.round((center - el.clientWidth / 2) / (cardWidth + gap))
      setActiveIndex(Math.max(0, Math.min(idx, TESTIMONIALS.length - 1)))
    }
    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  }, [cardWidth])

  // Center first card on mount (for multi-card carousels)
  useEffect(() => {
    const el = scrollRef.current
    if (!el || TESTIMONIALS.length < 2) return
    // Small delay to let layout settle
    const t = setTimeout(() => {
      el.scrollLeft = 0
    }, 100)
    return () => clearTimeout(t)
  }, [])

  return (
    <section className="relative py-16 md:py-24 bg-foreas-deepblack overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-accent-purple/[0.03] rounded-full blur-[80px] md:blur-[120px]" />
      </div>

      <div className="relative z-10">
        {/* ═══ HEADER ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center px-6 mb-10 md:mb-14"
        >
          {/* Social proof chip — stacked avatars */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 border border-accent-cyan/15 rounded-full mb-5">
            <div className="flex -space-x-2">
              {['K', 'Y', 'F'].map((letter, i) => (
                <div
                  key={i}
                  className="w-5 h-5 rounded-full border-2 border-foreas-deepblack flex items-center justify-center text-[9px] text-white font-semibold relative"
                  style={{
                    background: i === 0 ? 'linear-gradient(135deg, #00d4ff, #0066ff)' :
                                i === 1 ? 'linear-gradient(135deg, #a855f7, #6b21a8)' :
                                'linear-gradient(135deg, #22c55e, #15803d)',
                    zIndex: 3 - i,
                  }}
                >
                  {letter}
                </div>
              ))}
            </div>
            <span className="text-white/50 text-xs tracking-wide">847+ chauffeurs actifs</span>
          </div>

          <h2 className="font-title text-2xl md:text-5xl text-white mb-2">
            Ils gagnent plus.{' '}
            <span className="text-accent-cyan">Ils en parlent.</span>
          </h2>
          <p className="text-white/35 text-sm md:text-lg">
            Résultats réels, tournés sur le terrain.
          </p>
        </motion.div>

        {/* ═══ CAROUSEL ═══ */}
        {TESTIMONIALS.length === 1 ? (
          /* Single video — centered, no carousel */
          <div className="flex justify-center px-6">
            <VideoCard
              testimonial={TESTIMONIALS[0]}
              isActive={true}
              isMobile={isMobile}
            />
          </div>
        ) : (
          /* Multi-video carousel */
          <>
            <div
              ref={scrollRef}
              className="flex overflow-x-auto scrollbar-hide"
              style={{
                gap,
                scrollSnapType: 'x mandatory',
                padding: `0 calc(50% - ${cardWidth / 2}px)`,
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
              }}
            >
              {TESTIMONIALS.map((t, i) => (
                <VideoCard
                  key={t.id}
                  testimonial={t}
                  isActive={i === activeIndex}
                  isMobile={isMobile}
                />
              ))}
            </div>
            <DotIndicator count={TESTIMONIALS.length} active={activeIndex} />
          </>
        )}

        {/* ═══ TRUST BAR ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex justify-center gap-6 md:gap-8 mt-10 md:mt-14 px-6 flex-wrap"
        >
          {[
            { icon: '🎬', text: 'Tournés par un pro' },
            { icon: '📊', text: 'Résultats vérifiés' },
            { icon: '🔒', text: 'Données protégées' },
          ].map((badge, i) => (
            <div key={i} className="flex items-center gap-1.5 text-white/30 text-xs">
              <span className="text-sm">{badge.icon}</span>
              <span>{badge.text}</span>
            </div>
          ))}
        </motion.div>

        {/* Disclaimer */}
        <p className="text-center text-white/15 text-[10px] mt-6 px-6">
          Résultats individuels. Les performances varient selon la zone, les horaires et l&apos;usage de l&apos;application.
        </p>
      </div>
    </section>
  )
}

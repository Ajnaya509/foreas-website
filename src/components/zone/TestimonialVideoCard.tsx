'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import { Play, Pause } from 'lucide-react'
import type { Testimonial } from './testimonials.data'

/**
 * MuxPlayer — chargement dynamique côté client uniquement (Web Component).
 * Évite les warnings SSR + lazy-load la vidéo seulement quand visible.
 */
const MuxPlayer = dynamic(
  () => import('@mux/mux-player-react').then((m) => m.default),
  {
    ssr: false,
    loading: () => (
      <div className="w-full aspect-video bg-white/[0.04] rounded-xl flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-violet-400/40 border-t-violet-400 animate-spin" />
      </div>
    ),
  }
)

interface TestimonialVideoCardProps {
  testimonial: Testimonial
  /** Index pour stagger animation sur mount (0, 1, 2...) */
  index?: number
  /** Affiche le quote au-dessus de la vidéo (sinon vidéo seule) */
  showQuote?: boolean
}

/**
 * TestimonialVideoCard — affiche un témoignage vidéo Mux avec quote + métadonnées.
 *
 * Design system FOREAS :
 * - Glass card rgba(0.04) + border 0.06 (§4)
 * - Hover → border violet 0.30 + glow subtle
 * - Avatar gradient violet→cyan (signature)
 * - Quote en italique, gain badge tabular-nums
 * - MuxPlayer accent violet #8C52FF + primary ivoire #F8FAFC
 * - Click-to-play (pas d'autoplay forcé pour économiser la bande passante)
 *
 * Tracking : émet `TestimonialVideoPlayed` Meta CAPI quand le user clique play.
 */
export default function TestimonialVideoCard({
  testimonial: t,
  index = 0,
  showQuote = true,
}: TestimonialVideoCardProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  const playerRef = useRef<unknown>(null)

  const posterUrl = `https://image.mux.com/${t.playbackId}/thumbnail.jpg?time=${t.posterTimeSec}&width=640&fit_mode=smartcrop`

  const handlePlay = () => {
    setHasInteracted(true)
    setIsPlaying(true)
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('trackCustom', 'TestimonialVideoPlayed', {
        name: t.name,
        playback_id: t.playbackId,
      })
    }
  }

  const handlePause = () => {
    setIsPlaying(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="rounded-2xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-sm hover:border-violet-500/30 transition-all overflow-hidden flex flex-col"
    >
      {/* ── Header : avatar + nom + gain badge ─────────────────────────── */}
      <div className="px-5 pt-5 pb-3 flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
          style={{ boxShadow: '0 4px 14px rgba(140,82,255,0.30)' }}
        >
          {getInitials(t.name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[#F8FAFC] text-sm truncate">{t.name}</p>
          <p className="text-white/55 text-[11px] truncate">{t.context}</p>
        </div>
        <span className="bg-green-500/15 text-green-400 text-[11px] px-2 py-0.5 rounded-full font-bold tabular-nums whitespace-nowrap">
          {t.gainBadge}
        </span>
      </div>

      {/* ── Vidéo Mux Player ───────────────────────────────────────────── */}
      <div className="relative aspect-video bg-black mx-3 rounded-xl overflow-hidden">
        {!hasInteracted ? (
          // Affiche le poster + bouton play AVANT 1ʳᵉ interaction
          // → évite de charger un player JS inutile pour des cards non-cliquées
          <button
            onClick={handlePlay}
            className="group absolute inset-0 flex items-center justify-center w-full h-full"
            aria-label={`Lire le témoignage de ${t.name}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={posterUrl}
              alt={`${t.name} — ${t.context}`}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div
              className="relative w-14 h-14 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center transition-transform group-hover:scale-110 group-active:scale-95"
              style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.40), 0 0 24px rgba(140,82,255,0.30)' }}
            >
              <Play className="w-5 h-5 text-black fill-black ml-0.5" />
            </div>
          </button>
        ) : (
          <MuxPlayer
            ref={playerRef as never}
            playbackId={t.playbackId}
            poster={posterUrl}
            streamType="on-demand"
            autoPlay
            metadata={{
              video_id: t.playbackId,
              video_title: `${t.name} — Témoignage FOREAS`,
              viewer_user_id: getCachedVisitorIdSafe(),
            }}
            accentColor="#8C52FF"
            primaryColor="#F8FAFC"
            secondaryColor="#000000"
            onPlay={() => setIsPlaying(true)}
            onPause={handlePause}
            style={
              {
                aspectRatio: '16 / 9',
                width: '100%',
                height: '100%',
                '--media-object-fit': 'cover',
              } as Record<string, string>
            }
          />
        )}
      </div>

      {/* ── Quote ──────────────────────────────────────────────────────── */}
      {showQuote && (
        <div className="px-5 pt-3 pb-5 flex-1 flex flex-col">
          <p className="text-white/45 text-[10px] uppercase mb-2" style={{ letterSpacing: '0.18em' }}>
            ⭐⭐⭐⭐⭐ · {t.detail}
          </p>
          <p className="text-white/80 text-[13px] leading-relaxed italic">
            {t.quoteShort}
          </p>
        </div>
      )}
    </motion.div>
  )
}

/** Génère "HB" depuis "Haitham B." */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/** Lit le visitor ID en cache (FingerprintJS) si dispo, sinon undefined. */
function getCachedVisitorIdSafe(): string | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    return localStorage.getItem('foreas_visitor_id') ?? undefined
  } catch {
    return undefined
  }
}

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}

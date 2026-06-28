'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { X, Send, MapPin, TrendingUp, TrendingDown, Volume2, MessageCircle, VolumeX } from 'lucide-react'
import { buildWAUrl } from '@/lib/whatsappLink'
import { recordSearch } from '@/lib/sarcasticVisits'
import { getVisitorId } from '@/lib/zoneFingerprint'
import { expandPoolCode } from '@/lib/expandPoolCode'
import { useOverlayLock } from '@/lib/overlayStore'
import posthog from 'posthog-js'

/**
 * AjnayaConversationModal — Pieuvre Brain + ElevenLabs v3 (Site2026v73)
 *
 * Refonte totale conversion :
 * - Connecté à /api/ajnaya/home-modal → Pieuvre Brain (tentacle widget_site, metadata_source=home_modal_v1)
 * - TTS auto-play après chaque réponse Ajnaya via /api/tts (eleven_v3 Koraly)
 * - Waveform animé Framer Motion pendant lecture audio
 * - Social proof cards avec vrais témoignages (Binate Mux thumbnail + Dragan)
 * - Zone card données réelles get_zone_intelligence v3
 * - Intro directe sans "je suis une IA"
 * - WhatsApp CTA green dès turn 2
 */

// ─── Types ────────────────────────────────────────────────────────────────────

interface ZoneData {
  zone_match: string
  avg_hourly: number
  demand_delta_pct: number
  top_pool: string
  courses_count: number
  week_iso: string
  has_data: boolean
  is_estimate?: boolean
  fallback_zone?: { name: string; avg_hourly: number; note?: string } | null
  landmarks?: Array<{
    name: string
    type: string
    vibe?: string | null
    rank: number
    image_url?: string | null
    image_attribution?: string | null
  }>
}

interface Testimonial {
  name: string
  zone: string
  quote: string
  kpi?: string
  vehicle?: string
  mux_id?: string
}

type MsgType = 'text' | 'zone-card' | 'social-proof'

interface ChatMessage {
  id: string
  role: 'user' | 'ajnaya'
  type: MsgType
  text?: string
  zoneData?: ZoneData
  testimonials?: Testimonial[]
  tts_text?: string
  timestamp: number
  isTyping?: boolean
}

interface AjnayaConversationModalProps {
  isOpen: boolean
  onClose: () => void
  initialZone?: string
}

const QUICK_ZONES = ['Aéroport CDG', 'La Défense', 'Bercy', 'Disneyland']

// ─── Waveform animé ───────────────────────────────────────────────────────────
function AudioWaveform({ active }: { active: boolean }) {
  const heights = [8, 14, 10, 16, 8]
  return (
    <div className="flex items-center gap-[3px]" style={{ height: 20 }}>
      {heights.map((h, i) => (
        <motion.div
          key={i}
          className="rounded-full"
          style={{ width: 3, backgroundColor: active ? '#6C3CE0' : '#d1d1d6' }}
          animate={active ? { height: [h, h * 1.9, h * 0.5, h * 1.6, h] } : { height: 3 }}
          transition={active ? {
            duration: 0.55,
            delay: i * 0.09,
            repeat: Infinity,
            ease: 'easeInOut',
          } : { duration: 0.25 }}
        />
      ))}
    </div>
  )
}

// ─── Typing dots ──────────────────────────────────────────────────────────────
function ThinkingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-0.5">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="rounded-full"
          style={{ width: 7, height: 7, backgroundColor: '#a1a1aa' }}
          animate={{ scale: [1, 1.45, 1], opacity: [0.45, 1, 0.45] }}
          transition={{ duration: 1.1, delay: i * 0.22, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

// ─── Typewriter — le texte d'Ajnaya s'écrit (effet "vivant", pas un bloc figé) ──
// Respecte prefers-reduced-motion (Design System §accessibilité). Anime une seule
// fois au montage (deps stables) → ne redémarre pas quand on toggle l'audio.
function TypewriterText({ text }: { text: string }) {
  const reduce = useReducedMotion()
  const [shown, setShown] = useState(reduce ? text : '')
  useEffect(() => {
    if (reduce || !text) {
      setShown(text)
      return
    }
    setShown('')
    let i = 0
    const id = setInterval(() => {
      i += 2 // 2 caractères / tick = rythme nerveux, lisible
      setShown(text.slice(0, i))
      if (i >= text.length) clearInterval(id)
    }, 18)
    return () => clearInterval(id)
  }, [text, reduce])
  const done = shown.length >= text.length
  return (
    <span className="whitespace-pre-wrap">
      {shown}
      {!reduce && !done && text && (
        <motion.span
          aria-hidden
          className="inline-block w-[2px] h-[0.95em] ml-px rounded-full align-[-0.1em]"
          style={{ backgroundColor: '#6C3CE0' }}
          animate={{ opacity: [1, 0.15, 1] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
    </span>
  )
}

// ─── Zone card ────────────────────────────────────────────────────────────────
function ZoneCard({ data }: { data: ZoneData }) {
  const trend = data.demand_delta_pct
  // Design System §4 sémantique : success/danger/neutre selon seuil ±5%.
  // Anti-pattern fixé : avant on affichait "+0% vert ↗" = mensonge visuel.
  const trendStatus: 'up' | 'down' | 'stable' =
    trend > 5 ? 'up' : trend < -5 ? 'down' : 'stable'
  // CONTRACTS v1.7 — image POI dominant (rank=0 avec image_url) pour bandeau bottom
  const dominantPOI = (data.landmarks || []).find((l) => l.image_url) || null
  // Brief PIEUVRE_ZONE_LANDMARKS v1.1 — Mapbox Static via /api/home/zone-map
  // (proxy server-side qui cache 24h ; URL safe, pas de token client-side)
  const mapUrl = `/api/home/zone-map?zone=${encodeURIComponent(data.zone_match)}&w=320&h=80`
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.93, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', damping: 22, stiffness: 260 }}
      className="rounded-2xl overflow-hidden border w-full"
      style={{ borderColor: 'rgba(0,0,0,0.08)', backgroundColor: '#f5f5f7' }}
    >
      {/* PRIORITÉ B — Map static Mapbox en tête de card. 80px hauteur. Lazy. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={mapUrl}
        alt={`Carte ${data.zone_match}`}
        className="w-full block"
        style={{ height: 80, objectFit: 'cover', backgroundColor: '#e5e5ea' }}
        loading="lazy"
        onError={(e) => {
          // Si Mapbox down ou zone sans centroid → cache l'élément silencieusement
          ;(e.currentTarget as HTMLImageElement).style.display = 'none'
        }}
      />
      <div className="px-4 pt-3.5 pb-3">
        {/* Zone label */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: '#6C3CE0' }} />
          <span
            className="text-[10px] font-bold uppercase tracking-widest truncate"
            // Design System §5 + §17 : eyebrow ls 2.5 = 0.22em (était 0.16em off-spec)
            style={{ color: '#6e6e73', letterSpacing: '0.22em' }}
          >
            {data.zone_match}
          </span>
        </div>

        {/* Big number */}
        <div className="flex items-end gap-2 mb-2.5">
          <span
            className="font-black tabular-nums"
            style={{ fontSize: 38, color: '#1d1d1f', letterSpacing: '-0.04em', lineHeight: 1 }}
          >
            {data.avg_hourly.toFixed(0)}
          </span>
          <span className="text-sm font-semibold mb-1" style={{ color: '#6e6e73' }}>€/h</span>
          {trendStatus === 'stable' ? (
            <div
              className="ml-auto text-xs font-semibold tabular-nums"
              style={{ color: '#86868b' }}
            >
              stable
            </div>
          ) : (
            <div
              className={`ml-auto flex items-center gap-0.5 text-xs font-bold tabular-nums ${
                trendStatus === 'up' ? 'text-emerald-600' : 'text-rose-500'
              }`}
            >
              {trendStatus === 'up'
                ? <TrendingUp className="w-3.5 h-3.5" />
                : <TrendingDown className="w-3.5 h-3.5" />}
              {trendStatus === 'up' ? '+' : ''}{trend}%
            </div>
          )}
        </div>

        {/* Meta row */}
        <div
          className="flex items-center justify-between pt-2.5 border-t"
          style={{ borderColor: 'rgba(0,0,0,0.06)' }}
        >
          <span className="text-[10px] font-medium tabular-nums" style={{ color: '#86868b' }}>
            {data.courses_count} courses · {expandPoolCode(data.top_pool)}
          </span>
          <span
            className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full"
            style={{
              backgroundColor: data.is_estimate ? 'rgba(245,158,11,0.15)' : '#1d1d1f',
              color: data.is_estimate ? '#B45309' : '#fff',
              letterSpacing: '0.12em',
            }}
          >
            {data.is_estimate ? 'ESTIMATION' : 'TEMPS RÉEL'}
          </span>
        </div>
        {/* CONTRACTS v1.7 — Brief PIEUVRE_ZONE_LANDMARKS — affiche max 2 lieux séparés par · */}
        {data.landmarks && data.landmarks.length > 0 && (
          <p className="text-[11px] mt-1.5 truncate" style={{ color: '#86868b' }}>
            {data.landmarks.slice(0, 2).map((l) => l.name).join(' · ')}
          </p>
        )}
      </div>
      {/* PRIORITÉ C (bonus) — bandeau photo POI dominant (rank=0 avec image_url).
          Affiché uniquement si le POI a une vraie image Wikipedia/Commons indexée. */}
      {dominantPOI && dominantPOI.image_url && (
        <div className="relative w-full" style={{ height: 60 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={dominantPOI.image_url}
            alt={dominantPOI.name}
            className="w-full h-full block"
            style={{ objectFit: 'cover' }}
            loading="lazy"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          />
          {/* Overlay nom POI bas-gauche, gradient noir → transparent */}
          <div
            className="absolute inset-0 flex items-end px-3 pb-1.5 pointer-events-none"
            style={{
              background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 60%)',
            }}
          >
            <span
              className="text-[11px] font-semibold text-white truncate drop-shadow-sm"
              style={{ letterSpacing: '0.01em' }}
            >
              {dominantPOI.name}
            </span>
          </div>
        </div>
      )}
    </motion.div>
  )
}

// ─── Social proof card ────────────────────────────────────────────────────────
function SocialProofCard({ testimonials }: { testimonials: Testimonial[] }) {
  const primary = testimonials[0]
  const secondary = testimonials[1]
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 22, stiffness: 240, delay: 0.05 }}
      className="rounded-2xl border w-full overflow-hidden"
      style={{
        borderColor: 'rgba(108,60,224,0.14)',
        backgroundColor: 'rgba(108,60,224,0.04)',
      }}
    >
      <div className="p-3.5">
        {/* Primary testimonial (Binate) */}
        <div className="flex items-start gap-3">
          {primary.mux_id && (
            <div className="relative flex-shrink-0 w-11 h-11 rounded-xl overflow-hidden">
              <img
                src={`https://image.mux.com/${primary.mux_id}/thumbnail.jpg?width=88&height=88&fit_mode=smartcrop`}
                alt={primary.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {/* Play overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                <div className="w-4 h-4 rounded-full bg-white/92 flex items-center justify-center">
                  <div
                    className="ml-px"
                    style={{
                      width: 0,
                      height: 0,
                      borderTop: '4px solid transparent',
                      borderBottom: '4px solid transparent',
                      borderLeft: '6px solid #1d1d1f',
                    }}
                  />
                </div>
              </div>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium leading-snug" style={{ color: '#1d1d1f' }}>
              "{primary.quote}"
            </p>
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              <span className="text-[11px]" style={{ color: '#6e6e73' }}>
                {primary.name} · {primary.zone}
                {primary.vehicle && ` · ${primary.vehicle}`}
              </span>
              {primary.kpi && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: 'rgba(16,185,129,0.12)', color: '#059669' }}
                >
                  {primary.kpi}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Secondary testimonial */}
        {secondary && (
          <div
            className="mt-2.5 pt-2 text-[11px]"
            style={{
              borderTop: '1px solid rgba(0,0,0,0.06)',
              color: '#86868b',
            }}
          >
            <span className="font-medium" style={{ color: '#6e6e73' }}>{secondary.name}</span>
            {' '}· "{secondary.quote}"
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function MessageBubble({
  msg,
  isActiveAudio,
  onToggleAudio,
}: {
  msg: ChatMessage
  isActiveAudio: boolean
  onToggleAudio: () => void
}) {
  // Typing indicator
  if (msg.isTyping) {
    return (
      <div className="flex justify-start">
        <div className="px-3 py-2.5 rounded-2xl rounded-bl-sm" style={{ backgroundColor: '#f5f5f7' }}>
          <ThinkingDots />
        </div>
      </div>
    )
  }

  // Zone card
  if (msg.type === 'zone-card' && msg.zoneData) {
    return (
      <div className="flex justify-start w-full max-w-[296px]">
        <ZoneCard data={msg.zoneData} />
      </div>
    )
  }

  // Social proof
  if (msg.type === 'social-proof' && msg.testimonials) {
    return (
      <div className="flex justify-start w-full max-w-[296px]">
        <SocialProofCard testimonials={msg.testimonials} />
      </div>
    )
  }

  // Regular text bubble
  const isAjnaya = msg.role === 'ajnaya'
  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', damping: 24, stiffness: 320 }}
      className={`flex ${isAjnaya ? 'justify-start' : 'justify-end'}`}
    >
      <div
        className={`max-w-[84%] px-3.5 py-2.5 text-sm leading-relaxed ${
          isAjnaya ? 'rounded-2xl rounded-bl-md' : 'rounded-2xl rounded-br-md'
        }`}
        style={
          isAjnaya
            ? {
                backgroundColor: '#f4f4f6',
                color: '#1d1d1f',
                border: '1px solid rgba(0,0,0,0.04)',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 10px 26px -16px rgba(0,0,0,0.18)',
              }
            : {
                backgroundColor: '#1d1d1f',
                color: '#fff',
                boxShadow: '0 6px 20px -10px rgba(29,29,31,0.55)',
              }
        }
      >
        {isAjnaya
          ? <TypewriterText text={msg.text ?? ''} />
          : <span className="whitespace-pre-wrap">{msg.text}</span>}

        {/* Audio toggle — Ajnaya messages seulement */}
        {isAjnaya && (msg.tts_text || msg.text) && (
          <button
            onClick={onToggleAudio}
            className="flex items-center gap-1.5 mt-2 opacity-50 hover:opacity-90 transition-opacity focus:outline-none"
            aria-label={isActiveAudio ? 'Arrêter la lecture' : 'Écouter Ajnaya'}
          >
            {isActiveAudio ? (
              <>
                <AudioWaveform active />
                <VolumeX className="w-3 h-3" style={{ color: '#6C3CE0' }} />
              </>
            ) : (
              <Volume2 className="w-3 h-3" style={{ color: '#6e6e73' }} />
            )}
          </button>
        )}
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODAL PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

// Chantier A (brief tunnel) — variante CTA mesurable : chaque funnel_event porte ce tag
// (colonne ab_variant) → comparaison conversion avant/après via v_acq_funnel_site.
const AB_VARIANT = 'cta_creneau_v1'

export default function AjnayaConversationModal({
  isOpen,
  onClose,
  initialZone = '',
}: AjnayaConversationModalProps) {
  // Masque le widget flottant "A" tant que cette modale plein écran est ouverte.
  useOverlayLock(isOpen)

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState(initialZone)
  const [turn, setTurn] = useState<1 | 2 | 3>(1)
  const [zoneData, setZoneData] = useState<ZoneData | null>(null)
  const [identityId, setIdentityId] = useState<string | null>(null)
  // Badge visiteur stable (FingerprintJS). AVANT : calculé puis jeté → 922 prospects
  // perdus. MAINTENANT : gardé + envoyé au serveur pour tag funnel + retargeting.
  const [visitorId, setVisitorId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playingMsgId, setPlayingMsgId] = useState<string | null>(null)
  // Dimensions analytics provenant de Pieuvre v1.1 (mises à jour à chaque tour)
  const [clarifyBranchDetected, setClarifyBranchDetected] = useState<boolean>(false)
  const [modalZoneCategory, setModalZoneCategory] =
    useState<'disney' | 'idf' | 'region' | 'unknown'>('unknown')
  const [sessionId] = useState(
    () => `hm-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  )

  const inputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const initialSentRef = useRef(false)

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  // Focus input desktop
  useEffect(() => {
    if (!isOpen) return
    const isDesktop =
      typeof window !== 'undefined' && window.matchMedia('(min-width: 640px)').matches
    if (isDesktop) setTimeout(() => inputRef.current?.focus(), 320)
  }, [isOpen])

  // Site2026v77 nano-detail #10 : pre-warm TTS Koraly au mount du modal.
  // Réveille la lambda Railway / pool de connexions ElevenLabs avec un texte
  // ultra-court (1 char). Au moment où le user reçoit son turn 1, le warm-up
  // est déjà fait → latence audio ~150ms au lieu de ~400ms cold-start.
  // Idempotent : déjà warm = no-op côté serveur.
  useEffect(() => {
    if (!isOpen) return
    const ctrl = new AbortController()
    fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: '.', warmup: true }),
      signal: ctrl.signal,
    }).catch(() => { /* silencieux : pre-warm best-effort */ })

    // nano-detail #11 : prefetch thumbnails Mux des 3 témoignages les plus
    // probables. Dès le turn 2, ils s'affichent depuis le cache (zéro flicker).
    const KNOWN_MUX_IDS = ['i9Bm4N9eyzCeQN1Ku7wutBb9yj7nUtr1pSrGJYQBfKI'] // Binate
    KNOWN_MUX_IDS.forEach((id) => {
      const img = new Image()
      img.src = `https://image.mux.com/${id}/thumbnail.jpg?width=88&height=88&fit_mode=smartcrop`
    })

    return () => ctrl.abort()
  }, [isOpen])

  // Init intro message
  useEffect(() => {
    if (!isOpen || messages.length > 0) return

    setMessages([{
      id: 'm-intro',
      role: 'ajnaya',
      type: 'text',
      text: 'CDG, La Défense, Bercy... balance ta zone — je te dis combien ça paie ce soir.',
      timestamp: Date.now(),
    }])

    getVisitorId()
      .then((r) => {
        setVisitorId(r.visitorId)
        // Relie les events PostHog à notre badge (le répertoire d'identité).
        try { posthog.register({ foreas_visitor_id: r.visitorId }) } catch { /* noop */ }
      })
      .catch(() => {})

    // Si zone pré-remplie (depuis la search bar hero)
    if (initialZone && !initialSentRef.current) {
      initialSentRef.current = true
      setTimeout(() => callModal(initialZone, 1), 700)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialZone])

  // Reset state on close
  useEffect(() => {
    if (!isOpen) {
      const t = setTimeout(() => {
        setMessages([])
        setInputValue('')
        setTurn(1)
        setZoneData(null)
        setIdentityId(null)
        setIsPlaying(false)
        setPlayingMsgId(null)
        setClarifyBranchDetected(false)
        setModalZoneCategory('unknown')
        initialSentRef.current = false
        if (audioRef.current) {
          audioRef.current.pause()
          audioRef.current = null
        }
      }, 400)
      return () => clearTimeout(t)
    }
  }, [isOpen])

  // ─── TTS ──────────────────────────────────────────────────────────────────
  const playTTS = useCallback(async (text: string, msgId: string) => {
    if (!text?.trim()) return
    try {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      setIsPlaying(true)
      setPlayingMsgId(msgId)

      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (!res.ok) throw new Error('TTS error')

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioRef.current = audio

      audio.onended = () => {
        setIsPlaying(false)
        setPlayingMsgId(null)
        URL.revokeObjectURL(url)
      }
      audio.onerror = () => {
        setIsPlaying(false)
        setPlayingMsgId(null)
      }

      await audio.play()
    } catch {
      setIsPlaying(false)
      setPlayingMsgId(null)
    }
  }, [])

  const toggleAudio = useCallback(
    (text: string, msgId: string) => {
      if (isPlaying && playingMsgId === msgId) {
        audioRef.current?.pause()
        setIsPlaying(false)
        setPlayingMsgId(null)
      } else {
        playTTS(text, msgId)
      }
    },
    [isPlaying, playingMsgId, playTTS]
  )

  // ─── Main API call ─────────────────────────────────────────────────────────
  const callModal = useCallback(
    async (message: string, currentTurn: 1 | 2 | 3) => {
      if (!message.trim() || isLoading) return
      setIsLoading(true)

      // Vibration haptic
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try { navigator.vibrate?.(8) } catch { /* silencieux */ }
      }

      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: 'user',
        type: 'text',
        text: message,
        timestamp: Date.now(),
      }
      const typingMsg: ChatMessage = {
        id: `typing-${Date.now()}`,
        role: 'ajnaya',
        type: 'text',
        text: '',
        timestamp: Date.now(),
        isTyping: true,
      }

      setMessages((prev) => [...prev, userMsg, typingMsg])
      recordSearch(message)

      try {
        window.fbq?.('trackCustom', 'AjnayaModalTurn', {
          turn: currentTurn,
          zone: message,
        })
      } catch { /* silencieux */ }
      // Tunnel natif PostHog (funnels + replay rattachés à la personne)
      try { posthog.capture('home_modal_zone_searched', { turn: currentTurn, zone: message }) } catch { /* noop */ }

      try {
        const res = await fetch('/api/ajnaya/home-modal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message,
            session_id: sessionId,
            turn: currentTurn,
            zone_data: zoneData,
            identity_id: identityId,
            visitor_id: visitorId,
            ab_variant: AB_VARIANT,
          }),
        })

        if (!res.ok) throw new Error('API error')
        const data = await res.json() as {
          text: string
          tts_text: string
          zone_data: ZoneData | null
          show_wa_cta: boolean
          turn_next: 1 | 2 | 3
          testimonials: Testimonial[] | null
          identity_id: string | null
          // Pieuvre v1.1 — dimensions analytics + drivers branche clarify
          clarify_branch_detected?: boolean
          modal_zone_category?: 'disney' | 'idf' | 'region' | 'unknown'
        }

        // Persist identity_id pour tracking cross-turn + lien PostHog (= le répertoire)
        if (data.identity_id) {
          setIdentityId(data.identity_id)
          try { posthog.identify(data.identity_id) } catch { /* noop */ }
        }

        // Zone data
        if (data.zone_data) setZoneData(data.zone_data)

        // Dimensions Pieuvre v1.1 (clarify branch + zone bucket pour funnel)
        if (typeof data.clarify_branch_detected === 'boolean') {
          setClarifyBranchDetected(data.clarify_branch_detected)
        }
        if (data.modal_zone_category) {
          setModalZoneCategory(data.modal_zone_category)
        }

        // Build new messages
        const newMsgs: ChatMessage[] = []

        // Zone card (turn 1 seulement, si has_data)
        if (currentTurn === 1 && data.zone_data?.has_data) {
          newMsgs.push({
            id: `zone-${Date.now()}`,
            role: 'ajnaya',
            type: 'zone-card',
            zoneData: data.zone_data,
            timestamp: Date.now(),
          })
        }

        // Ajnaya text bubble
        const ajnayaMsg: ChatMessage = {
          id: `a-${Date.now()}`,
          role: 'ajnaya',
          type: 'text',
          text: data.text,
          tts_text: data.tts_text,
          timestamp: Date.now() + 1,
        }
        newMsgs.push(ajnayaMsg)

        // Replace typing indicator
        setMessages((prev) => {
          const filtered = prev.filter((m) => !m.isTyping)
          return [...filtered, ...newMsgs]
        })

        // Social proof card — injectée avec délai pour effet séquentiel
        const proofTestimonials = data.testimonials
        if (currentTurn >= 2 && proofTestimonials?.length) {
          setTimeout(() => {
            setMessages((prev) => [
              ...prev,
              {
                id: `proof-${Date.now()}`,
                role: 'ajnaya' as const,
                type: 'social-proof' as const,
                testimonials: proofTestimonials,
                timestamp: Date.now(),
              },
            ])
          }, 850)
        }

        // Advance turn
        setTurn(data.turn_next)

        // Auto-play TTS avec délai court (laisse le temps au DOM de renderer)
        if (data.tts_text) {
          setTimeout(() => playTTS(data.tts_text, ajnayaMsg.id), 250)
        }
      } catch {
        setMessages((prev) => {
          const filtered = prev.filter((m) => !m.isTyping)
          return [
            ...filtered,
            {
              id: `err-${Date.now()}`,
              role: 'ajnaya',
              type: 'text',
              text: 'Connexion qui flanche — passe sur WhatsApp, je te réponds en 2 minutes.',
              timestamp: Date.now(),
            },
          ]
        })
      } finally {
        setIsLoading(false)
      }
    },
    [isLoading, sessionId, zoneData, identityId, visitorId, playTTS]
  )

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const value = inputValue.trim()
      if (!value) return
      callModal(value, turn)
      setInputValue('')
    },
    [inputValue, turn, callModal]
  )

  const handleQuickZone = useCallback(
    (zone: string) => {
      callModal(zone, 1)
    },
    [callModal]
  )

  const waUrl = buildWAUrl({
    section: 'hero_zone',
    zone: zoneData?.zone_match ?? inputValue,
    // Raccordement modal ↔ WhatsApp : la Pieuvre retrouve la session web du prospect.
    ref: sessionId,
  })

  const showWACTA = turn >= 2 && !isLoading

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── Backdrop ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-50 backdrop-blur-md"
            style={{ backgroundColor: 'rgba(0,0,0,0.44)' }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* ── Halo pulse arrière (variant pulse §13 — Ajnaya réfléchit) ── */}
          {/* Couche 2 du gâteau Apple : halo violet + cyan diffus qui pulse 0.9s */}
          <div
            aria-hidden
            className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center"
          >
            <div
              className="w-[680px] h-[680px] rounded-full"
              style={{
                background:
                  'radial-gradient(circle at 50% 50%, rgba(140, 82, 255, 0.22) 0%, rgba(0, 212, 255, 0.10) 40%, transparent 70%)',
                filter: 'blur(60px)',
                animation: 'halo-pulse-fast 0.9s ease-in-out infinite alternate',
                willChange: 'opacity',
              }}
            />
          </div>

          {/* ── Modal container ── */}
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none"
            role="presentation"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 24 }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              className="pointer-events-auto w-full sm:w-auto sm:max-w-lg sm:mx-4 max-h-[92vh] sm:max-h-[82vh] flex flex-col rounded-t-3xl sm:rounded-3xl overflow-hidden"
              style={{
                backgroundColor: '#ffffff',
                boxShadow:
                  '0 32px 80px -16px rgba(0,0,0,0.28), 0 0 0 1px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
              }}
              role="dialog"
              aria-modal="true"
              aria-label="Conversation avec Ajnaya"
            >

              {/* ── Header ── */}
              <div
                className="flex items-center justify-between px-5 py-4 flex-shrink-0 border-b"
                style={{ borderColor: 'rgba(0,0,0,0.08)' }}
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="relative">
                    <div
                      className="relative w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center"
                      style={{ boxShadow: '0 4px 12px -2px rgba(140,82,255,0.35)' }}
                    >
                      <span className="text-sm font-bold text-white">A</span>
                      {/* Online dot */}
                      <span
                        className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white"
                        style={{ backgroundColor: '#34C759' }}
                      />
                    </div>
                    {/* Halo pulse */}
                    <span
                      className="absolute inset-0 rounded-full bg-violet-400/20 animate-ping"
                      style={{ animationDuration: '2.6s' }}
                      aria-hidden="true"
                    />
                  </div>

                  {/* Name + status */}
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#1d1d1f' }}>Ajnaya</p>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                      {isPlaying ? (
                        <div className="flex items-center gap-1">
                          <span className="text-[11px]" style={{ color: '#6C3CE0' }}>Parle...</span>
                          <AudioWaveform active />
                        </div>
                      ) : (
                        <p className="text-[11px]" style={{ color: '#86868b' }}>
                          En ligne · répond direct
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Close */}
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-full transition-colors hover:bg-black/[0.06] active:scale-95"
                  aria-label="Fermer"
                  style={{ color: '#6e6e73' }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* ── Messages ── */}
              <div
                className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5 min-h-0"
                style={{
                  WebkitMaskImage: 'linear-gradient(to bottom, transparent 0, black 14px, black 100%)',
                  maskImage: 'linear-gradient(to bottom, transparent 0, black 14px, black 100%)',
                }}
              >
                {messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    msg={msg}
                    isActiveAudio={isPlaying && playingMsgId === msg.id}
                    onToggleAudio={() =>
                      toggleAudio(msg.tts_text ?? msg.text ?? '', msg.id)
                    }
                  />
                ))}

                {/* ── WhatsApp CTA — visible dès turn 2 ── */}
                <AnimatePresence>
                  {showWACTA && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ type: 'spring', damping: 22, stiffness: 260, delay: 0.15 }}
                      className="pt-1"
                    >
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                          // Haptic feedback Design System §10 (vibrate Android/Chrome)
                          if (typeof navigator !== 'undefined') {
                            const v = (navigator as Navigator & { vibrate?: (p: number) => boolean }).vibrate
                            try { v?.call(navigator, 18) } catch { /* ignore */ }
                          }
                          // Funnel event Pieuvre — KPI ULTIME du widget.
                          // sendBeacon résiste au close-tab quand WhatsApp s'ouvre.
                          try {
                            const payload = JSON.stringify({
                              session_id: sessionId,
                              turn,
                              zone: zoneData?.zone_match ?? null,
                              zone_category: modalZoneCategory,
                              clarify_branch: clarifyBranchDetected,
                              has_data: zoneData?.has_data ?? false,
                              // Chantier B — rattache le clic WhatsApp à la personne (suivi + relance DG)
                              identity_id: identityId,
                              visitor_id: visitorId,
                              ab_variant: AB_VARIANT,
                            })
                            if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
                              const blob = new Blob([payload], { type: 'application/json' })
                              navigator.sendBeacon('/api/ajnaya/home-modal/wa-click', blob)
                            } else {
                              fetch('/api/ajnaya/home-modal/wa-click', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: payload,
                                keepalive: true,
                              }).catch(() => {})
                            }
                          } catch { /* silencieux */ }
                          // Meta CAPI client-side
                          window.fbq?.('trackCustom', 'WhatsAppLinkClicked', {
                            section: 'modal_ajnaya',
                            turn,
                            zone: zoneData?.zone_match,
                            zone_category: modalZoneCategory,
                            clarify_branch: clarifyBranchDetected,
                          })
                          // KPI ultime côté PostHog (funnel + replay de qui a cliqué)
                          try {
                            posthog.capture('home_modal_wa_clicked', {
                              turn,
                              zone: zoneData?.zone_match,
                              zone_category: modalZoneCategory,
                            })
                          } catch { /* noop */ }
                        }}
                        className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl text-white font-bold text-[15px] transition-all hover:opacity-92 active:scale-[0.98]"
                        style={{
                          backgroundColor: '#25D366',
                          boxShadow: '0 8px 26px -6px rgba(37,211,102,0.5)',
                        }}
                      >
                        <MessageCircle className="w-[18px] h-[18px]" />
                        Reçois ton créneau qui rapporte
                      </a>
                      {/* §17 brièveté radicale : bénéfice → canal rassurant */}
                      <p
                        className="text-center text-[10px] font-medium mt-1.5 tabular-nums"
                        style={{ color: '#86868b' }}
                      >
                        Sur WhatsApp · Gratuit · 2 min
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div ref={messagesEndRef} />
              </div>

              {/* ── Quick zones (turn 1 only, avant premier message user) ── */}
              {turn === 1 && messages.length <= 2 && !isLoading && (
                <div
                  className="px-4 pb-2.5 flex gap-2 overflow-x-auto flex-shrink-0"
                  style={{ scrollbarWidth: 'none' }}
                >
                  {QUICK_ZONES.map((zone) => (
                    <motion.button
                      key={zone}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleQuickZone(zone)}
                      className="flex-shrink-0 px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors hover:bg-black/10"
                      style={{ backgroundColor: '#f5f5f7', color: '#1d1d1f' }}
                    >
                      {zone}
                    </motion.button>
                  ))}
                </div>
              )}

              {/* ── Input ── */}
              {turn <= 2 && (
                <div
                  className="px-4 pb-4 pt-2.5 flex-shrink-0 border-t"
                  style={{ borderColor: 'rgba(0,0,0,0.06)' }}
                >
                  <form onSubmit={handleSubmit}>
                    {/* Composer pilule — input + envoi dans une seule forme (réf assistant-ui / Gemini) */}
                    <div
                      className="flex items-center gap-2 rounded-2xl pl-4 pr-1.5 py-1.5 border border-transparent transition-all focus-within:border-[#00D4FF]/40 focus-within:ring-4 focus-within:ring-[#00D4FF]/12"
                      style={{ backgroundColor: '#f5f5f7' }}
                    >
                      <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={turn === 1 ? 'Ta zone ?' : 'Une autre zone ?'}
                        inputMode="search"
                        enterKeyHint="send"
                        autoCapitalize="words"
                        className="flex-1 bg-transparent text-[15px] outline-none border-none"
                        style={{ color: '#1d1d1f' }}
                        disabled={isLoading}
                        autoComplete="off"
                      />
                      <motion.button
                        type="submit"
                        disabled={isLoading || !inputValue.trim()}
                        whileTap={{ scale: 0.9 }}
                        className="flex items-center justify-center w-9 h-9 rounded-full flex-shrink-0 transition-colors"
                        style={{
                          backgroundColor: inputValue.trim() ? '#6C3CE0' : '#d1d1d6',
                          color: '#fff',
                          boxShadow: inputValue.trim() ? '0 4px 14px -4px rgba(108,60,224,0.5)' : 'none',
                        }}
                        aria-label="Envoyer"
                      >
                        {isLoading ? (
                          <motion.div
                            className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 0.75, repeat: Infinity, ease: 'linear' }}
                          />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </motion.button>
                    </div>
                  </form>
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

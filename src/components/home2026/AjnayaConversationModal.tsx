'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, MessageCircle, Loader2, MapPin, TrendingUp, Clock } from 'lucide-react'
import { buildWAUrl } from '@/lib/whatsappLink'
import { recordSearch } from '@/lib/sarcasticVisits'
import { getVisitorId } from '@/lib/zoneFingerprint'

interface AjnayaConversationModalProps {
  isOpen: boolean
  onClose: () => void
  initialZone?: string
}

interface ChatMessage {
  id: string
  role: 'user' | 'ajnaya'
  type?: 'text' | 'zone-card'
  text?: string
  zoneStats?: ZoneStats
  timestamp: number
  isTyping?: boolean
}

interface ZoneStats {
  zone_match: string
  avg_hourly: number
  demand_delta_pct: number
  top_pool: string
  courses_count: number
  week_iso: string
  has_data: boolean
  last_updated?: string
  fallback_zone?: { name: string; avg_hourly: number; note?: string } | null
}

const QUICK_ZONES = ['Aéroport CDG', 'La Défense', 'Bercy', 'Lyon Part-Dieu']

/**
 * AjnayaConversationModal — Apple-grade absolu (Site2026v72)
 *
 * Refonte +100/100 :
 * - Backdrop noir Apple #000 / 0.42 (au lieu de brown cream)
 * - Modal blanc pur #fff avec border 1px rgba(0,0,0,0.08)
 * - Bulles user noir Apple, bulles Ajnaya gris Apple #f5f5f7 (iMessage-like)
 * - Zone card : grand chiffre €/h en noir absolu — l'italique fait le travail
 * - Quick zones chips neutres #f5f5f7 — plus de teinte violette criarde
 * - Send button noir Apple solide
 * - Avatar Ajnaya : keep gradient violet→cyan (signature brand) — UN SEUL endroit où le gradient subsiste
 * - Push WhatsApp final : keep green (couleur signature WhatsApp)
 *
 * Skills :
 * - foreas-design-system : variant blanc Apple, bulles iMessage-grade
 * - foreas-copy-atomic : Pre-Suasion, Cialdini réciprocité, Hormozi value stack
 */
export default function AjnayaConversationModal({
  isOpen,
  onClose,
  initialZone = '',
}: AjnayaConversationModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState(initialZone)
  const [isTurn, setIsTurn] = useState<1 | 2 | 3 | 'closed'>(1)
  const [zoneStats, setZoneStats] = useState<ZoneStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const initialZoneSentRef = useRef(false)

  // Init au premier mount : message d'accroche Ajnaya
  useEffect(() => {
    if (!isOpen || messages.length > 0) return
    const intro: ChatMessage = {
      id: 'm-intro',
      role: 'ajnaya',
      type: 'text',
      text:
        "Bonjour 👋 Je suis Ajnaya, l'IA FOREAS.\n\nDites-moi votre zone — je vous donne le tarif horaire moyen ce soir, en temps réel.",
      timestamp: Date.now(),
    }
    setMessages([intro])

    getVisitorId().catch(() => { /* silencieux */ })

    if (initialZone && !initialZoneSentRef.current) {
      initialZoneSentRef.current = true
      setTimeout(() => {
        handleZoneSubmit(initialZone)
      }, 600)
    }
  }, [isOpen, initialZone, messages.length])

  // Auto-scroll en bas à chaque nouveau message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  // Focus input à l'ouverture (desktop seulement, sinon le clavier mobile pop direct)
  useEffect(() => {
    if (!isOpen || isTurn === 'closed') return
    if (typeof window === 'undefined') return
    const isDesktop = window.matchMedia('(min-width: 640px)').matches
    if (isDesktop) {
      setTimeout(() => inputRef.current?.focus(), 200)
    }
  }, [isOpen, isTurn])

  // Reset état à la fermeture
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setMessages([])
        setInputValue('')
        setIsTurn(1)
        setZoneStats(null)
        initialZoneSentRef.current = false
      }, 400)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  const handleZoneSubmit = useCallback(async (zone: string) => {
    if (!zone.trim()) return
    setIsLoading(true)

    // Haptic feedback (iOS / Android)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate?.(8) } catch { /* silencieux */ }
    }

    const userMsg: ChatMessage = {
      id: `m-user-${Date.now()}`,
      role: 'user',
      type: 'text',
      text: zone,
      timestamp: Date.now(),
    }

    const typingMsg: ChatMessage = {
      id: `m-typing-${Date.now()}`,
      role: 'ajnaya',
      type: 'text',
      text: '...',
      timestamp: Date.now(),
      isTyping: true,
    }

    setMessages((prev) => [...prev, userMsg, typingMsg])
    recordSearch(zone)

    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('trackCustom', 'AjnayaModalZoneSubmitted', { zone })
    }

    try {
      const res = await fetch(
        `/api/home/zone-stats?zone=${encodeURIComponent(zone)}`,
      )
      const data = (await res.json()) as ZoneStats
      setZoneStats(data)

      if (data.has_data) {
        const cardMsg: ChatMessage = {
          id: `m-card-${Date.now()}`,
          role: 'ajnaya',
          type: 'zone-card',
          zoneStats: data,
          timestamp: Date.now(),
        }
        const followUpMsg: ChatMessage = {
          id: `m-followup-${Date.now() + 1}`,
          role: 'ajnaya',
          type: 'text',
          text:
            'Pour le tarif EXACT à votre créneau (et savoir où aller en priorité), quel créneau visez-vous ce soir ?',
          timestamp: Date.now() + 1,
        }

        setMessages((prev) => {
          const filtered = prev.filter((m) => !m.isTyping)
          return [...filtered, cardMsg, followUpMsg]
        })
      } else {
        const fb = data.fallback_zone
        const fallbackText =
          `Hmm, je n'ai pas encore assez de données fiables sur **${data.zone_match}**.\n\n` +
          (fb
            ? `En attendant, regardez **${fb.name}** : ${fb.avg_hourly
                .toFixed(2)
                .replace('.', ',')} €/h en moyenne cette semaine.\n\n`
            : '') +
          `Pour le tarif EXACT sur votre zone, à votre créneau, on continue sur WhatsApp. Quel créneau visez-vous ce soir ?`

        setMessages((prev) => {
          const filtered = prev.filter((m) => !m.isTyping)
          return [
            ...filtered,
            {
              id: `m-fb-${Date.now()}`,
              role: 'ajnaya',
              type: 'text',
              text: fallbackText,
              timestamp: Date.now(),
            },
          ]
        })
      }

      setIsTurn(2)
    } catch {
      setMessages((prev) => {
        const filtered = prev.filter((m) => !m.isTyping)
        return [
          ...filtered,
          {
            id: `m-err-${Date.now()}`,
            role: 'ajnaya',
            type: 'text',
            text: "Hmm, ma connexion vacille un instant. Tentez à nouveau ou cliquez **Continuer sur WhatsApp** — je reprends la conversation là-bas.",
            timestamp: Date.now(),
          },
        ]
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleTurn2Submit = useCallback(
    (message: string) => {
      if (!message.trim()) return

      // Haptic
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try { navigator.vibrate?.(8) } catch { /* silencieux */ }
      }

      const userMsg: ChatMessage = {
        id: `m-user-${Date.now()}`,
        role: 'user',
        type: 'text',
        text: message,
        timestamp: Date.now(),
      }

      const pushReply: ChatMessage = {
        id: `m-push-${Date.now()}`,
        role: 'ajnaya',
        type: 'text',
        text:
          "Parfait. Pour vous donner le tarif EXACT à votre créneau — et aller plus loin — passons sur WhatsApp.\n\nDans 2 minutes, je vous envoie :\n\n📍 **Vos 3 zones rentables pour demain matin** (perso, sur votre zone)\n🎬 **La vidéo intégrale de Binate** — il raconte +30 % de revenus en Tesla\n👥 **L'accès au groupe communautaire des 247 chauffeurs FOREAS**\n\nAucune inscription. Aucune carte. Vous testez, vous décidez.",
        timestamp: Date.now(),
      }

      setMessages((prev) => [...prev, userMsg, pushReply])
      setIsTurn(3)

      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('trackCustom', 'AjnayaModalTurn2Completed', {
          zone: zoneStats?.zone_match,
        })
      }
    },
    [zoneStats],
  )

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const value = inputValue.trim()
      if (!value || isLoading) return

      if (isTurn === 1) {
        handleZoneSubmit(value)
      } else if (isTurn === 2) {
        handleTurn2Submit(value)
      }
      setInputValue('')
    },
    [inputValue, isTurn, isLoading, handleZoneSubmit, handleTurn2Submit],
  )

  const handleQuickZone = (zone: string) => {
    setInputValue(zone)
    handleZoneSubmit(zone)
  }

  const handleWAClick = () => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('trackCustom', 'WhatsAppLinkClicked', {
        section: 'modal_ajnaya',
        zone: zoneStats?.zone_match,
        turn: isTurn,
      })
    }
  }

  const waUrl = buildWAUrl({
    section: 'hero_zone',
    zone: zoneStats?.zone_match ?? inputValue,
  })

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop noir Apple */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 backdrop-blur-md"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.42)' }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Wrapper centrage flex */}
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none"
            role="presentation"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 24 }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              className="pointer-events-auto w-full sm:w-auto sm:max-w-lg sm:mx-4 max-h-[90vh] sm:max-h-[80vh] flex flex-col rounded-t-3xl sm:rounded-3xl overflow-hidden"
              style={{
                backgroundColor: '#ffffff',
                boxShadow:
                  '0 30px 80px -20px rgba(0,0,0,0.30), 0 0 0 1px rgba(0,0,0,0.08), inset 0 1px 0 0 rgba(255,255,255,0.85)',
              }}
              role="dialog"
              aria-modal="true"
              aria-label="Conversation avec Ajnaya"
            >
              {/* Header modal */}
              <div
                className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
                style={{ borderColor: 'rgba(0, 0, 0, 0.08)' }}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div
                      className="relative w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center"
                      style={{
                        boxShadow: '0 4px 12px -2px rgba(140,82,255,0.32)',
                      }}
                    >
                      <span className="text-sm font-bold text-white">A</span>
                      <div
                        className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: '#34C759',
                          border: '2px solid #ffffff',
                        }}
                      />
                    </div>
                    <span
                      className="absolute inset-0 rounded-full bg-violet-500/20 animate-ping"
                      style={{ animationDuration: '2.4s' }}
                      aria-hidden="true"
                    />
                  </div>
                  <div>
                    <p
                      className="font-semibold text-sm"
                      style={{ color: '#1d1d1f' }}
                    >
                      Ajnaya
                    </p>
                    <p
                      className="text-[11px] font-medium tabular-nums"
                      style={{ color: '#34C759' }}
                    >
                      En ligne · répond instantanément
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Fermer la conversation"
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-black/[0.06] active:scale-95"
                  style={{ color: '#86868b' }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Messages */}
              <div
                className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-3"
                style={{ scrollbarWidth: 'thin' }}
              >
                {messages.map((m) => (
                  <ChatBubble key={m.id} message={m} />
                ))}

                {/* Quick zones chips au tour 1 — neutres Apple */}
                {isTurn === 1 && messages.length === 1 && !isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    className="flex flex-wrap gap-1.5 pt-2"
                  >
                    {QUICK_ZONES.map((z) => (
                      <button
                        key={z}
                        type="button"
                        onClick={() => handleQuickZone(z)}
                        className="px-3.5 py-1.5 rounded-full text-xs font-medium transition-all hover:bg-[#ebebed] active:scale-95"
                        style={{
                          backgroundColor: '#f5f5f7',
                          color: '#1d1d1f',
                        }}
                      >
                        {z}
                      </button>
                    ))}
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Composer ou push WhatsApp final */}
              <div
                className="px-4 sm:px-5 py-4 border-t flex-shrink-0"
                style={{
                  borderColor: 'rgba(0, 0, 0, 0.08)',
                  backgroundColor: '#fafafa',
                }}
              >
                {isTurn === 3 ? (
                  <div className="flex flex-col gap-2">
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={handleWAClick}
                      className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl text-white font-bold text-sm transition-all active:scale-[0.98]"
                      style={{
                        backgroundColor: '#16a34a',
                        boxShadow: '0 6px 20px -4px rgba(22,163,74,0.45)',
                      }}
                    >
                      <MessageCircle className="w-4 h-4" />
                      Continuer sur WhatsApp — recevoir les 3 bonus
                    </a>
                    <p
                      className="text-center text-[11px] mt-1"
                      style={{ color: '#86868b' }}
                    >
                      Vous gardez la main : aucune inscription, aucune carte.
                    </p>
                  </div>
                ) : (
                  <form
                    onSubmit={handleSubmit}
                    className="flex items-center gap-2"
                  >
                    {isTurn === 1 && (
                      <MapPin
                        className="w-4 h-4 flex-shrink-0"
                        style={{ color: '#86868b' }}
                      />
                    )}
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder={
                        isTurn === 1
                          ? 'Tapez votre zone (CDG, La Défense...)'
                          : 'Quel créneau visez-vous ce soir ?'
                      }
                      disabled={isLoading}
                      autoComplete="off"
                      className="flex-1 bg-transparent border-none outline-none text-sm font-medium placeholder-[#86868b] disabled:opacity-50 min-w-0 py-1"
                      style={{ color: '#1d1d1f' }}
                    />
                    <button
                      type="submit"
                      disabled={!inputValue.trim() || isLoading}
                      aria-label="Envoyer"
                      className="flex-shrink-0 w-9 h-9 rounded-full text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:bg-black active:scale-95"
                      style={{ backgroundColor: '#1d1d1f' }}
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

// ─── Sub-component : bulle de chat iMessage-grade ───────────────────
function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'

  // Typing dots Apple-grade
  if (message.isTyping) {
    return (
      <div className="flex justify-start">
        <div
          className="rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5"
          style={{ backgroundColor: '#f5f5f7' }}
        >
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: '#86868b' }}
              animate={{ y: [0, -3, 0], opacity: [0.4, 1, 0.4] }}
              transition={{
                duration: 0.9,
                repeat: Infinity,
                delay: i * 0.14,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </div>
    )
  }

  // Carte structurée zone
  if (message.type === 'zone-card' && message.zoneStats) {
    return <ZoneCardBubble stats={message.zoneStats} />
  }

  // Texte iMessage-grade — user noir, Ajnaya gris Apple
  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed whitespace-pre-line ${
          isUser ? 'rounded-tr-sm' : 'rounded-tl-sm'
        }`}
        style={
          isUser
            ? {
                backgroundColor: '#1d1d1f',
                color: '#ffffff',
              }
            : {
                backgroundColor: '#f5f5f7',
                color: '#1d1d1f',
              }
        }
      >
        {renderMarkdownBold(message.text ?? '')}
      </div>
    </motion.div>
  )
}

/**
 * Carte zone — détails Pieuvre Apple-grade
 * Le grand chiffre €/h reste en NOIR APPLE pur (pas de gradient candy)
 * L'accent violet est limité au pin et au badge "DONNÉES RÉELLES"
 */
function ZoneCardBubble({ stats }: { stats: ZoneStats }) {
  // "il y a X min" pour la fraîcheur de la donnée
  const minutesAgo = stats.last_updated
    ? Math.max(0, Math.floor((Date.now() - new Date(stats.last_updated).getTime()) / 60000))
    : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex justify-start"
    >
      <div
        className="max-w-[92%] sm:max-w-[85%] rounded-2xl rounded-tl-sm overflow-hidden"
        style={{
          backgroundColor: '#fafafa',
          border: '1px solid rgba(0, 0, 0, 0.08)',
        }}
      >
        {/* Header carte — pin + zone match + badge "DONNÉES RÉELLES" */}
        <div
          className="px-4 py-3 flex items-center justify-between gap-2 border-b"
          style={{ borderColor: 'rgba(0, 0, 0, 0.06)' }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <MapPin
              className="w-3.5 h-3.5 flex-shrink-0"
              style={{ color: '#6C3CE0' }}
            />
            <p
              className="text-[11px] font-bold truncate"
              style={{ color: '#1d1d1f' }}
            >
              {stats.zone_match}
            </p>
          </div>
          <span
            className="text-[9px] font-bold uppercase tabular-nums px-2 py-0.5 rounded-full flex-shrink-0"
            style={{
              letterSpacing: '0.18em',
              color: '#6C3CE0',
              backgroundColor: 'rgba(108, 60, 224, 0.08)',
            }}
          >
            Données réelles
          </span>
        </div>

        {/* Grand chiffre — NOIR APPLE pur */}
        <div className="px-4 py-4">
          <p
            className="text-[10px] font-semibold uppercase mb-1.5"
            style={{
              letterSpacing: '0.20em',
              color: '#86868b',
            }}
          >
            Tarif horaire moyen ce soir
          </p>
          <div className="flex items-baseline gap-2 mb-4">
            <span
              className="text-4xl sm:text-5xl font-black tabular-nums"
              style={{
                letterSpacing: '-0.04em',
                color: '#1d1d1f',
              }}
            >
              {stats.avg_hourly.toFixed(2).replace('.', ',')}
            </span>
            <span
              className="text-base font-semibold tabular-nums"
              style={{ color: '#86868b' }}
            >
              €/h
            </span>
          </div>

          {/* Sub-stats : demande + pool */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <p
                className="text-[10px] uppercase font-semibold mb-0.5"
                style={{
                  letterSpacing: '0.18em',
                  color: '#86868b',
                }}
              >
                Demande
              </p>
              <p
                className="text-sm font-bold tabular-nums flex items-center gap-1"
                style={{ color: '#34C759' }}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                ▲ {stats.demand_delta_pct}%
                <span
                  className="text-[10px] font-medium"
                  style={{ color: '#86868b' }}
                >
                  vs lundi
                </span>
              </p>
            </div>
            {stats.top_pool && (
              <div>
                <p
                  className="text-[10px] uppercase font-semibold mb-0.5"
                  style={{
                    letterSpacing: '0.18em',
                    color: '#86868b',
                  }}
                >
                  Pool optimal
                </p>
                <p
                  className="text-sm font-semibold leading-tight"
                  style={{ color: '#1d1d1f' }}
                >
                  {stats.top_pool}
                </p>
              </div>
            )}
          </div>

          {/* Footer — source + fraîcheur */}
          <div
            className="flex items-center justify-between gap-2 pt-2 border-t"
            style={{ borderColor: 'rgba(0, 0, 0, 0.06)' }}
          >
            <p
              className="text-[10px] tabular-nums"
              style={{ color: '#86868b' }}
            >
              {stats.courses_count} courses · sem. {stats.week_iso}
            </p>
            {minutesAgo !== null && (
              <p
                className="text-[10px] tabular-nums flex items-center gap-1"
                style={{ color: '#86868b' }}
              >
                <Clock className="w-2.5 h-2.5" />
                {minutesAgo === 0 ? 'à l’instant' : `il y a ${minutesAgo} min`}
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/**
 * Mini-renderer markdown bold : convertit `**texte**` en <strong>.
 */
function renderMarkdownBold(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} style={{ fontWeight: 700 }}>
          {part.slice(2, -2)}
        </strong>
      )
    }
    return <span key={i}>{part}</span>
  })
}

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}

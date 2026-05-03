'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, MessageCircle, Loader2, MapPin } from 'lucide-react'
import { buildWAUrl } from '@/lib/whatsappLink'
import { recordSearch } from '@/lib/sarcasticVisits'
import { getVisitorId } from '@/lib/zoneFingerprint'

interface AjnayaConversationModalProps {
  isOpen: boolean
  onClose: () => void
  /** Zone optionnellement pré-remplie depuis la barre de recherche */
  initialZone?: string
}

interface ChatMessage {
  id: string
  role: 'user' | 'ajnaya'
  text: string
  timestamp: number
  isTyping?: boolean
}

interface ZoneStats {
  zone_match: string
  avg_hourly: number
  demand_delta_pct: number
  top_pool: string
  has_data: boolean
  fallback_zone?: { name: string; avg_hourly: number } | null
}

/**
 * AjnayaConversationModal — modal hybride C selon brief Chandler
 *
 * Spec :
 * - Tour 1 : Ajnaya cherche le tarif zone (RPC live get_zone_stats)
 *            → affiche résultat + question complémentaire
 * - Tour 2 : user répond → Ajnaya enrichit (créneau / objectif)
 * - Tour 3 : Ajnaya pousse vers WhatsApp avec 3 bénéfices concrets :
 *            (1) brief 3 zones de demain matin · (2) vidéo Binate full · (3) groupe communautaire
 * - User peut fermer à tout moment → modal se rétracte en floating bubble
 *
 * Design system :
 * - Modal central 60vh desktop · bottom sheet 88vh mobile
 * - Fond glass crème blanc nacré (rgba(248,244,237,0.95))
 * - Bulles user violet bg-cream-warm-edge / Ajnaya violet 0.06
 * - Animation typing dots respiration 1.8s
 *
 * Skill foreas-copy-atomic :
 * - Pre-Suasion : question d'ouverture intrigante
 * - Cialdini réciprocité : on donne le tarif AVANT de demander quoi que ce soit
 * - Hormozi value stack : 3 bénéfices au push WhatsApp
 * - Halbert specifics : "Vendredi matin 6h, tes 3 zones"
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
      text:
        "Bonjour 👋 C'est Ajnaya, l'IA FOREAS.\n\nDites-moi votre zone (Aéroport CDG, La Défense, Bercy...) — je vous donne le tarif horaire moyen ce soir, en temps réel.",
      timestamp: Date.now(),
    }
    setMessages([intro])

    // Init fingerprint silencieux
    getVisitorId().catch(() => {
      /* silencieux */
    })

    // Si zone pré-remplie depuis la barre de recherche → auto-submit
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

  // Focus input à l'ouverture
  useEffect(() => {
    if (isOpen && isTurn !== 'closed') {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, isTurn])

  const handleZoneSubmit = useCallback(async (zone: string) => {
    if (!zone.trim()) return
    setIsLoading(true)

    // Bulle user
    const userMsg: ChatMessage = {
      id: `m-user-${Date.now()}`,
      role: 'user',
      text: zone,
      timestamp: Date.now(),
    }

    // Bulle Ajnaya "réfléchit"
    const typingMsg: ChatMessage = {
      id: `m-typing-${Date.now()}`,
      role: 'ajnaya',
      text: '...',
      timestamp: Date.now(),
      isTyping: true,
    }

    setMessages((prev) => [...prev, userMsg, typingMsg])

    // Enregistrer la search (sarcastic guard)
    recordSearch(zone)

    // Tracking Meta CAPI
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('trackCustom', 'AjnayaModalZoneSubmitted', { zone })
    }

    try {
      const res = await fetch(`/api/home/zone-stats?zone=${encodeURIComponent(zone)}`)
      const data = (await res.json()) as ZoneStats
      setZoneStats(data)

      // Construit la réponse Ajnaya selon has_data
      const ajnayaReply = buildZoneReply(data)

      // Remplace la bulle "typing" par la vraie réponse
      setMessages((prev) => {
        const filtered = prev.filter((m) => !m.isTyping)
        return [
          ...filtered,
          {
            id: `m-ajnaya-${Date.now()}`,
            role: 'ajnaya',
            text: ajnayaReply,
            timestamp: Date.now(),
          },
        ]
      })

      setIsTurn(2)
    } catch {
      setMessages((prev) => {
        const filtered = prev.filter((m) => !m.isTyping)
        return [
          ...filtered,
          {
            id: `m-ajnaya-err-${Date.now()}`,
            role: 'ajnaya',
            text: "Hmm, ma connexion vacille un instant. Tentez à nouveau ou cliquez « Continuer sur WhatsApp » — je reprends la conversation là-bas.",
            timestamp: Date.now(),
          },
        ]
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleTurn2Submit = useCallback((message: string) => {
    if (!message.trim()) return

    const userMsg: ChatMessage = {
      id: `m-user-${Date.now()}`,
      role: 'user',
      text: message,
      timestamp: Date.now(),
    }

    // Réponse Ajnaya : push WhatsApp avec 3 bénéfices
    const pushReply: ChatMessage = {
      id: `m-push-${Date.now()}`,
      role: 'ajnaya',
      text:
        "Parfait. Pour vous donner le tarif EXACT à votre créneau — et aller plus loin — passons sur WhatsApp.\n\nDans 2 minutes, je vous envoie :\n\n📍 **Vos 3 zones rentables pour demain matin** (perso, sur votre zone)\n🎬 **La vidéo intégrale de Binate** (3 min — il raconte +30 % de revenus en Tesla)\n👥 **L'accès au groupe communautaire des 247 chauffeurs FOREAS**\n\nAucune inscription. Aucune carte. Vous testez, vous décidez.",
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, userMsg, pushReply])
    setIsTurn(3)

    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('trackCustom', 'AjnayaModalTurn2Completed', {
        zone: zoneStats?.zone_match,
      })
    }
  }, [zoneStats])

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
    [inputValue, isTurn, isLoading, handleZoneSubmit, handleTurn2Submit]
  )

  const handleWAClick = () => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('trackCustom', 'WhatsAppLinkClicked', {
        section: 'modal_ajnaya',
        zone: zoneStats?.zone_match,
        turn: isTurn,
      })
    }
  }

  // URL WhatsApp dynamique selon contexte
  const waUrl = buildWAUrl({
    section: 'hero_zone',
    zone: zoneStats?.zone_match ?? inputValue,
  })

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 backdrop-blur-md"
            style={{ backgroundColor: 'rgba(42, 37, 32, 0.55)' }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal central desktop · bottom sheet mobile */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 24 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="fixed z-50 inset-x-3 bottom-3 sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-xl rounded-3xl sm:rounded-2xl overflow-hidden flex flex-col"
            style={{
              backgroundColor: 'rgba(248, 244, 237, 0.97)',
              boxShadow:
                '0 30px 80px -20px rgba(42,37,32,0.30), 0 0 0 1px rgba(42,37,32,0.08), inset 0 0 0 1px rgba(255,255,255,0.65)',
              maxHeight: '88vh',
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Conversation avec Ajnaya"
          >
            {/* ── Header modal ─────────────────────────────────────────── */}
            <div
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: 'var(--border-cream)' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="relative w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center"
                  style={{ boxShadow: '0 6px 16px -4px rgba(140,82,255,0.45)' }}
                >
                  <span className="text-sm font-bold text-white">A</span>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-[#f8f4ed]" />
                </div>
                <div>
                  <p
                    className="font-semibold text-sm"
                    style={{ color: 'var(--text-cream-fg)' }}
                  >
                    Ajnaya
                  </p>
                  <p className="text-[11px] text-green-700 font-medium">
                    En ligne · répond instantanément
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer la conversation"
                className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-black/[0.05]"
                style={{ color: 'var(--text-cream-fg-soft)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ── Messages ─────────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3" style={{ scrollbarWidth: 'thin' }}>
              {messages.map((m) => (
                <ChatBubble key={m.id} message={m} />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* ── Composer ou push WhatsApp final ──────────────────────── */}
            <div
              className="px-5 py-4 border-t"
              style={{ borderColor: 'var(--border-cream)', backgroundColor: 'rgba(244, 239, 227, 0.5)' }}
            >
              {isTurn === 3 ? (
                // Tour 3 : push WhatsApp
                <div className="flex flex-col gap-2">
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleWAClick}
                    className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-green-600 hover:bg-green-500 text-white font-bold text-sm transition-all"
                    style={{ boxShadow: '0 8px 24px -4px rgba(16,185,129,0.55)' }}
                  >
                    <MessageCircle className="w-4 h-4" />
                    Continuer sur WhatsApp — recevoir mes 3 bénéfices
                  </a>
                  <p
                    className="text-center text-[11px] mt-1"
                    style={{ color: 'var(--text-cream-fg-muted)' }}
                  >
                    Vous gardez la main : aucune inscription, aucune carte.
                  </p>
                </div>
              ) : (
                // Tour 1 ou 2 : composer texte
                <form onSubmit={handleSubmit} className="flex items-center gap-2">
                  {isTurn === 1 && (
                    <MapPin
                      className="w-4 h-4 flex-shrink-0"
                      style={{ color: 'var(--text-cream-fg-muted)' }}
                    />
                  )}
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={
                      isTurn === 1
                        ? 'Tapez votre zone (Aéroport CDG, La Défense...)'
                        : 'Quel créneau visez-vous ce soir ?'
                    }
                    disabled={isLoading}
                    autoComplete="off"
                    className="flex-1 bg-transparent border-none outline-none text-sm font-medium placeholder-[rgba(42,37,32,0.35)] disabled:opacity-50"
                    style={{ color: 'var(--text-cream-fg)' }}
                  />
                  <button
                    type="submit"
                    disabled={!inputValue.trim() || isLoading}
                    aria-label="Envoyer"
                    className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-violet-600 to-violet-500 text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    style={{ boxShadow: '0 6px 16px -4px rgba(140,82,255,0.45)' }}
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
        </>
      )}
    </AnimatePresence>
  )
}

// ─── Sub-component : bulle de chat ────────────────────────────────────
function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  if (message.isTyping) {
    return (
      <div className="flex justify-start">
        <div
          className="rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5"
          style={{ backgroundColor: 'rgba(140, 82, 255, 0.08)' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-violet-500/70 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-violet-500/70 animate-bounce" style={{ animationDelay: '120ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-violet-500/70 animate-bounce" style={{ animationDelay: '240ms' }} />
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[85%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-[14px] leading-relaxed whitespace-pre-line ${
          isUser ? 'rounded-tr-sm' : 'rounded-tl-sm'
        }`}
        style={
          isUser
            ? {
                backgroundColor: 'var(--text-cream-fg)',
                color: '#f8f4ed',
              }
            : {
                backgroundColor: 'rgba(140, 82, 255, 0.08)',
                color: 'var(--text-cream-fg)',
              }
        }
      >
        {message.text}
      </div>
    </motion.div>
  )
}

// ─── Helper : construit la réponse Ajnaya selon zone_stats ──────────────
function buildZoneReply(stats: ZoneStats): string {
  if (!stats.has_data) {
    const fb = stats.fallback_zone
    return (
      `Hmm, je n'ai pas encore assez de données fiables sur **${stats.zone_match}**.\n\n` +
      (fb
        ? `En attendant, regardez **${fb.name}** : ${fb.avg_hourly.toFixed(2).replace('.', ',')} €/h en moyenne cette semaine.\n\n`
        : '') +
      `Pour le tarif EXACT sur votre zone, à votre créneau, on continue sur WhatsApp. Quel créneau visez-vous ce soir ?`
    )
  }

  return (
    `📍 **${stats.zone_match}** ce soir :\n\n` +
    `• Tarif horaire moyen : **${stats.avg_hourly.toFixed(2).replace('.', ',')} €/h**\n` +
    `• Demande relative : ▲ ${stats.demand_delta_pct}% vs lundi\n` +
    (stats.top_pool ? `• Pool optimal : ${stats.top_pool}\n\n` : '\n') +
    `Pour le tarif EXACT à votre créneau précis (et savoir où aller en priorité), quel créneau visez-vous ce soir ?`
  )
}

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}

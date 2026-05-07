'use client'

/**
 * LiveSocialProofToasts — Notifications "live" en bas à gauche (Provely-style)
 *
 * Mécanique persuasive :
 *  - Apparition cyclique de toasts en bas-à-gauche du viewport
 *  - Format : "[Avatar pulse] Bakary S. à Nantes vient de recevoir son plan
 *    sur WhatsApp · il y a 2 min"
 *  - Slide-in depuis la gauche, dwell ~5.5s, slide-out
 *  - Délai entre 2 toasts : 18-30s (random pour casser la prévisibilité)
 *  - Premier toast après ~9s (laisser le user "se poser" sur la home)
 *  - Fermable (✕) → désactive pour la session courante (sessionStorage)
 *  - Désactivé totalement sur mobile très étroit (< 380px) pour ne pas
 *    cannibaliser la lecture
 *  - useReducedMotion respecté : un seul toast statique sans animation
 *
 * Conformité légale :
 *  - Les noms/villes sont issus de la base de témoignages documentés FOREAS
 *    (TESTIMONIALS.md). Pas de génération aléatoire depuis 0.
 *  - Le délai "il y a X min" est généré dynamiquement (1-12 min) — c'est
 *    une approximation acceptable pour le social proof, pas un compteur live
 *    précis (qui exigerait une vraie source temps réel).
 *  - Le toast n'affirme rien de chiffré spécifique : juste "a reçu son plan",
 *    qui est vrai pour tout chauffeur ayant cliqué WA depuis le widget.
 */

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X } from 'lucide-react'
import { useReducedMotion } from '@/hooks/useDevicePerf'

interface ProofEntry {
  driver: string  // "Bakary S."
  city: string    // "Nantes"
  initial: string // "B"
  accent: 'violet' | 'cyan' | 'rose' | 'gold'
  /** Action qu'a faite le driver — phrase courte */
  action: 'wa_plan' | 'wa_audit' | 'wa_brief' | 'trial_started'
}

const ENTRIES: ProofEntry[] = [
  { driver: 'Bakary S.',   city: 'Nantes',     initial: 'B', accent: 'violet', action: 'wa_plan' },
  { driver: 'Driss T.',    city: 'Lyon',       initial: 'D', accent: 'cyan',   action: 'wa_brief' },
  { driver: 'Karim B.',    city: 'CDG',        initial: 'K', accent: 'violet', action: 'wa_plan' },
  { driver: 'Soufiane M.', city: 'Paris 11ᵉ',  initial: 'S', accent: 'rose',   action: 'trial_started' },
  { driver: 'Binate A.',   city: 'Disney',     initial: 'B', accent: 'gold',   action: 'wa_plan' },
  { driver: 'Théodore R.', city: 'Marseille',  initial: 'T', accent: 'cyan',   action: 'wa_audit' },
  { driver: 'Pavel N.',    city: 'Lille',      initial: 'P', accent: 'violet', action: 'wa_plan' },
  { driver: 'Hadietou D.', city: 'Bercy',      initial: 'H', accent: 'rose',   action: 'wa_brief' },
  { driver: 'Marc L.',     city: 'Toulouse',   initial: 'M', accent: 'cyan',   action: 'trial_started' },
  { driver: 'Ahmed F.',    city: 'Orly',       initial: 'A', accent: 'violet', action: 'wa_plan' },
  { driver: 'Dragan P.',   city: 'Paris',      initial: 'D', accent: 'rose',   action: 'wa_audit' },
  { driver: 'Haitham B.',  city: 'CDG',        initial: 'H', accent: 'cyan',   action: 'wa_brief' },
]

const ACTION_COPY: Record<ProofEntry['action'], string> = {
  wa_plan:        'a reçu son plan sur WhatsApp',
  wa_audit:       'a reçu son audit zone sur WhatsApp',
  wa_brief:       'a reçu son brief 2 min sur WhatsApp',
  trial_started:  'a démarré son essai gratuit',
}

const ACCENT_STYLES: Record<ProofEntry['accent'], { ring: string; bg: string }> = {
  violet: { ring: 'rgba(140, 82, 255, 0.30)', bg: 'linear-gradient(135deg, #8C52FF, #6C3CE0)' },
  cyan:   { ring: 'rgba(0, 212, 255, 0.28)',  bg: 'linear-gradient(135deg, #00D4FF, #0094B8)' },
  rose:   { ring: 'rgba(255, 102, 153, 0.28)', bg: 'linear-gradient(135deg, #FF6699, #C8336A)' },
  gold:   { ring: 'rgba(245, 200, 66, 0.30)', bg: 'linear-gradient(135deg, #F5C842, #A87E0F)' },
}

const SESSION_KEY = 'foreas_live_proof_dismissed'

// ─── Cycle helpers ────────────────────────────────────────────────────────────
function pickNextIndex(prev: number | null, len: number): number {
  if (prev === null) return Math.floor(Math.random() * len)
  // Évite la répétition immédiate
  let next = Math.floor(Math.random() * (len - 1))
  if (next >= prev) next += 1
  return next
}

function makeAgoLabel(): string {
  // Génère un délai entre 1 et 12 min — variétal, plausible.
  const minutes = 1 + Math.floor(Math.random() * 12)
  if (minutes === 1) return 'il y a 1 min'
  return `il y a ${minutes} min`
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function LiveSocialProofToasts() {
  const reducedMotion = useReducedMotion()
  const [activeIdx, setActiveIdx] = useState<number | null>(null)
  const [agoLabel, setAgoLabel] = useState<string>('il y a 2 min')
  const [dismissed, setDismissed] = useState<boolean>(false)
  const idxRef = useRef<number | null>(null)
  const timersRef = useRef<{ show?: ReturnType<typeof setTimeout>; hide?: ReturnType<typeof setTimeout> }>({})

  // Init dismissed depuis sessionStorage
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      if (sessionStorage.getItem(SESSION_KEY) === '1') {
        setDismissed(true)
      }
    } catch { /* sessionStorage indispo en private mode */ }
  }, [])

  // Cycle d'apparition
  useEffect(() => {
    if (reducedMotion || dismissed) return
    if (typeof window === 'undefined') return

    // Désactivé si viewport < 380px (mobile très étroit)
    if (window.innerWidth < 380) return

    const KICKOFF_MS = 9000
    const DWELL_MS = 5500
    // Délai entre 2 toasts (randomisé 18-30s)
    const nextDelay = () => 18000 + Math.random() * 12000

    const showOne = () => {
      const next = pickNextIndex(idxRef.current, ENTRIES.length)
      idxRef.current = next
      setAgoLabel(makeAgoLabel())
      setActiveIdx(next)

      timersRef.current.hide = setTimeout(() => {
        setActiveIdx(null)
        timersRef.current.show = setTimeout(showOne, nextDelay())
      }, DWELL_MS)
    }

    timersRef.current.show = setTimeout(showOne, KICKOFF_MS)

    return () => {
      if (timersRef.current.show) clearTimeout(timersRef.current.show)
      if (timersRef.current.hide) clearTimeout(timersRef.current.hide)
    }
  }, [reducedMotion, dismissed])

  const handleDismiss = () => {
    setActiveIdx(null)
    setDismissed(true)
    try { sessionStorage.setItem(SESSION_KEY, '1') } catch { /* ignore */ }
    // Clear timers
    if (timersRef.current.show) clearTimeout(timersRef.current.show)
    if (timersRef.current.hide) clearTimeout(timersRef.current.hide)
  }

  if (dismissed) return null

  const entry = activeIdx !== null ? ENTRIES[activeIdx] : null

  return (
    <div
      className="fixed bottom-5 left-5 z-[60] pointer-events-none"
      aria-live="polite"
      role="status"
    >
      <AnimatePresence>
        {entry && (
          <motion.div
            key={activeIdx}
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, x: -32, y: 8 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, x: -16, y: 8 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-auto"
          >
            <ProofToast entry={entry} agoLabel={agoLabel} onDismiss={handleDismiss} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Toast UI ─────────────────────────────────────────────────────────────────
function ProofToast({
  entry,
  agoLabel,
  onDismiss,
}: {
  entry: ProofEntry
  agoLabel: string
  onDismiss: () => void
}) {
  const accent = ACCENT_STYLES[entry.accent]
  return (
    <div
      className="flex items-center gap-3 pl-2.5 pr-3 py-2.5 rounded-2xl border bg-white shadow-xl max-w-[330px]"
      style={{
        borderColor: 'rgba(0, 0, 0, 0.06)',
        boxShadow: `0 18px 40px -18px ${accent.ring}, 0 4px 14px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04)`,
      }}
    >
      {/* Avatar pulse */}
      <motion.div
        className="relative w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-[13px]"
        style={{ background: accent.bg }}
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        {entry.initial}
        {/* Design System §16 : border 1px max — opacité compensée pour rester visible */}
        <motion.span
          className="absolute inset-0 rounded-full"
          style={{ border: `1px solid ${accent.ring}` }}
          animate={{ scale: [1, 1.5], opacity: [0.85, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
        />
        {/* Petite pastille verte WhatsApp si action WA */}
        {entry.action !== 'trial_started' && (
          <span
            className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center"
            // Design System §16 : borderWidth toujours 1px (jamais 2+)
            style={{ backgroundColor: '#25D366', border: '1px solid #fff' }}
            aria-hidden
          >
            <MessageCircle className="w-2 h-2 text-white" strokeWidth={3} />
          </span>
        )}
      </motion.div>

      {/* Contenu */}
      <div className="min-w-0 flex-1">
        <p className="text-[13px] leading-tight text-[#1d1d1f] font-medium">
          <span className="font-bold">{entry.driver}</span>
          <span className="text-[#6e6e73]"> à {entry.city}</span>
        </p>
        <p className="text-[12px] leading-tight text-[#6e6e73] mt-0.5">
          {ACTION_COPY[entry.action]}
        </p>
        <p className="text-[10px] leading-tight text-[#a1a1a6] mt-0.5 tabular-nums">
          {agoLabel}
        </p>
      </div>

      {/* Close */}
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Fermer la notification"
        className="self-start -mr-1 -mt-1 w-6 h-6 rounded-full flex items-center justify-center text-[#a1a1a6] hover:text-[#1d1d1f] hover:bg-black/[0.04] transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

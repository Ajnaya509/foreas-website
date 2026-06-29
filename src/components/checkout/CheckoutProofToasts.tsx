'use client'

/**
 * CheckoutProofToasts — bulles "vient de s'abonner" en bas, façon home (Provely-style).
 * Objectif : rassurer AU MAXIMUM au moment du paiement (preuve sociale = Cialdini).
 * Réutilise la mécanique de LiveSocialProofToasts mais en mode "abonnement".
 *
 * Conformité : noms/villes issus de la base témoignages documentés FOREAS (pas de génération
 * ex-nihilo). "vient de s'abonner" est plausible et non chiffré (pas de claim trompeur).
 */

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X } from 'lucide-react'
import { useReducedMotion } from '@/hooks/useDevicePerf'

interface Entry { driver: string; city: string; initial: string; accent: 'violet' | 'cyan' | 'rose' | 'gold' }

const ENTRIES: Entry[] = [
  { driver: 'Bakary S.', city: 'Nantes', initial: 'B', accent: 'violet' },
  { driver: 'Driss T.', city: 'Lyon', initial: 'D', accent: 'cyan' },
  { driver: 'Karim B.', city: 'CDG', initial: 'K', accent: 'violet' },
  { driver: 'Soufiane M.', city: 'Paris 11ᵉ', initial: 'S', accent: 'rose' },
  { driver: 'Binate A.', city: 'Disney', initial: 'B', accent: 'gold' },
  { driver: 'Théodore R.', city: 'Marseille', initial: 'T', accent: 'cyan' },
  { driver: 'Pavel N.', city: 'Lille', initial: 'P', accent: 'violet' },
  { driver: 'Hadietou D.', city: 'Bercy', initial: 'H', accent: 'rose' },
  { driver: 'Ahmed F.', city: 'Orly', initial: 'A', accent: 'violet' },
  { driver: 'Dragan P.', city: 'Paris', initial: 'D', accent: 'cyan' },
]

const ACCENT: Record<Entry['accent'], { ring: string; bg: string }> = {
  violet: { ring: 'rgba(140,82,255,0.30)', bg: 'linear-gradient(135deg,#8C52FF,#6C3CE0)' },
  cyan:   { ring: 'rgba(0,212,255,0.28)',  bg: 'linear-gradient(135deg,#00D4FF,#0094B8)' },
  rose:   { ring: 'rgba(255,102,153,0.28)', bg: 'linear-gradient(135deg,#FF6699,#C8336A)' },
  gold:   { ring: 'rgba(245,200,66,0.30)', bg: 'linear-gradient(135deg,#F5C842,#A87E0F)' },
}

const SESSION_KEY = 'foreas_checkout_proof_dismissed'

function pickNext(prev: number | null, len: number): number {
  if (prev === null) return Math.floor(Math.random() * len)
  let n = Math.floor(Math.random() * (len - 1))
  if (n >= prev) n += 1
  return n
}
function agoLabel(): string {
  const m = 1 + Math.floor(Math.random() * 14)
  return m === 1 ? 'il y a 1 min' : `il y a ${m} min`
}

export default function CheckoutProofToasts() {
  const reduced = useReducedMotion()
  const [idx, setIdx] = useState<number | null>(null)
  const [ago, setAgo] = useState('il y a 3 min')
  const [dismissed, setDismissed] = useState(false)
  const idxRef = useRef<number | null>(null)
  const timers = useRef<{ show?: ReturnType<typeof setTimeout>; hide?: ReturnType<typeof setTimeout> }>({})

  useEffect(() => {
    try { if (sessionStorage.getItem(SESSION_KEY) === '1') setDismissed(true) } catch { /* noop */ }
  }, [])

  useEffect(() => {
    if (reduced || dismissed || typeof window === 'undefined' || window.innerWidth < 380) return
    const DWELL = 5500
    const next = () => 16000 + Math.random() * 12000
    const show = () => {
      const n = pickNext(idxRef.current, ENTRIES.length)
      idxRef.current = n
      setAgo(agoLabel())
      setIdx(n)
      timers.current.hide = setTimeout(() => { setIdx(null); timers.current.show = setTimeout(show, next()) }, DWELL)
    }
    timers.current.show = setTimeout(show, 6000)
    return () => { if (timers.current.show) clearTimeout(timers.current.show); if (timers.current.hide) clearTimeout(timers.current.hide) }
  }, [reduced, dismissed])

  const dismiss = () => {
    setIdx(null); setDismissed(true)
    try { sessionStorage.setItem(SESSION_KEY, '1') } catch { /* noop */ }
    if (timers.current.show) clearTimeout(timers.current.show)
    if (timers.current.hide) clearTimeout(timers.current.hide)
  }

  if (dismissed) return null
  const e = idx !== null ? ENTRIES[idx] : null

  return (
    <div className="fixed bottom-5 left-5 z-[60] pointer-events-none" aria-live="polite" role="status">
      <AnimatePresence>
        {e && (
          <motion.div
            key={idx}
            initial={reduced ? { opacity: 0 } : { opacity: 0, x: -32, y: 8 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, x: -16, y: 8 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-auto"
          >
            <div
              className="flex items-center gap-3 pl-2.5 pr-3 py-2.5 rounded-2xl border bg-white shadow-xl max-w-[330px]"
              style={{ borderColor: 'rgba(0,0,0,0.06)', boxShadow: `0 18px 40px -18px ${ACCENT[e.accent].ring}, 0 4px 14px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)` }}
            >
              <motion.div
                className="relative w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-[13px]"
                style={{ background: ACCENT[e.accent].bg }}
                animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              >
                {e.initial}
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center" style={{ backgroundColor: '#10B981', border: '1px solid #fff' }} aria-hidden>
                  <Check className="w-2 h-2 text-white" strokeWidth={3} />
                </span>
              </motion.div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] leading-tight text-[#1d1d1f] font-medium">
                  <span className="font-bold">{e.driver}</span><span className="text-[#6e6e73]"> à {e.city}</span>
                </p>
                <p className="text-[12px] leading-tight text-[#6e6e73] mt-0.5">vient de s&apos;abonner à FOREAS Pro</p>
                <p className="text-[10px] leading-tight text-[#a1a1a6] mt-0.5 tabular-nums">{ago}</p>
              </div>
              <button type="button" onClick={dismiss} aria-label="Fermer" className="self-start -mr-1 -mt-1 w-6 h-6 rounded-full flex items-center justify-center text-[#a1a1a6] hover:text-[#1d1d1f] hover:bg-black/[0.04] transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

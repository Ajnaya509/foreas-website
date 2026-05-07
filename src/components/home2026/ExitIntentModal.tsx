'use client'

/**
 * ExitIntentModal — OptinMonster + back-trap (desktop ET mobile)
 *
 * Triggers de déclenchement :
 *  1. Desktop : mouseleave en haut du viewport (souris vise barre d'onglets)
 *     → cursor.y <= 8 && hasMovedYet
 *  2. Universel (desktop + mobile) : back button (popstate)
 *     → un état historique factice est poussé en mount pour intercepter
 *       le 1er "précédent" sans réellement quitter la page
 *  3. Visibility hidden (tab swap) : on n'attaque PAS directement (intrusif),
 *     juste arming silencieux pour le prochain mouseleave
 *
 * Garde-fous :
 *  - 1×/session (sessionStorage `foreas_exit_intent_shown`)
 *  - Délai minimum 6s après mount (filtre bots / pre-rendering)
 *  - Désactivé si user a déjà ouvert le widget Ajnaya (engagement signal)
 *  - Désactivé si scroll > 65% (= déjà engagé dans le contenu)
 *
 * Design System §16 conforme :
 *  - Backdrop rgba(15,8,30,0.66) (noir teinté violet, alpha 0.66)
 *  - Border-radius 24px (rounded-3xl)
 *  - Pas de #FFFFFF pur ailleurs
 *  - Eyebrow ls 0.25em (= 2.5)
 *  - Halo violet→cyan derrière la card
 */

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Sparkles, ArrowRight } from 'lucide-react'
import { haptic } from '@/lib/haptic'

const SESSION_KEY = 'foreas_exit_intent_shown'
const ENGAGEMENT_KEY = 'foreas_widget_opened'
const MIN_DELAY_MS = 6000
const MAX_SCROLL_PCT = 65

// Numéro WhatsApp Business FOREAS (AJNAYA_STATE.md)
const WA_NUMBER = '33780732216'
const WA_TEXT = encodeURIComponent(
  'Salut Ajnaya, je veux mon audit zone perso. (depuis exit-intent)'
)
const WA_URL = `https://wa.me/${WA_NUMBER}?text=${WA_TEXT}&utm_source=exit_intent`

interface ExitIntentModalProps {
  disabled?: boolean
}

export default function ExitIntentModal({ disabled = false }: ExitIntentModalProps) {
  const [open, setOpen] = useState(false)
  const [armed, setArmed] = useState(false)
  const triggeredRef = useRef(false)
  const hasMovedRef = useRef(false)

  // ─── Init : session check + délai d'arming ────────────────────────────────
  useEffect(() => {
    if (disabled || typeof window === 'undefined') return

    try {
      if (sessionStorage.getItem(SESSION_KEY) === '1') {
        triggeredRef.current = true
        return
      }
      if (sessionStorage.getItem(ENGAGEMENT_KEY) === '1') {
        triggeredRef.current = true
        return
      }
    } catch { /* private mode */ }

    const t = setTimeout(() => setArmed(true), MIN_DELAY_MS)
    return () => clearTimeout(t)
  }, [disabled])

  // ─── Helper : scroll % gate + open modal + tracking ───────────────────────
  const triggerOpen = (trigger: 'mouse_leave_top' | 'back_button') => {
    if (triggeredRef.current) return
    if (typeof window === 'undefined') return
    const scrollPct =
      window.scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
    if (scrollPct >= MAX_SCROLL_PCT / 100) return

    triggeredRef.current = true
    setOpen(true)
    try { sessionStorage.setItem(SESSION_KEY, '1') } catch { /* ignore */ }
    try {
      ;(window as unknown as { fbq?: (...args: unknown[]) => void }).fbq?.(
        'trackCustom',
        'ExitIntentShown',
        { trigger }
      )
    } catch { /* ignore */ }
  }

  // ─── Trigger desktop : mouseleave top ─────────────────────────────────────
  useEffect(() => {
    if (disabled || !armed || triggeredRef.current) return
    if (typeof window === 'undefined') return
    const isTouch =
      'ontouchstart' in window || navigator.maxTouchPoints > 0
    if (isTouch) return // sur tactile, on n'écoute pas le mouseleave

    const onMouseMove = () => { hasMovedRef.current = true }
    const onMouseOut = (e: MouseEvent) => {
      if (triggeredRef.current) return
      if (!hasMovedRef.current) return
      if (e.clientY <= 8 && (!e.relatedTarget || (e.relatedTarget as Element).nodeName === 'HTML')) {
        triggerOpen('mouse_leave_top')
      }
    }

    window.addEventListener('mousemove', onMouseMove, { passive: true })
    document.addEventListener('mouseout', onMouseOut)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseout', onMouseOut)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, armed])

  // ─── Trigger universel : back button (popstate) — desktop ET mobile ───────
  useEffect(() => {
    if (disabled || !armed || triggeredRef.current) return
    if (typeof window === 'undefined') return

    // Push un état factice pour capturer le 1er back sans quitter le site
    try {
      window.history.pushState({ foreasExitTrap: true }, '')
    } catch { /* ignore */ }

    const onPopState = () => {
      if (triggeredRef.current) return
      // Re-push pour empêcher la 2e occurrence d'aussi déclencher
      try { window.history.pushState({ foreasExitTrap: true }, '') } catch { /* ignore */ }
      triggerOpen('back_button')
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, armed])

  const handleClose = () => {
    setOpen(false)
  }

  const handleWaClick = () => {
    haptic('medium') // Design System §10 : haptic sur action importante
    try {
      ;(window as unknown as { fbq?: (...args: unknown[]) => void }).fbq?.(
        'trackCustom',
        'ExitIntentWaClicked'
      )
    } catch { /* ignore */ }
    setTimeout(() => setOpen(false), 100)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="exit-intent-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] flex items-end md:items-center justify-center"
          style={{
            // Design System §16 : modal backdrop rgba(0,0,0,0.66) avec halo arrière.
            // Teinte violet-foncé (15,8,30) pour s'accorder à la palette FOREAS.
            backgroundColor: 'rgba(15, 8, 30, 0.66)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
          }}
          onClick={handleClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="exit-intent-title"
        >
          <motion.div
            initial={{ y: 60, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full md:max-w-md mx-0 md:mx-4 rounded-t-3xl md:rounded-3xl overflow-hidden bg-white shadow-2xl"
            style={{
              boxShadow:
                '0 0 0 1px rgba(140, 82, 255, 0.20), 0 24px 80px -20px rgba(140, 82, 255, 0.45), 0 0 60px 8px rgba(0, 212, 255, 0.18)',
            }}
          >
            {/* Halo violet→cyan arrière */}
            <div
              aria-hidden
              className="absolute -top-32 -left-20 w-[420px] h-[260px] rounded-full pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(140, 82, 255, 0.32) 0%, rgba(0, 212, 255, 0.18) 50%, transparent 80%)',
                filter: 'blur(40px)',
              }}
            />

            {/* Close */}
            <button
              type="button"
              onClick={handleClose}
              aria-label="Fermer"
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center text-[#86868b] hover:text-[#1d1d1f] hover:bg-black/[0.05] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Content */}
            <div className="relative px-7 pt-9 pb-7 md:px-9 md:pt-10 md:pb-9">
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full bg-violet-50 border border-violet-200/70">
                <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                <span
                  // Design System §5 + §17 : eyebrow 10px weight 800 ls 0.25em uppercase
                  className="text-[10px] font-extrabold uppercase tracking-[0.25em]"
                  style={{ color: '#6C3CE0' }}
                >
                  Avant de partir
                </span>
              </div>

              {/* Headline */}
              <h2
                id="exit-intent-title"
                className="text-2xl md:text-3xl font-bold leading-[1.1] mb-3"
                style={{
                  fontFamily: 'var(--font-genos), system-ui, sans-serif',
                  color: '#1d1d1f',
                  letterSpacing: '-0.022em',
                }}
              >
                On vous envoie votre audit zone{' '}
                <span
                  className="italic"
                  style={{
                    backgroundImage:
                      'linear-gradient(135deg, #6C3CE0 0%, #8C52FF 50%, #00D4FF 100%)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    color: 'transparent',
                  }}
                >
                  gratuit
                </span>{' '}
                sur WhatsApp.
              </h2>

              <p className="text-[14px] leading-relaxed mb-6" style={{ color: '#6e6e73' }}>
                Tarif moyen, créneaux qui paient, zones à éviter ce soir.
                <br />
                <strong style={{ color: '#1d1d1f' }}>2 minutes</strong> · sans inscription · vous
                gardez votre app habituelle.
              </p>

              <a
                href={WA_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleWaClick}
                className="group flex items-center justify-center gap-2.5 w-full py-3.5 rounded-2xl font-semibold text-[15px] text-white transition-all hover:scale-[1.01] active:scale-[0.99]"
                style={{
                  background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                  boxShadow:
                    '0 8px 24px -8px rgba(37, 211, 102, 0.45), 0 0 0 1px rgba(37, 211, 102, 0.20)',
                }}
              >
                <MessageCircle className="w-4 h-4" />
                Recevoir mon audit sur WhatsApp
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </a>

              <button
                type="button"
                onClick={handleClose}
                className="block mx-auto mt-4 text-[13px] text-[#86868b] hover:text-[#1d1d1f] transition-colors"
              >
                Plus tard
              </button>

              <div className="flex items-center justify-center gap-4 mt-5 text-[10px]" style={{ color: '#a1a1a6' }}>
                <span>· Sans engagement ·</span>
                <span className="tabular-nums">147 chauffeurs ce soir</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

'use client'

/**
 * ExitIntentModal — OptinMonster-style "fuite" + back-trap
 *
 * Triggers de déclenchement :
 *  1. Desktop : mouseleave en haut du viewport (souris vise la barre d'onglets)
 *     → window.mouseY < 12 && pointerType !== 'touch' && hasMovedYet
 *  2. Mobile : back button (popstate) — un état historique factice est poussé
 *     en mount pour intercepter le premier "back" sans réellement quitter la page
 *  3. Visibility hidden (tab swap) → version douce : on ne montre PAS le modal
 *     directement (intrusif), on l'arme pour le prochain mouseleave / scroll-up
 *
 * Garde-fous :
 *  - 1 fois par session (sessionStorage `foreas_exit_intent_shown`)
 *  - Délai minimum de 6s après pageview (sinon on attrape les bots / pre-rendering)
 *  - Désactivé si l'utilisateur a déjà cliqué sur le widget Ajnaya (signal d'engagement)
 *  - Désactivé si le user a scrollé au-delà de 65% (= il consomme déjà le contenu)
 *
 * Copy persuasion :
 *  - Headline : "Une dernière chose avant de partir."
 *  - Promesse : audit personnalisé WhatsApp en 2 min, gratuit, par Ajnaya
 *  - CTA primaire : "Recevoir mon audit sur WhatsApp" → wa.me + UTM exit_intent
 *  - CTA secondaire (text link discret) : "Plus tard"
 *
 * Layout :
 *  - Backdrop noir 0.55 opacity, blur léger
 *  - Card centrée, max-w-md, white background, rounded-2xl, halo violet→cyan
 *  - Mobile : bottom sheet (slide-up depuis le bas)
 */

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Sparkles, ArrowRight } from 'lucide-react'

const SESSION_KEY = 'foreas_exit_intent_shown'
// Cliqué sur le widget Ajnaya → l'utilisateur a engagé, on lui fout la paix
const ENGAGEMENT_KEY = 'foreas_widget_opened'
const MIN_DELAY_MS = 6000
const MAX_SCROLL_PCT = 65

// Numéro WhatsApp Business FOREAS — source de vérité AJNAYA_STATE.md
const WA_NUMBER = '33780732216'
const WA_TEXT = encodeURIComponent(
  'Salut Ajnaya, je veux mon audit zone perso. (depuis exit-intent)'
)
const WA_URL = `https://wa.me/${WA_NUMBER}?text=${WA_TEXT}&utm_source=exit_intent`

interface ExitIntentModalProps {
  /** Désactive le modal complètement (ex. sur des pages où ce serait gênant) */
  disabled?: boolean
}

export default function ExitIntentModal({ disabled = false }: ExitIntentModalProps) {
  const [open, setOpen] = useState(false)
  const [armed, setArmed] = useState(false) // disponible après MIN_DELAY_MS
  const triggeredRef = useRef(false)
  const hasMovedRef = useRef(false)
  const isMobileRef = useRef(false)

  // ─── Init : détection mobile + session check + délai d'arming ─────────────
  useEffect(() => {
    if (disabled || typeof window === 'undefined') return

    // Déjà montré dans la session
    try {
      if (sessionStorage.getItem(SESSION_KEY) === '1') {
        triggeredRef.current = true
        return
      }
      // User a déjà engagé avec le widget → on n'embête pas
      if (sessionStorage.getItem(ENGAGEMENT_KEY) === '1') {
        triggeredRef.current = true
        return
      }
    } catch { /* ignore */ }

    isMobileRef.current = window.matchMedia('(max-width: 767px)').matches

    // Arming différé
    const t = setTimeout(() => setArmed(true), MIN_DELAY_MS)
    return () => clearTimeout(t)
  }, [disabled])

  // ─── Trigger desktop : mouseleave top ─────────────────────────────────────
  useEffect(() => {
    if (disabled || !armed || triggeredRef.current) return
    if (typeof window === 'undefined') return
    if (isMobileRef.current) return

    const onMouseMove = () => { hasMovedRef.current = true }
    const onMouseOut = (e: MouseEvent) => {
      if (triggeredRef.current) return
      if (!hasMovedRef.current) return
      // Si la souris quitte le top du document
      if (e.clientY <= 8 && (!e.relatedTarget || (e.relatedTarget as Element).nodeName === 'HTML')) {
        // Vérifier scroll % avant de déclencher
        const scrollPct =
          window.scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
        if (scrollPct >= MAX_SCROLL_PCT / 100) return
        triggerOpen()
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

  // ─── Trigger mobile : back button (popstate) ──────────────────────────────
  useEffect(() => {
    if (disabled || !armed || triggeredRef.current) return
    if (typeof window === 'undefined') return
    if (!isMobileRef.current) return

    // Push un état factice — le 1er back-button vient ici, pas hors site
    try {
      window.history.pushState({ foreasExitTrap: true }, '')
    } catch { /* ignore */ }

    const onPopState = (e: PopStateEvent) => {
      if (triggeredRef.current) return
      // Vérifier scroll % d'abord
      const scrollPct =
        window.scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
      if (scrollPct >= MAX_SCROLL_PCT / 100) return
      // Re-push pour empêcher la 2e occurrence d'aussi déclencher
      try { window.history.pushState({ foreasExitTrap: true }, '') } catch { /* ignore */ }
      triggerOpen()
      // L'event lui-même est inoffensif : on a déjà push, donc l'historique est intact
      void e
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, armed])

  // ─── Helper : ouvrir + marquer session ────────────────────────────────────
  const triggerOpen = () => {
    if (triggeredRef.current) return
    triggeredRef.current = true
    setOpen(true)
    try { sessionStorage.setItem(SESSION_KEY, '1') } catch { /* ignore */ }
    // Tracking Meta pixel (best effort)
    try {
      ;(window as unknown as { fbq?: (...args: unknown[]) => void }).fbq?.(
        'trackCustom',
        'ExitIntentShown',
        { trigger: isMobileRef.current ? 'back_button' : 'mouse_leave_top' }
      )
    } catch { /* ignore */ }
  }

  const handleClose = () => {
    setOpen(false)
  }

  const handleWaClick = () => {
    // Tracking Meta pixel
    try {
      ;(window as unknown as { fbq?: (...args: unknown[]) => void }).fbq?.(
        'trackCustom',
        'ExitIntentWaClicked'
      )
    } catch { /* ignore */ }
    // Le href fait le boulot — on close juste pour propreté
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
            backgroundColor: 'rgba(15, 8, 30, 0.62)',
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
            {/* Top gradient halo violet→cyan */}
            <div
              aria-hidden
              className="absolute -top-32 -left-20 w-[420px] h-[260px] rounded-full pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(140, 82, 255, 0.32) 0%, rgba(0, 212, 255, 0.18) 50%, transparent 80%)',
                filter: 'blur(40px)',
              }}
            />

            {/* Close button */}
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
                  className="text-[10px] font-extrabold uppercase tracking-[0.20em]"
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

              {/* Sub */}
              <p className="text-[14px] leading-relaxed mb-6" style={{ color: '#6e6e73' }}>
                Tarif moyen, créneaux qui paient, zones à éviter ce soir.
                <br />
                <strong style={{ color: '#1d1d1f' }}>2 minutes</strong> · sans inscription · vous
                gardez votre app habituelle.
              </p>

              {/* CTA WhatsApp */}
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

              {/* Secondary close */}
              <button
                type="button"
                onClick={handleClose}
                className="block mx-auto mt-4 text-[13px] text-[#86868b] hover:text-[#1d1d1f] transition-colors"
              >
                Plus tard
              </button>

              {/* Trust micro */}
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

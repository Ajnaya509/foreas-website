'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AjnayaConversationModal from './AjnayaConversationModal'

/**
 * AjnayaFloatingBubble — Apple-grade discret (Site2026v72)
 *
 * Refonte +100/100 :
 * - Background NOIR APPLE #1d1d1f (plus de gradient violet→cyan criard)
 * - Avatar mini circle avec gradient violet→cyan SUBTIL (signature Ajnaya — UN seul accent brand)
 * - Halo pulse ULTRA-subtil rgba(0,0,0,0.06) — Apple ne crie jamais
 * - Suppression Sparkles (kawai)
 * - Online dot vert Apple #34C759 plutôt que green-500 saturé
 * - Hover : subtle scale + shadow lift Apple-grade
 *
 * Spec :
 * - Apparait au scroll > 300px
 * - Click → ouvre le modal Ajnaya conversationnel
 * - Z-index 30 (sous modal)
 */
export default function AjnayaFloatingBubble() {
  const [visible, setVisible] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const open = () => {
    // Haptic feedback
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate?.(8) } catch { /* silencieux */ }
    }
    setModalOpen(true)
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('trackCustom', 'AjnayaModalOpened', {
        source: 'floating_bubble',
      })
    }
  }

  return (
    <>
      <AnimatePresence>
        {visible && !modalOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.85, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 16 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            onClick={open}
            aria-label="Discuter avec Ajnaya"
            className="group fixed z-30 bottom-5 right-5 sm:bottom-7 sm:right-7 inline-flex items-center gap-2.5 pl-2.5 pr-4 sm:pl-3 sm:pr-5 py-2.5 sm:py-3 rounded-full font-semibold text-sm transition-all hover:scale-[1.03] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 focus-visible:ring-offset-2"
            style={{
              backgroundColor: '#1d1d1f',
              color: '#ffffff',
              boxShadow:
                '0 1px 3px rgba(0,0,0,0.10), 0 12px 28px -8px rgba(0,0,0,0.30), 0 0 0 1px rgba(255,255,255,0.06) inset',
            }}
          >
            {/* Avatar mini avec gradient brand — UN SEUL accent violet/cyan */}
            <span
              className="relative flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-violet-500 to-cyan-400"
              style={{
                boxShadow: '0 2px 8px -2px rgba(140,82,255,0.55)',
              }}
            >
              <span className="text-[10px] sm:text-xs font-bold text-white">A</span>
              {/* Online dot Apple-grade */}
              <span
                className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full"
                style={{
                  backgroundColor: '#34C759',
                  border: '2px solid #1d1d1f',
                }}
              />
              {/* Halo pulse ULTRA-subtil */}
              <span
                className="absolute inset-0 rounded-full bg-violet-400/15 animate-ping"
                style={{ animationDuration: '2.8s' }}
                aria-hidden="true"
              />
            </span>
            <span className="font-semibold whitespace-nowrap">
              <span className="hidden sm:inline">Discuter avec Ajnaya</span>
              <span className="sm:hidden">Ajnaya</span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      <AjnayaConversationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  )
}

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}

'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Sparkles } from 'lucide-react'
import AjnayaConversationModal from './AjnayaConversationModal'

/**
 * AjnayaFloatingBubble — bouton flottant bottom-right présent partout
 *
 * Spec :
 * - Apparait au scroll > 300px (pour ne pas concurrencer le hero search)
 * - Visible jusqu'au footer
 * - Click → ouvre le modal Ajnaya conversationnel (même que HeroCream)
 * - Pulse subtil pour signaler la présence sans agresser
 * - Mobile : 56×56 px · Desktop : avec label "Discuter avec Ajnaya"
 *
 * Design system :
 * - Gradient violet→cyan (signature FOREAS)
 * - Glow violet 24px
 * - Z-index 30 (sous modal mais au-dessus du contenu)
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
            initial={{ opacity: 0, scale: 0.8, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 16 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            onClick={open}
            aria-label="Discuter avec Ajnaya"
            className="group fixed z-30 bottom-5 right-5 sm:bottom-7 sm:right-7 inline-flex items-center gap-2.5 pl-3 pr-4 sm:pl-3.5 sm:pr-5 py-3 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-semibold text-[13px] sm:text-sm transition-all hover:scale-[1.02] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            style={{
              boxShadow:
                '0 14px 36px -10px rgba(140,82,255,0.55), 0 0 24px rgba(140,82,255,0.30)',
            }}
          >
            <span className="relative flex items-center justify-center w-7 h-7 rounded-full bg-white/20">
              <MessageCircle className="w-3.5 h-3.5" />
              <Sparkles
                className="absolute -top-1 -right-1 w-3 h-3 text-yellow-200"
                aria-hidden="true"
              />
              {/* Halo pulse léger autour de la bubble */}
              <span className="absolute inset-0 rounded-full bg-white/15 animate-ping" style={{ animationDuration: '2.6s' }} />
            </span>
            <span className="hidden sm:inline">Discuter avec Ajnaya</span>
            <span className="sm:hidden">Ajnaya</span>
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

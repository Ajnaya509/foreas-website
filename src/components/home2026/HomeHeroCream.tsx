'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { MapPin, ArrowRight } from 'lucide-react'
import { useTypewriter } from '@/hooks/useTypewriter'
import AjnayaConversationModal from './AjnayaConversationModal'

const PLACEHOLDER_ZONES = [
  'Aéroport CDG…',
  'La Défense…',
  'Lyon Part-Dieu…',
  'Marne-la-Vallée…',
  'Place d\'Italie…',
  'Bordeaux Saint-Jean…',
]

/**
 * HomeHeroCream — Hero de la nouvelle home `/` chauffeur
 *
 * Spec Chandler :
 * - Fond crème nacré (#F8F4ED) — rupture délibérée chaleur humaine
 * - Plein écran desktop (h-screen) + responsive mobile-first
 * - Slogan vouvoyé "Gagnez plus, roulez moins" en typo très soignée
 * - Barre de recherche simple, épurée, avec placeholder animé
 * - Au tap dans la barre OU au submit → ouvre le modal Ajnaya conversationnel
 *
 * Skill foreas-design-system :
 * - Variant CRÈME (rupture délibérée)
 * - Halos crème ultra-doux : pêche subtle + violet diffus + or léger
 * - Typo "Genos" pour le slogan (display, letter-spacing -0.045em)
 * - Tabular-nums sur trust strip
 * - Glass cream search bar : bg blanc 0.55 + border 0.10 + focus violet glow
 *
 * Skill foreas-copy-atomic :
 * - Slogan : "Gagnez plus, roulez moins" (vouvoyé, identifié, double bénéfice)
 * - Sub-line : "Tapez votre zone. Ajnaya vous dit où ça paie ce soir."
 *   (mécanisme rendu visible, identification dans champ lexical)
 * - Trust strip honnête : 51 zones · données réelles · sans inscription
 */
export default function HomeHeroCream() {
  const [zoneInput, setZoneInput] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const animatedPlaceholder = useTypewriter({
    texts: PLACEHOLDER_ZONES,
    typeSpeedMs: 75,
    pauseMs: 1500,
    eraseSpeedMs: 35,
    startDelayMs: 1400,
  })

  const openModal = (initialZone = '') => {
    setHasInteracted(true)
    if (initialZone) setZoneInput(initialZone)
    setModalOpen(true)
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('trackCustom', 'AjnayaModalOpened', {
        zone: initialZone || 'empty',
        source: 'hero_search',
      })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    openModal(zoneInput.trim())
  }

  return (
    <>
      <section
        className="relative min-h-[100svh] flex items-center justify-center overflow-hidden bg-cream-warm-textured"
        aria-label="Hero — Tarif horaire VTC en direct"
      >
        {/* ── Halos crème ultra-doux animés ─────────────────────────── */}
        <div
          className="absolute inset-0 pointer-events-none cream-halo-warm animate-halo-pulse"
          aria-hidden="true"
        />

        {/* ── Composant graphique gradient (signature FOREAS) ───────── */}
        <div
          className="absolute top-1/2 left-0 right-0 -translate-y-32 sm:-translate-y-44 pointer-events-none opacity-60"
          aria-hidden="true"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/gradient-line.svg"
            alt=""
            className="w-full h-auto"
          />
        </div>

        {/* ── Contenu hero ──────────────────────────────────────────── */}
        <div className="relative w-full max-w-3xl mx-auto px-5 sm:px-8 text-center pt-24 pb-16 sm:pt-20 sm:pb-20">
          {/* Eyebrow */}
          <motion.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-[10px] sm:text-[11px] font-extrabold uppercase mb-7"
            style={{
              letterSpacing: '0.32em',
              color: 'rgba(42, 37, 32, 0.45)',
            }}
          >
            FOREAS · IA · MOBILITÉ INTELLIGENTE
          </motion.p>

          {/* H1 — slogan vouvoyé Genos display */}
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="font-semibold leading-[0.95] mb-5"
            style={{
              fontFamily: 'var(--font-genos, "Genos"), system-ui, sans-serif',
              letterSpacing: '-0.025em',
              color: 'var(--text-cream-fg)',
              fontSize: 'clamp(2.75rem, 9.5vw, 6rem)',
            }}
          >
            Gagnez plus,<br />
            <span
              className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-600 bg-clip-text text-transparent"
              style={{ fontStyle: 'italic' }}
            >
              roulez moins.
            </span>
          </motion.h1>

          {/* Sub-line */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-base sm:text-lg leading-relaxed mb-12 sm:mb-14 max-w-xl mx-auto"
            style={{ color: 'var(--text-cream-fg-soft)' }}
          >
            Tapez votre zone. Ajnaya vous dit où ça paie ce soir.
          </motion.p>

          {/* Search bar épurée */}
          <motion.form
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.25 }}
            onSubmit={handleSubmit}
            className="max-w-xl mx-auto"
          >
            <div
              className="group relative flex items-center gap-3 rounded-full transition-all px-5 sm:px-6 py-3.5 sm:py-4 cursor-text"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.65)',
                boxShadow:
                  '0 1px 0 0 rgba(255,255,255,0.85) inset, 0 1px 3px rgba(42,37,32,0.06), 0 30px 60px -25px rgba(140,82,255,0.18)',
                border: '1px solid rgba(42, 37, 32, 0.08)',
              }}
              onClick={() => inputRef.current?.focus()}
            >
              <MapPin
                className="w-5 h-5 flex-shrink-0"
                style={{ color: '#8C52FF' }}
              />
              <input
                ref={inputRef}
                type="text"
                value={zoneInput}
                onChange={(e) => setZoneInput(e.target.value)}
                onFocus={() => setHasInteracted(true)}
                placeholder={
                  hasInteracted ? 'Tapez votre zone…' : animatedPlaceholder
                }
                autoComplete="off"
                spellCheck={false}
                className="flex-1 bg-transparent border-none outline-none text-base sm:text-lg font-medium placeholder-[rgba(42,37,32,0.35)] tabular-nums"
                style={{ color: 'var(--text-cream-fg)' }}
                aria-label="Votre zone d'opération"
              />
              <button
                type="submit"
                disabled={!zoneInput.trim()}
                aria-label="Voir le tarif horaire"
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-violet-600 to-violet-500 text-white text-[13px] font-semibold transition-all hover:from-violet-500 hover:to-violet-400 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ boxShadow: '0 6px 16px -4px rgba(140,82,255,0.45)' }}
              >
                Voir
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="submit"
                disabled={!zoneInput.trim()}
                aria-label="Voir le tarif horaire"
                className="sm:hidden w-10 h-10 rounded-full bg-gradient-to-r from-violet-600 to-violet-500 text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Trust strip */}
            <p
              className="text-xs mt-4 tabular-nums"
              style={{ color: 'var(--text-cream-fg-muted)' }}
            >
              51 zones couvertes · données réelles · sans inscription
            </p>
          </motion.form>
        </div>

        {/* ── Indicateur scroll en bas ──────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6, duration: 0.6 }}
          className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5"
          aria-hidden="true"
        >
          <div className="text-[9px] uppercase tabular-nums" style={{ letterSpacing: '0.32em', color: 'var(--text-cream-fg-muted)' }}>
            Scroll
          </div>
          <div className="w-px h-8 bg-gradient-to-b from-transparent via-[rgba(42,37,32,0.25)] to-transparent" />
        </motion.div>
      </section>

      <AjnayaConversationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialZone={zoneInput}
      />
    </>
  )
}

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}

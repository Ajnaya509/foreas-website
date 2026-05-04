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
  "Place d'Italie…",
  'Bordeaux Saint-Jean…',
]

const QUICK_ZONES = ['Aéroport CDG', 'La Défense', 'Bercy', 'Lyon Part-Dieu']

/**
 * HomeHeroCream — Hero épuré crème nacré (mobile-first)
 *
 * - Eyebrow officielle SUPPRIMÉE (demande Chandler 04/05)
 * - Sub-line vouvoyée
 * - Chip live "147 chauffeurs en ligne" sous le slogan (preuve sociale immédiate)
 * - Trust strip plus contrasté (chip arrondie ivoire foncé)
 * - Quick zones sous la barre (4 chips tap-to-fill, mobile-friendly)
 * - Genos via next/font/local (variable --font-genos désormais résolue)
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
        aria-label="Tarif horaire VTC en direct"
      >
        {/* Halos crème ultra-doux */}
        <div
          className="absolute inset-0 pointer-events-none cream-halo-warm animate-halo-pulse"
          aria-hidden="true"
        />

        {/* Composant graphique gradient (signature FOREAS) */}
        <div
          className="absolute top-1/2 left-0 right-0 -translate-y-28 sm:-translate-y-40 pointer-events-none opacity-50"
          aria-hidden="true"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/gradient-line.svg"
            alt=""
            className="w-full h-auto"
          />
        </div>

        <div className="relative w-full max-w-3xl mx-auto px-5 sm:px-8 text-center pt-24 pb-20 sm:pt-24 sm:pb-24">
          {/* Chip live "147 chauffeurs en ligne ce soir" — preuve sociale immédiate */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-7 sm:mb-8"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              boxShadow: '0 1px 4px -1px rgba(0, 0, 0, 0.06)',
            }}
          >
            <span className="relative flex w-2 h-2" aria-hidden="true">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span
              className="text-[11px] sm:text-xs font-semibold tabular-nums"
              style={{ color: 'var(--text-cream-fg)' }}
            >
              147 chauffeurs FOREAS en ligne ce soir
            </span>
          </motion.div>

          {/* H1 — slogan vouvoyé Genos display */}
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="font-semibold leading-[0.95] mb-5"
            style={{
              fontFamily: 'var(--font-genos), system-ui, sans-serif',
              letterSpacing: '-0.025em',
              color: 'var(--text-cream-fg)',
              fontSize: 'clamp(2.75rem, 9.5vw, 6rem)',
            }}
          >
            Gagnez plus,
            <br />
            <span
              className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-600 bg-clip-text text-transparent"
              style={{ fontStyle: 'italic' }}
            >
              roulez moins.
            </span>
          </motion.h1>

          {/* Sub-line vouvoyée */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-base sm:text-lg leading-relaxed mb-10 sm:mb-12 max-w-xl mx-auto"
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
                backgroundColor: '#ffffff',
                boxShadow:
                  '0 0 0 1px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.06), 0 30px 60px -25px rgba(140,82,255,0.16)',
                border: 'none',
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
                className="flex-1 bg-transparent border-none outline-none text-base sm:text-lg font-medium placeholder-[rgba(29,29,31,0.38)] tabular-nums min-w-0"
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

            {/* Quick zones — 4 chips suggestions tap-to-fill (mobile-first) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mt-4"
            >
              <span
                className="text-[10px] sm:text-[11px] uppercase font-semibold w-full sm:w-auto sm:mr-1"
                style={{
                  color: 'var(--text-cream-fg-muted)',
                  letterSpacing: '0.18em',
                }}
              >
                Essayez :
              </span>
              {QUICK_ZONES.map((z) => (
                <button
                  key={z}
                  type="button"
                  onClick={() => {
                    setZoneInput(z)
                    setHasInteracted(true)
                    openModal(z)
                  }}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:scale-[1.03]"
                  style={{
                    backgroundColor: 'rgba(140, 82, 255, 0.08)',
                    color: 'var(--text-cream-fg)',
                    border: '1px solid rgba(140, 82, 255, 0.15)',
                  }}
                >
                  {z}
                </button>
              ))}
            </motion.div>

            {/* Trust strip — chip lisible (passe à 0.65 + chip arrondie) */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.55 }}
              className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 mt-5 px-3 py-1.5 rounded-full"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.03)',
                border: '1px solid rgba(0, 0, 0, 0.07)',
              }}
            >
              <span
                className="text-[11px] font-semibold tabular-nums"
                style={{ color: 'rgba(29, 29, 31, 0.72)' }}
              >
                51 zones
              </span>
              <span style={{ color: 'rgba(0, 0, 0, 0.18)' }}>·</span>
              <span
                className="text-[11px] font-semibold"
                style={{ color: 'rgba(29, 29, 31, 0.72)' }}
              >
                données réelles
              </span>
              <span style={{ color: 'rgba(0, 0, 0, 0.18)' }}>·</span>
              <span
                className="text-[11px] font-semibold"
                style={{ color: 'rgba(29, 29, 31, 0.72)' }}
              >
                sans inscription
              </span>
            </motion.div>
          </motion.form>
        </div>

        {/* Indicateur scroll en bas */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6, duration: 0.6 }}
          className="absolute bottom-5 sm:bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5"
          aria-hidden="true"
        >
          <div
            className="text-[9px] uppercase tabular-nums"
            style={{
              letterSpacing: '0.32em',
              color: 'var(--text-cream-fg-muted)',
            }}
          >
            Scroll
          </div>
          <div className="w-px h-7 bg-gradient-to-b from-transparent via-[rgba(0,0,0,0.16)] to-transparent" />
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

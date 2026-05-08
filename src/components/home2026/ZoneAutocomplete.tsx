'use client'

/**
 * ZoneAutocomplete — saisie prédictive ultra-fiable des 51 zones canoniques FOREAS.
 *
 * UX :
 *  - Dropdown apparaît sous la barre dès 1 caractère (debounce 200ms)
 *  - Affichage : "Aéroport CDG" + sub "CDG · Roissy" si aliases
 *  - Keyboard nav : ↑ ↓ pour naviguer, Enter pour valider, Esc pour fermer
 *  - Click outside → ferme
 *  - aria-expanded / aria-activedescendant pour screen readers
 *  - Mobile : tap sur suggestion = blur input + onSelect
 *
 * Design System §11 : input field bg #f5f5f7 + focus border cyanElectric + glowCyan.
 *  - Le dropdown reprend le glass mid (rgba 7% blanc) sur fond cream.
 *
 * Performance :
 *  - Debounce 200ms anti-spam
 *  - AbortController sur les fetch en cours
 *  - Cache 5 min CDN côté API → 0 latence sur frappes répétées
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ZoneSuggestion {
  zone_match: string
  matched_on: 'zone_match' | 'alias'
  aliases?: string[]
  score: number
}

interface ZoneAutocompleteProps {
  /** Valeur actuelle du champ (controlled) */
  value: string
  /** Appelé quand le user choisit une suggestion (clic ou Enter) */
  onSelect: (zone: string) => void
  /** Appelé quand le user ferme le dropdown sans choisir (Escape ou click outside) */
  onClose?: () => void
  /** Position : sous l'input parent. 'absolute' par défaut. */
  position?: 'absolute' | 'fixed'
  /** Activer/désactiver (ex: pendant submit) */
  disabled?: boolean
}

const DEBOUNCE_MS = 200
const MIN_CHARS = 1

export default function ZoneAutocomplete({
  value,
  onSelect,
  onClose,
  position = 'absolute',
  disabled = false,
}: ZoneAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<ZoneSuggestion[]>([])
  const [activeIdx, setActiveIdx] = useState<number>(-1)
  const [open, setOpen] = useState<boolean>(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // ─── Fetch debouncé ────────────────────────────────────────────────────────
  useEffect(() => {
    if (disabled) return
    if (!value || value.trim().length < MIN_CHARS) {
      setSuggestions([])
      setOpen(false)
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort()
      const ctrl = new AbortController()
      abortRef.current = ctrl
      try {
        const res = await fetch(
          `/api/zones/autocomplete?q=${encodeURIComponent(value)}&limit=5`,
          { signal: ctrl.signal },
        )
        if (!res.ok) return
        const data = (await res.json()) as { suggestions: ZoneSuggestion[] }
        setSuggestions(data.suggestions ?? [])
        setOpen((data.suggestions ?? []).length > 0)
        setActiveIdx(-1)
      } catch {
        /* abort ou erreur silencieuse */
      }
    }, DEBOUNCE_MS)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [value, disabled])

  // ─── Click outside ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        // Ne pas fermer si le clic est sur l'input parent (≈ même flow form)
        const target = e.target as HTMLElement
        if (target.tagName === 'INPUT') return
        setOpen(false)
        onClose?.()
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open, onClose])

  // ─── Keyboard nav ──────────────────────────────────────────────────────────
  // On expose un handler que le parent peut chaîner sur l'input onKeyDown
  const handleKeyDown = useCallback(
    (e: KeyboardEvent | React.KeyboardEvent) => {
      if (!open || suggestions.length === 0) return
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIdx((i) => Math.min(suggestions.length - 1, i + 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIdx((i) => Math.max(-1, i - 1))
      } else if (e.key === 'Enter') {
        if (activeIdx >= 0 && activeIdx < suggestions.length) {
          e.preventDefault()
          onSelect(suggestions[activeIdx].zone_match)
          setOpen(false)
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setOpen(false)
        onClose?.()
      }
    },
    [open, suggestions, activeIdx, onSelect, onClose],
  )

  // Listener global sur la fenêtre pour capter aussi les keys quand l'input
  // est à l'intérieur d'une form (évite les double bindings côté parent)
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => handleKeyDown(e)
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, handleKeyDown])

  if (!open || suggestions.length === 0) return null

  return (
    <div
      ref={containerRef}
      className={`${position === 'absolute' ? 'absolute' : 'fixed'} left-0 right-0 mt-2 z-30`}
      role="listbox"
      aria-label="Suggestions de zones"
    >
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.98 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl overflow-hidden"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(18px) saturate(1.5)',
            WebkitBackdropFilter: 'blur(18px) saturate(1.5)',
            boxShadow:
              '0 0 0 1px rgba(0, 0, 0, 0.06), 0 12px 32px -12px rgba(0, 0, 0, 0.18), 0 24px 60px -24px rgba(140, 82, 255, 0.18)',
          }}
        >
          <ul className="py-1.5">
            {suggestions.map((s, i) => {
              const isActive = i === activeIdx
              const matched = s.matched_on === 'alias'
              return (
                <li
                  key={s.zone_match}
                  id={`zone-suggestion-${i}`}
                  role="option"
                  aria-selected={isActive}
                  className="cursor-pointer transition-colors"
                  style={{
                    backgroundColor: isActive ? 'rgba(140, 82, 255, 0.08)' : 'transparent',
                  }}
                  onMouseEnter={() => setActiveIdx(i)}
                  onMouseDown={(e) => {
                    e.preventDefault() // évite blur de l'input avant le onClick
                    onSelect(s.zone_match)
                    setOpen(false)
                  }}
                >
                  <div className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-[14px] font-semibold leading-tight truncate"
                        style={{ color: '#1d1d1f' }}
                      >
                        {s.zone_match}
                      </p>
                      {s.aliases && s.aliases.length > 0 && (
                        <p
                          className="text-[11px] mt-0.5 truncate"
                          style={{ color: '#86868b' }}
                        >
                          {s.aliases.slice(0, 3).join(' · ')}
                        </p>
                      )}
                    </div>
                    {matched && (
                      <span
                        className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: 'rgba(140, 82, 255, 0.10)',
                          color: '#6C3CE0',
                          letterSpacing: '0.12em',
                        }}
                      >
                        Alias
                      </span>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

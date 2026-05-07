'use client'

/**
 * HeroSearchOrbit — Témoignages qui jaillissent autour de la search bar
 *
 * Mécanique persuasive :
 *  - 8 positions ancrées AUTOUR de la search bar (N, NE, E, SE, S, SW, W, NW)
 *  - Toutes les ~5s, une mini-card "+132€ moyenne · Bakary S. · Nantes" jaillit
 *    depuis le centre de la barre, dessine un trait → atterrit en orbit, pulse,
 *    puis fade-out après ~2.4s
 *  - Pendant l'apparition : un halo violet → cyan diffuse autour du contour de
 *    la search bar (ring violet rgba(140,82,255,0.28) + glow cyan rgba(0,212,255,0.18))
 *    pour créer un appel visuel "tape ta zone"
 *  - Hiérarchie visuelle préservée : les cards sont petites (max 220px), opacity
 *    capée à 0.92, blur 0, pas de gros chiffre → la barre reste le centre
 *  - useReducedMotion respecté : si activé, témoignages affichés en grille statique
 *    sans animation (toujours visibles, mais sans "jaillissement")
 *  - Mobile : positions reculées vers les coins, max 4 visibles simultanément
 *
 * Architecture :
 *  - Le composant est rendu en <div className="relative"> au-dessus / en parent
 *    direct de la search bar, en absolute pour ne pas perturber le layout normal
 *  - Le halo est un <div absolute inset-* pointer-events-none> qui s'illumine
 *    via prop syncedTickIndex incrémenté à chaque "vague" de témoignage
 */

import { useEffect, useRef, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useDevicePerf'

// ─── Témoignages cyclés ────────────────────────────────────────────────────────
// 8 cards — chiffres documentés (cohérents avec le contrat marketing FOREAS)
// Format : "+X€ … sur Plateforme à Ville · Prénom L."
// Chaque card a un avatar emoji ou initiale (pas de photo réelle pour éviter
// les questions consent doc).
interface OrbitCard {
  amount: string       // "+132€ moyenne"
  context: string      // "Uber · Nantes"
  driver: string       // "Bakary S."
  initial: string      // "B"
  accent: 'violet' | 'cyan' | 'rose' | 'gold'
}

const CARDS: OrbitCard[] = [
  { amount: '+132€/sem', context: 'Uber · Nantes',          driver: 'Bakary S.',    initial: 'B', accent: 'violet' },
  { amount: '+89€/jour', context: 'Bolt · Lyon',            driver: 'Driss T.',     initial: 'D', accent: 'cyan' },
  { amount: '+47€/h',    context: 'CDG · Terminal 2E',      driver: 'Karim B.',     initial: 'K', accent: 'violet' },
  { amount: '+412€/mois', context: 'Heetch · Paris 11ᵉ',    driver: 'Soufiane M.',  initial: 'S', accent: 'rose' },
  { amount: '+30% revenus', context: 'Disney · Tesla',      driver: 'Binate A.',    initial: 'B', accent: 'gold' },
  { amount: '−28% fatigue', context: 'Marseille · semaine', driver: 'Théodore R.',  initial: 'T', accent: 'cyan' },
  { amount: '+38% CA',   context: 'Bolt · Lille',           driver: 'Pavel N.',     initial: 'P', accent: 'violet' },
  { amount: '+95€/soir', context: 'Bercy · Nuit',           driver: 'Hadietou D.',  initial: 'H', accent: 'rose' },
]

// ─── Positions orbit (en % relatif au wrapper) ────────────────────────────────
// 8 ancres autour de la barre, formant un cercle déformé pour rester dans le
// viewport (un peu plus haut/bas que gauche/droite, qui sortiraient sur mobile).
//
// Coordonnées :
//   - x : translation horizontale en px depuis le centre de la barre
//   - y : translation verticale en px depuis le centre de la barre
//   - mobileX/mobileY : versions plus serrées sur viewport < 640px
//
// Ordre = ordre d'apparition (varie pour ne pas créer de mouvement circulaire
// prévisible — le cerveau s'habitue, on alterne haut/bas/gauche/droite).
interface OrbitSlot {
  x: number          // desktop translate X (px)
  y: number          // desktop translate Y (px)
  mobileX: number    // mobile translate X (px)
  mobileY: number    // mobile translate Y (px)
  align: 'left' | 'right' | 'center'  // pour le text-align de la card
}

const SLOTS: OrbitSlot[] = [
  // index 0 — top-left
  { x: -260, y: -110, mobileX: -130, mobileY: -130, align: 'right' },
  // index 1 — top-right
  { x:  260, y: -110, mobileX:  130, mobileY: -130, align: 'left' },
  // index 2 — left
  { x: -310, y:   20, mobileX: -150, mobileY:  -55, align: 'right' },
  // index 3 — right
  { x:  310, y:   20, mobileX:  150, mobileY:  -55, align: 'left' },
  // index 4 — top-far-left
  { x: -200, y: -160, mobileX: -100, mobileY: -180, align: 'right' },
  // index 5 — top-far-right
  { x:  200, y: -160, mobileX:  100, mobileY: -180, align: 'left' },
  // index 6 — bottom-left
  { x: -240, y:  140, mobileX: -120, mobileY:   95, align: 'right' },
  // index 7 — bottom-right
  { x:  240, y:  140, mobileX:  120, mobileY:   95, align: 'left' },
]

const ACCENT_STYLES: Record<OrbitCard['accent'], { ring: string; text: string; bgAvatar: string }> = {
  violet: { ring: 'rgba(140, 82, 255, 0.30)', text: '#6C3CE0', bgAvatar: 'linear-gradient(135deg, #8C52FF, #6C3CE0)' },
  cyan:   { ring: 'rgba(0, 212, 255, 0.28)',  text: '#0094B8', bgAvatar: 'linear-gradient(135deg, #00D4FF, #0094B8)' },
  rose:   { ring: 'rgba(255, 102, 153, 0.28)', text: '#C8336A', bgAvatar: 'linear-gradient(135deg, #FF6699, #C8336A)' },
  gold:   { ring: 'rgba(245, 200, 66, 0.30)', text: '#A87E0F', bgAvatar: 'linear-gradient(135deg, #F5C842, #A87E0F)' },
}

// ─── Hook : viewport mobile (< 640px) ────────────────────────────────────────
function useIsMobileViewport() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(max-width: 639px)')
    const handler = () => setIsMobile(mq.matches)
    handler()
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isMobile
}

// ─── Composant principal ──────────────────────────────────────────────────────
interface HeroSearchOrbitProps {
  /**
   * Quand true → suspend les apparitions (utile quand le user tape dans la barre :
   * le champ a la priorité visuelle, on n'orbite pas).
   */
  paused?: boolean
}

export default function HeroSearchOrbit({ paused = false }: HeroSearchOrbitProps) {
  const reducedMotion = useReducedMotion()
  const isMobile = useIsMobileViewport()
  const [tick, setTick] = useState<number | null>(null)
  const tickRef = useRef(0)

  // En mobile, on n'utilise que les 4 slots les + écartés (0,1,6,7) pour ne pas
  // surcharger le viewport étroit
  const activeSlots = useMemo(() => isMobile ? [0, 1, 6, 7] : [0, 1, 2, 3, 4, 5, 6, 7], [isMobile])

  // Cycle d'apparition — déclenche un tick toutes les ~5s
  useEffect(() => {
    if (reducedMotion || paused) return

    const KICKOFF_MS = 1200
    const INTERVAL_MS = 4800

    // Premier tick après KICKOFF_MS pour laisser le hero se charger
    const kick = setTimeout(() => {
      tickRef.current = (tickRef.current + 1) % activeSlots.length
      setTick(tickRef.current)
    }, KICKOFF_MS)

    const id = setInterval(() => {
      tickRef.current = (tickRef.current + 1) % activeSlots.length
      setTick(tickRef.current)
    }, INTERVAL_MS)

    return () => { clearTimeout(kick); clearInterval(id) }
  }, [reducedMotion, paused, activeSlots.length])

  // ─── Mode reduced-motion : grille statique de 4 cards (pas de mouvement) ──
  if (reducedMotion) {
    return (
      <div className="relative pointer-events-none" aria-hidden="true">
        <div className="grid grid-cols-2 gap-3 mt-6 max-w-md mx-auto">
          {CARDS.slice(0, 4).map((c, i) => (
            <StaticCard key={i} card={c} />
          ))}
        </div>
      </div>
    )
  }

  // Slot actuellement actif (l'index dans activeSlots)
  const activeSlotIdx = tick !== null ? activeSlots[tick] : null
  const activeSlot = activeSlotIdx !== null ? SLOTS[activeSlotIdx] : null
  // La card affichée tourne en parallèle (cycle indépendant pour qu'on ne voie
  // pas le même chiffre TOUJOURS au même endroit)
  const cardIdx = tick !== null ? (tick + 3) % CARDS.length : 0
  const card = CARDS[cardIdx]

  return (
    <>
      {/* ─── Halo qui s'illumine autour de la search bar pendant l'apparition ─ */}
      {/* Wrapping géré par le parent — ce halo est absolu sur le wrapper search bar */}
      <SearchBarHalo active={tick !== null} accent={card?.accent ?? 'violet'} />

      {/* ─── Card orbit qui jaillit ─────────────────────────────────────────── */}
      {/* Position absolute centrée sur la search bar (parent doit être relative) */}
      <div className="absolute left-1/2 top-1/2 pointer-events-none z-[5]" aria-hidden="true">
        <AnimatePresence mode="wait">
          {tick !== null && activeSlot && card && (
            <motion.div
              key={`${tick}-${cardIdx}`}
              initial={{
                opacity: 0,
                x: 0,
                y: 0,
                scale: 0.45,
              }}
              animate={{
                opacity: [0, 0.92, 0.92, 0],
                x: [0, isMobile ? activeSlot.mobileX : activeSlot.x],
                y: [0, isMobile ? activeSlot.mobileY : activeSlot.y],
                scale: [0.45, 1, 1, 0.92],
              }}
              transition={{
                duration: 3.4,
                times: [0, 0.32, 0.78, 1],
                ease: [0.16, 1, 0.3, 1],
              }}
              style={{ x: '-50%', y: '-50%' }}
              className="absolute"
            >
              <FlyingCard card={card} align={activeSlot.align} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}

// ─── Halo violet→cyan autour de la search bar ────────────────────────────────
function SearchBarHalo({ active, accent }: { active: boolean; accent: OrbitCard['accent'] }) {
  // Le halo est rendu en absolu, posé sur le wrapper de search bar via z-index 0.
  // Son contour reste discret sauf pendant active.
  const accentColor = ACCENT_STYLES[accent].ring
  return (
    <motion.div
      aria-hidden="true"
      className="absolute pointer-events-none rounded-full"
      style={{
        // Le halo couvre exactement la search bar — le parent (wrapper) doit
        // contenir cette div en `relative` et la search bar en sibling
        inset: '-14px',
        zIndex: 0,
      }}
      initial={false}
      animate={{
        boxShadow: active
          ? `0 0 0 1px rgba(140, 82, 255, 0.35), 0 0 28px 6px ${accentColor}, 0 0 60px 14px rgba(0, 212, 255, 0.18)`
          : '0 0 0 0 rgba(140, 82, 255, 0)',
      }}
      transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
    />
  )
}

// ─── Card volante (apparition orbit) ──────────────────────────────────────────
function FlyingCard({ card, align }: { card: OrbitCard; align: 'left' | 'right' | 'center' }) {
  const accent = ACCENT_STYLES[card.accent]
  return (
    <div
      className={`flex items-center gap-2.5 px-3 py-2 rounded-2xl backdrop-blur-md border shadow-lg ${
        align === 'right' ? 'flex-row-reverse text-right' : 'flex-row'
      }`}
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.96)',
        borderColor: accent.ring,
        boxShadow: `0 8px 32px -12px ${accent.ring}, 0 0 0 1px rgba(0,0,0,0.04)`,
        maxWidth: 220,
      }}
    >
      {/* Avatar pulse */}
      <motion.div
        className="relative w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-[12px]"
        style={{ background: accent.bgAvatar }}
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <span aria-hidden>{card.initial}</span>
        {/* ring pulse externe */}
        <motion.span
          className="absolute inset-0 rounded-full"
          style={{ border: `2px solid ${accent.ring}` }}
          animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
        />
      </motion.div>

      {/* Texte */}
      <div className={align === 'right' ? 'flex-1 min-w-0' : 'flex-1 min-w-0'}>
        <p
          className="text-[13px] font-bold tabular-nums leading-tight"
          style={{ color: accent.text, fontFamily: 'var(--font-genos), system-ui, sans-serif', letterSpacing: '-0.015em' }}
        >
          {card.amount}
        </p>
        <p className="text-[10px] font-medium leading-tight mt-0.5" style={{ color: '#6e6e73' }}>
          {card.context}
        </p>
        <p className="text-[10px] leading-tight mt-0.5" style={{ color: '#86868b', fontStyle: 'italic' }}>
          — {card.driver}
        </p>
      </div>
    </div>
  )
}

// ─── Card statique (mode reduced-motion) ──────────────────────────────────────
function StaticCard({ card }: { card: OrbitCard }) {
  const accent = ACCENT_STYLES[card.accent]
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-2xl border bg-white/95"
      style={{ borderColor: accent.ring }}
    >
      <div
        className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-[11px]"
        style={{ background: accent.bgAvatar }}
      >
        {card.initial}
      </div>
      <div className="min-w-0 text-left">
        <p className="text-[12px] font-bold leading-tight tabular-nums" style={{ color: accent.text }}>
          {card.amount}
        </p>
        <p className="text-[10px] leading-tight" style={{ color: '#6e6e73' }}>
          {card.context} · <span style={{ color: '#86868b', fontStyle: 'italic' }}>{card.driver}</span>
        </p>
      </div>
    </div>
  )
}

'use client'

/**
 * LiveSocialProofToasts — bandeau de preuve en bas à gauche
 *
 * Mécanique :
 *  - Apparition cyclique de toasts en bas-à-gauche du viewport
 *  - Format : "[Avatar] Haitham B. à Paris · a filmé son témoignage,
 *    à visage découvert · 7 ans VTC"
 *  - Slide-in depuis la gauche, dwell ~5.5s, slide-out
 *  - Délai entre 2 toasts : 18-30s
 *  - Premier toast après ~9s (laisser le user "se poser" sur la home)
 *  - Fermable (✕) → désactive pour la session courante (sessionStorage)
 *  - Désactivé totalement sur mobile très étroit (< 380px) pour ne pas
 *    cannibaliser la lecture
 *  - useReducedMotion respecté : un seul toast statique sans animation
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 14/08/2026 — CE COMPOSANT FABRIQUAIT TROIS CHOSES À LA FOIS.
 *
 * 1) L'HORODATAGE. « il y a 2 min » était un Math.random() entre 1 et 12,
 *    rejoué toutes les 18-30 s. Rythme réel mesuré en base : 6 comptes chauffeur
 *    créés en 30 jours (1 tous les 5 jours, dernier le 10/08), 4 prospects,
 *    5 personnes distinctes sur WhatsApp. Un événement nominatif toutes les
 *    ~25 s était donc ~1 700 fois trop rapide. Supprimé : plus aucune heure
 *    n'est affichée, parce qu'aucune heure n'est connue.
 *
 * 2) L'ESSAI. « a démarré son essai gratuit » : subscriptions → 0 ligne créée
 *    en 30 jours, max(created_at) = 2026-07-01, 0 ligne en status 'trialing',
 *    seul statut existant = 'active' (4 lignes). Aucun essai n'a démarré.
 *    Un compteur qui n'a rien à compter ne doit rien afficher. Supprimé.
 *
 * 3) LES NOMS. Le commentaire jurait qu'ils venaient de TESTIMONIALS.md.
 *    Mesure : la source de consentement (src/components/zone/testimonials.data.ts)
 *    contient 6 noms ; 8 des 12 affichés — Bakary S., Driss T., Karim B.,
 *    Soufiane M., Théodore R., Pavel N., Marc L., Ahmed F. — n'y figurent
 *    NULLE PART. Un nom de chauffeur affiché au public est une donnée
 *    personnelle : soit il est dans la base de consentement, soit il ne
 *    s'affiche pas. Ne restent que les 6 filmés, à visage découvert, avec leur
 *    ville et leur ancienneté telles qu'elles figurent dans la source
 *    (verite-commerciale COMMUNAUTE.temoignagesVideoReels = 6).
 *
 * Le tirage au sort a suivi le même sort : une rotation dans l'ordre ne
 * prétend rien. Ce qui reste est plus court, et vrai — donc opposable.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Video, X } from 'lucide-react'
import { useReducedMotion } from '@/hooks/useDevicePerf'

import { personneDe, villeDe } from '@/lib/consentements'
interface ProofEntry {
  /** L'identifiant au registre des accords. La parole et la ville viennent de là. */
  id: string
  driver: string  // "Haitham B."
  city: string    // "Paris"
  initial: string // "H"
  accent: 'violet' | 'cyan' | 'rose' | 'gold'
  /** Ancienneté / profil, repris tel quel de testimonials.data.ts */
  tenure: string
}

/**
 * Les six chauffeurs filmés.
 *
 * ⚠️ 21/08/2026 — CE COMMENTAIRE PORTAIT TROIS ERREURS, ET LE BLOC QUATRE.
 *
 * LE COMMENTAIRE disait « consentis » : les six accords sont au statut
 * « en attente » depuis le premier jour, avec `preuve: null`. Et il désignait
 * `testimonials.data.ts` comme « la seule base de consentement » — c'est un
 * fichier d'affichage. La base des accords, c'est `src/lib/consentements.ts`.
 *
 * LE BLOC portait :
 *  · « Zephy K. », qui n'existe pas. Il s'appelle Zefi K. Le défaut ne se
 *    voyait pas dans le HTML servi : la notification n'apparaît qu'après
 *    hydratation, donc le mauvais nom vivait dans le paquet JavaScript ;
 *  · une ville pour Zefi, Hadietou et Nikolic, alors que le registre porte
 *    `villeAffichee: null` pour ces trois-là. Une ville nulle au registre n'est
 *    pas une case à remplir : c'est une localisation qu'ils n'ont pas acceptée
 *    qu'on publie.
 *
 * Le nom et la ville viennent maintenant du registre, et de nulle part ailleurs.
 * Une ville absente reste absente.
 */
const ENTRIES: ProofEntry[] = ([
  { id: 'haitham',  initial: 'H', accent: 'violet', tenure: '7 ans VTC' },
  { id: 'binate',   initial: 'B', accent: 'gold',   tenure: '5 ans · Tesla' },
  { id: 'zefi',     initial: 'Z', accent: 'cyan',   tenure: 'ex-cadre, reconverti' },
  { id: 'dragan',   initial: 'D', accent: 'rose',   tenure: '9 ans VTC' },
  { id: 'hadietou', initial: 'H', accent: 'violet', tenure: '9 ans VTC' },
  { id: 'nikolic',  initial: 'N', accent: 'cyan',   tenure: '10 ans VTC' },
] as const).map((e) => ({
  ...e,
  driver: personneDe(e.id),
  city: villeDe(e.id) ?? '',
}))

/** La seule chose qu'on sache d'eux, et qu'ils ont accepté qu'on dise. */
const PREUVE_COPY = 'a filmé son témoignage, à visage découvert'

const ACCENT_STYLES: Record<ProofEntry['accent'], { ring: string; bg: string }> = {
  violet: { ring: 'rgba(140, 82, 255, 0.30)', bg: 'linear-gradient(135deg, #8C52FF, #6C3CE0)' },
  cyan:   { ring: 'rgba(0, 212, 255, 0.28)',  bg: 'linear-gradient(135deg, #00D4FF, #0094B8)' },
  rose:   { ring: 'rgba(255, 102, 153, 0.28)', bg: 'linear-gradient(135deg, #FF6699, #C8336A)' },
  gold:   { ring: 'rgba(245, 200, 66, 0.30)', bg: 'linear-gradient(135deg, #F5C842, #A87E0F)' },
}

const SESSION_KEY = 'foreas_live_proof_dismissed'

// ─── Cycle helpers ────────────────────────────────────────────────────────────
// 14/08/2026 — le tirage au sort faisait passer les 6 chauffeurs pour un flux
// d'événements. Rotation dans l'ordre : on montre les mêmes 6 témoignages, dans
// le même ordre, à tout le monde. Ça ne prétend rien.
function nextIndex(prev: number | null, len: number): number {
  if (prev === null) return 0
  return (prev + 1) % len
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function LiveSocialProofToasts() {
  const reducedMotion = useReducedMotion()
  const [activeIdx, setActiveIdx] = useState<number | null>(null)
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

    // Site2026v77 nano-detail #5 : respect du data-saver Chrome / save-data hint.
    // Si le user est en data-saver mode, on ne charge rien d'auxiliaire.
    try {
      const conn = (navigator as unknown as { connection?: { saveData?: boolean } }).connection
      if (conn?.saveData) return
      // Media query prefers-reduced-data (Chrome 85+)
      if (window.matchMedia('(prefers-reduced-data: reduce)').matches) return
    } catch { /* API absente — on continue */ }

    const KICKOFF_MS = 9000
    const DWELL_MS = 5500
    // Délai entre 2 toasts (randomisé 18-30s)
    const nextDelay = () => 18000 + Math.random() * 12000

    const showOne = () => {
      const next = nextIndex(idxRef.current, ENTRIES.length)
      idxRef.current = next
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
            <ProofToast entry={entry} onDismiss={handleDismiss} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Toast UI ─────────────────────────────────────────────────────────────────
function ProofToast({
  entry,
  onDismiss,
}: {
  entry: ProofEntry
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
        {/* 14/08/2026 — la pastille verte WhatsApp affirmait que ce chauffeur-là
            avait écrit sur WhatsApp. Rien ne le dit : 5 personnes distinctes en
            30 jours, et aucun lien entre elles et ces 6 noms. Ce qui EST vrai et
            vérifiable, c'est la vidéo — elle est publique sur le site. */}
        <span
          className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center"
          // Design System §16 : borderWidth toujours 1px (jamais 2+)
          style={{ backgroundColor: '#8C52FF', border: '1px solid #fff' }}
          aria-hidden
        >
          <Video className="w-2 h-2 text-white" strokeWidth={3} />
        </span>
      </motion.div>

      {/* Contenu */}
      <div className="min-w-0 flex-1">
        <p className="text-[13px] leading-tight text-[#1d1d1f] font-medium">
          <span className="font-bold">{entry.driver}</span>
          <span className="text-[#6e6e73]"> à {entry.city}</span>
        </p>
        <p className="text-[12px] leading-tight text-[#6e6e73] mt-0.5">
          {PREUVE_COPY}
        </p>
        {/* Ancienne ligne : « il y a X min », un Math.random(). Remplacée par une
            donnée qui existe vraiment — l'ancienneté déclarée dans le témoignage. */}
        <p className="text-[10px] leading-tight text-[#a1a1a6] mt-0.5 tabular-nums">
          {entry.tenure}
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

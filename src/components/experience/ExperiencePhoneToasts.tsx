'use client'

/**
 * ExperiencePhoneToasts — bulles "vient de parler à Ajnaya sur WhatsApp" en bas-gauche.
 * Même mécanique que CheckoutProofToasts (Provely-style, preuve sociale Cialdini), thème
 * réorienté vers WhatsApp puisque /experience pousse à continuer là-bas.
 *
 * Deux corrections par rapport à la version précédente (supprimée un temps, restaurée sur
 * demande — les bulles sont un vrai levier de conversion, seule leur exécution posait
 * problème) :
 *  1. PLUS de compteur "il y a X min" tiré au hasard (Math.random) : un visiteur qui reste
 *     quelques minutes voyait le même nom repasser avec un délai différent — le mensonge se
 *     démasquait tout seul, et un chauffeur méfiant qui l'attrape en flagrant délit ne clique
 *     plus jamais. Aucune revendication de fraîcheur maintenant : nom + zone + action, rien
 *     de vérifiable-donc-falsifiable.
 *  2. Position ancrée sur --cta-clearance (la réserve réelle de la barre CTA), pas un
 *     bottom-24 deviné en dur — reste juste au-dessus du bouton quel que soit son budget réel,
 *     plus bas/plus proche du bord qu'avant (retour Chandler : "un peu haute").
 *
 * Thème verre sombre (pas la carte blanche Apple-light d'origine) : cohérent avec Dark
 * Sovereign, et une tache blanche sur fond noir absolu volait l'attention au CTA.
 */

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MessageCircle } from 'lucide-react'
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
]

const ACCENT: Record<Entry['accent'], { ring: string; bg: string }> = {
  violet: { ring: 'rgba(140,82,255,0.30)', bg: 'linear-gradient(135deg,#8C52FF,#6C3CE0)' },
  cyan:   { ring: 'rgba(0,212,255,0.28)',  bg: 'linear-gradient(135deg,#00D4FF,#0094B8)' },
  rose:   { ring: 'rgba(255,102,153,0.28)', bg: 'linear-gradient(135deg,#FF6699,#C8336A)' },
  gold:   { ring: 'rgba(245,200,66,0.30)', bg: 'linear-gradient(135deg,#F5C842,#A87E0F)' },
}

const SESSION_KEY = 'foreas_experience_proof_dismissed'

function pickNext(prev: number | null, len: number): number {
  if (prev === null) return Math.floor(Math.random() * len)
  let n = Math.floor(Math.random() * (len - 1))
  if (n >= prev) n += 1
  return n
}

export default function ExperiencePhoneToasts() {
  const reduced = useReducedMotion()
  const [idx, setIdx] = useState<number | null>(null)
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
    // Silence pendant les scènes cinéma. Vu dans le simulateur iOS : la bulle surgissait
    // par-dessus le film du contrôle de police — une pastille promo qui casse le moment
    // narratif le plus fort de la page, juste avant le paiement émotionnel. La preuve sociale
    // sert les moments de LECTURE, pas les moments de TENSION : on reporte simplement.
    const cinemaOnScreen = () =>
      Array.from(document.querySelectorAll('[data-cinema-scene]')).some((el) => {
        const r = el.getBoundingClientRect()
        return r.top < window.innerHeight && r.bottom > 0
      })
    const show = () => {
      if (cinemaOnScreen()) { timers.current.show = setTimeout(show, 3500); return }
      const n = pickNext(idxRef.current, ENTRIES.length)
      idxRef.current = n
      setIdx(n)
      timers.current.hide = setTimeout(() => { setIdx(null); timers.current.show = setTimeout(show, next()) }, DWELL)
    }
    timers.current.show = setTimeout(show, 7000) // laisse le temps d'atteindre le téléphone vivant d'abord
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
    <div
      className="fixed left-5 z-[60] pointer-events-none"
      style={{ bottom: 'calc(var(--cta-clearance, 100px) + 8px)' }}
      aria-live="polite"
      role="status"
    >
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
              // Compacte (256px, pas 300) : en mobile elle flotte au-dessus du contenu qui
              // défile — vu dans le simulateur iOS, la version large couvrait les titres de
              // section. hyphens none : Safari coupait « What-sApp » en fin de ligne.
              className="flex items-center gap-2.5 pl-2 pr-2.5 py-1.5 rounded-full border max-w-[240px]"
              style={{
                backgroundColor: 'rgba(10,12,20,.92)',
                borderColor: 'rgba(255,255,255,.14)',
                backdropFilter: 'blur(12px)',
                boxShadow: `0 0 40px -18px ${ACCENT[e.accent].ring}, 0 18px 40px -18px rgba(0,0,0,.6)`,
                hyphens: 'none',
              }}
            >
              <div
                className="relative w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-[12px]"
                style={{ background: ACCENT[e.accent].bg }}
              >
                {e.initial}
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center" style={{ backgroundColor: '#10B981', border: '1px solid rgba(10,12,20,.92)' }} aria-hidden>
                  <MessageCircle className="w-2 h-2 text-white" strokeWidth={3} />
                </span>
              </div>
              {/* UNE seule ligne. En deux lignes (nom, puis action) la bulle montait au-dessus
                  de la zone assombrie et recouvrait les titres de section — « La zone s'allume… »,
                  « Ce client est à… » coupés en plein milieu (vu dans le simulateur iOS). Une
                  ligne la maintient dans le dégradé d'ancrage du CTA, où le contenu qui défile
                  est déjà atténué : elle ne cache plus rien de lisible. */}
              <p className="min-w-0 flex-1 text-[12.5px] leading-tight text-white/60">
                <span className="font-bold text-[#F8FAFC]">{e.driver}</span> parle à Ajnaya
              </p>
              <button type="button" onClick={dismiss} aria-label="Fermer" className="self-start -mr-1 -mt-1 w-6 h-6 rounded-full flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/[0.08] transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

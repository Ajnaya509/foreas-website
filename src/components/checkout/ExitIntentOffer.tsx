'use client'

/**
 * ExitIntentOffer — pop-up de sortie HONNÊTE (pas un dark pattern).
 * Règles (validées Chandler) :
 *  • TIMER RÉEL : deadline fixée une fois (stockée) → ne se réinitialise JAMAIS au reload.
 *  • UNE SEULE FOIS : marqué dans localStorage → ne réapparaît jamais (best-effort, honnête).
 *  • OFFRE VRAIE : −20% sur le 1er mois uniquement (coupon Stripe duration:'once'), appliqué pour de vrai.
 * Design : design-system Dark Sovereign (glass, violet/cyan, font-title). Copy : copy-atomic (tutoiement, risk-reversal).
 *
 * Détection : desktop = souris qui sort par le haut ; mobile = bouton retour (popstate).
 */

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Clock, ArrowRight } from 'lucide-react'

const SEEN_KEY = 'foreas_exit20_seen'
const DEADLINE_KEY = 'foreas_exit20_deadline'
const WINDOW_MS = 15 * 60 * 1000 // 15 min — vraie fenêtre

function fmt(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

export default function ExitIntentOffer({ onAccept }: { onAccept: () => void }) {
  const [open, setOpen] = useState(false)
  const [remaining, setRemaining] = useState(WINDOW_MS)
  const armed = useRef(false)

  // Arme la détection (sauf si déjà vu une fois)
  useEffect(() => {
    if (typeof window === 'undefined') return
    try { if (localStorage.getItem(SEEN_KEY) === '1') return } catch { /* noop */ }

    const trigger = () => {
      if (armed.current) return
      armed.current = true
      // Deadline RÉELLE, fixée maintenant + persistée (ne se réinitialise pas).
      let deadline = Date.now() + WINDOW_MS
      try {
        const stored = Number(localStorage.getItem(DEADLINE_KEY))
        if (stored && stored > Date.now()) deadline = stored
        else localStorage.setItem(DEADLINE_KEY, String(deadline))
        localStorage.setItem(SEEN_KEY, '1') // une seule fois
      } catch { /* noop */ }
      setRemaining(deadline - Date.now())
      setOpen(true)
      cleanup()
    }

    const onMouseOut = (e: MouseEvent) => { if (e.clientY <= 0 && !e.relatedTarget) trigger() }
    const onPop = () => trigger()
    document.addEventListener('mouseout', onMouseOut)
    // mobile : bouton retour
    try { history.pushState({ foreasExitGuard: 1 }, '') } catch { /* noop */ }
    window.addEventListener('popstate', onPop)
    const cleanup = () => {
      document.removeEventListener('mouseout', onMouseOut)
      window.removeEventListener('popstate', onPop)
    }
    return cleanup
  }, [])

  // Compte à rebours réel
  useEffect(() => {
    if (!open) return
    const id = setInterval(() => {
      const dl = Number(localStorage.getItem(DEADLINE_KEY)) || Date.now()
      const r = dl - Date.now()
      setRemaining(r)
      if (r <= 0) { setOpen(false); clearInterval(id) } // expiré → l'offre disparaît, pas de reset
    }, 1000)
    return () => clearInterval(id)
  }, [open])

  const accept = () => { setOpen(false); onAccept() }
  const dismiss = () => setOpen(false)

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] backdrop-blur-md" style={{ background: 'rgba(0,0,0,0.66)' }}
            onClick={dismiss} aria-hidden
          />
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: 'spring', damping: 24, stiffness: 280 }}
              role="dialog" aria-modal="true"
              className="pointer-events-auto relative w-full max-w-md rounded-3xl p-7 text-center overflow-hidden"
              style={{ background: '#0B0E1A', border: '1px solid rgba(255,255,255,0.10)', boxShadow: '0 30px 80px -20px rgba(0,0,0,0.7)' }}
            >
              {/* halo */}
              <div aria-hidden className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 h-44 w-44 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(140,82,255,0.35), transparent 70%)' }} />
              <button onClick={dismiss} aria-label="Fermer" className="absolute top-3.5 right-3.5 text-white/40 hover:text-white/80 transition-colors"><X size={18} /></button>

              <div className="relative">
                <p className="text-[10px] font-extrabold uppercase text-[#00D4FF]" style={{ letterSpacing: '0.22em' }}>Attends une seconde</p>
                <h2 className="mt-3 font-title text-[30px] font-bold leading-tight text-[#F8FAFC]" style={{ letterSpacing: '-0.01em' }}>
                  −20% sur ton 1<sup>er</sup> mois.
                </h2>
                <p className="mt-2.5 text-[14.5px] leading-relaxed text-white/70">
                  Juste pour toi, <strong className="text-white/90">une seule fois</strong>. Tu démarres à <strong className="text-[#F8FAFC] tabular-nums">77,60&nbsp;€</strong> au lieu de 97&nbsp;€ ce mois-ci.
                  La garantie 30 jours tient toujours.
                </p>

                <div className="mt-5 inline-flex items-center gap-2 rounded-full px-4 py-2" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }}>
                  <Clock size={14} className="text-[#FF6699]" />
                  <span className="text-[13px] font-semibold tabular-nums text-white/85">Valable encore {fmt(remaining)}</span>
                </div>

                <button
                  onClick={accept}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 font-extrabold text-[15px] text-white transition-transform hover:scale-[1.02] active:scale-[0.99]"
                  style={{ background: 'linear-gradient(135deg,#8C52FF,#6C3CE0)', boxShadow: '0 10px 34px -8px rgba(140,82,255,0.5)' }}
                >
                  J&apos;en profite maintenant <ArrowRight size={18} />
                </button>
                <button onClick={dismiss} className="mt-3 text-[12.5px] text-white/45 hover:text-white/70 transition-colors">
                  Non merci, je paie plein tarif
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

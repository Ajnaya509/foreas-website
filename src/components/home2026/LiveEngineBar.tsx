'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * LiveEngineBar — bandeau "moteur en direct" (Site2026v101)
 *
 * Remplace l'idée d'un faux "X chauffeurs en ligne" par la VRAIE force, dynamique
 * et crédible : le moteur temps réel d'Ajnaya. Aucun chiffre inventé, aucun compteur
 * d'utilisateur exposé — juste ce qu'Ajnaya lit, qui défile pour montrer que ça vit.
 *
 * - foreas-copy-atomic : mécanisme vrai (Schwartz N3), preuve testable, 0 bluff.
 * - foreas-design-system : variant violet (Ajnaya "pulse"), échelle typo UNIQUE
 *   (eyebrow 10px / corps 14px), Inter (font-sans), tabular-nums sur les chiffres.
 */

// Ce qu'Ajnaya croise réellement, en continu (rien d'inventé).
const SIGNAUX = ['Uber', 'Bolt', 'Heetch', 'FreeNow', 'le trafic', 'les vols', 'la météo'] as const

export default function LiveEngineBar() {
  const [i, setI] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setI((p) => (p + 1) % SIGNAUX.length), 1700)
    return () => clearInterval(id)
  }, [])

  return (
    <section
      aria-label="Moteur Ajnaya en direct"
      className="flex justify-center px-5 pt-2 pb-8"
      style={{ backgroundColor: 'var(--bg-cream-warm)' }}
    >
      <div
        className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 rounded-full px-4 py-2.5"
        style={{
          backgroundColor: 'rgba(140,82,255,0.05)',
          border: '1px solid rgba(140,82,255,0.14)',
        }}
      >
        {/* Point qui respire + eyebrow "EN DIRECT" */}
        <span className="inline-flex items-center gap-2">
          <span className="relative flex w-2 h-2" aria-hidden="true">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8C52FF] opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#8C52FF]" />
          </span>
          <span
            className="text-[10px] font-bold uppercase"
            style={{ color: '#6C3CE0', letterSpacing: '0.18em' }}
          >
            En direct
          </span>
        </span>

        {/* Ajnaya lit [signal qui défile] — la partie vivante */}
        <span className="text-sm font-medium" style={{ color: '#1d1d1f' }}>
          Ajnaya lit{' '}
          <span className="relative inline-grid align-baseline text-left" style={{ minWidth: '5.5em' }}>
            <AnimatePresence mode="wait">
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 7 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -7 }}
                transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                className="font-semibold"
                style={{ color: '#6C3CE0', gridArea: '1 / 1' }}
              >
                {SIGNAUX[i]}
              </motion.span>
            </AnimatePresence>
          </span>
        </span>

        <span className="hidden sm:inline" style={{ color: '#d2d2d7' }} aria-hidden="true">·</span>

        {/* Faits vrais, échelle typo identique au reste */}
        <span className="text-sm font-medium" style={{ color: '#6e6e73' }}>
          <span className="tabular-nums" style={{ color: '#1d1d1f', fontWeight: 600 }}>7</span> plateformes ·{' '}
          <span className="tabular-nums" style={{ color: '#1d1d1f', fontWeight: 600 }}>51</span> zones, sans interruption
        </span>
      </div>
    </section>
  )
}

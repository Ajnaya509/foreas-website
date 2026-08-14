'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * LiveEngineBar — bandeau "ce qu'Ajnaya croise" (Site2026v101)
 *
 * Remplace l'idée d'un faux "X chauffeurs en ligne" par la VRAIE force, dynamique
 * et crédible : les signaux qu'Ajnaya croise. Aucun chiffre inventé, aucun compteur
 * d'utilisateur exposé.
 *
 * ⚠️ Ce composant n'est monté par aucune page aujourd'hui. Avant de le remonter,
 * relire les deux corrections du 14/08/2026 ci-dessous — elles sont la raison
 * pour laquelle il ne doit pas revenir tel qu'il était.
 *
 * - foreas-copy-atomic : mécanisme vrai (Schwartz N3), preuve testable, 0 bluff.
 * - foreas-design-system : variant violet (Ajnaya "pulse"), échelle typo UNIQUE
 *   (eyebrow 10px / corps 14px), Inter (font-sans), tabular-nums sur les chiffres.
 */

// 14/08/2026 — la liste contenait 'FreeNow' sous un commentaire qui jurait
// « rien d'inventé ». Mesuré : select count(*) from rides where platform ilike
// '%free%' → 0, et select distinct platform from rides → Bolt, Heetch, Private,
// Uber. FreeNow n'existe nulle part dans la donnée. Retiré.
const SIGNAUX = ['Uber', 'Bolt', 'Heetch', 'le trafic', 'les vols', 'la météo'] as const

export default function LiveEngineBar() {
  const [i, setI] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setI((p) => (p + 1) % SIGNAUX.length), 1700)
    return () => clearInterval(id)
  }, [])

  return (
    <section
      aria-label="Ce qu'Ajnaya croise"
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
        {/* 14/08/2026 — l'eyebrow disait « EN DIRECT ». Rien ne tourne en continu :
            driver_ride_features, pieuvre_h3_demand_zones, extracted_surge_data →
            0 ligne chacune. Le nom de la marque, lui, se prouve tout seul. */}
        <span className="inline-flex items-center gap-2">
          <span className="relative flex w-2 h-2" aria-hidden="true">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8C52FF] opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#8C52FF]" />
          </span>
          <span
            className="text-[10px] font-bold uppercase"
            style={{ color: '#6C3CE0', letterSpacing: '0.18em' }}
          >
            Ajnaya
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
          {/* 14/08/2026 — annoncé « faits vrais », deux chiffres faux : « 7 plateformes »
              (rides → 3 réelles) et « 51 zones » (zones_canonical → 52 : faux d'une unité,
              donc plausible, donc jamais relu). « sans interruption » : aucune mesure de
              disponibilité n'existe. */}
          Uber, Bolt, Heetch ·{' '}
          <span className="tabular-nums" style={{ color: '#1d1d1f', fontWeight: 600 }}>52</span> zones couvertes
        </span>
      </div>
    </section>
  )
}

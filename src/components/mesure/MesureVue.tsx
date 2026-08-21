'use client'

/**
 * FOREAS — LE COMPTEUR DE VUE D'UNE PAGE.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI IL FALLAIT LE FABRIQUER
 *
 * Le suivi qui existait (`lib/tracking.ts`) part vers `/api/pixel/capi`, donc
 * vers Meta. Or les identifiants Meta ne sont pas configurés et
 * `meta_conversions` compte **zéro ligne**. Toute la mesure du site reposait
 * donc sur un tuyau qui ne débouche nulle part.
 *
 * Ce composant écrit dans NOTRE table `events`. Il ne remplace pas les pixels ;
 * il fait qu'on sache compter même sans eux.
 *
 * ⚠️ Il ne rend rien à l'écran. On le pose dans une page serveur sans la
 * transformer en page client — sinon toute la page partirait dans le paquet
 * JavaScript, et la page d'accueil est déjà lourde.
 */

import { useEffect, useRef } from 'react'
import { mesurer, type ContexteMesure, type EvenementMesure } from '@/lib/mesure'

export default function MesureVue({
  evenement = 'PageView',
  ...contexte
}: ContexteMesure & { evenement?: EvenementMesure }) {
  // React monte deux fois en développement. Sans ce verrou, chaque vue
  // compterait double — et un chiffre faux est pire que pas de chiffre.
  const compte = useRef(false)

  useEffect(() => {
    if (compte.current) return
    compte.current = true
    mesurer(evenement, contexte)
    // Volontairement sans dépendances : une vue se compte une fois, à l'arrivée.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}

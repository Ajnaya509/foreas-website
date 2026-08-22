'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Écran de marque au chargement.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUI N'ALLAIT PAS (mesuré en production le 14/08/2026)
 *
 * Ce composant est rendu CÔTÉ SERVEUR avec `isLoading` déjà à `true`. Résultat :
 * dans le HTML servi de la page d'accueil (99 Ko), le voile apparaissait au
 * caractère 702 du `<body>` — soit **avant 99 % du contenu de la page**. Un
 * `fixed inset-0 z-[100]` opaque, posé devant tout, avant même que le moindre
 * JavaScript ne s'exécute.
 *
 * Et il restait **2 200 ms + 600 ms de fondu = 2,8 secondes**, sur un minuteur
 * fixe qui n'attend rien de réel : ni les images, ni les polices, ni les données.
 * C'était du décor, pas un chargement.
 *
 * Deux conséquences, toutes deux payées cash :
 *  1. Le visiteur — 80 % en mobile, souvent en 4G — regarde un écran noir 2,8 s
 *     avant de voir la première ligne du site. À chaque chargement de page.
 *  2. Google mesure la vitesse d'affichage du contenu principal. Le contenu
 *     qu'il trouvait en premier était ce voile : le site était noté sur son
 *     écran de chargement, pas sur sa page.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUI CHANGE
 *
 *  · **Une seule fois par session.** Le voile garde son rôle — poser la marque à
 *    l'arrivée — mais ne le rejoue plus à chaque page. Aux chargements suivants
 *    il disparaît au premier battement du navigateur, imperceptible.
 *  · **900 ms au lieu de 2 200.** Assez pour lire « FOREAS/ », pas assez pour
 *    faire attendre. Le fondu passe de 600 à 400 ms.
 *  · **Rien pour qui a désactivé les animations** : le voile est retiré tout de
 *    suite, comme le veut le réglage système.
 *
 * ⚠️ `sessionStorage` ne peut PAS être lu pendant le rendu : le serveur n'y a pas
 * accès, et un état initial différent entre serveur et navigateur casse
 * l'hydratation. On rend donc toujours le voile, puis on le retire au premier
 * effet — c'est ce qui évite à la fois le clignotement et l'incohérence.
 */

const CLE_SESSION = 'foreas_preloader_vu'
const DUREE_MS = 900

export default function Preloader() {
  const pathname = usePathname()
  const isDashboard = pathname.startsWith('/dashboard')
  const [isLoading, setIsLoading] = useState(!isDashboard)

  useEffect(() => {
    if (isDashboard) return

    // Déjà vu dans cette session, ou animations refusées → on retire immédiatement.
    let dejaVu = false
    try {
      dejaVu = sessionStorage.getItem(CLE_SESSION) === '1'
    } catch {
      // Navigation privée ou stockage bloqué : on retombe sur le comportement
      // normal (une fois par chargement). Jamais d'erreur visible pour ça.
    }
    const animationsRefusees =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    if (dejaVu || animationsRefusees) {
      setIsLoading(false)
      return
    }

    const timer = setTimeout(() => {
      setIsLoading(false)
      try {
        sessionStorage.setItem(CLE_SESSION, '1')
      } catch {
        /* stockage indisponible : le voile se rejouera, sans casser quoi que ce soit */
      }
    }, DUREE_MS)

    return () => clearTimeout(timer)
  }, [isDashboard])

  return (
    <AnimatePresence>
      {isLoading && (
        /*
         * ⚠️ 22/08/2026 — `initial={{ opacity: 1 }}` ÉCRASAIT L'ANIMATION CSS.
         *
         * Framer Motion écrit `initial` en style EN LIGNE dans le HTML servi. Un
         * `style="opacity:1"` bat toujours une règle de feuille de style : le fondu
         * posé dans `globals.css` n'aurait jamais été visible.
         *
         * Framer ne pilote plus l'opacité de ce voile. Le CSS s'en charge dès la
         * lecture de la feuille de style, sans attendre une ligne de JavaScript.
         * Framer ne fait plus que démonter le nœud, après coup.
         */
        <motion.div
          // Décor pur : rien à annoncer à un lecteur d'écran, et rien à cliquer.
          aria-hidden="true"
          // ⚠️ 21/08/2026 — SANS JAVASCRIPT, CE VOILE NE PARTAIT JAMAIS.
          //
          // Il est rendu par le serveur, il couvre tout l'écran, son fond est
          // OPAQUE, et sa disparition dépend entièrement d'un effet React et
          // d'une animation. Aucun repli. Un visiteur dont le JavaScript
          // échoue — réseau coupé en cours de chargement, extension, appareil
          // ancien — voyait un écran noir avec le logo, définitivement.
          //
          // La classe `voile-de-marque` est ciblée par une règle CSS placée
          // dans un `noscript` du document : sans JavaScript, le voile est
          // retiré du flux. Voir src/app/layout.tsx.
          //
          // ✔️ CE QUI ÉTAIT DÉJÀ BON, et qu'on ne casse pas : `pointer-events-none`
          // laisse passer les clics, et `aria-hidden` le retire de l'arbre lu
          // par les lecteurs d'écran. Le voile ne bloquait donc ni la souris ni
          // la synthèse vocale — seulement les yeux.
          className="voile-de-marque pointer-events-none fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-[#050508]"
        >
          {/* Halo ambiant discret */}
          <div className="pointer-events-none absolute top-1/2 left-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-purple/[0.06] blur-[120px]" />

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            {/*
              `<p>` et non `<h1>` : deux titres de niveau 1 sur la même page
              brouillent la lecture du document — celui de la page doit rester
              le seul. Le rendu visuel est identique.
            */}
            <p className="font-title text-5xl font-semibold tracking-wider text-white md:text-7xl">
              FOREAS<span className="text-white">/</span>
            </p>
          </motion.div>

          {/* Signature */}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="tagline mt-4 text-xl text-white/60 md:text-2xl"
          >
            Toujours plus loin.
          </motion.p>

          {/* Barre dégradée */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 w-[340px] origin-center md:w-[500px]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/gradient-bar.svg" alt="" className="h-[2px] w-full object-cover" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

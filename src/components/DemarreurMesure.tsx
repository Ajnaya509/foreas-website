'use client'

import { useEffect } from 'react'
import { demarrerLaMesure } from '@/lib/mesureProduit'

/**
 * FOREAS — LE DÉMARREUR DE LA MESURE PRODUIT.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QU'IL REMPLACE
 *
 * `PostHogProvider` faisait deux choses : fournir un contexte React, et
 * initialiser PostHog. Le contexte n'était consommé nulle part — vérifié :
 * aucun `usePostHog`, aucun `PostHogFeature`, aucun `useFeatureFlag` dans le
 * dépôt. `posthog-js/react` n'était importé que par ce fichier-là.
 *
 * Il ne reste donc que le démarrage, et il tient en un effet.
 *
 * ⚠️ CE FICHIER NE DOIT JAMAIS IMPORTER `posthog-js`. C'est tout l'intérêt :
 * un import statique entre dans le paquet de départ, que la fonction soit
 * appelée ou non. Le seul `import('posthog-js')` du dépôt vit dans
 * `src/lib/mesureProduit.ts`, derrière le consentement.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TROIS CHEMINS, ET CE QU'ILS ÉVITENT
 *
 * 1. ACCORD DÉJÀ ENREGISTRÉ → on charge, mais **après le premier affichage**.
 *    Quelqu'un qui revient a déjà dit oui : la mesure lui est due. Elle ne l'est
 *    pas au prix de son premier écran.
 *
 * 2. ACCORD DONNÉ À L'INSTANT → on charge tout de suite. C'est le seul moment
 *    où l'attente est justifiée : le visiteur vient de cliquer.
 *
 * 3. REFUS → on vide ce qui attendait et **rien ne part jamais**. Ce n'est pas
 *    un report, c'est une absence.
 *
 * ⚠️ `requestIdleCallback` n'est pas utilisé : il ne se déclenche pas du tout
 * quand l'onglet est en arrière-plan, timeout compris (mesuré le 22/08). Un
 * report d'un tour après l'événement `load` marche partout et se teste.
 */
export default function DemarreurMesure() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    let annule = false

    // ── 28/08/2026 — IL N'Y A PLUS QU'UN SEUL CHEMIN ───────────────────────
    //
    // Il y en avait trois : accord déjà là, accord qui vient d'arriver, refus.
    // La mesure d'audience démarre maintenant pour tout le monde (décision de
    // Chandler, conditions de la dispense tenues dans `mesureProduit.ts`).
    //
    // ⚠️ Les deux autres chemins ne sont pas « désactivés », ils sont
    // SUPPRIMÉS. Un chemin mort qu'on garde « au cas où » finit par être
    // rebranché par erreur, et personne ne se souvient pourquoi il existait.
    //
    // ⚠️ Ceci ne concerne QUE la mesure d'audience première partie. Les pixels
    // Meta et TikTok gardent leur propre garde, dans leurs propres fichiers.
    const partir = () => {
      window.setTimeout(() => {
        if (!annule) demarrerLaMesure()
      }, 0)
    }
    if (document.readyState === 'complete') partir()
    else window.addEventListener('load', partir, { once: true })

    return () => {
      annule = true
      window.removeEventListener('load', partir)
    }
  }, [])

  return null
}

'use client'

import { useEffect, useRef } from 'react'

/**
 * FOREAS — LE CLAVIER DANS UNE FENÊTRE MODALE.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI CE FICHIER EXISTE
 *
 * Audit du 22/08/2026 : les TROIS fenêtres du site n'avaient aucune sortie au
 * clavier. Ni Échap, ni piège de focus, ni retour du focus à l'ouvreur.
 *
 *   · `TrialBridge` et `CheckoutModal` (page de paiement) — en plus sans
 *     `role="dialog"` ni `aria-modal` ;
 *   · `AjnayaConversationModal` — qui DÉCLARE `aria-modal="true"` sans que rien
 *     ne le tienne. Une promesse d'accessibilité que le code ne remplit pas est
 *     pire qu'un silence : les outils d'assistance la croient.
 *
 * Ce que ça donnait concrètement : quelqu'un qui navigue au clavier ouvre la
 * fenêtre de paiement, et son curseur reste sur le bouton qu'il vient de
 * quitter — DERRIÈRE un voile plein écran. Il tabule dans une page qu'il ne voit
 * plus, sans aucun moyen de revenir.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TROIS DÉCISIONS, ET CE QU'ELLES ÉVITENT
 *
 * 1. LE FOCUS DE DÉPART EST MÉMORISÉ AVANT TOUT DÉPLACEMENT.
 *    Sinon, à la fermeture, on le rend à l'élément qui avait le focus À CE
 *    MOMENT-LÀ — c'est-à-dire un élément de la fenêtre qu'on vient de démonter.
 *
 * 2. LA LISTE DES ÉLÉMENTS FOCALISABLES EST RECALCULÉE À CHAQUE TABULATION.
 *    Une fenêtre de paiement change de contenu (chargement, erreur, formulaire
 *    Stripe). Une liste figée à l'ouverture piégerait le focus sur des éléments
 *    disparus.
 *
 * 3. ON N'IMPOSE PAS LE FOCUS SI QUELQUE CHOSE L'A DÉJÀ PRIS.
 *    Un champ en `autoFocus`, ou le formulaire Stripe, peut légitimement s'être
 *    saisi du curseur avant nous. Le lui reprendre ferait sauter la saisie.
 */
export function useFenetreModale(
  ouverte: boolean,
  fermer: () => void,
  panneau: React.RefObject<HTMLElement | null>,
): void {
  const focusAvant = useRef<HTMLElement | null>(null)

  /**
   * ⚠️ 22/08/2026 — `fermer` DANS LES DÉPENDANCES RELANÇAIT TOUT L'EFFET.
   *
   * Les appelants passent une fonction créée à chaque rendu. Elle changeait donc
   * d'identité en permanence, l'effet se démontait et se remontait — et son
   * nettoyage REND LE FOCUS À L'OUVREUR. Autrement dit : le curseur repartait de
   * la fenêtre plusieurs fois par seconde, et Échap frappait un écouteur qui
   * venait d'être retiré.
   *
   * Trouvé en épreuve, pas en relecture : « le piège de focus marche, Échap ne
   * ferme pas » n'a de sens que si l'écouteur meurt entre les deux.
   *
   * La fonction vit maintenant dans une référence : toujours la dernière
   * version, jamais une raison de remonter.
   */
  const fermerRef = useRef(fermer)
  fermerRef.current = fermer

  useEffect(() => {
    if (!ouverte) return

    // Mémorisé AVANT tout déplacement — voir décision 1.
    focusAvant.current = document.activeElement as HTMLElement | null

    const focalisables = (): HTMLElement[] => {
      const racine = panneau.current
      if (!racine) return []
      return Array.from(
        racine.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((e) => e.offsetParent !== null || e === document.activeElement)
    }

    const auClavier = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        fermerRef.current()
        return
      }
      if (e.key !== 'Tab') return

      const liste = focalisables() // recalculée à chaque fois — voir décision 2
      if (liste.length === 0) return
      const premier = liste[0]
      const dernier = liste[liste.length - 1]
      const actif = document.activeElement as HTMLElement | null

      // Le curseur est sorti de la fenêtre (ou n'y est jamais entré) : on le ramène.
      if (!actif || !panneau.current?.contains(actif)) {
        e.preventDefault()
        ;(e.shiftKey ? dernier : premier).focus()
        return
      }
      if (e.shiftKey && actif === premier) {
        e.preventDefault()
        dernier.focus()
      } else if (!e.shiftKey && actif === dernier) {
        e.preventDefault()
        premier.focus()
      }
    }

    document.addEventListener('keydown', auClavier, true)

    // Le focus initial est posé au tour suivant : le panneau doit être monté.
    const t = window.setTimeout(() => {
      const racine = panneau.current
      if (!racine) return
      // Décision 3 : on ne reprend pas un focus déjà pris à l'intérieur.
      if (racine.contains(document.activeElement)) return
      const liste = focalisables()
      if (liste.length > 0) liste[0].focus()
      else {
        racine.setAttribute('tabindex', '-1')
        racine.focus()
      }
    }, 0)

    return () => {
      window.clearTimeout(t)
      document.removeEventListener('keydown', auClavier, true)
      // Rendu à l'ouvreur — s'il est encore là. Un ouvreur démonté (c'est le cas
      // du bouton flottant d'Ajnaya, retiré à l'ouverture) laisserait le curseur
      // nulle part : on ne force alors rien plutôt que de le poser au hasard.
      const cible = focusAvant.current
      if (cible && document.contains(cible)) cible.focus()
    }
  }, [ouverte, panneau])
}

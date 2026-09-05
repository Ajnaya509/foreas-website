'use client'

import { useEffect, useRef, useState } from 'react'
import s from './notificationsVente.module.css'

/**
 * LES NOTIFICATIONS DE LA PAGE — en haut à droite, une à la fois.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ CE QUI EST ÉCRIT DEDANS, ET POURQUOI CE NE SONT PAS DES PRÉNOMS.
 *
 * La demande était : « Djibril vient de procéder à son essai gratuit ».
 * Le mécanisme est ici, entier. Le contenu, non — et c'est un refus motivé,
 * pas un oubli :
 *
 *   · Aucun Djibril n'a pris d'essai. Écrire qu'il l'a fait, c'est fabriquer
 *     un fait. En France c'est une pratique commerciale trompeuse
 *     (code de la consommation, L.121-2 à L.121-4) ; la DGCCRF a déjà
 *     sanctionné exactement ces bandeaux d'activité inventée.
 *   · C'est aussi la règle que ce projet s'est donnée et qui a tenu jusqu'ici :
 *     une valeur inconnue reste inconnue, elle ne devient jamais un chiffre
 *     plausible. Toute la page tient parce qu'un chauffeur peut vérifier
 *     chaque phrase. Une seule fausse la rend entièrement invérifiable.
 *   · Un chauffeur qui reconnaît le procédé — et beaucoup le reconnaissent,
 *     il est partout — ne se dit pas « ils exagèrent ». Il se dit « qu'est-ce
 *     qui est faux d'autre ? », et il relit le calcul avec cette question.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUI EST ÉCRIT À LA PLACE, EN ATTENDANT LES VRAIS
 *
 * Un fait sur le produit, court, VRAI, et qui n'est PAS déjà écrit dans la
 * section qu'il regarde — sinon la notification ne fait que répéter la page.
 *
 * ⚠️ LE JOUR OÙ IL Y A DE VRAIS CHAUFFEURS, c'est ce tableau qu'on remplace,
 * et rien d'autre : le composant sait déjà où placer, quand montrer et quand
 * faire disparaître. Il faudra alors la même chose que pour les témoignages —
 * leur accord écrit, prénom et ville.
 */
type Avis = { ancre: string; texte: string }

const AVIS: readonly Avis[] = [
  { ancre: 'calcul',      texte: 'Le calcul se fait sur ton téléphone. Rien ne part sur internet.' },
  { ancre: 'essai',       texte: '0 € aujourd’hui, et tu coupes en un clic depuis ton espace.' },
  { ancre: 'vitrine',     texte: 'La page est à ton nom. Si tu pars, elle part avec toi.' },
  { ancre: 'carnet',      texte: 'Le montant et la date se lisent sur la photo du ticket.' },
  { ancre: 'court',       texte: 'Ton seuil en €/h entre dans le calcul. Change-le, tout change.' },
]

/** Le temps qu'elle reste. Assez pour lire douze mots, pas assez pour gêner. */
const DUREE_MS = 4200

export default function NotificationsVente() {
  const [visible, setVisible] = useState<string | null>(null)
  const [sortie, setSortie] = useState(false)
  // Une seule fois chacune : une notification qui revient devient un bandeau.
  const vues = useRef(new Set<string>())
  const minuteurs = useRef<number[]>([])

  useEffect(() => {
    /* ⚠️ MÊME LEÇON QUE LA BARRE DU BAS : on mesure à chaque défilement, jamais
       une seule fois au montage. Une mesure prise avant que la page soit posée
       déclenchait la mauvaise notification au mauvais endroit. */
    const evaluer = () => {
      if (visible) return
      const h = window.innerHeight
      for (const a of AVIS) {
        if (vues.current.has(a.ancre)) continue
        const el = document.getElementById(a.ancre)
        if (!el) continue
        const t = el.getBoundingClientRect().top
        // Elle part quand la section entre dans le tiers haut de l'écran :
        // il commence à la lire, il ne l'a pas encore finie.
        if (t < h * 0.45 && t > -h * 0.5) {
          vues.current.add(a.ancre)
          setSortie(false)
          setVisible(a.texte)
          minuteurs.current.push(
            window.setTimeout(() => setSortie(true), DUREE_MS),
            window.setTimeout(() => { setVisible(null); setSortie(false) }, DUREE_MS + 320),
          )
          return
        }
      }
    }
    window.addEventListener('scroll', evaluer, { passive: true })
    return () => {
      window.removeEventListener('scroll', evaluer)
      minuteurs.current.forEach((m) => window.clearTimeout(m))
    }
  }, [visible])

  if (!visible) return null

  return (
    /* `aria-live="polite"` et pas `assertive` : elle informe, elle n'interrompt
       jamais quelqu'un qui lit. `role="status"` la fait annoncer une fois. */
    <div className={`${s.zone} ${sortie ? s.part : ''}`} role="status" aria-live="polite">
      <span className={s.point} aria-hidden="true" />
      <p className={s.texte}>{visible}</p>
    </div>
  )
}

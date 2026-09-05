'use client'

import { useEffect, useState } from 'react'
import { MessageCircle } from 'lucide-react'
import s from './barreCollante.module.css'

/**
 * LA BARRE COLLANTE — deux portes sous le pouce, tout le temps.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI ELLE EXISTE (audit Fable du 05/09, correctif A)
 *
 * Sur `/mobile`, la première porte WhatsApp visible est à 4 225 px — cinq
 * écrans. Plus d'un visiteur mobile sur deux ne fait jamais défiler. S'il ne
 * tape pas de zone dans le hero, il n'a AUCUNE porte de toute sa visite.
 *
 * La mesure qui commande ce correctif vient de la page « / », 14 derniers
 * jours : les deux barres y font 21 clics WhatsApp, les boutons de fin de
 * section 3. Les barres font 80 % des clics. `/mobile` n'en avait pas.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * DEUX PIÈGES DÉJÀ PAYÉS SUR CE PROJET, FERMÉS ICI
 *
 * 1. UN OBSERVATEUR NE NOTIFIE QUE LES CHANGEMENTS. Si le hero est déjà
 *    au-dessus de l'écran quand on s'attache — retour depuis WhatsApp, reprise
 *    après un appel client, rechargement en 4G où Safari restaure la position —
 *    la barre ne s'affiche jamais de toute la session, et c'est précisément le
 *    visiteur le plus chaud qui la perd. On lit donc la position RÉELLE
 *    d'abord, et on garde un filet sur le défilement.
 *
 * 2. LA BARRE NE DOIT PAS COUVRIR LE CHAMP DE SAISIE DU HERO. Sur le hero, le
 *    téléphone EST la porte ; ailleurs, la barre l'est. Mesuré dans le
 *    simulateur en août sur la page « / » : la barre recouvrait le champ, seul
 *    élément de conversion de l'écran.
 *
 * ⚠️ Le message de cette barre est déclaré à DEUX endroits — `whatsappLink.ts`
 * ET `wa/route.ts`. N'en déclarer qu'un fait retomber le lien sur « Je démarre
 * avec FOREAS. 0 €. Je teste. » : le bug du 29/08, que le compilateur ne voit
 * pas. Les deux portent `barre_mobile`.
 */
export default function BarreCollante() {
  // Une fois montrée, elle ne clignote plus : on ne la reprend jamais au visiteur.
  const [montree, setMontree] = useState(false)
  // true au départ — le hero EST le premier écran, la barre n'a rien à y faire.
  const [heroVisible, setHeroVisible] = useState(true)

  useEffect(() => {
    const hero = document.getElementById('hero-mobile')
    if (!hero) return

    // Piège 1 : la position réelle, avant tout observateur.
    if (hero.getBoundingClientRect().bottom < window.innerHeight * 0.5) setMontree(true)

    const io = new IntersectionObserver(
      (entrees) => {
        const e = entrees[entrees.length - 1]
        setHeroVisible(e.isIntersecting)
        if (!e.isIntersecting) setMontree(true)
      },
      // −45 % en bas : la barre revient dès que le hero ne tient plus que la
      // moitié haute de l'écran. Le champ de saisie est alors déjà sorti de la
      // zone où la barre le recouvrirait.
      { rootMargin: '0px 0px -45% 0px' },
    )
    io.observe(hero)

    // Filet indépendant : si l'observateur ne dit rien, le défilement, lui, parle.
    const auDefilement = () => { if (window.scrollY > window.innerHeight * 0.6) setMontree(true) }
    window.addEventListener('scroll', auDefilement, { passive: true })

    return () => { io.disconnect(); window.removeEventListener('scroll', auDefilement) }
  }, [])

  const visible = montree && !heroVisible

  return (
    <div className={`${s.barre} ${visible ? s.dedans : ''}`} aria-hidden={!visible}>
      <a
        className={s.wa}
        href="/wa?s=barre_mobile&p=/&i=question&o=barre_collante"
        target="_blank"
        rel="noopener noreferrer"
        tabIndex={visible ? 0 : -1}
      >
        <MessageCircle size={18} aria-hidden="true" />
        Parler à Ajnaya
      </a>
      {/* ⚠️ `formule=mensuel` n'est pas décoratif : sans lui, la caisse ouvre sur
          l'ANNUEL par défaut — 249,99 € montrés à quelqu'un venu voir 29,99 €.
          C'est le correctif C du même audit. */}
      <a className={s.essai} href="/tarifs3?formule=mensuel" tabIndex={visible ? 0 : -1}>
        3 jours · 0 €
      </a>
    </div>
  )
}

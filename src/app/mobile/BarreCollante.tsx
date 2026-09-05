'use client'

import { useEffect, useState } from 'react'
import s from './barreCollante.module.css'

/** Le point de bascule : l'entrée du module court, après les trois arguments. */
const REPERE_CONVAINCU = 'court'

/**
 * LA BARRE COLLANTE — UNE SEULE DÉCISION À LA FOIS.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI ELLE EXISTE (audit Fable du 05/09, correctif A)
 *
 * Sur `/mobile`, la première porte WhatsApp était à 4 225 px — cinq écrans.
 * Plus d'un visiteur mobile sur deux ne fait jamais défiler. Celui qui ne tapait
 * pas de zone dans le hero n'avait aucune porte de toute sa visite.
 *
 * La mesure qui commande ce correctif vient de la page « / », 14 derniers
 * jours : les deux barres y font 21 clics WhatsApp, les boutons de fin de
 * section 3. Les barres font 80 % des clics.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ UN SEUL BOUTON, ET IL CHANGE EN DESCENDANT (Chandler, 05/09)
 *
 * Ma première version en posait deux côte à côte. Deux boutons en bas d'écran,
 * ce n'est pas deux fois plus de chances : c'est une hésitation. Le chauffeur
 * ne sait plus lequel est pour lui, et il ne fait ni l'un ni l'autre.
 *
 * Il n'y en a donc qu'un, et il suit là où le chauffeur en est :
 *
 *   HAUT DE PAGE — il ne connaît pas encore le produit. Le bouton ne parle pas
 *   de nous : il parle de SA zone, ce soir. C'est gratuit, ça ne demande aucun
 *   compte, et ça lui donne quelque chose avant qu'on lui demande quoi que ce
 *   soit.
 *
 *   APRÈS LES TROIS ARGUMENTS — il a lu le verdict, la vitrine et le carnet.
 *   Là seulement le bouton propose l'essai. Proposer de payer à quelqu'un qui
 *   vient d'arriver, c'est le perdre ; le proposer trop tard, c'est le perdre
 *   aussi (correctif G du même audit : le bouton d'essai était au 17ᵉ écran).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * DEUX PIÈGES DÉJÀ PAYÉS SUR CE PROJET, FERMÉS ICI
 *
 * 1. UN OBSERVATEUR NE NOTIFIE QUE LES CHANGEMENTS. Si le hero est déjà
 *    au-dessus de l'écran quand on s'attache — retour depuis WhatsApp, reprise
 *    après un appel client, rechargement en 4G où Safari restaure la position —
 *    la barre ne s'affiche jamais de toute la session, et c'est précisément le
 *    visiteur le plus chaud qui la perd. On lit la position RÉELLE d'abord, et
 *    on garde un filet sur le défilement.
 *
 * 2. LA BARRE NE DOIT PAS COUVRIR LE CHAMP DE SAISIE DU HERO. Sur le hero, le
 *    téléphone EST la porte ; ailleurs, la barre l'est.
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
  // Franchi une fois, il le reste : on ne repropose pas la découverte à
  // quelqu'un qui a déjà tout lu et qui remonte relire un passage.
  const [convaincu, setConvaincu] = useState(false)
  const [zone, setZone] = useState<string | null>(null)

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

  /* ── LA BASCULE : découverte → essai ─────────────────────────────────────
     Même parade que ci-dessus. Si le repère est déjà passé au moment où on
     s'attache, aucune notification n'arrive et le chauffeur qui revient au bas
     de la page se verrait reproposer la découverte alors qu'il a tout lu. */
  useEffect(() => {
    const repere = document.getElementById(REPERE_CONVAINCU)
    if (!repere) return
    if (repere.getBoundingClientRect().top < window.innerHeight) { setConvaincu(true); return }
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setConvaincu(true); io.disconnect() } },
      { rootMargin: '0px 0px -10% 0px' },
    )
    io.observe(repere)
    return () => io.disconnect()
  }, [])

  /* ── SA ZONE, S'IL EN A DONNÉ UNE ────────────────────────────────────────
     Le bouton promet « ce que ta zone donne ». Sans cette valeur, Ajnaya
     redemande la zone sur WhatsApp et il répète ce qu'il vient d'écrire. */
  useEffect(() => {
    try {
      const gardee = window.sessionStorage.getItem('foreas_zone_hero')
      if (gardee) setZone(gardee)
    } catch { /* navigation privée : on s'en passe */ }
    const ecoute = (e: Event) => {
      const v = (e as CustomEvent<string>).detail
      if (typeof v === 'string' && v.trim()) setZone(v.trim())
    }
    window.addEventListener('foreas:zone', ecoute)
    return () => window.removeEventListener('foreas:zone', ecoute)
  }, [])

  const visible = montree && !heroVisible

  /* Le libellé ne nomme jamais la zone, même quand on la connaît : « Ce que
     Boulogne-Billancourt donne ce soir » déborde, et un bouton dont le texte
     se coupe fait douter de tout le reste. La zone part dans le message, pas
     dans le libellé. */
  const lien = convaincu
    ? '/tarifs3'
    : `/wa?s=barre_mobile&p=/&i=zone&o=barre_collante${zone ? `&z=${encodeURIComponent(zone)}` : ''}`

  return (
    <div className={`${s.barre} ${visible ? s.dedans : ''}`} aria-hidden={!visible}>
      <a
        className={convaincu ? s.essai : s.wa}
        href={lien}
        {...(convaincu ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
        tabIndex={visible ? 0 : -1}
      >
        {!convaincu && (
          <svg className={s.logo} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.42-.07-.12-.27-.2-.57-.35z"/>
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.28-1.38a9.9 9.9 0 0 0 4.76 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.86 9.86 0 0 0 12.04 2zm0 18.13h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.05-.2-.31a8.2 8.2 0 0 1-1.26-4.36c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.7 8.23-8.24 8.23z"/>
          </svg>
        )}
        {convaincu ? 'Essayer 3 jours gratuitement' : 'Ce que ta zone donne ce soir'}
      </a>
    </div>
  )
}

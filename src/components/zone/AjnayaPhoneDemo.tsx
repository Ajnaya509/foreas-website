'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import s from './ajnayaPhone.module.css'
import { typePourZone, reconnaitreLieu, replique, type Repli } from './ajnayaSavoir'
import { materialiser, mouvementReduit } from './ajnayaPoussiere'

/**
 * LE TÉLÉPHONE QUI ARRIVE — l'écran Ajnaya joué en vrai, dans la page.
 *
 * Port React de la démo du fil Pieuvre
 * (FOREAS-SHARED/DEMO_MODALE_AJNAYA/demo-modale-ajnaya.html), suivant
 * BRIEF_FIL_SITE.md du 29/08/2026, autorisé par Chandler le même jour.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUE ÇA REMPLACE, ET CE QUE ÇA NE REMPLACE PAS
 *
 * Avant : le chauffeur tapait sa zone et le site répondait « pas encore assez
 * de courses mesurées ici », puis le poussait sur WhatsApp. Honnête, mais il
 * repartait les mains vides sans jamais voir le produit.
 *
 * ⚠️ `ZoneSearchResultCard` N'EST PAS SUPPRIMÉE. Elle reste le repli quand quoi
 * que ce soit échoue, et elle porte la mémoire des faux chiffres retirés depuis
 * le 14/08. La perdre, c'est rouvrir des portes déjà fermées.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * L'ORDRE, ET IL N'EST PAS NÉGOCIABLE : ON DONNE AVANT DE DEMANDER
 *
 *   1. il tape une zone ;
 *   2. le téléphone ARRIVE (1,15 s, UNE SEULE FOIS — le rejouer devient un tic) ;
 *   3. Ajnaya donne un CALCUL qu'il vérifie de tête, et un GESTE qu'il peut
 *      faire ce soir sans rien acheter ;
 *   4. elle montre les zones rentables heure par heure ;
 *   5. ALORS SEULEMENT, deux portes : l'essai, ou WhatsApp.
 *
 * ⚠️ DEUX PORTES, JAMAIS UNE. L'essai pour celui qui est prêt, WhatsApp pour
 * celui qui veut d'abord parler. Une seule porte élimine la moitié des gens.
 *
 * ⚠️ ET ON NE FINIT JAMAIS SUR UN MANQUE. La dernière phrase ne dit pas « je
 * n'ai pas le chiffre », elle dit « ce chiffre-là est à toi, pas à moi ». Même
 * vérité, effet inverse.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ CE QUI EST UNE LIBERTÉ, PAS UNE REPRODUCTION DE L'APP (brief §8)
 *
 * · Le verrou « réservé aux abonnés » sur la frise **n'existe pas dans l'app**.
 *   Vérifié par le fil Pieuvre : `NextHoursLine` ne reçoit que ses créneaux, et
 *   `useTierLimits` ne gouverne que le quota de messages et le micro. Dans
 *   l'app, un point éteint veut dire « rien de mesuré », jamais « bloqué ».
 *   C'est une addition demandée pour le site. Ne jamais la présenter comme le
 *   comportement de l'application.
 * · Les valeurs 31/44/52 €/h sont des EXEMPLES, aucune mesure derrière. En
 *   euros et non en pourcentage : un « +61 % » ne se dépense pas.
 * · Le téléphone ne tourne pas : un téléphone qui tourne ne peut pas porter du
 *   texte vivant, la perspective change à chaque image.
 * · « Prête, {prénom} » est retiré : sur le site le visiteur n'a pas de prénom
 *   connu, en afficher un serait un faux.
 */

type Bloc = { html: string; tag?: { texte: string; couleur: 'c' | 'g' } }
type Ligne = { id: string; qui: 'toi' | 'elle'; etiq: string; blocs: Bloc[]; sorties?: boolean }

const LARGEUR_APP = 393 // la largeur réelle de l'app — voir le brief §4
/* Plancher de sécurité : en dessous, l'écran n'affiche plus rien d'utile et
   mieux vaut un téléphone qui dépasse qu'un téléphone vide. */
const HAUTEUR_ECRAN_MIN = 200

const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
const MOIS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
]

const deuxChiffres = (n: number) => (n < 10 ? '0' : '') + n

/**
 * ⚠️ FORMAT EXACT DE L'APP : deux chiffres, une espace, un h minuscule, JAMAIS
 * de minutes sur les heures à venir. Le code de l'app l'explique : « 21 h 00
 * promet une minute qu'on ne connaît pas ».
 */
function lireHorloge() {
  const d = new Date()
  const h = d.getHours()
  return {
    h1: `${deuxChiffres((h + 1) % 24)} h`,
    h2: `${deuxChiffres((h + 2) % 24)} h`,
    h3: `${deuxChiffres((h + 3) % 24)} h`,
    hh: `${deuxChiffres(h)}:${deuxChiffres(d.getMinutes())}`,
    jour: `${JOURS[d.getDay()]} ${d.getDate()} ${MOIS[d.getMonth()]}`,
  }
}

/**
 * Un bloc de texte qui se matérialise en poussière.
 * ⚠️ Il est rejouable au clic : c'est le détail qu'on veut MONTRER.
 */
function BlocPoussiere({ html, index }: { html: string; index: number }) {
  const ref = useRef<HTMLDivElement | null>(null)
  const arret = useRef<(() => void) | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    arret.current = materialiser(el, index)
    return () => {
      arret.current?.()
      arret.current = null
    }
  }, [index, html])

  return (
    <div
      ref={ref}
      className={s['aj-bloc']}
      style={{ cursor: mouvementReduit() ? 'default' : 'pointer' }}
      title={mouvementReduit() ? undefined : 'Rejouer'}
      onClick={() => {
        if (!ref.current) return
        arret.current?.()
        arret.current = materialiser(ref.current, index)
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

export default function AjnayaPhoneDemo({
  zone,
  onEssaiClick,
  onWhatsAppClick,
  immersifPossible = false,
  ajusteHauteur = false,
}: {
  /** La zone tapée par le chauffeur. Un changement relance la conversation. */
  zone: string
  onEssaiClick?: () => void
  onWhatsAppClick?: () => void
  /**
   * ⚠️ OPT-IN, ET C'EST VOLONTAIRE.
   * Sur `/ou-ca-paie` le téléphone est une DÉMONSTRATION qui se joue toute
   * seule : on la regarde, on n'écrit pas dedans. Y ouvrir le plein écran
   * changerait le sens de la scène sans que personne l'ait demandé.
   * Seul `/mobile` l'active, où l'écriture est le but.
   */
  immersifPossible?: boolean
  /**
   * ⚠️ LE TÉLÉPHONE PREND TOUTE LA LARGEUR, ET C'EST SON ÉCRAN QU'ON RACCOURCIT.
   *
   * Le châssis fait 820 × 1528 : à 413 points de large il mesure 770 de haut,
   * alors que Safari n'en montre que ~647 au total. Un téléphone ENTIER à
   * l'échelle lisible ne rentre donc dans aucun iPhone — c'est de la géométrie,
   * pas un réglage. Les deux issues fausses, toutes deux essayées :
   *   — le caler sur la hauteur : il tombe à 184 points de large, le texte de
   *     l'app à 7 px, illisible (Chandler, 03/09) ;
   *   — le laisser dépasser : il devient « loooong de fou » et il faut faire
   *     défiler la page pour voir le bas (Chandler, 03/09 au soir).
   *
   * La sortie : le téléphone garde sa VRAIE largeur, il est COUPÉ net en bas
   * par son bloc, et l'écran est raccourci EXACTEMENT à la partie visible.
   * Conséquence décisive : le fil de conversation défile À L'INTÉRIEUR, et la
   * dernière chose qu'on voit en bas est le champ « écris ici pour répondre ».
   */
  ajusteHauteur?: boolean
}) {
  const ecranRef = useRef<HTMLDivElement | null>(null)
  const appRef = useRef<HTMLDivElement | null>(null)
  const racineRef = useRef<HTMLDivElement | null>(null)
  const filRef = useRef<HTMLDivElement | null>(null)
  const minuteurs = useRef<ReturnType<typeof setTimeout>[]>([])

  const [lignes, setLignes] = useState<Ligne[]>([])
  const [attente, setAttente] = useState(false)
  const [arrive, setArrive] = useState(false)
  const [heures, setHeures] = useState(lireHorloge)
  const [saisie, setSaisie] = useState('')
  const [zoneCourante, setZoneCourante] = useState(zone)
  const [ecoute, setEcoute] = useState(false)
  const [immersif, setImmersif] = useState(false)
  /* ⚠️ SA PHRASE ET SA ZONE SONT DEUX CHOSES, ET LES CONFONDRE FAISAIT AMATEUR.
     Une seule variable, `zoneCourante`, faisait trois métiers : le nom du lieu,
     la clé du savoir, et le contenu de son message. Il tapait « comment tu peux
     savoir ? » et l'écran affichait, en toutes lettres, « Ajnaya sait où ça
     paie autour de comment tu peux savoir ». Orly — sa vraie question —
     disparaissait de l'écran. Chandler : « ça fait amateur ».
     Désormais : `demande` porte SA phrase, `zoneCourante` ne bouge que si on
     reconnaît un lieu, et `tour` force la conversation à se rejouer même quand
     il repose deux fois la même question (React ignore une écriture identique —
     c'est ce silence qui rendait le micro muet). */
  const [demande, setDemande] = useState('')
  const [horsZone, setHorsZone] = useState<Repli | null>(null)
  const [tour, setTour] = useState(0)
  /* Il vit HORS de `minuteurs.current` : voir le commentaire dans `envoyer()`. */
  const sortieRef = useRef<number | null>(null)
  /* L'œil de l'app n'est animé que quand elle parle. */
  const [parle, setParle] = useState(false)
  const [invite, setInvite] = useState('Parle ou tape…')
  const declencheur = useRef<HTMLButtonElement | null>(null)
  const champRef = useRef<HTMLInputElement | null>(null)

  const nomLieu = (zoneCourante || '').trim() || 'ta zone'
  const savoir = typePourZone(zoneCourante || '')

  /* ══ L'ÉCHELLE ════════════════════════════════════════════════════════════
     L'écran est dessiné à 393 px puis RÉDUIT. Aucune valeur du code n'est
     recalculée à la main : un 19 px reste 19 px, donc on ne se trompe nulle
     part. Le facteur se mesure sur la largeur réellement rendue. */
  const poserEchelle = useCallback(() => {
    const ecran = ecranRef.current
    const app = appRef.current
    if (!ecran || !app) return
    const l = ecran.clientWidth
    /* ⚠️ ON N'ÉCRIT JAMAIS scale(0), ET C'EST UN BUG DÉJÀ PAYÉ.
       `.ecran` est positionné en POURCENTAGES de `.tel`, dont la taille vient
       de l'image du châssis. Tant qu'elle n'est pas chargée, `.tel` n'a aucune
       hauteur, `clientWidth` vaut 0, et `scale(0)` rend l'écran invisible —
       téléphone présent, contenu introuvable, et rien dans la console.
       La démo d'origine n'a jamais rencontré ça : son image était en base64,
       donc déjà là. Ici elle vient du réseau. */
    if (l <= 0) return

    /* ══ ON RACCOURCIT L'ÉCRAN À CE QUI EST RÉELLEMENT VISIBLE ══════════════
       Le châssis dépasse volontairement du bloc, qui le coupe. Si on laissait
       l'écran à ses 87,439 % naturels, sa moitié basse tomberait DERRIÈRE la
       coupe : le fil de conversation défile jusqu'au dernier message, et ce
       dernier message se retrouverait dans la partie cachée. On verrait une
       conversation qui se termine dans le vide.
       On mesure donc la fenêtre — le parent de la racine — et on donne à
       l'écran exactement la hauteur qui reste sous son bord haut.
       Aucune boucle possible : `.ecran` est en position absolue, sa hauteur
       n'influence la position de rien. */
    if (ajusteHauteur && !immersif) {
      const fenetre = racineRef.current?.parentElement
      const tel = ecran.parentElement
      if (fenetre && tel) {
        /* ⚠️ `offsetTop`, JAMAIS `getBoundingClientRect`. C'EST MESURÉ.
           Le téléphone arrive en tournant (`ajArrive`, 1150 ms). Pendant ce
           temps, le rectangle DESSINÉ est réduit et déplacé — j'ai relevé
           299 px de large pour un élément qui en fait 375, et une hauteur
           d'écran calculée à 385 au lieu de 488. Le téléphone restait
           rabougri, avec 104 px de vide sous lui, pour toujours.
           `offsetTop` vient de la mise en page, pas de la peinture : aucune
           transformation d'un parent ne le touche. */
        let hautEcran = 0
        for (let n: HTMLElement | null = ecran; n && n !== fenetre; n = n.offsetParent as HTMLElement | null) {
          hautEcran += n.offsetTop
        }
        const restant = fenetre.clientHeight - hautEcran
        /* La hauteur naturelle reste le plafond : sur un grand écran, le
           téléphone tient en entier et on ne l'étire surtout pas. */
        /* 0,8920517 = la part de l'écran dans le châssis, LA MÊME que le
           `height` de `.ecran` en CSS. Les deux valeurs doivent bouger
           ensemble : si l'une change sans l'autre, l'écran se décale du cadre
           et le décalage ne se voit qu'en bas, à quelques pixels près. */
        const naturelle = tel.offsetHeight * 0.8920517
        const voulue = Math.max(HAUTEUR_ECRAN_MIN, Math.min(restant, naturelle))
        /* `floor` et non `round` : la hauteur du châssis est fractionnaire
           (698,77 px), donc le 6,221 % du bord haut l'est aussi. Arrondi au
           supérieur, l'écran dépassait de 4 px sous la coupe et le bas de la
           barre de saisie était rogné. Vers le bas, on ne perd rien de visible. */
        const arrondie = `${Math.floor(voulue)}px`
        if (ecran.style.height !== arrondie) ecran.style.height = arrondie
        /* La cible d'ouverture épouse l'écran : elle est posée en pourcentage
           du châssis, donc elle dépasserait de la coupe si on l'oubliait —
           un doigt posé sous le téléphone ouvrirait le plein écran. */
        if (declencheur.current) declencheur.current.style.height = arrondie
      }
    }

    const k = l / LARGEUR_APP
    app.style.transform = `scale(${k})`
    app.style.height = `${ecran.clientHeight / k}px`
  }, [ajusteHauteur, immersif])

  useEffect(() => {
    const ecran = ecranRef.current
    if (!ecran) return
    poserEchelle()
    const ro = new ResizeObserver(poserEchelle)
    ro.observe(ecran)
    /* ⚠️ OBSERVER L'ÉCRAN NE SUFFIT PAS QUAND C'EST NOUS QUI LE DIMENSIONNONS.
       Quand le bandeau de consentement part, c'est la FENÊTRE qui grandit ;
       l'écran, lui, garde la hauteur qu'on lui a écrite et ne bouge pas — donc
       l'observateur ne se déclenche jamais et le téléphone reste rabougri.
       On surveille les deux. */
    const fenetre = racineRef.current?.parentElement
    if (fenetre) ro.observe(fenetre)
    return () => ro.disconnect()
  }, [poserEchelle])

  useEffect(() => () => { if (sortieRef.current) window.clearTimeout(sortieRef.current) }, [])

  /* ══ LE PLEIN ÉCRAN ═══════════════════════════════════════════════════════
     Le téléphone quitte son châssis et prend tout l'écran. Le clavier monte,
     le champ vient se poser dessus. À partir de là, on est DANS l'application. */

  const entrer = useCallback(() => {
    if (!immersifPossible) return
    setImmersif(true)
  }, [immersifPossible])

  /* ══ DEUX GESTES SUR UN SEUL OBJET ════════════════════════════════════════
     ⚠️ CE QUI EXISTAIT AVANT NE MARCHAIT PAS, ET CHANDLER L'A DIT TROIS FOIS :
     « le mockup ne scroll pas, il est fixe sur la page ».
     La cause : un calque invisible (`.ouvrir`) couvrait 76 % × 87 % de l'écran
     et attrapait TOUT — y compris un glissement. Et par-dessus, l'application
     entière portait `pointer-events: none`. Le téléphone était donc une photo :
     le seul geste possible était l'appui, et il ouvrait le plein écran.

     Maintenant, un seul objet répond à deux gestes, comme un vrai téléphone :
       · GLISSER  → la conversation défile à l'intérieur (défilement natif,
                    on n'appelle jamais preventDefault) ;
       · APPUYER  → le plein écran s'ouvre.
     On distingue les deux à la levée du doigt : moins de 10 px parcourus et
     moins de 600 ms écoulées, c'est un appui ; au-delà, c'est un glissement et
     on ne fait rien.

     `PointerEvent` et non `TouchEvent` : il couvre le doigt ET la souris avec
     le même code, et il n'y a donc pas de double déclenchement (un `click`
     après un `touchend` aurait ouvert le plein écran deux fois). */
  const appui = useRef({ x: 0, y: 0, t: 0 })
  const doigtPose = useCallback((e: React.PointerEvent) => {
    appui.current = { x: e.clientX, y: e.clientY, t: e.timeStamp }
  }, [])
  const doigtLeve = useCallback(
    (e: React.PointerEvent) => {
      if (!immersifPossible || immersif) return
      /* ⚠️ UN APPUI SUR UNE COMMANDE NE DOIT PAS OUVRIR LE PLEIN ÉCRAN.
         Les portes de vente vivent DANS l'écran, qui porte ce geste. Mesuré sur
         le vrai site : un appui sur « Essayer 3 jours — 0 € aujourd'hui »
         ouvrait l'écran noir au lieu de la caisse. Le jour où les portes sont
         branchées, ce serait pire : deux actions au même appui. */
      const cible = e.target as HTMLElement | null
      if (cible && cible.closest('button, a, [role="button"]')) return
      const d = appui.current
      const distance = Math.hypot(e.clientX - d.x, e.clientY - d.y)
      const duree = e.timeStamp - d.t
      /* 10 px : en dessous, aucun pouce humain ne « glisse » volontairement.
         600 ms : au-delà, c'est un appui long, pas une ouverture. */
      if (distance < 10 && duree < 600) entrer()
    },
    [immersifPossible, immersif, entrer],
  )

  const sortir = useCallback(() => {
    setImmersif(false)
    /* Le focus revient d'où il venait. Sans ça, un lecteur d'écran repart du
       haut de la page et la personne perd sa place. */
    setTimeout(() => declencheur.current?.focus(), 40)
  }, [])

  useEffect(() => {
    if (!immersif) return
    const app = appRef.current
    if (!app) return

    /* ══ LE CLAVIER ═════════════════════════════════════════════════════════
       La charte range « le sursaut au moment où l'on tape » dans les défauts.
       C'est exactement ce qui arrive si on ne fait rien : sur iPhone,
       l'ouverture du clavier ne redimensionne PAS la page — elle la fait
       glisser dessous. Le champ part hors de vue.
       La seule mesure fiable est `visualViewport` : `height` donne ce qui reste
       visible clavier déduit, `offsetTop` de combien la page a glissé.
       Repli sans lui : `innerHeight`. Moins juste, mais ça ne bloque personne. */
    const vv = window.visualViewport
    const coller = () => {
      const h = vv ? vv.height : window.innerHeight
      const y = vv ? vv.offsetTop : 0
      app.style.transform = `translateY(${y}px)`
      app.style.height = `${h}px`
      app.style.width = '100%'
    }
    coller()
    vv?.addEventListener('resize', coller)
    vv?.addEventListener('scroll', coller)
    window.addEventListener('resize', coller)

    /* ══ LE VERROU DE DÉFILEMENT ════════════════════════════════════════════
       ⚠️ `body { overflow: hidden }` NE SUFFIT PAS SUR IPHONE. Safari continue
       de faire glisser la page sous le doigt — c'est le « défilement bizarre »
       constaté. La seule méthode qui tient est de FIGER le corps de la page à
       sa position, puis de la lui rendre exactement en sortant. */
    const yPage = window.scrollY
    const b = document.body
    const avant = { position: b.style.position, top: b.style.top, width: b.style.width, overflow: b.style.overflow }
    b.style.position = 'fixed'
    b.style.top = `-${yPage}px`
    b.style.width = '100%'
    b.style.overflow = 'hidden'

    const surEchap = (e: KeyboardEvent) => { if (e.key === 'Escape') sortir() }
    window.addEventListener('keydown', surEchap)

    /* ⚠️ LE CORPS FIGÉ PEUT PARTIR DANS LE CACHE DE RETOUR ARRIÈRE.
       Le verrou est rendu UNIQUEMENT dans le nettoyage de cet effet. Or si le
       chauffeur quitte la page depuis le plein écran — la porte WhatsApp, la
       porte d'essai — Safari met la page telle quelle dans son cache mémoire :
       corps en `position: fixed`, décalé de -Ypx. Il revient avec le bouton
       Retour et retrouve une page bloquée qu'il ne peut plus faire défiler.
       `pagehide` et pas `unload` : `unload` est ignoré par ce cache — s'en
       servir revient à ne rien poser du tout. La restitution est écrite une
       fois et appelée deux fois : elle doit donc être sans effet la seconde. */
    const rendre = () => {
      b.style.position = avant.position
      b.style.top = avant.top
      b.style.width = avant.width
      b.style.overflow = avant.overflow
    }
    const surSortie = () => rendre()
    window.addEventListener('pagehide', surSortie)

    /* Le focus vient APRÈS le passage en plein écran. Dans l'autre ordre, le
       clavier monte pendant que la mise en page bouge encore : c'est le saut. */
    const t = window.setTimeout(() => champRef.current?.focus(), 70)

    return () => {
      vv?.removeEventListener('resize', coller)
      vv?.removeEventListener('scroll', coller)
      window.removeEventListener('resize', coller)
      window.removeEventListener('keydown', surEchap)
      window.removeEventListener('pagehide', surSortie)
      window.clearTimeout(t)
      rendre()
      window.scrollTo(0, yPage)   // on lui rend sa place, à la ligne près
      app.style.transform = ''
      app.style.height = ''
      app.style.width = ''
      poserEchelle()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immersif, sortir])

  /* ══ L'INVITE QUI S'ÉCRIT TOUTE SEULE ═════════════════════════════════════
     « écris ici pour répondre... » en gris presque effacé, lettre par lettre.

     ⚠️ UN COMPTEUR QUI SURVIT AUX REDESSINS, PAS UNE CHAÎNE DE MINUTEURS.
     Première version : une chaîne de `setTimeout` relancée par un effet.
     Mesuré : UNE lettre par 800 ms au lieu d'une toutes les 55 ms.
     Cause — la démo redessine beaucoup (conversation jouée, horloge, poussière),
     et chaque redessin qui touchait une dépendance repartait de zéro.
     Ici l'indice vit dans une référence : il traverse les redessins. Un seul
     battement, posé une fois. Rien ne peut le remettre à zéro par accident. */
  const indiceInvite = useRef(0)
  const sensInvite = useRef<1 | -1>(1)

  useEffect(() => {
    if (!immersif) { setInvite('Parle ou tape…'); return }
    const CIBLE = 'écris ici pour répondre...'
    if (mouvementReduit()) { setInvite(CIBLE); return }

    indiceInvite.current = 0
    sensInvite.current = 1
    let attente = 0

    const battement = window.setInterval(() => {
      /* Champ non vide : l'invite se tait. Une invite qui continue de bouger
         sous un texte déjà tapé est un scintillement, pas une aide. */
      if (champRef.current && champRef.current.value.trim()) return
      if (attente > 0) { attente -= 1; return }

      indiceInvite.current += sensInvite.current
      const i = indiceInvite.current
      setInvite(CIBLE.slice(0, i))

      if (i >= CIBLE.length) { sensInvite.current = -1; attente = 42 }   // ~2,3 s
      else if (i <= 0) { sensInvite.current = 1; attente = 13 }          // ~0,7 s
    }, 55)

    return () => window.clearInterval(battement)
  }, [immersif])

  /* L'horloge se recalcule chaque minute : les heures sont VRAIES, même
     lorsqu'aucune donnée n'existe derrière. */
  useEffect(() => {
    const t = setInterval(() => setHeures(lireHorloge()), 60000)
    return () => clearInterval(t)
  }, [])

  const plusTard = useCallback((ms: number, f: () => void) => {
    minuteurs.current.push(setTimeout(f, ms))
  }, [])

  useEffect(
    () => () => {
      minuteurs.current.forEach(clearTimeout)
      minuteurs.current = []
    },
    [],
  )

  /* ══ LE FIL SE CALE SUR SA QUESTION, PAS SUR LE BAS ═══════════════════════
     ⚠️ AVANT, ON COLLAIT EN BAS SANS CONDITION. Résultat mesuré : à l'arrivée de
     la réponse, sa propre question était 476 px au-dessus du bord haut et il
     lisait le milieu d'une phrase. Chandler : « le mockup n'ancre pas en haut ».
     Maintenant on pose le HAUT de sa dernière question en haut du cadre : il
     voit sa question, puis la réponse en dessous, dans l'ordre où ça s'écrit.
     ⚠️ `immersif` est dans les dépendances, et ce n'est pas décoratif : passer
     en plein écran DÉMONTE et REMONTE tout le téléphone (élément normal d'un
     côté, portail de l'autre — React reconstruit). Sans cette dépendance, le
     fil revenait au sommet et affichait la frise au lieu de la conversation. */
  useEffect(() => {
    const f = filRef.current
    if (!f) return
    const poser = () => {
      const q = f.querySelectorAll<HTMLElement>('[data-ancre="question"]')
      const derniere = q[q.length - 1]
      f.scrollTop = derniere ? Math.max(0, derniere.offsetTop - 6) : f.scrollHeight
    }
    poser()
    /* Le passage en plein écran change la hauteur du cadre APRÈS le rendu :
       une image plus tard, la position calculée ne vaut plus rien. */
    const id = window.requestAnimationFrame(poser)
    return () => window.cancelAnimationFrame(id)
  }, [lignes, attente, immersif])

  /* ══ LA CONVERSATION ══════════════════════════════════════════════════════ */
  useEffect(() => {
    minuteurs.current.forEach(clearTimeout)
    minuteurs.current = []

    const t = typePourZone(zoneCourante || '')
    const hh = lireHorloge().hh
    const nom = (zoneCourante || '').trim() || 'ma zone'

    /* ══ AVANT LA ZONE : ELLE ATTEND, ELLE NE JOUE PAS ════════════════════
       Chandler, 04/09 : le téléphone doit être visible DÈS LE CHARGEMENT.
       Mais jouer la conversation avec « ta zone » à la place d'un lieu, ce
       serait afficher « Ça donne quoi ta zone ? » — une question que personne
       n'a posée, signée de son nom. On montre donc Ajnaya prête, et une seule
       phrase qui dit exactement quoi faire. Elle reprend mot pour mot ce que
       demande la barre de recherche juste au-dessus : deux endroits, une seule
       consigne. Aucune porte ici — on ne vend rien avant d'avoir donné. */
    if (!(zoneCourante || '').trim()) {
      setAttente(false)
      setLignes([
        {
          id: 'attente',
          qui: 'elle',
          etiq: 'Ajnaya',
          blocs: [{ html: 'Dis-moi <b>où tu roules ce soir</b>. Je te dis ce que ça change.' }],
        },
      ])
      return () => { minuteurs.current.forEach(clearTimeout); minuteurs.current = [] }
    }

    /* SA phrase, telle qu'il l'a tapée. Plus jamais réécrite à sa place :
       « Ça donne quoi comment tu peux savoir ? ? » — deux points
       d'interrogation, français cassé, signé de son nom. */
    const saQuestion = demande ? echapper(demande) : `Ça donne quoi ${nom} ?`
    setLignes([{ id: 'q', qui: 'toi', etiq: `Toi · ${hh}`, blocs: [{ html: saQuestion }] }])
    /* ⚠️ Le chuchotement, pas un « … » ni un rouet : dans l'app il n'y a ni
       bulle d'attente, ni indicateur de chargement, jamais. */
    setAttente(true)

    /* ══ CE N'EST PAS UN LIEU : elle répond, la zone ne bouge pas ══════════ */
    if (horsZone) {
      const r = horsZone
      plusTard(620, () => {
        setAttente(false)
        setParle(true)
        setLignes((l) => [
          ...l,
          { id: 'hv', qui: 'elle', etiq: `Ajnaya · ${hh}`, blocs: [{ html: `<b>${r.verdict}</b>` }] },
        ])
        plusTard(820, () => {
          setLignes((l) => [
            ...l,
            {
              id: 'hc',
              qui: 'elle',
              etiq: 'Ajnaya',
              blocs: [{ html: r.corps, tag: { texte: r.etiq, couleur: 'c' } }],
              /* ⚠️ AUCUNE PORTE APRÈS UNE INCOMPRÉHENSION. Vendre juste après
                 avoir échoué à comprendre, c'est le geste qui sent l'amateur. */
              sorties: r.porte,
            },
          ])
          plusTard(400, () => setParle(false))
        })
      })
      return () => { minuteurs.current.forEach(clearTimeout); minuteurs.current = [] }
    }

    plusTard(620, () => {
      setAttente(false)
      setParle(true)
      setLignes((l) => [
        ...l,
        { id: 'v', qui: 'elle', etiq: `Ajnaya · ${hh}`, blocs: [{ html: `<b>${t.verdict}</b>` }] },
      ])

      plusTard(900, () => {
        setLignes((l) => [
          ...l,
          {
            id: 'cg',
            qui: 'elle',
            etiq: 'Ajnaya',
            blocs: [
              { html: t.calcul, tag: { texte: 'CE QUE ÇA TE COÛTE', couleur: 'c' } },
              { html: t.geste, tag: { texte: 'À FAIRE DÈS CE SOIR', couleur: 'g' } },
            ],
          },
        ])

        plusTard(950, () => {
          setLignes((l) => [
            ...l,
            { id: 'b', qui: 'elle', etiq: 'Ajnaya', blocs: [{ html: t.bascule }], sorties: true },
          ])
          plusTard(400, () => setParle(false))
        })
      })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoneCourante, tour])

  /* Le téléphone n'existe pas avant la question. Il ARRIVE — c'est le moment
     qui fait « ah ». UNE SEULE FOIS : le rejouer à chaque question deviendrait
     un tic, et le brief l'interdit explicitement (§12.7). */
  useEffect(() => {
    if (!arrive) setArrive(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => setZoneCourante(zone), [zone])

  /* ⚠️ ÉCHAPPER SA PHRASE AVANT DE L'AFFICHER. Les bulles sont rendues en HTML
     brut (le savoir contient du <b> volontaire). Sans ça, un chauffeur qui tape
     un chevron casse la bulle — et n'importe qui peut injecter du balisage. */
  const echapper = (x: string) =>
    x.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  const envoyer = useCallback(
    (texteBrut?: string) => {
      const v = (texteBrut ?? saisie).trim()
      if (!v) return
      setSaisie('')
      setDemande(v)
      const lieu = reconnaitreLieu(v)
      if (lieu) {
        /* SEUL cas où la zone bouge. */
        setHorsZone(null)
        setZoneCourante(lieu)
      } else {
        /* La zone ne bouge pas. Elle répond quand même, sans réseau. */
        setHorsZone(replique(v, nomLieu))
      }
      /* ⚠️ LE COMPTEUR EST OBLIGATOIRE. Sans lui, reposer la même question
         n'écrit rien : React ignore une écriture identique, l'effet ne se
         rejoue pas, et l'écran reste figé sans la moindre erreur. */
      setTour((n) => n + 1)
      /* ⚠️ ET ON RESSORT SUR LE SITE — c'est la demande de Chandler :
         « lorsque l'on a fini d'écrire le mockup ne se remet pas sur le site,
         or c'est le but ». Il sort tout de suite après avoir posé sa question,
         et la réponse s'écrit sous ses yeux sur le téléphone reposé : il revient
         sur la page AVEC quelque chose, pas les mains vides.

         ⚠️ SURTOUT PAS `plusTard()` ICI, ET C'EST MESURÉ.
         `plusTard` range son minuteur dans `minuteurs.current`, et l'effet de
         conversation vide cette liste à chaque tour. Or `setTour` déclenche
         justement cet effet : le minuteur de sortie était donc tué une
         milliseconde après avoir été posé. Relevé : on restait en plein écran,
         sans la moindre erreur. Ce minuteur-ci vit à part. */
      if (immersif) {
        if (sortieRef.current) window.clearTimeout(sortieRef.current)
        sortieRef.current = window.setTimeout(() => setImmersif(false), 260)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [saisie, nomLieu, immersif],
  )

  /* La dictée : le micro passe en écoute, l'égaliseur bat, la phrase s'écrit
     MOT À MOT à un rythme irrégulier — c'est ce rythme qui la rend crédible. */
  const dicter = () => {
    if (ecoute) return
    setEcoute(true)
    const phrase = `Et si je reste sur ${nomLieu} ?`.split(' ')
    let i = 0
    setSaisie('')
    const mot = () => {
      if (i < phrase.length) {
        const suivant = phrase[i++]
        setSaisie((v) => (v ? `${v} ${suivant}` : suivant))
        plusTard(140 + Math.round(Math.random() * 140), mot)
      } else {
        plusTard(500, () => {
          setEcoute(false)
          /* ⚠️ AVANT, ON ÉCRIVAIT `setZoneCourante(nomLieu)` — c'est-à-dire la
             valeur QU'ELLE AVAIT DÉJÀ. React ignore une écriture identique,
             donc la conversation ne se rejouait jamais : le micro dictait une
             phrase et il ne se passait rien du tout. Zéro erreur, zéro trace.
             Maintenant on passe par le même chemin que le clavier. */
          envoyer(phrase.join(' '))
        })
      }
    }
    mot()
  }

  /* ⚠️ LA RACINE AUSSI. C'est l'étage que j'avais oublié, et il suffisait à tout
     casser : mesuré, elle faisait 681 px dans une boîte de 431.
     `height: 100%` remonte la chaîne des parents et s'arrête au PREMIER qui n'a
     pas de hauteur ferme. En oublier un seul, c'est comme n'en avoir posé aucun —
     la mesure était rigoureusement identique avant et après ma correction. */
  /* ══ LE PORTAIL ═══════════════════════════════════════════════════════════
     ⚠️ EN PLEIN ÉCRAN, LE TÉLÉPHONE SORT DE LA PAGE. Ce n'est pas une élégance,
     c'est la seule façon fiable.

     Mesuré sur iPhone 16 : `.telBloc` porte `z-index: 3`, ce qui crée un
     CONTEXTE D'EMPILEMENT. Tout `z-index` posé à l'intérieur — même 10000 —
     reste prisonnier de ce contexte et ne peut pas dépasser un frère de
     `.telBloc` placé plus loin dans la page. Résultat : le texte du site
     (« Elle répond tout de suite », « Changer de zone ») se lisait PAR-DESSUS
     la conversation, et le bandeau de consentement à 9999 enterrait le champ.

     Empiler des `z-index` plus grands ne corrige jamais ça. Il faut SORTIR de
     la boîte. Le portail rend l'application directement dans le corps du
     document : plus aucun parent ne peut la contraindre — ni empilement, ni
     `overflow`, ni `filter`, ni `transform`. */
  const scene = (
  <div
    className={`${s.scene} ${immersif ? s.immersif : ''}`}
    style={
      immersif
        ? {
            position: 'fixed', inset: 0, display: 'block', perspective: 'none', minHeight: 0,
            /* ⚠️ AU-DESSUS DU BANDEAU DE CONSENTEMENT, QUI EST À 9999.
               Mesuré sur iPhone : à 1000, le bandeau passait devant et
               enterrait le champ de saisie. Le bandeau n'est pas supprimé
               pour autant — il réapparaît intact dès qu'on ressort. */
            zIndex: 10000,
            /* ⚠️ FOND OPAQUE OBLIGATOIRE. Sans lui, le texte de la page
               (« Elle répond tout de suite », « Changer de zone ») se lisait
               PAR-DESSUS la conversation. Une application ne laisse pas voir
               la page qui la porte. */
            background: '#000',
          }
        : ajusteHauteur
          /* Aligné en HAUT, jamais centré : c'est le bas du téléphone qui est
             coupé, donc le haut doit être posé au bord du bloc. */
          ? { minHeight: 0, alignItems: 'flex-start', width: '100%' }
          : undefined
    }
  >
    <div
      className={`${s.arrivee} ${arrive ? s.on : ''}`}
      style={
        immersif
          ? {
              /* ⚠️ `animation: none` D'ABORD, SINON `transform: none` NE SERT À RIEN.
                 `.arrivee.on` joue `ajArrive` en `fill-mode: both` : la
                 dernière image de l'animation RESTE appliquée pour toujours,
                 et une animation passe DEVANT un style en ligne.
                 Mesuré : la taille calculée disait 393 × 852, le rectangle
                 réellement dessiné 321 × 654. L'écart, c'était elle.
                 Un style en ligne n'a pas le dernier mot en CSS. */
              animation: 'none',
              position: 'absolute', inset: 0, opacity: 1, transform: 'none',
            }
          : ajusteHauteur ? { width: '100%' } : undefined
      }
    >
      {/* ⚠️ LE VOILE EST SUPPRIMÉ, ET C'ÉTAIT LUI, L'ÉCRAN SOMBRE.
          Je l'avais posé pour « couper le site » en entrant dans l'application.
          Mais il était un ENFANT de la scène, à z-index 9999, avec un fond noir
          à 90 %. Dans le contexte d'empilement de la scène, il passait donc
          devant l'application au lieu de couper la page derrière : tout
          l'écran ressortait à un quart de sa luminosité.

          Et il m'a fait perdre trois passes, parce que le DOM disait la vérité
          et que je ne l'écoutais pas : toutes les opacités valaient 1, tous les
          textes étaient en rgb(248,250,252). J'ai accusé `will-change`, la
          composition d'iOS, le clavier. Le coupable était un élément que je
          croyais avoir retiré — mon remplacement précédent n'avait pas trouvé
          sa cible, et je ne l'avais pas vérifié.

          La preuve qui a tranché : la même maquette sur `/ou-ca-paie`, dans le
          même simulateur, s'affiche parfaitement lumineuse. Quand deux pages
          partagent un composant et qu'une seule est sombre, ce n'est jamais
          le navigateur.

          Le fond opaque de la scène coupe déjà le site, et le portail la sort
          de la page. La sortie reste la croix et la touche Échap. */}

      <div
        className={s.tel}
        style={
          immersif
            ? {
                /* ⚠️ `filter: none` N'EST PAS COSMÉTIQUE, C'EST LA CORRECTION.
                   `.tel` porte deux `drop-shadow`. Or un `filter` sur un
                   élément crée un BLOC CONTENEUR pour ses descendants en
                   `position: fixed` — ils cessent de se caler sur l'écran
                   et se calent sur lui. Mesuré : `.tel` faisait 4 px de
                   large, et l'app calculait donc `width: 100%` = 0.
                   C'est ce qui rendait le plein écran illisible.
                   On retire l'ombre : de toute façon, en plein écran, ce
                   n'est plus un objet posé qui doit projeter une ombre. */
                position: 'absolute', inset: 0,
                width: '100%', height: '100%', maxWidth: 'none', margin: 0,
                filter: 'none', animation: 'none', transform: 'none',
              }
            : ajusteHauteur
              /* ⚠️ LA LARGEUR COMMANDE. `height: 100%` calait le téléphone sur
                 la place restante et le rendait illisible (184 points de large,
                 texte à 7 px). Ici il prend toute la largeur, et c'est le bloc
                 parent qui le coupe en bas. `animation: none` retire le
                 flottement : un objet coupé net qui flotte tremble sur sa coupe. */
              ? { width: '100%', maxWidth: 'none', animation: 'none' }
              : undefined
        }
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {!immersif && <img
          src="/demo/ajnaya-cadre.png"
          alt=""
          aria-hidden="true"
          /* C'est elle qui donne sa taille au téléphone : dès qu'elle est
             là, on remesure. Ne pas s'en remettre au seul observateur. */
          onLoad={poserEchelle}
          style={ajusteHauteur ? { width: '100%', height: 'auto', display: 'block' } : undefined}
        />}
        {/* ⚠️ AU REPOS, TOUT L'ÉCRAN EST LA COMMANDE.
            Le téléphone est réduit d'un facteur ~0,62 : le champ ne mesure
            plus que 30 px de haut à l'écran réel, contre 48 exigés — la
            charte prend le plus exigeant des deux minimums parce que le
            téléphone de référence est un Galaxy A05. Une cible de 30 px
            n'est pas une cible, c'est un piège à pouce.
            On ne grossit pas le champ, ça casserait l'échelle de l'app :
            c'est l'écran entier qui devient touchable. */}
        {/* ⚠️ CE BOUTON NE PREND PLUS LE DOIGT — IL NE SERT PLUS QU'AU CLAVIER.
            Il porte `pointer-events: none` (feuille de style) : il devient
            invisible au toucher et à la souris, qui passent au travers jusqu'à
            l'écran et à ses deux gestes. Mais il reste dans le document, donc
            il garde son nom pour les lecteurs d'écran et il s'atteint à la
            tabulation avec un anneau de focus. Le supprimer aurait retiré la
            seule commande d'ouverture accessible au clavier. */}
        {immersifPossible && !immersif && (
          <button
            ref={declencheur}
            type="button"
            className={s.ouvrir}
            onClick={entrer}
            aria-label="Écrire à Ajnaya"
          />
        )}

        <div
          className={s.ecran}
          ref={ecranRef}
          onPointerDown={immersifPossible && !immersif ? doigtPose : undefined}
          onPointerUp={immersifPossible && !immersif ? doigtLeve : undefined}
          style={immersif ? { position: 'absolute', inset: 0, width: '100%', height: '100%', borderRadius: 0 } : undefined}
        >
          <div
            className={s.app}
            ref={appRef}
            /* ⚠️ L'APP EST TOUCHABLE À NOUVEAU — SAUF DEUX ENDROITS.
               Elle portait `pointer-events: none` en entier, et c'est ce qui la
               rendait morte : on ne pouvait rien y faire défiler.
               Mais on ne peut pas non plus tout rendre touchable. Mesuré sur
               iPhone 16 le 03/09 : `readOnly` NE SUFFIT PAS — sur iOS un champ
               en lecture seule reste focusable et ouvre quand même le clavier ;
               iOS fait alors défiler la page pour le dégager, et le téléphone
               sort de l'écran. C'était le « bug dégueulasse ».
               La règle est donc : le FIL est touchable (c'est lui qui défile),
               l'en-tête et la barre du bas ne le sont pas (voir la feuille de
               style, `.aj-head` et `.aj-dock` en mode posé). Bonus : un doigt
               posé sur l'en-tête ou sur la barre traverse et fait défiler la
               PAGE — le visiteur n'est jamais prisonnier du téléphone. */
            /* ⚠️ `!immersif` SEUL, ET PLUS `immersifPossible && !immersif`.
               Le téléphone est maintenant affiché AVANT que la zone soit
               donnée, et là `immersifPossible` vaut false : la barre du bas
               redevenait touchable. Un doigt sur « Parle ou tape… » aurait
               donné le focus au faux champ — et sur iOS un champ en lecture
               seule ouvre quand même le clavier, iOS fait défiler la page pour
               le dégager, le téléphone sort de l'écran. C'est exactement le
               « bug dégueulasse » du 03/09, qui serait revenu par la porte de
               derrière. Hors plein écran, on n'écrit jamais dans la maquette :
               la règle est la même sur toutes les pages. */
            data-pose={!immersif ? 'oui' : undefined}
          >
            {/* ── LE FOND : CINQ couches, pas deux. Et les halos ne sont
                   PAS des radiaux — voir la feuille de style. ────────── */}
            <div className={s['aj-fond']}>
              <i className={`${s['aj-trainee']} ${s['aj-t1']}`} />
              <i className={`${s['aj-trainee']} ${s['aj-t2']}`} />
              <i className={s['h-violet']} />
              <i className={s['h-cyan']} />
              <i className={s['h-wash']} />
              <i className={s['h-grain']} />
            </div>

            <header className={s['aj-head']}>
              {immersif && (
                <button type="button" className={s.fermer} onClick={sortir} aria-label="Revenir au site">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              )}
              <div className={s['aj-orbe']}>
                <span className={parle ? `${s.anneau} ${s.respire}` : s.anneau} />
                {/* ⚠️ 04/09 — IL N'Y A VOLONTAIREMENT AUCUNE ICÔNE ICI.
                    L'orbe garde son fond et son anneau, rien de plus.

                    Il y a eu un œil, repris d'`AjnayaEyeAvatar` — le composant
                    que l'app affiche en tête de l'écran Ajnaya. Chandler l'a
                    fait retirer. J'ai ensuite posé le glyphe `sparkles`, celui
                    que la barre d'onglets nomme dans
                    `FOREAS-Clean/src/components/navigation/FoTabBar.tsx:54` —
                    ce n'était pas non plus la bonne.

                    Ce sont les deux SEULES marques Ajnaya que l'app dessine :
                    l'œil dans l'écran, les étincelles dans l'onglet. Aucune
                    autre n'existe dans le dépôt. Sa consigne : « si tu ne la
                    trouves pas, mets rien, c'est mieux ». Une icône approchante
                    serait une troisième marque — et trois marques pour une
                    seule identité, c'est la garantie qu'aucune n'est la bonne. */}
              </div>
              <div className={s['aj-id']}>
                <div className={s['aj-nom']}>Ajnaya</div>
                {/* ⚠️ L'app écrit « Prête, {prénom} ». Ici le visiteur n'a
                    pas de prénom connu : on garde l'état, sans la personne. */}
                {/* ⚠️ LE NOM DE LA ZONE VIT ICI, ET C'EST STRUCTUREL.
                    Il était dans la bande « ≈ 32 €/h » que Chandler fait retirer.
                    Sans cette ligne, après quatre secondes de conversation, le
                    lieu qu'il a demandé n'est plus écrit NULLE PART à l'écran —
                    c'est exactement le défaut corrigé le 03/09, rouvert par un
                    correctif juste. Elle est hors du fil : elle ne peut pas
                    défiler, donc elle ne peut pas partir.
                    Et le point dit l'état, comme dans l'app : violet quand elle
                    cherche, cyan quand elle écoute, vert sinon. */}
                <div className={s['aj-etat']}>
                  <i style={{ background: ecoute ? '#00D4FF' : attente ? '#8C52FF' : '#10B981' }} />
                  {/* ⚠️ AVANT QU'IL AIT DEMANDÉ, ON N'AFFICHE PAS D'ÉTAT DE ZONE.
                      Sans zone, `nomLieu` retombe sur « ta zone » et le savoir
                      sur son repli, « calme » — l'en-tête affichait donc
                      « ta zone · calme », c'est-à-dire un état inventé sur un
                      lieu qui n'existe pas. On dit « En ligne », qui est vrai. */}
                  {(zoneCourante || '').trim() ? (
                    <>
                      <b>{nomLieu}</b>
                      <span className={s.pt}>·</span>
                      <span>{savoir.etat}</span>
                    </>
                  ) : (
                    <span>En ligne</span>
                  )}
                </div>
              </div>
              <button className={s['aj-aide']} type="button" aria-label="Aide">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm.9 15.1h-1.8v-1.8h1.8v1.8zm1.86-6.96l-.81.83c-.65.66-1.05 1.2-1.05 2.53h-1.8v-.45c0-.98.4-1.87 1.05-2.52l1.12-1.14c.33-.32.53-.77.53-1.27a1.8 1.8 0 10-3.6 0H8.4a3.6 3.6 0 117.2 0c0 .72-.29 1.37-.76 1.84z" /></svg>
              </button>
              {/* Elle ne « pense » que quand elle pense. Ce trait qui courait
                  en permanence volait la vedette à l'œil. */}
              {attente && <div className={s['aj-pense']}><i /></div>}
            </header>

            {/* ══ LA RÉPONSE, ÉPINGLÉE HORS DU FIL ═══════════════════════════
                ⚠️ ELLE ÉTAIT DANS LE FIL, ET C'ÉTAIT LE DÉFAUT.
                Le fil se recolle en bas à chaque message (voir plus haut, sans
                condition). La carte, premier enfant du fil, remontait donc avec
                lui : mesuré à 2,5 s, elle était 536 px AU-DESSUS du bord haut de
                l'écran, et le nom de la zone demandée n'était plus écrit nulle
                part. Ce n'était pas un défaut de hiérarchie — c'était de la
                géométrie : la réponse à sa question sortait physiquement du cadre.
                Sortie du fil, avec `flex: none` et un fond OPAQUE, elle ne peut
                plus bouger. C'est ça, « mettre en exergue ce qu'on lui a demandé ».
                Le fond doit être opaque : translucide, le texte qui défile
                dessous se lirait au travers. */}
            {/* ⚠️ LA BANDE « ≈ 32 €/h » EST RETIRÉE — Chandler, 04/09 :
                « retire le 32 € par heure, la bande complète qui prend un espace
                énorme ». Mesurée : 81 points de haut sur les 554 de l'écran,
                soit 15 % de la surface pour un nombre identique à Roissy et à
                Meaux. Rendus au fil : le contenu visible passe de 42 % à 55 %.
                CE QU'ON GARDE DE SON ACQUIS : la garantie que la zone demandée
                ne peut pas sortir du cadre. Elle vit maintenant dans l'en-tête,
                sur la ligne d'état, hors du fil.
                OÙ IRA LE VRAI CHIFFRE quand la Pieuvre parlera : sur cette même
                ligne d'état, à droite. Un seul endroit, déjà en face du lieu. */}
            <div className={s['aj-fil']} ref={filRef} aria-live="polite">

              <div className={s['aj-jour']}>{heures.jour}</div>

              {lignes.map((l, li) => (
                <div
                  key={l.id}
                  className={`${s['aj-ligne']} ${s[l.qui === 'toi' ? 'toi' : 'elle']}`}
                  /* C'est SUR SA QUESTION que le fil se cale, pas sur le bas. */
                  data-ancre={l.qui === 'toi' ? 'question' : undefined}
                >
                  <div className={s.etiq}>{l.etiq}</div>
                  <div className={s['aj-bulle']}>
                    {l.blocs.map((b, bi) =>
                      l.qui === 'toi' ? (
                        <div key={bi} className={s['aj-bloc']} dangerouslySetInnerHTML={{ __html: b.html }} />
                      ) : (
                        <div key={bi}>
                          {b.tag && (
                            <span className={`${s['aj-bloc']} ${s.tag} ${s[b.tag.couleur]}`}>{b.tag.texte}</span>
                          )}
                          <BlocPoussiere html={b.html} index={li * 3 + bi} />
                        </div>
                      ),
                    )}
                  </div>

                  {/* ── LES DEUX PORTES — après le savoir, jamais avant.
                         La dette est créée : on a donné un calcul et un geste. ── */}
                  {l.sorties && (
                    <>
                      <button className={`${s['aj-chip']} ${s.essai}`} type="button"
                              onPointerUp={(e) => e.stopPropagation()} onClick={onEssaiClick}>
                        <span className={s.ico}>
                          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" /></svg>
                        </span>
                        <span className={s.lib}>Essayer 3 jours — 0 € aujourd&apos;hui</span>
                        <span className={s.chev}>›</span>
                      </button>
                      <button className={`${s['aj-chip']} ${s.wa}`} type="button"
                              onPointerUp={(e) => e.stopPropagation()} onClick={onWhatsAppClick}>
                        <span className={s.ico}>
                          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 00-8.6 15L2 22l5.2-1.4A10 10 0 1012 2zm5.3 14.1c-.2.6-1.2 1.2-1.7 1.2-.4 0-1 .1-3.3-.8-2.8-1.2-4.5-4-4.6-4.2-.1-.2-1.1-1.4-1.1-2.7s.7-1.9 1-2.2c.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.5-.3.3c-.1.1-.2.3 0 .5.2.4.8 1.3 1.6 2 1.1.9 1.9 1.2 2.2 1.3.2.1.4.1.5-.1l.7-.8c.2-.2.3-.2.5-.1l2 .9c.2.1.4.2.4.3.1.2.1.7-.1 1.2z" /></svg>
                        </span>
                        <span className={s.lib}>Poser ma question sur WhatsApp</span>
                        <span className={s.chev}>›</span>
                      </button>
                    </>
                  )}
                </div>
              ))}

              {attente && (
                <p className={s['aj-chuchote']}>Ajnaya rassemble ce qu&rsquo;elle sait…</p>
              )}

              {/* La frise ne montre ce qui se paie qu'APRÈS avoir donné. */}
              {!!(zoneCourante || '').trim() && (
              <>
              {/* ⚠️ 04/09 — LA FRISE « LES ZONES RENTABLES, HEURE PAR HEURE » A ÉTÉ
                  RETIRÉE, sur demande de Chandler. Elle montrait trois créneaux
                  avec 31 / 44 / 52 €/h marqués « exemple ».
                  Ce qui reste dans le fil est ce qu'Ajnaya RÉPOND — pas une
                  vitrine de ce qu'elle saura faire. Le téléphone y gagne la
                  hauteur, et le récit n'a plus deux fins. */}
              </>
              )}
            </div>

            <footer className={s['aj-dock']}>
              <i className={s['aj-hair']} />
              {/* ⚠️ 04/09 — « VOIR MA ZONE SUR LA CARTE » A ÉTÉ RETIRÉ.
                  C'était une porte de plus au-dessus du champ de saisie, dans
                  un écran qui n'en demande qu'une : lui parler. */}
              <div className={s['aj-row']}>
                <button
                  className={`${s['aj-mic']} ${ecoute ? s.ecoute : ''}`}
                  type="button"
                  aria-label="Parler"
                  onClick={dicter}
                >
                  {ecoute ? (
                    <span className={s['aj-onde']}><i /><i /><i /><i /></span>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 14a3 3 0 003-3V5a3 3 0 00-6 0v6a3 3 0 003 3z" /><path d="M17 11a5 5 0 01-10 0H5a7 7 0 006 6.92V21h2v-3.08A7 7 0 0019 11h-2z" /></svg>
                  )}
                </button>
                <input
                  ref={champRef}
                  className={s['aj-champ']}
                  type="text"
                  /* L'invite s'écrit toute seule en plein écran. On anime
                     l'attribut lui-même : un calque posé par-dessus se
                     décale dès que la police ou l'échelle bougent. */
                  placeholder={invite}
                  autoComplete="off"
                  value={saisie}
                  readOnly={immersifPossible && !immersif}
                  tabIndex={immersifPossible && !immersif ? -1 : 0}
                  onChange={(e) => setSaisie(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && envoyer()}
                />
                <button
                  className={s['aj-send']}
                  type="button"
                  aria-label="Envoyer"
                  /* ⚠️ `stopPropagation` : ce bouton vit DANS l'écran, qui porte
                     le geste d'ouverture du plein écran. Sans ça, un appui ferait
                     partir DEUX actions — mesuré. */
                  onPointerUp={(e) => e.stopPropagation()}
                  onClick={() => envoyer()}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
                </button>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </div>
  </div>
  )

  return (
    <div
      ref={racineRef}
      className={s.racine}
      /* En mode ajusté, c'est le PARENT de cette racine qui fait la fenêtre :
         il a une hauteur ferme et `overflow: hidden`. On mesure sur lui. */
      style={ajusteHauteur ? { width: '100%' } : undefined}
    >
      {/* ⚠️ EN MODE AJUSTÉ, CETTE LIGNE DISPARAÎT ENTIÈREMENT.
          Mesuré : elle mangeait 105 px de haut pour une pastille verte et un
          commentaire sur nous-mêmes — et ces 105 px, c'est le téléphone qui
          les perdait. Il passait de 230 à 175 points de large.
          Cacher le texte sans retirer le bloc ne sert à rien : c'est la
          HAUTEUR qui coûte, pas le texte. */}
      {!ajusteHauteur && (
        <p className={`${s.vivant} ${arrive ? s.on : ''}`}>
          <span className={s.pt} />
          <em>Reproduction réelle de FOREAS Driver</em>
        </p>
      )}

      {/* ⚠️ CHAQUE NIVEAU DOIT AVOIR UNE HAUTEUR, SINON `height: 100%` NE VAUT RIEN.
          Mesuré le 03/09 : le téléphone faisait 538 px dans une boîte de 432 et
          recouvrait le bouton WhatsApp. Cause — `.scene` porte `min-height: 60px`
          et `.arrivee` aucune hauteur. Un `height: 100%` posé sur l'enfant remonte
          la chaîne, ne trouve aucune hauteur ferme, et retombe sur la taille
          naturelle de l'image. Il faut la poser à TOUS les étages. */}
      {immersif && typeof document !== 'undefined'
        ? createPortal(scene, document.body)
        : scene}
    </div>
  )
}

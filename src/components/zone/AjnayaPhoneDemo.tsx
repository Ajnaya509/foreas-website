'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import s from './ajnayaPhone.module.css'
import { typePourZone } from './ajnayaSavoir'
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
}) {
  const ecranRef = useRef<HTMLDivElement | null>(null)
  const appRef = useRef<HTMLDivElement | null>(null)
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
    const k = l / LARGEUR_APP
    app.style.transform = `scale(${k})`
    app.style.height = `${ecran.clientHeight / k}px`
  }, [])

  useEffect(() => {
    const ecran = ecranRef.current
    if (!ecran) return
    poserEchelle()
    const ro = new ResizeObserver(poserEchelle)
    ro.observe(ecran)
    return () => ro.disconnect()
  }, [poserEchelle])

  /* ══ LE PLEIN ÉCRAN ═══════════════════════════════════════════════════════
     Le téléphone quitte son châssis et prend tout l'écran. Le clavier monte,
     le champ vient se poser dessus. À partir de là, on est DANS l'application. */

  const entrer = useCallback(() => {
    if (!immersifPossible) return
    setImmersif(true)
  }, [immersifPossible])

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

    /* Le focus vient APRÈS le passage en plein écran. Dans l'autre ordre, le
       clavier monte pendant que la mise en page bouge encore : c'est le saut. */
    const t = window.setTimeout(() => champRef.current?.focus(), 70)

    return () => {
      vv?.removeEventListener('resize', coller)
      vv?.removeEventListener('scroll', coller)
      window.removeEventListener('resize', coller)
      window.removeEventListener('keydown', surEchap)
      window.clearTimeout(t)
      b.style.position = avant.position
      b.style.top = avant.top
      b.style.width = avant.width
      b.style.overflow = avant.overflow
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

  /* Le fil descend à chaque ajout : sinon la dernière bulle naît hors champ. */
  useEffect(() => {
    const f = filRef.current
    if (f) f.scrollTop = f.scrollHeight
  }, [lignes, attente])

  /* ══ LA CONVERSATION ══════════════════════════════════════════════════════ */
  useEffect(() => {
    minuteurs.current.forEach(clearTimeout)
    minuteurs.current = []

    const t = typePourZone(zoneCourante || '')
    const hh = lireHorloge().hh
    const nom = (zoneCourante || '').trim() || 'ma zone'

    setLignes([{ id: 'q', qui: 'toi', etiq: `Toi · ${hh}`, blocs: [{ html: `Ça donne quoi ${nom} ?` }] }])
    /* ⚠️ Le chuchotement, pas un « … » ni un rouet : dans l'app il n'y a ni
       bulle d'attente, ni indicateur de chargement, jamais. */
    setAttente(true)

    plusTard(620, () => {
      setAttente(false)
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
        })
      })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoneCourante])

  /* Le téléphone n'existe pas avant la question. Il ARRIVE — c'est le moment
     qui fait « ah ». UNE SEULE FOIS : le rejouer à chaque question deviendrait
     un tic, et le brief l'interdit explicitement (§12.7). */
  useEffect(() => {
    if (!arrive) setArrive(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => setZoneCourante(zone), [zone])

  const envoyer = () => {
    const v = saisie.trim()
    if (!v) return
    setZoneCourante(v)
    setSaisie('')
  }

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
          setZoneCourante(nomLieu)
          plusTard(400, () => setSaisie(''))
        })
      }
    }
    mot()
  }

  return (
    <div className={s.racine}>
      <p className={`${s.vivant} ${arrive ? s.on : ''}`}>
        <span className={s.pt} />
        <em>Reproduction réelle de FOREAS Driver</em>
      </p>

      <div className={`${s.scene} ${immersif ? s.immersif : ''}`}>
        <div className={`${s.arrivee} ${arrive ? s.on : ''}`}>
          {/* Le voile qui coupe le site quand on entre dans l'application. */}
          {immersif && <div className={s.voile} onClick={sortir} aria-hidden="true" />}

          <div className={s.tel}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {!immersif && <img
              src="/demo/ajnaya-cadre.png"
              alt=""
              aria-hidden="true"
              /* C'est elle qui donne sa taille au téléphone : dès qu'elle est
                 là, on remesure. Ne pas s'en remettre au seul observateur. */
              onLoad={poserEchelle}
            />}
            {/* ⚠️ AU REPOS, TOUT L'ÉCRAN EST LA COMMANDE.
                Le téléphone est réduit d'un facteur ~0,62 : le champ ne mesure
                plus que 30 px de haut à l'écran réel, contre 48 exigés — la
                charte prend le plus exigeant des deux minimums parce que le
                téléphone de référence est un Galaxy A05. Une cible de 30 px
                n'est pas une cible, c'est un piège à pouce.
                On ne grossit pas le champ, ça casserait l'échelle de l'app :
                c'est l'écran entier qui devient touchable. */}
            {immersifPossible && !immersif && (
              <button
                ref={declencheur}
                type="button"
                className={s.ouvrir}
                onClick={entrer}
                aria-label="Écrire à Ajnaya"
              />
            )}

            <div className={s.ecran} ref={ecranRef}>
              <div className={s.app} ref={appRef}>
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
                    <span className={s.anneau} />
                    {/* L'œil d'Ajnaya — SVG repris trait pour trait d'AjnayaEyeAvatar. */}
                    <svg viewBox="0 0 100 100" aria-hidden="true">
                      <defs>
                        <radialGradient id="ajFond"><stop offset="0" stopColor="#0D1526" /><stop offset="1" stopColor="#080C18" /></radialGradient>
                        <radialGradient id="ajHalo"><stop offset="0" stopColor="#00D4FF" stopOpacity=".25" /><stop offset=".6" stopColor="#6C3CE0" stopOpacity=".10" /><stop offset="1" stopColor="#6C3CE0" stopOpacity="0" /></radialGradient>
                        <radialGradient id="ajScl" fx=".45" fy=".46"><stop offset="0" stopColor="#F0F4FF" /><stop offset=".7" stopColor="#D8E0F0" /><stop offset="1" stopColor="#B8C4D8" /></radialGradient>
                        <radialGradient id="ajIris" fx=".46" fy=".46"><stop offset="0" stopColor="#6DEAFF" /><stop offset=".45" stopColor="#00D4FF" /><stop offset=".7" stopColor="#6C3CE0" /><stop offset="1" stopColor="#4A25A0" /></radialGradient>
                      </defs>
                      <circle cx="50" cy="50" r="48" fill="url(#ajFond)" />
                      <circle cx="50" cy="50" r="35" fill="url(#ajHalo)" />
                      <path d="M 16 50 C 28 32 40 26 50 26 C 60 26 72 32 84 50 C 72 68 60 74 50 74 C 40 74 28 68 16 50 Z" fill="url(#ajScl)" />
                      <circle cx="50" cy="50" r="17" fill="url(#ajIris)" />
                      <circle cx="50" cy="50" r="17" fill="none" stroke="#3A1A80" strokeWidth="1.5" opacity=".4" />
                      <circle cx="50" cy="50" r="6.5" fill="#050510" />
                      <ellipse cx="44" cy="44" rx="4" ry="3.5" fill="#fff" opacity=".85" />
                      <circle cx="55" cy="55" r="1.8" fill="#fff" opacity=".5" />
                      <path d="M 16 50 C 28 32 40 26 50 26 C 60 26 72 32 84 50 C 72 68 60 74 50 74 C 40 74 28 68 16 50 Z" fill="none" stroke="#2A3A52" strokeWidth="1.5" opacity=".6" />
                      <path d="M 18 50 C 30 33 41 27 50 27 C 59 27 70 33 82 50" fill="none" stroke="#1A2540" strokeWidth="2" strokeLinecap="round" opacity=".7" />
                      <circle cx="22" cy="38" r="1.2" fill="#6DEAFF" opacity=".5" />
                      <circle cx="78" cy="42" r="1" fill="#8C52FF" opacity=".4" />
                      <circle cx="50" cy="22" r=".8" fill="#00D4FF" opacity=".3" />
                    </svg>
                  </div>
                  <div className={s['aj-id']}>
                    <div className={s['aj-nom']}>Ajnaya</div>
                    {/* ⚠️ L'app écrit « Prête, {prénom} ». Ici le visiteur n'a
                        pas de prénom connu : on garde l'état, sans la personne. */}
                    <div className={s['aj-etat']}><i />En ligne</div>
                  </div>
                  <button className={s['aj-aide']} type="button" aria-label="Aide">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm.9 15.1h-1.8v-1.8h1.8v1.8zm1.86-6.96l-.81.83c-.65.66-1.05 1.2-1.05 2.53h-1.8v-.45c0-.98.4-1.87 1.05-2.52l1.12-1.14c.33-.32.53-.77.53-1.27a1.8 1.8 0 10-3.6 0H8.4a3.6 3.6 0 117.2 0c0 .72-.29 1.37-.76 1.84z" /></svg>
                  </button>
                  <div className={s['aj-pense']}><i /></div>
                </header>

                <div className={s['aj-fil']} ref={filRef} aria-live="polite">
                  {/* ── LA CARTE D'ESTIMATION — bord haut DOUBLE : une lumière
                         pleine largeur, PUIS un filet en retrait de 18 px. ── */}
                  <div className={s['aj-banniere']}>
                    <span className={s.lum} />
                    <span className={s.filet} />
                    <div className={s.gauche}>
                      <div className={s['aj-sous']}>
                        <span className={s['aj-approx']}>≈</span>
                        <span className={s['aj-montant']}>32</span>
                        <span className={s['aj-unite']}>€/h</span>
                      </div>
                      <div className={s['aj-zone']}>
                        Autour de {nomLieu} · {savoir.etat}
                      </div>
                    </div>
                    <div className={s['aj-droite']}>
                      <span className={s['aj-tampon']}>estimation · {heures.hh}</span>
                      <span className={s.chev}>›</span>
                    </div>
                  </div>

                  <div className={s['aj-frise']}>
                    <div className={s.titre}>
                      Les zones rentables, heure par heure
                      {/* ⚠️ LE MOT « EXEMPLE » EST À L'ÉCRAN, PAS SEULEMENT EN COMMENTAIRE.
                          Le grincheux du 03/09 a eu raison : le fichier disait honnêtement
                          « 31/44/52 sont des EXEMPLES », et l'écran ne le disait nulle part.
                          Un commentaire juste au-dessus d'un écran qui ment est un faux témoin,
                          pas une protection. */}
                      <span className={s['aj-exemple']}>exemple</span>
                    </div>
                    <p className={s['aj-promesse']}>
                      Ajnaya sait où ça paie autour de <b>{nomLieu}</b> — <b>cette heure-ci, et les deux qui suivent</b>.
                    </p>
                    <div className={s['aj-piste']}>
                      <div className={s['aj-points']}>
                        <div className={`${s['aj-tiers']} ${s.d}`}><span className={`${s['aj-point']} ${s.on}`} /></div>
                        <div className={`${s['aj-tiers']} ${s.m}`}><span className={`${s['aj-point']} ${s.futur}`} /></div>
                        <div className={`${s['aj-tiers']} ${s.f}`}><span className={`${s['aj-point']} ${s.futur}`} /></div>
                      </div>
                    </div>
                    <div className={s['aj-heures']}>
                      {/* ⚠️ 31/44/52 €/h sont des EXEMPLES, pas des mesures. En
                          euros et non en pourcentage : un « +61 % » ne se dépense pas. */}
                      <div className={`${s['aj-tiers']} ${s.d}`}>
                        <span className={s['aj-heure']}>{heures.h1}</span><span className={s.val}>31 €/h</span>
                      </div>
                      <div className={`${s['aj-tiers']} ${s.m} ${s.floue}`}>
                        <span className={s['aj-heure']}>{heures.h2}</span><span className={s.val}>44 €/h</span>
                      </div>
                      <div className={`${s['aj-tiers']} ${s.f} ${s.floue}`}>
                        <span className={s['aj-heure']}>{heures.h3}</span><span className={s.val}>52 €/h</span>
                      </div>
                    </div>
                    {/* ⚠️ CE VERROU N'EXISTE PAS DANS L'APP — voir l'en-tête. */}
                    <div className={s['aj-verrou']} onClick={onEssaiClick} role="button" tabIndex={0}
                         onKeyDown={(e) => e.key === 'Enter' && onEssaiClick?.()}>
                      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 9V7a5 5 0 00-10 0v2H5v13h14V9h-2zM9 7a3 3 0 016 0v2H9V7zm4 9.7V19h-2v-2.3a2 2 0 112 0z" /></svg>
                      {/* ⚠️ NE JAMAIS ÉCRIRE « réservées aux abonnés ». C'était faux deux fois :
                          ce verrou n'existe pas dans l'app, et les chiffres floutés derrière
                          ne sont mesurés nulle part. On vendait donc l'ouverture d'un vide.
                          Dans l'app, un point éteint veut dire « rien de mesuré », jamais « bloqué ». */}
                      <span>Exemple. Dans l'app, ces heures viennent de <b>ce qui est mesuré</b>.</span>
                      <span className={s.fl}>›</span>
                    </div>
                  </div>

                  <div className={s['aj-jour']}>{heures.jour}</div>

                  {lignes.map((l, li) => (
                    <div key={l.id} className={`${s['aj-ligne']} ${s[l.qui === 'toi' ? 'toi' : 'elle']}`}>
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
                          <button className={`${s['aj-chip']} ${s.essai}`} type="button" onClick={onEssaiClick}>
                            <span className={s.ico}>
                              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" /></svg>
                            </span>
                            <span className={s.lib}>Essayer 3 jours — 0 € aujourd&apos;hui</span>
                            <span className={s.chev}>›</span>
                          </button>
                          <button className={`${s['aj-chip']} ${s.wa}`} type="button" onClick={onWhatsAppClick}>
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
                </div>

                <footer className={s['aj-dock']}>
                  <i className={s['aj-hair']} />
                  <div className={s['aj-sugg']}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 17H7A5 5 0 017 7h2M15 7h2a5 5 0 010 10h-2M8 12h8" /></svg>
                    Voir ma zone sur la carte
                  </div>
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
                    <button className={s['aj-send']} type="button" aria-label="Envoyer" onClick={envoyer}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
                    </button>
                  </div>
                </footer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

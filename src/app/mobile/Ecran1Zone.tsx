'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import AjnayaPhoneDemo from '@/components/zone/AjnayaPhoneDemo'
import s from './mobile.module.css'

/**
 * ÉCRAN 1 — LA QUESTION DE ZONE, PUIS LE TÉLÉPHONE.
 *
 * Décision de Chandler, 03/09 : la zone passe en PREMIER, et la réponse
 * apparaît DANS le téléphone, pas dans un bloc de texte du site.
 *
 * Raison mesurée : moins d'un visiteur mobile sur deux fait défiler une page
 * (45,2 %, Contentsquare, 99 milliards de sessions). Ce qui compte doit être
 * au premier écran, et taper un nom de lieu est le geste le plus facile qui
 * soit — un chauffeur connaît sa zone par cœur, il n'a rien à chercher.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ LA PREMIÈRE RÉPONSE EST UNE RÉPONSE DE VENTE. C'EST VOULU ET ASSUMÉ.
 *
 * Consigne de Chandler : « pas réponse honnête, réponse marketing (crédible) —
 * on vend, nous, à ce moment, il faut le savoir ».
 *
 * ⚠️ MAIS ELLE NE CONTIENT AUCUN CHIFFRE DE ZONE, ET C'EST LA CLÉ.
 * Le mot employé est « crédible ». Un chauffeur qui roule à Roissy et qui lit
 * un euro-par-heure inventé le vérifie en une nuit — et il ne revient pas.
 * La vente vient donc du PROBLÈME, vrai partout, jamais d'une mesure absente.
 * Conséquence : cette réponse ne peut pas casser. Elle ne lit aucune table.
 *
 * ⚠️ RIEN NE PART AU RÉSEAU. AUJOURD'HUI, ET IL FAUT LE LIRE ICI.
 * Ce commentaire disait le contraire : « dès qu'il écrit, la question part à
 * /api/ajnaya/chat, qui passe par le cerveau ». C'était faux, et vérifiable en
 * une seconde : il n'existe AUCUN appel réseau dans AjnayaPhoneDemo.tsx.
 * Un commentaire qui promet ce que le code ne fait pas est un faux témoin — il
 * envoie le prochain qui passe chercher la panne dans une API qui n'est même
 * pas appelée.
 * CE QUI SE PASSE VRAIMENT : ce qu'il écrit est comparé à une liste de lieux
 * (ajnayaSavoir.ts, hors ligne). Si c'est un lieu, la zone change. Sinon la
 * zone NE BOUGE PAS et une réponse écrite d'avance lui répond.
 * Le jour où la Pieuvre parle, c'est `envoyer()` qu'il faudra brancher, et rien
 * d'autre. Chandler s'en charge — décision du 04/09 : « on ne va pas encore
 * brancher le cerveau ».
 */

/* Ces cinq noms ne sont plus des boutons : ils défilent dans l'invite du
   champ. Un seul geste demandé, et l'exemple est sous les yeux. */
/* ⚠️ CINQ NOMS PARISIENS, ET RIEN D'AUTRE : c'était la première chose qu'un
   chauffeur de Marseille ou de Lille voyait défiler. Une invite dit aussi à qui
   la page s'adresse. Trois villes entrent dans la liste. */
const ZONES_SUGGEREES = ['Roissy CDG', 'Marseille Saint-Charles', 'La Défense',
                         'Lyon Part-Dieu', 'Bastille', 'Nice Aéroport', 'Gare de Lyon']

/* ⚠️ L'INVITE S'ÉCRIT TOUTE SEULE, ET CE N'EST PAS UN EFFET.
   Un champ vide ne dit pas ce qu'on attend dedans. Un champ où un nom de lieu
   s'écrit lettre à lettre le dit sans un mot de plus, et il montre en même
   temps qu'on comprend les vrais noms du métier.
   Un seul minuteur, et l'indice vit dans un `ref` : sur un `state`, chaque
   rendu de la page le remettrait à zéro et l'écriture bégaierait. Piège déjà
   payé sur le champ du téléphone. */
const RYTHME_MS = 62
const PAUSE_PLEIN = 22   // tours d'attente une fois le mot écrit
const PAUSE_VIDE = 4

export default function Ecran1Zone({ lienWhatsApp }: { lienWhatsApp: string }) {
  const sectionRef = useRef<HTMLElement | null>(null)
  const champRef = useRef<HTMLInputElement | null>(null)
  const rappel = useRef<number | null>(null)
  const [zone, setZone] = useState('')
  const [validee, setValidee] = useState<string | null>(null)
  const [invite, setInvite] = useState('')
  const iLieu = useRef(0)
  const iLettre = useRef(0)
  const sens = useRef<1 | -1>(1)
  const pause = useRef(6)

  /* ⚠️ ON MESURE LE BANDEAU DE CONSENTEMENT, ON NE DEVINE PAS SA HAUTEUR.
     Il fait 155 points quand le texte tient sur 4 lignes, 230 quand il en
     prend 6 — ça dépend de la largeur, de la langue et du réglage de taille
     de texte. Une valeur écrite en dur marche sur un téléphone et coupe le
     champ de saisie sur un autre. C'est exactement le bug vu sur iPhone 16. */
  useEffect(() => {
    const mesurer = () => {
      const b = document.querySelector<HTMLElement>('[class*="fixed"][class*="bottom-0"]')
      const h = b && b.offsetHeight > 0 ? b.offsetHeight : 0
      document.documentElement.style.setProperty('--bandeau', `${h}px`)
    }
    mesurer()
    const ro = new ResizeObserver(mesurer)
    const b = document.querySelector('[class*="fixed"][class*="bottom-0"]')
    if (b) ro.observe(b)
    /* Le bandeau peut arriver APRÈS nous (il attend le consentement stocké),
       et il peut disparaître quand on répond. On surveille les deux. */
    const mo = new MutationObserver(mesurer)
    mo.observe(document.body, { childList: true })
    window.addEventListener('resize', mesurer)
    return () => { ro.disconnect(); mo.disconnect(); window.removeEventListener('resize', mesurer) }
  }, [])

  /* ══ REMONTER LA PAGE SUR LE TÉLÉPHONE ════════════════════════════════════
     ⚠️ MESURÉ, ET C'EST LE REPROCHE N°1 DE CHANDLER : « le mockup n'ancre pas
     en haut, le chauffeur ne saura pas qu'il doit monter la page ».
     Le scénario réel : il touche le champ « Ta zone », iOS ouvre le clavier ET
     fait défiler la page de ~259 px pour dégager le champ. Il tape, il valide.
     Le clavier se referme — mais la page reste où iOS l'a laissée. Relevé :
     le titre à −239 px, le haut du téléphone mangé sur 152 px, l'en-tête
     d'Ajnaya entièrement hors champ. Et rien ne le lui signale : le bouton du
     bas, lui, est bien visible.

     ⚠️ `behavior: 'instant'` ET SURTOUT PAS `'auto'`.
     globals.css pose `html { scroll-behavior: smooth }`. Sous cette règle,
     `scrollTo(0, y)`, `scrollTop = y` ET `scrollTo({behavior:'auto'})` sont
     tous les trois ANIMÉS — mesuré à ~600 ms. « auto » veut dire « ce que dit
     la feuille de style », pas « tout de suite ». Seul `'instant'` saute.
     Un défilement animé ici s'annule sous le premier doigt posé.
     Et comme il n'y a aucune animation, le mouvement réduit est respecté. */
  const sauter = (haut: number) => {
    try {
      window.scrollTo({ top: haut, behavior: 'instant' as ScrollBehavior })
    } catch {
      /* Un moteur qui ne connaît pas 'instant' REJETTE tout l'appel : sans ce
         repli, le correctif ne s'appliquerait jamais, et en silence. */
      const d = document.documentElement
      const avant = d.style.scrollBehavior
      d.style.scrollBehavior = 'auto'
      window.scrollTo(0, haut)
      d.style.scrollBehavior = avant
    }
  }

  const remonter = useCallback(() => {
    const sec = sectionRef.current
    if (!sec) return
    sauter(sec.getBoundingClientRect().top + window.scrollY)
    /* UNE relance, pas une bataille. Sur iPhone le clavier met ~250 ms à se
       refermer et Safari recale la page APRÈS : sans elle, son recalage gagne.
       Une boucle, elle, volerait le défilement au chauffeur pendant une seconde. */
    if (rappel.current) window.clearTimeout(rappel.current)
    rappel.current = window.setTimeout(() => {
      const s2 = sectionRef.current
      if (!s2) return
      /* Le plein écran du téléphone fige le corps : on ne se bat pas avec lui. */
      if (document.body.style.position === 'fixed') return
      const h2 = s2.getBoundingClientRect().top + window.scrollY
      if (Math.abs(window.scrollY - h2) > 4) sauter(h2)
    }, 450)
  }, [])

  /* Sans ça, quitter la page pendant les 450 ms tire un défilement sur la suivante. */
  useEffect(() => () => { if (rappel.current) window.clearTimeout(rappel.current) }, [])

  /* L'invite qui s'écrit toute seule. S'arrête dès qu'il tape, et pour de bon
     dès qu'il a donné sa zone. Coupée aussi si le mouvement est réduit : une
     animation qui tourne en boucle est exactement ce que ce réglage refuse. */
  useEffect(() => {
    if (validee) return
    if (typeof window !== 'undefined'
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setInvite('Roissy, Bastille, Lyon…')
      return
    }
    const battement = window.setInterval(() => {
      if (pause.current > 0) { pause.current -= 1; return }
      const mot = ZONES_SUGGEREES[iLieu.current]
      iLettre.current += sens.current
      if (iLettre.current >= mot.length) { sens.current = -1; pause.current = PAUSE_PLEIN }
      else if (iLettre.current <= 0) {
        sens.current = 1
        pause.current = PAUSE_VIDE
        iLieu.current = (iLieu.current + 1) % ZONES_SUGGEREES.length
      }
      setInvite(ZONES_SUGGEREES[iLieu.current].slice(0, Math.max(0, iLettre.current)))
    }, RYTHME_MS)
    return () => window.clearInterval(battement)
  }, [validee])

  const valider = (valeur: string) => {
    const propre = valeur.trim()
    if (!propre) return
    /* ⚠️ L'ORDRE COMPTE. On referme le clavier NOUS-MÊMES pendant que le champ
       existe encore : avec `enterKeyHint="go"`, la touche « Go » valide sans
       jamais faire perdre le focus, et le champ est démonté dans le même rendu.
       iOS referme alors le clavier sans rendre la page à sa place. */
    champRef.current?.blur()
    setZone(propre)
    setValidee(propre)
    /* La barre du bas vit dans un autre composant et n'a aucun moyen de savoir
       ce qu'il vient de taper. Sans ça, son bouton dit « ce que ta zone donne »
       et ouvre une conversation où Ajnaya redemande la zone : le chauffeur
       répète ce qu'il vient d'écrire, et c'est là qu'on les perd.
       `sessionStorage` porte le cas du retour depuis WhatsApp, l'événement
       porte le cas normal — les deux sont nécessaires. */
    try { window.sessionStorage.setItem('foreas_zone_hero', propre) } catch { /* mode privé */ }
    window.dispatchEvent(new CustomEvent('foreas:zone', { detail: propre }))
    remonter()
  }


  return (
    <section
      ref={sectionRef}
      /* Repère de la barre collante : elle ne s'affiche que quand CE bloc a
         quitté l'écran. Le champ de saisie vit dedans, et la barre viendrait
         se poser exactement dessus. */
      id="hero-mobile"
      /* ⚠️ UN SEUL OBJECTIF PAR ÉCRAN, ET ÇA SE VOIT DANS LA MISE EN PAGE.
         Tant qu'il n'a pas donné son lieu, il n'y a qu'une chose à faire sur
         cette page : la dire. Le bloc est donc calé au MILIEU de l'écran, pas
         collé en haut — le vide autour n'est pas de la place perdue, c'est ce
         qui empêche l'œil d'aller chercher autre chose.
         Dès que le lieu est donné, on repasse en haut : le téléphone a besoin
         de toute la hauteur, et il devient le nouvel objectif unique. */
      className={`${s.ecran1} ${validee ? '' : s.ecran1Attente}`}
      aria-labelledby="titre-zone"
    >
      <div className={s.halos} aria-hidden="true" />
      <div className={s.grain} aria-hidden="true" />

      {/* ══ LE HAUT DE PAGE ══════════════════════════════════════════════════
          Décision de Chandler, 04/09 : la copie forte passe EN HAUT, visible
          dès le chargement, et le téléphone est là avec elle.

          ⚠️ LE SOUS-TITRE A CHANGÉ, ET C'EST VOULU.
          Chandler voulait garder « Une course arrive. Tu as huit secondes pour
          dire oui ou non. » Mais cette phrase annonce une COURSE, alors que le
          geste demandé juste en dessous est de donner une ZONE, et que la
          réponse du téléphone porte sur la zone. Un sous-titre qui annonce
          autre chose que ce que fait le bouton, c'est une promesse cassée dans
          les trois secondes.
          Celui-ci fait le pont : il explique le titre (rouler moins ET gagner
          plus, c'est possible si c'est l'endroit qui compte) et il amène le
          geste. C'est le mécanisme, pas une promesse chiffrée — donc rien à
          vérifier, rien à démentir.
          La phrase de la course n'est pas perdue : elle vit plus bas, à sa
          place, au-dessus de la scène qui montre justement une course.

          ⚠️ LE SURTITRE « FOREAS DRIVER · POUR CHAUFFEURS VTC » EST SUPPRIMÉ.
          Chandler, 04/09 : « c'est inutile et ça disperse la concentration
          cognitive, on veut un objectif par section, pas plus ».
          Il avait raison sur le fond : il annonçait à qui on parle à quelqu'un
          qui SAIT déjà qui il est — il vient de cliquer une publicité pour
          chauffeurs. Il coûtait 22 points de haut et une première lecture pour
          zéro décision. La marque n'est pas perdue : elle est écrite dans le
          téléphone, sur le bouton d'essai, et dans le pied de page. */}

      {!validee ? (
        <>
          <h1 id="titre-zone" className={s.titreHero}>
            Gagne plus.<br />Roule moins.
          </h1>
          <p className={s.sousHero}>
            Rouler plus ne paie plus. <b>Être au bon endroit, oui.</b>
          </p>
        </>
      ) : (
        <div className={s.consigne}>
          <div className={s.consigneTexte}>
            <h1 id="titre-zone" className={s.consigneTitre}>Touche l&apos;écran.</h1>
            <p className={s.consigneSous}>
              Tu parles à Ajnaya <b>dans l&apos;app que tu auras</b>.
            </p>
          </div>
          {/* Écrit court pour que « Touche l'écran. » tienne sur UNE ligne. */}
          <button
            type="button"
            className={s.changer}
            aria-label="Changer de zone"
            onClick={() => setValidee(null)}
          >
            Changer
          </button>
        </div>
      )}

      {/* ⚠️ LE BOUTON « VOIR » N'EST PLUS DÉSACTIVÉ QUAND LE CHAMP EST VIDE.
          Sur téléphone, un bouton gris se lit « cassé », pas « en attente » :
          le chauffeur appuie, rien ne bouge, et il croit que la page ne marche
          pas — sur le premier écran, avant d'avoir rien lu. Il reste actif :
          appuyé à vide, il met le curseur dans le champ et fait monter le
          clavier. Le geste ne rate jamais. */}
      {!validee && (
        <form
          className={s.champBloc}
          onSubmit={(e) => {
            e.preventDefault()
            if (!zone.trim()) { champRef.current?.focus(); return }
            valider(zone)
          }}
        >
          {/* Le libellé reste pour les lecteurs d'écran : l'invite qui s'écrit
              toute seule ne se lit pas à voix haute, et un champ sans nom est
              un champ inutilisable au clavier. */}
          <label htmlFor="zone" className={s.champLabelCache}>Ta zone</label>
          <div className={s.champRangee}>
            <svg className={s.loupe} viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.6-3.6" />
            </svg>
            <input
              id="zone"
              ref={champRef}
              className={s.champ}
              type="text"
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              /* L'invite s'écrit lettre à lettre. Elle dit ce qu'on attend
                 dedans SANS une ligne de texte en plus, et elle montre au
                 passage qu'on connaît les vrais noms du métier. */
              placeholder={invite || ' '}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="words"
              enterKeyHint="go"
              aria-describedby="aide-zone"
            />
            <button type="submit" className={s.champBouton}>Voir</button>
          </div>
          <span id="aide-zone" className={s.champLabelCache}>
            Tape le nom de ta zone, par exemple Roissy CDG ou Bastille.
          </span>

          {/* ══ CE QU'ELLE FAIT, SOUS LA BARRE ═══════════════════════════════
              Chandler, 04/09 : « les bulles en bas doivent disparaître et
              laisser place à une phrase qui explique simplement ». Les cinq
              puces étaient cinq décisions de plus sous une barre qui n'en
              demandait qu'une. À leur place, la seule chose qui manquait :
              ce qu'Ajnaya fait pour lui.

              ⚠️ SA FORMULATION EXACTE ÉTAIT INTERDITE PAR LE DÉPÔT.
              Il proposait « analyse en temps réel où se trouve la demande ».
              `scripts/verifier-canon.mjs` refuse « demande en temps réel » —
              et sa raison est mesurée : `driver_ride_features` contient ZÉRO
              ligne, aucune lecture continue ne tourne. La phrase aurait arrêté
              la fabrication du site, et surtout elle aurait promis un service
              qui n'existe pas encore.
              CE QUI EST VRAI, ET QUE N'IMPORTE QUEL CHAUFFEUR PEUT VÉRIFIER CE
              SOIR, c'est le RYTHME : la vague qui tombe vingt minutes après un
              atterrissage, la gare qui se vide d'un coup, le quartier d'affaires
              mort entre 10 h et 16 h. C'est exactement ce que le téléphone lui
              répond deux secondes plus tard. La promesse et la démonstration
              disent donc la même chose — c'est ça qui fait la confiance.
              ⚠️ Tutoiement : la règle de voix chauffeur, tenue partout. */}
          <p className={s.explique}>
            Ajnaya connaît le <b>rythme de ta zone</b>. Moins d&apos;attente,
            moins de vide.
          </p>
          <p className={s.rassure}>Réponse immédiate. Ni compte, ni installation.</p>

        </form>
      )}

          {!validee && (
      <>
      {/* ══ LE PRIX, EN BAS, SANS QU'ON LE DEMANDE ═══════════════════════
          Le jury du 03/09 l'a relevé cinq fois sur cinq : « le premier
          écran ne dit ni ce que c'est, ni ce que ça rapporte, ni ce que ça
          coûte ». Le montant vivait deux écrans plus bas, vu par moins d'un
          visiteur sur deux.
          Il est ici, et il n'est PAS un bouton : l'objectif de cet écran
          reste unique — dire son lieu. Un prix annoncé avant qu'on le
          demande ne coûte rien et lève l'objection la plus chère de toutes
          (40 % des abandons viennent d'un montant découvert trop tard —
          Baymard). Collé en bas par `margin-top: auto`, il remplit le vide
          au lieu qu'on ait à inventer un décor.
          ⚠️ « 3 jours pour voir » et pas « sans carte » : la carte EST
          enregistrée à l'inscription, le garde-fou du dépôt refuse la
          seconde formule, et il a raison. */}
      <p className={s.prixHero}>
        <b>0 €</b> aujourd&apos;hui
        <span className={s.pointHero}>·</span>
        <b>3 jours</b> pour voir
        <span className={s.pointHero}>·</span>
        coupé en <b>1 clic</b>
      </p>
      </>
      )}


      {/* ══ LE TÉLÉPHONE N'ARRIVE QU'AVEC LE LIEU ════════════════════════════
          Décision de Chandler, tenue depuis le 03/09 et redite le 04/09 :
          « le mockup doit apparaître lorsque le visiteur a tapé le lieu ».
          C'est ce qui donne son sens à l'arrivée en pivot : le téléphone
          n'existe pas avant la question, il ARRIVE en réponse. Affiché d'emblée,
          il n'est plus une réponse — c'est une image de plus à regarder, et le
          premier écran repart avec deux objectifs au lieu d'un.

          ⚠️ C'EST LE MÊME TÉLÉPHONE QUE `/ou-ca-paie`, PAS UNE COPIE. J'en
          avais fabriqué un deuxième, plus pauvre : deux téléphones, c'est deux
          vérités qui divergent au premier changement. */}
      {validee && (
        <>
          <div className={s.telBloc}>
            <AjnayaPhoneDemo
              zone={validee}
              immersifPossible
              ajusteHauteur
              /* ⚠️ PAS DE `formule` ICI, ET C'EST VOULU (Chandler, 05/09).
                 La caisse s'ouvre sur l'ANNUEL, comme partout ailleurs dans le
                 métier. Ce n'est pas un piège tant qu'elle le dit elle-même, et
                 elle le dit à trois endroits : « × 12 » sur la carte,
                 « Ensuite 249,99 € par an » sous l'essai, et la ligne du bas sur
                 le renouvellement. */
              onEssaiClick={() => { window.location.href = '/tarifs3' }}
              /* ⚠️ LE LIEN EMPORTE LA ZONE ET SA QUESTION. Sans ça, Ajnaya
                 redemande tout sur WhatsApp et le chauffeur répète ce qu'il
                 vient d'écrire — c'est là qu'on les perd (brief du fil PIEUVRE,
                 04/09). `validee` est le lieu qu'il a tapé ; `derniereQuestion`
                 est sa dernière phrase dans le téléphone, remontée par le
                 composant. Les deux sont encodés : le serveur les renettoie de
                 toute façon, mais un « & » dans un nom de rue casserait le lien
                 avant même d'y arriver. */
              onWhatsAppClick={(question?: string) => {
                const p = new URLSearchParams()
                if (validee) p.set('z', validee)
                const q = (question ?? '').trim()
                if (q) p.set('q', q.slice(0, 160))
                p.set('p', '/mobile')
                p.set('o', 'telephone_hero')
                window.location.href = `${lienWhatsApp}${lienWhatsApp.includes('?') ? '&' : '?'}${p.toString()}`
              }}
            />
          </div>

          {/* ⚠️ 04/09 — LES DEUX BOUTONS QUI ÉTAIENT ICI ONT ÉTÉ RETIRÉS.
              « Essayer 3 jours — 0 € » et « Parler à Ajnaya » s'empilaient sous
              le téléphone et écrasaient la seule chose qu'on venait de lui
              donner : sa réponse. Le premier écran repartait avec trois
              objectifs au lieu d'un.
              Les deux portes existent toujours, et deux fois plutôt qu'une :
              DANS le téléphone (`onEssaiClick` / `onWhatsAppClick` ci-dessus),
              et plus bas dans la page de vente, où elles arrivent après une
              raison d'y aller. */}
        </>
      )}
    </section>
  )
}

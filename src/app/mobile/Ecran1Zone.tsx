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

const ZONES_SUGGEREES = ['Roissy CDG', 'Orly', 'La Défense', 'Bastille', 'Gare de Lyon']

export default function Ecran1Zone({ lienWhatsApp }: { lienWhatsApp: string }) {
  const sectionRef = useRef<HTMLElement | null>(null)
  const champRef = useRef<HTMLInputElement | null>(null)
  const rappel = useRef<number | null>(null)
  const [zone, setZone] = useState('')
  const [validee, setValidee] = useState<string | null>(null)

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
    remonter()
  }


  return (
    <section ref={sectionRef} className={s.ecran1} aria-labelledby="titre-zone">
      <div className={s.halos} aria-hidden="true" />
      <div className={s.grain} aria-hidden="true" />

      {/* Le surtitre et la grande question ne servent QUE tant qu'on n'a pas
          la zone. Une fois qu'elle est donnée, chaque ligne qu'ils gardent est
          une ligne que le téléphone perd — et le téléphone est le seul
          argument de cet écran. */}
      {!validee && (
        <>
          <div className={s.surtitre}>FOREAS DRIVER · POUR CHAUFFEURS VTC</div>
          <h1 id="titre-zone" className={s.titreZone}>Tu roules où<br />ce soir&nbsp;?</h1>
        </>
      )}

      {!validee && (
        <form className={s.champBloc} onSubmit={(e) => { e.preventDefault(); valider(zone) }}>
          <label htmlFor="zone" className={s.champLabel}>Ta zone</label>
          <div className={s.champRangee}>
            <input
              id="zone"
              ref={champRef}
              className={s.champ}
              type="text"
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              placeholder="Roissy, Bastille, Lyon…"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="words"
              enterKeyHint="go"
            />
            <button type="submit" className={s.champBouton} disabled={!zone.trim()}>Voir</button>
          </div>

          <div className={s.puces}>
            {ZONES_SUGGEREES.map((z) => (
              <button key={z} type="button" className={s.puce} onClick={() => valider(z)}>{z}</button>
            ))}
          </div>
        </form>
      )}

      {validee && (
        <>
          {/* ══ LA CONSIGNE ═══════════════════════════════════════════════════
              Deux lignes, et elles disent exactement ce qu'il doit faire et où
              il se trouve. Ce qui était là avant — « Tu roules à Roissy CDG ? »
              en gros, puis « Elle répond tout de suite. Tu écris, c'est tout. »
              en bas — coûtait 145 points de haut pour ne rien demander.
              La zone n'a pas besoin d'être répétée : elle est écrite DANS le
              téléphone, deux centimètres plus bas (« Autour de Roissy CDG »). */}
          <div className={s.consigne}>
            <div className={s.consigneTexte}>
              <h1 id="titre-zone" className={s.consigneTitre}>Touche l&apos;écran.</h1>
              <p className={s.consigneSous}>
                Tu parles à Ajnaya <b>dans l&apos;app que tu auras</b>.
              </p>
            </div>
            {/* Écrit court pour que « Touche l'écran. » tienne sur UNE ligne :
                sur deux, le titre volait 32 points au téléphone. Le nom complet
                reste dans l'étiquette lue par les lecteurs d'écran. */}
            <button
              type="button"
              className={s.changer}
              aria-label="Changer de zone"
              onClick={() => setValidee(null)}
            >
              Changer
            </button>
          </div>

          <div className={s.telBloc}>
            {/* ⚠️ C'EST LE MÊME TÉLÉPHONE QUE `/ou-ca-paie`, PAS UNE COPIE.
                J'en avais fabriqué un deuxième, plus pauvre : orbe perdue,
                traînées perdues, onde vocale perdue, cinq couches de fond
                réduites à une. Deux téléphones, c'est deux vérités qui
                divergent au premier changement. Il n'y en a qu'un.
                `immersifPossible` est la seule différence : ici on écrit
                dedans, sur `/ou-ca-paie` on le regarde jouer. */}
            {/* ⚠️ LES DEUX MAINS SONT PASSÉES, ET ELLES NE L'ÉTAIENT PAS.
                Mesuré le 03/09 : `onEssaiClick` et `onWhatsAppClick` valaient
                `undefined` ici, alors que les deux autres pages du site les
                branchent. Les trois portes DANS le téléphone — « Essayer 3 jours
                — 0 € aujourd'hui », « Poser ma question sur WhatsApp » et le
                cadenas — ne faisaient donc rien du tout. Pire : l'appui était
                détourné et ouvrait le plein écran noir à la place.
                C'est le défaut que les cinq jurés ont cité en premier, tous. */}
            <AjnayaPhoneDemo
              zone={validee}
              immersifPossible
              ajusteHauteur
              onEssaiClick={() => { window.location.href = '/tarifs3' }}
              onWhatsAppClick={() => { window.location.href = lienWhatsApp }}
            />
          </div>

          {/* ⚠️ DEUX PORTES, PAS UNE. Il n'y en avait qu'une, et elle envoyait
              hors du site avant qu'il ait vu un prix. Elles sont hors du fil,
              donc toujours à l'écran, et le prix est écrit dessous : le jury a
              relevé qu'aucun montant n'apparaissait sur cet écran.
              ⚠️ « Sans compte » et non « sans carte » : le garde-fou du dépôt
              (scripts/verifier-canon.mjs) interdit la seconde formule, et il
              arrête la fabrication AVANT que Next démarre. */}
          <div className={s.portes}>
            <a className={s.porteEssai} href="/tarifs3">Essayer 3 jours — 0 €</a>
            <a className={s.porteWa} href={lienWhatsApp}>Parler à Ajnaya</a>
          </div>
          <p className={s.sousPortes}>
            0 € aujourd&apos;hui. Puis 29,99 €/mois, coupé en 1 clic. Sans compte pour écrire.
          </p>
        </>
      )}
    </section>
  )
}

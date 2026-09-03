'use client'

import { useEffect, useState } from 'react'
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
 * ⚠️ LA SUITE VIENT DE LA PIEUVRE, PAS D'ICI.
 * Dès qu'il écrit, la question part à `/api/ajnaya/chat`, qui passe par le
 * cerveau. Ce fichier n'écrit aucune réponse à sa place. Si le cerveau ne
 * répond pas, l'état est honnête et la porte WhatsApp reste ouverte.
 */

const ZONES_SUGGEREES = ['Roissy CDG', 'Orly', 'La Défense', 'Bastille', 'Gare de Lyon']

export default function Ecran1Zone({ lienWhatsApp }: { lienWhatsApp: string }) {
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

  const valider = (valeur: string) => {
    const propre = valeur.trim()
    if (!propre) return
    setZone(propre)
    setValidee(propre)
  }


  return (
    <section className={s.ecran1} aria-labelledby="titre-zone">
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
            <AjnayaPhoneDemo zone={validee} immersifPossible ajusteHauteur />
          </div>

          <a className={s.actionWa} href={lienWhatsApp}>Continuer sur WhatsApp</a>
        </>
      )}
    </section>
  )
}

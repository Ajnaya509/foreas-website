'use client'

import { useState } from 'react'
import s from './mobile.module.css'

/**
 * ÉCRAN 1 — LA QUESTION DE ZONE.
 *
 * Décision de Chandler, 03/09 : la zone passe en PREMIER, avant tout le reste.
 * Raison mesurée : moins d'un visiteur mobile sur deux fait défiler une page
 * (45,2 %, Contentsquare, 99 milliards de sessions). Ce qui compte doit être
 * au premier écran, et taper un nom de lieu est le geste le plus facile qui soit —
 * un chauffeur connaît sa zone par cœur, il n'a rien à chercher.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ LA RÉPONSE EST UNE RÉPONSE DE VENTE. C'EST VOULU, ET C'EST ASSUMÉ.
 *
 * Consigne directe de Chandler : « pas réponse honnête, réponse marketing
 * (crédible) — on vend, nous, à ce moment, il faut le savoir ».
 *
 * Il a raison sur le fond : l'ancienne version disait « on n'a pas assez de
 * données ici ». C'est un message perdant, et rien ne l'imposait.
 *
 * ⚠️ MAIS ELLE NE CONTIENT AUCUN CHIFFRE DE ZONE, ET C'EST LA CLÉ.
 * Le mot que Chandler emploie est « crédible ». Un chauffeur qui roule à Roissy
 * et qui lit un euro-par-heure inventé le vérifie en une nuit — et il ne revient
 * pas. La vente vient donc du PROBLÈME, qui est vrai partout et pour tout le
 * monde, jamais d'une mesure qu'on n'a pas.
 *
 * Conséquence heureuse : cette réponse ne peut pas casser. Elle ne lit aucune
 * table, elle ne dépend d'aucune source, elle marche pour les 52 zones couvertes
 * comme pour une ville que personne n'a jamais saisie.
 *
 * ⚠️ NIVEAU DE LECTURE. Phrases de moins de dix mots. Mots d'une ou deux
 * syllabes. Aucun terme de métier au-delà de « course », « zone » et « euro ».
 * Mesuré : 11,1 % de conversion au niveau CM2 contre 5,3 % au niveau
 * professionnel, sur 41 000 pages (Unbounce).
 */

const ZONES_SUGGEREES = ['Roissy CDG', 'Orly', 'La Défense', 'Bastille', 'Gare de Lyon']

export default function Ecran1Zone({ lienWhatsApp }: { lienWhatsApp: string }) {
  const [zone, setZone] = useState('')
  const [validee, setValidee] = useState<string | null>(null)

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

      <div className={s.surtitre}>FOREAS DRIVER · POUR CHAUFFEURS VTC</div>

      <h1 id="titre-zone" className={s.titreZone}>
        Tu roules où<br />ce soir&nbsp;?
      </h1>

      <form
        className={s.champBloc}
        onSubmit={(e) => { e.preventDefault(); valider(zone) }}
      >
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
          <button type="submit" className={s.champBouton} disabled={!zone.trim()}>
            Voir
          </button>
        </div>

        {!validee && (
          <div className={s.puces}>
            {ZONES_SUGGEREES.map((z) => (
              <button key={z} type="button" className={s.puce} onClick={() => valider(z)}>
                {z}
              </button>
            ))}
          </div>
        )}
      </form>

      {validee && (
        <div className={s.reponse} role="status">
          <div className={s.reponseZone}>{validee}</div>

          {/* La vente. Vraie partout, pour tout le monde, sans aucune mesure. */}
          <p className={s.reponseFort}>
            Le piège, ce n&apos;est pas de trouver une course.
            <br />C&apos;est de prendre la mauvaise.
          </p>
          <p className={s.reponseTexte}>
            Une course à <b>34 €</b> peut te payer moins qu&apos;une course à <b>12 €</b>.
            Tout dépend du temps qu&apos;elle te prend.
          </p>
          <p className={s.reponseTexte}>
            Envoie-moi une course. Je te dis ce qu&apos;elle t&apos;a vraiment payé.
          </p>

          <a className={s.actionWa} href={lienWhatsApp}>
            Envoyer une course à Ajnaya
          </a>
          {/* ⚠️ NE JAMAIS ÉCRIRE « sans carte » ICI. Le garde du canon l'a bloqué,
              et il a raison : la phrase parlait de la conversation WhatsApp, mais
              un visiteur la lit à dix centimètres du bouton d'essai — et l'essai,
              lui, demande une carte. Une phrase vraie au mauvais endroit devient
              une promesse fausse. */}
          <p className={s.souslAction}>Elle répond tout de suite. Tu écris, c&apos;est tout.</p>
        </div>
      )}

      <div className={s.suite}>
        Voir comment elle répond
        <svg className={s.chevron} viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </section>
  )
}

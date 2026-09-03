'use client'

import { useRef, useState } from 'react'
import TelephoneAjnaya, { type Bulle } from './TelephoneAjnaya'
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

/** La réponse d'accueil. Zéro chiffre de zone — voir l'en-tête. */
function accueil(zone: string): Bulle[] {
  return [
    { de: 'elle', texte: `${zone}. Le piège là-bas, ce n'est pas de trouver une course. C'est de prendre la mauvaise.` },
    { de: 'elle', texte: `Une course à 34 € peut te payer moins qu'une course à 12 €. Tout dépend du temps qu'elle te prend.` },
    { de: 'elle', texte: `Envoie-moi une course : le prix, les kilomètres, les minutes. Je te dis ce qu'elle t'a vraiment payé.` },
  ]
}

export default function Ecran1Zone({ lienWhatsApp }: { lienWhatsApp: string }) {
  const [zone, setZone] = useState('')
  const [validee, setValidee] = useState<string | null>(null)
  const [messages, setMessages] = useState<Bulle[]>([])
  const [enAttente, setEnAttente] = useState(false)
  const historique = useRef<Array<{ role: string; content: string }>>([])

  const valider = (valeur: string) => {
    const propre = valeur.trim()
    if (!propre) return
    setZone(propre)
    setValidee(propre)
    setMessages(accueil(propre))
  }

  /** La question part au cerveau. On n'écrit jamais la réponse à sa place. */
  const envoyer = async (texte: string) => {
    setMessages((m) => [...m, { de: 'lui', texte }])
    setEnAttente(true)
    try {
      const r = await fetch('/api/ajnaya/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: texte,
          pageSource: '/mobile',
          scrollSection: 'hero_zone',
          conversationHistory: historique.current,
        }),
      })
      const d = await r.json().catch(() => null)
      const reponse = d?.reply
      if (!r.ok || typeof reponse !== 'string' || !reponse.trim()) throw new Error('pas de réponse')

      historique.current = [
        ...historique.current,
        { role: 'user', content: texte },
        { role: 'assistant', content: reponse },
      ].slice(-10)
      setMessages((m) => [...m, { de: 'elle', texte: reponse }])
    } catch {
      /* ⚠️ ON NE FABRIQUE PAS UNE RÉPONSE POUR BOUCHER LE TROU.
         On dit ce qui se passe, et on ouvre la porte qui, elle, fonctionne. */
      setMessages((m) => [...m, {
        de: 'elle',
        texte: "Je n'arrive pas à répondre ici tout de suite. Écris-moi sur WhatsApp, je te réponds directement.",
      }])
    } finally {
      setEnAttente(false)
    }
  }

  return (
    <section className={s.ecran1} aria-labelledby="titre-zone">
      <div className={s.halos} aria-hidden="true" />
      <div className={s.grain} aria-hidden="true" />

      <div className={s.surtitre}>FOREAS DRIVER · POUR CHAUFFEURS VTC</div>

      <h1 id="titre-zone" className={s.titreZone}>
        {validee ? <>Tu roules à<br />{validee}&nbsp;?</> : <>Tu roules où<br />ce soir&nbsp;?</>}
      </h1>

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
          <div className={s.telBloc}>
            <TelephoneAjnaya messages={messages} enAttente={enAttente} onEnvoyer={envoyer} />
          </div>

          <a className={s.actionWa} href={lienWhatsApp}>Continuer sur WhatsApp</a>
          <p className={s.souslAction}>
            Elle répond tout de suite. Tu écris, c&apos;est tout.{' '}
            <button type="button" className={s.lienNu} onClick={() => { setValidee(null); setMessages([]) }}>
              Changer de zone
            </button>
          </p>
        </>
      )}
    </section>
  )
}

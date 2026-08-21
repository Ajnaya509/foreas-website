'use client'

/**
 * FOREAS — LE FORMULAIRE DE CONTACT, CELUI QUI ENVOIE VRAIMENT.
 *
 * Il remplace un `<form>` décoratif : sans `action`, sans gestionnaire, avec
 * quatre champs SANS ATTRIBUT `name`. Le bouton ne faisait rien, et
 * `/professionnels` y envoyait tout son trafic B2B.
 *
 * Deux choix méritent d'être expliqués :
 *
 *  · ON NE VIDE PAS LE TEXTE EN CAS D'ÉCHEC. Quelqu'un qui vient d'écrire dix
 *    lignes et à qui on répond « erreur, réessaie » en effaçant tout ne réessaie
 *    pas : il part. Le message reste, la personne clique à nouveau.
 *
 *  · ON NE DIT « ENVOYÉ » QU'APRÈS L'ENVOI RÉEL. Le serveur ne répond `ok` que
 *    si le message est parti. C'est précisément le défaut qu'on répare : une
 *    confirmation qui ment est pire qu'un bouton mort — le bouton mort finit par
 *    se voir.
 */

import { useState, useRef } from 'react'
import { SUJETS_CONTACT, LIMITES_CONTACT } from '@/lib/contact'
import { mesurer } from '@/lib/mesure'

type Etat = 'repos' | 'envoi' | 'envoye' | 'erreur'

export default function FormulaireContact({ page = '/contact' }: { page?: string }) {
  const [etat, setEtat] = useState<Etat>('repos')
  const [erreur, setErreur] = useState<string | null>(null)
  const [champFautif, setChampFautif] = useState<string | null>(null)
  const [correlation, setCorrelation] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const commence = useRef(false)

  function auPremierContact() {
    if (commence.current) return
    commence.current = true
    mesurer('ContactStarted', { page, audience: 'entreprise' })
  }

  async function envoyer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (etat === 'envoi') return
    setEtat('envoi')
    setErreur(null)
    setChampFautif(null)

    const f = new FormData(e.currentTarget)
    const donnees = {
      nom: String(f.get('nom') ?? ''),
      email: String(f.get('email') ?? ''),
      sujet: String(f.get('sujet') ?? ''),
      message: String(f.get('message') ?? ''),
      entreprise_site: String(f.get('entreprise_site') ?? ''), // champ piège
      page,
    }

    try {
      const r = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(donnees),
      })
      const j = await r.json().catch(() => ({}))
      setCorrelation(j?.correlation ?? null)

      if (r.ok && j?.ok) {
        setEtat('envoye')
        setMessage('')
        mesurer('ContactSubmitted', { page, audience: 'entreprise', detail: { sujet: donnees.sujet } })
        return
      }

      setEtat('erreur')
      setErreur(j?.error ?? 'L’envoi a échoué. Réessaie dans un instant.')
      setChampFautif(j?.champ ?? null)
      mesurer('ContactFailed', { page, audience: 'entreprise', detail: { code: r.status, champ: j?.champ ?? null } })
    } catch {
      setEtat('erreur')
      setErreur('Pas de réseau, on dirait. Réessaie — ton message est conservé.')
      mesurer('ContactFailed', { page, audience: 'entreprise', detail: { code: 0 } })
    }
  }

  if (etat === 'envoye') {
    return (
      <div className="p-6 md:p-8 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
        <h2 className="font-title text-xl md:text-2xl font-semibold text-white mb-3">Message envoyé</h2>
        <p className="text-sm md:text-base text-white/70 leading-relaxed">
          On l’a bien reçu. Réponse sous 24&nbsp;h ouvrées, à l’adresse que tu as
          indiquée.
        </p>
        {correlation && (
          <p className="mt-4 text-xs text-white/35">
            Référence&nbsp;: <span className="font-mono">{correlation}</span> — garde-la si tu
            nous relances.
          </p>
        )}
      </div>
    )
  }

  const champClasse =
    'w-full px-4 py-3 text-sm md:text-base bg-[#0a0a10] rounded-xl border focus:outline-none transition-colors text-white placeholder-white/30'
  const bordure = (nom: string) =>
    champFautif === nom ? 'border-red-400/60 focus:border-red-400' : 'border-white/10 focus:border-accent-purple'

  return (
    <div className="p-6 md:p-8 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
      <h2 className="font-title text-xl md:text-2xl font-semibold text-white mb-6">Envoyez un message</h2>

      <form className="space-y-4 md:space-y-6" onSubmit={envoyer} noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div>
            <label htmlFor="ct-nom" className="block text-xs md:text-sm font-medium text-white/60 mb-2">Nom</label>
            <input
              id="ct-nom" name="nom" type="text" required autoComplete="name"
              maxLength={LIMITES_CONTACT.nomMax} onFocus={auPremierContact}
              className={`${champClasse} ${bordure('nom')}`} placeholder="Votre nom"
            />
          </div>
          <div>
            <label htmlFor="ct-email" className="block text-xs md:text-sm font-medium text-white/60 mb-2">Email</label>
            <input
              id="ct-email" name="email" type="email" required autoComplete="email"
              maxLength={LIMITES_CONTACT.emailMax} onFocus={auPremierContact}
              className={`${champClasse} ${bordure('email')}`} placeholder="vous@exemple.com"
            />
          </div>
        </div>

        <div>
          <label htmlFor="ct-sujet" className="block text-xs md:text-sm font-medium text-white/60 mb-2">Sujet</label>
          <select
            id="ct-sujet" name="sujet" required defaultValue={SUJETS_CONTACT[0].valeur}
            onFocus={auPremierContact} className={`${champClasse} ${bordure('sujet')}`}
          >
            {SUJETS_CONTACT.map((s) => (
              <option key={s.valeur} value={s.valeur}>{s.libelle}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="ct-message" className="block text-xs md:text-sm font-medium text-white/60 mb-2">Message</label>
          <textarea
            id="ct-message" name="message" rows={4} required
            minLength={LIMITES_CONTACT.messageMin} maxLength={LIMITES_CONTACT.messageMax}
            value={message} onChange={(ev) => setMessage(ev.target.value)} onFocus={auPremierContact}
            className={`${champClasse} ${bordure('message')} resize-none`} placeholder="Votre message..."
          />
          <p className="mt-1.5 text-[11px] text-white/30 tabular-nums">
            {message.length} / {LIMITES_CONTACT.messageMax}
          </p>
        </div>

        {/*
          Le champ piège. Invisible pour un humain — il ne peut pas le voir, ni
          l'atteindre au clavier, ni l'entendre lu par une synthèse vocale. Un
          envoi automatique, lui, remplit tout ce qu'il trouve.
        */}
        <div aria-hidden="true" className="absolute -left-[9999px] w-px h-px overflow-hidden">
          <label htmlFor="ct-entreprise-site">Ne pas remplir</label>
          <input id="ct-entreprise-site" name="entreprise_site" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        {erreur && (
          <p role="alert" className="text-sm text-red-300 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
            {erreur}
            {correlation && <span className="block mt-1 text-[11px] text-red-200/50">Réf. {correlation}</span>}
          </p>
        )}

        <button
          type="submit" disabled={etat === 'envoi'}
          className="w-full px-6 py-3.5 md:py-4 text-sm md:text-base bg-gradient-to-r from-accent-purple to-accent-cyan text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {etat === 'envoi' ? 'Envoi…' : 'Envoyer'}
        </button>

        <p className="text-[11px] text-white/35 leading-relaxed">
          Ton message et ton adresse servent uniquement à te répondre. Ils ne sont
          ni revendus, ni utilisés pour de la publicité.{' '}
          <a href="/confidentialite" className="underline hover:text-white/60">Confidentialité</a>.
        </p>
      </form>
    </div>
  )
}

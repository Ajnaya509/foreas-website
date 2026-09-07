'use client'

import { useCallback, useId, useState } from 'react'

/**
 * L'ÉCRAN 2 — LE PRÉNOM ET LE NUMÉRO, UNE FOIS LE PAIEMENT PASSÉ.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI CES DEUX CHAMPS SONT ICI ET PAS SUR LA PAGE DE PAIEMENT
 *
 * Chaque question posée avant la carte se paie en abandons. Celles-ci sont
 * rattrapables : le compte existe déjà, le mot de passe est parti par mail, et
 * il reste joignable par l'adresse qu'il a déjà donnée. L'e-mail, lui, est resté
 * à l'écran 1 — sans lui, rien n'existe et personne n'est joignable.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ CE BLOC NE DOIT JAMAIS EMPÊCHER D'ALLER PLUS LOIN
 *
 * Il est posé AVANT le bouton de téléchargement, parce que c'est là qu'on le
 * lit. Mais il ne bloque rien : ni bandeau modal, ni bouton grisé en dessous.
 * Un chauffeur qui veut son app tout de suite doit pouvoir l'avoir.
 *
 * ⚠️ MAIS PERSONNE NE LE RELANCERA. Ce commentaire affirmait le contraire : les
 * relances aux payants ont été supprimées le 29/08 (relancer quelqu'un qui vient
 * de donner sa carte, c'est du harcèlement administratif). Ce qui n'est pas
 * rempli ici est perdu — d'où l'importance de ne rien promettre à l'écran.
 *
 * ⚠️ ET IL SE TAIT UNE FOIS REMPLI. Un formulaire qui reste affiché après
 * l'envoi fait douter de l'envoi.
 */
export default function FormulaireProfil({ sessionId }: { sessionId: string }) {
  const idPrenom = useId()
  const idTel = useId()
  const [prenom, setPrenom] = useState('')
  const [telephone, setTelephone] = useState('')
  const [etat, setEtat] = useState<'repos' | 'envoi' | 'fait' | 'erreur' | 'attente'>('repos')
  const [fautes, setFautes] = useState<{ prenom?: string; tel?: string }>({})

  const envoyer = useCallback(async () => {
    /* Miroir des règles du serveur. Il ne le remplace pas : il évite un
       aller-retour pour dire ce qui se voit tout de suite. */
    const f: { prenom?: string; tel?: string } = {}
    if (prenom.trim().length < 2) f.prenom = 'Deux lettres au minimum.'
    const chiffres = telephone.replace(/\D/g, '')
    if (chiffres.length < 8) f.tel = 'Numéro incomplet.'
    setFautes(f)
    if (Object.keys(f).length > 0) return

    setEtat('envoi')
    try {
      const res = await fetch('/api/profil/completer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, prenom: prenom.trim(), telephone: telephone.trim() }),
      })
      if (res.ok) {
        setEtat('fait')
        return
      }
      /* ⚠️ 409 « abonné pas encore créé » N'EST PAS UNE ERREUR DE SAISIE.
         Le webhook Stripe tourne en parallèle et peut n'avoir pas encore écrit
         la ligne. Dire « erreur » enverrait corriger un numéro qui est bon. On
         dit d'attendre quelques secondes, ce qui est la vérité. */
      const data = (await res.json().catch(() => null)) as { error?: string } | null
      setEtat(data?.error === 'abonne_pas_encore_cree' ? 'attente' : 'erreur')
    } catch {
      setEtat('erreur')
    }
  }, [prenom, telephone, sessionId])

  if (etat === 'fait') return <div className="compte-bloc compte-profil" role="status">
    <h2 className="compte-sous-titre font-title t-h1">C’est enregistré, {prenom.trim()}.</h2>
    <p className="compte-aide t-bodylg">Ton prénom et ton numéro sont enregistrés.</p>
  </div>

  return <form className="compte-bloc compte-profil compte-formulaire" onSubmit={e => { e.preventDefault(); if (etat !== 'envoi') void envoyer() }} aria-busy={etat === 'envoi'}>
    <h2 className="compte-sous-titre font-title t-h1">Ajnaya apprend à te connaître</h2>
    <p className="compte-aide t-bodylg">Ton prénom pour qu’Ajnaya sache comment t’appeler. Ton numéro pour te joindre si ton compte bloque.</p>
    <label className="t-label" htmlFor={idPrenom}>Prénom
      <input id={idPrenom} type="text" autoComplete="given-name" autoCapitalize="words" value={prenom} onChange={e => setPrenom(e.target.value)} placeholder="Prénom" aria-invalid={!!fautes.prenom} aria-describedby={fautes.prenom ? `${idPrenom}-erreur` : undefined} disabled={etat === 'envoi'} />
      {fautes.prenom && <span id={`${idPrenom}-erreur`} className="compte-aide t-bodylg" role="alert">{fautes.prenom}</span>}
    </label>
    <label className="t-label" htmlFor={idTel}>Téléphone
      <input id={idTel} type="tel" inputMode="tel" autoComplete="tel" value={telephone} onChange={e => setTelephone(e.target.value)} placeholder="06 12 34 56 78" aria-invalid={!!fautes.tel} aria-describedby={fautes.tel ? `${idTel}-erreur` : undefined} disabled={etat === 'envoi'} />
      {fautes.tel && <span id={`${idTel}-erreur`} className="compte-aide t-bodylg" role="alert">{fautes.tel}</span>}
    </label>
    <button type="submit" disabled={etat === 'envoi'} className="compte-bouton compte-secondaire">{etat === 'envoi' ? 'Enregistrement en cours…' : 'Enregistrer mes coordonnées'}</button>
    {(etat === 'attente' || etat === 'erreur') && <p className="compte-erreur t-bodylg" role="status">
      {etat === 'attente' ? 'Ton compte se prépare. Réessaie dans quelques instants.' : 'Tes coordonnées n’ont pas été enregistrées. Réessaie.'}
    </p>}
  </form>
}

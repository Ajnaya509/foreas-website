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

  if (etat === 'fait') {
    return (
      <div
        className="rounded-2xl px-5 py-4 mb-6 text-[14px]"
        style={{
          background: 'rgba(16, 185, 129, 0.10)',
          border: '1px solid rgba(16, 185, 129, 0.28)',
          color: 'rgba(248, 250, 252, 0.88)',
        }}
      >
        C&apos;est noté, {prenom.trim()}. Ajnaya sait comment t&apos;appeler et comment te
        joindre.
      </div>
    )
  }

  return (
    <div
      className="rounded-2xl px-5 py-5 mb-6"
      style={{
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      <p className="text-[15px] font-bold mb-1" style={{ color: '#F8FAFC' }}>
        Deux détails, et Ajnaya te connaît
      </p>
      {/* Elle dit ce que ça lui apporte, pas ce que ça nous apporte. Un
          formulaire d'après-paiement qui ne justifie rien ressemble à une
          collecte de plus. */}
      {/* ⚠️ 29/08 — DEUX PROMESSES FAUSSES ONT ÉTÉ RETIRÉES DE CET ÉCRAN.
          1. « ton numéro pour qu'elle te prévienne sur WhatsApp quand ça bouge » :
             Chandler l'a démentie le jour même (« elle n'envoie pas d'alerte »).
             La phrase avait été tuée dans les mails et laissée vivante ici — à
             l'endroit le plus coûteux, trente secondes après la carte.
          2. « un mail arrivera pour le refaire » : ce mail n'existe pas. La
             relance des payants a été supprimée le même jour. Le chauffeur était
             rassuré, arrêtait de réessayer, et personne ne le rappelait jamais. */}
      <p className="text-[13px] mb-4" style={{ color: 'rgba(248, 250, 252, 0.55)' }}>
        Ton prénom pour qu&apos;Ajnaya t&apos;appelle par ton nom, ton numéro pour
        qu&apos;on puisse te joindre si quelque chose bloque sur ton compte.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <label htmlFor={idPrenom} className="block">
          <span className="block text-[12.5px] mb-1.5" style={{ color: 'rgba(248,250,252,0.62)' }}>
            Prénom
          </span>
          <input
            id={idPrenom}
            type="text"
            autoComplete="given-name"
            autoCapitalize="words"
            value={prenom}
            onChange={(e) => setPrenom(e.target.value)}
            placeholder="Karim"
            aria-invalid={!!fautes.prenom}
            className="w-full rounded-xl px-3.5 text-[15px] outline-none"
            style={{
              minHeight: 46,
              background: 'rgba(255,255,255,0.06)',
              border: `1px solid ${fautes.prenom ? '#EF4444' : 'rgba(255,255,255,0.12)'}`,
              color: '#F8FAFC',
            }}
          />
          {fautes.prenom && (
            <span className="block mt-1.5 text-[12.5px]" style={{ color: '#EF4444' }} role="alert">
              {fautes.prenom}
            </span>
          )}
        </label>

        <label htmlFor={idTel} className="block">
          <span className="block text-[12.5px] mb-1.5" style={{ color: 'rgba(248,250,252,0.62)' }}>
            Téléphone
          </span>
          <input
            id={idTel}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            placeholder="06 12 34 56 78"
            aria-invalid={!!fautes.tel}
            className="w-full rounded-xl px-3.5 text-[15px] outline-none"
            style={{
              minHeight: 46,
              background: 'rgba(255,255,255,0.06)',
              border: `1px solid ${fautes.tel ? '#EF4444' : 'rgba(255,255,255,0.12)'}`,
              color: '#F8FAFC',
            }}
          />
          {fautes.tel && (
            <span className="block mt-1.5 text-[12.5px]" style={{ color: '#EF4444' }} role="alert">
              {fautes.tel}
            </span>
          )}
        </label>
      </div>

      <button
        type="button"
        onClick={() => void envoyer()}
        disabled={etat === 'envoi'}
        className="mt-4 w-full rounded-xl px-4 py-3 text-[15px] font-bold transition-transform active:scale-[0.99] disabled:opacity-50"
        style={{
          background: 'rgba(255,255,255,0.10)',
          border: '1px solid rgba(255,255,255,0.16)',
          color: '#F8FAFC',
        }}
      >
        {etat === 'envoi' ? 'Enregistrement…' : 'Enregistrer'}
      </button>

      <p className="mt-2.5 text-[12.5px]" role="status" aria-live="polite">
        {etat === 'attente' && (
          <span style={{ color: 'rgba(248,250,252,0.62)' }}>
            Ton abonnement finit de s&apos;enregistrer. Réessaie dans quelques secondes.
          </span>
        )}
        {etat === 'erreur' && (
          <span style={{ color: '#EF4444' }}>
            Enregistrement impossible pour l&apos;instant. Réessaie dans un moment, ou
            écris à contact@foreas.xyz.
          </span>
        )}
      </p>
    </div>
  )
}

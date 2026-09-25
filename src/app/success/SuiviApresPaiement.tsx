'use client'
import { useEffect, useState } from 'react'
import CompteAvantPaiement, { type ComptePaiement } from '@/components/compte/CompteAvantPaiement'
import FormulaireProfil from './FormulaireProfil'

export default function SuiviApresPaiement({ sessionId }: { sessionId: string }) {
  const [account, setAccount] = useState<ComptePaiement | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<'pending' | 'active' | 'error' | 'checking'>('pending')
  useEffect(() => {
    let live = true
    setState('checking')
    if (account) void fetch('/api/checkout/etat?session_id=' + encodeURIComponent(sessionId), {
      headers: { Authorization: `Bearer ${account.credential}` }, cache: 'no-store',
    }).then(async response => {
      const data = await response.json()
      if (live) setState(response.ok ? data.active === true ? 'active' : 'pending' : 'error')
    }).catch(() => { if (live) setState('error') })
    return () => { live = false }
  }, [account, attempt, sessionId])
  return <section className="compte-carte">
    <CompteAvantPaiement onAccount={setAccount} allowCreation={false} />
    {account && <>
      <p className="compte-aide t-bodylg" role="status">{state === 'active' ? 'Ton accès est confirmé. Connecte-toi dans l’app avec ce compte.' : state === 'checking' ? 'Vérification de ton accès…' : state === 'pending' ? 'Ton paiement est en cours de rattachement. Vérifie à nouveau dans un instant.' : 'Ce paiement n’a pas pu être retrouvé pour ton compte. Si tu as payé, contacte l’assistance avec ta confirmation de paiement.'}</p>
      {state !== 'active' && <button type="button" className="compte-bouton compte-secondaire" disabled={state === 'checking'} onClick={() => setAttempt(value => value + 1)}>Vérifier mon accès</button>}
      {state === 'active' && <FormulaireProfil sessionId={sessionId} credential={account.credential} />}
    </>}
    <a href="mailto:contact@foreas.xyz" className="compte-bouton compte-secondaire">Contacter l’assistance</a>
  </section>
}

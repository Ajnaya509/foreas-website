'use client'

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { supabase } from '@/lib/supabase'

import VueAbonnement, { type Abonnement } from './VueAbonnement'

export default function GestionAbonnement() {
  const [connecte, setConnecte] = useState(false)
  const [initialisation, setInitialisation] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [abonnement, setAbonnement] = useState<Abonnement | null>(null)
  const [lu, setLu] = useState(false)
  const [occupe, setOccupe] = useState(false)
  const [erreur, setErreur] = useState('')
  const demande = useRef(0)

  const appeler = useCallback(async (action?: 'gerer' | 'arreter') => {
    const numero = ++demande.current
    setOccupe(true); setErreur('')
    try {
      const { data } = await supabase.auth.getSession()
      if (!data.session) { setConnecte(false); setAbonnement(null); setLu(false); return }
      const compte = data.session.user.id
      setConnecte(true)
      const reponse = await fetch('/api/customer-portal', {
        method: action ? 'POST' : 'GET', cache: 'no-store',
        headers: { Authorization: `Bearer ${data.session.access_token}`, ...(action ? { 'Content-Type': 'application/json' } : {}) },
        ...(action ? { body: JSON.stringify({ action }) } : {}),
      })
      const resultat = await reponse.json()
      const maintenant = await supabase.auth.getSession()
      if (numero !== demande.current || maintenant.data.session?.user.id !== compte) return
      if (!reponse.ok) {
        if (reponse.status === 401) { setConnecte(false); setAbonnement(null); setLu(false) }
        throw new Error(resultat.error || 'Impossible de retrouver ton abonnement.')
      }
      if (action) {
        const url = new URL(resultat.url)
        if (url.protocol !== 'https:' || url.hostname !== 'billing.stripe.com') throw new Error('La page de paiement ne s’ouvre pas. Réessaie.')
        window.location.assign(url.href)
      } else { setAbonnement(resultat.abonnement); setLu(true) }
    } catch (e) {
      if (numero === demande.current) setErreur(e instanceof Error ? e.message : 'La connexion a coupé. Réessaie.')
    } finally { if (numero === demande.current) { setOccupe(false); setInitialisation(false) } }
  }, [])

  useEffect(() => {
    void appeler()
    const retour = () => { if (document.visibilityState === 'visible') void appeler() }
    document.addEventListener('visibilitychange', retour)
    return () => { demande.current++; document.removeEventListener('visibilitychange', retour) }
  }, [appeler])

  async function connexion(e: FormEvent) {
    e.preventDefault(); setOccupe(true); setErreur('')
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (error) { setErreur('Vérifie ton adresse et ton mot de passe FOREAS.'); return }
      setPassword(''); await appeler()
    } catch { setErreur('La connexion a coupé. Réessaie.') }
    finally { setOccupe(false) }
  }

  return <VueAbonnement
    connecte={connecte} abonnement={abonnement} lu={lu} occupe={occupe} initialisation={initialisation}
    email={email} password={password} erreur={erreur}
    onEmail={setEmail} onPassword={setPassword} onConnexion={connexion}
    onAction={(action) => { void appeler(action) }}
    onDeconnexion={async () => { demande.current++; setConnecte(false); setAbonnement(null); setLu(false); setOccupe(false); await supabase.auth.signOut({ scope: 'local' }) }}
  />
}

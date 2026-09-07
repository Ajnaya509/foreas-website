'use client'

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { supabase } from '@/lib/supabase'

type Abonnement = { statut: string; renouvellement_arrete: boolean; prochain_prelevement: string | null; fin_acces: string | null }
const date = (value: string) => new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeZone: 'Europe/Paris' }).format(new Date(value))

export default function GestionAbonnement() {
  const [connecte, setConnecte] = useState(false)
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
        if (url.protocol !== 'https:' || url.hostname !== 'billing.stripe.com') throw new Error('Adresse de gestion invalide.')
        window.location.assign(url.href)
      } else { setAbonnement(resultat.abonnement); setLu(true) }
    } catch (e) {
      if (numero === demande.current) setErreur(e instanceof Error ? e.message : 'La connexion a coupé. Réessaie.')
    } finally { if (numero === demande.current) setOccupe(false) }
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

  const bouton = 'w-full rounded-2xl bg-violet-600 px-5 py-4 font-semibold text-white disabled:opacity-50'
  return <main id="main-content" className="min-h-screen bg-[#08090d] px-5 py-12 text-white">
    <div className="mx-auto max-w-md space-y-6">
      <a href="/mobile" className="text-sm tracking-widest text-violet-300">FOREAS</a>
      <h1 className="text-3xl font-semibold">Mon abonnement</h1>
      {!connecte ? <>
        <p className="text-white/70">Utilise la même connexion que dans l’app.</p>
        <form onSubmit={connexion} className="space-y-4">
          <label className="block">Adresse e-mail<input type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} className="mt-2 w-full rounded-xl border border-white/25 bg-white/5 p-3" /></label>
          <label className="block">Mot de passe<input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-white/25 bg-white/5 p-3" /></label>
          <button disabled={occupe} className={bouton}>{occupe ? 'Connexion…' : 'Retrouver mon abonnement'}</button>
        </form>
        <p className="text-sm text-white/60">Mot de passe oublié ? Tu peux le réinitialiser depuis l’écran de connexion de l’app.</p>
      </> : <>
        {lu && (abonnement ? <div className="space-y-3 rounded-2xl border border-white/15 p-5" aria-live="polite">
          <p className="font-semibold">{abonnement.renouvellement_arrete ? 'Renouvellement arrêté' : abonnement.statut === 'trialing' ? 'Ton essai est en cours' : 'Ton abonnement'}</p>
          {abonnement.prochain_prelevement && <p>{abonnement.statut === 'trialing' ? 'Premier prélèvement prévu' : 'Prochain prélèvement prévu'} le {date(abonnement.prochain_prelevement)}.</p>}
          {abonnement.renouvellement_arrete && <p>Aucun prochain renouvellement prévu.{abonnement.fin_acces ? ` Fin de l’accès le ${date(abonnement.fin_acces)}.` : ''}</p>}
          <button disabled={occupe} className={bouton} onClick={() => void appeler('gerer')}>Gérer mon abonnement</button>
          {!abonnement.renouvellement_arrete && <button disabled={occupe} className="w-full rounded-xl border border-white/30 p-3 disabled:opacity-50" onClick={() => void appeler('arreter')}>Arrêter le renouvellement</button>}
          <p className="text-sm text-white/60">L’arrêt sera confirmé sur la page sécurisée Stripe.</p>
        </div> : <p>Aucun abonnement relié à cette connexion. Si tu as déjà souscrit, contacte notre assistance.</p>)}
        <button disabled={occupe} className="underline disabled:opacity-50" onClick={() => void appeler()}>Actualiser mon abonnement</button>
        <button className="ml-5 text-white/65 underline" onClick={async () => { demande.current++; setConnecte(false); setAbonnement(null); setLu(false); setOccupe(false); await supabase.auth.signOut({ scope: 'local' }) }}>Me déconnecter</button>
      </>}
      {erreur && <p role="alert" className="rounded-xl bg-red-950/50 p-4 text-red-200">{erreur}</p>}
      <a href="foreas://" className="block text-center text-violet-300 underline">Revenir dans l’app FOREAS</a>
      <a href="mailto:contact@foreas.xyz" className="block text-center text-sm text-white/60 underline">Contacter l’assistance</a>
    </div>
  </main>
}

'use client'

import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import styles from './CompteAvantPaiement.module.css'
import s from '@/app/tarifs3/tarifs3.module.css'

export type ComptePaiement = { userId: string; email: string; credential: string; expiresAt: number }

/** A checkout login lives in this component only. It cannot replace an admin or
 * another page's session, nor be restored by a late response after changing account. */
export default function CompteAvantPaiement({ onAccount, allowCreation = true }: { onAccount: (account: ComptePaiement | null) => void; allowCreation?: boolean }) {
  const [account, setAccount] = useState<ComptePaiement | null>(null)
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const generation = useRef(0)
  const client = useRef<SupabaseClient | null>(null)
  const change = useRef(onAccount)
  change.current = onAccount
  const id = useId()

  function auth() {
    if (!client.current) {
      const memory = new Map<string, string>()
      client.current = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        global: { fetch: async (input, init) => {
          const controller = new AbortController()
          const timer = setTimeout(() => controller.abort(), 15_000)
          try { return await fetch(input, { ...init, signal: controller.signal }) } finally { clearTimeout(timer) }
        } },
        auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false, flowType: 'pkce',
          storage: { getItem: key => memory.get(key) ?? null, setItem: (key, value) => { memory.set(key, value) }, removeItem: key => { memory.delete(key) } },
        },
      })
    }
    return client.current.auth
  }

  function forget() {
    generation.current++
    // Drop this isolated client instead of revoking sessions belonging to other pages.
    client.current = null
    setAccount(null); setPassword(''); setBusy(false); change.current(null)
  }
  useEffect(() => () => { generation.current++; client.current = null }, [])
  useEffect(() => {
    if (!account) return
    const expire = () => {
      if (Date.now() >= account.expiresAt * 1000 - 30_000) {
        forget(); setMessage('Ta connexion a expiré. Reconnecte-toi pour continuer.')
      }
    }
    const timer = setTimeout(expire, Math.max(0, account.expiresAt * 1000 - Date.now() - 30_000))
    window.addEventListener('focus', expire)
    return () => { clearTimeout(timer); window.removeEventListener('focus', expire) }
  }, [account])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    const run = ++generation.current
    setBusy(true); setMessage(''); setError('')
    try {
      const provider = auth()
      if (mode === 'signup') {
        const result = await provider.signUp({ email: email.trim(), password,
          options: { emailRedirectTo: window.location.origin + '/compte/confirmation', data: { user_type: 'driver', source: 'checkout_confirmed_account' } },
        })
        if (run !== generation.current) return
        if (result.error) throw new Error('La création du compte n’a pas abouti. Réessaie ou contacte l’assistance.')
        setPassword(''); setMode('login')
        setMessage('Confirme ton adresse depuis le mail FOREAS, puis connecte-toi ici. Si tu avais déjà un compte, utilise ton mot de passe habituel.')
        return
      }
      const result = await provider.signInWithPassword({ email: email.trim(), password })
      if (run !== generation.current) return
      if (result.error || !result.data.session) throw new Error('Vérifie ton adresse, sa confirmation et ton mot de passe FOREAS.')
      const session = result.data.session
      const verified = await provider.getUser(session.access_token)
      if (run !== generation.current) return
      if (verified.error || !verified.data.user.email_confirmed_at || !verified.data.user.email || verified.data.user.id !== session.user.id || !session.expires_at || session.expires_at * 1000 <= Date.now() + 30_000) {
        throw new Error('Ton compte n’a pas pu être confirmé. Reconnecte-toi.')
      }
      const confirmed = { userId: verified.data.user.id, email: verified.data.user.email, credential: session.access_token, expiresAt: session.expires_at }
      setPassword(''); setAccount(confirmed); change.current(confirmed)
    } catch (cause) {
      if (run === generation.current) setError(cause instanceof Error ? cause.message : 'La connexion a coupé. Réessaie.')
    } finally { if (run === generation.current) setBusy(false) }
  }

  async function resend() {
    if (busy || !email.trim()) return
    const run = ++generation.current
    setBusy(true); setError(''); setMessage('')
    try {
      const result = await auth().resend({ type: 'signup', email: email.trim(), options: { emailRedirectTo: window.location.origin + '/compte/confirmation' } })
      if (run !== generation.current) return
      if (result.error) throw new Error('Le mail n’a pas pu être demandé. Patiente un instant, puis réessaie.')
      setMessage('La demande est transmise. Vérifie tes mails et tes indésirables. Un compte déjà confirmé peut se connecter directement.')
    } catch (cause) { if (run === generation.current) setError(cause instanceof Error ? cause.message : 'La connexion a coupé.') }
    finally { if (run === generation.current) setBusy(false) }
  }

  return <section aria-label="Compte qui recevra l’abonnement" className={styles.compte}>
    {account ? <>
      <p>Abonnement pour <strong>{account.email}</strong></p>
      <p className={s.champAide}>Ce compte ouvrira l’app et gérera l’abonnement.</p>
      <button type="button" className={styles.lien} style={{ minHeight: 44 }} onClick={() => { forget(); setMessage(''); setError('') }}>Changer de compte</button>
    </> : <form onSubmit={submit}>
      <h2 className="font-title t-h2">Ton compte FOREAS</h2>
      <p className={s.champAide}>Les mêmes identifiants pour ton abonnement et ton app.</p>
      <label className={s.champ} htmlFor={id + '-email'}><span className={s.champLabel}>Adresse e-mail</span>
        <input id={id + '-email'} type="email" autoComplete="email" required disabled={busy} value={email} onChange={e => setEmail(e.target.value)} />
      </label>
      <label className={s.champ} htmlFor={id + '-password'}><span className={s.champLabel}>{mode === 'signup' ? 'Choisis ton mot de passe' : 'Mot de passe FOREAS'}</span>
        <input id={id + '-password'} type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} required minLength={mode === 'signup' ? 8 : undefined} disabled={busy} value={password} onChange={e => setPassword(e.target.value)} />
      </label>
      {mode === 'signup' && <p className={s.champAide}>8 caractères minimum. Confirme ensuite le mail avant de payer.</p>}
      <button type="submit" className={s.cta} disabled={busy}>{busy ? 'Vérification en cours…' : mode === 'signup' ? 'Créer mon compte' : 'Continuer avec mon compte'}</button>
      {busy && <button type="button" className={styles.lien} style={{ minHeight: 44 }} onClick={() => { forget(); setMessage('Demande interrompue sur cette page.'); setError('') }}>Annuler</button>}
      {allowCreation && <button type="button" className={styles.lien} style={{ minHeight: 44 }} disabled={busy} onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setPassword(''); setError(''); setMessage('') }}>{mode === 'signup' ? 'J’ai déjà un compte' : 'Créer un compte FOREAS'}</button>}
      <button type="button" className={styles.lien} style={{ minHeight: 44 }} disabled={busy || !email.trim()} onClick={() => void resend()}>Renvoyer le mail de confirmation</button>
      <a className={styles.lien} style={{ display: 'inline-flex', alignItems: 'center', minHeight: 44 }} href="mailto:contact@foreas.xyz">Besoin d’aide pour me connecter</a>
    </form>}
    {message && <p className={s.champAide} role="status">{message}</p>}
    {error && <p className={s.champErreur} role="alert">{error}</p>}
  </section>
}

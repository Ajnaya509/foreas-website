'use client'

import { useState } from 'react'

/** The app confirms attribution after login; a store visit cannot prove it. */
export default function ReferralCodeCard({ code }: { code: string }) {
  const [message, setMessage] = useState('')
  async function copy() {
    try { await navigator.clipboard.writeText(code); setMessage('Code copié.') }
    catch { setMessage('La copie est indisponible. Sélectionne le code pour le garder.') }
  }
  return (
    <section className="partner-card" aria-label="Garder le code parrain" style={{ margin: '24px 0', textAlign: 'left' }}>
      <h2>Garde ton code.</h2>
      <p className="partner-note">Après l’installation, l’app peut te demander de le saisir avant ton abonnement.</p>
      <p style={{ fontSize: 24, letterSpacing: '.06em', overflowWrap: 'anywhere', margin: '16px 0' }}>{code}</p>
      <button className="partner-button partner-button-secondary" type="button" onClick={copy}>Copier le code</button>
      <a className="partner-link" href={'foreas://referral?code=' + encodeURIComponent(code)}>Ouvrir FOREAS Driver si l’app est installée</a>
      <p className="partner-note" role="status" aria-live="polite">{message}</p>
      <p className="partner-note">Le parrainage sera confirmé par FOREAS après ta connexion. Ouvrir ce lien ne prouve pas encore son rattachement.</p>
    </section>
  )
}

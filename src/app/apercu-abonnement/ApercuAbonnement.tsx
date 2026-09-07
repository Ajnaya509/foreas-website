'use client'
import { useState } from 'react'
import VueAbonnement from '../abonnement/VueAbonnement'

/** Aperçu sans connexion, requête ou modification d’abonnement. */
export default function ApercuAbonnement({ date, statut }: { date: string; statut: 'trialing' | 'active' }) {
  const [message, setMessage] = useState('')
  const expliquer = () => setMessage('Ceci est un aperçu. Aucun abonnement ne sera modifié.')
  return <>
    <p className="compte-apercu" role="note">Aperçu avec un compte fictif. Aucun abonnement créé.<br /><a href="/apercu-abonnement" aria-current={statut === 'trialing' ? 'page' : undefined}>Pendant l’essai</a>{' · '}<a href="/apercu-abonnement?etat=actif" aria-current={statut === 'active' ? 'page' : undefined}>Abonnement actif</a></p>
    <VueAbonnement connecte lu occupe={false} initialisation={false}
      abonnement={{ statut, renouvellement_arrete: false, prochain_prelevement: date, fin_acces: null }}
      email="" password="" erreur={message} onEmail={() => {}} onPassword={() => {}}
      onConnexion={e => { e.preventDefault(); expliquer() }} onAction={expliquer} onDeconnexion={expliquer}
    />
  </>
}

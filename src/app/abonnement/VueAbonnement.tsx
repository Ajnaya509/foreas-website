'use client'

import type { FormEventHandler } from 'react'
import ConfirmationArret from './ConfirmationArret'
import { ArrowUpRight, CalendarDays, CreditCard, LogOut, RefreshCw } from 'lucide-react'
import CadreCompte from '@/components/compte/CadreCompte'
import { Grid } from '@/components/ui/Container'

export type Abonnement = { statut: string; renouvellement_arrete: boolean; prochain_prelevement: string | null; fin_acces: string | null }
const date = (value: string) => new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeZone: 'Europe/Paris' }).format(new Date(value))

type Props = {
  connecte: boolean; abonnement: Abonnement | null; lu: boolean; occupe: boolean; initialisation: boolean
  email: string; password: string; erreur: string
  onEmail: (value: string) => void; onPassword: (value: string) => void; onConnexion: FormEventHandler<HTMLFormElement>
  onAction: (action?: 'gerer' | 'arreter') => void; onDeconnexion: () => void
}

/** Vue partagée avec l’aperçu. Les actions réelles restent dans GestionAbonnement. */
export default function VueAbonnement(p: Props) {
  const { abonnement: abo } = p
  const arrete = abo?.renouvellement_arrete
  const essai = abo?.statut === 'trialing'
  const termine = abo && ['canceled', 'incomplete_expired'].includes(abo.statut)
  const problemePaiement = abo && ['past_due', 'unpaid', 'incomplete', 'paused'].includes(abo.statut)
  const etat = arrete ? 'Renouvellement arrêté' : essai ? 'Ton essai est en cours' : termine ? 'Ton abonnement est terminé' : problemePaiement ? 'Ton paiement est à vérifier' : abo?.statut === 'active' ? 'Ton abonnement est actif' : 'Ton abonnement'
  return <CadreCompte>
    <Grid gap="xl" className="compte-grille">
      <section className="compte-intro">
        <p className="compte-repere t-eyebrow">Ton espace FOREAS</p>
        <h1 className="compte-titre font-title t-display-xl">Mon abonnement</h1>
        <p className="compte-description t-bodylg">Ta prochaine date de paiement.<br />Tes choix, au même endroit.</p>
      </section>
      <section className="compte-zone" aria-label="Gestion de ton abonnement" aria-busy={p.occupe || p.initialisation}>
        {p.initialisation ? <div className="compte-attente" role="status">
          <p className="compte-aide t-bodylg">Recherche de ton abonnement…</p>
        </div> : !p.connecte ? <div className="compte-bloc">
          <h2 className="compte-sous-titre font-title t-h1">Retrouve ton abonnement</h2>
          <p className="compte-aide t-bodylg">Utilise ton adresse e-mail et ton mot de passe de l’app FOREAS.</p>
          <form onSubmit={p.onConnexion} className="compte-formulaire">
            <label htmlFor="compte-email" className="t-label">Adresse e-mail<input id="compte-email" type="email" autoComplete="username" required value={p.email} onChange={e => p.onEmail(e.target.value)} disabled={p.occupe} /></label>
            <label htmlFor="compte-password" className="t-label">Mot de passe<input id="compte-password" type="password" autoComplete="current-password" required value={p.password} onChange={e => p.onPassword(e.target.value)} disabled={p.occupe} /></label>
            <button disabled={p.occupe} className="compte-bouton compte-primaire"><span>{p.occupe ? 'Connexion en cours…' : 'Retrouver mon abonnement'}</span><ArrowUpRight aria-hidden="true" /></button>
          </form>
          <p className="compte-note t-bodylg">Mot de passe oublié ? Ouvre l’app et choisis « Mot de passe oublié » sur l’écran de connexion.</p>
        </div> : <>
          {p.lu && (abo ? <>
            <div className="compte-carte" aria-live="polite">
              <div className="compte-identifiant t-bodylg"><CreditCard aria-hidden="true" /><span>FOREAS Driver</span></div>
              <p className={`compte-etat t-bodylg${problemePaiement ? ' compte-etat-attention' : ''}`}>{etat}</p>
              {!arrete && abo.prochain_prelevement && <div className="compte-date">
                <p className="compte-aide t-label"><CalendarDays aria-hidden="true" /><span>{essai ? 'Premier paiement prévu le' : 'Prochain paiement prévu le'}</span></p>
                <p className="compte-date-valeur t-bodylg t-stat">{date(abo.prochain_prelevement)}</p>
              </div>}
              {arrete && <div className="compte-date"><p className="t-bodylg">Aucun prochain renouvellement prévu.</p>{abo.fin_acces && <p className="compte-aide t-bodylg">Ton accès reste ouvert jusqu’au {date(abo.fin_acces)}.</p>}</div>}
            </div>
            {/* §8.6 R9 : commandes hors de la carte, aucun verre empilé. */}
            <div className="compte-actions">
              <button disabled={p.occupe} className="compte-bouton compte-primaire" onClick={() => p.onAction('gerer')}><span>{p.occupe ? 'Chargement en cours…' : 'Gérer mon abonnement'}</span><ArrowUpRight aria-hidden="true" /></button>
              {!arrete && !termine && <ConfirmationArret essai={essai} echeance={abo.prochain_prelevement ? date(abo.prochain_prelevement) : null} occupe={p.occupe} onArreter={() => p.onAction('arreter')} />}
            </div>
            <p className="compte-note compte-securite t-bodylg">Tu confirmes ton choix sur Stripe, la page sécurisée de paiement.</p>
          </> : <div className="compte-bloc"><h2 className="compte-sous-titre font-title t-h1">Retrouvons ton abonnement</h2><p className="compte-aide t-bodylg">Aucun abonnement n’est relié à ce compte. Si tu as déjà souscrit, l’assistance peut t’aider.</p><a className="compte-bouton compte-primaire" href="mailto:contact@foreas.xyz">Contacter l’assistance</a></div>)}
          {!p.lu && !p.erreur && <div className="compte-attente t-bodylg" role="status">Recherche de ton abonnement…</div>}
          <div className="compte-liens"><button className="t-label" disabled={p.occupe} onClick={() => p.onAction()}><RefreshCw aria-hidden="true" /><span>Actualiser mon abonnement</span></button><button className="t-label" disabled={p.occupe} onClick={p.onDeconnexion}><LogOut aria-hidden="true" /><span>Me déconnecter</span></button></div>
        </>}
        {p.erreur && <p role="alert" className="compte-erreur t-bodylg">{p.erreur}</p>}
      </section>
    </Grid>
  </CadreCompte>
}

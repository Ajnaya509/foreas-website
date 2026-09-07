/**
 * LE CORPS DE LA PAGE D'APRÈS-PAIEMENT.
 *
 * ⚠️ IL EST DANS SON PROPRE FICHIER POUR UNE RAISON PRÉCISE : la page
 * `/success` exige une vraie session Stripe, donc un vrai paiement. Elle ne
 * peut donc pas être REGARDÉE avant d'être expédiée — et une mise en page qui
 * casse à la dernière étape de l'entonnoir se paie cher.
 *
 * Isolé ici, le même JSX peut être rendu avec des données fabriquées, à côté,
 * le temps de le voir. Ce n'est pas une copie : c'est le composant que la vraie
 * page utilise. Ce qu'on regarde est donc ce qui part.
 */
import FormulaireProfil from './FormulaireProfil'
import { Grid } from '@/components/ui/Container'
import { Download } from 'lucide-react'

type Props = {
  firstName: string
  customerEmail: string
  trialEndUnix: number | null
  trialEndFormatted: string | null
  tierName: string
  billingLabel: string | null
  hasBeta60: boolean
  communityGroup: string | null
  customerId: string | null
  /** L'identifiant de la session Stripe : c'est lui, et lui seul, qui autorise
   *  l'écran 2 à écrire le prénom et le téléphone sur le bon compte. */
  sessionId: string
  /** Le webhook n'a tourné que si la session est finalisée. Sans ça, on ne peut
   *  RIEN affirmer sur le mail : il n'est pas encore parti. */
  paiementFinalise: boolean
}

export default function CorpsSucces({
  firstName,
  customerEmail,
  trialEndUnix,
  trialEndFormatted,
  tierName,
  billingLabel,
  hasBeta60,
  communityGroup,
  customerId,
  sessionId,
  paiementFinalise,
}: Props) {
  return <Grid gap="xl" className="compte-bienvenue">
    <section className="compte-bienvenue-intro">
      <p className="compte-repere t-eyebrow">{trialEndUnix ? 'Ton essai est activé' : 'Ton abonnement est activé'}</p>
      <h1 className="compte-titre font-title t-display-xl">Bienvenue{firstName ? ',' : ' chez'} <span>{firstName || 'FOREAS'}.</span></h1>
      {trialEndUnix ? <p className="compte-montant t-bodylg t-stat">0 € <span>aujourd’hui.</span></p> : <p className="compte-aide t-bodylg">Ton abonnement <strong>{tierName}</strong> est actif{billingLabel ? `, ${billingLabel}` : ''}.</p>}
      {trialEndFormatted && <p className="compte-aide t-bodylg">Premier paiement le <strong>{trialEndFormatted}</strong>{hasBeta60 ? ' · code BETA60' : ''}</p>}
      {trialEndUnix && <><p className="compte-accroche t-bodylg">Pendant trois jours, Ajnaya apprend comment tu travailles, tout en t’apportant du résultat.</p><p className="compte-description t-bodylg">Tes zones, tes heures, tes décisions : chaque course lui en dit un peu plus.</p></>}
    </section>
    <Grid gap="xl" className="compte-bienvenue-etapes">
      <section className="compte-carte compte-codes">
        <h2 className="compte-sous-titre font-title t-h1">Tes codes pour ouvrir l’app</h2>
        <p className="compte-aide t-bodylg">{paiementFinalise ? 'Retrouve ton e-mail de bienvenue' : 'Ton e-mail de bienvenue est en préparation'}{customerEmail ? <> à cette adresse : <strong>{customerEmail}</strong>.</> : ', à l’adresse utilisée pour le paiement.'}</p>
        <p className="compte-aide t-bodylg">Premier compte FOREAS ? Ton mot de passe est dans cet e-mail. Garde-le pour te connecter.</p>
        <p className="compte-note t-bodylg">Si tu avais déjà un compte, garde ton mot de passe habituel.</p>
        <p className="compte-note t-bodylg">Le mail tarde ? Regarde dans tes indésirables.</p>
      </section>
      <FormulaireProfil sessionId={sessionId} />
    </Grid>
    <section className="compte-telecharger">
      <p className="compte-description t-bodylg">Ajnaya t’attend dans l’app. Elle fait le tour avec toi.</p>
      <a href="/go" className="compte-bouton compte-primaire"><Download aria-hidden="true" /><span>Télécharger l’application</span></a>
      <p className="compte-note t-bodylg">iPhone ou Android : le bon magasin s’ouvre.</p>
      {customerId && <div className="compte-liens"><a id="gerer-abonnement" className="t-label" href="/abonnement">Gérer mon abonnement</a></div>}
      <p className="compte-note t-bodylg">Paiement sécurisé par Stripe.<br />Tu peux arrêter le renouvellement depuis ton abonnement.</p>
    </section>
  </Grid>
}

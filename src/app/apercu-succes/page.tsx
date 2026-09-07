import { notFound } from 'next/navigation'
import CadreCompte from '@/components/compte/CadreCompte'
import CorpsSucces from '../success/CorpsSucces'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Aperçu après inscription · FOREAS', robots: { index: false, follow: false } }

/** Même page que le parcours réel, compte fictif. Inaccessible en production. */
export default function ApercuSucces() {
  if (process.env.NODE_ENV === 'production') notFound()
  const fin = Math.floor(Date.now() / 1000) + 3 * 24 * 3600
  return <>
    <p className="compte-apercu" role="note">Aperçu avec un compte fictif. Aucun abonnement créé.</p>
    <CadreCompte><CorpsSucces firstName="Prénom" customerEmail="apercu@example.invalid"
      trialEndUnix={fin} trialEndFormatted={new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', timeZone: 'Europe/Paris' }).format(new Date(fin * 1000))}
      tierName="Annuel" billingLabel="249,99 € par an" hasBeta60={false} communityGroup={null}
      customerId="cus_apercu_non_valide" sessionId="cs_apercu_non_valide" paiementFinalise
    /></CadreCompte>
  </>
}

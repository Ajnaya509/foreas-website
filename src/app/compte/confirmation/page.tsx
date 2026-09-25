import CadreCompte from '@/components/compte/CadreCompte'

export const metadata = { title: 'Ton compte FOREAS', robots: { index: false, follow: false } }

export default function ConfirmationCompte() {
  return <CadreCompte><section className="compte-carte">
    <h1 className="compte-titre font-title t-display-xl">Retrouve ton paiement.</h1>
    <p className="compte-description t-bodylg">Après avoir confirmé ton adresse, reviens à la page de paiement que tu avais ouverte.</p>
    <p className="compte-aide t-bodylg">Connecte-toi avec le mot de passe que tu as choisi. Si le lien a expiré, demande un nouveau mail depuis cette page.</p>
    <a className="compte-bouton compte-primaire" href="/tarifs3">Ouvrir la page de paiement</a>
    <p className="compte-note t-bodylg">Ton code parrain et ta formule restent dans l’onglet d’origine.</p>
  </section></CadreCompte>
}

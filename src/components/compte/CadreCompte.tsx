import type { ReactNode } from 'react'
import { ArrowLeft, Mail, Smartphone } from 'lucide-react'
import Container from '@/components/ui/Container'
import ForeasLogo from '@/components/experience/ForeasLogo'

/** MASTER §3 / §8.2 : violet administratif, recette web AppleNoir.
 * §27 : Container est la grille du site ; aucune largeur concurrente.
 * §12 : logo officiel, sans effet. §26 : Lucide uniquement sur le web. */
export default function CadreCompte({ children, abonnement = false }: { children: ReactNode; abonnement?: boolean }) {
  return <div className={`espace-compte${abonnement ? ' compte-abonnement' : ''}`}>
    <div className="compte-halos" aria-hidden="true" />
    <div className="compte-grain" aria-hidden="true" />
    <header className="compte-entete">
      <Container className="compte-navigation">
        <a href="/mobile" className="compte-marque" aria-label="Revenir à l’accueil FOREAS"><ForeasLogo /></a>
        <a href="/mobile" className="compte-retour t-label"><ArrowLeft aria-hidden="true" /><span>Retour au site</span></a>
      </Container>
    </header>
    <Container as="main" id="main-content" tabIndex={-1} className="compte-contenu">{children}</Container>
    <footer className="compte-pied">
      <Container className="compte-pied-liens">
        <a href="mailto:contact@foreas.xyz" className="t-label"><Mail aria-hidden="true" /><span>Contacter l’assistance</span></a>
        <a href="foreas://" className="t-label"><Smartphone aria-hidden="true" /><span>Revenir dans l’app FOREAS</span></a>
      </Container>
    </footer>
  </div>
}

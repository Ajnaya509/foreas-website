import { Metadata } from 'next'
import { partage, canonique } from '@/lib/site'
import PartnerSignupForm from './PartnerSignupForm'

export const metadata: Metadata = {
  title: 'Devenir partenaire FOREAS',
  description:
    'Auto-école, flotte, fédération, créateur, agent : amène des chauffeurs sur FOREAS et touche une commission mensuelle récurrente. Candidature en 1 minute, validée sous 24-48h.',
  // ⚠️ 21/08/2026 — DEUX DÉFAUTS DANS CINQ LIGNES.
  //
  // 1. L'ADRESSE ÉTAIT SANS `www`, et l'apex redirige (307 vérifié). Une adresse
  //    de partage qui pointe vers une redirection fait tomber les aperçus sur la
  //    redirection au lieu de la page. C'était le seul og:url du site dans ce cas.
  //
  // 2. REDÉCLARER `openGraph` REMPLACE LE BLOC DU PARENT, il ne le complète pas.
  //    Ces trois champs faisaient donc perdre `siteName`, `locale` et `type`,
  //    hérités du layout racine. Le défaut était déjà là, invisible.
  //
  // `partage()` reconstruit le bloc entier depuis src/lib/site.ts.
  ...{ openGraph: {
    ...partage('/devenir-partenaire', 'Devenir partenaire FOREAS — Toujours plus loin',
      'Amène des chauffeurs sur FOREAS, touche une commission mensuelle récurrente. Candidate en 1 minute.'),
  } },
  alternates: { canonical: canonique('/devenir-partenaire') },
}

export default function DevenirPartenairePage() {
  return <PartnerSignupForm />
}

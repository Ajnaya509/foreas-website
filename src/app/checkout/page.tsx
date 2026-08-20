/**
 * ⚠️ PAGE INATTEIGNABLE DEPUIS LE 20/08/2026 — ET C'EST VOULU.
 *
 * `next.config.ts` redirige /checkout vers /tarifs2 en 308. La redirection agit
 * AVANT le routage : ce composant n'est jamais rendu en production. Vérifié :
 * /checkout → 308 → /tarifs2, et /checkout/merci répond toujours 200 (c'est une
 * route distincte, la redirection ne l'attrape pas).
 *
 * POURQUOI IL RESTE. Il lit `FORMULES` depuis `src/lib/offre.ts`, la source
 * unique des prix : il ne peut donc pas se remettre à afficher un tarif périmé.
 * Le supprimer n'apporterait aucune sécurité et détruirait un tunnel de paiement
 * complet et fonctionnel.
 *
 * ⚠️ SI TU RETIRES LA REDIRECTION, tu ressuscites un SECOND tunnel de paiement.
 * Deux tunnels, c'est deux textes, deux parcours, et un seul des deux relu. C'est
 * exactement ce qui a produit le « 97 € d'un côté, 29,99 € de l'autre » corrigé
 * le 14/08. Ne le fais que délibérément.
 */
import { Metadata } from 'next'
import CheckoutClient from './CheckoutClient'

export const metadata: Metadata = {
  title: 'FOREAS — Démarrer maintenant',
  description: 'Paiement sécurisé. Garantie 30 jours satisfait ou remboursé.',
  robots: { index: false, follow: false },
}

export default function CheckoutPage() {
  return <CheckoutClient />
}

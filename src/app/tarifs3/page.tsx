import type { Metadata } from 'next'
import Tarifs3Client from './Tarifs3Client'

/**
 * FOREAS — LA NOUVELLE PAGE DE PAIEMENT.
 *
 * ⚠️ `noindex, nofollow` EST DÉLIBÉRÉ ET NE DOIT PAS ÊTRE RETIRÉ SANS CHANDLER.
 *
 * Le brief d'intégration se termine par deux phrases :
 *
 *     « Ne pas publier. »
 *     « aucune publication n'est faite avant validation de Chandler »
 *
 * Or ce dépôt se déploie tout seul : un `git push` sur `master` met la page en
 * ligne sans autre geste. « Ne pas publier » ne peut donc pas reposer sur ma
 * seule discipline à ne pas pousser — il faut que la page soit inoffensive même
 * si elle part par accident, dans un lot de commits qui n'a rien à voir.
 *
 * Avec ces deux drapeaux, une page arrivée en ligne par accident n'est pas
 * indexée, n'apparaît dans aucun résultat de recherche, et n'existe que pour qui
 * connaît l'adresse exacte. C'est la différence entre « en ligne » et « publiée ».
 */
export const metadata: Metadata = {
  title: 'FOREAS — Abonnement',
  description: 'Démarrer son abonnement FOREAS.',
  robots: { index: false, follow: false, nocache: true },
}

export default function Page() {
  return <Tarifs3Client />
}

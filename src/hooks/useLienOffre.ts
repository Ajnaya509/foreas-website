'use client'

/**
 * FOREAS — LE LIEN VERS L'OFFRE, AVEC L'ATTRIBUTION DU VISITEUR.
 *
 * Pourquoi un crochet et pas un simple appel : la chaîne de requête n'existe
 * pas au moment où le serveur fabrique la page. Si on la lisait directement,
 * le HTML du serveur et celui du navigateur différeraient, et React
 * remonterait une erreur d'hydratation à chaque chargement.
 *
 * Donc : on rend d'abord le lien SANS attribution — identique des deux côtés —
 * puis on l'enrichit une fois dans le navigateur. Un clic humain arrive très
 * après ; l'attribution est en place bien avant.
 */

import { useEffect, useState } from 'react'
import { lienOffre } from '@/lib/lienOffre'
import type { Intention } from '@/lib/mesure'

export function useLienOffre(intention?: Intention): string {
  const [url, setUrl] = useState(() => lienOffre(intention))

  useEffect(() => {
    setUrl(lienOffre(intention, window.location.search))
  }, [intention])

  return url
}

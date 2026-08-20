/**
 * FOREAS — OÙ EN EST LA BASCULE DE CLÉ, VU DE L'EXTÉRIEUR.
 *
 * Cette route ne rend qu'UN MOT : `nouvelle`, `ancienne` ou `absente`.
 * Aucun secret, aucune empreinte, aucune longueur — un mot.
 *
 * POURQUOI ELLE EXISTE. Pendant une bascule de clé, la question « ce composant
 * est-il migré ? » ne doit pas se répondre en devinant. Sans ce voyant, un site
 * qui tourne encore sur l'ancienne clé et un site déjà basculé se ressemblent
 * exactement — jusqu'au jour où on désactive l'ancienne et où l'un des deux
 * tombe.
 *
 * C'est le même raisonnement que le voyant `portes_dediees` posé le matin sur
 * les serveurs : on préfère un état lisible à une porte qu'on croit fermée.
 *
 * ⚠️ Volontairement PUBLIQUE. Savoir qu'un site utilise « une clé serveur » ne
 * donne aucun moyen d'en obtenir une. Le jour où cette route dirait autre chose
 * qu'un de ces trois mots, ce serait une régression.
 */

import { NextResponse } from 'next/server'
import { etatCleServeur } from '@/lib/supabaseServeur'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(
    {
      composant: 'foreas-website',
      cle_serveur: etatCleServeur(),
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}

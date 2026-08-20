import { NextResponse } from 'next/server'
import { destinationBoutique } from '@/lib/routageBoutique'

/**
 * /go/communaute — le saut vers l'app, depuis le parcours « communaute ».
 *
 * Toute la logique vit dans `src/lib/routageBoutique.ts` : cinq routes qui
 * recopieraient le même code finiraient par diverger, et ce dépôt a produit
 * trois fois ce piège cette semaine (double prix, prompt jumeau, durée d'essai).
 *
 * ⚠️ Aucune destination n'est lue depuis l'URL — voir le fichier partagé.
 */
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const entree = new URL(request.url)
  const { url, canal } = destinationBoutique(
    'communaute',
    request.headers.get('user-agent'),
    entree,
    entree.origin,
  )
  // Journal sans donnée personnelle : le canal choisi, pas qui a cliqué.
  console.log('[go/communaute] →', canal)
  return NextResponse.redirect(url, 307)
}

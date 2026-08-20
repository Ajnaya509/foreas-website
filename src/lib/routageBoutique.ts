/**
 * FOREAS — ROUTAGE VERS LES BOUTIQUES. Source unique du saut vers l'app.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUE FAIT CE FICHIER, ET CE QU'IL REFUSE DE FAIRE
 *
 * Un visiteur clique « installer » depuis une page dédiée. Selon son téléphone,
 * il doit atterrir sur l'App Store ou sur Google Play — et l'attribution doit
 * survivre au saut, sinon on ne saura jamais quelle page a amené quel abonné.
 *
 * ⚠️ AUCUNE DESTINATION N'EST ACCEPTÉE DEPUIS L'URL. Une route de redirection
 * qui obéit à un paramètre est une « redirection ouverte » : n'importe qui
 * fabrique `foreas.xyz/go/…?url=site-malveillant`, envoie le lien, et la
 * victime voit un domaine de confiance avant d'être emmenée ailleurs. Les
 * destinations possibles sont ci-dessous, en dur, et il n'y en a pas d'autres.
 *
 * ⚠️ PAS DE DÉTECTION TROMPEUSE. On lit l'agent du navigateur pour choisir la
 * bonne boutique, c'est tout. On ne prétend pas détecter autre chose, on ne
 * cache pas la destination, et sur ordinateur on ne fait pas semblant d'ouvrir
 * une app qui n'existe pas : on emmène vers l'offre, qui est la suite honnête.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI IL A FALLU LE REFAIRE (31/07/2026 puis 20/08/2026)
 *
 * La version d'origine était cassée sur les TROIS appareils : identifiant App
 * Store resté à l'état de gabarit (404), deux `?` dans l'URL Google Play (le
 * paramètre devenait une partie du nom de paquet), et sur ordinateur une
 * redirection vers la page d'où l'on venait — une boucle.
 *
 * Elle a ensuite été rabattue vers /tarifs2 pour tout le monde, avec une raison
 * valable à l'époque : « l'app iOS n'a pas d'identifiant App Store utilisable,
 * on ne devine pas un identifiant ». Cette raison est TOMBÉE : la fiche iOS est
 * publiée et répond (vérifié le 20/08). D'où ce fichier.
 */

import { APP_STORE_URL, playStoreUrlAvecCampagne } from '@/lib/app-stores'

/** Les paramètres qu'on laisse passer. Tout le reste est ignoré, par principe. */
const PARAMETRES_CONSERVES = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'ref', // code parrain / partenaire
  'partner',
  'ville',
] as const

/** Les cinq intentions couvertes. Un parcours inconnu n'existe pas : il n'est pas routé. */
export type IntentionDriver =
  | 'rentabilite'
  | 'zones'
  | 'clientele'
  | 'ajnaya'
  | 'communaute'

/**
 * Quelle boutique pour cet agent ?
 * `null` = ni iPhone ni Android → on ne devine pas, on renvoie vers l'offre.
 */
export function boutiqueDepuisAgent(agent: string | null | undefined): 'ios' | 'android' | null {
  const a = (agent || '').toLowerCase()
  // iPad récents s'annoncent comme macOS : on ne cherche pas à les démasquer.
  // Se tromper enverrait un utilisateur d'ordinateur sur l'App Store — mieux
  // vaut la page d'offre, qui marche partout.
  if (/iphone|ipod/.test(a)) return 'ios'
  if (/ipad/.test(a)) return 'ios'
  if (/android/.test(a)) return 'android'
  return null
}

/**
 * Construit la destination finale.
 *
 * @param intention  d'où vient le clic — sert l'attribution, jamais la destination
 * @param agent      l'agent du navigateur
 * @param entree     l'URL d'entrée, pour reprendre les paramètres d'attribution
 * @param origine    l'origine du site, pour le repli web
 */
export function destinationBoutique(
  intention: IntentionDriver,
  agent: string | null | undefined,
  entree: URL,
  origine: string,
): { url: string; canal: 'ios' | 'android' | 'web' } {
  const boutique = boutiqueDepuisAgent(agent)

  // La campagne transmise à Google Play : elle remonte dans la console et
  // permet de savoir quelle page a produit quelle installation. Composée à
  // partir de valeurs QU'ON contrôle, jamais d'une chaîne libre de l'URL.
  const source = entree.searchParams.get('utm_source')?.slice(0, 40) ?? 'site'
  const campagne = `foreas_${intention}_${source}`.replace(/[^a-zA-Z0-9_]/g, '')

  if (boutique === 'android') {
    return { url: playStoreUrlAvecCampagne(campagne), canal: 'android' }
  }
  if (boutique === 'ios') {
    // L'App Store ne transporte pas de paramètre d'attribution librement : le
    // suivi passe par les Custom Product Pages, pas par l'URL. On n'invente
    // donc pas un paramètre qui serait ignoré et donnerait l'illusion d'un suivi.
    return { url: APP_STORE_URL, canal: 'ios' }
  }

  // Ordinateur, ou agent inconnu. On ne fait pas semblant : on emmène vers
  // l'offre, avec l'attribution conservée. C'est la suite honnête d'un clic
  // « installer » sur une machine qui ne peut rien installer.
  const repli = new URL('/tarifs2', origine)
  for (const p of PARAMETRES_CONSERVES) {
    const v = entree.searchParams.get(p)
    if (v) repli.searchParams.set(p, v.slice(0, 120))
  }
  if (!repli.searchParams.has('utm_source')) repli.searchParams.set('utm_source', 'go')
  if (!repli.searchParams.has('utm_medium')) repli.searchParams.set('utm_medium', 'app_cta')
  if (!repli.searchParams.has('utm_campaign')) repli.searchParams.set('utm_campaign', intention)
  return { url: repli.toString(), canal: 'web' }
}

/**
 * FOREAS — LE CLIENT SUPABASE À DROITS SERVEUR. UN SEUL ENDROIT.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI CE FICHIER EXISTE
 *
 * Mesuré le 20/08/2026 : ONZE routes du site écrivaient, chacune de leur côté :
 *
 *     const key = process.env.SUPABASE_SERVICE_ROLE_KEY
 *              || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
 *
 * Ce `||` est le pire défaut possible pour une migration de clé. Le jour où la
 * clé serveur change et que le site n'est pas mis à jour dans la même minute,
 * ces onze routes ne tombent PAS en erreur : elles se mettent silencieusement à
 * lire avec les droits d'un visiteur anonyme. Pas de 500, pas d'alerte, juste
 * des réponses incomplètes que personne ne remarque — et des écritures refusées
 * en silence par les règles de sécurité.
 *
 * Une panne bruyante se répare. Une dégradation silencieuse s'installe.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LA RÈGLE, ET ELLE N'A QUE TROIS CAS
 *
 *   1. la NOUVELLE clé secrète est posée   → on l'utilise
 *   2. sinon l'ANCIENNE est posée          → on l'utilise, en le signalant
 *   3. sinon                               → ON REFUSE. Jamais la clé publique.
 *
 * Le repli du cas 2 est TEMPORAIRE et n'existe qu'entre deux variables
 * d'environnement. Il ne contient aucune valeur de clé, et il ne retombe jamais
 * vers un client à droits réduits : une route qui a besoin des droits serveur
 * doit les avoir ou échouer franchement.
 *
 * ⚠️ NE JAMAIS ajouter `|| process.env.NEXT_PUBLIC_...` ici. C'est précisément
 * ce que ce fichier existe pour supprimer.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

/** Ce que le site utilise réellement, en un mot. Aucun secret, aucune empreinte. */
export type EtatCleServeur = 'nouvelle' | 'ancienne' | 'absente'

let _client: SupabaseClient | null = null
let _etat: EtatCleServeur | null = null
let _deja_signale = false

function resoudre(): { url: string | null; cle: string | null; etat: EtatCleServeur } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? null

  // 1) La nouvelle clé, nommée par composant. C'est la cible.
  const neuve = (process.env.SUPABASE_SECRET_KEY ?? '').trim()
  if (neuve) return { url, cle: neuve, etat: 'nouvelle' }

  // 2) L'ancienne, le temps de la bascule. On la signale UNE fois, sans jamais
  //    écrire sa valeur ni son empreinte : un journal ne doit pas devenir une
  //    seconde cachette pour un secret.
  const ancienne = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()
  if (ancienne) return { url, cle: ancienne, etat: 'ancienne' }

  // 3) Rien. On ne devine pas, on ne dégrade pas.
  return { url, cle: null, etat: 'absente' }
}

/**
 * L'état courant, pour le point de santé et pour `npm run porte`.
 * Sert à répondre à « ce composant est-il migré ? » sans avoir à deviner.
 */
export function etatCleServeur(): EtatCleServeur {
  if (_etat === null) _etat = resoudre().etat
  return _etat
}

/**
 * Le client à droits serveur.
 *
 * @throws si aucune clé serveur n'est configurée. C'est voulu : l'appelant doit
 *         répondre une erreur franche, pas servir une réponse appauvrie.
 */
export function clientServeur(): SupabaseClient {
  if (_client) return _client

  const { url, cle, etat } = resoudre()
  _etat = etat

  if (!url) {
    throw new Error('[supabaseServeur] NEXT_PUBLIC_SUPABASE_URL absente — arrêt.')
  }
  if (!cle) {
    throw new Error(
      '[supabaseServeur] aucune clé serveur configurée (ni SUPABASE_SECRET_KEY, ' +
        'ni SUPABASE_SERVICE_ROLE_KEY) — arrêt. On ne retombe PAS sur la clé publique.',
    )
  }
  if (etat === 'ancienne' && !_deja_signale) {
    _deja_signale = true
    console.warn(
      '[supabaseServeur] clé ANCIENNE en service. Poser SUPABASE_SECRET_KEY pour terminer la bascule.',
    )
  }

  _client = createClient(url, cle, { auth: { persistSession: false } })
  return _client
}

/**
 * Variante qui ne lève pas, pour les routes qui préfèrent répondre une erreur
 * maîtrisée plutôt que planter. Rend `null` — et c'est à l'appelant de renvoyer
 * un code d'erreur, JAMAIS de continuer avec un client à droits réduits.
 */
export function clientServeurOuNull(): SupabaseClient | null {
  try {
    return clientServeur()
  } catch (e) {
    console.error('[supabaseServeur]', e instanceof Error ? e.message : 'échec de configuration')
    return null
  }
}

/**
 * La VALEUR de la clé serveur, pour les rares appelants qui construisent
 * eux-mêmes leur requête (appels HTTP directs à PostgREST, par exemple).
 *
 * Rend une chaîne VIDE si aucune clé serveur n'est configurée — jamais la clé
 * publique. L'appelant doit tester et refuser : `if (!cle) return 503`.
 *
 * ⚠️ À n'utiliser que si `clientServeur()` ne convient pas. Une valeur qui
 * circule est une valeur qui finit par être journalisée.
 */
export function cleServeurOuVide(): string {
  const { cle, etat } = resoudre()
  _etat = etat
  if (etat === 'ancienne' && !_deja_signale) {
    _deja_signale = true
    console.warn(
      '[supabaseServeur] clé ANCIENNE en service. Poser SUPABASE_SECRET_KEY pour terminer la bascule.',
    )
  }
  return cle ?? ''
}

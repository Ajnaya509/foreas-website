/**
 * FOREAS — LE LIEN VERS L'OFFRE. UN SEUL ENDROIT QUI SAIT OÙ ELLE EST.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI CE FICHIER EXISTE
 *
 * Mesuré le 21/08/2026 sur le HTML servi de la page d'accueil : **zéro
 * occurrence de « tarifs2 »**, contre **six liens WhatsApp**. Le bouton du menu
 * qui s'appelle « Souscrire » pointait lui aussi vers WhatsApp.
 *
 * Autrement dit : depuis la porte d'entrée du site, **on ne pouvait pas
 * atteindre la page où l'on paie**, autrement qu'en tapant l'adresse à la main.
 *
 * Ce n'est pas un oubli de bouton. C'est un site qui envoie tout le monde dans
 * une conversation, et qui espère que la conversation vendra.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUE CE FICHIER GARANTIT
 *
 *  · une seule adresse d'offre : `/tarifs2` ;
 *  · l'attribution survit au clic — sinon on saura qu'un abonnement existe, mais
 *    jamais quelle page l'a produit ;
 *  · l'intention voyage avec le visiteur, pour qu'`Ajnaya` et la mesure sachent
 *    d'où il vient.
 *
 * ⚠️ WhatsApp n'est PAS supprimé. Il est remis à sa place : une aide à la
 * décision, pas la seule sortie du site.
 */

import type { Intention } from '@/lib/mesure'

/** Les paramètres qu'on laisse passer. Tout le reste est ignoré, par principe. */
const PARAMETRES_CONSERVES = [
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
  'ref', 'partner', 'ville',
] as const

/**
 * L'adresse de l'offre, avec l'attribution du visiteur reprise telle quelle.
 *
 * @param intention  d'où vient le clic. Sert la mesure, jamais la destination.
 * @param recherche  la chaîne de requête courante (`window.location.search`).
 */
export function lienOffre(intention?: Intention, recherche?: string): string {
  const params = new URLSearchParams()

  if (recherche) {
    const source = new URLSearchParams(recherche)
    for (const nom of PARAMETRES_CONSERVES) {
      const v = source.get(nom)
      if (v) params.set(nom, v.slice(0, 120))
    }
  }

  // On note d'où vient le clic, sans écraser une campagne existante : une
  // campagne payante qui perdrait sa source deviendrait indécomptable.
  if (intention && !params.has('utm_content')) params.set('utm_content', intention)
  if (!params.has('utm_source')) params.set('utm_source', 'site')
  if (!params.has('utm_medium')) params.set('utm_medium', 'cta')

  const q = params.toString()
  return q ? `/tarifs2?${q}` : '/tarifs2'
}

/**
 * Le libellé du bouton principal.
 *
 * ⚠️ RÈGLE : le mot dit la destination. « Essayer » mène à l'offre.
 * « Installer » mène à une boutique. **Jamais deux destinations différentes
 * derrière le même mot** — c'est ce qui rend une mesure de clic ininterprétable.
 *
 * La durée vient de la source unique : personne ne réécrit « 3 jours » à la main.
 */
export const LIBELLE_OFFRE = 'Essayer' as const
export const LIBELLE_BOUTIQUE = 'Installer' as const

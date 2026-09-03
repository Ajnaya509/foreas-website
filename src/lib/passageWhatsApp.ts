import type { WhatsAppSection } from './whatsappLink'

/**
 * FOREAS — CONSTRUCTION DU LIEN VERS LE PASSAGE WHATSAPP.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUE CE FICHIER REMPLACE, ET POURQUOI
 *
 * Avant : chaque bouton appelait `buildWAUrl()` et servait une adresse `wa.me`
 * complète dans le HTML. Deux conséquences, toutes deux mesurées :
 *
 *  1. LE BADGE APPAREIL FUITAIT. Pour porter la référence attendue par la
 *     Pieuvre, la v150 descendait `foreas_vid` (cookie `httpOnly`) jusqu'au lien.
 *     Résultat : 3 occurrences EN CLAIR dans le HTML servi. Le cookie est
 *     `httpOnly` justement pour qu'un script injecté ne puisse pas le lire ;
 *     l'écrire dans le DOM annulait cette protection.
 *
 *  2. NEUF BOUTONS SUR ONZE NE PORTAIENT AUCUNE RÉFÉRENCE ET N'ÉTAIENT PAS
 *     COMPTÉS. Chaque page devait résoudre le problème pour son compte, et
 *     aucune ne pouvait le faire : le cookie est illisible depuis le navigateur.
 *
 * Maintenant : le lien servi est `/wa?s=final&p=%2F&i=ajnaya`. Aucune donnée
 * sensible. Le serveur (`src/app/wa/route.ts`) lit le cookie au clic, compte,
 * compose le message et redirige. Un seul endroit à corriger, une seule fois.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ POURQUOI L'ORIGINE (CAMPAGNE, PARRAIN) N'EST PAS AJOUTÉE ICI
 *
 * Tentation évidente : lire `window.location.search` et recopier les `utm_*`
 * dans le lien. Mais ce fichier est utilisé par des composants rendus D'ABORD
 * SUR LE SERVEUR. Le serveur n'a pas de `window` : il écrirait un lien sans
 * `utm`, le navigateur en écrirait un autre avec — React verrait deux versions
 * du même attribut et remonterait une erreur d'hydratation. Et sans JavaScript,
 * l'origine serait perdue de toute façon.
 *
 * Le passage lit donc l'origine dans l'en-tête `Referer`, qui porte l'adresse
 * complète de la page quittée quand la navigation reste sur le même domaine.
 * Vérifié : le site déclare `Referrer-Policy: strict-origin-when-cross-origin`,
 * qui envoie l'URL entière en même origine. Ça marche aussi sans JavaScript.
 */

export interface OptionsPassage {
  /** La section, pour choisir le message pré-rempli. Liste fermée. */
  section: WhatsAppSection
  /** La zone évoquée, quand il y en a une (message `hero_zone`). */
  zone?: string | null
  /** Le créneau évoqué (« pour ce soir »), quand le message en parle. */
  creneau?: string | null
  /**
   * Identifiant de la CONVERSATION en cours sur le site, quand il y en a une.
   *
   * ⚠️ CE N'EST PAS LE BADGE APPAREIL, ET C'EST DÉLIBÉRÉ.
   *
   * Le badge `foreas_vid` désigne un appareil et vit dans un cookie `httpOnly` :
   * il ne doit jamais arriver au navigateur. Cet identifiant-ci est fabriqué par
   * le navigateur lui-même (`getSessionId()`), ne désigne aucune personne, et
   * relie le message WhatsApp à la discussion que le chauffeur vient d'avoir.
   *
   * Quand il existe, le passage l'enregistre côté serveur avec le badge appareil.
   * Aucun des deux n'est ajouté au message WhatsApp : un texte modifiable ne
   * prouve jamais l'identité de la personne qui l'envoie.
   */
  sessionConversation?: string | null
  /** Le montant réglé par le chauffeur lui-même (message `pain`). */
  montant?: number | null
  /** L'adresse canonique de la page, pas l'URL du navigateur. */
  page: string
  /** L'intention du visiteur sur cette page. */
  intention?: string | null
  /**
   * Où se trouve le bouton sur la page (`barre_collante`, `hero`, `pied`…).
   * Sans lui, deux boutons de la même page seraient indiscernables dans la
   * mesure — et on ne saurait jamais lequel des deux fait le travail.
   */
  emplacement?: string | null
}

/**
 * Construit le lien vers le passage. Chaîne pure, identique côté serveur et
 * côté navigateur — donc jamais de désaccord d'hydratation.
 */
export function lienPassageWhatsApp(o: OptionsPassage): string {
  const p = new URLSearchParams()
  p.set('s', o.section)
  if (o.zone) p.set('z', o.zone.slice(0, 80))
  if (o.creneau) p.set('c', o.creneau.slice(0, 60))
  if (o.sessionConversation) p.set('sid', o.sessionConversation.slice(0, 80))
  if (typeof o.montant === 'number' && Number.isFinite(o.montant) && o.montant > 0) {
    p.set('a', String(Math.round(o.montant)))
  }
  p.set('p', o.page)
  if (o.intention) p.set('i', o.intention)
  if (o.emplacement) p.set('o', o.emplacement)
  return `/wa?${p.toString()}`
}

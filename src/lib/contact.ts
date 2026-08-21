/**
 * FOREAS — LE CONTACT. UNE SEULE SOURCE POUR LES SUJETS, LES LIMITES ET LES RÈGLES.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI CE FICHIER EXISTE
 *
 * Mesuré le 21/08/2026 sur le HTML servi : le formulaire de `/contact` était une
 * décoration. `<form>` sans `action`, sans `method`, sans gestionnaire ; quatre
 * champs SANS ATTRIBUT `name`. Le bouton « Envoyer » ne faisait rien du tout.
 *
 * Et ce n'est pas une page secondaire : `/professionnels` y envoie ses DEUX
 * boutons — « Devenir partenaire » et « Demander une démo ». **Tout le B2B du
 * site tombait dans un formulaire qui n'envoyait rien.** Chaque personne qui a
 * écrit à FOREAS depuis cette page a cru être entendue et ne l'a jamais été.
 *
 * C'est le défaut le moins spectaculaire de l'audit et probablement le plus
 * coûteux : on ne perd pas un visiteur, on perd quelqu'un qui voulait parler.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUI EST ICI, ET POURQUOI
 *
 * Les sujets, les limites de longueur et le destinataire. Le destinataire vit
 * ICI, côté serveur — jamais dans le formulaire. Un visiteur qui pourrait
 * choisir le destinataire transformerait le site en relais d'envoi.
 */

/** Les sujets proposés. Le formulaire les lit ici, le serveur les revérifie. */
export const SUJETS_CONTACT = [
  { valeur: 'question', libelle: 'Question générale' },
  { valeur: 'support', libelle: 'Support technique' },
  { valeur: 'partenariat', libelle: 'Partenariat' },
  { valeur: 'flotte', libelle: 'Flotte / entreprise' },
  { valeur: 'presse', libelle: 'Presse' },
] as const

export type SujetContact = (typeof SUJETS_CONTACT)[number]['valeur']

export function sujetValide(v: unknown): v is SujetContact {
  return typeof v === 'string' && SUJETS_CONTACT.some((s) => s.valeur === v)
}

export function libelleSujet(v: string): string {
  return SUJETS_CONTACT.find((s) => s.valeur === v)?.libelle ?? v
}

/**
 * ⚠️ LE DESTINATAIRE EST FIXÉ ICI, CÔTÉ SERVEUR.
 * Il n'est jamais lu depuis la requête. Un formulaire public dont le visiteur
 * choisit le destinataire est un relais d'envoi : n'importe qui s'en sert pour
 * écrire à n'importe qui depuis le domaine foreas.xyz, et c'est le domaine qui
 * finit sur les listes noires.
 */
export const DESTINATAIRE_CONTACT = 'contact@foreas.xyz'

/** Limites. Elles servent au formulaire ET au serveur — jamais deux valeurs. */
export const LIMITES_CONTACT = {
  nomMax: 80,
  emailMax: 160,
  messageMin: 10,
  messageMax: 3000,
  /** Envois autorisés par empreinte et par heure. Volontairement bas : ce
   *  formulaire sert à parler à quelqu'un, pas à envoyer en série. */
  envoisParHeure: 3,
} as const

/**
 * Le message contient-il ce qui trahit un envoi automatique ?
 *
 * On ne cherche PAS à juger le contenu — un chauffeur a le droit d'envoyer un
 * lien. On repère les marqueurs d'envoi en masse : beaucoup de liens, du code
 * HTML, une insertion d'en-tête de courrier.
 *
 * Rend la raison du refus, ou `null` si le message passe.
 */
export function motifDeRefus(message: string): string | null {
  const liens = (message.match(/https?:\/\//gi) ?? []).length
  if (liens > 3) return 'trop de liens'
  if (/<\s*(script|iframe|img|a\s)/i.test(message)) return 'balises interdites'
  // Une insertion d'en-tête : un retour à la ligne suivi d'un en-tête de courrier.
  if (/\n\s*(bcc|cc|content-type|mime-version)\s*:/i.test(message)) {
    return 'en-tête de courrier dans le message'
  }
  return null
}

/** Une adresse plausible. On reste volontairement large : refuser une adresse
 *  valide est pire que d'en accepter une fausse, qui rebondira d'elle-même. */
export function emailPlausible(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) && v.length <= LIMITES_CONTACT.emailMax
}

/**
 * TOUT CE QUI SE DÉCIDE DANS LES MAILS AUTOMATIQUES : TEXTES, DÉLAIS, INTERRUPTEURS.
 *
 * ⚠️ DEUX MAILS, DEUX MOMENTS QU'IL NE FAUT JAMAIS CONFONDRE :
 *
 *   1. PANIER ABANDONNÉ — il a tapé son e-mail sur /tarifs3 et n'a PAS payé.
 *      Aucun compte, aucun abonnement. On a une adresse, rien d'autre.
 *      Part 15 minutes après la saisie.
 *
 *   2. PROFIL INCOMPLET — il a PAYÉ, son compte existe, il manque son numéro.
 *      Part le lendemain, puis une semaine après.
 *
 *   Écrire « ton abonnement est actif » à quelqu'un du premier groupe serait
 *   un mensonge, et il le saurait immédiatement.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ POURQUOI CE FICHIER EXISTE
 *
 * Chandler, le 29/08 : « qui a déterminé le copywriting et le départ de ces
 * mails ? non, c'est pas comme ça, il faut que je les édite ».
 *
 * Il a raison : j'avais écrit le texte et choisi les délais tout seul, enfouis
 * au milieu d'une fonction d'envoi. Une phrase qui part au nom de FOREAS ne se
 * décide pas dans un fichier technique, et surtout pas sans que celui dont
 * c'est la voix puisse la lire.
 *
 * Tout ce qui se décide est donc rassemblé ici, en haut, en clair : les deux
 * textes, les deux délais, et l'interrupteur. Le reste du code ne fait que
 * les appliquer.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ L'INTERRUPTEUR EST À « ÉTEINT » PAR DÉFAUT, ET C'EST VOULU
 *
 * Rien ne part vers un chauffeur tant que `RELANCES_PROFIL_ACTIVES` ne vaut pas
 * `true` dans Vercel. Un texte non validé qui s'envoie tout seul au nom de
 * quelqu'un d'autre, ça ne se rattrape pas.
 *
 * ⚠️ MAIS UN INTERRUPTEUR ÉTEINT QUI SE TAIT EST UN PIÈGE. Le compte rendu
 * quotidien DIT qu'elles sont éteintes et combien de chauffeurs attendent —
 * sinon l'oubli devient définitif et personne ne le voit jamais.
 */

/** L'interrupteur. Tant qu'il est faux, aucun chauffeur ne reçoit de relance. */
export function relancesActives(): boolean {
  return (process.env.RELANCES_PROFIL_ACTIVES || '').trim().toLowerCase() === 'true'
}

/**
 * Quand part chaque relance, en jours après le paiement.
 * · La première assez tôt pour qu'il se souvienne d'avoir payé.
 * · La seconde assez tard pour qu'il ait ouvert l'app entre-temps.
 * À CHANGER LIBREMENT — c'est une décision de Chandler, pas une contrainte
 * technique. La seule règle du code : la seconde doit être après la première.
 */
export const DELAIS_JOURS = {
  premiere: 1,
  seconde: 7,
} as const

/** Combien de relances au maximum. Au-delà, on laisse le chauffeur tranquille. */
export const PLAFOND_RELANCES = 2

export type TexteRelance = {
  sujet: string
  titre: string
  /** Le corps. Une seule idée par phrase, comme partout ailleurs. */
  corps: string
  /** Le texte du bouton. */
  bouton: string
}

/**
 * ⚠️ CES DEUX TEXTES SONT UN BROUILLON, PAS UNE DÉCISION.
 * Ils sont écrits pour que quelque chose existe et se lise, pas pour rester.
 * Ils partent après le paiement : on tutoie (règle de Chandler). Ils ne parlent
 * pas d'argent et ne réclament rien — ils disent ce que le chauffeur y gagne.
 */
export const TEXTES: Record<1 | 2, TexteRelance> = {
  1: {
    sujet: 'Il manque ton numéro',
    titre: 'Il manque ton numéro',
    corps:
      "Ton abonnement est actif et ton compte est prêt. Il reste une chose : ton prénom et ton numéro. " +
      "Sans eux, Ajnaya ne peut ni t'appeler par ton nom, ni te prévenir sur WhatsApp quand la demande monte près de toi.",
    bouton: 'Compléter en 30 secondes',
  },
  2: {
    sujet: 'Ajnaya ne peut toujours pas te prévenir',
    titre: 'Ajnaya ne peut toujours pas te prévenir',
    corps:
      'Tu paies pour un service dont la moitié dort. Les alertes de zones, les pics de demande, ' +
      "les rappels avant une course : tout ça passe par WhatsApp, et on n'a pas ton numéro. " +
      'Trente secondes suffisent.',
    bouton: 'Compléter en 30 secondes',
  },
}


/* ═══════════════════════════════════════════════════════════════════════════
   LE PANIER ABANDONNÉ

   ⚠️ IL A DONNÉ SON E-MAIL, PAS SA CARTE. Rien ne lui a été facturé, aucun
   compte n'existe. Le mail ne peut donc parler ni d'abonnement, ni de compte,
   ni de mot de passe — seulement de la place qu'il était en train de prendre.

   ⚠️ ET IL N'EN RECEVRA QU'UN. Quelqu'un qui renonce à s'abonner n'a pas donné
   son accord pour être démarché : un rappel se défend, une séquence non.
   ═══════════════════════════════════════════════════════════════════════════ */

/** L'interrupteur du panier abandonné. Éteint tant que le texte n'est pas validé. */
export function panierAbandonneActif(): boolean {
  return (process.env.PANIER_ABANDONNE_ACTIF || '').trim().toLowerCase() === 'true'
}

/**
 * Combien de minutes après la saisie de l'adresse.
 * 15 = le choix de Chandler : assez court pour qu'il soit encore devant son
 * téléphone, assez long pour ne pas doubler quelqu'un qui paie lentement.
 */
export const PANIER_DELAI_MINUTES = 15

/** ⚠️ BROUILLON, PAS UNE DÉCISION. À relire et à changer. */
export const PANIER_TEXTE: TexteRelance = {
  sujet: 'Tu y étais presque',
  titre: 'Tu y étais presque',
  corps:
    "Tu as commencé ton inscription à FOREAS et tu t'es arrêté avant la fin. " +
    "Rien n'a été prélevé, et rien ne le sera : les trois premiers jours sont offerts, " +
    "et l'annulation prend un clic. Si quelque chose a bloqué, réponds à ce message — " +
    "on regarde.",
  bouton: 'Reprendre où tu en étais',
}

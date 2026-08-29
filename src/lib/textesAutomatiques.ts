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
 * ⚠️ RÉÉCRITS LE 29/08 SOUS LA GRILLE /foreas-copy-atomic. CE QUI N'ALLAIT PAS :
 *
 * Mail 1 — « Il manque ton numéro » : c'était FOREAS qui réclamait son dû. La
 * marque devenait le héros demandeur (anti-pattern Miller n°1). Un titre porte
 * SON gain, jamais notre manque.
 *
 * Mail 2 — « Tu paies pour un service dont la moitié dort » : un reproche
 * adressé à quelqu'un qui paie. §8 (émotionnel) : le shaming braque, il ne
 * convertit pas. Et « toujours pas » enfonçait le reproche.
 *
 * Les deux disaient « Compléter » — un verbe de formulaire. §2 du playbook :
 * verbe + objet, et l'objet doit être le bénéfice, pas la corvée.
 *
 * Le second garde son rôle de dernier message, mais il RECONNAÎT le choix au
 * lieu de le juger. C'est la seule urgence vraie dont on dispose, et elle est
 * tenue par le code : le plafond de deux envois la rend honnête.
 */
export const TEXTES: Record<1 | 2, TexteRelance> = {
  1: {
    sujet: 'Ajnaya t’attend sur WhatsApp',
    titre: 'Ajnaya t’attend sur WhatsApp',
    corps:
      'Quand tu roules, tu ne regardes pas ton écran. ' +
      "C'est pour ça qu'Ajnaya passe par WhatsApp : une zone qui chauffe, un pic à l'aéroport, " +
      'le bon moment pour rentrer. ' +
      'Il lui manque ton prénom et ton numéro. Trente secondes. ' +
      "Personne ne t'appellera pour te vendre quoi que ce soit.",
    bouton: 'Brancher WhatsApp',
  },
  2: {
    sujet: 'Dernier message à ce sujet',
    titre: 'Dernier message à ce sujet',
    corps:
      "Tu n'as pas donné ton numéro, et c'est ton droit. L'app marche très bien sans. " +
      "Ce qui ne marche pas sans, c'est Ajnaya quand tu roules sans regarder ton écran : " +
      "elle voit la zone chauffer, et elle n'a personne à prévenir. " +
      "Trente secondes si tu changes d'avis. Sinon on n'en reparle plus.",
    bouton: 'Brancher WhatsApp',
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

/**
 * ⚠️ RÉÉCRIT LE 29/08 SOUS LA GRILLE /foreas-copy-atomic. CE QUI N'ALLAIT PAS :
 *
 * · « Tu y étais presque » = de la consolation. On le félicitait d'avoir
 *   renoncé. §8 (émotionnel) : la pitié infantilise et braque.
 * · La première phrase parlait de NOTRE tunnel (« ton inscription à FOREAS »),
 *   pas de SA vie. Anti-pattern Miller n°1 : il doit se reconnaître dans la
 *   première phrase, et le héros c'est lui.
 * · Zéro bénéfice. Le mail parlait de paiement et d'annulation — nos
 *   conditions — jamais de ce qu'il rate. Aucun désir touché.
 * · Le mot « prélevé » : champ lexical de la perte, banni par Chandler le
 *   28/08. Il était encore là.
 *
 * ⚠️ ET AUCUN CHIFFRE DE GAIN N'A ÉTÉ AJOUTÉ, EXPRÈS. La grille réclame du
 * concret chiffré ; le canon du dépôt interdit toute affirmation non mesurée.
 * Entre les deux, c'est le canon qui gagne. Les seuls chiffres ici sont ceux
 * qu'on peut prouver : trois jours, zéro euro, un clic.
 */
export const PANIER_TEXTE: TexteRelance = {
  sujet: 'Trois jours pour voir si ça change ta journée',
  titre: 'Trois jours pour voir ce que ça change',
  corps:
    'Tu choisis tes zones au feeling, comme tout le monde. ' +
    "Ajnaya, elle, regarde la demande en direct et te dit où elle monte. " +
    "C'est tout ce qu'elle fait, et c'est déjà beaucoup. " +
    'Trois jours offerts pour voir ce que ça donne sur tes journées à toi. ' +
    "0 € aujourd'hui, et un clic pour arrêter quand tu veux. " +
    "Si quelque chose a bloqué tout à l'heure, réponds à ce mail — je lis.",
  bouton: 'Lancer mes 3 jours',
}

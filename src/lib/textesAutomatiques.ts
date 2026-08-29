/**
 * LA SÉQUENCE DU PANIER ABANDONNÉ — TOUT CE QUI SE DÉCIDE EST ICI.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * À QUI ELLE S'ADRESSE, ET À QUI ELLE NE S'ADRESSE PAS
 *
 * ⚠️ UNIQUEMENT À CEUX QUI N'ONT PAS PAYÉ. Ils ont tapé leur e-mail sur
 * `/tarifs3` et se sont arrêtés avant la carte. Aucun compte, aucun abonnement,
 * aucun mot de passe.
 *
 * ⚠️ CORRECTION DU 29/08, PAR CHANDLER. J'avais bâti ces trois mails pour des
 * gens qui AVAIENT PAYÉ sans finir leur profil. C'était la mauvaise cible :
 * relancer un client qui vient de donner sa carte, c'est du harcèlement
 * administratif ; relancer quelqu'un qui a renoncé, c'est de la vente.
 * Les mails aux payants ont été supprimés, pas déplacés.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LES TROIS TEMPS, ET POURQUOI CHACUN VA AILLEURS
 *
 *   1. +15 min  → vers le PAIEMENT. Il est encore devant son téléphone.
 *   2. J+1 18h  → vers WHATSAPP. S'il n'a pas payé à froid, c'est qu'il a une
 *                 question. On ne redemande pas sa carte, on ouvre la parole.
 *   3. J+7      → vers le PAIEMENT. Dernier message, et le plus dur : celui qui
 *                 nomme ce que ça coûte de continuer à décider à l'aveugle.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ CE QU'ON NE PROMET PLUS, ET POURQUOI
 *
 * Une version précédente disait « Ajnaya te prévient sur WhatsApp quand la
 * demande monte ». Chandler, le 29/08 : « non elle n'envoie pas d'alerte sur
 * WhatsApp ». La phrase est partie. Une promesse qu'on ne tient pas ne se
 * découvre pas au moment où on la fait — elle se découvre le jour où le
 * chauffeur attend une alerte qui n'arrive jamais, et ce jour-là il ne
 * réclame pas : il s'en va.
 *
 * ⚠️ AUCUN CHIFFRE DE GAIN N'EST ÉCRIT ICI, EXPRÈS. La grille
 * /foreas-copy-atomic réclame du concret chiffré ; le canon du dépôt interdit
 * toute affirmation non mesurée. C'est le canon qui gagne. Les seuls chiffres
 * sont prouvables : trois jours, zéro euro, un clic.
 *
 * ⚠️ ET AUCUNE PREUVE SOCIALE INVENTÉE. Pas de « 147 chauffeurs », pas de
 * « ils sont déjà nombreux à ». Le mail 3 frappe fort sans citer personne :
 * il décrit un mécanisme vrai, pas une foule imaginaire.
 */

/** L'interrupteur. Tant qu'il est faux, personne ne reçoit rien. */
export function panierAbandonneActif(): boolean {
  return (process.env.PANIER_ABANDONNE_ACTIF || '').trim().toLowerCase() === 'true'
}

/**
 * Quand part chaque mail, compté depuis la saisie de l'adresse.
 *
 * Le premier en minutes (il est encore devant son écran), les suivants en jours.
 * ⚠️ Les mails 2 et 3 partent au passage quotidien du planificateur, fixé à
 * 18 h Paris : c'est l'heure où un chauffeur est entre deux services, pas au
 * volant. Changer l'heure se fait dans `vercel.json`, pas ici.
 */
export const PANIER_DELAIS = {
  premier_minutes: 15,
  deuxieme_jours: 1,
  troisieme_jours: 7,
} as const

/** Trois mails, puis on le laisse tranquille. Le code plafonne ici. */
export const PANIER_NOMBRE_DE_MAILS = 3

export type TexteMail = {
  sujet: string
  titre: string
  /** Une idée par phrase. Le gabarit coupe aux points pour aérer. */
  corps: string
  bouton: string
  /** Où mène le bouton. `paiement` → /tarifs3 · `whatsapp` → /wa */
  destination: 'paiement' | 'whatsapp'
}

/**
 * ⚠️ CES TROIS TEXTES SONT VALIDÉS PAR CHANDLER LE 29/08.
 * Les modifier sans lui, c'est refaire l'erreur qu'il a déjà corrigée une fois.
 */
export const PANIER_TEXTES: Record<1 | 2 | 3, TexteMail> = {
  /* ── 1 · +15 min · vers le paiement ─────────────────────────────────────
     Il vient de partir, il est encore devant son téléphone.
     Arme : miroir d'identité (il se reconnaît dans la première phrase) +
     mécanisme en une ligne + risque levé deux fois + une porte pour répondre.
     Pas de pitié : « tu y étais presque » félicitait l'abandon. */
  1: {
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
    destination: 'paiement',
  },

  /* ── 2 · J+1, 18 h · vers WhatsApp ──────────────────────────────────────
     ⚠️ ON NE REDEMANDE PAS SA CARTE. Il l'a déjà refusée une fois. Redemander
     la même chose au même endroit, c'est apprendre à quelqu'un à ignorer nos
     mails. On change de canal et de niveau d'engagement : écrire un message
     coûte moins qu'entrer une carte.
     Arme : réciprocité (on donne une réponse avant de demander quoi que ce
     soit) + seuil d'effort au plus bas (§3.13 : moins de 60 secondes). */
  2: {
    sujet: "Une question t'a arrêté hier ?",
    titre: "Une question t'a arrêté hier ?",
    corps:
      "Hier tu as commencé, et tu n'es pas allé au bout. " +
      "La plupart du temps ce n'est pas le prix — c'est une question qu'on n'a pas envie de taper dans un formulaire. " +
      'Alors pose-la à Ajnaya directement, sur WhatsApp. ' +
      "Tu écris, elle répond. Pas de rendez-vous, pas de carte à sortir. " +
      "Ce qu'elle fait vraiment, ce que ça change sur une journée, pourquoi ça coûte ce que ça coûte : demande-lui.",
    bouton: 'Poser ma question sur WhatsApp',
    destination: 'whatsapp',
  },

  /* ── 3 · J+7 · vers le paiement · LE DERNIER ────────────────────────────
     ⚠️ CELUI-CI DOIT FAIRE MAL, ET CHANDLER L'A DEMANDÉ AINSI. La difficulté
     n'est pas de frapper fort — c'est de frapper fort SANS reprocher et SANS
     mentir.
     · Pas de reproche : la douleur vient de la SITUATION (décider sans savoir),
       jamais de lui. « Tu paies pour un service dont la moitié dort » était un
       reproche, il braquait.
     · Pas de foule inventée : aucun « ils sont déjà nombreux ». On décrit un
       mécanisme vrai — l'information change le placement, pas le nombre
       d'heures — et ce mécanisme se vérifie tout seul.
     · L'arme est celle que Schwartz réserve à la fin : la vérité qu'il ÉVITE
       de regarder. Elle ne se dit qu'une fois la confiance prise, donc au
       septième jour, dans le dernier message. Jamais au premier.
     · Et la fin le libère : « on te laisse ». Une porte qu'on ferme
       proprement se rouvre ; une porte qu'on bloque du pied, jamais. */
  3: {
    sujet: 'Dans un an, tu seras exactement là où tu es',
    titre: 'Dans un an, tu seras exactement là où tu es',
    corps:
      'Une semaine a passé. ' +
      'Tu as roulé, tu as choisi tes zones au feeling, tu as fini fatigué. ' +
      "Comme la semaine d'avant. Comme celle qui arrive. " +
      "Le vrai coût de ce métier, ce n'est pas la commission — celle-là, au moins, tu la vois. " +
      "C'est ce que tu ne sauras jamais : ce que l'autre zone aurait donné, à la même heure, pendant que tu attendais. " +
      "Ça ne se voit pas dans la journée. Ça se paie en fin de mois, sans que personne ne te dise pourquoi. " +
      "Un chauffeur qui sait où la demande monte ne roule pas plus longtemps. Il roule mieux placé. " +
      "C'est toute la différence, et elle reste invisible tant qu'on ne l'a pas mesurée sur ses propres journées. " +
      "Trois jours pour la mesurer sur les tiennes. 0 € aujourd'hui, un clic pour arrêter. " +
      "C'est le dernier message que tu reçois de nous. Ensuite on te laisse.",
    bouton: 'Arrêter de deviner',
    destination: 'paiement',
  },
}

/**
 * FOREAS — REGISTRE DE CONSENTEMENT DES TÉMOIGNAGES.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI CE FICHIER EXISTE
 *
 * Le 14/08/2026, la campagne de vérité a trouvé huit témoignages chiffrés
 * attribués à des personnes nommées, dont la table `pieuvre_closer_testimonials`
 * ne contenait aucune trace. Pire : deux d'entre eux concernaient des chauffeurs
 * RÉELLEMENT filmés, à visage découvert, à qui le site faisait dire des phrases
 * qu'ils n'avaient pas prononcées — et parfois depuis une ville où ils n'habitent
 * pas. La parole d'un chauffeur avait été retouchée pour mieux vendre.
 *
 * Retirer ces phrases était nécessaire. Ça ne suffit pas : rien n'empêchait de
 * recommencer. Ce fichier est la barrière.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LA RÈGLE, EN UNE PHRASE
 *
 *   Une parole attribuée à quelqu'un ne s'affiche que si CETTE PERSONNE a validé
 *   CETTE phrase-là. Pas « le témoignage » en général : la phrase exacte.
 *
 * Conséquences, toutes voulues :
 *  · Modifier une citation déjà validée INVALIDE l'accord. Un accord porte sur
 *    des mots, pas sur une intention. On redemande.
 *  · Une révocation retire immédiatement la publication. Sans discussion.
 *  · Aucun statut ne devient `approuve` tout seul. Il n'existe aucun chemin de
 *    code qui accorde un consentement — seulement un humain qui édite ce fichier
 *    après avoir obtenu un accord écrit.
 *  · Un chiffre dit par un chauffeur reste SA parole. « +30 % » est un
 *    témoignage individuel, jamais une performance moyenne de FOREAS.
 *
 * ⚠️ Ce registre GARDE l'affichage (cf. `citationPubliable`). Il ne suffit pas de
 * le remplir : c'est lui qui décide ce qui sort à l'écran.
 */

export type StatutConsentement = 'en_attente' | 'approuve' | 'refuse' | 'revoque'

export interface Consentement {
  /** Identifiant du témoignage, aligné sur `testimonials.data.ts`. */
  id: string
  /** Comment la personne est nommée à l'écran. */
  personne: string
  /** Ce qui est publié : vidéo, citation écrite, ou les deux. */
  media: 'video' | 'citation' | 'video+citation'
  /**
   * La phrase EXACTE autorisée, au caractère près.
   * C'est elle qui fait foi : si le texte affiché diffère, rien ne s'affiche.
   */
  citationAutorisee: string
  /** Le chiffre autorisé, s'il y en a un. Reste la parole de la personne. */
  chiffreAutorise: string | null
  /** La ville telle qu'elle accepte qu'on l'écrive. */
  villeAffichee: string | null
  /** Où cette parole peut apparaître. */
  portee: ReadonlyArray<'site' | 'publicite' | 'reseaux'>
  statut: StatutConsentement
  dateDemande: string | null
  dateAccord: string | null
  /** Comment l'accord a été obtenu — jamais un contenu personnel, une référence. */
  preuve: string | null
}

/**
 * LE REGISTRE.
 *
 * Les six chauffeurs ci-dessous ont été RÉELLEMENT filmés : les vidéos existent,
 * elles sont hébergées, ce sont eux. Ce qui manque est l'accord ÉCRIT sur la
 * phrase exacte à publier. Tant qu'il manque, rien de nominatif ne sort.
 *
 * Obtenir ces accords ne se code pas : c'est un message à envoyer, et il ne peut
 * l'être que par quelqu'un qui les connaît. Voir le rapport de session.
 */
export const REGISTRE_CONSENTEMENTS: readonly Consentement[] = [
  {
    id: 'haitham',
    personne: 'Haitham B.',
    media: 'video+citation',
    citationAutorisee:
      "Foreas m'aide à me concentrer à 100 % sur mon boulot. Quand on a besoin de quoi que ce soit, on a une réponse instantanément.",
    chiffreAutorise: null,
    villeAffichee: 'Paris',
    portee: ['site'],
    statut: 'en_attente',
    dateDemande: null,
    dateAccord: null,
    preuve: null,
  },
  {
    id: 'binate',
    personne: 'Binate A.',
    media: 'video+citation',
    citationAutorisee:
      "Mes revenus sont montés de 30 %. Je ne travaille plus des heures infinies comme dans le temps. Travailler moins pour avoir plus, c'est ça la différence.",
    // Son chiffre, dit par lui face caméra. Il reste SA parole : on ne le
    // transforme jamais en « les chauffeurs FOREAS gagnent +30 % ».
    chiffreAutorise: '+30 % de revenus',
    villeAffichee: 'Marne-la-Vallée',
    portee: ['site'],
    statut: 'en_attente',
    dateDemande: null,
    dateAccord: null,
    preuve: null,
  },
  {
    id: 'zephy',
    personne: 'Zephy K.',
    media: 'video+citation',
    citationAutorisee: '',
    chiffreAutorise: null,
    villeAffichee: null,
    portee: ['site'],
    statut: 'en_attente',
    dateDemande: null,
    dateAccord: null,
    preuve: null,
  },
  {
    id: 'dragan',
    personne: 'Dragan P.',
    media: 'video+citation',
    citationAutorisee:
      "Plus de deux ans avec FOREAS, aucun souci. Tout se passe pour le mieux. J'y suis, j'y reste.",
    chiffreAutorise: null,
    villeAffichee: 'Paris',
    portee: ['site'],
    statut: 'en_attente',
    dateDemande: null,
    dateAccord: null,
    preuve: null,
  },
  {
    id: 'hadietou',
    personne: 'Hadietou',
    media: 'video+citation',
    citationAutorisee: '',
    chiffreAutorise: null,
    villeAffichee: null,
    portee: ['site'],
    statut: 'en_attente',
    dateDemande: null,
    dateAccord: null,
    preuve: null,
  },
  {
    id: 'nikolic',
    personne: 'Nikolic N.',
    media: 'video+citation',
    citationAutorisee: '',
    chiffreAutorise: null,
    villeAffichee: null,
    portee: ['site'],
    statut: 'en_attente',
    dateDemande: null,
    dateAccord: null,
    preuve: null,
  },
] as const

/** Normalise avant comparaison : espaces et apostrophes ne font pas un accord différent. */
function normaliser(texte: string): string {
  return texte
    .replace(/[’‘]/g, "'")
    .replace(/[«»"]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

/**
 * Cette citation peut-elle être publiée, telle quelle, au nom de cette personne ?
 *
 * Répond `false` par défaut. Un consentement absent, en attente, refusé ou
 * révoqué donne `false`. Une citation qui a DÉRIVÉ du texte validé donne `false`
 * aussi — c'est le point qui compte : un accord porte sur des mots précis, et
 * réécrire « aucun souci » en « aucun souci de paiement » n'est pas une
 * reformulation, c'est une autre affirmation, sur un autre sujet.
 */
/**
 * Quatre verdicts possibles pour une citation sur le point de s'afficher.
 *
 * Séparer ces cas, plutôt que de renvoyer oui/non, permet de distinguer ce qui
 * est GRAVE de ce qui est seulement EN ATTENTE :
 *  · `alteree`      — la phrase affichée ne correspond pas au verbatim enregistré.
 *                     C'est le cas grave, celui du 14/08. Elle ne doit jamais sortir.
 *  · `conforme`     — mot pour mot le verbatim. Reste soumise au statut d'accord
 *                     pour le régime strict, mais rien n'a été déformé.
 *  · `sans_verbatim`— personne n'a encore transcrit ce que dit la vidéo. On ne peut
 *                     donc RIEN vérifier : à signaler, pas à faire semblant.
 *  · `inconnue`     — cette personne n'est pas au registre du tout.
 */
export type VerdictCitation = 'conforme' | 'alteree' | 'sans_verbatim' | 'inconnue'

/**
 * Compare une citation affichée au verbatim enregistré, SANS regarder le statut
 * d'accord. Réutilise `normaliser` — la règle de comparaison n'existe qu'ici.
 */
export function verdictCitation(id: string, citationAffichee: string): VerdictCitation {
  const c = REGISTRE_CONSENTEMENTS.find((x) => x.id === id)
  if (!c) return 'inconnue'
  if (!c.citationAutorisee) return 'sans_verbatim'
  return normaliser(c.citationAutorisee) === normaliser(citationAffichee) ? 'conforme' : 'alteree'
}

export function citationPubliable(id: string, citationAffichee: string): boolean {
  const c = REGISTRE_CONSENTEMENTS.find((x) => x.id === id)
  if (!c) return false
  if (c.statut !== 'approuve') return false
  if (!c.citationAutorisee) return false
  return normaliser(c.citationAutorisee) === normaliser(citationAffichee)
}

/** Le chiffre de cette personne peut-il être affiché ? */
export function chiffrePubliable(id: string, chiffreAffiche: string): boolean {
  const c = REGISTRE_CONSENTEMENTS.find((x) => x.id === id)
  if (!c || c.statut !== 'approuve' || !c.chiffreAutorise) return false
  return normaliser(c.chiffreAutorise) === normaliser(chiffreAffiche)
}

/** Les témoignages actuellement publiables. Vide tant qu'aucun accord n'est obtenu. */
export function consentementsApprouves(): readonly Consentement[] {
  return REGISTRE_CONSENTEMENTS.filter((c) => c.statut === 'approuve')
}

/** Ce qu'il reste à obtenir — sert au rapport, jamais à l'affichage. */
export function consentementsManquants(): readonly Consentement[] {
  return REGISTRE_CONSENTEMENTS.filter((c) => c.statut !== 'approuve')
}

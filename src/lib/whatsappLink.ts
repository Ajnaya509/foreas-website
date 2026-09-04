/**
 * WhatsApp Deep Link Helper — FOREAS
 *
 * Construction des liens wa.me avec messages pré-remplis.
 * Chaque section de la page /ou-ca-paie a son propre template
 * → permet à la Pieuvre (workflow N8N wa_inbound_router) de router
 *   vers le bon tentacule (CLOSER / GUIDE / etc.) selon le pattern.
 *
 * Voir : FOREAS-SHARED/HOME_HERO_SEARCH_v1_SPEC.md §6.1 et §6.2
 */

const FOREAS_WA_NUMBER = '33780732216' // FOREAS WABA Production

export type WhatsAppSection =
  | 'hero_zone' // Hero · résultat search par zone
  | 'pain' // Section 2 · douleur (calcul commission Uber)
  | 'mechanism' // Section 3 · mécanisme Ajnaya
  | 'social_proof' // Section 4 · 12 autres cas
  | 'plan' // Section 5 · plan en 3 étapes
  | 'cap' // Section 6 · CAP partenaires
  | 'final' // Section 7 · CTA final
  | 'experience_phone' // Page /experience · bascule depuis le téléphone vivant
  | 'panier_abandonne' // Mail J+1 · il a saisi son e-mail sans payer
  | 'mobile_fonction' // Accueil mobile · un lien par fonctionnalité (voir `fonction`)
  | 'avant_paiement' // Accueil mobile · la porte de sortie DE la section prix

/**
 * Les onze fonctions que la page d'accueil mobile peut désigner.
 *
 * ⚠️ LISTE FERMÉE, ET ELLE EXISTE POUR UNE RAISON PRÉCISE.
 * Sans elle, les onze liens du module court produisaient TOUS le même texte —
 * celui de `final`, « Je démarre avec FOREAS. 0€. Je teste. » Le chauffeur qui
 * appuyait sur « Demande-lui ce qui a changé » annonçait donc qu'il démarrait,
 * et le routeur de la Pieuvre, qui matche sur le texte, l'envoyait au CLOSER
 * au lieu du GUIDE. Onze intentions différentes, une seule phrase : ni le
 * chauffeur ni la mesure ne pouvaient s'y retrouver.
 */
export type FonctionMobile =
  | 'site' // Ta Vitrine · la page perso et l'autocollant
  | 'compta' // Le Carnet · les justificatifs et l'export du mois
  | 'objectif' // La Barre · le chiffre du jour
  | 'zones' // La Vague · la carte de la demande
  | 'fil' // Le Fil · ce que les chauffeurs se transmettent
  | 'ajnaya' // Ajnaya · lui parler directement
  | 'regles' // Le Guetteur · les règles du métier qui changent
  | 'reglage' // Ton Seuil · le €/h en dessous duquel c'est non
  | 'navigation' // Y Aller · l'ouverture directe dans Waze
  | 'serie' // Ta Série · les jours d'affilée
  | 'parrainage' // Le Collègue · le lien de parrainage

export interface BuildWAOptions {
  section: WhatsAppSection
  zone?: string
  slot?: string
  amount?: number
  /** Utilisé par la seule section `mobile_fonction`. Ignoré partout ailleurs. */
  fonction?: FonctionMobile
  /**
   * LA QUESTION QU'IL A DÉJÀ POSÉE SUR LE SITE.
   *
   * ⚠️ SANS ELLE, AJNAYA REDEMANDE TOUT ET LE CHAUFFEUR RÉPÈTE — c'est là
   * qu'on les perd (fil PIEUVRE, brief du 04/09). Il a tapé « Roissy », il a
   * lu une réponse, il appuie sur WhatsApp : si le message n'emporte que la
   * zone, la conversation recommence à zéro et il a l'impression de parler à
   * quelqu'un qui n'écoutait pas.
   *
   * Elle part EN CLAIR dans le message, pas en jeton. Un jeton obligerait
   * Ajnaya à lire une table avant de répondre — donc une panne de base
   * deviendrait une conversation vide. Le texte, lui, arrive toujours, et le
   * chauffeur voit ce qu'il envoie : il peut le corriger avant d'appuyer.
   */
  question?: string
}

/**
 * Construit l'URL wa.me avec message pré-rempli URL-encoded.
 *
 * @example
 * buildWAUrl({ section: 'hero_zone', zone: 'Aéroport CDG', slot: 'ce soir 18h-23h' })
 * → https://wa.me/33780732216?text=Salut%20Ajnaya%2C%20je%20suis%20sur%20la%20zone...
 */
export function buildWAUrl(opts: BuildWAOptions): string {
  const message = buildWAMessage(opts)
  const encoded = encodeURIComponent(message)
  return `https://wa.me/${FOREAS_WA_NUMBER}?text=${encoded}`
}

/**
 * Génère le message texte selon la section. Messages canoniques —
 * la Pieuvre matche dessus en regex pour router (voir SPEC §6.2).
 */
export function buildWAMessage(opts: BuildWAOptions): string {
  // Aucun identifiant technique ne part dans la bouche du chauffeur.
  // L'origine reste enregistrée côté serveur par `/wa`; WhatsApp prouve ensuite
  // son propre numéro. Un texte modifiable ne vaut jamais preuve d'identité.
  return buildWAMessageBase(opts)
}

function buildWAMessageBase(opts: BuildWAOptions): string {
  const { section, zone, slot, amount, fonction, question } = opts

  switch (section) {
    case 'hero_zone': {
      /* ⚠️ SA QUESTION D'ABORD, LA NÔTRE ENSUITE — et jamais les deux.
         Quand il a déjà écrit quelque chose sur le site, c'est CETTE
         phrase-là qui part : la reformuler à sa place, c'est le geste qui
         fait dire « on ne m'écoute pas » dès le premier message. */
      const sienne = (question ?? '').trim()
      if (zone && sienne) return `Salut Ajnaya. Je suis sur ${zone}. ${sienne}`
      if (sienne) return `Salut Ajnaya. ${sienne}`
      return zone
        ? `Salut Ajnaya, je suis sur la zone ${zone}. Tu peux me donner le tarif horaire exact ${slot ?? 'pour ce soir'} ?`
        : `Salut Ajnaya, je veux le tarif horaire exact sur ma zone.`
    }

    case 'pain':
      // ⚠️ 21/08/2026 — CE MESSAGE AFFIRMAIT UN NET QUE LA PAGE CONTREDISAIT.
      //
      // Il écrivait : « je touche environ ${Math.round(amount * 0.56)}€ net ».
      // Sur 25 € cela donnait 14 €. Or le bloc qui porte ce bouton affichait
      // 8,71 € au même instant, à quarante pixels de là — les deux sortent du
      // MÊME composant (ZonePainCalculator : le net à la ligne 31, le lien à
      // la ligne 52). Et l'écart grandissait avec le curseur : à 100 €, la
      // page annonçait 34,82 € et le message 56 €.
      //
      // Deux raisons de ne pas simplement « aligner les deux coefficients » :
      //
      // 1. CE MESSAGE PART AU NOM DU CHAUFFEUR. Il s'affiche dans SA
      //    conversation comme s'il l'avait écrit. On ne lui fait pas dire un
      //    chiffre — surtout pas un chiffre que notre propre page dément.
      //
      // 2. IL N'Y A PAS DE BON COEFFICIENT À METTRE ICI. FOREAS porte trois
      //    taux de commission Uber saisis à la main et jamais mesurés (0,45
      //    dans le calculateur, 0,25 dans pieuvre_platform_commissions, 0,75
      //    de part chauffeur dans coachInstant.ts). Choisir en aurait fait un
      //    quatrième, présenté comme une vérité.
      //
      // Donc : le message porte le brut que le chauffeur a lui-même réglé, et
      // POSE la question au lieu d'y répondre. C'est à Ajnaya de calculer, en
      // connaissant sa plateforme et son statut — pas à un lien de le deviner.
      return `Salut Ajnaya. Sur une course de ${amount ?? 25}€, il me reste quoi vraiment ? Et je gagnerais combien de plus avec FOREAS sur les mêmes courses ?`

    case 'mechanism':
      return `Salut Ajnaya, je veux la démo de 90 secondes.`

    case 'social_proof':
      // ⚠️ 21/08/2026 — CE MESSAGE PORTAIT LE PRÉNOM D'UNE VRAIE PERSONNE.
      //
      // Il part au nom du chauffeur, dans SA conversation. Le raisonnement posé
      // vingt lignes plus haut pour le message « douleur » vaut ici aussi : on ne
      // fait pas dire à quelqu'un le nom d'un tiers dont l'accord est en attente.
      // Corrigé sur un seul des deux cas le matin — le jumeau, encore.
      return `Salut Ajnaya, je veux voir d'autres cas de chauffeurs.`

    case 'plan':
      return `Salut Ajnaya. Je veux le brief de demain matin.`

    case 'cap':
      return `Salut Ajnaya, je pilote une flotte / un groupe. Je veux comprendre le programme CAP.`

    case 'final':
      return `Salut Ajnaya. Je démarre avec FOREAS. 0€. Je teste.`

    case 'experience_phone':
      return `Salut Ajnaya, je continue notre discussion du site — on en était où ?`

    case 'mobile_fonction':
      /* ⚠️ CE MESSAGE PART AU NOM DU CHAUFFEUR, DEPUIS UNE SECTION PRÉCISE.
         Il vient de lire UNE fonctionnalité et d'appuyer sur son lien. Le texte
         doit donc porter SA question, celle de cette section-là — pas une
         intention d'achat qu'il n'a pas encore formée. Aucune de ces phrases
         n'avance de chiffre : c'est à Ajnaya de répondre en connaissant son
         véhicule, sa ville et son statut. */
      switch (fonction) {
        case 'site':
          return `Salut Ajnaya. Je veux ma page à moi, pour que mes clients me reprennent en direct. Ça marche comment ?`
        case 'compta':
          return `Salut Ajnaya. Je veux voir à quoi ressemble l'export du mois pour mon comptable.`
        case 'objectif':
          return `Salut Ajnaya. Je veux poser mon objectif de la journée. Comment tu le suis ?`
        case 'zones':
          return `Salut Ajnaya. Explique-moi la carte des zones : elle se remplit avec quoi ?`
        case 'fil':
          return `Salut Ajnaya. C'est quoi le fil entre chauffeurs, et qu'est-ce que j'y trouve ?`
        case 'ajnaya':
          return `Salut Ajnaya. Je veux juste te parler et voir ce que tu sais faire.`
        case 'regles':
          return `Salut Ajnaya. Préviens-moi quand une règle du métier change. Ça marche comment ?`
        case 'reglage':
          return `Salut Ajnaya. Je veux régler mon seuil en euros par heure. Je le choisis comment ?`
        case 'navigation':
          return `Salut Ajnaya. Je veux partir sur une course sans retaper l'adresse. Explique-moi.`
        case 'serie':
          return `Salut Ajnaya. C'est quoi la série de jours, et à quoi elle me sert ?`
        case 'parrainage':
          return `Salut Ajnaya. Je veux mon lien de parrainage et savoir ce que ça me rapporte.`
        default:
          /* `f` absent ou inconnu : on reste sur une question ouverte plutôt que
             de faire dire au chauffeur une intention qu'il n'a pas eue. */
          return `Salut Ajnaya. J'ai une question sur une fonction de FOREAS.`
      }

    case 'avant_paiement':
      /* ⚠️ C'EST LA PORTE DE SORTIE DE LA SECTION PRIX : elle s'adresse
         précisément à celui qui n'est PAS prêt. Elle portait `final`, donc
         « Je démarre avec FOREAS. 0€. Je teste. » — le chauffeur qui refusait
         de s'engager annonçait lui-même qu'il s'engageait, et Ajnaya ouvrait
         une clôture sur quelqu'un qui voulait poser une question. */
      return `Salut Ajnaya. J'ai une question avant de lancer les 3 jours.`

    case 'panier_abandonne':
      /* ⚠️ CE MESSAGE PART AU NOM DU CHAUFFEUR, DANS SA CONVERSATION.
         Il doit donc dire ce que LUI veut, pas ce que nous savons de lui.
         « J'ai commencé et je me suis arrêté » est un fait qu'il assume ;
         « tu as abandonné ton panier » serait notre vocabulaire, pas le sien —
         et le mettre dans sa bouche le ferait sonner faux dès le premier mot.
         Le clic et son origine restent enregistrés côté serveur par `/wa`.
         Ils ne sont jamais recopiés dans le message du chauffeur. */
      return `Salut Ajnaya. J'ai commencé sur le site et je me suis arrêté. J'ai deux questions avant de tester.`

    default:
      return `Salut Ajnaya.`
  }
}

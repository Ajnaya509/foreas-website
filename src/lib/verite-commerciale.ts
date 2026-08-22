/**
 * FOREAS — VÉRITÉ COMMERCIALE. Ce que le site a le DROIT d'affirmer.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI CE FICHIER EXISTE
 *
 * Recensement du 14/08/2026 : 286 promesses affichées sur le site ont été
 * confrontées une par une à la base de production et au code déployé, puis
 * chaque accusation a été soumise à une contre-expertise chargée de la DÉMOLIR.
 * 113 accusations ont été réfutées et abandonnées. **45 ont survécu**, dont 41
 * graves — c'est-à-dire : affichées en production, sur des pages qui encaissent
 * ou qui vendent, et contredites par une mesure.
 *
 * Le motif était toujours le même : un chiffre écrit en dur dans un composant,
 * plausible, jamais relié à rien. Personne ne ment volontairement ; c'est le fait
 * qu'un chiffre puisse vivre dans un fichier .tsx sans source qui produit le
 * mensonge, mécaniquement, à chaque nouvelle page.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LA RÈGLE
 *
 *   Un chiffre affiché au public vient d'ici, ou il ne s'affiche pas.
 *
 * Chaque valeur porte sa MESURE (la requête qui la produit) et sa DATE. Si tu ne
 * peux pas écrire la requête, tu n'as pas le droit d'écrire le chiffre.
 *
 * ⚠️ Ces valeurs sont un INSTANTANÉ daté, pas un flux temps réel. Ne jamais les
 * présenter comme « en direct » / « ce soir » / « en ce moment ». Pour du direct,
 * il faut un vrai appel (ex. `/api/live-driver-count`), pas cette constante.
 *
 * Distinct de `src/lib/offre.ts`, qui porte les MONTANTS facturés. Ici : les
 * AFFIRMATIONS. Les deux sont des sources uniques, sur deux sujets différents.
 */

/** Date de la dernière mesure. Toute valeur ci-dessous a été comptée ce jour-là. */
export const MESURE_DU = '2026-08-14'

// ─────────────────────────────────────────────────────────────────────────────
// 1. LA COMMUNAUTÉ — ce qu'on peut dire du nombre de chauffeurs
// ─────────────────────────────────────────────────────────────────────────────

/**
 * `select count(*) from drivers` → 30
 * `select count(*) filter (where is_active) from drivers` → 9
 * `select count(*) filter (where last_active > now()-interval '24 hours')` → **0**
 * `select count(*) from subscriptions where status='active'` → 4
 */
export const COMMUNAUTE = {
  // ─────────────────────────────────────────────────────────────────────────
  // ⚠️ 21/08/2026, 20h50 UTC — « abonnementsActifs: 4 » ÉTAIT FAUX, ET IL A ÉTÉ
  // RÉPÉTÉ DE RAPPORT EN RAPPORT PENDANT DES SEMAINES.
  //
  // La table `subscriptions` compte bien 4 lignes `status='active'` à 39,99 €.
  // Mais AUCUNE n'est un abonnement Stripe réel :
  //   · 3 n'ont NI `stripe_subscription_id` NI `stripe_customer_id` ;
  //   · la 4ᵉ porte `sub_test_forea…` — un identifiant de test ;
  //   · 0 ligne sur 4 a une référence de la forme `sub_1…` (la vraie forme) ;
  //   · les 3 dernières ont été créées le MÊME JOUR, avec une fin de période en
  //     2028 — deux ans, ce qui n'existe dans aucune formule vendue.
  //
  // Ce sont des lignes de démonstration. « Statut actif » décrivait leur
  // colonne, pas un client.
  //
  // ⚠️ CE QUI REND CETTE ERREUR SI DURABLE : la ligne était VRAIE au sens de la
  // requête (`count(*) where status='active'` → 4) et FAUSSE au sens du monde.
  // Personne n'avait regardé la COLONNE D'À CÔTÉ. Un compteur juste sur une
  // table peuplée de démonstrations compte des démonstrations.
  //
  // CE QUI EST RÉEL, LUI : `subscription_events` porte 5 événements Stripe
  // authentiques (forme `evt_1…`) — UNE activation le 28/07, puis QUATRE
  // `payment_failed` d'affilée les 31/07, 01/08, 02/08 et 03/08. Une personne a
  // vraiment essayé de payer, et sa carte a été refusée quatre fois.
  //
  // Le vrai nombre d'abonnements payants aujourd'hui est donc ZÉRO, et
  // FOREAS a déjà perdu une vente faute d'avoir vu ces quatre refus.
  // ─────────────────────────────────────────────────────────────────────────
  /** 30 lignes dans `drivers`, dont 2 adresses de test. Le chiffre publiable est 28. */
  chauffeursInscrits: 28,
  chauffeursMarquesActifs: 9,
  chauffeursActifs24h: 0,
  /** Abonnements Stripe RÉELS : 0 sur 4 lignes ont une référence `sub_1…`. */
  abonnementsActifs: 0,
  /** Témoignages filmés, consentis, vérifiables (src/components/zone/testimonials.data.ts). */
  temoignagesVideoReels: 6,
} as const

/**
 * ❌ INTERDIT — mesuré faux en production le 14/08/2026 :
 *   « 147 actifs · Paris », « 147 chauffeurs actifs ce soir », « 26 chauffeurs »,
 *   « 8 chauffeurs sur 10 choisissent Pro » (4 abonnements au total, aucun plan
 *   « Pro » n'existe), « le choix de la majorité des chauffeurs », « le plus
 *   populaire » (aucun agrégat ne l'alimente : drapeau littéral dans le code).
 *
 * ✅ AUTORISÉ, et plus fort parce que vrai : dire qu'on démarre.
 */
export const COMMUNAUTE_PHRASES = {
  tailleHonnete: `${COMMUNAUTE.chauffeursInscrits} chauffeurs inscrits`,
  preuveHonnete: `${COMMUNAUTE.temoignagesVideoReels} chauffeurs filmés, à visage découvert`,
  debutAssume: 'On démarre. Tu ne rejoins pas une foule, tu prends de l’avance.',
} as const

// ─────────────────────────────────────────────────────────────────────────────
// 2. LES PLATEFORMES — le chiffre le plus répété, et le plus faux
// ─────────────────────────────────────────────────────────────────────────────

/**
 * `select distinct platform from rides` → Bolt, Heetch, Private, Uber.
 * « Private » = course directe du chauffeur, ce n'est pas une plateforme tierce.
 * Donc **3 plateformes réelles**, jamais 7.
 *
 * Et « en direct » est une seconde affirmation, distincte : la table qui porterait
 * une lecture continue (`driver_ride_features`) est **VIDE (0 ligne)**.
 */
const PLATEFORMES_REELLES = ['Uber', 'Bolt', 'Heetch'] as const

export const PLATEFORMES = {
  reellementVues: PLATEFORMES_REELLES,
  // Valeur simple, pas un accesseur : un `get` dans un objet `as const` se
  // comporte différemment selon le compilateur et le minifieur, et un chiffre
  // affiché au public ne doit dépendre d'aucune subtilité de transpilation.
  nombre: PLATEFORMES_REELLES.length,
  /** Faux au 14/08/2026 : aucune lecture continue ne tourne. */
  lectureEnDirect: false,
} as const

/**
 * ❌ INTERDIT : « Ajnaya lit 7 plateformes en direct », « 7 apps en 1 écran »,
 *    « 7 plateformes », « surge multi-plateformes en temps réel »
 *    (`extracted_surge_data` → 0 ligne, `pieuvre_surge_predictions` → 0 ligne).
 *
 * ⚠️ Nommer les 3 plateformes rend la promesse VÉRIFIABLE par n'importe qui.
 *    C'est voulu : une promesse vérifiable et tenue vaut mieux qu'un chiffre rond
 *    et faux. Ne réintroduis « en direct » que le jour où la table se remplit.
 */
export const PLATEFORMES_PHRASES = {
  liste: PLATEFORMES.reellementVues.join(', '),
  honnete: `Tes courses ${PLATEFORMES.reellementVues.join(', ')} au même endroit`,
} as const

// ─────────────────────────────────────────────────────────────────────────────
// 3. LE PARRAINAGE — trois montants différents circulaient sur quatre pages
// ─────────────────────────────────────────────────────────────────────────────

/**
 * `select tier, commission_eur, discount_pct from referral_program_tiers`
 *   → 1 : 25 € · −10 %   |   2 : 35 € · −15 %   |   3 : 50 € · −18 %
 *
 * ⚠️ CE SONT DES PALIERS DE VOLUME, PAS DES NIVEAUX DE PYRAMIDE. Le site les
 * présentait comme une cascade « toi en haut, tes recrues en dessous » — c'est
 * une lecture inversée de la table. Il n'existe aucun reversement sur le filleul
 * de ton filleul.
 *
 * `select count(*) from referral_commissions` → **0**. Aucune commission n'a
 * jamais été versée à qui que ce soit.
 */
export const PARRAINAGE = {
  paliers: [
    { palier: 1, commissionEur: 25, remisePct: 10 },
    { palier: 2, commissionEur: 35, remisePct: 15 },
    { palier: 3, commissionEur: 50, remisePct: 18 },
  ],
  commissionsDejaVersees: 0,
  /** Aucun niveau 2 ni 3 au sens « filleul de filleul ». */
  cascadeMultiNiveaux: false,
} as const

/**
 * ❌ INTERDIT : « cascade 10 € / 4 € / 2 € à vie sur 3 niveaux »,
 *    « 25 €/mois sur lui (N1), 8 € (N2), 2 € (N3) », « parrainage 10 €/filleul »,
 *    « −20 % à vie » (aucun palier à 20 % n'existe), « virement automatique »
 *    (aucun virement n'a jamais eu lieu).
 */

// ─────────────────────────────────────────────────────────────────────────────
// 4. L'ESSAI ET LE PAIEMENT — ce que le chauffeur vit vraiment
// ─────────────────────────────────────────────────────────────────────────────

/**
 * `src/app/api/checkout/route.ts` : `subscription_data.trial_end` = 3 jours,
 * ET `payment_method_collection: 'always'`.
 *
 * Conséquence exacte, à écrire telle quelle : la carte EST enregistrée, et un
 * abonnement Stripe EST créé dès l'inscription. Dire « tu fermes l'app, il n'y a
 * rien à annuler » est faux — il y a un abonnement, et il faut l'annuler.
 */
export const ESSAI = {
  jours: 3,
  carteDemandee: true,
  debiteImmediatement: 0,
  abonnementCreeDesLInscription: true,
  annulationEnUnClic: true,
} as const

/**
 * ❌ INTERDIT : « 7 jours » (l'essai dure 3 jours), « sans carte »,
 *    « il n'y a rien à annuler », « ESSAI ACTIVÉ » sur un parcours à paiement
 *    immédiat, « cycle hebdomadaire » pour un abonnement mensuel.
 */
export const ESSAI_PHRASES = {
  titre: `${ESSAI.jours} jours d’essai · 0 € débité`,
  franc: `Carte demandée, 0 € prélevé pendant ${ESSAI.jours} jours. Tu annules en un clic avant la fin, tu n’es pas débité.`,
} as const

// ─────────────────────────────────────────────────────────────────────────────
// 5. CE QUI N'EXISTE PAS ENCORE — à ne jamais écrire au présent
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mesuré le 14/08/2026, tables et routes à l'appui :
 *  - `partner_referrals` → 0 ligne · `partner_applications` → 0 ligne
 *  - aucune table de scoring qualité de course
 *  - aucune route API partenaire hors `/api/partner/apply`, aucune page de
 *    documentation, aucun webhook sortant
 *  - aucune activité au Maroc (aucune zone, aucun tarif, aucun contenu)
 *  - aucune colonne « satisfaction » nulle part
 *  - aucun co-branding dans l'app (le white-label existant est une landing web)
 */
export const PAS_ENCORE = [
  'réseau de partenaires actif',
  'scoring qualité des courses',
  'API REST publique + webhooks',
  'documentation développeur',
  'activité au Maroc',
  'métrique de satisfaction',
  'co-branding dans l’application',
] as const

/**
 * Règle de rédaction pour tout ce qui est ci-dessus : conditionnel ou futur daté,
 * jamais le présent de l'indicatif. « FOREAS connecte les hôtels à un réseau… »
 * affirme un état actuel qui n'existe pas. « On construit ce réseau — les
 * premiers partenaires arrivent » est vrai, et se défend devant la DGCCRF.
 */

// ─────────────────────────────────────────────────────────────────────────────
// 6. GARDE-FOU LÉGAL — non négociable
// ─────────────────────────────────────────────────────────────────────────────

/**
 * FOREAS est un COPILOTE de gestion, jamais un expert-comptable
 * (Ordonnance du 19 sept. 1945, art. 20).
 *
 * Et l'URSSAF **SE CALCULE**. Elle ne « se met pas de côté automatiquement » :
 * aucune table de portefeuille, aucun compte de cantonnement, aucun mouvement
 * d'argent n'existe. Promettre une mise de côté, c'est promettre un service
 * financier que FOREAS ne rend pas — et c'est plus grave qu'un chiffre faux.
 *
 * ❌ INTERDIT : « Tirelire URSSAF », « mise de côté automatique »,
 *    « on fait ta compta », « Compta IA ».
 * ✅ AUTORISÉ : « copilote compta », « ce que tu devras, calculé au fil des
 *    courses », « on te met en relation avec un expert-comptable partenaire ».
 */
export const COMPTA_PHRASES = {
  titre: 'Copilote compta + URSSAF',
  sousTitre: 'ce que tu devras, calculé au fil des courses',
} as const

/** Le mot « IA » est banni du site : Ajnaya a un nom, on l'emploie. */
export const MOT_INTERDIT_IA = 'IA' as const

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * LA GARANTIE 30 JOURS — UNE SEULE SOURCE, ET ELLE SAIT CE QU'ELLE NE SAIT PAS.
 *
 * ⚠️ 21/08/2026 — CE N'EST PAS UNE PROMESSE INVENTÉE, ET CE N'EST PAS NON PLUS
 * UN MÉCANISME PROUVÉ. Les deux à la fois, et c'est justement le problème.
 *
 * CE QUI EXISTE, vérifié :
 *  · une clause écrite dans les CGU (`/cgu`) : remboursement intégral de la
 *    première période, sans justification, dans les 30 jours suivant le premier
 *    paiement, sur simple message à l'adresse de contact ;
 *  · un canal de demande qui fonctionne — le formulaire de contact a été réparé
 *    le 21/08 et l'envoi est prouvé.
 *
 * CE QUI MANQUE, et qui empêche d'appeler ça un mécanisme :
 *  · AUCUN DÉLAI de traitement annoncé. « Sans discuter » ne dit pas « sous
 *    combien de jours » ;
 *  · AUCUN RESPONSABLE nommé ;
 *  · AUCUNE TRACE qu'un remboursement ait jamais été traité. Aucun chemin de
 *    remboursement dans le code des trois dépôts, aucune ligne en base.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QU'ON FAIT, ET POURQUOI PAS AUTRE CHOSE
 *
 * ON ARRÊTE DE L'AFFICHER. Une promesse de remboursement qu'on ne peut pas
 * prouver honorer engage plus qu'elle ne rassure : le jour où quelqu'un la
 * réclame et attend, c'est la parole de FOREAS qui tombe, pas une ligne de
 * texte.
 *
 * ON NE LA RETIRE PAS DES CGU. Le contrat est un DROIT du client. Le retirer
 * silencieusement retirerait ce droit à quelqu'un qui a peut-être payé en
 * comptant sur lui — ce serait pire que de ne pas l'avoir annoncé. Un abonné
 * qui la demande l'obtient : elle reste due.
 *
 * Autrement dit : on cesse de la VENDRE, on continue de la DEVOIR.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * COMMENT LA RALLUMER — un seul geste, ici, quand les trois manques sont comblés
 *
 * Passer `prouvee` à `true` la fait réapparaître partout d'un coup. C'est
 * volontaire : elle vivait sur SIX surfaces, chacune avec sa propre formulation.
 * Six endroits à rallumer à la main, c'est cinq occasions d'en oublier un.
 */
export const GARANTIE_30J = {
  /** Le droit existe-t-il au contrat ? Oui — voir /cgu. */
  auContrat: true,
  /**
   * Le mécanisme est-il prouvé ? NON, et tant que c'est non, aucune surface
   * commerciale ne l'annonce.
   *
   * ⏳ Pour passer à `true`, il faut les TROIS : un délai de traitement annoncé,
   * un responsable nommé, et au moins un remboursement réellement traité.
   */
  prouvee: false,
  /** Ce qui manque, nommé — pour que personne n'ait à le redécouvrir. */
  manquants: ['délai de traitement', 'responsable nommé', 'preuve d’un traitement réel'],
} as const

/** Une surface commerciale peut-elle annoncer la garantie ? */
export function garantieAffichable(): boolean {
  return GARANTIE_30J.prouvee
}

/**
 * LA REPRISE DE CONVERSATION SITE → WHATSAPP.
 *
 * ⚠️ MESURÉE LE 23/08/2026 EN PRODUCTION. ELLE N'A JAMAIS EU LIEU.
 *
 *   handoff_tokens, target_canal = 'whatsapp'
 *     émis               : 8      (du 21/04/2026 au 14/08/2026)
 *     consommés          : 0
 *     expirés sans usage : 8
 *
 *   pieuvre_conversations                    : 5 793
 *   conversations citant un de ces 8 billets : 0
 *   événements WhatsApp citant un billet     : 0
 *
 *   voie de repli, référence « (réf …) », depuis la v151 :
 *     29 conversations, 0 portant une référence
 *
 * Le site émet bien un billet. `claim-handoff` existe — mais sa documentation
 * dit « Called by the FOREAS Driver app » : c'est l'APP qui le réclame, pas
 * WhatsApp. Le premier message WhatsApp est un UUID brut que personne ne lit.
 *
 * ⚠️ CE QUE ÇA CHANGE POUR LES TEXTES DU SITE : aucune surface ne doit annoncer
 * que la conversation « reprend », « se souvient » ou « continue » sur WhatsApp.
 * Le BOUTON reste — c'est le chemin principal. Seule la promesse tombe.
 *
 * Rebasculer ce drapeau à `true` le jour où le flux entrant WhatsApp réclame
 * réellement le billet, et pas avant. Voir
 * `BRIEF_PIEUVRE_CONTINUITE_SITE_WHATSAPP_V1_2026-08-23.md`.
 */
export const REPRISE_WHATSAPP = {
  prouvee: false,
  mesureeLe: '2026-08-23',
  billetsEmis: 8,
  billetsConsommes: 0,
} as const

/** Une surface peut-elle annoncer que la conversation reprend sur WhatsApp ? */
export function repriseWhatsAppAffichable(): boolean {
  return REPRISE_WHATSAPP.prouvee
}

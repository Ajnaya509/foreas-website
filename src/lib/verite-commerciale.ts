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
  chauffeursInscrits: 30,
  chauffeursMarquesActifs: 9,
  chauffeursActifs24h: 0,
  abonnementsActifs: 4,
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
export const PLATEFORMES = {
  reellementVues: ['Uber', 'Bolt', 'Heetch'] as const,
  get nombre() {
    return PLATEFORMES.reellementVues.length
  },
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

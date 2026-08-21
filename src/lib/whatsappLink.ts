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

export interface BuildWAOptions {
  section: WhatsAppSection
  zone?: string
  slot?: string
  amount?: number
  /**
   * Code de raccordement modal ↔ WhatsApp (= session_id du modal home).
   * Ajouté discrètement en fin de message : "(réf hm-xxxx)".
   * La Pieuvre (wa_inbound_router) le lit en regex /réf ([\w-]+)/ pour
   * retrouver la zone + l'historique funnel de la session web du prospect.
   * Sans lui, le prospect arrive sur WhatsApp en parfait inconnu.
   */
  ref?: string
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
  const base = buildWAMessageBase(opts)
  // Code de raccordement discret en fin de message (lu par la Pieuvre en regex).
  return opts.ref ? `${base} (réf ${opts.ref})` : base
}

function buildWAMessageBase(opts: BuildWAOptions): string {
  const { section, zone, slot, amount } = opts

  switch (section) {
    case 'hero_zone':
      return zone
        ? `Salut Ajnaya, je suis sur la zone ${zone}. Tu peux me donner le tarif horaire exact ${slot ?? 'pour ce soir'} ?`
        : `Salut Ajnaya, je veux le tarif horaire exact sur ma zone.`

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
      return `Salut Ajnaya, je veux voir d'autres cas de chauffeurs comme Haitham.`

    case 'plan':
      return `Salut Ajnaya. Je veux le brief de demain matin.`

    case 'cap':
      return `Salut Ajnaya, je pilote une flotte / un groupe. Je veux comprendre le programme CAP.`

    case 'final':
      return `Salut Ajnaya. Je démarre avec FOREAS. 0€. Je teste.`

    case 'experience_phone':
      return `Salut Ajnaya, je continue notre discussion du site — on en était où ?`

    default:
      return `Salut Ajnaya.`
  }
}

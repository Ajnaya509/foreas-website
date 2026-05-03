/**
 * TESTIMONIALS DATA — FOREAS
 *
 * Source unique des 6 témoignages vidéo Mux.
 * Synchro avec : docs/testimonials/TESTIMONIALS.md
 *
 * Format URLs Mux :
 * - Stream HLS  : https://stream.mux.com/{playbackId}.m3u8
 * - Thumbnail   : https://image.mux.com/{playbackId}/thumbnail.jpg?time={posterTimeSec}
 * - GIF preview : https://image.mux.com/{playbackId}/animated.gif?width=320&start={s}&end={e}
 * - Storyboard  : https://image.mux.com/{playbackId}/storyboard.vtt
 *
 * NOTE : tous les playback_id sont policy=public (vérifié 03/05/2026).
 */

export interface Testimonial {
  /** Ordre d'affichage (1 = primary card) */
  order: number
  /** Mux Playback ID (public policy) */
  playbackId: string
  /** Mux Asset ID (admin reference, optionnel) */
  assetId: string
  /** Prénom + initiale (ou nom complet si profil pro) */
  name: string
  /** Ville d'opération + ancienneté affichées sous le prénom */
  context: string
  /** Profil pour briefing Ajnaya / segmentation */
  profile: string
  /** Quote courte affichée au-dessus de la vidéo (max 120 caractères) */
  quoteShort: string
  /** Badge gain visible coin haut droit de la card (max 22 chars) */
  gainBadge: string
  /** Détail temporel/contextuel sous les étoiles (max 30 chars) */
  detail: string
  /** Frame poster timestamp (sec) — 2 par défaut, à ajuster selon vidéo */
  posterTimeSec: number
  /** Range pour teaser muet loop (Big Domino background) — optionnel */
  teaserRange?: { startSec: number; endSec: number }
  /** Mood tags pour audience targeting + Ajnaya recommandation */
  moodTags: readonly string[]
  /** Émotion principale qui doit ressortir */
  keyEmotion: string
}

export const TESTIMONIALS: readonly Testimonial[] = [
  // ─── 1. HAITHAM — primary card + Big Domino loop background ─────────
  {
    order: 1,
    playbackId: '8nSxSV4hNxSuC8muZ02djVGZVFh3SgeybyCnfbAJ801r00',
    assetId: 'A01xv6vnjzy7W2cYNFJLXZu9g4mRUbvdqYKyf9CulHRU',
    name: 'Haitham B.',
    context: 'Paris · 7 ans VTC',
    profile: 'Chauffeur indépendant maghrébin · pivot identification persona',
    quoteShort:
      "« Foreas m'aide à me concentrer à 100 % sur mon boulot. Quand on a besoin de quoi que ce soit, on a une réponse instantanément. »",
    gainBadge: 'Liberté + lien',
    detail: '7 ans · Paris',
    posterTimeSec: 3,
    teaserRange: { startSec: 5, endSec: 18 },
    moodTags: ['chaleur', 'liberté', 'lien humain'],
    keyEmotion: 'Reconnaissance — il se sent moins seul depuis FOREAS',
  },

  // ─── 2. BINATE — secondary card + bonus WhatsApp Ajnaya ─────────────
  {
    order: 2,
    playbackId: 'i9Bm4N9eyzCeQN1Ku7wutBb9yj7nUtr1pSrGJYQBfKI',
    assetId: '6nQGxaDK00IFLHD39mhm0042qxb00RO8D4FKuL01cqv00Zo8',
    name: 'Binate A.',
    context: 'Marne-la-Vallée · 5 ans · Tesla',
    profile: 'Chauffeur Tesla · clientèle privée Disneyland · profil aspirationnel',
    quoteShort:
      "« Mes revenus sont montés de 30 %. Je ne travaille plus des heures infinies comme dans le temps. Travailler moins pour avoir plus, c'est ça la différence. »",
    gainBadge: '+30 % revenus',
    detail: 'Tesla · Disneyland',
    posterTimeSec: 4,
    teaserRange: { startSec: 60, endSec: 75 },
    moodTags: ['ambition', 'fierté', 'concrétisation'],
    keyEmotion: 'Aspirationnel — il a réussi grâce à FOREAS, le user veut être lui',
  },

  // ─── 3. ZEPHY KITENGE — angle reconversion / indépendance ───────────
  {
    order: 3,
    playbackId: 'vX1Hg6jKGiFpSJvQW900FrKMrDIfhxHQgxCGYAD3wjEY',
    assetId: 'X64eWdtN87Nv6kw01YnsOMJIEy00jjG02FhjcXRk9v01yZ4',
    name: 'Zephy K.',
    context: 'Marne-la-Vallée · ex-cadre Paris',
    profile: 'Reconversion cadre → chauffeur · Disneyland · service haut de gamme',
    quoteShort:
      "« Avant j'étais cadre dans une grosse boîte. Je n'en pouvais plus. Aujourd'hui, je suis l'un des chauffeurs les plus heureux. »",
    gainBadge: 'Indépendance',
    detail: 'Reconversion · Disneyland',
    posterTimeSec: 3,
    moodTags: ['élégance', 'engagement', 'passion'],
    keyEmotion: 'Épanouissement — il a trouvé sa place après une vie corporate',
  },

  // ─── 4. DRAGAN PETROVIC — angle stabilité / paiement ────────────────
  {
    order: 4,
    playbackId: 'SeKV8Lpn7H2XhfYF1oKO54zP008A3Dv4qPuCKizybyA4',
    assetId: 'VbJPdHPYe02GzXimwVnRo4Ttdj00y4ceZS4oxnxkpf9T4',
    name: 'Dragan P.',
    context: 'Paris · 9 ans VTC',
    profile: 'Europe de l\'Est · 49 ans · costume · 2 ans FOREAS',
    quoteShort:
      "« Plus de deux ans avec Foreas, aucun problème de paiement. Tout se passe pour le mieux. J'y suis, j'y reste. »",
    gainBadge: 'Zéro souci paiement',
    detail: '9 ans VTC · 2 ans FOREAS',
    posterTimeSec: 2,
    moodTags: ['sérénité', 'confiance', 'fidélité'],
    keyEmotion: 'Sécurité — paiement garanti chaque semaine',
  },

  // ─── 5. HADIETOU — angle ponctualité / support ──────────────────────
  {
    order: 5,
    playbackId: 'tjnuX01n9h01GfOA501C02a9lIVVbGnib02Z017POgodDpfj4',
    assetId: 'YYMmJsmfWYqhSB2wylK7Tr3IDOrEqMhXE015O02uCttgA',
    name: 'Hadietou',
    context: 'Banlieue parisienne · 9 ans VTC',
    profile: 'Banlieue parisienne · 35 ans · indépendant · option salariat',
    quoteShort:
      "« Foreas, c'est un confort et un futur. Virements ponctuels tous les mercredis. Réponse en moins de 24 heures. »",
    gainBadge: 'Mercredi · viré',
    detail: 'Indépendant · 9 ans VTC',
    posterTimeSec: 3,
    moodTags: ['réassurance', 'ponctualité', 'ouverture'],
    keyEmotion: 'Tranquillité — il sait à quoi s\'attendre',
  },

  // ─── 6. NIKOLIC NEBOJSA — angle longévité / écoute ──────────────────
  // ⚠️ ATTENTION : il dit "rattachement" dans la vidéo — terme que les
  // chauffeurs DÉTESTENT. Quote reformulée pour éviter ce mot.
  {
    order: 6,
    playbackId: '6PbitAE7sjbgTlMsdjI7EYJ01OsX9GnBbQNvj1TFhsow',
    assetId: 'uoJMU5tY5JoLokZN5xjOGAZX4lvWtBxoQBgkW02ub3vQ',
    name: 'Nikolic N.',
    context: 'Paris · 10 ans VTC',
    profile: 'Europe de l\'Est · 52 ans · costume · 2 ans FOREAS',
    quoteShort:
      "« Société sérieuse. Virement ponctuel une fois par semaine. Quand on a besoin d'une explication, ils sont là à nos écoutes. »",
    gainBadge: 'Écoute · 24/7',
    detail: '10 ans VTC · 2 ans FOREAS',
    posterTimeSec: 2,
    moodTags: ['pérennité', 'écoute', 'loyauté'],
    keyEmotion: 'Confiance — relation longue durée',
  },
] as const

/** Big Domino loop (Haitham par défaut) — vidéo en background du Big Domino */
export const BIG_DOMINO_VIDEO = TESTIMONIALS[0]

/** Bonus WhatsApp Ajnaya (vidéo full envoyée en récompense du push numéro) */
export const WHATSAPP_BONUS_VIDEO = TESTIMONIALS[1] // Binate (chiffré + Tesla)

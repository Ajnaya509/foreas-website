#!/usr/bin/env node
/**
 * FOREAS — VÉRIFICATEUR DU CANON.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI CE FICHIER EXISTE
 *
 * Le 14/08/2026, 286 promesses affichées sur foreas.xyz ont été confrontées à la
 * base de production. 45 étaient fausses. Les corriger a pris une journée.
 * Les empêcher de revenir prend ce fichier.
 *
 * Ce n'est pas une lubie : dans la même journée, le piège « corrigé d'un côté,
 * oublié dans le fichier jumeau » s'est refermé DEUX FOIS —
 *   · le mapping à 97 € retiré de /api/checkout le 22/07, resté trois semaines
 *     dans /api/subscription/create, en ligne ;
 *   · la phrase « tu croises trains, vols, météo en temps réel » corrigée dans
 *     api/ajnaya/chat/route.ts le matin, encore présente à midi dans son jumeau
 *     src/lib/ajnayaChatCore.ts — celui qui sert /experience.
 * Un humain ne tient pas ce genre de vigilance. Une machine, si.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * COMMENT ÇA MARCHE
 *
 *   node scripts/verifier-canon.mjs
 *
 * Sort en code 1 si une règle est enfreinte — donc utilisable comme porte avant
 * un déploiement. Il ne lit QUE le texte réellement affiché : les commentaires,
 * les balises et les entités HTML sont neutralisés avant la recherche. C'est
 * indispensable — « 51&nbsp;zones » coupé par un `<span>` avait traversé DEUX
 * balayages manuels avant d'être vu.
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, extname } from 'node:path'

const RACINE = 'src'

// Les prénoms du registre des accords, lus DANS le registre — pas recopiés.
// Une liste recopiée finirait par oublier la septième personne du jour où on
// l'ajoute, et la règle deviendrait aveugle précisément sur le cas neuf.
const REGISTRE_NOMS = (() => {
  const src = readFileSync(join(RACINE, 'lib/consentements.ts'), 'utf8')
  return [...src.matchAll(/personne:\s*'([^']+)'/g)]
    .map((m) => m[1].split(/[\s.]/)[0])
    .filter((n) => n.length > 3)
})()

// Les sujets affichables, et les mots que le routeur /go se réserve. Recopiés
// depuis src/lib/sujets.ts : ce programme tourne en node nu, sans résolution
// de '@/...'. Le mot « go » lui-même est réservé — c'est le routeur racine.
const SUJETS = [
  'airbnb', 'surge', 'premium', 'optimisation', 'revenus',
  'flotte', 'charges', 'aeroport', 'evenements', 'clients',
]
const MOTS_RESERVES = ['go', 'zones', 'rentabilite', 'clientele', 'ajnaya', 'communaute', 'desktop']

// Les prénoms du registre dont l'accord n'est PAS signé. Recopiés depuis
// src/lib/consentements.ts : ce programme tourne en node nu. Le jour où un accord
// est signé, retirer le prénom d'ici — et pas avant.
/**
 * Retire `proof_items`, puis rend le TEXTE des valeurs — pas leur forme JSON.
 *
 * ⚠️ 21/08/2026 — MA RÈGLE ÉTAIT DÉFAITE PAR L'ÉCHAPPEMENT, ET JE L'AI CRUE
 * VERTE.
 *
 * Elle cherchait un nom avec une limite de mot dans `JSON.stringify(content)`.
 * Or un retour à la ligne devient, dans cette forme, les DEUX CARACTÈRES `\` et
 * `n`. Un nom précédé d'un saut de ligne s'écrit donc « …\nDragan », et la
 * limite de mot ne s'y trouve pas : le `n` est un caractère de mot.
 *
 * Résultat mesuré : /premium racontait l'histoire de DEUX personnes nommées, en
 * production, et la règle passait au vert. Elle a attrapé /optimisation
 * seulement parce que le nom y suivait un espace.
 *
 * On ne cherche donc plus dans la forme JSON : on récupère les valeurs texte.
 */
function texteDeContenu(content) {
  if (!content || typeof content !== 'object') return String(content ?? '')
  const { proof_items: _ignore, ...reste } = content
  const morceaux = []
  const parcourir = (v) => {
    if (typeof v === 'string') morceaux.push(v)
    else if (Array.isArray(v)) v.forEach(parcourir)
    else if (v && typeof v === 'object') Object.values(v).forEach(parcourir)
  }
  parcourir(reste)
  return morceaux.join(' \n ')
}

/**
 * Retire les commentaires d'un fichier source, pour qu'une règle lise du CODE.
 *
 * ⚠️ 21/08/2026 — J'AI ÉCRIT DEUX RÈGLES QUI LISAIENT LES COMMENTAIRES.
 *
 * Elles appelaient `texteDeContenu()`, qui sert à aplatir le JSON venu de la
 * base — et ne retire rien du tout d'un fichier `.tsx`. Résultat : la règle
 * « pas d'attente invisible » a signalé `src/app/cap/page.tsx` à cause du
 * COMMENTAIRE que je venais d'y écrire pour EXPLIQUER le bug corrigé.
 *
 * C'est le troisième faux témoin par commentaire dans ce projet — et le premier
 * qui accuse au lieu d'innocenter. Les deux sens sont aussi nuisibles : un
 * contrôle qui crie à tort finit désactivé, exactement comme un contrôle qui se
 * tait à tort finit ignoré.
 *
 * Volontairement simple et un peu trop zélé : une chaîne de caractères qui
 * contiendrait `//` perd sa fin de ligne. Pour ce que les règles cherchent
 * — des motifs de code — trop retirer est sans danger ; trop garder ne l'est pas.
 */
function sansCommentaires(source) {
  return String(source ?? '')
    // {/* ... */} des enfants JSX, puis /* ... */ classiques
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    // // ... jusqu'à la fin de la ligne
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ')
}

const PERSONNES_NON_APPROUVEES = ['Haitham', 'Binate', 'Zefi', 'Dragan', 'Hadietou', 'Nikolic']

// ─── Les règles ─────────────────────────────────────────────────────────────
// Chaque règle dit CE QUI EST INTERDIT et POURQUOI, avec la mesure qui le prouve.
// Ajouter une règle ici, c'est empêcher un mensonge de renaître.

const REGLES = [
  {
    motif: /\b7\s*(plateformes|apps|applis)\b/i,
    quoi: '« 7 plateformes / 7 apps »',
    pourquoi:
      'select distinct platform from rides → Uber, Bolt, Heetch (+ « Private » = course directe, pas une plateforme) = 3 réelles. Voir src/lib/verite-commerciale.ts §2.',
  },
  {
    motif: /\+ ?4 autres|\+4 autres|\+ ?4,? en direct/i,
    quoi: '« + 4 autres » plateformes',
    pourquoi: 'Même mesure : il n’y en a que 3. Écrire « + 4 autres » est la même erreur déguisée.',
  },
  {
    motif: /\b51\s*zones\b/i,
    quoi: '« 51 zones »',
    pourquoi:
      'select count(*) from zones_canonical → 52. Faux d’une seule unité, donc plausible, donc jamais relu — le plus traître des chiffres faux.',
  },
  {
    motif: /plateformes?\s+en\s+direct|lit\s+.{0,30}\s+en\s+direct|demande\s+en\s+temps\s+réel/i,
    quoi: '« lecture en direct » des plateformes',
    pourquoi:
      'driver_ride_features → 0 ligne. Aucune lecture continue ne tourne. « En direct » est un second faux, distinct du nombre de plateformes.',
  },
  {
    motif: /tirelire|mise de côté automatique|met de côté (ton|votre) urssaf/i,
    quoi: '« tirelire URSSAF » / « mise de côté automatique »',
    pourquoi:
      'L’URSSAF SE CALCULE. Aucune table de portefeuille, aucun cantonnement, aucun mouvement d’argent n’existe. Promettre une mise de côté, c’est promettre un service financier que FOREAS ne rend pas (ordonnance du 19 sept. 1945, art. 20).',
  },
  {
    motif: /\bsans carte\b/i,
    quoi: '« sans carte »',
    pourquoi:
      'api/checkout crée la session avec payment_method_collection:"always" : la carte EST enregistrée. Même quand c’est vrai du CHAT, le visiteur l’applique à l’abonnement — écris « sans compte », ou « discuter est gratuit ». Pas d’exception : une exception masque le problème au lieu de le régler.',
  },
  {
    motif: /\b(7|sept)\s+jours\s+(d’|d')?essai|essai\s+(de\s+)?(7|sept)\s+jours/i,
    quoi: 'un essai de 7 jours',
    pourquoi: 'L’essai dure 3 jours (ESSAI_JOURS dans src/lib/offre.ts). Pour tout le monde.',
  },
  {
    motif: /\b147\s+(chauffeurs|actifs)\b/i,
    quoi: '« 147 chauffeurs actifs »',
    pourquoi:
      'drivers → 30 inscrits, 9 marqués actifs, 0 actif sur 24 h. Le chiffre n’était branché sur rien.',
  },
  {
    // `(?<![\d,]\s?)` : « 1 247 € » (un revenu) et « 12,97€ » (un exemple de
    // formatage) ne sont PAS des prix d'abonnement. Sans ce garde-fou, la règle
    // criait au loup sur du texte parfaitement honnête — et une règle qui crie
    // à tort finit par être désactivée, donc par ne plus rien protéger.
    motif: /(?<![\d,]\s?)\b(97|247)\s*€|price:\s*(97|247)\b/,
    quoi: 'un prix de 97 € ou 247 €',
    pourquoi:
      'L’abonnement vaut 29,99 €/mois (PRIX_MENSUEL_CENTIMES dans src/lib/offre.ts). 97 € et 247 € sont l’ancienne grille, is_active=false en base.',
  },
  {
    // Drapeau `i` OBLIGATOIRE : sans lui, « copilote compta IA » passait à travers
    // alors que « Compta IA » était bloqué. Une règle sensible à la casse est une
    // règle à moitié appliquée — et personne ne s'en aperçoit.
    // `\\?` : dans une chaîne JS entre quotes simples, l'apostrophe est ÉCHAPPÉE
    // (`L\\'IA`). Sans ce caractère optionnel, la règle ne voyait pas les métadonnées
    // Open Graph — celles que voient WhatsApp, LinkedIn et Google. C'est la porte
    // de sortie, qui lit le HTML servi, qui a trouvé le trou.
    // ⚠️ 14/08/2026 — CETTE RÈGLE NE TESTAIT QUE DES TOURNURES (« l'IA », « DG IA »,
    // « notre IA »…). Elle laissait donc passer le mot NU. Or il était affiché en
    // badge dans l'en-tête du widget Ajnaya — monté dans layout.tsx, donc sur TOUTES
    // les pages — coupé en deux balises collées : <span>Ajnaya</span><span>IA</span>.
    // Quatrième déguisement du même mot, après l'apostrophe échappée, l'entité HTML
    // et le cache. La tâche « retirer toute mention IA » était marquée FAITE pendant
    // que la mention la plus visible du site n'avait jamais été retirée.
    // On teste maintenant le mot nu, en majuscules, isolé — la seule forme qui ne
    // peut pas se cacher. (`I` et `A` collés en minuscules n'existent pas en français
    // comme mot autonome, donc pas de faux positif à craindre de ce côté.)
    motif: /\bIA\b/,
    // Exemptions RAISONNÉES, chacune justifiée — pas des trous de confort :
    //  · CGU / confidentialité / mentions légales / suppression-compte : décrire
    //    un traitement par IA est une OBLIGATION de transparence (RGPD art. 13).
    //    Interdire le mot là reviendrait à cacher au visiteur ce qu'on fait de
    //    ses données. C'est le seul endroit où le mot est un devoir, pas un défaut.
    //  · les deux prompts : ils contiennent « Tu ne dis JAMAIS "je suis une IA" »,
    //    c'est-à-dire l'INTERDICTION elle-même.
    //  · design/tokens.ts : c'est la LISTE des mots bannis.
    exceptions: [
      /app\/cgu\//,
      /app\/confidentialite\//,
      /app\/mentions-legales\//,
      /app\/suppression-compte\//,
      /api\/ajnaya\/chat\/route\.ts/,
      /lib\/ajnayaChatCore\.ts/,
      /design\/tokens\.ts/,
    ],
    // ⚠️ NE PAS ajouter « une IA » ici : les prompts d'Ajnaya contiennent
    // « Tu ne dis JAMAIS "je suis une IA" » — c'est l'INTERDICTION elle-même.
    // Une règle qui punit sa propre application est une règle qu'on désactive.
    quoi: 'le mot « IA »',
    pourquoi: 'Ajnaya a un nom, on l’emploie. Règle cross-fil.',
  },
  {
    motif: /rien à annuler/i,
    quoi: '« il n’y a rien à annuler »',
    pourquoi:
      'Un abonnement Stripe EST créé dès l’inscription, carte enregistrée. Il y a bien quelque chose à annuler.',
  },
  {
    motif: /cascade\s+10\s*€?\s*\/\s*4\s*€?\s*\/\s*2\s*€?|25\s*€.{0,20}\(N1\)|8\s*€.{0,20}\(N2\)/i,
    quoi: 'une cascade de parrainage multi-niveaux',
    pourquoi:
      'referral_program_tiers → 25/35/50 € : ce sont des paliers de VOLUME, pas des niveaux de pyramide. referral_commissions → 0 ligne, jamais rien versé.',
  },
]

// ─── Fichiers du canon : eux CITENT les interdits pour les définir ──────────
const EXEMPTS = [
  'lib/verite-commerciale.ts',
  'lib/offre.ts',
  'lib/provenance.ts',
  'scripts/verifier-canon.mjs',
]

// ─── Lecture ────────────────────────────────────────────────────────────────

function fichiers(dossier) {
  const out = []
  for (const nom of readdirSync(dossier)) {
    const chemin = join(dossier, nom)
    if (statSync(chemin).isDirectory()) out.push(...fichiers(chemin))
    else if (['.tsx', '.ts'].includes(extname(nom))) out.push(chemin)
  }
  return out
}

/**
 * Ne garde que ce qu'un visiteur peut LIRE.
 * Ordre important : commentaires d'abord (ils citent souvent l'interdit pour
 * expliquer la correction), puis balises, puis entités HTML, puis espaces.
 */
function texteAffiche(source) {
  return source
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ') // {/* commentaire JSX */}
    .replace(/\/\*[\s\S]*?\*\//g, ' ') //     /* commentaire */
    .replace(/^\s*\/\/.*$/gm, ' ') //         // commentaire en début de ligne
    .replace(/\s\/\/[^\n'"`]*/g, ' ') //      // commentaire en fin de ligne
                                    //         (l'exclusion des quotes évite de
                                    //          couper une URL https://… dans une chaîne)
    .replace(/<[^>]+>/g, ' ') //              balises
    // TOUTES les entités, pas une liste blanche. `&apos;` avait fait passer
    // « L&apos;IA » sur un <h2> de l'accueil — troisième déguisement du même mot
    // après l'apostrophe échappée en chaîne JS et le cache Vercel. Une liste
    // blanche d'entités laisse forcément passer celle qu'on n'a pas prévue.
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&apos;|&#39;|&rsquo;|&#8217;/g, "'")
    .replace(/&quot;|&#34;/g, '"')
    .replace(/&amp;|&#38;/g, '&')
    .replace(/&[a-zA-Z]+;|&#\d+;/g, ' ') //  toute autre entité → espace
    .replace(/\{'\s*'\}/g, ' ') //            {' '} de JSX
    .replace(/\s+/g, ' ')
}

// ─── Règles STRUCTURELLES ───────────────────────────────────────────────────
//
// Un motif de texte ne peut pas attraper un calcul. Le 14/08/2026,
// `src/app/chauffeurs/page.tsx` affichait une durée d'essai calculée par
// `getNextMonday18hParis()` — le modèle « prochain lundi 18h », abandonné le
// 22/07 précisément parce qu'il donnait une durée différente chaque jour.
// Résultat mesuré en rejouant la fonction DÉPLOYÉE sur les 7 jours :
//   dimanche 8 j (9 avant 3h) · lundi 7 · mardi 6 · mercredi 5 · jeudi 4 ·
//   vendredi 3 · samedi 2 — pour un essai qui dure 3 jours, toujours.
// Le badge n'était juste QUE le vendredi, par coïncidence de calendrier. Et un
// commentaire au-dessus jurait « mirrors /api/checkout », ce qui était faux.
//
// Troisième fois que le piège « corrigé d'un côté, oublié dans le jumeau » se
// referme sur ce dépôt. D'où ces règles : elles ne lisent pas le texte, elles
// vérifient que les valeurs viennent de la source unique.

const REGLES_STRUCTURELLES = [
  {
    // ── L'ADRESSE PUBLIQUE VIENT D'UN SEUL ENDROIT ──────────────────────────
    //
    // Mesuré le 20/08/2026 : le sitemap listait 18 URL en `foreas.xyz` (apex)
    // alors que la production sert `www` et redirige l'apex en 307. Google était
    // donc envoyé sur 18 redirections. Et les canoniques se contredisaient d'une
    // page à l'autre — `/` sur www, `/ou-ca-paie` sur l'apex, `/tarifs2` aucune.
    // Une canonique qui désigne une URL qui redirige s'annule elle-même.
    //
    // Un fichier qui écrit une adresse publique du site doit la lire dans
    // src/lib/site.ts. Une URL d'infrastructure (railway.app, vercel.app) n'est
    // JAMAIS une adresse publique — d'où l'interdiction de la mettre en canonique.
    concerne: /canonical:\s*['"`]https:\/\/|sitemap:\s*['"`]https:\/\/|host:\s*['"`]https:\/\//,
    exige: /URL_SITE|canonique\(/,
    quoi: 'une adresse publique écrite en dur (canonique, sitemap ou host)',
    pourquoi:
      "L'adresse du site vient de src/lib/site.ts (URL_SITE / canonique()). Écrite en dur, elle finit par diverger d'une page à l'autre — c'est déjà arrivé : le sitemap sur l'apex, les canoniques moitié www moitié apex, et Google envoyé sur des redirections.",
  },
  {
    // ── UNE PAROLE NE SE RÉÉCRIT PAS AILLEURS QUE DANS SA SOURCE ────────────
    //
    // Le 14/08/2026, le prompt du modal d'accueil faisait dire à Dragan P.
    // « 2 ans sans problème de PAIEMENT ». Ses mots réels, filmés : « Plus de
    // deux ans avec FOREAS, aucun souci. » L'ajout lui prêtait une affirmation
    // sur un sujet sensible qu'il n'a jamais faite, à visage découvert.
    //
    // La parole des six chauffeurs filmés vit à UN endroit :
    // `src/components/zone/testimonials.data.ts`, verbatim de la vidéo. Tout
    // autre fichier qui nomme l'un d'eux ET porte une citation doit passer par
    // `src/lib/consentements.ts` — le registre qui dit quelle phrase exacte est
    // autorisée. Sinon, c'est une reformulation, et une reformulation n'est pas
    // couverte par un accord.
    // Motif resserré : une CITATION, pas n'importe quelle apostrophe de code.
    // La première version attrapait « Binate K. » des maquettes de tableau de
    // bord (données de démonstration, autre personne) — une règle qui crie à
    // tort finit désactivée, donc ne protège plus rien.
    concerne: /(quote|citation|témoignage)[^\n]{0,80}(Haitham|Binate|Binaté|Zephy|Dragan|Hadietou|Nikolic)|(Haitham|Binate|Binaté|Zephy|Dragan|Hadietou|Nikolic)[^\n]{0,80}«/,
    exige: /consentements|testimonials\.data/,
    quoi: 'une parole attribuée à un chauffeur filmé, hors de sa source',
    pourquoi:
      "La citation d'une personne nommée vient de src/components/zone/testimonials.data.ts (verbatim de la vidéo) ou passe par le registre src/lib/consentements.ts. La réécrire ailleurs, même « pour raccourcir », produit une phrase qu'elle n'a pas prononcée — c'est exactement ce qui est arrivé à Dragan P. le 14/08.",
  },
  {
    // Un fichier qui parle de durée d'essai DOIT la lire dans offre.ts.
    concerne: /jours?\s+d['’]essai|essai\s+(gratuit\s+)?de\s+\d|trialDays|trial\.days/i,
    exige: /ESSAI_JOURS|TRIAL_DAYS/,
    quoi: 'une durée d’essai calculée hors de la source unique',
    pourquoi:
      'La durée vient de ESSAI_JOURS (src/lib/offre.ts) ou de rien. Tout autre calcul — « prochain lundi », ancre hebdomadaire, constante locale — finit par diverger, et le visiteur lit un chiffre différent d’une page à l’autre dans le même tunnel.',
  },
  {
    // Un prix « par jour » doit se dériver du prix, pas être écrit à la main.
    concerne: /€\s*\/\s*jour|par\s+jour[^.]{0,20}€|\d,\d{2}\s*€\s*(par\s+)?jour/i,
    exige: /PRIX_MENSUEL_CENTIMES|PRIX_ANNUEL_CENTIMES|FORMULES/,
    quoi: 'un prix « par jour » écrit à la main',
    pourquoi:
      '29,99 €/mois = 1,00 €/jour ; 249,99 €/an = 0,68 €/jour. Tout autre chiffre (1,42 € a été mesuré en production) ne correspond à aucune formule vendable. Dérive-le de src/lib/offre.ts.',
  },
]

// ─── Contrôle ───────────────────────────────────────────────────────────────

const infractions = []

for (const chemin of fichiers(RACINE)) {
  if (EXEMPTS.some((e) => chemin.includes(e))) continue
  const source = readFileSync(chemin, 'utf8')
  const affiche = texteAffiche(source)

  // Structurel : la VALEUR vient-elle de la source unique ?
  for (const regle of REGLES_STRUCTURELLES) {
    if (regle.concerne.test(affiche) && !regle.exige.test(source)) {
    infractions.push({
        fichier: chemin,
      quoi: regle.quoi,
        pourquoi: regle.pourquoi,
        extrait: (affiche.match(regle.concerne) || [''])[0],
      })
    }
  }

  for (const regle of REGLES) {
    if (regle.exceptions?.some((ex) => ex.test(chemin))) continue
    const m = affiche.match(regle.motif)
    if (m) {
      const i = affiche.indexOf(m[0])
      infractions.push({
        fichier: chemin,
        quoi: regle.quoi,
        pourquoi: regle.pourquoi,
        extrait: affiche.slice(Math.max(0, i - 55), i + m[0].length + 45).trim(),
      })
    }
  }
}

// ─── CHAQUE VISAGE AFFICHÉ A UNE LIGNE AU REGISTRE ──────────────────────────
//
// Mesuré le 20/08/2026 : le registre de consentement existait depuis le matin et
// PERSONNE ne l'importait. Six chauffeurs à visage découvert, leurs phrases à
// l'écran, et un fichier de garde que rien ne consultait. Un registre que rien ne
// consulte ne protège rien.
//
// Ce contrôle est croisé entre deux fichiers, il ne peut donc pas s'écrire comme
// un motif cherché dans un seul. Il vérifie qu'aucun témoignage ne s'affiche sans
// entrée à son nom — sinon la garde le laisserait passer sans rien vérifier.
{
  let dat = null
  let reg = null
  try {
    dat = readFileSync('src/components/zone/testimonials.data.ts', 'utf8')
    reg = readFileSync('src/lib/consentements.ts', 'utf8')
  } catch {
    // Un des deux fichiers a disparu : c'est en soi une infraction, signalée plus bas.
  }
  if (!dat || !reg) {
    infractions.push({
      fichier: 'src/lib/consentements.ts',
      quoi: 'le registre de consentement ou la source des témoignages est introuvable',
      extrait: '(fichier absent)',
      pourquoi:
        "Ces deux fichiers se gardent l'un l'autre. Si l'un disparaît, plus rien ne vérifie qu'une parole affichée est bien celle de la personne.",
    })
  } else {
    const ids = new Set([...reg.matchAll(/^\s*id:\s*'([a-z]+)'/gm)].map((m) => m[1]))
    for (const m of dat.matchAll(/^\s*name:\s*'([^']+)'/gm)) {
      const cle = m[1].toLowerCase().split(/[\s.]/)[0].replace(/[^a-zà-ÿ]/g, '')
      if (!ids.has(cle)) {
        infractions.push({
          fichier: 'src/components/zone/testimonials.data.ts',
          quoi: `le témoignage « ${m[1]} » n'a aucune entrée au registre de consentement`,
          extrait: m[1],
          pourquoi:
            "Une parole attribuée à quelqu'un ne s'affiche que si le registre (src/lib/consentements.ts) porte une ligne à son nom. Sans elle, rien ne peut vérifier que la phrase affichée est bien la sienne. Ajoute l'entrée avant d'ajouter le témoignage.",
        })
      }
    }
  }
}

// ─── UNE PAROLE N'EXISTE QU'À UN SEUL ENDROIT ───────────────────────────────
//
// Mesuré le 20/08/2026 : la parole de la MÊME personne existait en QUATRE
// versions, dans trois fichiers. Binaté avait deux raccourcis différents, aucun
// n'étant ce qu'il a dit. Haitham perdait le mot « instantanément ». La première
// phrase de Dragan était réécrite.
//
// Personne n'a triché. Chacun a raccourci « pour que ça tienne dans la carte ».
// C'est exactement comme ça qu'une parole se déforme : par petites retouches
// raisonnables, dans des fichiers qui ne se parlent pas.
//
// Cette règle interdit qu'un fragment reconnaissable d'une citation enregistrée
// réapparaisse EN DUR ailleurs que dans le registre. Les composants doivent
// appeler `citationDe(id)`.
{
  let reg = null
  try {
    reg = readFileSync('src/lib/consentements.ts', 'utf8')
  } catch {
    /* l'absence du registre est déjà signalée par la règle précédente */
  }
  if (reg) {
    // On prend un fragment long et distinctif de chaque verbatim : assez long
    // pour ne jamais coïncider par hasard, assez court pour survivre à une
    // reformulation partielle — c'est précisément ce qu'on veut attraper.
    const fragments = []
    for (const m of reg.matchAll(/citationAutorisee:\s*\n?\s*["']((?:[^"'\\]|\\.)*)["']/g)) {
      const texte = m[1].replace(/\\'/g, "'").trim()
      if (texte.length < 30) continue
      fragments.push({ court: texte.slice(0, 28), complet: texte })
    }
    for (const chemin of fichiers(RACINE)) {
      if (chemin.endsWith('src/lib/consentements.ts')) continue
      // ⚠️ 21/08/2026 — LES COMMENTAIRES SONT RETIRÉS AVANT LA RECHERCHE.
      //
      // Cette règle s'est déclenchée sur une note qui CITAIT un fragment pour
      // expliquer pourquoi on venait de le retirer du code. Un commentaire ne
      // s'affiche à personne : ce n'est pas une publication, c'est une trace.
      //
      // Troisième fois aujourd'hui qu'un commentaire fausse une règle — dans
      // les deux sens : ici il déclenche à tort, ailleurs il faisait passer au
      // vert une page qui n'avait aucun lien vers la caisse. Une règle qui lit
      // du code doit lire du CODE.
      const source = readFileSync(chemin, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, ' ')
        .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
        .replace(/^\s*\/\/.*$/gm, ' ')
      for (const f of fragments) {
        if (!source.includes(f.court)) continue
        infractions.push({
          fichier: chemin,
          quoi: 'une citation de chauffeur écrite en dur hors du registre',
          extrait: f.court + '…',
          pourquoi:
            "Cette phrase est la parole d'une personne réelle, filmée à visage découvert. Elle n'existe qu'à un endroit : src/lib/consentements.ts. Appelle citationDe('<id>') au lieu de la recopier — une copie finit toujours par être raccourcie « pour que ça tienne », et la personne se retrouve à dire ce qu'elle n'a pas dit.",
        })
      }
    }
  }
}

// ─── AUCUN REPLI SILENCIEUX VERS LA CLÉ PUBLIQUE ────────────────────────────
//
// Mesuré le 20/08/2026 : ONZE routes écrivaient
// `SUPABASE_SERVICE_ROLE_KEY || NEXT_PUBLIC_SUPABASE_ANON_KEY`. Le jour d'une
// rotation de clé, ce `||` ne produit AUCUNE erreur : la route se met à lire
// avec les droits d'un visiteur anonyme, en silence. C'est le pire mode de
// panne possible — invisible.
//
// Le client à droits serveur vient de src/lib/supabaseServeur.ts, et de lui
// seul. Ce fichier est la seule exception à la règle : c'est lui qui arbitre
// entre la nouvelle clé et l'ancienne, et il refuse plutôt que de dégrader.
{
  const motif = /SERVICE_ROLE_KEY\s*(\|\||\?\?)|ANON_KEY\s*(\|\||\?\?)\s*process\.env\.SUPABASE_SERVICE_ROLE/
  for (const chemin of fichiers(RACINE)) {
    if (chemin.endsWith('src/lib/supabaseServeur.ts')) continue
    const source = readFileSync(chemin, 'utf8')
    const m = source.match(motif)
    if (!m) continue
    infractions.push({
      fichier: chemin,
      quoi: 'un repli silencieux entre la clé serveur et la clé publique',
      extrait: m[0],
      pourquoi:
        "Une route qui a besoin des droits serveur doit les avoir ou échouer franchement. Ce `||` la fait basculer sans bruit sur les droits d'un visiteur anonyme le jour d'une rotation de clé : pas de 500, pas d'alerte, juste des réponses incomplètes et des écritures refusées en silence. Utilise clientServeur() ou clientServeurOuNull() depuis src/lib/supabaseServeur.ts.",
    })
  }
}

// ─── AUCUN NOM RÉEL DANS UNE DONNÉE INVENTÉE ───────────────────────────────
//
// 🔴 MESURÉ EN PRODUCTION LE 21/08/2026 : /dashboard/partner répondait 200 SANS
// AUCUNE AUTHENTIFICATION, et son HTML servait :
//
//     Nikolic D.   ● En course      Bastille      22,10 €/h
//     Hadietou S.  ● Pause          —             21,50 €/h
//     Dragan P.    ● Hors ligne     —             19,80 €/h
//
// Ce sont les noms de six chauffeurs RÉELS — ceux-là mêmes qui ont accepté
// d'être filmés et qui figurent au registre des accords. La zone, le statut, le
// revenu et la note étaient inventés. La console d'administration leur
// attribuait en plus des adresses e-mail plausibles et un statut « suspendu ».
//
// Un visiteur ne pouvait pas le deviner : sur une page publique, « Nikolic D. —
// En course — Bastille » se lit comme la position d'une personne, en direct.
//
// Cette règle interdit qu'un nom du registre reparaisse dans les arbres de
// consoles ou dans un bloc de données de démonstration.
{
  const NOMS = REGISTRE_NOMS
  const DOSSIERS_CONSOLE = ['app/dashboard', 'app/509']
  for (const chemin of fichiers(RACINE)) {
    const relatif = chemin.replace(RACINE + '/', '')
    const source = readFileSync(chemin, 'utf8')
    const dansConsole = DOSSIERS_CONSOLE.some((d) => relatif.startsWith(d))
    const contientMaquette = /\bMOCK_[A-Z_]+\s*=|\bDEMO_[A-Z_]+\s*=/.test(source)
    if (!dansConsole && !contientMaquette) continue
    const sansCommentaires = source
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
      .replace(/^\s*\/\/.*$/gm, ' ')
    for (const nom of NOMS) {
      if (!sansCommentaires.includes(nom)) continue
      infractions.push({
        fichier: relatif,
        quoi: 'le nom d’une personne réelle dans une donnée inventée',
        extrait: nom,
        pourquoi:
          "Le 21/08/2026, /dashboard/partner servait publiquement les noms de six chauffeurs filmés, avec une zone, un statut d'activité et un revenu horaire inventés. Une personne réelle ne porte pas de chiffres qu'elle n'a pas produits. Les noms de démonstration vivent dans src/lib/donneesDemo.ts.",
      })
    }
  }
}

// ─── TOUTE PAGE COMMERCIALE COMPTE SA VUE ──────────────────────────────────
//
// 🔴 MESURÉ LE 21/08/2026 : UN SEUL appel de mesure dans tout src/. Les dix
// pages commerciales du site n'avaient aucun compteur de vue.
//
// La conséquence n'était pas « on ne sait pas encore », c'était « on ne pourra
// jamais savoir ». On connaissait le nombre d'abonnements ; jamais la page qui
// les avait produits. Donc toute décision de fusionner ou de supprimer une page
// était un pari : rien n'aurait dit si la conversion avait monté ou baissé.
//
// La vue est le DÉNOMINATEUR. Sans elle, un nombre d'essais ne veut rien dire :
// dix essais sur mille visites et dix essais sur douze visites sont deux
// situations opposées qui produisent le même chiffre.
{
  const COMMERCIALES = [
    'chauffeurs', 'professionnels', 'ou-ca-paie', 'cap', 'experience',
    'reactivation', 'facturation-electronique-vtc-2026', 'technologie',
    'a-propos', 'contact', 'tarifs2',
  ]
  for (const page of COMMERCIALES) {
    const chemin = join(RACINE, 'app/' + page + '/page.tsx')
    if (!existsSync(chemin)) continue
    const source = readFileSync(chemin, 'utf8')
    const sansCommentaires = source
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
      .replace(/^\s*\/\/.*$/gm, ' ')
    if (/<MesureVue\b|mesurer\s*\(\s*['"](?:PageView|PricingView)['"]/.test(sansCommentaires)) continue
    infractions.push({
      fichier: 'src/app/' + page + '/page.tsx',
      quoi: 'une page commerciale qui ne compte pas sa vue',
      extrait: 'ni <MesureVue />, ni mesurer(PageView) hors commentaire',
      pourquoi:
        "La vue est le dénominateur de toute conversion. Sans elle, dix essais peuvent venir de mille visites ou de douze : le même chiffre décrit deux situations opposées. Pose <MesureVue page=... intention=... audience=... /> dans le rendu.",
    })
  }
}

// ─── AUCUN CHIFFRE CALCULÉ DANS UN MESSAGE ENVOYÉ AU NOM DU CHAUFFEUR ───────
//
// 🔴 MESURÉ LE 21/08/2026 : le bouton du bloc « douleur » de l'accueil
// pré-remplissait « je touche environ 14€ net » pendant que la page affichait
// 8,71 € au même instant, à quarante pixels de là. Les deux venaient du MÊME
// composant. À 100 €, l'écart passait de 34,82 € affiché à 56 € annoncé.
//
// Deux raisons de l'interdire, pas seulement de l'aligner :
//
//  1. ce message s'affiche dans la conversation du chauffeur COMME S'IL
//     L'AVAIT ÉCRIT. On ne lui fait pas dire un chiffre — surtout pas un que
//     notre propre page dément ;
//  2. il n'existe pas de bon coefficient à mettre là. FOREAS porte trois taux
//     de commission Uber saisis à la main et jamais mesurés (0,45 · 0,25 ·
//     0,75 de part chauffeur). En choisir un en aurait fabriqué un quatrième.
//
// Le message porte le montant que le chauffeur a lui-même réglé, et POSE la
// question. Ajnaya répond, en connaissant sa plateforme et son statut.
{
  const chemin = join(RACINE, 'lib/whatsappLink.ts')
  if (existsSync(chemin)) {
    const source = readFileSync(chemin, 'utf8')
    const sansCommentaires = source
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/^\s*\/\/.*$/gm, ' ')
    // Un montant multiplié par un coefficient, à l'intérieur d'un gabarit.
    const m = sansCommentaires.match(/\$\{[^}]*\b(?:amount|montant|brut|grossFare)\b[^}]*[*/][^}]*\}/)
    if (m) {
      infractions.push({
        fichier: 'src/lib/whatsappLink.ts',
        quoi: 'un montant calculé dans un message envoyé au nom du chauffeur',
      extrait: m[0],
        pourquoi:
          "Ce message s'affiche dans la conversation du chauffeur comme s'il l'avait écrit lui-même. Le 21/08/2026, il annonçait 14 € net pendant que la même page affichait 8,71 €. Le message doit porter le montant que le chauffeur a réglé et POSER la question — pas y répondre avec un taux que personne n'a mesuré.",
      })
    }
  }
}

// ─── LE MANIFESTE DES CINQ PARCOURS DIT-IL VRAI ? ──────────────────────────
//
// Un tableau dans un document Markdown vieillit sans prévenir : personne ne le
// relit, rien ne le contredit, et il finit par décrire un site qui n'existe
// plus. Ce dépôt en a plusieurs preuves — des commentaires y affirmaient des
// choses fausses depuis des semaines.
//
// Le manifeste vit donc dans src/lib/parcours.ts, et cette règle le confronte
// au dépôt : chaque page qu'il déclare doit exister, et chaque route de
// boutique qu'il annonce doit avoir son fichier.
//
// ⚠️ Elle ne vérifie PAS que la promesse est tenue — aucune règle ne peut faire
// ça. Elle vérifie que le manifeste ne ment pas sur ce qui est vérifiable.
{
  const chemin = join(RACINE, 'lib/parcours.ts')
  if (existsSync(chemin)) {
    const src = readFileSync(chemin, 'utf8')

    const pages = [
      ...[...src.matchAll(/pageMere:\s*'([^']+)'/g)].map((m) => m[1]),
      ...[...src.matchAll(/pagesSecondaires:\s*\[([^\]]*)\]/g)]
        .flatMap((m) => [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1])),
    ]
    for (const page of new Set(pages)) {
      const nom = page.replace(/^\//, '')
      const candidats = [
        join(RACINE, 'app', nom, 'page.tsx'),
        join(RACINE, 'app/(marketing)/[topic]/page.tsx'),
      ]
      const sujetEnBase = SUJETS.includes(nom)
      if (existsSync(candidats[0]) || (sujetEnBase && existsSync(candidats[1]))) continue
      infractions.push({
        fichier: 'src/lib/parcours.ts',
        quoi: 'le manifeste déclare une page qui n’existe pas',
        extrait: page,
        pourquoi:
          "Un manifeste qui nomme une page absente est pire qu'un manifeste absent : il fait croire qu'un parcours existe. Soit la page se crée, soit le manifeste se corrige.",
      })
    }

    for (const m of src.matchAll(/routeBoutique:\s*'\/go\/([^']+)'/g)) {
      const f = join(RACINE, 'app/go', m[1], 'route.ts')
      if (existsSync(f)) continue
      infractions.push({
        fichier: 'src/lib/parcours.ts',
        quoi: 'le manifeste déclare une route de boutique qui n’existe pas',
        extrait: '/go/' + m[1],
        pourquoi:
          "Sans cette route, le parcours n'a aucun chemin vers l'application : le visiteur qui clique « Installer » n'arrive nulle part, et l'installation n'est attribuée à aucune intention.",
      })
    }
  }
}

// ─── LE FILTRE QUI REND L'EXCLUSION DE `proof_items` LÉGITIME ──────────────
//
// La règle « aucun nom du registre dans le texte de la base » exclut le champ
// `proof_items`. Cette exclusion n'est acceptable QUE parce que la page le
// filtre avant de servir quoi que ce soit.
//
// 🔴 CE QUI SE PASSAIT AVANT : un filtre posé sur le RENDU empêchait
// l'affichage mais pas l'ENVOI. Les trois personnes de `proof_items` — nom,
// ville, ancienneté, gain chiffré — partaient dans la charge des dix pages,
// lisibles par qui ouvre le code source. Masquées à l'œil, publiées quand même.
//
// Si ce filtre disparaît, l'exclusion devient un trou béant. Cette règle garde
// la garde.
{
  const chemin = join(RACINE, 'app/(marketing)/[topic]/page.tsx')
  if (existsSync(chemin)) {
    const sansCommentaires = readFileSync(chemin, 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/^\s*\/\/.*$/gm, ' ')
    if (!/temoignagePubliableParNom/.test(sansCommentaires)) {
      infractions.push({
        fichier: 'src/app/(marketing)/[topic]/page.tsx',
        quoi: 'les preuves de la base partent sans filtre de consentement',
        extrait: 'aucun appel à temoignagePubliableParNom',
        pourquoi:
          "Sans ce filtre, les personnes de `proof_items` partent dans la charge des dix pages — nom, ville, ancienneté, gain chiffré — même si rien ne les affiche. Masqué à l'œil n'est pas non publié. Et la règle qui cherche les noms en base EXCLUT ce champ en comptant sur ce filtre : le retirer ouvre les deux d'un coup.",
      })
    }
  }
}

// ─── AUCUN CALCUL FINANCIER RACONTÉ EN PHRASE ──────────────────────────────
//
// 🔴 CETTE RÈGLE VIENT D'UN ÉCHEC RÉPÉTÉ TROIS FOIS DANS LA MÊME JOURNÉE.
//
// Le 21/08/2026, j'ai retiré le taux de 25 % du calculateur, puis de cinq champs
// de /revenus, puis de /aeroport, puis de /optimisation. Après chaque passe,
// j'ai déclaré la vérité financière fermée.
//
// Elle ne l'était pas. Le calcul vivait dans le CORPS DU RÉCIT :
//
//     « Une course s'affiche à 25 €. La plateforme prend sa commission —
//       autour de 25 %. Il te reste 18,75 €. »
//
// Mesuré après mes trois corrections : /revenus servait encore 18,75 € quatre
// fois et 25 % deux fois, en production, pendant que `npm run canon` sortait
// vert.
//
// LA CAUSE, ET ELLE EST STRUCTURELLE : toutes mes règles cherchaient une
// MULTIPLICATION dans du CODE. Aucune ne refusait la même opération RACONTÉE.
// Un chiffre écrit en phrase échappe à un motif écrit pour du code.
//
// ─────────────────────────────────────────────────────────────────────────────
// CE QUE CETTE RÈGLE REFUSE, ET POURQUOI CHAQUE MOTIF
//
//  1. UN TAUX APPROXIMATIF UNIVERSEL — « autour de 25 % », « environ 20 % ».
//     Une commission dépend de la plateforme, de l'offre, du pays et parfois de
//     la course. « Autour de » ne rend pas un chiffre inventé acceptable : il
//     le rend seulement plus difficile à contester.
//
//  2. UN MONTANT DÉRIVÉ — « il te reste 18,75 € », « tu touches 14 € ».
//     C'est le résultat d'un calcul qu'on n'a pas le droit de faire pour
//     quelqu'un dont on ne connaît ni la commission ni les charges.
//
//  3. LA PROMESSE « NET RÉEL ». Un net exige la commission réelle, le carburant,
//     la distance, la consommation, l'assurance, l'entretien, le véhicule et le
//     statut fiscal. FOREAS n'en connaît qu'une partie. La formulation exacte de
//     ce que le produit sait faire est : « ce qu'il te reste, commission
//     déduite ».
//
// ⚠️ CE QU'ELLE NE DOIT PAS BLOQUER : le prix de l'abonnement, un barème de
// parrainage contractuel, « 0 € débité ». Le critère est simple — un chiffre
// que FOREAS FIXE est légitime ; un chiffre que FOREAS DEVINE sur l'argent du
// chauffeur ne l'est pas.
// Le texte est normalisé AVANT : espaces insécables, entités HTML, échappement
  // JSON et sauts de ligne sont ramenés à un espace simple. Sans ça, chacun de
  // ces encodages est un contournement — et deux d'entre eux ont déjà servi
  // aujourd'hui.
const normaliser = (t) =>
    String(t)
    .replace(/&nbsp;|&#160;|\u00a0/gi, ' ')
    .replace(/&euro;|&#8364;/gi, '€')
      .replace(/\\n|\\r|\\t/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
      .replace(/\s+/g, ' ')

const CALCULS = [
  {
    motif: /\b(?:autour de|environ|à peu près|approximativement|~)\s*\d{1,2}\s*(?:%|pour cent)/i,
      quoi: 'un taux approximatif présenté comme universel',
    },
    {
      motif: /\b(?:il te reste|tu touches|tu gardes|il lui reste|tu récupères)\s+(?:environ\s+)?\d+[.,]?\d*\s*€/i,
      quoi: 'un montant dérivé d’un calcul fait à la place du chauffeur',
    },
    {
      // ⚠️ IL ÉTAIT UNIDIRECTIONNEL. Il exigeait « commission » AVANT le nombre,
    // donc « 25 % de commission » — l'ordre le plus naturel en français — ne
    // déclenchait rien. /tarifs2 le servait en production.
    motif: /\bcommission\b[^.!?]{0,30}\b\d{1,2}\s*(?:%|pour cent)|\b\d{1,2}\s*(?:%|pour cent)[^.!?]{0,30}\bcommission\b/i,
      quoi: 'un taux de commission chiffré, alors qu’il dépend de la plateforme et de l’offre',
    },
    {
      motif: /\bnet\s+réel\b/i,
      quoi: 'la promesse d’un « net réel » que le produit ne sait pas calculer',
  },
]

/**
 * Le critère qui sépare le légitime de l'inventé, en une phrase :
 *
 *   un chiffre que FOREAS **fixe** est légitime ;
 *   un chiffre que FOREAS **devine** sur l'argent du chauffeur ne l'est pas.
 *
 * « Tu touches 25 € par filleul » est un barème contractuel : FOREAS décide ce
 * montant et s'y engage. « Il te reste 18,75 € » est une déduction faite à la
 * place de quelqu'un dont on ne connaît ni la commission ni les charges.
 *
 * ⚠️ Sans cette exception, la règle bloquait le barème de parrainage. Un
 * contrôle qui crie à tort finit désactivé — et c'est pire qu'aucun contrôle.
 */
const CONTEXTE_BAREME = /\b(filleul\w*|parrain\w*|apport d.affaires|partenaire\w*|commission d.apport)\b/i

const signalerCalcul = (ou, texte) => {
  const t = normaliser(texte)
  for (const c of CALCULS) {
    const m = t.match(c.motif)
    if (!m) continue
    // Le barème que FOREAS fixe lui-même n'est pas une déduction inventée.
    const autour = t.slice(Math.max(0, t.indexOf(m[0]) - 90), t.indexOf(m[0]) + m[0].length + 90)
    if (CONTEXTE_BAREME.test(autour)) continue
      infractions.push({
      fichier: ou,
      quoi: c.quoi,
        extrait: m[0],
      pourquoi:
        "Un calcul raconté en phrase échappe aux règles qui cherchent du code — c'est exactement ce qui a laissé « autour de 25 %, il te reste 18,75 € » en production après TROIS corrections. Une commission dépend de la plateforme et de l'offre ; un net exige des dépenses que FOREAS ne connaît pas. Dis ce que le produit fait vraiment : « ce qu'il te reste, commission déduite », avec la commission du chauffeur.",
    })
    return
  }
}

// Le code servi. (La base est passée au même crible plus bas.)
for (const chemin of fichiers(RACINE)) {
  const relatif = chemin.replace(RACINE + '/', '')
  if (relatif.includes('lib/verite-commerciale.ts')) continue
  const src = readFileSync(chemin, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
    .replace(/^\s*\/\/.*$/gm, ' ')
  signalerCalcul(relatif, src)
}

// ─── AUCUN TAUX EN DUR APPLIQUÉ À L'ARGENT D'UN CHAUFFEUR ──────────────────
//
// 🔴 CE QUE LE CALCULATEUR DE L'ACCUEIL FAISAIT JUSQU'AU 21/08/2026 :
//
//     commission = course * 0.45
//     tva        = apresCommission * 0.166
//     cotisations= apresTva * 0.11
//     gasoil     = course * 0.06        ← sur le PRIX, sans aucune distance
//
// Sur 25 €, il affichait 8,71 € « dans la poche ». Quatre défauts distincts :
//
//  · le taux de commission existait en TROIS exemplaires contradictoires dans
//    FOREAS (0,45 · 0,25 · 0,75 de part chauffeur), aucun mesuré. Sur la même
//    course, le site affichait 8,71 € ici et 18,75 € sur /revenus ;
//  · une commission dépend de la plateforme, de l'offre, du pays et parfois de
//    la course : un taux unique est faux pour presque tout le monde ;
//  · les trois taux de charges n'avaient AUCUNE source, et dépendent du statut
//    fiscal — que le site n'a jamais demandé ;
//  · le carburant croissait avec le PRIX de la course. Deux courses de même
//    distance, l'une à 20 € et l'autre à 60 €, n'ont pas consommé le même
//    gasoil. C'est physiquement faux.
//
// LA RÈGLE : un montant qui appartient à un chauffeur ne se multiplie pas par un
// nombre écrit en dur. Soit la valeur vient de lui, soit elle ne s'affiche pas.
{
  const FAMILLE = '(?:fare|montant|brut|gross|course|revenu|earning|gain|amount)'
  const motif = new RegExp(
    '\\b\\w*' + FAMILLE + '\\w*\\s*\\*\\s*0\\.\\d+|0\\.\\d+\\s*\\*\\s*\\w*' + FAMILLE + '\\w*\\b',
    'i',
  )
  for (const chemin of fichiers(RACINE)) {
    const relatif = chemin.replace(RACINE + '/', '')
    const source = readFileSync(chemin, 'utf8')
    const sansCommentaires = source
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
      .replace(/^\s*\/\/.*$/gm, ' ')
    const m = sansCommentaires.match(motif)
    if (!m) continue
    infractions.push({
      fichier: relatif,
      quoi: 'un taux écrit en dur appliqué à l’argent d’un chauffeur',
      extrait: m[0],
      pourquoi:
        "Une commission dépend de la plateforme, de l'offre et parfois de la course ; une charge dépend du statut fiscal. Le 21/08/2026, ce motif affichait 8,71 € « dans la poche » sur une course de 25 €, quand /revenus en annonçait 18,75 € — trois taux contradictoires coexistaient dans FOREAS, aucun mesuré. Soit la valeur vient du chauffeur, soit elle ne s'affiche pas.",
    })
  }
}

// ─── LA GARANTIE 30 JOURS NE S'ANNONCE PAS SANS SON GARDE ──────────────────
//
// ⚠️ 21/08/2026 — CE N'EST PAS UNE PROMESSE INVENTÉE, ET C'EST CE QUI REND LE
// CAS DIFFICILE. Le droit EXISTE : une clause écrite dans /cgu prévoit le
// remboursement intégral de la première période, sans justification, sur simple
// message. Ce qui manque, c'est le mécanisme :
//   · aucun délai de traitement annoncé — « sans discuter » ne dit pas « sous
//     combien de jours » ;
//   · aucun responsable nommé ;
//   · aucune trace qu'un remboursement ait jamais été traité — ni dans le code
//     des trois dépôts, ni en base.
//
// Une promesse de remboursement qu'on ne peut pas prouver honorer engage plus
// qu'elle ne rassure : le jour où quelqu'un la réclame et attend, c'est la
// parole de FOREAS qui tombe.
//
// LA RÈGLE : on cesse de la VENDRE, on continue de la DEVOIR. Toute surface
// commerciale qui la mentionne doit passer par `garantieAffichable()`.
//
// EXEMPTÉS, et pour deux raisons opposées :
//   · /cgu — c'est le CONTRAT. Retirer un droit du contrat en silence serait
//     pire que de ne pas l'avoir annoncé : un abonné qui le demande l'obtient ;
//   · verite-commerciale.ts — c'est la source qui décide.
{
  const MOTIFS = /30\s*(?:&nbsp;|\s)*jours[^.]{0,40}rembours|rembours[^.]{0,40}30\s*(?:&nbsp;|\s)*jours|satisfait[- ]ou[- ]rembours|garanti[e]?\s*30/i
  const EXEMPTS = ['app/cgu/', 'lib/verite-commerciale.ts', 'app/mentions-legales/', 'app/confidentialite/']
  for (const chemin of fichiers(RACINE)) {
    const relatif = chemin.replace(RACINE + '/', '')
    if (EXEMPTS.some((e) => relatif.includes(e))) continue
    const source = readFileSync(chemin, 'utf8')
    const sansCommentaires = source
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
      .replace(/^\s*\/\/.*$/gm, ' ')
    // ⚠️ On regarde une FENÊTRE, pas une ligne. Dans un ternaire écrit sur
    // plusieurs lignes, le garde se trouve deux lignes plus haut que le texte
    // qu'il protège. Un test ligne à ligne signalerait des cas parfaitement
    // gardés — un contrôle qui crie à tort finit désactivé, et c'est pire.
    const l = sansCommentaires.split('\n')
    let nonGardee = null
    for (let k = 0; k < l.length; k++) {
      if (!MOTIFS.test(l[k])) continue
      const fenetre = l.slice(Math.max(0, k - 3), k + 2).join(' ')
      if (fenetre.includes('garantieAffichable(')) continue
      nonGardee = l[k]
      break
    }
    if (!nonGardee) continue
    const m = [nonGardee.trim()]
    // ⚠️ 21/08/2026, SECONDE PASSE — L'EXEMPTION ÉTAIT AU FICHIER, PAS À
    // L'OCCURRENCE. Dès qu'un fichier contenait `garantieAffichable(` quelque
    // part, le fichier ENTIER était sauté. Résultat mesuré : neuf annonces de
    // /tarifs2, gardées seulement par un drapeau de tarification, n'étaient
    // jamais vues — dont « GARANTI 30 JOURS · ZÉRO RISQUE · TU DÉCIDES ».
    //
    // La règle prouvait qu'un fichier SANS garde est attrapé. Elle ne prouvait
    // jamais qu'un fichier AVEC garde est ENTIÈREMENT gardé. C'est la même
    // faute que « vérifier la forme au lieu de l'identité ».
    //
    // On regarde maintenant chaque occurrence dans SA ligne.
    infractions.push({
      fichier: relatif,
      quoi: 'la garantie 30 jours annoncée sans passer par son garde',
      extrait: m[0].slice(0, 60),
      pourquoi:
        "Le droit existe au contrat (/cgu) mais son mécanisme n'est pas prouvé : aucun délai, aucun responsable, aucun remboursement jamais traité. Une promesse qu'on ne peut pas prouver honorer engage plus qu'elle ne rassure. Passe par garantieAffichable() depuis src/lib/verite-commerciale.ts — le jour où les trois manques sont comblés, un seul drapeau la rallume partout.",
    })
  }
}

// ─── L'ACCUEIL DOIT MENER À LA CAISSE ───────────────────────────────────────
//
// 🔴 MESURÉ LE 21/08/2026 sur le HTML servi de la page d'accueil :
// ZÉRO occurrence de « tarifs2 », SIX liens WhatsApp. Le bouton du menu qui
// s'appelait « Souscrire » ouvrait lui aussi une conversation.
//
// Depuis la porte d'entrée du site, la page où l'on paie était inatteignable
// autrement qu'en tapant l'adresse à la main. Ce n'est pas un bouton oublié :
// c'est un site qui envoie tout le monde discuter et espère que la discussion
// vendra. Résultat mesuré : 0 € jamais attribué au site.
//
// Cette règle relit les composants montés sur l'accueil. Si plus aucun ne
// pointe vers l'offre, elle échoue — avant le déploiement, pas après.
{
  const accueil = join(RACINE, 'app/page.tsx')
  if (existsSync(accueil)) {
    const page = readFileSync(accueil, 'utf8')

    // Les composants réellement montés, lus dans le JSX de l'accueil.
    const montes = [...page.matchAll(/<([A-Z][A-Za-z0-9]*)\b/g)].map((m) => m[1])
    const sources = [page]
    for (const nom of new Set(montes)) {
      for (const chemin of fichiers(RACINE)) {
        if (chemin.endsWith(`/${nom}.tsx`)) sources.push(readFileSync(chemin, 'utf8'))
      }
    }

    // ⚠️ ON RETIRE LES COMMENTAIRES AVANT DE CHERCHER.
    // Premier jet de cette règle : elle passait au vert sur l'ancienne version
    // du site. La cause : ZoneCapPartnerCTA.tsx citait « /tarifs2 » dans un
    // commentaire d'explication. Un commentaire qui parle d'un lien n'est pas
    // un lien — et il suffisait à rendre ce garde-fou inutile.
    const sansCommentaires = (src) =>
      src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ')

    // Et on exige un CHEMIN, pas une mention : un href, ou le crochet qui
    // fabrique l'adresse de l'offre.
    const motifLien = /href=\{?['"`]?[^'"`}\s]*tarifs2|useLienOffre\s*\(|lienOffre\s*\(/

    const versLOffre = sources.some((src) => motifLien.test(sansCommentaires(src)))
    if (!versLOffre) {
      infractions.push({
        fichier: 'src/app/page.tsx',
        quoi: "aucun chemin de l'accueil vers la page de paiement",
        extrait: `${montes.length} composants montés, aucun ne mène à /tarifs2`,
        pourquoi:
          "Le 21/08/2026, l'accueil offrait six sorties WhatsApp et zéro lien vers /tarifs2 : un visiteur décidé ne pouvait pas payer. WhatsApp a sa place — en action secondaire, pour aider à décider. L'action principale doit mener à l'offre.",
      })
    }
  }
}

// ─── LE TEXTE QUI NE VIT PAS DANS LE DÉPÔT ──────────────────────────────────
//
// 🔴 MESURÉ LE 21/08/2026 : ce programme était AU VERT pendant que la production
// servait « 7 plateformes » six fois et « en direct » sept fois sur /surge.
//
// La cause : RACINE vaut 'src'. Or 100 % du texte des dix pages fabriquées en
// série vit dans la table `landing_pages` de Supabase, pas dans le dépôt. Le
// canon ne l'a jamais lu. Il gardait une porte, pendant que le texte entrait par
// la fenêtre.
//
// C'est le défaut le plus instructif du programme : un contrôle qui ne couvre
// pas la source RÉELLE du contenu ne protège rien — et il est pire qu'absent,
// parce qu'un vert rassure.
//
// ⚠️ SI LA BASE EST INJOIGNABLE, CE CONTRÔLE ÉCHOUE. Il ne passe pas « faute de
// données ». Un contrôle qui s'annule quand il ne peut pas mesurer est
// exactement le motif qu'on a passé la journée à corriger ailleurs.
//
// La clé utilisée est la clé PUBLIQUE : cette table est de la donnée éditoriale
// publique. Aucun secret n'est nécessaire, donc aucun secret n'est manipulé ici.
console.log('\n── Le texte des pages fabriquées en série (base de données) ──')
{
  // Ce programme tourne en `node` nu : contrairement à Next.js, il ne charge pas
  // les fichiers d'environnement tout seul. On les lit donc à la main, sans
  // dépendance. Sur Vercel, les variables sont déjà dans l'environnement de
  // construction : cette boucle ne fait alors rien.
  for (const nom of ['.env.local', '.env.production', '.env']) {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) break
    try {
      for (const ligne of readFileSync(nom, 'utf8').split('\n')) {
        const m = ligne.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/)
        if (!m) continue
        const val = m[2].trim().replace(/^["']|["']$/g, '')
        if (!process.env[m[1]] && val) process.env[m[1]] = val
      }
    } catch {
      /* fichier absent : on passe au suivant */
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  // On accepte l'ancienne clé publique comme la nouvelle : pendant la bascule
  // des clés Supabase, les deux coexistent. Les deux sont PUBLIQUES par
  // conception — aucun secret n'est manipulé ici.
  const cle =
    process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !cle) {
    infractions.push({
      fichier: 'landing_pages (base de données)',
      quoi: 'le canon ne peut pas lire le texte des pages fabriquées en série',
      extrait: 'NEXT_PUBLIC_SUPABASE_URL, ou aucune clé publique (SUPABASE_PUBLISHABLE_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY)',
      pourquoi:
        "Le 21/08/2026, ce programme était au vert pendant que la production servait « 7 plateformes » et « en direct » — parce qu'il ne lisait que src/. Le texte de ces pages vit en base. Sans accès, ce contrôle ne peut RIEN affirmer, et un contrôle qui ne peut rien affirmer doit échouer, pas passer.",
    })
  } else {
    let lignes = null
    try {
      const r = await fetch(
        `${url}/rest/v1/landing_pages?select=topic_slug,active,headline,pattern_interrupt_stat,epiphany_bridge_story,boule_de_cristal,aha_moment,cta_text,meta_title,meta_description,desire_vs_reality,credibility_proof,content`,
        { headers: { apikey: cle, Authorization: `Bearer ${cle}` } },
      )
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      lignes = await r.json()
    } catch (e) {
      infractions.push({
        fichier: 'landing_pages (base de données)',
        quoi: 'la base est injoignable — le canon ne peut pas vérifier ce texte',
        extrait: String(e.message).slice(0, 80),
        pourquoi:
          "Ce contrôle échoue plutôt que de passer en silence : un vert obtenu faute de mesure est un mensonge de plus, pas une absence d'information.",
      })
    }

    if (Array.isArray(lignes)) {
      const actives = lignes.filter((l) => l.active !== false)
      console.log(`  ℹ️  ${actives.length} page(s) active(s) lue(s) en base`)

      // ── AUCUN NOM DU REGISTRE DANS LE TEXTE DE LA BASE ──────────────────
      //
      // 🔴 21/08/2026, TROISIÈME JUMEAU HORS DÉPÔT DE LA JOURNÉE.
      //
      // Les six preuves sociales du site ont été masquées le matin : cartes,
      // carrousel, notifications, deux pages, puis les dix pages en série.
      // Toutes ces corrections portaient sur du CODE.
      //
      // Pendant ce temps, /optimisation servait dans sa description indexée :
      //     « Travailler moins pour avoir plus » — <prénom + initiale>, 5 ans de VTC
      //
      // Un filtre posé sur des objets de témoignage ne peut rien contre une
      // chaîne de caractères écrite dans une colonne. Le grep sur src/ était
      // propre, et le nom partait quand même chez Google.
      //
      // Cette règle lit la BASE et y cherche les noms du registre. Elle ne
      // s'active que pour les personnes dont l'accord n'est pas signé.

      // ── LE MÊME CRIBLE SUR LE TEXTE DE LA BASE ──────────────────────────
      //
      // C'est ICI que « autour de 25 %, il te reste 18,75 € » a survécu à trois
      // corrections : le calcul n'était pas dans le code, il était raconté dans
      // le corps du récit, en base.
      for (const ligne of actives) {
        signalerCalcul(
          `landing_pages → ${ligne.topic_slug}`,
          [
            ligne.headline, ligne.meta_title, ligne.meta_description,
            ligne.pattern_interrupt_stat, ligne.epiphany_bridge_story,
            ligne.boule_de_cristal, ligne.aha_moment, ligne.cta_text,
            // ⚠️ CES DEUX COLONNES ÉTAIENT RAMENÉES PAR LA REQUÊTE ET JAMAIS
            // PASSÉES AU CRIBLE. Ce sont exactement celles qui portaient
            // « ~25 % — vérifiable sur ton propre relevé » et « Ton net réel,
            // commission déduite ». `.filter(Boolean)` avale un champ absent EN
            // SILENCE : oublier une colonne ici ne produit aucune erreur, juste
            // un vert faux et indétectable.
            texteDeContenu(ligne.content),
            texteDeContenu(ligne.credibility_proof),
            texteDeContenu(ligne.desire_vs_reality),
          ].filter(Boolean).join(' \n '),
        )
      }

      for (const ligne of actives) {
        const texte = [
          ligne.headline, ligne.meta_title, ligne.meta_description,
          ligne.pattern_interrupt_stat, ligne.epiphany_bridge_story,
          ligne.boule_de_cristal, ligne.aha_moment, ligne.cta_text,
          // ⚠️ `proof_items` est EXCLU — et cette exclusion ne vaut QUE parce que la
          // page le filtre AVANT de servir. Une règle plus bas garde cette garde.
          texteDeContenu(ligne.content),
        ].filter(Boolean).join(' ')
        for (const p of PERSONNES_NON_APPROUVEES) {
          if (!new RegExp('\\b' + p + '\\b', 'i').test(texte)) continue
          infractions.push({
            fichier: `landing_pages → ${ligne.topic_slug}`,
            quoi: 'le nom d’une personne dont l’accord n’est pas signé, dans le texte servi',
            extrait: p,
            pourquoi:
              "Les six accords du registre sont « en attente », sans preuve enregistrée. Un filtre posé sur du code ne peut rien contre un nom écrit en toutes lettres dans une colonne : il part quand même dans la description que Google affiche. Retire le nom, ou fais signer l’accord et passe le statut à « approuve ».",
          })
        }
      }

      // ── UN CHIFFRE DE LA DESCRIPTION INDEXÉE DOIT EXISTER DANS LA PAGE ──
      //
      // 🔴 CETTE RÈGLE VIENT D'UNE ERREUR QUE J'AI FAITE MOI-MÊME, LE 21/08/2026.
      //
      // La page /aeroport annonçait « c'est une course à 24 €/h », un chiffre
      // dérivable d'AUCUNE des durées que la page énonce elle-même : son corps dit
      // 90 min d'attente + 40 min de trajet, soit 2 h 10, et 60 € sur 2 h 10 font
      // 27,69 €/h. Il aurait fallu 2 h 30 pour tomber sur 24.
      //
      // J'ai corrigé le titre, mesuré, et « 24 €/h » apparaissait ENCORE trois fois
      // dans le HTML servi. La cause : `meta_description` est une COLONNE de la
      // table, pas une clé du JSON `content`. J'avais interrogé
      // `content->>'meta_description'`, obtenu NULL, et conclu qu'il n'y avait rien
      // à corriger.
      //
      // Et l'endroit oublié était le PIRE des deux : une description meta est ce que
      // Google AFFICHE dans ses résultats, et elle y reste après correction.
      //
      // La règle : tout nombre écrit dans la description doit se retrouver quelque
      // part dans le texte de la page. Une description qui porte un chiffre que la
      // page ne dit plus est un chiffre orphelin — exactement ce qui vient d'arriver.
      for (const ligne of actives) {
        const description = ligne.meta_description || ''
        if (!description) continue
        const corps = [
          ligne.headline, ligne.pattern_interrupt_stat, ligne.epiphany_bridge_story,
          ligne.boule_de_cristal, ligne.aha_moment, ligne.cta_text, ligne.meta_title,
          JSON.stringify(ligne.content ?? ''),
        ].filter(Boolean).join(' ')
        // Les nombres significatifs seulement : deux chiffres ou plus, ou une
        // décimale. « 3 jours » ou « 0 € » ne se comparent pas utilement.
        const nombres = [...description.matchAll(/\d+(?:[.,]\d+)?/g)]
          .map((m) => m[0])
          .filter((n) => n.length > 1)
        for (const n of new Set(nombres)) {
          if (corps.includes(n)) continue
          infractions.push({
            fichier: `landing_pages → ${ligne.topic_slug} (colonne meta_description)`,
            quoi: 'un chiffre dans la description indexée que la page ne dit nulle part',
            extrait: n,
            pourquoi:
              "La description meta est ce que Google AFFICHE dans ses résultats, et elle y reste après correction de la page. Un chiffre qui n'existe que là est un chiffre orphelin : personne ne le relit, et il survit à toutes les corrections du texte visible. C'est exactement ce qui est arrivé au « 24 €/h » de /aeroport.",
          })
        }
      }

      // ── CHAQUE PAGE ACTIVE DOIT ÊTRE ATTEIGNABLE ────────────────────────
      //
      // 🔴 MESURÉ LE 21/08/2026 : onze pages actives en base, DIX sujets
      // connus du code. La onzième porte l'identifiant « go » — le même mot
      // que la route statique qui envoie vers les boutiques.
      //
      // Next.js sert une route statique avant une route dynamique. Donc
      // /go renvoie vers l'App Store (vérifié en production) et la page
      // n'est affichable NULLE PART. Elle est active depuis le 4 avril 2026.
      // Son texte est entretenu — ses formulations ont été corrigées ce
      // matin même — et aucun visiteur ne l'a jamais vue.
      //
      // Personne ne pouvait s'en apercevoir : rien n'échoue, rien n'alerte.
      // Une page dans le vide ressemble en tout point à une page qui marche.
      for (const ligne of actives) {
        const sujet = ligne.topic_slug
        if (SUJETS.includes(sujet)) continue
        const raison = MOTS_RESERVES.includes(sujet)
          ? `le mot « ${sujet} » est déjà pris par une route statique de /go, qui gagne toujours`
          : `le sujet « ${sujet} » n'est pas dans src/lib/sujets.ts`
        infractions.push({
          fichier: `landing_pages → ${sujet}`,
          quoi: 'une page active que personne ne peut afficher',
          extrait: raison,
          pourquoi:
            "Une page active et inatteignable est une panne totalement silencieuse : elle compte dans les rapports, son texte est relu et corrigé, et elle ne sert jamais à personne. Soit tu lui donnes un identifiant libre inscrit dans src/lib/sujets.ts, soit tu la passes à active = false.",
        })
      }
      for (const ligne of actives) {
        const texte = [
          ligne.headline, ligne.pattern_interrupt_stat, ligne.epiphany_bridge_story,
          ligne.boule_de_cristal, ligne.aha_moment, ligne.cta_text,
          ligne.meta_title, ligne.meta_description,
          JSON.stringify(ligne.desire_vs_reality ?? ''), JSON.stringify(ligne.credibility_proof ?? ''),
          JSON.stringify(ligne.content ?? ''),
        ].filter(Boolean).join(' \n ')

        for (const regle of REGLES) {
          // Les exemptions de REGLES portent sur des CHEMINS de fichiers ; elles
          // n'ont pas de sens ici. On applique la règle telle quelle.
          const m = texte.match(regle.motif)
          if (!m) continue
          const i = texte.indexOf(m[0])
          infractions.push({
            fichier: `landing_pages → ${ligne.topic_slug}`,
            quoi: regle.quoi,
            extrait: texte.slice(Math.max(0, i - 55), i + m[0].length + 45).trim(),
            pourquoi: regle.pourquoi,
          })
        }
      }
    }
  }
}

// ─── LES COULEURS DU SITE DISENT-ELLES CE QUE DIT LA CHARTE ? ──────────────
//
// Le 21/08/2026, `src/design/tokens.ts` portait en en-tête : « Source de vérité :
// ~/FOREAS-Clean/src/design/tokens.v2.ts ». C'est-à-dire l'APP. Or la charte a
// désigné `FOREAS-SHARED/tokens.json` comme la source machine qui l'emporte.
//
// Le commentaire nommait la mauvaise autorité, et personne ne pouvait le voir :
// il ne s'exécute pas. Résultat, un jeton avait déjà divergé — `textPrimary`
// valait `#FFFFFF` alors que la charte a retiré le blanc pur de la palette
// texte le 06/08. Le jeton n'avait AUCUN usage : c'est précisément pour ça que
// la dérive a duré. Un jeton mort qui ment reste un jeton qui ment.
//
// ⚠️ CETTE RÈGLE NE PEUT PAS TOUJOURS S'EXÉCUTER. Le dossier partagé n'existe
// pas sur l'hébergeur, et c'est voulu : le site doit se fabriquer sans lui.
// Alors elle le DIT. Elle ne se tait pas, et elle ne se déclare pas verte.
// Un contrôle qui saute en silence est pire que pas de contrôle : il rassure.

{
  const cheminPartage = join(process.env.HOME || '', 'FOREAS-SHARED', 'tokens.json')
  const cheminLocal = 'src/design/tokens.ts'

  if (!existsSync(cheminPartage)) {
    console.warn('')
    console.warn('⚠️  RÈGLE NON EXÉCUTÉE : couleurs du site vs charte partagée.')
    console.warn(`    ${cheminPartage} est introuvable depuis ici.`)
    console.warn('    Ce n’est PAS un succès. Les couleurs n’ont pas été comparées.')
    console.warn('    (Attendu sur l’hébergeur : le dossier partagé n’y est pas déployé.)')
    console.warn('')
  } else if (!existsSync(cheminLocal)) {
    infractions.push({
      fichier: cheminLocal,
      quoi: 'le fichier des jetons du site a disparu',
      extrait: '(fichier absent)',
      pourquoi: 'sans lui, plus rien ne relie les couleurs du site à la charte.',
    })
  } else {
    const partage = JSON.parse(readFileSync(cheminPartage, 'utf8'))
    const local = readFileSync(cheminLocal, 'utf8')

    // Ce que la charte fixe, et où ça vit dans les jetons du site.
    const A_COMPARER = [
      ['obsidian',      partage?.surfaceBackground?.site],
      ['obsidianDeep',  partage?.color?.obsidian?.deep],
      ['obsidianLight', partage?.color?.obsidian?.light],
      ['cyanElectric',  partage?.color?.accent?.cyanElectric],
      ['cyanIce',       partage?.color?.accent?.cyanIce],
      ['violetRoyal',   partage?.color?.accent?.violetRoyal],
      ['violetDeep',    partage?.color?.accent?.violetDeep],
      ['goldSubtle',    partage?.color?.accent?.goldSubtle],
      ['goldRadiant',   partage?.color?.accent?.goldRadiant],
      ['success',       partage?.color?.semantic?.success],
      ['warning',       partage?.color?.semantic?.warning],
      ['danger',        partage?.color?.semantic?.danger],
      ['textPrimary',   partage?.color?.text?.primary],
    ]

    let comparees = 0
    for (const [cle, attendu] of A_COMPARER) {
      // Une valeur absente de la charte ne prouve rien : on ne la compte pas
      // comme vérifiée, et on ne l'invente pas non plus.
      if (typeof attendu !== 'string' || !attendu.startsWith('#')) continue

      const m = local.match(new RegExp(`\\b${cle}:\\s*'([^']+)'`))
      if (!m) {
        infractions.push({
          fichier: cheminLocal,
          quoi: `la couleur « ${cle} » de la charte n’existe pas dans les jetons du site`,
          extrait: `charte : ${attendu} · site : absente`,
          pourquoi: 'un composant qui la cherchera écrira une couleur en dur à la place.',
        })
        continue
      }
      comparees++
      if (m[1].toLowerCase() !== attendu.toLowerCase()) {
        infractions.push({
          fichier: cheminLocal,
          quoi: `la couleur « ${cle} » du site contredit la charte`,
          extrait: `site : ${m[1]} · charte v${partage?.$meta?.version ?? '?'} : ${attendu}`,
          pourquoi:
            'la charte est la source machine et l’emporte. Corrige le site, ' +
            'ou fais d’abord changer tokens.json — jamais l’inverse en silence.',
        })
      }
    }

    console.log(
      `   couleurs comparées à la charte v${partage?.$meta?.version ?? '?'} : ${comparees}`,
    )
  }
}

// ─── AJNAYA NE PROPOSE QUE DES PAGES QUI EXISTENT ─────────────────────────
//
// Le 21/08/2026, le prompt d'Ajnaya offrait « [Voir les témoignages]
// (/chauffeurs#testimonials) ». L'ancre n'existait plus : les témoignages
// avaient été retirés faute d'accords écrits. Ajnaya invitait donc les
// visiteurs à aller voir une preuve qu'on venait délibérément de retirer.
//
// Et le lien vivait dans les DEUX fichiers jumeaux — route.ts ET
// ajnayaChatCore.ts — comme cinq autres choses avant lui dans ce projet.
//
// Cette règle relit les liens que le prompt propose et vérifie que la route
// existe dans le dépôt. Elle ne vérifie PAS les ancres (#...) : ça demanderait
// de rendre la page. Elle le dit plutôt que de laisser croire le contraire.

{
  const FICHIERS_DE_PROMPT = [
    'src/app/api/ajnaya/chat/route.ts',
    'src/lib/ajnayaChatCore.ts',
  ]

  // Les routes que le dépôt sait servir.
  const routes = new Set()
  const explorer = (dossier, prefixe) => {
    for (const e of readdirSync(dossier, { withFileTypes: true })) {
      if (!e.isDirectory()) continue
      if (e.name.startsWith('_') || e.name.startsWith('.')) continue
      // (marketing) et consorts : groupes, invisibles dans l'URL.
      const segment = e.name.startsWith('(') ? '' : `/${e.name}`
      const chemin = join(dossier, e.name)
      if (existsSync(join(chemin, 'page.tsx'))) routes.add(prefixe + segment || '/')
      explorer(chemin, prefixe + segment)
    }
  }
  if (existsSync('src/app')) {
    if (existsSync('src/app/page.tsx')) routes.add('/')
    explorer('src/app', '')
  }

  let liens = 0
  let ancresNonVerifiees = 0
  for (const f of FICHIERS_DE_PROMPT) {
    if (!existsSync(f)) continue
    const texte = readFileSync(f, 'utf8')
    for (const m of texte.matchAll(/\]\((\/[A-Za-z0-9\-_/]*)(#[A-Za-z0-9\-_]+)?\)/g)) {
      const chemin = m[1].replace(/\/$/, '') || '/'

      // ⚠️ 21/08 — PREMIÈRE VERSION DE CETTE RÈGLE : elle ne regardait que le
      // chemin. Elle passait donc au VERT sur le lien qui l'a fait naître —
      // `/chauffeurs#testimonials` — parce que `/chauffeurs` existe bel et bien.
      // Seule l'ANCRE était morte. Une règle qui ne rattrape pas le bug qui l'a
      // motivée est une règle décorative.
      //
      // On cherche donc l'ancre dans tout le dépôt. C'est une heuristique : un
      // identifiant fabriqué à l'exécution échapperait au contrôle. Mais un
      // identifiant écrit en clair — le cas courant — ne passe plus.
      if (m[2]) {
        const ancre = m[2].slice(1)
        const motif = new RegExp(`id=["'\`]${ancre}["'\`]|id=\\{["'\`]${ancre}`)
        let trouvee = false
        const chercher = (dossier) => {
          if (trouvee) return
          for (const e of readdirSync(dossier, { withFileTypes: true })) {
            if (trouvee) return
            const chemin = join(dossier, e.name)
            if (e.isDirectory()) { if (e.name !== 'node_modules') chercher(chemin); continue }
            if (!['.tsx', '.ts'].includes(extname(e.name))) continue
            if (motif.test(readFileSync(chemin, 'utf8'))) trouvee = true
          }
        }
        chercher('src')
        if (!trouvee) {
          infractions.push({
            fichier: `${f} (prompt d’Ajnaya)`,
            quoi: `Ajnaya propose l’ancre « ${m[2]} », qui n’existe nulle part dans le site`,
            extrait: m[0],
            pourquoi:
              'Le visiteur arrive sur la page et ne trouve rien à l’endroit ' +
              'annoncé. C’est exactement ce qui est arrivé avec les témoignages : ' +
              'retirés faute d’accords, mais toujours annoncés par Ajnaya.',
          })
          continue
        }
        ancresNonVerifiees++
      }
      // Une route dynamique ([topic]) couvre ses enfants : on ne juge que ce
      // qui est écrit en clair.
      if (routes.has(chemin)) { liens++; continue }
      infractions.push({
        fichier: `${f} (prompt d’Ajnaya)`,
        quoi: `Ajnaya propose « ${chemin} », qui n’est pas une page du site`,
        extrait: m[0],
        pourquoi:
          'Ajnaya envoie le visiteur dans le vide. Le pire cas est le lien vers ' +
          'une preuve qu’on vient de retirer : il annonce ce qu’on a décidé de ' +
          'ne plus montrer.',
      })
    }
  }
  console.log(
    `   liens du prompt d’Ajnaya vérifiés : ${liens}` +
      (ancresNonVerifiees
        ? ` (${ancresNonVerifiees} ancre(s) # retrouvée(s) dans le dépôt)`
        : ''),
  )
}

// ─── LIRE LE REGISTRE N'EST PAS AVOIR LA PERMISSION ────────────────────────
//
// Le 21/08/2026, /cap servait TROIS PERSONNES RÉELLES — nommées, citées,
// localisées — alors que les six accords sont au statut « en attente ».
//
// Le fichier importait `citationDe`, `personneDe` et `villeDe` du registre des
// consentements. Il lisait donc la source d'autorité... pour y prendre la
// parole, jamais pour demander la permission. Le garde `temoignagePubliable()`
// existait, et était appelé dans CINQ autres fichiers. Celui-là était le seul
// oublié — et un commentaire au-dessus du bloc constatait déjà que rien n'était
// signé, pendant que le code publiait.
//
// La règle : qui lit une parole du registre doit demander si elle est publiable.
// Elle ne juge pas l'affichage — elle rend l'oubli visible.

{
  const LECTURE = /\b(citationDe|personneDe|villeDe|TEMOIGNAGES|temoignageDe)\b/
  // ⚠️ 21/08/2026 — CE MOTIF CHERCHAIT LE NOM, PAS L'APPEL.
  //
  // Il valait `/\btemoignagePubliable(ParNom)?\b/`. Testé en retirant le filtre
  // de /cap : la règle est restée MUETTE, parce que le nom du garde figurait
  // encore dans la ligne `import`. Importer une permission n'est pas la
  // demander — c'est précisément la faute que cette règle existe pour attraper,
  // et elle l'aurait laissée passer.
  //
  // On exige donc une parenthèse ouvrante : un APPEL, pas une mention. Et on
  // retire les lignes d'import avant de chercher, pour qu'aucune déclaration ne
  // puisse passer pour un usage.
  const PERMISSION = /\btemoignagePubliable(ParNom)?\s*\(/

  const fichiers = []
  const explorer = (dossier) => {
    for (const e of readdirSync(dossier, { withFileTypes: true })) {
      const chemin = join(dossier, e.name)
      if (e.isDirectory()) { if (e.name !== 'node_modules') explorer(chemin); continue }
      if (['.ts', '.tsx'].includes(extname(e.name))) fichiers.push(chemin)
    }
  }
  if (existsSync('src')) explorer('src')

  let surveilles = 0
  for (const f of fichiers) {
    // Le registre lui-même définit les deux : il n'est pas son propre appelant.
    if (f.endsWith('consentements.ts')) continue
    const brut = readFileSync(f, 'utf8')
    if (!brut.includes("lib/consentements") && !brut.includes("'./consentements'")) continue

    // On lit le CODE, pas les commentaires : un commentaire qui cite le nom du
    // garde a déjà fait passer une règle au vert dans ce projet.
    const code = sansCommentaires(brut).replace(/^\s*import[^\n]*$/gm, ' ')
    if (!LECTURE.test(code)) continue

    surveilles++
    if (!PERMISSION.test(code)) {
      infractions.push({
        fichier: f,
        quoi: 'ce fichier lit la parole de quelqu’un sans jamais demander si elle est publiable',
        extrait: (code.match(LECTURE) || ['?'])[0],
        pourquoi:
          'importer le registre des accords ne vaut pas avoir l’accord. Appelle ' +
          'temoignagePubliable(id) avant d’afficher — ou n’affiche pas.',
      })
    }
  }
  console.log(`   fichiers qui citent quelqu’un, et demandent la permission : ${surveilles}`)
}

// ─── UN REPLI INVISIBLE REND UNE PANNE INVISIBLE ───────────────────────────
//
// Le 21/08/2026, /cap — la page de l'offre partenaire, une surface d'argent —
// répondait 200, servait 612 mots de HTML, et affichait VINGT-HUIT CARACTÈRES
// à l'écran. Le contenu restait dans une zone de préparation masquée que le
// navigateur ne révélait jamais.
//
// La frontière responsable portait `fallback={null}`. C'est ce détail qui a
// rendu la panne indétectable pendant des semaines :
//   · un repli qui AFFICHE quelque chose montre un écran d'attente bloqué —
//     tout le monde voit qu'il y a un problème ;
//   · un repli à `null` montre une page vide, ce qui ressemble à une page qui
//     charge. On attend, on s'en va, on n'en parle à personne.
//
// Cette règle ne juge pas Suspense — elle exige que l'attente SE VOIE.

{
  const pages = []
  const explorer = (dossier) => {
    for (const e of readdirSync(dossier, { withFileTypes: true })) {
      const chemin = join(dossier, e.name)
      if (e.isDirectory()) { if (e.name !== 'node_modules') explorer(chemin); continue }
      if (['.tsx'].includes(extname(e.name))) pages.push(chemin)
    }
  }
  if (existsSync('src/app')) explorer('src/app')

  let frontieres = 0
  for (const f of pages) {
    const brut = readFileSync(f, 'utf8')
    if (!brut.includes('<Suspense')) continue
    const code = sansCommentaires(brut)
    for (const m of code.matchAll(/<Suspense[^>]*fallback=\{\s*(null|undefined|<>\s*<\/>)\s*\}/g)) {
      frontieres++
      infractions.push({
        fichier: f,
        quoi: 'une attente invisible : `fallback={null}`',
        extrait: m[0].slice(0, 80),
        pourquoi:
          'si cette frontière reste bloquée, le visiteur voit une page VIDE et ' +
          'croit qu’elle charge. C’est exactement ce qui a caché la panne de ' +
          '/cap. Donne un repli qui se voit — un squelette, un fond, un mot.',
      })
    }
    // Compter les frontières saines pour que la règle prouve qu'elle a regardé.
    for (const _ of code.matchAll(/<Suspense/g)) frontieres += 0
  }
  const total = pages.filter((f) => readFileSync(f, 'utf8').includes('<Suspense')).length
  console.log(`   pages avec une attente, et dont l’attente se voit : ${total - frontieres}/${total}`)
}

// ─── Verdict ────────────────────────────────────────────────────────────────

if (infractions.length === 0) {
  console.log('✅ Canon respecté — aucune affirmation interdite dans le texte affiché.')
  process.exit(0)
}

console.error(`\n❌ ${infractions.length} affirmation(s) interdite(s) dans le texte affiché :\n`)
for (const i of infractions) {
  console.error(`  ${i.fichier}`)
  console.error(`    interdit : ${i.quoi}`)
  console.error(`    extrait  : …${i.extrait}…`)
  console.error(`    pourquoi : ${i.pourquoi}\n`)
}
console.error('Corrige le texte, ou — si la mesure a changé — mets à jour')
console.error('src/lib/verite-commerciale.ts ET la règle correspondante ici.')
console.error('Ne désactive jamais une règle sans nouvelle mesure à l’appui.\n')
process.exit(1)

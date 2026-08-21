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
      const source = readFileSync(chemin, 'utf8')
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

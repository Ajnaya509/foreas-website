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

import { readFileSync, readdirSync, statSync } from 'node:fs'
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
      'api/checkout crée la session avec payment_method_collection:"always" : la carte EST enregistrée. Vrai uniquement pour le CHAT gratuit — si c’est ce cas, écris « sans compte » ou précise « pour discuter ».',
    exceptions: [/experience/],
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
    motif: /\bl['’]IA\b|\bDG IA\b|\bnotre IA\b|\bIA FOREAS\b|\bcompta IA\b/i,
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
    .replace(/&nbsp;|&#160;/g, ' ') //        entités
    .replace(/\{'\s*'\}/g, ' ') //            {' '} de JSX
    .replace(/\s+/g, ' ')
}

// ─── Contrôle ───────────────────────────────────────────────────────────────

const infractions = []

for (const chemin of fichiers(RACINE)) {
  if (EXEMPTS.some((e) => chemin.includes(e))) continue
  const affiche = texteAffiche(readFileSync(chemin, 'utf8'))
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

#!/usr/bin/env node
/**
 * FOREAS — TESTS DE LA PORTE CHOISIE PAR LE CODE (essai / whatsapp / aucune).
 *
 * La décision est une fonction pure : elle se teste sans réseau. Chaque cas est
 * une phrase telle qu'un chauffeur l'écrit vraiment, et le verdict attendu.
 * Il y a des ROUGES volontaires : un test qui ne peut pas échouer ne protège rien.
 *
 *   node scripts/tests-porte-ajnaya.mjs
 */
import { execSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const dossier = mkdtempSync(join(tmpdir(), 'porte-'))
const sortie = join(dossier, 'porteAjnaya.mjs')
execSync(`npx esbuild src/lib/porteAjnaya.ts --format=esm --outfile=${sortie} --log-level=error`)
const { choisirPorte } = await import(sortie)

const CAS = [
  // ── chaud → essai ──
  [['Roissy', 'c\'est combien ?'], 'essai'],
  [['ok je veux bien tester'], 'essai'],
  [['C’est gratuit ton truc ?'], 'essai'],
  [['ok'], 'essai'],
  [['oui'], 'essai'],
  [['et je m\'inscris où ?'], 'essai'],
  [['il faut une carte ?'], 'essai'],
  [['c\'est combien', 'et ça marche à Orly aussi ?'], 'essai'],   // chaud il y a un message, détail maintenant
  // ── par défaut → whatsapp ──
  [['Orly'], 'whatsapp'],
  [['je roule surtout la nuit, ça change quoi ?'], 'whatsapp'],
  [['trop cher pour moi'], 'whatsapp'],                            // objection ≠ refus
  [['et par rapport à ce que fait Bolt ?'], 'whatsapp'],
  [[], 'whatsapp'],
  // ── refus → aucune, et il gagne sur le chaud ──
  [['non merci'], 'aucune'],
  [['c\'est une arnaque votre truc'], 'aucune'],
  [['laisse tomber'], 'aucune'],
  [['stop'], 'aucune'],
  [['c\'est combien', 'non merci, pas intéressé'], 'aucune'],      // refus sur le dernier message
  [['non merci', 'bon ok vas-y'], 'essai'],                        // un vieux non n'éteint pas un ok
]

let echecs = 0
for (const [messages, attendu] of CAS) {
  const { porte, motif } = choisirPorte(messages)
  const ok = porte === attendu
  if (!ok) echecs++
  console.log(`  ${ok ? '✅' : '❌'} ${JSON.stringify(messages)} → ${porte} (${motif})${ok ? '' : `  attendu : ${attendu}`}`)
}

// ── LE ROUGE VOLONTAIRE : les réponses d'Ajnaya ne doivent JAMAIS être lues ──
// Si quelqu'un passe l'historique complet au lieu des seuls messages du
// chauffeur, sa propre bascule (« prends les 3 jours ») rend tout le monde chaud.
const piege = choisirPorte(['Orly', 'Ça, c’est la mécanique du métier : prends les 3 jours, carte demandée.'])
const rougeOk = piege.porte === 'essai'
console.log(`  ${rougeOk ? '✅' : '❌'} ROUGE ATTENDU : une réponse d'Ajnaya glissée dans l'entrée rend chaud → ${piege.porte} (${piege.motif})`)
console.log('     → c\'est POURQUOI l\'appelant ne doit lui passer que les messages du chauffeur.')
if (!rougeOk) echecs++

console.log(echecs ? `\n${echecs} échec(s)` : '\ntout tient')
process.exit(echecs ? 1 : 0)

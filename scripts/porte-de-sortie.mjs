#!/usr/bin/env node
/**
 * FOREAS — PORTE DE SORTIE. Contrôle de la PRODUCTION, après déploiement.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI CE FICHIER EXISTE
 *
 * `scripts/verifier-canon.mjs` contrôle le DÉPÔT avant la construction. Ce
 * fichier-ci contrôle ce que le monde voit VRAIMENT. Les deux sont nécessaires,
 * et pour une raison mesurée le 14/08/2026 : le dépôt peut être irréprochable
 * pendant que la production sert encore autre chose.
 *
 * Ce jour-là, trois pièges ont coûté du temps précisément parce que personne
 * n'avait de contrôle automatique côté production :
 *   · une phrase corrigée dans le code était encore servie par le cache Vercel
 *     — j'ai cru à une régression pendant plusieurs minutes ;
 *   · `/api/diagnostic` a publié la clé Anthropic pendant des semaines, et
 *     `GET /api/checkout` la clé Stripe LIVE, sans que rien ne l'annonce ;
 *   · un marqueur de déploiement mal choisi (`Hero.tsx`, qui ne sert que /509)
 *     m'a fait attendre 26 fois un déploiement déjà en ligne.
 *
 * La règle qui en découle : la production observée prime sur le code déployé,
 * qui prime sur le dépôt. Ce script applique cette hiérarchie.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * USAGE
 *
 *   node scripts/porte-de-sortie.mjs
 *   node scripts/porte-de-sortie.mjs https://mon-deploiement.vercel.app
 *
 * Sort en code 1 si un contrôle échoue.
 */

const BASE = process.argv[2] ?? 'https://www.foreas.xyz'

const PAGES = [
  '/', '/tarifs2', '/chauffeurs', '/professionnels', '/technologie',
  '/a-propos', '/experience', '/ou-ca-paie', '/cap', '/checkout',
  '/cgu', '/confidentialite', '/mentions-legales',
]

/** Ce qu'aucune page publique ne doit contenir. Voir scripts/verifier-canon.mjs. */
const INTERDITS = [
  { motif: /7\s*(plateformes|apps)/i, quoi: '« 7 plateformes »' },
  { motif: /51\s*(&nbsp;|\s)*zones/i, quoi: '« 51 zones »' },
  { motif: /\bl['’]IA\b|compta IA/i, quoi: 'le mot « IA »' },
  { motif: /tirelire/i, quoi: '« tirelire URSSAF »' },
  { motif: /sans carte/i, quoi: '« sans carte »' },
  { motif: /rien à annuler/i, quoi: '« rien à annuler »' },
  { motif: /147\s*(chauffeurs|actifs)/i, quoi: '« 147 chauffeurs »' },
  { motif: /77,60|\b97\s*€\s*ce mois/i, quoi: 'un prix de l’ancienne grille' },
]

/** Routes qui ne doivent RIEN livrer à un inconnu. */
const PORTES = [
  { chemin: '/api/diagnostic', methode: 'GET', attendu: [404], quoi: 'outil de diagnostic' },
  { chemin: '/api/ajnaya/chat/completions', methode: 'POST', attendu: [404], quoi: 'pont LLM' },
  { chemin: '/api/tts', methode: 'POST', attendu: [403], quoi: 'voix Koraly (quota ElevenLabs)' },
  { chemin: '/api/ajnaya/chat', methode: 'POST', attendu: [403], quoi: 'cerveau Ajnaya' },
  { chemin: '/api/ajnaya/home-modal', methode: 'POST', attendu: [403], quoi: 'chat d’accueil' },
  { chemin: '/api/pixel/capi', methode: 'POST', attendu: [403], quoi: 'conversions Meta' },
  { chemin: '/api/identity/capture', methode: 'POST', attendu: [403], quoi: 'répertoire d’identité' },
]

let echecs = 0
const dire = (ok, texte) => {
  console.log(`  ${ok ? '✅' : '❌'} ${texte}`)
  if (!ok) echecs++
}

async function lire(chemin) {
  // Le paramètre aléatoire contourne le cache : sans lui, on contrôle une photo
  // du passé et on conclut faux dans les deux sens.
  const r = await fetch(`${BASE}${chemin}${chemin.includes('?') ? '&' : '?'}_pds=${Date.now()}`, {
    headers: { 'Cache-Control': 'no-cache' },
  })
  return { statut: r.status, corps: await r.text() }
}

console.log(`\n🚪 Porte de sortie — ${BASE}\n`)

console.log('── Les pages répondent ──')
const corps = {}
for (const p of PAGES) {
  try {
    const { statut, corps: c } = await lire(p)
    corps[p] = c
    dire(statut === 200, `${p} → HTTP ${statut}`)
  } catch (e) {
    dire(false, `${p} → injoignable : ${e.message}`)
  }
}

console.log('\n── Aucune affirmation interdite n’est servie ──')
for (const { motif, quoi } of INTERDITS) {
  const fautives = PAGES.filter((p) => corps[p] && motif.test(corps[p]))
  dire(fautives.length === 0, `${quoi} — ${fautives.length ? fautives.join(', ') : 'nulle part'}`)
}

console.log('\n── Les portes sont fermées à un inconnu ──')
for (const { chemin, methode, attendu, quoi } of PORTES) {
  try {
    const r = await fetch(`${BASE}${chemin}`, {
      method: methode,
      ...(methode === 'POST'
        ? { headers: { 'Content-Type': 'application/json' }, body: '{}' }
        : {}),
    })
    dire(attendu.includes(r.status), `${chemin} (${quoi}) → ${r.status}, attendu ${attendu.join('/')}`)
  } catch (e) {
    dire(false, `${chemin} → ${e.message}`)
  }
}

console.log('\n── Aucun secret n’est publié ──')
try {
  const { corps: c } = await lire('/api/checkout')
  const fuite = /sk_live|sk_test|keyPrefix|hasKey|eyJ[A-Za-z0-9_-]{20}/.test(c)
  dire(!fuite, 'GET /api/checkout ne publie ni clé ni indice de clé')
} catch (e) {
  dire(false, `GET /api/checkout → ${e.message}`)
}

console.log('\n── Le prix facturé est le prix affiché ──')
try {
  const r = await fetch(`${BASE}/api/subscription/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: BASE },
    body: JSON.stringify({ plan: 'elite_monthly' }),
  })
  const t = await r.text()
  dire(
    r.status === 400 && /n['’]est plus proposée/.test(t),
    'une formule hors catalogue (elite_monthly, 247 €) est refusée',
  )
} catch (e) {
  dire(false, `/api/subscription/create → ${e.message}`)
}

console.log(
  echecs === 0
    ? '\n✅ Porte franchie — la production dit la vérité et ses portes sont fermées.\n'
    : `\n❌ ${echecs} contrôle(s) en échec. Ne pas envoyer de trafic sur cet état.\n`,
)
process.exit(echecs === 0 ? 0 : 1)

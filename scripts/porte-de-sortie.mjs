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

console.log('\n── Les backends Railway ne livrent rien à un inconnu ──')
//
// ⚠️ Ces routes ne sont PAS sur foreas.xyz : elles vivent sur deux backends
// Railway jumeaux. Elles sont contrôlées ICI parce que c'est ici que se trouve
// la seule porte automatique de l'écosystème — et parce qu'un rapport a pu
// affirmer pendant des heures qu'elles fuyaient 100 courses réelles alors que
// le caviardage était déjà en place. Une affirmation de sécurité qui n'est pas
// rejouée par une machine est une affirmation qui périme en silence.
//
// Ce qu'on vérifie : un inconnu n'obtient RIEN (404), et si jamais une réponse
// revenait, elle ne porterait aucun champ nominatif renseigné.
const BACKENDS = [
  'https://foreas-stripe-backend-production.up.railway.app',
  'https://foreas-ai-backend-production.up.railway.app',
]
const ROUTES_BOLT = ['/api/bolt/drivers', '/api/bolt/orders/all', '/api/bolt/stats', '/api/bolt/vehicles']

for (const base of BACKENDS) {
  const nom = base.replace('https://', '').split('-production')[0]
  for (const route of ROUTES_BOLT) {
    try {
      const r = await fetch(`${base}${route}`, { headers: { 'Cache-Control': 'no-cache' } })
      if (r.status === 404 || r.status === 401 || r.status === 403) {
        dire(true, `${nom}${route} → ${r.status} (fermé)`)
        continue
      }
      // La porte est ouverte : on vérifie AU MOINS qu'aucun champ nominatif
      // n'est renseigné. On ne lit jamais les valeurs, on compte.
      const t = await r.text()
      const nominatifs = (t.match(/"(phone|first_name|last_name|email|plate|address)"\s*:\s*(?!null)(?!"")/g) || []).length
      dire(false, `${nom}${route} → ${r.status} OUVERT · ${nominatifs} champ(s) nominatif(s) RENSEIGNÉ(S)`)
    } catch (e) {
      dire(false, `${nom}${route} → injoignable : ${e.message}`)
    }
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

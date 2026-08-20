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

console.log('\n── Les routes qui DÉPENSENT refusent un inconnu ──')
//
// 20/08/2026 — ajouté après un audit adverse. Trois routes Claude Vision du
// backend Stripe (`moderate-media`, `vehicle/verify-photo`,
// `vehicle/documents/verify`) répondaient 400 sans le moindre en-tête : « ton
// corps est mal formé », pas « je ne te connais pas ». Elles ne demandaient
// RIEN. Et les cinq routes payantes du backend AI n'acceptaient qu'une clé
// écrite en dur dans le bundle de l'app, donc extractible de n'importe quel
// téléphone. Un 401 mesuré vaut mieux qu'un garde qu'on croit posé.
const ROUTES_PAYANTES = [
  ['https://foreas-stripe-backend-production.up.railway.app', '/api/communaute/moderate-media', 'Claude Vision'],
  ['https://foreas-stripe-backend-production.up.railway.app', '/api/vehicle/verify-photo', 'Claude Vision'],
  ['https://foreas-stripe-backend-production.up.railway.app', '/api/vehicle/documents/verify', 'Vision + écriture en base'],
  ['https://foreas-ai-backend-production.up.railway.app', '/api/ajnaya/chat', 'cerveau (et données personnelles)'],
  ['https://foreas-ai-backend-production.up.railway.app', '/api/ajnaya/transcribe', 'Whisper'],
  ['https://foreas-ai-backend-production.up.railway.app', '/api/ajnaya/synthesize', 'ElevenLabs'],
  ['https://foreas-ai-backend-production.up.railway.app', '/api/ajnaya/llm', 'Claude'],
  ['https://foreas-ai-backend-production.up.railway.app', '/api/ajnaya/process', 'Whisper + Claude + ElevenLabs'],
]

for (const [base, route, quoi] of ROUTES_PAYANTES) {
  const nom = base.replace('https://', '').split('-production')[0]
  try {
    const r = await fetch(`${base}${route}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    })
    dire(
      r.status === 401 || r.status === 403 || r.status === 404,
      `${nom}${route} (${quoi}) → ${r.status}, attendu 401/403/404`,
    )
  } catch (e) {
    dire(false, `${nom}${route} → ${e.message}`)
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

console.log('\n── Le saut vers l\'app marche sur les trois appareils ──')
//
// Une route de redirection s'écrit une fois et ne se revérifie jamais. La
// version d'origine de /go était cassée sur les TROIS appareils pendant des
// mois : identifiant App Store resté à l'état de gabarit (404), deux « ? » dans
// l'URL Google Play (le paramètre devenait une partie du nom de paquet), et une
// boucle sur ordinateur. Personne ne l'avait vu.
const AGENTS_TEST = {
  iPhone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X)',
  Android: 'Mozilla/5.0 (Linux; Android 14; Pixel 8)',
  ordinateur: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
}
const ATTENDU = { iPhone: 'apps.apple.com', Android: 'play.google.com', ordinateur: '/tarifs2' }

for (const [appareil, agent] of Object.entries(AGENTS_TEST)) {
  try {
    const r = await fetch(`${BASE}/go/zones`, { redirect: 'manual', headers: { 'User-Agent': agent } })
    const vers = r.headers.get('location') ?? ''
    dire(vers.includes(ATTENDU[appareil]), `${appareil} → ${vers.slice(0, 52)}`)
  } catch (e) {
    dire(false, `${appareil} → ${e.message}`)
  }
}

// Le test qui compte : personne ne doit pouvoir fabriquer un lien en foreas.xyz
// qui emmène ailleurs.
try {
  const r = await fetch(`${BASE}/go/zones?url=https://exemple-malveillant.test`, {
    redirect: 'manual',
    headers: { 'User-Agent': AGENTS_TEST.ordinateur },
  })
  const vers = r.headers.get('location') ?? ''
  dire(!vers.includes('exemple-malveillant'), `aucune redirection ouverte → ${vers.slice(0, 46)}`)
} catch (e) {
  dire(false, `redirection ouverte → ${e.message}`)
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

// ─── LES QUATRE ROUTES FERMÉES LE 20/08 AU SOIR ─────────────────────────────
//
// Trouvées par relecture adverse, APRÈS une première passe qui les avait
// manquées. Trois d'entre elles répondaient 400 ou 200 — jamais 401 — et
// ressemblaient donc à des portes fermées sans en être.
//
// Elles sont ici pour la même raison que les routes Bolt : le 14/08, un
// caviardage déployé une heure après un rapport avait rendu ce rapport faux sans
// que personne ne le sache. Une affirmation de sécurité qui n'est pas rejouée
// par une machine périme en silence.
console.log('\n── Les routes fermées par la relecture adverse ──')
const UUID_INVENTE = '00000000-0000-4000-8000-000000000000'
const ROUTES_FERMEES = [
  { chemin: '/api/coach/instant-decision', methode: 'POST', quoi: 'décision de course' },
  { chemin: '/api/coach/record-outcome', methode: 'POST', quoi: 'résultat de course' },
  { chemin: `/api/voice/calls/${UUID_INVENTE}`, methode: 'GET', quoi: 'comptes rendus d’appel' },
]
for (const base of BACKENDS) {
  const nom = base.includes('stripe') ? 'stripe' : 'ia'
  for (const { chemin, methode, quoi } of ROUTES_FERMEES) {
    try {
      const r = await fetch(base + chemin, {
        method: methode,
        headers: { 'Content-Type': 'application/json' },
        ...(methode === 'POST' ? { body: '{}' } : {}),
      })
      dire(r.status === 401 || r.status === 404, `${nom}${chemin.slice(0, 34)} (${quoi}) → ${r.status}, attendu 401/404`)
    } catch (e) {
      dire(false, `${nom}${chemin} → ${e.message}`)
    }
  }
}

// ─── LE FRIGO RESTE OUVERT, MAIS SANS PRÉNOM ────────────────────────────────
//
// /api/coach/decision-context ne peut PAS être fermé : tous les téléphones déjà
// installés l'appellent toutes les trois minutes sans aucun en-tête. Deux choses
// à vérifier, et elles tirent en sens opposés — c'est voulu :
//   · il répond toujours (le fermer casserait le Coach partout)
//   · il ne renvoie plus de prénom à qui ne prouve rien
console.log('\n── Le frigo du Coach : vivant, mais sans donnée nominative ──')
for (const base of BACKENDS) {
  const nom = base.includes('stripe') ? 'stripe' : 'ia'
  try {
    const r = await fetch(`${base}/api/coach/decision-context?driver_id=${UUID_INVENTE}`)
    const j = await r.json().catch(() => ({}))
    dire(r.status === 200, `${nom} frigo répond → ${r.status}, attendu 200 (le fermer casserait le Coach)`)
    dire(j.first_name === '' || j.first_name === undefined, `${nom} frigo sans jeton → aucun prénom renvoyé`)
  } catch (e) {
    dire(false, `${nom} frigo → ${e.message}`)
  }
}

// ─── LES PORTES DÉDIÉES SONT-ELLES POSÉES, OU SEULEMENT FERMÉES ? ───────────
//
// Une porte close et une clé jamais configurée donnent le même 404 vu du dehors.
// Le point de santé publie des booléens (jamais des valeurs) pour les
// distinguer. `cle_bolt_posee: false` est ACCEPTABLE et attendu aujourd'hui —
// on ne le fait pas échouer, on l'AFFICHE, pour que l'état soit su.
console.log('\n── État des portes dédiées (lisible, sans aucun secret) ──')
try {
  const r = await fetch('https://foreas-ai-backend-production.up.railway.app/api/ajnaya/pieuvre-health')
  const j = await r.json()
  const p = j.portes_dediees || {}
  dire(typeof p.cle_bolt_posee === 'boolean', `le voyant existe (clé Bolt posée : ${p.cle_bolt_posee})`)
  dire(p.sel_analytics_pose === true, `sel d’anonymisation des IP posé → ${p.sel_analytics_pose}`)
  dire(p.secret_webhook_voix_pose === true, `secret des webhooks voix posé → ${p.secret_webhook_voix_pose}`)
} catch (e) {
  dire(false, `point de santé → ${e.message}`)
}

console.log(
  echecs === 0
    ? '\n✅ Porte franchie — la production dit la vérité et ses portes sont fermées.\n'
    : `\n❌ ${echecs} contrôle(s) en échec. Ne pas envoyer de trafic sur cet état.\n`,
)
process.exit(echecs === 0 ? 0 : 1)

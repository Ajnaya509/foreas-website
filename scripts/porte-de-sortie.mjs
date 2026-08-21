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

// ⚠️ 21/08/2026 — CETTE LISTE EN COMPTAIT TREIZE. Le plan du site en déclare
// VINGT-DEUX à Google. Neuf pages publiques n'étaient donc jamais vérifiées par
// cette porte, dont les dix pages fabriquées en série qui portent tout le
// référencement. Une porte de sortie qui ne regarde que la moitié des pages
// donne un feu vert sur une moitié inconnue.
const PAGES = [
  // Les pages écrites à la main
  '/', '/tarifs2', '/chauffeurs', '/professionnels', '/technologie',
  '/a-propos', '/experience', '/ou-ca-paie', '/cap', '/checkout', '/contact',
  '/reactivation', '/facturation-electronique-vtc-2026',
  // Les pages légales
  '/cgu', '/confidentialite', '/mentions-legales',
  // Les dix pages fabriquées en série, servies depuis la base
  '/revenus', '/charges', '/clients', '/aeroport', '/airbnb',
  '/surge', '/premium', '/optimisation', '/flotte', '/evenements',
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

/**
 * ⚠️ 20/08/2026 — CE COMMENTAIRE DISAIT UNE CHOSE FAUSSE, ET C'EST INSTRUCTIF.
 *
 * Il affirmait : « le paramètre aléatoire contourne le cache ». MESURÉ : il ne le
 * contourne pas. Deux appels avec deux valeurs différentes de `_pds`, plus
 * l'en-tête `Cache-Control: no-cache`, rendent la MÊME empreinte, `x-vercel-cache:
 * HIT`, âge 440 secondes. Ces pages sont pré-calculées (`x-nextjs-prerender: 1`) :
 * la chaîne de requête n'entre pas dans la clé de cache, et un en-tête de requête
 * ne force pas la revalidation au bord du réseau.
 *
 * C'est exactement la faute que cette porte est censée attraper : une protection
 * qu'on croit avoir. Le paramètre reste (il ne coûte rien et sert sur les routes
 * dynamiques), mais on ne prétend plus qu'il suffit.
 *
 * CE QU'ON FAIT À LA PLACE : on relève l'ÂGE de la réponse et on le rend visible.
 * Un contrôle ne peut pas rendre le cache plus frais ; il peut dire honnêtement
 * qu'il lit peut-être une photo du passé. Sans ça, un contrôle vert juste après
 * une mise en ligne ne prouve rien — il valide l'ancienne version.
 */
let ageMaxObserve = 0

async function lire(chemin) {
  const r = await fetch(`${BASE}${chemin}${chemin.includes('?') ? '&' : '?'}_pds=${Date.now()}`, {
    headers: { 'Cache-Control': 'no-cache' },
  })
  const age = Number(r.headers.get('age') || 0)
  if (Number.isFinite(age) && age > ageMaxObserve) ageMaxObserve = age
  // ⚠️ `fetch` suit les redirections par défaut. Sans cette comparaison,
  // /checkout affichait « HTTP 200 » alors qu'il renvoie 308 vers /tarifs2 —
  // et le corps analysé pour ce chemin était en réalité celui de /tarifs2,
  // donc les contrôles de texte passaient deux fois sur la même page en
  // croyant en couvrir deux. Un contrôle qui se trompe de page est pire qu'un
  // contrôle absent : il rend un vert sur une surface jamais regardée.
  const arrivee = new URL(r.url).pathname
  const demande = chemin.split('?')[0]
  return { statut: r.status, corps: await r.text(), age, redirigeVers: arrivee !== demande ? arrivee : null }
}

console.log(`\n🚪 Porte de sortie — ${BASE}\n`)

console.log('── Les pages répondent ──')
const corps = {}
for (const p of PAGES) {
  try {
    const { statut, corps: c, redirigeVers } = await lire(p)
    corps[p] = c
    dire(statut === 200, `${p} → HTTP ${statut}${redirigeVers ? ` (redirigé vers ${redirigeVers} — le texte analysé est celui de l'arrivée)` : ''}`)
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

// ─── LE RÉFÉRENCEMENT AUSSI SE REJOUE ───────────────────────────────────────
//
// Trois commits du 20/08 ont refait les adresses de référence, le plan du site et
// les données structurées. Aucun n'avait laissé la moindre ligne ici : le travail
// reposait sur une mesure faite à la main, qui périme en silence — exactement ce
// que cette porte existe pour empêcher.
//
// Ce qui est vérifié, et pourquoi :
//   · chaque page du plan du site répond, et porte UNE adresse de référence
//   · toutes ces adresses sont en « www » (l'apex redirige : une adresse de
//     référence qui pointe une redirection s'annule elle-même)
//   · sur les pages qui portent des données structurées, l'identifiant déclaré
//     dit la MÊME chose que la balise. Deux signaux qui se contredisent valent
//     moins qu'un seul signal clair.
console.log('\n── Le plan du site et les adresses de référence ──')
try {
  const rSitemap = await fetch(`${BASE}/sitemap.xml`)
  const xml = await rSitemap.text()
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
  dire(urls.length > 0, `le plan du site liste ${urls.length} page(s)`)
  dire(
    urls.every((u) => u.startsWith('https://www.')),
    `les ${urls.length} adresses du plan sont en www — ${urls.filter((u) => !u.startsWith('https://www.')).slice(0, 3).join(', ') || 'toutes'}`,
  )

  let sansCanonique = []
  let contradictions = []
  for (const u of urls) {
    const r = await fetch(u, { headers: { 'Cache-Control': 'no-cache' } })
    const html = await r.text()
    const can = html.match(/rel="canonical"\s+href="([^"]+)"/)?.[1]
    if (!can) { sansCanonique.push(u); continue }
    if (!can.startsWith('https://www.')) contradictions.push(`${u} → canonique ${can}`)
    // Données structurées : @id, url et mainEntityOfPage doivent rester en www.
    for (const m of html.matchAll(/"(?:@id|url|mainEntityOfPage)":"(https:\/\/foreas\.xyz[^"]*)"/g)) {
      contradictions.push(`${u} → données structurées ${m[1]}`)
    }
    // ⚠️ 21/08/2026 — CE CONTRÔLE NE VÉRIFIAIT QUE LA FORME, JAMAIS L'IDENTITÉ.
    //
    // Il exigeait seulement que l'adresse de partage commence par `https://www.`.
    // Résultat : NEUF pages annonçaient `https://www.foreas.xyz` — l'accueil —
    // et passaient au vert. Partager /tarifs2 affichait l'aperçu de l'accueil et
    // menait à l'accueil : la page de prix était impartageable, et le contrôle
    // certifiait l'inverse.
    //
    // Une vérification de forme ne remplace jamais une vérification d'identité.
    const og = html.match(/property="og:url"\s+content="([^"]+)"/)?.[1]
    if (og) {
      const attendu = u.replace(/\/$/, '')
      const obtenu = og.replace(/\/$/, '')
      if (obtenu !== attendu) contradictions.push(`${u} → og:url ${og}`)
    }
  }
  dire(sansCanonique.length === 0, `toutes les pages ont une adresse de référence — ${sansCanonique.slice(0, 3).join(', ') || 'aucune manquante'}`)
  dire(
    contradictions.length === 0,
    `aucun signal ne contredit l'adresse de référence — ${contradictions.slice(0, 3).join(' · ') || 'aucune contradiction'}`,
  )
} catch (e) {
  dire(false, `plan du site → ${e.message}`)
}

// ─── OÙ EN EST LA BASCULE DE CLÉ, COMPOSANT PAR COMPOSANT ───────────────────
//
// Pendant une bascule, « ce composant est-il migré ? » ne doit pas se répondre
// en devinant. Sans ces voyants, un composant déjà basculé et un composant qui
// ne l'est pas se ressemblent exactement — jusqu'au jour où on désactive
// l'ancienne clé et où l'un des deux tombe.
//
// Ces contrôles n'ÉCHOUENT PAS tant que la bascule n'est pas lancée : `ancienne`
// est l'état normal aujourd'hui. Ils AFFICHENT. Ce qui est refusé, c'est
// `absente` — un composant serveur sans clé ne travaille pas.
console.log('\n── Bascule des clés Supabase (état, pas jugement) ──')
{
  const composants = [
    { nom: 'site', url: `${BASE}/api/etat-migration`, champ: (j) => j.cle_serveur },
    {
      nom: 'serveur IA',
      url: 'https://foreas-ai-backend-production.up.railway.app/api/ajnaya/pieuvre-health',
      champ: (j) => j.migration_cle_supabase,
    },
    {
      nom: 'serveur Stripe',
      url: 'https://foreas-stripe-backend-production.up.railway.app/api/ajnaya/pieuvre-health',
      champ: (j) => j.migration_cle_supabase,
    },
  ]
  for (const c of composants) {
    try {
      const r = await fetch(c.url, { headers: { 'Cache-Control': 'no-cache' } })
      const j = await r.json()
      const etat = c.champ(j)
      dire(etat === 'nouvelle' || etat === 'ancienne', `${c.nom} → clé « ${etat} »`)
      if (etat === 'ancienne') {
        console.log(`     ℹ️  normal aujourd'hui. Deviendra « nouvelle » quand la clé dédiée sera posée.`)
      }
    } catch (e) {
      dire(false, `${c.nom} → voyant injoignable : ${e.message}`)
    }
  }
}

// ─── L'ACCUEIL MÈNE-T-IL À LA CAISSE ? ──────────────────────────────────────
//
// 🔴 MESURÉ LE 21/08/2026 sur le HTML servi de l'accueil : ZÉRO occurrence de
// « tarifs2 », SIX liens WhatsApp. Le bouton du menu nommé « Souscrire » ouvrait
// lui aussi une conversation. Depuis la porte d'entrée du site, la page où l'on
// paie était inatteignable autrement qu'en tapant l'adresse à la main.
//
// Ce contrôle vit ICI, en plus de la règle dans verifier-canon.mjs, parce que
// les deux ne prouvent pas la même chose : le canon lit le DÉPÔT, cette porte
// lit ce que la PRODUCTION sert réellement. Une leçon déjà payée : un garde qui
// lit le dépôt ne dit rien de ce qui tourne.
console.log('\n── L\'accueil mène-t-il à la caisse ? ──')
{
  const html = corps['/'] ?? ''
  const versLaCaisse = (html.match(/tarifs2/g) ?? []).length
  const versWhatsApp = (html.match(/wa\.me|api\.whatsapp/g) ?? []).length
  dire(versLaCaisse > 0, `accueil → ${versLaCaisse} lien(s) vers /tarifs2 (il en faut au moins 1)`)
  console.log(`     ℹ️  et ${versWhatsApp} lien(s) WhatsApp — normal, c'est l'aide à la décision.`)
}

// ─── AUCUN NET CALCULÉ DANS UN MESSAGE ENVOYÉ AU NOM DU CHAUFFEUR ───────────
//
// 🔴 MESURÉ LE 21/08/2026 : l'accueil affichait 8,71 € net et son PROPRE bouton
// pré-remplissait « je touche environ 14€ net », à quarante pixels de là. Les
// deux sortaient du même composant. À 100 €, l'écart passait de 34,82 € affiché
// à 56 € annoncé.
//
// ⚠️ CE DÉFAUT A ÉCHAPPÉ À UNE RECHERCHE DE « 14 € » PARCE QUE LE CHIFFRE EST
// URL-ENCODÉ dans le lien : %2014%E2%82%AC. On cherche donc la forme encodée.
console.log('\n── Le message envoyé au nom du chauffeur ──')
{
  for (const page of ['/', '/ou-ca-paie']) {
    const html = corps[page] ?? ''
    // « je touche environ NN€ net », sous n'importe quel encodage.
    const encode = /je(?:%20|\+|\s)touche(?:%20|\+|\s)environ/i.test(html)
    dire(!encode, `${page} → ${encode ? 'un net est AFFIRMÉ dans le message pré-rempli' : 'aucun net affirmé dans le message'}`)
  }
}

// ─── LES PORTES FERMÉES LE 21/08 LE SONT-ELLES ENCORE ? ─────────────────────
//
// Une porte fermée dans le dépôt et rouverte par un déploiement raté ne fait
// aucun bruit. On le redemande à la production, à chaque passage.
console.log('\n── Les portes fermées le 21/08 ──')
{
  const FERMEES_SITE = [
    { chemin: '/api/subscription/contact', methode: 'POST', quoi: 'écriture Stripe sans authentification' },
    { chemin: '/api/checkout/activate', methode: 'POST', quoi: 'activation d\'abonnement' },
    { chemin: '/api/checkout/verify', methode: 'GET', quoi: 'vérification d\'abonnement' },
  ]
  for (const { chemin, methode, quoi } of FERMEES_SITE) {
    try {
      const r = await fetch(BASE + chemin, {
        method: methode,
        headers: { 'Content-Type': 'application/json' },
        ...(methode === 'POST' ? { body: '{}' } : {}),
      })
      dire(r.status === 404, `${chemin} (${quoi}) → ${r.status}, attendu 404`)
    } catch (e) {
      dire(false, `${chemin} → ${e.message}`)
    }
  }
}

// ─── UN SUJET INCONNU DOIT LE DIRE ──────────────────────────────────────────
//
// /go/<n'importe quoi> redirigeait vers /tarifs2 exactement comme un vrai sujet,
// à l'attribution près. Donc une faute de frappe dans le bouton d'une page —
// /go/aeroprot — continuait de « marcher » en perdant son attribution POUR
// TOUJOURS, sans que rien ne l'annonce. Un lien interne cassé doit se voir.
console.log('\n── Les liens de sortie vers l\'offre ──')
{
  try {
    const r = await fetch(`${BASE}/go/ce-sujet-nexiste-pas`, { redirect: 'manual' })
    dire(r.status === 404, `/go/<sujet inconnu> → ${r.status}, attendu 404`)
  } catch (e) {
    dire(false, `/go/<sujet inconnu> → ${e.message}`)
  }
  try {
    const r = await fetch(`${BASE}/go/aeroport`, { redirect: 'manual' })
    const dest = r.headers.get('location') ?? ''
    dire(
      r.status === 307 && dest.includes('utm_campaign=aeroport'),
      `/go/aeroport → ${r.status}, attribution ${dest.includes('utm_campaign=aeroport') ? 'présente' : 'PERDUE'}`,
    )
  } catch (e) {
    dire(false, `/go/aeroport → ${e.message}`)
  }
}

// ─── LE WEBHOOK STRIPE REFUSE-T-IL CE QUI NE VIENT PAS DE STRIPE ? ──────────
//
// Deux contrôles opposés, et c'est voulu :
//   · un appel SANS en-tête de signature doit être refusé (400) ;
//   · un appel AVEC une signature invalide doit l'être aussi (400).
//
// Le second prouve en plus que le SECRET est bien configuré : sans lui, la
// route ne pourrait pas distinguer une signature fausse d'une vraie.
//
// ⚠️ POURQUOI CE CONTRÔLE EXISTE : avant le 21/08/2026, l'absence de signature
// ET l'absence de secret renvoyaient toutes deux 200 « bien reçu ». Or Stripe
// lit un 200 comme une livraison réussie et ne réessaie jamais. Si le secret
// disparaissait de l'environnement, TOUS les abonnements se seraient perdus en
// silence, sans une seule erreur nulle part.
console.log('\n── Le webhook de paiement ──')
{
  try {
    const r = await fetch(`${BASE}/api/webhooks/stripe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    })
    dire(r.status === 400, `sans signature → ${r.status}, attendu 400`)
  } catch (e) {
    dire(false, `webhook sans signature → ${e.message}`)
  }
  try {
    const r = await fetch(`${BASE}/api/webhooks/stripe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'stripe-signature': 't=1,v1=invalide' },
      body: '{}',
    })
    dire(r.status === 400, `signature invalide → ${r.status}, attendu 400 (prouve que le secret est posé)`)
  } catch (e) {
    dire(false, `webhook signature invalide → ${e.message}`)
  }
}

// ─── LA MESURE ARRIVE-T-ELLE VRAIMENT ? ─────────────────────────────────────
//
// Deux choses opposées à vérifier, et c'est voulu :
//   · la route accepte un événement de page (sinon on ne compte plus rien) ;
//   · elle REFUSE un abonnement annoncé par le navigateur.
//
// Le second point est le plus important. Un abonnement déduit d'une page de
// remerciement est un chiffre inventé : n'importe qui pourrait déclarer autant
// de ventes qu'il veut en appelant la route. On ne teste PAS l'écriture ici —
// une porte de sortie ne doit pas salir la table qu'elle surveille.
console.log('\n── La mesure ──')
{
  try {
    const r = await fetch(`${BASE}/api/mesure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ evenement: 'SubscriptionConfirmed', page: '/porte-de-sortie' }),
    })
    dire(r.status === 403, `un abonnement annoncé par le navigateur → ${r.status}, attendu 403`)
  } catch (e) {
    dire(false, `/api/mesure → ${e.message}`)
  }
  try {
    // Événement volontairement invalide : prouve que la route vit et valide,
    // sans écrire une seule ligne.
    const r = await fetch(`${BASE}/api/mesure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    dire(r.status === 400, `un événement sans nom → ${r.status}, attendu 400 (la route vit et valide)`)
  } catch (e) {
    dire(false, `/api/mesure → ${e.message}`)
  }
}

// ─── FRAÎCHEUR DE CE QU'ON VIENT DE LIRE ────────────────────────────────────
//
// Ne fait PAS échouer la porte : un cache tiède est normal et sain. Mais le
// chiffre doit être SU. S'il est élevé juste après une mise en ligne, les
// contrôles ci-dessus ont validé la version PRÉCÉDENTE — vert sur du vieux.
console.log('\n── Fraîcheur des pages lues ──')
{
  const minutes = Math.round(ageMaxObserve / 60)
  console.log(
    `  ℹ️  page la plus ancienne servie : ${ageMaxObserve}s (~${minutes} min).` +
      (ageMaxObserve > 900
        ? ` ⚠️ Au-delà d'un quart d'heure : si tu viens de mettre en ligne, relance dans quelques minutes — ces contrôles ont pu valider la version précédente.`
        : ''),
  )
}

console.log(
  echecs === 0
    ? '\n✅ Porte franchie — la production dit la vérité et ses portes sont fermées.\n'
    : `\n❌ ${echecs} contrôle(s) en échec. Ne pas envoyer de trafic sur cet état.\n`,
)
process.exit(echecs === 0 ? 0 : 1)

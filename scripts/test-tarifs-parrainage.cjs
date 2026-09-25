/* Component tests only. Real React hooks; all browser, Stripe and HTTP effects are fixtures.
 * No account, subscription, cookie or payment is touched outside this process.
 * Renderer is a declared development dependency of this site, aligned with its locked React version. */
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { createRequire } = require('node:module')
const { randomUUID } = require('node:crypto')
const siteRoot = path.resolve(__dirname, '..')
const siteRequire = createRequire(path.resolve(siteRoot, 'package.json'))
const React = siteRequire('react')
const Renderer = siteRequire('react-test-renderer')
const ts = require('typescript')
const { act } = Renderer
global.IS_REACT_ACT_ENVIRONMENT = true

function deferred() { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b }); return { promise, resolve, reject } }
function words(value) {
  if (value === null || value === undefined || typeof value === 'boolean') return ''
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (Array.isArray(value)) return value.map(words).join('')
  return words(value.props?.children ?? value.children)
}
function response(data, status = 200) { return { ok: status >= 200 && status < 300, status, json: async () => data } }

function harness({ initialAccount = { userId: 'auth-fixture', email: 'account@example.invalid', credential: 'fixture-credential', expiresAt: Math.floor(Date.now()/1000)+3600 }, url = 'https://www.foreas.xyz/tarifs3?formule=mensuel', cookies = {}, blockedCookies = false, denyCookieRemoval = false, onCheckout, onVerify, onPolicy, returning = false } = {}) {
  const jar = new Map(Object.entries(cookies))
  const cookieWrites = [], requests = [], payments = [], errors = [], mounts = []
  const browser = { location: new URL(url), history: { state: { fixture: 'preserved' } } }
  browser.history.replaceState = (state, title, value) => { browser.location = new URL(value, browser.location); browser.history.state = state }
  const document = {}
  Object.defineProperty(document, 'cookie', {
    get: () => blockedCookies ? '' : [...jar].map(([k, v]) => k + '=' + v).join('; '),
    set: value => {
      cookieWrites.push(value)
      if (blockedCookies) throw new Error('TEST_COOKIES_BLOCKED')
      if (denyCookieRemoval) return
      const [key, data] = value.split(';')[0].split('=')
      if (/Max-Age=0/.test(value)) jar.delete(key); else jar.set(key, data)
    },
  })
  let policy, publishAccount, currentAccount = initialAccount
  const fetchMock = async (url, options = {}) => {
    if (url.startsWith('/api/checkout/politique?')) {
      const formule = new URL(url, browser.location).searchParams.get('formule')
      const request = { url, options, account: currentAccount }
      const data = { ...policy.calculerDebitDuJour(formule, returning, Date.UTC(2026, 8, 8)), accountId: currentAccount?.userId, alreadySubscribed: false, confirmeParLeServeur: true }
      return onPolicy ? onPolicy(request, data) : response(data)
    }
    const request = { url, options, body: JSON.parse(options.body || '{}') }
    requests.push(request)
    if (url === '/api/parrainage/verifier') return onVerify ? onVerify(request) : response({ valide: true, remisePct: 10, dureeMois: 3, remisePermanente: false })
    if (url !== '/api/checkout') throw new Error('TEST_NETWORK_FORBIDDEN:' + url)
    const code = request.body.referral_code === '' ? null : request.body.referral_code || (blockedCookies ? null : jar.get('foreas_partner_ref')) || null
    const pct = code && request.body.plan === 'mensuel' ? 10 : 0
    request.success = overrides => response({
      clientSecret: 'test_secret_' + requests.length,
      accountId: currentAccount?.userId,
      debit: policy.calculerDebitDuJour(request.body.plan, returning, Date.UTC(2026, 8, 8)),
      referralCodeConfirmed: code,
      remiseParrainPct: pct,
      remiseHeritee: !!code && !request.body.referral_code,
      remiseDureeMois: pct ? 3 : null,
      remisePermanente: false,
      ...overrides,
    })
    return onCheckout ? onCheckout(request) : request.success()
  }
  function Provider({ options, children }) {
    const [result, setResult] = React.useState('pending')
    React.useEffect(() => {
      const mount = { promise: options.clientSecret, selectedPlan: browser.selectedPlan }
      mounts.push(mount)
      let alive = true
      options.clientSecret.then(secret => {
        payments.push(secret)
        if (alive) setResult(secret)
      }, error => { errors.push(error.message); if (alive) setResult('error:' + error.message) })
      return () => { alive = false }
    }, [options.clientSecret])
    return React.createElement('mock-stripe-provider', { result }, children)
  }
  const mocks = {
    react: React,
    'react/jsx-runtime': siteRequire('react/jsx-runtime'),
    'next/image': { __esModule: true, default: 'img' },
    'lucide-react': { Check: 'check-icon', Lock: 'lock-icon' },
    '@stripe/stripe-js': { loadStripe: async () => ({ fixture: true }) },
    '@stripe/react-stripe-js': { EmbeddedCheckoutProvider: Provider, EmbeddedCheckout: 'mock-embedded' },
    '@stripe/react-stripe-js/checkout': { CheckoutElementsProvider: Provider },
    '@/components/compte/CompteAvantPaiement': { __esModule: true, default: function Account({ onAccount }) { publishAccount = onAccount; React.useEffect(() => { onAccount(initialAccount) }, []); return React.createElement('mock-account') } },
    './FormulairePaiement': { __esModule: true, default: 'mock-payment-form' },
    './phrases': { phrasesAffichables: () => [{ texte: 'Texte de test.' }] },
    './vitrine': { VITRINE: [{ poster: '/test-fixture.png', alt: 'Fixture', titre: 'Test', description: 'Test', largeur: 100, hauteur: 100 }] },
    './tarifs3.module.css': { __esModule: true, default: new Proxy({}, { get: (_, name) => name }) },
  }
  const loaded = new Map()
  function load(relative) {
    const file = path.resolve(siteRoot, relative)
    if (loaded.has(file)) return loaded.get(file)
    const module = { exports: {} }
    const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: { jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
    }).outputText
    const localRequire = name => {
      if (name in mocks) return mocks[name]
      if (name.startsWith('@/lib/')) return load('src/lib/' + name.slice('@/lib/'.length) + '.ts')
      if (name === './offre') return load('src/lib/offre.ts')
      throw new Error('TEST_IMPORT_FORBIDDEN:' + name)
    }
    vm.runInNewContext(js, {
      module, exports: module.exports, require: localRequire, console, URL, URLSearchParams,
      window: browser, document, fetch: fetchMock, crypto: { randomUUID },
      process: { env: { NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_fixture_not_real' } },
      setTimeout, clearTimeout,
    }, { filename: file })
    loaded.set(file, module.exports)
    return module.exports
  }
  policy = load('src/lib/politiquePaiement.ts')
  const Component = load('src/app/tarifs3/Tarifs3Client.tsx').default
  let tree
  return {
    browser, jar, cookieWrites, requests, payments, errors, mounts,
    get tree() { return tree },
    get checkouts() { return requests.filter(r => r.url === '/api/checkout') },
    get text() { return words(tree.toJSON()) },
    get provider() { return tree.root.findAllByType('mock-stripe-provider')[0] },
    async mount(strict = false) { await act(async () => { tree = Renderer.create(strict ? React.createElement(React.StrictMode, null, React.createElement(Component)) : React.createElement(Component)) }) },
    async account(value) { currentAccount = value; await act(async () => publishAccount(value)) },
    async close() { if (tree) await act(async () => tree.unmount()) },
    button(label) { return tree.root.findAllByType('button').find(node => words(node) === label) },
    async click(label) { const button = this.button(label); assert.ok(button, 'missing button: ' + label); assert.ok(!button.props.disabled, 'button disabled: ' + label); await act(async () => button.props.onClick()) },
    async type(code) { await act(async () => tree.root.findByProps({ 'aria-label': 'Code parrain' }).props.onChange({ target: { value: code } })) },
    async plan(value) { browser.selectedPlan = value; await act(async () => tree.root.findAllByType('input').find(node => node.props.type === 'radio' && node.props.value === value).props.onChange()) },
  }
}

async function runCase(options, body) { const h = harness(options); try { await h.mount(); await body(h) } finally { await h.close() } }

test('URL sans cookies : première caisse déjà mensuelle avec code normalisé, aucun envoi annuel parasite', async () => {
  await runCase({ url: 'https://www.foreas.xyz/tarifs3?formule=mensuel&ref=test-a1', blockedCookies: true }, async h => {
    assert.equal(h.checkouts.length, 1)
    assert.equal(h.checkouts[0].body.plan, 'mensuel')
    assert.equal(h.checkouts[0].body.referral_code, 'TEST-A1')
    assert.match(h.text, /Code confirmé pour cette demande : TEST-A1/)
    assert.equal(h.cookieWrites.length, 0)
  })
})
for (const plan of ['mensuel', 'annuel']) test('Code hérité valide visible et retirable sur ' + plan, async () => {
  await runCase({ url: 'https://www.foreas.xyz/tarifs3?formule=' + plan, cookies: { foreas_partner_ref: 'TEST-A1', foreas_consent_advertising: 'false' } }, async h => {
    assert.match(h.text, /Code confirmé pour cette demande : TEST-A1/)
    assert.ok(h.button('Retirer'))
    if (plan === 'mensuel') assert.match(h.text, /Remise du lien de parrainage : 10 % pendant 3 mois/)
    else assert.doesNotMatch(h.text, /Remise du lien de parrainage : 10/)
  })
})
test('Retrait persistant : seulement cookie parrainage et ref URL effacés, consentement et contexte gardés', async () => {
  let nextUrl, nextCookies
  await runCase({ url: 'https://www.foreas.xyz/tarifs3?ref=TEST-A1&formule=mensuel&campagne=exemple#paiement', cookies: { foreas_partner_ref: 'TEST-A1', foreas_consent_advertising: 'false', autre: 'garder' } }, async h => {
    await h.click('Retirer')
    assert.equal(h.checkouts.at(-1).body.referral_code, '')
    assert.equal(h.jar.has('foreas_partner_ref'), false)
    assert.equal(h.jar.get('foreas_consent_advertising'), 'false')
    assert.equal(h.jar.get('autre'), 'garder')
    assert.equal(h.cookieWrites.length, 1)
    assert.match(h.cookieWrites[0], /^foreas_partner_ref=; Max-Age=0/)
    assert.equal(h.browser.location.search, '?formule=mensuel&campagne=exemple')
    assert.equal(h.browser.location.hash, '#paiement')
    assert.deepEqual(h.browser.history.state, { fixture: 'preserved' })
    nextUrl = h.browser.location.href; nextCookies = Object.fromEntries(h.jar)
    assert.doesNotMatch(h.text, /Code confirmé pour cette demande/)
  })
  await runCase({ url: nextUrl, cookies: nextCookies }, async h => {
    assert.equal(h.checkouts[0].body.referral_code, undefined)
    assert.doesNotMatch(h.text, /TEST-A1|Remise du lien/)
  })
})
test('Retrait sans cookies : aucune écriture nécessaire, le lien est nettoyé', async () => {
  await runCase({ url: 'https://www.foreas.xyz/tarifs3?ref=TEST-A1', blockedCookies: true }, async h => {
    await h.click('Retirer')
    assert.equal(h.browser.location.searchParams.has('ref'), false)
    assert.equal(h.checkouts.at(-1).body.referral_code, '')
    assert.equal(h.cookieWrites.length, 0)
  })
})
test('Échec suppression cookie : erreur visible, aucune fausse réussite ni nouveau paiement', async () => {
  await runCase({ cookies: { foreas_partner_ref: 'TEST-A1' }, denyCookieRemoval: true }, async h => {
    await h.click('Retirer')
    assert.match(h.text, /Le code n’a pas pu être retiré/)
    assert.equal(h.checkouts.length, 1)
    assert.equal(h.jar.get('foreas_partner_ref'), 'TEST-A1')
    assert.equal(h.provider, undefined)
  })
})
test('Code hérité refusé : retrait proposé même sans code saisi, puis caisse sans code', async () => {
  await runCase({ cookies: { foreas_partner_ref: 'TEST-A1' }, onCheckout: request => request.body.referral_code === '' ? request.success() : response({ code: 'CODE_UNAVAILABLE', error: 'Code indisponible' }, 422) }, async h => {
    assert.ok(h.button('Retirer'))
    assert.equal(h.errors[0], 'Code indisponible')
    await h.click('Retirer')
    assert.equal(h.checkouts.length, 2)
    assert.equal(h.provider.props.result.startsWith('test_secret_'), true)
  })
})
for (const query of ['ref=&formule=mensuel', 'ref=TEST-A1&ref=TEST-B2']) test('Lien ambigu bloqué jusqu’au choix explicite : ' + query, async () => {
  await runCase({ url: 'https://www.foreas.xyz/tarifs3?' + query }, async h => {
    assert.equal(h.checkouts.length, 0)
    assert.equal(h.provider, undefined)
    await h.click('Retirer')
    assert.equal(h.checkouts.length, 1)
    assert.equal(h.checkouts[0].body.referral_code, '')
  })
})
test('Brouillon de remplacement : aucun nouveau paiement avant Appliquer et réponse serveur', async () => {
  const verify = deferred()
  await runCase({ cookies: { foreas_partner_ref: 'TEST-A1' }, onVerify: () => verify.promise }, async h => {
    await h.type('test-b2')
    assert.equal(h.checkouts.length, 1)
    await h.click('Appliquer')
    assert.equal(h.checkouts.length, 1)
    assert.match(h.text, /Code confirmé pour cette demande : TEST-A1/)
    await act(async () => verify.resolve(response({ valide: true, remisePct: 10, dureeMois: 3 })))
    assert.equal(h.checkouts.length, 2)
    assert.equal(h.checkouts[1].body.referral_code, 'TEST-B2')
    assert.equal(h.browser.location.searchParams.get('ref'), 'TEST-B2')
    assert.match(h.text, /Code confirmé pour cette demande : TEST-B2/)
  })
})
test('Code syntaxiquement invalide transmis au serveur, sans faux verdict local', async () => {
  await runCase({ onVerify: () => response({ valide: false }) }, async h => {
    await h.click("J'ai un code parrain")
    await h.type('BAD')
    await h.click('Appliquer')
    assert.equal(h.requests.find(r => r.url === '/api/parrainage/verifier').body.code, 'BAD')
    assert.match(h.text, /Ce code n'est pas reconnu/)
    assert.equal(h.checkouts.length, 1)
  })
})
test('Code confirmé différent : refus avant présentation d’une caisse utilisable', async () => {
  await runCase({ url: 'https://www.foreas.xyz/tarifs3?ref=TEST-A1', onCheckout: request => request.success({ referralCodeConfirmed: 'TEST-B2' }) }, async h => {
    assert.match(h.errors[0], /ne correspond pas/)
    assert.equal(h.payments.length, 0)
    assert.doesNotMatch(h.text, /Code confirmé pour cette demande/)
  })
})
test('Réponse ancienne reçue après la nouvelle : prix visible et caisse restent liés au nouveau code', async () => {
  const pendingA = deferred()
  let initialRequest
  await runCase({ url: 'https://www.foreas.xyz/tarifs3?formule=mensuel&ref=TEST-A1', onCheckout: request => {
    if (request.body.referral_code === 'TEST-A1') { initialRequest = request; return pendingA.promise }
    return request.success({ remiseParrainPct: 20 })
  } }, async h => {
    await h.type('TEST-B2'); await h.click('Appliquer')
    assert.match(h.text, /Remise du code parrain : 20 %/)
    await act(async () => pendingA.resolve(initialRequest.success({ remiseParrainPct: 10 })))
    assert.match(h.text, /Code confirmé pour cette demande : TEST-B2/)
    assert.match(h.text, /Remise du code parrain : 20 %/)
    assert.doesNotMatch(h.text, /Remise du code parrain : 10 %/)
    assert.equal(h.provider.props.result, 'test_secret_3')
  })
})
test('Changer de formule ne monte jamais la caisse précédente sous le nouveau choix', async () => {
  await runCase({}, async h => {
    const oldPromise = h.mounts[0].promise
    const oldSecret = h.provider.props.result
    await h.plan('annuel')
    assert.equal(h.checkouts.length, 2)
    assert.ok(h.mounts.filter(m => m.selectedPlan === 'annuel').every(m => m.promise !== oldPromise))
    assert.notEqual(h.provider.props.result, oldSecret)
    await h.plan('mensuel')
    assert.equal(h.checkouts.length, 3)
    assert.notEqual(h.provider.props.result, oldSecret)
  })
})
test('Double effet React et requête en cours : une seule caisse et même demande réutilisée', async () => {
  const pending = deferred()
  let request
  const h = harness({ onCheckout: r => { request = r; return pending.promise } })
  try {
    await h.mount(true)
    assert.equal(h.checkouts.length, 1)
    assert.match(request.options.headers['Idempotency-Key'], /^[0-9a-f-]{36}$/)
    await act(async () => pending.resolve(request.success()))
    assert.equal(h.checkouts.length, 1)
  } finally { await h.close() }
})
test('Code de 32 caractères conservé, sans troncature par le champ ou la demande', async () => {
  const code = 'A'.repeat(32)
  await runCase({}, async h => {
    await h.click("J'ai un code parrain")
    assert.equal(h.tree.root.findByProps({ 'aria-label': 'Code parrain' }).props.maxLength, 32)
    await h.type(code); await h.click('Appliquer')
    assert.equal(h.checkouts.at(-1).body.referral_code, code)
    assert.match(h.text, new RegExp(code))
  })
})

for (const [label, broken] of [
  ['pourcentage manquant', { remiseParrainPct: undefined }],
  ['remise sans code confirmé', { remiseParrainPct: 10, referralCodeConfirmed: null }],
  ['durée absente', { remiseDureeMois: null, remisePermanente: false }],
  ['permanence et durée finie simultanées', { remiseDureeMois: 3, remisePermanente: true }],
]) test('Conditions incomplètes refusées avant paiement : ' + label, async () => {
  await runCase({ url: 'https://www.foreas.xyz/tarifs3?formule=mensuel&ref=TEST-A1', onCheckout: request => request.success(broken) }, async h => {
    assert.equal(h.payments.length, 0)
    assert.equal(h.errors.length, 1)
  })
})
test('Remplacement explicite repris après rechargement malgré l’ancien cookie', async () => {
  let nextUrl
  await runCase({ url: 'https://www.foreas.xyz/tarifs3?ref=TEST-A1', cookies: { foreas_partner_ref: 'TEST-A1' } }, async h => {
    await h.type('TEST-B2'); await h.click('Appliquer')
    nextUrl = h.browser.location.href
  })
  await runCase({ url: nextUrl, cookies: { foreas_partner_ref: 'TEST-A1' } }, async h => {
    assert.equal(h.checkouts[0].body.referral_code, 'TEST-B2')
    assert.match(h.text, /Code confirmé pour cette demande : TEST-B2/)
  })
})

// Identity gate: referral remains selected while waiting for a verified account.
test('compte absent : aucune caisse ne part avant la connexion', async () => {
  await runCase({ initialAccount: null, url: 'https://www.foreas.xyz/tarifs3?formule=mensuel&ref=TEST-A1' }, async h => {
    assert.equal(h.checkouts.length, 0)
    assert.equal(h.provider, undefined)
    await h.account({ userId: 'account-A', email: 'a@example.invalid', credential: 'proof-A', expiresAt: Math.floor(Date.now()/1000)+3600 })
    assert.equal(h.checkouts.length, 1)
    assert.equal(h.checkouts[0].options.headers.Authorization, 'Bearer proof-A')
    assert.equal(h.checkouts[0].body.referral_code, 'TEST-A1')
  })
})
test('changer de compte ferme la caisse et utilise une nouvelle demande', async () => {
  await runCase({}, async h => {
    const keyA = h.checkouts[0].options.headers['Idempotency-Key']
    await h.account(null)
    assert.equal(h.provider, undefined)
    await h.account({ userId: 'account-B', email: 'b@example.invalid', credential: 'proof-B', expiresAt: Math.floor(Date.now()/1000)+3600 })
    assert.equal(h.checkouts.at(-1).options.headers.Authorization, 'Bearer proof-B')
    assert.notEqual(h.checkouts.at(-1).options.headers['Idempotency-Key'], keyA)
  })
})
test('réponse tardive de A après connexion B ne peut afficher la caisse A', async () => {
  const pending = deferred()
  await runCase({ onCheckout: request => request.options.headers.Authorization === 'Bearer fixture-credential' ? pending.promise : request.success({ clientSecret: 'secret-B' }) }, async h => {
    await h.account(null)
    await h.account({ userId: 'account-B', email: 'b@example.invalid', credential: 'proof-B', expiresAt: Math.floor(Date.now()/1000)+3600 })
    await act(async () => { pending.resolve(await h.checkouts[0].success({ clientSecret: 'secret-A' })) })
    assert.equal(h.provider.props.result, 'secret-B')
    assert.equal(h.payments.includes('secret-A'), false)
  })
})

const LINK = '99999999-1111-4111-8111-111111111111'
test('ancien lien mensuel et invitation conservés après connexion et retrait du code', async () => {
 await runCase({ initialAccount: null, url: 'https://www.foreas.xyz/tarifs3?formule=mensuel&payment_link='+LINK+'&ref=TEST-A1' }, async h => {
  assert.equal(h.checkouts.length,0);assert.match(h.text,/Connecte ton compte/);assert.doesNotMatch(h.text,/0 € aujourd’hui/)
  await h.account({userId:'A',email:'a@example.invalid',credential:'proof-A',expiresAt:Math.floor(Date.now()/1000)+3600})
  assert.equal(h.checkouts.length,1);assert.equal(h.checkouts[0].body.payment_link,LINK);assert.equal(h.checkouts[0].body.plan,'mensuel');assert.equal(h.checkouts[0].body.expectedTrial,true)
  await h.click('Retirer');assert.equal(h.checkouts.at(-1).body.payment_link,LINK);assert.equal(h.checkouts.at(-1).body.referral_code,'');assert.equal(h.browser.location.searchParams.get('payment_link'),LINK)
 })
})
test('revenant : montant immédiat personnel, aucun nouvel essai dans la demande', async () => {
 await runCase({ returning: true }, async h => {
  assert.equal(h.checkouts.length,1);assert.equal(h.checkouts[0].body.expectedTrial,false);assert.doesNotMatch(h.text,/0 € aujourd’hui/);assert.match(h.text,/29,99/)
 })
})
test('abonné actuel : accès à l’app, aucune demande de paiement', async () => {
 await runCase({ onPolicy: (request,data)=>response({...data,alreadySubscribed:true}) }, async h => {
  assert.equal(h.checkouts.length,0);assert.match(h.text,/Ton abonnement est déjà actif/);assert.ok(h.tree.root.findAllByType('a').some(n=>n.props.href==='/go'))
 })
})
test('politique reçue tard pour A ne peut pas ouvrir la caisse de B', async () => {
 const late=deferred()
 await runCase({ onPolicy: (request,data)=>request.account.userId==='auth-fixture'?late.promise:response({...data,alreadySubscribed:true}) }, async h=>{
  assert.equal(h.checkouts.length,0)
  await h.account({userId:'B',email:'b@example.invalid',credential:'proof-B',expiresAt:Math.floor(Date.now()/1000)+3600})
  await act(async()=>late.resolve(response({confirmeParLeServeur:true,accountId:'auth-fixture',alreadySubscribed:false})))
  assert.equal(h.checkouts.length,0);assert.match(h.text,/Ton abonnement est déjà actif/)
 })
})
for(const suffix of ['payment_link=not-an-id','payment_link='+LINK+'&payment_link='+LINK])test('lien invalide ou doublé : aucun paiement '+suffix,async()=>{
 await runCase({url:'https://www.foreas.xyz/tarifs3?'+suffix},async h=>{assert.equal(h.checkouts.length,0);assert.match(h.text,/Ce lien de paiement est incomplet/)})
})

test('erreur mal formée : page conservée et réessai possible',async()=>{
 await runCase({onPolicy:()=>response({error:{message:'synthetic failure'}},503)},async h=>{assert.equal(h.checkouts.length,0);assert.match(h.text,/Le tarif n’a pas pu être confirmé/);assert.ok(h.button('Réessayer'))})
})
for(const malformed of [{joursEssai:{}},{premierDebitISO:{}},{periodicite:[]},{moisEngages:'1'},{montantEnsuiteCentimes:1}])test('montant serveur mal formé non affichable refusé '+JSON.stringify(malformed),async()=>{
 await runCase({onPolicy:(request,data)=>response({...data,...malformed})},async h=>{assert.equal(h.checkouts.length,0);assert.ok(h.button('Réessayer'));assert.match(h.text,/Le tarif n’a pas pu être confirmé/)})
})


test('Retour à la même formule : une réponse de la première visite ne peut plus être exposée', async () => {
  const pending = deferred()
  let first
  await runCase({ onCheckout: request => {
    if (!first) { first = request; return pending.promise }
    return request.success()
  } }, async h => {
    await h.plan('annuel'); await h.plan('mensuel')
    assert.equal(h.checkouts.length, 3)
    const current = h.provider.props.result
    await act(async () => pending.resolve(first.success({ clientSecret: 'expired-first-visit' })))
    assert.equal(h.provider.props.result, current)
    assert.equal(h.payments.includes('expired-first-visit'), false)
  })
})
test('Actualiser le paiement relit les conditions et demande une caisse vérifiée au serveur', async () => {
  await runCase({}, async h => {
    const old = h.provider.props.result
    await act(async () => h.tree.root.findByType('mock-payment-form').props.onReessayer())
    assert.equal(h.checkouts.length, 2)
    assert.notEqual(h.provider.props.result, old)
    assert.notEqual(h.checkouts[0].options.headers['Idempotency-Key'], h.checkouts[1].options.headers['Idempotency-Key'])
  })
})

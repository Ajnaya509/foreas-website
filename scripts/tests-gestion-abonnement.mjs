import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import ts from 'typescript'

const require = createRequire(import.meta.url)
function charger(path, mocks = {}) {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8')
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText
  const module = { exports: {} }
  new Function('require', 'module', 'exports', code)(name => mocks[name] ?? require(name), module, module.exports)
  return module.exports
}
const { gestionAbonnement, decrireAbonnement } = charger('../src/lib/gestionAbonnement.ts')
const { lierAbonnement } = charger('../src/lib/lierAbonnement.ts')
const user = { id: 'auth-A', email: 'a@example.test', email_confirmed_at: '2026-01-01', user_metadata: { stripe_customer_id: 'cus_B' } }
const subscription = { id: 'sub_A', status: 'trialing', trial_end: 1800000000, current_period_end: 1800000000, cancel_at_period_end: false, cancel_at: null, items: { data: [] } }

function environnement(options = {}) {
  const calls = []
  const supabase = {
    auth: { getUser: async bearer => { calls.push(['auth', bearer]); return options.authError ? { error: {}, data: { user: null } } : { error: null, data: { user } } } },
    from(table) {
      assert.equal(table, 'subscriptions')
      const q = { select: () => q, eq(key, value) { calls.push(['eq', key, value]); return q },
        then: resolve => resolve({ data: options.links ?? [{ stripe_customer_id: 'cus_A' }], error: options.dbError ?? null }) }
      return q
    },
  }
  const stripe = {
    subscriptions: { list: async params => { calls.push(['stripe.list', params]); if (options.stripeError) throw new Error('private_provider_detail'); return { data: options.subs ?? [subscription], has_more: !!options.hasMore } } },
    billingPortal: { sessions: { create: async params => { calls.push(['portal', params]); return { url: 'https://billing.stripe.com/p/session_test' } } } },
  }
  return { calls, handler: gestionAbonnement({ supabase: () => { calls.push(['db']); return supabase }, stripe: () => { calls.push(['stripe']); return stripe } }) }
}
function requete(method = 'GET', body, query = '', auth = 'Bearer valid') {
  return new Request(`https://host-injecte.example/api/customer-portal${query}`, {
    method, headers: { ...(auth ? { Authorization: auth } : {}), 'Content-Type': 'application/json' },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
}

test('visiteur sans connexion : aucun accès à la base ni à Stripe', async () => {
  for (const method of ['GET', 'POST']) {
    const e = environnement(); const r = await e.handler(requete(method, method === 'POST' ? {} : undefined, '?customer_id=cus_B', ''))
    assert.equal(r.status, 401); assert.deepEqual(e.calls, []); assert.match(r.headers.get('cache-control'), /no-store/)
  }
})
test('connexion expirée : aucun accès à Stripe', async () => {
  const e = environnement({ authError: true }); assert.equal((await e.handler(requete())).status, 401)
  assert.equal(e.calls.some(c => c[0] === 'stripe'), false)
})
test('identifiants forgés dans adresse ou corps refusés avant Stripe', async () => {
  for (const r of [requete('GET', undefined, '?customer_id=cus_B'), requete('POST', { customer_id: 'cus_B' }), requete('POST', { userId: 'auth-B' }), requete('POST', { action: 'payer' }), requete('POST', null)]) {
    const e = environnement(); assert.equal((await e.handler(r)).status, 400); assert.equal(e.calls.some(c => c[0] === 'stripe'), false)
  }
})
test('bon compte : la table protégée détermine le propriétaire, pas les métadonnées du profil', async () => {
  const e = environnement(); const r = await e.handler(requete('POST', { action: 'gerer' })); assert.equal(r.status, 200)
  assert.ok(e.calls.some(c => c[0] === 'eq' && c[1] === 'user_id' && c[2] === 'auth-A'))
  assert.deepEqual(e.calls.find(c => c[0] === 'portal')[1], { customer: 'cus_A', return_url: 'https://www.foreas.xyz/abonnement' })
  assert.equal((await r.json()).url, 'https://billing.stripe.com/p/session_test')
})
test('GET lit la date réelle sans créer de portail', async () => {
  const e = environnement(); const body = await (await e.handler(requete())).json()
  assert.equal(body.abonnement.prochain_prelevement, new Date(1800000000000).toISOString())
  assert.equal(e.calls.some(c => c[0] === 'portal'), false)
})
test('arrêt : Stripe demande la confirmation pour le seul abonnement du compte', async () => {
  const e = environnement(); assert.equal((await e.handler(requete('POST', { action: 'arreter' }))).status, 200)
  const args = e.calls.find(c => c[0] === 'portal')[1]
  assert.equal(args.flow_data.type, 'subscription_cancel'); assert.equal(args.flow_data.subscription_cancel.subscription, 'sub_A')
  assert.equal(args.flow_data.after_completion.redirect.return_url, 'https://www.foreas.xyz/abonnement')
})
test('aucun lien ou plusieurs propriétaires : aucun portail', async () => {
  for (const [links, status] of [[[], 404], [[{ stripe_customer_id: 'cus_A' }, { stripe_customer_id: 'cus_B' }], 409]]) {
    const e = environnement({ links }); assert.equal((await e.handler(requete('POST', {}))).status, status)
    assert.equal(e.calls.some(c => c[0] === 'stripe'), false)
  }
})
test('plusieurs lignes du même client restent un seul propriétaire', async () => {
  const e = environnement({ links: [{ stripe_customer_id: 'cus_A' }, { stripe_customer_id: 'cus_A' }] })
  assert.equal((await e.handler(requete('POST', {}))).status, 200)
})
test('pannes et liste incomplète ne deviennent pas une fausse absence', async () => {
  for (const options of [{ dbError: {} }, { stripeError: true }, { hasMore: true }]) {
    const e = environnement(options); const r = await e.handler(requete()); assert.ok(r.status >= 400)
    assert.equal(e.calls.some(c => c[0] === 'portal'), false); assert.doesNotMatch(await r.text(), /private_provider_detail/)
  }
})
test('pas de choix silencieux pour arrêter plusieurs abonnements', async () => {
  const e = environnement({ subs: [subscription, { ...subscription, id: 'sub_other' }] })
  assert.equal((await e.handler(requete('POST', { action: 'arreter' }))).status, 409)
  assert.equal(e.calls.some(c => c[0] === 'portal'), false)
})
test('arrêt enregistré : aucun prochain renouvellement annoncé, formats Acacia et Basil', () => {
  for (const sub of [{ ...subscription, cancel_at_period_end: true }, { ...subscription, cancel_at: 1800000000 },
    { ...subscription, status: 'canceled', ended_at: 1800000000 }]) {
    const d = decrireAbonnement(sub); assert.equal(d.renouvellement_arrete, true); assert.equal(d.prochain_prelevement, null); assert.ok(d.fin_acces)
  }
  const basil = decrireAbonnement({ ...subscription, status: 'active', current_period_end: undefined, items: { data: [{ current_period_end: 1800000000 }] } })
  assert.equal(basil.prochain_prelevement, new Date(1800000000000).toISOString())
})

test('inscription : lien stable, rejeu accepté, conflit de propriétaire refusé', async () => {
  let rows = []; let writes = 0
  const supabase = { from: table => {
    assert.equal(table, 'subscriptions'); let mutation
    const q = { select: () => q, eq: () => q, insert: v => { mutation = v; return q }, update: v => { mutation = v; return q },
      then: resolve => { if (mutation) { rows = [{ id: 'row', ...mutation }]; writes++ } resolve({ data: rows, error: null }) } }
    return q
  } }
  const lien = { userId: 'auth-A', customerId: 'cus_A', subscriptionId: 'sub_A', status: 'trialing', periodEnd: '2026-09-10', pricePerMonth: 29.99 }
  await lierAbonnement(supabase, lien); await lierAbonnement(supabase, lien)
  assert.equal(rows.length, 1); assert.equal(rows[0].user_id, 'auth-A'); assert.equal(writes, 2)
  await assert.rejects(lierAbonnement(supabase, { ...lien, userId: 'auth-B' }), /conflit/)
  assert.equal(writes, 2)
})

test('nouveau compte : le dossier est relié, puis activé avec son identité Auth', async () => {
  const calls = []
  const admin = { auth: { admin: { createUser: async () => ({ data: { user: { id: 'auth-new' } }, error: null }) } },
    from(table) { const q = { upsert: value => { calls.push([table, 'upsert', value]); return q }, update: value => { calls.push([table, 'update', value]); return q }, eq: (k,v) => { calls.push([table,k,v]); return q },
      is: (k,v) => { calls.push([table,k,v]); return q }, select: async () => ({ data: [{ id: 'auth-new' }], error: null }) }; return q }
  }
  const { provisionDriverAccount, activerAccesChauffeur } = charger('../src/lib/provisionDriverAccount.ts', { './supabaseServeur': { clientServeurOuNull: () => admin } })
  const compte = await provisionDriverAccount({ email: 'new@example.test' }); assert.equal(compte.status, 'created')
  const r = await activerAccesChauffeur({ email: 'new@example.test', userId: compte.userId, compteCree: true, finEssai: '2099-01-01T00:00:00Z' })
  assert.equal(r.ouvert, true)
  assert.ok(calls.some(c => c[0] === 'drivers' && c[1] === 'update' && c[2].auth_user_id === 'auth-new'))
  assert.ok(calls.some(c => c[0] === 'drivers' && c[1] === 'auth_user_id' && c[2] === 'auth-new'))
})

test('compte historique sans lien : aucune réparation supposée et aucun accès annoncé', async () => {
  const calls = []
  const admin = { from(table) { const q = { update: value => { calls.push(value); return q }, eq: () => q, select: async () => ({ data: [], error: null }) }; return q } }
  const { activerAccesChauffeur } = charger('../src/lib/provisionDriverAccount.ts', { './supabaseServeur': { clientServeurOuNull: () => admin } })
  const r = await activerAccesChauffeur({ email: 'old@example.test', userId: 'auth-old', compteCree: false })
  assert.equal(r.ouvert, false); assert.ok(calls.every(c => c.auth_user_id === undefined))
})

test('compte existant : identité confirmée côté Auth, pas celle du profil', async () => {
  const admin = { auth: { admin: {
    createUser: async () => ({ data: { user: null }, error: { code: 'email_exists', message: 'exists' } }),
    listUsers: async () => ({ data: { users: [{ id: 'auth-existing', email: 'exist@example.test', email_confirmed_at: '2026-01-01' }] }, error: null }),
  } } }
  const { provisionDriverAccount } = charger('../src/lib/provisionDriverAccount.ts', { './supabaseServeur': { clientServeurOuNull: () => admin } })
  assert.deepEqual(await provisionDriverAccount({ email: 'exist@example.test' }), { status: 'already_exists', userId: 'auth-existing' })
})

const { synchroniserAbonnement } = charger('../src/lib/synchroniserAbonnement.ts')
for (const [name, subs, attendu] of [
  ['arrêt prévu : accès maintenu jusqu’à la fin', [{ ...subscription, cancel_at_period_end: true }], true],
  ['arrêt terminé : accès et palier fermés', [{ ...subscription, status: 'canceled' }], false],
  ['ancien arrêt reçu en retard : nouvel abonnement préservé', [{ ...subscription, status: 'canceled' }, { ...subscription, id: 'sub_new', status: 'active' }], true],
]) {
  test(name, async () => {
    const changes = []
    const admin = { from(table) {
      let write
      const q = { select: () => q, update: v => { write = v; return q }, upsert: v => { write = v; return q }, eq: (k,v) => { if (table === 'drivers') assert.deepEqual([k,v], ['auth_user_id','auth-A']); return q },
        then: resolve => { if (write) changes.push({ table, write }); resolve({ error: null, data: write ? [{ id:'row' }] : [{ user_id:'auth-A', stripe_customer_id:'cus_A' }] }) } }
      return q
    } }
    await synchroniserAbonnement(admin, { subscriptions: { list: async p => { assert.equal(p.customer,'cus_A'); return { data: subs, has_more: false } } } }, 'sub_A')
    assert.equal(changes.find(c => c.table === 'drivers').write.subscription_active, attendu)
    assert.equal(changes.find(c => c.table === 'user_profiles').write.user_id, 'auth-A')
    assert.equal(changes.find(c => c.table === 'user_profiles').write.tier, attendu ? 'pro' : 'free')
  })
}

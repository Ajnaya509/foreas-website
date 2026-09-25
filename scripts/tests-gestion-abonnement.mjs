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

test('liaison : la réponse protégée doit confirmer la transaction', async () => {
  const calls = []
  const lien = { userId: 'auth-A', customerId: 'cus_A', subscriptionId: 'sub_A', status: 'trialing', periodEnd: '2026-09-10', pricePerMonth: 29.99 }
  await lierAbonnement({ rpc: async (name, args) => { calls.push({ name, args }); return { data: { status: 'linked', subscription_row_id: 'row' } } } }, lien)
  assert.equal(calls[0].name, 'partner_billing_link'); assert.equal(calls[0].args.p_auth_user_id, 'auth-A')
  for (const reply of [{ error: { message: 'BILLING_IDENTITY_CONFLICT' } }, { data: {} }, { data: { status: 'linked' } }]) {
    await assert.rejects(lierAbonnement({ rpc: async () => reply }, lien), /ecriture_lien_abonnement/)
  }
})

test('anciens chemins fermés : ni compte depuis un email ni accès hors transaction', async () => {
  const { provisionDriverAccount, activerAccesChauffeur } = charger('../src/lib/provisionDriverAccount.ts')
  assert.equal((await provisionDriverAccount({ email: 'new@example.test' })).status, 'failed')
  assert.equal((await activerAccesChauffeur({ userId: 'auth-new', compteCree: true })).ouvert, false)
})

const { synchroniserAbonnement } = charger('../src/lib/synchroniserAbonnement.ts', {
  './checkoutOwner': charger('../src/lib/checkoutOwner.ts'),
})
for (const [name, subs] of [
  ['arrêt prévu : transmettre la fin réelle', [{ ...subscription, cancel_at_period_end: true }]],
  ['arrêt terminé : transmettre l’annulation', [{ ...subscription, status: 'canceled' }]],
  ['ancien arrêt : inclure aussi le nouvel abonnement', [{ ...subscription, status: 'canceled' }, { ...subscription, id: 'sub_new', status: 'active' }]],
]) {
  test(name, async () => {
    const calls = [], observation = '92929292-0000-4000-8000-000000000001'
    const admin = {
      from(table) {
        assert.equal(table, 'subscriptions')
        let fields
        const q = { select: v => { fields = v; return q }, eq: () => q,
          then: resolve => resolve({ error: null, data: fields === 'user_id' ? [{ user_id: 'auth-A' }] : subs.map(sub => ({ stripe_customer_id: 'cus_A', stripe_subscription_id: sub.id })) }) }
        return q
      },
      rpc: async (name, args) => { calls.push({ name, args }); return { data: name === 'partner_billing_observation_begin' ? observation : { status: 'synced' }, error: null } },
    }
    await synchroniserAbonnement(admin, { subscriptions: { list: async p => {
      assert.equal(calls[0].name, 'partner_billing_observation_begin'); assert.equal(p.customer, 'cus_A')
      return { data: subs.map(sub => ({ ...sub, customer: 'cus_A' })), has_more: false }
    } } }, 'sub_A')
    const write = calls.find(c => c.name === 'partner_billing_sync_owner').args
    assert.equal(write.p_auth_user_id, 'auth-A'); assert.equal(write.p_observation_id, observation)
    assert.deepEqual(write.p_states.map(s => [s.id, s.status]), subs.map(s => [s.id, s.status]))
    assert.equal(write.p_states[0].period_end, new Date(subscription.current_period_end * 1000).toISOString())
    assert.deepEqual(write.p_expected_links, subs.map(sub => ({ id: sub.id, customer: 'cus_A' })))
  })
}

import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import test from 'node:test'
import assert from 'node:assert/strict'

const require = createRequire(import.meta.url)
const ts = require('typescript')
const root = path.resolve(import.meta.dirname, '..')
function load(relative, overrides = {}) {
  const file = path.resolve(root, relative)
  const module = { exports: {} }
  const js = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText
  const localRequire = name => {
    if (name in overrides) return overrides[name]
    if (name.startsWith('@/')) return load('src/' + name.slice(2) + '.ts', overrides)
    if (name.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(file), name + '.ts')), overrides)
    return require(name)
  }
  vm.runInNewContext(js, { module, exports: module.exports, require: localRequire, URL, Headers, Buffer, process, console, Date, Set, Map }, { filename: file })
  return module.exports
}
const app = load('src/lib/partnerApplication.ts')
const referral = load('src/lib/referralOffer.ts')
const rate = load('src/lib/partnerRateKey.ts')
const billing = load('src/lib/partnerBillingEvents.ts')
const validApplication = {
  ...app.EMPTY_APPLICATION, company_name: 'Formation Exemple', contact_name: 'Contact Exemple',
  email: 'personne@example.test', category: 'training',
}

test('Candidature : quatre champs requis et valeurs normalisées', () => {
  const result = app.validatePartnerApplication({ ...validApplication, email: ' Personne@Example.test ' })
  assert.equal(Object.keys(result.errors).length, 0)
  assert.equal(result.data.email, 'personne@example.test')
})
for (const [name, input, field] of [
  ['état imposé par le navigateur', { ...validApplication, status: 'approved' }, 'form'],
  ['objet à la place du nom', { ...validApplication, company_name: { value: 'injection' } }, 'company_name'],
  ['activité inconnue', { ...validApplication, category: 'admin' }, 'category'],
  ['nom trop long', { ...validApplication, company_name: 'a'.repeat(121) }, 'company_name'],
  ['SIRET alphabétique', { ...validApplication, siret: 'ABCDEFGHIJKLMN' }, 'siret'],
  ['lien actif javascript', { ...validApplication, professional_url: 'javascript:alert(1)' }, 'professional_url'],
  ['identifiants dans un lien', { ...validApplication, professional_url: 'https://login:secret@example.test' }, 'professional_url'],
  ['collaboration inconnue', { ...validApplication, collaboration_mode: 'grant_admin' }, 'collaboration_mode'],
  ['entrée nulle', null, 'form'],
]) test('Candidature refusée : ' + name, () => assert.ok(app.validatePartnerApplication(input).errors[field]))

test('Plafond : adresse de l’hébergeur, condensat stable et aucun repli public', () => {
  const env = { NODE_ENV: 'production', VERCEL: '1', PARTNER_RATE_LIMIT_SECRET: 'test-only-secret-never-production-12345' }
  const headers = new Headers({ 'x-vercel-forwarded-for': '203.0.113.1', 'x-forwarded-for': '198.51.100.1' })
  const hash = rate.partnerRateKey(headers, env)
  assert.match(hash, /^[0-9a-f]{64}$/)
  headers.set('x-forwarded-for', '198.51.100.2')
  assert.equal(rate.partnerRateKey(headers, env), hash)
  assert.equal(rate.partnerRateKey(headers, { NODE_ENV: 'production' }), null)
  assert.equal(rate.partnerRateKey(new Headers(), env), null)
})
test('Codes : même forme que l’app, sans troncature ni objet coercitif', () => {
  assert.equal(referral.normalizeReferralCode(' abc-123 '), 'ABC-123')
  for (const raw of ['ABCDE', 'A'.repeat(33), 'ABC_DEF', '%41BC123', 'ABC/123', null, {}]) assert.equal(referral.normalizeReferralCode(raw), null)
})
const offer = { code: 'ABC123', sponsor_type: 'partner', discount_pct: 10, duration_months: 3, duration_type: 'repeating', active: true }
test('Offre : une panne ou un résultat partiel ne devient pas zéro', () => {
  for (const data of [null, [], {}, { ...offer, code: 'ZZZ999' }, { ...offer, discount_pct: NaN }, { ...offer, duration_months: 0 }])
    assert.throws(() => referral.parseReferralOffer(data, 'ABC123'), /SERVICE_UNAVAILABLE|CODE_UNAVAILABLE/)
})
test('Offre : état inactif et durée absente explicitement refusés', () => {
  assert.throws(() => referral.parseReferralOffer({ ...offer, active: false }, 'ABC123'), /CODE_UNAVAILABLE/)
  assert.throws(() => referral.discountForPlan({ ...offer, duration_months: null }, false), /TERMS_UNAVAILABLE/)
  assert.equal(referral.discountForPlan({ ...offer, duration_months: null }, true).percent, 0)
  assert.equal(referral.discountForPlan(offer, false).months, 3)
})
const coupon = { id: 'foreas_ref_v1_10_3m', valid: true, percent_off: 10, duration: 'repeating', duration_in_months: 3, amount_off: null, max_redemptions: null, redeem_by: null }
test('Remise chauffeur permanente préservée uniquement sur indication explicite', async () => {
  const driverOffer = referral.parseReferralOffer({ ...offer, sponsor_type: 'driver', duration_type: 'forever', duration_months: null }, 'ABC123')
  assert.equal(referral.discountForPlan(driverOffer, false).duration, 'forever')
  assert.throws(() => referral.parseReferralOffer({ ...offer, duration_type: 'forever', duration_months: null }, 'ABC123'), /SERVICE_UNAVAILABLE/)
  const permanent = { ...coupon, id: 'foreas_ref_v1_10_forever', duration: 'forever', duration_in_months: null }
  assert.equal(await referral.ensureReferralCoupon({ coupons: { retrieve: async () => permanent } }, 10, null, 'forever'), permanent.id)
})
test('Coupon : réutiliser seulement la réduction exacte et sa durée', async () => {
  let creates = 0
  const stripe = { coupons: { retrieve: async () => coupon, create: async () => { creates++; return coupon } } }
  assert.equal(await referral.ensureReferralCoupon(stripe, 10, 3), coupon.id)
  assert.equal(creates, 0)
})
test('Coupon : créer après 404 et conserver la même clé de reprise', async () => {
  let params, options
  const stripe = { coupons: { retrieve: async () => { throw { code: 'resource_missing', statusCode: 404 } }, create: async (p, o) => { params = p; options = o; return coupon } } }
  await referral.ensureReferralCoupon(stripe, 10, 3)
  assert.equal(params.duration, 'repeating')
  assert.equal(params.duration_in_months, 3)
  assert.equal(options.idempotencyKey, 'partner-coupon/' + coupon.id)
})
for (const [name, value] of [['permanent', { ...coupon, duration: 'forever' }], ['durée erronée', { ...coupon, duration_in_months: 12 }], ['produit restreint', { ...coupon, applies_to: { products: ['prod_unrelated'] } }], ['invalide', { ...coupon, valid: false }]])
  test('Coupon refusé : ' + name, async () => {
    await assert.rejects(referral.ensureReferralCoupon({ coupons: { retrieve: async () => value } }, 10, 3), /TERMS_UNAVAILABLE/)
  })
test('Coupon : une panne réseau ne déclenche pas de création', async () => {
  let creates = 0
  const stripe = { coupons: { retrieve: async () => { throw new Error('network') }, create: async () => { creates++; return coupon } } }
  await assert.rejects(referral.ensureReferralCoupon(stripe, 10, 3), /network/)
  assert.equal(creates, 0)
})

const invoice = {
  id: 'in_example', livemode: false, status: 'paid', amount_paid: 2999, currency: 'eur',
  customer: 'cus_example', subscription: 'sub_example', billing_reason: 'subscription_cycle',
  lines: { has_more: false, data: [{ price: { id: 'price_example' }, quantity: 1, proration: false }] },
  status_transitions: { paid_at: 1788800000 },
}
function billingFixtures(overrides = {}) {
  const calls = []
  const stripe = {
    invoices: { retrieve: async () => ({ ...invoice, ...overrides.invoice }) },
    prices: { retrieve: async () => ({ id: 'price_example', livemode: false, recurring: { interval: 'month', interval_count: 1 } }) },
    charges: { retrieve: async () => ({ id: 'ch_example', livemode: false, amount: 2999, amount_refunded: 1, invoice: 'in_example', payment_intent: 'pi_example', ...overrides.charge }) },
    disputes: { retrieve: async () => ({ id: 'dp_example', charge: 'ch_example', livemode: false, status: 'won' }) },
    invoicePayments: { list: async () => ({ has_more: false, data: [{ livemode: false, invoice: 'in_example' }] }) },
  }
  const sb = {
    from: () => ({ select: () => ({ eq: async () => ({ data: overrides.links ?? [{ user_id: 'auth_example', stripe_customer_id: 'cus_example', provider: 'stripe' }], error: overrides.readError || null }) }) }),
    rpc: async (name, args) => {
      calls.push({ name, args })
      const data = name === 'partner_invoice_issue_observation_begin'
        ? { observation_id: 'aaaaaaaa-1111-4111-8111-111111111111', kind: args.p_kind, issue_id: args.p_issue_id }
        : name === 'partner_record_invoice_issues'
          ? { status: 'recorded', observation_id: args.p_observation_id, invoice_count: args.p_invoice_ids.length }
          : { status: overrides.rpcStatus ?? 'created', affected: 1 }
      return { data, error: overrides.rpcError || null }
    },
  }
  return { stripe, sb, calls }
}
test('Facture : le compte vient du lien serveur protégé', async () => {
  const f = billingFixtures()
  await billing.recordPartnerPaidInvoice(f.sb, f.stripe, 'in_example', false)
  assert.equal(f.calls[0].args.p_auth_user_id, 'auth_example')
  assert.equal(f.calls[0].args.p_amount_paid, 2999)
  assert.equal(f.calls[0].args.p_interval, 'month')
})
test('Facture avant identité : preuve conservée sans choisir un compte', async () => {
  const f = billingFixtures({ links: [], rpcStatus: 'waiting_billing_identity' })
  assert.equal((await billing.recordPartnerPaidInvoice(f.sb, f.stripe, 'in_example', false)).status, 'waiting_billing_identity')
  assert.equal(f.calls[0].args.p_auth_user_id, null)
  assert.equal(f.calls[0].args.p_invoice_id, 'in_example')
  assert.equal(f.calls[0].args.p_customer_id, 'cus_example')
})
test('Facture avant identité : panne d’écriture ou de lecture oblige à reprendre', async () => {
  for (const overrides of [{ links: [], rpcError: { message: 'offline' } }, { readError: { message: 'offline' } }]) {
    const f = billingFixtures(overrides)
    await assert.rejects(billing.recordPartnerPaidInvoice(f.sb, f.stripe, 'in_example', false), /failed|unavailable/)
  }
})
test('Facture : un essai gratuit ne crée pas de droit', async () => {
  const f = billingFixtures({ invoice: { amount_paid: 0 } })
  assert.equal((await billing.recordPartnerPaidInvoice(f.sb, f.stripe, 'in_example', false)).status, 'no_paid_amount')
  assert.equal(f.calls.length, 0)
})
for (const [name, overrides, error] of [
  ['client différent', { links: [{ user_id: 'other', stripe_customer_id: 'cus_other', provider: 'stripe' }] }, /identity/],
  ['propriétaires multiples', { links: [{ user_id: 'one', stripe_customer_id: 'cus_example', provider: 'stripe' }, { user_id: 'two', stripe_customer_id: 'cus_example', provider: 'stripe' }] }, /identity/],
  ['paiement non confirmé', { invoice: { status: 'open' } }, /not_paid/],
  ['mode réel inattendu', { invoice: { livemode: true } }, /mode/],
  ['facture partielle', { invoice: { lines: { has_more: true, data: invoice.lines.data } } }, /lines/],
  ['mise à jour proratisée', { invoice: { billing_reason: 'subscription_update' } }, /reason/],
  ['erreur de base', { rpcError: { message: 'database unavailable' } }, /failed/],
]) test('Facture refusée et rejouable : ' + name, async () => {
  const f = billingFixtures(overrides)
  await assert.rejects(billing.recordPartnerPaidInvoice(f.sb, f.stripe, 'in_example', false), error)
})
test('Facture : versions ancienne et récente comprises, contradictions refusées', () => {
  assert.equal(billing.invoiceSubscription({ parent: { subscription_details: { subscription: { id: 'sub_new' } } } }), 'sub_new')
  assert.throws(() => billing.invoiceSubscription({ subscription: 'sub_old', parent: { subscription_details: { subscription: 'sub_new' } } }), /conflict/)
  const proof = billing.invoiceLineProof({ lines: { has_more: false, data: [{ quantity: 1, pricing: { price_details: { price: 'price_new' } }, parent: { subscription_item_details: { proration: false } } }] } })
  assert.equal(proof.priceId, 'price_new')
})
test('Remboursement partiel : incident conservé sur la facture', async () => {
  const f = billingFixtures()
  await billing.recordPartnerInvoiceIssue(f.sb, f.stripe, { type: 'charge.refunded', livemode: false, data: { object: { id: 'ch_example' } } })
  assert.equal(f.calls[0].name, 'partner_invoice_issue_observation_begin')
  assert.equal(f.calls[1].name, 'partner_record_invoice_issues')
  assert.equal(f.calls[1].args.p_kind, 'refund')
  assert.equal(f.calls[1].args.p_status, 'partially_refunded')
  assert.equal(f.calls[1].args.p_issue_id, 'ch_example')
})
test('Contestation : relire le résultat réel, même après un ancien événement', async () => {
  const f = billingFixtures()
  await billing.recordPartnerInvoiceIssue(f.sb, f.stripe, { type: 'charge.dispute.created', livemode: false, data: { object: { id: 'dp_example', status: 'needs_response' } } })
  assert.equal(f.calls[1].args.p_status, null)
  assert.equal(f.calls[1].args.p_kind, 'dispute')
  assert.equal(f.calls[1].args.p_issue_id, 'dp_example')
})
test('Charge récente : retrouver sa facture via le paiement, sans dépendre du champ retiré', async () => {
  const f = billingFixtures({ charge: { invoice: undefined } })
  await billing.recordPartnerInvoiceIssue(f.sb, f.stripe, { type: 'charge.refunded', livemode: false, data: { object: { id: 'ch_example' } } })
  assert.equal(f.calls[0].name, 'partner_invoice_issue_observation_begin')
  assert.deepEqual([...f.calls[1].args.p_invoice_ids], ['in_example'])
})

const { NextRequest } = require('next/server')
function applicationRoute(result, err = null) {
  const calls = [], emails = [], processing = []
  const handler = load('src/app/api/partner/apply/route.ts', {
    '@/lib/supabaseServeur': { clientServeurOuNull: () => ({ rpc: async (name, params) => { calls.push({ name, params }); return { data: result, error: err } } }) },
    '@/lib/partnerRateKey': { partnerRateKey: () => 'a'.repeat(64) },
    '@/lib/partnerApplicationMail': {
      processPartnerApplicationMail: async (_sb, reference) => { processing.push(reference) },
      partnerApplicationConfirmation: async () => 'unavailable',
    },
  })
  return { handler, calls, emails, processing }
}
function request(body = validApplication, key = '11111111-1111-4111-8111-111111111111', origin = 'http://localhost:3419') {
  return new NextRequest('http://localhost:3419/api/partner/apply', {
    method: 'POST', headers: { 'content-type': 'application/json', origin, 'idempotency-key': key }, body: JSON.stringify(body),
  })
}
test('Dépôt : référence enregistrée, email non confirmé dit comme tel', async () => {
  const f = applicationRoute({ application: { reference: 'APP-EXAMPLE', status: 'received' }, replayed: false })
  const response = await f.handler.POST(request())
  const body = await response.json()
  assert.equal(response.status, 201)
  assert.equal(body.data.confirmation_email, 'unavailable')
  assert.equal(f.calls[0].params.p_category, 'training')
  assert.equal(f.calls[0].params.status, undefined)
})
test('Dépôt : nouvelle tentative reprend la file avec la même référence', async () => {
  const f = applicationRoute({ application: { reference: 'APP-EXAMPLE', status: 'received' }, replayed: true })
  assert.equal((await f.handler.POST(request())).status, 200)
  assert.equal(f.processing.length, 1)
  assert.equal(f.processing[0], 'APP-EXAMPLE')
})
test('Dépôt : refuse une origine étrangère et une clé manquante', async () => {
  const f = applicationRoute(null)
  assert.equal((await f.handler.POST(request(validApplication, undefined, 'https://other.example'))).status, 403)
  assert.equal((await f.handler.POST(request(validApplication, ''))).status, 400)
  assert.equal(f.calls.length, 0)
})
test('Dépôt : aucun état approuvé ni champ privé ne traverse le formulaire', async () => {
  const f = applicationRoute(null)
  assert.equal((await f.handler.POST(request({ ...validApplication, status: 'approved' }))).status, 400)
  assert.equal(f.calls.length, 0)
})
test('Dépôt : panne distincte du refus et aucune donnée brute renvoyée', async () => {
  const f = applicationRoute(null, { code: 'XX001', message: 'sensitive internal details' })
  const response = await f.handler.POST(request())
  assert.equal(response.status, 503)
  assert.doesNotMatch(await response.text(), /sensitive internal/)
  assert.equal(f.emails.length, 0)
})
test('Dépôt : plafond persistant respecté et reprise indiquée', async () => {
  const f = applicationRoute(null, { message: 'RATE_LIMITED' })
  const response = await f.handler.POST(request())
  assert.equal(response.status, 429)
  assert.equal(response.headers.get('retry-after'), '900')
})

const attribution = load('src/lib/partnerCheckoutAttribution.ts')
const billingLink = load('src/lib/lierAbonnement.ts')
const checkoutProof = { checkoutId: 'cs_example', customerId: 'cus_example', subscriptionId: 'sub_example', authUserId: 'auth-example' }
const createdCheckout = { id: 'cs_example', livemode: false, line_items: { has_more: false, data: [{ quantity: 1, price: { id: 'price_created', product: 'prod_created', active: false, livemode: false, currency: 'eur', unit_amount: 2999, recurring: { interval: 'month', interval_count: 1 } } }] } }
test('Prix : enregistrer l’identifiant issu de la caisse créée, avec son produit et sa formule', async () => {
  let args
  await attribution.registerPartnerCheckoutPrice({ rpc: async (name, p) => { args = p; assert.equal(name, 'partner_billing_price_register'); return { data: { status: 'registered', price_id: p.p_price_id } } } }, createdCheckout, { interval: 'month', unitAmount: 2999 })
  assert.equal(args.p_checkout_id, 'cs_example')
  assert.equal(args.p_product_id, 'prod_created')
  assert.equal(args.p_unit_amount, 2999)
})
test('Prix : aucun enregistrement si la caisse ne prouve pas la formule décidée', async () => {
  for (const modify of [s => { delete s.line_items }, s => { s.line_items.has_more = true }, s => { s.line_items.data[0].quantity = 2 }, s => { s.line_items.data[0].price.unit_amount = 9700 }, s => { s.line_items.data[0].price.recurring.interval = 'week' }, s => { s.line_items.data[0].price.livemode = true }]) {
    const session = JSON.parse(JSON.stringify(createdCheckout)); modify(session)
    let calls = 0
    await assert.rejects(() => attribution.registerPartnerCheckoutPrice({ rpc: async () => { calls++; } }, session, { interval: 'month', unitAmount: 2999 }), /prix_caisse_non_prouve/)
    assert.equal(calls, 0)
  }
})
test('Prix : une preuve non enregistrée doit garder le paiement fermé', async () => {
  await assert.rejects(() => attribution.registerPartnerCheckoutPrice({ rpc: async () => ({ error: { message: 'unavailable' } }) }, createdCheckout, { interval: 'month', unitAmount: 2999 }), /prix_caisse_non_enregistre/)
})
test('Caisse web : conserver une invitation avant la création du client', async () => {
  const calls = []
  await attribution.preparePartnerCheckout({ rpc: async (name, args) => { calls.push({ name, args }); return { data: { status: 'prepared' } } } }, { checkoutId: 'cs_example', customerId: null, code: 'ABC123', authUserId: 'auth-example' })
  assert.equal(calls[0].args.p_customer_id, null)
  assert.equal(calls[0].args.p_auth_user_id, 'auth-example')
  assert.equal(calls[0].name, 'partner_referral_intent')
})
test('Caisse web : une intention non conservée interdit de rendre le paiement', async () => {
  await assert.rejects(() => attribution.preparePartnerCheckout({ rpc: async () => ({ error: { message: 'database unavailable' } }) }, { checkoutId: 'cs_example', customerId: null, code: 'ABC123', authUserId: 'auth-example' }), /parrainage_non_enregistre/)
})
for (const status of ['attached', 'already_attached', 'not_requested']) test('Caisse web : reprendre les factures après ' + status, async () => {
  const calls = []
  await attribution.bindPartnerCheckout({ rpc: async (name, args) => { calls.push({ name, args }); return { data: name.endsWith('_bind') ? { status } : { reconciled: 2 } } } }, checkoutProof)
  assert.equal(calls.length, 2)
  assert.equal(calls[1].name, 'partner_reconcile_paid_invoices')
  assert.equal(calls[1].args.p_auth_user_id, checkoutProof.authUserId)
})
for (const status of ['waiting_driver', 'needs_review']) test('Caisse web : ne pas inventer une attribution pour ' + status, async () => {
  const calls = []
  assert.equal(await attribution.bindPartnerCheckout({ rpc: async (name) => { calls.push(name); return { data: { status } } } }, checkoutProof), status)
  assert.equal(calls.length, 1)
})
test('Caisse web : échec de reprise financière doit rester rejouable', async () => {
  await assert.rejects(() => attribution.bindPartnerCheckout({ rpc: async name => name.endsWith('_bind') ? { data: { status: 'attached' } } : { error: { message: 'interrupted' } } }, checkoutProof), /reprise_factures_non_confirmee/)
})
test('Facturation : passer par la transaction protégée et refuser toute confirmation incomplète', async () => {
  let used
  await billingLink.lierAbonnement({ rpc: async (name, args) => { used = { name, args }; return { data: { status: 'linked', subscription_row_id: 'row-example' } } } }, { userId: 'auth-example', customerId: 'cus_example', subscriptionId: 'sub_example', status: 'active', periodEnd: null, pricePerMonth: 29.99 })
  assert.equal(used.name, 'partner_billing_link')
  assert.equal(used.args.p_auth_user_id, 'auth-example')
  await assert.rejects(() => billingLink.lierAbonnement({ rpc: async () => ({ data: { status: 'linked' } }) }, {}), /ecriture_lien_abonnement/)
})

function mailWorker({ accepted = true, completeError = false, empty = false, throws = false } = {}) {
  const calls = [], emails = []
  const sender = async body => { emails.push(body); if (throws) throw new Error('temporary'); return { accepted, providerId: accepted ? 'provider-example' : null } }
  const worker = load('src/lib/partnerApplicationMail.ts', { '@/lib/email': { sendPartnerApplicantEmail: sender, sendPartnerInternalEmail: sender } })
  const sb = { rpc: async (name, args) => {
    calls.push({ name, args })
    if (name.endsWith('_claim')) return { data: { jobs: empty ? [] : [{ id: 'job-example', application_id: 'application-example', kind: 'applicant', lease_id: 'lease-example', body: { email: 'test@example.invalid', company_name: 'Recorded company', contact_name: 'Recorded contact' } }] } }
    if (name.endsWith('_status')) return { data: { applicant: accepted ? 'accepted' : 'retry' } }
    return completeError ? { error: { message: 'interrupted' } } : { data: { state: args.p_provider_id ? 'accepted' : 'retry' } }
  } }
  return { worker, sb, calls, emails }
}
test('Confirmation : envoyer le contenu enregistré et enregistrer le reçu fournisseur', async () => {
  const f = mailWorker()
  const result = await f.worker.processPartnerApplicationMail(f.sb, 'application-example')
  assert.equal(result.accepted, 1)
  assert.equal(f.emails[0].companyName, 'Recorded company')
  assert.equal(f.emails[0].reference, 'application-example')
  assert.equal(f.calls[1].args.p_provider_id, 'provider-example')
})
test('Confirmation : une réservation vide ne renvoie jamais les emails déjà acceptés', async () => {
  const f = mailWorker({ empty: true })
  assert.equal((await f.worker.processPartnerApplicationMail(f.sb)).processed, 0)
  assert.equal(f.emails.length, 0)
})
test('Confirmation : refus ou interruption conserve une reprise durable', async () => {
  for (const options of [{ accepted: false }, { throws: true }]) {
    const f = mailWorker(options)
    assert.equal((await f.worker.processPartnerApplicationMail(f.sb)).pending, 1)
    assert.equal(f.calls[1].args.p_provider_id, null)
  }
})
test('Confirmation : une preuve non enregistrée ne devient pas un succès', async () => {
  const f = mailWorker({ completeError: true })
  await assert.rejects(() => f.worker.processPartnerApplicationMail(f.sb), /confirmation_resultat_non_enregistre/)
})
test('Confirmation : pending reste distinct de accepted', async () => {
  const f = mailWorker({ accepted: false })
  assert.equal(await f.worker.partnerApplicationConfirmation(f.sb, 'application-example'), 'pending')
})

function welcomeWorker(status = 'send', provider = true, completeError = false) {
  const calls = [], messages = []
  const worker = load('src/lib/partnerCheckoutWelcome.ts', { '@/lib/email': { sendWelcomeEmailReceipt: async input => { messages.push(input); return { accepted: provider, providerId: provider ? 'provider-example' : null } } } })
  const sb = { rpc: async (name, args) => { calls.push({ name, args }); return name.endsWith('_claim') ? { data: { status, lease_id: 'lease-example' } } : completeError ? { error: { message: 'interrupted' } } : { data: { status: provider ? 'accepted' : 'retry' } } } }
  const message = { email: 'welcome@example.invalid', name: 'Example', plan: 'Mensuel', trialEnd: '11 septembre', credentials: { email: 'welcome@example.invalid', password: 'synthetic-for-isolated-test' } }
  return { worker, sb, calls, messages, message }
}
test('Bienvenue : reçu conservé, clé fournisseur stable et aucun mot de passe en base', async () => {
  const f = welcomeWorker()
  assert.equal(await f.worker.sendCheckoutWelcome(f.sb, 'cs_example', 'auth-example', f.message), true)
  assert.equal(f.messages[0].deliveryKey, 'checkout-welcome/cs_example')
  assert.match(f.calls[0].args.p_body_sha256, /^[0-9a-f]{64}$/)
  assert.doesNotMatch(JSON.stringify(f.calls), /synthetic-for-isolated-test|welcome@example/)
})
test('Bienvenue : un reçu déjà accepté ne déclenche aucun nouvel email', async () => {
  const f = welcomeWorker('accepted')
  assert.equal(await f.worker.sendCheckoutWelcome(f.sb, 'cs_example', 'auth-example', f.message), true)
  assert.equal(f.messages.length, 0)
})
test('Bienvenue : une issue incertaine reste à vérifier sans nouvel email', async () => {
  const f = welcomeWorker('needs_review')
  assert.equal(await f.worker.sendCheckoutWelcome(f.sb, 'cs_example', 'auth-example', f.message), false)
  assert.equal(f.messages.length, 0)
})
test('Bienvenue : envoi échoué ou reçu non conservé maintiennent la reprise', async () => {
  for (const f of [welcomeWorker('in_progress'), welcomeWorker('send', false), welcomeWorker('send', true, true)]) {
    await assert.rejects(() => f.worker.sendCheckoutWelcome(f.sb, 'cs_example', 'auth-example', f.message), /welcome_retry_required|welcome_receipt_not_saved/)
  }
})

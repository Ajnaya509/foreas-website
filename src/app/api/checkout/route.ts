import { NextRequest, NextResponse, after } from 'next/server'
import { identiteDepuisCookie, monterUneMarche } from '@/lib/escalier'
import { clientServeurOuNull } from '@/lib/supabaseServeur'
import { syncAdvertisingConsentAtCheckout } from '@/lib/advertisingConsentServer'
import Stripe from 'stripe'
import { resolveReferralOffer } from '@/lib/referralOfferServer'
import { normalizeReferralCode, discountForPlan, ensureReferralCoupon, ReferralOfferError } from '@/lib/referralOffer'
import { PRIX_MENSUEL_CENTIMES, PRIX_ANNUEL_CENTIMES, ESSAI_JOURS, resoudreFormule } from '@/lib/offre'
import { CheckoutOwnerError, verifiedCheckoutAccount } from '@/lib/checkoutOwner'
import { uniqueCheckout, UniqueCheckoutError } from '@/lib/uniqueCheckout'
import { checkoutEligibility } from '@/lib/checkoutEligibility'
import { paymentLinkOffer, checkLegacyPaymentLink, attachPaymentOffer } from '@/lib/paymentLinkOffer'
import { calculerDebitDuJour } from '@/lib/politiquePaiement'
import { UUID_PATTERN } from '@/lib/partnerApplication'
import { preparePartnerCheckout, registerPartnerCheckoutPrice } from '@/lib/partnerCheckoutAttribution'
import { ENROLLMENT_VERSION, enrollmentIntentCode, isEnrollmentCode, prepareEnrollmentCheckout } from '@/lib/partnerEnrollmentAttribution'

// ─── Prix : construits dynamiquement, PAS de Price ID Stripe pré-créé ────────
// Le mapping PRICE_IDS (Pro 97€ / Elite 247€ / weekly grandfathering / alias vip_*) a été
// retiré le 22/07 avec le passage à l'abonnement unique (29,99€/mois · 249,99€/an).
// Il portait l'ANCIENNE grille et n'avait plus aucun appelant vivant (audit grep : 6 clés
// mortes sur 8). Le laisser aurait été un piège : le chemin essai le consultait encore et
// aurait facturé 97€ au lieu de 29,99€. Les montants vivent maintenant en un seul endroit,
// plus bas dans POST (PRICE_CENTS / ANNUAL_PRICE_CENTS), en miroir de src/app/pay/[id]/route.ts.
// Les abonnés Phase A déjà créés côté Stripe gardent leur Price d'origine — rien ne change
// pour eux, ce fichier ne sert qu'à créer de NOUVELLES sessions.

// Lazy init to avoid build-time error when STRIPE_SECRET_KEY is not set
function getStripe() {
  const key = (process.env.STRIPE_SECRET_KEY || '').replace(/\s/g, '')
  return new Stripe(key, {
    /*
       ⚠️ CONVERSION VOLONTAIRE, ET ELLE PROTÈGE PLUS QU'ELLE NE CONTOURNE.
       Depuis la montée de `stripe` en 18.5, le type de `apiVersion` ne décrit
       plus que la dernière version (`2025-08-27.basil`). Or ce client DOIT
       rester sur Acacia : Basil déplace `current_period_end` hors de
       l'abonnement, et tout ce fichier lit la forme Acacia.
       À l'exécution, la version d'API n'est qu'un en-tête HTTP — Stripe accepte
       toutes celles qu'il connaît. Retirer cette conversion en changeant la
       valeur casserait la lecture des abonnements, en silence.
    */
      apiVersion: '2025-02-24.acacia' as Stripe.StripeConfig['apiVersion'],
    timeout: 8000,
    maxNetworkRetries: 1,
  })
}

/** Checkout creation, recovery and expiry share the Basil contract in both
 * producers. This supports custom, embedded and hosted presentations under
 * the same account gate. Existing subscription readers keep their version. */
function getStripeElements() {
  const key = (process.env.STRIPE_SECRET_KEY || '').replace(/\s/g, '')
  return new Stripe(key, {
    apiVersion: '2025-08-27.basil',
    timeout: 8000,
    maxNetworkRetries: 1,
  })
}

/**
 * Essai GLISSANT de 3 jours (decision Chandler, brief BRIEF_PALIERS_ABONNEMENT_2026-07-22).
 * Avant : essai jusqu'au "prochain lundi 18h Paris" — un point fixe hebdomadaire, donc une
 * duree reelle qui variait de 1 a 7 jours selon le jour d'inscription. Un chauffeur qui
 * s'inscrivait le dimanche soir avait ~1 jour d'essai, celui du mardi matin en avait 6 :
 * meme promesse affichee, experience deux fois differente. Glissant = tout le monde a
 * exactement 3 jours, quel que soit le moment de l'inscription.
 * Stripe exige trial_end >= 48h dans le futur : 3 jours passe largement.
 */
const TRIAL_DAYS = ESSAI_JOURS // src/lib/offre.ts — seul endroit où la durée d'essai vit
function getTrialEnd(): number {
  return Math.floor(Date.now() / 1000) + TRIAL_DAYS * 24 * 60 * 60
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Clé Stripe non configurée' }, { status: 500 })
    }
    const attributionDb = clientServeurOuNull()
    if (!attributionDb) throw new CheckoutOwnerError(503, 'La vérification de ton compte est indisponible.')
    const beneficiary = await verifiedCheckoutAccount(attributionDb, request.headers.get('authorization'))
    const stripe = getStripe()
    const body = await request.json()
    const { plan, mode, referral_code, payment_link } = body
    const eligibility = await checkoutEligibility(attributionDb, stripe, beneficiary.userId)
    if (eligibility.active) return NextResponse.json({ alreadySubscribed: true, accountId: beneficiary.userId }, { status: 409, headers: { 'Cache-Control': 'no-store' } })
    // An explicit direct-payment page may waive a new account’s trial.
    // A caller can never restore a trial already used by this account.
    const immediate = eligibility.immediate || body.immediate === true
    const linkedOffer = payment_link === undefined ? null : await paymentLinkOffer(attributionDb, payment_link)
    const submittedKey = request.headers.get('idempotency-key')
    if (submittedKey && !UUID_PATTERN.test(submittedKey)) return NextResponse.json({ error: 'La demande de paiement est invalide.' }, { status: 400 })

    const cookieHeader = request.headers.get('cookie') || ''
    if (referral_code !== undefined && typeof referral_code !== 'string') return NextResponse.json({ error: 'Code parrain invalide.' }, { status: 400 })
    const rawReferral = referral_code === '' ? null : referral_code ?? linkedOffer?.referralCode ?? request.cookies.get('foreas_partner_ref')?.value ?? await enrollmentIntentCode(attributionDb, beneficiary.userId)
    const effectiveReferralCode = rawReferral == null ? null : normalizeReferralCode(rawReferral)
    if (rawReferral != null && !effectiveReferralCode) return NextResponse.json({ error: 'Ce code parrain n’est pas reconnu. Vérifie-le ou retire-le avant de continuer.', code: 'CODE_UNAVAILABLE' }, { status: 422 })

    // ── 23/08 — QUI COMMENCE À PAYER ? ────────────────────────────────────────
    // Cette route ne connaissait AUCUNE identité. Le paiement partait donc chez
    // Stripe sans qu'on sache à qui l'attacher, et l'escalier ne pouvait pas
    // monter : `paiement_commence`, `essai_actif` et `paiement_confirme`
    // n'avaient aucun émetteur.
    //
    // On résout CÔTÉ SERVEUR depuis le cookie de première partie. Le navigateur
    // porte un badge, il ne choisit pas son identité. Sans certitude, on rend
    // `null` — et la marche ne monte pas plutôt que de monter chez quelqu'un
    // d'autre.
    const identiteVisiteur = await identiteDepuisCookie(cookieHeader)

    if (!plan) {
      return NextResponse.json({ error: 'Plan requis' }, { status: 400 })
    }

    // ⚠️ 21/08/2026 — CE TUNNEL ACCEPTAIT N'IMPORTE QUELLE FORMULE.
    //
    // Mesuré en production : un POST avec `plan: 'elite_monthly'` — une formule
    // retirée du catalogue — renvoyait 200 et une VRAIE session de paiement.
    //
    // Le garde existait pourtant. `resoudreFormule()` est écrite exactement pour
    // ça, et son propre commentaire dit : « Renvoie null si la formule demandée
    // n'existe plus (ex. elite_monthly) — l'appelant DOIT alors refuser la
    // souscription. » Cette route ne l'appelait pas. Un garde-fou écrit puis
    // jamais branché ne protège de rien : il rassure.
    //
    // ⚠️ ET LE SECOND DÉFAUT EST PIRE QUE LE PREMIER. L'intervalle se déduisait
    // du SUFFIXE de la chaîne envoyée par le navigateur :
    //     const isAnnual = plan.endsWith('_annual')
    // Donc `elite_annual` — une formule qui n'existe plus — aurait été facturée
    // à l'année. On lisait le nom du plan pour décider du montant, au lieu de
    // lire la formule résolue. Un identifiant fourni par l'appelant ne décide
    // pas d'un prix.
    const formule = resoudreFormule(typeof plan === 'string' ? plan : null)
    if (!formule) {
      console.warn(`[checkout] formule refusée : ${String(plan).slice(0, 40)}`)
      return NextResponse.json(
        { error: 'Cette formule n’est plus proposée. Choisis une offre sur /tarifs3.' },
        { status: 400 },
      )
    }
    // Reactivation / tarifs2 (paiement immédiat) : prix canonique 29,99€/mois,
    // construit dynamiquement — ne dépend PAS d'un Price ID Stripe pré-créé sur Vercel,
    // pour ne jamais désynchroniser affichage vs montant réellement prélevé.
    // Annuel = même règle que /pay/[id] (recurring interval year) — sans ce cas, un plan
    // `*_annual` était silencieusement facturé au mois (bug corrigé 13/07). 249,99€ fixe
    // (pas ×10) depuis le passage à l'abonnement unique (décision Chandler, brief
    // BRIEF_PALIERS_ABONNEMENT_2026-07-22) — même constante en miroir dans
    // src/app/pay/[id]/route.ts, à garder synchro : deux points d'entrée (site direct et
    // lien WhatsApp) doivent facturer exactement le même montant annuel.
    const PRICE_CENTS = PRIX_MENSUEL_CENTIMES   // src/lib/offre.ts
    const ANNUAL_PRICE_CENTS = PRIX_ANNUEL_CENTIMES // src/lib/offre.ts
    // L'intervalle vient de la formule RÉSOLUE, plus du nom envoyé par le navigateur.
    const isAnnual = formule === 'annuel'

    if (body.expectedTrial !== undefined && (typeof body.expectedTrial !== 'boolean' || body.expectedTrial !== !immediate)) {
      return NextResponse.json({ error: 'Les conditions de ton abonnement ont changé. Vérifie le montant avant de continuer.', code: 'CONDITIONS_CHANGED' }, { status: 409 })
    }
    if (linkedOffer) await checkLegacyPaymentLink(attributionDb, stripe, linkedOffer, beneficiary.userId, true)

    const referralOffer = effectiveReferralCode ? await resolveReferralOffer(effectiveReferralCode) : null
    const enrollmentReferral = isEnrollmentCode(effectiveReferralCode)
    const discount = referralOffer ? discountForPlan(referralOffer, isAnnual) : { percent: 0, months: null, duration: 'none' as const }
    const referralDiscountPct = discount.percent
    const referralCouponId = discount.percent > 0 && discount.duration !== 'none'
      ? await ensureReferralCoupon(stripe, discount.percent, discount.months, discount.duration, referralOffer!.sponsor_type)
      : null

    // ⚠️ Prix construit dynamiquement dans LES DEUX cas (essai ET paiement immédiat).
    // Avant, seul le chemin `immediate` utilisait price_data ; le chemin essai passait par
    // PRICE_IDS[plan] → des Price Stripe pré-créés qui portent ENCORE l'ancienne grille
    // (STRIPE_PRICE_ID_PRO_MONTHLY = 97€/mois, _ANNUAL = 970€/an, cf. en-tête du fichier).
    // Rebrancher l'essai sans ça aurait facturé 97€ au lieu de 29,99€ — le triple, en silence.
    // Un seul chemin de prix = l'affichage et le montant prélevé ne peuvent plus diverger.
    const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = {
      price_data: {
        currency: 'eur',
        product_data: { name: isAnnual ? 'FOREAS — Annuel' : 'FOREAS' },
        unit_amount: isAnnual ? ANNUAL_PRICE_CENTS : PRICE_CENTS,
        recurring: { interval: isAnnual ? 'year' : 'month' },
      },
      quantity: 1,
    }
    const origin = request.nextUrl.origin
    const isEmbedded = mode === 'embedded'
    /**
     * `mode: 'elements'` — le mode où NOUS dessinons les champs.
     *
     * ⚠️ CE N'EST PAS UN TROISIÈME TUNNEL, C'EST LE MÊME.
     * Il crée une SESSION CHECKOUT, exactement comme les deux autres. Donc
     * l'événement `checkout.session.completed` part, donc le webhook crée le
     * compte et envoie le mail. C'est toute la différence avec la pile fermée le
     * 21/08 (`stripe.subscriptions.create`), qui débitait sans provisionner.
     * Seule l'INTERFACE change : Stripe n'affiche plus rien, il encaisse.
     */
    const isElements = mode === 'elements'
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      expand: ['line_items.data.price'],
      line_items: [lineItem],
      /* ⚠️ 29/08 — CETTE LIGNE EMPÊCHAIT TOUT PAIEMENT SUR /tarifs3.
         `required` oblige Stripe à obtenir une adresse de facturation complète
         avant d'accepter la confirmation. En mode embarqué (/tarifs3) c'est
         Stripe qui dessine ce formulaire, donc il l'obtient. En `ui_mode:
         'custom'` (/tarifs3) c'est NOUS qui dessinons : il n'y a ni champ
         adresse, ni `updateBillingAddress`. Stripe refusait donc la
         confirmation — avec n'importe quelle carte.

         ⚠️ ET ÇA NE LAISSAIT AUCUNE TRACE CÔTÉ SERVEUR. Le refus a lieu DANS LE
         NAVIGATEUR, avant le moindre appel d'API : les journaux Stripe ne
         montrent que des 200. On pouvait regarder le tableau de bord toute la
         journée sans rien voir. C'est Chandler, carte en main, qui l'a trouvé.

         `auto` laisse Stripe ne réclamer que ce dont le moyen de paiement a
         vraiment besoin — pour une carte, le code postal, affiché dans le champ
         de carte lui-même. /tarifs3 garde `required` : son formulaire est
         dessiné par Stripe, il sait le remplir. */
      billing_address_collection: isElements ? 'auto' : 'required',
      locale: 'fr',
      /**
       * Le paiement ne transporte plus un « oui » lu dans un cookie. Stripe
       * n'est pas la source du consentement : P29 relit la preuve serveur
       * courante sur l'identité canonique avant tout envoi publicitaire.
       */
      metadata: {
        ...(enrollmentReferral ? { foreas_partner_enrollment: ENROLLMENT_VERSION } : {}),
        ...(linkedOffer ? { foreas_payment_link_id: linkedOffer.id } : {}),
        foreas_measurement_source: 'p29_private_queue',
        // 17/09/2026 — le compte FOREAS VÉRIFIÉ voyage avec le paiement. Sans lui, le
        // webhook et la synchro ne pouvaient relier l'abonnement que par l'e-mail.
        foreas_user_id: beneficiary.userId,
        // Copie de référence ; l'intention privée enregistrée ci-dessous fait foi.
        ...(effectiveReferralCode ? { referral_code: effectiveReferralCode } : {}),
      },
      client_reference_id: beneficiary.userId,
      subscription_data: {
        // `immediate` → on encaisse TOUT DE SUITE (pas de trial_end).
        // Sinon : essai glissant de 3 jours, identique pour tous (voir getTrialEnd).
        ...(immediate ? {} : { trial_period_days: TRIAL_DAYS }),
        metadata: {
          ...(enrollmentReferral ? { foreas_partner_enrollment: ENROLLMENT_VERSION } : {}),
          // Le compte vérifié : c'est LUI que la synchro Stripe → FOREAS lit en premier.
          foreas_user_id: beneficiary.userId,
          // L'identité voyage jusqu'au webhook : lui n'a ni cookie ni session.
          // Sans elle, un paiement confirmé ne saurait pas quel escalier monter.
          ...(identiteVisiteur ? { foreas_identity_id: identiteVisiteur } : {}),
          // ⚠️ 21/08/2026 — ON ÉCRIVAIT L'ALIAS BRUT DU NAVIGATEUR.
          //
          // `resoudreFormule()` est appelée cinquante lignes plus haut, et son
          // résultat était ignoré ici : c'est la chaîne reçue de l'appelant qui
          // partait dans les métadonnées Stripe — donc dans le mail de bienvenue
          // et dans le nom de produit envoyé aux régies publicitaires.
          //
          // Elle porte encore le nom d'une grille tarifaire retirée en juillet.
          //
          // ⚠️ ET CE N'ÉTAIT PAS DORMANT. Le webhook déduisait l'intervalle de
          // cette chaîne, en respectant la casse, alors que la résolution, elle,
          // met en minuscules. Un POST avec « ANNUEL » — cette route est publique
          // et sans session — était facturé à l'année ET enregistré comme mensuel.
          //
          // On écrit la formule RÉSOLUE. On garde la demande d'origine à côté :
          // elle sert à comprendre d'où vient un appel, jamais à décider d'un prix.
          plan: formule,
          plan_demande: String(plan).slice(0, 40),
          flow: immediate ? 'immediate' : 'trial',
          ...(effectiveReferralCode ? { referral_code: effectiveReferralCode } : {}),
          // Remise comptable et coupon suivent la même offre vérifiée.
          ...(referralDiscountPct > 0 && referralCouponId
            ? { referral_discount_pct: String(referralDiscountPct) }
            : {}),
        },
      },
      payment_method_collection: 'always',
      /**
       * ⚠️ CES DEUX CHAMPS N'EXISTENT QU'EN MODE EMBARQUÉ OU HÉBERGÉ.
       * C'est Stripe qui les dessine et les remplit ; en `ui_mode: 'custom'` il
       * ne dessine plus rien, donc ils resteraient vides pour toujours — et le
       * webhook, qui les lit ligne 411 pour créer le compte, recevrait `null`.
       * En mode `elements`, c'est NOTRE formulaire qui les collecte et
       * `POST /api/checkout/coordonnees` les attache aux métadonnées de la
       * session avant la confirmation. Le webhook lit les deux endroits.
       */
      ...(isElements ? {} : { custom_fields: [
        {
          key: 'phone',
          label: { type: 'custom', custom: 'Numéro de téléphone' },
          type: 'numeric',
          optional: false,
        },
        {
          key: 'city',
          label: { type: 'custom', custom: "Ville principale d'activité" },
          type: 'text',
          optional: false,
        },
      ] }),
      ...(isElements
        ? { ui_mode: 'custom' as const, return_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}` }
        : isEmbedded
          ? { ui_mode: 'embedded' as const, return_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}` }
          : { success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`, cancel_url: `${origin}/tarifs3?canceled=true` }),
    }

    // Le programme partenaire donne désormais 10 % sur les deux périodicités.
    // discountForPlan conserve séparément les règles du parrainage chauffeur.
    if (referralCouponId) {
      sessionParams.discounts = [{ coupon: referralCouponId }]
    } else {
      sessionParams.allow_promotion_codes = true
    }

    // Checkout operations share Basil and the same private account reservation.
    // Subscription readers keep their existing provider version.
    sessionParams.customer_email = beneficiary.email
    const session = await uniqueCheckout({
      db: attributionDb, stripe: getStripeElements(), userId: beneficiary.userId,
      livemode: /^sk_live_/.test((process.env.STRIPE_SECRET_KEY || '').replace(/\s/g, '')),
      params: sessionParams,
      context: { formule, immediate, referral: effectiveReferralCode, discount, offerId: linkedOffer?.id ?? null },
      validate: async () => {
        const current = await checkoutEligibility(attributionDb, stripe, beneficiary.userId)
        if (current.active) throw new CheckoutOwnerError(409, 'Ton abonnement est déjà actif. Retrouve-le dans ton compte FOREAS.')
        if (current.immediate && !immediate) throw new CheckoutOwnerError(409, 'Les conditions ont changé. Vérifie le montant avant de continuer.')
      },
      finalize: async (session) => {
        await registerPartnerCheckoutPrice(attributionDb, session, {
          interval: isAnnual ? 'year' : 'month', unitAmount: isAnnual ? ANNUAL_PRICE_CENTS : PRICE_CENTS,
        })
        if (effectiveReferralCode) {
          if (enrollmentReferral) {
            await prepareEnrollmentCheckout(attributionDb, {
              session, code: effectiveReferralCode, authUserId: beneficiary.userId,
              interval: isAnnual ? 'year' : 'month', unitAmount: isAnnual ? ANNUAL_PRICE_CENTS : PRICE_CENTS,
            })
          } else {
            await preparePartnerCheckout(attributionDb, {
              checkoutId: session.id,
              customerId: typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null,
              code: effectiveReferralCode, authUserId: beneficiary.userId,
            })
          }
        }
        if (linkedOffer) await attachPaymentOffer(attributionDb, linkedOffer.id, session.id, beneficiary.userId, isAnnual)
      },
    })

    // ⛔ CECI PROUVE QU'ON A COMMENCÉ À PAYER, PAS QU'ON A PAYÉ.
    // La preuve est l'identifiant de session Stripe : stable, unique,
    // vérifiable. Un rejeu de cette route ne fera pas monter deux fois.
    // Non bloquant : si l'escalier tombe, le paiement continue.
      /**
    * ⚠️ 24/08/2026 — `void` NE SUFFIT PAS SUR CET HÉBERGEUR, ET C'EST MESURÉ.
    *
    * La fonction est GELÉE dès que la réponse part : un travail lancé sans
    * rien pour le retenir peut ne jamais s'exécuter. Le commentaire du
    * webhook Stripe l'explique depuis le 21/08 — et les émetteurs de
    * l'escalier écrits le 23/08 sont tombés dans le même piège, vingt lignes
    * plus bas. Deuxième fois que la réponse était déjà écrite à côté.
    *
    * PREUVE, pas déduction : un vrai GET sur /wa (cache MISS, 307 correct)
    * n'a produit AUCUNE ligne dans `events` — alors que 244 PageView y sont
    * arrivés le même jour. Le dernier WhatsAppClick datait du 22/08.
    *
    * `after()` exécute APRÈS la réponse sans la retarder, et l'hébergeur
    * garde la fonction en vie. Ce n'est pas `await` qu'il faut : attendre
    * ferait dépendre le chemin principal de la latence de la base.
    */
    after(async () => {
      const jobs: Promise<unknown>[] = [
        monterUneMarche(identiteVisiteur, 'paiement_commence', session.id, 'site'),
      ]
      const sb = clientServeurOuNull()
      if (sb) {
        jobs.push(syncAdvertisingConsentAtCheckout(sb, identiteVisiteur, cookieHeader))
      }
      await Promise.allSettled(jobs)
    })
    // L’écran reçoit la remise effectivement attachée à cette session.
    const remiseSurLaSession = referralCouponId ? referralDiscountPct : 0
    if (isElements || isEmbedded)
      return NextResponse.json({
        clientSecret: session.client_secret,
        accountId: beneficiary.userId,
        debit: calculerDebitDuJour(formule, immediate, Date.now()),
        referralCodeConfirmed: effectiveReferralCode,
        remiseParrainPct: remiseSurLaSession,
        remiseDureeMois: remiseSurLaSession > 0 ? discount.months : null,
        remisePermanente: remiseSurLaSession > 0 && discount.duration === 'forever',
        /* Pour que l'écran puisse dire d'où vient la remise quand le chauffeur
           n'a rien tapé : elle vient de son lien de parrainage. */
        remiseHeritee: remiseSurLaSession > 0 && !referral_code,
      })
    return NextResponse.json({ url: session.url })
  } catch (error: unknown) {
    if (error instanceof UniqueCheckoutError) return NextResponse.json({ error: error.message }, { status: error.status })
    if (error instanceof CheckoutOwnerError) return NextResponse.json({ error: error.message }, { status: error.status })
    if (error instanceof ReferralOfferError) {
      return NextResponse.json({
        error: error.code === 'CODE_UNAVAILABLE'
          ? 'Ce code parrain n’est plus disponible. Vérifie-le ou retire-le pour continuer.'
          : error.code === 'TERMS_UNAVAILABLE'
            ? 'La durée de cette remise doit être confirmée par FOREAS avant de payer avec ce code.'
            : 'La remise ne peut pas être vérifiée maintenant. Réessaie avant de payer.',
        code: error.code,
      }, { status: error.code === 'CODE_UNAVAILABLE' ? 422 : 503, headers: { 'Cache-Control': 'no-store' } })
    }
    const err = error as { message?: string; type?: string; code?: string; statusCode?: number }
    // Ni dans les journaux, ni dans la réponse : aucun morceau de clé.
    // Un préfixe de clé écrit dans un journal reste lisible par quiconque accède
    // aux journaux, et il n'aide à rien pour diagnostiquer — `type` et `code`
    // Stripe suffisent. Et le message brut de Stripe, lui, contient parfois un
    // fragment de la clé (« Invalid API Key provided: sk_live_***…»), donc il ne
    // part jamais au navigateur.
    console.error('[checkout] erreur Stripe:', err.type, err.code, err.statusCode)
    return NextResponse.json(
      { error: "Le paiement n'a pas pu être initialisé. Réessaie dans un instant." },
      { status: 500 },
    )
  }
}

/**
 * Sonde publique de facturation : dit QUAND l'essai se termine, rien d'autre.
 *
 * ⚠️ 14/08/2026 — DEUXIÈME FUITE DE CLÉ TROUVÉE ICI. Cette route publiait
 * `keyPrefix: (process.env.STRIPE_SECRET_KEY).substring(0, 14)` — soit, en
 * production et sans aucun en-tête, les 14 premiers caractères de la clé Stripe
 * **LIVE** (`sk_live_51Ju…`, mesuré). `hasKey` disait en plus qu'elle existe.
 * C'est exactement le défaut fermé la veille sur `/api/diagnostic` ; il vivait
 * ici aussi, dans une route qu'on ne regarde pas parce qu'elle sert au paiement.
 *
 * Ce qui reste est volontairement public : la date de fin d'essai est une
 * information COMMERCIALE que le site affiche déjà à l'écran. Aucun secret,
 * aucune présence de clé, aucun préfixe.
 */
export async function GET() {
  const trialEnd = getTrialEnd()
  const trialDate = new Date(trialEnd * 1000)
  const now = new Date()
  const trialDays = Math.round((trialEnd * 1000 - now.getTime()) / (24 * 60 * 60 * 1000))
  return NextResponse.json(
    {
      status: 'ok',
      billing: {
        trialEndsAt: trialDate.toISOString(),
        trialDays,
        rule: `Essai glissant ${TRIAL_DAYS} jours — identique pour tous.`,
      },
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}

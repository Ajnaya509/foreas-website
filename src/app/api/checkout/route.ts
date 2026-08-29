import { NextRequest, NextResponse, after } from 'next/server'
import { identiteDepuisCookie, monterUneMarche } from '@/lib/escalier'
import { consentementPublicitaire } from '@/lib/meta-capi'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabase'
import { PRIX_MENSUEL_CENTIMES, PRIX_ANNUEL_CENTIMES, ESSAI_JOURS, resoudreFormule } from '@/lib/offre'

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

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * LE SECOND CLIENT, ET POURQUOI IL Y EN A DEUX
 * ═════════════════════════════════════════════════════════════════════════════
 *
 * `ui_mode: 'custom'` — celui qui permet de dessiner NOS champs au lieu du
 * gabarit Stripe — n'existe qu'à partir de la version d'API `2025-08-27.basil`.
 * La tentation était de monter tout le site dessus. Je l'ai mesuré avant :
 *
 * ⚠️ BASIL DÉPLACE `current_period_end` DE L'ABONNEMENT VERS SES LIGNES.
 *
 * Et `src/app/api/webhooks/stripe/route.ts` fait, ligne 445 :
 *     subscription = await stripe.subscriptions.retrieve(...)
 * puis lit `subscription.current_period_end` ligne 502. Avec Basil, ce champ
 * n'est plus là : la valeur devient `undefined`, la ligne d'abonné part sans
 * date de fin de période, et RIEN NE LÈVE D'ERREUR. Une panne muette sur le
 * chemin qui encaisse, à quarante-huit heures d'un lancement.
 *
 * D'où deux clients, et une règle simple :
 *
 *   getStripe()          → 2025-02-24.acacia — TOUT ce qui existait déjà.
 *                          Aucun appel du site ne change de comportement.
 *   getStripeElements()  → 2025-08-27.basil  — UNIQUEMENT la création d'une
 *                          session `ui_mode: 'custom'`.
 *
 * Les deux sont indépendants : une session créée en Basil produit le même
 * événement `checkout.session.completed`, et le webhook la relit avec le client
 * Acacia, donc dans la forme qu'il connaît.
 *
 * ⚠️ LE JOUR OÙ QUELQU'UN VOUDRA UNIFIER LES DEUX, il devra d'abord réparer la
 * lecture de `current_period_end` (voir la parade déjà posée dans le webhook),
 * et refaire cette mesure. Ce n'est pas un chantier de cosmétique.
 */
function getStripeElements() {
  const key = (process.env.STRIPE_SECRET_KEY || '').replace(/\s/g, '')
  return new Stripe(key, {
    apiVersion: '2025-08-27.basil',
    timeout: 8000,
    maxNetworkRetries: 1,
  })
}

// Parrainage V3 — coupon Stripe réutilisable par palier de remise (10/15/18 %).
// Récupère le coupon s'il existe, sinon le crée (id déterministe → pas de doublons Stripe).
async function ensureReferralCoupon(stripe: Stripe, pct: number): Promise<string> {
  const id = `foreas_ref_${pct}`
  try {
    await stripe.coupons.retrieve(id)
  } catch {
    await stripe.coupons.create({
      id,
      percent_off: pct,
      duration: 'forever',
      name: `Parrainage FOREAS −${pct}%`,
    })
  }
  return id
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
    const stripe = getStripe()
    const body = await request.json()
    const { plan, mode, referral_code, immediate } = body

    // Referral code: from body OR from cookie foreas_partner_ref
    const cookieHeader = request.headers.get('cookie') || ''
    const cookieRefMatch = cookieHeader.match(/foreas_partner_ref=([^;]+)/)
    const effectiveReferralCode = (referral_code || cookieRefMatch?.[1] || '').trim().toUpperCase() || null

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

    // Parrainage V3 — remise dynamique (fonction SQL, GRANT anon).
    // get_referral_discount_for_code gère DÉJÀ les codes CHAUFFEUR (palier 10/15/18 %)
    // ET les codes PARTENAIRE (sa remise si is_promo_active). Le repli explicite sur
    // get_partner_discount_for_code est une ceinture+bretelles : si la branche
    // partenaire de la 1re fonction évoluait côté fil APP, les partenaires restent
    // couverts (fonction stricte : status='active' + is_promo_active).
    let referralDiscountPct = 0
    if (effectiveReferralCode) {
      try {
        const { data } = await supabase.rpc('get_referral_discount_for_code', {
          p_code: effectiveReferralCode,
        })
        referralDiscountPct = typeof data === 'number' ? data : 0
        if (referralDiscountPct === 0) {
          const { data: partnerData } = await supabase.rpc('get_partner_discount_for_code', {
            p_code: effectiveReferralCode,
          })
          referralDiscountPct = typeof partnerData === 'number' ? partnerData : 0
        }
      } catch {
        /* code inconnu / DB indispo → pas de remise, checkout normal */
      }
    }
    const referralCouponId =
      referralDiscountPct > 0 ? await ensureReferralCoupon(stripe, referralDiscountPct) : null

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
        { error: 'Cette formule n’est plus proposée. Choisis une offre sur /tarifs2.' },
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
    const trialEnd = getTrialEnd()
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
      line_items: [lineItem],
      /* ⚠️ 29/08 — CETTE LIGNE EMPÊCHAIT TOUT PAIEMENT SUR /tarifs3.
         `required` oblige Stripe à obtenir une adresse de facturation complète
         avant d'accepter la confirmation. En mode embarqué (/tarifs2) c'est
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
         de carte lui-même. /tarifs2 garde `required` : son formulaire est
         dessiné par Stripe, il sait le remplir. */
      billing_address_collection: isElements ? 'auto' : 'required',
      locale: 'fr',
      /**
       * ── 24/08/2026 — LE CONSENTEMENT PUBLICITAIRE VOYAGE JUSQU'AU WEBHOOK ──
       *
       * Le webhook Stripe lit déjà `session.metadata.foreas_consent` avant
       * d'envoyer quoi que ce soit à Meta, et refuse par défaut. Mais PERSONNE
       * ne l'écrivait : la garde était donc parfaite et l'attribution d'un vrai
       * achat, perdue à coup sûr. Le webhook le disait lui-même, en toutes
       * lettres, en attendant que cette ligne existe. La voici.
       *
       * ⚠️ DEUX RÈGLES QUI NE BOUGENT PAS.
       *
       * 1. LE PAIEMENT NE DÉPEND PAS DU PISTAGE. On enregistre le choix, on ne
       *    le demande pas, et un refus n'empêche rien : il vaut `refused`, la
       *    session part, l'argent passe. Conditionner un achat à un accord
       *    publicitaire serait un consentement extorqué — donc nul.
       *
       * 2. ON N'ÉCRIT QUE CE QU'ON A LU. Le cookie est la seule source ; en son
       *    absence c'est `refused`, jamais un vide qu'on pourrait relire comme
       *    un accord plus tard.
       *
       * C'est ici, sur la SESSION, et pas dans `subscription_data.metadata` :
       * Stripe ne recopie pas l'un dans l'autre — le piège déjà payé hier avec
       * l'identité.
       */
      metadata: {
        foreas_consent: consentementPublicitaire(cookieHeader) ? 'accepted' : 'refused',
      },
      // client_reference_id carries the referral code for MLM attribution
      // Railway webhook reads this to create partner_referrals row
      ...(effectiveReferralCode ? { client_reference_id: effectiveReferralCode } : {}),
      subscription_data: {
        // `immediate` → on encaisse TOUT DE SUITE (pas de trial_end).
        // Sinon : essai glissant de 3 jours, identique pour tous (voir getTrialEnd).
        ...(immediate ? {} : { trial_end: trialEnd }),
        metadata: {
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
          /* ⚠️ 29/08/2026 — CETTE LIGNE ANNONÇAIT UNE REMISE QUI N'EXISTAIT PAS.
             Le 21/08, le coupon a cessé d'être appliqué à l'annuel : `/tarifs2`
             écrit « L'annuel est au tarif fixe », et le coupon `forever` coûtait
             45 € par abonné et par an. Correction juste — mais À MOITIÉ FAITE :
             cette métadonnée, elle, continuait de partir sur l'annuel.
             Le webhook la lit (`referral_discount_pct`) et en déduit
             `discount_eur` et `amount_eur`. Résultat mesuré sur l'abonnement de
             test du 29/08 : la base disait 224,99 € avec 25 € de remise, pendant
             que Stripe affichait 249,99 € et « Aucun bon de réduction n'a été
             appliqué ». Une remise fantôme, dans les chiffres de revenus et dans
             le calcul des commissions de parrainage.
             ⚠️ LA CONDITION DOIT ÊTRE LA MÊME QUE CELLE DU COUPON, plus bas :
             `referralCouponId && !isAnnual`. Deux conditions différentes pour un
             seul fait, c'est exactement comme ça que l'écart est né. */
          ...(referralDiscountPct > 0 && referralCouponId && !isAnnual
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
          : { success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`, cancel_url: `${origin}/tarifs2?canceled=true` }),
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ⚠️ 21/08/2026 — LA REMISE PARRAIN S'APPLIQUAIT AUSSI À L'ANNUEL.
    //
    // `isAnnual` est calculé ligne 139 et servait à trois choses — le nom du
    // produit, le montant, la périodicité — puis n'était PLUS jamais consulté.
    // Le coupon partait donc sur les deux formules.
    //
    // Or `/tarifs2` écrit, en toutes lettres : « L'annuel est au tarif fixe. »
    //
    // Ce que ça coûtait : 249,99 € − 18 % = 204,99 €. Quarante-cinq euros par
    // abonné et par an — et le coupon est `duration: 'forever'`, donc à CHAQUE
    // renouvellement, indéfiniment. Le site promettait une chose et la caisse
    // en facturait une autre, dans le sens défavorable à FOREAS.
    //
    // ⚠️ CE DÉFAUT ÉTAIT INVISIBLE AUX CONTRÔLES. Le prix affiché était juste,
    // le prix envoyé à Stripe était juste, la remise était juste : c'est leur
    // COMBINAISON qui contredisait la phrase. Aucune règle cherchant un chiffre
    // faux ne pouvait l'attraper.
    //
    // ⚠️ ET LA CORRECTION NE SUFFIT PAS SEULE : le coupon étant « forever », les
    // abonnements annuels déjà créés avec un coupon attaché continueront d'être
    // remisés. Ce point part au fil qui possède Stripe — le Site ne touche pas
    // aux abonnements existants.
    // ─────────────────────────────────────────────────────────────────────────
    if (referralCouponId && !isAnnual) {
      sessionParams.discounts = [{ coupon: referralCouponId }]
    } else {
      sessionParams.allow_promotion_codes = true
    }

    /**
     * ⚠️ SEULE LA CRÉATION D'UNE SESSION `custom` PASSE PAR BASIL.
     * Tout le reste de cette route — coupons, remise parrain, résolution
     * d'identité — continue d'utiliser le client Acacia obtenu ligne 116.
     * Ce n'est pas de la prudence excessive : `ui_mode: 'custom'` n'existe qu'à
     * partir de Basil, et Basil déplace des champs que le webhook lit encore.
     * On prend donc la version neuve pour la seule chose qui l'exige.
     */
    const session = await (isElements ? getStripeElements() : stripe).checkout.sessions.create(
      sessionParams,
    )

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
      await monterUneMarche(identiteVisiteur, 'paiement_commence', session.id, 'site')
    })
    /* ⚠️ 29/08 — LA SESSION RENVOIE DÉSORMAIS LA REMISE QU'ELLE PORTE VRAIMENT.
       Trouvé par l'audit adverse : un visiteur passé une fois par /r/<code>
       garde un cookie `foreas_partner_ref` trente jours. Des jours plus tard il
       paie sur /tarifs3 sans jamais ouvrir le bloc parrain — le coupon s'attache
       côté serveur (ligne 123, repli sur le cookie), mais l'écran, lui, ne
       connaît que `codeApplique` et affiche le prix plein.
       Résultat : « Ensuite 29,99 € par mois » affiché, 26,99 € prélevé à chaque
       échéance, indéfiniment. Le client paie MOINS que l'annonce — ça reste un
       montant faux sur la page qui encaisse, et une commission de parrainage
       déclenchée sans que rien ne l'indique.
       ⚠️ LA VALEUR RENDUE EST CELLE DU COUPON, PAS CELLE DU CODE. Même condition
       que l'attachement vingt lignes plus haut : zéro sur l'annuel, qui est à
       tarif fixe. Deux conditions différentes pour un seul fait, c'est
       exactement l'écart qu'on vient de corriger deux fois. */
    const remiseSurLaSession = referralCouponId && !isAnnual ? referralDiscountPct : 0
    if (isElements || isEmbedded)
      return NextResponse.json({
        clientSecret: session.client_secret,
        remiseParrainPct: remiseSurLaSession,
        /* Pour que l'écran puisse dire d'où vient la remise quand le chauffeur
           n'a rien tapé : elle vient de son lien de parrainage. */
        remiseHeritee: remiseSurLaSession > 0 && !referral_code,
      })
    return NextResponse.json({ url: session.url })
  } catch (error: unknown) {
    const err = error as { message?: string; type?: string; code?: string; statusCode?: number }
    // Ni dans les journaux, ni dans la réponse : aucun morceau de clé.
    // Un préfixe de clé écrit dans un journal reste lisible par quiconque accède
    // aux journaux, et il n'aide à rien pour diagnostiquer — `type` et `code`
    // Stripe suffisent. Et le message brut de Stripe, lui, contient parfois un
    // fragment de la clé (« Invalid API Key provided: sk_live_***…»), donc il ne
    // part jamais au navigateur.
    console.error('[checkout] erreur Stripe:', err.type, err.code, err.statusCode, err.message)
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

import { NextResponse, after } from 'next/server'
import Stripe from 'stripe'
import { sendWelcomeEmail, sendProvisionFailureAlert } from '@/lib/email'
import { provisionDriverAccount } from '@/lib/provisionDriverAccount'
import { sendCAPIEvent } from '@/lib/meta-capi'
import { sendTikTokEvent } from '@/lib/tiktok-events-api'
// 20/08/2026 — adresses passées par src/lib/site.ts : l'apex redirige (307), donc
// une adresse sans « www » écrite en dur fait un saut de plus, et côté publicité
// elle ne correspond pas à l'adresse canonique de la page.
import { URL_SITE } from '@/lib/site'
// ── 20/08/2026 — PLUS DE REPLI SILENCIEUX VERS LA CLÉ PUBLIQUE ──────────────
// Cette route retombait sur la clé publique quand la clé serveur manquait.
// Le jour d'une rotation de clé, ce `||` ne produit AUCUNE erreur : la route se
// met à lire avec les droits d'un visiteur anonyme, en silence. Une panne
// bruyante se répare ; une dégradation silencieuse s'installe.
// Le client vient maintenant de src/lib/supabaseServeur.ts, qui refuse plutôt
// que de dégrader.
import { cleServeurOuVide, clientServeurOuNull } from '@/lib/supabaseServeur'
import { repere } from '@/lib/journal'

/**
 * ⚠️ 21/08/2026 — LE TEMPS D'EXÉCUTION N'ÉTAIT DÉCLARÉ NULLE PART.
 *
 * Ce webhook crée un compte, écrit en base, envoie un e-mail et lance trois
 * conversions publicitaires. Sans durée déclarée, il tombe sur la limite par
 * défaut de l'hébergeur.
 *
 * Et ce n'est pas qu'une question de confort : le bail d'idempotence posé plus
 * bas dure dix minutes. Si l'exécution peut être coupée à trente secondes, un
 * exemplaire tué net laisse une réservation vivante pendant neuf minutes et
 * demie, et toute relivraison de Stripe dans cette fenêtre est ignorée.
 * Le bail doit toujours être plus long que l'exécution — d'où cette ligne AVANT
 * celle-là.
 *
 * ⚠️ ON NE CRÉE PAS de vercel.json pour ça : le fichier existe déjà et porte la
 * redirection des liens courts de parrainage plus trois en-têtes de sécurité.
 * Le remplacer les effacerait.
 */
export const maxDuration = 60

export const runtime = 'nodejs'

function getStripeClient() {
  const key = (process.env.STRIPE_SECRET_KEY || '').replace(/\s/g, '')
  return new Stripe(key, { apiVersion: '2025-02-24.acacia' })
}

function getWebhookSecret() {
  return (process.env.STRIPE_WEBHOOK_SECRET || '').replace(/\s/g, '')
}

// Prix → plan mapping
const PLAN_MAP: Record<string, { name: string; cycle: string }> = {
  [process.env.STRIPE_PRICE_WEEKLY || 'price_1RvOx5K89oTss0SbHKIgcUoO']: { name: 'Hebdomadaire', cycle: 'weekly' },
  [process.env.STRIPE_PRICE_ANNUAL || 'price_1Szy2YK89oTss0Sb9pQyBWXt']: { name: 'Annuel', cycle: 'annual' },
}

async function upsertSubscriber(data: Record<string, unknown>) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = cleServeurOuVide()
  if (!supabaseUrl || !supabaseKey) {
    console.log('[webhook] Supabase non configuré — subscriber non sauvegardé:', repere(data.email))
    return
  }
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(supabaseUrl, supabaseKey)
    // ⚠️ 21/08/2026 — CE JOURNAL DISAIT « SAUVEGARDÉ » À CHAQUE ÉCHEC.
    //
    // L'écriture échouait en 42P10 : `ON CONFLICT (stripe_subscription_id)`
    // sans index unique sur cette colonne. Reproduit sans rien écrire :
    //   EXPLAIN INSERT INTO subscribers (…) ON CONFLICT (stripe_subscription_id) …
    //   → « there is no unique or exclusion constraint matching … »
    //
    // Et le `catch` ne s'exécutait JAMAIS : supabase-js ne rejette pas sur une
    // erreur PostgREST, il RÉSOUT avec { data: null, error }. Personne ne
    // déstructurait `error`, donc la ligne suivante s'exécutait et journalisait
    // un succès. Le bloc `catch` était du code mort.
    //
    // C'est le pire mode de panne : pas d'exception, pas d'alerte, un journal
    // qui affirme le contraire de ce qui s'est passé. Ajouter un `throw` dans
    // le catch n'aurait rien changé — il ne tourne pas.
    //
    // L'index unique manquant est posé par la migration
    // subscribers_index_unique_sur_stripe_subscription_id.
    const { error } = await supabase
      .from('subscribers')
      .upsert(data, { onConflict: 'stripe_subscription_id' })
    if (error) {
      // ⚠️ 21/08/2026, SECONDE PASSE — ICI, LE `return` PERDAIT LE PAIEMENT.
      //
      // Le matin, j'ai corrigé le journal qui mentait : il annonçait
      // « sauvegardé » à chaque échec. Mais j'ai laissé un `return`. La
      // fonction ne rend rien, l'appelant ne peut pas savoir, et le webhook
      // répondait 200 — donc Stripe ne rejouait JAMAIS.
      //
      // C'est la même panne que celle du matin, déplacée d'un cran : au lieu
      // de mentir dans le journal, elle se taisait dans la valeur de retour.
      //
      // DÉCLENCHEUR RÉEL, pas hypothétique : la table porte aussi un index
      // unique sur `stripe_customer_id`, que `onConflict:
      // 'stripe_subscription_id'` ne couvre pas. Un second abonnement du même
      // client rend 23505 → chauffeur débité, aucune ligne, aucune alerte.
      //
      // On LÈVE. Le rattrapage libère la réservation et rend 500 : Stripe
      // rejoue, et quelqu'un finit par voir l'erreur.
      //
      // Pas d'adresse e-mail dans le journal : l'identifiant Stripe suffit.
      console.error(`[webhook] ÉCHEC écriture subscriber (${data.stripe_subscription_id ?? 'sans id'}) : ${error.code} ${error.message}`)
      throw new Error(`subscriber non écrit : ${error.code}`)
    }
    console.log('[webhook] subscriber enregistré :', data.stripe_subscription_id ?? 'sans id')
  } catch (e) {
      // ⚠️ On RELANCE. Un `catch` qui absorbe ici annulerait le `throw`
      // ci-dessus : l'appelant croirait de nouveau que tout va bien.
      console.error('[webhook] Erreur Supabase:', e)
      throw e
  }
}

async function updateSubscriberStatus(stripeSubId: string, status: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = cleServeurOuVide()
  if (!supabaseUrl || !supabaseKey) return
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(supabaseUrl, supabaseKey)
    // Même piège que ci-dessus : sans déstructurer `error`, un échec passait
    // pour un succès silencieux.
    // ⚠️ 21/08/2026 — UNE ANNULATION ET UN IMPAYÉ POUVAIENT DISPARAÎTRE.
    //
    // Trois défauts empilés dans six lignes :
    //  · l'update n'avait aucun `.select()`, donc ZÉRO LIGNE MISE À JOUR était
    //    structurellement indiscernable d'un succès — `error` reste null ;
    //  · l'erreur était journalisée sans être levée ;
    //  · la fonction rend `void`, donc l'appelant ne peut rien savoir.
    // Puis l'événement passait à « fait » et le webhook répondait 200 : Stripe
    // ne rejoue jamais. Un chauffeur résilié restait actif en base, un impayé
    // restait payé, sans une ligne d'alerte.
    //
    // ⚠️ ON NE LÈVE PAS SUR « ZÉRO LIGNE ». Une résiliation qui ne trouve pas sa
    // ligne n'est pas une panne de Stripe : rejouer n'y changerait rien. On
    // ALERTE, et on laisse passer — sinon Stripe réessaie trois jours pour rien.
    const { data, error } = await supabase
      .from('subscribers')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('stripe_subscription_id', stripeSubId)
      .select('id')
    if (error) {
      console.error(`[webhook] ÉCHEC mise à jour statut (${stripeSubId}) : ${error.code} ${error.message}`)
      throw new Error(`statut non écrit : ${error.code}`)
    }
    if (!data || data.length === 0) {
      console.error(`[webhook] statut « ${status} » : AUCUNE ligne pour ${stripeSubId}`)
      await sendProvisionFailureAlert({
        email: 'inconnu',
        reason: `statut « ${status} » reçu pour ${stripeSubId}, mais aucune ligne d'abonné ne correspond — l'état en base est faux`,
      })
    }
  } catch (e) {
    console.error('[webhook] Erreur update status:', e)
  }
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * L'IDEMPOTENCE — AJOUTÉE LE 21/08/2026
 *
 * Stripe livre AU MOINS UNE FOIS. Le même événement arrive deux fois, et
 * c'est normal. Mesuré ce jour-là : `grep event.id` sur tout le code du site
 * renvoyait ZÉRO occurrence. Aucune déduplication n'était tentée.
 *
 * Ce qu'un rejeu de `checkout.session.completed` produisait :
 *   · la ligne d'abonné ne doublait pas (conflit géré) ;
 *   · le compte d'authentification ne doublait pas (l'adresse existe déjà) ;
 *   · MAIS le mail de bienvenue REPARTAIT — il est appelé sans condition ;
 *   · ET les trois conversions publicitaires étaient RECOMPTÉES.
 * Un chauffeur recevait deux fois ses identifiants, et les plateformes
 * comptaient deux ventes pour une.
 *
 * LE PROTOCOLE : on réserve, on travaille, on confirme. Et si on échoue, on
 * LIBÈRE la réservation — sinon le réessai de Stripe serait ignoré et
 * l'événement perdu pour de bon. C'est le piège classique de ce mécanisme.
 */
/**
 * ⚠️ TROIS RÉPONSES, PAS DEUX — ET LA DIFFÉRENCE EST TOUT LE SUJET.
 *
 * Premier jet de cette fonction : elle renvoyait un booléen. `false` couvrait
 * DEUX situations opposées — « un autre exemplaire a déjà cet événement » et
 * « je n'ai pas pu écrire en base ». L'appelant répondait 200 dans les deux cas.
 *
 * Conséquence, si la clé serveur venait à manquer : **chaque paiement aurait été
 * silencieusement jeté**, avec un 200 renvoyé à Stripe, qui ne rejoue jamais un
 * 200. C'est-à-dire EXACTEMENT la panne que ce fichier a passé la journée à
 * éliminer, réintroduite par sa propre correction.
 *
 * Et le commentaire disait « Stripe réessaiera » — il décrivait une intention,
 * pas le comportement. Un faux témoin de plus.
 */
/**
 * ⚠️ 21/08/2026, SECONDE PASSE — LE BAIL N'AVAIT NI PROPRIÉTAIRE NI EXPIRATION.
 *
 * Le premier jet posait une réservation, travaillait, marquait « fait », et
 * supprimait en cas d'échec. Une réservation de plus de dix minutes était
 * effacée puis reprise. Trois défauts, trouvés par une vérification adverse :
 *
 * 1. AUCUN PROPRIÉTAIRE. Confirmer et libérer filtraient sur l'identifiant
 *    d'événement SEUL. Un exemplaire lent, repris après dix minutes, pouvait
 *    donc marquer « fait » le travail d'un AUTRE — ou effacer une ligne déjà
 *    terminée.
 *
 * 2. LA REPRISE N'ÉTAIT PAS ATOMIQUE : un effacement puis une insertion. Deux
 *    exemplaires pouvaient passer entre les deux.
 *
 * 3. LE PIRE : « prise par un autre » rendait 200. Ce code confond « quelqu'un
 *    a FINI » et « quelqu'un a COMMENCÉ et a peut-être planté ». Un arrêt
 *    brutal en cours de traitement ne déclenche aucun rattrapage : la ligne
 *    reste en cours, et toute relivraison de Stripe dans la fenêtre reçoit 200.
 *    Stripe ne revient jamais.
 *
 * Désormais : une seule requête atomique côté base (voir la migration
 * `reservation_stripe_un_bail_avec_proprietaire_et_expiration`), quatre
 * réponses distinctes, et un jeton de propriété exigé pour confirmer ou
 * libérer.
 *
 * ⚠️ LE BAIL (5 min) EST PLUS COURT QUE `maxDuration` (60 s) × marge, et plus
 * LONG que l'exécution. Un bail plus court que l'exécution rendrait le vol
 * systématique — c'est pourquoi la durée d'exécution est déclarée en tête.
 */
type Reservation = 'obtenue' | 'deja_fait' | 'bail_vivant' | 'impossible'

async function reserverEvenement(
  id: string,
  type: string,
  proprietaire: string,
): Promise<Reservation> {
  const sb = clientServeurOuNull()
  if (!sb) {
    // On ne peut pas garantir l'unicité : on ÉCHOUE FRANCHEMENT pour que Stripe
    // rejoue. Ne jamais répondre 200 ici — ce serait perdre le paiement.
    console.error('[webhook] pas de client serveur : réservation impossible')
    return 'impossible'
  }
  const { data, error } = await sb.rpc('reclamer_evenement_stripe', {
    p_event_id: id,
    p_type: type,
    p_proprietaire: proprietaire,
  })
  if (error) {
    console.error(`[webhook] réclamation impossible (${error.code}) : ${error.message}`)
    return 'impossible'
  }
  const r = Array.isArray(data) ? data[0]?.resultat : (data as { resultat?: string })?.resultat
  if (r === 'obtenue' || r === 'deja_fait' || r === 'bail_vivant') return r
  console.error(`[webhook] réclamation : réponse inattendue « ${String(r)} »`)
  return 'impossible'
}

/** Marque terminé — et SEULEMENT si on détient encore le bail. */
async function confirmerEvenement(id: string, proprietaire: string, note?: string): Promise<void> {
  const sb = clientServeurOuNull()
  if (!sb) return
  const { data, error } = await sb
    .from('site_evenements_stripe_traites')
    .update({ statut: 'fait', fini_le: new Date().toISOString(), note: note ?? null })
    .eq('event_id', id)
    .eq('proprietaire', proprietaire)
    .eq('statut', 'en_cours')
    .select('event_id')
  if (error) {
    console.error(`[webhook] confirmation impossible : ${error.message}`)
    return
  }
  if (!data || data.length === 0) {
    // On a perdu le bail en route : quelqu'un d'autre a repris l'événement.
    // Ne pas se taire — c'est le signe que l'exécution a dépassé son bail.
    console.error(`[webhook] ${id} : bail perdu avant confirmation, travail peut-être fait deux fois`)
  }
}

/**
 * Rend le bail au lieu d'effacer la ligne.
 *
 * ⚠️ Un effacement perdrait le compteur de tentatives et la dernière erreur —
 * exactement ce qu'on veut lire quand un événement échoue trois fois de suite.
 */
async function libererEvenement(id: string, proprietaire: string, erreur?: string): Promise<void> {
  const sb = clientServeurOuNull()
  if (!sb) return
  const { error } = await sb
    .from('site_evenements_stripe_traites')
    .update({ bail_expire_le: new Date().toISOString(), derniere_erreur: erreur ?? null })
    .eq('event_id', id)
    .eq('proprietaire', proprietaire)
    .eq('statut', 'en_cours')
  if (error) console.error(`[webhook] libération impossible : ${error.message}`)
}

export async function POST(request: Request) {
  // Déclarées HORS du try : le bloc de rattrapage doit pouvoir rendre le bail,
  // et il n'a pas accès aux variables déclarées à l'intérieur.
  let evenementReserve: string | null = null
  // Le jeton de propriété de CET exemplaire. Sans lui, un exemplaire repris
  // pourrait confirmer le travail d'un autre.
  const proprietaire = crypto.randomUUID()
  try {
    const body = await request.text()
    const sig = request.headers.get('stripe-signature')

    const webhookSecret = getWebhookSecret()

    // ⚠️ 21/08/2026 — CES DEUX CAS ÉTAIENT CONFONDUS, ET LE SECOND EST GRAVE.
    //
    // AVANT : `if (!sig || !webhookSecret) return { received: true }` — un 200,
    // dans les deux cas.
    //
    // Pour une requête sans signature, ce n'est pas dramatique : ce n'est pas
    // Stripe, et rien n'est traité.
    //
    // Mais si le SECRET disparaissait de l'environnement — une variable oubliée
    // à un redéploiement, une rotation ratée — alors chaque abonnement réel
    // recevait « bien reçu ». Stripe considère un 200 comme une livraison
    // réussie : il ne réessaie jamais. Tous les abonnements auraient été perdus
    // en silence, sans une seule erreur nulle part.
    //
    // C'est le pire mode de panne de ce dépôt, et il s'est déjà produit
    // ailleurs. Un secret absent doit provoquer un ÉCHEC BRUYANT : Stripe
    // réessaie pendant trois jours, ce qui laisse le temps de s'en apercevoir.
    if (!webhookSecret) {
      console.error('[webhook] STRIPE_WEBHOOK_SECRET ABSENT — aucun abonnement ne peut être traité')
      return NextResponse.json({ error: 'webhook non configuré' }, { status: 500 })
    }
    if (!sig) {
      // Pas d'en-tête de signature : l'appel ne vient pas de Stripe.
      return NextResponse.json({ error: 'signature manquante' }, { status: 400 })
    }

    const stripe = getStripeClient()
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
    } catch (err) {
      console.error('[webhook] Vérification signature échouée:', (err as Error).message)
      return NextResponse.json({ error: 'Signature invalide' }, { status: 400 })
    }

    // ── ON RÉSERVE L'ÉVÉNEMENT AVANT DE TRAVAILLER ─────────────────────────
    // Si un autre exemplaire de cette fonction l'a déjà, on répond 200 : c'est
    // une relivraison, elle a été traitée, Stripe n'a pas à réessayer.
    const reserve = await reserverEvenement(event.id, event.type, proprietaire)
    if (reserve === 'impossible') {
      // On n'a pas pu écrire en base. Répondre 200 ici jetterait le paiement en
      // silence : Stripe ne rejoue jamais un 200.
      console.error(`[webhook] ${event.id} — réservation impossible, on demande à Stripe de rejouer`)
      return NextResponse.json({ error: 'réservation impossible' }, { status: 500 })
    }
    if (reserve === 'deja_fait') {
      // Traité, et terminé. 200 est le bon code : Stripe n'a rien à rejouer.
      console.log(`[webhook] ${event.id} (${event.type}) déjà traité — ignoré`)
      return NextResponse.json({ received: true, deja_traite: true })
    }
    if (reserve === 'bail_vivant') {
      // ⚠️ 409, JAMAIS 200. Quelqu'un travaille encore dessus — et il a
      // peut-être planté. Un 200 dirait à Stripe « c'est fait », et il ne
      // reviendrait jamais. Un 409 le fait revenir quand le bail aura expiré.
      console.warn(`[webhook] ${event.id} : bail vivant ailleurs — on demande à Stripe de repasser`)
      return NextResponse.json({ error: 'traitement en cours ailleurs' }, { status: 409 })
    }
    evenementReserve = event.id

    // ─── checkout.session.completed ────────────────────────────────
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session

      // Extraire les custom fields
      const phoneField = session.custom_fields?.find(f => f.key === 'phone')
      const cityField = session.custom_fields?.find(f => f.key === 'city')
      const phone = phoneField?.numeric?.value || null
      const city = cityField?.text?.value || null

      // Récupérer la subscription pour les détails
      let subscription: Stripe.Subscription | null = null

      // ⚠️ 21/08/2026 — CETTE ÉTIQUETTE ÉTAIT FAUSSE À TOUS LES COUPS.
      //
      // Elle valait `{ name: 'Hebdomadaire', cycle: 'weekly' }` par défaut, puis
      // tentait `PLAN_MAP[priceId]`. Or les trois chemins de paiement du site
      // construisent le prix À LA VOLÉE (`price_data`) : le tarif engendré porte
      // un identifiant neuf à chaque session, jamais égal aux deux clés du
      // tableau. Le repli gagnait donc TOUJOURS.
      //
      // Conséquence : « Hebdomadaire » partait dans le nom de contenu envoyé à
      // Meta (deux fois), dans la description envoyée à TikTok, ET dans le mail
      // de bienvenue — à un chauffeur qui venait de souscrire un MENSUEL.
      // FOREAS ne vend plus d'hebdomadaire depuis juillet.
      //
      // LA CORRECTION : l'étiquette voyage déjà dans l'objet Stripe. C'est
      // `/api/checkout` qui la pose, en toutes lettres :
      //     subscription_data.metadata = { plan, flow }
      // On la LIT, au lieu de la deviner. Trois niveaux, du plus sûr au moins :
      //   1. `metadata.plan`   — la valeur canonique posée par le site ;
      //   2. `PLAN_MAP`        — pour les liens fabriqués hors dépôt (n8n), qui
      //                          utilisent peut-être un tarif pré-créé ;
      //   3. l'intervalle réel — month | year, lu chez Stripe.
      // Et si rien ne répond : « inconnu ». Une étiquette absente se voit et se
      // corrige ; une étiquette fausse se propage et personne ne la questionne.
      let planInfo: { name: string; cycle: string } = { name: 'inconnu', cycle: 'inconnu' }

      if (session.subscription) {
        subscription = await stripe.subscriptions.retrieve(session.subscription as string)
        const prix = subscription.items.data[0]?.price
        const planMeta = (subscription.metadata?.plan || '').trim()
        const intervalle = prix?.recurring?.interval || ''

        if (planMeta) {
          planInfo = {
            name: planMeta,
            cycle: planMeta.includes('annual') || planMeta.includes('annuel') ? 'annual' : 'monthly',
          }
        } else if (prix?.id && PLAN_MAP[prix.id]) {
          planInfo = PLAN_MAP[prix.id]
        } else if (intervalle) {
          planInfo = {
            name: intervalle === 'year' ? 'Annuel' : intervalle === 'month' ? 'Mensuel' : intervalle,
            cycle: intervalle === 'year' ? 'annual' : intervalle === 'month' ? 'monthly' : intervalle,
          }
        }

        if (planInfo.name === 'inconnu') {
          console.warn(`[webhook] plan non identifiable pour ${session.subscription} — étiquette « inconnu » assumée`)
        }
      }

      const trialEnd = subscription?.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null
      const trialEndLabel = subscription?.trial_end
        ? new Date(subscription.trial_end * 1000).toLocaleDateString('fr-FR', {
            weekday: 'long', day: 'numeric', month: 'long',
          })
        : 'Non défini'

      // Parrainage V3 — traçabilité prix payé + remise (colonnes existantes amount_eur / discount_eur).
      const fullPriceEur = (subscription?.items.data[0]?.price?.unit_amount ?? 0) / 100
      const refPct = Number(subscription?.metadata?.referral_discount_pct ?? 0)
      const discountEur = Math.round(fullPriceEur * refPct) / 100
      const amountEur = Math.round((fullPriceEur - discountEur) * 100) / 100

      // 1. Sauvegarder dans Supabase
      await upsertSubscriber({
        stripe_customer_id: session.customer,
        stripe_subscription_id: session.subscription,
        email: session.customer_details?.email,
        name: session.customer_details?.name,
        phone,
        city,
        plan: planInfo.name,
        billing_cycle: planInfo.cycle,
        // ⚠️ 'trialing' ÉTAIT ÉCRIT EN DUR, alors que le vrai statut est
        // disponible deux lignes plus haut et n'était jamais lu. /reactivation
        // passe `immediate: true` : Stripe renvoie alors `active`, et le
        // webhook écrivait quand même « en essai ».
        status: subscription?.status ?? 'incomplete',
        trial_end: trialEnd,
        amount_eur: amountEur,
        discount_eur: discountEur,
        current_period_end: subscription?.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null,
      })

      // 2. Créer le compte Supabase Auth + envoyer le mail de bienvenue AVEC les identifiants.
      //    Ordre imposé : on provisionne D'ABORD, pour que le mail puisse porter le mot de passe.
      //    Avant ce câblage, le mail disait « connecte-toi » alors qu'aucun compte n'existait :
      //    premier mur rencontré par 100% des chauffeurs payés depuis le site.
      if (session.customer_details?.email) {
        const provision = await provisionDriverAccount({
          email: session.customer_details.email,
          name: session.customer_details.name,
          phone,
          city,
        })

        const mailParti = await sendWelcomeEmail({
          email: session.customer_details.email,
          name: session.customer_details.name || '',
          plan: planInfo.name,
          trialEnd: trialEndLabel,
          // Identifiants seulement si le compte vient d'être créé. S'il existait déjà (rejeu
          // Stripe, ou chauffeur déjà inscrit), on n'a touché à rien : pas de mot de passe à
          // annoncer, il utilise le sien.
          credentials:
            provision.status === 'created'
              ? { email: session.customer_details.email, password: provision.password }
              : null,
        })

        // Un paiement encaissé sans compte créé ne doit JAMAIS rester silencieux.
        // ⚠️ 21/08/2026 — UN CHAUFFEUR PAYÉ POUVAIT NE JAMAIS RECEVOIR SES
        // IDENTIFIANTS, SANS QUE PERSONNE NE LE SACHE.
        //
        // Son mot de passe n'existe QUE dans ce mail. Et l'alerte ci-dessous
        // ne partait pas, puisqu'elle ne regarde que le PROVISIONNEMENT —
        // lequel avait réussi. L'envoi, lui, échouait en silence.
        //
        // ⚠️ ON N'ÉCHOUE PAS LE WEBHOOK POUR AUTANT. Un incident chez
        // l'expéditeur de courrier ne doit pas devenir une perte de paiement :
        // on alerte, et le paiement reste enregistré.
        if (!mailParti && provision.status === 'created') {
          await sendProvisionFailureAlert({
            email: session.customer_details?.email ?? 'inconnu',
            reason: `compte créé mais e-mail de bienvenue NON envoyé (abonnement ${(session.subscription as string) ?? 'inconnu'}) — le chauffeur n’a pas ses identifiants`,
          })
        }
        if (provision.status === 'failed' || provision.status === 'skipped') {
          await sendProvisionFailureAlert({
            email: session.customer_details.email,
            name: session.customer_details.name,
            reason: provision.reason,
          })
        }
      }

      // 3. Meta CAPI — StartTrial (trial) + Subscribe (conversion signal)
      //    Signal crucial pour optimiser campagnes CTWA Meta Advantage+
      // ⚠️ 21/08/2026 — CE MONTANT ÉTAIT LE PRIX CATALOGUE, JAMAIS L'ENCAISSÉ.
      //
      // `checkout.session.completed` NE PROUVE AUCUN PAIEMENT : il prouve qu'une
      // session s'est terminée. Avec un essai, zéro euro a été prélevé ; avec un
      // coupon de parrainage à 100 %, zéro aussi.
      //
      // On envoyait pourtant le prix du mois plein, DEUX FOIS — « essai démarré »
      // et « abonné » — donc les régies comptaient deux ventes pleines pour un
      // euro jamais encaissé.
      //
      // ⚠️ ET ON NE PEUT PAS « METTRE LE BON MONTANT » ICI : le seul chiffre juste
      // est celui de la facture, que cet événement ne porte pas. Recalculer
      // depuis la remise des métadonnées serait faux aussi — cette donnée est
      // absente des liens fabriqués hors dépôt, et ignore le coupon Stripe
      // réellement appliqué.
      //
      // Donc : ZÉRO, pour tous les cas, et un seul événement — le démarrage.
      // Le montant réel partira quand le Site traitera l'encaissement, ce qui
      // suppose d'abord de trancher qui, du Site ou du serveur, en est
      // propriétaire. Voir la question ouverte pour Chandler.
      const purchaseValue = 0
      const currency = subscription?.items.data[0]?.price?.currency?.toUpperCase() || 'EUR'
      const nameParts = (session.customer_details?.name || '').split(' ')
      const capiUserData = {
        email: session.customer_details?.email || undefined,
        phone: phone || undefined,
        firstName: nameParts[0] || undefined,
        lastName: nameParts.slice(1).join(' ') || undefined,
        city: city || undefined,
        country: 'FR',
        externalId: session.customer as string | undefined,
      }
      // ⚠️ 21/08/2026 — « FIRE-AND-FORGET » VOULAIT DIRE « PEUT-ÊTRE JAMAIS ».
      //
      // Ces trois envois partaient sans `await` et sans rien pour les retenir.
      // L'intention était bonne — ne jamais bloquer un paiement pour une pub qui
      // échoue — mais sur cet hébergeur la fonction est GELÉE dès que la réponse
      // est renvoyée. Les requêtes en vol pouvaient donc ne jamais partir, et le
      // taux de perte est inconnu.
      //
      // `after()` est fait exactement pour ça : le travail s'exécute APRÈS la
      // réponse, sans la retarder, et l'hébergeur garde la fonction en vie.
      //
      // ⚠️ CE N'EST PAS `await` QU'IL FALLAIT. Attendre rendrait le webhook
      // dépendant de la latence de Meta et de TikTok : un incident chez eux
      // ferait expirer la livraison côté Stripe, et une panne de MESURE
      // deviendrait une perte de PAIEMENT. On ne troque pas l'un contre l'autre.
      //
      // Chaque envoi porte maintenant un identifiant dérivé de l'événement
      // Stripe. Il est STABLE : si le même événement repassait, ou si le
      // navigateur envoyait le même achat de son côté, les plateformes
      // reconnaîtraient un doublon au lieu de compter deux ventes.
      const tiktokUserData = {
        email: capiUserData.email,
        phone: capiUserData.phone,
        externalId: capiUserData.externalId,
      }
      after(async () => {
        await Promise.allSettled([
          sendCAPIEvent({
            eventName: 'StartTrial',
            eventId: `${event.id}-starttrial`,
            userData: capiUserData,
            customData: {
              value: purchaseValue,
              currency,
              contentName: planInfo.name,
              orderId: session.subscription as string,
            },
            eventSourceUrl: session.url || `${URL_SITE}/tarifs2`,
            actionSource: 'website',
          }),
          // ⚠️ 21/08/2026 — LES DEUX ÉVÉNEMENTS « ABONNÉ » ONT ÉTÉ RETIRÉS D'ICI.
          //
          // Ils affirmaient un abonnement PAYÉ sur un événement qui ne prouve
          // aucun paiement : avec un essai, zéro euro a été prélevé ; avec un
          // coupon de parrainage à 100 %, zéro aussi. Les régies comptaient donc
          // DEUX ventes pleines pour un euro jamais encaissé — « essai démarré »
          // et « abonné », tous deux valorisés au prix du mois plein.
          //
          // Ils reviendront sur l'événement de FACTURE, avec le montant
          // réellement payé. Ce qui suppose d'abord de trancher qui, du Site ou
          // du serveur, possède cet effet : le serveur traite déjà les factures.
          // Deux propriétaires du même effet, c'est de l'argent compté deux fois.
        ])
      })

      // 4. TODO: SMS via Twilio
      // if (phone) {
      //   await twilioClient.messages.create({
      //     body: `Bienvenue sur FOREAS ! Télécharge l'app : https://foreas.xyz/download`,
      //     from: process.env.TWILIO_PHONE_NUMBER,
      //     to: phone,
      //   })
      // }

      console.log('[webhook] checkout.session.completed traité pour', repere(session.customer_details?.email))
    }

    // ─── customer.subscription.updated ─────────────────────────────
    if (event.type === 'customer.subscription.updated') {
      const sub = event.data.object as Stripe.Subscription
      await updateSubscriberStatus(sub.id, sub.status)
      console.log('[webhook] Subscription updated:', sub.id, '→', sub.status)
    }

    // ─── customer.subscription.deleted ─────────────────────────────
    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as Stripe.Subscription
      await updateSubscriberStatus(sub.id, 'canceled')
      console.log('[webhook] Subscription deleted:', sub.id)
    }

    // ─── invoice.payment_failed ────────────────────────────────────
    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice
      // ⚠️ 21/08/2026 — CETTE LECTURE DÉPEND DE LA VERSION D'API DE STRIPE, ET
      // L'ÉPINGLE DU CLIENT NE PROTÈGE PAS.
      //
      // `apiVersion` n'estampille que les requêtes SORTANTES. La charge d'un
      // événement ENTRANT est versionnée par la destination configurée chez
      // Stripe — que ce code ne contrôle pas. Sur les versions récentes,
      // `invoice.subscription` disparaît au profit d'un chemin imbriqué.
      //
      // Le jour où quelqu'un met à jour la destination dans le tableau de bord
      // Stripe, ce bloc cesse de trouver l'abonnement : un impayé ne serait plus
      // enregistré, sans erreur, sans alerte. On lit les deux formes.
      const idAbonnement = ((invoice as unknown as { parent?: { subscription_details?: { subscription?: string } } }).parent?.subscription_details?.subscription) ?? invoice.subscription
      if (idAbonnement) {
        await updateSubscriberStatus(idAbonnement as string, 'past_due')
        console.log('[webhook] Payment failed pour subscription:', idAbonnement)
        // TODO: envoyer email de relance
      }
    }

    await confirmerEvenement(event.id, proprietaire)
    return NextResponse.json({ received: true })
  } catch (error) {
    // ⚠️ 21/08/2026 — ICI, LE CODE RÉPONDAIT 200 SUR N'IMPORTE QUELLE ERREUR.
    //
    // Le commentaire disait : « Toujours retourner 200 pour éviter que Stripe
    // retry en boucle ». Il décrivait exactement ce qu'il faisait, et c'était
    // le problème : Stripe lit un 200 comme une livraison réussie et ne rejoue
    // JAMAIS. Toute exception entre la vérification de signature et la fin —
    // un appel réseau à Stripe qui expire, une limite de débit, une coupure —
    // laissait le chauffeur débité, sans ligne en base, sans compte, sans mail,
    // et SANS ALERTE.
    //
    // ⚠️ CETTE CORRECTION N'EST VALABLE QU'AVEC LA RÉSERVATION CI-DESSUS.
    // Seule, elle transformerait une perte silencieuse en spam bruyant : Stripe
    // réessaie pendant trois jours, et chaque tentative rejouerait tout ce qui
    // avait déjà réussi — le mail de bienvenue en tête. Les deux vont ensemble.
    //
    // On libère la réservation pour que le réessai puisse reprendre le travail.
    console.error('[webhook] Erreur générale — événement NON traité :', error)
    if (evenementReserve) await libererEvenement(evenementReserve, proprietaire, (error as Error)?.message?.slice(0, 300))
    return NextResponse.json({ error: 'traitement échoué' }, { status: 500 })
  }
}

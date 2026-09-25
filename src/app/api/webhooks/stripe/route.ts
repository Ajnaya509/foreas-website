import { NextResponse, after } from 'next/server'
import { monterUneMarche } from '@/lib/escalier'
import Stripe from 'stripe'
import { sendProvisionFailureAlert } from '@/lib/email'
import { sendCheckoutWelcome } from '@/lib/partnerCheckoutWelcome'
import { construireSignaux, verifierCumulEssai, enregistrerEssai } from '@/lib/essaisAccordes'
import { annulerEnvoiProgramme } from '@/lib/email'
import { synchroniserAbonnement } from '@/lib/synchroniserAbonnement'
import { activateOwnedCheckout, beginBillingObservation } from '@/lib/checkoutOwner'
import { bindPartnerCheckout } from '@/lib/partnerCheckoutAttribution'
import { clientServeur } from '@/lib/supabaseServeur'
// ── 20/08/2026 — PLUS DE REPLI SILENCIEUX VERS LA CLÉ PUBLIQUE ──────────────
// Cette route retombait sur la clé publique quand la clé serveur manquait.
// Le jour d'une rotation de clé, ce `||` ne produit AUCUNE erreur : la route se
// met à lire avec les droits d'un visiteur anonyme, en silence. Une panne
// bruyante se répare ; une dégradation silencieuse s'installe.
// Le client vient maintenant de src/lib/supabaseServeur.ts, qui refuse plutôt
// que de dégrader.
import { cleServeurOuVide, clientServeurOuNull } from '@/lib/supabaseServeur'
import { repere } from '@/lib/journal'
import { recordPartnerPaidInvoice, recordPartnerInvoiceIssue } from '@/lib/partnerBillingEvents'
import { bindEnrollmentCheckout, blockEnrollmentInvoiceIssue, hasEnrollmentReference, recordEnrollmentPaidInvoice } from '@/lib/partnerEnrollmentAttribution'

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
  return new Stripe(key, { apiVersion: '2025-02-24.acacia' as Stripe.StripeConfig['apiVersion'] /* Acacia volontaire : Basil déplace current_period_end */ })
}

/**
 * La fin de la période courante — cherchée AUX DEUX ENDROITS OÙ STRIPE LA MET.
 *
 * ⚠️ POURQUOI CETTE FONCTION EXISTE.
 * Jusqu'à la version d'API `2025-02-24.acacia`, `current_period_end` vit sur
 * l'ABONNEMENT. À partir de `2025-03-31.basil`, Stripe l'a déplacée sur les
 * LIGNES de l'abonnement (`items.data[].current_period_end`).
 *
 * Ce fichier lit la forme Acacia et son client y est épinglé, donc rien ne casse
 * aujourd'hui. Mais le jour où quelqu'un montera cette version — et ce jour
 * viendra — la propriété deviendrait `undefined` et la ligne d'abonné partirait
 * SANS DATE, sans la moindre erreur. Une panne muette sur le chemin qui encaisse.
 *
 * Lire les deux emplacements coûte trois lignes et supprime ce piège pour de bon.
 */
function finDePeriode(abo: Stripe.Subscription | null | undefined): string | null {
  if (!abo) return null
  const surLAbonnement = (abo as unknown as { current_period_end?: number }).current_period_end
  const surLaPremiereLigne = abo.items?.data?.[0]?.current_period_end
  const secondes = surLAbonnement ?? surLaPremiereLigne
  return secondes ? new Date(secondes * 1000).toISOString() : null
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
  const result = await clientServeur().rpc('partner_checkout_receipt_store', { p_data: data })
  if (result.error || result.data?.status !== 'stored') throw new Error('subscriber_non_enregistre_reprise_requise')
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
        sujet: `⚠️ ABONNEMENT NON RATTACHÉ : ${stripeSubId} (${status})`,
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
  if (!sb) throw new Error('confirmation_evenement_indisponible')
  const { data, error } = await sb
    .from('site_evenements_stripe_traites')
    .update({ statut: 'fait', fini_le: new Date().toISOString(), note: note ?? null })
    .eq('event_id', id)
    .eq('proprietaire', proprietaire)
    .eq('statut', 'en_cours')
    .select('event_id')
  if (error) {
    console.error(`[webhook] confirmation impossible : ${error.message}`)
    throw new Error('confirmation_evenement_non_enregistree')
  }
  if (!data || data.length === 0) {
    // On a perdu le bail en route : quelqu'un d'autre a repris l'événement.
    // Ne pas se taire — c'est le signe que l'exécution a dépassé son bail.
    console.error(`[webhook] ${id} : bail perdu avant confirmation, travail peut-être fait deux fois`)
    throw new Error('confirmation_evenement_bail_perdu')
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

  /*
   * ⚠️ 29/08/2026 — POURQUOI CETTE VARIABLE EXISTE.
   *
   * Le 28 au soir, un chauffeur a payé, son compte a été créé, son numéro
   * écrit — et son mail d'identifiants n'est jamais parti : la clé du service
   * d'envoi était invalide. La trace n'existait QUE dans les journaux
   * d'exécution, qui s'effacent. L'alerte de secours, elle, passait par le
   * MÊME service : elle n'est jamais partie non plus.
   *
   * On écrit donc l'incident dans la ligne de l'événement, en base. Ça survit
   * aux journaux, ça se retrouve avec une seule requête, et ça ne dépend
   * d'aucun service tiers :
   *   select event_id, note from site_evenements_stripe_traites
   *   where note is not null order by fini_le desc;
   */
  let noteIncident: string | null = null
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
    // Une signature valide de test ne doit jamais modifier les comptes réels.
    const modeReel = /^(?:sk|rk)_live_/.test((process.env.STRIPE_SECRET_KEY ?? '').trim())
    if (event.livemode !== modeReel) return NextResponse.json({ received: true, ignored: 'mode_stripe_different' })

    if (event.type === 'checkout.session.completed' && event.data.object.mode !== 'subscription') return NextResponse.json({ received: true, ignored: 'not_subscription_checkout' })

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

      // Reserve before reading Stripe, including before ending a reused trial.
      // An absent legacy beneficiary is queued by activateOwnedCheckout below.
      const owner = await clientServeur().rpc('partner_checkout_owner_read', { p_checkout_id: session.id })
      if (owner.error) throw new Error('lecture_beneficiaire_indisponible')
      const observationId = typeof owner.data?.auth_user_id === 'string'
        ? await beginBillingObservation(clientServeur(), owner.data.auth_user_id) : null

      // Extraire les custom fields
      /**
       * ⚠️ DEUX SOURCES, ET AUCUNE N'EST FACULTATIVE.
       *
       * `custom_fields` est rempli par L'INTERFACE DE STRIPE — donc uniquement
       * quand la session est en `ui_mode: 'embedded'` ou `'hosted'`. C'est le cas
       * de /tarifs3, de /reactivation et des liens WhatsApp.
       *
       * `/tarifs3` crée des sessions en `ui_mode: 'custom'` : Stripe n'affiche
       * plus aucun champ, donc `custom_fields` reste VIDE POUR TOUJOURS. C'est
       * notre propre formulaire qui collecte le numéro et la ville, et
       * `POST /api/checkout/coordonnees` les écrit dans les métadonnées avant la
       * confirmation.
       *
       * Ne lire qu'une des deux sources reviendrait à créer des comptes sans
       * numéro ni ville — sans erreur, sans alerte, et sans que personne ne s'en
       * aperçoive avant de vouloir appeler quelqu'un.
       *
       * Ordre : les métadonnées d'abord. Elles ne sont écrites que par notre
       * formulaire, donc leur présence prouve qu'on est sur le nouveau chemin.
       */
      const meta = (session.metadata as Record<string, string> | null) || {}
      const phoneField = session.custom_fields?.find(f => f.key === 'phone')
      const cityField = session.custom_fields?.find(f => f.key === 'city')
      const phone = meta.foreas_phone || phoneField?.numeric?.value || null
      const city = meta.foreas_city || cityField?.text?.value || null

      /* ⚠️ 29/08/2026 — LE NOM NE VIENT PLUS DE STRIPE, ET C'EST VOULU.
         `billing_address_collection` est passé de `required` à `auto` le 28
         pour débloquer les cartes qui étaient toutes refusées. Effet de bord
         découvert le lendemain : Stripe a cessé du même coup de collecter le
         NOM de facturation, donc `customer_details.name` est vide, donc la page
         de succès affichait « Bienvenue, chauffeur ».
         Notre formulaire demande maintenant le prénom et l'écrit ici. On garde
         le nom de Stripe en second : les sessions de /tarifs3 le portent encore. */
      const prenomChauffeur = meta.foreas_prenom || session.customer_details?.name || ''

      /* ═══════════════════════════════════════════════════════════════════
         LE RAPPEL DE PANIER ABANDONNÉ N'A PLUS LIEU D'ÊTRE : IL A PAYÉ.

         Un mail « tu y étais presque » qui arrive chez quelqu'un qui vient de
         s'abonner, c'est perdre sa confiance en une phrase — et lui faire
         douter que son paiement soit bien passé.

         ⚠️ ON LE FAIT TÔT, AVANT LE PROVISIONNEMENT. Le rappel est programmé à
         quinze minutes ; tout ce qui suit peut prendre plusieurs secondes, et
         un webhook rejoué plus tard arriverait trop tard pour annuler.

         ⚠️ ET ON N'ÉCHOUE JAMAIS LE WEBHOOK POUR ÇA. Un rappel de trop est
         désagréable ; un webhook en erreur coûte le compte, le mot de passe et
         le mail de bienvenue. */
      try {
        const sbPanier = clientServeurOuNull()
        if (sbPanier) {
          /* ⚠️ ON FERME PAR ADRESSE, PAS PAR SESSION. LE GRINCHEUX AVAIT RAISON.
             Un chauffeur abandonne le panier A (séquence lancée), revient une
             heure plus tard et paie sur une session B toute neuve. Chercher
             uniquement `checkout_session_id = B` ne trouve rien : le panier A
             reste ouvert, et il reçoit « une question t'a arrêté hier ? » puis
             « dans un an tu seras au même endroit » — alors qu'il est abonné.
             On ferme donc TOUS ses paniers ouverts, quelle que soit la session. */
          const adressePayeur = session.customer_details?.email ?? null
          const { data: paniers } = await sbPanier
            .from('paniers_abandonnes')
            .select('id, envoi_programme_id')
            .is('converti_le', null)
            .or(
              adressePayeur
                ? `checkout_session_id.eq.${session.id},email.eq.${adressePayeur}`
                : `checkout_session_id.eq.${session.id}`,
            )

          for (const panier of paniers ?? []) {
            const annule = panier.envoi_programme_id
              ? await annulerEnvoiProgramme(panier.envoi_programme_id)
              : true
            await sbPanier
              .from('paniers_abandonnes')
              .update({
                converti_le: new Date().toISOString(),
                /* On ne note l'annulation que si Resend l'a acceptée. Écrire la
                   date sans la preuve ferait croire, plus tard, qu'aucun mail
                   n'est parti — alors qu'il est peut-être parti. */
                ...(annule ? { annule_le: new Date().toISOString() } : {}),
              })
              .eq('id', panier.id)
            if (!annule) {
              console.error(
                `[webhook] ⛔ mail de séquence NON annulé (panier ${panier.id}) — ` +
                  'une relance peut partir chez quelqu’un qui vient de payer.',
              )
            }
          }
        }
      } catch (e) {
        console.error('[webhook] annulation du rappel de panier impossible :', (e as Error)?.message)
      }

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
        /* `expand` : sans lui, `default_payment_method` n'est qu'un identifiant,
           et l'empreinte de carte — le seul signal vraiment fiable contre le
           cumul d'essais — resterait hors de portée. */
        subscription = await stripe.subscriptions.retrieve(session.subscription as string, {
          expand: ['default_payment_method'],
        })
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

      /* ═══════════════════════════════════════════════════════════════════
         UN ESSAI GRATUIT PAR PERSONNE, PAS PAR ADRESSE E-MAIL

         Avant ce bloc, `/api/checkout` posait `trial_end` à CHAQUE session sans
         jamais regarder l'historique, et aucun client Stripe n'était réutilisé :
         n'importe qui pouvait enchaîner les essais à l'infini.

         ⚠️ POURQUOI ICI ET PAS À LA CRÉATION DE SESSION. Parce qu'à ce
         moment-là on ne sait RIEN : en `ui_mode: 'custom'` l'e-mail arrive par
         `updateEmail()`, le téléphone par `/api/checkout/coordonnees`, et la
         carte n'existe pas encore. Ici, les trois sont connus.

         ⚠️ LA SANCTION EST LA FIN DE L'ESSAI, PAS LA FIN DE L'ABONNEMENT.
         Refuser l'abonnement ferait d'un fraudeur un client perdu ; lui faire
         payer tout de suite en fait un client payant.

         ⚠️ ON NE TOUCHE RIEN SI L'ESSAI N'EN EST PAS UN. `/reactivation` passe
         `immediate: true` — Stripe renvoie alors `active`, sans essai. Couper
         un essai inexistant déclencherait une facture surprise chez quelqu'un
         qui a déjà payé.                                                       */
      if (subscription && subscription.status === 'trialing' && subscription.trial_end) {
        /* L'empreinte de carte est le signal le plus fiable : elle est stable
           pour une même carte physique, quel que soit l'e-mail utilisé. Stripe
           la donne sur le moyen de paiement — d'où le `expand` plus haut. */
        const moyen = subscription.default_payment_method
        let empreinteCarte: string | null =
          moyen && typeof moyen !== 'string' ? (moyen.card?.fingerprint ?? null) : null

        /* Repli : sur un abonnement en essai, Stripe laisse parfois
           `default_payment_method` vide — la carte est alors rattachée au
           client. Sans ce repli, le seul signal solide disparaîtrait en
           silence, et le garde ne tiendrait plus que sur l'e-mail. */
        if (!empreinteCarte && session.customer) {
          try {
            const cartes = await stripe.paymentMethods.list({
              customer: session.customer as string,
              type: 'card',
              limit: 1,
            })
            empreinteCarte = cartes.data[0]?.card?.fingerprint ?? null
          } catch (e) {
            console.warn(`[essais] carte du client illisible : ${(e as Error)?.message}`)
          }
        }
        if (!empreinteCarte) {
          console.warn(
            '[essais] aucune empreinte de carte — le contrôle ne tient plus que sur ' +
              "l'e-mail, le téléphone et le visiteur. Signal le plus fiable absent.",
          )
        }

        const signaux = construireSignaux({
          empreinteCarte,
          email: session.customer_details?.email ?? null,
          telephone: phone,
          visiteur: meta.foreas_identity_id || subscription.metadata?.foreas_identity_id || null,
        })

        const idAbo = subscription.id
        const verdict = await verifierCumulEssai(signaux, idAbo)

        if (verdict.cumul) {
          console.warn(
            `[essais] CUMUL DÉTECTÉ sur ${idAbo} — signal « ${verdict.signal} » déjà utilisé ` +
              `par ${verdict.abonnementPrecedent}. Fin de l'essai, encaissement immédiat.`,
          )
          try {
            /* `trial_end: 'now'` met fin à l'essai et déclenche la facture tout
               de suite. L'abonnement, lui, continue : la vente est conservée. */
            subscription = await stripe.subscriptions.update(idAbo, { trial_end: 'now' })
            noteIncident =
              `essai refusé (2e essai détecté par « ${verdict.signal} », précédent ${verdict.abonnementPrecedent}) — encaissement immédiat`
          } catch (e) {
            /* ⚠️ ON NE FAIT PAS ÉCHOUER LE PAIEMENT POUR ÇA. Un essai de trop
               coûte quelques euros ; un webhook en erreur coûte le compte du
               chauffeur, son mot de passe et son mail de bienvenue. */
            console.error(`[essais] fin d'essai impossible sur ${idAbo} : ${(e as Error)?.message}`)
            noteIncident = `cumul détecté sur ${idAbo} mais essai NON coupé — à traiter à la main`
          }
        } else {
          if (verdict.motif === 'base_injoignable') {
            noteIncident = `contrôle du cumul NON EXÉCUTÉ pour ${idAbo} (base injoignable) — essai accordé sans vérification`
          }
          /* On enregistre même quand le contrôle n'a pas pu tourner : mieux vaut
             une empreinte de plus en mémoire qu'un trou définitif. */
          await enregistrerEssai(signaux, idAbo)
        }
      }

      // Relire l'état final : le contrôle précédent peut avoir terminé l'essai.
      const trialActive = subscription?.status === 'trialing' &&
        typeof subscription.trial_end === 'number' && subscription.trial_end * 1000 > Date.now()
      const trialEnd = trialActive && subscription?.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString() : null
      const trialEndLabel = trialActive && subscription?.trial_end
        ? new Date(subscription.trial_end * 1000).toLocaleDateString('fr-FR', {
            weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Paris',
          }) : null

      // Parrainage V3 — traçabilité prix payé + remise (colonnes existantes amount_eur / discount_eur).
      const fullPriceEur = (subscription?.items.data[0]?.price?.unit_amount ?? 0) / 100
      const refPct = Number(subscription?.metadata?.referral_discount_pct ?? 0)
      const discountEur = Math.round(fullPriceEur * refPct) / 100
      const amountEur = Math.round((fullPriceEur - discountEur) * 100) / 100

      if (typeof session.customer !== 'string' || typeof session.subscription !== 'string' || !subscription) {
        throw new Error('abonnement_stripe_non_resolu')
      }
      // Identity, financial link and access are checked together in one transaction.
      // A billing email, even already confirmed on another account, never chooses its owner.
      const beneficiary = await activateOwnedCheckout(clientServeur(), {
        checkoutId: session.id, customerId: session.customer, subscriptionId: session.subscription, observationId,
        status: subscription.status, periodEnd: finDePeriode(subscription),
        trialEnd,
        pricePerMonth: subscription.items.data[0]?.price.recurring?.interval === 'year' ? amountEur / 12 : amountEur,
      })
      if (beneficiary.status === 'needs_review') throw new Error('checkout_identite_a_verifier_reprise_requise')
      if (beneficiary.status === 'not_active' && owner.data?.auth_user_id) await synchroniserAbonnement(clientServeur(), stripe, session.subscription)
      if (beneficiary.status === 'not_active' && !['canceled', 'incomplete_expired', 'unpaid', 'paused'].includes(subscription.status)) {
        throw new Error('checkout_abonnement_non_actif_reprise_requise')
      }
      if (beneficiary.status === 'active') {
      // Receipt coordinates must not overwrite a different account selected by billing email.
        await upsertSubscriber({
        stripe_customer_id: session.customer,
        stripe_subscription_id: session.subscription,
        /* Le lien de relance vers l'écran 2 vit sur `/success?session_id=…` :
           sans cet identifiant, un mail « il manque ton numéro » ne pourrait
           proposer qu'un lien mort. */
        checkout_session_id: session.id,
        email: beneficiary.email,
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
        current_period_end: finDePeriode(subscription),
      })


        const enrollmentCheckout = await bindEnrollmentCheckout(clientServeur(), {
          checkoutId: session.id, customerId: session.customer,
          subscriptionId: session.subscription, authUserId: beneficiary.userId,
        }, hasEnrollmentReference(session) || hasEnrollmentReference(subscription))
        if (!enrollmentCheckout) {
          await bindPartnerCheckout(clientServeur(), {
            checkoutId: session.id, customerId: session.customer,
            subscriptionId: session.subscription, authUserId: beneficiary.userId,
          })
        }
        const mailParti = session.metadata?.source === 'foreas_app' ? true : await sendCheckoutWelcome(clientServeur(), session.id, beneficiary.userId, {
          email: beneficiary.email, name: prenomChauffeur, plan: planInfo.name,
          trialEnd: trialEndLabel, trialActive, credentials: null,
          dejaInscrit: { email: beneficiary.email },
        })
        if (!mailParti) {
          noteIncident = `MAIL BIENVENUE À VÉRIFIER — caisse ${session.id}, récupération du compte disponible depuis la connexion`
          await sendProvisionFailureAlert({
            email: beneficiary.email,
            sujet: `⚠️ CHECKOUT TERMINÉ — mail de bienvenue à vérifier : ${beneficiary.email}`,
            reason: `Issue du mail de bienvenue à vérifier avant un renvoi. Caisse ${session.id}. Statut Stripe : ${subscription?.status ?? 'inconnu'}.`,
          })
        }
      } else {
        // The current subscription is proved inactive. No access is opened.
        noteIncident = `ACCÈS NON OUVERT — caisse ${session.id} : ${beneficiary.status}`
      }

      // 3. La mesure publicitaire est maintenant la responsabilite exclusive
      //    de la file privee P29, jamais de ce webhook Stripe.
      // ── 23/08 — L'ESCALIER MONTE ICI, ET SEULEMENT SUR CE QUE STRIPE DIT ──
      // L'identité voyage dans les métadonnées : ce webhook n'a ni cookie ni
      // session, il ne peut pas la deviner. Sans elle, on ne monte rien —
      // un paiement attaché au mauvais dossier est pire qu'un dossier vide.
      //
      // ⛔ ET ON DISTINGUE L'ESSAI DE L'ARGENT. `checkout.session.completed`
      // signifie « le formulaire est allé au bout », pas « il a payé ». Sur un
      // essai à 0 €, personne n'a rien payé — c'est exactement l'erreur qui
      // ferait compter un essai gratuit comme une vente.
      // ⚠️ L'identité est posée dans `subscription_data.metadata`, donc elle
      // arrive sur l'ABONNEMENT — pas sur la session. Stripe ne recopie pas
      // l'un dans l'autre. Lire la session seule ne trouvait rien, en silence.
      // On lit les deux, l'abonnement d'abord.
      const identitePaiement =
        (subscription?.metadata as Record<string, string> | null)?.foreas_identity_id ||
        (session.metadata as Record<string, string> | null)?.foreas_identity_id ||
        null
      // ⚠️ `trial_end` RESTE REMPLI APRÈS LA FIN DE L'ESSAI — c'est une date
      // historique, pas un drapeau. Le tester par sa simple présence dirait
      // « en essai » pour toujours. On demande donc s'il est ENCORE dans le
      // futur, et le statut Stripe reste l'autorité principale.
      const finEssai = subscription?.trial_end ? subscription.trial_end * 1000 : 0
      const enEssai = subscription?.status === 'trialing' && finEssai > Date.now()
      // ⚠️ 24/08 — MÊME PIÈGE QUE LES ENVOIS PUBLICITAIRES VINGT LIGNES PLUS BAS.
      // Cette fonction est gelée dès que la réponse part : un appel lancé sans
      // rien pour le retenir peut ne jamais s'exécuter. Le commentaire qui
      // l'explique est déjà dans ce fichier depuis le 21/08, et l'émetteur
      // écrit le 23/08 est tombé dedans quand même. Mesuré en production le
      // 24/08 sur /wa : un vrai clic, aucune ligne écrite.
      after(async () => {
        await monterUneMarche(
          identitePaiement,
          enEssai ? 'essai_actif' : 'paiement_confirme',
          session.id,
          'stripe',
        )
      })

      // Aucun envoi publicitaire ne part d'une copie de consentement stockee
      // dans Stripe. P29 cree et garde la conversion privee ; son travailleur
      // relit l'identite, l'accord courant, le paiement net et le remboursement
      // avant que le futur expediteur dedie puisse envoyer une seule fois.

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
      await synchroniserAbonnement(clientServeur(), stripe, sub.id)
      await updateSubscriberStatus(sub.id, sub.status)
      console.log('[webhook] Subscription updated:', sub.id, '→', sub.status)
    }

    // ─── customer.subscription.deleted ─────────────────────────────
    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as Stripe.Subscription
      await synchroniserAbonnement(clientServeur(), stripe, sub.id)
      await updateSubscriberStatus(sub.id, 'canceled')
      console.log('[webhook] Subscription deleted:', sub.id)
    }

    // ─── invoice.payment_failed ────────────────────────────────────
    // ── 23/08 — LE VRAI PAIEMENT N'ÉTAIT TRAITÉ NULLE PART ────────────────
    // Le webhook connaissait `payment_failed` mais pas `paid` : un chauffeur
    // qui finissait son essai et payait réellement restait invisible. La
    // marche `PAYE` n'avait donc aucun émetteur, et « première valeur » ne
    // pouvait pas se mesurer.
    //
    // La preuve est l'identifiant de facture Stripe — stable et unique, donc
    // un rejeu du webhook ne fait pas monter deux fois.
    // ⛔ Un montant nul n'est pas un paiement : la première facture d'un essai
    // vaut 0 €, et la compter serait fabriquer une vente.
    if (event.type === 'invoice.paid' || event.type === 'invoice.payment_succeeded') {
      const facture = event.data.object as Stripe.Invoice
      const paye = (facture.amount_paid ?? 0) > 0
      // ⚠️ 23/08 — J'AI ÉCRIT `facture.subscription` SANS LIRE VINGT LIGNES
      // PLUS BAS. Le bloc `payment_failed` du 21/08 lit DÉJÀ les deux formes,
      // et son commentaire explique pourquoi : `apiVersion` n'estampille que
      // les requêtes SORTANTES ; la charge d'un événement ENTRANT est
      // versionnée par la destination configurée chez Stripe, que ce code ne
      // contrôle pas. Sur les versions récentes, `invoice.subscription`
      // disparaît au profit d'un chemin imbriqué.
      // Le piège était documenté à portée de regard. Je ne l'ai pas lu.
      const idAbonnement =
        (facture as unknown as { parent?: { subscription_details?: { subscription?: string } } })
          .parent?.subscription_details?.subscription ??
        (facture as unknown as { subscription?: string }).subscription
      if (paye && idAbonnement) {
        try {
          const abo = await stripe.subscriptions.retrieve(idAbonnement as string)
          const ident =
            (abo.metadata as Record<string, string> | null)?.foreas_identity_id || null
          if (!ident) {
            // Un paiement réel qu'on ne sait pas rattacher doit se VOIR.
            // Silencieux, il ressemblerait à « personne n'a payé ».
            console.warn('[escalier] facture payée sans identité rattachable')
          }
          after(async () => {
            await monterUneMarche(ident, 'paiement_confirme', facture.id, 'stripe')
          })
        } catch (err) {
          console.warn('[escalier] lecture Stripe impossible :', (err as Error).message)
        }
      } else if (paye) {
        console.warn('[escalier] facture payée mais aucun abonnement trouvé')
      }
    }

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
      const idAbonnement = ((invoice as unknown as { parent?: { subscription_details?: { subscription?: string } } }).parent?.subscription_details?.subscription) ?? (invoice as unknown as { subscription?: string }).subscription
      if (idAbonnement) {
        await updateSubscriberStatus(idAbonnement as string, 'past_due')
        console.log('[webhook] Payment failed pour subscription:', idAbonnement)
        // TODO: envoyer email de relance
      }
    }

    if (event.type === 'invoice.paid' || event.type === 'invoice.payment_succeeded') {
      const enrollmentInvoice = await recordEnrollmentPaidInvoice(clientServeur(), stripe, event.data.object.id, event.livemode)
      if (!enrollmentInvoice) await recordPartnerPaidInvoice(clientServeur(), stripe, event.data.object.id, event.livemode)
    }
    if (event.type === 'charge.refunded' || event.type.startsWith('charge.dispute.')) {
      const enrollmentIssue = await blockEnrollmentInvoiceIssue(clientServeur(), stripe, event)
      if (!enrollmentIssue) await recordPartnerInvoiceIssue(clientServeur(), stripe, event)
    }
    await confirmerEvenement(event.id, proprietaire, noteIncident ?? undefined)
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

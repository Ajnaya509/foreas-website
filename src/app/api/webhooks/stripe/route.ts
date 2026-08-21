import { NextResponse } from 'next/server'
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
import { cleServeurOuVide } from '@/lib/supabaseServeur'

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
    console.log('[webhook] Supabase non configuré — subscriber non sauvegardé:', data.email)
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
      // Pas d'adresse e-mail dans le journal : l'identifiant Stripe suffit à
      // retrouver la ligne, et il n'est pas une donnée personnelle.
      console.error(`[webhook] ÉCHEC écriture subscriber (${data.stripe_subscription_id ?? 'sans id'}) : ${error.code} ${error.message}`)
      return
    }
    console.log('[webhook] subscriber enregistré :', data.stripe_subscription_id ?? 'sans id')
  } catch (e) {
    console.error('[webhook] Erreur Supabase:', e)
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
    const { error } = await supabase
      .from('subscribers')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('stripe_subscription_id', stripeSubId)
    if (error) {
      console.error(`[webhook] ÉCHEC mise à jour statut (${stripeSubId}) : ${error.code} ${error.message}`)
    }
  } catch (e) {
    console.error('[webhook] Erreur update status:', e)
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const sig = request.headers.get('stripe-signature')

    const webhookSecret = getWebhookSecret()
    if (!sig || !webhookSecret) {
      console.warn('[webhook] Signature ou secret manquant')
      return NextResponse.json({ received: true })
    }

    const stripe = getStripeClient()
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
    } catch (err) {
      console.error('[webhook] Vérification signature échouée:', (err as Error).message)
      return NextResponse.json({ error: 'Signature invalide' }, { status: 400 })
    }

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
      let planInfo = { name: 'Hebdomadaire', cycle: 'weekly' }

      if (session.subscription) {
        subscription = await stripe.subscriptions.retrieve(session.subscription as string)
        const priceId = subscription.items.data[0]?.price?.id || ''
        planInfo = PLAN_MAP[priceId] || planInfo
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
        status: 'trialing',
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

        await sendWelcomeEmail({
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
      const purchaseValue = subscription?.items.data[0]?.price?.unit_amount
        ? subscription.items.data[0].price.unit_amount / 100
        : 0
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
      // Même conversion, deux canaux pub. Fire-and-forget — jamais bloquer le webhook
      // Stripe pour une pub qui échouerait (les deux sendX() sont déjà fail-open).
      const tiktokUserData = {
        email: capiUserData.email,
        phone: capiUserData.phone,
        externalId: capiUserData.externalId,
      }
      Promise.allSettled([
        sendCAPIEvent({
          eventName: 'StartTrial',
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
        sendCAPIEvent({
          eventName: 'Subscribe',
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
        // TikTok n'a pas d'équivalent standard "StartTrial" — Subscribe seul suffit
        // à marquer le début de l'abonnement pour l'optimisation de campagne.
        sendTikTokEvent({
          eventName: 'Subscribe',
          userData: tiktokUserData,
          customData: {
            value: purchaseValue,
            currency,
            contentName: planInfo.name,
            orderId: session.subscription as string,
          },
          eventSourceUrl: session.url || `${URL_SITE}/tarifs2`,
        }),
      ]).catch(() => {})

      // 4. TODO: SMS via Twilio
      // if (phone) {
      //   await twilioClient.messages.create({
      //     body: `Bienvenue sur FOREAS ! Télécharge l'app : https://foreas.xyz/download`,
      //     from: process.env.TWILIO_PHONE_NUMBER,
      //     to: phone,
      //   })
      // }

      console.log('[webhook] checkout.session.completed traité pour', session.customer_details?.email)
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
      if (invoice.subscription) {
        await updateSubscriberStatus(invoice.subscription as string, 'past_due')
        console.log('[webhook] Payment failed pour subscription:', invoice.subscription)
        // TODO: envoyer email de relance
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[webhook] Erreur générale:', error)
    // Toujours retourner 200 pour éviter que Stripe retry en boucle
    return NextResponse.json({ received: true })
  }
}

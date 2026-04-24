import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { sendWelcomeEmail } from '@/lib/email'
import { sendCAPIEvent } from '@/lib/meta-capi'

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
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) {
    console.log('[webhook] Supabase non configuré — subscriber non sauvegardé:', data.email)
    return
  }
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(supabaseUrl, supabaseKey)
    await supabase.from('subscribers').upsert(data, { onConflict: 'stripe_subscription_id' })
    console.log('[webhook] Subscriber sauvegardé:', data.email)
  } catch (e) {
    console.error('[webhook] Erreur Supabase:', e)
  }
}

async function updateSubscriberStatus(stripeSubId: string, status: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) return
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(supabaseUrl, supabaseKey)
    await supabase.from('subscribers')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('stripe_subscription_id', stripeSubId)
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
        current_period_end: subscription?.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null,
      })

      // 2. Envoyer email de bienvenue
      if (session.customer_details?.email) {
        await sendWelcomeEmail({
          email: session.customer_details.email,
          name: session.customer_details.name || '',
          plan: planInfo.name,
          trialEnd: trialEndLabel,
        })
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
      // Fire-and-forget — jamais bloquer le webhook Stripe
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
          eventSourceUrl: session.url || 'https://foreas.xyz/tarifs2',
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
          eventSourceUrl: session.url || 'https://foreas.xyz/tarifs2',
          actionSource: 'website',
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

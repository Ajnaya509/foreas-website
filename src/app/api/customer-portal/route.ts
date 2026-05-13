/**
 * GET /api/customer-portal?customer_id=cus_...
 *
 * Génère une Stripe Customer Portal Session et redirige le user vers Stripe.
 * Le user peut depuis le portal : voir factures, changer carte, annuler abo,
 * télécharger reçus.
 *
 * Utilisé depuis /success "Gérer mon abonnement" (post-checkout) + futurs
 * écrans dashboard chauffeur.
 *
 * Sécurité : pas de validation auth sur le `customer_id` (le user peut deviner
 * un cus_xxx d'autre client). Stripe Customer Portal protège côté serveur via
 * son propre login email magic link → le user qui n'a pas accès email du
 * customer ne peut rien faire. Acceptable pour MVP. P1 : ajouter session
 * Supabase auth + croiser avec auth.users.email = customer.email.
 *
 * Configuration prérequise (Stripe Dashboard Customer Portal Settings) :
 *  - Allow customers to update billing addresses
 *  - Allow customers to update payment methods
 *  - Allow customers to view invoices
 *  - Allow customers to cancel subscriptions
 *  → https://dashboard.stripe.com/settings/billing/portal
 */

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const customerId = request.nextUrl.searchParams.get('customer_id')

  if (!customerId || !customerId.startsWith('cus_')) {
    return NextResponse.json(
      { error: 'customer_id invalide ou manquant' },
      { status: 400 },
    )
  }

  const stripeKey = (process.env.STRIPE_SECRET_KEY ?? '').replace(/\s/g, '')
  if (!stripeKey) {
    return NextResponse.json(
      { error: 'Configuration Stripe manquante' },
      { status: 500 },
    )
  }

  try {
    const stripe = new Stripe(stripeKey, { apiVersion: '2025-02-24.acacia' })

    // Si STRIPE_PORTAL_RETURN_URL pas configurée, retombe sur l'origin courant
    const origin =
      process.env.STRIPE_PORTAL_RETURN_URL ??
      `${request.nextUrl.protocol}//${request.nextUrl.host}/success?session_id=`

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: origin.startsWith('http') ? origin : `https://${request.nextUrl.host}`,
    })

    // Redirect 303 (See Other) — le browser navigue vers Stripe Portal
    return NextResponse.redirect(portalSession.url, { status: 303 })
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('[customer-portal] Stripe error:', err.message)
    return NextResponse.json(
      {
        error: err.message ?? 'Erreur création Customer Portal',
        hint:
          'Vérifier que Stripe Customer Portal est configuré : https://dashboard.stripe.com/settings/billing/portal',
      },
      { status: 500 },
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export const runtime = 'nodejs'

/**
 * POST /api/subscription/contact
 * Attache le TÉLÉPHONE (et le nom) du chauffeur à l'abonnement custom (/checkout),
 * APRÈS création de l'abo (qui se fait au montage de la page pour le Payment Element).
 *
 * Pourquoi : le téléphone = point d'ancrage du compte chauffeur (identité forte).
 * Le webhook canonique (Railway) lira `customer.phone` + `subscription.metadata.phone`
 * pour créer/retrouver le compte du chauffeur web-first. Voir brief AJNAYA_ONBOARDING_WEB_FIRST.md.
 *
 * NON-BLOQUANT : si ça échoue, on renvoie 200 → le paiement n'est JAMAIS bloqué par ça.
 */

function getStripe() {
  const key = (process.env.STRIPE_SECRET_KEY || '').replace(/\s/g, '')
  return new Stripe(key, { apiVersion: '2025-02-24.acacia', timeout: 9000, maxNetworkRetries: 1 })
}

function normPhone(p: string): string | null {
  const d = p.replace(/[\s.\-()]/g, '')
  if (/^\+33\d{9}$/.test(d)) return d
  if (/^0\d{9}$/.test(d)) return '+33' + d.slice(1)
  if (/^\+\d{8,15}$/.test(d)) return d
  return null
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ ok: false }, { status: 200 })
    const { subscription_id, phone, name } = await request.json() as {
      subscription_id?: string; phone?: string; name?: string
    }
    const e164 = phone ? normPhone(phone) : null
    if (!subscription_id || !e164) return NextResponse.json({ ok: false, reason: 'missing' }, { status: 200 })

    const stripe = getStripe()
    const sub = await stripe.subscriptions.retrieve(subscription_id)
    const customerId = sub.customer as string
    const cleanName = (name || '').trim().slice(0, 120)

    await stripe.customers.update(customerId, { phone: e164, ...(cleanName ? { name: cleanName } : {}) })
    await stripe.subscriptions.update(subscription_id, {
      metadata: { ...(sub.metadata || {}), phone: e164, ...(cleanName ? { customer_name: cleanName } : {}) },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false, reason: 'error' }, { status: 200 }) // jamais bloquer le paiement
  }
}

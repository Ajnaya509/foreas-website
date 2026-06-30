import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export const runtime = 'nodejs'

/**
 * POST /api/observe — relais SITE → porte universelle d'identité Pieuvre.
 * Brief : FOREAS-SHARED/briefs/AJNAYA_CAPTURE_TOUTES_LES_PORTES.md
 *
 * Le client envoie des badges en CLAIR (visitor_id, email, phone). Ce relais :
 *  - hashe email/phone côté serveur (règle d'or : 0 PII en clair dans id_value),
 *  - ajoute ip_hash/ua_hash UNIQUEMENT si consentement (signal d'appoint faible),
 *  - forwarde à Railway avec la clé secrète x-pieuvre-key (jamais exposée au client).
 *
 * Fire-and-forget côté client : on observe, on ne bloque jamais l'UX.
 */

const OBSERVE_URL = 'https://foreas-stripe-backend-production.up.railway.app/api/pieuvre/identity/observe'

function sha256(v: string): string {
  return crypto.createHash('sha256').update(v).digest('hex')
}
function normEmail(e: string): string | null {
  const s = e.trim().toLowerCase()
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s) ? s : null
}
function normPhone(p: string): string | null {
  const d = p.replace(/[\s.\-()]/g, '')
  if (/^\+33\d{9}$/.test(d)) return d
  if (/^0\d{9}$/.test(d)) return '+33' + d.slice(1)
  if (/^\+\d{8,15}$/.test(d)) return d
  return null
}

interface Identifier { id_type: string; id_value: string; confidence?: number }

export async function POST(request: NextRequest) {
  try {
    const key = process.env.PIEUVRE_API_KEY || process.env.PIEUVRE_RESPOND_SECRET || ''
    if (!key) return NextResponse.json({ ok: false, reason: 'no_key' }, { status: 200 }) // silencieux

    const body = await request.json()
    const { visitor_id, email, phone, canal = 'site', consent_ipua = false } = body as {
      visitor_id?: string; email?: string; phone?: string; canal?: string; consent_ipua?: boolean
    }

    const identifiers: Identifier[] = []
    if (visitor_id) identifiers.push({ id_type: 'visitor_id', id_value: String(visitor_id), confidence: 0.6 })
    if (email) { const e = normEmail(email); if (e) identifiers.push({ id_type: 'email_hash', id_value: sha256(e), confidence: 1.0 }) }
    if (phone) { const p = normPhone(phone); if (p) identifiers.push({ id_type: 'phone_hash', id_value: sha256(p), confidence: 1.0 }) }

    // ip/ua = signaux faibles, UNIQUEMENT avec consentement (CNIL). HMAC (jamais en clair).
    if (consent_ipua) {
      const salt = process.env.OBSERVE_HMAC_SALT || key
      const fwd = request.headers.get('x-forwarded-for') || ''
      const ip = fwd.split(',')[0]?.trim() || request.headers.get('x-real-ip') || ''
      const ua = request.headers.get('user-agent') || ''
      if (ip) identifiers.push({ id_type: 'ip_hash', id_value: crypto.createHmac('sha256', salt).update(ip).digest('hex'), confidence: 0.2 })
      if (ua) identifiers.push({ id_type: 'ua_hash', id_value: crypto.createHmac('sha256', salt).update(ua).digest('hex'), confidence: 0.15 })
    }

    if (identifiers.length === 0) return NextResponse.json({ ok: false, reason: 'no_identifiers' }, { status: 200 })

    const res = await fetch(OBSERVE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-pieuvre-key': key },
      body: JSON.stringify({ identifiers, context: { canal } }),
      cache: 'no-store',
    })
    if (!res.ok) return NextResponse.json({ ok: false, reason: `upstream_${res.status}` }, { status: 200 })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json({ ok: true, identity_id: data?.identity_id ?? null, is_known: data?.is_known ?? null })
  } catch {
    return NextResponse.json({ ok: false, reason: 'error' }, { status: 200 }) // jamais casser le client
  }
}

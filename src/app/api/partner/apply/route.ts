import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendPartnerApplicantEmail, sendPartnerInternalEmail } from '@/lib/email'

export const runtime = 'nodejs'

/**
 * POST /api/partner/apply — candidature partenaire (Onboarding V1).
 * Flux : insert dans `partner_applications` (status 'pending', clé anon) + 2 emails
 * (candidat + contact@foreas.xyz). AUCUN compte auth créé ici — l'app/admin approuve
 * puis déclenche l'invitation mot de passe. Zéro porte dérobée.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))

    const company_name = String(body.company_name || '').trim().slice(0, 120)
    const contact_name = String(body.contact_name || '').trim().slice(0, 120)
    const email = String(body.email || '').trim().toLowerCase().slice(0, 160)
    const phone = String(body.phone || '').trim().slice(0, 30) || null
    const siret = String(body.siret || '').replace(/\s/g, '').slice(0, 14) || null
    const message = String(body.message || '').trim().slice(0, 2000) || null
    const honeypot = String(body.website || '').trim() // champ piège anti-bot (caché côté UI)

    // Bot détecté (honeypot rempli) → on répond OK sans rien faire (ne pas l'informer).
    if (honeypot) return NextResponse.json({ ok: true })

    // Validation serveur
    if (company_name.length < 2)
      return NextResponse.json({ error: 'Nom de société requis (2 caractères min).' }, { status: 400 })
    if (contact_name.length < 2)
      return NextResponse.json({ error: 'Nom du contact requis.' }, { status: 400 })
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return NextResponse.json({ error: 'Email valide requis.' }, { status: 400 })
    if (siret && siret.length !== 14)
      return NextResponse.json({ error: 'SIRET invalide (14 chiffres).' }, { status: 400 })

    // Insert (RLS: policy "anyone can apply" autorise l'INSERT anon, status forcé 'pending')
    const { error } = await supabase
      .from('partner_applications')
      .insert({ company_name, contact_name, email, phone, siret, message, status: 'pending' })

    if (error) {
      console.error('[partner/apply] insert error:', error.message)
      return NextResponse.json({ error: "Impossible d'enregistrer la demande. Réessaie." }, { status: 500 })
    }

    // Emails best-effort (n'empêchent jamais la confirmation).
    await Promise.allSettled([
      sendPartnerApplicantEmail({ email, contactName: contact_name, companyName: company_name }),
      sendPartnerInternalEmail({
        companyName: company_name,
        contactName: contact_name,
        email,
        phone: phone ?? undefined,
        siret: siret ?? undefined,
        message: message ?? undefined,
      }),
    ])

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[partner/apply] error:', e)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}

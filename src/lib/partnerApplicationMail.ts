import type { SupabaseClient } from '@supabase/supabase-js'
import { sendPartnerApplicantEmail, sendPartnerInternalEmail } from '@/lib/email'

type MailJob = {
  id: string; application_id: string; lease_id: string; kind: 'applicant' | 'internal';
  body: { email: string; contact_name: string; company_name: string; phone?: string;
    siret?: string; message?: string; category?: string; professional_url?: string;
    territory?: string; collaboration_mode?: string; };
}

/** Réservation atomique, contenu enregistré lors du dépôt et même clé chez
 * l'expéditeur à chaque tentative. Une interruption ne perd pas le message. */
export async function processPartnerApplicationMail(sb: SupabaseClient, applicationId: string | null = null) {
  const claimed = await sb.rpc('partner_application_mail_claim', {
    p_application_id: applicationId, p_limit: applicationId ? 2 : 10,
  })
  if (claimed.error || !Array.isArray(claimed.data?.jobs)) throw new Error('confirmation_file_indisponible')
  let accepted = 0
  let pending = 0
  // Limite les appels simultanés au service d'envoi.
  for (const job of claimed.data.jobs as MailJob[]) {
    if (!job.id || !job.application_id || !job.lease_id || !['applicant', 'internal'].includes(job.kind)) {
      throw new Error('confirmation_operation_invalide')
    }
    const body = job.body
    let receipt: { accepted: boolean; providerId?: string | null } = { accepted: false }
    try {
      receipt = job.kind === 'applicant'
        ? await sendPartnerApplicantEmail({ email: body.email, contactName: body.contact_name, companyName: body.company_name, reference: job.application_id })
        : await sendPartnerInternalEmail({ companyName: body.company_name, contactName: body.contact_name, email: body.email,
          phone: body.phone, siret: body.siret, message: body.message, category: body.category,
          professionalUrl: body.professional_url, territory: body.territory, collaborationMode: body.collaboration_mode,
          reference: job.application_id })
    } catch { /* La réservation expirera ou sera remise en attente ci-dessous. */ }
    const completed = await sb.rpc('partner_application_mail_complete', {
      p_job_id: job.id, p_lease_id: job.lease_id,
      p_provider_id: receipt.accepted && receipt.providerId ? receipt.providerId : null,
    })
    if (completed.error || !['accepted', 'retry'].includes(completed.data?.state)) {
      // La clé fournisseur permet de reprendre après une réponse perdue.
      throw new Error('confirmation_resultat_non_enregistre')
    }
    if (completed.data.state === 'accepted') accepted++
    else pending++
  }
  return { processed: claimed.data.jobs.length, accepted, pending }
}

export async function partnerApplicationConfirmation(sb: SupabaseClient, applicationId: string) {
  const { data, error } = await sb.rpc('partner_application_mail_status', { p_application_id: applicationId })
  if (error || !data) return 'unavailable' as const
  if (data.applicant === 'accepted') return 'accepted' as const
  if (['queued', 'retry', 'sending'].includes(data.applicant)) return 'pending' as const
  return 'unavailable' as const
}

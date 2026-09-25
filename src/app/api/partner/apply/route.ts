import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { clientServeurOuNull } from '@/lib/supabaseServeur'
import { validatePartnerApplication, UUID_PATTERN } from '@/lib/partnerApplication'
import { partnerRateKey } from '@/lib/partnerRateKey'
import { processPartnerApplicationMail, partnerApplicationConfirmation } from '@/lib/partnerApplicationMail'

export const runtime = 'nodejs'
const headers = { 'Cache-Control': 'no-store' }

export async function POST(req: NextRequest) {
  const requestId = randomUUID()
  const fail = (status: number, code: string, message: string, fields?: unknown) => NextResponse.json(
    { contract_version: 'partner.v1', error: { code, message, request_id: requestId, ...(fields ? { fields } : {}) } },
    { status, headers: { ...headers, ...(status === 429 ? { 'Retry-After': '900' } : {}) } },
  )
  if (!req.headers.get('content-type')?.includes('application/json')) return fail(415, 'INVALID_REQUEST', 'Le formulaire doit être envoyé depuis cette page.')
  const origin = req.headers.get('origin')
  if (origin && origin !== req.nextUrl.origin) return fail(403, 'INVALID_REQUEST', 'Actualise la page avant de réessayer.')
  const key = req.headers.get('idempotency-key') || ''
  if (!UUID_PATTERN.test(key)) return fail(400, 'INVALID_REQUEST', 'Actualise la page avant de réessayer.')
  try {
    if (Number(req.headers.get('content-length') || 0) > 16_384) return fail(413, 'INVALID_REQUEST', 'Le formulaire est trop long.')
    const raw = await req.text()
    if (Buffer.byteLength(raw, 'utf8') > 16_384) return fail(413, 'INVALID_REQUEST', 'Le formulaire est trop long.')
    let input: unknown
    try { input = JSON.parse(raw) } catch { return fail(400, 'INVALID_REQUEST', 'Vérifie les informations du formulaire.') }
    const { data, errors } = validatePartnerApplication(input)
    if (Object.keys(errors).length) return fail(400, 'INVALID_REQUEST', 'Vérifie les champs indiqués.', errors)
    if (data.website) return fail(400, 'INVALID_REQUEST', 'Impossible de valider ce formulaire.')
    const sb = clientServeurOuNull()
    const rateKey = partnerRateKey(req.headers)
    if (!sb || !rateKey) return fail(503, 'SERVICE_UNAVAILABLE', 'Les candidatures sont momentanément indisponibles. Réessaie plus tard.')
    const { data: result, error } = await sb.rpc('partner_application_submit', {
      p_request_key: key, p_company_name: data.company_name, p_contact_name: data.contact_name,
      p_email: data.email, p_phone: data.phone || null, p_siret: data.siret || null,
      p_message: data.message || null, p_category: data.category,
      p_professional_url: data.professional_url || null, p_territory: data.territory || null,
      p_collaboration_mode: data.collaboration_mode, p_rate_key: rateKey,
    })
    if (error) {
      if (error.message === 'RATE_LIMITED') return fail(429, 'RATE_LIMITED', 'Trop de demandes ont été envoyées. Réessaie dans quinze minutes.')
      if (error.message === 'OPERATION_CONFLICT') return fail(409, 'OPERATION_CONFLICT', 'La première demande a déjà été enregistrée. Contacte FOREAS pour la modifier.')
      if (error.message === 'INVALID_REQUEST') return fail(400, 'INVALID_REQUEST', 'Vérifie les informations du formulaire.')
      console.error('[partner/apply] dépôt refusé', { requestId, code: error.code })
      return fail(503, 'SERVICE_UNAVAILABLE', 'La demande n’a pas pu être confirmée. Réessaie avec ce formulaire.')
    }
    if (!result?.application?.reference || result.application.status !== 'received') return fail(503, 'SERVICE_UNAVAILABLE', 'La réception de ta demande reste à vérifier. Réessaie avec ce formulaire.')
    try { await processPartnerApplicationMail(sb, result.application.reference) }
    catch { console.error('[partner/apply] confirmation à reprendre', { requestId }) }
    const emailStatus = await partnerApplicationConfirmation(sb, result.application.reference)
    return NextResponse.json({ contract_version: 'partner.v1', data: { application: result.application, confirmation_email: emailStatus }, meta: { request_id: requestId, as_of: new Date().toISOString() } }, { status: result.replayed ? 200 : 201, headers })
  } catch {
    console.error('[partner/apply] interruption', { requestId })
    return fail(503, 'SERVICE_UNAVAILABLE', 'La demande n’a pas pu être confirmée. Réessaie avec ce formulaire.')
  }
}

/** Browser and server share validation; applicants never choose their admission. */
export const PARTNER_CATEGORIES = [
  ['training', 'Centre de formation'], ['rental', 'Loueur de véhicules'],
  ['fleet_employer', 'Flotte employeur'], ['fleet_admin', 'Rattachement administratif'],
  ['cooperative', 'Coopérative ou groupement'], ['creator', 'Créateur ou communauté'],
  ['driver', 'Chauffeur indépendant'], ['services', 'Services aux chauffeurs'],
  ['other', 'Autre activité'],
] as const
export type PartnerApplication = {
  company_name: string; contact_name: string; email: string; category: string;
  professional_url: string; territory: string; collaboration_mode: string;
  phone: string; siret: string; message: string; website: string;
}
export const EMPTY_APPLICATION: PartnerApplication = {
  company_name: '', contact_name: '', email: '', category: '', professional_url: '',
  territory: '', collaboration_mode: 'recommendation', phone: '', siret: '', message: '', website: '',
}
const LIMITS: Record<keyof PartnerApplication, number> = {
  company_name: 120, contact_name: 120, email: 160, category: 40, professional_url: 500,
  territory: 120, collaboration_mode: 40, phone: 30, siret: 30, message: 2000, website: 200,
}
export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
export function validatePartnerApplication(input: unknown): {
  data: PartnerApplication; errors: Partial<Record<keyof PartnerApplication | 'form', string>>
} {
  const data = { ...EMPTY_APPLICATION }
  const errors: Partial<Record<keyof PartnerApplication | 'form', string>> = {}
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { data, errors: { form: 'Vérifie les informations du formulaire.' } }
  const body = input as Record<string, unknown>
  if (Object.keys(body).some(k => !(k in LIMITS))) errors.form = 'Le formulaire contient un champ non reconnu.'
  for (const key of Object.keys(LIMITS) as (keyof PartnerApplication)[]) {
    const value = body[key]
    if (value == null) continue
    if (typeof value !== 'string' || value.length > LIMITS[key] || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) {
      errors[key] = 'Vérifie ce champ et sa longueur.'
      continue
    }
    data[key] = value.trim()
  }
  data.email = data.email.toLowerCase()
  data.siret = data.siret.replace(/\s/g, '')
  if (data.company_name.length < 2) errors.company_name = 'Indique ta structure ou ton nom professionnel.'
  if (data.contact_name.length < 2) errors.contact_name = 'Indique ton nom.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'Indique une adresse email valide.'
  if (!PARTNER_CATEGORIES.some(([v]) => v === data.category)) errors.category = 'Choisis ton activité.'
  if (!['recommendation', 'team_equipment', 'both'].includes(data.collaboration_mode)) errors.collaboration_mode = 'Choisis le type de collaboration.'
  if (data.siret && !/^\d{14}$/.test(data.siret)) errors.siret = 'Le SIRET doit contenir 14 chiffres.'
  if (data.professional_url) {
    try {
      const url = new URL(data.professional_url)
      if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || !url.hostname.includes('.')) throw new Error()
    } catch { errors.professional_url = 'Indique un lien complet, par exemple https://exemple.fr.' }
  }
  return { data, errors }
}

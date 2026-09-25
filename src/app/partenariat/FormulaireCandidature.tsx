'use client'

import { useRef, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import s from './partenariat.module.css'

const categories = [
  ['training', 'Centre de formation'], ['rental', 'Loueur de véhicules'],
  ['fleet_employer', 'Flotte employeur'], ['fleet_admin', 'Rattachement administratif'],
  ['cooperative', 'Coopérative ou groupement'], ['creator', 'Créateur ou communauté'],
  ['driver', 'Chauffeur indépendant'], ['services', 'Services aux chauffeurs'], ['other', 'Autre activité'],
] as const

export default function FormulaireCandidature() {
  const busy = useRef(false)
  const requestKey = useRef<string | null>(null)
  const confirmation = useRef<HTMLHeadingElement>(null)
  const [sending, setSending] = useState(false)
  const [received, setReceived] = useState<{reference?: string} | null>(null)
  const [error, setError] = useState('')
  const [uncertain, setUncertain] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy.current || uncertain) return
    const data = new FormData(event.currentTarget)
    const read = (key: string) => String(data.get(key) || '').trim()
    if (read('website')) {
      setError('Le formulaire a été rempli automatiquement de façon inattendue. Contactez FOREAS pour transmettre votre candidature.')
      return
    }
    const company = read('company_name'), contact = read('contact_name')
    if (company.length < 2 || contact.length < 2) {
      setError('Indiquez au moins deux caractères pour votre structure et votre nom.')
      return
    }
    // Preserve the category in the legacy server's message, while also providing
    // its dedicated field for the programme server when it is published.
    const category = read('category')
    const label = categories.find(([value]) => value === category)?.[1]
    const body = {
      company_name: company, contact_name: contact, email: read('email').toLowerCase(),
      category, phone: read('phone'), message: `[Partenariat · ${label || category}]\n${read('message')}`,
      website: read('website'), siret: '', professional_url: '', territory: '', collaboration_mode: 'recommendation',
    }
    busy.current = true
    setSending(true); setError('')
    requestKey.current ||= crypto.randomUUID()
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 45000)
    try {
      const response = await fetch('/api/partner/apply', {
        method: 'POST', headers: {'Content-Type': 'application/json', 'Idempotency-Key': requestKey.current},
        body: JSON.stringify(body), signal: controller.signal,
      })
      const result = await response.json().catch(() => null)
      if (!response.ok) {
        if ([400, 413, 415, 429].includes(response.status)) {
          setError(response.status === 429 ? 'Trop de demandes rapprochées. Patientez avant de réessayer.' : 'Vérifiez les informations saisies avant de renvoyer le formulaire.')
          return
        }
        throw new Error('uncertain')
      }
      const modern = result?.contract_version === 'partner.v1' && result?.data?.application?.status === 'received' && typeof result.data.application.reference === 'string'
      if (!modern && result?.ok !== true) throw new Error('uncertain')
      setReceived(modern ? {reference: result.data.application.reference} : {})
      requestAnimationFrame(() => confirmation.current?.focus())
    } catch {
      // The legacy route cannot deduplicate an uncertain submission. Do not
      // encourage another submission that could create a duplicate application.
      setUncertain(true)
      setError('La réception de votre demande reste à confirmer. Vos informations sont conservées dans ce formulaire. Contactez-nous avant de la renvoyer.')
    } finally {
      clearTimeout(timeout); busy.current = false; setSending(false)
    }
  }

  if (received) return <div className={`${s.form} ${s.receipt}`}><CheckCircle2 size={36} aria-hidden="true" /><h3 ref={confirmation} tabIndex={-1}>Votre candidature est enregistrée.</h3><p>Merci. L’équipe FOREAS va étudier votre activité.</p>{received.reference && <p>Votre référence : <strong>{received.reference}</strong></p>}<p>Nous vous répondrons à l’adresse email indiquée. Votre accès sera activé après admission et acceptation des conditions.</p><a className={s.textLink} href={'mailto:contact@foreas.xyz?subject=' + encodeURIComponent('Candidature partenaire' + (received.reference ? ' ' + received.reference : ''))}>Contacter FOREAS <ArrowRight size={16} aria-hidden="true" /></a></div>

  return <form className={s.form} onSubmit={submit} aria-busy={sending}>
    <h3>Présenter mon activité</h3><p className={s.note}>Les champs avec * sont obligatoires.</p>
    <div className={s.trap} aria-hidden="true"><label htmlFor="candidature-website">Website</label><input id="candidature-website" name="website" autoComplete="off" tabIndex={-1} /></div>
    <fieldset disabled={sending || uncertain}>
      <label htmlFor="candidature-category">Votre activité *<select id="candidature-category" name="category" required defaultValue=""><option value="" disabled>Choisir mon activité</option>{categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label htmlFor="candidature-company">Structure ou nom professionnel *<input id="candidature-company" name="company_name" autoComplete="organization" required minLength={2} maxLength={120} /></label>
      <label htmlFor="candidature-name">Votre nom *<input id="candidature-name" name="contact_name" autoComplete="name" required minLength={2} maxLength={120} /></label>
      <label htmlFor="candidature-email">Votre email *<input id="candidature-email" name="email" type="email" autoComplete="email" required maxLength={160} /></label>
      <details className={s.optional}><summary>Ajouter une précision · facultatif</summary><label htmlFor="candidature-phone">Téléphone<input id="candidature-phone" name="phone" type="tel" autoComplete="tel" maxLength={30} /></label><label htmlFor="candidature-message">Votre projet<textarea id="candidature-message" name="message" rows={3} maxLength={1800} placeholder="Votre réseau, votre zone, un besoin pour votre flotte…" /></label></details>
      <button type="submit" className={s.cta}>{sending ? 'Enregistrement en cours…' : 'Envoyer ma candidature'}<ArrowRight size={18} aria-hidden="true" /></button>
    </fieldset>
    {error && <p role="alert" className={s.error}>{error} {uncertain && <a href="mailto:contact@foreas.xyz?subject=Reception%20de%20ma%20candidature%20partenaire">Contacter FOREAS</a>}</p>}
    <p className={s.note}>EPHIALTES utilise ces informations pour étudier votre candidature et vous répondre. Pour vos droits, écrivez à contact@foreas.xyz. <Link href="/partenariat/donnees">Utilisation des données</Link>.</p>
  </form>
}

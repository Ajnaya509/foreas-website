'use client'

import { useRef, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { authUrls } from '@/lib/auth-urls'
import { EMPTY_APPLICATION, PARTNER_CATEGORIES, validatePartnerApplication, type PartnerApplication } from '@/lib/partnerApplication'
import './partenaire.css'

type Receipt = { reference: string; emailStatus: string }
export default function PartnerSignupForm() {
  const [data, setData] = useState<PartnerApplication>({ ...EMPTY_APPLICATION })
  const [errors, setErrors] = useState<Partial<Record<keyof PartnerApplication | 'form', string>>>({})
  const [loading, setLoading] = useState(false)
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const [submitError, setSubmitError] = useState('')
  const requestKey = useRef<string | null>(null)
  const submittedBody = useRef<string | null>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const form = useRef<HTMLFormElement>(null)
  const set = (key: keyof PartnerApplication, value: string) => {
    setData(previous => ({ ...previous, [key]: value }))
    setErrors(previous => ({ ...previous, [key]: undefined }))
  }
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (loading) return
    const checked = validatePartnerApplication(data)
    setErrors(checked.errors)
    setSubmitError('')
    if (Object.keys(checked.errors).length) {
      const first = Object.keys(checked.errors)[0]
      form.current?.querySelector<HTMLElement>('[name="' + first + '"]')?.focus()
      return
    }
    const body = JSON.stringify(checked.data)
    // Keep the same key and exact submitted body after an uncertain response.
    if (submittedBody.current && submittedBody.current !== body) {
      setSubmitError('Une demande précédente reste à confirmer. Rétablis ses informations et réessaie, ou contacte FOREAS avant d’en envoyer une autre.')
      return
    }
    requestKey.current ||= crypto.randomUUID()
    submittedBody.current = body
    setLoading(true)
    try {
      const response = await fetch('/api/partner/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': requestKey.current },
        body,
      })
      const result = await response.json().catch(() => null)
      if (!response.ok) {
        if ([400, 413, 415, 429].includes(response.status)) submittedBody.current = null
        if (result?.error?.fields) setErrors(result.error.fields)
        throw new Error(result?.error?.message || 'La réception reste à vérifier. Réessaie avec ce formulaire.')
      }
      if (result?.contract_version !== 'partner.v1' || result?.data?.application?.status !== 'received' || typeof result.data.application.reference !== 'string') throw new Error('La réception reste à vérifier. Réessaie avec ce formulaire.')
      setReceipt({ reference: result.data.application.reference, emailStatus: result.data.confirmation_email })
      requestAnimationFrame(() => heading.current?.focus())
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Connexion interrompue. Réessaie avec ce formulaire.')
    } finally { setLoading(false) }
  }
  const input = (key: keyof PartnerApplication, label: string, options: { type?: string; required?: boolean; maxLength?: number; autoComplete?: string; placeholder?: string } = {}) => (
    <div className="partner-field">
      <label htmlFor={'partner-' + key}>{label}{options.required ? ' *' : ' · facultatif'}</label>
      <input id={'partner-' + key} name={key} type={options.type || 'text'} value={data[key]}
        onChange={e => set(key, e.target.value)} required={options.required}
        maxLength={options.maxLength || 120} autoComplete={options.autoComplete}
        placeholder={options.placeholder} aria-invalid={!!errors[key]}
        aria-describedby={errors[key] ? key + '-error' : undefined} />
      {errors[key] && <p className="partner-error" id={key + '-error'}>{errors[key]}</p>}
    </div>
  )
  return (
    <main className="partner-page">
      <header className="partner-header">
        <Link className="partner-brand" href="/" aria-label="FOREAS, accueil">FOREAS<span>DRIVER</span></Link>
        <a className="partner-link" href={authUrls.loginPartner}>Mon espace partenaire<ArrowRight size={16} aria-hidden /></a>
      </header>
      <div className="partner-content">
        <section className="partner-intro" aria-labelledby="partner-title">
          <p className="partner-eyebrow">Programme partenaire</p>
          <h1 id="partner-title">Ton réseau.<br /><span>De nouvelles possibilités.</span></h1>
          <p>Tu accompagnes des chauffeurs VTC ? Propose-leur FOREAS Driver et reçois une commission sur les abonnements que tu apportes.</p>
          <div className="partner-reward" aria-label="Commissions du partenaire">
            <div><strong>10 €</strong><span>par mensualité admissible payée, après deux mois consécutifs payés</span></div>
            <div><strong>50 €</strong><span>au premier paiement annuel admissible</span></div>
          </div>
          <p className="partner-note">Ces montants sont tes commissions pour les nouveaux partenaires, sous réserve des conditions publiées et acceptées. Les deux premières mensualités admissibles ouvrent alors 20 € de droits après le paiement du deuxième mois. Le renouvellement annuel ne donne pas de nouvelle commission. Un abonnement remboursé ou contesté peut être exclu.</p>
          <ol className="partner-steps">
            <li><span>1</span><div><strong>Présente ton activité</strong><p>Quelques informations pour adapter le partenariat.</p></div></li>
            <li><span>2</span><div><strong>On étudie ta candidature</strong><p>Le programme et ses conditions te sont proposés selon ton activité.</p></div></li>
            <li><span>3</span><div><strong>Partage depuis ton espace</strong><p>Après validation : ton lien, tes supports et le suivi de tes commissions.</p></div></li>
          </ol>
          <p className="partner-note">Une flotte peut recommander l’app ou demander à équiper ses chauffeurs. Cette demande ne donne aucun accès aux comptes personnels des chauffeurs.</p>
          <details className="partner-application-help">
            <summary>Préparer et suivre ma candidature</summary>
            <p className="partner-note">Ton activité, ta structure ou ton nom professionnel, ton nom et ton email suffisent pour commencer. Le site professionnel, la zone, le projet, le téléphone, le SIRET et le message restent facultatifs. Aucun fichier bancaire ou document de chauffeur n’est demandé ici.</p>
            <p className="partner-note">Après l’envoi, garde la référence affichée. Une demande reçue attend encore la décision de FOREAS. Un email confié au service d’envoi ne prouve pas son arrivée dans ta boîte. Aucun délai d’admission n’est garanti à ce stade.</p>
            <p className="partner-note">Si la réception reste incertaine, réessaie avec le même formulaire et les mêmes informations. Si tu les as modifiées ou si le problème persiste, contacte FOREAS avant d’envoyer une nouvelle demande.</p>
            <p className="partner-note">Après admission, retrouve le compte lié à ton dossier, lis les conditions publiées dans Aide et accepte-les si elles te conviennent. Partage seulement le lien personnel affiché comme disponible. Les informations de versement se complètent ensuite dans le parcours sécurisé.</p>
            <a className="partner-link" href="mailto:contact@foreas.xyz?subject=Candidature%20partenaire">Demander de l’aide avec ma référence</a>
          </details>
        </section>
        <section className="partner-card" aria-labelledby="application-title">
          {receipt ? (
            <div className="partner-receipt">
              <CheckCircle2 size={36} aria-hidden />
              <p className="partner-eyebrow">Candidature enregistrée</p>
              <h2 ref={heading} tabIndex={-1} id="application-title">Ta demande est reçue.</h2>
              <p>Elle attend l’étude de FOREAS. L’enregistrement ne vaut pas encore admission au programme.</p>
              <dl><dt>Ta référence</dt><dd>{receipt.reference}</dd></dl>
              <p>{receipt.emailStatus === 'accepted'
                ? 'Un email de confirmation a été confié à notre service d’envoi. Garde aussi cette référence.'
                : 'Garde cette référence. L’envoi de l’email de confirmation n’est pas confirmé.'}</p>
              <a className="partner-button partner-button-secondary" href={'mailto:contact@foreas.xyz?subject=' + encodeURIComponent('Candidature partenaire ' + receipt.reference)}>Contacter FOREAS</a>
              <Link className="partner-link" href="/">Revenir à FOREAS</Link>
            </div>
          ) : (
            <form ref={form} onSubmit={submit} noValidate aria-busy={loading}>
              <h2 id="application-title">Parlons de ton activité.</h2>
              <p className="partner-form-intro">Les champs avec * suffisent pour commencer.</p>
              <div className="partner-honeypot" aria-hidden="true">
                <label htmlFor="partner-website">Website</label>
                <input id="partner-website" name="website" tabIndex={-1} autoComplete="off" value={data.website} onChange={e => set('website', e.target.value)} />
              </div>
              <fieldset disabled={loading}>
                <div className="partner-field">
                  <label htmlFor="partner-category">Ton activité *</label>
                  <select id="partner-category" name="category" required value={data.category} onChange={e => set('category', e.target.value)} aria-invalid={!!errors.category} aria-describedby={errors.category ? 'category-error' : undefined}>
                    <option value="">Choisis une activité</option>
                    {PARTNER_CATEGORIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                  {errors.category && <p id="category-error" className="partner-error">{errors.category}</p>}
                </div>
                {input('company_name', 'Structure ou nom professionnel', { required: true, autoComplete: 'organization' })}
                {input('contact_name', 'Ton nom', { required: true, autoComplete: 'name' })}
                {input('email', 'Ton email', { required: true, type: 'email', autoComplete: 'email', maxLength: 160 })}
                <details>
                  <summary>Préciser mon projet · facultatif</summary>
                  {input('professional_url', 'Site ou page professionnelle', { type: 'url', maxLength: 500, placeholder: 'https://…' })}
                  {input('territory', 'Ville ou zone d’activité')}
                  <div className="partner-field">
                    <label htmlFor="partner-collaboration">Ton projet</label>
                    <select id="partner-collaboration" name="collaboration_mode" value={data.collaboration_mode} onChange={e => set('collaboration_mode', e.target.value)}>
                      <option value="recommendation">Recommander FOREAS Driver</option>
                      <option value="team_equipment">Équiper mes chauffeurs</option>
                      <option value="both">Les deux</option>
                    </select>
                  </div>
                  {input('phone', 'Téléphone', { type: 'tel', maxLength: 30, autoComplete: 'tel' })}
                  {input('siret', 'SIRET', { maxLength: 30 })}
                  <div className="partner-field">
                    <label htmlFor="partner-message">Un mot sur ton projet · facultatif</label>
                    <textarea id="partner-message" name="message" rows={4} maxLength={2000} value={data.message} onChange={e => set('message', e.target.value)} />
                    {errors.message && <p className="partner-error">{errors.message}</p>}
                  </div>
                </details>
                {(submitError || errors.form) && <p className="partner-error partner-alert" role="alert">{submitError || errors.form}</p>}
                <button className="partner-button" type="submit" disabled={loading}>{loading ? 'Enregistrement…' : 'Envoyer ma candidature'}<ArrowRight size={18} aria-hidden /></button>
              </fieldset>
              <p className="partner-note">EPHIALTES utilise ces informations pour examiner ta candidature et te répondre. <Link href="/devenir-partenaire/donnees">Utilisation de tes données et tes droits</Link>.</p>
            </form>
          )}
        </section>
      </div>
      <footer className="partner-footer"><span>FOREAS, toujours plus loin.</span><a href="mailto:contact@foreas.xyz">Une question ? Contacte-nous</a></footer>
    </main>
  )
}

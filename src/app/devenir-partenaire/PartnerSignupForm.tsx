'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import {
  Building2, Mail, Phone, ChevronDown, CheckCircle2,
  ArrowRight, Users, TrendingUp, Copy, Check
} from 'lucide-react'
import { authUrls } from '@/lib/auth-urls'

// ─── Types ────────────────────────────────────────────────────────────────────
type CompanyType =
  | 'auto_ecole'
  | 'fleet_manager'
  | 'influencer'
  | 'agent_commercial'
  | 'federation'
  | 'autre'

interface FormData {
  company_name: string
  contact_email: string
  contact_phone: string
  company_type: CompanyType | ''
  siret: string
  address: string
}

interface SignupResponse {
  ok: boolean
  partner_id: string
  referral_code: string
  status: string
  message: string
}

// ─── Validation (Zod-like, client-side) ───────────────────────────────────────
function validateForm(data: FormData): Record<keyof FormData, string> {
  const errors: Partial<Record<keyof FormData, string>> = {}

  if (!data.company_name || data.company_name.length < 2)
    errors.company_name = 'Nom de société requis (2 caractères minimum)'
  else if (data.company_name.length > 120)
    errors.company_name = 'Nom trop long (120 caractères maximum)'

  if (!data.contact_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contact_email))
    errors.contact_email = 'Email valide requis'

  if (data.contact_phone && (data.contact_phone.length < 6 || data.contact_phone.length > 30))
    errors.contact_phone = 'Numéro de téléphone invalide (6 à 30 caractères)'

  if (!data.company_type) errors.company_type = 'Type de structure requis'

  if (data.siret && data.siret.replace(/\s/g, '').length !== 14)
    errors.siret = 'SIRET invalide (14 chiffres)'

  if (data.address && data.address.length > 255)
    errors.address = 'Adresse trop longue (255 caractères maximum)'

  return errors as Record<keyof FormData, string>
}

// ─── Company type labels ──────────────────────────────────────────────────────
const COMPANY_TYPES: Array<{ value: CompanyType; label: string; description: string }> = [
  { value: 'auto_ecole', label: 'Auto-école / CPC', description: 'Formation VTC & permis de conduire' },
  { value: 'fleet_manager', label: 'Gestionnaire de flotte', description: 'Flotte de véhicules ou location' },
  { value: 'influencer', label: 'Influenceur / Créateur', description: 'Audience chauffeurs VTC' },
  { value: 'agent_commercial', label: 'Agent commercial', description: 'Prospection indépendante' },
  { value: 'federation', label: 'Fédération / Association', description: 'Organisation professionnelle VTC' },
  { value: 'autre', label: 'Autre', description: 'Autre type de structure' },
]

// ─── Benefits ─────────────────────────────────────────────────────────────────
const BENEFITS = [
  { label: '10€ / mois', sub: 'Par chauffeur filleul actif (N1)', icon: TrendingUp },
  { label: '4€ / mois', sub: 'Niveau 2 (filleul du filleul)', icon: Users },
  { label: '2€ / mois', sub: 'Niveau 3 (cascade)', icon: Users },
  { label: 'Versement le 5', sub: 'Paiement Stripe auto chaque mois', icon: CheckCircle2 },
]

// ─── Success screen ────────────────────────────────────────────────────────────
function SuccessScreen({ response }: { response: SignupResponse }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(response.referral_code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="text-center"
    >
      {/* Icon */}
      <div
        className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #8C52FF, #FF6699)', boxShadow: '0 8px 32px rgba(140,82,255,0.4)' }}
      >
        <CheckCircle2 className="w-8 h-8 text-white" />
      </div>

      <h2 className="font-title text-3xl font-bold text-white mb-2">
        Bienvenue dans le programme CAP !
      </h2>
      <p className="font-body text-sm text-white/50 mb-8 max-w-md mx-auto">
        {response.message || 'Inscription reçue. Validation sous 24-48h par notre équipe. Vous recevrez votre code de parrainage par email.'}
      </p>

      {/* Referral code */}
      <div className="max-w-sm mx-auto mb-8">
        <p className="font-body text-xs font-semibold uppercase tracking-widest text-violet-400 mb-3">
          Votre code partenaire
        </p>
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-violet-500/30 bg-violet-500/[0.06]">
          <span className="font-title text-2xl font-bold text-white flex-1 text-center tracking-wider">
            {response.referral_code}
          </span>
          <button
            onClick={handleCopy}
            className="p-2 rounded-lg border border-white/10 hover:border-white/20 transition-colors text-white/50 hover:text-white"
            title="Copier le code"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        <p className="font-body text-xs text-white/30 mt-2 text-center">
          Partagez ce lien :{' '}
          <span className="text-violet-400">foreas.xyz/cap?ref={response.referral_code}</span>
        </p>
      </div>

      {/* Status badge */}
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-500/30 bg-amber-500/[0.06] font-body text-sm text-amber-400">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        Statut : En attente de validation (24-48h)
      </div>

      {/* What's next */}
      <div className="mt-10 p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] text-left max-w-md mx-auto">
        <p className="font-body text-xs font-semibold uppercase tracking-widest text-white/40 mb-3">
          Prochaines étapes
        </p>
        {[
          'Notre équipe valide votre dossier (24-48h)',
          'Vous recevez un email de confirmation',
          'Votre code devient actif — commencez à recruter',
          '10€/mois par chauffeur actif, versés le 5 de chaque mois',
        ].map((step, i) => (
          <div key={i} className="flex items-start gap-3 mb-3 last:mb-0">
            <span
              className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white mt-0.5"
              style={{ background: 'linear-gradient(135deg, #8C52FF, #FF6699)' }}
            >
              {i + 1}
            </span>
            <p className="font-body text-sm text-white/60">{step}</p>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ─── Main form ─────────────────────────────────────────────────────────────────
export default function PartnerSignupForm() {
  const [formData, setFormData] = useState<FormData>({
    company_name: '',
    contact_email: '',
    contact_phone: '',
    company_type: '',
    siret: '',
    address: '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [success, setSuccess] = useState<SignupResponse | null>(null)
  const [selectOpen, setSelectOpen] = useState(false)

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    // Client-side validation
    const validationErrors = validateForm(formData)
    const hasErrors = Object.keys(validationErrors).some((k) => !!(validationErrors as Record<string, string>)[k])
    if (hasErrors) {
      setErrors(validationErrors)
      return
    }

    setLoading(true)
    try {
      const payload: Record<string, string> = {
        company_name: formData.company_name.trim(),
        contact_email: formData.contact_email.trim().toLowerCase(),
        company_type: formData.company_type,
      }
      if (formData.contact_phone.trim()) payload.contact_phone = formData.contact_phone.trim()
      if (formData.siret.replace(/\s/g, '')) payload.siret = formData.siret.replace(/\s/g, '')
      if (formData.address.trim()) payload.address = formData.address.trim()

      const res = await fetch(
        'https://foreas-stripe-backend-production.up.railway.app/api/public/partners/signup',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData?.message || errData?.error || `Erreur ${res.status}`)
      }

      const data: SignupResponse = await res.json()
      setSuccess(data)

      // Meta CAPI CompleteRegistration (fire-and-forget)
      fetch('/api/pixel/capi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName: 'CompleteRegistration',
          eventSourceUrl: 'https://foreas.xyz/devenir-partenaire',
          userData: { email: formData.contact_email },
          customData: {
            content_name: 'partner_signup',
            company_type: formData.company_type,
            referral_code: data.referral_code,
          },
        }),
      }).catch(() => {})
    } catch (err) {
      setSubmitError((err as Error).message || 'Une erreur est survenue. Réessayez dans quelques instants.')
    } finally {
      setLoading(false)
    }
  }

  const selectedTypeLabel = COMPANY_TYPES.find((t) => t.value === formData.company_type)?.label

  return (
    <main className="min-h-screen bg-black text-white overflow-x-hidden">
      <Header />

      <div className="relative pt-28 pb-20 md:pt-36 md:pb-24 px-6 lg:px-8 overflow-hidden">
        {/* Warm halos — variant warm spec: violet 0.22 + rose 0.14 */}
        <div
          className="absolute inset-0 pointer-events-none animate-halo-pulse"
          aria-hidden
          style={{
            background:
              'radial-gradient(ellipse 60% 50% at 20% 30%, rgba(140,82,255,0.22) 0%, transparent 70%),' +
              'radial-gradient(ellipse 50% 40% at 85% 70%, rgba(255,102,153,0.14) 0%, transparent 70%)',
          }}
        />

        <div className="relative max-w-5xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-14">
            {/* Espace Directeur link — top right of hero */}
            <div className="flex justify-end mb-4">
              <a
                href={authUrls.loginPartner}
                className="text-xs font-medium text-white/35 hover:text-violet-400 transition-colors duration-200"
              >
                Espace Directeur →
              </a>
            </div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="font-body text-xs font-semibold uppercase tracking-widest text-violet-400 mb-3"
            >
              Programme CAP · Customer Acquisition Program
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-title text-4xl md:text-5xl font-bold leading-[1.1] tracking-tight mb-4"
            >
              <span className="text-white">Recrutez des chauffeurs,</span>
              <br />
              <span
                style={{
                  background: 'linear-gradient(135deg, #8C52FF 0%, #FF6699 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                gagnez à vie.
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="font-body text-base text-white/50 max-w-xl mx-auto"
            >
              Recrutez des chauffeurs VTC sur FOREAS avec votre code unique. Touchez 10€/mois par filleul actif —
              tant qu&apos;il reste abonné.
            </motion.p>
          </div>

          {/* Commission cards */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-14"
          >
            {BENEFITS.map((b, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] text-center"
              >
                <div
                  className="w-8 h-8 rounded-lg mx-auto mb-2.5 flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, rgba(140,82,255,0.2), rgba(255,102,153,0.15))' }}
                >
                  <b.icon className="w-4 h-4 text-violet-400" />
                </div>
                <p className="font-title text-lg font-bold text-white mb-0.5">{b.label}</p>
                <p className="font-body text-[11px] text-white/40 leading-relaxed">{b.sub}</p>
              </div>
            ))}
          </motion.div>

          {/* Form + right panel */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
            {/* Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="p-6 md:p-8 rounded-2xl border border-white/[0.07] bg-white/[0.03]"
            >
              <AnimatePresence mode="wait">
                {success ? (
                  <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <SuccessScreen response={success} />
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    onSubmit={handleSubmit}
                    className="space-y-5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <h2 className="font-title text-xl font-semibold text-white mb-1">
                      Inscription partenaire
                    </h2>
                    <p className="font-body text-sm text-white/40 mb-2">
                      Validé sous 24-48h. Vous recevrez votre code par email.
                    </p>

                    {/* company_name */}
                    <div>
                      <label className="block font-body text-xs font-medium text-white/60 mb-1.5">
                        Nom de la société ou entité *
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                        <input
                          type="text"
                          value={formData.company_name}
                          onChange={(e) => handleChange('company_name', e.target.value)}
                          placeholder="Ex: Auto-école Dupont"
                          maxLength={120}
                          className={`w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.05] border font-body text-sm text-white placeholder-white/25 outline-none focus:border-violet-500/50 focus:bg-white/[0.07] transition-all ${
                            errors.company_name ? 'border-rose-500/60' : 'border-white/[0.08]'
                          }`}
                        />
                      </div>
                      {errors.company_name && (
                        <p className="font-body text-xs text-rose-400 mt-1">{errors.company_name}</p>
                      )}
                    </div>

                    {/* contact_email */}
                    <div>
                      <label className="block font-body text-xs font-medium text-white/60 mb-1.5">
                        Email de contact *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                        <input
                          type="email"
                          value={formData.contact_email}
                          onChange={(e) => handleChange('contact_email', e.target.value)}
                          placeholder="votre@email.com"
                          className={`w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.05] border font-body text-sm text-white placeholder-white/25 outline-none focus:border-violet-500/50 focus:bg-white/[0.07] transition-all ${
                            errors.contact_email ? 'border-rose-500/60' : 'border-white/[0.08]'
                          }`}
                        />
                      </div>
                      {errors.contact_email && (
                        <p className="font-body text-xs text-rose-400 mt-1">{errors.contact_email}</p>
                      )}
                    </div>

                    {/* contact_phone */}
                    <div>
                      <label className="block font-body text-xs font-medium text-white/60 mb-1.5">
                        Téléphone <span className="text-white/30">(optionnel)</span>
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                        <input
                          type="tel"
                          value={formData.contact_phone}
                          onChange={(e) => handleChange('contact_phone', e.target.value)}
                          placeholder="+33 6 12 34 56 78"
                          className={`w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.05] border font-body text-sm text-white placeholder-white/25 outline-none focus:border-violet-500/50 focus:bg-white/[0.07] transition-all ${
                            errors.contact_phone ? 'border-rose-500/60' : 'border-white/[0.08]'
                          }`}
                        />
                      </div>
                      {errors.contact_phone && (
                        <p className="font-body text-xs text-rose-400 mt-1">{errors.contact_phone}</p>
                      )}
                    </div>

                    {/* company_type — custom select */}
                    <div className="relative">
                      <label className="block font-body text-xs font-medium text-white/60 mb-1.5">
                        Type de structure *
                      </label>
                      <button
                        type="button"
                        onClick={() => setSelectOpen((o) => !o)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.05] border font-body text-sm transition-all ${
                          errors.company_type ? 'border-rose-500/60' : 'border-white/[0.08]'
                        } ${selectOpen ? 'border-violet-500/50' : ''}`}
                      >
                        <span className={selectedTypeLabel ? 'text-white' : 'text-white/25'}>
                          {selectedTypeLabel || 'Sélectionnez votre type de structure'}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-white/30 transition-transform ${selectOpen ? 'rotate-180' : ''}`}
                        />
                      </button>

                      <AnimatePresence>
                        {selectOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.15 }}
                            className="absolute top-full left-0 right-0 mt-1.5 z-20 rounded-xl border border-white/[0.08] bg-black overflow-hidden"
                            style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}
                          >
                            {COMPANY_TYPES.map((t) => (
                              <button
                                key={t.value}
                                type="button"
                                onClick={() => {
                                  handleChange('company_type', t.value)
                                  setSelectOpen(false)
                                }}
                                className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-white/[0.04] transition-colors ${
                                  formData.company_type === t.value ? 'bg-violet-500/[0.08]' : ''
                                }`}
                              >
                                <div className="flex-1">
                                  <p className="font-body text-sm text-white/90">{t.label}</p>
                                  <p className="font-body text-[11px] text-white/35">{t.description}</p>
                                </div>
                                {formData.company_type === t.value && (
                                  <CheckCircle2 className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                                )}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                      {errors.company_type && (
                        <p className="font-body text-xs text-rose-400 mt-1">{errors.company_type}</p>
                      )}
                    </div>

                    {/* siret */}
                    <div>
                      <label className="block font-body text-xs font-medium text-white/60 mb-1.5">
                        SIRET <span className="text-white/30">(optionnel)</span>
                      </label>
                      <input
                        type="text"
                        value={formData.siret}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, '').slice(0, 14)
                          handleChange('siret', v)
                        }}
                        placeholder="12345678901234"
                        maxLength={14}
                        className={`w-full px-4 py-3 rounded-xl bg-white/[0.05] border font-body text-sm text-white placeholder-white/25 outline-none focus:border-violet-500/50 focus:bg-white/[0.07] transition-all ${
                          errors.siret ? 'border-rose-500/60' : 'border-white/[0.08]'
                        }`}
                      />
                      {errors.siret && (
                        <p className="font-body text-xs text-rose-400 mt-1">{errors.siret}</p>
                      )}
                    </div>

                    {/* address */}
                    <div>
                      <label className="block font-body text-xs font-medium text-white/60 mb-1.5">
                        Adresse <span className="text-white/30">(optionnelle)</span>
                      </label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => handleChange('address', e.target.value)}
                        placeholder="12 rue de la Paix, 75001 Paris"
                        maxLength={255}
                        className={`w-full px-4 py-3 rounded-xl bg-white/[0.05] border font-body text-sm text-white placeholder-white/25 outline-none focus:border-violet-500/50 focus:bg-white/[0.07] transition-all ${
                          errors.address ? 'border-rose-500/60' : 'border-white/[0.08]'
                        }`}
                      />
                      {errors.address && (
                        <p className="font-body text-xs text-rose-400 mt-1">{errors.address}</p>
                      )}
                    </div>

                    {/* Submit error */}
                    {submitError && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/[0.06] font-body text-sm text-rose-400"
                      >
                        {submitError}
                      </motion.div>
                    )}

                    {/* Submit button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl font-body font-semibold text-sm text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                      style={{
                        background: loading
                          ? 'rgba(140,82,255,0.5)'
                          : 'linear-gradient(135deg, #8C52FF 0%, #FF6699 100%)',
                        boxShadow: loading ? 'none' : '0 4px 24px rgba(140,82,255,0.35)',
                      }}
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Envoi en cours…
                        </>
                      ) : (
                        <>
                          Envoyer ma candidature
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    <p className="font-body text-xs text-white/25 text-center">
                      Vos données sont utilisées uniquement dans le cadre du programme CAP FOREAS.
                    </p>

                    {/* Already a partner */}
                    <p className="font-body text-xs text-white/25 text-center pt-2">
                      Déjà inscrit ?{' '}
                      <a
                        href={authUrls.loginPartner}
                        className="text-violet-400/70 hover:text-violet-400 transition-colors duration-150 underline-offset-2 hover:underline"
                      >
                        Accéder à mon espace Directeur
                      </a>
                    </p>
                  </motion.form>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Right panel — MLM explainer */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="space-y-4"
            >
              {/* Cascade MLM */}
              <div className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                <p className="font-body text-xs font-semibold uppercase tracking-widest text-violet-400 mb-4">
                  Cascade de commissions
                </p>
                {[
                  { level: 'N1', amount: '10€', label: 'Filleul direct', color: '#8C52FF' },
                  { level: 'N2', amount: '4€', label: 'Filleul de votre filleul', color: '#B47FFF' },
                  { level: 'N3', amount: '2€', label: 'Niveau 3', color: '#D4AAFF' },
                ].map((l) => (
                  <div key={l.level} className="flex items-center gap-3 mb-3 last:mb-0">
                    <div
                      className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center font-body text-xs font-bold text-white"
                      style={{ background: l.color + '33', border: `1px solid ${l.color}44` }}
                    >
                      {l.level}
                    </div>
                    <div className="flex-1">
                      <p className="font-body text-sm text-white/80">{l.label}</p>
                    </div>
                    <span className="font-title text-base font-bold" style={{ color: l.color }}>
                      {l.amount}<span className="font-body text-xs text-white/30">/mois</span>
                    </span>
                  </div>
                ))}
              </div>

              {/* Conditions */}
              <div className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                <p className="font-body text-xs font-semibold uppercase tracking-widest text-white/35 mb-3">
                  Conditions
                </p>
                {[
                  ['Carence', '1 mois complet payé (4 prélèvements hebdo)'],
                  ['Récurrence', 'Tant que le filleul reste abonné'],
                  ['Versement', 'Stripe Transfer automatique le 5 du mois'],
                  ['Compte Stripe', 'Express Connect requis (gratuit, rapide)'],
                ].map(([key, val]) => (
                  <div key={key} className="flex justify-between gap-3 mb-2.5 last:mb-0">
                    <span className="font-body text-xs text-white/35 flex-shrink-0">{key}</span>
                    <span className="font-body text-xs text-white/60 text-right">{val}</span>
                  </div>
                ))}
              </div>

              {/* Who can join */}
              <div className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                <p className="font-body text-xs font-semibold uppercase tracking-widest text-white/35 mb-3">
                  Qui peut rejoindre ?
                </p>
                {COMPANY_TYPES.map((t) => (
                  <div key={t.value} className="flex items-center gap-2 mb-2 last:mb-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-violet-400/60 flex-shrink-0" />
                    <span className="font-body text-xs text-white/55">{t.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}

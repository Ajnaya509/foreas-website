'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import {
  Building2, User, Mail, Phone, FileText, MessageSquare,
  CheckCircle2, ArrowRight, ShieldCheck,
} from 'lucide-react'
import { authUrls } from '@/lib/auth-urls'

interface FormData {
  company_name: string
  contact_name: string
  email: string
  phone: string
  siret: string
  message: string
  website: string // honeypot (caché) — rempli = bot
}

const EMPTY: FormData = {
  company_name: '', contact_name: '', email: '', phone: '', siret: '', message: '', website: '',
}

function validate(d: FormData): Partial<Record<keyof FormData, string>> {
  const e: Partial<Record<keyof FormData, string>> = {}
  if (!d.company_name || d.company_name.trim().length < 2) e.company_name = 'Nom de société requis'
  if (!d.contact_name || d.contact_name.trim().length < 2) e.contact_name = 'Ton nom requis'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) e.email = 'Email valide requis'
  if (d.siret && d.siret.replace(/\s/g, '').length !== 14) e.siret = 'SIRET = 14 chiffres'
  return e
}

const STEPS = [
  { n: 1, t: 'Tu candidates', d: 'Ce formulaire, 1 minute. Aucun engagement.' },
  { n: 2, t: 'On valide', d: 'On étudie ta demande sous 24-48 h.' },
  { n: 3, t: 'Tu actives', d: 'Si c’est bon, tu reçois un email pour choisir ton mot de passe.' },
]

export default function PartnerSignupForm() {
  const [data, setData] = useState<FormData>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const set = (k: keyof FormData, v: string) => {
    setData((p) => ({ ...p, [k]: v }))
    if (errors[k]) setErrors((p) => ({ ...p, [k]: undefined }))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)
    const v = validate(data)
    if (Object.keys(v).length) { setErrors(v); return }
    setLoading(true)
    try {
      const res = await fetch('/api/partner/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: data.company_name.trim(),
          contact_name: data.contact_name.trim(),
          email: data.email.trim().toLowerCase(),
          phone: data.phone.trim() || undefined,
          siret: data.siret.replace(/\s/g, '') || undefined,
          message: data.message.trim() || undefined,
          website: data.website, // honeypot
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || `Erreur ${res.status}`)
      }
      setDone(true)
    } catch (err) {
      setSubmitError((err as Error).message || 'Une erreur est survenue. Réessaie dans un instant.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = (err?: string) =>
    `w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.05] border font-body text-sm text-white placeholder-white/25 outline-none focus:border-violet-500/50 focus:bg-white/[0.07] transition-all ${
      err ? 'border-rose-500/60' : 'border-white/[0.08]'
    }`

  return (
    <main className="min-h-screen bg-black text-white overflow-x-hidden">
      <Header />

      <div className="relative pt-28 pb-20 md:pt-36 md:pb-24 px-6 lg:px-8 overflow-hidden">
        {/* Halos warm — charte variant warm */}
        <div
          className="absolute inset-0 pointer-events-none animate-halo-pulse"
          aria-hidden
          style={{
            background:
              'radial-gradient(ellipse 60% 50% at 20% 25%, rgba(140,82,255,0.20) 0%, transparent 70%),' +
              'radial-gradient(ellipse 50% 40% at 85% 65%, rgba(255,102,153,0.12) 0%, transparent 70%)',
          }}
        />

        <div className="relative max-w-2xl mx-auto">
          {/* Espace Directeur (déjà partenaire) */}
          <div className="flex justify-end mb-4">
            <a href={authUrls.loginPartner} className="text-xs font-medium text-white/35 hover:text-violet-400 transition-colors">
              Espace Directeur →
            </a>
          </div>

          {/* Hero */}
          <div className="text-center mb-12">
            <p className="font-body text-xs font-semibold uppercase tracking-[0.22em] text-violet-400 mb-3">
              Partenaire FOREAS
            </p>
            <h1 className="font-title text-4xl md:text-5xl font-bold leading-[1.08] tracking-tight mb-4">
              <span className="text-white">Deviens partenaire.</span>
              <br />
              <span style={{ background: 'linear-gradient(135deg, #8C52FF 0%, #FF6699 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Toujours plus loin.
              </span>
            </h1>
            <p className="font-body text-base text-white/55 max-w-lg mx-auto">
              Auto-école, flotte, fédération, créateur, agent : tu amènes des chauffeurs sur FOREAS,
              tu touches une commission mensuelle récurrente tant qu&apos;ils restent actifs.
            </p>
          </div>

          <AnimatePresence mode="wait">
            {done ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="p-8 rounded-2xl border border-white/[0.07] bg-white/[0.03] text-center"
              >
                <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #8C52FF, #FF6699)', boxShadow: '0 8px 32px rgba(140,82,255,0.4)' }}>
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                <h2 className="font-title text-3xl font-bold text-white mb-3">Demande envoyée.</h2>
                <p className="font-body text-sm text-white/55 max-w-md mx-auto mb-6">
                  On revient vers toi sous <strong className="text-white">24 à 48 h</strong>. Rien à faire
                  de ton côté pour l&apos;instant — on t&apos;envoie un email dès que c&apos;est validé.
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-500/30 bg-amber-500/[0.06] font-body text-sm text-amber-400">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  En attente de validation
                </div>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                {/* Comment ça marche */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {STEPS.map((s) => (
                    <div key={s.n} className="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                      <div className="w-7 h-7 rounded-lg mb-2.5 flex items-center justify-center font-body text-xs font-bold text-white"
                        style={{ background: 'linear-gradient(135deg, rgba(140,82,255,0.25), rgba(255,102,153,0.18))' }}>
                        {s.n}
                      </div>
                      <p className="font-body text-sm font-semibold text-white/90 mb-0.5">{s.t}</p>
                      <p className="font-body text-[11px] text-white/40 leading-relaxed">{s.d}</p>
                    </div>
                  ))}
                </div>

                {/* Formulaire */}
                <form onSubmit={onSubmit} className="p-6 md:p-8 rounded-2xl border border-white/[0.07] bg-white/[0.03] space-y-5">
                  <h2 className="font-title text-xl font-semibold text-white">Ta candidature</h2>

                  {/* Honeypot — caché aux humains, piège à bots */}
                  <input
                    type="text" name="website" tabIndex={-1} autoComplete="off"
                    value={data.website} onChange={(e) => set('website', e.target.value)}
                    aria-hidden="true"
                    style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
                  />

                  {/* Société */}
                  <Field label="Société ou structure *" icon={Building2} error={errors.company_name}>
                    <input type="text" value={data.company_name} maxLength={120}
                      onChange={(e) => set('company_name', e.target.value)}
                      placeholder="Ex : Auto-école Dupont" className={inputCls(errors.company_name)} />
                  </Field>

                  {/* Contact */}
                  <Field label="Ton nom *" icon={User} error={errors.contact_name}>
                    <input type="text" value={data.contact_name} maxLength={120}
                      onChange={(e) => set('contact_name', e.target.value)}
                      placeholder="Prénom Nom" className={inputCls(errors.contact_name)} />
                  </Field>

                  {/* Email */}
                  <Field label="Email *" icon={Mail} error={errors.email}>
                    <input type="email" value={data.email}
                      onChange={(e) => set('email', e.target.value)}
                      placeholder="ton@email.com" className={inputCls(errors.email)} />
                  </Field>

                  {/* Téléphone */}
                  <Field label="Téléphone (optionnel)" icon={Phone} error={errors.phone}>
                    <input type="tel" value={data.phone} maxLength={30}
                      onChange={(e) => set('phone', e.target.value)}
                      placeholder="+33 6 12 34 56 78" className={inputCls(errors.phone)} />
                  </Field>

                  {/* SIRET */}
                  <Field label="SIRET (optionnel)" icon={FileText} error={errors.siret}>
                    <input type="text" value={data.siret} maxLength={14}
                      onChange={(e) => set('siret', e.target.value.replace(/\D/g, '').slice(0, 14))}
                      placeholder="14 chiffres" className={inputCls(errors.siret)} />
                  </Field>

                  {/* Message */}
                  <Field label="Message (optionnel)" icon={MessageSquare} error={errors.message} textarea>
                    <textarea value={data.message} maxLength={2000} rows={3}
                      onChange={(e) => set('message', e.target.value)}
                      placeholder="Dis-nous en deux mots qui tu es et combien de chauffeurs tu peux amener."
                      className={`${inputCls(errors.message)} resize-none`} />
                  </Field>

                  {submitError && (
                    <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/[0.06] font-body text-sm text-rose-400">
                      {submitError}
                    </div>
                  )}

                  <button type="submit" disabled={loading}
                    className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl font-body font-semibold text-sm text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ background: loading ? 'rgba(140,82,255,0.5)' : 'linear-gradient(135deg, #8C52FF 0%, #FF6699 100%)', boxShadow: loading ? 'none' : '0 4px 24px rgba(140,82,255,0.35)' }}>
                    {loading ? (
                      <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Envoi…</>
                    ) : (
                      <>Envoyer ma candidature<ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>

                  <p className="flex items-center justify-center gap-1.5 font-body text-xs text-white/30 text-center">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Aucun compte créé sans ta validation. Données utilisées pour le partenariat uniquement.
                  </p>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <Footer />
    </main>
  )
}

function Field({
  label, icon: Icon, error, textarea, children,
}: {
  label: string; icon: React.ElementType; error?: string; textarea?: boolean; children: React.ReactNode
}) {
  return (
    <div>
      <label className="block font-body text-xs font-medium text-white/60 mb-1.5">{label}</label>
      <div className="relative">
        <Icon className={`absolute left-3.5 w-4 h-4 text-white/25 pointer-events-none ${textarea ? 'top-3.5' : 'top-1/2 -translate-y-1/2'}`} />
        {children}
      </div>
      {error && <p className="font-body text-xs text-rose-400 mt-1">{error}</p>}
    </div>
  )
}

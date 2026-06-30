'use client'

/**
 * MerciClient — retour après paiement (/checkout → return_url).
 * Téléchargement INTELLIGENT : détecte l'OS et envoie au bon store via /go
 * (iOS → App Store, Android → Play Store, desktop → /go/desktop QR).
 * Langage visuel aligné checkout/tarifs2 : obsidian + halo + glass + InkGradientButton + Genos.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { InkGradientButton } from '@/components/ui'
import { Check, ShieldCheck, Smartphone, Mail } from 'lucide-react'

type OS = 'ios' | 'android' | 'other'

// ⚠️ Passer à true quand l'app iPhone est PUBLIÉE sur l'App Store (+ remplir le vrai App ID dans /go).
const IOS_LIVE = false

export default function MerciClient() {
  const [os, setOs] = useState<OS>('other')

  useEffect(() => {
    const ua = navigator.userAgent || ''
    if (/iPhone|iPad|iPod/i.test(ua)) setOs('ios')
    else if (/Android/i.test(ua)) setOs('android')
    else setOs('other')
  }, [])

  const label =
    os === 'ios' ? 'Télécharger sur l’App Store'
    : os === 'android' ? 'Télécharger sur Google Play'
    : 'Télécharger l’app FOREAS'

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden bg-foreas-obsidian text-[#F8FAFC]">
      {/* halo + micro-grain (comme checkout/tarifs2) */}
      <div aria-hidden className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 animate-halo-pulse"
          style={{
            background:
              'radial-gradient(ellipse 55% 45% at 50% 8%, rgba(16,185,129,0.16) 0%, transparent 70%),' +
              'radial-gradient(ellipse 50% 42% at 20% 20%, rgba(140,82,255,0.16) 0%, transparent 72%),' +
              'radial-gradient(ellipse 50% 42% at 82% 22%, rgba(0,212,255,0.10) 0%, transparent 72%)',
          }}
        />
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(255,255,255,0.012)' }} />
      </div>

      {/* wordmark Genos */}
      <header className="relative z-10 mx-auto max-w-2xl px-5 pt-7">
        <Link href="/" aria-label="FOREAS — Accueil" className="font-title text-2xl font-semibold tracking-wider text-[#F8FAFC]">
          FOREAS
        </Link>
      </header>

      <section className="relative z-10 mx-auto max-w-md px-5 py-10 sm:py-14 text-center">
        {/* check de succès */}
        <div
          className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl text-white"
          style={{ background: 'linear-gradient(135deg,#10B981,#0E9F6E)', boxShadow: '0 14px 44px -10px rgba(16,185,129,0.55)' }}
        >
          <Check size={30} strokeWidth={3} />
        </div>

        <h1 className="text-[30px] sm:text-[34px] font-extrabold leading-[1.05] text-[#F8FAFC]" style={{ letterSpacing: '-0.035em' }}>
          Bienvenue à bord. 🎉
        </h1>
        <p className="mt-3 text-[15.5px] leading-relaxed text-white/72">
          Ton abonnement <strong className="text-[#F8FAFC]">FOREAS Pro</strong> est actif. Ajnaya t’attend dans l’app —
          installe-la et lance ta première journée.
        </p>

        {/* téléchargement intelligent */}
        <div className="mt-7">
          {os === 'ios' && !IOS_LIVE ? (
            // iPhone pas encore publié → pas de lien mort, on rassure
            <div className="rounded-2xl px-5 py-4 text-left" style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.25)' }}>
              <p className="text-[14.5px] font-semibold text-[#F8FAFC]">L’app iPhone arrive très bientôt 🍏</p>
              <p className="mt-1 text-[13px] leading-relaxed text-white/65">Elle est en validation App Store. On t’envoie le lien par email dès qu’elle est dispo — ton accès Pro t’attend.</p>
            </div>
          ) : (
            <>
              <InkGradientButton as="link" href="/go" variant="violet" size="lg" className="w-full">
                <span className="inline-flex items-center justify-center gap-2">
                  <Smartphone size={18} /> {label}
                </span>
              </InkGradientButton>
              <p className="mt-3 text-[12.5px] text-white/45">
                {os === 'other'
                  ? 'Ouvre cette page sur ton téléphone, ou scanne le QR sur l’écran suivant.'
                  : 'Le bon store s’ouvre tout seul selon ton téléphone.'}
              </p>
            </>
          )}
        </div>

        {/* rassurance : email + garantie */}
        <div className="mt-8 space-y-2.5 text-left">
          <div className="flex items-start gap-2.5 rounded-2xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <Mail size={16} className="mt-0.5 text-[#00D4FF]" />
            <p className="text-[13px] leading-relaxed text-white/70">Un <strong className="text-white/90">email de confirmation</strong> arrive avec ton reçu et le lien de connexion.</p>
          </div>
          <div className="flex items-start gap-2.5 rounded-2xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <ShieldCheck size={16} className="mt-0.5 text-[#10B981]" />
            <p className="text-[13px] leading-relaxed text-white/70"><strong className="text-white/90">Garantie 30 jours.</strong> Pas convaincu, tu te fais rembourser sans discuter. Tu risques zéro.</p>
          </div>
        </div>

        <Link href="/" className="mt-7 inline-block text-[13px] text-[#00D4FF]/85 hover:text-[#00D4FF]">Retour à l’accueil</Link>
      </section>
    </main>
  )
}

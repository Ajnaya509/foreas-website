import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'FOREAS — Bienvenue à bord',
  robots: { index: false, follow: false },
}

/**
 * Page de retour après paiement du checkout sur-mesure (/checkout → return_url).
 * Le paiement est confirmé par Stripe avant la redirection ici. Message d'accueil + app.
 */
export default function MerciPage() {
  return (
    <main style={{ background: '#050508', color: 'rgba(248,250,252,0.82)' }} className="min-h-screen w-full flex items-center justify-center px-5">
      <div aria-hidden className="pointer-events-none fixed inset-0" style={{ background: 'radial-gradient(60% 45% at 50% 30%, rgba(16,185,129,0.16), transparent 70%)' }} />
      <div className="relative z-10 max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl text-white" style={{ background: 'linear-gradient(135deg,#10B981,#0E9F6E)', boxShadow: '0 12px 40px -10px rgba(16,185,129,0.5)' }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
        </div>
        <h1 className="text-[30px] font-extrabold tracking-tight" style={{ color: '#F8FAFC' }}>Bienvenue à bord. 🎉</h1>
        <p className="mt-3 text-[16px] leading-relaxed">
          Ton abonnement <strong style={{ color: '#F8FAFC' }}>FOREAS Pro</strong> est actif. Ajnaya t&apos;attend dans l&apos;app — installe-la et lance ta première journée.
        </p>
        <p className="mt-3 text-[13px]" style={{ color: 'rgba(248,250,252,0.55)' }}>
          Garantie 30 jours : pas convaincu, tu te fais rembourser sans discuter. Tu risques zéro.
        </p>
        <div className="mt-7 flex flex-col gap-3">
          <Link href="/download" className="inline-flex items-center justify-center gap-2 w-full px-6 py-4 rounded-2xl font-extrabold text-white" style={{ background: 'linear-gradient(135deg,#8C52FF,#6C3CE0)', boxShadow: '0 10px 34px -8px rgba(140,82,255,0.5)' }}>
            Télécharger l&apos;app FOREAS
          </Link>
          <Link href="/" className="text-[13px]" style={{ color: 'rgba(0,212,255,0.85)' }}>Retour à l&apos;accueil</Link>
        </div>
      </div>
    </main>
  )
}

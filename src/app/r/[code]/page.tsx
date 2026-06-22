import Link from 'next/link'
import type { Metadata } from 'next'
import { supabase } from '@/lib/supabase'

export const metadata: Metadata = {
  title: "Ton parrain t'offre une remise — FOREAS",
  // Lien de parrainage personnel → jamais indexé.
  robots: { index: false, follow: false },
}

/**
 * /r/<code> — landing parrainage (Referral V3).
 * Le cookie `foreas_partner_ref` est posé par le middleware (attribution MLM + remise checkout).
 * Ici on RÉSOUT la remise (fonction SQL, GRANT anon) juste pour l'afficher.
 */
export default async function ReferralLanding({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code: raw } = await params
  const code = (raw || '').trim().toUpperCase().slice(0, 32)

  let discount = 0
  try {
    const { data } = await supabase.rpc('get_referral_discount_for_code', { p_code: code })
    discount = typeof data === 'number' ? data : 0
  } catch {
    // Code inconnu ou DB indispo → 0 : on affiche un accueil générique, jamais d'erreur.
  }
  const hasDiscount = discount > 0

  return (
    <main
      className="min-h-screen flex items-center justify-center px-5 py-16"
      style={{ backgroundColor: 'var(--bg-cream-warm)' }}
    >
      <div className="w-full max-w-md text-center">
        <p
          className="t-eyebrow mb-5"
          style={{ color: '#6C3CE0', letterSpacing: '0.22em' }}
        >
          Parrainage FOREAS
        </p>

        <h1
          className="font-semibold leading-[1.02] mb-4"
          style={{
            fontFamily: 'var(--font-genos), system-ui, sans-serif',
            letterSpacing: '-0.03em',
            color: '#1d1d1f',
            fontSize: 'clamp(2rem, 8vw, 3.25rem)',
          }}
        >
          {hasDiscount ? (
            <>
              Ton parrain t&apos;offre{' '}
              <span style={{ color: '#8C52FF' }} className="tabular-nums">
                −{discount}%
              </span>{' '}
              sur ton abonnement.
            </>
          ) : (
            <>Bienvenue chez FOREAS.</>
          )}
        </h1>

        <p className="t-bodylg mb-9 mx-auto max-w-sm" style={{ color: '#6e6e73' }}>
          Ajnaya, l&apos;IA des chauffeurs VTC, te dit où aller pour gagner plus en roulant moins.
          {hasDiscount
            ? ' Ta remise est déjà gardée — elle s’applique quand tu prends ton abonnement.'
            : ' Rejoins-nous et vois combien ça paie ce soir.'}
        </p>

        <div className="flex flex-col gap-3 max-w-xs mx-auto">
          <Link
            href="/download"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-[15px] font-semibold text-white transition-all hover:opacity-90 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #8C52FF, #6C3CE0)',
              boxShadow: '0 8px 24px -8px rgba(140,82,255,0.5)',
            }}
          >
            Télécharger l&apos;app FOREAS
          </Link>
          <Link
            href="/tarifs2"
            className="inline-flex items-center justify-center px-6 py-3 rounded-full text-sm font-medium transition-colors hover:bg-black/[0.04]"
            style={{ color: '#1d1d1f', border: '1px solid rgba(0,0,0,0.10)' }}
          >
            {hasDiscount ? `Voir les offres −${discount}%` : 'Voir les offres'}
          </Link>
        </div>
      </div>
    </main>
  )
}

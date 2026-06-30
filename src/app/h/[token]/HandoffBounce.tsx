'use client'

/**
 * HandoffBounce — page REBOND (mail → ouvre l'app).
 * Brief : FOREAS-SHARED/briefs/AJNAYA_PAGE_REBOND_HANDOFF_SITE.md
 *
 * Elle ne fait QUE rebondir : window.location → foreas://ajnaya?handoff=<token>.
 * C'est l'APP qui résout le token (identité + contexte). Si l'app n'est pas installée
 * (pas de bascule après ~1,8 s) → fallback : réessayer + télécharger (store OS-aware /go) + web.
 * 0 PII en URL (token opaque), noindex. Charte design-system (obsidian + halo + Genos).
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, Smartphone, ArrowRight, RotateCw } from 'lucide-react'

export default function HandoffBounce({ token }: { token: string }) {
  const [showFallback, setShowFallback] = useState(false)

  const openApp = () => {
    window.location.href = `foreas://ajnaya?handoff=${encodeURIComponent(token)}`
  }

  useEffect(() => {
    const t = setTimeout(() => setShowFallback(true), 1800) // app pas installée → fallback
    // si la page passe en arrière-plan = l'app s'est ouverte → on annule le fallback
    const onVis = () => { if (document.hidden) clearTimeout(t) }
    document.addEventListener('visibilitychange', onVis)
    openApp()
    return () => { clearTimeout(t); document.removeEventListener('visibilitychange', onVis) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-foreas-obsidian text-[#F8FAFC] flex items-center justify-center px-5">
      {/* halo + micro-grain */}
      <div aria-hidden className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 animate-halo-pulse"
          style={{
            background:
              'radial-gradient(ellipse 55% 45% at 50% 18%, rgba(140,82,255,0.20) 0%, transparent 70%),' +
              'radial-gradient(ellipse 45% 40% at 80% 22%, rgba(0,212,255,0.12) 0%, transparent 72%)',
          }}
        />
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(255,255,255,0.012)' }} />
      </div>

      <div className="relative z-10 w-full max-w-sm text-center">
        <p className="font-title text-2xl font-semibold tracking-wider text-[#F8FAFC]">FOREAS</p>

        {!showFallback ? (
          <div className="mt-8">
            <Loader2 size={26} className="mx-auto animate-spin text-[#8C52FF]" />
            <p className="mt-4 text-[15px] text-white/72">On te rouvre FOREAS…</p>
          </div>
        ) : (
          <div className="mt-7">
            <p className="text-[15.5px] leading-relaxed text-white/72">
              On t’ouvre l’app FOREAS. Si rien ne se passe :
            </p>

            <button
              onClick={openApp}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 font-extrabold text-[15px] text-white transition-transform hover:scale-[1.02] active:scale-[0.99]"
              style={{ background: 'linear-gradient(135deg,#8C52FF,#6C3CE0)', boxShadow: '0 10px 34px -8px rgba(140,82,255,0.5)' }}
            >
              <RotateCw size={17} /> Ouvrir dans l’app FOREAS
            </button>

            <Link
              href="/go"
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-[14px] font-semibold text-[#F8FAFC]"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              <Smartphone size={16} /> Télécharger l’app
            </Link>

            <Link href="/reactivation" className="mt-4 inline-flex items-center justify-center gap-1 text-[13px] text-[#00D4FF]/85 hover:text-[#00D4FF]">
              Continuer sur le web <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}

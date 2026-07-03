'use client'

/**
 * DriverReviewsClient — affiche les vrais avis (fetch de /api/reviews/public?slug=).
 * Pattern client (comme /h/[token]) : la page reste une coquille triviale, la donnée vient de l'endpoint.
 * Brief : FOREAS-SHARED/briefs/AJNAYA_AFFICHAGE_AVIS_SITE.md — note ≥ 4/publié, prénom seul, 0 faux avis.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Star, BadgeCheck, MessageSquare, Loader2 } from 'lucide-react'

interface Review { rating: number; first_name: string | null; comment: string | null; created_at: string }
interface Data { reviews: Review[]; average: number | null; count: number }

function timeAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (days <= 0) return "aujourd'hui"
  if (days === 1) return 'hier'
  if (days < 7) return `il y a ${days} jours`
  if (days < 31) { const w = Math.floor(days / 7); return `il y a ${w} semaine${w > 1 ? 's' : ''}` }
  if (days < 365) { const m = Math.floor(days / 30); return `il y a ${m} mois` }
  const y = Math.floor(days / 365); return `il y a ${y} an${y > 1 ? 's' : ''}`
}

function Stars({ value, size = 15 }: { value: number; size?: number }) {
  const full = Math.round(value)
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} sur 5`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Star key={i} size={size} strokeWidth={0} fill={i < full ? '#F5C842' : 'rgba(255,255,255,0.18)'} />
      ))}
    </span>
  )
}

export default function DriverReviewsClient({ slug }: { slug: string }) {
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/reviews/public?slug=${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((d: Data) => { if (!cancelled) { setData(d); setLoading(false) } })
      .catch(() => { if (!cancelled) { setData({ reviews: [], average: null, count: 0 }); setLoading(false) } })
    return () => { cancelled = true }
  }, [slug])

  const count = data?.count ?? 0
  const average = data?.average ?? null
  const reviews = data?.reviews ?? []

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden bg-foreas-obsidian text-[#F8FAFC]">
      <div aria-hidden className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 animate-halo-pulse"
          style={{
            background:
              'radial-gradient(ellipse 55% 45% at 50% 8%, rgba(140,82,255,0.18) 0%, transparent 70%),' +
              'radial-gradient(ellipse 45% 40% at 82% 16%, rgba(0,212,255,0.10) 0%, transparent 72%)',
          }}
        />
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(255,255,255,0.012)' }} />
      </div>

      <header className="relative z-10 mx-auto max-w-xl px-5 pt-7">
        <Link href="/" aria-label="FOREAS — Accueil" className="font-title text-2xl font-semibold tracking-wider text-[#F8FAFC]">
          FOREAS
        </Link>
      </header>

      <section className="relative z-10 mx-auto max-w-xl px-5 py-9">
        <p className="text-[#00D4FF] text-[10px] font-extrabold uppercase mb-3" style={{ letterSpacing: '0.25em' }}>
          Avis clients · courses réelles
        </p>

        {loading ? (
          <div className="py-16 text-center"><Loader2 size={24} className="mx-auto animate-spin text-[#8C52FF]" /></div>
        ) : count > 0 && average !== null ? (
          <>
            <div className="flex items-end gap-4">
              <div>
                <div className="text-[46px] font-extrabold leading-none tabular-nums text-[#F8FAFC]" style={{ letterSpacing: '-0.03em' }}>
                  {average.toFixed(1).replace('.', ',')}
                </div>
                <div className="mt-2"><Stars value={average} size={17} /></div>
              </div>
              <div className="pb-1">
                <p className="text-[15px] text-white/72 tabular-nums">{count} avis</p>
                <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: 'rgba(245,200,66,0.10)', border: '1px solid rgba(245,200,66,0.30)', color: '#F5C842' }}>
                  <BadgeCheck size={13} /> Avis vérifiés
                </span>
              </div>
            </div>
            <p className="mt-3 text-[12.5px] text-white/45">Chaque avis provient d’une vraie course payée via FOREAS.</p>

            <ul className="mt-7 space-y-3.5">
              {reviews.map((r, i) => (
                <li key={i} className="rounded-2xl p-4 sm:p-5 backdrop-blur-sm" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[14px] font-semibold text-[#F8FAFC]">{r.first_name || 'Client'}</span>
                    <span className="text-[11.5px] text-white/40">{timeAgo(r.created_at)}</span>
                  </div>
                  <div className="mt-1.5"><Stars value={r.rating} /></div>
                  {r.comment && <p className="mt-2.5 text-[14px] leading-relaxed text-white/75">{r.comment}</p>}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="mt-4 rounded-2xl p-8 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <MessageSquare size={26} className="mx-auto text-white/35" />
            <p className="mt-4 text-[16px] font-semibold text-[#F8FAFC]">Pas encore d’avis</p>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-white/55">Les avis apparaîtront ici après les premières courses. Rien n’est inventé.</p>
          </div>
        )}

        <div className="mt-9 border-t border-white/[0.07] pt-5 text-center">
          <p className="text-[12px] text-white/40">Propulsé par <Link href="/" className="text-[#00D4FF]/85 hover:text-[#00D4FF]">FOREAS</Link></p>
        </div>
      </section>
    </main>
  )
}

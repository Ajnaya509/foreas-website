'use client'

import { usePathname } from 'next/navigation'

export default function GrainOverlay() {
  const pathname = usePathname()
  // Le cadre de compte porte déjà le grain exact du MASTER §8.2.
  if (['/abonnement', '/success', '/apercu-abonnement', '/apercu-succes'].includes(pathname)) return null
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[9999] pointer-events-none opacity-[0.055]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize: '256px 256px',
        mixBlendMode: 'overlay',
      }}
    />
  )
}

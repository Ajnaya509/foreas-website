'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

/* ─── Sidebar Navigation Items ─────────────────────────────────── */
const DRIVER_NAV = [
  { href: '/509/dashboard/driver', label: 'Performance', icon: 'chart' },
  { href: '/509/dashboard/driver/finances', label: 'Finances', icon: 'wallet' },
  { href: '/509/dashboard/driver/analytics', label: 'Analytics', icon: 'analytics' },
  { href: '/509/dashboard/driver/abonnement', label: 'Abonnement', icon: 'card' },
]

const PARTNER_NAV = [
  { href: '/509/dashboard/partner', label: 'Ma flotte', icon: 'fleet' },
  { href: '/509/dashboard/partner/annonces', label: 'Annonces', icon: 'megaphone' },
  { href: '/509/dashboard/partner/recrutement', label: 'Recrutement', icon: 'users' },
  { href: '/509/dashboard/partner/facturation', label: 'Facturation', icon: 'invoice' },
]

const ADMIN_NAV = [
  { href: '/509/dashboard/admin', label: 'Vue globale', icon: 'chart' },
  { href: '/509/dashboard/admin/chauffeurs', label: 'Chauffeurs', icon: 'users' },
  { href: '/509/dashboard/admin/partenaires', label: 'Partenaires', icon: 'fleet' },
  { href: '/509/dashboard/admin/permissions', label: 'Accès & Permissions', icon: 'shield' },
]

/* ─── Icon Components ──────────────────────────────────────────── */
function NavIcon({ icon, className }: { icon: string; className?: string }) {
  const c = className || 'w-5 h-5'
  switch (icon) {
    case 'chart':
      return <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13h2v8H3v-8zm4-6h2v14H7V7zm4-4h2v18h-2V3zm4 8h2v10h-2V11zm4-3h2v13h-2V8z" /></svg>
    case 'wallet':
      return <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2v-5zm-6 1a1 1 0 100-2 1 1 0 000 2z" /></svg>
    case 'analytics':
      return <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6m6 0h6m-6 0V9a2 2 0 012-2h2a2 2 0 012 2v10m6 0v-4a2 2 0 00-2-2h-2a2 2 0 00-2 2v4" /></svg>
    case 'card':
      return <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
    case 'fleet':
      return <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
    case 'megaphone':
      return <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
    case 'users':
      return <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
    case 'invoice':
      return <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" /></svg>
    case 'shield':
      return <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
    default:
      return null
  }
}

/* ─── Gradient Line Separator ──────────────────────────────────── */
function GradientLine() {
  return (
    <div className="w-full h-px relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent-purple/40 to-accent-cyan/40" />
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdmin = pathname.startsWith('/509/dashboard/admin')
  const isPartner = pathname.startsWith('/509/dashboard/partner')
  const isLogin = pathname === '/509/dashboard/login' || pathname === '/509/dashboard'
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Login page — no sidebar
  if (isLogin) {
    return <>{children}</>
  }

  const navItems = isAdmin ? ADMIN_NAV : isPartner ? PARTNER_NAV : DRIVER_NAV
  const roleLabel = isAdmin ? 'Admin' : isPartner ? 'Partenaire' : 'Chauffeur'
  const roleColor = isAdmin ? 'text-red-400' : isPartner ? 'text-accent-purple' : 'text-accent-cyan'
  const roleDot = isAdmin ? 'bg-red-400' : isPartner ? 'bg-accent-purple' : 'bg-accent-cyan'

  return (
    <div className="min-h-screen bg-[#050508] flex">
      {/* ═══ Ambient Background ═══ */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[40%] -left-[20%] w-[60%] h-[60%] bg-accent-purple/[0.03] rounded-full blur-[150px]" />
        <div className="absolute -bottom-[30%] -right-[15%] w-[50%] h-[50%] bg-accent-cyan/[0.02] rounded-full blur-[150px]" />
      </div>

      {/* ═══ SIDEBAR ═══ */}
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-[260px] bg-[#08080f]/95 backdrop-blur-xl border-r border-white/[0.06] flex flex-col transform transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Brand */}
        <div className="px-5 pt-6 pb-5">
          <Link href="/509" className="flex items-center gap-2.5 group">
            <Image
              src="/assets/logo-mini-blanc.svg"
              alt="FOREAS"
              width={36}
              height={36}
              className="opacity-90 group-hover:opacity-100 transition-opacity"
            />
          </Link>
          <div className="mt-4 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${roleDot} shadow-[0_0_6px_1px] ${isAdmin ? 'shadow-red-400/40' : isPartner ? 'shadow-accent-purple/40' : 'shadow-accent-cyan/40'}`} />
            <span className={`${roleColor} text-[11px] font-semibold uppercase tracking-[0.15em]`}>{roleLabel}</span>
          </div>
        </div>

        <GradientLine />

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                  isActive
                    ? 'text-white'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                {/* Active background glow */}
                {isActive && (
                  <>
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-accent-cyan/10 via-accent-cyan/[0.06] to-transparent" />
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-accent-cyan shadow-[0_0_8px_2px] shadow-accent-cyan/30" />
                  </>
                )}
                <NavIcon icon={item.icon} className={`w-[18px] h-[18px] relative z-10 transition-colors ${isActive ? 'text-accent-cyan' : 'text-white/30 group-hover:text-white/60'}`} />
                <span className="relative z-10">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <GradientLine />

        {/* User / Logout */}
        <div className="px-4 py-5">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-purple/30 to-accent-cyan/30 border border-white/[0.08] flex items-center justify-center">
              <span className="text-white/80 text-xs font-bold">B</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/90 text-sm font-medium truncate">Binate</p>
              <p className="text-white/25 text-[11px] truncate">Paris • en ligne</p>
            </div>
          </div>
          <Link
            href="/509/dashboard/login"
            className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg text-white/25 hover:text-white/50 hover:bg-white/[0.03] transition-all text-xs"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Déconnexion
          </Link>
        </div>
      </aside>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="flex-1 flex flex-col min-h-screen relative z-10">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-30 bg-[#050508]/80 backdrop-blur-xl border-b border-white/[0.06] px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-white/[0.05] transition-colors"
            aria-label="Ouvrir le menu"
          >
            <svg className="w-5 h-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Image
            src="/assets/logo-mini-blanc.svg"
            alt="FOREAS"
            width={28}
            height={28}
            className="opacity-80"
          />
          <div className="w-9" />
        </header>

        {/* Page content */}
        <main className="flex-1 p-5 md:p-8 lg:p-10">
          {children}
        </main>
      </div>
    </div>
  )
}

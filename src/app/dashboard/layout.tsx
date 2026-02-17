'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

/* ─── Sidebar Navigation Items ─────────────────────────────────── */
const DRIVER_NAV = [
  { href: '/dashboard/driver', label: 'Performance', icon: 'chart' },
  { href: '/dashboard/driver/finances', label: 'Finances', icon: 'wallet' },
  { href: '/dashboard/driver/analytics', label: 'Analytics', icon: 'analytics' },
  { href: '/dashboard/driver/abonnement', label: 'Abonnement', icon: 'card' },
]

const PARTNER_NAV = [
  { href: '/dashboard/partner', label: 'Ma flotte', icon: 'fleet' },
  { href: '/dashboard/partner/annonces', label: 'Annonces', icon: 'megaphone' },
  { href: '/dashboard/partner/recrutement', label: 'Recrutement', icon: 'users' },
  { href: '/dashboard/partner/facturation', label: 'Facturation', icon: 'invoice' },
]

const ADMIN_NAV = [
  { href: '/dashboard/admin', label: 'Vue globale', icon: 'chart' },
  { href: '/dashboard/admin/chauffeurs', label: 'Chauffeurs', icon: 'users' },
  { href: '/dashboard/admin/partenaires', label: 'Partenaires', icon: 'fleet' },
  { href: '/dashboard/admin/permissions', label: 'Accès & Permissions', icon: 'shield' },
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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdmin = pathname.startsWith('/dashboard/admin')
  const isPartner = pathname.startsWith('/dashboard/partner')
  const isLogin = pathname === '/dashboard/login' || pathname === '/dashboard'
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Login page — no sidebar
  if (isLogin) {
    return <>{children}</>
  }

  const navItems = isAdmin ? ADMIN_NAV : isPartner ? PARTNER_NAV : DRIVER_NAV
  const roleLabel = isAdmin ? 'Admin' : isPartner ? 'Partenaire' : 'Chauffeur'

  return (
    <div className="min-h-screen bg-[#050508] flex">
      {/* ═══ SIDEBAR ═══ */}
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#0a0a12] border-r border-white/[0.06] flex flex-col transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Brand */}
        <div className="px-6 py-6 border-b border-white/[0.06]">
          <Link href="/509" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-purple to-accent-cyan flex items-center justify-center">
              <span className="text-white font-bold text-sm">F</span>
            </div>
            <span className="font-title text-xl text-white tracking-tight">FOREAS</span>
          </Link>
          <div className="mt-3 inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.08]">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan" />
            <span className="text-white/50 text-xs font-medium">{roleLabel}</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20'
                    : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04]'
                }`}
              >
                <NavIcon icon={item.icon} className={`w-5 h-5 ${isActive ? 'text-accent-cyan' : ''}`} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User / Logout */}
        <div className="px-4 py-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-purple/50 to-accent-cyan/50 flex items-center justify-center">
              <span className="text-white text-xs font-bold">B</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">Binate</p>
              <p className="text-white/30 text-xs truncate">Paris</p>
            </div>
          </div>
          <Link
            href="/dashboard/login"
            className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-all text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Déconnexion
          </Link>
        </div>
      </aside>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-30 bg-[#050508]/90 backdrop-blur-lg border-b border-white/[0.06] px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-white/[0.05]"
            aria-label="Ouvrir le menu"
          >
            <svg className="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-title text-lg text-white">FOREAS</span>
          <div className="w-9" />
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

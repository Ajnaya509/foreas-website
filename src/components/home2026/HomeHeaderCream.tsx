'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, MessageCircle } from 'lucide-react'
import { buildWAUrl } from '@/lib/whatsappLink'

/**
 * HomeHeaderCream — header de la nouvelle home `/` chauffeur
 *
 * Spec :
 * - Background : transparent au top, glass crème quand on scroll (>50px)
 * - Logo "FOREAS/" gradient signature 3-stops (cohérence brand)
 * - Lien `Pro` discret → /professionnels (B2B audience)
 * - Bouton "Connexion" → /dashboard/driver (chauffeurs déjà inscrits)
 * - Bouton "Souscrire" → wa.me Ajnaya direct (le clic ouvre WhatsApp,
 *   pas une page tarifs — Ajnaya guide vers paiement dans la conv)
 *
 * Responsive : burger mobile, layout horizontal desktop ≥768px
 *
 * Skill foreas-design-system :
 * - Variant CRÈME (rupture délibérée)
 * - text-cream-fg ivoire foncé
 * - Glass scroll : backdrop-blur + bg-cream-warm/85
 * - Bouton Souscrire = green-600 (couleur WhatsApp signature)
 */
export default function HomeHeaderCream() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const subscribeUrl = buildWAUrl({ section: 'final' })

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ease-out ${
        scrolled || mobileOpen
          ? 'backdrop-blur-md border-b'
          : 'border-b border-transparent'
      }`}
      style={{
        backgroundColor:
          scrolled || mobileOpen ? 'rgba(255, 255, 255, 0.92)' : 'transparent',
        borderColor: scrolled ? 'rgba(0, 0, 0, 0.08)' : 'transparent',
      }}
    >
      <nav
        className="mx-auto max-w-7xl px-5 lg:px-8"
        aria-label="Navigation principale"
      >
        <div className="flex items-center justify-between h-16 lg:h-18">
          {/* ── Logo ───────────────────────────────────────────────────── */}
          <Link
            href="/"
            className="flex items-center group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded-md"
            aria-label="FOREAS — Retour à l'accueil"
          >
            <span
              className="text-2xl lg:text-[26px] font-semibold tracking-wider"
              style={{
                fontFamily: 'var(--font-genos, "Genos"), system-ui, sans-serif',
                color: 'var(--text-cream-fg)',
              }}
            >
              FOREAS
              <span
                className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 bg-clip-text text-transparent group-hover:opacity-80 transition-opacity duration-200"
              >
                /
              </span>
            </span>
          </Link>

          {/* ── Desktop nav ────────────────────────────────────────────── */}
          <div className="hidden md:flex md:items-center md:gap-2">
            <Link
              href="/professionnels"
              className="px-3 py-2 text-[13px] font-medium transition-colors hover:underline underline-offset-4"
              style={{ color: 'var(--text-cream-fg-soft)' }}
            >
              Pro
            </Link>
            <Link
              href="/dashboard/driver"
              className="px-3 py-2 text-[13px] font-medium transition-colors hover:underline underline-offset-4"
              style={{ color: 'var(--text-cream-fg-soft)' }}
            >
              Connexion
            </Link>
            {/* Souscrire — outlined vert (moins agressif sur le crème) + sub "Sans CB" */}
            <div className="ml-2 flex flex-col items-end">
              <a
                href={subscribeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold transition-all hover:bg-green-600 hover:text-white hover:border-green-600"
                style={{
                  color: '#16a34a',
                  border: '1.5px solid #16a34a',
                  backgroundColor: 'rgba(22, 163, 74, 0.04)',
                }}
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Souscrire
              </a>
              <span
                className="text-[9px] font-semibold uppercase mt-0.5 tabular-nums"
                style={{
                  letterSpacing: '0.18em',
                  color: 'var(--text-cream-fg-muted)',
                }}
              >
                Sans CB · 7 j offerts
              </span>
            </div>
          </div>

          {/* ── Mobile burger ──────────────────────────────────────────── */}
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            className="md:hidden p-2 rounded-full transition-colors hover:bg-black/[0.05]"
            aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={mobileOpen}
            style={{ color: 'var(--text-cream-fg)' }}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* ── Mobile menu ──────────────────────────────────────────────── */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="md:hidden overflow-hidden border-t"
              style={{ borderColor: 'rgba(0, 0, 0, 0.08)' }}
            >
              <div className="py-5 flex flex-col gap-2">
                <Link
                  href="/professionnels"
                  onClick={() => setMobileOpen(false)}
                  className="px-2 py-3 text-base font-medium hover:underline underline-offset-4"
                  style={{ color: 'var(--text-cream-fg-soft)' }}
                >
                  Pro
                </Link>
                <Link
                  href="/dashboard/driver"
                  onClick={() => setMobileOpen(false)}
                  className="px-2 py-3 text-base font-medium hover:underline underline-offset-4"
                  style={{ color: 'var(--text-cream-fg-soft)' }}
                >
                  Connexion
                </Link>
                <a
                  href={subscribeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileOpen(false)}
                  className="mt-2 inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-full bg-green-600 text-white text-sm font-semibold"
                  style={{ boxShadow: '0 6px 18px -4px rgba(16,185,129,0.45)' }}
                >
                  <MessageCircle className="w-4 h-4" />
                  Souscrire — discuter avec Ajnaya
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  )
}

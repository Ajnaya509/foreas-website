'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, MessageCircle, ArrowRight } from 'lucide-react'
import { buildWAUrl } from '@/lib/whatsappLink'
import { useOverlayLock } from '@/lib/overlayStore'
import { authUrls } from '@/lib/auth-urls'
import { useLienOffre } from '@/hooks/useLienOffre'
import { ESSAI_JOURS } from '@/lib/offre'
import { mesurer } from '@/lib/mesure'

/**
 * HomeHeaderCream — header blanc Apple absolu (Site2026v72)
 *
 * Refonte +100/100 :
 * - Logo "/" en violet pur #6C3CE0 (un seul ton — plus de gradient candy)
 * - Liens Pro / Connexion en noir Apple #1d1d1f
 * - Action principale = « Essayer » vers /tarifs2, la page où l'on paie.
 *
 *   ⚠️ 21/08/2026 — AVANT, CE BOUTON MENAIT À WHATSAPP. Il s'appelait
 *   « Souscrire » et ouvrait une conversation. Mesuré sur le HTML servi de
 *   l'accueil : zéro lien vers /tarifs2, six liens WhatsApp. Depuis la porte
 *   d'entrée du site, la page de paiement était inatteignable autrement qu'en
 *   tapant l'adresse à la main.
 *
 *   WhatsApp n'est pas retiré : il descend en action secondaire. Et la durée
 *   d'essai vient désormais de offre.ts — l'ancien commentaire ici annonçait
 *   « 7 j offerts » alors que la source unique dit trois.
 * - Au scroll : background blanc Apple `rgba(255,255,255,0.92)` + blur
 */
export default function HomeHeaderCream() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  useOverlayLock(mobileOpen)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // L'action principale mène à l'offre. WhatsApp reste, en second.
  const urlOffre = useLienOffre('general')
  const urlWhatsApp = buildWAUrl({ section: 'final' })

  function clicPrincipal(emplacement: string) {
    mesurer('PrimaryCTAClick', {
      page: '/',
      intention: 'general',
      audience: 'chauffeur',
      promesse: 'Essayer ' + ESSAI_JOURS + ' jours',
      detail: { emplacement, destination: '/tarifs2' },
    })
  }

  function clicWhatsApp(emplacement: string) {
    mesurer('WhatsAppClick', {
      page: '/',
      intention: 'general',
      audience: 'chauffeur',
      detail: { emplacement },
    })
  }

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
          {/* ── Logo — violet pur, plus de gradient candy ─────────────────── */}
          <Link
            href="/"
            className="flex items-center group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded-md"
            aria-label="FOREAS — Retour à l'accueil"
          >
            <span
              className="text-2xl lg:text-[26px] font-semibold tracking-wider"
              style={{
                fontFamily: 'var(--font-genos, "Genos"), system-ui, sans-serif',
                color: '#1d1d1f',
              }}
            >
              FOREAS
              <span
                className="transition-opacity duration-200 group-hover:opacity-70"
                style={{ color: '#6C3CE0' }}
              >
                /
              </span>
            </span>
          </Link>

          {/* ── Desktop nav ────────────────────────────────────────────── */}
          <div className="hidden md:flex md:items-center md:gap-1">
            <Link
              href="/professionnels"
              className="px-3 py-2 text-[13px] font-medium transition-colors hover:underline underline-offset-4"
              style={{ color: '#1d1d1f' }}
            >
              Pro
            </Link>
            <a
              href={authUrls.loginDriver}
              className="px-3 py-2 text-[13px] font-medium transition-colors hover:underline underline-offset-4"
              style={{ color: '#1d1d1f' }}
            >
              Connexion
            </a>
            {/* Souscrire — noir Apple solide */}
            <div className="ml-3 flex flex-col items-end">
              <Link
                href={urlOffre}
                onClick={() => clicPrincipal('header-bureau')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-semibold transition-all hover:opacity-90 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #8C52FF, #6C3CE0)',
                  color: '#ffffff',
                  boxShadow: '0 6px 20px -6px rgba(140,82,255,0.5)',
                }}
              >
                Essayer
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <span
                className="text-[9px] font-semibold uppercase mt-1 tabular-nums"
                style={{
                  letterSpacing: '0.18em',
                  color: '#86868b',
                }}
              >
                {ESSAI_JOURS} jours d&apos;essai · 0 € débité
              </span>
            </div>
          </div>

          {/* ── Mobile burger ──────────────────────────────────────────── */}
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            className="md:hidden p-2 rounded-full transition-colors hover:bg-black/[0.05] active:scale-95"
            aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={mobileOpen}
            style={{ color: '#1d1d1f' }}
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
              <div className="py-5 flex flex-col gap-1">
                <Link
                  href="/professionnels"
                  onClick={() => setMobileOpen(false)}
                  className="px-2 py-3 text-base font-medium hover:underline underline-offset-4"
                  style={{ color: '#1d1d1f' }}
                >
                  Pro
                </Link>
                <a
                  href={authUrls.loginDriver}
                  onClick={() => setMobileOpen(false)}
                  className="px-2 py-3 text-base font-medium hover:underline underline-offset-4"
                  style={{ color: '#1d1d1f' }}
                >
                  Connexion
                </a>
                <Link
                  href={urlOffre}
                  onClick={() => { clicPrincipal('header-mobile'); setMobileOpen(false) }}
                  className="mt-3 inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-full text-white text-sm font-semibold active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #8C52FF, #6C3CE0)', boxShadow: '0 8px 24px -8px rgba(140,82,255,0.5)' }}
                >
                  Essayer {ESSAI_JOURS} jours
                  <ArrowRight className="w-4 h-4" />
                </Link>
                {/*
                  WhatsApp reste accessible — mais en second. Il aide à décider ;
                  il n'est plus la seule sortie du site.
                */}
                <a
                  href={urlWhatsApp}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => { clicWhatsApp('header-mobile'); setMobileOpen(false) }}
                  className="mt-2 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-full text-sm font-medium active:scale-95"
                  style={{ color: '#1d1d1f', border: '1px solid rgba(0,0,0,0.12)' }}
                >
                  <MessageCircle className="w-4 h-4" />
                  Poser une question à Ajnaya
                </a>
                <span
                  className="text-[10px] font-semibold uppercase mt-2 tabular-nums text-center"
                  style={{
                    letterSpacing: '0.18em',
                    color: '#86868b',
                  }}
                >
                  0 € débité aujourd&apos;hui
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  )
}

'use client'

import Link from 'next/link'

/**
 * Footer — Site2026v41
 *
 * Aligné design system v2 :
 * - Tokens v2 (foreas-navy, accent-cyan, accent-purple)
 * - Touch targets ≥ 44pt sur tous les liens
 * - Focus rings cyan 2px (WCAG AA)
 * - Mentions légales complètes (skill : conformité)
 */
const links = [
  { name: 'Chauffeurs', href: '/chauffeurs' },
  { name: 'Partenaires', href: '/partenaires' },
  { name: 'Technologie', href: '/technologie' },
  { name: 'À propos', href: '/a-propos' },
  { name: 'Contact', href: '/contact' },
]

const legal = [
  { name: 'CGU', href: '/cgu' },
  { name: 'Confidentialité', href: '/confidentialite' },
  { name: 'Mentions légales', href: '/mentions-legales' },
]

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-foreas-navy rounded-md'

export default function Footer() {
  return (
    <footer className="relative bg-foreas-navy border-t border-glass-border-soft" role="contentinfo">
      <div className="max-w-7xl mx-auto px-lg lg:px-xxxl">
        {/* Main */}
        <div className="py-huge md:py-massive">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-xxxl md:gap-huge">
            {/* Brand */}
            <div className="flex-shrink-0 flex flex-col items-center text-center">
              <Link href="/" className={`inline-block group min-h-[44px] px-sm ${focusRing}`} aria-label="FOREAS — Accueil">
                <span className="font-title text-h2 md:text-h1 font-bold tracking-wider text-text-primary">
                  FOREAS
                  <span className="bg-gradient-foreas-h bg-clip-text text-transparent group-hover:opacity-80 transition-opacity duration-fast">/</span>
                </span>
              </Link>
              <p className="tagline text-body text-text-tertiary mt-sm">
                Toujours plus loin.
              </p>
              {/* Barre dégradée cyan-violet-cyan (signature) */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/gradient-bar.svg"
                alt=""
                aria-hidden="true"
                className="w-[140px] md:w-[180px] h-[2px] object-cover mt-md opacity-60"
              />
            </div>

            {/* Liens primaires */}
            <nav aria-label="Navigation pied de page" className="flex flex-wrap justify-center md:justify-start gap-x-lg gap-y-md sm:gap-x-xxl md:gap-x-xxxl">
              {links.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`text-label text-text-tertiary hover:text-text-primary transition-colors duration-fast min-h-[44px] flex items-center px-xs ${focusRing}`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            {/* Réseaux sociaux */}
            <div className="flex items-center justify-center md:justify-start gap-md" aria-label="Réseaux sociaux">
              <a
                href="https://twitter.com/foreas_app"
                target="_blank"
                rel="noopener noreferrer"
                className={`w-11 h-11 rounded-full bg-foreas-navy-card border border-white/8 flex items-center justify-center text-text-tertiary hover:text-text-primary hover:border-white/16 hover:bg-foreas-navy-card/80 transition-all duration-fast ${focusRing}`}
                aria-label="Suivre FOREAS sur X (Twitter)"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a
                href="https://www.linkedin.com/company/foreas"
                target="_blank"
                rel="noopener noreferrer"
                className={`w-11 h-11 rounded-full bg-foreas-navy-card border border-white/8 flex items-center justify-center text-text-tertiary hover:text-text-primary hover:border-white/16 hover:bg-foreas-navy-card/80 transition-all duration-fast ${focusRing}`}
                aria-label="Suivre FOREAS sur LinkedIn"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="py-lg md:py-xl border-t border-white/8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-md">
            <p className="text-caption text-text-muted">
              © 2026 FOREAS Labs
            </p>
            <div className="flex items-center gap-md sm:gap-lg md:gap-xxl">
              {legal.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`text-caption text-text-muted hover:text-text-secondary transition-colors duration-fast min-h-[44px] flex items-center px-xs ${focusRing}`}
                >
                  {link.name}
                </Link>
              ))}
              <span className="text-caption text-text-muted">
                Paris
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

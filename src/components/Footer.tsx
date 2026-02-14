'use client'

import Link from 'next/link'

const links = [
  { name: 'Chauffeurs', href: '/chauffeurs' },
  { name: 'Entreprises', href: '/entreprises' },
  { name: 'Technologie', href: '/technologie' },
  { name: 'À propos', href: '/a-propos' },
  { name: 'Contact', href: '/contact' },
]

const legal = [
  { name: 'CGU', href: '/cgu' },
  { name: 'Confidentialité', href: '/confidentialite' },
]

export default function Footer() {
  return (
    <footer className="relative bg-[#050508] border-t border-white/[0.05]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Main */}
        <div className="py-12 md:py-16">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 md:gap-12">
            {/* Brand — toujours centré internement, bloc à gauche sur desktop */}
            <div className="flex-shrink-0 flex flex-col items-center text-center">
              <Link href="/" className="inline-block group">
                <span className="font-title text-xl md:text-2xl font-semibold tracking-wider text-white">
                  FOREAS
                  <span className="text-white group-hover:text-accent-purple transition-colors">/</span>
                </span>
              </Link>
              <p className="tagline text-sm md:text-base text-white/50 mt-2">
                Toujours plus loin.
              </p>
              {/* Barre dégradée cyan-violet-cyan (identique au preloader) */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/gradient-bar.svg"
                alt=""
                className="w-[140px] md:w-[180px] h-[2px] object-cover mt-3 opacity-60"
              />
            </div>

            {/* Links */}
            <div className="flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-3 sm:gap-x-6 md:gap-x-8">
              {links.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-sm text-white/50 hover:text-white transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Social */}
            <div className="flex items-center justify-center md:justify-start gap-3">
              {['twitter', 'linkedin'].map((social) => (
                <a
                  key={social}
                  href={`#${social}`}
                  className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.06] transition-all"
                >
                  {social === 'twitter' && (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  )}
                  {social === 'linkedin' && (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  )}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="py-5 md:py-6 border-t border-white/[0.05]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-white/20">
              © 2026 FOREAS Labs
            </p>
            <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
              {legal.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-xs text-white/20 hover:text-white/60 transition-colors"
                >
                  {link.name}
                </Link>
              ))}
              <span className="text-xs text-white/20">
                Paris
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

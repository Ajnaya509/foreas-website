'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { useThrottledScroll } from '@/hooks/useDevicePerf'
import { InkGradientButton } from '@/components/ui'

/**
 * Header — Site2026v44 (Phase 3.3)
 *
 * Aligné design system v43 :
 * - Logo "FOREAS/" avec slash en gradient signature 3-stops
 * - Liens nav avec underline-grow signature (gauche-à-droite)
 * - CTA "Essai gratuit" via InkGradientButton (signature drift)
 * - Background glass-card-mid quand scrolled (blur 24px)
 * - Touch targets 44pt iOS / 48pt Android
 * - WCAG focus rings cyan 2px
 */
const navigation = [
  { name: 'Chauffeurs', href: '/chauffeurs' },
  { name: 'Partenaires', href: '/partenaires' },
  { name: 'Tarifs', href: '/tarifs2' },
]

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-foreas-obsidian rounded-md'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useThrottledScroll(useCallback((scrollY: number) => {
    setScrolled(scrollY > 20)
  }, []))

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 2.4, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-base ease-standard ${
        mobileMenuOpen
          ? 'bg-foreas-obsidian'
          : scrolled
            ? 'glass-card-mid !rounded-none border-b border-glass-border'
            : 'bg-transparent'
      }`}
    >
      <nav className="mx-auto max-w-7xl px-lg lg:px-xxl" aria-label="Navigation principale">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo — slash en gradient 3-stops signature */}
          <Link
            href="/"
            className={`flex items-center group ${focusRing}`}
            aria-label="FOREAS — Retour à l'accueil"
          >
            <span className="font-title text-h1 font-bold tracking-wider text-text-primary">
              FOREAS
              <span className="bg-gradient-foreas-h bg-clip-text text-transparent group-hover:opacity-80 transition-opacity duration-fast">
                /
              </span>
            </span>
          </Link>

          {/* Desktop Navigation — underline-grow signature */}
          <div className="hidden md:flex md:items-center md:gap-xs">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`relative px-lg py-sm text-label text-text-tertiary hover:text-text-primary transition-colors duration-fast ease-standard min-h-[44px] flex items-center ${focusRing}`}
              >
                <span className="underline-grow">{item.name}</span>
              </Link>
            ))}
          </div>

          {/* CTA Right — InkGradientButton signature */}
          <div className="hidden md:flex md:items-center md:gap-xl">
            <Link
              href="/contact"
              className={`text-label text-text-tertiary hover:text-text-primary transition-colors duration-fast ease-standard min-h-[44px] flex items-center px-sm ${focusRing}`}
            >
              <span className="underline-grow">Contact</span>
            </Link>
            <InkGradientButton as="link" href="/tarifs2" size="sm">
              Essai gratuit
            </InkGradientButton>
          </div>

          {/* Mobile menu button — touch target 48dp */}
          <button
            type="button"
            className={`md:hidden p-md -mr-md text-text-tertiary hover:text-text-primary transition-colors duration-fast ease-standard min-w-[48px] min-h-[48px] flex items-center justify-center ${focusRing}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.32, ease: [0, 0, 0.2, 1] }}
              className="md:hidden overflow-hidden"
            >
              <div className="py-xxl space-y-xs border-t border-glass-border bg-foreas-obsidian">
                {navigation.map((item, index) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.22 }}
                  >
                    <Link
                      href={item.href}
                      className={`block py-md text-body text-text-secondary hover:text-text-primary transition-colors duration-fast min-h-[48px] flex items-center px-sm ${focusRing}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  </motion.div>
                ))}
                <motion.div
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.22 }}
                  className="pt-lg"
                >
                  <InkGradientButton
                    as="link"
                    href="/tarifs2"
                    size="md"
                    fullWidth
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Essai gratuit
                  </InkGradientButton>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </motion.header>
  )
}

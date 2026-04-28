'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { useThrottledScroll } from '@/hooks/useDevicePerf'
import { Button } from '@/components/ui'

/**
 * Header — Site2026v41
 *
 * Aligné design system v2 (skill foreas-mobile-design.md §3 §4 §6 §9).
 * - Tokens v2 (foreas-obsidian, accent-cyan/purple/gold)
 * - Touch targets ≥ 44pt iOS / 48dp Android
 * - Focus rings cyan 2px (WCAG AA)
 * - Copywriting glossaire FOREAS canonique
 */
const navigation = [
  { name: 'Chauffeurs', href: '/chauffeurs' },
  { name: 'Partenaires', href: '/partenaires' },
  { name: 'Tarifs', href: '/tarifs2' },
]

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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-base ${
        mobileMenuOpen
          ? 'bg-foreas-obsidian'
          : scrolled
            ? 'bg-foreas-obsidian/95 backdrop-blur-glass border-b border-white/8'
            : 'bg-transparent'
      }`}
    >
      <nav className="mx-auto max-w-7xl px-lg lg:px-xxxl" aria-label="Navigation principale">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-foreas-obsidian rounded-md"
            aria-label="FOREAS — Retour à l'accueil"
          >
            <span className="font-title text-xl lg:text-2xl font-semibold tracking-wider text-text-primary">
              FOREAS
              <span className="text-text-primary group-hover:text-accent-purple transition-colors duration-fast">/</span>
            </span>
          </Link>

          {/* Desktop Navigation - Center */}
          <div className="hidden md:flex md:items-center md:gap-xs">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="relative px-lg py-sm text-label text-text-tertiary hover:text-text-primary transition-colors duration-fast group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-foreas-obsidian rounded-md min-h-[44px] flex items-center"
              >
                {item.name}
                <span className="absolute bottom-1 left-lg right-lg h-px bg-accent-purple scale-x-0 group-hover:scale-x-100 transition-transform duration-fast origin-left" />
              </Link>
            ))}
          </div>

          {/* CTA Button - Right */}
          <div className="hidden md:flex md:items-center md:gap-xxl">
            <Link
              href="/contact"
              className="text-label text-text-tertiary hover:text-text-primary transition-colors duration-fast min-h-[44px] flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-foreas-obsidian rounded-md px-sm"
            >
              Contact
            </Link>
            <Button as="link" href="/tarifs2" variant="primary" size="sm">
              Essai gratuit
            </Button>
          </div>

          {/* Mobile menu button — touch target 48×48 dp */}
          <button
            type="button"
            className="md:hidden p-md -mr-md text-text-tertiary hover:text-text-primary transition-colors duration-fast min-w-[48px] min-h-[48px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-foreas-obsidian rounded-md"
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
              <div className="py-xxl space-y-xs border-t border-white/8 bg-foreas-obsidian">
                {navigation.map((item, index) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.22 }}
                  >
                    <Link
                      href={item.href}
                      className="block py-md text-body text-text-secondary hover:text-text-primary transition-colors duration-fast min-h-[48px] flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan rounded-md px-sm"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  </motion.div>
                ))}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.22 }}
                  className="pt-lg"
                >
                  <Button as="link" href="/tarifs2" variant="primary" size="md" fullWidth onClick={() => setMobileMenuOpen(false)}>
                    Essai gratuit
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </motion.header>
  )
}

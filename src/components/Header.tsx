'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, useMotionValueEvent, useScroll } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { InkGradientButton } from '@/components/ui'

/**
 * Header — Site2026v54
 *
 * Smart hide-on-scroll-down (pattern Linear / Notion / Stripe.com 2024) :
 *  - Au scroll DOWN > 100px : header se masque (translateY -100%)
 *  - Au scroll UP : header réapparaît immédiatement
 *  - Au top de page (< 50px) : toujours visible
 *  - Mobile menu open : forcé visible
 *  - Reduce-motion : header reste fixe (pas d'animation)
 *
 * Cohérent avec :
 *  - WCAG 2.1 (le user peut toujours accéder au menu en scrollant up)
 *  - Norman §feedback (la nav réapparaît dès qu'on remonte = signal "elle est là")
 *  - Krug §convention (top-bar conventionnelle préservée)
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
  const [hidden, setHidden] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { scrollY } = useScroll()

  // Track scroll direction (smart hide pattern)
  useMotionValueEvent(scrollY, 'change', (latest) => {
    const previous = scrollY.getPrevious() ?? 0

    // Toujours visible en haut de page
    if (latest < 50) {
      setHidden(false)
      setScrolled(false)
      return
    }

    // Background glass apparaît dès 50px
    setScrolled(true)

    // Si mobile menu ouvert : ne jamais masquer
    if (mobileMenuOpen) {
      setHidden(false)
      return
    }

    // Hide on scroll down (>100px et direction descendante)
    if (latest > previous && latest > 100) {
      setHidden(true)
    } else if (latest < previous) {
      // Show on scroll up (immédiat)
      setHidden(false)
    }
  })

  // Force visible quand mobile menu s'ouvre
  useEffect(() => {
    if (mobileMenuOpen) setHidden(false)
  }, [mobileMenuOpen])

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: hidden ? -100 : 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-[background,backdrop-filter,border-color] duration-300 ease-out ${
        mobileMenuOpen
          ? 'bg-foreas-obsidian'
          : scrolled
            ? 'bg-foreas-obsidian/80 backdrop-blur-[24px] border-b border-white/[0.06]'
            : 'bg-transparent border-b border-transparent'
      }`}
    >
      <nav className="mx-auto max-w-7xl px-6 lg:px-8" aria-label="Navigation principale">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo — Genos signature */}
          <Link
            href="/"
            className={`flex items-center group ${focusRing}`}
            aria-label="FOREAS — Retour à l'accueil"
          >
            <span className="font-title text-2xl lg:text-[28px] font-semibold tracking-wider text-text-primary">
              FOREAS
              <span className="bg-gradient-foreas-h bg-clip-text text-transparent group-hover:opacity-80 transition-opacity duration-fast">
                /
              </span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:gap-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`relative px-4 py-2 text-[13px] font-medium text-text-tertiary hover:text-text-primary transition-colors duration-200 min-h-[44px] flex items-center ${focusRing}`}
              >
                <span className="underline-grow">{item.name}</span>
              </Link>
            ))}
          </div>

          {/* CTA Right */}
          <div className="hidden md:flex md:items-center md:gap-5">
            <Link
              href="/contact"
              className={`text-[13px] font-medium text-text-tertiary hover:text-text-primary transition-colors duration-200 min-h-[44px] flex items-center px-2 ${focusRing}`}
            >
              <span className="underline-grow">Contact</span>
            </Link>
            <InkGradientButton as="link" href="/tarifs2" size="sm">
              Essai gratuit
            </InkGradientButton>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className={`md:hidden p-3 -mr-3 text-text-tertiary hover:text-text-primary transition-colors duration-200 min-w-[48px] min-h-[48px] flex items-center justify-center ${focusRing}`}
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
              <div className="py-6 space-y-1 border-t border-white/[0.06] bg-foreas-obsidian">
                {navigation.map((item, index) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.22 }}
                  >
                    <Link
                      href={item.href}
                      className={`block py-3 text-base font-medium text-text-secondary hover:text-text-primary transition-colors duration-200 min-h-[48px] flex items-center px-2 ${focusRing}`}
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
                  className="pt-4"
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

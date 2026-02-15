'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { useThrottledScroll } from '@/hooks/useDevicePerf'

const navigation = [
  { name: 'Chauffeurs', href: '/chauffeurs' },
  { name: 'Entreprises', href: '/entreprises' },
  { name: 'Technologie', href: '/technologie' },
  { name: 'Tarifs', href: '/tarifs' },
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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        mobileMenuOpen
          ? 'bg-[#050508]'
          : scrolled
            ? 'bg-[#050508]/95 backdrop-blur-xl border-b border-white/5'
            : 'bg-transparent'
      }`}
    >
      <nav className="mx-auto max-w-7xl px-6 lg:px-8" aria-label="Global">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <span className="font-title text-xl lg:text-2xl font-semibold tracking-wider text-white transition-all">
              FOREAS
              <span className="text-white group-hover:text-accent-purple transition-colors">/</span>
            </span>
          </Link>

          {/* Desktop Navigation - Center */}
          <div className="hidden md:flex md:items-center md:gap-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="relative px-4 py-2 text-sm font-medium text-white/50 hover:text-white transition-colors group"
              >
                {item.name}
                <span className="absolute bottom-1 left-4 right-4 h-px bg-accent-purple scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              </Link>
            ))}
          </div>

          {/* CTA Button - Right */}
          <div className="hidden md:flex md:items-center md:gap-6">
            <Link
              href="/contact"
              className="text-sm font-medium text-white/50 hover:text-white transition-colors"
            >
              Contact
            </Link>
            <Link
              href="#telecharger"
              className="group relative inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-white overflow-hidden rounded-full transition-all hover:scale-[1.02]"
            >
              <div className="absolute inset-0 bg-accent-purple transition-all group-hover:bg-accent-purple/90" />
              <span className="relative">Télécharger</span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden p-3 -mr-2 text-white/60 hover:text-white transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden overflow-hidden"
            >
              <div className="py-6 space-y-1 border-t border-white/5 bg-[#050508]">
                {navigation.map((item, index) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      href={item.href}
                      className="block py-3 text-base font-medium text-white/60 hover:text-white transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  </motion.div>
                ))}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="pt-4"
                >
                  <Link
                    href="#telecharger"
                    className="block w-full text-center px-6 py-4 text-base font-semibold text-white bg-accent-purple rounded-xl"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Télécharger l'app
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </motion.header>
  )
}

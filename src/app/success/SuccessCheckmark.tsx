'use client'

/**
 * SuccessCheckmark — animation check Apple-grade pour /success.
 *
 * Petit client component isolé pour permettre à la page parent /success/page.tsx
 * de rester un server component (Stripe retrieve server-side + metadata custom).
 *
 * Design : DS §13 variant pulse — halo cyan diffus 0.9s + path animation 0.5s.
 */

import { motion } from 'framer-motion'

export default function SuccessCheckmark() {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', damping: 14, stiffness: 220, delay: 0.1 }}
      className="relative w-20 h-20 mx-auto mb-8"
    >
      {/* Halo cyan pulse (variant pulse §13) */}
      <motion.div
        aria-hidden
        className="absolute inset-0 rounded-full"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.35) 0%, transparent 70%)',
          filter: 'blur(8px)',
        }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 1.8, ease: 'easeInOut', repeat: Infinity }}
      />
      {/* Cercle vert avec border 1px (§16 borderWidth 1px max) */}
      <div
        className="relative w-full h-full rounded-full flex items-center justify-center"
        style={{
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
        }}
      >
        <svg
          className="w-10 h-10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#10B981"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <motion.path
            d="M4 12l5 5L20 7"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>
      </div>
    </motion.div>
  )
}

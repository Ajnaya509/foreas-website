'use client'

import { motion } from 'framer-motion'

export default function ComingSoon() {
  return (
    <main className="min-h-screen bg-foreas-black flex flex-col items-center justify-center relative overflow-hidden px-6">
      {/* Subtle ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-accent-purple/[0.04] rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-10 text-center max-w-lg"
      >
        {/* Logo / Brand */}
        <h1 className="font-title text-5xl md:text-7xl text-white tracking-tight mb-4">
          FOREAS
        </h1>

        {/* Tagline */}
        <p className="text-white/40 text-lg md:text-xl mb-12">
          Quelque chose arrive.
        </p>

        {/* Status indicator */}
        <div className="inline-flex items-center gap-3 px-5 py-3 border border-white/10 rounded-full">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-cyan opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent-cyan" />
          </span>
          <span className="text-white/50 text-sm tracking-wide">Site en construction</span>
        </div>
      </motion.div>

      {/* Bottom line */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-8 text-white/20 text-xs tracking-wider"
      >
        FOREAS LABS © 2026
      </motion.p>
    </main>
  )
}

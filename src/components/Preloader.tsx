'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Preloader() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2200)

    return () => clearTimeout(timer)
  }, [])

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050508] overflow-hidden"
        >
          {/* Subtle ambient glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-accent-purple/[0.06] rounded-full blur-[120px] pointer-events-none" />

          {/* Logo animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            {/* FOREAS/ */}
            <h1 className="font-title text-5xl md:text-7xl font-semibold tracking-wider text-white">
              FOREAS
              <span className="text-white">/</span>
            </h1>
          </motion.div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="tagline text-xl md:text-2xl text-white/60 mt-4"
          >
            Toujours plus loin.
          </motion.p>

          {/* Gradient bar - composant graphique SVG */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 w-[340px] md:w-[500px] origin-center"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/gradient-bar.svg" alt="" className="w-full h-[2px] object-cover" />
          </motion.div>

          {/* Loading indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="absolute bottom-12 flex items-center gap-2"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-1.5 h-1.5 bg-accent-cyan rounded-full"
            />
            <span className="text-xs text-white/30 font-medium tracking-wider uppercase">
              Chargement
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

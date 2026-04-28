'use client'

import { motion } from 'framer-motion'

export default function AjnayaNotification({ text = '3 Intercités arrivent Gare de Lyon dans 12 min' }: { text?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ type: 'spring', damping: 20, stiffness: 200 }}
      className="max-w-[320px] mx-auto p-3.5 rounded-2xl bg-[#0a0a12] border border-accent-cyan/15 shadow-lg shadow-black/40"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-accent-purple to-accent-cyan flex items-center justify-center">
          <span className="font-title text-[10px] font-bold text-white">A</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="font-title text-xs font-semibold text-white">Ajnaya</span>
            <span className="px-1 py-0.5 text-[7px] font-mono uppercase text-accent-cyan/70 bg-accent-cyan/10 rounded">IA</span>
          </div>
          <p className="text-sm text-white/70 leading-snug">{text}</p>
          <span className="text-[10px] text-white/30 mt-1 block">il y a 2 min</span>
        </div>
      </div>
    </motion.div>
  )
}

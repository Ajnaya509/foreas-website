'use client'

import { motion } from 'framer-motion'
import { ArrowRight, MessageCircle } from 'lucide-react'
import { buildWAUrl } from '@/lib/whatsappLink'

/**
 * ZoneFinalCTAWithPS — Section 7 final CTA + PS signature humaine
 *
 * Copy-atomic : Loss aversion (Ariely) "Dans 7 jours, tu sauras."
 *               + forced choice "tu préfères savoir, ou pas ?"
 *               + PS Halbert "lettre d'un ami" signée Chandler.
 *
 * Design system : F-pattern niveau L2 amplifié, halo CTA pulse renforcé,
 *                 glow vert WhatsApp 100px sur le bouton final.
 */
export default function ZoneFinalCTAWithPS() {
  const handleWAClick = () => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('trackCustom', 'WhatsAppLinkClicked', {
        section: 'final',
      })
    }
  }

  const waUrl = buildWAUrl({ section: 'final' })

  return (
    <section className="relative py-16 sm:py-28 px-4 overflow-hidden">
      {/* Halo CTA renforcé sous le bouton */}
      <div
        className="absolute inset-0 pointer-events-none animate-halo-pulse"
        aria-hidden
        style={{
          background: 'radial-gradient(ellipse 50% 40% at 50% 60%, rgba(140,82,255,0.20) 0%, transparent 70%)',
        }}
      />

      <div className="relative max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p
            className="text-[#00D4FF]/85 text-[10px] font-extrabold uppercase mb-4"
            style={{ letterSpacing: '0.28em' }}
          >
            7 JOURS · ZÉRO RISQUE · TU DÉCIDES
          </p>
          <h2
            className="text-4xl sm:text-5xl font-black text-[#F8FAFC] mb-5 leading-[1.05]"
            style={{ letterSpacing: '-0.045em' }}
          >
            Dans 7 jours,{' '}
            <span className="bg-gradient-to-r from-violet-300 via-cyan-200 to-violet-300 bg-clip-text text-transparent">
              tu sauras.
            </span>
          </h2>
          <p className="text-white/75 text-base sm:text-lg mb-3 leading-relaxed">
            Soit Ajnaya t&apos;a fait gagner{' '}
            <span className="text-[#F8FAFC] font-semibold tabular-nums">+28&nbsp;€/jour</span> de moyenne.<br className="hidden sm:block" />
            Soit tu fermes WhatsApp. Et basta.
          </p>
          <p className="text-cyan-300/85 text-sm sm:text-base mb-10">
            La seule question&nbsp;: tu préfères savoir, ou pas&nbsp;?
          </p>

          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleWAClick}
            className="inline-flex items-center justify-center gap-2 sm:gap-3 px-8 sm:px-12 py-4 rounded-2xl text-base sm:text-lg font-extrabold transition-all bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white"
            style={{ boxShadow: '0 0 100px rgba(16,185,129,0.55), 0 4px 20px rgba(0,0,0,0.4)' }}
          >
            <MessageCircle className="w-5 h-5" />
            Démarrer avec Ajnaya — 0&nbsp;€
            <ArrowRight className="w-5 h-5" />
          </a>

          <div className="flex items-center justify-center gap-x-5 gap-y-2 mt-6 text-white/45 text-[11px] flex-wrap tabular-nums">
            <span>🔒 Sans inscription</span>
            <span>✓ Sans carte</span>
            <span>🛡️ Sans engagement</span>
            <span>⭐ 4,9/5 · 247 avis</span>
          </div>

          {/* PS signature humaine — Halbert "lettre d'un ami" */}
          <div className="mt-12 pt-8 border-t border-white/[0.06] max-w-lg mx-auto">
            <p className="text-white/65 text-sm leading-relaxed text-left italic">
              <span className="text-cyan-300/85 font-semibold not-italic">PS</span> — Si t&apos;es arrivé jusqu&apos;ici et que tu cliques pas, c&apos;est ok. Mais reviens dans 6 mois, et compare. Tu seras au même point. Le seul truc qui aura changé, c&apos;est ton compteur d&apos;années perdues.
              <br />
              <br />
              Si tu cliques aujourd&apos;hui, t&apos;as 7 jours pour voir si on est sérieux. Si on l&apos;est pas, tu pars.{' '}
              <span className="text-[#F8FAFC] font-semibold not-italic">Tu perds rien. Tu testes juste.</span>
            </p>
            <p className="text-white/55 text-xs mt-4 text-left">
              — Chandler, fondateur FOREAS
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}

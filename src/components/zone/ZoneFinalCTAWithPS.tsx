'use client'

import { motion } from 'framer-motion'
import { ArrowRight, MessageCircle } from 'lucide-react'
import { buildWAUrl } from '@/lib/whatsappLink'
import Link from 'next/link'
import { useLienOffre } from '@/hooks/useLienOffre'
import { ESSAI_JOURS } from '@/lib/offre'
import { mesurer } from '@/lib/mesure'

/**
 * ZoneFinalCTAWithPS — Section 7 final CTA + PS signature humaine
 *
 * Copy-atomic : Loss aversion (Ariely) "Dans 3 jours, tu sauras."
 *               + forced choice "tu préfères savoir, ou pas ?"
 *               + PS Halbert "lettre d'un ami" signée Chandler.
 *
 * Design system : F-pattern niveau L2 amplifié, halo CTA pulse renforcé,
 *                 glow vert WhatsApp 100px sur le bouton final.
 */
export default function ZoneFinalCTAWithPS() {
  const handleWAClick = () => {
    // ⚠️ Avant, ce clic n'était compté QUE par le pixel Meta. Or l'identifiant
    // Meta n'est pas configuré (`meta_conversions` : 0 ligne), donc `fbq`
    // n'existe pas et la condition était toujours fausse. Autrement dit : le
    // seul chemin de sortie du site n'était compté nulle part.
    mesurer('WhatsAppClick', {
      page: '/',
      intention: 'general',
      audience: 'chauffeur',
      detail: { emplacement: 'cta-final' },
    })
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('trackCustom', 'WhatsAppLinkClicked', {
        section: 'final',
      })
    }
  }

  const waUrl = buildWAUrl({ section: 'final' })
  const urlOffre = useLienOffre('general')

  const clicPrincipal = () => {
    mesurer('PrimaryCTAClick', {
      page: '/',
      intention: 'general',
      audience: 'chauffeur',
      promesse: 'Essayer ' + ESSAI_JOURS + ' jours',
      detail: { emplacement: 'cta-final', destination: '/tarifs2' },
    })
  }

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
            className="text-[#00D4FF]/85 t-eyebrow mb-4"
            style={{ letterSpacing: '0.28em' }}
          >
            0&nbsp;€ AUJOURD&apos;HUI · TU COUPES EN 1 CLIC
          </p>
          <h2
            className="t-display-xl text-[#F8FAFC] mb-5 leading-[1.05]"
            style={{ letterSpacing: '-0.045em' }}
          >
            Teste 3 jours.{' '}
            <span className="bg-gradient-to-r from-violet-300 via-cyan-200 to-violet-300 bg-clip-text text-transparent">
              Tu verras vite.
            </span>
          </h2>
          <p className="text-white/75 t-bodylg mb-10 leading-relaxed">
            Soit Ajnaya te sort plus de net. Soit tu coupes, et tu n&apos;as rien lâché.<br className="hidden sm:block" />
            Toi seul tranches.
          </p>

          {/*
            ACTION PRINCIPALE : la page où l'on paie. Avant le 21/08/2026, ce
            bloc n'offrait QUE WhatsApp — comme les cinq autres sorties de
            l'accueil. Un visiteur décidé n'avait aucun moyen de payer.

            ⚠️ Les mentions rassurantes ont changé avec la destination.
            « Sans inscription » était vrai pour WhatsApp et FAUX ici :
            `/api/checkout` pose `payment_method_collection: 'always'`, donc la
            carte est demandée. Une réassurance qu'on n'honore pas se paie au
            moment du débit, pas au moment du clic.
          */}
          <Link
            href={urlOffre}
            onClick={clicPrincipal}
            className="inline-flex items-center justify-center gap-2 sm:gap-3 px-8 sm:px-12 py-4 rounded-2xl t-h3 transition-all bg-gradient-to-r from-[#8C52FF] to-[#6C3CE0] hover:from-[#9A66FF] hover:to-[#7B4CF0] text-white"
            style={{ boxShadow: '0 0 100px rgba(140,82,255,0.55), 0 4px 20px rgba(0,0,0,0.4)' }}
          >
            Essayer {ESSAI_JOURS} jours
            <ArrowRight className="w-5 h-5" />
          </Link>

          <div className="flex items-center justify-center gap-x-5 gap-y-2 mt-6 text-white/45 t-caption flex-wrap tabular-nums">
            <span>💳 Carte demandée</span>
            <span>✓ 0 € débité aujourd&apos;hui</span>
            <span>🛡️ Sans engagement</span>
          </div>

          {/* ACTION SECONDAIRE : WhatsApp. Il aide à décider, il ne remplace
              plus la caisse. Sans inscription — et là, c'est vrai. */}
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleWAClick}
            className="inline-flex items-center justify-center gap-2 mt-8 px-6 py-3 rounded-2xl t-body text-white/70 hover:text-white transition-colors border border-white/15 hover:border-white/30"
          >
            <MessageCircle className="w-4 h-4" />
            Une question ? Parle à Ajnaya
          </a>
          <p className="mt-3 text-white/35 t-caption">Sans inscription, réponse immédiate.</p>

          {/* PS signature humaine — Halbert "lettre d'un ami" */}
          <div className="mt-12 pt-8 border-t border-white/[0.06] max-w-lg mx-auto">
            <p className="text-white/65 t-body leading-relaxed text-left italic">
              <span className="text-cyan-300/85 font-semibold not-italic">PS</span> — Tu peux fermer cette page, c&apos;est ton droit. Mais demain matin au volant, la question est la même&nbsp;: tu roules au hasard, ou quelqu&apos;un calcule pour toi&nbsp;?{' '}
              <span className="text-[#F8FAFC] font-semibold not-italic">Vérifier te coûte 0&nbsp;€ et 3 jours.</span>
            </p>
            <p className="text-white/55 t-caption mt-4 text-left">
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

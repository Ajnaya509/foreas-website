'use client'

import { motion } from 'framer-motion'
import { ArrowRight, MessageCircle } from 'lucide-react'
import { lienPassageWhatsApp } from '@/lib/passageWhatsApp'
import { COMMUNAUTE } from '@/lib/verite-commerciale'
import TestimonialCarousel from './TestimonialCarousel'

import { TESTIMONIALS } from './testimonials.data'
/**
 * ZoneSocialProof — Section 4 témoignages chauffeurs (vidéos Mux LIVE)
 *
 * Cialdini preuve sociale × Heath Stories × Halbert Specifics.
 * 6 vraies vidéos hébergées Mux (policy=public) avec MuxPlayer React.
 * Click-to-play (lazy load) → pas de bandwidth gaspillée.
 * Caption autorité humaine en bas (consent explicite des chauffeurs).
 *
 * Layout :
 * - Mobile : 1 colonne, scroll vertical
 * - Tablet : 2 colonnes
 * - Desktop : 3 colonnes (les 6 vidéos sur 2 rangées)
 */
export default function ZoneSocialProof() {
  const handleWAClick = () => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('trackCustom', 'WhatsAppLinkClicked', {
        section: 'social_proof',
      })
    }
  }

  // ⚠️ 22/08/2026 — CE BOUTON PASSE MAINTENANT PAR `/wa`.
  // Le lien servi ne porte plus d'adresse `wa.me` : le badge appareil (cookie
  // `httpOnly`) fuitait dans le HTML, et 9 boutons sur 11 partaient sans référence
  // et sans comptage. Le serveur lit le cookie au clic, compte, compose le message
  // et redirige. Voir `src/app/wa/route.ts`.
  const waUrl = lienPassageWhatsApp({ section: 'social_proof', page: '/ou-ca-paie', intention: 'communaute', emplacement: 'preuve_sociale' })

  // 🔴 21/08/2026 — CETTE SECTION AFFIRMAIT UN CONSENTEMENT QUE LE REGISTRE NIE.
  //
  // Elle servait, en production : « Ces 6 chauffeurs ont accepté que leur visage
  // et leur voix apparaissent. » Le registre du même dépôt place les six en
  // « en attente », sans aucune preuve enregistrée.
  //
  // Et le garde avait été posé sur l'ENFANT — le carrousel — jamais sur la
  // section. Résultat mesuré : le titre, le compteur « 6 » et l'invitation
  // « tu cliques, tu les écoutes » survivaient au-dessus d'un conteneur VIDE.
  //
  // Retirer les vidéos en laissant la phrase qui affirme l'accord est un RECUL,
  // pas une correction : avant, la promesse s'appuyait au moins sur quelque
  // chose de visible.
  // 21/08 — même correction qu'au-dessus : on interroge la liste réellement
  // affichée, pas un « au moins un » qui ouvrirait les six d'un coup.
  if (TESTIMONIALS.length === 0) return null

  return (
    <section className="relative py-16 sm:py-24 px-4 border-b border-white/[0.06]">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <p
            className="text-[#00D4FF]/85 t-eyebrow mb-3"
            style={{ letterSpacing: '0.28em' }}
          >
            {/* 14/08/2026 — le « 6 » était écrit en dur ici et à deux autres
                endroits de la page. Il vient maintenant du canon
                (COMMUNAUTE.temoignagesVideoReels), pour qu'il ne puisse plus
                diverger du nombre réel de vidéos consenties. */}
            {COMMUNAUTE.temoignagesVideoReels} CHAUFFEURS · LEUR VISAGE · LEUR VOIX
          </p>
          <h2
            className="t-display-l text-[#F8FAFC] mb-3"
            style={{ letterSpacing: '-0.035em' }}
          >
            Pas moi qui le dis.{' '}
            <span className="bg-gradient-to-r from-violet-300 to-cyan-300 bg-clip-text text-transparent">
              Eux.
            </span>
          </h2>
          <p className="text-white/55 t-body">
            Des chauffeurs comme toi. Tu cliques, tu les écoutes. Personne ne lit un script.
          </p>
        </motion.div>

        {/* Carrousel défilement infini auto-play 5s — embla */}
        <div className="mb-10">
          <TestimonialCarousel />
        </div>

        {/* Caption autorité humaine */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center text-white/45 t-caption mb-6 max-w-xl mx-auto"
        >
          Ces {COMMUNAUTE.temoignagesVideoReels} chauffeurs ont accepté que leur visage et leur voix apparaissent. Tu peux leur écrire — l&apos;app FOREAS leur ouvre le DM si tu rejoins.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center"
        >
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleWAClick}
            className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-2xl t-body-bold transition-all bg-white/[0.06] border border-white/[0.10] hover:bg-white/[0.10] hover:border-white/[0.18] text-[#F8FAFC]"
          >
            <MessageCircle className="w-4 h-4" />
            {/* CE QUI ÉTAIT FAUX — « 12 autres cas » annonçait 12 témoignages en
                plus des 6 vidéos, soit 18 au total. Mesure :
                `select count(*) from pieuvre_closer_testimonials` → 3 lignes,
                dont « Demo FOREAS » (fabriqué) et deux qui font DOUBLON avec des
                vidéos déjà affichées ici (Binaté, Zefi Kitengue). Il n'existe
                donc 0 cas supplémentaire — et la base ne compte que 30 chauffeurs
                inscrits pour 4 abonnements actifs. Proposer une rencontre avec
                l'un des six est vrai, vérifiable, et engage bien plus qu'un
                catalogue de cas que personne ne pourrait montrer. */}
            Demander à Ajnaya de te présenter l&apos;un d&apos;eux
            <ArrowRight className="w-4 h-4" />
          </a>
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

'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, MessageCircle, AlertTriangle } from 'lucide-react'
import { buildWAUrl } from '@/lib/whatsappLink'

/**
 * ZonePainCalculator — la section « ce qui te reste vraiment ».
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 CE QUE CE BLOC CALCULAIT AVANT LE 21/08/2026, ET POURQUOI C'ÉTAIT FAUX
 *
 * Il appliquait QUATRE taux écrits en dur :
 *
 *     commission Uber   0,45
 *     TVA               0,166  (sur le montant après commission)
 *     cotisations       0,11   (sur le montant après TVA)
 *     gasoil            0,06   (sur le montant BRUT)
 *
 * Sur 25 €, cela affichait 8,71 € « dans la poche ». Quatre problèmes, chacun
 * suffisant à retirer le chiffre :
 *
 * 1. LE TAUX DE COMMISSION N'EXISTE PAS EN UN SEUL EXEMPLAIRE. FOREAS en portait
 *    TROIS, tous saisis à la main, aucun mesuré : 0,45 ici, 0,25 dans
 *    `pieuvre_platform_commissions`, et 0,75 de part chauffeur dans
 *    `coachInstant.ts` — ce dernier étant le seul que le produit exécute
 *    réellement. Sur la même course de 25 €, cela donnait 8,71 € ici et 18,75 €
 *    sur /revenus. Le commentaire de ce fichier citait une table de la base
 *    comme source ; aucun code des trois dépôts ne lit cette table.
 *
 * 2. UNE COMMISSION DÉPEND DE LA PLATEFORME, DE L'OFFRE, DU PAYS ET PARFOIS DE
 *    LA COURSE. Un taux unique appliqué à tout le monde est faux pour presque
 *    tout le monde.
 *
 * 3. LES TROIS TAUX DE CHARGES N'AVAIENT AUCUNE SOURCE — ni dans le dépôt, ni en
 *    base, ni en commentaire. Et ils dépendent du STATUT : un chauffeur en
 *    franchise en base de TVA ne paie pas la TVA qu'on lui décomptait. Le site
 *    ne lui a jamais demandé son statut.
 *
 * 4. LE GASOIL ÉTAIT CALCULÉ SUR LE MONTANT DE LA COURSE, SANS AUCUNE DISTANCE.
 *    Autrement dit : plus la course rapportait, plus on lui comptait de
 *    carburant. Deux courses de même distance, l'une à 20 € et l'autre à 60 €,
 *    n'auraient pas consommé le même gasoil. C'est physiquement faux.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUE CE BLOC CALCULE MAINTENANT
 *
 * Deux nombres, tous deux fournis par le chauffeur : le montant de la course, et
 * SA commission. Le résultat est une soustraction qu'il peut refaire de tête.
 *
 * Les charges ont disparu. Pas « provisoirement retirées en attendant mieux » :
 * elles ne peuvent PAS être calculées sans connaître le statut fiscal, le
 * véhicule, la distance et la consommation. Un outil qui les invente ne rend pas
 * service — il donne un chiffre que le chauffeur croira.
 *
 * ⚠️ LE DÉFAUT DE 25 % EST UN EXEMPLE, ET C'EST ÉCRIT À L'ÉCRAN. Il ne prétend
 * pas représenter le marché. La vraie valeur est sur le relevé de plateforme du
 * chauffeur, et le bloc le lui dit.
 */

/** Valeur de départ du curseur de commission. C'est un EXEMPLE, dit comme tel. */
const COMMISSION_EXEMPLE_PCT = 25

export default function ZonePainCalculator() {
  const [grossFare, setGrossFare] = useState(25)
  const [commissionPct, setCommissionPct] = useState(COMMISSION_EXEMPLE_PCT)
  const [touche, setTouche] = useState(false)

  const calcul = useMemo(() => {
    const commission = grossFare * (commissionPct / 100)
    return {
      commission,
      apresCommission: Math.max(0, grossFare - commission),
    }
  }, [grossFare, commissionPct])

  const eur = (n: number) => n.toFixed(2).replace('.', ',')

  const handleWAClick = () => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('trackCustom', 'WhatsAppLinkClicked', {
        section: 'pain',
        gross_fare: grossFare,
      })
    }
  }

  const waUrl = buildWAUrl({ section: 'pain', amount: grossFare })

  return (
    <section className="relative py-16 sm:py-24 px-4 border-y border-white/[0.06]">
      {/* Halo rose subtle — variant warm douleur */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 50% 40% at 30% 50%, rgba(255,102,153,0.06) 0%, transparent 70%)',
        }}
      />

      <div className="relative max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <p className="text-rose-300/85 t-eyebrow mb-3" style={{ letterSpacing: '0.28em' }}>
            FAIS LE COMPTE AVEC TES CHIFFRES
          </p>
          <h2 className="t-display-l text-[#F8FAFC] leading-tight" style={{ letterSpacing: '-0.035em' }}>
            Sur une course de{' '}
            <span className="tabular-nums">{grossFare}&nbsp;€</span>, ta plateforme
            t&apos;en prend{' '}
            <span className="text-[#EF4444] tabular-nums">{eur(calcul.commission)}&nbsp;€</span>
            <span className="text-white/65 font-bold">.</span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-2xl p-6 sm:p-8 border border-white/[0.06] bg-white/[0.04] backdrop-blur-sm mb-6"
        >
          {/* ── Le montant de la course ───────────────────────────────────── */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="course-brute" className="text-white/55 t-eyebrow" style={{ letterSpacing: '0.2em' }}>
                Ta course
              </label>
              <p className="t-display-m text-[#F8FAFC] tabular-nums" style={{ letterSpacing: '-0.03em' }}>
                {grossFare}&nbsp;€
              </p>
            </div>
            <input
              id="course-brute"
              type="range"
              min={10}
              max={100}
              step={1}
              value={grossFare}
              onChange={(e) => setGrossFare(Number(e.target.value))}
              className="w-full h-1.5 rounded-full bg-white/[0.08] appearance-none cursor-pointer accent-rose-400"
              aria-label="Montant de la course, en euros"
            />
          </div>

          {/*
            ⚠️ LA COMMISSION EST SAISIE, PLUS DEVINÉE.
            Elle dépend de la plateforme, de l'offre et parfois de la course.
            Le chiffre de départ est un exemple, et l'écran le dit.
          */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="commission" className="text-white/55 t-eyebrow" style={{ letterSpacing: '0.2em' }}>
                Ta commission
              </label>
              <p className="t-display-m text-[#F8FAFC] tabular-nums" style={{ letterSpacing: '-0.03em' }}>
                {commissionPct}&nbsp;%
              </p>
            </div>
            <input
              id="commission"
              type="range"
              min={5}
              max={50}
              step={1}
              value={commissionPct}
              onChange={(e) => {
                setCommissionPct(Number(e.target.value))
                setTouche(true)
              }}
              className="w-full h-1.5 rounded-full bg-white/[0.08] appearance-none cursor-pointer accent-rose-400"
              aria-label="Ta commission de plateforme, en pourcentage"
            />
            <p className="mt-2 t-caption text-white/40">
              {touche
                ? 'C’est ton chiffre. Le calcul ci-dessous en découle.'
                : `${COMMISSION_EXEMPLE_PCT} % est un exemple — mets la tienne. Elle est sur ton relevé de plateforme.`}
            </p>
          </div>

          {/* ── Ce que la plateforme prend ────────────────────────────────── */}
          <div className="rounded-xl p-5 sm:p-6 mb-5 border border-[#EF4444]/30 bg-[#EF4444]/[0.07]">
            <p className="text-[#EF4444]/90 t-eyebrow flex items-center gap-2 mb-1.5" style={{ letterSpacing: '0.2em' }}>
              <AlertTriangle className="w-3.5 h-3.5 text-[#EF4444]" />
              Ce que la plateforme prend
            </p>
            <p className="t-display-xxl text-[#EF4444] tabular-nums leading-none" style={{ letterSpacing: '-0.04em' }}>
              −{eur(calcul.commission)}&nbsp;€
            </p>
            <p className="text-white/45 t-caption mt-2 tabular-nums">
              {commissionPct}&nbsp;% de {grossFare}&nbsp;€.
            </p>
          </div>

          <div className="h-px bg-white/[0.08] my-4" />

          {/* ── Ce qui reste après la commission ──────────────────────────── */}
          <div className="flex items-center justify-between">
            <p className="text-white/65 t-eyebrow" style={{ letterSpacing: '0.2em' }}>
              Il te reste, avant tes charges
            </p>
            <p className="t-display-m text-white/80 tabular-nums" style={{ letterSpacing: '-0.03em' }}>
              {eur(calcul.apresCommission)}&nbsp;€
            </p>
          </div>

          {/*
            ⚠️ LA FORMULE EST ÉCRITE SOUS LE RÉSULTAT, ET LE MOT « NET » A DISPARU.

            Ce chiffre n'est PAS un net : il ne déduit ni carburant, ni URSSAF,
            ni TVA, ni assurance, ni location. Le bloc précédent les déduisait —
            avec des taux sans aucune source, et un carburant calculé sur le
            PRIX de la course plutôt que sur la distance.

            Dire « il te reste, avant tes charges » coûte trois mots et évite de
            faire croire à un chauffeur qu'il a gagné ce qu'il n'a pas gagné.
          */}
          <p className="mt-4 t-caption text-white/40 leading-relaxed tabular-nums">
            {grossFare}&nbsp;€ − {commissionPct}&nbsp;% = {eur(calcul.apresCommission)}&nbsp;€.
            <br />
            Tes charges — carburant, cotisations, TVA selon ton statut, assurance,
            véhicule — viennent après, et elles n&apos;appartiennent qu&apos;à toi.
            Ce site ne les devine pas.
          </p>
        </motion.div>

        {/* Bandeau bénéfice Ajnaya */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="rounded-2xl p-6 sm:p-7 border border-violet-500/30 bg-gradient-to-b from-violet-900/15 to-black backdrop-blur-sm"
          style={{ boxShadow: '0 0 40px rgba(140,82,255,0.15)' }}
        >
          <p className="text-[#F8FAFC] t-bodylg leading-relaxed mb-5">
            Tu bosses bien. Le problème, c&apos;est pas toi — c&apos;est les courses à vide
            qu&apos;on te refile. Ajnaya repère celles qui te laissent
            le plus. <span className="text-[#F8FAFC] font-semibold">Même volant, mieux placé.</span>
          </p>

          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleWAClick}
            className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-xl t-body-bold transition-all bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white"
            style={{ boxShadow: '0 0 28px rgba(16,185,129,0.40)' }}
          >
            <MessageCircle className="w-4 h-4" />
            Voir mes vraies courses rentables
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

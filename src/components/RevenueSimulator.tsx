'use client'

/**
 * RevenueSimulator — ce que FOREAS COÛTE, plus ce qu'il ferait GAGNER.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUI ÉTAIT FAUX ICI (constats SIM-01 et SIM-02, mesurés le 14/08/2026)
 *
 * 1. SIM-02 — le moteur entier était `currentEarnings * 0.35` : un +35 % écrit en dur, sans
 *    source, qui produisait « ≈ +280 € estimés par semaine », « Gain mensuel +1120 € » et
 *    « Gain annuel +14560 € » en gras sur une page qui vend.
 *    MESURE : aucune table de cohorte revenu n'existe (information_schema, motifs %revenue%,
 *    %earning%, %gain%, %cohort%, %uplift% → aucune table de mesure) ;
 *    `select count(*) from pieuvre_rides where created_at >= now()-interval '7 days'` → 0 ;
 *    dernière course toutes tables confondues = 2026-04-30 ; la SEULE hausse de revenu
 *    enregistrée dans toute la base est `pieuvre_closer_testimonials.revenue_increase_pct` =
 *    30,00, pour UN chauffeur (n=1). src/lib/verite-commerciale.ts n'autorise aucun chiffre de
 *    gain, et un paragraphe « pas une promesse » ne neutralise pas des montants en gras (DGCCRF).
 *
 * 2. SIM-01 — « ROI : 2159 % », rendu littéralement en production sur /chauffeurs, collé au
 *    prix. Le calcul était `(weeklyGain / 12.97) * 100` : 12,97 € est l'ANCIEN prix
 *    hebdomadaire, mort depuis (PRIX_MENSUEL_CENTIMES = 2999). Le pourcentage affiché n'avait
 *    aucun rapport arithmétique avec le prix affiché à 2 cm de lui.
 *
 * 3. SIM-06 — « FREE NOW » figurait dans les applications proposées.
 *    MESURE : `select distinct platform from rides` → Bolt, Heetch, Private, Uber. Aucune course
 *    FREE NOW n'existe. La liste vient désormais de PLATEFORMES.reellementVues (le canon), donc
 *    elle ne peut plus diverger de la base.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUE CE COMPOSANT CALCULE MAINTENANT
 *
 * Uniquement des divisions entre DEUX nombres dont chacun a une source :
 *   · ce que le chauffeur saisit lui-même (ses heures, son chiffre) ;
 *   · le prix réel, importé de src/lib/offre.ts — jamais réécrit ici.
 * Aucune projection de gain. C'est plus court à lire, et n'importe quel chauffeur peut le
 * vérifier avec sa calculette : une promesse vérifiable convertit mieux qu'un chiffre rond
 * qu'il peut démentir en trente secondes.
 */

import { motion } from 'framer-motion'
import { useState, useMemo } from 'react'
import { PRIX_MENSUEL_CENTIMES, PRIX_ANNUEL_CENTIMES, ESSAI_JOURS, formaterEuros } from '@/lib/offre'
import { PLATEFORMES } from '@/lib/verite-commerciale'

/** 2999 → « 29,99 » puis les divisions. Le prix ne vit qu'ici, dérivé de la source unique. */
const PRIX_MENSUEL_EUROS = PRIX_MENSUEL_CENTIMES / 100
const SEMAINES_PAR_MOIS = 52 / 12

/** Affichage français d'un décimal : 0.173 → « 0,17 ». */
function fr(n: number, decimales: number): string {
  return n.toFixed(decimales).replace('.', ',')
}

export default function RevenueSimulator() {
  const [hoursPerWeek, setHoursPerWeek] = useState(40)
  const [currentEarnings, setCurrentEarnings] = useState(800)
  const [apps, setApps] = useState<string[]>(['uber'])

  // Les 3 plateformes RÉELLEMENT vues en base, lues dans le canon (verite-commerciale.ts §2).
  // Écrire la liste à la main ici est exactement ce qui avait laissé « FREE NOW » s'installer.
  const appOptions = useMemo(
    () => PLATEFORMES.reellementVues.map((name) => ({ id: name.toLowerCase(), name })),
    [],
  )

  const results = useMemo(() => {
    // Son chiffre, ramené au mois — c'est SON nombre, pas le nôtre.
    const chiffreMensuel = currentEarnings * SEMAINES_PAR_MOIS
    const heuresParMois = hoursPerWeek * SEMAINES_PAR_MOIS
    return {
      chiffreMensuel: Math.round(chiffreMensuel),
      partDuChiffre: fr(chiffreMensuel > 0 ? (PRIX_MENSUEL_EUROS / chiffreMensuel) * 100 : 0, 1),
      coutParJour: fr(PRIX_MENSUEL_EUROS / 30, 2),
      coutParHeure: fr(heuresParMois > 0 ? PRIX_MENSUEL_EUROS / heuresParMois : 0, 2),
    }
  }, [hoursPerWeek, currentEarnings])

  const toggleApp = (appId: string) => {
    setApps(prev =>
      prev.includes(appId)
        ? prev.filter(a => a !== appId)
        : [...prev, appId]
    )
  }

  return (
    <section id="simulateur" className="relative py-24 bg-foreas-deepblack overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[800px] md:h-[600px] bg-accent-cyan/[0.03] rounded-full blur-[60px] md:blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        {/* Header — « Simule ton potentiel » annonçait une projection de gain : c'est
            précisément ce qu'on n'a pas le droit de faire (aucune cohorte mesurée). */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-title text-3xl md:text-5xl text-white mb-4">
            Ce que ça te <span className="text-accent-cyan">coûte</span>
          </h2>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            Entre ton chiffre de la semaine. On te dit ce que FOREAS pèse dessus — pas ce que tu
            vas gagner : ça, personne ne peut te le promettre honnêtement aujourd’hui.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Input side */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-b from-[#12121a] to-[#0a0a10] rounded-2xl border border-white/10 p-6 md:p-8"
          >
            <h3 className="text-white font-semibold mb-6">Ta situation actuelle</h3>

            {/* Hours per week */}
            <div className="mb-6">
              <label className="flex justify-between text-sm text-white/60 mb-3">
                <span>Heures par semaine</span>
                <span className="text-white font-medium">{hoursPerWeek}h</span>
              </label>
              <input
                type="range"
                min="20"
                max="70"
                value={hoursPerWeek}
                onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-5
                  [&::-webkit-slider-thumb]:h-5
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-accent-cyan
                  [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-webkit-slider-thumb]:shadow-lg
                  [&::-webkit-slider-thumb]:shadow-accent-cyan/30"
              />
              <div className="flex justify-between text-xs text-white/50 mt-1">
                <span>20h</span>
                <span>70h</span>
              </div>
            </div>

            {/* Current earnings */}
            <div className="mb-6">
              <label className="flex justify-between text-sm text-white/60 mb-3">
                <span>CA hebdomadaire actuel</span>
                <span className="text-white font-medium">{currentEarnings}€</span>
              </label>
              <input
                type="range"
                min="400"
                max="2000"
                step="50"
                value={currentEarnings}
                onChange={(e) => setCurrentEarnings(Number(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-5
                  [&::-webkit-slider-thumb]:h-5
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-accent-purple
                  [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-webkit-slider-thumb]:shadow-lg
                  [&::-webkit-slider-thumb]:shadow-accent-purple/30"
              />
              <div className="flex justify-between text-xs text-white/50 mt-1">
                <span>400€</span>
                <span>2000€</span>
              </div>
            </div>

            {/* Apps used — 3 plateformes, jamais une de plus que ce que la base a vu. */}
            <div>
              <label className="text-sm text-white/60 mb-3 block">Applications utilisées</label>
              <div className="flex flex-wrap gap-2">
                {appOptions.map(app => (
                  <button
                    key={app.id}
                    onClick={() => toggleApp(app.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      apps.includes(app.id)
                        ? 'bg-white/10 text-white border border-white/20'
                        : 'bg-white/5 text-white/60 border border-transparent hover:border-white/10'
                    }`}
                  >
                    {app.name}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Results side */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            {/* Carte principale — le nombre géant n'est plus un gain projeté (invérifiable) mais
                le poids réel de l'abonnement sur SON chiffre : deux nombres, une division. */}
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-accent-purple to-accent-cyan rounded-2xl blur-lg opacity-30" />
              <div className="relative bg-gradient-to-br from-accent-purple/20 to-accent-cyan/20 rounded-2xl border border-white/10 p-6 md:p-8">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-white/60 text-sm">Ce que FOREAS pèse</span>
                  <span className="text-green-400 text-sm font-medium">prix réel</span>
                </div>

                <div className="flex items-end gap-2 mb-2">
                  <span className="font-title text-5xl md:text-6xl font-bold text-white">
                    {results.partDuChiffre}
                  </span>
                  <span className="text-2xl text-white/60 mb-2">%</span>
                  <span className="text-white/60 mb-2">de ton chiffre</span>
                </div>

                <p className="text-accent-cyan font-medium">
                  {formaterEuros(PRIX_MENSUEL_CENTIMES)} par mois, sur{' '}
                  {results.chiffreMensuel.toLocaleString('fr-FR')} € de chiffre mensuel
                </p>
              </div>
            </div>

            {/* Honnêteté : on dit d'où vient chaque nombre, et pourquoi le gain n'est pas là. */}
            <p className="text-white/40 text-xs leading-relaxed">
              Le seul chiffre qui vient de nous ici, c’est le prix. Le reste, c’est le tien.
              Ce que FOREAS te fera gagner, on ne l’affiche pas : on ne l’a pas encore mesuré sur
              assez de chauffeurs, et un gain qu’on ne peut pas prouver n’a rien à faire sur une
              page qui te demande ta carte.
            </p>

            {/* Grille — 4 façons de lire le MÊME prix. Aucune ne dépend d'une hypothèse : les
                trois premières sont le prix divisé, la dernière est le prix annuel du canon. */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/[0.03] rounded-xl border border-white/5 p-4">
                <p className="text-white/60 text-xs mb-1">Par mois</p>
                <p className="text-white font-bold text-xl">{formaterEuros(PRIX_MENSUEL_CENTIMES)}</p>
              </div>
              <div className="bg-white/[0.03] rounded-xl border border-white/5 p-4">
                <p className="text-white/60 text-xs mb-1">Par jour</p>
                <p className="text-white font-bold text-xl">{results.coutParJour} €</p>
              </div>
              <div className="bg-white/[0.03] rounded-xl border border-white/5 p-4">
                <p className="text-white/60 text-xs mb-1">Par heure au volant</p>
                <p className="text-white font-bold text-xl">{results.coutParHeure} €</p>
              </div>
              <div className="bg-white/[0.03] rounded-xl border border-white/5 p-4">
                <p className="text-white/60 text-xs mb-1">À l’année</p>
                <p className="text-white font-bold text-xl">{formaterEuros(PRIX_ANNUEL_CENTIMES)}</p>
              </div>
            </div>

            {/* Le bloc vert ne porte plus un ROI (un gain chiffré déguisé en pourcentage) mais
                les conditions exactes de l'essai — la carte EST demandée, on l'écrit. */}
            <div className="bg-green-500/10 rounded-xl border border-green-500/20 p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <p className="text-green-400 font-medium">{ESSAI_JOURS} jours d’essai · 0 € débité</p>
                <p className="text-white/50 text-sm">
                  Carte demandée à l’inscription. Tu annules en un clic avant la fin, tu n’es pas débité.
                </p>
              </div>
            </div>

            {/* CTA */}
            <a
              href="/tarifs2"
              className="block w-full py-4 bg-gradient-to-r from-accent-purple to-accent-cyan rounded-xl text-white font-semibold text-center hover:opacity-90 transition-opacity"
            >
              Tester FOREAS {ESSAI_JOURS} jours, 0€ →
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

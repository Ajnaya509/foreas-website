'use client'

import { motion } from 'framer-motion'
import { useState, useMemo } from 'react'

export default function RevenueSimulator() {
  const [hoursPerWeek, setHoursPerWeek] = useState(40)
  const [currentEarnings, setCurrentEarnings] = useState(800)
  const [apps, setApps] = useState<string[]>(['uber'])

  const appOptions = [
    { id: 'uber', name: 'Uber', color: 'bg-black' },
    { id: 'bolt', name: 'Bolt', color: 'bg-green-500' },
    { id: 'heetch', name: 'Heetch', color: 'bg-purple-500' },
    { id: 'freenow', name: 'FREE NOW', color: 'bg-red-500' },
  ]

  const results = useMemo(() => {
    const weeklyGain = currentEarnings * 0.35
    const monthlyGain = weeklyGain * 4
    const yearlyGain = weeklyGain * 52
    const newWeekly = currentEarnings + weeklyGain
    const hourlyBefore = currentEarnings / hoursPerWeek
    const hourlyAfter = newWeekly / hoursPerWeek
    const timeSaved = hoursPerWeek * 0.15 // 15% time saved

    return {
      weeklyGain: Math.round(weeklyGain),
      monthlyGain: Math.round(monthlyGain),
      yearlyGain: Math.round(yearlyGain),
      newWeekly: Math.round(newWeekly),
      hourlyBefore: hourlyBefore.toFixed(2),
      hourlyAfter: hourlyAfter.toFixed(2),
      timeSaved: Math.round(timeSaved),
      roi: Math.round((weeklyGain / 12.97) * 100) // ROI vs subscription cost
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-accent-cyan/[0.03] rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-title text-3xl md:text-5xl text-white mb-4">
            Simulez vos <span className="text-accent-cyan">gains</span>
          </h2>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            Entrez vos données actuelles et découvrez ce que FOREAS peut vous rapporter.
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
            <h3 className="text-white font-semibold mb-6">Votre situation actuelle</h3>

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

            {/* Apps used */}
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
            {/* Main result card */}
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-accent-purple to-accent-cyan rounded-2xl blur-lg opacity-30" />
              <div className="relative bg-gradient-to-br from-accent-purple/20 to-accent-cyan/20 rounded-2xl border border-white/10 p-6 md:p-8">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-white/60 text-sm">Avec FOREAS, vous gagneriez</span>
                  <span className="text-green-400 text-sm font-medium">+35%</span>
                </div>

                <div className="flex items-end gap-2 mb-2">
                  <span className="font-title text-5xl md:text-6xl font-bold text-white">
                    {results.newWeekly}
                  </span>
                  <span className="text-2xl text-white/60 mb-2">€</span>
                  <span className="text-white/60 mb-2">/semaine</span>
                </div>

                <p className="text-accent-cyan font-medium">
                  +{results.weeklyGain}€ de plus chaque semaine
                </p>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/[0.03] rounded-xl border border-white/5 p-4">
                <p className="text-white/60 text-xs mb-1">Gain mensuel</p>
                <p className="text-white font-bold text-xl">+{results.monthlyGain}€</p>
              </div>
              <div className="bg-white/[0.03] rounded-xl border border-white/5 p-4">
                <p className="text-white/60 text-xs mb-1">Gain annuel</p>
                <p className="text-white font-bold text-xl">+{results.yearlyGain}€</p>
              </div>
              <div className="bg-white/[0.03] rounded-xl border border-white/5 p-4">
                <p className="text-white/60 text-xs mb-1">Taux horaire</p>
                <p className="text-white font-bold text-xl">
                  <span className="text-white/60 line-through text-sm mr-2">{results.hourlyBefore}€</span>
                  {results.hourlyAfter}€
                </p>
              </div>
              <div className="bg-white/[0.03] rounded-xl border border-white/5 p-4">
                <p className="text-white/60 text-xs mb-1">Temps économisé</p>
                <p className="text-white font-bold text-xl">{results.timeSaved}h/sem</p>
              </div>
            </div>

            {/* ROI callout */}
            <div className="bg-green-500/10 rounded-xl border border-green-500/20 p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <p className="text-green-400 font-medium">ROI : {results.roi}%</p>
                <p className="text-white/50 text-sm">L'abonnement (12,97€) se rembourse en ~1 course</p>
              </div>
            </div>

            {/* CTA */}
            <a
              href="/tarifs"
              className="block w-full py-4 bg-gradient-to-r from-accent-purple to-accent-cyan rounded-xl text-white font-semibold text-center hover:opacity-90 transition-opacity"
            >
              Obtenir ces résultats →
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

'use client'

import { motion } from 'framer-motion'

/* ─── Mock Data (sera remplacé par Supabase queries) ─────────── */
const MOCK_STATS = {
  netPerHour: { current: 24.80, previous: 21.50, trend: '+15.3%' },
  totalWeek: { current: 1240, previous: 1080 },
  hoursWorked: { current: 50, previous: 52 },
  coursesCount: { current: 67, previous: 58 },
  kmVide: { current: 12, previous: 18, trend: '-33%' },
  scoreAjnaya: 82,
}

const MOCK_DAILY = [
  { day: 'Lun', net: 185, hours: 8 },
  { day: 'Mar', net: 220, hours: 9 },
  { day: 'Mer', net: 165, hours: 7 },
  { day: 'Jeu', net: 240, hours: 9.5 },
  { day: 'Ven', net: 280, hours: 10 },
  { day: 'Sam', net: 150, hours: 6.5 },
  { day: 'Dim', net: 0, hours: 0 },
]

const MOCK_RECOMMENDATION = {
  title: 'Optimise ton mardi matin',
  description: 'Tes données montrent que le mardi entre 7h30 et 10h, la zone Gare du Nord génère +28% de net/heure vs ta zone habituelle.',
  action: 'Positionne-toi Gare du Nord mardi à 7h30',
  impact: '+28% net/h estimé',
}

/* ─── KPI Card Component ──────────────────────────────────────── */
function KPICard({ label, value, unit, trend, trendColor, delay }: {
  label: string; value: string; unit?: string; trend?: string; trendColor?: string; delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay || 0 }}
      className="bg-[#0a0a12] border border-white/[0.06] rounded-2xl p-5 hover:border-white/[0.1] transition-colors"
    >
      <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-3">{label}</p>
      <div className="flex items-baseline gap-1.5">
        <span className="text-white text-2xl font-bold tabular-nums">{value}</span>
        {unit && <span className="text-white/30 text-sm">{unit}</span>}
      </div>
      {trend && (
        <div className="mt-2 flex items-center gap-1.5">
          <span className={`text-xs font-semibold ${trendColor || 'text-accent-cyan'}`}>{trend}</span>
          <span className="text-white/20 text-xs">vs semaine dernière</span>
        </div>
      )}
    </motion.div>
  )
}

/* ─── Simple Bar Chart ────────────────────────────────────────── */
function WeeklyBarChart() {
  const maxNet = Math.max(...MOCK_DAILY.map(d => d.net))
  return (
    <div className="flex items-end gap-2 h-40">
      {MOCK_DAILY.map((d, i) => (
        <motion.div
          key={d.day}
          initial={{ height: 0 }}
          animate={{ height: `${(d.net / maxNet) * 100}%` }}
          transition={{ duration: 0.5, delay: i * 0.05 }}
          className="flex-1 flex flex-col items-center gap-2"
        >
          <span className="text-white/50 text-[10px] tabular-nums">{d.net > 0 ? `${d.net}€` : ''}</span>
          <div
            className="w-full rounded-t-lg bg-gradient-to-t from-accent-cyan/60 to-accent-cyan/20 min-h-[2px]"
            style={{ height: `${Math.max((d.net / maxNet) * 100, 2)}%` }}
          />
          <span className="text-white/30 text-xs mt-1">{d.day}</span>
        </motion.div>
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
 *  DRIVER PERFORMANCE HUB
 * ═══════════════════════════════════════════════════════════════ */
export default function DriverDashboard() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-white text-2xl md:text-3xl font-bold">Performance</h1>
        <p className="text-white/40 text-sm mt-1">Semaine du 10 au 16 février 2026</p>
      </motion.div>

      {/* ═══ KPI GRID ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Net / heure"
          value={`${MOCK_STATS.netPerHour.current.toFixed(2)}€`}
          trend={MOCK_STATS.netPerHour.trend}
          trendColor="text-accent-cyan"
          delay={0}
        />
        <KPICard
          label="Total semaine"
          value={`${MOCK_STATS.totalWeek.current}€`}
          trend={`+${Math.round(((MOCK_STATS.totalWeek.current - MOCK_STATS.totalWeek.previous) / MOCK_STATS.totalWeek.previous) * 100)}%`}
          trendColor="text-accent-cyan"
          delay={0.05}
        />
        <KPICard
          label="Courses"
          value={`${MOCK_STATS.coursesCount.current}`}
          trend={`+${MOCK_STATS.coursesCount.current - MOCK_STATS.coursesCount.previous}`}
          trendColor="text-accent-cyan"
          delay={0.1}
        />
        <KPICard
          label="Km à vide"
          value={`${MOCK_STATS.kmVide.current}%`}
          trend={MOCK_STATS.kmVide.trend}
          trendColor="text-green-400"
          delay={0.15}
        />
      </div>

      {/* ═══ TWO COLUMNS ═══ */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Weekly Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-3 bg-[#0a0a12] border border-white/[0.06] rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white font-semibold">Revenus cette semaine</h2>
            <span className="text-accent-cyan text-sm font-bold">{MOCK_STATS.totalWeek.current}€</span>
          </div>
          <WeeklyBarChart />
        </motion.div>

        {/* Ajnaya Score + Recommendation */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="lg:col-span-2 space-y-4"
        >
          {/* Score Ajnaya */}
          <div className="bg-[#0a0a12] border border-white/[0.06] rounded-2xl p-6">
            <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-4">Score Ajnaya</p>
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="3"
                  />
                  <motion.path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="url(#scoreGradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    initial={{ strokeDasharray: '0, 100' }}
                    animate={{ strokeDasharray: `${MOCK_STATS.scoreAjnaya}, 100` }}
                    transition={{ duration: 1, delay: 0.3 }}
                  />
                  <defs>
                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#00d4ff" />
                      <stop offset="100%" stopColor="#8C52FF" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white text-xl font-bold">{MOCK_STATS.scoreAjnaya}</span>
                </div>
              </div>
              <div>
                <p className="text-white text-sm font-medium">Très bon</p>
                <p className="text-white/30 text-xs mt-0.5">Top 18% de ta zone</p>
              </div>
            </div>
          </div>

          {/* Recommendation */}
          <div className="bg-gradient-to-br from-accent-cyan/[0.08] to-accent-purple/[0.05] border border-accent-cyan/20 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-accent-purple to-accent-cyan flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z" />
                </svg>
              </div>
              <span className="text-white/50 text-xs font-medium">Ajnaya recommande</span>
            </div>
            <h3 className="text-white font-semibold text-sm mb-2">{MOCK_RECOMMENDATION.title}</h3>
            <p className="text-white/40 text-xs leading-relaxed mb-4">{MOCK_RECOMMENDATION.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-accent-cyan font-bold text-sm">{MOCK_RECOMMENDATION.impact}</span>
              <button className="px-4 py-2 rounded-lg bg-accent-cyan/15 text-accent-cyan text-xs font-semibold hover:bg-accent-cyan/25 transition-colors">
                Voir le détail
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ═══ HOURS BREAKDOWN ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-[#0a0a12] border border-white/[0.06] rounded-2xl p-6"
      >
        <h2 className="text-white font-semibold mb-5">Répartition du temps</h2>
        <div className="flex gap-2 h-6 rounded-full overflow-hidden mb-4">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '58%' }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="bg-accent-cyan/60 rounded-l-full"
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '12%' }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="bg-accent-purple/60"
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '18%' }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="bg-orange-500/50"
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '12%' }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="bg-white/10 rounded-r-full"
          />
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-accent-cyan/60" />
            <span className="text-white/50 text-xs">En course — 58%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-accent-purple/60" />
            <span className="text-white/50 text-xs">Retour à vide — 12%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-orange-500/50" />
            <span className="text-white/50 text-xs">Attente — 18%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-white/10" />
            <span className="text-white/50 text-xs">Pause — 12%</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

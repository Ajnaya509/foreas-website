'use client'

import { motion } from 'framer-motion'

/* ─── Mock Data (sera remplacé par Supabase queries) ─────────── */
const MOCK_FLEET = {
  totalDrivers: 34,
  activeNow: 22,
  inactiveToday: 8,
  onBreak: 4,
  fleetScore: 76,
  totalRevenue: 42800,
  avgNetPerHour: 22.40,
}

const MOCK_DRIVERS = [
  { id: 1, name: 'Binate K.', status: 'active', zone: 'République', netH: 28.50, score: 92, lastSeen: 'En course' },
  { id: 2, name: 'Kitenge M.', status: 'active', zone: 'Gare du Nord', netH: 25.20, score: 85, lastSeen: 'En course' },
  { id: 3, name: 'Haitham R.', status: 'active', zone: 'La Défense', netH: 23.80, score: 78, lastSeen: 'En attente' },
  { id: 4, name: 'Nikolic D.', status: 'active', zone: 'Bastille', netH: 22.10, score: 74, lastSeen: 'En course' },
  { id: 5, name: 'Hadietou S.', status: 'break', zone: '—', netH: 21.50, score: 70, lastSeen: 'Pause' },
  { id: 6, name: 'Dragan P.', status: 'inactive', zone: '—', netH: 19.80, score: 65, lastSeen: 'Hors ligne' },
  { id: 7, name: 'Moussa T.', status: 'active', zone: 'Châtelet', netH: 26.30, score: 88, lastSeen: 'En course' },
  { id: 8, name: 'Youssef A.', status: 'active', zone: 'Opéra', netH: 24.70, score: 81, lastSeen: 'En attente' },
]

const MOCK_ANNONCES = [
  { id: 1, title: 'Événement PSG samedi — zone Parc des Princes recommandée', date: '14 fév', views: 28, status: 'active' },
  { id: 2, title: 'Nouvelle grille tarifaire Uber — impact estimé', date: '12 fév', views: 34, status: 'active' },
  { id: 3, title: 'Maintenance véhicules — rappel contrôle technique', date: '8 fév', views: 31, status: 'expired' },
]

/* ─── Status Badge ────────────────────────────────────────────── */
function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'bg-green-400',
    break: 'bg-orange-400',
    inactive: 'bg-white/20',
  }
  return (
    <span className={`w-2 h-2 rounded-full ${colors[status] || 'bg-white/20'}`} />
  )
}

/* ═══════════════════════════════════════════════════════════════
 *  PARTNER FLEET DASHBOARD
 * ═══════════════════════════════════════════════════════════════ */
export default function PartnerDashboard() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-white text-2xl md:text-3xl font-bold">Ma flotte</h1>
        <p className="text-white/40 text-sm mt-1">Vue d&apos;ensemble — Février 2026</p>
      </motion.div>

      {/* ═══ KPI GRID ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-[#0a0a12] border border-white/[0.06] rounded-2xl p-5"
        >
          <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-3">Chauffeurs actifs</p>
          <div className="flex items-baseline gap-2">
            <span className="text-white text-3xl font-bold">{MOCK_FLEET.activeNow}</span>
            <span className="text-white/30 text-sm">/ {MOCK_FLEET.totalDrivers}</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400/70 text-xs">en ligne maintenant</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="bg-[#0a0a12] border border-white/[0.06] rounded-2xl p-5"
        >
          <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-3">CA flotte (mois)</p>
          <span className="text-white text-2xl font-bold">{MOCK_FLEET.totalRevenue.toLocaleString('fr-FR')}€</span>
          <div className="mt-2">
            <span className="text-accent-cyan text-xs font-semibold">+12% vs mois dernier</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-[#0a0a12] border border-white/[0.06] rounded-2xl p-5"
        >
          <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-3">Net/h moyen</p>
          <span className="text-white text-2xl font-bold">{MOCK_FLEET.avgNetPerHour}€</span>
          <div className="mt-2">
            <span className="text-white/30 text-xs">Benchmark marché : 19.50€</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="bg-[#0a0a12] border border-white/[0.06] rounded-2xl p-5"
        >
          <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-3">Score flotte</p>
          <div className="flex items-baseline gap-2">
            <span className="text-white text-3xl font-bold">{MOCK_FLEET.fleetScore}</span>
            <span className="text-white/30 text-sm">/100</span>
          </div>
          <div className="mt-2 w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${MOCK_FLEET.fleetScore}%` }}
              transition={{ duration: 1, delay: 0.3 }}
              className="h-full bg-gradient-to-r from-accent-cyan to-accent-purple rounded-full"
            />
          </div>
        </motion.div>
      </div>

      {/* ═══ DRIVERS TABLE ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-[#0a0a12] border border-white/[0.06] rounded-2xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <h2 className="text-white font-semibold">Chauffeurs</h2>
          <button className="px-4 py-2 rounded-lg bg-accent-purple/15 text-accent-purple text-xs font-semibold hover:bg-accent-purple/25 transition-colors">
            + Ajouter un chauffeur
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.04]">
                <th className="text-left px-6 py-3 text-white/30 text-xs font-medium uppercase tracking-wider">Chauffeur</th>
                <th className="text-left px-4 py-3 text-white/30 text-xs font-medium uppercase tracking-wider">Statut</th>
                <th className="text-left px-4 py-3 text-white/30 text-xs font-medium uppercase tracking-wider hidden md:table-cell">Zone</th>
                <th className="text-right px-4 py-3 text-white/30 text-xs font-medium uppercase tracking-wider">Net/h</th>
                <th className="text-right px-6 py-3 text-white/30 text-xs font-medium uppercase tracking-wider hidden md:table-cell">Score</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_DRIVERS.map((driver, i) => (
                <motion.tr
                  key={driver.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 + i * 0.03 }}
                  className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors cursor-pointer"
                >
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-purple/40 to-accent-cyan/40 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{driver.name[0]}</span>
                      </div>
                      <span className="text-white text-sm font-medium">{driver.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <StatusDot status={driver.status} />
                      <span className="text-white/50 text-sm">{driver.lastSeen}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <span className="text-white/40 text-sm">{driver.zone}</span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <span className="text-white text-sm font-medium tabular-nums">{driver.netH.toFixed(2)}€</span>
                  </td>
                  <td className="px-6 py-3.5 text-right hidden md:table-cell">
                    <span className={`text-sm font-semibold tabular-nums ${
                      driver.score >= 80 ? 'text-accent-cyan' : driver.score >= 60 ? 'text-orange-400' : 'text-red-400'
                    }`}>
                      {driver.score}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ═══ ANNONCES ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-[#0a0a12] border border-white/[0.06] rounded-2xl"
      >
        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <h2 className="text-white font-semibold">Annonces récentes</h2>
          <button className="px-4 py-2 rounded-lg bg-accent-cyan/15 text-accent-cyan text-xs font-semibold hover:bg-accent-cyan/25 transition-colors">
            + Nouvelle annonce
          </button>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {MOCK_ANNONCES.map((annonce) => (
            <div key={annonce.id} className="px-6 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors cursor-pointer">
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{annonce.title}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-white/30 text-xs">{annonce.date}</span>
                  <span className="text-white/20 text-xs">•</span>
                  <span className="text-white/30 text-xs">{annonce.views} vues</span>
                </div>
              </div>
              <span className={`ml-4 px-2.5 py-1 rounded-md text-xs font-medium ${
                annonce.status === 'active'
                  ? 'bg-green-400/10 text-green-400'
                  : 'bg-white/[0.04] text-white/30'
              }`}>
                {annonce.status === 'active' ? 'Active' : 'Expirée'}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'

/* ─── Mock Data ───────────────────────────────────────────────── */
const MOCK_PLATFORM = {
  totalDrivers: 847,
  activeToday: 312,
  totalPartners: 24,
  monthlyRevenue: 156800,
  mrr: 11200,
  churnRate: 3.2,
  dataPoints: 2_400_000,
  avgScore: 74,
}

const MOCK_USERS = [
  { id: 1, name: 'Binate K.', email: 'binate@email.com', role: 'driver', status: 'active', plan: 'Pro', lastActive: 'Il y a 2h', permissions: ['dashboard', 'analytics', 'finances'] },
  { id: 2, name: 'TransVTC Paris', email: 'admin@transvtc.fr', role: 'partner', status: 'active', plan: 'Fleet 40', lastActive: 'Il y a 30min', permissions: ['fleet', 'annonces', 'recrutement', 'facturation'] },
  { id: 3, name: 'Kitenge M.', email: 'kitenge@email.com', role: 'driver', status: 'active', plan: 'Standard', lastActive: 'Il y a 1h', permissions: ['dashboard', 'finances'] },
  { id: 4, name: 'FleetMax IDF', email: 'contact@fleetmax.fr', role: 'partner', status: 'active', plan: 'Fleet 25', lastActive: 'Hier', permissions: ['fleet', 'annonces'] },
  { id: 5, name: 'Haitham R.', email: 'haitham@email.com', role: 'driver', status: 'suspended', plan: 'Pro', lastActive: 'Il y a 5j', permissions: ['dashboard'] },
  { id: 6, name: 'Nikolic D.', email: 'nikolic@email.com', role: 'driver', status: 'trial', plan: 'Trial', lastActive: 'Il y a 3h', permissions: ['dashboard'] },
]

const ALL_PERMISSIONS = [
  { key: 'dashboard', label: 'Dashboard', desc: 'Accès au hub de performance' },
  { key: 'analytics', label: 'Analytics', desc: 'Heatmaps, benchmarking, patterns' },
  { key: 'finances', label: 'Finances', desc: 'Historique paiements, export comptable' },
  { key: 'predictions', label: 'Prédictions', desc: 'Calendrier prédictif, créneaux recommandés' },
  { key: 'fleet', label: 'Vue Flotte', desc: 'Gestion chauffeurs, localisation' },
  { key: 'annonces', label: 'Annonces', desc: 'Publication et gestion des annonces' },
  { key: 'recrutement', label: 'Recrutement', desc: 'Ajout chauffeurs, onboarding' },
  { key: 'facturation', label: 'Facturation', desc: 'Factures, abonnement flotte' },
  { key: 'ads', label: 'Ads Communauté', desc: 'Publicité dans la section communauté' },
  { key: 'api', label: 'API Access', desc: 'Accès API data pour intégrations' },
  { key: 'licensing', label: 'Licensing Preview', desc: 'Aperçu données anonymisées licensing' },
  { key: 'admin', label: 'Admin', desc: 'Accès total, gestion des accès' },
]

/* ─── Status Badge ────────────────────────────────────────────── */
function UserStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-green-400/10 text-green-400',
    suspended: 'bg-red-400/10 text-red-400',
    trial: 'bg-orange-400/10 text-orange-400',
    inactive: 'bg-white/[0.04] text-white/30',
  }
  const labels: Record<string, string> = {
    active: 'Actif',
    suspended: 'Suspendu',
    trial: 'Essai',
    inactive: 'Inactif',
  }
  return (
    <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${styles[status] || styles.inactive}`}>
      {labels[status] || status}
    </span>
  )
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
      role === 'admin' ? 'bg-red-500/15 text-red-400' :
      role === 'partner' ? 'bg-accent-purple/15 text-accent-purple' :
      'bg-accent-cyan/15 text-accent-cyan'
    }`}>
      {role}
    </span>
  )
}

/* ═══════════════════════════════════════════════════════════════
 *  ADMIN DASHBOARD
 * ═══════════════════════════════════════════════════════════════ */
export default function AdminDashboard() {
  const [selectedUser, setSelectedUser] = useState<typeof MOCK_USERS[0] | null>(null)
  const [editingPermissions, setEditingPermissions] = useState<string[]>([])

  const openPermissions = (user: typeof MOCK_USERS[0]) => {
    setSelectedUser(user)
    setEditingPermissions([...user.permissions])
  }

  const togglePermission = (key: string) => {
    setEditingPermissions(prev =>
      prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between flex-wrap gap-4"
      >
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-white text-2xl md:text-3xl font-bold">Admin</h1>
            <span className="px-2.5 py-1 rounded-lg bg-red-500/15 border border-red-500/20 text-red-400 text-xs font-bold uppercase">Super Admin</span>
          </div>
          <p className="text-white/40 text-sm mt-1">Contrôle total — FOREAS Platform</p>
        </div>
      </motion.div>

      {/* ═══ PLATFORM KPIs ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Chauffeurs total', value: MOCK_PLATFORM.totalDrivers.toLocaleString(), sub: `${MOCK_PLATFORM.activeToday} actifs aujourd'hui`, color: 'text-accent-cyan' },
          { label: 'Partenaires', value: MOCK_PLATFORM.totalPartners.toString(), sub: 'flottes actives', color: 'text-accent-purple' },
          { label: 'MRR', value: `${(MOCK_PLATFORM.mrr / 1000).toFixed(1)}K€`, sub: `Churn: ${MOCK_PLATFORM.churnRate}%`, color: 'text-green-400' },
          { label: 'Data points (mois)', value: `${(MOCK_PLATFORM.dataPoints / 1_000_000).toFixed(1)}M`, sub: 'Licensing-ready', color: 'text-orange-400' },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.05 }}
            className="bg-[#0a0a12] border border-white/[0.06] rounded-2xl p-5"
          >
            <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-3">{kpi.label}</p>
            <span className="text-white text-2xl font-bold">{kpi.value}</span>
            <p className={`mt-2 text-xs ${kpi.color}`}>{kpi.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* ═══ USER MANAGEMENT TABLE ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-[#0a0a12] border border-white/[0.06] rounded-2xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-white font-semibold">Gestion des accès</h2>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Rechercher..."
              className="px-3 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-accent-cyan/30 w-48"
            />
            <button className="px-4 py-1.5 rounded-lg bg-accent-cyan/15 text-accent-cyan text-xs font-semibold hover:bg-accent-cyan/25 transition-colors">
              + Créer un accès
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.04]">
                <th className="text-left px-6 py-3 text-white/30 text-xs font-medium uppercase tracking-wider">Utilisateur</th>
                <th className="text-left px-4 py-3 text-white/30 text-xs font-medium uppercase tracking-wider">Rôle</th>
                <th className="text-left px-4 py-3 text-white/30 text-xs font-medium uppercase tracking-wider hidden md:table-cell">Statut</th>
                <th className="text-left px-4 py-3 text-white/30 text-xs font-medium uppercase tracking-wider hidden lg:table-cell">Permissions</th>
                <th className="text-left px-4 py-3 text-white/30 text-xs font-medium uppercase tracking-wider hidden md:table-cell">Dernière activité</th>
                <th className="text-right px-6 py-3 text-white/30 text-xs font-medium uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_USERS.map((user, i) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 + i * 0.03 }}
                  className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-6 py-3.5">
                    <div>
                      <p className="text-white text-sm font-medium">{user.name}</p>
                      <p className="text-white/30 text-xs">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <UserStatusBadge status={user.status} />
                  </td>
                  <td className="px-4 py-3.5 hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {user.permissions.slice(0, 3).map(p => (
                        <span key={p} className="px-1.5 py-0.5 rounded bg-white/[0.04] text-white/40 text-[10px]">{p}</span>
                      ))}
                      {user.permissions.length > 3 && (
                        <span className="px-1.5 py-0.5 rounded bg-white/[0.04] text-white/30 text-[10px]">+{user.permissions.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <span className="text-white/30 text-xs">{user.lastActive}</span>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <button
                      onClick={() => openPermissions(user)}
                      className="px-3 py-1.5 rounded-lg bg-white/[0.04] text-white/50 text-xs font-medium hover:bg-white/[0.08] hover:text-white/70 transition-colors"
                    >
                      Permissions
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ═══ PERMISSION EDITOR MODAL ═══ */}
      {selectedUser && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedUser(null)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="bg-[#0d0d15] border border-white/[0.08] rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-white/[0.06]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold text-lg">{selectedUser.name}</h3>
                  <p className="text-white/30 text-xs mt-0.5">{selectedUser.email}</p>
                </div>
                <RoleBadge role={selectedUser.role} />
              </div>
            </div>

            <div className="px-6 py-5 space-y-3">
              <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-4">Permissions granulaires</p>
              {ALL_PERMISSIONS.map((perm) => (
                <label
                  key={perm.key}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    editingPermissions.includes(perm.key)
                      ? 'bg-accent-cyan/[0.06] border-accent-cyan/20'
                      : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.1]'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${editingPermissions.includes(perm.key) ? 'text-white' : 'text-white/50'}`}>
                      {perm.label}
                    </p>
                    <p className="text-white/25 text-xs mt-0.5">{perm.desc}</p>
                  </div>
                  <div className="ml-4">
                    <div
                      onClick={() => togglePermission(perm.key)}
                      className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${
                        editingPermissions.includes(perm.key) ? 'bg-accent-cyan' : 'bg-white/10'
                      }`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        editingPermissions.includes(perm.key) ? 'translate-x-5' : 'translate-x-1'
                      }`} />
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <div className="px-6 py-4 border-t border-white/[0.06] flex justify-between">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 rounded-lg text-white/40 hover:text-white/60 text-sm transition-colors"
              >
                Annuler
              </button>
              <div className="flex gap-2">
                <button className="px-4 py-2 rounded-lg bg-red-500/15 text-red-400 text-sm font-medium hover:bg-red-500/25 transition-colors">
                  Suspendre
                </button>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="px-5 py-2 rounded-lg bg-accent-cyan text-white text-sm font-semibold hover:bg-accent-cyan/90 transition-colors"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

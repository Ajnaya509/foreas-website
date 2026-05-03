'use client'

import { motion } from 'framer-motion'
import { ArrowRight, MessageCircle, MapPin } from 'lucide-react'
import { buildWAUrl } from '@/lib/whatsappLink'
import type { SarcasmLevel } from '@/lib/sarcasticVisits'

interface ZoneStats {
  zone_match: string
  avg_hourly: number
  demand_delta_pct: number
  top_pool: string
  courses_count: number
  week_iso: string
  last_updated: string
  has_data: boolean
  fallback_zone?: { name: string; avg_hourly: number }
}

interface ZoneSearchResultCardProps {
  stats: ZoneStats
  sarcasmLevel: SarcasmLevel
  onWhatsAppClick?: () => void
}

/**
 * ZoneSearchResultCard — affiche le résultat d'une search zone.
 *
 * Design system §11 : glass card mid (rgba 0.07) + border violet 0.30 + glow.
 * Copy-atomic §6.2 : L1 displayL chiffre roi + caption source honnête.
 * Sarcastic guard intégré : 3 niveaux selon le compteur de visites.
 */
export default function ZoneSearchResultCard({
  stats,
  sarcasmLevel,
  onWhatsAppClick,
}: ZoneSearchResultCardProps) {
  // ─── Cas FALLBACK : zone non trouvée → suggestion zone proche ────
  if (!stats.has_data) {
    const fallback = stats.fallback_zone
    const waUrl = buildWAUrl({ section: 'hero_zone', zone: stats.zone_match })

    return (
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-2xl p-6 sm:p-7 border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm relative overflow-hidden"
      >
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-4 h-4 text-orange-300" />
          <p
            className="text-orange-300/85 text-[10px] font-extrabold uppercase"
            style={{ letterSpacing: '0.28em' }}
          >
            DONNÉES PARTIELLES SUR CETTE ZONE
          </p>
        </div>
        <p className="text-[#F8FAFC] text-base sm:text-lg leading-relaxed mb-4">
          Nous n&apos;avons pas encore assez de données fiables sur{' '}
          <span className="font-semibold">{stats.zone_match}</span>. Ajnaya y travaille (la flotte grandit chaque jour).
        </p>
        {fallback && (
          <p className="text-white/65 text-sm leading-relaxed mb-5">
            En attendant, regardez{' '}
            <span className="text-[#F8FAFC] font-semibold">{fallback.name}</span> :{' '}
            <span className="tabular-nums text-cyan-300 font-semibold">
              {fallback.avg_hourly.toFixed(2).replace('.', ',')} €/h
            </span>{' '}
            cette semaine.
          </p>
        )}
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onWhatsAppClick}
          className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-bold transition-all bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white"
          style={{ boxShadow: '0 0 28px rgba(16,185,129,0.40)' }}
        >
          <MessageCircle className="w-4 h-4" />
          Demander à Ajnaya pour votre zone précise
          <ArrowRight className="w-4 h-4" />
        </a>
      </motion.div>
    )
  }

  // ─── Cas STANDARD : zone matchée avec data ──────────────────────
  const waUrl = buildWAUrl({
    section: 'hero_zone',
    zone: stats.zone_match,
    slot: 'pour ce soir',
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl p-6 sm:p-7 border border-violet-500/30 bg-gradient-to-b from-violet-900/15 to-black backdrop-blur-sm relative overflow-hidden"
      style={{ boxShadow: '0 0 60px rgba(140,82,255,0.18), inset 0 0 0 1px rgba(140,82,255,0.18)' }}
    >
      {/* Eyebrow zone */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-cyan-300" />
          <p
            className="text-[#00D4FF] text-[10px] font-extrabold uppercase"
            style={{ letterSpacing: '0.28em' }}
          >
            {stats.zone_match} · CE SOIR
          </p>
        </div>
        <p
          className="text-white/45 text-[10px] font-semibold uppercase tabular-nums"
          style={{ letterSpacing: '0.18em' }}
        >
          {stats.week_iso}
        </p>
      </div>

      {/* L1 — chiffre roi */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <div>
          <p className="text-white/50 text-[10px] uppercase mb-1" style={{ letterSpacing: '0.2em' }}>
            Tarif horaire moyen
          </p>
          <p
            className="text-3xl sm:text-4xl font-black tabular-nums bg-gradient-to-r from-violet-300 via-cyan-200 to-violet-300 bg-clip-text text-transparent"
            style={{ letterSpacing: '-0.045em' }}
          >
            {stats.avg_hourly.toFixed(2).replace('.', ',')} €/h
          </p>
        </div>
        <div>
          <p className="text-white/50 text-[10px] uppercase mb-1" style={{ letterSpacing: '0.2em' }}>
            Demande relative
          </p>
          <p className="text-2xl sm:text-3xl font-black tabular-nums text-green-400" style={{ letterSpacing: '-0.03em' }}>
            ▲ {stats.demand_delta_pct}%
            <span className="text-white/40 text-xs font-medium ml-1">vs lundi</span>
          </p>
        </div>
        <div>
          <p className="text-white/50 text-[10px] uppercase mb-1" style={{ letterSpacing: '0.2em' }}>
            Pool optimal
          </p>
          <p className="text-base font-semibold text-[#F8FAFC] leading-tight">{stats.top_pool}</p>
        </div>
      </div>

      {/* Caption source honnête */}
      <p className="text-white/45 text-xs mb-5 tabular-nums">
        Basé sur <span className="text-white/65 font-semibold">{stats.courses_count} courses</span> de la flotte FOREAS · semaine {stats.week_iso}
      </p>

      {/* Sarcastic guard intégré */}
      <SarcasticBlock level={sarcasmLevel} zoneName={stats.zone_match} />

      {/* CTA WhatsApp */}
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onWhatsAppClick}
        className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-bold transition-all bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white"
        style={{ boxShadow: '0 0 28px rgba(16,185,129,0.40)' }}
      >
        <MessageCircle className="w-4 h-4" />
        {sarcasmLevel === 1
          ? 'Pour le tarif EXACT à votre créneau → Ajnaya WhatsApp'
          : sarcasmLevel === 2
          ? "Aller à Ajnaya — c'est gratuit"
          : 'Demander à Ajnaya (1 message, 0 inscription)'}
        <ArrowRight className="w-4 h-4" />
      </a>
    </motion.div>
  )
}

// ─── Bloc sarcasme intégré ──────────────────────────────────────────
function SarcasticBlock({ level, zoneName }: { level: SarcasmLevel; zoneName: string }) {
  if (level === 1) return null

  if (level === 2) {
    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        transition={{ duration: 0.4 }}
        className="mb-5 px-4 py-3 rounded-xl border border-violet-500/30 bg-violet-500/[0.08] overflow-hidden"
      >
        <p className="text-[#F8FAFC]/90 text-sm leading-relaxed">
          <span className="text-base mr-1">👀</span>
          <span className="font-semibold">Encore vous sur {zoneName} ?</span>{' '}
          Vous sentez bien que vous avez besoin du tarif exact. Ajnaya vous attend.
        </p>
      </motion.div>
    )
  }

  // level 3
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      transition={{ duration: 0.4 }}
      className="mb-5 px-4 py-3 rounded-xl border border-rose-500/25 bg-rose-500/[0.05] overflow-hidden"
      style={{ boxShadow: '0 0 24px rgba(255,102,153,0.10)' }}
    >
      <p className="text-[#F8FAFC]/90 text-sm leading-relaxed mb-1.5">
        <span className="text-base mr-1">🎯</span>
        <span className="font-semibold">Bon. Maintenant on rigole moins.</span>
      </p>
      <p className="text-white/70 text-sm leading-relaxed">
        Vous testez la techno depuis quelques jours. Si vous voulez le vrai chiffre — sur votre zone, votre créneau, votre statut — venez sur WhatsApp. C&apos;est là que la conversation commence.
      </p>
    </motion.div>
  )
}

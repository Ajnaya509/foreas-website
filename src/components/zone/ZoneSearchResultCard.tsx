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

// Réassurance sous chaque CTA WhatsApp (validée Chandler : ni "humain" ni "IA", juste ça).
function WaReassurance() {
  return <p className="mt-2 text-center text-[11px] text-white/45">Réponse en moins d&apos;1 min · gratuit</p>
}

/**
 * ZoneSearchResultCard — affiche le résultat d'une search zone.
 *
 * Design system §11 : glass card mid + border violet + glow.
 * Copy-atomic : tutoiement partout, chiffre roi UNIQUEMENT quand has_data (vraies courses).
 * ⚠️ Honnêteté (CNIL) : quand has_data=false on n'affiche AUCUN €/h (les fallbacks RPC sont
 *    des moyennes-type codées en dur — on ne les présente jamais comme un chiffre réel).
 */
export default function ZoneSearchResultCard({
  stats,
  sarcasmLevel,
  onWhatsAppClick,
}: ZoneSearchResultCardProps) {
  // ─── Cas SANS DONNÉES : on ne montre PAS de chiffre inventé → on bascule WhatsApp ────
  if (!stats.has_data) {
    const waUrl = buildWAUrl({ section: 'hero_zone', zone: stats.zone_match })

    return (
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-2xl p-6 sm:p-7 border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm relative overflow-hidden"
      >
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-4 h-4 text-cyan-300" />
          <p
            className="text-cyan-300/85 text-[10px] font-extrabold uppercase"
            style={{ letterSpacing: '0.28em' }}
          >
            {stats.zone_match} · EN DIRECT SUR WHATSAPP
          </p>
        </div>
        <p className="text-[#F8FAFC] text-base sm:text-lg leading-relaxed mb-2">
          <span className="font-semibold">{stats.zone_match}</span>, je ne la donne pas en public — elle bouge trop vite.
        </p>
        <p className="text-white/65 text-sm leading-relaxed mb-5">
          Mais Ajnaya la lit en direct. Demande-lui le chiffre de ta zone : elle te répond avec ce qu&apos;elle voit là, maintenant.
        </p>
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onWhatsAppClick}
          className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-bold transition-all bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white"
          style={{ boxShadow: '0 0 28px rgba(16,185,129,0.40)' }}
        >
          <MessageCircle className="w-4 h-4" />
          Demander le chiffre de {stats.zone_match} à Ajnaya
          <ArrowRight className="w-4 h-4" />
        </a>
        <WaReassurance />
      </motion.div>
    )
  }

  // ─── Cas AVEC DONNÉES RÉELLES (≥5 courses) : chiffre roi honnête ──────────────────
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
          ? 'Le chiffre exact pour ton créneau → WhatsApp'
          : sarcasmLevel === 2
          ? 'Aller à Ajnaya — c’est gratuit'
          : 'Demander à Ajnaya (1 message, 0 inscription)'}
        <ArrowRight className="w-4 h-4" />
      </a>
      <WaReassurance />
    </motion.div>
  )
}

// ─── Bloc sarcasme intégré (tutoiement) ─────────────────────────────────────
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
          <span className="font-semibold">Encore toi sur {zoneName} ?</span>{' '}
          Là, tu veux le vrai chiffre. Il est sur WhatsApp — 1 message.
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
        <span className="font-semibold">T&apos;as tout testé ici. La suite se passe en privé.</span>
      </p>
      <p className="text-white/70 text-sm leading-relaxed">
        Ta zone, ton créneau, ton statut : Ajnaya te fait le calcul complet. 1 message, 0 inscription.
      </p>
    </motion.div>
  )
}

'use client'

import { motion } from 'framer-motion'
import { ArrowRight, MessageCircle, MapPin } from 'lucide-react'
import { buildWAUrl } from '@/lib/whatsappLink'
import { ETIQUETTE_PROVENANCE, EXPLICATION_PROVENANCE, type Provenance } from '@/lib/provenance'
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
  /** D'où vient le chiffre — src/lib/provenance.ts. */
  provenance?: Provenance
  fallback_zone?: { name: string; avg_hourly: number }
}

interface ZoneSearchResultCardProps {
  stats: ZoneStats
  sarcasmLevel: SarcasmLevel
  onWhatsAppClick?: () => void
}

// Réassurance sous chaque CTA WhatsApp (validée Chandler : ni "humain" ni "IA", juste ça).
//
// CE QUI ÉTAIT FAUX — « Réponse en moins d'1 min », écrit sans réserve.
// Mesuré sur les vrais échanges WhatsApp (pieuvre_conversations, appariement
// inbound → premier outbound du même prospect) : 63 paires mesurables, médiane
// 30,9 s, mais seulement 47/63 = 74,6 % sous 60 s. Une réponse sur quatre
// dépassait la minute promise. « Souvent » dit exactement ce que la mesure
// montre — et une promesse tenue 3 fois sur 4 vaut mieux qu'une promesse
// démentie 1 fois sur 4 par le premier chauffeur qui essaie.
function WaReassurance() {
  return <p className="mt-2 text-center text-[11px] text-white/45">Souvent moins d&apos;une minute · gratuit</p>
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
            {/* 14/08/2026 — disait « EN DIRECT ». Même mesure que la réassurance
                ci-dessus : médiane 30,9 s mais 25 % des réponses au-delà d'une
                minute, et verite-commerciale.ts interdit « en direct ». */}
            {stats.zone_match} · RÉPONSE SUR WHATSAPP
          </p>
        </div>
        {/* CE QUI ÉTAIT FAUX — ce bloc disait « je ne la donne pas en public,
            elle bouge trop vite » puis « elle te répond avec ce qu'elle a vu
            passer là, à cette heure-ci ». Deux affirmations démenties par la
            même mesure : `select count(*) from pieuvre_rides where created_at
            >= now()-interval '7 days'` → 0, dernière course de toute la base le
            30/04/2026, et courses_count=0 sur les 5 zones testées en production.
            Rien n'est retenu par prudence : il n'y a rien à retenir, et rien
            n'a été « vu passer » à aucune heure. On le dit — c'est exactement
            ce que prévoit src/lib/provenance.ts, et c'est ce qui rend le
            chiffre croyable le jour où il arrive. */}
        <p className="text-[#F8FAFC] text-base sm:text-lg leading-relaxed mb-2">
          <span className="font-semibold">{stats.zone_match}</span> : pas encore assez de courses mesurées ici pour t&apos;annoncer un chiffre. On préfère te le dire.
        </p>
        <p className="text-white/65 text-sm leading-relaxed mb-5">
          Demande ta zone à Ajnaya : elle te dit ce qu&apos;elle sait, et ce qu&apos;elle ne sait pas encore.
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
          {/* 14/08/2026 — disait « Demander LE CHIFFRE de {zone} à Ajnaya ».
              Ce bouton ne s'affiche QUE quand has_data=false, c'est-à-dire quand
              il n'existe aucun chiffre mesuré (0 course sur 7 jours) : il
              promettait précisément ce que le paragraphe juste au-dessus vient
              de dire qu'on n'a pas. */}
          Demander {stats.zone_match} à Ajnaya
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
            {/* CE QUI ÉTAIT FAUX — « CE SOIR ». Faux par construction : la RPC
                get_zone_stats (source relue dans pg_proc.prosrc) agrège
                `where r.created_at >= now() - interval '7 days'` — une semaine,
                pas une soirée. La légende 40 lignes plus bas disait déjà
                « semaine {week_iso} » : le même bloc annonçait « ce soir » ET
                « semaine » pour le même chiffre. Branche dormante aujourd'hui
                (has_data=false partout) mais déployée : elle s'affiche dès la
                5ᵉ course dans une zone, donc elle se corrige maintenant. */}
            {stats.zone_match} · 7 DERNIERS JOURS
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
          {/*
            14/08/2026 — la moitié POSITIVE de la provenance. Cacher les chiffres
            inventés était nécessaire ; dire d'où vient un VRAI chiffre est ce qui le
            rend croyable. Un chauffeur à qui on annonce un tarif sans source se
            méfie — à juste titre, vu ce que ce site racontait jusqu'ici.
          */}
          <p
            className="mb-1.5 inline-flex items-center gap-1.5 text-[9px] font-extrabold uppercase text-green-400/80"
            style={{ letterSpacing: '0.16em' }}
            title={EXPLICATION_PROVENANCE[stats.provenance ?? 'mesuree']}
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400" aria-hidden />
            {ETIQUETTE_PROVENANCE[stats.provenance ?? 'mesuree']}
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
          {/* CE QUI ÉTAIT FAUX — l'étiquette « vs lundi ». La RPC calcule
              (courses des 24 dernières heures) / (moyenne quotidienne des 7
              derniers jours) − 100 — source SQL relue dans pg_proc. Lundi
              n'intervient nulle part dans le calcul : l'étiquette nommait une
              référence que le chiffre n'utilise pas. */}
          <p className="text-2xl sm:text-3xl font-black tabular-nums text-green-400" style={{ letterSpacing: '-0.03em' }}>
            ▲ {stats.demand_delta_pct}%
            <span className="text-white/40 text-xs font-medium ml-1">vs moyenne 7 jours</span>
          </p>
        </div>
        <div>
          <p className="text-white/50 text-[10px] uppercase mb-1" style={{ letterSpacing: '0.2em' }}>
            Pool optimal
          </p>
          <p className="text-base font-semibold text-[#F8FAFC] leading-tight">{stats.top_pool}</p>
        </div>
      </div>

      {/* Caption source honnête.
          14/08/2026 — disait « de la flotte FOREAS ». Mesure : drivers → 30
          inscrits, 9 marqués actifs, 0 actif sur 24 h (verite-commerciale.ts
          §1). Le mot « flotte » promet une échelle qui n'existe pas — et il
          affaiblit le chiffre au lieu de le renforcer : ce qui rend une moyenne
          crédible, c'est de dire où elle a été comptée, pas de qui. */}
      <p className="text-white/45 text-xs mb-5 tabular-nums">
        Basé sur <span className="text-white/65 font-semibold">{stats.courses_count} courses</span> enregistrées dans cette zone · semaine {stats.week_iso}
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

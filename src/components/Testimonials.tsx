'use client'

/**
 * ⚠️ 22/08/2026 — LES DONNÉES PERSONNELLES ONT ÉTÉ RETIRÉES DE CE FICHIER CLIENT.
 *
 * Mesuré sur la production : deux fichiers JavaScript de l'accueil (90 539 et
 * 13 485 octets) portaient les six noms. Le filtre `temoignagePubliable()`
 * s'exécute chez le visiteur, APRÈS le téléchargement : il cachait, il
 * n'empêchait pas d'envoyer.
 *
 * Nom, citation et ville vivent désormais dans `src/lib/consentements.prive.ts`,
 * marqué `server-only`. Le navigateur ne reçoit qu'une liste d'identifiants
 * autorisés — vide tant qu'aucun accord n'est signé.
 *
 * POUR RESTAURER une personne le jour où son accord est signé : ajouter son
 * identifiant à `TEMOIGNAGES_AUTORISES`, puis passer son nom et sa citation en
 * PROPRIÉTÉ depuis un composant serveur. Jamais en les réécrivant ici.
 */


import { motion, useInView } from 'framer-motion'
import { useRef, useState, useEffect, useCallback } from 'react'
import { useIsMobile } from '@/hooks/useDevicePerf'
import dynamic from 'next/dynamic'
// Le nombre de témoignages affiché vient du canon, pas d'un chiffre écrit à la main.
import { COMMUNAUTE_PHRASES } from '@/lib/verite-commerciale'
// ── 20/08/2026 — LES CITATIONS VIENNENT DU REGISTRE, PLUS DU FICHIER ────────
// Mesuré : la parole de la même personne existait en quatre versions dans trois
// fichiers. Chacune était un raccourci « pour que ça tienne » — et chacune faisait
// dire à quelqu'un ce qu'il n'a pas dit. Le texte vit maintenant dans
// src/lib/consentements.ts, et lui seul. Réécrire une citation ici est refusé par
// `npm run canon`.
import { temoignagePubliable } from '@/lib/consentements'

// Lazy load Mux Player — only loaded when user clicks play (saves ~200KB from critical path)
const MuxPlayer = dynamic(() => import('@mux/mux-player-react'), { ssr: false })

/* ─── Testimonial data ─────────────────────────────────────────
 * playbackId: Mux public playback ID
 * Pour ajouter une vidéo: upload sur Mux → copier le Playback ID → ajouter ici
 * Thumbnail auto-générée par Mux via: image.mux.com/{playbackId}/thumbnail.webp
 * ─────────────────────────────────────────────────────────────── */
interface Testimonial {
  /** L'identifiant dans le registre des accords. Sans lui, on ne peut pas
   *  demander la permission personne par personne. */
  registre: string
  id: number
  name: string
  city: string
  since: string
  stat: { value: string; label: string }
  quote: string
  playbackId: string
  accentColor: string
}

/* ─── CORRECTION 14/08/2026 — les badges et les citations reviennent à leur source
 *
 * CE QUI ÉTAIT FAUX : les six badges chiffrés et les six citations de ce carrousel
 * étaient écrits à la main, sans source, et superposés au visage de personnes
 * identifiables (vidéos Mux publiques). On leur faisait donc dire des phrases
 * qu'elles n'ont jamais prononcées et annoncer des gains que personne n'a mesurés.
 *
 * LES MESURES (base de production, 14/08/2026) :
 *   · select code, driver_name from pieuvre_closer_testimonials → 3 lignes SEULEMENT
 *     (binate_disneyland, zefi_zone_disney, demo_course). Aucune fiche Haitham,
 *     Nikolic, Hadietou ni Dragan : ni chiffre source, ni transcript, ni consentement.
 *   · select distinct platform from rides → Bolt, Heetch, Private, Uber (4, dont
 *     « Private » qui est une course directe, pas une plateforme). Jamais 7.
 *   · rides = 18 lignes au total, tous chauffeurs confondus, sans horodatage
 *     d'attente, sans charges, sans distance à vide : « -40 % temps mort »,
 *     « +22 % revenus nets » et « -35 % km à vide » ne sont pas seulement faux,
 *     ils sont STRUCTURELLEMENT incalculables avec les données existantes.
 *
 * LA RÈGLE QUI EN DÉCOULE, à ne pas défaire dans six mois : un badge chiffré ne
 * s'affiche ici que si (1) la base porte le chiffre ET (2) le chauffeur l'énonce
 * lui-même à l'écran. Un seul cas remplit les deux conditions aujourd'hui : Binaté
 * (pieuvre_closer_testimonials.revenue_increase_pct = 30.00, qu'il dit en vidéo).
 * Les cinq autres badges sont qualitatifs — et un badge qualitatif vrai vaut mieux
 * qu'un pourcentage rond que le premier chauffeur venu peut démentir.
 *
 * Les citations viennent désormais des propos filmés : key_quotes en base pour les
 * deux chauffeurs fichés, src/components/zone/testimonials.data.ts (source des
 * 6 témoignages vidéo, référencée par src/lib/verite-commerciale.ts) pour les autres.
 * Aucune n'est du copywriting.
 * ───────────────────────────────────────────────────────────────────────────────── */
const TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    // FAUX : affiché « Binate ». Base : driver_name = 'Binaté'.
    name: '',
    // FAUX : affiché « Paris ». Base : driver_city = 'Disneyland / Marne-la-Vallée'.
    city: '',
    since: 'Chauffeur VTC',
    // FAUX : « 7 apps en 1 écran ». Aucune trace de 7 plateformes nulle part
    // (rides → 4 valeurs, pieuvre_rides → 4 valeurs), et il n'a jamais parlé
    // d'écran unique. Son seul chiffre documenté : revenue_increase_pct = 30.00.
    stat: { value: '+30 %', label: 'ses revenus' },
    // FAUX : « FOREAS a changé ma manière de travailler. Je sais exactement où
    // aller. » n'apparaît dans AUCUN de ses propos enregistrés. Remplacé par deux
    // de ses key_quotes, mot pour mot.
    registre: 'binate' as const,
    quote: '',
    playbackId: 'i9Bm4N9eyzCeQN1Ku7wutBb9yj7nUtr1pSrGJYQBfKI',
    accentColor: '#00d4ff',
  },
  {
    id: 2,
    // FAUX : affiché « Kitenge ». Base : driver_name = 'Zefi Kitengue'.
    name: '',
    // FAUX : affiché « Paris ». Base : driver_city = 'Disneyland / Marne-la-Vallée'.
    city: '',
    since: 'Chauffeur VTC',
    // FAUX : « 0 course à vide visée » est une promesse produit posée sur son
    // visage. Sa fiche l'interdit noir sur blanc (transcript_summary) : « il parle
    // de SA propre connaissance du terrain, il ne parle PAS de l'application ».
    // Le badge dit donc ce qu'il dit vraiment : sa zone, il la connaît.
    stat: { value: 'Sa zone', label: 'connue par cœur' },
    // FAUX : « FOREAS a transformé ma vision du métier… » n'existe dans aucun de
    // ses propos. Remplacé par sa key_quote — son terrain, pas le produit.
    registre: 'zefi' as const,
    quote: '',
    playbackId: 'vX1Hg6jKGiFpSJvQW900FrKMrDIfhxHQgxCGYAD3wjEY',
    accentColor: '#a855f7',
  },
  {
    id: 3,
    name: '',
    city: '',
    since: 'Chauffeur VTC',
    // FAUX : « -40 % temps mort ». Aucune fiche Haitham dans
    // pieuvre_closer_testimonials, 0 ligne dans drivers, et rides ne porte aucun
    // horodatage d'acceptation ni d'attente : ce pourcentage n'est pas mesurable,
    // donc il n'a pas été mesuré. Ne le réafficher qu'avec relevé avant/après.
    stat: { value: 'Réponse', label: 'quand il en a besoin' },
    // FAUX : « Moins de temps à attendre, plus de temps à rouler » était du
    // copywriting posé sur un visage réel. Remplacé par ses propos filmés.
    registre: 'haitham' as const,
    quote: '',
    playbackId: '8nSxSV4hNxSuC8muZ02djVGZVFh3SgeybyCnfbAJ801r00',
    accentColor: '#22c55e',
  },
  {
    id: 4,
    name: '',
    city: '',
    since: 'Chauffeur VTC',
    // FAUX : « +28 % courses/jour ». Aucune fiche Nikolic, 0 ligne dans drivers,
    // et rides ne contient que 18 courses tous chauffeurs confondus : il n'existe
    // aucun avant/après capable de produire ce chiffre.
    stat: { value: 'Sérieux', label: "et à l'écoute" },
    // FAUX : « FOREAS c'est du sérieux. On sent que c'est pensé par des gens qui
    // comprennent le terrain. » n'est pas de lui. Remplacé par ses propos filmés.
    registre: 'nikolic' as const,
    quote: '',
    playbackId: '6PbitAE7sjbgTlMsdjI7EYJ01OsX9GnBbQNvj1TFhsow',
    accentColor: '#f59e0b',
  },
  {
    id: 5,
    name: '',
    // FAUX : affiché « Paris ». Ses propos filmés le situent en banlieue
    // parisienne, pas dans Paris.
    city: '',
    since: 'Chauffeur VTC',
    // FAUX : « +22 % revenus nets ». Aucune fiche Hadietou, et rides porte
    // fare_amount / driver_earnings mais AUCUNE charge : un revenu « net » n'est
    // calculable nulle part. C'est la formulation la plus exposée du lot — un gain
    // chiffré après charges, sur une personne identifiable, sans le moindre relevé.
    stat: { value: 'Confort', label: 'et un futur' },
    // FAUX : « Je recommande FOREAS à tous les chauffeurs… » n'est pas de lui.
    // Remplacé par ses propos filmés (au conditionnel, comme il le dit).
    registre: 'hadietou' as const,
    quote: '',
    playbackId: 'tjnuX01n9h01GfOA501C02a9lIVVbGnib02Z017POgodDpfj4',
    accentColor: '#ef4444',
  },
  {
    id: 6,
    name: '',
    city: '',
    since: 'Chauffeur VTC',
    // FAUX : « -35 % km à vide ». Un km à vide se mesure par télémétrie : rides ne
    // porte que distance_km (course chargée), aucune trace GPS entre deux courses.
    // La mesure est structurellement absente. La même promesse était par ailleurs
    // annoncée à 40 % pour toute la cohorte (src/app/chauffeurs/page.tsx) : deux
    // chiffres inventés qui se contredisaient sur le même site.
    stat: { value: 'Fidèle', label: 'il reste' },
    // FAUX : « Avant je tournais en rond. Maintenant chaque kilomètre compte. »
    // reprenait en prose la promesse chiffrée qu'on vient de retirer. Remplacé par
    // ses propos filmés.
    // ⚠️ 21/08/2026 — SEULE CITATION DES SIX À ÊTRE ENCORE RECOPIÉE ICI.
    // Elle perdait « Plus de deux ans avec FOREAS, » : la durée disparaissait
    // de la phrase alors qu'elle en est le sujet. Les cinq autres lisaient
    // déjà le registre.
    registre: 'dragan' as const,
    quote: '',
    playbackId: 'SeKV8Lpn7H2XhfYF1oKO54zP008A3Dv4qPuCKizybyA4',
    accentColor: '#06b6d4',
  },
]

/**
 * Les témoignages que ce composant a le DROIT d'afficher.
 *
 * ⚠️ 21/08/2026 — LE GARDE ÉTAIT « AU MOINS UN », DONC « TOUS OU AUCUN ».
 *
 * `auMoinsUnTemoignagePubliable()` cachait tout tant que personne n'était
 * approuvé. Correct aujourd'hui — les six accords sont en attente. Mais le jour
 * où UN SEUL est signé, il rend `true`, et TOUS s'affichent, dont ceux qui
 * n'ont pas d'accord.
 *
 * Même piège qu'en base la semaine dernière : « à un booléen près ». Une
 * protection dont la justesse dépend du fait que rien n'a encore changé n'est
 * pas une protection, c'est un délai.
 *
 * ⚠️ ET LE FILTRE EST AU NIVEAU DU MODULE, PAS DANS LE COMPOSANT. Posé dans le
 * composant, il coexistait avec cinq usages de la liste NON filtrée (flèches,
 * pastilles, compteur « 1/6 », carte affichée) : le garde existait et le rendu
 * l'ignorait. Une seule liste arrive à l'écran, et elle est déjà filtrée.
 */
const AUTORISES: Testimonial[] = TESTIMONIALS.filter((t) => temoignagePubliable(t.registre))


/* ─── Premium Play Button Overlay ──────────────────────────────────── */
function PremiumPlayButton({ isVisible }: { isVisible: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0.8 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none group"
    >
      <motion.div
        animate={{ scale: isVisible ? [1, 1.1, 1] : 1 }}
        transition={{ duration: 2, repeat: Infinity, repeatType: 'loop' }}
        className="w-20 h-20 rounded-full bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-md border border-white/30 flex items-center justify-center group-hover:from-white/30 group-hover:to-white/10 transition-all duration-300"
      >
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="ml-1">
          <path d="M6 4.5L26 16L6 27.5V4.5Z" fill="white" />
        </svg>
      </motion.div>
    </motion.div>
  )
}

/* ─── Stat Badge — Floating over video ─────────────────── */
function StatBadge({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl backdrop-blur-md border"
      style={{
        background: `${color}12`,
        border: `1.5px solid ${color}40`,
      }}
    >
      <motion.svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </motion.svg>
      <span className="text-sm font-bold tracking-tight" style={{ color }}>
        {value}
      </span>
      <span className="text-xs font-medium" style={{ color: `${color}cc` }}>
        {label}
      </span>
    </motion.div>
  )
}

/* ─── Mux Thumbnail URL helper ──────────────────────────────────────────────── */
function getMuxThumbnail(playbackId: string, width = 640) {
  return `https://image.mux.com/${playbackId}/thumbnail.webp?width=${width}&time=2`
}

/* ─── Premium Cinematic Video Card (Thumbnail-First for Performance) ──────── */
function CinematicVideoCard({ testimonial, onVideoPlay }: { testimonial: Testimonial; onVideoPlay?: () => void }) {
  const [playerLoaded, setPlayerLoaded] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const muxPlayerRef = useRef<any>(null)
  const isMobile = useIsMobile()

  // Only load MuxPlayer SDK when user clicks play — saves ~200KB from critical path
  const handleFirstPlay = useCallback(() => {
    if (!playerLoaded) {
      setPlayerLoaded(true)
      onVideoPlay?.()
    }
  }, [playerLoaded, onVideoPlay])

  const handlePlayPause = useCallback(() => {
    if (!playerLoaded) {
      handleFirstPlay()
      return
    }
    if (muxPlayerRef.current) {
      if (isPlaying) {
        muxPlayerRef.current.pause()
      } else {
        muxPlayerRef.current.play()
        onVideoPlay?.()
      }
      setIsPlaying(!isPlaying)
    }
  }, [playerLoaded, isPlaying, handleFirstPlay, onVideoPlay])

  // Auto-play once MuxPlayer is loaded
  useEffect(() => {
    if (playerLoaded && muxPlayerRef.current && !isPlaying) {
      const timer = setTimeout(() => {
        muxPlayerRef.current?.play()
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [playerLoaded])

  /* ── Shared video container (thumbnail-first, then Mux player) ── */
  const VideoContainer = ({ rounded, statPosition }: { rounded: string; statPosition: 'top-right' | 'bottom-left' }) => (
    <div
      className={`relative w-full ${rounded} overflow-hidden shadow-2xl group`}
      style={{
        aspectRatio: '16/9',
        background: '#0a0a14',
        border: `1.5px solid rgba(0, 212, 255, 0.15)`,
        boxShadow: '0 0 60px rgba(0, 212, 255, 0.05), inset 0 0 30px rgba(255, 255, 255, 0.05)',
      }}
    >
      {/* Phase 1: Static thumbnail (instant load, ~5KB WebP) */}
      {!playerLoaded && (
        <>
          <img
            src={getMuxThumbnail(testimonial.playbackId, isMobile ? 480 : 640)}
            alt={`Témoignage de ${testimonial.name}`}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
          {/* Dark overlay for premium feel */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/20 pointer-events-none" />
        </>
      )}

      {/* Phase 2: Mux Player (loaded only after user clicks play) */}
      {playerLoaded && (
        <MuxPlayer
          ref={muxPlayerRef}
          playbackId={testimonial.playbackId}
          streamType="on-demand"
          thumbnailTime={2}
          primaryColor="#ffffff"
          secondaryColor="#000000"
          accentColor={testimonial.accentColor}
          preload="auto"
          onPlay={() => { setIsPlaying(true); onVideoPlay?.() }}
          onPause={() => setIsPlaying(false)}
          style={{
            width: '100%',
            height: '100%',
            aspectRatio: '16/9',
            '--controls': 'none',
          } as any}
        />
      )}

      {/* Custom play button overlay */}
      <PremiumPlayButton isVisible={!isPlaying} />

      {/* Click handler */}
      <div
        className="absolute inset-0 z-10 cursor-pointer"
        onClick={handlePlayPause}
        role="button"
        aria-label={isPlaying ? `Mettre en pause la vidéo de ${testimonial.name}` : `Lire la vidéo de ${testimonial.name}`}
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handlePlayPause() } }}
      />

      {/* Gradient overlay (top) */}
      {!playerLoaded && (
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/40 to-transparent z-[5] pointer-events-none" />
      )}

      {/* Stat Badge */}
      <div className={statPosition === 'top-right' ? 'absolute top-6 right-6 z-20' : 'absolute bottom-4 left-4 z-20'}>
        <StatBadge
          value={testimonial.stat.value}
          label={testimonial.stat.label}
          color={testimonial.accentColor}
        />
      </div>
    </div>
  )

  return (
    <div className="w-full">
      {/* Desktop: Cinematic layout with video left, info right */}
      {!isMobile && (
        <div className="flex gap-10 items-start max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex-1 min-w-0"
          >
            <VideoContainer rounded="rounded-3xl" statPosition="top-right" />
          </motion.div>

          {/* Info Section - Right side */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="flex-1 flex flex-col justify-start pt-8"
          >
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg text-white"
                  style={{ background: `linear-gradient(135deg, ${testimonial.accentColor}, ${testimonial.accentColor}99)` }}
                >
                  {testimonial.name[0]}
                </div>
                <div>
                  <h3 className="text-white text-xl font-bold">{testimonial.name}</h3>
                  <p className="text-white/50 text-sm">{testimonial.city}</p>
                </div>
              </div>
              <p className="text-white/60 text-sm mt-4">{testimonial.since}</p>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="opacity-20 mb-4">
                <path
                  d="M7.5 10.5c-2 0-3 1.5-3 4s1 6 3 8m10-12c-2 0-3 1.5-3 4s1 6 3 8"
                  stroke={testimonial.accentColor}
                  strokeWidth="1.5"
                  fill="none"
                />
              </svg>
              <p className="text-white text-lg font-light leading-relaxed italic">
                {testimonial.quote}
              </p>
            </motion.div>
          </motion.div>
        </div>
      )}

      {/* Mobile: Stacked layout */}
      {isMobile && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="w-full px-4 space-y-6"
        >
          <VideoContainer rounded="rounded-2xl" statPosition="bottom-left" />

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg text-white flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${testimonial.accentColor}, ${testimonial.accentColor}99)` }}
              >
                {testimonial.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white text-lg font-bold">{testimonial.name}</h3>
                <div className="flex items-center gap-2 text-white/50 text-sm">
                  <span>{testimonial.city}</span>
                  <span>•</span>
                  <span>{testimonial.since}</span>
                </div>
              </div>
            </div>
            <p className="text-white/70 text-sm leading-relaxed italic">
              &ldquo;{testimonial.quote}&rdquo;
            </p>
          </div>
        </motion.div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
 *  MAIN SECTION
 * ═══════════════════════════════════════════════════════════════ */
/* ─── Navigation Arrow ─────────────────────────────────────── */
function NavArrow({ direction, onClick, disabled }: { direction: 'left' | 'right'; onClick: () => void; disabled: boolean }) {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.1 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === 'left' ? 'Témoignage précédent' : 'Témoignage suivant'}
      className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all duration-300 ${
        disabled
          ? 'border-white/5 bg-white/[0.02] cursor-not-allowed'
          : 'border-white/15 bg-white/[0.05] hover:bg-white/10 hover:border-accent-cyan/30 cursor-pointer'
      }`}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        className={`transition-colors ${disabled ? 'text-white/10' : 'text-white/60'}`}
      >
        {direction === 'left' ? (
          <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
    </motion.button>
  )
}

export default function Testimonials() {
  const isMobile = useIsMobile()
  const [activeIndex, setActiveIndex] = useState(0)
  const [userInteracted, setUserInteracted] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const sectionRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(sectionRef, { once: false, amount: 0.3 })

  const stopAutoPlay = () => {
    setUserInteracted(true)
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
  }

  const goTo = (idx: number) => {
    setActiveIndex(idx)
    stopAutoPlay()
  }

  const goNext = () => {
    setActiveIndex((prev) => (prev + 1) % AUTORISES.length)
  }

  const goPrev = () => {
    setActiveIndex((prev) => (prev - 1 + AUTORISES.length) % AUTORISES.length)
  }

  // Autoplay: starts when section scrolls into view, stops permanently on user interaction
  useEffect(() => {
    if (userInteracted) {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
      return
    }
    if (isInView) {
      if (!intervalRef.current) {
        intervalRef.current = setInterval(goNext, 8000)
      }
    } else {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
    }
    return () => {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
    }
  }, [isInView, userInteracted])

  // ⚠️ 21/08/2026 — SIX VIDÉOS DE CHAUFFEURS, AUCUN ACCORD SIGNÉ.
  //
  // Ce composant est monté par /chauffeurs. Il affiche six visages découverts,
  // six noms et six paroles. Les six accords du registre sont « en attente »,
  // sans preuve enregistrée.
  //
  // La section entière se retire, plutôt que de laisser un carrousel vide avec
  // ses flèches et son titre.
  if (AUTORISES.length === 0) return null

  return (
    <section ref={sectionRef} className="relative py-20 md:py-32 bg-foreas-deepblack overflow-hidden">
      {/* Premium background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-accent-cyan/[0.05] rounded-full blur-[100px]"
        />
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.2 }}
          className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent-purple/[0.04] rounded-full blur-[100px]"
        />
      </div>

      <div className="relative z-10">
        {/* ═══ HEADER ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center px-6 mb-16 md:mb-20"
        >
          {/* Social proof chip */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 border border-accent-cyan/20 rounded-full mb-6 backdrop-blur-sm"
          >
            <div className="flex -space-x-2">
              {['K', 'H', 'B'].map((letter, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="w-6 h-6 rounded-full border-2 border-foreas-deepblack flex items-center justify-center text-[10px] text-white font-bold relative"
                  style={{
                    background:
                      i === 0
                        ? 'linear-gradient(135deg, #00d4ff, #0066ff)'
                        : i === 1
                          ? 'linear-gradient(135deg, #a855f7, #6b21a8)'
                          : 'linear-gradient(135deg, #22c55e, #15803d)',
                    zIndex: 3 - i,
                  }}
                >
                  {letter}
                </motion.div>
              ))}
            </div>
            {/* Le « 6 » était écrit en dur. Il vient maintenant de
                src/lib/verite-commerciale.ts (COMMUNAUTE.temoignagesVideoReels = 6,
                mesuré le 14/08/2026), pour qu'il ne puisse plus dériver tout seul. */}
            <span className="text-white/60 text-xs font-medium tracking-wide">
              {COMMUNAUTE_PHRASES.preuveHonnete}
            </span>
          </motion.div>

          <h2 className="font-title text-3xl md:text-6xl text-white mb-3 leading-tight">
            Ils témoignent.{' '}
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-accent-cyan"
            >
              En toute transparence.
            </motion.span>
          </h2>
          {/* FAUX : « Des chauffeurs VTC parlent de FOREAS » — la fiche de Zefi K.
              (pieuvre_closer_testimonials.transcript_summary, 14/08/2026) précise
              qu'il parle de SA connaissance du terrain et PAS de l'application. On
              ne peut donc pas annoncer que les six parlent tous du produit. */}
          <p className="text-white/50 text-base md:text-lg max-w-2xl mx-auto">
            Des chauffeurs VTC parlent de leur métier, de leur zone et de leur
            expérience avec FOREAS. Leurs mots, pas les nôtres.
          </p>
        </motion.div>

        {/* ═══ CAROUSEL ═══ */}
        <div className="px-4 md:px-6 mb-12 md:mb-16">
          <div className="relative max-w-5xl mx-auto">
            {/* Active testimonial with AnimatePresence */}
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <CinematicVideoCard testimonial={AUTORISES[activeIndex]} onVideoPlay={() => stopAutoPlay()} />
            </motion.div>

            {/* Desktop navigation arrows */}
            {!isMobile && (
              <>
                <div className="absolute top-1/2 -left-16 -translate-y-1/2">
                  <NavArrow direction="left" onClick={() => { goPrev(); stopAutoPlay() }} disabled={false} />
                </div>
                <div className="absolute top-1/2 -right-16 -translate-y-1/2">
                  <NavArrow direction="right" onClick={() => { goNext(); stopAutoPlay() }} disabled={false} />
                </div>
              </>
            )}
          </div>

          {/* Navigation: dots + counter + mobile arrows */}
          <div className="flex items-center justify-center gap-6 mt-10">
            {/* Mobile prev */}
            {isMobile && (
              <NavArrow direction="left" onClick={() => { goPrev(); stopAutoPlay() }} disabled={false} />
            )}

            <div className="flex items-center gap-4">
              {/* Dots */}
              <div className="flex gap-2">
                {AUTORISES.map((t, i) => (
                  <motion.button
                    key={t.id}
                    onClick={() => goTo(i)}
                    aria-label={`Voir le témoignage de ${t.name}`}
                    aria-current={i === activeIndex ? 'true' : undefined}
                    animate={{
                      width: i === activeIndex ? 28 : 8,
                      backgroundColor: i === activeIndex ? t.accentColor : 'rgba(255,255,255,0.15)',
                    }}
                    transition={{ duration: 0.3 }}
                    className="h-2 rounded-full cursor-pointer"
                  />
                ))}
              </div>

              {/* Counter */}
              <span className="text-white/50 text-sm font-mono tabular-nums">
                {activeIndex + 1}/{AUTORISES.length}
              </span>
            </div>

            {/* Mobile next */}
            {isMobile && (
              <NavArrow direction="right" onClick={() => { goNext(); stopAutoPlay() }} disabled={false} />
            )}
          </div>
        </div>

        {/* ═══ TRUST BAR ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="flex justify-center gap-8 md:gap-12 px-6 flex-wrap max-w-3xl mx-auto"
        >
          {[
            { icon: '🎬', text: 'Tournés sur le terrain' },
            { icon: '🤝', text: 'Témoignages authentiques' },
            { icon: '🔒', text: 'Données protégées' },
          ].map((badge, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex items-center gap-2 text-white/55 text-sm"
            >
              <span className="text-lg">{badge.icon}</span>
              <span className="font-medium">{badge.text}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Disclaimer */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-center text-white/35 text-xs mt-10 px-6 max-w-2xl mx-auto leading-relaxed"
        >
          Témoignages filmés auprès de chauffeurs VTC utilisant FOREAS.
          Le seul chiffre cité est celui du chauffeur qui parle, pour sa propre
          activité : il ne préjuge d&apos;aucun résultat pour toi. Les résultats varient
          selon la zone, les horaires et l&apos;usage de l&apos;application.
        </motion.p>
      </div>
    </section>
  )
}

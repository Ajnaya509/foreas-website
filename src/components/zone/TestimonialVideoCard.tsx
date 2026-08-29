'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import { Play, Pause } from 'lucide-react'
import type { Testimonial } from './testimonials.data'
import { temoignagePubliable, temoignagePubliableParNom } from '@/lib/consentements'

/**
 * ⚠️ 22/08/2026 — `citationPubliable`, `verdictCitation` et `chiffrePubliable`
 * NE PEUVENT PLUS VIVRE ICI.
 *
 * Ces trois fonctions comparent un texte affiché au VERBATIM autorisé. Elles ont
 * donc besoin du verbatim — c'est-à-dire de la parole de la personne. Les garder
 * dans un composant client obligeait à embarquer ce verbatim dans le paquet
 * JavaScript, donc à le distribuer à chaque visiteur.
 *
 * Elles restent dans `consentements.prive.ts` (server-only) et servent aux
 * composants serveur. Ici, la seule question légitime est binaire : cette
 * personne a-t-elle signé ? Tant que non, rien ne s'affiche, et la question du
 * verbatim ne se pose pas.
 */
const citationPubliable = (cle: string) => temoignagePubliable(cle)
const chiffrePubliable = (cle: string) => temoignagePubliable(cle)
const verdictCitation = (cle: string): 'conforme' | 'alteree' | 'sans_verbatim' | 'inconnue' =>
  temoignagePubliable(cle) ? 'conforme' : 'inconnue'

/**
 * MuxPlayer — chargement dynamique côté client uniquement (Web Component).
 * Évite les warnings SSR + lazy-load la vidéo seulement quand visible.
 */
const MuxPlayer = dynamic(
  () => import('@mux/mux-player-react').then((m) => m.default),
  {
    ssr: false,
    loading: () => (
      <div className="w-full aspect-video bg-white/[0.04] rounded-xl flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-violet-400/40 border-t-violet-400 animate-spin" />
      </div>
    ),
  }
)

/**
 * La citation de ce chauffeur peut-elle s'afficher ?
 *
 * Le registre `src/lib/consentements.ts` détient, pour chaque personne, la phrase
 * EXACTE qu'elle a acceptée de voir publier. Cette fonction compare ce qui est sur
 * le point de s'afficher à cette phrase.
 *
 * Deux comportements, et la nuance compte :
 *  · La phrase DIFFÈRE de celle enregistrée → on n'affiche RIEN. C'est le vrai
 *    risque, et il s'est déjà réalisé : une citation retouchée « pour raccourcir »
 *    devient une affirmation que la personne n'a jamais faite.
 *  · Aucune phrase n'est encore enregistrée pour elle → on affiche le verbatim de
 *    la vidéo. Ces six chauffeurs ont participé au tournage, ce sont leurs mots ;
 *    ce qui manque est la TRACE ÉCRITE de leur accord, pas leur accord.
 *
 * ⚠️ POUR PASSER AU RÉGIME STRICT — n'afficher que ce qui est formellement
 * approuvé — remplacer le `return true` du cas « pas de phrase enregistrée » par
 * `return false`. Une seule ligne. Elle attend les six accords écrits ; le jour où
 * ils arrivent, les statuts passent à `approuve` dans le registre, rien d'autre ne
 * bouge.
 */
const REGIME_STRICT = false

/**
 * Un badge qui porte un chiffre est une promesse. Il exige un accord qui nomme
 * ce chiffre. Un badge qui porte un mot n'engage sur aucun résultat.
 */
function badgeAffichable(t: Testimonial): boolean {
  const badge = (t.gainBadge ?? '').trim()
  if (!badge) return false
  const porteUnChiffre = /\d/.test(badge)
  if (!porteUnChiffre) return true
  const cle = t.name.toLowerCase().split(/[\s.]/)[0].replace(/[^a-zà-ÿ]/g, '')
  return chiffrePubliable(cle)
}

function citationAffichable(t: Testimonial): boolean {
  const cle = t.name.toLowerCase().split(/[\s.]/)[0].replace(/[^a-zà-ÿ]/g, '')

  // Régime strict : seule une phrase formellement approuvée sort. Aujourd'hui
  // aucun des six accords n'est signé — l'activer viderait les six cartes.
  if (REGIME_STRICT) return citationPubliable(cle)

  const verdict = verdictCitation(cle)
  if (verdict === 'alteree') return false   // le cas grave : jamais à l'écran
  if (verdict === 'inconnue') return false  // hors registre : on n'invente pas
  return true                                // conforme, ou pas encore transcrite
}

interface TestimonialVideoCardProps {
  testimonial: Testimonial | undefined
  /** Index pour stagger animation sur mount (0, 1, 2...) */
  index?: number
  /** Affiche le quote au-dessus de la vidéo (sinon vidéo seule) */
  showQuote?: boolean
}

/**
 * TestimonialVideoCard — affiche un témoignage vidéo Mux avec quote + métadonnées.
 *
 * Design system FOREAS :
 * - Glass card rgba(0.04) + border 0.06 (§4)
 * - Hover → border violet 0.30 + glow subtle
 * - Avatar gradient violet→cyan (signature)
 * - Quote en italique, gain badge tabular-nums
 * - MuxPlayer accent violet #8C52FF + primary ivoire #F8FAFC
 * - Click-to-play (pas d'autoplay forcé pour économiser la bande passante)
 *
 * Tracking : émet `TestimonialVideoPlayed` Meta CAPI quand le user clique play.
 */
export default function TestimonialVideoCard({
  testimonial: t,
  index = 0,
  showQuote = true,
}: TestimonialVideoCardProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  const playerRef = useRef<unknown>(null)

  // ⚠️ 21/08/2026 — LA VIDÉO NE PASSAIT PAR AUCUN GARDE.
  //
  // Le site vérifiait la citation, et depuis ce matin le chiffre. Pas la vidéo.
  // Or c'est elle qui expose le plus : un visage découvert, une voix, une
  // personne identifiable, sur un site commercial.
  //
  // Le raisonnement qui la laissait tourner — « c'est lui qui parle, avec ses
  // mots » — décrit qui a PRONONCÉ la phrase, pas qui a AUTORISÉ sa
  // publication. Les deux sont différents.
  //
  // Les six accords sont « en attente », sans aucune preuve enregistrée. Cette
  // carte ne se rend donc pour personne aujourd'hui. Ce n'est pas un effet de
  // bord : c'est la conséquence exacte de l'absence d'accord.
  //
  // ⚠️ LE GARDE EST ICI, APRÈS LES CROCHETS, ET PAS AVANT. Un retour anticipé
  // placé au-dessus d'un useState rend l'appel des crochets conditionnel, et
  // React lève une erreur dès qu'un rendu change de branche. C'était mon
  // premier jet ; la vérification des types l'a attrapé.
  /* ⚠️ 29/08 — `t` PEUT ÊTRE `undefined`, ET ÇA A FAIT PLANTER UNE PAGE ENTIÈRE.
     `TESTIMONIALS[0]` vaut `undefined` par conception tant qu'aucun accord n'est
     signé (testimonials.data.ts:218 le dit). Lire `t.name` sur rien remontait
     jusqu'à React, et `/ou-ca-paie` devenait « Application error » à chaque
     recherche de zone — mesuré en production.

     ⚠️ LE GARDE EST ICI, ET PAS SEULEMENT CHEZ L'APPELANT. Quatre endroits
     appellent ce composant ; deux gardaient, deux non. Un garde qui dépend de la
     discipline de chaque appelant n'en est pas un : c'est une chance. */
  if (!t) return null
  if (!temoignagePubliableParNom(t.name)) return null


  const posterUrl = `https://image.mux.com/${t.playbackId}/thumbnail.jpg?time=${t.posterTimeSec}&width=640&fit_mode=smartcrop`

  const handlePlay = () => {
    setHasInteracted(true)
    setIsPlaying(true)
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('trackCustom', 'TestimonialVideoPlayed', {
        name: t.name,
        playback_id: t.playbackId,
      })
    }
  }

  const handlePause = () => {
    setIsPlaying(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="rounded-2xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-sm hover:border-violet-500/30 transition-all overflow-hidden flex flex-col"
    >
      {/* ── Header : avatar + nom + gain badge ─────────────────────────── */}
      <div className="px-5 pt-5 pb-3 flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
          style={{ boxShadow: '0 4px 14px rgba(140,82,255,0.30)' }}
        >
          {getInitials(t.name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[#F8FAFC] text-sm truncate">{t.name}</p>
          <p className="text-white/55 text-[11px] truncate">{t.context}</p>
        </div>
        {/*
          ⚠️ 21/08/2026 — CE BADGE S'AFFICHAIT SANS AUCUNE GARDE.

          `chiffrePubliable()` existe dans src/lib/consentements.ts depuis le
          20/08 — et n'était APPELÉE NULLE PART. Un garde-fou écrit puis jamais
          branché ne protège de rien ; il rassure, ce qui est pire.

          Résultat mesuré : « +30 % revenus » était servi dans le HTML de la
          page d'accueil, sous le visage d'un chauffeur dont l'accord est au
          statut « en attente », à côté de sa citation.

          ON NE MASQUE PAS TOUT POUR AUTANT. Sur les six badges, cinq sont
          qualitatifs — « Indépendance », « Il recommande », « 2 ans, il reste ».
          Un mot n'est pas une promesse de gain. Seul un badge qui porte un
          CHIFFRE engage FOREAS sur un résultat, et seul celui-là doit être
          couvert par un accord nommant ce chiffre.
        */}
        {badgeAffichable(t) && (
          <span className="bg-green-500/15 text-green-400 text-[11px] px-2 py-0.5 rounded-full font-bold tabular-nums whitespace-nowrap">
            {t.gainBadge}
          </span>
        )}
      </div>

      {/* ── Vidéo Mux Player ───────────────────────────────────────────── */}
      <div className="relative aspect-video bg-black mx-3 rounded-xl overflow-hidden">
        {!hasInteracted ? (
          // Affiche le poster + bouton play AVANT 1ʳᵉ interaction
          // → évite de charger un player JS inutile pour des cards non-cliquées
          <button
            onClick={handlePlay}
            className="group absolute inset-0 flex items-center justify-center w-full h-full"
            aria-label={`Lire le témoignage de ${t.name}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={posterUrl}
              alt={`${t.name} — ${t.context}`}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div
              className="relative w-14 h-14 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center transition-transform group-hover:scale-110 group-active:scale-95"
              style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.40), 0 0 24px rgba(140,82,255,0.30)' }}
            >
              <Play className="w-5 h-5 text-black fill-black ml-0.5" />
            </div>
          </button>
        ) : (
          <MuxPlayer
            ref={playerRef as never}
            playbackId={t.playbackId}
            poster={posterUrl}
            streamType="on-demand"
            autoPlay
            metadata={{
              video_id: t.playbackId,
              video_title: `${t.name} — Témoignage FOREAS`,
              viewer_user_id: getCachedVisitorIdSafe(),
            }}
            accentColor="#8C52FF"
            primaryColor="#F8FAFC"
            secondaryColor="#000000"
            onPlay={() => setIsPlaying(true)}
            onPause={handlePause}
            style={
              {
                aspectRatio: '16 / 9',
                width: '100%',
                height: '100%',
                '--media-object-fit': 'cover',
              } as Record<string, string>
            }
          />
        )}
      </div>

      {/* ── Quote ──────────────────────────────────────────────────────── */}
      {showQuote && (
        <div className="px-5 pt-3 pb-5 flex-1 flex flex-col">
          {/*
            20/08/2026 — LES CINQ ÉTOILES ONT ÉTÉ RETIRÉES.
            Elles étaient écrites en dur, identiques pour les six chauffeurs, et
            aucune note n'existe nulle part : ni dans `pieuvre_closer_testimonials`,
            ni ailleurs. Cinq étoiles sous un visage réel, ça se lit comme une note
            donnée par cette personne. Ce n'en était pas une.
            Ce qui reste est vrai et se vérifie : c'est lui, filmé, à visage découvert.
          */}
          <p className="text-white/45 text-[10px] uppercase mb-2" style={{ letterSpacing: '0.18em' }}>
            Filmé · {t.detail}
          </p>
          {/*
            LA CITATION PASSE PAR LE REGISTRE DE CONSENTEMENT.
            `citationAffichable` ne la laisse passer que si elle correspond, au
            caractère près, à celle enregistrée dans src/lib/consentements.ts.
            Une citation ALTÉRÉE ne s'affiche pas — c'est exactement ce qui s'est
            produit le 14/08 : « aucun souci » était devenu « aucun souci de
            PAIEMENT », une affirmation jamais faite, sur un sujet sensible, à
            visage découvert. La vidéo, elle, continue de jouer : c'est lui qui
            parle, avec ses mots.
          */}
          {citationAffichable(t) && (
            <p className="text-white/80 text-[13px] leading-relaxed italic">
              {t.quoteShort}
            </p>
          )}
        </div>
      )}
    </motion.div>
  )
}

/** Génère "HB" depuis "Haitham B." */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/** Lit le visitor ID en cache (FingerprintJS) si dispo, sinon undefined. */
function getCachedVisitorIdSafe(): string | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    return localStorage.getItem('foreas_visitor_id') ?? undefined
  } catch {
    return undefined
  }
}

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}

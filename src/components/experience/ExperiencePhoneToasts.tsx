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


/**
 * ExperiencePhoneToasts — bulles "vient de parler à Ajnaya sur WhatsApp" en bas-gauche.
 * Même mécanique que CheckoutProofToasts (Provely-style, preuve sociale Cialdini), thème
 * réorienté vers WhatsApp puisque /experience pousse à continuer là-bas.
 *
 * Deux corrections par rapport à la version précédente (supprimée un temps, restaurée sur
 * demande — les bulles sont un vrai levier de conversion, seule leur exécution posait
 * problème) :
 *  1. PLUS de compteur "il y a X min" tiré au hasard (Math.random) : un visiteur qui reste
 *     quelques minutes voyait le même nom repasser avec un délai différent — le mensonge se
 *     démasquait tout seul, et un chauffeur méfiant qui l'attrape en flagrant délit ne clique
 *     plus jamais. Aucune revendication de fraîcheur maintenant : nom + zone + action, rien
 *     de vérifiable-donc-falsifiable.
 *  2. Position ancrée sur --cta-clearance (la réserve réelle de la barre CTA), pas un
 *     bottom-24 deviné en dur — reste juste au-dessus du bouton quel que soit son budget réel,
 *     plus bas/plus proche du bord qu'avant (retour Chandler : "un peu haute").
 *
 * Thème verre sombre (pas la carte blanche Apple-light d'origine) : cohérent avec Dark
 * Sovereign, et une tache blanche sur fond noir absolu volait l'attention au CTA.
 */

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MessageCircle } from 'lucide-react'
import { useReducedMotion } from '@/hooks/useDevicePerf'
import { temoignagePubliable } from '@/lib/consentements'

interface Entry { driver: string; city: string; initial: string; accent: 'violet' | 'cyan' | 'rose' | 'gold' }

/**
 * LES SIX CHAUFFEURS QUI ONT ACCEPTÉ D'ÊTRE FILMÉS, À VISAGE DÉCOUVERT.
 *
 * ⚠️ CE QU'IL Y AVAIT ICI AVANT LE 14/08/2026, ET POURQUOI C'ÉTAIT GRAVE :
 * huit entrées inventées de toutes pièces — « Bakary S. · Nantes », « Driss T. ·
 * Lyon », « Pavel N. · Lille »… tirées au sort et affichées au PRÉSENT
 * (« X parle à Ajnaya »), c'est-à-dire présentées comme une activité en cours.
 * Mesure : `select count(*) from widget_conversations where created_at > now() -
 * interval '45 days'` → **0**. Personne ne parlait à Ajnaya. La table entière
 * compte 36 lignes, la dernière datée du 18/05/2026.
 *
 * Et deux de ces huit noms n'étaient PAS inventés : « Binate A. » et
 * « Hadietou D. » sont de vraies personnes, filmées pour le site. Les faire
 * apparaître dans une fausse notification d'activité en direct, c'est leur
 * attribuer une action qu'elles n'ont pas faite — le cas le plus exposé
 * (personne identifiable, RGPD, droit à l'image).
 *
 * CE QU'IL Y A MAINTENANT : les six personnes réellement filmées, avec une
 * phrase qui décrit un fait accompli et vérifiable (« a filmé son témoignage »),
 * pas une activité imaginaire au présent. Le visiteur peut cliquer et voir la
 * vidéo : la preuve se vérifie en trois secondes.
 * Source : src/components/zone/testimonials.data.ts · socle de vérité :
 * FOREAS-SHARED/VERITE_COMMERCIALE_2026-08-14.md
 */
// ─────────────────────────────────────────────────────────────────────────────
// ⚠️ 22/08/2026 — CE COMPOSANT NOMMAIT SIX PERSONNES RÉELLES SANS ACCORD.
//
// Six noms, six villes, et la phrase « a filmé son témoignage » — c'est-à-dire
// un FAIT rapporté sur une personne identifiable. Les six accords du registre
// (`src/lib/consentements.ts`) sont au statut « en attente ».
//
// ⚠️ UN NOM ET UNE VILLE SONT DÉJÀ UNE PREUVE PERSONNELLE. Les corrections
// précédentes visaient les CITATIONS ; celle-ci passait entre les mailles parce
// qu'elle ne cite personne — elle se contente de dire qui a filmé, et où il
// roule. C'est exactement le même registre, et ça devenait la PAGE D'ACCUEIL.
//
// La liste est désormais filtrée personne par personne contre le registre. Tant
// que rien n'est signé, elle est vide et le composant ne rend rien. Le jour où
// un accord passe à « approuvé », cette personne — et elle seule — réapparaît.
// ─────────────────────────────────────────────────────────────────────────────
const TOUS: (Entry & { registre: string })[] = [
  { registre: 'haitham', driver: '', city: '', initial: 'H', accent: 'violet' },
  { registre: 'binate', driver: '', city: '', initial: 'B', accent: 'gold' },
  { registre: 'zefi', driver: '', city: '', initial: 'Z', accent: 'cyan' },
  { registre: 'dragan', driver: '', city: '', initial: 'D', accent: 'violet' },
  { registre: 'hadietou', driver: '', city: '', initial: 'H', accent: 'rose' },
  { registre: 'nikolic', driver: '', city: '', initial: 'N', accent: 'cyan' },
]

const ENTRIES: Entry[] = TOUS.filter((e) => temoignagePubliable(e.registre))

const ACCENT: Record<Entry['accent'], { ring: string; bg: string }> = {
  violet: { ring: 'rgba(140,82,255,0.30)', bg: 'linear-gradient(135deg,#8C52FF,#6C3CE0)' },
  cyan:   { ring: 'rgba(0,212,255,0.28)',  bg: 'linear-gradient(135deg,#00D4FF,#0094B8)' },
  rose:   { ring: 'rgba(255,102,153,0.28)', bg: 'linear-gradient(135deg,#FF6699,#C8336A)' },
  gold:   { ring: 'rgba(245,200,66,0.30)', bg: 'linear-gradient(135deg,#F5C842,#A87E0F)' },
}

const SESSION_KEY = 'foreas_experience_proof_dismissed'

function pickNext(prev: number | null, len: number): number {
  if (prev === null) return Math.floor(Math.random() * len)
  let n = Math.floor(Math.random() * (len - 1))
  if (n >= prev) n += 1
  return n
}

export default function ExperiencePhoneToasts() {
  // Aucun accord signé → aucune notification. Pas de titre, pas d'espace, rien.
  if (ENTRIES.length === 0) return null

  const reduced = useReducedMotion()
  const [idx, setIdx] = useState<number | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const idxRef = useRef<number | null>(null)
  const timers = useRef<{ show?: ReturnType<typeof setTimeout>; hide?: ReturnType<typeof setTimeout> }>({})

  useEffect(() => {
    try { if (sessionStorage.getItem(SESSION_KEY) === '1') setDismissed(true) } catch { /* noop */ }
  }, [])

  useEffect(() => {
    if (reduced || dismissed || typeof window === 'undefined' || window.innerWidth < 380) return
    const DWELL = 5500
    const next = () => 16000 + Math.random() * 12000
    // Silence pendant les scènes cinéma. Vu dans le simulateur iOS : la bulle surgissait
    // par-dessus le film du contrôle de police — une pastille promo qui casse le moment
    // narratif le plus fort de la page, juste avant le paiement émotionnel. La preuve sociale
    // sert les moments de LECTURE, pas les moments de TENSION : on reporte simplement.
    const cinemaOnScreen = () =>
      Array.from(document.querySelectorAll('[data-cinema-scene]')).some((el) => {
        const r = el.getBoundingClientRect()
        return r.top < window.innerHeight && r.bottom > 0
      })
    const show = () => {
      if (cinemaOnScreen()) { timers.current.show = setTimeout(show, 3500); return }
      const n = pickNext(idxRef.current, ENTRIES.length)
      idxRef.current = n
      setIdx(n)
      timers.current.hide = setTimeout(() => { setIdx(null); timers.current.show = setTimeout(show, next()) }, DWELL)
    }
    timers.current.show = setTimeout(show, 7000) // laisse le temps d'atteindre le téléphone vivant d'abord
    return () => { if (timers.current.show) clearTimeout(timers.current.show); if (timers.current.hide) clearTimeout(timers.current.hide) }
  }, [reduced, dismissed])

  const dismiss = () => {
    setIdx(null); setDismissed(true)
    try { sessionStorage.setItem(SESSION_KEY, '1') } catch { /* noop */ }
    if (timers.current.show) clearTimeout(timers.current.show)
    if (timers.current.hide) clearTimeout(timers.current.hide)
  }

  if (dismissed) return null
  const e = idx !== null ? ENTRIES[idx] : null

  return (
    <div
      className="fixed left-5 z-[60] pointer-events-none"
      style={{ bottom: 'calc(var(--cta-clearance, 100px) + 8px)' }}
      aria-live="polite"
      role="status"
    >
      <AnimatePresence>
        {e && (
          <motion.div
            key={idx}
            initial={reduced ? { opacity: 0 } : { opacity: 0, x: -32, y: 8 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, x: -16, y: 8 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-auto"
          >
            <div
              // Compacte (256px, pas 300) : en mobile elle flotte au-dessus du contenu qui
              // défile — vu dans le simulateur iOS, la version large couvrait les titres de
              // section. hyphens none : Safari coupait « What-sApp » en fin de ligne.
              className="flex items-center gap-2.5 pl-2 pr-2.5 py-1.5 rounded-full border max-w-[240px]"
              style={{
                backgroundColor: 'rgba(10,12,20,.92)',
                borderColor: 'rgba(255,255,255,.14)',
                backdropFilter: 'blur(12px)',
                boxShadow: `0 0 40px -18px ${ACCENT[e.accent].ring}, 0 18px 40px -18px rgba(0,0,0,.6)`,
                hyphens: 'none',
              }}
            >
              <div
                className="relative w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-[12px]"
                style={{ background: ACCENT[e.accent].bg }}
              >
                {e.initial}
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center" style={{ backgroundColor: '#10B981', border: '1px solid rgba(10,12,20,.92)' }} aria-hidden>
                  <MessageCircle className="w-2 h-2 text-white" strokeWidth={3} />
                </span>
              </div>
              {/* UNE seule ligne. En deux lignes (nom, puis action) la bulle montait au-dessus
                  de la zone assombrie et recouvrait les titres de section — « La zone s'allume… »,
                  « Ce client est à… » coupés en plein milieu (vu dans le simulateur iOS). Une
                  ligne la maintient dans le dégradé d'ancrage du CTA, où le contenu qui défile
                  est déjà atténué : elle ne cache plus rien de lisible. */}
              <p className="min-w-0 flex-1 text-[12.5px] leading-tight text-white/60">
                <span className="font-bold text-[#F8FAFC]">{e.driver}</span> a filmé son témoignage
              </p>
              <button type="button" onClick={dismiss} aria-label="Fermer" className="self-start -mr-1 -mt-1 w-6 h-6 rounded-full flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/[0.08] transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

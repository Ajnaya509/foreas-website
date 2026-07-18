'use client'

/**
 * StickyFeatures — la « visite produit » façon Apple de /experience.
 *
 * DESKTOP : le téléphone reste COLLÉ au centre (position: sticky) pendant que les blocs de texte
 *   défilent à côté. La feature affichée DANS le téléphone change quand le bloc de texte
 *   correspondant passe au centre de l'écran (IntersectionObserver, pas de seuil par frame →
 *   zéro re-render au scroll). Léger tilt 3D piloté par le scroll (useScroll → rotateY/rotateX,
 *   lissé par useSpring) = l'effet « rotato » sans Rotato. Ombre du cadre STATIQUE (jamais animée).
 *
 * MOBILE (80% du trafic) : PAS de sticky (coûteux, inutile). Empilé — téléphone en haut, texte
 *   dessous, révélé au scroll. Scroll natif conservé.
 *
 * Les illustrations CSS sont des PLACEHOLDERS honnêtes, prêtes à être remplacées par les vidéos
 * verticales ScreenStudio (composant PhoneVideo, étape suivante). Les titres seront remplacés par
 * la version +100/100 (copy-atomic). Ordre : VERDICT INSTANT en ouverture (la feature la plus
 * viscérale), puis zone, vocal, compta, client direct.
 *
 * Architecture validée par l'audit Fable 5 (CSS sticky + Framer, pas de GSAP ; jamais de
 * MotionValue→setState ; will-change ciblé ; h-dvh ; gate mobile via useIsMobile).
 */

import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import PhoneFrame from './PhoneFrame'
import { useSectionSeen } from '@/hooks/useSectionSeen'

type IllusKind = 'reflex' | 'map' | 'voice' | 'compta' | 'qr'
interface Feature { eyebrow: string; title: string; sub: string; illus: IllusKind }

// Titres +100/100 (audit copy-atomic Fable 5, 41 versions notées dans la peau du chauffeur).
// Ordre recommandé : Verdict instant en ouverture (la seule feature « neuve », scène vécue 40×/jour,
// crédibilise tout le reste) → zone → vocale → client direct → compta.
export const FEATURES: Feature[] = [
  {
    // ⭐ La star, en ouverture. Idiome « à prendre ou à laisser » retourné : c'est LUI qui décide.
    eyebrow: 'Verdict instant',
    title: 'Prends ou laisse — avant la fin de la sonnerie.',
    sub: 'Une course tombe : deux tapes à l’arrière de ton téléphone, le verdict s’affiche en moins d’une seconde — les yeux restent sur la route.',
    illus: 'reflex',
  },
  {
    // Inversion temporelle : il passe devant la plateforme elle-même.
    eyebrow: 'Où ça paie',
    title: 'La zone s’allume. Ton appli sonne après.',
    sub: 'La carte t’allume, à 800 m près, le coin qui va payer — quand les demandes tombent, tu y es déjà.',
    illus: 'map',
  },
  {
    // La nomme → une présence dans la voiture, pas une feature. Solitude traitée sans la nommer.
    eyebrow: 'Mains sur le volant',
    title: 'Ajnaya parle. Toi, tu conduis.',
    sub: 'Tu poses ta question à voix haute, elle te répond pendant que tu roules — mains sur le volant du premier au dernier mot.',
    illus: 'voice',
  },
  {
    // L'arithmétique qu'il fait déjà de tête. Vrai par construction (en direct, personne ne se sert).
    eyebrow: 'Client direct',
    title: 'Une course à 25 € ? 25 € pour toi.',
    sub: 'Un sticker dans ta voiture, un mini-site à ton nom : le client scanne, réserve en direct — la plateforme ne touche rien.',
    illus: 'qr',
  },
  {
    // Guardrail légal : « se calcule », JAMAIS « on fait ta compta ». URSSAF = stop-scroll à lui seul.
    eyebrow: 'Zéro saisie',
    title: 'Ta tirelire URSSAF se calcule toute seule.',
    sub: 'Course après course, tu vois exactement ce qu’il faudra sortir au trimestre — zéro saisie, zéro douche froide.',
    illus: 'compta',
  },
]

/* ─── Illustrations placeholder (remplacées par les vidéos verticales ScreenStudio) ─────────── */
function FeatureIllus({ kind }: { kind: IllusKind }) {
  if (kind === 'reflex') {
    return (
      <div className="relative flex h-full w-full flex-col justify-between p-4">
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.045] p-3.5 text-[12px] text-white/70">
          <div className="flex justify-between py-0.5"><span>Course entrante</span><b className="text-[#F8FAFC] tabular-nums">Uber · 14,2 km</b></div>
          <div className="flex justify-between py-0.5"><span>Net estimé</span><b className="text-[#F8FAFC] tabular-nums">≈ 31 €/h</b></div>
          <div className="flex justify-between py-0.5"><span>Retour à vide</span><b className="text-[#F8FAFC]">faible</b></div>
        </div>
        <div className="flex items-center justify-center gap-2 text-[11px] text-white/40">
          <span className="rounded-full border border-white/10 px-2 py-1">double-tap</span>
          <span aria-hidden>↓</span>
        </div>
        <div className="rounded-2xl border border-success/40 bg-success/10 py-3 text-center text-[15px] font-extrabold text-[#34D399]" style={{ boxShadow: '0 10px 30px -10px rgba(16,185,129,.5)' }}>
          ✓ PRENDS-LA
        </div>
      </div>
    )
  }
  if (kind === 'map') {
    return (
      <div className="relative h-full w-full overflow-hidden" style={{ background: 'linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px) 0 0/28px 28px, linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px) 0 0/28px 28px, #0A0D18' }}>
        <span className="absolute h-16 w-16 animate-ping rounded-full" style={{ left: '18%', top: '24%', background: 'radial-gradient(circle, rgba(140,82,255,.5), transparent 70%)', animationDuration: '2.4s' }} />
        <span className="absolute h-24 w-24 animate-ping rounded-full" style={{ left: '54%', top: '44%', background: 'radial-gradient(circle, rgba(0,212,255,.45), transparent 70%)', animationDuration: '2.4s', animationDelay: '.6s' }} />
        <span className="absolute rounded-lg border border-accent-cyan/35 bg-foreas-obsidian/80 px-2.5 py-1.5 text-[10px] font-bold text-[#F8FAFC]" style={{ left: '50%', top: '30%' }}>
          Gare de Lyon <b className="text-accent-cyan tabular-nums">▲ ce soir</b>
        </span>
      </div>
    )
  }
  if (kind === 'voice') {
    return (
      <div className="relative flex h-full w-full flex-col items-center justify-center gap-4">
        <div className="flex items-center gap-1">
          {[22, 44, 60, 34, 52, 26, 46, 30].map((h, i) => (
            <span key={i} className="w-1.5 animate-pulse rounded-sm bg-gradient-to-b from-accent-cyan to-accent-purple" style={{ height: h, animationDelay: `${i * 0.08}s` }} />
          ))}
        </div>
        <p className="px-6 text-center text-[12.5px] italic text-white/70">« Reste pas à Châtelet. Gare de Lyon dans 20 minutes. »</p>
      </div>
    )
  }
  if (kind === 'compta') {
    return (
      <div className="relative flex h-full w-full flex-col items-center justify-center gap-2.5">
        <div className="relative h-[104px] w-[104px] rounded-full" style={{ background: 'conic-gradient(#F5C842 72%, rgba(255,255,255,.06) 0)' }}>
          <div className="absolute inset-2 flex items-center justify-center rounded-full bg-[#0B0E1A] text-[18px] font-extrabold tabular-nums">72 %</div>
        </div>
        <p className="text-[11px] text-white/50">Tirelire URSSAF — calculée à chaque course</p>
      </div>
    )
  }
  return (
    <div className="relative flex h-full w-full items-center justify-center gap-4 px-6">
      <div className="h-[76px] w-[76px] flex-none rounded-xl border-4 border-white bg-white/90" style={{ backgroundImage: 'conic-gradient(from 90deg at 3px 3px, transparent 25%, #0B0E1A 0)', backgroundSize: '13px 13px' }} />
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.045] p-3 text-[11px] text-white/70">
        <b className="mb-1 block text-[12px] text-[#34D399]">✓ Réservation reçue</b>
        Sarah · CDG → Paris 11ᵉ<br />Demain <span className="tabular-nums">09:40</span> · prix fixe
      </div>
    </div>
  )
}

/* ─── DESKTOP : bloc de texte défilant (déclenche le changement de feature + tracking) ───────── */
function FeatureTextDesktop({ feature, index, onActive }: { feature: Feature; index: number; onActive: (i: number) => void }) {
  const ref = useSectionSeen<HTMLDivElement>(feature.eyebrow, index)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    // Feature « active » quand le bloc croise le centre vertical de l'écran. Dernière entrée du
    // batch = état réel après un fling rapide (audit juge:code).
    const io = new IntersectionObserver(
      (entries) => { const e = entries[entries.length - 1]; if (e.isIntersecting) onActive(index) },
      { rootMargin: '-45% 0px -45% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [index, onActive, ref])

  return (
    <div ref={ref} className="flex min-h-dvh flex-col justify-center">
      <p className="mb-3 text-[11px] font-extrabold uppercase text-accent-cyan" style={{ letterSpacing: '.24em' }}>{feature.eyebrow}</p>
      <h2 className="font-title font-semibold leading-[1.02] text-[clamp(34px,4.4vw,60px)]" style={{ letterSpacing: '-.04em' }}>{feature.title}</h2>
      <p className="mt-4 max-w-[30ch] text-[17px] leading-relaxed text-white/65">{feature.sub}</p>
    </div>
  )
}

/* ─── MOBILE : téléphone en haut + texte dessous, révélé au scroll ──────────────────────────── */
function FeatureBlockMobile({ feature, index }: { feature: Feature; index: number }) {
  const ref = useSectionSeen<HTMLElement>(feature.eyebrow, index)
  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="border-t border-white/[0.05] px-5 py-12"
    >
      <PhoneFrame widthClassName="w-[230px]">
        <FeatureIllus kind={feature.illus} />
      </PhoneFrame>
      <p className="mb-2 mt-8 text-center text-[11px] font-extrabold uppercase text-accent-cyan" style={{ letterSpacing: '.24em' }}>{feature.eyebrow}</p>
      <h2 className="text-center font-title font-semibold leading-[1.05] text-[30px]" style={{ letterSpacing: '-.03em' }}>{feature.title}</h2>
      <p className="mx-auto mt-3 max-w-[32ch] text-center text-[15px] leading-relaxed text-white/65">{feature.sub}</p>
    </motion.section>
  )
}

/* ─── Composant principal ───────────────────────────────────────────────────────────────────── */
export default function StickyFeatures({ isMobile }: { isMobile: boolean }) {
  const sectionRef = useRef<HTMLElement>(null)
  const [active, setActive] = useState(0)

  // Tilt 3D lié au scroll (desktop). Hooks appelés inconditionnellement (règle des hooks).
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] })
  const rotateY = useSpring(useTransform(scrollYProgress, [0, 1], [-6, 6]), { stiffness: 120, damping: 28 })
  const rotateX = useSpring(useTransform(scrollYProgress, [0, 0.5, 1], [3, 0, -3]), { stiffness: 120, damping: 28 })

  if (isMobile) {
    return (
      <div className="relative z-10">
        {FEATURES.map((f, i) => <FeatureBlockMobile key={i} feature={f} index={i} />)}
      </div>
    )
  }

  return (
    <section ref={sectionRef} className="relative z-10 mx-auto grid max-w-6xl grid-cols-2 gap-8 px-8 lg:gap-16">
      {/* colonne gauche : les textes qui défilent */}
      <div>
        {FEATURES.map((f, i) => <FeatureTextDesktop key={i} feature={f} index={i} onActive={setActive} />)}
      </div>

      {/* colonne droite : le téléphone COLLÉ, dont l'écran change de feature */}
      <div className="sticky top-0 flex h-dvh items-center justify-center" style={{ perspective: 1200 }}>
        <motion.div style={{ rotateY, rotateX, transformStyle: 'preserve-3d', willChange: 'transform' }}>
          <PhoneFrame widthClassName="w-[300px] lg:w-[340px]">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="absolute inset-0 transition-opacity duration-500"
                style={{ opacity: active === i ? 1 : 0 }}
                aria-hidden={active !== i}
              >
                <FeatureIllus kind={f.illus} />
              </div>
            ))}
          </PhoneFrame>
        </motion.div>
      </div>
    </section>
  )
}

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
 * Les écrans (FeatureScreens.tsx) reproduisent le langage visuel EXACT du design « Fiches Store
 * FOREAS » de Chandler : dégradé de tête, eyebrow Genos cyan, titre 46px, hexagones H3 dorés.
 * Ils sont dessinés à l'échelle réelle 430×932 puis mis à l'échelle en CSS (unités de conteneur),
 * donc rigoureusement identiques à 165px comme à 340px de large.
 *
 * Architecture validée par l'audit Fable 5 (CSS sticky + Framer, pas de GSAP ; jamais de
 * MotionValue→setState ; will-change ciblé ; h-dvh ; gate mobile via useIsMobile).
 */

import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import PhoneFrame from './PhoneFrame'
import FeatureScreen, { type ScreenKind } from './FeatureScreens'
import { useSectionSeen } from '@/hooks/useSectionSeen'

interface Feature { eyebrow: string; title: string; sub: string; illus: ScreenKind }

// Titres +100/100 (audit copy-atomic Fable 5, 41 versions notées dans la peau du chauffeur).
// ⚠️ Le Verdict instant N'EST PLUS ici : il a sa propre scène cinéma (VerdictSequence), première
// vue de la page. Restent les 4 features suivantes, dans l'ordre : zone → vocale → client direct → compta.
export const FEATURES: Feature[] = [
  {
    // Inversion temporelle : il passe devant la plateforme elle-même.
    eyebrow: 'Où ça paie',
    title: 'La zone s’allume. Ton appli sonne après.',
    sub: 'La carte t’allume, à 800 m près, le coin qui va payer — quand les demandes tombent, tu y es déjà.',
    illus: 'zone',
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
    illus: 'direct',
  },
  {
    // Guardrail légal : « se calcule », JAMAIS « on fait ta compta ». URSSAF = stop-scroll à lui seul.
    eyebrow: 'Zéro saisie',
    title: 'Ta tirelire URSSAF se calcule toute seule.',
    sub: 'Course après course, tu vois exactement ce qu’il faudra sortir au trimestre — zéro saisie, zéro douche froide.',
    illus: 'compta',
  },
]

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
function FeatureBlockMobile({ feature, index, isLast }: { feature: Feature; index: number; isLast: boolean }) {
  const ref = useSectionSeen<HTMLElement>(feature.eyebrow, index)
  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="border-t border-white/[0.05] px-5 py-12"
      // le DERNIER bloc réserve la place de la barre « Discuter avec Ajnaya » (sinon son
      // dernier paragraphe passe dessous) — même variable que les scènes cinéma
      style={isLast ? { paddingBottom: 'calc(var(--cta-clearance) + 16px)' } : undefined}
    >
      <PhoneFrame widthClassName="h-[min(46svh,380px)] w-auto">
        <FeatureScreen kind={feature.illus} />
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
        {FEATURES.map((f, i) => <FeatureBlockMobile key={i} feature={f} index={i} isLast={i === FEATURES.length - 1} />)}
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
      <div className="sticky top-0 z-30 flex h-dvh items-center justify-center" style={{ perspective: 1200, paddingBottom: 'var(--cta-clearance)' }}>
        <motion.div style={{ rotateY, rotateX, transformStyle: 'preserve-3d', willChange: 'transform' }}>
          <PhoneFrame widthClassName="h-[min(64vh,560px)] w-auto">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="absolute inset-0 transition-opacity duration-500"
                style={{ opacity: active === i ? 1 : 0 }}
                aria-hidden={active !== i}
              >
                <FeatureScreen kind={f.illus} />
              </div>
            ))}
          </PhoneFrame>
        </motion.div>
      </div>
    </section>
  )
}

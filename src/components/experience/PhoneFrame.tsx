'use client'

/**
 * PhoneFrame — le cadre iPhone réaliste, SANS contenu (chrome seul).
 * Extrait de LivePhone.tsx (même markup/ombre/île dynamique) pour être réutilisé par la
 * section features en scroll collant (StickyFeatures) où l'écran affiche une vidéo/illustration
 * de la feature, pas le chat.
 *
 * L'écran (`children`) est un conteneur `relative` → on peut empiler des illustrations en
 * `absolute inset-0` et les fondre en croisé (opacité) au changement de feature.
 *
 * Proportion iPhone réelle (~0.465 l/h). L'ombre est STATIQUE (jamais animée : une ombre animée
 * = repaint par frame = jank — audit Fable 5). Le tilt 3D éventuel est porté par un parent
 * motion.div, pas par ce composant.
 */

interface PhoneFrameProps {
  children: React.ReactNode
  /** Largeur du cadre (classe Tailwind). Défaut = même échelle que LivePhone. */
  widthClassName?: string
  className?: string
}

export default function PhoneFrame({
  children,
  widthClassName = 'w-[270px] md:w-[320px]',
  className = '',
}: PhoneFrameProps) {
  return (
    <div className={`relative mx-auto ${widthClassName} ${className}`}>
      <div
        className="relative rounded-[42px] bg-black p-[8px] md:rounded-[51px] md:p-[10px]"
        style={{ boxShadow: '0 0 0 1px rgba(255,255,255,.14), 0 24px 60px -20px rgba(0,0,0,.85), 0 0 60px -22px rgba(140,82,255,.4)' }}
      >
        {/* île dynamique — détail réaliste */}
        <div
          className="pointer-events-none absolute left-1/2 top-[18px] z-20 h-[22px] w-[92px] -translate-x-1/2 rounded-full bg-black md:top-[22px] md:h-[27px] md:w-[112px]"
          aria-hidden
        />
        {/* écran — conteneur relatif : les illustrations s'empilent en absolute inset-0 */}
        <div className="relative h-[460px] overflow-hidden rounded-[34px] bg-[#07080F] md:h-[545px] md:rounded-[41px]">
          {children}
        </div>
      </div>
    </div>
  )
}

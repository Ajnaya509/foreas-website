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
 * Proportion iPhone réelle 270×460 (l/h ≈ 0.587) portée par un `aspect-ratio` CSS CONSTANT
 * (pas une hauteur fixe en px) : n'importe quelle `widthClassName` donne automatiquement les
 * bonnes proportions. Bug corrigé (retour Chandler « mockup serré ») : une hauteur figée
 * (h-[460px]) combinée à une largeur réduite (ex. 190px mobile) écrasait le téléphone — ratio
 * 190/460 = 0.41 au lieu de 0.587. L'ombre est STATIQUE (jamais animée : une ombre animée =
 * repaint par frame = jank — audit Fable 5). Le tilt 3D éventuel est porté par un parent
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
    <div className={`relative mx-auto aspect-[270/460] ${widthClassName} ${className}`}>
      <div
        className="relative h-full rounded-[9%] bg-black p-[3%]"
        style={{ boxShadow: '0 0 0 1px rgba(255,255,255,.14), 0 24px 60px -20px rgba(0,0,0,.85), 0 0 60px -22px rgba(140,82,255,.4)' }}
      >
        {/* île dynamique — détail réaliste, proportionnelle à la largeur du cadre */}
        <div
          className="pointer-events-none absolute left-1/2 top-[6.7%] z-20 h-[5%] w-[34%] -translate-x-1/2 rounded-full bg-black"
          aria-hidden
        />
        {/* écran — conteneur relatif : les illustrations s'empilent en absolute inset-0 */}
        <div className="relative h-full overflow-hidden rounded-[8%] bg-[#07080F]">
          {children}
        </div>
      </div>
    </div>
  )
}

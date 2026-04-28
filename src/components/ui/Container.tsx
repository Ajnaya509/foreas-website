import React from 'react'

/**
 * Container — Site2026v55
 *
 * Container Müller-Brockmann strict :
 *  - Largeur max 1280px (max-w-7xl Tailwind = parfait pour 12 cols × 80px + gap)
 *  - Gutters : px-6 mobile / px-8 lg / px-12 wide (multiples 4pt)
 *  - mx-auto centré
 *
 * Variants :
 *  - 'default' : max-w-7xl (1280px) — sections principales
 *  - 'narrow'  : max-w-4xl (896px)  — articles, FAQ, légal
 *  - 'wide'    : max-w-[1440px]      — hero plein, section riche
 *
 * Usage :
 *   <Container>...</Container>
 *   <Container variant="narrow" as="article">...</Container>
 */

export type ContainerVariant = 'default' | 'narrow' | 'wide'

export interface ContainerProps extends React.HTMLAttributes<HTMLElement> {
  variant?: ContainerVariant
  as?: 'div' | 'section' | 'article' | 'main' | 'aside'
  children: React.ReactNode
}

const variantClasses: Record<ContainerVariant, string> = {
  default: 'max-w-7xl',           // 1280px
  narrow:  'max-w-4xl',           // 896px (lecture confortable)
  wide:    'max-w-[1440px]',      // 1440px
}

export function Container({
  variant = 'default',
  as: Tag = 'div',
  className = '',
  children,
  ...props
}: ContainerProps) {
  return (
    <Tag
      className={[
        'mx-auto',
        // Mobile-first padding (multiples 4pt)
        'px-6 sm:px-8 lg:px-10',
        variantClasses[variant],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </Tag>
  )
}

/**
 * Grid — système 12 colonnes Müller-Brockmann.
 *
 * Toujours 12 colonnes en CSS Grid, gap = 24px (lg:gap-8).
 * Children utilisent `col-span-X` Tailwind pour se positionner.
 *
 * Usage :
 *   <Grid>
 *     <div className="col-span-12 md:col-span-7">Hero text</div>
 *     <div className="col-span-12 md:col-span-5">Hero image</div>
 *   </Grid>
 */

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: 'sm' | 'md' | 'lg' | 'xl'
  children: React.ReactNode
}

const gapClasses = {
  sm: 'gap-3 md:gap-4',
  md: 'gap-4 md:gap-6',
  lg: 'gap-6 md:gap-8',
  xl: 'gap-8 md:gap-12',
}

export function Grid({
  gap = 'lg',
  className = '',
  children,
  ...props
}: GridProps) {
  return (
    <div
      className={[
        'grid grid-cols-12',
        gapClasses[gap],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * Section — wrapper sémantique Bringhurst (rythme vertical baseline 4pt).
 *
 * - Padding vertical en multiples de 4pt
 * - Variants : sm (py-12), md (py-16), lg (py-24), xl (py-32)
 * - Wraps automatiquement dans un Container
 *
 * Usage :
 *   <Section size="md">
 *     <Grid>...</Grid>
 *   </Section>
 */

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  containerVariant?: ContainerVariant
  withContainer?: boolean
  children: React.ReactNode
}

const sectionPadding = {
  sm: 'py-12 md:py-16',          // 48-64px
  md: 'py-16 md:py-20',          // 64-80px
  lg: 'py-20 md:py-28',          // 80-112px
  xl: 'py-24 md:py-36',          // 96-144px
}

export function Section({
  size = 'lg',
  containerVariant = 'default',
  withContainer = true,
  className = '',
  children,
  ...props
}: SectionProps) {
  return (
    <section
      className={[
        'relative',
        sectionPadding[size],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {withContainer ? (
        <Container variant={containerVariant}>{children}</Container>
      ) : (
        children
      )}
    </section>
  )
}

export default Container

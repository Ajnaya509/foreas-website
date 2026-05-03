'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import TestimonialVideoCard from './TestimonialVideoCard'
import { TESTIMONIALS } from './testimonials.data'

/**
 * TestimonialCarousel — slider horizontal en boucle infinie avec auto-play
 *
 * Design system :
 * - 1 card visible mobile, 2 tablet, 3 desktop
 * - Auto-play 5s par card, pause au hover/touch/focus
 * - Loop infini (passe de card 6 à card 1 sans saut visuel)
 * - Drag/swipe natif touch + souris
 * - Indicateurs dots en bas
 * - Boutons prev/next sur desktop seulement
 * - Focus visible WCAG AA
 *
 * Skill foreas-design-system : variant violet + halos discrets, glass cards
 * Skill foreas-copy-atomic : preuve sociale Cialdini en mode "défilement infini"
 *                            qui amplifie la sensation de tribu (247 chauffeurs)
 */
export default function TestimonialCarousel() {
  const autoplayRef = useRef(
    Autoplay({
      delay: 5000,
      stopOnInteraction: false, // continue après touch (juste pause + reprise)
      stopOnMouseEnter: true,
      stopOnFocusIn: true,
    })
  )

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: 'start',
      slidesToScroll: 1,
      dragFree: false,
      containScroll: 'trimSnaps',
      breakpoints: {
        '(min-width: 640px)': { slidesToScroll: 1 },
        '(min-width: 1024px)': { slidesToScroll: 1 },
      },
    },
    [autoplayRef.current]
  )

  const [selectedIndex, setSelectedIndex] = useState(0)
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([])
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])
  const scrollTo = useCallback(
    (index: number) => emblaApi?.scrollTo(index),
    [emblaApi]
  )

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
    setCanScrollPrev(emblaApi.canScrollPrev())
    setCanScrollNext(emblaApi.canScrollNext())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    setScrollSnaps(emblaApi.scrollSnapList())
    onSelect()
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
    return () => {
      emblaApi.off('select', onSelect)
      emblaApi.off('reInit', onSelect)
    }
  }, [emblaApi, onSelect])

  return (
    <div className="relative">
      {/* ── Viewport carrousel ────────────────────────────────────────── */}
      <div
        ref={emblaRef}
        className="overflow-hidden"
        aria-roledescription="carousel"
        aria-label="Témoignages chauffeurs FOREAS"
      >
        <div className="flex gap-4 sm:gap-5">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={t.playbackId}
              className="flex-[0_0_85%] sm:flex-[0_0_calc(50%-10px)] lg:flex-[0_0_calc(33.333%-14px)] min-w-0"
              role="group"
              aria-roledescription="slide"
              aria-label={`Témoignage ${i + 1} sur ${TESTIMONIALS.length} — ${t.name}`}
            >
              <TestimonialVideoCard testimonial={t} index={i} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Boutons prev/next (desktop only) ──────────────────────────── */}
      <button
        type="button"
        onClick={scrollPrev}
        disabled={!canScrollPrev}
        aria-label="Témoignage précédent"
        className="hidden lg:flex absolute -left-2 xl:-left-12 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/[0.06] border border-white/[0.10] backdrop-blur-md items-center justify-center text-[#F8FAFC] hover:bg-white/[0.12] hover:border-white/[0.20] transition-all disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        type="button"
        onClick={scrollNext}
        disabled={!canScrollNext}
        aria-label="Témoignage suivant"
        className="hidden lg:flex absolute -right-2 xl:-right-12 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/[0.06] border border-white/[0.10] backdrop-blur-md items-center justify-center text-[#F8FAFC] hover:bg-white/[0.12] hover:border-white/[0.20] transition-all disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* ── Dots indicateurs ──────────────────────────────────────────── */}
      <div
        className="flex items-center justify-center gap-2 mt-6"
        role="tablist"
        aria-label="Navigation directe vers un témoignage"
      >
        {scrollSnaps.map((_, index) => {
          const isActive = index === selectedIndex
          return (
            <button
              key={index}
              type="button"
              onClick={() => scrollTo(index)}
              role="tab"
              aria-selected={isActive}
              aria-label={`Aller au témoignage ${index + 1} sur ${scrollSnaps.length}`}
              className={`transition-all rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
                isActive
                  ? 'w-8 h-2 bg-gradient-to-r from-violet-400 to-cyan-300'
                  : 'w-2 h-2 bg-white/[0.20] hover:bg-white/[0.40]'
              }`}
            />
          )
        })}
      </div>

      {/* ── Compteur tabular-nums ─────────────────────────────────────── */}
      <p className="text-center text-white/40 text-[10px] uppercase mt-3 tabular-nums" style={{ letterSpacing: '0.18em' }}>
        {String(selectedIndex + 1).padStart(2, '0')} / {String(scrollSnaps.length).padStart(2, '0')}
      </p>
    </div>
  )
}

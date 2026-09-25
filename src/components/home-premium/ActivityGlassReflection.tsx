'use client'

import { useEffect, useId, useRef } from 'react'
import s from './home.module.css'

type Point = { x: number; y: number; nx: number; ny: number }

function roundedContour(width: number, height: number) {
  const inset = .5
  const radius = Math.min(19.5, (height - 1) / 2)
  const right = width - inset
  const bottom = height - inset
  const horizontal = width - 2 * inset - 2 * radius
  const vertical = height - 2 * inset - 2 * radius
  const corner = Math.PI * radius / 2
  const line = (length: number, x: number, y: number, dx: number, dy: number, nx: number, ny: number) => ({
    length, point: (d: number): Point => ({ x: x + d * dx, y: y + d * dy, nx, ny }),
  })
  const arc = (x: number, y: number, start: number) => ({
    length: corner,
    point: (d: number): Point => {
      const angle = start + d / radius
      const nx = Math.cos(angle)
      const ny = Math.sin(angle)
      return { x: x + radius * nx, y: y + radius * ny, nx, ny }
    },
  })
  const edges = [
    line(horizontal, inset + radius, inset, 1, 0, 0, -1),
    arc(right - radius, inset + radius, -Math.PI / 2),
    line(vertical, right, inset + radius, 0, 1, 1, 0),
    arc(right - radius, bottom - radius, 0),
    line(horizontal, right - radius, bottom, -1, 0, 0, 1),
    arc(inset + radius, bottom - radius, Math.PI / 2),
    line(vertical, inset, bottom - radius, 0, -1, -1, 0),
    arc(inset + radius, inset + radius, Math.PI),
  ]
  const length = edges.reduce((sum, edge) => sum + edge.length, 0)
  return {
    length,
    start: horizontal / 2,
    pointAt(distance: number) {
      let d = ((distance % length) + length) % length
      for (const edge of edges) {
        if (d <= edge.length) return edge.point(d)
        d -= edge.length
      }
      return edges[0].point(0)
    },
  }
}

/** A single tapered ribbon, drawn at the card's real size, with no dashed joins. */
export default function ActivityGlassReflection() {
  const id = useId()
  const svgRef = useRef<SVGSVGElement>(null)
  const ribbonRef = useRef<SVGPathElement>(null)
  const gradientRef = useRef<SVGLinearGradientElement>(null)

  useEffect(() => {
    const svg = svgRef.current
    const ribbon = ribbonRef.current
    const gradient = gradientRef.current
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (!svg || !ribbon || !gradient || reducedMotion.matches) return

    let width = svg.clientWidth
    let contour = roundedContour(width, svg.clientHeight)
    const observer = new ResizeObserver(([entry]) => {
      width = entry.contentRect.width
      contour = roundedContour(width, entry.contentRect.height)
    })
    observer.observe(svg)
    const started = performance.now()
    let frame = 0
    const smooth = (value: number) => {
      const t = Math.max(0, Math.min(1, value))
      return t * t * (3 - 2 * t)
    }
    const stop = () => {
      cancelAnimationFrame(frame)
      ribbon.style.opacity = '0'
      observer.disconnect()
    }
    const draw = (now: number) => {
      const progress = Math.max(0, (now - started - 140) / 3200)
      if (progress >= 1 || document.hidden) { stop(); return }
      const span = Math.min(width * .82, contour.length * .4)
      const center = contour.start + progress * contour.length
      const outer: string[] = []
      const inner: string[] = []
      for (let i = 0; i <= 128; i++) {
        const t = i / 128
        const point = contour.pointAt(center + (t - .5) * span)
        const halfWidth = 1.35 * Math.pow(Math.sin(Math.PI * t), 1.6)
        outer.push(`${(point.x + point.nx * halfWidth).toFixed(2)},${(point.y + point.ny * halfWidth).toFixed(2)}`)
        inner.push(`${(point.x - point.nx * halfWidth).toFixed(2)},${(point.y - point.ny * halfWidth).toFixed(2)}`)
      }
      ribbon.setAttribute('d', `M${outer.join(' L')} L${inner.reverse().join(' L')} Z`)
      ribbon.style.opacity = String(.82 * smooth(progress / .12) * smooth((1 - progress) / .22))
      const tail = contour.pointAt(center - span / 2)
      const head = contour.pointAt(center + span / 2)
      gradient.setAttribute('x1', String(tail.x))
      gradient.setAttribute('y1', String(tail.y))
      gradient.setAttribute('x2', String(head.x))
      gradient.setAttribute('y2', String(head.y))
      frame = requestAnimationFrame(draw)
    }
    frame = requestAnimationFrame(draw)
    reducedMotion.addEventListener('change', stop)
    return () => { stop(); reducedMotion.removeEventListener('change', stop) }
  }, [])

  return <svg ref={svgRef} className={s.activityTrace} aria-hidden="true">
    <defs>
      {/* The supplied graphic has a violet centre and cyan extremities. */}
      <linearGradient ref={gradientRef} id={`${id}-light`} gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#1BDAFF" />
        <stop offset=".5" stopColor="#8C52FF" />
        <stop offset="1" stopColor="#1BDAFF" />
      </linearGradient>
    </defs>
    <path ref={ribbonRef} className={s.activityRibbon} fill={`url(#${id}-light)`} />
  </svg>
}

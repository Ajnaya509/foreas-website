'use client'

import { useRef, useState, type ReactNode, type MouseEvent } from 'react'

interface TiltCardProps {
  children: ReactNode
  className?: string
  maxTilt?: number
}

export default function TiltCard({ children, className = '', maxTilt = 8 }: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [style, setStyle] = useState({ transform: 'perspective(800px) rotateX(0deg) rotateY(0deg)' })
  const [isHovering, setIsHovering] = useState(false)

  // Only tilt on devices with hover (no touch)
  const canHover = typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!canHover || !cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    setStyle({
      transform: `perspective(800px) rotateX(${-y * maxTilt}deg) rotateY(${x * maxTilt}deg)`,
    })
  }

  const handleMouseLeave = () => {
    setIsHovering(false)
    setStyle({ transform: 'perspective(800px) rotateX(0deg) rotateY(0deg)' })
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={handleMouseLeave}
      className={className}
      style={{
        ...style,
        transition: isHovering ? 'transform 0.1s ease-out' : 'transform 0.4s ease-out',
        willChange: 'transform',
      }}
    >
      {children}
    </div>
  )
}

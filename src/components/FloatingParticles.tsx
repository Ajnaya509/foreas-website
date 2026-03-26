'use client'

import { useMemo } from 'react'
import { useIsMobile } from '@/hooks/useDevicePerf'

interface FloatingParticlesProps {
  count?: number
  className?: string
}

export default function FloatingParticles({ count = 18, className = '' }: FloatingParticlesProps) {
  const isMobile = useIsMobile()
  const particleCount = isMobile ? Math.min(count, 8) : count

  const particles = useMemo(() =>
    Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: 1.5 + Math.random() * 2.5,
      opacity: 0.02 + Math.random() * 0.03,
      duration: 12 + Math.random() * 18,
      delay: Math.random() * 10,
    })),
    [particleCount]
  )

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full bg-white"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            animation: `floatParticle ${p.duration}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes floatParticle {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(15px, -20px); }
          50% { transform: translate(-10px, -35px); }
          75% { transform: translate(20px, -15px); }
        }
      `}</style>
    </div>
  )
}

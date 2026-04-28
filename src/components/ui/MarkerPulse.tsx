'use client'

import React from 'react'

/**
 * MarkerPulse — Site2026v43
 *
 * Mirror du marker signature de l'app FOREAS Driver (HomeScreen Mapbox dot).
 * 3 rings concentriques cyan→violet en pulse 2.5s + dot central gradient 3-stops.
 *
 * Élément SIGNATURE — utilisé pour évoquer le tracking temps réel d'Ajnaya.
 *
 * Usage :
 *   <MarkerPulse size={48} />          // 48px conteneur
 *   <MarkerPulse size={64} className="ml-md" />
 */

export interface MarkerPulseProps {
  size?: number          // px — taille du conteneur
  className?: string
}

export function MarkerPulse({ size = 48, className = '' }: MarkerPulseProps) {
  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <span className="marker-ring marker-ring-1" />
      <span className="marker-ring marker-ring-2" />
      <span className="marker-ring marker-ring-3" />
      <span className="marker-dot" />
    </div>
  )
}

export default MarkerPulse

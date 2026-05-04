'use client'

import { useCallback, useRef, useState } from 'react'

/**
 * useGeolocation — wrapper Apple-grade autour de navigator.geolocation
 *
 * États fins :
 * - idle       : aucune action
 * - requesting : permission demandée (ou GPS en cours)
 * - granted    : position obtenue
 * - denied     : utilisateur refusé (ou Permissions API → denied)
 * - unsupported: API absente (vieux browsers)
 * - error      : timeout, position unavailable, etc.
 *
 * Usage :
 *   const { state, coords, error, request } = useGeolocation()
 *   <button onClick={request} disabled={state === 'requesting'}>...</button>
 *
 * Spec :
 * - High accuracy (utile pour matcher une zone VTC précise type T1 CDG vs T2)
 * - Timeout 10 s (Apple iPhone met 2-4 s en moyenne)
 * - Pas de cache (maximumAge: 0) — on veut la position EN DIRECT, pas où le
 *   chauffeur était il y a 5 min
 */

export type GeolocationState =
  | 'idle'
  | 'requesting'
  | 'granted'
  | 'denied'
  | 'unsupported'
  | 'error'

export interface GeolocationCoords {
  lat: number
  lng: number
  accuracy: number // mètres
  timestamp: number
}

export interface UseGeolocationReturn {
  state: GeolocationState
  coords: GeolocationCoords | null
  error: string | null
  /** Déclenche une demande de position (one-shot). */
  request: () => Promise<GeolocationCoords | null>
  /** Reset à idle. */
  reset: () => void
}

export function useGeolocation(): UseGeolocationReturn {
  const [state, setState] = useState<GeolocationState>('idle')
  const [coords, setCoords] = useState<GeolocationCoords | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inFlightRef = useRef(false)

  const request = useCallback((): Promise<GeolocationCoords | null> => {
    // Empêche les doubles-clics
    if (inFlightRef.current) return Promise.resolve(coords)

    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setState('unsupported')
      setError('La géolocalisation n’est pas disponible sur cet appareil.')
      return Promise.resolve(null)
    }

    inFlightRef.current = true
    setState('requesting')
    setError(null)

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const c: GeolocationCoords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            timestamp: pos.timestamp,
          }
          setCoords(c)
          setState('granted')
          inFlightRef.current = false
          resolve(c)
        },
        (err) => {
          inFlightRef.current = false
          if (err.code === err.PERMISSION_DENIED) {
            setState('denied')
            setError('Activez la localisation pour que je vous dise où ça paie autour de vous.')
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            setState('error')
            setError('Position indisponible — réessayez ou tapez votre zone manuellement.')
          } else if (err.code === err.TIMEOUT) {
            setState('error')
            setError('Le GPS met du temps à répondre — tapez votre zone manuellement.')
          } else {
            setState('error')
            setError('Une erreur est survenue. Tapez votre zone manuellement.')
          }
          resolve(null)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        },
      )
    })
  }, [coords])

  const reset = useCallback(() => {
    setState('idle')
    setCoords(null)
    setError(null)
    inFlightRef.current = false
  }, [])

  return { state, coords, error, request, reset }
}

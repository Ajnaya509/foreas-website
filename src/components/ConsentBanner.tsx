'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { setTrackingConsent, loadTrackingPixels } from '@/lib/consent'

export function ConsentBanner() {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const cookieExists = document.cookie.includes('foreas_consent=')
    if (!cookieExists) setShowBanner(true)
  }, [])

  const handleAccept = () => {
    setTrackingConsent(true)
    setShowBanner(false)
    loadTrackingPixels()
  }

  const handleReject = () => {
    setTrackingConsent(false)
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-[#0a0a10] border-t border-[#00D4FF]/30 px-4 py-3 md:py-4">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <p className="text-xs md:text-sm text-gray-400 flex-1 leading-relaxed">
          On utilise des pixels de mesure (TikTok, Meta) pour optimiser nos campagnes.{' '}
          <Link href="/confidentialite" className="text-[#00D4FF] hover:underline">
            Politique de confidentialité
          </Link>
        </p>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={handleReject}
            className="px-3 py-1.5 border border-gray-600 text-gray-400 rounded-md hover:border-gray-400 transition text-xs font-medium"
          >
            Refuser
          </button>
          <button
            onClick={handleAccept}
            className="px-3 py-1.5 bg-[#00D4FF] text-[#050508] rounded-md hover:bg-cyan-400 transition text-xs font-bold"
          >
            Accepter
          </button>
        </div>
      </div>
    </div>
  )
}

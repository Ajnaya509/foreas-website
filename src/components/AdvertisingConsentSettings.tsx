'use client'

import { useEffect, useState } from 'react'
import {
  acceptAdvertisingConsent,
  getAdvertisingConsentState,
  syncPendingAdvertisingConsent,
  withdrawAdvertisingConsent,
} from '@/lib/consent'

export function AdvertisingConsentSettings() {
  const [choice, setChoice] = useState<'accepted' | 'rejected' | 'unknown'>('unknown')
  const [busy, setBusy] = useState<'accept' | 'withdraw' | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    setChoice(getAdvertisingConsentState())
    void syncPendingAdvertisingConsent().then(() => setChoice(getAdvertisingConsentState()))
    const refresh = () => setChoice(getAdvertisingConsentState())
    const storage = (event: StorageEvent) => {
      if (event.key === 'foreas_consent') refresh()
    }
    window.addEventListener('foreas_consent_changed', refresh)
    window.addEventListener('storage', storage)
    return () => {
      window.removeEventListener('foreas_consent_changed', refresh)
      window.removeEventListener('storage', storage)
    }
  }, [])

  const accept = async () => {
    setBusy('accept')
    setMessage('')
    const result = await acceptAdvertisingConsent()
    setChoice(getAdvertisingConsentState())
    setMessage(result.ok
      ? 'Choix enregistré. Tu peux le retirer ici à tout moment.'
      : "Impossible d’enregistrer ton accord. Aucun suivi publicitaire n’a été activé.")
    setBusy(current => current === 'accept' ? null : current)
  }

  const withdraw = async () => {
    setBusy('withdraw')
    setMessage('')
    const result = await withdrawAdvertisingConsent()
    setChoice('rejected')
    setMessage(result.persisted
      ? 'Suivi publicitaire arrêté.'
      : 'Suivi arrêté sur cet appareil. Le retrait sera resynchronisé dès que le réseau revient.')
    setBusy(current => current === 'withdraw' ? null : current)
  }

  return (
    <div id="choix-publicitaire" className="scroll-mt-28 rounded-2xl border border-glass-border bg-glass-low p-5 md:p-6">
      <h2 className="mb-3 font-title text-lg font-semibold text-text-primary md:text-xl">
        Gère la mesure publicitaire
      </h2>
      <p className="font-sans text-sm leading-relaxed text-text-secondary md:text-base">
        Meta et TikTok nous aident à savoir quelles annonces sont utiles. Refuser ne change ni le site,
        ni l’essai, ni le paiement.
      </p>
      <p className="mt-3 text-sm text-text-secondary" aria-live="polite">
        État : {choice === 'accepted' ? 'accepté' : choice === 'rejected' ? 'refusé' : 'pas encore choisi'}.
      </p>
      <div className="mt-4 flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          disabled={busy === 'accept' || choice === 'accepted'}
          onClick={accept}
          className="min-h-11 rounded-xl border border-glass-border-high bg-glass-low px-5 text-sm font-semibold text-text-primary disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-foreas-obsidian"
        >
          Autoriser la mesure publicitaire
        </button>
        <button
          type="button"
          disabled={busy === 'withdraw' || (busy !== 'accept' && choice === 'rejected')}
          onClick={withdraw}
          className="min-h-11 rounded-xl border border-glass-border-high bg-glass-low px-5 text-sm font-semibold text-text-primary disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-foreas-obsidian"
        >
          {choice === 'accepted' ? 'Retirer mon accord' : 'Refuser la mesure publicitaire'}
        </button>
      </div>
      {message && <p className="mt-3 text-sm text-text-secondary" role="status">{message}</p>}
    </div>
  )
}

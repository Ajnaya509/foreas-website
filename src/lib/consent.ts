'use client'

export function hasTrackingConsent(): boolean {
  if (typeof window === 'undefined') return false

  const cookieConsent = document.cookie
    .split(';')
    .find(c => c.trim().startsWith('foreas_consent='))
    ?.split('=')[1]

  if (cookieConsent === 'accepted') return true

  return localStorage.getItem('foreas_consent') === 'accepted'
}

export function setTrackingConsent(accepted: boolean) {
  const value = accepted ? 'accepted' : 'rejected'
  const date = new Date()
  date.setFullYear(date.getFullYear() + 1)
  document.cookie = `foreas_consent=${value}; path=/; expires=${date.toUTCString()}; secure; samesite=strict`
  localStorage.setItem('foreas_consent', value)
}

export function loadTrackingPixels() {
  // Called after consent — pixels load themselves via React re-render
  // Dispatch a custom event so pixel components can react
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('foreas_consent_accepted'))
  }
}

'use client'

import { FormEvent, useState } from 'react'

export default function WhatsAppVerificationForm() {
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!/^\d{4,10}$/.test(code) || busy) return
    setBusy(true)
    setMessage(null)
    try {
      const response = await fetch('/api/app/verify-whatsapp-handoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const payload = await response.json().catch(() => ({})) as { ok?: boolean; next?: string; message?: string }
      if (response.ok && payload.ok && payload.next?.startsWith('/wa?')) {
        window.location.assign(payload.next)
        return
      }
      setMessage(payload.message || 'Le code ne fonctionne pas. Réessaie.')
    } catch {
      setMessage('La vérification ne répond pas. Réessaie dans un instant.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="mt-7">
      <label htmlFor="whatsapp-code" className="mb-2 block text-sm font-medium text-white/80">Code reçu par SMS</label>
      <input
        id="whatsapp-code"
        value={code}
        onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 10))}
        inputMode="numeric"
        autoComplete="one-time-code"
        autoFocus
        aria-describedby={message ? 'whatsapp-code-error' : undefined}
        className="h-14 w-full rounded-xl border border-white/15 bg-white px-4 text-center text-2xl font-semibold tracking-[0.32em] text-[#111318] outline-none focus:border-[#25D366] focus:ring-4 focus:ring-[#25D366]/15"
        placeholder="000000"
      />
      {message && <p id="whatsapp-code-error" role="alert" className="mt-3 text-sm text-[#FF8B8B]">{message}</p>}
      <button
        type="submit"
        disabled={busy || !/^\d{4,10}$/.test(code)}
        className="mt-5 h-14 w-full rounded-xl bg-[#25D366] px-5 text-base font-semibold text-[#07110A] transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45"
      >
        {busy ? 'Vérification…' : 'Continuer sur WhatsApp'}
      </button>
      <p className="mt-4 text-center text-xs leading-5 text-white/45">
        Ton numéro sert uniquement à sécuriser cette reprise de conversation.
      </p>
    </form>
  )
}

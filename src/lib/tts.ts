let currentAudio: HTMLAudioElement | null = null

export async function speakText(text: string): Promise<void> {
  stopSpeaking()
  try {
    const shortText = text.length > 200 ? text.split('.')[0] + '.' : text
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: shortText }),
    })
    if (!res.ok) return
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    currentAudio = new Audio(url)
    currentAudio.volume = 0.85
    return new Promise(resolve => {
      currentAudio!.onended = () => { URL.revokeObjectURL(url); currentAudio = null; resolve() }
      currentAudio!.onerror = () => { URL.revokeObjectURL(url); currentAudio = null; resolve() }
      currentAudio!.play().catch(() => resolve())
    })
  } catch { /* silent */ }
}

export function stopSpeaking() {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio = null
  }
}

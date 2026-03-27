'use client'

let currentAudio: HTMLAudioElement | null = null
let audioUnlocked = false

// Appeler cette fonction sur la PREMIÈRE interaction utilisateur (clic send ou clic micro)
// Elle joue un son silencieux pour débloquer l'autoplay
export function unlockAudio() {
  if (audioUnlocked) return
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const buffer = ctx.createBuffer(1, 1, 22050)
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(ctx.destination)
    source.start(0)
    audioUnlocked = true
    console.log('[TTS] Audio unlocked via user gesture')
  } catch (e) {
    console.warn('[TTS] Audio unlock failed:', e)
  }
}

export async function speakText(text: string): Promise<void> {
  stopSpeaking()

  try {
    console.log('[TTS] Requesting:', text.substring(0, 60))

    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })

    if (!res.ok) {
      console.warn('[TTS] API error:', res.status)
      return
    }

    const blob = await res.blob()
    console.log('[TTS] Blob:', blob.size, 'bytes, type:', blob.type)

    if (blob.size < 100) {
      console.warn('[TTS] Blob too small')
      return
    }

    const url = URL.createObjectURL(blob)
    currentAudio = new Audio(url)
    currentAudio.volume = 0.85

    return new Promise<void>((resolve) => {
      if (!currentAudio) return resolve()

      currentAudio.onended = () => {
        URL.revokeObjectURL(url)
        currentAudio = null
        resolve()
      }
      currentAudio.onerror = (e) => {
        console.warn('[TTS] Playback error:', e)
        URL.revokeObjectURL(url)
        currentAudio = null
        resolve()
      }

      currentAudio.play().then(() => {
        console.log('[TTS] Playing')
      }).catch((e) => {
        console.warn('[TTS] Play blocked:', e.message)
        URL.revokeObjectURL(url)
        currentAudio = null
        resolve()
      })
    })
  } catch (e) {
    console.warn('[TTS] Error:', e)
  }
}

export function stopSpeaking() {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
    currentAudio = null
  }
}

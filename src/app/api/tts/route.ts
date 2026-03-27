import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    const apiKey = process.env.ELEVENLABS_API_KEY
    const voiceId = process.env.ELEVENLABS_VOICE_ID || 'ucMmKRQbfDEYyb2IIGax'

    console.log('[TTS Route] Key:', apiKey ? apiKey.substring(0, 10) + '...' : 'MISSING', '| Voice:', voiceId)

    if (!apiKey || !text) {
      return NextResponse.json({ error: 'TTS non disponible' }, { status: 503 })
    }

    // Truncate to first sentence if > 200 chars
    const shortText = text.length > 200 ? (text.split('.')[0] + '.') : text

    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text: shortText,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.55,
          similarity_boost: 0.8,
          style: 0.3,
        },
      }),
    })

    if (!res.ok) {
      const errorText = await res.text().catch(() => 'no body')
      console.error('[TTS Route] ElevenLabs error:', res.status, errorText)
      return NextResponse.json({ error: 'TTS error' }, { status: 503 })
    }

    const audioBuffer = await res.arrayBuffer()
    console.log('[TTS Route] Audio buffer size:', audioBuffer.byteLength)

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('[tts] Error:', (error as Error).message)
    return NextResponse.json({ error: 'TTS error' }, { status: 503 })
  }
}

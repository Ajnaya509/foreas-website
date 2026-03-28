import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    const apiKey = process.env.ELEVENLABS_API_KEY
    const voiceId = process.env.ELEVENLABS_VOICE_ID || 'ucMmKRQbfDEYyb2IIGax'

    if (!apiKey || !text) {
      return NextResponse.json({ error: 'TTS non disponible' }, { status: 503 })
    }

    // Cap at 1000 chars — ElevenLabs supports up to 5000
    let spokenText = text.length > 1000
      ? text.substring(0, text.lastIndexOf('.', 1000) + 1) || text.substring(0, text.lastIndexOf(' ', 1000)) || text.substring(0, 1000)
      : text

    // Clean emojis — ElevenLabs reads them literally
    spokenText = spokenText.replace(/[\u{1F600}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu, '')

    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?optimize_streaming_latency=3&output_format=mp3_22050_32`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg',
        },
        body: JSON.stringify({
          text: spokenText,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.35,
            similarity_boost: 0.8,
            style: 0.55,
            speed: 1.2,
            use_speaker_boost: true,
          },
        }),
      }
    )

    if (!res.ok) {
      const errorText = await res.text().catch(() => 'no body')
      console.error('[TTS] ElevenLabs error:', res.status, errorText)
      return NextResponse.json({ error: 'TTS error' }, { status: 503 })
    }

    const audioBuffer = await res.arrayBuffer()

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('[TTS] Error:', (error as Error).message)
    return NextResponse.json({ error: 'TTS error' }, { status: 503 })
  }
}

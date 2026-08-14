import { NextRequest, NextResponse } from 'next/server'
import { isSameOriginRequest, forbiddenOrigin } from '@/lib/api-guard'

export const runtime = 'nodejs'

/** Plafond de caractères par appel. Chaque caractère envoyé consomme du quota ElevenLabs. */
const MAX_SPOKEN_CHARS = 1000

export async function POST(request: NextRequest) {
  try {
    // GARDE — cette route dépense du quota ElevenLabs à chaque appel, et ce quota
    // est le vrai plafond de FOREAS (~18-20 onboardings avant épuisement).
    // Elle n'est appelée que par nos propres pages (AjnayaConversationModal + lib/tts.ts) :
    // un appel qui ne vient pas d'une page FOREAS n'a aucune raison d'exister.
    if (!isSameOriginRequest(request)) {
      return forbiddenOrigin()
    }

    const { text } = await request.json()

    const apiKey = process.env.ELEVENLABS_API_KEY
    // KORALY — voix unique Ajnaya (cf. FOREAS-SHARED/AJNAYA_NORTH_STAR.md §2.1)
    // Aucun fallback vers une autre voice_id : rupture d'identité interdite.
    // 🚨 CORRIGÉ 12/07/2026 : albaa6OioIhKtKdCEkQw = "Laloosh" (voix arabe, erreur depuis 21/04) —
    // vraie Koraly = MNKK2Wl2wbbsEPQTHZGt. Si l'env Vercel ELEVENLABS_VOICE_ID pointe encore
    // vers l'ancien ID, ce fallback ne suffit pas — vérifier/mettre à jour l'env var aussi.
    const voiceId = process.env.ELEVENLABS_VOICE_ID || 'MNKK2Wl2wbbsEPQTHZGt'

    if (!apiKey || !text) {
      return NextResponse.json({ error: 'TTS non disponible' }, { status: 503 })
    }

    // Cap at 1000 chars — ElevenLabs supports up to 5000
    let spokenText = text.length > 1000
      ? text.substring(0, text.lastIndexOf('.', 1000) + 1) || text.substring(0, text.lastIndexOf(' ', 1000)) || text.substring(0, 1000)
      : text

    // Clean emojis — ElevenLabs reads them literally
    spokenText = spokenText.replace(/[\u{1F600}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu, '')

    // Strip markdown formatting — ElevenLabs reads asterisks/underscores
    spokenText = spokenText
      .replace(/\*\*(.+?)\*\*/g, '$1')   // **bold**
      .replace(/\*(.+?)\*/g, '$1')       // *italic*
      .replace(/__(.+?)__/g, '$1')       // __bold__
      .replace(/_(.+?)_/g, '$1')         // _italic_
      .replace(/~~(.+?)~~/g, '$1')       // ~~strikethrough~~
      .replace(/`(.+?)`/g, '$1')         // `code`

    // Expand abbreviations for natural speech
    spokenText = spokenText
      .replace(/(\d+),(\d+)\s*€/g, '$1 euros $2')           // 12,97€ → 12 euros 97
      .replace(/(\d+)\s*€\s*\/\s*semaine/gi, '$1 euros par semaine')  // 12€/semaine
      .replace(/(\d+)\s*€\s*\/\s*mois/gi, '$1 euros par mois')
      .replace(/(\d+)\s*€/g, '$1 euros')                    // 499€ → 499 euros
      .replace(/\b€\/h\b/gi, 'euros de l\'heure')
      .replace(/\b€\/km\b/gi, 'euros du kilomètre')
      .replace(/\bmin\b/gi, 'minutes')
      .replace(/\bh\b/gi, 'heures')
      .replace(/\bkm\b/gi, 'kilomètres')
      .replace(/\bCA\b/g, 'chiffre d\'affaires')
      .replace(/\brdv\b/gi, 'rendez-vous')
      .replace(/\bnb\b/gi, 'nombre')

    const res = await fetch(
      // eleven_v3 — upgrade Site2026v73 (sync avec backend Railway commit 07f660d)
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?optimize_streaming_latency=3&output_format=mp3_44100_64`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg',
        },
        body: JSON.stringify({
          text: spokenText,
          model_id: 'eleven_v3',
          voice_settings: {
            stability: 0.50,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true,
          },
        }),
      }
    )

    if (!res.ok) {
      const errorText = await res.text().catch(() => 'no body')
      console.error('[TTS] ElevenLabs error:', res.status, errorText)
      // On renvoie une CAUSE, pas un « TTS error » muet. Avant ce correctif, la voix
      // pouvait être morte en production sans que rien ne le dise : mesuré le
      // 14/08/2026, /api/tts répondait 503 « TTS error » et il était impossible de
      // savoir si c'était la clé, le quota ou la voix. Le code ci-dessous ne
      // divulgue aucun secret — seulement la nature de la panne.
      // Sur un 400, ElevenLabs range la vraie cause dans `detail.status` : un mot-clé
      // du genre `model_not_found`, `voice_not_found`, `invalid_api_key`. Ce n'est pas
      // un secret, c'est un code d'état — et sans lui on reste devant un « 400 » muet.
      // Mesuré en production le 14/08/2026 : la voix du site répondait 503 avec un 400
      // d'ElevenLabs, donc ni la clé (401) ni le quota (429), mais une requête refusée.
      let detail = ''
      try {
        const j = JSON.parse(errorText)
        detail = String(j?.detail?.status || j?.detail?.message || j?.status || '').slice(0, 60)
      } catch { /* corps non JSON : on garde le code HTTP seul */ }

      const reason =
        res.status === 401 ? 'cle_elevenlabs_refusee'
        : res.status === 429 ? 'quota_elevenlabs_epuise'
        : res.status === 404 ? 'voix_koraly_introuvable'
        : res.status >= 500 ? 'elevenlabs_indisponible'
        : 'elevenlabs_erreur_' + res.status + (detail ? '_' + detail : '')
      return NextResponse.json(
        { error: 'TTS indisponible', reason },
        { status: 503, headers: { 'Cache-Control': 'no-store' } },
      )
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

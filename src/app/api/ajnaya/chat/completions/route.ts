import { NextRequest } from 'next/server'

export const runtime = 'nodejs'

// This endpoint proxies OpenAI Chat Completions format to our main /api/ajnaya/chat
// ElevenLabs Custom LLM calls: POST {baseUrl}/chat/completions
// We forward the request body as-is — our main route detects OpenAI format via messages[]

export async function POST(request: NextRequest) {
  const body = await request.json()

  // Determine the base URL dynamically
  const proto = request.headers.get('x-forwarded-proto') || 'https'
  const host = request.headers.get('host') || 'www.foreas.xyz'
  const baseUrl = `${proto}://${host}`

  // Forward to our main chat route which handles OpenAI format
  const res = await fetch(`${baseUrl}/api/ajnaya/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  // Stream the response back (SSE or JSON)
  return new Response(res.body, {
    status: res.status,
    headers: {
      'Content-Type': res.headers.get('Content-Type') || 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

import { NextRequest, NextResponse } from 'next/server'
import { hasValidBearer, notFound } from '@/lib/api-guard'

export const runtime = 'nodejs'

/**
 * Pont au format OpenAI vers notre vrai cerveau `/api/ajnaya/chat`.
 * Destiné aux appels SERVEUR-À-SERVEUR (ElevenLabs « Custom LLM » appelle
 * `POST {baseUrl}/chat/completions`). Aucune page du site ne l'utilise.
 *
 * POURQUOI C'EST FERMÉ MAINTENANT (constat du 14/08/2026) :
 * cette route acceptait n'importe quelle requête, de n'importe où, sans aucun
 * contrôle, et transmettait tout au cerveau qui appelle Anthropic. Autrement dit :
 * un proxy Claude gratuit, ouvert sur Internet, facturé sur le compte FOREAS.
 * Il suffisait de connaître l'URL.
 *
 * VÉRIFICATION AVANT FERMETURE (preuve, pas supposition) : `widget_conversations`
 * contient 36 lignes au total, la dernière datée du 18/05/2026 — aucune trace
 * d'un agent vocal ElevenLabs branché ici.
 *
 * FAIL CLOSED : sans `AJNAYA_LLM_TOKEN` défini sur Vercel, la route renvoie 404.
 *
 * ⚠️ POUR REBRANCHER UN AGENT VOCAL ELEVENLABS :
 *   1. définir `AJNAYA_LLM_TOKEN` (chaîne aléatoire ≥ 32 caractères) sur Vercel ;
 *   2. coller EXACTEMENT la même valeur dans ElevenLabs → Custom LLM → API Key.
 *   Sans ces deux étapes, l'agent recevra 404. C'est voulu.
 */
export async function POST(request: NextRequest) {
  if (!hasValidBearer(request, 'AJNAYA_LLM_TOKEN')) {
    return notFound()
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide.' }, { status: 400 })
  }

  const proto = request.headers.get('x-forwarded-proto') || 'https'
  const host = request.headers.get('host') || 'www.foreas.xyz'
  const baseUrl = `${proto}://${host}`

  // On transmet le jeton au cerveau : c'est un appel serveur-à-serveur, il n'a
  // donc pas d'en-tête `Origin` et serait refusé par le garde d'origine.
  const res = await fetch(`${baseUrl}/api/ajnaya/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: request.headers.get('authorization') || '',
    },
    body: JSON.stringify(body),
  })

  return new Response(res.body, {
    status: res.status,
    headers: {
      'Content-Type': res.headers.get('Content-Type') || 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}

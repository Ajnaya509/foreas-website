import { NextRequest } from 'next/server'
import { isSameOriginRequest, forbiddenOrigin } from '@/lib/api-guard'
import { callPieuvreBrain } from '@/lib/pieuvre-client'
import { resolveSiteIdentity } from '@/lib/identityGate'
import { readAcquisitionFromRequest, persistAcquisition } from '@/lib/acquisitionServer'
import { clientServeurOuNull } from '@/lib/supabaseServeur'
import { empreinteDemandeur, sousPlafondAjnayaPartage } from '@/lib/plafondAjnaya'
import { repondreEnSecours, tracerLeSecours } from '@/lib/repliAjnaya'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * ⚠️ COMBIEN DE TEMPS CETTE PORTE A LE DROIT DE VIVRE — 03/09/2026.
 *
 * Sans cette ligne, la fonction est coupee par le defaut de l'hebergeur (10 s).
 * Or l'attente MESUREE du cerveau monte a 11 132 ms
 * (`pieuvre_analytics_events`, event_name='ajnaya_respond',
 * canal_source='widget_site') : la reponse existait, la base l'avait gardee, et
 * la personne ne voyait rien. Pire, le filet de secours n'avait meme pas le
 * temps de repondre a sa place.
 *
 * 30 s laisse la place a l'attente du cerveau PUIS au filet.
 *
 * ⚠️ NE PAS MONTER AU-DELA DE 60 SANS VERIFIER LE FORFAIT. L'hebergeur ne
 * rabote pas une valeur trop grande : il REFUSE le deploiement
 * (« must have a maxDuration between 1 and 60 for plan hobby »). 30 passe sur
 * tous les forfaits, et `api/webhooks/stripe/route.ts` tient deja 60.
 */
export const maxDuration = 30


/**
 * Flux du site au lancement : un seul cerveau, P15.
 * P15 répond d'un bloc ; on garde le contrat SSE du navigateur avec un delta
 * unique.
 *
 * ⚠️ 03/09 — CE COMMENTAIRE DISAIT « aucun autre modèle ne prend la parole si
 * la Pieuvre est indisponible ». Ce n'est PLUS vrai : un filet de secours
 * répond désormais quand elle se tait (voir plus bas, et `lib/repliAjnaya.ts`).
 * Un commentaire qu'on oublie de corriger devient un faux témoin.
 */

const enc = new TextEncoder()
const PAD = `:${' '.repeat(2048)}\n\n`
const sse = (event: string, data: unknown) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`

const SSE_HEADERS = {
  'Content-Type': 'text/event-stream; charset=utf-8',
  'Cache-Control': 'no-cache, no-transform',
  Connection: 'keep-alive',
  'X-Accel-Buffering': 'no',
  'Content-Encoding': 'identity',
}

function sseError(code: string, message = 'Ajnaya est momentanément indisponible.') {
  return new Response(enc.encode(PAD + sse('error', { code, message })), { headers: SSE_HEADERS })
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return forbiddenOrigin()

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return sseError('bad_request', 'Message illisible.')
  }

  const userMessage = typeof body.message === 'string' ? body.message.trim() : ''
  if (!userMessage) return sseError('bad_request', 'Message requis.')

  // ── PLAFOND — chaque message part vers un grand modele et se paie ──────────
  // Mesure sur les 1924 reponses de `pieuvre_analytics_events`
  // (event_name='ajnaya_respond', canal_source='widget_site', 25/04 -> 02/09) :
  // le cout d'UNE reponse monte jusqu'a 1,5726 USD (atteint 25 fois). Les
  // dernieres tournent plutot entre 0,0064 et 0,0616 USD — mais c'est la queue
  // qui coute, pas la moyenne. Le seul garde etait la meme origine, qui
  // autorise sans jamais compter.
  // Voir `lib/plafondAjnaya.ts` pour ce que ce plafond NE protege PAS.
  const verdict = await sousPlafondAjnayaPartage(empreinteDemandeur(request, 'ajnaya'))
  if (!verdict.autorise) {
    // ⚠️ CE REFUS DOIT ETRE UN VRAI 429, ET C'EST TOUT LE SUJET.
    // Premiere version : un flux SSE porteur d'une erreur, renvoye en HTTP 200.
    // Relecture adverse : le navigateur lit alors un `event: error` sans texte,
    // `AjnayaWidget.tsx:578` bascule sur `needBlockFallback` et repart sur
    // POST /api/ajnaya/chat — qui a SON PROPRE compteur. Le plafond de 10 en
    // valait donc 20, payes. Et au 11e appel de /chat, le catch du widget sert
    // une reponse ecrite en dur, sans aucun signe.
    // Un vrai 429 est refuse par `!res.ok` et ne declenche pas ce report.
    console.warn('[ajnaya/stream] plafond atteint — reponse refusee')
    return new Response(
      JSON.stringify({
        error: 'trop_de_messages',
        message: 'Tu vas un peu vite pour moi. Laisse-moi souffler une minute et reecris-moi.',
      }),
      {
        status: 429,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Retry-After': String(verdict.attendreSecondes) },
      },
    )
  }
  if (process.env.PIEUVRE_BRAIN_ENABLED !== 'true') return sseError('pieuvre_disabled')

  const pageSource = typeof body.pageSource === 'string' ? body.pageSource : '/'
  const scrollSection = typeof body.scrollSection === 'string' ? body.scrollSection : 'hero'
  const heatScore = Number(body.heatScore) || 0
  const sessionId = typeof body.sessionId === 'string' && body.sessionId
    ? body.sessionId
    : `site-stream-${Date.now()}`
  const visitorId = typeof body.visitor_id === 'string'
    ? body.visitor_id
    : typeof body.visitorId === 'string' ? body.visitorId : null
  const claimedIdentityId = typeof body.identityId === 'string'
    ? body.identityId
    : typeof body.identity_id === 'string' ? body.identity_id : null
  const device = typeof body.device === 'string' ? body.device : 'mobile'
  const history = Array.isArray(body.conversationHistory)
    ? (body.conversationHistory as Array<{ role?: string; text?: string }>)
        .filter((item) => typeof item?.text === 'string')
        .slice(-10)
        .map((item) => ({
          role: item.role === 'ajnaya' ? 'assistant' : item.role || 'user',
          text: item.text as string,
        }))
    : []
  const liveContext = body.liveContext && typeof body.liveContext === 'object'
    ? body.liveContext as Record<string, unknown>
    : undefined

  const identityId = await resolveSiteIdentity(request, {
    canal: 'widget',
    visitor_id: visitorId,
    claimed_identity_id: claimedIdentityId,
  })
  const acquisition = readAcquisitionFromRequest(request)
  const acquisitionMeta = Object.fromEntries(
    Object.entries(acquisition).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
  )
  if (identityId) {
    const sb = clientServeurOuNull()
    if (sb) await persistAcquisition(sb, identityId, 'widget_stream', acquisition)
  }

  const context = {
    page_source: pageSource,
    scroll_section: scrollSection,
    heat_score: heatScore,
    history_last_10: history,
    ...(visitorId ? { visitor_id: visitorId } : {}),
    ...(liveContext ? { live_context: liveContext } : {}),
  } as Parameters<typeof callPieuvreBrain>[0]['context']

  const result = await callPieuvreBrain({
    tentacle: 'widget_site',
    canal: 'web',
    identity_id: identityId,
    session_id: sessionId,
    message: { role: 'user', text: userMessage, type: 'text' },
    context,
    meta: {
      device,
      utm: acquisitionMeta,
      user_agent: request.headers.get('user-agent') || '',
    },
  })
  // ── LE FILET — cette porte n'en avait AUCUN ───────────────────────────────
  //
  // ⚠️ C'est la porte du TELEPHONE, donc celle ou arrivent les publicites.
  // Quand la Pieuvre ne repondait pas, elle renvoyait une erreur et l'ecran
  // affichait « Petit souci de connexion ». Les deux autres portes du site
  // ({chat, home-modal}) retombaient sur Haiku ; celle-ci, non.
  //
  // ⚠️ CE QUI DECLENCHE VRAIMENT LE FILET, MESURE HONNETEMENT.
  // Le site coupe l'attente a 10 000 ms : `PIEUVRE_RESPOND_TIMEOUT_MS` EST bien
  // posee sur Vercel (verifie le 03/09 : valeur 10000, Production + Preview +
  // Development). ⚠️ Sans elle, le defaut du code serait 5000
  // (`pieuvre-client.ts:91`) — et les 7 dernieres reponses mesurees, de 5 937 a
  // 11 132 ms, la depasseraient TOUTES. Ne jamais supprimer cette variable.
  // Sur les 1924 reponses enregistrees : moitie sous 1 533 ms, 95 % sous
  // 4 839 ms, maximum 115 745 ms ; 14 depassent 10 s (1 sur 137). Mais sur les
  // 7 dernieres, 1 depasse. Le depassement est rare et REEL : quand il arrive,
  // le cerveau avait repondu, la base avait garde la reponse, et la personne ne
  // voyait rien.
  //
  // Le filet ne remplace pas le cerveau : il tient la conversation le temps
  // d'une panne, et il le DIT dans la reponse (llm_model), pour qu'un secours
  // ne puisse jamais se faire passer pour la Pieuvre dans les mesures.
  const canonicalIdentityIdPourTrace = result?.identity_id || identityId
  let fullText = result?.reply?.text || ''
  let modeleUtilise = result?.reply?.llm_model
  let enSecours = false
  if (!fullText) {
    const secours = await repondreEnSecours(userMessage, history)
    if (!secours) return sseError('pieuvre_indisponible')
    fullText = secours.texte
    modeleUtilise = secours.modele
    enSecours = true
    console.warn('[ajnaya/stream] Pieuvre muette — filet de secours utilise')
    // La Pieuvre n'ayant pas repondu, PERSONNE n'a rien ecrit : c'est elle qui
    // enregistre d'habitude. On pose donc la trace nous-memes, sinon cette
    // conversation n'existe dans aucune mesure d'apres-publicite.
    await tracerLeSecours(canonicalIdentityIdPourTrace, sessionId, secours.modele, 'pieuvre_muette')
  }

  const canonicalIdentityId = canonicalIdentityIdPourTrace
  let responseBody = PAD
  responseBody += sse('meta', {
    session_id: sessionId,
    llm_model: modeleUtilise,
    en_secours: enSecours,
    identity_id: canonicalIdentityId,
  })
  responseBody += sse('delta', { text: fullText })
  if (result?.reply?.tts_text || result?.reply?.audio_url) {
    responseBody += sse('tts', {
      tts_text: result.reply.tts_text || fullText,
      audio_url: result.reply.audio_url || null,
    })
  }
  responseBody += sse('done', {
    full_text: fullText,
    pieuvre_reply: result?.reply ?? { text: fullText, llm_model: modeleUtilise },
    intent_detected: result?.intent_detected ?? null,
    next_actions: result?.next_actions ?? [],
    prospect_id: result?.prospect_id ?? null,
    should_capture_phone: result?.should_capture_phone ?? false,
    conversion_event: false,
  })

  return new Response(enc.encode(responseBody), { headers: SSE_HEADERS })
}

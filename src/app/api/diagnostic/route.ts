import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { hasValidBearer, notFound } from '@/lib/api-guard'

export const runtime = 'nodejs'

/**
 * Outil de diagnostic INTERNE — fermé au public.
 *
 * CE QUI S'EST PASSÉ (mesuré en production le 14/08/2026, avant ce correctif) :
 * cette route répondait 200 à n'importe qui sur https://www.foreas.xyz/api/diagnostic
 * et publiait :
 *   · les 23 noms de variables d'environnement du serveur (la carte complète des
 *     secrets à chercher : STRIPE_SECRET_KEY, SUPABASE_SERVICE_ROLE_KEY, …) ;
 *   · le préfixe (15 caractères) ET la longueur exacte de la clé Anthropic ;
 *   · la longueur du secret Pieuvre et la forme de son URL ;
 *   · une ligne interne de la table `pieuvre_scripts` (id, nom, is_active) ;
 *   · le texte réel renvoyé par le cerveau Pieuvre.
 * Et surtout : chaque appel déclenchait UN VRAI appel Anthropic + UN VRAI appel
 * Pieuvre (4 583 ms mesurés). Une simple boucle depuis n'importe où dans le monde
 * = facture Anthropic qui monte et Pieuvre saturée, sans aucune limite.
 *
 * TROIS VERROUS MAINTENANT :
 *  1. Fermée par défaut. Sans `DIAGNOSTIC_TOKEN` défini sur Vercel, la route
 *     renvoie 404 à tout le monde — y compris à moi. Elle est donc close dès le
 *     déploiement, sans que personne n'ait à agir.
 *  2. Aucun nom de variable, aucun préfixe, aucune longueur de secret n'est
 *     jamais renvoyé. Uniquement « présent / absent ».
 *  3. Les appels PAYANTS (Anthropic, Pieuvre) ne partent plus jamais tout seuls :
 *     il faut les demander explicitement avec `?live=1`.
 *
 * Usage :
 *   curl -H "Authorization: Bearer $DIAGNOSTIC_TOKEN" https://www.foreas.xyz/api/diagnostic
 *   curl -H "Authorization: Bearer $DIAGNOSTIC_TOKEN" 'https://www.foreas.xyz/api/diagnostic?live=1'
 */
export async function GET(request: NextRequest) {
  // VERROU 1 — fail closed. Pas de jeton serveur → la route n'existe pas.
  if (!hasValidBearer(request, 'DIAGNOSTIC_TOKEN')) {
    return notFound()
  }

  const live = request.nextUrl.searchParams.get('live') === '1'
  const results: Record<string, unknown> = {
    _note: live
      ? 'live=1 : des appels PAYANTS (Anthropic + Pieuvre) ont été déclenchés.'
      : 'Mode sec : aucun appel payant. Ajouter ?live=1 pour tester les connexions réelles.',
  }

  // VERROU 2 — présence uniquement. Jamais de nom de variable, de préfixe, ni de longueur.
  const anthropicKey = process.env.FOREAS_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY
  results.anthropic_key_present = !!anthropicKey && anthropicKey !== 'à_remplir_par_le_user'
  results.elevenlabs_key_present = !!process.env.ELEVENLABS_API_KEY
  results.elevenlabs_voice_is_koraly =
    (process.env.ELEVENLABS_VOICE_ID || 'MNKK2Wl2wbbsEPQTHZGt') === 'MNKK2Wl2wbbsEPQTHZGt'
  results.supabase_url_present = !!process.env.NEXT_PUBLIC_SUPABASE_URL
  results.supabase_service_key_present = !!process.env.SUPABASE_SERVICE_ROLE_KEY
  results.stripe_key_present = !!process.env.STRIPE_SECRET_KEY
  results.stripe_webhook_secret_present = !!process.env.STRIPE_WEBHOOK_SECRET
  results.meta_capi_configured =
    !!process.env.META_PIXEL_ID && !!process.env.META_CAPI_ACCESS_TOKEN
  results.tiktok_capi_configured =
    !!process.env.TIKTOK_PIXEL_ID && !!process.env.TIKTOK_CAPI_ACCESS_TOKEN
  results.pieuvre_brain_enabled = process.env.PIEUVRE_BRAIN_ENABLED === 'true'
  results.pieuvre_url_present = !!process.env.PIEUVRE_RESPOND_URL
  results.pieuvre_secret_present = !!process.env.PIEUVRE_RESPOND_SECRET

  // Import du SDK : gratuit, aucun appel réseau.
  try {
    await import('@anthropic-ai/sdk')
    results.anthropic_sdk_import = 'OK'
  } catch (e) {
    results.anthropic_sdk_import = 'FAILED: ' + (e as Error).message
  }

  // Lecture Supabase : gratuite et sans effet de bord. On ne renvoie PAS la ligne,
  // seulement le fait qu'un script de closing actif existe ou non.
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (url && key) {
      const { createClient } = await import('@supabase/supabase-js')
      const sb = createClient(url, key)
      const { data, error } = await sb
        .from('pieuvre_scripts')
        .select('is_active')
        .eq('tentacle', 'widget_site')
        .limit(1)
      results.supabase_connection = error ? 'FAILED: ' + error.message : 'OK'
      results.widget_site_script_active = data?.[0]?.is_active ?? null
    } else {
      results.supabase_connection = 'SKIPPED — identifiants absents'
    }
  } catch (e) {
    results.supabase_connection = 'FAILED: ' + (e as Error).message
  }

  // VERROU 3 — au-delà d'ici, tout coûte de l'argent. Sur demande explicite seulement.
  if (!live) {
    return NextResponse.json(results, { status: 200, headers: { 'Cache-Control': 'no-store' } })
  }

  // Appel Anthropic réel. Le modèle DOIT rester aligné sur celui du vrai chat
  // (`src/app/api/ajnaya/chat/route.ts`) — sinon ce diagnostic annonce une panne
  // qui n'existe pas. C'était le cas : il testait `claude-sonnet-4-20250514`,
  // un modèle qui n'existe plus, et renvoyait « anthropic_api_call: FAILED »
  // alors que le vrai cerveau du site fonctionnait.
  if (anthropicKey && anthropicKey !== 'à_remplir_par_le_user') {
    try {
      const Anthropic = (await import('@anthropic-ai/sdk')).default
      const client = new Anthropic({ apiKey: anthropicKey })
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 20,
        messages: [{ role: 'user', content: 'Réponds uniquement : OK' }],
      })
      results.anthropic_api_call = 'OK'
      results.anthropic_model_tested = 'claude-haiku-4-5-20251001'
      results.anthropic_tokens = response.usage
    } catch (e) {
      results.anthropic_api_call = 'FAILED: ' + (e as Error).message
    }
  } else {
    results.anthropic_api_call = 'SKIPPED — clé absente'
  }

  // Appel Pieuvre réel.
  if (process.env.PIEUVRE_BRAIN_ENABLED === 'true') {
    try {
      const { callPieuvreBrain } = await import('@/lib/pieuvre-client')
      const t0 = Date.now()
      const r = await callPieuvreBrain({
        tentacle: 'widget_site',
        canal: 'web',
        identity_id: null,
        session_id: 'diag-' + Date.now(),
        message: { role: 'user', text: 'diagnostic ping', type: 'text' },
        context: { page_source: '/', scroll_section: '', heat_score: 0, history_last_10: [] },
        meta: { device: 'desktop', utm: {}, user_agent: 'diagnostic' },
      })
      results.pieuvre_live_call = r ? 'OK' : 'NULL — voir les journaux Vercel [pieuvre-client]'
      results.pieuvre_live_latency_ms = Date.now() - t0
      // On confirme qu'une réponse est revenue, sans en publier le contenu.
      results.pieuvre_reply_received = !!r?.reply?.text
    } catch (e) {
      results.pieuvre_live_call = 'EXCEPTION: ' + (e as Error).message
    }
  } else {
    results.pieuvre_live_call = 'SKIPPED — PIEUVRE_BRAIN_ENABLED ≠ "true"'
  }

  return NextResponse.json(results, { status: 200, headers: { 'Cache-Control': 'no-store' } })
}

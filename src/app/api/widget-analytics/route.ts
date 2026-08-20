import { NextResponse } from 'next/server'
import { isSameOriginRequest, forbiddenOrigin } from '@/lib/api-guard'
// ── 20/08/2026 — PLUS DE REPLI SILENCIEUX VERS LA CLÉ PUBLIQUE ──────────────
// Cette route retombait sur la clé publique quand la clé serveur manquait.
// Le jour d'une rotation de clé, ce `||` ne produit AUCUNE erreur : la route se
// met à lire avec les droits d'un visiteur anonyme, en silence. Une panne
// bruyante se répare ; une dégradation silencieuse s'installe.
// Le client vient maintenant de src/lib/supabaseServeur.ts, qui refuse plutôt
// que de dégrader.
import { cleServeurOuVide } from '@/lib/supabaseServeur'

export async function POST(request: Request) {
  // GARDE 14/08/2026 — Écriture de télémétrie. Une mesure qu'un inconnu peut alimenter ne mesure rien.
  // Appelée uniquement par nos propres pages : un appel sans origine FOREAS
  // n'a aucune raison d'exister.
  if (!isSameOriginRequest(request)) {
    return forbiddenOrigin()
  }

  try {
    const data = await request.json()

    // Basic validation
    if (!data.session_id || !data.page_source || !Array.isArray(data.messages)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // Try Supabase insert if configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = cleServeurOuVide()

    if (supabaseUrl && supabaseKey) {
      try {
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(supabaseUrl, supabaseKey)
        await supabase.from('widget_conversations').insert({
          session_id: data.session_id,
          page_source: data.page_source,
          device: data.device,
          messages: data.messages,
          intents_detected: data.intents_detected,
          cta_clicked_after: data.cta_clicked_after,
          conversation_duration_ms: data.conversation_duration_ms,
        })
      } catch (e) {
        console.warn('[widget-analytics] Supabase insert failed:', e)
      }
    } else {
      console.log('[widget-analytics] No Supabase config — logging conversation:', {
        session: data.session_id,
        page: data.page_source,
        messages: data.messages?.length,
        intents: data.intents_detected,
      })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true }) // Never fail visibly
  }
}

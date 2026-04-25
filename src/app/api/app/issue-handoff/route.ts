import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * POST /api/app/issue-handoff
 *
 * Called by AjnayaWidget (client → server) when the user captures their phone
 * number or clicks "Continuer sur WhatsApp / Télécharger l'app".
 * Creates a handoff_tokens row and returns the deeplink URL for the target canal.
 *
 * Conformité : AJNAYA_CONTRACTS.md §4 — Flux standard
 * `state.prompt_for_next_canal` est OBLIGATOIRE (phrase d'accroche pré-composée).
 *
 * Body: {
 *   identity_id:   string,         // full UUID from identity_bridge
 *   state:         object,         // { last_messages, intent, heat_score, objection,
 *                                  //   pending_question, url_pre_landing,
 *                                  //   prompt_for_next_canal (obligatoire) }
 *   source_canal?: string          // default "widget"
 *   target_canal?: string          // "whatsapp" | "app" (default "app")
 * }
 *
 * Response: {
 *   ok:          true,
 *   token:       string,           // UUID stored in handoff_tokens
 *   deeplink:    string,           // foreas://handoff?token=<uuid> (app)
 *                                  // or https://wa.me/33780732216?text=<uuid> (whatsapp)
 *   webFallback: string            // https://foreas.xyz/go?deeplink=<uuid>
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      identity_id,
      state,
      source_canal = 'widget',
      target_canal = 'app',
    } = body as {
      identity_id?: string
      state?: Record<string, unknown>
      source_canal?: string
      target_canal?: string
    }

    if (!identity_id || typeof identity_id !== 'string') {
      return NextResponse.json({ error: 'missing_identity_id' }, { status: 400 })
    }

    // Validate UUID format
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!UUID_RE.test(identity_id)) {
      return NextResponse.json({ error: 'invalid_identity_id_format' }, { status: 400 })
    }

    // Ensure prompt_for_next_canal is present (CONTRACTS.md §4 — obligatoire)
    const resolvedState = state || {}
    if (!resolvedState.prompt_for_next_canal) {
      resolvedState.prompt_for_next_canal =
        target_canal === 'whatsapp'
          ? "Salut ! Tu discutais avec Ajnaya sur le site FOREAS — je reprends là où on en était. Une question ?"
          : "Bienvenue dans l'app FOREAS ! On reprend notre conversation."
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabase
      .from('handoff_tokens')
      .insert({
        identity_id,
        source_canal,
        target_canal,
        state: resolvedState,
      })
      .select('token')
      .single()

    if (error || !data) {
      console.error('[issue-handoff] insert error:', error?.message)
      return NextResponse.json({ error: 'insert_failed' }, { status: 500 })
    }

    const token = data.token as string

    // Build deeplink per target canal
    const deeplink =
      target_canal === 'whatsapp'
        ? `https://wa.me/33780732216?text=${encodeURIComponent(token)}`
        : `foreas://handoff?token=${token}`

    const webFallback = `https://foreas.xyz/go?deeplink=${token}`

    // Emit analytics event (v1.1 columns)
    await supabase.from('pieuvre_analytics_events').insert({
      event_name: 'widget.handoff_issued',
      identity_id,
      canal_source: source_canal,
      processed: false,
      meta: {
        token,
        target_canal,
        source_canal,
        identity_id,
      },
      ts: Date.now(),
    }).catch(() => {}) // fire-and-forget, never block

    return NextResponse.json({ ok: true, token, deeplink, webFallback })
  } catch (err) {
    console.error('[issue-handoff]', (err as Error).message)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}

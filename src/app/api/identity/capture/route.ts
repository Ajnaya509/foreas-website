import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendCAPIEvent } from '@/lib/meta-capi'
import { resolveIdentity, normalizePhoneE164, type IdentityCanal } from '@/lib/identityGate'
import { readAcquisitionFromRequest, persistAcquisition } from '@/lib/acquisitionServer'

export const runtime = 'nodejs'

/**
 * Capture téléphone du widget → identité.
 *
 * ⚠️ CORRECTIF P0.h (2026-08-13). Avant : cette route faisait elle-même
 * `select / insert / update` sur `identity_bridge`. Elle contournait donc le
 * résolveur canonique `resolve_identity` et, avec lui :
 *   - le verrou anti-concurrence (deux envois simultanés = deux identités),
 *   - le matching sur `metadata->'phone_hashes'` / `'visitor_ids'` (elle ne
 *     regardait QUE la colonne `phone_hash`, donc la personne déjà connue en
 *     anonyme par son empreinte repartait en identité neuve),
 *   - la fusion des doublons + la trace dans `identity_merges`,
 *   - le garde-fou `merge_conflict`.
 * Elle n'écrit plus une seule ligne d'`identity_bridge` : tout passe par
 * `@/lib/identityGate` → RPC `resolve_identity`, la même porte que WhatsApp et l'app.
 *
 * Elle reste responsable de ce qui vient APRÈS la résolution :
 * mémoire de canal, lien prospect, event bus, webhook Pieuvre, Meta CAPI.
 */

export async function POST(request: NextRequest) {
  try {
    const {
      phone_raw,
      prospect_id,
      canal = 'widget',
      page_source,
      visitor_id,
    } = (await request.json()) as {
      phone_raw?: string
      prospect_id?: string
      canal?: IdentityCanal
      page_source?: string
      visitor_id?: string
    }

    if (!phone_raw) {
      return NextResponse.json({ error: 'missing_phone' }, { status: 400 })
    }

    const phone_e164 = normalizePhoneE164(phone_raw)
    if (!phone_e164) {
      return NextResponse.json({ error: 'invalid_phone' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Badge appareil durable posé par le middleware (cookie 1ère partie, 1 an).
    const device_cookie_id = request.cookies.get('foreas_vid')?.value ?? null

    // ── LA PORTE UNIQUE ────────────────────────────────────────────────────
    const resolution = await resolveIdentity(supabase, {
      phone_raw: phone_e164,
      visitor_id: visitor_id ?? null,
      device_cookie_id,
      canal,
    })

    // ⚠️ `conflict` = la base ne sait pas de QUI il s'agit (plusieurs personnes
    // fortes sur les mêmes clés). Continuer, c'est coller ce téléphone au dossier
    // d'un autre chauffeur, lui envoyer le handoff WhatsApp d'un autre et pousser
    // le mauvais téléphone dans Meta CAPI. On s'arrête et on trace : la base a
    // déjà écrit `merge_conflict` dans pieuvre_watchdog_logs, on ajoute ici la
    // trace côté funnel pour qu'un humain voie le lead perdu.
    if (resolution.status === 'conflict') {
      await supabase.from('pieuvre_analytics_events').insert({
        event_name: 'identity.capture_conflict',
        canal_source: canal,
        processed: false,
        meta: { canal, page_source: page_source || null, has_visitor_id: Boolean(visitor_id), has_device_cookie: Boolean(device_cookie_id) },
        ts: Date.now(),
      })
      console.warn('[identity/capture] merge_conflict — capture refusée, aucun rattachement')
      return NextResponse.json({ error: 'identity_conflict' }, { status: 409 })
    }

    if (resolution.status !== 'resolved') {
      return NextResponse.json({ error: 'resolve_failed' }, { status: 500 })
    }

    const resolved = resolution.identity
    const identity_id = resolved.identity_id
    const merged = resolved.merged

    // 2. Mémoire de canal — fragment "phone_captured" lu par le Responder Pieuvre.
    await supabase.from('canal_memory').upsert(
      {
        identity_id,
        canal,
        context_key: 'phone_captured',
        context_value: {
          at: new Date().toISOString(),
          page_source: page_source || null,
        },
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'identity_id,canal,context_key', ignoreDuplicates: false }
    )

    // 2bis. Origine d'acquisition — on la colle à la personne au moment où elle
    // devient identifiable. Même table de mémoire, pas de nouvelle table.
    const acquisition = readAcquisitionFromRequest(request)
    await persistAcquisition(supabase, identity_id, canal, acquisition)

    // 3. Lien prospect ↔ identité (colonne réelle `identity_id` de pieuvre_prospects,
    //    plus l'attribution d'acquisition sur les colonnes qui existent vraiment).
    if (prospect_id) {
      const prospectUpdate: Record<string, unknown> = { identity_id }
      if (acquisition.utm_source) prospectUpdate.utm_source = acquisition.utm_source
      if (acquisition.utm_campaign) prospectUpdate.utm_campaign = acquisition.utm_campaign
      if (acquisition.ctwa_clid) prospectUpdate.ctwa_clid = acquisition.ctwa_clid

      const { error: linkErr } = await supabase
        .from('pieuvre_prospects')
        .update(prospectUpdate)
        .eq('id', prospect_id)
      if (linkErr) console.warn('[identity/capture] prospect link:', linkErr.code, linkErr.message)
    }

    // 4. Event bus — colonnes v1.1 (identity_id + canal_source directs)
    await supabase.from('pieuvre_analytics_events').insert({
      event_name: 'widget.phone_captured',
      identity_id,
      canal_source: canal,
      processed: false,
      meta: {
        identity_id,
        canal,
        page_source: page_source || null,
        merged,
        is_known: resolved.is_known,
        device_shared: resolved.device_shared ?? false,
        user_type: resolved.user_type ?? null,
        acquisition,
      },
      ts: Date.now(),
    })

    // 5. Webhook Pieuvre /webhook/phone-captured — fire-and-forget.
    const pieuvreBaseUrl = process.env.PIEUVRE_RESPOND_URL || ''
    const pieuvreSecret = process.env.PIEUVRE_RESPOND_SECRET || ''
    if (pieuvreBaseUrl && pieuvreSecret) {
      const origin = pieuvreBaseUrl.replace(/\/webhook\/.*$/, '')
      const phoneCapturedUrl = `${origin}/webhook/phone-captured`
      fetch(phoneCapturedUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Foreas-Shared-Secret': pieuvreSecret,
        },
        body: JSON.stringify({
          identity_id,
          canal,
          page_source: page_source || null,
          merged,
          user_type: resolved.user_type ?? null,
          acquisition,
          ts: Date.now(),
        }),
      }).catch((err) => {
        console.warn('[identity/capture] phone-captured webhook fail:', (err as Error).message)
      })
    }

    // 6. Meta CAPI server-side — event Lead (attribution CTWA / Advantage+).
    const forwardedFor = request.headers.get('x-forwarded-for') || ''
    const clientIp = forwardedFor.split(',')[0]?.trim() || request.headers.get('x-real-ip') || undefined
    const clientUa = request.headers.get('user-agent') || undefined
    sendCAPIEvent({
      eventName: 'Lead',
      eventSourceUrl: page_source ? `https://foreas.xyz${page_source}` : 'https://foreas.xyz',
      userData: {
        phone: phone_e164,
        externalId: identity_id,
        clientIpAddress: clientIp,
        clientUserAgent: clientUa,
        fbc: acquisition.fbc ?? null,
        fbp: acquisition.fbp ?? null,
      },
      customData: {
        contentName: 'phone_captured_widget',
      },
      actionSource: 'website',
    }).catch((err) => {
      console.warn('[identity/capture] Meta CAPI Lead fail:', (err as Error).message)
    })

    return NextResponse.json({
      ok: true,
      identity_id,
      merged,
      is_known: resolved.is_known,
      user_type: resolved.user_type ?? null,
    })
  } catch (error) {
    console.error('[identity/capture] Error:', (error as Error).message)
    return NextResponse.json({ error: 'capture_failed' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { sendCAPIEvent } from '@/lib/meta-capi'

export const runtime = 'nodejs'

/**
 * Identity Bridge capture — écrit dans la table maître `identity_bridge`.
 *
 * Conformité : /Users/chandlermilien/FOREAS-SHARED/AJNAYA_CONTRACTS.md §1
 * Règle : SHA-256 **uniquement server-side** (jamais côté client).
 * Hash canonique : Edge Function `hash-identity` (garantit cohérence cross-canal).
 * Fallback : crypto.createHash local si Edge Function indisponible.
 * Matching key : phone_hash. Si une row existe déjà → merge au lieu de créer.
 *
 * Écrit aussi un premier fragment dans canal_memory pour que le Responder Pieuvre
 * puisse personnaliser la prochaine réponse cross-canal.
 */

type Canal = 'widget' | 'whatsapp' | 'app' | 'instagram' | 'facebook' | 'sms' | 'voice' | 'email' | 'referral' | 'ads'

function normalizeE164(raw: string): string | null {
  const digits = raw.replace(/[\s.\-()]/g, '')
  if (/^\+33\d{9}$/.test(digits)) return digits
  if (/^0\d{9}$/.test(digits)) return '+33' + digits.slice(1)
  return null
}

export async function POST(request: NextRequest) {
  try {
    const { phone_raw, prospect_id, canal = 'widget', page_source } = (await request.json()) as {
      phone_raw?: string
      prospect_id?: string
      canal?: Canal
      page_source?: string
    }

    if (!phone_raw) {
      return NextResponse.json({ error: 'missing_phone' }, { status: 400 })
    }

    const phone_e164 = normalizeE164(phone_raw)
    if (!phone_e164) {
      return NextResponse.json({ error: 'invalid_phone' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // ── SHA-256 canonique via Edge Function hash-identity (cross-canal cohérence garantie)
    // Fallback : crypto local si Edge Function indisponible (hash identique pour même input)
    let phone_hash: string
    try {
      const { data: hashData, error: hashError } = await supabase.functions.invoke<{
        phone_hash: string
        normalized: { phone: string }
      }>('hash-identity', { body: { phone: phone_e164 } })

      if (hashError || !hashData?.phone_hash) {
        throw new Error(hashError?.message || 'no phone_hash in response')
      }
      phone_hash = hashData.phone_hash
    } catch (edgeFnErr) {
      // Edge Function down/unreachable — fallback to local crypto
      console.warn('[identity/capture] hash-identity fallback:', (edgeFnErr as Error).message)
      phone_hash = crypto.createHash('sha256').update(phone_e164).digest('hex')
    }

    // 1. Chercher une row identity_bridge existante avec ce phone_hash
    const { data: existing } = await supabase
      .from('identity_bridge')
      .select('id, prospect_id, driver_id, first_canal, user_type, metadata, identified_at')
      .eq('phone_hash', phone_hash)
      .maybeSingle()

    let identity_id: string
    let first_seen: string
    let user_type: string
    let merged = false

    if (existing) {
      // MERGE : on enrichit la row existante sans écraser first_canal/first_seen
      identity_id = existing.id
      first_seen = existing.identified_at || new Date().toISOString()
      user_type = existing.user_type

      const mergedMeta = {
        ...(existing.metadata || {}),
        last_seen_canal: canal,
        last_seen_at: new Date().toISOString(),
        all_canals: Array.from(
          new Set([...(existing.metadata?.all_canals || [existing.first_canal]), canal])
        ),
      }

      const updates: Record<string, unknown> = {
        metadata: mergedMeta,
        updated_at: new Date().toISOString(),
      }

      // Si on a un prospect_id et la row n'en avait pas, on le lie
      if (prospect_id && !existing.prospect_id) {
        updates.prospect_id = prospect_id
      }

      await supabase.from('identity_bridge').update(updates).eq('id', identity_id)
      merged = true
    } else {
      // CREATE : nouvelle identité
      const { data: created, error: createErr } = await supabase
        .from('identity_bridge')
        .insert({
          prospect_id: prospect_id || null,
          phone_hash,
          first_canal: canal,
          user_type: 'prospect',
          metadata: {
            last_seen_canal: canal,
            last_seen_at: new Date().toISOString(),
            all_canals: [canal],
            ...(page_source ? { first_page_source: page_source } : {}),
          },
        })
        .select('id, identified_at, user_type')
        .single()

      if (createErr || !created) {
        console.error('[identity/capture] insert failed:', createErr?.message)
        return NextResponse.json({ error: 'insert_failed' }, { status: 500 })
      }

      identity_id = created.id
      first_seen = created.identified_at
      user_type = created.user_type
    }

    // 2. Upsert dans canal_memory — fragment "phone_captured"
    //    Le Responder Pieuvre consultera cette mémoire avant la prochaine réponse
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

    // 3. Rétrocompat : enrichir aussi pieuvre_prospects.metadata si prospect_id fourni
    //    (transition — à retirer quand tous les consumers lisent identity_bridge)
    if (prospect_id) {
      const { data: prospect } = await supabase
        .from('pieuvre_prospects')
        .select('metadata')
        .eq('id', prospect_id)
        .maybeSingle()

      const updatedMeta = {
        ...(prospect?.metadata || {}),
        identity_hash: phone_hash, // legacy alias
        identity_id, // pointer vers la nouvelle table
        canal,
        phone_captured_at: new Date().toISOString(),
      }

      await supabase
        .from('pieuvre_prospects')
        .update({ metadata: updatedMeta })
        .eq('id', prospect_id)
    }

    // 4. Émettre event bus — colonnes v1.1 (identity_id + canal_source directs)
    await supabase.from('pieuvre_analytics_events').insert({
      event_name: 'widget.phone_captured',
      identity_id,                         // v1.1 direct column
      canal_source: canal,                 // v1.1 direct column
      processed: false,
      meta: {
        // rétrocompat 7j (consumers legacy lisent meta.identity_id)
        identity_id,
        canal,
        page_source: page_source || null,
        merged,
        user_type,
      },
      ts: Date.now(),
    })

    // 5. Fire-and-forget Pieuvre webhook /webhook/phone-captured (v58 — fil pieuvre P0)
    //    Trigger Variable Reward workflow wF5dzYGUReKt3TGB côté N8N.
    //    On NE bloque PAS la réponse au widget — fail silently.
    const pieuvreBaseUrl = process.env.PIEUVRE_RESPOND_URL || ''
    const pieuvreSecret = process.env.PIEUVRE_RESPOND_SECRET || ''
    if (pieuvreBaseUrl && pieuvreSecret) {
      // Extract origin from PIEUVRE_RESPOND_URL (which contains /webhook/ajnaya-respond)
      const origin = pieuvreBaseUrl.replace(/\/webhook\/.*$/, '')
      const phoneCapturedUrl = `${origin}/webhook/phone-captured`
      // Fire-and-forget — don't await
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
          user_type,
          ts: Date.now(),
        }),
      }).catch((err) => {
        console.warn('[identity/capture] phone-captured webhook fail:', (err as Error).message)
      })
    }

    // 6. Meta CAPI server-side — event Lead (v58 — fil pieuvre P0 #7)
    //    Critique pour attribution CTWA / Advantage+ Meta. Fire-and-forget.
    //    Le pixel client envoie aussi Lead avec eventID partagé via tracking.ts ;
    //    Meta déduplique via event_id. Ici on émet en plus côté server-side parce
    //    que la capture phone est l'événement de conversion principale.
    const forwardedFor = request.headers.get('x-forwarded-for') || ''
    const clientIp = forwardedFor.split(',')[0]?.trim() || request.headers.get('x-real-ip') || undefined
    const clientUa = request.headers.get('user-agent') || undefined
    const cookieHeader = request.headers.get('cookie') || ''
    const fbcMatch = cookieHeader.match(/_fbc=([^;]+)/)
    const fbpMatch = cookieHeader.match(/_fbp=([^;]+)/)
    sendCAPIEvent({
      eventName: 'Lead',
      // eventId omis = nouveau Lead unique (pas de dedup avec un pixel client à
      // ce moment précis car la capture s'est faite via l'API, pas via fbq client)
      eventSourceUrl: page_source ? `https://foreas.xyz${page_source}` : 'https://foreas.xyz',
      userData: {
        phone: phone_e164,                    // sera normalisé + sha256 par buildUserData
        externalId: identity_id,              // identity_bridge.id pour matching
        clientIpAddress: clientIp,
        clientUserAgent: clientUa,
        fbc: fbcMatch?.[1] || null,
        fbp: fbpMatch?.[1] || null,
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
      first_seen,
      user_type,
    })
  } catch (error) {
    console.error('[identity/capture] Error:', (error as Error).message)
    return NextResponse.json({ error: 'capture_failed' }, { status: 500 })
  }
}

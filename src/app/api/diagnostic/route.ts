import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  const results: Record<string, unknown> = {}

  // Test 0: List all env vars containing key words
  const envKeys = Object.keys(process.env).filter(k =>
    /anthropic|elevenlabs|supabase|stripe|resend/i.test(k)
  )
  results.env_keys_found = envKeys

  // Test 1: Anthropic API key (FOREAS_ prefix avoids Claude Code env collision)
  const anthropicKey = process.env.FOREAS_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY
  results.anthropic_key_present = !!anthropicKey
  results.anthropic_key_prefix = anthropicKey ? anthropicKey.substring(0, 15) + '...' : 'MISSING'
  results.anthropic_key_length = anthropicKey?.length ?? 0
  results.anthropic_key_typeof = typeof anthropicKey
  results.anthropic_key_is_placeholder = anthropicKey === 'à_remplir_par_le_user'
  results.anthropic_base_url = process.env.ANTHROPIC_BASE_URL || 'NOT SET'

  // Test 2: ElevenLabs
  results.elevenlabs_key_present = !!process.env.ELEVENLABS_API_KEY
  results.elevenlabs_voice_id = process.env.ELEVENLABS_VOICE_ID || 'MISSING'

  // Test 3: Supabase
  results.supabase_url_present = !!process.env.NEXT_PUBLIC_SUPABASE_URL
  results.supabase_key_present = !!(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  // Test 4: Stripe
  results.stripe_key_present = !!process.env.STRIPE_SECRET_KEY
  results.stripe_webhook_present = !!process.env.STRIPE_WEBHOOK_SECRET

  // Test 4b: Pieuvre Brain (audit Site2026v38)
  results.pieuvre_brain_enabled = process.env.PIEUVRE_BRAIN_ENABLED || 'UNSET'
  results.pieuvre_brain_enabled_eq_true = process.env.PIEUVRE_BRAIN_ENABLED === 'true'
  results.pieuvre_url_present = !!process.env.PIEUVRE_RESPOND_URL
  results.pieuvre_url_endswith_webhook = (process.env.PIEUVRE_RESPOND_URL || '').endsWith('/webhook/ajnaya-respond')
  results.pieuvre_url_length = (process.env.PIEUVRE_RESPOND_URL || '').length
  results.pieuvre_secret_present = !!process.env.PIEUVRE_RESPOND_SECRET
  results.pieuvre_secret_length = (process.env.PIEUVRE_RESPOND_SECRET || '').length
  results.pieuvre_timeout = process.env.PIEUVRE_RESPOND_TIMEOUT_MS || 'UNSET'

  // Test 4c: Live Pieuvre call
  if (process.env.PIEUVRE_BRAIN_ENABLED === 'true') {
    try {
      const { callPieuvreBrain } = await import('@/lib/pieuvre-client')
      const t0 = Date.now()
      const r = await callPieuvreBrain({
        tentacle: 'widget_site', canal: 'web', identity_id: null,
        session_id: 'diag-' + Date.now(),
        message: { role: 'user', text: 'diagnostic ping', type: 'text' },
        context: { page_source: '/', scroll_section: '', heat_score: 0, history_last_10: [] },
        meta: { device: 'desktop', utm: {}, user_agent: 'diagnostic' },
      })
      results.pieuvre_live_call = r ? 'OK' : 'NULL (check Vercel logs for [pieuvre-client] warnings)'
      results.pieuvre_live_latency_ms = Date.now() - t0
      results.pieuvre_live_reply_preview = r?.reply?.text?.substring(0, 80) || null
    } catch (e) {
      results.pieuvre_live_call = 'EXCEPTION: ' + (e as Error).message
    }
  } else {
    results.pieuvre_live_call = 'SKIPPED — PIEUVRE_BRAIN_ENABLED not "true"'
  }

  // Test 5: Try importing Anthropic SDK
  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default
    results.anthropic_sdk_import = 'OK'

    // Test 6: Try calling Claude with a simple message
    if (anthropicKey && anthropicKey !== 'à_remplir_par_le_user') {
      try {
        const client = new Anthropic({ apiKey: anthropicKey })
        const response = await client.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 50,
          messages: [{ role: 'user', content: 'Dis juste "Ajnaya connectée" en français, rien d\'autre.' }],
        })
        const text = response.content[0]?.type === 'text' ? response.content[0].text : ''
        results.anthropic_api_call = 'OK'
        results.anthropic_response = text
        results.anthropic_tokens = response.usage
      } catch (e) {
        results.anthropic_api_call = 'FAILED'
        results.anthropic_error = (e as Error).message
      }
    } else {
      results.anthropic_api_call = 'SKIPPED - no key'
    }
  } catch (e) {
    results.anthropic_sdk_import = 'FAILED'
    results.anthropic_sdk_error = (e as Error).message
  }

  // Test 7: Try Supabase connection
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (url && key) {
      const { createClient } = await import('@supabase/supabase-js')
      const sb = createClient(url, key)
      const { data, error } = await sb.from('pieuvre_scripts').select('id, script_name, is_active').eq('tentacle', 'widget_site').limit(1)
      results.supabase_connection = error ? 'FAILED: ' + error.message : 'OK'
      results.supabase_closing_script = data && data.length > 0 ? data[0] : 'NO SCRIPT FOUND'
    } else {
      results.supabase_connection = 'SKIPPED - no credentials'
    }
  } catch (e) {
    results.supabase_connection = 'FAILED: ' + (e as Error).message
  }

  return NextResponse.json(results, { status: 200 })
}

import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  const results: Record<string, unknown> = {}

  // Test 1: Anthropic API key
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  results.anthropic_key_present = !!anthropicKey
  results.anthropic_key_prefix = anthropicKey ? anthropicKey.substring(0, 15) + '...' : 'MISSING'
  results.anthropic_key_is_placeholder = anthropicKey === 'à_remplir_par_le_user'

  // Test 2: ElevenLabs
  results.elevenlabs_key_present = !!process.env.ELEVENLABS_API_KEY
  results.elevenlabs_voice_id = process.env.ELEVENLABS_VOICE_ID || 'MISSING'

  // Test 3: Supabase
  results.supabase_url_present = !!process.env.NEXT_PUBLIC_SUPABASE_URL
  results.supabase_key_present = !!(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  // Test 4: Stripe
  results.stripe_key_present = !!process.env.STRIPE_SECRET_KEY
  results.stripe_webhook_present = !!process.env.STRIPE_WEBHOOK_SECRET

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

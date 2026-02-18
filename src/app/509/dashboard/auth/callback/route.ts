import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const role = requestUrl.searchParams.get('role') || 'driver'

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  if (token_hash && type) {
    // Magic link flow — verify OTP
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'magiclink' | 'email',
    })

    if (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(
        new URL(`/509/dashboard/login?error=${encodeURIComponent(error.message)}`, requestUrl.origin)
      )
    }
  } else if (code) {
    // PKCE flow
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(
        new URL(`/509/dashboard/login?error=${encodeURIComponent(error.message)}`, requestUrl.origin)
      )
    }
  }

  // Redirect based on role
  const redirectPath = role === 'partner' ? '/509/dashboard/partner' : '/509/dashboard/driver'
  return NextResponse.redirect(new URL(redirectPath, requestUrl.origin))
}

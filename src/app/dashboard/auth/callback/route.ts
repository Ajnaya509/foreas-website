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

  // 🔴 21/08/2026 — CE REBOND REDIRIGEAIT VERS LE TABLEAU DE BORD SANS JETON.
  //
  // Les deux branches de vérification étaient conditionnelles, et la
  // redirection finale se trouvait DEHORS. Sans `token_hash` ni `code`, aucune
  // vérification ne s'exécutait — et la redirection partait quand même.
  //
  // Mesuré en production : GET sur cette route, sans le moindre paramètre,
  // rendait 307 vers le tableau de bord. Et le jumeau /509/ rendait 200 sur la
  // page d'arrivée.
  //
  // Ce n'est pas la porte du tableau de bord lui-même — celle-là est gardée
  // ailleurs. Mais un rebond d'authentification qui redirige sans avoir rien
  // vérifié est une marche cassée sur le seul escalier qui compte : il fait
  // croire à une session établie, et tout ce qui suit raisonne dessus.
  //
  // ⚠️ CORRIGÉ DANS LES DEUX FICHIERS. Le miroir /509/ est servi en production.
  if (!token_hash && !code) {
    console.warn('[auth] rebond appelé sans jeton — refusé')
    return NextResponse.redirect(
      new URL(`/dashboard/login?error=jeton_absent`, requestUrl.origin)
    )
  }

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
        new URL(`/dashboard/login?error=${encodeURIComponent(error.message)}`, requestUrl.origin)
      )
    }
  } else if (code) {
    // PKCE flow
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(
        new URL(`/dashboard/login?error=${encodeURIComponent(error.message)}`, requestUrl.origin)
      )
    }
  }

  // Redirect based on role
  const redirectPath = role === 'partner' ? '/dashboard/partner' : '/dashboard/driver'
  return NextResponse.redirect(new URL(redirectPath, requestUrl.origin))
}

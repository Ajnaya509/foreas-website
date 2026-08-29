import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient | null = null

function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    _supabase = createClient(url, key, {
      auth: {
        /**
         * ⚠️ 29/08 — LE RENOUVELLEMENT AUTOMATIQUE A SATURÉ L'AUTHENTIFICATION.
         *
         * Mesuré dans les journaux Supabase, entre 20 h et 22 h UTC :
         *   3 483 × « 400 Invalid Refresh Token: Refresh Token Not Found »
         *  59 957 × « 429 Request rate limit reached »
         * Tous sur `/token`, tous avec pour origine `https://www.foreas.xyz`.
         * Avant 14 h : environ 237 requêtes par heure, toutes en succès.
         *
         * Le mécanisme : un onglet resté ouvert garde en mémoire une session
         * périmée. Le client redemande un jeton, reçoit 400, réessaie, reçoit
         * 400… puis le compteur de sécurité du projet passe en 429 et le client
         * réessaie encore. Rien ne s'arrête tout seul.
         *
         * Ce que ça coûtait : le compteur d'authentification du projet saturé
         * pour TOUT LE MONDE — site ET application. Un chauffeur pouvait se voir
         * refuser sa connexion à cause d'un onglet oublié.
         *
         * ⚠️ POURQUOI ON PEUT LE COUPER SANS RIEN CASSER.
         * Les seules pages qui utilisent ce client appellent `signInWithOtp` :
         * elles envoient un lien de connexion et ne gardent aucune session
         * vivante. Vérifié, fichier par fichier, avant de toucher à ça.
         *
         * ⚠️ ET POURQUOI `persistSession` RESTE À `true`.
         * `signInWithOtp` range un vérificateur PKCE dans le stockage local ; le
         * couper ferait échouer le lien de connexion à l'arrivée. Ce n'est pas
         * la persistance qui bouclait, c'est le renouvellement.
         */
        autoRefreshToken: false,
        persistSession: true,
      },
    })
  }
  return _supabase
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabase()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (client as any)[prop]
  },
})

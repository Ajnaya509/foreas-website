/**
 * provisionDriverAccount — crée le compte Supabase Auth d'un chauffeur qui vient de payer
 * DEPUIS LE SITE (source `checkout`).
 *
 * POURQUOI CE FICHIER EXISTE (le mur trouvé par l'audit lancement) :
 * le webhook Stripe sauvegardait l'abonné dans `subscribers`, envoyait un mail « télécharge
 * l'app et connecte-toi »… mais PERSONNE ne créait le compte. Le backend Railway ne provisionne
 * que la source `whatsapp_ajnaya` (provisionWhatsappDriver). Résultat : le chauffeur payait,
 * ouvrait l'app, et se retrouvait devant un login sans identifiants. Premier mur, 100% des
 * clients payés-site. Cf. BRIEF_AUTH_TELEPHONE_SITE_2026-07-17.md §5.
 *
 * CE QU'IL SUFFIT DE FAIRE : créer le compte Auth. Le reste est automatique — le trigger
 * `on_auth_user_created` → `handle_new_user()` insère déjà `users`, `drivers`,
 * `behavior_models` et `user_karma` (vérifié en base le 2026-07-20). On ne duplique donc
 * AUCUNE de ces insertions ici : le jour où le trigger change, ce fichier n'a pas à bouger.
 *
 * SÉCURITÉ :
 * - le mot de passe est tiré de `crypto.randomBytes` (CSPRNG), jamais de Math.random ;
 * - il n'est JAMAIS loggé, ni renvoyé ailleurs que vers le mail d'identifiants ;
 * - il transite en clair dans cet email — assumé et justifié ICI (c'est le seul mot de passe
 *   que ce chauffeur possède ; sans lui il n'a aucun moyen d'entrer), avec invitation à le
 *   changer. Ne pas généraliser ce choix aux flux où l'utilisateur choisit son mot de passe.
 *
 * IDEMPOTENCE : Stripe rejoue ses webhooks (retry, doublons, replays manuels). Si le compte
 * existe déjà, on ne le touche pas et on ne renvoie PAS de mot de passe — sinon un simple
 * rejeu écraserait le mot de passe d'un chauffeur déjà installé et le mettrait dehors.
 */

import { randomBytes } from 'crypto'

export type ProvisionResult =
  | { status: 'created'; userId: string; password: string }
  | { status: 'already_exists'; userId: string | null }
  | { status: 'skipped'; reason: string }
  | { status: 'failed'; reason: string }

/**
 * Mot de passe lisible à la main : le chauffeur va le recopier depuis un mail, souvent sur un
 * clavier de téléphone, parfois en conduisant entre deux courses. On évite donc les caractères
 * ambigus (0/O, 1/l/I) et on garde des groupes courts séparés par des tirets.
 * ~62 bits d'entropie (3 × 5 caractères sur un alphabet de 30) — largement au-dessus du seuil
 * d'un mot de passe humain, et sans le rendre impossible à retaper.
 */
function generateReadablePassword(): string {
  const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789' // ni O/0, ni I/1/l
  const bytes = randomBytes(15)
  const chars = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length])
  return [chars.slice(0, 5).join(''), chars.slice(5, 10).join(''), chars.slice(10, 15).join('')].join('-')
}

async function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  // service_role OBLIGATOIRE : la clé anon n'a pas le droit `auth.admin`. Pas de repli
  // silencieux sur anon ici (contrairement à upsertSubscriber) — un repli produirait un
  // « compte créé » faux, donc un chauffeur bloqué sans qu'on le sache.
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  const { createClient } = await import('@supabase/supabase-js')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

export async function provisionDriverAccount({
  email,
  name,
  phone,
  city,
}: {
  email: string
  name?: string | null
  phone?: string | null
  city?: string | null
}): Promise<ProvisionResult> {
  const cleanEmail = (email || '').trim().toLowerCase()
  if (!cleanEmail) return { status: 'skipped', reason: 'email absent' }

  const supabase = await getAdminClient()
  if (!supabase) {
    // Volontairement bruyant : sans service_role, TOUS les payés-site restent bloqués.
    console.error('[provision] SUPABASE_SERVICE_ROLE_KEY manquante — compte NON créé pour', cleanEmail)
    return { status: 'skipped', reason: 'service_role manquante' }
  }

  const password = generateReadablePassword()

  const { data, error } = await supabase.auth.admin.createUser({
    email: cleanEmail,
    password,
    email_confirm: true, // il vient de payer : son email est prouvé par Stripe, pas de double vérif
    user_metadata: {
      full_name: name || '',
      phone: phone || '',
      city: city || '',
      source: 'checkout', // trace d'origine, symétrique de `whatsapp_ajnaya` côté Railway
      user_type: 'driver', // lu par handle_new_user() pour créer drivers/behavior_models/user_karma
    },
  })

  if (error) {
    // Supabase renvoie 422 `email_exists` si le compte est déjà là (rejeu Stripe, ou chauffeur
    // qui avait déjà un compte gratuit). Ce n'est pas une erreur : on ne réécrit rien.
    const msg = String(error.message || '')
    if (error.status === 422 || /already|exists|registered/i.test(msg)) {
      console.log('[provision] compte déjà existant, aucun mot de passe régénéré pour', cleanEmail)
      return { status: 'already_exists', userId: null }
    }
    console.error('[provision] échec création compte pour', cleanEmail, '—', msg)
    return { status: 'failed', reason: msg }
  }

  console.log('[provision] compte créé pour', cleanEmail, '— id', data.user?.id)
  return { status: 'created', userId: data.user?.id || '', password }
}

/**
 * OUVRIR L'ACCÈS DANS L'APP — LE GESTE QUI MANQUAIT.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ CE QUE ÇA A COÛTÉ, MESURÉ LE 29/08
 *
 * `provisionDriverAccount` ne créait QUE le compte de connexion (`auth.users`).
 * Rien, nulle part dans ce dépôt, n'écrivait dans `drivers` ni dans
 * `user_profiles`. La ligne `drivers` était donc posée par le déclencheur avec
 * ses valeurs par défaut : `status = 'pending'`, `subscription_active = false`,
 * et `user_profiles.tier = 'free'`.
 *
 * Or l'app exige les DEUX (`OnboardingTrialService.checkTrialActivated`) pour
 * laisser entrer. Un chauffeur qui venait de payer voyait donc l'écran
 * « active ton essai » — l'app lui redemandait de payer. En boucle, sans issue.
 *
 * Mesuré en base ce soir : le compte payé à 21:09 était `pending` / `false` /
 * `free`. Et **18 lignes sur 31** étaient dans cet état.
 *
 * C'est LA raison pour laquelle un chauffeur fuit. Elle appartenait au site.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ TROIS RÈGLES QUE CETTE FONCTION NE TRAHIT PAS
 *
 * 1. UNE ÉCRITURE QUI NE TOUCHE AUCUNE LIGNE N'EST PAS UN SUCCÈS. On lit le
 *    nombre de lignes rendues, on ne se fie pas à l'absence d'erreur.
 * 2. LES VALEURS NE SONT PAS DEVINÉES. `'active'` et `'pro'` ont été lues dans
 *    la base avant d'être écrites ici (status ∈ {pending, active} ;
 *    tier ∈ {free, pro, elite}).
 * 3. ON N'ÉCHOUE JAMAIS LE PAIEMENT POUR ÇA. Un accès non ouvert se rattrape ;
 *    un webhook en erreur coûte le compte, le mot de passe et le mail.
 */
export async function activerAccesChauffeur({
  email,
  finEssai,
}: {
  email: string
  /** Fin de l'essai, telle que Stripe la donne. `null` = déjà payant. */
  finEssai?: string | null
}): Promise<{ ouvert: boolean; detail: string }> {
  const cleanEmail = (email || '').trim().toLowerCase()
  if (!cleanEmail) return { ouvert: false, detail: 'email absent' }

  const supabase = await getAdminClient()
  if (!supabase) {
    console.error(
      `[acces] ⛔ clé de service absente — accès NON ouvert pour ${cleanEmail}. ` +
        "Le chauffeur a payé et l'app lui redemandera de payer.",
    )
    return { ouvert: false, detail: 'cle_service_absente' }
  }

  /* ⚠️ LA LIGNE `drivers` PEUT NE PAS ENCORE EXISTER.
     Elle est posée par le déclencheur `handle_new_user()` au moment de la
     création du compte, quelques instants plus tôt. On tente donc, et si aucune
     ligne n'est touchée on le DIT — au lieu de conclure que tout va bien. */
  const { data: lignesDriver, error: erreurDriver } = await supabase
    .from('drivers')
    .update({
      status: 'active',
      subscription_active: true,
      ...(finEssai ? { trial_ends_at: finEssai } : {}),
    })
    .eq('email', cleanEmail)
    .select('id')

  if (erreurDriver) {
    console.error(
      `[acces] ⛔ écriture drivers refusée pour ${cleanEmail} : ` +
        `${erreurDriver.code} ${erreurDriver.message}`,
    )
    return { ouvert: false, detail: `drivers:${erreurDriver.code}` }
  }
  if (!lignesDriver || lignesDriver.length === 0) {
    console.error(
      `[acces] ⛔ AUCUNE ligne drivers pour ${cleanEmail} — accès NON ouvert. ` +
        'Le déclencheur de création de compte a-t-il tourné ?',
    )
    return { ouvert: false, detail: 'aucune_ligne_drivers' }
  }

  const idChauffeur = lignesDriver[0].id

  /* Le palier décide de ce que l'app affiche (une carte grisée en `free`).
     L'échec ici n'annule pas l'ouverture : `drivers` est déjà ouvert, et c'est
     lui qui commande l'entrée. On le dit, on continue. */
  const { data: lignesProfil, error: erreurProfil } = await supabase
    .from('user_profiles')
    .update({ tier: 'pro' })
    .eq('user_id', idChauffeur)
    .select('user_id')

  if (erreurProfil) {
    console.error(
      `[acces] palier NON mis à jour pour ${cleanEmail} : ${erreurProfil.code} ${erreurProfil.message}`,
    )
  } else if (!lignesProfil || lignesProfil.length === 0) {
    console.warn(`[acces] aucune ligne user_profiles pour ${cleanEmail} — palier resté « free »`)
  }

  console.log(`[acces] accès ouvert dans l'app pour ${cleanEmail}`)
  return { ouvert: true, detail: 'ok' }
}

/**
 * L'ESCALIER DE VENTE, VU DEPUIS LE SITE — 23/08/2026
 * ============================================================================
 *
 * L'escalier vit en base (`parcours_commercial`) et ne monte QUE sur un
 * événement prouvé. Trois de ses marches n'avaient jusqu'ici aucun émetteur :
 *
 *     paiement_commence   ← une vraie session Stripe est créée
 *     essai_actif         ← Stripe confirme l'essai
 *     paiement_confirme   ← Stripe confirme l'argent
 *
 * Sans elles, « essai », « payé » et « première valeur » ne montaient jamais.
 * C'était le verrou nommé du 23/08.
 *
 * ⚠️ TROIS RÈGLES QUI NE SE NÉGOCIENT PAS
 *
 * 1. STRIPE SEUL PROUVE. Une session créée prouve qu'on a COMMENCÉ à payer,
 *    jamais qu'on a payé. Une page de succès ne prouve rien du tout.
 *
 * 2. LA PREUVE EST L'IDENTIFIANT STRIPE. `cs_…`, `in_…`, `evt_…` : stable,
 *    unique, vérifiable chez Stripe. C'est ce qui rend un rejeu de webhook
 *    inoffensif — la base refuse deux fois le même (identité, événement, preuve).
 *
 * 3. L'ESCALIER NE BLOQUE JAMAIS UN PAIEMENT. S'il tombe, l'argent passe quand
 *    même. On perd une marche, pas une vente. L'inverse serait indéfendable.
 */
import { createClient } from '@supabase/supabase-js'

/** Les seuls événements que le site a le droit d'émettre. */
export type EvenementEscalier =
  | 'paiement_commence'
  | 'essai_actif'
  | 'paiement_confirme'

function clientService() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

/**
 * Fait monter une marche. Ne jette JAMAIS : une panne de l'escalier ne doit
 * pas remonter jusqu'au paiement.
 *
 * `preuveId` doit être un identifiant Stripe. Passer autre chose ferait monter
 * une marche sur du vent — la base l'accepterait, et c'est précisément pour ça
 * que la discipline vit ici, au seul endroit qui parle à Stripe.
 */
export async function monterUneMarche(
  identityId: string | null | undefined,
  evenement: EvenementEscalier,
  preuveId: string | null | undefined,
  canal = 'site',
): Promise<void> {
  // Pas d'identité = pas de marche. On ne devine pas à qui appartient un
  // paiement : un escalier attaché à la mauvaise personne est pire qu'un
  // escalier vide.
  if (!identityId || !preuveId) return
  try {
    const supa = clientService()
    if (!supa) return
    await supa.rpc('parcours_avancer', {
      p_identity: identityId,
      p_evenement: evenement,
      p_preuve_id: preuveId,
      p_canal: canal,
    })
  } catch {
    // Silencieux et assumé : l'argent passe, la marche attendra.
  }
}

/**
 * Retrouve l'identité d'un visiteur à partir de son cookie de première partie,
 * CÔTÉ SERVEUR. Le navigateur ne choisit jamais son identité — il porte un
 * badge, le serveur décide de qui il s'agit.
 *
 * Rend `null` plutôt qu'une identité fabriquée : sans certitude, la marche ne
 * monte pas. C'est le comportement voulu.
 */
export async function identiteDepuisCookie(cookieHeader: string | null): Promise<string | null> {
  if (!cookieHeader) return null
  const vid = cookieHeader.match(/(?:^|;\s*)foreas_vid=([^;]+)/)?.[1]
  if (!vid) {
    // Pas de badge : ce n'est pas une panne, c'est un visiteur sans cookie.
    return null
  }
  try {
    const supa = clientService()
    if (!supa) {
      // ⚠️ 23/08 — CE CAS ÉTAIT MUET. Trois contradicteurs ont dû faire
      // quinze appels et éliminer trois hypothèses pour découvrir que
      // l'escalier n'écrivait rien. Un `catch {}` qui avale la raison
      // transforme une panne en absence, et une absence ne se diagnostique pas.
      console.warn('[escalier] identité non résolue : configuration Supabase absente')
      return null
    }
    const { data, error } = await supa.rpc('resolve_identity', {
      p_visitor_id: decodeURIComponent(vid),
      p_canal: 'site',
    })
    if (error) {
      console.warn('[escalier] resolve_identity a refusé :', error.message)
      return null
    }
    if (!data) {
      console.warn('[escalier] resolve_identity n\'a rien rendu')
      return null
    }
    const d = data as { identity_id?: string | null; conflict?: boolean }
    // ⚠️ `conflict` veut dire « la base ne sait pas de QUI il s'agit ».
    // Continuer, ce serait attacher un paiement au dossier d'un autre.
    if (d.conflict === true) return null
    return d.identity_id ?? null
  } catch (err) {
    console.warn('[escalier] identité non résolue :', (err as Error).message)
    return null
  }
}

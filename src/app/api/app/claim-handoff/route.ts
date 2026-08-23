import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { createHash, createHmac } from 'crypto'

export const runtime = 'nodejs'

/**
 * POST /api/app/claim-handoff
 *
 * Called by the FOREAS Driver app when it opens with a ?deeplink=<token> URL.
 * Validates the token, returns the conversation state, and marks it as used.
 *
 * Body: { token: string }
 * Response: { ok: true, state: object, identity_id: string }
 *        or { error: string } with 400/404/410
 *
 * Security:
 * - Token is a UUID — unguessable
 * - Single-use: used_at is set on first claim (subsequent calls → 410)
 * - 48h TTL: expired tokens → 410
 * - Service role only touches the table (RLS blocks all other access)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    // `let` et non `const` : un code court est résolu en jeton juste en dessous.
    let { token } = body

    // ═══════════════════════════════════════════════════════════════════════
    // 23/08 v2 — RÉCLAMATION PAR NUMÉRO : LE TEXTE N'EST PLUS UNE AUTORITÉ
    // ═══════════════════════════════════════════════════════════════════════
    // Un message `wa.me` est un texte du chauffeur : modifiable, effaçable.
    // Aucun code placé dedans ne peut faire autorité — ni un UUID, ni un code
    // court. La continuité passe donc par le NUMÉRO ENTRANT, relu côté serveur.
    //
    // Mais un numéro SAISI sur le site ne prouve rien : n'importe qui peut
    // taper celui d'un autre. D'où la règle unique et sans exception :
    //
    //        SEUL UN PASSAGE `BOUND` REND UN CONTEXTE.
    //
    // Un passage `UNBOUND` — c'est-à-dire tout passage né d'une simple saisie —
    // ne rend RIEN. L'attaquant qui inscrit le numéro d'une victime fabrique un
    // brouillon inerte : quand la victime écrit, elle ouvre une conversation
    // neuve, sans un mot de ce que l'attaquant avait tapé.
    //
    // Cette porte est réservée au serveur : elle exige la clé Pieuvre. Un
    // appelant public ne peut pas choisir un numéro et voir ce qui l'attend.
    const parNumero = body?.by_phone === true
    if (parNumero) {
      const cle = process.env.PIEUVRE_API_KEY || process.env.PIEUVRE_OBSERVE_KEY || ''
      const fournie = (req.headers.get('x-pieuvre-key') || '')
      if (!cle || fournie !== cle) {
        return NextResponse.json({ error: 'non_autorise' }, { status: 401 })
      }

      const brut = typeof body?.phone_e164 === 'string' ? body.phone_e164.trim() : ''
      if (!/^\+\d{8,15}$/.test(brut)) {
        return NextResponse.json({ error: 'numero_invalide' }, { status: 400 })
      }

      const secret = process.env.PASSAGE_HMAC_SECRET || process.env.OBSERVE_HMAC_SALT || ''
      if (!secret) {
        // Pas de secret = pas d'empreinte. On ne retombe JAMAIS sur un hachage
        // nu : 15 chiffres se parcourent en entier. Sans secret, on refuse.
        return NextResponse.json({ error: 'empreinte_indisponible' }, { status: 503 })
      }
      const hmac = createHmac('sha256', secret).update(brut).digest('hex')

      const clientNum = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
      )

      // Consommation ATOMIQUE : le filtre `lien_etat='BOUND'` est DANS l'update.
      // Vérifier puis agir de part et d'autre d'une attente n'est pas atomique —
      // deux messages simultanés passeraient tous les deux.
      const { data: pris } = await clientNum
        .from('handoff_tokens')
        .update({ used_at: new Date().toISOString(), claim_method: 'numero_entrant' })
        .eq('phone_hmac', hmac)
        .eq('lien_etat', 'BOUND')
        .eq('target_canal', 'whatsapp')
        .is('used_at', null)
        .is('revoked_at', null)
        .gt('expires_at', new Date().toISOString())
        .select('identity_id, source_canal, target_canal, state')
        .maybeSingle()

      if (!pris) {
        // Aucun passage PROUVÉ pour ce numéro. Réponse identique dans tous les
        // cas — passage absent, seulement déclaré, expiré ou déjà pris : on
        // n'apprend à personne si un numéro « existe » chez FOREAS.
        return NextResponse.json({ ok: false, reason: 'aucun_passage_lie' }, { status: 200 })
      }

      return NextResponse.json({
        ok: true,
        identity_id: pris.identity_id,
        source_canal: pris.source_canal,
        target_canal: pris.target_canal,
        state: pris.state,
        claim_method: 'numero_entrant',
      })
    }

    /**
     * ⚠️ 23/08/2026 — LE CANAL DEMANDÉ, ET POURQUOI IL EST OPTIONNEL.
     *
     * Un billet `target_canal='app'` ne doit JAMAIS être consommé par WhatsApp.
     * Mais l'App, elle, appelle cette route sans dire son canal depuis toujours :
     * l'exiger casserait le chemin App, qui est le SEUL à avoir déjà consommé un
     * billet en production.
     *
     * On le rend donc facultatif, et STRICT quand il est fourni. Le nœud n8n
     * WhatsApp l'envoie ; il ne peut donc plus toucher un billet App, même par
     * accident. Le jour où l'App l'enverra aussi, la garde deviendra totale des
     * deux côtés — sans avoir cassé quoi que ce soit entre-temps.
     */
    const canalDemande =
      typeof body?.target_canal === 'string' && body.target_canal.trim()
        ? body.target_canal.trim()
        : null

    /**
     * ⚠️ 23/08/2026 — LE BILLET N'ÉTAIT RELIÉ À PERSONNE.
     *
     * Le nœud n8n envoie `phone_e164` depuis toujours. Cette route contenait
     * ZÉRO occurrence du mot « phone » : le numéro était transmis puis jeté.
     *
     * Le billet reste un jeton AU PORTEUR — il voyage dans un lien
     * `wa.me/...?text=<uuid>`, c'est sa nature, on ne peut pas la changer. Mais
     * on peut enregistrer QUI l'a réclamé, pour qu'un vol laisse une trace au
     * lieu d'être invisible.
     *
     * On garde une EMPREINTE tronquée, jamais le numéro : un numéro en clair
     * dans une table de jetons serait une donnée personnelle de plus à
     * protéger, pour un gain nul. On veut savoir « est-ce le même porteur ? »,
     * pas « qui est-ce ».
     */
    const porteurBrut =
      typeof body?.phone_e164 === 'string' ? body.phone_e164.trim() : ''
    const porteurHash = porteurBrut
      ? createHash('sha256').update(porteurBrut).digest('hex').slice(0, 16)
      : null

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'missing_token' }, { status: 400 })
    }

    // Validate UUID format — prevents injection / unexpected queries
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    // 23/08 — le message prérempli ne porte plus l'UUID brut mais un code court
    // (6 caractères, alphabet sans 0/O ni 1/I/L). Même alphabet ici, en dur :
    // accepter « n'importe quoi de 6 caractères » ouvrirait une porte au hasard.
    const CODE_COURT_RE = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/i

    const clientResolution = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    if (!UUID_RE.test(token)) {
      // 23/08 v2 — LE CODE COURT EST RETIRÉ, PAS ADAPTÉ.
      // Il avait été ajouté ce matin pour rendre le message lisible. C'était un
      // progrès d'apparence : un texte que le chauffeur peut réécrire ne porte
      // aucune autorité, qu'il contienne un UUID ou six lettres. La continuité
      // WhatsApp passe désormais par le numéro entrant (porte `by_phone`
      // ci-dessus), et l'App garde son jeton — qu'elle réclame avec sa session.
      // Supprimer le symbole plutôt que l'adapter : ce qui n'existe plus ne
      // peut pas être rappelé par erreur dans six mois.
      return NextResponse.json({ error: 'invalid_token_format' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Resolve client IP (Vercel forwards real IP in x-forwarded-for)
    const forwardedFor = req.headers.get('x-forwarded-for')
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown'
    const maintenant = new Date().toISOString()

    /**
     * ══════════════════════════════════════════════════════════════════════
     * LA CONSOMMATION EST ATOMIQUE — UNE SEULE OPÉRATION, PAS DEUX.
     *
     * AVANT : on faisait `SELECT used_at` puis, si vide, `UPDATE used_at`.
     * Entre les deux, une fenêtre. Deux webhooks Meta arrivant en même temps
     * — ce qui arrive : Meta REJOUE un webhook non accusé — lisaient tous les
     * deux `used_at = null`, et tous les deux repartaient avec le contexte.
     * Le chauffeur recevait alors DEUX messages de reprise pour un seul clic.
     *
     * MAINTENANT : toutes les conditions vivent dans le `WHERE` du même UPDATE.
     * C'est Postgres qui arbitre, pas notre code. Le second appel modifie ZÉRO
     * ligne et repart les mains vides — sans erreur, sans doublon.
     *
     * `.select()` après l'`update` renvoie la ligne RÉELLEMENT modifiée : c'est
     * ce retour, et lui seul, qui prouve qu'on a gagné la course.
     * ══════════════════════════════════════════════════════════════════════
     */
    /**
     * ══════════════════════════════════════════════════════════════════════
     * 23/08/2026 — LE GARDE-CANAL TENAIT À UN CHAMP QU'IL SUFFISAIT D'OMETTRE.
     *
     * Trouvé par relecture adverse, et PROUVÉ : un billet `target_canal='app'`
     * a été consommé depuis une machine tierce en n'envoyant simplement PAS
     * `target_canal`. Le garde ne coûtait à l'attaquant qu'un champ à retirer.
     *
     * On le rend OBLIGATOIRE — mais seulement là où on peut le rendre
     * obligatoire sans rien casser :
     *
     *   billet `app`      → déclaration facultative. C'est le chemin historique
     *                       de l'App, le SEUL qui ait déjà consommé un billet
     *                       en production. L'exiger casserait ce qui marche.
     *   billet AUTRE      → déclaration OBLIGATOIRE et exacte, sinon 409.
     *
     * Un billet WhatsApp ne peut donc plus être réclamé par un appelant qui se
     * tait. La direction qui compte est fermée ; l'autre attend que l'App
     * envoie son canal, et ce jour-là la garde devient totale.
     * ══════════════════════════════════════════════════════════════════════
     */
    const { data: cible } = await supabase
      .from('handoff_tokens')
      .select('target_canal')
      .eq('token', token)
      .maybeSingle()

    if (cible && cible.target_canal !== 'app' && canalDemande !== cible.target_canal) {
      // On ne dit PAS quel canal était attendu : ce serait donner à un appelant
      // qui tâtonne l'information qui lui manque.
      return NextResponse.json({ error: 'token_wrong_canal' }, { status: 409 })
    }

    let requete = supabase
      .from('handoff_tokens')
      .update({ used_at: maintenant, used_from_ip: clientIp, used_by_hash: porteurHash })
      .eq('token', token)
      .is('used_at', null)       // pas déjà consommé
      .is('revoked_at', null)    // pas révoqué
      .gt('expires_at', maintenant) // pas expiré

    if (canalDemande) requete = requete.eq('target_canal', canalDemande)

    const { data: reclame, error: erreurReclamation } = await requete
      .select('token, identity_id, source_canal, target_canal, state, expires_at')
      .maybeSingle()

    if (erreurReclamation) {
      console.error('[claim-handoff] écriture impossible:', erreurReclamation.message)
      return NextResponse.json({ error: 'server_error' }, { status: 500 })
    }

    /**
     * ZÉRO LIGNE MODIFIÉE. On ne sait pas encore POURQUOI, et la raison compte :
     * « déjà utilisé » et « expiré » ne se racontent pas pareil au chauffeur.
     *
     * On relit donc SANS écrire, uniquement pour nommer le refus. Cette lecture
     * n'ouvre aucune fenêtre : la course est déjà tranchée par l'UPDATE
     * ci-dessus. Si elle rendait un billet libre, c'est qu'un autre appel vient
     * de le prendre — et le refus reste juste.
     */
    if (!reclame) {
      const { data: pourquoi } = await supabase
        .from('handoff_tokens')
        .select('used_at, revoked_at, expires_at, target_canal')
        .eq('token', token)
        .maybeSingle()

      if (!pourquoi) {
        return NextResponse.json({ error: 'token_not_found' }, { status: 404 })
      }
      if (pourquoi.revoked_at) {
        return NextResponse.json({ error: 'token_revoked' }, { status: 410 })
      }
      if (pourquoi.used_at) {
        return NextResponse.json({ error: 'token_already_used' }, { status: 410 })
      }
      if (new Date(pourquoi.expires_at as string) < new Date()) {
        return NextResponse.json({ error: 'token_expired' }, { status: 410 })
      }
      if (canalDemande && pourquoi.target_canal !== canalDemande) {
        // Un billet App réclamé par WhatsApp, ou l'inverse. On refuse et on le
        // DIT : un refus muet ici ressemblerait à un billet perdu, et pousserait
        // à en émettre un second.
        return NextResponse.json({ error: 'token_wrong_canal' }, { status: 409 })
      }
      // Le billet était libre à la relecture : un appel concurrent l'a pris
      // entre-temps. C'est exactement le cas que l'atomicité existe pour gérer.
      return NextResponse.json({ error: 'token_already_used' }, { status: 410 })
    }

    // Return full identity_id UUID (app needs it to match identity_bridge + canal_memory rows)
    // Not sensitive — it's a server-generated UUID, not a hash of personal data.
    // Conformité AJNAYA_CONTRACTS.md §4 — state contient last_messages, intent, heat_score,
    // objection, pending_question, url_pre_landing, prompt_for_next_canal.
    return NextResponse.json({
      ok: true,
      identity_id: reclame.identity_id,
      display_id: (reclame.identity_id as string).slice(0, 8), // pour UI d'affichage
      source_canal: reclame.source_canal,
      target_canal: reclame.target_canal,
      state: reclame.state,
    })
  } catch (err) {
    console.error('[claim-handoff]', (err as Error).message)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}

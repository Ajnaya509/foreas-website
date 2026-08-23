import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

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
    const { token } = body

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

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'missing_token' }, { status: 400 })
    }

    // Validate UUID format — prevents injection / unexpected queries
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!UUID_RE.test(token)) {
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
    let requete = supabase
      .from('handoff_tokens')
      .update({ used_at: maintenant, used_from_ip: clientIp })
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

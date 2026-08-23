import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
// 20/08/2026 — adresses passées par src/lib/site.ts : l'apex redirige (307), donc
// une adresse sans « www » écrite en dur fait un saut de plus, et côté publicité
// elle ne correspond pas à l'adresse canonique de la page.
import { URL_SITE } from '@/lib/site'

export const runtime = 'nodejs'

/**
 * POST /api/app/issue-handoff
 *
 * Called by AjnayaWidget (client → server) when the user captures their phone
 * number or clicks "Continuer sur WhatsApp / Télécharger l'app".
 * Creates a handoff_tokens row and returns the deeplink URL for the target canal.
 *
 * Conformité : AJNAYA_CONTRACTS.md §4 — Flux standard
 * `state.prompt_for_next_canal` est OBLIGATOIRE (phrase d'accroche pré-composée).
 *
 * Body: {
 *   identity_id:   string,         // full UUID from identity_bridge
 *   state:         object,         // { last_messages, intent, heat_score, objection,
 *                                  //   pending_question, url_pre_landing,
 *                                  //   prompt_for_next_canal (obligatoire) }
 *   source_canal?: string          // default "widget"
 *   target_canal?: string          // "whatsapp" | "app" (default "app")
 * }
 *
 * Response: {
 *   ok:          true,
 *   token:       string,           // UUID stored in handoff_tokens
 *   deeplink:    string,           // foreas://handoff?token=<uuid> (app)
 *                                  // or https://wa.me/33780732216?text=<uuid> (whatsapp)
 *   webFallback: string            // https://foreas.xyz/go?deeplink=<uuid>
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      identity_id,
      state,
      source_canal = 'widget',
      target_canal = 'app',
    } = body as {
      identity_id?: string
      state?: Record<string, unknown>
      source_canal?: string
      target_canal?: string
    }

    if (!identity_id || typeof identity_id !== 'string') {
      return NextResponse.json({ error: 'missing_identity_id' }, { status: 400 })
    }

    // Validate UUID format
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!UUID_RE.test(identity_id)) {
      return NextResponse.json({ error: 'invalid_identity_id_format' }, { status: 400 })
    }

    const resolvedState = state || {}

    // ── 23/08 — LE SUJET, C'EST LA PHRASE DU CHAUFFEUR ─────────────────────────
    // Mesuré sur un vrai téléphone : les deux appelants (LivePhone, AjnayaWidget)
    // composaient le contexte à partir de la DERNIÈRE PHRASE D'AJNAYA. Ce jour-là
    // Ajnaya avait planté, sa dernière phrase était son propre message d'erreur,
    // et le billet est parti en annonçant :
    //   On parlait de : "Petit souci de connexion — écris-moi sur WhatsApp"
    // La question réellement posée — « la zone Roissy à 6 h » — n'y était pas.
    //
    // Une conversation a un sujet parce que QUELQU'UN A DEMANDÉ QUELQUE CHOSE.
    // La réponse de l'assistant n'est jamais le sujet, et son échec encore moins.
    //
    // On corrige ICI, au point unique où le billet naît, plutôt que dans chaque
    // composant appelant : un correctif posé à deux endroits sur trois n'en est
    // pas un.
    const derniers = Array.isArray(resolvedState.last_messages) ? resolvedState.last_messages : []

    // Ce qui n'est PAS un sujet : nos propres pannes et nos formules d'attente.
    const RIEN_A_DIRE = /souci de connexion|réessaie|réessayer|indisponible|erreur|une seconde|je réfléchis/i

    const questionChauffeur: string =
      [...derniers]
        .reverse()
        .map((m: { role?: string; text?: string } | null) =>
          m && m.role === 'user' && typeof m.text === 'string' ? m.text.trim() : '')
        .find((t: string) => t.length >= 3 && !RIEN_A_DIRE.test(t)) || ''

    if (questionChauffeur) {
      // On ÉCRASE délibérément ce que l'appelant a composé : le serveur voit les
      // messages, il sait donc mieux que le composant ce qui a été demandé.
      //
      // ⚠️ `prompt_for_next_canal` est ENVOYÉ TEL QUEL au chauffeur par la
      // Pieuvre (nœud « Send Handoff Welcome WA »). Ce n'est donc PAS une
      // consigne adressée à un modèle : c'est une phrase adressée à un humain.
      // Écrire ici « Réponds à cette question » ferait lire au chauffeur l'ordre
      // qu'on donnait à la machine.
      resolvedState.question_chauffeur = questionChauffeur
      resolvedState.prompt_for_next_canal =
        target_canal === 'whatsapp'
          ? `Tu me demandais : « ${questionChauffeur.slice(0, 160)} ». Je te réponds ici.`
          : `Tu me demandais : « ${questionChauffeur.slice(0, 160)} ». On reprend.`
    } else if (!resolvedState.prompt_for_next_canal) {
      // Aucune question exploitable : on ne fabrique AUCUN souvenir.
      // « Rien à résumer » n'autorise pas à inventer un passé commun — et surtout
      // pas un « ravie de te retrouver » adressé à quelqu'un dont on ne sait rien.
      resolvedState.prompt_for_next_canal =
        target_canal === 'whatsapp'
          ? "Dis-moi ce que tu cherches, je te réponds ici."
          : "Dis-moi ce que tu cherches, on reprend ici."
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabase
      .from('handoff_tokens')
      .insert({
        identity_id,
        source_canal,
        target_canal,
        state: resolvedState,
      })
      .select('token, short_code')
      .single()

    if (error || !data) {
      console.error('[issue-handoff] insert error:', error?.message)
      return NextResponse.json({ error: 'insert_failed' }, { status: 500 })
    }

    const token = data.token as string

    // ── 23/08 — UN MESSAGE QUE PERSONNE N'ENVERRA TEL QUEL N'EST PAS UN PONT ──
    // Le texte prérempli était l'identifiant BRUT du billet :
    //     16ef60af-384b-434d-bac3-5228fd0ced71
    // Il est parti tel quel une seule fois : parce que Chandler testait. Un
    // chauffeur l'efface — ça ne ressemble à rien et on n'envoie pas ça à
    // quelqu'un. Et c'était aussi le billet EN CLAIR dans la conversation.
    //
    // Le message porte maintenant DEUX choses, dans cet ordre d'importance :
    //   1. LA PHRASE DU CHAUFFEUR — même retapée de mémoire ou raccourcie, le
    //      sujet survit. C'est elle qui fait le travail.
    //   2. un code COURT (6 caractères, ni 0/O ni 1/I/L) qui relie le numéro au
    //      visiteur du site. Il ne sert QU'AU PREMIER message : ensuite le
    //      numéro est connu et tout se résout par lui.
    //
    // Si le chauffeur efface le code, on perd le lien — pas le sujet. Et on ne
    // fera semblant de reconnaître personne.
    const code = (data as { short_code?: string }).short_code || ''
    const sujet = (resolvedState.question_chauffeur as string | undefined) || ''

    const texteWhatsApp = sujet
      ? `Salut Ajnaya, on parlait de : « ${sujet.slice(0, 120)} ». Je continue ici.${code ? ` (réf. ${code})` : ''}`
      : `Salut Ajnaya, je continue ici la conversation commencée sur foreas.xyz.${code ? ` (réf. ${code})` : ''}`

    // Build deeplink per target canal
    const deeplink =
      target_canal === 'whatsapp'
        ? `https://wa.me/33780732216?text=${encodeURIComponent(texteWhatsApp)}`
        : `foreas://handoff?token=${token}`

    const webFallback = `${URL_SITE}/go?deeplink=${token}`

    // Emit analytics event (v1.1 columns) — fire-and-forget, never block response
    try {
      await supabase.from('pieuvre_analytics_events').insert({
        event_name: 'widget.handoff_issued',
        identity_id,
        canal_source: source_canal,
        processed: false,
        meta: { token, target_canal, source_canal, identity_id },
        ts: Date.now(),
      })
    } catch { /* silent — analytics never blocks handoff */ }

    return NextResponse.json({ ok: true, token, deeplink, webFallback })
  } catch (err) {
    console.error('[issue-handoff]', (err as Error).message)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}

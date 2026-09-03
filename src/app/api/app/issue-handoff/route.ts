import { NextRequest, NextResponse } from 'next/server'
// 20/08/2026 — adresses passées par src/lib/site.ts : l'apex redirige (307), donc
// une adresse sans « www » écrite en dur fait un saut de plus, et côté publicité
// elle ne correspond pas à l'adresse canonique de la page.
import { URL_SITE } from '@/lib/site'
import { normalizePhoneE164, resolveSiteIdentity } from '@/lib/identityGate'
import { clientServeurOuNull } from '@/lib/supabaseServeur'
import {
  WHATSAPP_HANDOFF_COOKIE,
  WHATSAPP_HANDOFF_TTL_SECONDS,
  phoneHmac,
  signWhatsAppHandoffCookie,
  whatsappHandoffSecrets,
} from '@/lib/whatsappHandoffProof'

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
 *   token:       string,           // App seulement
 *   deeplink:    string,           // foreas://handoff?token=<uuid> (app)
 *                                  // ou /whatsapp-verification (WhatsApp)
 *   webFallback: string            // https://foreas.xyz/go?deeplink=<uuid>
 * }
 */
/**
 * ── 23/08 v2 — LE TEXTE N'EST PLUS UNE AUTORITÉ ──────────────────────────────
 *
 * Un message `wa.me` est un TEXTE DU CHAUFFEUR : il peut le modifier, le
 * raccourcir, l'effacer. Aucun code placé dedans ne peut devenir invisible ni
 * ineffaçable. Le code court d'hier n'était donc qu'un UUID plus joli.
 *
 * La liaison se prouve désormais CÔTÉ SERVEUR, par le numéro entrant — et un
 * numéro simplement SAISI ne prouve rien : n'importe qui peut taper celui d'un
 * autre. Un passage n'est donc `BOUND` que si le serveur peut le PROUVER.
 * Sinon il reste `UNBOUND` : il n'ouvre aucune mémoire privée, jamais.
 *
 * C'est ce qui rend inerte l'attaque la plus simple : inscrire le numéro d'une
 * victime, puis attendre qu'elle écrive.
 */
const BACKEND_URL = (
  process.env.FOREAS_BACKEND_URL ||
  process.env.BACKEND_URL ||
  'https://foreas-stripe-backend-production.up.railway.app'
).replace(/\/+$/, '')

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      identity_id,
      state,
      source_canal = 'widget',
      target_canal = 'app',
      phone_e164,
    } = body as {
      identity_id?: string
      state?: Record<string, unknown>
      source_canal?: string
      target_canal?: string
      phone_e164?: string
    }

    // Validate UUID format
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (target_canal !== 'whatsapp' && (!identity_id || !UUID_RE.test(identity_id))) {
      return NextResponse.json({ error: 'invalid_identity_id_format' }, { status: 400 })
    }

    // WhatsApp n'accepte jamais l'UUID envoyé par le navigateur. Le serveur relit
    // le badge httpOnly du Site et décide lui-même de l'identité de départ.
    const serverIdentityId = target_canal === 'whatsapp'
      ? await resolveSiteIdentity(req, {
          canal: 'widget',
          claimed_identity_id: typeof identity_id === 'string' ? identity_id : null,
        })
      : identity_id!
    if (!serverIdentityId) {
      return NextResponse.json({ error: 'identity_unresolved' }, { status: 409 })
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

    // Le numéro visé, s'il a été saisi. Normalisé puis empreinté côté serveur :
    // il n'est jamais stocké en clair, et l'empreinte reste une donnée personnelle.
    const numeroVise = typeof phone_e164 === 'string' ? normalizePhoneE164(phone_e164) : null
    const secrets = whatsappHandoffSecrets()

    // Sans numéro prouvable, WhatsApp reste disponible mais ouvre une nouvelle
    // discussion. Aucun contexte privé n'est préparé, donc rien ne peut être
    // attribué à la mauvaise personne.
    if (target_canal === 'whatsapp' && !numeroVise) {
      return NextResponse.json({
        ok: true,
        deeplink: '/wa?s=experience_phone&p=%2F&i=ajnaya&o=telephone_vivant',
        verification_required: false,
        context_carried: false,
      })
    }
    if (target_canal === 'whatsapp' && !secrets) {
      return NextResponse.json({ error: 'verification_not_configured' }, { status: 503 })
    }

    const empreinte = numeroVise && secrets
      ? {
          hmac: phoneHmac(numeroVise, secrets.phoneSecret),
          version: Number(process.env.PASSAGE_HMAC_VERSION || 1),
        }
      : null

    // Réutilise le service OTP Twilio déjà vivant dans le backend. Le jeton de
    // cette session ne ressort jamais dans le JSON ni dans une adresse.
    let otpSessionToken: string | null = null
    if (target_canal === 'whatsapp' && numeroVise) {
      try {
        const otpResponse = await fetch(`${BACKEND_URL}/api/auth/send-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: numeroVise }),
          cache: 'no-store',
          signal: AbortSignal.timeout(10_000),
        })
        const otpBody = await otpResponse.json().catch(() => null) as {
          success?: boolean
          sessionToken?: string
        } | null
        if (otpResponse.ok && otpBody?.success === true &&
            typeof otpBody.sessionToken === 'string' && UUID_RE.test(otpBody.sessionToken)) {
          otpSessionToken = otpBody.sessionToken
        }
      } catch {
        // Réponse maîtrisée juste en dessous. Aucun passage n'est créé.
      }
      if (!otpSessionToken) {
        return NextResponse.json({ error: 'otp_not_sent' }, { status: 503 })
      }
    }

    const supabase = clientServeurOuNull()
    if (!supabase) {
      return NextResponse.json({ error: 'database_not_configured' }, { status: 503 })
    }

    const { data, error } = await supabase
      .from('handoff_tokens')
      .insert({
        identity_id: serverIdentityId,
        source_canal,
        target_canal,
        state: resolvedState,
        // ── LA LIAISON N'EST PAS DÉCLARÉE, ELLE EST PROUVÉE ──────────────────
        // Cette route est appelée DEPUIS LE NAVIGATEUR. Rien de ce qu'elle
        // reçoit ne peut donc valoir preuve — pas même le numéro. Un passage
        // né ici est TOUJOURS `UNBOUND`, et un passage `UNBOUND` n'ouvre
        // aucune mémoire privée, jamais.
        //
        // C'est ce qui rend inerte l'attaque la plus simple : inscrire le
        // numéro d'une victime puis attendre qu'elle écrive à Ajnaya. Son
        // brouillon existe, il ne sert à rien.
        //
        // On garde tout de même l'empreinte du numéro visé : c'est elle que la
        // cérémonie de possession viendra confirmer plus tard. Une empreinte
        // n'est pas une preuve — c'est la CIBLE d'une preuve à venir.
        ...(empreinte ? { phone_hmac: empreinte.hmac, hmac_version: empreinte.version } : {}),
        lien_etat: 'UNBOUND',
        claim_method: target_canal === 'whatsapp' ? 'twilio_verify_pending' : 'jeton_app',
        ...(target_canal === 'whatsapp'
          ? { expires_at: new Date(Date.now() + WHATSAPP_HANDOFF_TTL_SECONDS * 1000).toISOString() }
          : {}),
      })
      .select('token')
      .single()

    if (error || !data) {
      console.error('[issue-handoff] insert error:', error?.message)
      return NextResponse.json({ error: 'insert_failed' }, { status: 500 })
    }

    const token = data.token as string

    // Le billet WhatsApp ne quitte jamais le serveur. Le navigateur reçoit
    // seulement la page de vérification ; l'App garde son jeton historique.
    const deeplink =
      target_canal === 'whatsapp'
        ? '/whatsapp-verification'
        : `foreas://handoff?token=${token}`

    const webFallback = `${URL_SITE}/go?deeplink=${token}`

    // Emit analytics event (v1.1 columns) — fire-and-forget, never block response
    try {
      await supabase.from('pieuvre_analytics_events').insert({
        event_name: 'widget.handoff_issued',
        identity_id: serverIdentityId,
        canal_source: source_canal,
        processed: false,
        meta: target_canal === 'whatsapp'
          ? { target_canal, source_canal, identity_id: serverIdentityId, verification: 'pending' }
          : { token, target_canal, source_canal, identity_id: serverIdentityId },
        ts: Date.now(),
      })
    } catch { /* silent — analytics never blocks handoff */ }

    // ── CE QUI SORT D'ICI PART DANS UN NAVIGATEUR ────────────────────────────
    // Pour l'App, le jeton reste nécessaire : `HandoffService` le réclame avec
    // une session authentifiée, c'est son contrat et il est vivant.
    // Pour WhatsApp, plus personne n'en a besoin — la réclamation se fait par le
    // numéro entrant, côté serveur. Le rendre ici ne ferait que le remettre dans
    // un texte, c'est-à-dire recréer exactement la faille qu'on ferme.
    if (target_canal === 'whatsapp') {
      if (!otpSessionToken || !numeroVise || !empreinte || !secrets) {
        return NextResponse.json({ error: 'verification_not_prepared' }, { status: 503 })
      }
      const page = typeof resolvedState.url_pre_landing === 'string'
        ? resolvedState.url_pre_landing.slice(0, 120)
        : '/'
      const section = source_canal === 'widget' && resolvedState.intent === 'experience_phone_continue'
        ? 'experience_phone'
        : 'final'
      const nextParams = new URLSearchParams({ s: section, p: page, i: 'ajnaya', o: 'reprise_verifiee' })
      const cookieValue = signWhatsAppHandoffCookie({
        version: 1,
        handoffToken: token,
        otpSessionToken,
        phoneE164: numeroVise,
        phoneHmac: empreinte.hmac,
        identityIdAtIssue: serverIdentityId,
        nextPath: `/wa?${nextParams.toString()}`,
        expiresAtMs: Date.now() + WHATSAPP_HANDOFF_TTL_SECONDS * 1000,
      }, secrets.cookieSecret)
      const response = NextResponse.json({
        ok: true,
        deeplink,
        verification_required: true,
        context_carried: false,
      })
      response.cookies.set(WHATSAPP_HANDOFF_COOKIE, cookieValue, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: WHATSAPP_HANDOFF_TTL_SECONDS,
      })
      return response
    }
    return NextResponse.json({ ok: true, token, deeplink, webFallback })
  } catch (err) {
    console.error('[issue-handoff]', (err as Error).message)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}

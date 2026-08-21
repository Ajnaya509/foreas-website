import { NextResponse } from 'next/server'
import { notFound } from 'next/navigation'
import { sujetValide } from '@/lib/sujets'

/**
 * /go/<topic> — destination du CTA de chaque landing SEO.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * POURQUOI CETTE ROUTE A ÉTÉ REFAITE (31/07/2026)
 *
 * Elle était cassée sur les TROIS appareils. Vérifié en production, avec de
 * vrais user-agents :
 *
 *   iPhone   → https://apps.apple.com/app/foreas-driver/id[APP_ID]  → HTTP 404
 *              Le gabarit `[APP_ID]` n'avait jamais été remplacé.
 *   Android  → .../details?id=com.foreas.driver?deeplink=charges
 *              DEUX `?` dans l'URL : le paramètre devient une partie du nom de
 *              paquet, Play Store ne trouve rien.
 *   Desktop  → redirigeait vers /<topic>, c'est-à-dire la page d'où l'on vient.
 *              Le visiteur cliquait « Essayer gratuitement » et se retrouvait
 *              au même endroit. Une boucle.
 *
 * Autrement dit : le seul bouton de conversion des 10 landings SEO ne menait
 * nulle part. Peu importe la qualité du texte au-dessus.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * POURQUOI /tarifs2 ET PAS LES STORES
 *
 * 1. MODÈLE ÉCONOMIQUE — FOREAS se vend sur le web (Stripe, essai 3 jours), pas
 *    sur les stores. Envoyer un visiteur télécharger l'app le fait arriver sans
 *    compte et sans abonnement : il ouvre une app qui ne le connaît pas. Le
 *    parcours réel est landing → offre → essai → app.
 *
 * 2. DOCTRINE COPY (foreas-copy-atomic §3.14) — un visiteur qui arrive de Google
 *    est à 3-4/10 sur l'échelle du « oui », pas à 9. Un CTA trop direct à ce
 *    stade fait fuir. /tarifs2 est l'étape intermédiaire juste : il y voit le
 *    prix, la mécanique de l'essai et les témoignages avant de sortir sa carte.
 *
 * 3. L'app iOS n'a de toute façon pas d'identifiant App Store utilisable ici —
 *    on ne devine pas un identifiant, et on ne renvoie jamais vers un 404.
 *
 * Le topic est conservé en UTM pour savoir QUELLE landing a converti : sans ça,
 * impossible d'arbitrer quelles pages méritent d'être développées. Les UTM déjà
 * présents dans l'URL d'entrée (campagnes payantes) ne sont jamais écrasés.
 */

// ⚠️ CHANGÉ LE 21/08/2026 — LA LISTE NE VIT PLUS ICI.
//
// Elle portait une consigne d'alignement manuel avec l'autre fichier qui la
// recopiait. Un alignement à la main entre deux fichiers, c'est le piège qui
// s'est déclenché sept fois dans ce dépôt cette semaine.
// Source unique : src/lib/sujets.ts.

export async function GET(
  request: Request,
  { params }: { params: Promise<{ topic: string }> }
) {
  const { topic } = await params
  const incoming = new URL(request.url)
  const target = new URL('/tarifs2', incoming.origin)

  // Report des UTM d'origine (campagnes payantes) — priorité à ce qui existe déjà.
  incoming.searchParams.forEach((v, k) => {
    if (k.startsWith('utm_') || k === 'ref') target.searchParams.set(k, v)
  })

  // ── UN SUJET INCONNU EST UNE ERREUR, ET LE DIT ──────────────────────────
  //
  // AVANT, cette route redirigeait N'IMPORTE QUEL mot vers /tarifs2, avec ce
  // raisonnement écrit : « perdre l'attribution vaut mieux qu'un 404 ».
  //
  // Le raisonnement se retourne. Vérifié en production le 21/08/2026 :
  // /go/nimportequoi et /go/go rendaient EXACTEMENT la même réponse qu'un vrai
  // sujet, à l'attribution près. Donc une faute de frappe dans le bouton d'une
  // landing — /go/aeroprot — continuait de « marcher », et cette page perdait
  // son attribution POUR TOUJOURS sans que rien ne l'annonce.
  //
  // Un lien interne cassé doit se voir. Une attribution perdue en silence, non.
  if (!sujetValide(topic)) {
    console.warn('[go] sujet inconnu : ' + topic + ' — lien interne cassé ou adresse inventée')
    notFound()
  }

  // Attribution de la landing, sans écraser une campagne payante existante.
  if (!target.searchParams.has('utm_source')) target.searchParams.set('utm_source', 'seo')
  if (!target.searchParams.has('utm_medium')) target.searchParams.set('utm_medium', 'landing')
  if (!target.searchParams.has('utm_campaign')) target.searchParams.set('utm_campaign', topic)

  return NextResponse.redirect(target, 307)
}

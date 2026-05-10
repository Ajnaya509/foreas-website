/**
 * /subscribe — Redirect 301 vers /tarifs2
 *
 * Phase A 10/05/2026 (correction 21:45) : la page /subscribe a été retirée car
 * elle dupliquait inutilement /tarifs2 (qui contient déjà tout le mécanisme :
 * trial-bridge lundi 18h Paris DST-aware, Stripe Embedded Checkout, design
 * soigné, FAQ, comparatif).
 *
 * On garde cette route comme alias permanent pour ne pas casser :
 *   - L'app native FOREAS-Clean qui ouvre `foreas.xyz/subscribe?from=app&...`
 *     depuis UpgradeModal Android (cf. PHASE_B_INTEGRATION_MAP.md fil App).
 *   - Les liens externes potentiels (campagnes Meta, partenaires, etc.).
 *   - Les CTAs `authUrls.loginXxx` qui auraient pu pointer dessus.
 *
 * Redirect 308 (permanent) en server-side avec préservation des query params.
 * `from=app&plan=pro&...` arrive intact sur /tarifs2 → la page tarifs peut
 * détecter `from=app` pour adapter le flow si besoin futur.
 */

import { redirect, permanentRedirect } from 'next/navigation'

interface SubscribePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function SubscribePage({ searchParams }: SubscribePageProps) {
  const params = await searchParams
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (typeof v === 'string') qs.set(k, v)
    else if (Array.isArray(v) && v.length > 0) qs.set(k, v[0])
  }
  const target = `/tarifs2${qs.toString() ? `?${qs.toString()}` : ''}`
  // Note : permanentRedirect émet un 308 (preserve method + body) — meilleur que
  // 301 pour les cas où l'app native fait POST avec body. redirect() émet 307.
  permanentRedirect(target)
  // Unreachable but TypeScript needs a return path
  redirect(target)
}

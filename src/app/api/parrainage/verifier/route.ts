import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * FOREAS — « J'AI UN CODE PARRAIN » : EST-IL VALABLE, ET QUE DONNE-T-IL ?
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI CETTE ROUTE EXISTE
 *
 * `/api/checkout` résout déjà la remise d'un code — mais il le fait AU MOMENT DE
 * CRÉER LA SESSION, et ne rend rien au navigateur. Le chauffeur tapait donc un
 * code sans jamais savoir s'il avait été pris en compte. Un code refusé en
 * silence, c'est un chauffeur qui croit avoir sa remise et découvre le prix
 * plein sur son relevé.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ ELLE DIT LA VÉRITÉ SUR L'ANNUEL, ET C'EST LE POINT LE PLUS IMPORTANT
 *
 * Le coupon n'est PAS appliqué à la formule annuelle : `/tarifs2` écrit
 * « L'annuel est au tarif fixe », et le coupon Stripe est `forever` — il
 * coûtait 45 € par abonné et par an. Le 29/08, on a découvert que la métadonnée
 * annonçait quand même la remise : la base disait 224,99 € pendant que Stripe
 * facturait 249,99 €.
 *
 * Cette route ne refera pas cette erreur À L'ÉCRAN. Elle rend DEUX champs
 * distincts :
 *   · `remisePct`       — ce que le code vaut dans l'absolu ;
 *   · `remiseAppliquee` — ce qu'il donne SUR CETTE FORMULE, ici et maintenant.
 * Le second est le seul que l'écran a le droit d'afficher comme une promesse.
 *
 * Et un code valable sur l'annuel n'est pas perdu pour autant : il part quand
 * même en attribution (`client_reference_id`), donc le parrain touche sa
 * commission. C'est l'acheteur qui n'a pas de remise, pas le parrain qui perd
 * son filleul.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ CE QU'ELLE NE DIT PAS
 *
 * Elle ne rend jamais l'identité du parrain, ni son palier, ni rien qui
 * permette de reconstituer l'annuaire des codes. « Valable, tant de pour cent »
 * suffit à l'écran.
 */

/** Forme d'un code : lettres et chiffres, 3 à 24 signes. Rien d'autre n'est lu. */
const FORME_CODE = /^[A-Z0-9]{3,24}$/

/**
 * ⚠️ UN FREIN, PARCE QUE CETTE ROUTE EST UNE PORTE OUVERTE SUR L'ANNUAIRE.
 *
 * Sans lui, on peut essayer des milliers de codes et reconstituer la liste de
 * ceux qui existent — donc savoir qui parraine, et se greffer sur un code qui
 * n'est pas le sien. Vingt essais par heure et par adresse : largement de quoi
 * corriger une faute de frappe, très loin de quoi balayer un annuaire.
 *
 * ⚠️ CETTE MÉMOIRE EST CELLE D'UNE SEULE INSTANCE. Elle est réinitialisée à
 * chaque démarrage, et plusieurs instances ne la partagent pas : le frein
 * ralentit, il ne verrouille pas. Le vrai verrou, c'est que la route ne rend
 * aucune donnée exploitable. Écrit ici pour que personne ne prenne ce frein
 * pour une garantie qu'il n'est pas.
 */
const LIMITE_PAR_HEURE = 20
const essais = new Map<string, { n: number; expire: number }>()

function souslePlafond(empreinte: string): boolean {
  const maintenant = Date.now()
  for (const [k, v] of essais) if (v.expire <= maintenant) essais.delete(k)
  const e = essais.get(empreinte)
  if (!e) {
    essais.set(empreinte, { n: 1, expire: maintenant + 3_600_000 })
    return true
  }
  if (e.n >= LIMITE_PAR_HEURE) return false
  e.n += 1
  return true
}

export async function POST(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const cle =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !cle) {
    console.warn('[parrainage] base non configurée — vérification impossible')
    return NextResponse.json({ error: 'indisponible' }, { status: 503 })
  }

  const corps = await request.json().catch(() => null)
  const code = String((corps as Record<string, unknown>)?.code ?? '')
    .trim()
    .toUpperCase()
    .slice(0, 24)
  /* La formule est LUE, pas devinée : c'est elle qui décide si la remise
     s'applique. Une valeur inconnue est traitée comme « mensuel », le cas où
     la remise existe — jamais l'inverse, qui promettrait une remise à tort. */
  const formule =
    String((corps as Record<string, unknown>)?.formule ?? '') === 'annuel' ? 'annuel' : 'mensuel'

  if (!FORME_CODE.test(code)) {
    return NextResponse.json(
      { valide: false, motif: 'forme' },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  }

  const empreinte =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'inconnue'
  if (!souslePlafond(empreinte)) {
    return NextResponse.json({ error: 'trop_d_essais' }, { status: 429 })
  }

  try {
    const sb = createClient(url, cle, { auth: { persistSession: false } })

    /* Mêmes deux fonctions que `/api/checkout`, dans le MÊME ordre.
       ⚠️ Si cet ordre diverge un jour de celui du checkout, l'écran annoncera
       une remise que la caisse n'appliquera pas. C'est exactement l'écart qui
       a produit la remise fantôme du 29/08. */
    const { data } = await sb.rpc('get_referral_discount_for_code', { p_code: code })
    let pct = typeof data === 'number' ? data : 0
    if (pct === 0) {
      const { data: partenaire } = await sb.rpc('get_partner_discount_for_code', { p_code: code })
      pct = typeof partenaire === 'number' ? partenaire : 0
    }

    if (pct <= 0) {
      return NextResponse.json(
        { valide: false, motif: 'inconnu' },
        { headers: { 'Cache-Control': 'no-store' } },
      )
    }

    return NextResponse.json(
      {
        valide: true,
        remisePct: pct,
        /* La seule valeur que l'écran a le droit de présenter comme une promesse. */
        remiseAppliquee: formule === 'annuel' ? 0 : pct,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (e) {
    /* ⚠️ ON NE FAIT PAS SEMBLANT QUE LE CODE EST FAUX. Une base injoignable
       n'est pas un code invalide : dire « code inconnu » enverrait le chauffeur
       corriger une faute de frappe qui n'existe pas. On dit « réessaie ». */
    console.error('[parrainage] vérification impossible :', (e as Error)?.message)
    return NextResponse.json({ error: 'indisponible' }, { status: 503 })
  }
}

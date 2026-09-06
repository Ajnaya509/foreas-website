import { NextRequest, NextResponse } from 'next/server'
import { isSameOriginRequest, forbiddenOrigin } from '@/lib/api-guard'
import { clientServeurOuNull } from '@/lib/supabaseServeur'
import { resolveSiteIdentity } from '@/lib/identityGate'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/site/passage-whatsapp
 *
 * Émet un BILLET DE PASSAGE pour le téléphone de `/mobile`, et rend son code
 * court. Le chauffeur clique « Poser ma question sur WhatsApp » ; le code part
 * dans le message ; le pont WhatsApp le lit et Ajnaya reprend là où il en
 * était, sans qu'il redise un mot.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ POURQUOI UNE ROUTE À PART, ET PAS `/api/app/issue-handoff`
 *
 * Cette route-là exige désormais un NUMÉRO et une cérémonie de vérification
 * (Twilio) : c'est ce qui a fermé, le 23/08, l'attaque « j'inscris le numéro
 * d'une victime et j'attends ». Sans numéro, elle ne rend qu'un lien nu.
 * Le téléphone du site n'a pas de numéro et n'en demandera pas : le chauffeur
 * découvre le produit. On lui délivre donc un billet SANS aucun pouvoir.
 *
 * ⚠️ CE QUE CE BILLET NE PEUT PAS FAIRE — c'est le cœur de l'affaire
 *
 * Le site avait RETIRÉ toute référence visible du message le 31/08, pour une
 * raison écrite dans `wa/route.ts` : « le chauffeur pourrait l'effacer ou le
 * recopier ». La deuxième moitié est la vraie : un code dans un texte se
 * recopie. Ce qui a changé depuis, et qui rend l'objection sans effet ici :
 *
 *  · le billet naît `UNBOUND` — né dans un navigateur, il n'ouvre AUCUNE
 *    mémoire privée, jamais. C'est la règle posée le 23/08, elle tient ;
 *  · il ne contient QUE ce que le chauffeur vient d'écrire sur le téléphone.
 *    Recopier le code d'un autre ne donne donc rien d'autre que trois phrases
 *    sur une zone — pas un compte, pas un numéro, pas un euro ;
 *  · il vit 48 heures et se consomme UNE fois (`used_at`, posé par le pont) ;
 *  · six signes tirés au sort dans un alphabet sans 0/O/1/I/L : on ne le
 *    devine pas, et on ne le confond pas non plus en le relisant.
 *
 * L'autre moitié de l'objection — « il peut l'effacer » — reste vraie, et elle
 * ne coûte rien : sans code, la conversation démarre normalement. C'est le
 * comportement d'aujourd'hui.
 *
 * ⚠️ SANS IDENTITÉ, PAS DE BILLET. On ne fabrique pas une fiche pour délivrer
 * un passage : le téléphone retombe alors sur son lien simple, comme avant.
 */

/**
 * ⚠️ LES VALEURS ACCEPTÉES PAR LA BASE NE SONT PAS CELLES DU DÉPÔT.
 *
 * Premier essai en production : `23514` — une contrainte a refusé. Le dépôt ne
 * dit pas laquelle : ce projet a déjà mesuré 12 contraintes déclarées pour 18
 * vivantes. Et la base appartient au fil Pieuvre : je n'y touche pas.
 *
 * On essaie donc les couples du plus VRAI au plus SÛR, et on s'arrête au
 * premier accepté. `widget` et `jeton_app` sont les seules valeurs dont on
 * sache qu'elles passent — `/api/app/issue-handoff` les écrit depuis des mois.
 *
 * Le couple retenu est journalisé : le jour où le fil Pieuvre nous donne la
 * liste, on fige la bonne paire et cette boucle disparaît.
 */
const COUPLES: Array<{ source_canal: string; claim_method: string }> = [
  { source_canal: 'site_mobile', claim_method: 'code_court_site' },
  { source_canal: 'widget', claim_method: 'code_court_site' },
  { source_canal: 'widget', claim_method: 'code_court' },
  { source_canal: 'widget', claim_method: 'jeton_app' },
]

/** Sans 0/O/1/I/L : ces cinq-là se confondent quand on relit un code à l'œil. */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
const HEURES_DE_VIE = 48

function codeCourt(): string {
  const octets = new Uint8Array(6)
  crypto.getRandomValues(octets)
  return Array.from(octets, (o) => ALPHABET[o % ALPHABET.length]).join('')
}

type Echange = { role: string; text: string }

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return forbiddenOrigin()

  let corps: Record<string, unknown>
  try {
    corps = await request.json()
  } catch {
    return NextResponse.json({ ok: false, raison: 'corps_illisible' }, { status: 400 })
  }

  const identityId = await resolveSiteIdentity(request, {
    canal: 'site',
    visitor_id: typeof corps.visitor_id === 'string' ? corps.visitor_id : null,
    claimed_identity_id: typeof corps.identity_id === 'string' ? corps.identity_id : null,
  })
  // Pas d'identité résolue = pas de billet, et surtout pas de fiche fabriquée
  // pour l'occasion. Le téléphone a son lien simple, il reste bon.
  if (!identityId) return NextResponse.json({ ok: false, raison: 'identite_absente' }, { status: 200 })

  const sb = clientServeurOuNull()
  if (!sb) return NextResponse.json({ ok: false, raison: 'base_absente' }, { status: 200 })

  /* Ses mots à lui, bornés : huit échanges, 400 signes chacun. Un billet n'est
     pas un journal — il porte de quoi reprendre, rien de plus. */
  const derniers: Echange[] = Array.isArray(corps.last_messages)
    ? (corps.last_messages as Array<{ role?: unknown; text?: unknown }>)
        .filter((m) => typeof m?.text === 'string' && (m.text as string).trim())
        .slice(-8)
        .map((m) => ({
          role: m.role === 'ajnaya' ? 'ajnaya' : 'user',
          text: (m.text as string).trim().slice(0, 400),
        }))
    : []
  const question =
    typeof corps.question_chauffeur === 'string' ? corps.question_chauffeur.trim().slice(0, 400) : ''

  /* L'index d'unicité porte sur les billets VIVANTS (fil Pieuvre, 23/08) : une
     collision est donc possible et attendue. Trois essais, puis on renonce —
     le téléphone garde son lien simple, personne ne voit d'erreur. */
  let dernierCode: string | undefined
  for (const couple of COUPLES) {
   for (let essai = 0; essai < 3; essai++) {
    const short_code = codeCourt()
    const { error } = await sb.from('handoff_tokens').insert({
      identity_id: identityId,
      source_canal: couple.source_canal,
      target_canal: 'whatsapp',
      state: {
        last_messages: derniers,
        ...(question ? { question_chauffeur: question } : {}),
        intent: 'telephone_mobile_continue',
        url_pre_landing: '/mobile',
      },
      short_code,
      // Né dans un navigateur : il n'ouvre aucune mémoire privée. Jamais.
      lien_etat: 'UNBOUND',
      claim_method: couple.claim_method,
      expires_at: new Date(Date.now() + HEURES_DE_VIE * 3600_000).toISOString(),
    })
    if (!error) {
      console.info('[passage-whatsapp] couple accepté :', couple.source_canal, couple.claim_method)
      return NextResponse.json(
        { ok: true, short_code, couple: `${couple.source_canal}/${couple.claim_method}` },
        { headers: { 'Cache-Control': 'no-store' } },
      )
    }
    dernierCode = error.code ?? 'inconnu'
    // 23505 = l'unicité a parlé : on retire un autre code. Toute autre erreur
    // est définitive, on n'insiste pas.
    // 23505 = collision de code : on retire. 23514 = valeur refusée : ce couple
    // est mort, on passe au suivant. Toute autre erreur est définitive.
    if (error.code === '23514') break
    if (error.code !== '23505') {
      console.warn('[passage-whatsapp] insertion refusée :', error.code, error.message)
      /* ⚠️ LE CODE D'ERREUR SORT D'ICI, ET C'EST VOULU. Un refus muet de la
         base est indiscernable d'une absence de clic : c'est exactement la
         famille de pannes que ce projet paie le plus cher. Le code Postgres
         (`23514` contrainte, `42703` colonne absente…) ne dit rien de
         personnel et permet de réparer sans deviner. Le message, lui, ne sort
         pas : il peut citer une valeur. */
      return NextResponse.json(
        { ok: false, raison: 'refus_base', code: error.code ?? 'inconnu' },
        { status: 200 },
      )
    }
   }
  }

  return NextResponse.json(
    { ok: false, raison: 'billet_indisponible', code: dernierCode ?? 'inconnu' },
    { status: 200 },
  )
}

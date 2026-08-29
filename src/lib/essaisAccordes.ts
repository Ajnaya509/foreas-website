import { createHash } from 'node:crypto'
import { clientServeurOuNull } from '@/lib/supabaseServeur'

/**
 * FOREAS — UN ESSAI GRATUIT PAR PERSONNE, PAS PAR ADRESSE E-MAIL.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LE TROU QU'ON BOUCHE
 *
 * `src/app/api/checkout/route.ts` pose `trial_end` à CHAQUE session, sans jamais
 * regarder l'historique, et aucun client Stripe n'est réutilisé. N'importe qui
 * peut donc enchaîner les essais gratuits à l'infini — sans même changer
 * d'adresse. Chandler : « je connais les chauffeurs VTC, ils vont tout faire
 * pour user le cumul ».
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ POURQUOI LE CONTRÔLE N'EST PAS À LA CRÉATION DE SESSION
 *
 * Parce qu'À CE MOMENT-LÀ ON NE SAIT RIEN. En `ui_mode: 'custom'`, l'e-mail est
 * posé plus tard par `updateEmail()`, le téléphone par
 * `/api/checkout/coordonnees`, et la carte n'existe pas encore. Le seul signal
 * disponible est le cookie de visite — celui qu'un onglet privé efface.
 *
 * Le contrôle vit donc dans le WEBHOOK, sur `checkout.session.completed`, où
 * l'on connaît enfin l'e-mail, le téléphone ET l'empreinte de carte.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ LA SANCTION N'EST PAS LE REFUS DE L'ABONNEMENT
 *
 * On met fin à l'ESSAI (paiement immédiat), on ne casse pas la vente. Refuser
 * l'abonnement transformerait un fraudeur en client perdu ; lui faire payer
 * tout de suite en fait un client payant. C'est la règle posée par Chandler.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ CE QUE CE GARDE N'ATTRAPE PAS, ET IL FAUT LE SAVOIR
 *
 * · La PREMIÈRE tentative passe toujours — l'empreinte de carte n'existe pas
 *   avant. C'est structurel, pas un oubli.
 * · Deux chauffeurs qui partagent une carte (un patron de flotte qui abonne
 *   plusieurs conducteurs) seront traités comme un cumul : le second paiera
 *   immédiatement au lieu d'avoir trois jours d'essai. Il garde son abonnement.
 *   Le jour où ce cas devient réel, c'est ici qu'il faudra une exception.
 * · Une carte neuve + un e-mail neuf + un téléphone neuf + un onglet privé
 *   passent. Aucune empreinte ne bat quelqu'un qui change vraiment tout.
 */

/** Les quatre natures de signal. Le contrôle est écrit en base (`check`). */
export type TypeSignal = 'carte' | 'email' | 'telephone' | 'visiteur'

export type Signal = { type: TypeSignal; empreinte: string }

/**
 * sha256 hexadécimal. Pas de sel secret, volontairement : un sel qui change ou
 * disparaît rendrait toutes les lignes passées invisibles — et le trou se
 * rouvrirait EN SILENCE, sans une erreur. Un déterminisme sans configuration
 * vaut mieux ici que la protection marginale qu'un sel apporterait, d'autant
 * que `subscribers` garde déjà l'e-mail et le téléphone en clair juste à côté.
 */
function empreinte(valeur: string): string {
  return createHash('sha256').update(valeur, 'utf8').digest('hex')
}

/**
 * Normalise une adresse e-mail avant de l'empreindre.
 *
 * ⚠️ SANS CETTE FONCTION, LE GARDE NE SERT À RIEN. « moi+1@gmail.com » et
 * « m.o.i@gmail.com » sont LA MÊME BOÎTE que « moi@gmail.com ». C'est la
 * première chose que quelqu'un essaie, et Chandler a justement rencontré cette
 * forme le 28/08.
 *
 * Deux règles, et pas une de plus :
 *  · le « + » et ce qui suit : ignorés par Gmail, Outlook, Proton, Fastmail…
 *    on coupe partout, le risque de faux positif est nul (personne ne possède
 *    « a+b@x » sans posséder « a@x ») ;
 *  · les points : ignorés PAR GMAIL SEULEMENT. Les retirer ailleurs
 *    fusionnerait des adresses réellement distinctes — « jean.dupont@free.fr »
 *    et « jeandupont@free.fr » peuvent appartenir à deux personnes.
 */
export function normaliserEmail(brut: string): string | null {
  const t = brut.trim().toLowerCase()
  const at = t.lastIndexOf('@')
  if (at <= 0 || at === t.length - 1) return null
  let local = t.slice(0, at)
  const domaine = t.slice(at + 1)

  const plus = local.indexOf('+')
  /* ⚠️ `>= 0` ET NON `> 0`. Avec `> 0`, « +truc@gmail.com » repassait entier et
     comptait pour une adresse distincte à chaque variante. Ici la partie locale
     devient vide et la fonction rend `null` : un signal absent vaut mieux qu'un
     signal faux — et une adresse commençant par « + » ne reçoit rien de toute
     façon, donc son porteur n'aurait jamais ses identifiants. */
  if (plus >= 0) local = local.slice(0, plus)
  if (domaine === 'gmail.com' || domaine === 'googlemail.com') {
    local = local.replace(/\./g, '')
  }
  return local ? `${local}@${domaine}` : null
}

/**
 * Normalise un numéro : les chiffres seuls, puis les 9 derniers.
 *
 * Pourquoi 9 : « +33 6 12 34 56 78 », « 06 12 34 56 78 » et « 0033612345678 »
 * sont le même téléphone. Les 9 derniers chiffres (612345678) sont la partie
 * commune. En dessous de 6 chiffres, ce n'est plus un numéro — on ne compte
 * pas le signal plutôt que d'en inventer un.
 */
export function normaliserTelephone(brut: string): string | null {
  const chiffres = brut.replace(/\D/g, '')
  if (chiffres.length < 6) return null
  return chiffres.slice(-9)
}

/** Rassemble les signaux exploitables. Ce qui manque est simplement absent. */
export function construireSignaux(source: {
  empreinteCarte?: string | null
  email?: string | null
  telephone?: string | null
  visiteur?: string | null
}): Signal[] {
  const signaux: Signal[] = []
  if (source.empreinteCarte) signaux.push({ type: 'carte', empreinte: empreinte(source.empreinteCarte) })
  const mail = source.email ? normaliserEmail(source.email) : null
  if (mail) signaux.push({ type: 'email', empreinte: empreinte(mail) })
  const tel = source.telephone ? normaliserTelephone(source.telephone) : null
  if (tel) signaux.push({ type: 'telephone', empreinte: empreinte(tel) })
  if (source.visiteur) signaux.push({ type: 'visiteur', empreinte: empreinte(source.visiteur) })
  return signaux
}

export type Verdict =
  | { cumul: false; motif: 'aucun_precedent' | 'base_injoignable' | 'aucun_signal' }
  | { cumul: true; signal: TypeSignal; abonnementPrecedent: string }

/**
 * Ce chauffeur a-t-il DÉJÀ consommé un essai ?
 *
 * ⚠️ ON EXCLUT L'ABONNEMENT EN COURS. Stripe rejoue ses événements ; sans cette
 * exclusion, le deuxième passage sur le MÊME abonnement se prendrait pour un
 * cumul et couperait l'essai d'un chauffeur parfaitement honnête.
 *
 * ⚠️ BASE INJOIGNABLE = ON LAISSE PASSER, ET ON LE DIT FORT. Couper l'essai de
 * quelqu'un parce qu'une base ne répond pas serait punir un innocent pour une
 * panne de notre côté. On préfère perdre un essai frauduleux qu'encaisser de
 * force chez un client de bonne foi — mais le journal doit hurler, sinon la
 * panne devient un trou permanent que personne ne voit.
 */
export async function verifierCumulEssai(
  signaux: Signal[],
  abonnementActuel: string,
): Promise<Verdict> {
  if (signaux.length === 0) return { cumul: false, motif: 'aucun_signal' }

  const sb = clientServeurOuNull()
  if (!sb) {
    console.error(
      '[essais] ⛔ base injoignable — contrôle du cumul NON EXÉCUTÉ. ' +
        "Ce n'est pas un succès : l'essai est accordé sans vérification.",
    )
    return { cumul: false, motif: 'base_injoignable' }
  }

  const { data, error } = await sb
    .from('essais_accordes')
    .select('type_signal, empreinte, abonnement')
    .in('empreinte', signaux.map((s) => s.empreinte))
    .neq('abonnement', abonnementActuel)

  if (error) {
    console.error(
      `[essais] ⛔ lecture impossible (${error.code} ${error.message}) — ` +
        "contrôle du cumul NON EXÉCUTÉ. L'essai est accordé sans vérification.",
    )
    return { cumul: false, motif: 'base_injoignable' }
  }

  /* On ne se contente pas de « une ligne existe » : on vérifie que l'empreinte
     trouvée correspond bien au MÊME type de signal. Deux natures différentes ne
     produiront jamais la même empreinte en pratique, mais s'appuyer là-dessus
     serait un raisonnement, pas une vérification. */
  for (const s of signaux) {
    const trouve = (data || []).find((l) => l.empreinte === s.empreinte && l.type_signal === s.type)
    if (trouve) {
      return { cumul: true, signal: s.type, abonnementPrecedent: String(trouve.abonnement) }
    }
  }
  return { cumul: false, motif: 'aucun_precedent' }
}

/**
 * Enregistre les signaux de cet essai, pour que le PROCHAIN soit reconnu.
 *
 * `on conflict do nothing` : si un signal appartient déjà à quelqu'un, on ne le
 * vole pas. Le premier qui a consommé l'essai le garde — c'est lui, le
 * légitime propriétaire de l'empreinte.
 */
export async function enregistrerEssai(signaux: Signal[], abonnement: string): Promise<void> {
  if (signaux.length === 0) return
  const sb = clientServeurOuNull()
  if (!sb) {
    console.error(
      `[essais] ⛔ base injoignable — les signaux de ${abonnement} NE SONT PAS enregistrés. ` +
        'Ce chauffeur pourra reprendre un essai gratuit.',
    )
    return
  }
  const { error } = await sb
    .from('essais_accordes')
    .upsert(
      signaux.map((s) => ({ type_signal: s.type, empreinte: s.empreinte, abonnement })),
      { onConflict: 'type_signal,empreinte', ignoreDuplicates: true },
    )
  if (error) {
    console.error(
      `[essais] ⛔ écriture impossible pour ${abonnement} (${error.code} ${error.message}) — ` +
        'ce chauffeur pourra reprendre un essai gratuit.',
    )
  }
}

import crypto from 'crypto'
import { clientServeurOuNull } from '@/lib/supabaseServeur'
/**
 * PLAFOND D'APPELS SUR LES ROUTES AJNAYA — 03/09/2026.
 *
 * ⚠️ CE QU'ON FERME, MESURÉ AVANT LE LANCEMENT DES PUBLICITÉS.
 * Les trois portes d'Ajnaya sur le site (`/api/ajnaya/chat`,
 * `/api/ajnaya/chat/stream`, `/api/ajnaya/home-modal`) n'avaient qu'un seul
 * garde : la même origine. Or ce garde ne compte rien. Chaque message part
 * vers `claude-opus-5` et a coûté, MESURÉ dans `pieuvre_analytics_events`
 * (event_name='ajnaya_respond', canal_source='widget_site'), entre 0,0064 et
 * 0,0616 USD la réponse. Sous publicité, une boucle ou un curieux qui rejoue
 * la même requête n'a aucun plafond en face de lui.
 *
 * Deux routes du site avaient DÉJÀ ce motif (`/api/contact`,
 * `/api/parrainage/verifier`). Il manquait exactement là où ça coûte le plus.
 *
 * ⚠️ CE QUE CE PLAFOND N'EST PAS. Il compte par processus, en mémoire. Sur
 * plusieurs instances Vercel, chaque instance a son compteur : le plafond réel
 * est donc PLUS HAUT que le plafond écrit, et il repart à zéro à chaque
 * démarrage à froid. C'est assumé et c'est le but : arrêter une boucle et une
 * facture qui s'emballe, pas un attaquant motivé. Ne jamais présenter ce
 * fichier comme une protection anti-abus.
 *
 * ⚠️ L'EMPREINTE N'EST JAMAIS ÉCRITE. Elle vit le temps de la fenêtre, en
 * mémoire, et n'est ni journalisée ni stockée.
 */

/**
 * ⚠️ UN SEUL SEAU POUR LES TROIS PORTES — corrigé après relecture adverse.
 *
 * Première version : un compteur par porte (suffixes `stream`, `chat`,
 * `home-modal`). Mesuré comme une FUITE, pas comme une protection : quand le
 * flux du téléphone refuse, le navigateur rejoue automatiquement la question
 * sur `/api/ajnaya/chat` (`ajnayaStream.ts:76` lève sur `!res.ok`, quel que
 * soit le code — 429 compris —, et `AjnayaWidget.tsx:583` bascule). Le plafond
 * de 10 en valait donc 20, tous payés.
 *
 * Les appelants passent maintenant tous le suffixe `ajnaya` : le budget suit
 * le VISITEUR, jamais la porte.
 */
const compteurs = new Map<string, { n: number; expire: number }>()

/** Fenêtre glissante grossière : 10 messages par quart d'heure et par visiteur. */
export const PLAFOND_AJNAYA_PAR_FENETRE = 10
export const FENETRE_AJNAYA_MS = 15 * 60 * 1000

export interface VerdictPlafond {
  autorise: boolean
  /** Secondes avant que la fenêtre se rouvre. Sert l'en-tête `Retry-After`. */
  attendreSecondes: number
}

/**
 * Empreinte grossière du demandeur. L'adresse sert le temps de l'appel et
 * n'est conservée nulle part.
 */
export function empreinteDemandeur(request: Request, suffixe = ''): string {
  const fwd = request.headers.get('x-forwarded-for') || ''
  const ip = fwd.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'inconnu'
  return ip + '|' + suffixe
}

export function sousPlafondAjnaya(
  empreinte: string,
  max = PLAFOND_AJNAYA_PAR_FENETRE,
  fenetreMs = FENETRE_AJNAYA_MS,
): VerdictPlafond {
  const maintenant = Date.now()
  // Ménage : sans ça, la carte grossit indéfiniment sur une instance longue.
  for (const [k, v] of compteurs) if (v.expire <= maintenant) compteurs.delete(k)

  const e = compteurs.get(empreinte)
  if (!e) {
    compteurs.set(empreinte, { n: 1, expire: maintenant + fenetreMs })
    return { autorise: true, attendreSecondes: 0 }
  }
  if (e.n >= max) {
    return { autorise: false, attendreSecondes: Math.max(1, Math.ceil((e.expire - maintenant) / 1000)) }
  }
  e.n += 1
  return { autorise: true, attendreSecondes: 0 }
}

/** Remise à zéro — réservée aux tests. */
export function _viderPlafondAjnaya(): void {
  compteurs.clear()
}

/**
 * LE SEUL PLAFOND QUI COMPTE VRAIMENT — 03/09/2026.
 *
 * ⚠️ POURQUOI LE COMPTEUR EN MÉMOIRE NE SUFFIT PAS, MESURÉ.
 * Chaque route est une fonction séparée, avec son propre processus. Test de
 * bout en bout sur le serveur local :
 *   /api/ajnaya/home-modal  : 10 appels passent, puis 429, 429   (le plafond agit)
 *   /api/ajnaya/chat/stream : le MÊME visiteur juste après       → 200 (repart à zéro)
 * Et le navigateur rejoue tout seul sur une autre porte quand la première
 * refuse (`ajnayaStream.ts:76` lève sur `!res.ok`, 429 compris ;
 * `AjnayaWidget.tsx:583` bascule). Le plafond de 10 en valait donc 30, payés.
 * En production, il faut ajouter les instances : chacune repart à zéro, et un
 * démarrage à froid efface le compteur.
 *
 * Le seau partagé vit donc en base (`plafond_ajnaya_consommer`), en UNE seule
 * écriture atomique — un « lire puis écrire » laisserait deux appels simultanés
 * passer ensemble.
 *
 * ⚠️ L'ORDRE EST VOLONTAIRE, ET C'EST LE PIÈGE QU'IL ÉVITE.
 * Le jeton LOCAL est consommé D'ABORD, avant tout appel réseau. Si la base est
 * lente ou injoignable, le verdict local reste rendu : une panne distante ne
 * peut pas SUPPRIMER une protection qui se calcule ici. Et un refus, local ou
 * partagé, refuse.
 *
 * ⚠️ AUCUNE ADRESSE NE PART EN BASE : seul un haché est envoyé.
 */
export async function sousPlafondAjnayaPartage(
  empreinte: string,
  max = PLAFOND_AJNAYA_PAR_FENETRE,
  fenetreMs = FENETRE_AJNAYA_MS,
): Promise<VerdictPlafond> {
  const local = sousPlafondAjnaya(empreinte, max, fenetreMs)
  if (!local.autorise) return local

  try {
    const sb = clientServeurOuNull()
    if (!sb) {
      // Se DIT : sans client serveur, il ne reste que le compteur d'instance.
      console.warn('[plafond-ajnaya] seau partagé indisponible — compteur local seul')
      return local
    }
    const hache = crypto.createHash('sha256').update(empreinte).digest('hex')
    const { data, error } = await sb.rpc('plafond_ajnaya_consommer', {
      p_empreinte: hache,
      p_max: max,
      p_fenetre_secondes: Math.round(fenetreMs / 1000),
    })
    if (error) {
      console.warn('[plafond-ajnaya] seau partagé muet :', error.code, error.message)
      return local
    }
    const ligne = Array.isArray(data) ? data[0] : data
    if (!ligne || typeof ligne.autorise !== 'boolean') {
      console.warn('[plafond-ajnaya] réponse du seau partagé illisible')
      return local
    }
    if (ligne.autorise === false) {
      return { autorise: false, attendreSecondes: Number(ligne.attendre_secondes) || 60 }
    }
    return local
  } catch (e) {
    console.warn('[plafond-ajnaya] seau partagé inatteignable :', (e as Error).message)
    return local
  }
}

import Anthropic from '@anthropic-ai/sdk'
import { clientServeurOuNull } from '@/lib/supabaseServeur'

/**
 * LE FILET DE LA PORTE TÉLÉPHONE — 03/09/2026.
 *
 * ⚠️ LE TROU QU'ON BOUCHE, MESURÉ.
 * Le site a trois portes vers Ajnaya. Deux avaient un filet quand la Pieuvre
 * ne répond pas (`/api/ajnaya/chat` et `/api/ajnaya/home-modal` retombent sur
 * Haiku). La troisième — `/api/ajnaya/chat/stream`, celle du TÉLÉPHONE —
 * n'avait rien : elle renvoyait une erreur, et l'écran affichait « Petit souci
 * de connexion — écris-moi sur WhatsApp ».
 *
 * Or c'est la porte qui va recevoir les publicités : elles arrivent sur
 * téléphone. Et l'attente mesurée sur `pieuvre_analytics_events` monte à
 * 11 132 ms alors que le site coupe à 10 000 ms — une réponse sur sept déjà
 * enregistrée dépassait la limite. Le cerveau avait répondu, la base avait
 * gardé la réponse, et la personne ne voyait rien.
 *
 * ⚠️ CE QUI EXISTAIT DÉJÀ, ET QU'IL NE FAUT PAS CONFONDRE.
 * `src/lib/ajnayaStream.ts:71` annonce « → repli /chat ». Ce repli existe bel
 * et bien — mais **côté navigateur, et seulement dans le widget** :
 * `AjnayaWidget.tsx:578` lève `needBlockFallback`, `:587-604` rejoue la
 * question sur `/api/ajnaya/chat`. `LivePhone.tsx`, l'écran du téléphone, ne
 * fait rien de tel : il affiche « Petit souci de connexion ».
 * Ce fichier-ci est un repli **côté serveur**, qui vaut pour les deux.
 *
 * ⚠️ CE FILET N'EST PAS LE CERVEAU. Il tient la conversation le temps d'une
 * panne, avec un modèle plus petit et sans mémoire longue. Il ne remplace
 * jamais la Pieuvre : il évite qu'un chauffeur venu d'une publicité payée
 * tombe sur un mur.
 */

const PREFERENCE_SCRIPT_WIDGET = ['Ajnaya Site Closer V2', 'Ajnaya Site Closer V1']

/**
 * Voix de DERNIER RECOURS, utilisée seulement si le script du site est
 * illisible. Elle tutoie : le site s'adresse à des chauffeurs. (Le vouvoiement
 * est réservé au widget conciergerie, côté clients.)
 *
 * ⚠️ CE N'EST PAS LA VOIX QUI SORTIRA D'HABITUDE. Le chemin normal lit
 * `Ajnaya Site Closer V2` dans `pieuvre_scripts` — et ce script, vérifié le
 * 03/09, mélange tutoiement et vouvoiement. Ce texte-ci ne corrige pas ce
 * mélange : il ne fait que garantir un tutoiement quand la base est muette.
 * Le nettoyage du script lui-même reste à faire.
 */
const VOIX_DE_SECOURS = [
  // ⚠️ Le garde de vérité du site interdit le mot « IA » : Ajnaya a un nom,
  // on l'emploie. Règle inter-fils, vérifiée à chaque fabrication du site.
  'Tu es Ajnaya. Tu travailles avec FOREAS et tu parles à un chauffeur VTC français.',
  'Tu le tutoies, toujours. Phrases courtes. Zéro jargon. Jamais de promesse chiffrée que tu ne peux pas prouver.',
  'Tu réponds en 2 phrases maximum, puis tu poses UNE question simple pour faire avancer la discussion.',
  'Si tu ne sais pas, tu le dis et tu proposes de reprendre la discussion sur WhatsApp.',
].join('\n')

let scriptEnCache: { texte: string; expire: number } | null = null

async function voixDuSite(): Promise<string> {
  const maintenant = Date.now()
  if (scriptEnCache && scriptEnCache.expire > maintenant) return scriptEnCache.texte
  try {
    const sb = clientServeurOuNull()
    if (!sb) return VOIX_DE_SECOURS
    const { data, error } = await sb
      .from('pieuvre_scripts')
      .select('script_name, prompt_system')
      .eq('tentacle', 'widget_site')
      .eq('is_active', true)
    // ⚠️ Une lecture qui échoue se DIT. Un catch muet ferait passer une panne
    // de base pour « pas de script », et la voix changerait sans que personne
    // ne le sache.
    if (error) {
      console.warn('[repli-ajnaya] lecture pieuvre_scripts impossible :', error.code, error.message)
      return VOIX_DE_SECOURS
    }
    for (const nom of PREFERENCE_SCRIPT_WIDGET) {
      const trouve = data?.find((d) => d.script_name === nom)
      if (trouve?.prompt_system) {
        scriptEnCache = { texte: trouve.prompt_system, expire: maintenant + 600_000 }
        return trouve.prompt_system
      }
    }
    return VOIX_DE_SECOURS
  } catch (e) {
    console.warn('[repli-ajnaya] voix du site indisponible :', (e as Error).message)
    return VOIX_DE_SECOURS
  }
}

export interface ReponseDeRepli {
  texte: string
  modele: string
}

/**
 * Rend une réponse de secours, ou `null` si même le secours est impossible.
 * Ne lance jamais : l'appelant est déjà dans une panne.
 */
export async function repondreEnSecours(
  messageUtilisateur: string,
  historique: Array<{ role: string; text: string }> = [],
): Promise<ReponseDeRepli | null> {
  const cle = process.env.FOREAS_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY
  if (!cle || cle === 'à_remplir_par_le_user') {
    // ⚠️ On ne fabrique PAS une phrase d'Ajnaya sans modèle. Une fausse réponse
    // écrite en dur serait indiscernable d'une vraie, et mentirait au chauffeur.
    console.error('[repli-ajnaya] aucune clé Anthropic : pas de filet possible')
    return null
  }
  const modele = 'claude-haiku-4-5-20251001'
  try {
    const systeme = await voixDuSite()
    const anthropic = new Anthropic({ apiKey: cle })
    const messages = [
      ...historique.slice(-6).map((m) => ({
        role: (m.role === 'assistant' || m.role === 'ajnaya' ? 'assistant' : 'user') as 'assistant' | 'user',
        content: m.text,
      })),
      { role: 'user' as const, content: messageUtilisateur },
    ]
    // Le premier message doit venir de l'utilisateur : sinon l'API refuse.
    while (messages.length > 1 && messages[0].role === 'assistant') messages.shift()

    const reponse = await anthropic.messages.create({
      model: modele,
      max_tokens: 300,
      temperature: 0.7,
      system: systeme,
      messages,
    })
    const texte = reponse.content[0]?.type === 'text' ? reponse.content[0].text.trim() : ''
    if (!texte) {
      console.error('[repli-ajnaya] le modèle de secours a rendu un texte vide')
      return null
    }
    return { texte, modele }
  } catch (e) {
    console.error('[repli-ajnaya] le filet a cédé :', (e as Error).message)
    return null
  }
}

/**
 * LA TRACE DU SECOURS — sans elle, le filet fausse toutes les mesures.
 *
 * ⚠️ POURQUOI ELLE EXISTE. La porte du téléphone n'écrit rien en base : c'est
 * la Pieuvre, côté n8n, qui enregistre les conversations, la mémoire de canal
 * et la mesure. Donc quand le secours répond À SA PLACE, il ne restait
 * AUCUNE ligne nulle part. Après les publicités, le nombre de conversations
 * comptées aurait été inférieur au réel, sans moyen de savoir de combien.
 *
 * ⚠️ ET UN MODÈLE NE SUFFIT PAS À DISTINGUER. `claude-haiku-4-5-20251001`
 * apparaît déjà 71 fois en sortie sur `widget_site` dans
 * `pieuvre_conversations`, sans aucun marqueur. Lire le nom du modèle ne dirait
 * donc pas si c'est un secours. Cette ligne-ci le dit explicitement.
 *
 * Elle ne bloque jamais la réponse : une mesure ratée ne doit pas coûter une
 * conversation. Mais elle se PLAINT dans les journaux — une trace perdue en
 * silence est exactement ce qu'on cherche à éviter ici.
 */
export async function tracerLeSecours(
  identityId: string | null,
  sessionId: string,
  modele: string,
  raison: string,
): Promise<void> {
  try {
    const sb = clientServeurOuNull()
    if (!sb) {
      console.warn('[repli-ajnaya] trace impossible : pas de client serveur')
      return
    }
    const { error } = await sb.from('pieuvre_analytics_events').insert({
      event_name: 'ajnaya_repli_secours',
      canal_source: 'widget_site',
      identity_id: identityId,
      source: 'site',
      ts: Date.now(),
      meta: { session_id: sessionId, llm_model: modele, raison, en_secours: true },
    })
    if (error) console.warn('[repli-ajnaya] trace refusée :', error.code, error.message)
  } catch (e) {
    console.warn('[repli-ajnaya] trace impossible :', (e as Error).message)
  }
}

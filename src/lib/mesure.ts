/**
 * FOREAS — LA MESURE. UN SEUL MODULE, POUR TOUTES LES PAGES COMMERCIALES.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI CE FICHIER EXISTE
 *
 * Mesuré le 21/08/2026 : **un seul appel de mesure dans tout `src/`**
 * (`tarifs2/page.tsx:320`). Aucune des dix-huit pages principales n'avait de
 * compteur de vue ni de clic.
 *
 * Conséquence, et elle est dure : à la question « quelle page a produit quel
 * essai puis quel abonnement ? », la réponse n'était pas « on ne sait pas
 * encore » mais **« on ne pourra jamais savoir »**. Et donc : toute décision de
 * fusionner ou de supprimer une page était un pari, puisque rien ne dirait si la
 * conversion avait monté ou baissé après.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUE CE MODULE PROMET, ET CE QU'IL NE PROMET PAS
 *
 * Il promet : chaque événement porte la page canonique, l'intention, la promesse
 * exacte affichée, la source et la campagne. C'est ce qui permet de relier un
 * abonnement à la phrase qui l'a déclenché.
 *
 * Il ne promet PAS de remonter chez Meta ou TikTok : leurs identifiants ne sont
 * pas configurés (`meta_conversions` → 0 ligne). Tant que c'est le cas, l'état
 * extérieur reste **TRACKING_BLOCKED**, et ce module le dit au lieu de le taire.
 *
 * ⚠️ RÈGLES QUI NE SE NÉGOCIENT PAS
 *  · aucune donnée personnelle en clair — jamais de téléphone, d'e-mail, de nom ;
 *  · aucun achat déduit d'une page de remerciement : `SubscriptionConfirmed`
 *    n'est émis que par le serveur, après confirmation de paiement ;
 *  · un envoi qui échoue est un échec, pas un succès silencieux ;
 *  · le consentement conditionne tout envoi non essentiel.
 */

/** Les événements du parcours, du premier regard à l'abonnement. */
export type EvenementMesure =
  | 'PageView'
  | 'ProofViewed'
  | 'PrimaryCTAClick'
  | 'IntentSelected'
  | 'AjnayaOpened'
  | 'WhatsAppClick'
  | 'StoreClick'
  | 'PricingView'
  | 'InitiateCheckout'
  | 'StartTrialConfirmed'
  | 'SubscriptionConfirmed'
  | 'ContactStarted'
  | 'ContactSubmitted'
  | 'ContactFailed'
  | 'PartnerApplicationSubmitted'

/** Les cinq intentions du site. Une page en porte une, jamais deux. */
export type Intention = 'rentabilite' | 'zones' | 'clientele' | 'ajnaya' | 'communaute' | 'partenaire' | 'general'

export interface ContexteMesure {
  /** L'adresse canonique de la page, pas l'URL du navigateur. */
  page: string
  intention?: Intention
  audience?: 'chauffeur' | 'partenaire' | 'entreprise'
  /** La phrase EXACTE affichée au visiteur. C'est elle qui se compare, pas un
   *  résumé : deux pages peuvent porter la même intention et des promesses
   *  différentes, et c'est la promesse qui convertit. */
  promesse?: string
  variante?: string
  /** Détail libre, jamais de donnée personnelle. */
  detail?: Record<string, string | number | boolean | null>
}

/** Ce que l'on relit de l'adresse. Tout le reste est ignoré, par principe. */
const PARAMETRES_LUS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'ref', 'partner', 'ville'] as const

function origine(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  const p = new URLSearchParams(window.location.search)
  const out: Record<string, string> = {}
  for (const nom of PARAMETRES_LUS) {
    const v = p.get(nom)
    if (v) out[nom] = v.slice(0, 120)
  }
  return out
}

/**
 * Un identifiant partagé entre le navigateur et le serveur, pour qu'un même
 * événement compté des deux côtés ne soit pas compté deux fois.
 */
export function identifiantEvenement(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `e-${Date.now()}-${Math.floor(Math.random() * 1e9)}`
}

/** Le consentement est-il donné pour la mesure non essentielle ? */
function consentementDonne(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const brut = localStorage.getItem('foreas_consent') ?? document.cookie.match(/foreas_consent=([^;]+)/)?.[1]
    if (!brut) return false
    return /true|accept|all|granted/i.test(decodeURIComponent(brut))
  } catch {
    return false
  }
}

/**
 * Enregistre un événement.
 *
 * Ne lève jamais : une mesure qui casse une page est pire qu'une mesure absente.
 * Mais elle n'avale pas non plus son échec en silence — elle le journalise.
 */
export function mesurer(
  evenement: EvenementMesure,
  contexte: ContexteMesure,
  options?: { essentiel?: boolean; eventId?: string },
): void {
  if (typeof window === 'undefined') return

  // Les événements essentiels (le site a besoin de les compter pour fonctionner
  // et décider) ne dépendent pas du consentement publicitaire. Les autres si.
  const essentiel = options?.essentiel ?? true
  if (!essentiel && !consentementDonne()) return

  const corps = {
    evenement,
    event_id: options?.eventId ?? identifiantEvenement(),
    page: contexte.page,
    intention: contexte.intention ?? null,
    audience: contexte.audience ?? null,
    promesse: contexte.promesse ?? null,
    variante: contexte.variante ?? null,
    origine: origine(),
    consentement: consentementDonne(),
    detail: contexte.detail ?? null,
    // L'heure est posée par le serveur : celle du navigateur est réglable.
  }

  try {
    const charge = JSON.stringify(corps)
    // `sendBeacon` survit à la navigation : un clic qui quitte la page est
    // justement celui qu'on veut compter.
    if (navigator.sendBeacon) {
      const ok = navigator.sendBeacon('/api/mesure', new Blob([charge], { type: 'application/json' }))
      if (ok) return
    }
    void fetch('/api/mesure', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: charge,
      keepalive: true,
    }).catch((e) => console.warn('[mesure] envoi échoué :', e?.message))
  } catch (e) {
    console.warn('[mesure] impossible de composer l’événement :', (e as Error)?.message)
  }
}

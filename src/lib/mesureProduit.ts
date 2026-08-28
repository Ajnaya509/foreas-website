'use client'


/**
 * FOREAS — LA MESURE PRODUIT, CHARGÉE SEULEMENT SI ON A LE DROIT.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI CE FICHIER EXISTE
 *
 * La v153 avait repoussé `posthog.init()` après le chargement de la page, et
 * mon compte rendu a présenté ça comme un gain. **Retarder le démarrage ne
 * retarde pas le téléchargement.**
 *
 * Mesuré le 22/08 sur la production v157, dans un vrai Chrome, avec AUCUN
 * consentement enregistré :
 *
 *   eu-assets.i.posthog.com/array/phc_…            ← la bibliothèque elle-même
 *   eu-assets.i.posthog.com/static/surveys.js
 *   eu-assets.i.posthog.com/static/dead-clicks-autocapture.js
 *   eu-assets.i.posthog.com/static/exception-autocapture.js
 *   eu-assets.i.posthog.com/static/web-vitals.js
 *
 * **Cinq fichiers, chez un tiers, avant que le visiteur ait répondu au bandeau.**
 * Ce n'est pas seulement du poids : c'est une requête vers un tiers qui n'aurait
 * pas dû partir. `opt_out_capturing_by_default` empêche l'ENVOI d'événements ;
 * il n'empêche pas le TÉLÉCHARGEMENT.
 *
 * ⚠️ LA CAUSE : `import posthog from 'posthog-js'` écrit en haut de SEPT
 * fichiers. Un import statique entre dans le paquet de départ, que la fonction
 * soit appelée ou non. Aucune ruse dans le corps du composant n'y change rien.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUE FAIT CE MODULE
 *
 * Il expose les TROIS seules opérations réellement utilisées dans le dépôt —
 * vérifié : `capture` (13 appels), `identify` (1), `register` (1). Rien d'autre.
 *
 * Il ne contient AUCUN import statique de PostHog. Le seul `import('posthog-js')`
 * du dépôt vit dans `chargerPostHog()`, et n'est atteint qu'après consentement.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * QUATRE DÉCISIONS, ET CE QU'ELLES ÉVITENT
 *
 * 1. AVANT L'ACCORD, LES DONNÉES SONT JETÉES — PAS MISES DE CÔTÉ.
 *    Garder un événement « au cas où » reviendrait à conserver un comportement
 *    de visite sans droit. Ce que quelqu'un fait avant de consentir n'est pas
 *    mesuré, et ne le devient pas rétroactivement.
 *
 * 2. LA FILE N'EXISTE QUE PENDANT LE CHARGEMENT, ET ELLE EST BORNÉE.
 *    Entre le clic « Accepter » et la fin du téléchargement il s'écoule un
 *    instant. Les appels de cet intervalle sont légitimes : ils sont retenus,
 *    puis rejoués dans l'ordre. Trente au maximum : une file sans limite qui
 *    ne se vide jamais est une fuite de mémoire.
 *
 * 3. UNE SEULE PROMESSE PARTAGÉE.
 *    Sept composants peuvent demander la mesure en même temps. Sans ce verrou,
 *    chacun déclencherait son propre `import()` et sa propre initialisation.
 *
 * 4. UN REFUS N'EST PAS UN SILENCE PROVISOIRE.
 *    Sur refus, la file est vidée et rien n'est jamais téléchargé.
 */

/** Les trois opérations réellement utilisées. Volontairement pas une de plus. */
type Operation =
  | { op: 'capture'; nom: string; details?: Record<string, unknown> }
  | { op: 'identify'; id: string }
  | { op: 'register'; details: Record<string, unknown> }

/** Le peu de surface PostHog dont ce module a besoin. */
interface ClientMesure {
  init: (cle: string, options: Record<string, unknown>) => void
  capture: (nom: string, details?: Record<string, unknown>) => void
  identify: (id: string) => void
  register: (details: Record<string, unknown>) => void
  opt_in_capturing: () => void
  __loaded?: boolean
}

const CLE =
  process.env.NEXT_PUBLIC_POSTHOG_KEY || 'phc_vYxWaLcXBSkgPpYT2FQz3VpsRr2ZiCsrTe2CfV56pheR'
const HOTE = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com'

/** Décision 2 : bornée. Une file qui ne se vide jamais est une fuite. */
const FILE_MAX = 30

let client: ClientMesure | null = null
let chargement: Promise<ClientMesure | null> | null = null
let file: Operation[] = []

/**
 * Le seul `import('posthog-js')` du dépôt.
 *
 * Décision 3 : la promesse est mémorisée avant le premier `await`, donc deux
 * appels simultanés partagent le même chargement. Un `await` posé avant
 * l'affectation laisserait passer deux imports — le piège classique du
 * « vérifier puis agir ».
 */
function chargerPostHog(): Promise<ClientMesure | null> {
  if (chargement) return chargement
  chargement = (async () => {
    try {
      const mod = await import('posthog-js')
      const ph = (mod.default ?? mod) as unknown as ClientMesure
      if (!ph.__loaded) {
        ph.init(CLE, {
          api_host: HOTE,
          defaults: '2026-05-30',
          person_profiles: 'identified_only',

          // ── LES RÉGLAGES QUI RENDENT LA DISPENSE VRAIE ──────────────────
          // Sans eux, « on impose la mesure » devient un suivi publicitaire
          // déguisé, et la dispense tombe. Ils ne sont pas décoratifs.
          cross_subdomain_cookie: false,   // rien ne suit d'un domaine à l'autre
          persistence: 'localStorage+cookie',
          ip: false,                       // l'adresse réseau n'est pas conservée
          property_denylist: ['$ip'],      // ni renvoyée dans les propriétés

          /**
           * ── 28/08/2026, 09h15 — LA VIDÉO EST RALLUMÉE, SANS MASQUE.
           *
           * Décision de Chandler, après que je l'aie coupée à 08h45.
           *
           * POURQUOI JE L'AVAIS COUPÉE : mesuré dans le navigateur, la version
           * servie rendait `session_recording: {}` — le masque écrit dans ce
           * fichier n'était PAS appliqué. Je ne voulais pas filmer une carte
           * sans savoir. Mon propre garde, lui, disait vert : il cherchait la
           * chaîne dans le fichier, pas l'effet dans le navigateur.
           *
           * POURQUOI LA COUPURE N'A PLUS DE RAISON D'ÊTRE : Chandler ne veut
           * pas de masque. La précaution portait sur un masque qu'il ne
           * demande pas.
           *
           * ⚠️ CE QUI RESTE VRAI, ET QUI N'EST PAS UN CHOIX : le formulaire de
           * carte vit dans une fenêtre servie par Stripe, sur un autre domaine.
           * Aucun enregistreur ne peut voir à l'intérieur d'une fenêtre d'un
           * autre domaine — c'est le navigateur qui l'interdit, pas un réglage.
           * Un numéro de carte n'est donc PAS filmable ici, masque ou pas.
           *
           * Ce qui EST filmé sans masque : les champs de FOREAS — téléphone,
           * e-mail, ville. Des données que la base contient déjà.
           */
          disable_session_recording: false,

          // ── Réglages inchangés depuis `PostHogProvider` ──────────────────
          // Le consentement est déjà acquis quand on arrive ici : c'est la
          // condition d'entrée. On n'a donc plus besoin de démarrer « éteint ».
          autocapture: true,
          capture_pageview: true,
          capture_pageleave: true,
          capture_performance: true,
          enable_heatmaps: true,
          capture_exceptions: true,
          rageclick: true,
          // Pas de masque : décision de Chandler du 28/08. À noter que ce bloc
          // était de toute façon IGNORÉ par la bibliothèque (mesuré : elle
          // rendait `{}`), donc le retirer ne change rien au comportement réel.
          // Les champs carte restent hors de portée : ils vivent dans une
          // fenêtre Stripe, sur un autre domaine.
        })
      }
      ph.opt_in_capturing()
      client = ph
      return ph
    } catch (e) {
      // Un bloqueur de publicité, un réseau coupé : la mesure est perdue, la
      // page ne doit pas l'être. On le dit, on ne l'avale pas.
      console.warn('[mesure produit] chargement impossible :', (e as Error)?.message)
      return null
    }
  })()
  return chargement
}

function executer(ph: ClientMesure, o: Operation): void {
  try {
    if (o.op === 'capture') ph.capture(o.nom, o.details)
    else if (o.op === 'identify') ph.identify(o.id)
    else ph.register(o.details)
  } catch {
    /* une mesure qui casse une page est pire qu'une mesure absente */
  }
}

function viderLaFile(ph: ClientMesure | null): void {
  const attente = file
  file = []
  if (!ph) return
  for (const o of attente) executer(ph, o)
}

function poser(o: Operation): void {
  if (typeof window === 'undefined') return

  /**
   * ── 28/08/2026 — LA MESURE D'AUDIENCE NE DEMANDE PLUS LA PERMISSION.
   *
   * Décision de Chandler : « c'est notre site, notre territoire ».
   *
   * Elle est défendable, et voici à quelle condition exacte elle l'est. La
   * CNIL dispense de consentement les mesures d'audience qui restent
   * STRICTEMENT chez soi. Les cinq conditions, tenues ci-dessous dans
   * `chargerPostHog()` :
   *   1. première partie uniquement — aucun suivi d'un site à l'autre ;
   *   2. finalité limitée à comprendre l'usage DE CE SITE ;
   *   3. aucune donnée revendue, recoupée ou envoyée à une régie ;
   *   4. les champs de saisie sont masqués — jamais un téléphone, jamais une carte ;
   *   5. profils nominatifs seulement pour une personne DÉJÀ identifiée chez nous.
   *
   * ⚠️ CE QUI RESTE SOUS ACCORD, ET NE DOIT PAS SUIVRE : les pixels Meta et
   * TikTok. Eux envoient les données à des sociétés tierces — c'est une autre
   * catégorie juridique, et c'est là que se trouvent les vraies amendes. Ils
   * gardent leur garde. Ne les alignez pas sur celle-ci « par cohérence ».
   */

  if (client) {
    executer(client, o)
    return
  }
  if (file.length < FILE_MAX) file.push(o)
  void chargerPostHog().then(viderLaFile)
}

// ─────────────────────────────────────────────────────────────────────────────
// L'API publique — trois fonctions, comme les trois usages réels.

export function mesureCapture(nom: string, details?: Record<string, unknown>): void {
  poser({ op: 'capture', nom, details })
}

export function mesureIdentify(id: string): void {
  poser({ op: 'identify', id })
}

export function mesureRegister(details: Record<string, unknown>): void {
  poser({ op: 'register', details })
}

/**
 * Appelé par le démarreur quand le consentement existe déjà, ou vient d'être
 * donné. Sans lui, la mesure n'existerait qu'à partir du premier événement.
 */
export function demarrerLaMesure(): void {
  if (typeof window === 'undefined') return
  // Plus de garde : la mesure d'audience démarre pour tout le monde (voir
  // l'encadré dans `poser()`). Les pixels publicitaires, eux, gardent la leur.
  void chargerPostHog().then(viderLaFile)
}

/**
 * Refus explicite : on vide ce qui attendait et on ne télécharge jamais.
 * Le chargement n'est pas « remis à plus tard » — il n'a pas lieu.
 */
export function refuserLaMesure(): void {
  file = []
}

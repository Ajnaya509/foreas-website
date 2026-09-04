import { NextResponse, after, type NextRequest } from 'next/server'
import { buildWAMessage, type WhatsAppSection, type FonctionMobile } from '@/lib/whatsappLink'
import { clientServeurOuNull } from '@/lib/supabaseServeur'
import { identiteDepuisBadge, reserverLaParole } from '@/lib/escalier'
import { readAcquisitionFromRequest, persistAcquisition } from '@/lib/acquisitionServer'
import {
  WHATSAPP_HANDOFF_COOKIE,
  readWhatsAppHandoffCookie,
  whatsappHandoffSecrets,
} from '@/lib/whatsappHandoffProof'

/**
 * FOREAS — LE PASSAGE VERS WHATSAPP.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI CE FICHIER EXISTE
 *
 * WhatsApp est le chemin PRINCIPAL de FOREAS : Ajnaya → discussion → WhatsApp
 * → paiement quand le chauffeur est convaincu. Jusqu'ici ce chemin partait nu,
 * puis (v150) portait sa référence — mais au prix d'une fuite.
 *
 * ⚠️ CE QUE LA v150 A CASSÉ SANS LE VOIR, ET QUE CHANDLER A RELEVÉ.
 *
 * La v150 lisait le cookie `foreas_vid` dans `page.tsx` (serveur) et le
 * descendait en propriété jusqu'au lien. Mon compte rendu affirmait « pas de
 * miroir lisible côté navigateur ». **C'était faux.** Mesuré sur le HTML servi :
 *
 *   occurrences BRUTES du badge dans le HTML : 3
 *   le nom de la propriété `refVisite` :        1
 *
 * Une propriété passée d'un composant serveur à un composant client est
 * sérialisée dans la charge React envoyée au navigateur. Et de toute façon la
 * valeur était déjà dans l'adresse du lien, en clair, dans le DOM.
 *
 * Le cookie est `httpOnly` précisément pour qu'un script injecté ne puisse pas
 * le lire. Le publier dans le HTML annulait cette protection.
 *
 * ⚠️ LA LEÇON : « le navigateur ne peut pas LIRE le cookie » et « la valeur du
 * cookie n'arrive pas au navigateur » sont deux affirmations différentes. J'ai
 * prouvé la première et rapporté la seconde.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUE FAIT CE PASSAGE
 *
 * Le lien servi devient `/wa?s=final&p=%2F&i=ajnaya` — aucune donnée sensible.
 * Au clic, ici, côté serveur :
 *
 *   1. on valide la section demandée contre la liste fermée ;
 *   2. on lit `foreas_vid` (il ne quitte jamais le serveur) ;
 *   3. on compte l'événement `WhatsAppClick`, avec l'origine ;
 *   4. on compose uniquement la phrase humaine choisie par le chauffeur ;
 *   5. on redirige vers le numéro officiel, et lui seul.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TROIS DÉCISIONS, ET CE QU'ELLES ÉVITENT
 *
 * 1. LA REDIRECTION PART QUOI QU'IL ARRIVE.
 *    Toute la mesure est dans un `try` qui ne peut pas empêcher la redirection —
 *    la réponse est construite AVANT. Un chauffeur qui clique doit arriver sur
 *    WhatsApp même si la base est tombée, même si la clé serveur manque. C'est
 *    le chemin principal : il ne dépend d'aucun service.
 *
 * 2. AUCUNE DESTINATION N'EST ACCEPTÉE DE L'EXTÉRIEUR.
 *    Le numéro est une constante. Le message est composé à partir d'une liste
 *    fermée de sections. Une adresse fabriquée à la main ne peut donc pas
 *    transformer ce passage en tremplin vers un site tiers, ni faire écrire au
 *    chauffeur un texte que nous n'avons pas prévu.
 *
 * 3. ON NE COMPTE PAS LES PRÉ-CHARGEMENTS.
 *    Un navigateur qui devine la suite peut appeler cette adresse sans que
 *    personne ait cliqué. `Sec-Purpose: prefetch` est alors présent : on
 *    redirige sans compter. Sinon un lien survolé vaudrait un clic.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ LE COMPTAGE CÔTÉ NAVIGATEUR DOIT DISPARAÎTRE DES LIENS QUI PASSENT ICI.
 * Sinon un clic compte deux fois : une fois par `mesurer()` avant la navigation,
 * une fois ici. Un compteur qui double est pire qu'un compteur absent — il
 * inspire confiance.
 */

const NUMERO = '33780732216' // FOREAS WABA Production — constante, jamais un paramètre.

/**
 * Liste fermée. Tout ce qui n'y est pas retombe sur `final`.
 *
 * ⚠️ 29/08 — CETTE LISTE A ÉTÉ OUBLIÉE, ET ÇA A COÛTÉ LE CONTRAIRE DU MESSAGE.
 * `panier_abandonne` a été ajoutée au TYPE et au texte (`whatsappLink.ts`), mais
 * pas ici. Le lien du mail 2 retombait donc sur `final`, et le chauffeur qui
 * cliquait « Poser ma question sur WhatsApp » se retrouvait à écrire, de sa
 * main : « Je démarre avec FOREAS. 0 €. Je teste. » — soit exactement la carte
 * qu'on venait de lui promettre de ne pas redemander.
 *
 * Le compilateur n'a rien vu : le type était juste, seule la liste manquait.
 * ⚠️ TOUTE NOUVELLE SECTION SE DÉCLARE À DEUX ENDROITS. Le repli silencieux
 * ci-dessous est fait pour survivre à un lien mal formé venu de l'extérieur —
 * pas pour cacher un oubli de notre côté. D'où le journal.
 */
const SECTIONS: readonly WhatsAppSection[] = [
  'hero_zone',
  'pain',
  'mechanism',
  'social_proof',
  'plan',
  'cap',
  'final',
  'experience_phone',
  'panier_abandonne',
  'mobile_fonction',
  'avant_paiement',
]

/**
 * Les onze fonctions que `mobile_fonction` peut désigner, via `f`.
 *
 * ⚠️ MÊME PIÈGE QUE LA LISTE AU-DESSUS, UN CRAN PLUS BAS. Déclarer la section
 * sans lire `f` ne répare rien : les onze liens produiraient alors la même
 * phrase générique, et on aurait cru avoir corrigé. La section dit QUI répond,
 * `f` dit DE QUOI. Il faut les deux.
 */
const FONCTIONS: readonly FonctionMobile[] = [
  'site',
  'compta',
  'objectif',
  'zones',
  'fil',
  'ajnaya',
  'regles',
  'reglage',
  'navigation',
  'serie',
  'parrainage',
]

function fonctionValide(v: string | null): FonctionMobile | undefined {
  if ((FONCTIONS as readonly string[]).includes(v ?? '')) return v as FonctionMobile
  if (v) console.warn(`[wa] fonction inconnue « ${v.slice(0, 40)} » — message générique`)
  return undefined
}

function sectionValide(v: string | null): WhatsAppSection {
  if ((SECTIONS as readonly string[]).includes(v ?? '')) return v as WhatsAppSection
  /* Un `s` absent est normal (lien nu). Un `s` PRÉSENT et inconnu ne l'est pas :
     c'est soit un lien fabriqué ailleurs, soit une section oubliée dans cette
     liste. Se taire, c'est laisser le second cas durer des semaines. */
  if (v) console.warn(`[wa] section inconnue « ${v.slice(0, 40)} » — repli sur « final »`)
  return 'final'
}

/**
 * Coupe et nettoie une valeur venue de l'adresse.
 *
 * ⚠️ 22/08 — MA PREMIÈRE VERSION NE RETIRAIT QUE LES CARACTÈRES DE CONTRÔLE.
 *
 * Épreuve réelle : `/wa?s=hero_zone&z=Paris%0A%0AEnvoie ton RIB` produisait
 *
 *   « Salut Ajnaya, je suis sur la zone ParisEnvoie ton RIB. »
 *
 * Les sauts de ligne disparaissaient, **le texte de l'attaquant restait**. Or ce
 * message s'affiche dans la conversation du chauffeur comme s'il l'avait écrit.
 * Quelqu'un pouvait donc lui faire dire n'importe quoi avec un lien portant
 * notre nom de domaine.
 *
 * → Retirer ce qui gêne ne suffit pas. On n'accepte que ce qu'on attend :
 * lettres, chiffres, espaces, apostrophes, tirets et points. Tout le reste fait
 * TOMBER la valeur entière — le message repart sur sa forme générique, qui est
 * toujours vraie.
 */
function texteAffichable(v: string | null, max: number): string | undefined {
  if (!v) return undefined
  const t = v.trim().slice(0, max)
  if (!t.length) return undefined

  // Ce qu'un nom de lieu contient, et rien d'autre. Le POINT est exclu : c'est
  // lui qui permet d'enchaîner une seconde phrase (« Paris. Envoie ton RIB »).
  if (!/^[\p{L}\p{N} '’\-—/()]+$/u.test(t)) return undefined

  // Un nom de zone est court. Les plus longs du site : « Bercy / Gare de Lyon »
  // (20), « Marne-la-Vallée (Disney) » (24), « Châtelet — Les Halles » (21).
  // Au-delà de cinq mots, ce n'est plus un lieu, c'est une phrase.
  if (t.split(/\s+/).filter(Boolean).length > 5) return undefined

  // Un numéro de téléphone ou un IBAN glissé dans le nom d'une zone.
  if (/\d{4,}/.test(t)) return undefined

  return t
}

/** Identifiant de session conservé côté serveur, jamais ajouté au message. */
function referenceValide(v: string | null, max: number): string | undefined {
  if (!v) return undefined
  const t = v.trim().slice(0, max)
  return /^[A-Za-z0-9_-]{6,}$/.test(t) ? t : undefined
}

/** Valeur libre qui ne part PAS dans le message, mais seulement dans la mesure. */
function propre(v: string | null, max: number): string | undefined {
  if (!v) return undefined
  // eslint-disable-next-line no-control-regex
  const t = v.replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, max)
  return t.length ? t : undefined
}

/** Ce que l'on relit de l'adresse — identique à `src/lib/mesure.ts`, par principe. */
const PARAMETRES_ORIGINE = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'ref',
  'partner',
  'ville',
] as const

export async function GET(request: NextRequest) {
  // Un passage privé préparé dans ce même navigateur doit d'abord prouver le
  // numéro. Le billet reste dans le cookie httpOnly : ni l'adresse ni le texte
  // WhatsApp ne le voient. Un lien /wa ordinaire, sans billet, reste instantané.
  const rawPending = request.cookies.get(WHATSAPP_HANDOFF_COOKIE)?.value
  const secrets = whatsappHandoffSecrets()
  const pending = secrets
    ? readWhatsAppHandoffCookie(rawPending, secrets.cookieSecret)
    : null
  if (pending) {
    const verification = new URL('/whatsapp-verification', request.nextUrl.origin)
    const response = NextResponse.redirect(verification, 307)
    response.headers.set('Cache-Control', 'no-store')
    return response
  }

  const q = request.nextUrl.searchParams

  const section = sectionValide(q.get('s'))
  const fonction = fonctionValide(q.get('f'))
  const zone = texteAffichable(q.get('z'), 32)
  const creneau = texteAffichable(q.get('c'), 32)
  /**
   * ⚠️ DEUX RÉFÉRENCES POSSIBLES, ET L'ORDRE COMPTE.
   *
   * `sid` est l'identifiant de la conversation en cours sur le site, fabriqué
   * par le navigateur. `foreas_vid` est le badge appareil, lu ici, jamais servi.
   *
   * Les deux restent enregistrés dans l'événement côté serveur. Aucun des deux
   * ne part dans le message, car le chauffeur pourrait l'effacer ou le recopier.
   */
  const sessionConversation = referenceValide(q.get('sid'), 80)
  const brut = Number(q.get('a'))
  const amount = Number.isFinite(brut) && brut > 0 && brut <= 2000 ? Math.round(brut) : undefined

  // Le badge appareil ne quitte pas le serveur. C'est tout l'intérêt de ce fichier.
  const badge = request.cookies.get('foreas_vid')?.value ?? null

  const message = buildWAMessage({
    section,
    zone,
    slot: creneau,
    amount,
    fonction,
  })
  const destination = `https://wa.me/${NUMERO}?text=${encodeURIComponent(message)}`

  // ⚠️ La réponse est construite AVANT toute tentative d'écriture. Rien de ce qui
  // suit ne peut empêcher le chauffeur d'arriver sur WhatsApp.
  const reponse = NextResponse.redirect(destination, 307)
  reponse.headers.set('Cache-Control', 'no-store')
  if (rawPending) {
    // Billet faux ou expiré : il ne bloque jamais le WhatsApp sans mémoire.
    reponse.cookies.set(WHATSAPP_HANDOFF_COOKIE, '', { path: '/', maxAge: 0 })
  }

  const prefetch =
    request.headers.get('sec-purpose')?.includes('prefetch') ||
    request.headers.get('purpose') === 'prefetch' ||
    request.headers.get('x-moz') === 'prefetch'
  if (prefetch) return reponse

      /**
       * ⚠️ 24/08/2026 — `void` NE SUFFIT PAS SUR CET HÉBERGEUR, ET C'EST MESURÉ.
       *
       * La fonction est GELÉE dès que la réponse part : un travail lancé sans
       * rien pour le retenir peut ne jamais s'exécuter. Le commentaire du
       * webhook Stripe l'explique depuis le 21/08 — et les émetteurs de
       * l'escalier écrits le 23/08 sont tombés dans le même piège, vingt lignes
       * plus bas. Deuxième fois que la réponse était déjà écrite à côté.
       *
       * PREUVE, pas déduction : un vrai GET sur /wa (cache MISS, 307 correct)
       * n'a produit AUCUNE ligne dans `events` — alors que 244 PageView y sont
       * arrivés le même jour. Le dernier WhatsAppClick datait du 22/08.
       *
       * `after()` exécute APRÈS la réponse sans la retarder, et l'hébergeur
       * garde la fonction en vie. Ce n'est pas `await` qu'il faut : attendre
       * ferait dépendre le chemin principal de la latence de la base.
       */
  after(async () => {
   try {
    const sb = clientServeurOuNull()
    if (sb) {
      /**
       * ⚠️ L'ORIGINE SE LIT DANS LE `Referer`, PAS DANS LE LIEN.
       *
       * Recopier les `utm_*` dans le lien aurait obligé chaque bouton à lire
       * `window.location` — impossible au rendu serveur, donc deux versions
       * différentes du même attribut et une erreur d'hydratation. Et sans
       * JavaScript, l'origine aurait été perdue.
       *
       * Le `Referer` porte l'adresse complète de la page quittée tant que la
       * navigation reste sur le même domaine : le site déclare
       * `Referrer-Policy: strict-origin-when-cross-origin`, qui envoie l'URL
       * entière en même origine. Les paramètres explicites du lien restent
       * prioritaires quand ils existent.
       */
      const origine: Record<string, string> = {}
      let depuis: URLSearchParams | null = null
      try {
        const ref = request.headers.get('referer')
        if (ref) {
          const u = new URL(ref)
          if (u.host === request.nextUrl.host) depuis = u.searchParams
        }
      } catch {
        /* un `Referer` illisible n'est pas une raison de perdre le clic */
      }
      for (const nom of PARAMETRES_ORIGINE) {
        const v = q.get(nom) ?? depuis?.get(nom)
        if (v) origine[nom] = v.slice(0, 120)
      }
      const acquisition = { ...readAcquisitionFromRequest(request), ...origine }

      const charge = {
        page: propre(q.get('p'), 200) ?? null,
        intention: propre(q.get('i'), 40) ?? null,
        audience: 'chauffeur',
        promesse: propre(q.get('o'), 120) ?? null, // l'emplacement du bouton
        variante: null,
        origine,
        // Un clic et une référence prouvent une origine de campagne, jamais une personne.
        preuve_de_personne: false,
        // Le consentement se décide côté navigateur. On ne le devine pas ici :
        // une valeur inventée vaudrait moins que rien.
        consentement: null,
        detail: {
          section,
          zone: zone ?? null,
          creneau: creneau ?? null,
          montant: amount ?? null,
          // Les deux bouts de la jointure, côte à côte, toujours.
          session_conversation: sessionConversation ?? null,
          reference_envoyee: 'aucune_visible',
        },
        event_id: null,
      }

      // ⚠️ 24/08 — `await` ICI N'EST PLUS BLOQUANT, ET C'EST TOUT L'INTÉRÊT.
      // Le commentaire d'origine disait vrai avant `after()` : attendre aurait
      // ajouté la latence de la base au chemin principal. Maintenant tout ce
      // bloc s'exécute APRÈS que la réponse soit partie — le chauffeur est déjà
      // sur WhatsApp. Sans ce `await`, la fenêtre se refermerait avant
      // l'écriture, ce qui est exactement la panne mesurée aujourd'hui.
      const { error: errEvt } = await sb
        .from('events')
        .insert({
          event_name: 'WhatsAppClick',
          event_category: 'site',
          payload: charge,
          source: origine.utm_source ?? 'direct',
          session_id: badge ? badge.slice(0, 80) : null,
        })
      if (errEvt) console.error('[wa] écriture refusée :', errEvt.message)

      /**
       * ── 24/08 — CE PASSAGE ÉTAIT AVEUGLE À L'ESCALIER DE VENTE ───────────
       *
       * C'est le chemin vers un humain le plus emprunté du site : il lisait le
       * badge appareil pour composer le message, et ne résolvait JAMAIS
       * l'identité — alors que le résolveur vit dans le fichier d'à côté.
       *
       * Résultat : `parcours_reserver` n'avait aucun appelant. Quand un
       * chauffeur partait discuter sur WhatsApp, rien n'empêchait le site ou
       * une relance de lui écrire en même temps, sur un autre canal.
       *
       * ⚠️ On ne fait PAS monter de marche ici. Un clic prouve qu'on a voulu
       * parler, pas qu'on a parlé — et surtout pas qu'on a vu une offre. La
       * seule chose que ce clic prouve, c'est à QUI appartient le prochain
       * geste. C'est exactement ce qu'on écrit, et rien de plus.
       *
       * Non bloquant, comme tout ce qui est dans ce `try` : la redirection est
       * déjà construite et part quoi qu'il arrive.
       */
      // Attendu DANS `after()` — sans le `await`, la fenêtre que `after` garde
      // ouverte se refermerait avant que la réservation soit écrite : on aurait
      // remplacé un piège par le même piège, à un niveau d'imbrication près.
      try {
        const identite = await identiteDepuisBadge(badge)
        if (identite) {
          await persistAcquisition(sb, identite, 'whatsapp_click', acquisition)
        }
        await reserverLaParole(identite, 'whatsapp', 'répondre au message entrant', 60)
      } catch (e) {
        console.warn('[wa] escalier :', (e as Error)?.message)
      }
    } else {
      console.warn('[wa] clic non compté : clé serveur absente')
    }
   } catch (e) {
    console.warn('[wa] mesure impossible :', (e as Error)?.message)
   }
  })

  return reponse
}

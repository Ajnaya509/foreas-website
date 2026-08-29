import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import Stripe from 'stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * FOREAS — LE TÉLÉPHONE ET LA VILLE, RATTACHÉS À LA SESSION AVANT LA CONFIRMATION.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI CETTE ROUTE EXISTE
 *
 * Le webhook lit ces deux informations dans `session.custom_fields` (ligne 411)
 * et les passe à `provisionDriverAccount()` : sans elles, le compte est créé
 * sans numéro ni ville.
 *
 * Or `custom_fields` est rempli par L'INTERFACE DE STRIPE. En `ui_mode: 'custom'`
 * — celui qui nous laisse dessiner nos propres champs — Stripe n'affiche plus
 * rien, donc il ne collecte plus rien, donc ces champs restent vides pour
 * toujours. Le compte serait créé, le mail partirait, et le chauffeur n'aurait
 * ni téléphone ni ville dans sa fiche. Sans la moindre erreur.
 *
 * Cette route reçoit ce que NOTRE formulaire a collecté et l'attache aux
 * métadonnées de la session. Le webhook lit ensuite les deux emplacements.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ CE QU'ELLE NE FAIT PAS, ET POURQUOI C'EST IMPORTANT
 *
 * · Elle ne crée aucune session et n'en modifie ni le montant, ni la formule,
 *   ni l'essai. Elle écrit deux clés de métadonnées, rien d'autre.
 * · Elle ne renvoie AUCUNE donnée de la session. Un identifiant de session est
 *   long mais devinable par force brute sur un grand nombre d'essais ; une route
 *   publique qui rendrait le contenu d'une session serait une fuite. Ici elle
 *   répond « écrit » ou « refusé », jamais le contenu.
 * · Elle valide les deux valeurs avant de les écrire. Un champ libre qui part
 *   tel quel dans un système tiers, c'est la faute déjà payée sur `/wa` le 21/08 :
 *   un texte injecté dans un message partait chez le destinataire.
 */

/** Format d'un identifiant de session Stripe. Rien d'autre n'est accepté. */
const FORME_SESSION = /^cs_[A-Za-z0-9_]{10,}$/

/**
 * Un numéro de téléphone : chiffres, espaces, points, tirets, parenthèses et un
 * « + » initial. Entre 8 et 20 caractères une fois nettoyé.
 * On ne cherche PAS à valider un numéro français réel : ce n'est pas le rôle de
 * cette route, et un chauffeur avec un numéro étranger ne doit pas être bloqué.
 * On empêche seulement qu'autre chose qu'un numéro passe.
 */
function telephoneValide(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim().slice(0, 24)
  if (!/^\+?[0-9 .\-()]{8,24}$/.test(t)) return null
  const chiffres = t.replace(/\D/g, '')
  return chiffres.length >= 8 && chiffres.length <= 15 ? t : null
}

/**
 * Une ville : lettres, espaces, apostrophes et traits d'union. Deux mots au plus.
 *
 * ⚠️ LA LISTE EST BLANCHE, PAS NOIRE. Retirer les caractères dangereux d'une
 * chaîne libre ne suffit jamais — on en oublie toujours un. On décrit ce qui est
 * autorisé, et tout le reste est refusé.
 */
function villeValide(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim().slice(0, 48)
  if (!/^[\p{L}][\p{L} '’\-]{1,47}$/u.test(t)) return null
  return t.split(/\s+/).filter(Boolean).length <= 4 ? t : null
}

/**
 * Un prénom : lettres, espaces, apostrophes et traits d'union. Un seul mot
 * composé au plus (« Jean-Pierre », « N'Guyen »), 32 caractères maximum.
 *
 * ⚠️ 29/08/2026 — POURQUOI CE CHAMP EXISTE MAINTENANT.
 * La page de succès affichait « Bienvenue, chauffeur ». Ce n'était pas un choix :
 * `billing_address_collection` est passé de `required` à `auto` le 28 pour
 * débloquer les cartes refusées — et Stripe a cessé, du même coup, de collecter
 * le NOM de facturation. `session.customer_details.name` est vide depuis.
 *
 * On ne le récupère donc plus de Stripe : on le demande nous-mêmes. Il sert à
 * trois endroits d'un coup — la page de succès, le mail de bienvenue, et
 * `auth.users.raw_user_meta_data.full_name`, que l'app lit à sa première
 * ouverture. C'est pour ça qu'il vaut le champ supplémentaire.
 *
 * Même liste blanche que la ville : on décrit ce qui est autorisé, jamais ce
 * qui est interdit.
 */
function prenomValide(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim().slice(0, 32)
  if (!/^[\p{L}][\p{L}'’\- ]{0,31}$/u.test(t)) return null
  return t.split(/\s+/).filter(Boolean).length <= 3 ? t : null
}

export async function POST(request: NextRequest) {
  const cle = (process.env.STRIPE_SECRET_KEY || '').replace(/\s/g, '')
  if (!cle) {
    console.warn('[coordonnees] clé Stripe absente')
    return NextResponse.json({ error: 'indisponible' }, { status: 503 })
  }

  const corps = await request.json().catch(() => null)
  const idSession = typeof corps?.sessionId === 'string' ? corps.sessionId.trim() : ''
  if (!FORME_SESSION.test(idSession)) {
    return NextResponse.json({ error: 'session_invalide' }, { status: 400 })
  }

  const telephone = telephoneValide(corps?.telephone)
  const ville = villeValide(corps?.ville)
  const prenom = prenomValide(corps?.prenom)
  /* ⚠️ 28/08 — LA VILLE EST DEVENUE FACULTATIVE, ET C'EST L'ORDRE DES CHOSES.
     Le champ a été retiré du formulaire (décision de Chandler : un champ de
     moins sur la page qui encaisse). Si cette route avait continué à l'exiger,
     elle aurait répondu 400 — et le TÉLÉPHONE, lui aussi, ne serait jamais
     arrivé sur la fiche. Une panne silencieuse, sur la seule donnée qui permet
     de rattraper un chauffeur qui paie et n'ouvre jamais l'app.
     La ville reste acceptée si elle vient d'ailleurs un jour ; elle n'est
     simplement plus obligatoire. */
  if (!telephone) {
    return NextResponse.json(
      { error: 'coordonnees_invalides', telephone: false, ville: !!ville },
      { status: 400 },
    )
  }

  /**
   * ⚠️ MÊME VERSION D'API QUE CELLE QUI A CRÉÉ LA SESSION.
   * Une session `ui_mode: 'custom'` est créée en Basil ; la mettre à jour depuis
   * un client Acacia reviendrait à demander à Stripe de relire un objet dans une
   * forme qu'il ne connaît pas pour ce mode.
   */
  const stripe = new Stripe(cle, {
    apiVersion: '2025-08-27.basil',
    timeout: 8000,
    maxNetworkRetries: 1,
  })

  try {
    await stripe.checkout.sessions.update(idSession, {
      /* On n'écrit `foreas_city` que si une ville existe : une clé posée à la
         chaîne vide écraserait une valeur déjà présente sur la session. */
      /* On ne pose une clé que si sa valeur existe : une clé écrite à la chaîne
         vide écraserait une valeur déjà présente sur la session. */
      metadata: {
        foreas_phone: telephone,
        ...(ville ? { foreas_city: ville } : {}),
        ...(prenom ? { foreas_prenom: prenom } : {}),
      },
    })
    // On ne rend rien de la session. « écrit » suffit à l'appelant.
    return NextResponse.json({ ecrit: true }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    /**
     * ⚠️ ON NE FAIT PAS ÉCHOUER LE PAIEMENT POUR ÇA.
     * Un incident ici prive la fiche de son numéro — c'est ennuyeux, réparable,
     * et sans commune mesure avec un paiement bloqué. On alerte dans les
     * journaux, l'appelant continue.
     */
    console.error('[coordonnees] écriture impossible :', (e as Error)?.message)
    return NextResponse.json({ ecrit: false }, { status: 200 })
  }
}

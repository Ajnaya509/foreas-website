import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { sendProvisionFailureAlert } from '@/lib/email'

/**
 * FOREAS — LA PREUVE DE LIVRAISON DES MAILS.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * POURQUOI CETTE ROUTE EXISTE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Chandler, le 28/08 : « comment saurons-nous [pour] le mail où il est censé
 * recevoir ces identifiants ? » — et la réponse honnête était : on ne le sait
 * pas. `sendWelcomeEmail` rend `true` quand Resend ACCEPTE le message. Accepté
 * n'est pas livré, et livré n'est pas lu.
 *
 * Le mail de bienvenue porte le mot de passe du chauffeur, et lui seul. S'il
 * rebondit — adresse mal tapée, boîte pleine, domaine qui refuse — personne ne
 * l'apprenait. Le chauffeur payait, ne recevait rien, et se taisait.
 *
 * Resend rappelle cette route à chaque étape de vie du message. On n'en garde
 * que ce qui demande une action humaine, et on le crie.
 *
 * ⚠️ CE QUE CETTE ROUTE NE FAIT PAS, ET POURQUOI.
 * Elle n'écrit dans aucune table. En créer une demanderait une migration que je
 * ne peux pas appliquer et vérifier d'ici ; une écriture qui échoue en silence
 * vaudrait moins que rien. Elle ALERTE, ce qui est la partie qui sauve un
 * chauffeur. L'historique complet viendra quand la table existera.
 *
 * ⚠️ CE QU'IL RESTE À FAIRE, CÔTÉ CHANDLER — sans ça, cette route ne reçoit
 * jamais rien :
 *   1. Tableau de bord Resend › Webhooks › Add Endpoint
 *      URL : https://www.foreas.xyz/api/webhooks/resend
 *      Événements : email.delivered, email.bounced, email.complained,
 *                   email.delivery_delayed
 *   2. Copier le « Signing Secret » (il commence par whsec_) et le poser dans
 *      Vercel sous le nom RESEND_WEBHOOK_SECRET.
 * ═══════════════════════════════════════════════════════════════════════════
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Les seuls événements qui demandent qu'on fasse quelque chose. */
const A_TRAITER = new Set(['email.bounced', 'email.complained', 'email.delivery_delayed'])

/**
 * Resend signe avec le format Svix : un identifiant, un horodatage, et une
 * signature HMAC-SHA256 en base64. La bibliothèque `svix` n'est pas installée,
 * et l'ajouter pour vingt lignes serait une dépendance de plus sur le chemin qui
 * encaisse. On vérifie à la main, avec une comparaison à temps constant.
 *
 * ⚠️ Le secret est en base64 APRÈS le préfixe `whsec_`. L'oublier donne une
 * signature qui ne correspond jamais — et un rejet silencieux de tous les
 * événements, ce qui ressemble exactement à « Resend n'envoie rien ».
 */
function signatureValide(corps: string, entetes: Headers, secret: string): boolean {
  const id = entetes.get('svix-id')
  const horodatage = entetes.get('svix-timestamp')
  const signatures = entetes.get('svix-signature')
  if (!id || !horodatage || !signatures) return false

  // Rejeu : au-delà de cinq minutes, on refuse. Un événement rejoué plus tard
  // n'est plus une information, c'est une porte.
  const age = Math.abs(Date.now() / 1000 - Number(horodatage))
  if (!Number.isFinite(age) || age > 300) return false

  const brut = secret.startsWith('whsec_') ? secret.slice(6) : secret
  const cle = Buffer.from(brut, 'base64')
  const attendue = crypto
    .createHmac('sha256', cle)
    .update(`${id}.${horodatage}.${corps}`)
    .digest('base64')

  // L'en-tête peut porter plusieurs signatures, séparées par des espaces,
  // chacune préfixée de sa version : « v1,<base64> ».
  return signatures.split(' ').some((s) => {
    const valeur = s.split(',')[1]
    if (!valeur || valeur.length !== attendue.length) return false
    try {
      return crypto.timingSafeEqual(Buffer.from(valeur), Buffer.from(attendue))
    } catch {
      return false
    }
  })
}

/** Masque une adresse dans les journaux : jamais de donnée personnelle en clair. */
function repere(adresse: string): string {
  const [avant, apres] = String(adresse).split('@')
  if (!apres) return '***'
  return `${avant.slice(0, 1)}•••@${apres}`
}

export async function POST(request: NextRequest) {
  const secret = (process.env.RESEND_WEBHOOK_SECRET || '').trim()

  /* ⚠️ ON NE FAIT PAS SEMBLANT D'ACCEPTER. Sans secret, on ne peut pas savoir si
     l'appel vient de Resend. Répondre 200 donnerait un vert permanent à une
     route qui ne vérifie rien — et Resend cesserait de réessayer. */
  if (!secret) {
    console.error(
      '[resend] RESEND_WEBHOOK_SECRET ABSENT — aucun événement de livraison ne peut être vérifié. ' +
        'Les rebonds du mail de bienvenue passeront inaperçus.'
    )
    return NextResponse.json({ error: 'non configuré' }, { status: 503 })
  }

  const corps = await request.text()
  if (!signatureValide(corps, request.headers, secret)) {
    console.error('[resend] signature invalide — appel ignoré')
    return NextResponse.json({ error: 'signature invalide' }, { status: 401 })
  }

  let evenement: { type?: string; data?: { to?: string[] | string; subject?: string } }
  try {
    evenement = JSON.parse(corps)
  } catch {
    return NextResponse.json({ error: 'corps illisible' }, { status: 400 })
  }

  const type = evenement.type || 'inconnu'
  const destinataires = Array.isArray(evenement.data?.to)
    ? evenement.data.to
    : [evenement.data?.to].filter(Boolean)
  const adresse = String(destinataires[0] || 'inconnue')
  const sujet = String(evenement.data?.subject || '')

  console.log(`[resend] ${type} → ${repere(adresse)}${sujet ? ` — « ${sujet.slice(0, 60)} »` : ''}`)

  /*
   * ⚠️ 29/08/2026 — CE GARDE ARRÊTE UNE BOUCLE QUE J'AI CRÉÉE HIER.
   *
   * L'alerte de rebond part vers `contact@foreas.xyz` (email.ts:402). Or cette
   * adresse REBONDIT elle aussi — constaté à l'instant dans Resend. Donc :
   *   un rebond → une alerte vers contact@ → qui rebondit → une alerte → …
   * Quatre alertes étaient déjà parties en moins d'une minute, chacune
   * engendrant la suivante. Sans fin, et en brûlant la réputation d'envoi du
   * domaine à chaque tour.
   *
   * La règle : on n'alerte JAMAIS sur un rebond dont le destinataire est
   * l'adresse d'alerte elle-même. Le journal, lui, garde la trace — c'est ce
   * qui permet de découvrir que la boîte d'alerte est morte, sans la nourrir.
   *
   * ⚠️ CE N'EST PAS UN CORRECTIF COSMÉTIQUE : tant que `contact@foreas.xyz`
   * rebondit, AUCUNE alerte n'arrive nulle part. Le canal d'alerte est mort,
   * et ce garde ne fait que l'empêcher de s'auto-alimenter. Réparer la boîte
   * est un travail distinct, et il reste à faire.
   */
  const ADRESSE_ALERTE = 'contact@foreas.xyz'
  if (A_TRAITER.has(type) && adresse.toLowerCase() === ADRESSE_ALERTE) {
    console.error(
      `[resend] ⛔ BOUCLE ÉVITÉE — l'adresse d'alerte ${ADRESSE_ALERTE} rebondit elle-même ` +
        `(${type}). Aucune alerte envoyée : elle rebondirait à son tour. ` +
        `LA BOÎTE D'ALERTE EST MORTE, plus aucune alerte n'arrive.`,
    )
    return NextResponse.json({ recu: true, boucle_evitee: true })
  }

  if (A_TRAITER.has(type)) {
    /* ⚠️ ON ALERTE MÊME POUR UN RETARD. Un mail « delayed » qui porte le mot de
       passe est un chauffeur qui attend devant un écran de connexion sans savoir
       pourquoi. Mieux vaut une alerte de trop qu'un abonné perdu en silence. */
    await sendProvisionFailureAlert({
      email: adresse,
      /* Un objet qui dit ce qui s'est passé : « Compte non créé après paiement »
         enverrait chercher au mauvais endroit pour un simple rebond. */
      sujet: `⚠️ Mail NON REMIS (${type.replace('email.', '')}) : ${adresse}`,
      reason:
        `mail NON REMIS (${type})${sujet ? ` — « ${sujet.slice(0, 80)} »` : ''}. ` +
        `Si c'est le mail de bienvenue, le chauffeur a payé et n'a PAS ses identifiants. ` +
        `Le renvoyer à la main, ou le joindre autrement.`,
    })
  }

  // 200 seulement une fois le travail fait : sinon Resend cesserait de réessayer.
  return NextResponse.json({ recu: true })
}

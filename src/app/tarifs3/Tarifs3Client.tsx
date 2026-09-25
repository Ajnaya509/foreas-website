'use client'

import { Fragment, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { Check, Lock } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js'
import { CheckoutElementsProvider } from '@stripe/react-stripe-js/checkout'
import CompteAvantPaiement, { type ComptePaiement } from '@/components/compte/CompteAvantPaiement'
import FormulairePaiement from './FormulairePaiement'
import { formaterEuros, resoudreFormule } from '@/lib/offre'
import { normalizeReferralCode } from '@/lib/referralOffer'
import {
  ECONOMIE_ANNUELLE_PCT,
  EQUIVALENT_MENSUEL_ANNUEL_CENTIMES,
  PRIX_MENSUEL_AFFICHE_CENTIMES,
  planPourCheckout,
  estDebitDuJour,
  type DebitDuJour,
  type Formule,
} from '@/lib/politiquePaiement'
import { phrasesAffichables } from './phrases'
import { VITRINE } from './vitrine'
import s from './tarifs3.module.css'

/**
 * FOREAS — PAGE DE PAIEMENT `/tarifs3`.
 *
 * Vérité visuelle : la maquette validée par Chandler le 27/08
 * (`~/FOREAS-SHARED/MAQUETTE_PAGE_PAIEMENT_A_VALIDER_2026-08-27.html`).
 *
 * ═════════════════════════════════════════════════════════════════════════════
 * LES TROIS ENDROITS OÙ CETTE PAGE S'ÉCARTE DE LA MAQUETTE D'ORIGINE
 * ═════════════════════════════════════════════════════════════════════════════
 *
 * ── 1. LE MONTANT DU JOUR VIENT DU SERVEUR, PAS D'ICI.
 *
 * La maquette du brief affichait « 249,99 € aujourd'hui ». Le site part
 * aujourd'hui en essai de trois jours : le montant réellement prélevé le jour
 * même est **0 €**. Le brief pose d'ailleurs la règle lui-même — « ne jamais
 * déduire l'essai dans le navigateur ».
 *
 * La page affiche donc « Chargement du tarif… », interroge
 * `/api/checkout/politique`, et n'écrit un montant qu'après la réponse. Le jour
 * où le site bascule en comptant, elle dit « 249,99 € aujourd'hui » toute seule.
 *
 * ── 2. AUCUNE LIGNE « Apple Pay » NI « Carte bancaire » N'EST DESSINÉE.
 *
 * Le brief l'interdit : « Ne pas dessiner de faux bouton Apple Pay, Google Pay
 * ou Link. » Sur un Android, une ligne Apple Pay aurait menti à chaque visite.
 * Le vrai panneau Stripe affiche exactement ce que l'appareil propose.
 *
 * ── 3. LE BOUTON BLEU OUVRE, IL N'ENCAISSE PAS.
 *
 * Le brief : « il ne doit pas concurrencer un bouton Apple Pay ou Google Pay
 * affiché par Stripe. » Il disparaît donc dès que Stripe est à l'écran : un seul
 * bouton final existe à tout instant, et c'est celui de Stripe.
 *
 * ═════════════════════════════════════════════════════════════════════════════
 * ⚠️ POURQUOI STRIPE EMBARQUÉ ET PAS `PaymentElement` EN LIBRE DISPOSITION
 * ═════════════════════════════════════════════════════════════════════════════
 *
 * La mise en page de la maquette — moyens de paiement empilés, bouton final à
 * moi — décrit exactement ce que permet `PaymentElement`. C'est la pile que
 * `src/app/checkout/CheckoutClient.tsx` utilisait.
 *
 * Cette pile est FERMÉE depuis le 21/08, et son commentaire de fermeture dit
 * pourquoi : `stripe.subscriptions.create` ne produit jamais l'événement
 * `checkout.session.completed`, le seul dans lequel le webhook crée la ligne
 * d'abonné, le compte et le mail de bienvenue.
 *
 * Autrement dit : la maquette construite avec les vrais composants Stripe aurait
 * débité le chauffeur sans lui donner AUCUN compte. Silencieusement. C'est déjà
 * arrivé. On garde donc la maquette entière au-dessus de la zone bancaire, et on
 * laisse Stripe être Stripe en dessous.
 */

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

/**
 * ⚠️ SI STRIPE NE SE CHARGE PAS, LA PAGE RESTAIT GRISE POUR TOUJOURS.
 *
 * `CheckoutElementsProvider` attend la promesse de Stripe avec un `.then` SANS
 * `.catch` — vérifié dans le paquet livré, pas seulement dans la bibliothèque.
 * Un rejet le laisse donc en « chargement » indéfiniment, et le formulaire
 * affiche ses trois barres grises qui pulsent sans fin. Aucun message, aucun
 * bouton, aucun moyen de payer : le chauffeur croit que ça charge et il part.
 *
 * Ça arrive pour de vrai : un bloqueur de publicité, un portail wifi d'hôtel,
 * un réseau mobile qui tombe en pleine course — et aussi si la clé publique
 * manque au déploiement, auquel cas le site part « vert » et n'encaisse rien.
 *
 * On attrape donc le rejet nous-mêmes, et on le DIT.
 */
const stripePret: Promise<boolean> = stripePromise.then(
  (s) => s !== null,
  () => false
)

/**
 * ⚠️ LA SORTIE DE SECOURS, ET POURQUOI ELLE EXISTE À CETTE DATE PRÉCISE.
 *
 * `false` → le formulaire FOREAS (nos champs, notre bouton, Stripe invisible).
 * `true`  → l'ancien panneau embarqué de Stripe, derrière un bouton.
 *
 * Le lancement est dans quarante-huit heures et ceci est le chemin qui encaisse.
 * Le mode `custom` a été vérifié — session Checkout réelle, donc événement de
 * webhook préservé, donc compte créé — mais il n'a pas encore connu un vrai
 * paiement d'un vrai chauffeur sur un vrai téléphone.
 *
 * Tant que cette preuve n'existe pas, ce booléen doit rester à portée de main :
 * un mot, un déploiement, et le chemin d'avant reprend intégralement. Sans lui,
 * un défaut découvert à la première vraie carte se réparerait en écrivant du
 * code sous pression, ce qui est la pire façon de toucher à un paiement.
 *
 * ⚠️ À RETIRER LE JOUR OÙ UN PAIEMENT RÉEL EST PASSÉ ET QUE LA LIGNE D'ABONNÉ A
 * ÉTÉ LUE EN BASE. Pas avant, et surtout pas parce que « ça a l'air de marcher ».
 */
const REPLI_PANNEAU_STRIPE = false

const FORMULES: readonly Formule[] = ['mensuel', 'annuel']
/**
 * La caisse ouvre sur l'ANNUEL. Décision de Chandler, tenue depuis le 05/09 et
 * reconfirmée le 06/09. La page de vente, elle, ouvre sur le mensuel : c'est
 * voulu, et le visiteur bascule d'un doigt.
 *
 * ⚠️ CE QUI RESTE TECHNIQUE, ET QUI COMPTE : `?formule=` est LU (plus bas).
 * Ça se prouve en ouvrant `?formule=mensuel` — la seule mesure qui vaille,
 * puisqu'elle va contre le défaut. Le 05/09, `?formule=annuel` semblait
 * marcher alors que rien n'était lu : le défaut le masquait.
 */
const FORMULE_PAR_DEFAUT: Formule = 'annuel'

/** Durée d'affichage d'une phrase, puis durée de son effacement. */
const PHRASE_TENUE_MS = 5200
const PHRASE_SORTIE_MS = 520

type EtatTarif =
  | { phase: 'chargement' }
  | { phase: 'connexion' }
  | { phase: 'abonne'; key: string }
  | { phase: 'pret'; debit: DebitDuJour; key: string }
  | { phase: 'indisponible'; message?: string }

/**
 * « 30 août », avec une espace INSÉCABLE entre le jour et le mois.
 *
 * ⚠️ Sans elle, un retour à la ligne peut tomber entre les deux et laisser
 * « 30 » seul en fin de ligne. C'est une faute de typographie française
 * élémentaire, et elle est d'autant plus visible ici que cette date est la seule
 * chose qui dit au chauffeur QUAND il sera prélevé.
 */
function dateFrancaise(iso: string): string {
  return new Date(iso)
    .toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
    .replace(' ', '\u00A0')
}

// ═════════════════════════════════════════════════════════════════════════════

export default function Tarifs3Client() {
  const phrases = useMemo(() => phrasesAffichables(), [])

  const [formule, setFormule] = useState<Formule>(FORMULE_PAR_DEFAUT)

  /* ══ `?formule=` — IL ÉTAIT ÉCRIT DANS LE LIEN, ET PERSONNE NE LE LISAIT ══
     Signalé par le fil PIEUVRE le 05/09 : « /tarifs3?formule=annuel doit ouvrir
     sur l'annuel, c'est mon lien par défaut désormais ».

     ⚠️ ET ÇA MARCHAIT « PAR ACCIDENT », CE QUI EST LE PIRE CAS. La formule par
     défaut de cette page est `annuel` : un lien `?formule=annuel` tombait donc
     juste sans que rien ne soit lu, et `?formule=mensuel` tombait FAUX — le
     chauffeur lisait 29,99 € sur la page de vente, appuyait, et arrivait sur
     249,99 €. J'avais moi-même écrit que le choix « arrive jusqu'à la caisse »
     après l'avoir vu coché à l'écran : je regardais le défaut, pas la lecture.

     ⚠️ ON LIT DANS UN EFFET, PAS AVEC `useSearchParams`. Ce crochet force la
     page entière à basculer en rendu client, et sans une frontière `Suspense`
     au-dessus le premier écran part vide — le défaut déjà payé sur ce dépôt
     (« page Next de 28 000 octets sans aucun texte »). Ici le rendu serveur ne
     bouge pas : la page s'affiche, puis la formule se corrige si le lien le
     demande. `resoudreFormule` accepte aussi les anciennes clés de campagne. */

  /* ── Le code parrain ──────────────────────────────────────────────────────
     `codeSaisi` est le brouillon. `codeApplique` est le code demandé au serveur,
     depuis le lien initial ou après le bouton Appliquer. Ce n'est pas une preuve
     d'attribution. Seule la réponse de la caisse confirme le code et la remise.
     Taper un remplacement conserve la demande courante jusqu'à son application. */
  const [champCodeOuvert, setChampCodeOuvert] = useState(false)
  const [codeSaisi, setCodeSaisi] = useState('')
  const [codeApplique, setCodeApplique] = useState('')
  const [codeRetire, setCodeRetire] = useState(false)
  const [codeARevoir, setCodeARevoir] = useState(false)
  const [entreePrete, setEntreePrete] = useState(false)
  const [entreeErreur, setEntreeErreur] = useState<string | null>(null)
  const verificationCode = useRef(0)
  /* ⚠️ 29/08 — CE QUE LA SESSION APPLIQUE VRAIMENT, DIT PAR LE SERVEUR.
     `etatCode` ne connaît que ce que le chauffeur a TAPÉ. Or un cookie posé par
     un lien /r/<code> applique une remise sans qu'il ait rien tapé : l'écran
     affichait alors le prix plein pendant que Stripe encaissait moins, à chaque
     échéance. Une seule source décide désormais, et c'est la session. */
  const [remiseSession, setRemiseSession] = useState<{ pct: number; heritee: boolean; months: number | null; forever: boolean; sessionKey: string; code: string | null }>({
    pct: 0,
    heritee: false, months: null, forever: false, sessionKey: '', code: null,
  })
  const [etatCode, setEtatCode] = useState<{
    phase: 'repos' | 'verification' | 'accepte' | 'refuse' | 'panne'
    remisePct?: number
    dureeMois?: number | null
    permanente?: boolean
  }>({ phase: 'repos' })
  const [etat, setEtat] = useState<EtatTarif>({ phase: 'chargement' })
  const [tentative, setTentative] = useState(0)
  /*
    ⚠️ `paiementOuvert`, `ouvertureEnCours` et `erreur` ont été SUPPRIMÉS le
    27/08, pas mis de côté. Ils servaient au bouton qui ouvrait le panneau
    Stripe — un bouton qui n'existe plus, puisque le formulaire est là dès le
    chargement. Les garder « au cas où » aurait laissé, sur le chemin qui
    encaisse, trois états que plus rien ne met à jour : le prochain lecteur
    aurait cru à une machinerie vivante. L'erreur de paiement est désormais
    portée par `FormulairePaiement`, au plus près du bouton qui la produit.
  */


  const idLegende = useId()
  const idRecap = useId()



  // A repeated render shares the current request. Returning to a previous
  // formula or code is a new visit: another device may have expired its session.
  const [comptePaiement, setComptePaiement] = useState<ComptePaiement | null>(null)
  const [connexion, setConnexion] = useState(0)
  const [lienPaiement, setLienPaiement] = useState<string | null>(null)
  const [erreurLien, setErreurLien] = useState('')
  const compteChange = useCallback((account: ComptePaiement | null) => {
    sessions.current.clear(); sessionsEnCours.current.clear(); clesDemandes.current.clear()
    setEtat({ phase: account ? 'chargement' : 'connexion' })
    setComptePaiement(account); setConnexion(value => value + 1)
  }, [])
  const sessions = useRef<Map<string, { secret: string; discount: typeof remiseSession }>>(new Map())
  const sessionsEnCours = useRef<Map<string, Promise<string>>>(new Map())
  const clesDemandes = useRef<Map<string, string>>(new Map())
  const contextePaiement = `${comptePaiement?.userId ?? '-'}|${connexion}|${formule}|${codeRetire ? '-' : codeApplique}|${lienPaiement ?? '-'}|${tentative}`
  const visitePaiement = useRef({ contexte: contextePaiement, numero: 0 })
  if (visitePaiement.current.contexte !== contextePaiement) {
    visitePaiement.current = { contexte: contextePaiement, numero: visitePaiement.current.numero + 1 }
    sessions.current.clear(); sessionsEnCours.current.clear(); clesDemandes.current.clear()
  }
  const cleVisible = `${contextePaiement}|${visitePaiement.current.numero}`
  const derniereCleVisible = useRef(cleVisible)
  derniereCleVisible.current = cleVisible


  // Read the invitation before creating any payment session. URL transport works
  // even when cookies are unavailable; normalization is syntax, never admission.
  useEffect(() => {
    try {
      const url = new URL(window.location.href)
      const liens = url.searchParams.getAll('payment_link')
      if (liens.length > 1 || (liens.length === 1 && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(liens[0]))) {
        setErreurLien('Ce lien de paiement est incomplet. Demande un nouveau lien à FOREAS.')
      } else if (liens.length === 1) setLienPaiement(liens[0])
      const voulue = resoudreFormule(url.searchParams.get('formule'))
      if (voulue) setFormule(voulue)
      const proposals = url.searchParams.getAll('ref')
      if (proposals.length > 1) {
        setEntreeErreur('Ce lien contient plusieurs codes. Retire-les ou saisis le code que tu veux utiliser.')
        setChampCodeOuvert(true)
      } else if (proposals.length === 1) {
        const raw = proposals[0].trim()
        if (!raw) {
          setEntreeErreur('Le code de ce lien est vide. Retire-le ou saisis ton code.')
        } else {
          const proposed = normalizeReferralCode(raw) || raw
          setCodeApplique(proposed)
          setCodeSaisi(proposed)
        }
        setChampCodeOuvert(true)
      }
    } catch {
      setEntreeErreur('Le lien n’a pas pu être lu. Retire le code proposé ou saisis-le de nouveau.')
      setChampCodeOuvert(true)
    } finally { setEntreePrete(true) }
  }, [])


  // Personal terms never reuse another account's previous response.
  useEffect(() => {
    if (!entreePrete || erreurLien) return
    if (!comptePaiement) { setEtat({ phase: 'connexion' }); return }
    let annule = false
    const cle = cleVisible
    setEtat({ phase: 'chargement' })
    const query = new URLSearchParams({ formule })
    if (lienPaiement) query.set('payment_link', lienPaiement)
    fetch(`/api/checkout/politique?${query}`, { cache: 'no-store', headers: { Authorization: `Bearer ${comptePaiement.credential}` } })
      .then(async response => {
        const data = await response.json().catch(() => null)
        if (annule || derniereCleVisible.current !== cle) return
        if (!response.ok) { setEtat({ phase: 'indisponible', message: typeof data?.error === 'string' ? data.error : undefined }); return }
        if (data?.confirmeParLeServeur !== true || data.accountId !== comptePaiement.userId) { setEtat({ phase: 'indisponible' }); return }
        if (data.alreadySubscribed === true) { setEtat({ phase: 'abonne', key: cle }); return }
        if (data.alreadySubscribed !== false || !estDebitDuJour(data, formule)) { setEtat({ phase: 'indisponible' }); return }
        setEtat({ phase: 'pret', debit: data, key: cle })
      })
      .catch(() => { if (!annule && derniereCleVisible.current === cle) setEtat({ phase: 'indisponible' }) })
    return () => { annule = true }
  }, [formule, tentative, comptePaiement, cleVisible, entreePrete, lienPaiement, erreurLien])

  // ── Les phrases ────────────────────────────────────────────────────────────
  const [iPhrase, setIPhrase] = useState(0)
  const [pose, setPose] = useState(false)
  const [sort, setSort] = useState(false)
  const [figee, setFigee] = useState(false)

  /**
   * La vitrine de droite — bureau seulement.
   *
   * ⚠️ ELLE N'EXISTE PAS SUR TÉLÉPHONE, ET CE N'EST PAS UN OUBLI.
   * Chandler a figé le mobile le 27/08 : « pour la partie mobile on fige, tout
   * est good ». La colonne est donc masquée par la feuille de style en dessous
   * de 1024 px — et les images ne sont même pas demandées, parce que
   * `next/image` ne charge que ce qui est rendu.
   */
  const [iVitrine, setIVitrine] = useState(0)
  const videosRef = useRef<(HTMLVideoElement | null)[]>([])

  /**
   * ⚠️ ON NE LAISSE PAS DEUX VIDÉOS TOURNER EN MÊME TEMPS.
   * Une vidéo invisible qui continue de jouer consomme du processeur et de la
   * batterie pour rien — et sur un ordinateur portable, ça se sent au ventilateur.
   * La visible joue, les autres se mettent en pause et reviennent à zéro : la
   * fonctionnalité recommence depuis le début à chaque fois qu'on la choisit,
   * au lieu de reprendre au milieu d'un mouvement.
   */
  useEffect(() => {
    videosRef.current.forEach((el, i) => {
      if (!el) return
      if (i === iVitrine) {
        // `play()` rend une promesse qui peut être rejetée (onglet caché,
        // économie d'énergie). Un rejet ici n'est pas une panne : on l'avale,
        // mais on ne le laisse pas remonter en erreur non gérée.
        void el.play().catch(() => {})
      } else {
        el.pause()
        el.currentTime = 0
      }
    })
  }, [iVitrine])
  useEffect(() => {
    if (figee || VITRINE.length < 2) return
    const t = setTimeout(() => setIVitrine((i) => (i + 1) % VITRINE.length), 6000)
    return () => clearTimeout(t)
  }, [iVitrine, figee])

  useEffect(() => {
    // ⚠️ Un délai court plutôt qu'un `requestAnimationFrame` : dans un onglet en
    // arrière-plan, rAF est gelé et les caractères resteraient invisibles au
    // retour. Le minuteur, lui, finit toujours par tomber.
    const t = setTimeout(() => setPose(true), 24)
    return () => clearTimeout(t)
  }, [iPhrase])

  useEffect(() => {
    if (figee || phrases.length < 2) return
    const t = setTimeout(() => setSort(true), PHRASE_TENUE_MS)
    return () => clearTimeout(t)
  }, [iPhrase, figee, phrases.length])

  useEffect(() => {
    if (!sort) return
    const t = setTimeout(() => {
      setIPhrase((i) => (i + 1) % phrases.length)
      setSort(false)
      setPose(false)
    }, PHRASE_SORTIE_MS)
    return () => clearTimeout(t)
  }, [sort, phrases.length])

  /**
   * ⚠️ LA RÈGLE QUE LA COMPÉTENCE `foreas-copy-atomic` IMPOSE.
   * §6.8, page de paiement : « Le user est en Most-aware. Tu ENLÈVES des choses,
   * tu n'en ajoutes pas. 0 distraction. » Et le brief d'intégration demande
   * « l'arrêt de la notification pendant l'interaction de paiement ».
   *
   * Une phrase qui change dans le coin de l'œil PENDANT une saisie de carte est
   * exactement cette distraction. Dès qu'il touche le formulaire, la rotation
   * s'arrête — définitivement, pas en pause : il est passé du « pourquoi » au
   * « comment », et on ne le ramène pas en arrière.
   *
   * Deux événements et pas un : `pointerdown` attrape la souris et le doigt,
   * `focus` attrape le clavier. N'en poser qu'un laisse passer une population
   * entière.
   */
  const figerPendantLePaiement = useCallback(() => setFigee(true), [])

  // Le code est vérifié ici ; le montant et la durée affichés viennent de la session de paiement.
  const appliquerCode = useCallback(async () => {
    const code = normalizeReferralCode(codeSaisi) || codeSaisi.trim()
    if (!code) return
    const attempt = ++verificationCode.current
    setEtatCode({ phase: 'verification' })
    try {
      const res = await fetch('/api/parrainage/verifier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, formule }),
      })
      if (attempt !== verificationCode.current) return
      if (!res.ok) {
        /* ⚠️ UNE PANNE N'EST PAS UN CODE FAUX. Dire « code inconnu » enverrait
           corriger une faute de frappe qui n'existe pas. */
        setEtatCode({ phase: 'panne' })
        return
      }
      const data = (await res.json()) as { valide?: boolean; remisePct?: number; dureeMois?: number | null; remisePermanente?: boolean }
      if (attempt !== verificationCode.current) return
      if (!data?.valide) {
        setEtatCode({ phase: 'refuse' })
        return
      }
      // Preserve the explicit replacement across reloads, including without cookies.
      const invitation = new URL(window.location.href)
      invitation.searchParams.set('ref', code)
      window.history.replaceState(window.history.state, '', invitation.pathname + invitation.search + invitation.hash)
      setEtatCode({ phase: 'accepte', remisePct: Number(data.remisePct) || 0, dureeMois: data.dureeMois ?? null, permanente: data.remisePermanente === true })
      setCodeRetire(false)
      setEntreeErreur(null)
      setCodeARevoir(false)
      setCodeApplique(code)
    } catch {
      if (attempt === verificationCode.current) setEtatCode({ phase: 'panne' })
    }
  }, [codeSaisi, formule])

  const retirerCode = useCallback(() => {
    verificationCode.current += 1
    try {
      // This is the only cookie changed here. Advertising consent is independent.
      const hasReferralCookie = () => document.cookie.split(';').some(part => part.trim().startsWith('foreas_partner_ref='))
      if (hasReferralCookie()) {
        document.cookie = 'foreas_partner_ref=; Max-Age=0; Path=/; SameSite=Lax' + (window.location.protocol === 'https:' ? '; Secure' : '')
        if (hasReferralCookie()) throw new Error('cookie_not_removed')
      }
      const url = new URL(window.location.href)
      url.searchParams.delete('ref')
      window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash)
    } catch {
      setEntreeErreur('Le code n’a pas pu être retiré de ce navigateur. Vérifie ses réglages puis réessaie.')
      return
    }
    setCodeRetire(true)
    setCodeARevoir(false)
    setCodeApplique('')
    setCodeSaisi('')
    setEntreeErreur(null)
    setEtatCode({ phase: 'repos' })
  }, [])

  // ── Le paiement ────────────────────────────────────────────────────────────
  const choisirFormule = useCallback((f: Formule) => {
    setFormule(f)
    /**
     * Changer de formule change le montant. Laisser Stripe ouvert afficherait
     * l'ancien prix pendant que le récapitulatif affiche le nouveau : deux
     * montants à l'écran au même instant, c'est le début d'un litige.
     */
  }, [])

  const recupererClientSecret = useCallback((): Promise<string> => {
    if (!comptePaiement || comptePaiement.expiresAt * 1000 <= Date.now()) return Promise.reject(new Error('Reconnecte ton compte avant de payer.'))
    if (etat.phase !== 'pret' || etat.key !== cleVisible || erreurLien) return Promise.reject(new Error('Vérifie les conditions de ton abonnement avant de payer.'))
    const cleSession = cleVisible
    const deja = sessions.current.get(cleSession)
    if (deja) {
      if (derniereCleVisible.current === cleSession) setRemiseSession(deja.discount)
      return Promise.resolve(deja.secret)
    }
    const enCours = sessionsEnCours.current.get(cleSession)
    if (enCours) return enCours
    const requestKey = clesDemandes.current.get(cleSession) || crypto.randomUUID()
    clesDemandes.current.set(cleSession, requestKey)
    const promise = (async () => {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': requestKey, Authorization: `Bearer ${comptePaiement.credential}` },
        body: JSON.stringify({
          plan: planPourCheckout(formule),
          mode: REPLI_PANNEAU_STRIPE ? 'embedded' : 'elements',
          expectedTrial: etat.debit.essai,
          ...(lienPaiement ? { payment_link: lienPaiement } : {}),
          ...(codeRetire ? { referral_code: '' } : codeApplique ? { referral_code: codeApplique } : {}),
        }),
      })
      const data = await res.json().catch(() => null)
      if (derniereCleVisible.current !== cleSession) throw new Error('La demande de paiement a changé.')
      if (data?.alreadySubscribed === true && data.accountId === comptePaiement.userId) {
        setEtat({ phase: 'abonne', key: cleSession })
        throw new Error('Ton abonnement est déjà actif.')
      }
      if (!res.ok || !data?.clientSecret) {
        if (data?.code === 'CONDITIONS_CHANGED') setEtat({ phase: 'indisponible', message: typeof data.error === 'string' ? data.error : undefined })
        if (derniereCleVisible.current === cleSession && ['CODE_UNAVAILABLE', 'TERMS_UNAVAILABLE'].includes(data?.code)) {
          setCodeARevoir(true)
          setChampCodeOuvert(true)
        }
        throw new Error(data?.error || `checkout_${res.status}`)
      }
      if (data.accountId !== comptePaiement.userId || data.debit?.formule !== formule || data.debit?.essai !== etat.debit.essai || data.debit?.montantAujourdhuiCentimes !== etat.debit.montantAujourdhuiCentimes || data.debit?.montantEnsuiteCentimes !== etat.debit.montantEnsuiteCentimes) throw new Error('Le montant de cette demande doit être vérifié de nouveau.')
      if (typeof data.clientSecret !== 'string' || typeof data.remiseParrainPct !== 'number' || !Number.isFinite(data.remiseParrainPct) || data.remiseParrainPct < 0 || data.remiseParrainPct > 100 || typeof data.remiseHeritee !== 'boolean' || typeof data.remisePermanente !== 'boolean' || (data.remiseDureeMois !== null && (!Number.isInteger(data.remiseDureeMois) || data.remiseDureeMois < 1 || data.remiseDureeMois > 120))) throw new Error('Les conditions de cette demande n’ont pas pu être confirmées.')
      if ((data.remiseParrainPct > 0 && !data.referralCodeConfirmed) || (data.remisePermanente && data.remiseDureeMois !== null)) throw new Error('Les conditions de la remise ne correspondent pas à cette demande.')
      const confirmedCode = data.referralCodeConfirmed
      if (confirmedCode !== null && (typeof confirmedCode !== 'string' || normalizeReferralCode(confirmedCode) !== confirmedCode)) throw new Error('Le code de cette demande n’a pas pu être confirmé.')
      if ((codeRetire && confirmedCode !== null) || (codeApplique && confirmedCode !== normalizeReferralCode(codeApplique))) throw new Error('Le code confirmé ne correspond pas à ta demande. Réessaie avant de payer.')
      const discount = {
        code: confirmedCode as string | null,
        pct: data.remiseParrainPct as number,
        heritee: data.remiseHeritee as boolean,
        months: typeof data.remiseDureeMois === 'number' ? data.remiseDureeMois : null,
        forever: data.remisePermanente === true,
        sessionKey: cleSession,
      }
      if (discount.pct > 0 && !discount.forever && (!Number.isInteger(discount.months) || Number(discount.months) < 1)) throw new Error('La durée de la remise doit être confirmée avant le paiement.')
      if (derniereCleVisible.current !== cleSession) throw new Error('La demande de paiement a changé.')
      sessions.current.set(cleSession, { secret: data.clientSecret as string, discount })
      if (derniereCleVisible.current === cleSession) {
        setRemiseSession(discount)
        setCodeARevoir(false)
      }
      return data.clientSecret as string
    })()
    sessionsEnCours.current.set(cleSession, promise)
    const finish = () => { if (sessionsEnCours.current.get(cleSession) === promise) sessionsEnCours.current.delete(cleSession) }
    void promise.then(finish, finish)
    return promise
  }, [formule, codeApplique, codeRetire, comptePaiement, cleVisible, etat, lienPaiement, erreurLien])

  /**
   * ⚠️ ELLE NAÎT DANS UN EFFET, DONC JAMAIS SUR LE SERVEUR.
   * Premier essai : un `useMemo`. La fabrication a échoué au pré-rendu avec
   * « Failed to parse URL from /api/checkout » — un `fetch` vers une adresse
   * relative n'a pas de sens côté serveur, où il n'existe pas d'origine. Un
   * effet ne s'exécute que dans le navigateur : le problème disparaît, et la
   * page se pré-rend sans réclamer de session à Stripe.
   *
   * ⚠️ ET UNE SEULE PROMESSE PAR FORMULE, PAS UNE PAR RENDU.
   * `CheckoutElementsProvider` accepte une promesse de secret. Mais une promesse
   * recréée à chaque rendu ferait remonter le fournisseur, donc redemander une
   * session à Stripe, donc laisser derrière chaque frappe au clavier une
   * tentative morte dans le tableau de bord. La promesse est donc mémorisée —
   * et changer de formule en crée une nouvelle, ce qui est exactement voulu :
   * ce n'est plus le même montant.
   */
  const [promesseSecret, setPromesseSecret] = useState<{ key: string; promise: Promise<string> } | null>(null)
  const [stripeKO, setStripeKO] = useState(false)
  useEffect(() => {
    let vif = true
    stripePret.then((ok) => {
      if (vif && !ok) setStripeKO(true)
    })
    return () => {
      vif = false
    }
  }, [])

  useEffect(() => {
    if (REPLI_PANNEAU_STRIPE || !entreePrete || entreeErreur || erreurLien || !comptePaiement || etat.phase !== 'pret' || etat.key !== cleVisible) return
    setPromesseSecret({ key: cleVisible, promise: recupererClientSecret() })
  }, [recupererClientSecret, cleVisible, entreePrete, entreeErreur, comptePaiement, etat, erreurLien])

  // ── Rendu ──────────────────────────────────────────────────────────────────
  const debit = etat.phase === 'pret' && etat.key === cleVisible ? etat.debit : null
  const codeConfirme = remiseSession.sessionKey === cleVisible ? remiseSession.code : null
  const codeRetirable = !!(codeApplique || codeConfirme || codeARevoir || entreeErreur || codeSaisi)
  const remiseCourante = remiseSession.sessionKey === cleVisible ? remiseSession : { pct: 0, months: null, heritee: false, forever: false }
  const montantAvecRemise = (cents: number) => Math.round(cents * (100 - remiseCourante.pct) / 100)
  const libelleCTA = debit?.essai
    ? `Démarrer mes ${debit.joursEssai} jours offerts`
    : 'Démarrer mon abonnement'

  const classeCar = sort ? `${s.car} ${s.carSortie}` : pose ? `${s.car} ${s.carVisible}` : s.car

  /**
   * ⚠️ DEUX NIVEAUX DE BOÎTES, ET CHACUN RÉPARE UN DÉFAUT DIFFÉRENT.
   *
   * 1. CHAQUE MOT EST UNE BOÎTE — sinon le texte se coupe au milieu d'un mot.
   *    Un navigateur peut casser une ligne ENTRE deux éléments en ligne.
   *    Découper le texte lettre par lettre lui donne donc le droit de casser
   *    entre deux lettres. Mesuré à l'écran : « une journée RENT / ABLE ».
   *
   * 2. CHAQUE PHRASE EST UNE BOÎTE — sinon la ligne se coupe au milieu d'une
   *    phrase. Six des treize textes en contiennent deux. Mesuré avant :
   *    « Une plateforme cherche du volume. Un / chauffeur cherche de la marge. »
   *    Le point se retrouvait en plein milieu d'une ligne.
   *    Avec les boîtes : « Une plateforme cherche du volume. / Un chauffeur
   *    cherche de la marge. » — la coupure tombe au point, les six fois.
   *
   * ⚠️ ET LE RETARD DES LETTRES RESTE GLOBAL, IL NE REPART PAS À CHAQUE PHRASE.
   * Un compteur remis à zéro par phrase ferait recommencer l'animation au
   * milieu du texte : la seconde phrase se poserait en même temps que la
   * première, et l'effet ressemblerait à un bégaiement.
   */
  const lettres = useMemo(() => {
    const texte = phrases[iPhrase]?.texte ?? ''
    const total = Array.from(texte).length
    const pas = Math.min(16, 620 / Math.max(total, 1))
    /* Découpe aux fins de phrase : un point suivi d'une espace.
     *
     * ⚠️ 27/08 — CETTE LIGNE A CASSÉ LA PAGE DE PAIEMENT SUR IPHONE.
     * Elle s'écrivait avec un REGARD ARRIÈRE — la construction qui dit
     * « coupe après un point ». Safari ne la connaît qu'à partir d'iOS 16.4.
     * Sur un iPhone plus ancien, le motif lève une erreur, React l'attrape, et
     * le chauffeur voit « Application error: a client-side exception has
     * occurred » à la place du formulaire. Écran noir, zéro paiement possible.
     *
     * ⚠️ ET ÇA NE SE VOYAIT NULLE PART AILLEURS. Le site se construit sans un
     * mot, le contrôle de type passe, Chrome et le navigateur d'aperçu
     * l'exécutent parfaitement. Seul un vrai iPhone le montre. C'est Chandler
     * qui l'a trouvé — et deux fois : la première, j'avais mis son « ça ne
     * marche pas sur l'iPhone de ma femme » sur le compte d'une adresse locale.
     *
     * Le remplacement n'a pas de regard arrière. On coupe sur « point + espaces »,
     * ce qui mange le point, puis on le recolle à tous les morceaux sauf le
     * dernier — lui garde déjà le sien. Le recollage se fait AVANT le filtrage :
     * sinon un texte finissant par « . » perdrait son point au passage.
     */
    const bruts = texte.split(/\.\s+/)
    const segments = bruts
      .map((seg, i) => (i < bruts.length - 1 ? seg + '.' : seg))
      .filter(Boolean)
    let n = 0

    const lettre = (c: string, cle: string) => {
      const retard = n++ * pas * (sort ? 0.55 : 1)
      return (
        <span key={cle} className={classeCar} style={{ transitionDelay: `${retard}ms` }}>
          {c}
        </span>
      )
    }

    return segments.map((segment, si) => (
      <Fragment key={si}>
        <span className={s.segment}>
          {segment.split(' ').map((mot, mi, mots) => (
            <Fragment key={mi}>
              <span className={s.mot}>
                {Array.from(mot).map((c, ci) => lettre(c, `${si}-${mi}-${ci}`))}
              </span>
              {mi < mots.length - 1 && lettre(' ', `${si}-${mi}-esp`)}
            </Fragment>
          ))}
        </span>
        {si < segments.length - 1 && lettre(' ', `${si}-seg`)}
      </Fragment>
    ))
  }, [phrases, iPhrase, classeCar, sort])

  return (
    <main className={s.page}>
      <div className={s.halo} aria-hidden />

      <div className={s.dedans}>
        {/* ── En-tête ──────────────────────────────────────────────────── */}
        <header className={s.entete}>
          {/*
            La marque courte « F/ » plutôt que le mot entier — choix de Chandler,
            27/08. Elle tient dans un carré, donc elle laisse la ligne d'en-tête
            respirer à côté de « Sécurisé par Stripe », qui est long.

            ⚠️ Le fichier est le SVG officiel « LOGO Blanc MINI ». Seul son cadre
            a été resserré : le tracé du F et celui de la barre sont identiques
            octet pour octet à l'original. Recadrer n'est pas redessiner.
            Boîte réelle mesurée : 248,36 × 191,73 → rapport 1,295.
          */}
          <Image
            src="/foreas-marque-blanche.svg"
            alt="FOREAS"
            width={36}
            height={28}
            priority
            className={s.marque}
          />
          {/* « Sécurisé par Stripe », et jamais « sécurisé par FOREAS » :
              c'est Stripe qui détient la carte, pas nous. */}
          <p className={s.stripeHaut}>
            <Lock className="h-4 w-4 flex-none text-emerald-400" aria-hidden />
            Sécurisé par Stripe
          </p>
        </header>

        {/* ⚠️ CE TITRE DISAIT « GAGNER MIEUX, PLUS SIMPLEMENT ». Il vouvoyait
            la promesse et lâchait le tutoiement de la page qu'il vient de lire :
            arrivé devant le champ carte, le chauffeur ne reconnaissait plus le
            site. On reprend la phrase de la page de vente, mot pour mot.
            Elle reste conditionnelle : sans essai, « zéro euro aujourd'hui »
            serait faux, et un titre faux devant une carte bancaire est le pire
            endroit du parcours pour se tromper. */}
        <h1 className={s.titre}>
          {debit?.essai
            ? `${debit.joursEssai === 3 ? 'Trois' : debit.joursEssai} jours. Zéro euro aujourd’hui.`
            : 'Gagner mieux, plus simplement.'}
        </h1>

        {/* ⚠️ Pas d'`aria-live` ici. Une phrase qui change toutes les cinq
            secondes et qu'un lecteur d'écran annoncerait à chaque fois rendrait
            la page inutilisable. Le texte reste lisible quand on l'atteint ;
            il ne s'invite pas. */}
        <p className={s.dire}>
          <span className={s.direTexte}>{lettres}</span>
        </p>

        {/* ── La carte, et la vitrine à côté au bureau ─────────────────── */}
        <div className={s.colonnes}>
        <div className={s.cadreCarte}>
          <span className={s.lueur} aria-hidden />
          <section
            className={s.carte}
            onPointerDown={figerPendantLePaiement}
            onFocus={figerPendantLePaiement}
          >
            <fieldset className={s.champ}>
              <legend id={idLegende} className="sr-only">
                Choisir la formule d’abonnement
              </legend>

              <div className={s.offres}>
                {FORMULES.map((f) => {
                  const choisie = f === formule
                  const annuelle = f === 'annuel'
                  return (
                    <label key={f} className={s.offre}>
                      <input
                        type="radio"
                        name="formule-foreas"
                        value={f}
                        checked={choisie}
                        onChange={() => choisirFormule(f)}
                        aria-label={
                          annuelle
                            ? `Annuel, ${formaterEuros(EQUIVALENT_MENSUEL_ANNUEL_CENTIMES)} par mois pendant douze mois`
                            : `Mensuel, ${formaterEuros(PRIX_MENSUEL_AFFICHE_CENTIMES)} par mois`
                        }
                      />
                      <span className={s.boite}>
                        <span className={s.nom}>{annuelle ? 'Annuel' : 'Mensuel'}</span>
                        <span className={s.prix}>
                          {annuelle
                            ? formaterEuros(EQUIVALENT_MENSUEL_ANNUEL_CENTIMES)
                            : formaterEuros(PRIX_MENSUEL_AFFICHE_CENTIMES)}
                        </span>
                        <span className={s.periode}>
                          / mois{annuelle && <span className={s.fois}> &times;&nbsp;12</span>}
                        </span>
                      </span>

                      {annuelle && (
                        <span
                          aria-hidden
                          className={`${s.encoche} ${choisie ? s.encocheActive : ''}`}
                        >
                          Recommandé
                        </span>
                      )}
                      {annuelle && choisie && (
                        <span aria-hidden className={s.coche}>
                          <Check className="h-3.5 w-3.5 text-white" strokeWidth={3.5} />
                        </span>
                      )}
                    </label>
                  )
                })}
              </div>
            </fieldset>

            {/* ── Le code parrain ───────────────────────────────────────────
                ⚠️ REPLIÉ PAR DÉFAUT, ET C'EST DÉLIBÉRÉ. La grande majorité des
                chauffeurs n'a pas de code. Un champ vide de plus sur la page qui
                encaisse, c'est une question de plus à se poser au moment de
                sortir sa carte. Celui qui a un code, lui, le cherche — il
                trouvera le lien. */}
            <div className={s.parrain}>
              {!champCodeOuvert && !codeRetirable && (
                <button
                  type="button"
                  className={s.parrainLien}
                  onClick={() => setChampCodeOuvert(true)}
                >
                  J&apos;ai un code parrain
                </button>
              )}

              {(champCodeOuvert || codeRetirable) && (
                <>
                  <div className={s.parrainLigne}>
                    <input
                      type="text"
                      className={s.parrainChamp}
                      value={codeSaisi}
                      onChange={(e) => {
                        verificationCode.current += 1
                        setCodeSaisi(e.target.value.toUpperCase())
                        /* Retaper efface le verdict précédent : garder « accepté »
                           affiché pendant qu'on modifie le code serait un mensonge
                           d'un caractère. */
                        if (etatCode.phase !== 'repos') setEtatCode({ phase: 'repos' })
                        // Keep the confirmed payment selection until Apply succeeds.
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          void appliquerCode()
                        }
                      }}
                      placeholder="Code parrain"
                      aria-label="Code parrain"
                      autoCapitalize="characters"
                      autoComplete="off"
                      spellCheck={false}
                      maxLength={32}
                      disabled={etatCode.phase === 'verification'}
                    />
                    <button
                      type="button"
                      className={s.parrainBouton}
                      onClick={() => void appliquerCode()}
                      disabled={etatCode.phase === 'verification' || !codeSaisi.trim() || (codeConfirme !== null && normalizeReferralCode(codeSaisi) === codeConfirme && !codeARevoir && !entreeErreur)}
                    >
                      {etatCode.phase === 'verification' ? 'Vérification…' : 'Appliquer'}
                    </button>
                  </div>
                  {codeRetirable && <button type="button" className={s.parrainLien} onClick={retirerCode}>Retirer</button>}

                  {entreeErreur && <p className={s.parrainKo} role="alert">{entreeErreur}</p>}
                  {codeConfirme && <p className={s.parrainMot}>Code confirmé pour cette demande : <strong>{codeConfirme}</strong>. L’attribution sera vérifiée par FOREAS.</p>}
                  <p className={s.parrainMot} role="status" aria-live="polite">
                    {etatCode.phase === 'accepte' && (
                      <span className={s.parrainOk}>
                        Code reconnu. La remise applicable à ta formule sera confirmée dans le récapitulatif du paiement.
                      </span>
                    )}
                    {etatCode.phase === 'refuse' && (
                      <span className={s.parrainKo}>Ce code n&apos;est pas reconnu.</span>
                    )}
                    {etatCode.phase === 'panne' && (
                      <span className={s.parrainKo}>
                        Vérification impossible pour l&apos;instant. Réessayer dans un instant.
                      </span>
                    )}
                  </p>
                </>
              )}
            </div>

            <hr className={s.filet} />

            {/* ── Le récapitulatif ───────────────────────────────────── */}
            <div id={idRecap} className={s.recap} aria-live="polite" aria-busy={etat.phase === 'chargement'}>
              {etat.phase === 'chargement' && (
                <>
                  <span className="sr-only">Chargement du tarif…</span>
                  {/* Les formes de ce qui arrive, pour que rien ne bouge ensuite. */}
                  <div className={s.squelette} aria-hidden>
                    <span className={`${s.sq} ${s.sqChapeau}`} />
                    <span className={`${s.sq} ${s.sqHero}`} />
                    <span className={`${s.sq} ${s.sqLigne}`} />
                    <span className={`${s.sq} ${s.sqLigne2}`} />
                    <span className={`${s.sq} ${s.sqMicro}`} />
                  </div>
                </>
              )}

              {etat.phase === 'indisponible' && (
                <p className={s.erreur}>
                  {etat.message || 'Le tarif n’a pas pu être confirmé.'}{' '}
                  <button type="button" className={s.lien} onClick={() => setTentative((n) => n + 1)}>
                    Réessayer
                  </button>
                </p>
              )}

              {etat.phase === 'connexion' && <p className={s.micro}>Connecte ton compte pour vérifier ton accès et les conditions de cette offre.</p>}
              {etat.phase === 'abonne' && etat.key === cleVisible && <p role="status" className={s.micro}>Ton abonnement est déjà actif. <a className={s.lien} href="/go">Ouvrir FOREAS Driver</a> ou <a className={s.lien} href="/abonnement">gérer mon abonnement</a>.</p>}
              {erreurLien && <p role="alert" className={s.erreur}>{erreurLien}</p>}
              {debit && (
                <>
                  {debit.essai && <p className={s.chapeau}>{debit.joursEssai} jours offerts</p>}

                  <div className={s.haut}>
                    <p className={`${s.hero} ${debit.essai ? s.heroGratuit : ''}`}>
                      {/* « 0 € » et non « 0,00 € » : sur le montant du jour, la
                          décimale affaiblit. */}
                      {debit.essai ? '0 €' : formaterEuros(montantAvecRemise(debit.montantAujourdhuiCentimes))}{' '}
                      <small>aujourd’hui</small>
                    </p>
                    {!debit.essai && (
                      <p className={s.duree}>{debit.moisEngages === 12 ? '12 mois' : '1 mois'}</p>
                    )}
                  </div>

                  {debit.essai && debit.premierDebitISO ? (
                    <>
                      <p className={s.franc}>
                        {/*
                          ⚠️ RACCOURCI POUR GAGNER UNE LIGNE, PAS POUR FAIRE JOLI.
                          « Renouvellement désactivable avant la fin, sans prélèvement »
                          passait à deux lignes à 390 px, donc trois avec la
                          première phrase — et le bouton d'action tombait sous la
                          ligne de flottaison. Le sens est intact : rien n'est pris
                          avant la date, et partir avant ne coûte rien.
                        */}
                        Aucun paiement avant le {dateFrancaise(debit.premierDebitISO)}.
                        <br />
                        Renouvellement désactivable, sans rien payer.
                      </p>
                      {/* L'unique mention du montant d'après. Petite, grise,
                          factuelle : c'est une obligation d'information, pas un
                          argument de vente. */}
                      {/*
                        ⚠️ LA REMISE A QUITTÉ LA CARTE D'OFFRE, ET C'EST UNE
                        DÉCISION DE MISE EN PAGE AUTANT QUE DE FOND.

                        Elle était un badge sous « / mois × 12 ». Deux défauts :
                         · elle rendait la carte annuelle PLUS HAUTE que la
                           mensuelle, et la grille égalisait les deux — donc le
                           carré mensuel se retrouvait avec un vide en bas, et
                           les deux prix ne s'alignaient plus ;
                         · elle réclamait de l'attention à l'instant du CHOIX,
                           alors que le chauffeur compare d'abord deux nombres.

                        Ici elle accompagne le montant, en gris, là où elle
                        répond à la seule question qu'elle traite : « pourquoi
                        249,99 plutôt que douze fois 29,99 ? »
                      */}
                      <p className={s.micro}>
                        Ensuite {formaterEuros(montantAvecRemise(debit.montantEnsuiteCentimes))} par{' '}
                        {debit.periodicite === 'an' ? 'an' : 'mois'}
                        {debit.periodicite === 'an' &&
                          `, soit ${ECONOMIE_ANNUELLE_PCT.toLocaleString('fr-FR')}\u202F% de moins qu’au mois`}
                        .
                      </p>
                    </>
                  ) : (
                    <>
                      {debit.periodicite === 'an' && (
                        <p className={s.apres}>Prélevé une fois par an.</p>
                      )}
                      {debit.referenceMensuelleCentimes !== null && (
                        <p className={s.eco}>
                          <span className={s.barre}>
                            {formaterEuros(debit.referenceMensuelleCentimes)}
                          </span>
                          <span className={s.vert}>
                            {formaterEuros(
                              debit.referenceMensuelleCentimes - debit.montantEnsuiteCentimes,
                            )}{' '}
                            économisés sur l’année
                          </span>
                        </p>
                      )}
                    </>
                  )}
                  {remiseCourante.pct > 0 && (
                    <p className={s.micro}>
                      {remiseCourante.heritee ? 'Remise du lien de parrainage : ' : 'Remise du code parrain : '}
                      {remiseCourante.pct} % {remiseCourante.forever ? 'à chaque renouvellement de cet abonnement.' : 'pendant ' + remiseCourante.months + ' mois.'}
                      {!remiseCourante.forever && <> Puis {formaterEuros(debit.montantEnsuiteCentimes)} par mois.</>}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* ══ LA ZONE DE PAIEMENT ══════════════════════════════════════
                ⚠️ ELLE EST LÀ DÈS LE CHARGEMENT. IL N'Y A PLUS DE BOUTON POUR
                L'OUVRIR — et c'est le premier des deux reproches de Chandler :
                « c'est de la friction en plus ». Un clic entre quelqu'un de
                décidé et son moyen de paiement, c'est un clic où l'on peut
                changer d'avis.

                ⚠️ ET ELLE N'EST PLUS UN GABARIT STRIPE. C'était le second
                reproche. Nos champs, notre ordre, notre bouton. Stripe ne
                dessine que l'intérieur du champ de carte — ce qu'il ne peut pas
                déléguer, et c'est justement ce qui fait que le numéro ne passe
                jamais par nos serveurs. */}
            <CompteAvantPaiement onAccount={compteChange} />
            {!entreePrete || entreeErreur || erreurLien || !comptePaiement || !debit ? null : REPLI_PANNEAU_STRIPE ? (
              <div className={s.zoneStripe}>
                <EmbeddedCheckoutProvider
                  key={cleVisible}
                  stripe={stripePromise}
                  options={{ fetchClientSecret: recupererClientSecret }}
                >
                  <EmbeddedCheckout />
                </EmbeddedCheckoutProvider>
              </div>
            ) : stripeKO ? (
              /* Le seul cas où l'on parle d'un problème technique au chauffeur :
                 quand il ne peut RIEN faire d'autre. On lui donne les deux
                 gestes qui marchent, pas une explication. */
              <p className={s.erreurPaiement} role="alert">
                Le paiement n’a pas pu se charger. Recharger la page, ou désactiver
                un bloqueur de publicité s’il y en a un.
              </p>
            ) : promesseSecret?.key === cleVisible ? (
              <CheckoutElementsProvider
                key={cleVisible}
                stripe={stripePromise}
                options={{
                  clientSecret: promesseSecret.promise,
                  /*
                    ⚠️ L'APPARENCE EST LE SEUL ENDROIT OÙ ON PARLE À STRIPE DU
                    STYLE, ET ELLE NE CONCERNE QUE LE CHAMP DE CARTE.
                    Tout le reste de cette page est à nous. Ces valeurs sont
                    reprises de la feuille de style du module : si l'une d'elles
                    change là-bas sans changer ici, le champ de carte se met à
                    jurer avec ce qui l'entoure — et personne ne verra pourquoi.
                  */
                  elementsOptions: {
                    appearance: {
                      variables: {
                        colorPrimary: '#1D4ED8',
                        colorBackground: '#FFFFFF',
                        colorText: '#0B0B0F',
                        colorDanger: '#B42318',
                        borderRadius: '12px',
                        spacingUnit: '4px',
                        fontFamily:
                          '-apple-system, BlinkMacSystemFont, "Inter", system-ui, sans-serif',
                        fontSizeBase: '15px',
                      },
                    },
                  },
                }}
              >
                <FormulairePaiement
                  emailCompte={comptePaiement.email}
                  onReessayer={() => setTentative(value => value + 1)}
                  libelleBouton={libelleCTA}
                  garanties={
                    debit?.essai
                      ? [
                          /* ⚠️ 28/08 — LE VOCABULAIRE DU PRÉLÈVEMENT EST PARTI.
                             Chandler : « pas de prélevé, tout le champ lexical lié à la
                             dopamine retiré, et des phrases affirmatives ». Ces lignes
                             disaient « prélevé » et « jamais débitée » : deux mots qui
                             parlent de ce qu'on lui prend, sur l'écran précis où il
                             donne sa carte. Elles disent la même chose, à l'endroit. */
                          '0 € aujourd’hui',
                          'Renouvellement désactivable',
                          `Premier paiement le ${dateFrancaise(debit.premierDebitISO ?? '')}`,
                        ]
                      : [
                          'Paiement unique aujourd’hui',
                          'Annulable depuis l’espace client',
                          'Traité par Stripe',
                        ]
                  }
                />
              </CheckoutElementsProvider>
            ) : null}

            <div className={s.pied}>
              <p className={s.piedA}>
                <Lock className="h-4 w-4 flex-none" style={{ color: '#15803D' }} aria-hidden />
                Paiement traité par Stripe.
              </p>
              {/* ⚠️ « ANNULABLE À TOUT MOMENT » EST FAUX À L'ANNÉE, et le fil
                  PIEUVRE le répète en WhatsApp : un clic coupe le
                  RENOUVELLEMENT, il n'arrête pas un paiement déjà passé. Écrite
                  sans cette nuance, la page contredisait la conversation — et
                  c'est le chauffeur qui découvrait l'écart, après avoir payé. */}
              <p className={s.piedB}>
                {formule === 'annuel'
                  ? 'Un clic coupe le renouvellement depuis l’espace client. L’année en cours va jusqu’à son terme.'
                  : 'Annulation à tout moment depuis l’espace client.'}
              </p>
              {/* ⚠️ LA CAISSE N'AVAIT AUCUNE PORTE. Un seul lien sur toute la
                  page, « Aller au contenu ». Celui qui arrive avec une question
                  devant le champ carte n'avait que deux gestes : payer, ou
                  partir. Ce lien est le troisième.
                  Origine `avant_paiement` : elle s'adresse précisément à celui
                  qui n'est PAS prêt, et le message le dit. Elle est déclarée
                  dans `whatsappLink.ts` ET `wa/route.ts` — jamais un seul des
                  deux, c'est le bug du 29/08. */}
              <a
                className={s.piedWa}
                href="/wa?s=avant_paiement&p=/tarifs3&i=question&o=caisse_sous_bouton"
                target="_blank"
                rel="noopener noreferrer"
              >
                Une question ? Écris à Ajnaya sur WhatsApp
              </a>
            </div>
          </section>
        </div>

        {/* ── LA VITRINE ─────────────────────────────────────────────────
            ⚠️ MÊME RÈGLE QUE LES PHRASES : ELLE SE FIGE PENDANT LE PAIEMENT.
            `foreas-copy-atomic` §6.8 : sur une page de paiement, zéro
            distraction. Une image qui change dans le coin de l'œil pendant
            une saisie de carte est exactement ça. Dès que le formulaire est
            touché, la rotation s'arrête — définitivement. */}
        <aside className={s.vitrine} aria-label="L’application en images">
          <div className={s.vitrineHalo} aria-hidden />
          <div className={s.vitrineCadre}>
            {/*
              ⚠️ UNE SEULE VIDÉO EST TÉLÉCHARGÉE À LA FOIS.
              `preload="none"` empêche le navigateur d'aller chercher les deux
              fichiers au chargement de la page — 595 Ko qu'on ferait payer à
              quelqu'un qui ne regardera peut-être jamais la seconde. La vidéo
              n'est demandée qu'au moment où elle devient visible, puis le cache
              la garde. L'image d'attente, elle, est là dès le départ : le cadre
              n'est jamais vide.

              ⚠️ `sizes` N'EST PAS FACULTATIF POUR LES IMAGES.
              Sans lui, la capture était servie en 210 px de large et affichée en
              268 — mesuré : un agrandissement de 28 %, mou sur un écran ordinaire.
              `sizes` annonce la largeur RÉELLE : le navigateur choisit la bonne
              variante et la double sur les écrans à forte densité.
            */}
            {VITRINE.map((v, i) =>
              v.video ? (
                <video
                  key={v.poster}
                  ref={(el) => {
                    videosRef.current[i] = el
                  }}
                  poster={v.poster}
                  muted
                  loop
                  playsInline
                  /*
                    ⚠️ `autoPlay` EN PLUS DU `play()` DE L'EFFET, ET PAS À LA PLACE.
                    Mesuré : avec le seul `play()` de l'effet, les deux vidéos
                    restaient en pause — la promesse rendue par `play()` peut être
                    rejetée silencieusement selon l'état de l'onglet, et un rejet
                    avalé ne laisse aucune trace. L'attribut, lui, est traité par
                    le navigateur au moment où il décide, pas au moment où React
                    le lui demande. Les deux ensemble : l'attribut lance, l'effet
                    met en pause celles qu'on ne regarde pas.
                    `muted` + `playsInline` sont la condition pour que la lecture
                    automatique soit autorisée — sans eux, elle est refusée partout.
                  */
                  autoPlay
                  preload="none"
                  aria-label={v.alt}
                  className={`${s.vitrineImage} ${i === iVitrine ? s.vitrineVisible : ''}`}
                >
                  <source src={v.video} type="video/mp4" />
                </video>
              ) : (
                <Image
                  key={v.poster}
                  src={v.poster}
                  alt={v.alt}
                  width={v.largeur}
                  height={v.hauteur}
                  className={`${s.vitrineImage} ${i === iVitrine ? s.vitrineVisible : ''}`}
                  sizes="240px"
                />
              ),
            )}
          </div>

          <div className={s.vitrineTexte} aria-live="polite">
            <h2 className={s.vitrineTitre}>{VITRINE[iVitrine].titre}</h2>
            <p className={s.vitrineDesc}>{VITRINE[iVitrine].description}</p>
          </div>

          {VITRINE.length > 1 && (
            <div className={s.vitrinePastilles} role="tablist" aria-label="Choisir la fonctionnalité">
              {VITRINE.map((v, i) => (
                <button
                  key={v.poster}
                  type="button"
                  role="tab"
                  aria-selected={i === iVitrine}
                  aria-label={v.titre}
                  className={`${s.pastille} ${i === iVitrine ? s.pastilleActive : ''}`}
                  onClick={() => {
                    setIVitrine(i)
                    /* Un choix manuel arrête la rotation : on ne reprend pas
                       la main sur quelqu'un qui vient de la prendre. */
                    setFigee(true)
                  }}
                />
              ))}
            </div>
          )}
        </aside>
        </div>
      </div>
    </main>
  )
}

'use client'

import { Fragment, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { Check, Lock } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js'
import { CheckoutElementsProvider } from '@stripe/react-stripe-js/checkout'
import FormulairePaiement from './FormulairePaiement'
import { formaterEuros } from '@/lib/offre'
import {
  TUNNEL_SITE_IMMEDIAT,
  ECONOMIE_ANNUELLE_PCT,
  EQUIVALENT_MENSUEL_ANNUEL_CENTIMES,
  PRIX_MENSUEL_AFFICHE_CENTIMES,
  planPourCheckout,
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
/** L'annuel est retenu par défaut — exigence explicite du brief. */
const FORMULE_PAR_DEFAUT: Formule = 'annuel'

/** Durée d'affichage d'une phrase, puis durée de son effacement. */
const PHRASE_TENUE_MS = 5200
const PHRASE_SORTIE_MS = 520

type EtatTarif =
  | { phase: 'chargement' }
  | { phase: 'pret'; debit: DebitDuJour }
  | { phase: 'indisponible' }

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



  /**
   * ⚠️ LA MÊME TENTATIVE, PAS UNE NOUVELLE.
   * Le brief : « Empêcher le double appui et la création de deux sessions.
   * Garder la même tentative lors d'une reprise réseau. » Une session déjà
   * ouverte pour une formule est conservée ici : refermer puis rouvrir le
   * panneau rend SA session, pas une seconde qui laisserait derrière elle une
   * tentative fantôme dans le tableau de bord Stripe à chaque hésitation.
   */
  const sessions = useRef<Map<Formule, string>>(new Map())


  // ── Le tarif, confirmé par le serveur ──────────────────────────────────────
  useEffect(() => {
    let annule = false
    setEtat({ phase: 'chargement' })

    fetch(`/api/checkout/politique?formule=${formule}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: DebitDuJour & { confirmeParLeServeur?: boolean }) => {
        if (annule) return
        /**
         * ⚠️ On exige le drapeau. Une réponse 200 dont le corps n'est pas celui
         * qu'on attend — page d'erreur d'un intermédiaire, réponse mise en cache
         * par un proxy — ne doit pas être lue comme une confirmation.
         */
        if (!data?.confirmeParLeServeur) return setEtat({ phase: 'indisponible' })
        setEtat({ phase: 'pret', debit: data })
      })
      .catch(() => {
        if (!annule) setEtat({ phase: 'indisponible' })
      })

    return () => {
      annule = true
    }
  }, [formule, tentative])

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

  // ── Le paiement ────────────────────────────────────────────────────────────
  const choisirFormule = useCallback((f: Formule) => {
    setFormule(f)
    /**
     * Changer de formule change le montant. Laisser Stripe ouvert afficherait
     * l'ancien prix pendant que le récapitulatif affiche le nouveau : deux
     * montants à l'écran au même instant, c'est le début d'un litige.
     */
  }, [])

  const recupererClientSecret = useCallback(async (): Promise<string> => {
    const deja = sessions.current.get(formule)
    if (deja) return deja

    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan: planPourCheckout(formule),
        mode: REPLI_PANNEAU_STRIPE ? 'embedded' : 'elements',
        /**
         * ⚠️ CECI EST LA DEMANDE, PAS L'AFFICHAGE. Ce booléen dit au serveur quel
         * tunnel emprunter. Ce que la page MONTRE vient de la réponse de
         * `/api/checkout/politique`. Confondre les deux, c'est laisser le
         * navigateur se répondre à lui-même.
         */
        immediate: TUNNEL_SITE_IMMEDIAT,
      }),
    })

    const data = await res.json().catch(() => null)
    if (!res.ok || !data?.clientSecret) throw new Error(data?.error || `checkout_${res.status}`)

    sessions.current.set(formule, data.clientSecret as string)
    return data.clientSecret as string
  }, [formule])

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
  const [promesseSecret, setPromesseSecret] = useState<Promise<string> | null>(null)
  useEffect(() => {
    if (REPLI_PANNEAU_STRIPE) return
    setPromesseSecret(recupererClientSecret())
  }, [recupererClientSecret])

  // ── Rendu ──────────────────────────────────────────────────────────────────
  const debit = etat.phase === 'pret' ? etat.debit : null
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
    /** Découpe aux fins de phrase : un point suivi d'une espace. */
    const segments = texte.split(/(?<=\.)\s+/).filter(Boolean)
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

        <h1 className={s.titre}>Gagner mieux, plus simplement.</h1>

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
                  Le tarif n’a pas pu être confirmé.{' '}
                  <button type="button" className={s.lien} onClick={() => setTentative((n) => n + 1)}>
                    Réessayer
                  </button>
                </p>
              )}

              {debit && (
                <>
                  {debit.essai && <p className={s.chapeau}>{debit.joursEssai} jours offerts</p>}

                  <div className={s.haut}>
                    <p className={`${s.hero} ${debit.essai ? s.heroGratuit : ''}`}>
                      {/* « 0 € » et non « 0,00 € » : sur le montant du jour, la
                          décimale affaiblit. */}
                      {debit.essai ? '0 €' : formaterEuros(debit.montantAujourdhuiCentimes)}{' '}
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
                          « Annulation en un clic avant la fin, sans prélèvement »
                          passait à deux lignes à 390 px, donc trois avec la
                          première phrase — et le bouton d'action tombait sous la
                          ligne de flottaison. Le sens est intact : rien n'est pris
                          avant la date, et partir avant ne coûte rien.
                        */}
                        Rien n’est prélevé avant le {dateFrancaise(debit.premierDebitISO)}.
                        <br />
                        Annulable en un clic, sans rien payer.
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
                        Ensuite {formaterEuros(debit.montantEnsuiteCentimes)} par{' '}
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
            {REPLI_PANNEAU_STRIPE ? (
              <div className={s.zoneStripe}>
                <EmbeddedCheckoutProvider
                  key={formule}
                  stripe={stripePromise}
                  options={{ fetchClientSecret: recupererClientSecret }}
                >
                  <EmbeddedCheckout />
                </EmbeddedCheckoutProvider>
              </div>
            ) : promesseSecret ? (
              <CheckoutElementsProvider
                key={formule}
                stripe={stripePromise}
                options={{
                  clientSecret: promesseSecret,
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
                  libelleBouton={libelleCTA}
                  garanties={
                    debit?.essai
                      ? [
                          '0 € prélevé aujourd’hui',
                          'Annulable en un clic',
                          `Carte demandée, jamais débitée avant le ${dateFrancaise(debit.premierDebitISO ?? '')}`,
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
              <p className={s.piedB}>Annulation à tout moment depuis l’espace client.</p>
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

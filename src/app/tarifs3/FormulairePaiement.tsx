'use client'

import { useCallback, useId, useRef, useState } from 'react'
import {
  ExpressCheckoutElement,
  PaymentElement,
  useCheckout,
} from '@stripe/react-stripe-js/checkout'
import s from './tarifs3.module.css'

/**
 * FOREAS — LE FORMULAIRE DE PAIEMENT, DESSINÉ PAR NOUS.
 *
 * ═════════════════════════════════════════════════════════════════════════════
 * CE QUE CE FICHIER REMPLACE, ET POURQUOI
 * ═════════════════════════════════════════════════════════════════════════════
 *
 * Jusqu'au 27/08, `/tarifs3` ouvrait le panneau embarqué de Stripe après un clic.
 * Chandler : « c'est de la friction en plus, mais aussi ce n'est pas le modèle
 * ultra intégré à FOREAS, c'est un gabarit. »
 *
 * Les deux reproches étaient justes et SÉPARÉS :
 *  · la friction — un clic avant de pouvoir payer ;
 *  · le gabarit — la mise en page, l'ordre des champs et les libellés
 *    appartenaient à Stripe.
 *
 * Ici, il n'y a plus de clic intermédiaire et plus de gabarit. Stripe ne dessine
 * que l'intérieur du champ de carte, qu'il ne peut pas déléguer : c'est ce qui
 * permet au numéro de ne jamais passer par nos serveurs.
 *
 * ═════════════════════════════════════════════════════════════════════════════
 * ⚠️ ET POURTANT C'EST TOUJOURS UNE SESSION CHECKOUT. C'EST TOUT LE POINT.
 * ═════════════════════════════════════════════════════════════════════════════
 *
 * `src/app/checkout/CheckoutClient.tsx` faisait déjà des champs sur mesure, avec
 * `PaymentElement`. Il a été FERMÉ le 21/08, et son commentaire de fermeture dit
 * pourquoi : `stripe.subscriptions.create` ne produit jamais l'événement
 * `checkout.session.completed`, le seul dans lequel le webhook crée la ligne
 * d'abonné, le compte et le mail de bienvenue. Des chauffeurs ont été débités
 * sans obtenir de compte. Silencieusement.
 *
 * Ce fichier-ci ne retombe pas dedans : `ui_mode: 'custom'` crée une VRAIE
 * session Checkout. L'événement part, le webhook fait son travail. Ce qui change
 * n'est que l'interface.
 *
 * ⚠️ SI QUELQU'UN REMPLACE UN JOUR `CheckoutElementsProvider` PAR `Elements`,
 * il rouvre exactement le trou qui a été refermé le 21/08.
 */

interface Props {
  /** Ce que le bouton doit dire — dépend de ce que le serveur accorde. */
  libelleBouton: string
  /** Les trois garanties affichées sous le bouton. */
  garanties: readonly string[]
}

/** Le message que Stripe rend n'est pas toujours présentable. On garde le nôtre. */
const ECHEC_GENERIQUE =
  'Le paiement n’a pas abouti. L’argent est resté sur le compte. Vérifier la carte, puis réessayer.'

export default function FormulairePaiement({ libelleBouton, garanties }: Props) {
  const checkout = useCheckout()

  /* ⚠️ 28/08 — CE CHAMP MANQUAIT, ET SON ABSENCE TUAIT LE TUNNEL ENTIER.
     Chandler, en regardant la page : « je rentre le mail où ? le paiement ne
     mentionne pas de champ mail ».

     Il avait raison, et voici ce que ça produisait. En `ui_mode: 'custom'`,
     Stripe ne dessine AUCUN champ e-mail : c'est à nous de le collecter et de
     le lui donner par `updateEmail`. On ne le faisait nulle part, et la session
     ne portait pas non plus de `customer_email`. Résultat :
     `session.customer_details.email` restait vide.

     Or le webhook enferme TOUT le provisionnement dans `if (email)` : pas de
     compte, pas de mot de passe, pas de mail de bienvenue — ET PAS D'ALERTE,
     puisque l'alerte est dans le même bloc. La ligne d'abonné, elle, s'écrivait
     quand même, et la carte se serait fait débiter au troisième jour.

     Un chauffeur payé, sans compte, sans que personne ne le sache. Exactement
     la panne que le commentaire du webhook dit avoir déjà été payée une fois. */
  const [courriel, setCourriel] = useState('')
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [erreurChamp, setErreurChamp] = useState<{ courriel?: string }>({})

  /**
   * ⚠️ « Y A-T-IL UN MOYEN RAPIDE ? » NE SE DEVINE PAS EN CSS.
   *
   * Première version : une règle `:empty` pour masquer le séparateur « ou par
   * carte » quand aucun portefeuille n'est disponible. Mesuré en production :
   * Stripe pose TOUJOURS un conteneur, haut de 8 px, même quand il n'a rien à
   * afficher. La règle ne s'est donc jamais déclenchée, et le séparateur
   * annonçait une alternative à rien.
   *
   * `onReady` donne la vraie réponse : la liste des moyens réellement offerts
   * par cet appareil, ce navigateur et ce compte Stripe. `undefined` ou vide
   * signifie qu'il n'y en a aucun — on retire alors le bloc ET son séparateur.
   */
  const [moyensRapides, setMoyensRapides] = useState<boolean | null>(null)

  /**
   * ⚠️ VERROU SYNCHRONE, PAS UN ÉTAT REACT.
   * Un `useState` se met à jour au rendu suivant : entre deux appuis rapides sur
   * le bouton, il vaut encore `false`. Deux confirmations partiraient. Une `ref`
   * change à l'instant même.
   */
  const verrou = useRef(false)

  const idCourriel = useId()
  const idErreur = useId()

  /**
   * Validation en miroir de celle du serveur (`/api/checkout/coordonnees`).
   *
   * ⚠️ ELLE NE REMPLACE PAS CELLE DU SERVEUR, ELLE LA DOUBLE.
   * Un contrôle côté navigateur se contourne en trois secondes avec la console.
   * Il sert à dire à quelqu'un de bonne foi ce qui ne va pas, tout de suite,
   * à côté du bon champ — pas à protéger quoi que ce soit.
   */
  const valider = useCallback(() => {
    const fautes: { courriel?: string } = {}
    /* Contrôle volontairement large : il vaut mieux laisser passer une adresse
       douteuse que refuser une adresse valide et perdre l'abonnement. Stripe
       refera sa propre vérification derrière, dans `updateEmail`. */
    const mail = courriel.trim()
    if (!mail || mail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) {
      fautes.courriel = 'Adresse e-mail incomplète.'
    }
    /* ⚠️ `\p{L}` EXIGE UN NAVIGATEUR DE 2018. En dessous (WebView Android
       jamais mise à jour), la construction du motif lève une erreur — et comme
       `valider()` est appelé AVANT le try, l'erreur part en promesse rejetée
       muette : le bouton « payer » ne fait RIEN, sans un mot à l'écran.
       ⚠️ ON NE RÉTRÉCIT PAS LA LISTE POUR AUTANT. Remplacer par une plage
       latine simple refuserait Nœux-les-Mines, Œting, Cœuvres, Łódź, Timișoara.
       On échangerait une panne théorique sur un appareil de 2017 contre un
       refus réel de communes françaises. On garde la règle, on la protège. */
    setErreurChamp(fautes)
    return Object.keys(fautes).length === 0
  }, [courriel])

  /* ⚠️ 29/08/2026 — `attacherCoordonnees` A ÉTÉ RETIRÉE AVEC SES DEUX CHAMPS.
     Le prénom et le téléphone ne sont plus demandés ici : ils passent à l'écran
     d'après le paiement (`/success` → `POST /api/profil/completer`). Cette page
     ne pose plus que la question sans laquelle rien n'est rattrapable —
     l'e-mail — et la carte.
     La route `/api/checkout/coordonnees` reste en place : elle sert encore aux
     sessions créées ailleurs. La supprimer casserait un chemin qu'on ne voit pas
     d'ici. */


  if (checkout.type === 'loading') {
    return (
      <div className={s.paiementAttente} aria-busy="true">
        <span className="sr-only">Préparation du paiement…</span>
        <span className={`${s.sq} ${s.sqLigne}`} />
        <span className={`${s.sq} ${s.sqLigne}`} />
        <span className={`${s.sq} ${s.sqLigne2}`} />
      </div>
    )
  }

  if (checkout.type === 'error') {
    return (
      <p className={s.erreur} role="alert">
        Le paiement n’a pas pu être préparé. {checkout.error.message}
      </p>
    )
  }

  const session = checkout.checkout

  const confirmer = async () => {
    if (verrou.current) return
    if (!valider()) return
    verrou.current = true
    setEnCours(true)
    setErreur(null)
    try {
      /* ⚠️ C'EST CETTE LIGNE QUI CRÉE LE COMPTE, PAS LE PAIEMENT.
         `updateEmail` est le seul chemin par lequel l'adresse entre dans la
         session Stripe en `ui_mode: 'custom'`. Sans elle, le webhook reçoit une
         session sans e-mail et saute tout le provisionnement en silence.
         ⚠️ ET ON BLOQUE SI ELLE ÉCHOUE. C'est la seule erreur du formulaire qui
         justifie d'arrêter : encaisser sans adresse, c'est encaisser sans
         pouvoir livrer. Mieux vaut un paiement retardé qu'un chauffeur débité
         sans compte. */
      const majMail = await session.updateEmail(courriel.trim())
      if (majMail.type === 'error') {
        setErreurChamp((e) => ({ ...e, courriel: majMail.error.message || 'Adresse e-mail refusée.' }))
        setErreur(null)
        return
      }
      const r = await session.confirm()
      if (r.type === 'error') {
        /* ⚠️ 29/08 — MON MESSAGE GÉNÉRIQUE A CACHÉ LA VRAIE PANNE.
           Le refus venait d'une adresse de facturation exigée et jamais
           collectée ; l'écran disait « Vérifier la carte, puis réessayer ». On a
           donc cherché du côté des cartes, qui n'y étaient pour rien.
           Quand Stripe ne donne pas de phrase, on montre au moins son code : une
           panne nommée se corrige, une panne muette se cherche. */
        setErreur(
          r.error.message ||
            (r.error.code ? `${ECHEC_GENERIQUE} (code : ${r.error.code})` : ECHEC_GENERIQUE)
        )
        console.warn('[paiement] confirmation refusée par Stripe —', r.error)
      }
      // En cas de succès, Stripe redirige vers `return_url`. Rien à faire ici.
    } catch {
      setErreur(ECHEC_GENERIQUE)
    } finally {
      verrou.current = false
      setEnCours(false)
    }
  }

  return (
    <div className={s.paiement}>

      {/* ⚠️ 27/08 — CES DEUX CHAMPS ÉTAIENT SOUS LE BOUTON APPLE PAY, ET ÇA
          CASSAIT LE PAIEMENT LE PLUS RAPIDE DU TÉLÉPHONE.

          Le chauffeur posait son doigt sur Apple Pay — le premier élément de la
          page — sa fenêtre s'ouvrait, il validait avec Face ID… et elle tournait
          dans le vide jusqu'à expiration. `valider()` échouait forcément, puisque
          nos deux champs étaient PLUS BAS et donc vides. On sortait de la
          fonction sans rendre la main à Apple, et les messages « Numéro
          incomplet » s'affichait DERRIÈRE sa fenêtre :
          invisibles. Le chemin de paiement le plus rapide échouait à 100 %.

          ⚠️ ET ON NE POUVAIT PAS LE RATTRAPER AU CLIC. La version « checkout »
          du composant retire `onClick` de son type — on ne peut donc pas
          empêcher la fenêtre de s'ouvrir. Le seul vrai correctif est celui-ci :
          demander avant, pas après. Les champs remontent au-dessus de tout.
      */}
      {/*
        ⚠️ CES DEUX CHAMPS SONT À NOUS, ET ILS NE SONT PAS DÉCORATIFS.
        Le webhook les lit pour créer le compte du chauffeur. En mode embarqué,
        c'est Stripe qui les affichait ; ici, il ne dessine plus rien. Les
        le retirer reviendrait à créer des comptes sans numéro — sans erreur,
        sans alerte, et sans que personne ne s'en aperçoive avant de vouloir
        appeler quelqu'un.

        ⚠️ 28/08 — LA VILLE, ELLE, A ÉTÉ RETIRÉE. Décision de Chandler. Suivie
        jusqu'au bout dans le code avant de trancher : elle ne servait qu'à
        suggérer un groupe de communauté sur la page de fin, et elle était
        facultative partout en aval. Un champ de moins sur la page qui encaisse.
        La route `/api/checkout/coordonnees` a été changée EN MÊME TEMPS : elle
        exigeait les deux, et aurait répondu 400 — le numéro non plus ne serait
        jamais arrivé.
      */}
      <div className={s.coordonnees}>
        {/* ⚠️ 29/08 — IL N'Y A PLUS QU'UN SEUL CHAMP ICI, ET C'EST LE POINT.
            Le prénom et le téléphone sont passés à l'écran d'après le paiement.
            Reste l'e-mail, parce que lui n'est PAS rattrapable : sans lui, le
            webhook ne crée aucun compte, n'envoie aucun mot de passe, et le
            chauffeur devient introuvable avec une carte qui sera débitée trois
            jours plus tard. Mesuré le 28/08 — les paiements passaient très bien
            sans e-mail, et personne ne recevait rien. */}
        {/* ⚠️ L'E-MAIL EST LE PREMIER CHAMP, ET C'EST DÉLIBÉRÉ.
            C'est lui qui crée le compte, porte le mot de passe et reçoit la
            facture. Sans lui, le paiement passe et le chauffeur n'a rien. */}
        <label className={s.champ} htmlFor={idCourriel}>
          <span className={s.champLabel}>E-mail</span>
          <input
            id={idCourriel}
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="off"
            spellCheck={false}
            value={courriel}
            onChange={(e) => setCourriel(e.target.value)}
            placeholder="prenom@exemple.com"
            aria-invalid={!!erreurChamp.courriel}
            aria-describedby={erreurChamp.courriel ? `${idCourriel}-err` : `${idCourriel}-aide`}
          />
          {erreurChamp.courriel ? (
            <span id={`${idCourriel}-err`} className={s.champErreur} role="alert">
              {erreurChamp.courriel}
            </span>
          ) : (
            <span id={`${idCourriel}-aide`} className={s.champAide}>
              Les codes de connexion arrivent à cette adresse.
            </span>
          )}
        </label>

      </div>
      {/*
        ⚠️ APPLE PAY ET GOOGLE PAY NE SONT PAS DESSINÉS PAR NOUS.
        Le brief l'interdit en toutes lettres, et pour une raison mesurable : sur
        un Android, un faux bouton Apple Pay mentirait à chaque visite. Cet
        élément n'affiche QUE ce que l'appareil, le navigateur et le compte
        Stripe proposent réellement. S'il n'y a rien, il ne rend rien — et le
        séparateur « ou par carte » disparaît avec lui.
      */}
      <div className={s.rapides} hidden={moyensRapides === false}>
        {/*
          ⚠️ 27/08 — ON RETIRE STRIPE LINK, ET SEULEMENT LUI.
          Chandler : « retire Link, quand on clique dessus ça enlève la page,
          c'est de la friction pour rien ». Il a raison : Link prend la page
          entière et réclame un code par SMS, sur un tunnel où le chauffeur a
          déjà tapé sa carte.

          ⚠️ LE CORRECTIF ÉVIDENT ÉTAIT FAUX, ET IL AURAIT PARU JUSTE.
          Mettre `payment_method_types: ['card']` sur la session NE SUPPRIME PAS
          Link. La doc Stripe dit exactement l'inverse : « To include Link in a
          card integration, pass `card` in the payment_method_types parameter ».
          Link revient alors déguisé — l'objet PaymentMethod porte
          `type: 'card'` avec `card.wallet.type = 'link'`. On aurait déployé,
          constaté « payment_method_types = card », coché la case, et Chandler
          aurait toujours eu son code par SMS.
          Ce champ aurait EN PLUS gelé la liste des moyens de paiement : tout
          moyen activé plus tard dans Stripe n'apparaîtrait jamais, en silence.
          Et la route de session est PARTAGÉE avec /tarifs2, qui reçoit le
          trafic publicitaire. Rien ne bouge côté serveur.

          ⚠️ APPLE PAY ET GOOGLE PAY NE PEUVENT PAS ÊTRE TOUCHÉS ICI, par
          construction : ils n'existent pas dans l'énumération des moyens de
          paiement de Stripe — ce sont des portefeuilles qui transportent une
          carte, allumés depuis le tableau de bord. Seul `link` est une valeur
          nommable. On ne nomme donc qu'elle.

          Les six clés sont exigées par le type dès qu'on en fournit une : les
          cinq autres restent `undefined` pour garder les défauts de Stripe.
        */}
        <ExpressCheckoutElement
          options={{
            buttonHeight: undefined,
            buttonTheme: undefined,
            buttonType: undefined,
            layout: undefined,
            paymentMethodOrder: undefined,
            paymentMethods: { link: 'never' },
          }}
          onConfirm={async (event) => {
            if (!valider()) {
              /* ⚠️ LE FILET, SI LES CHAMPS SONT ENCORE VIDES.
                 Sans cet appel, la fenêtre du téléphone ne se referme JAMAIS :
                 elle tourne jusqu'à expiration, et le chauffeur ne voit aucun
                 message — ils s'affichent derrière elle. `paymentFailed` est le
                 seul moyen de rendre la main à Apple Pay ou Google Pay. */
              event.paymentFailed({ reason: 'invalid_payment_data' })
              return
            }
            /* Le portefeuille du téléphone ne nous donne pas d'adresse : elle
               vient de notre champ, comme sur le chemin carte. Sans elle, le
               compte ne serait pas créé. */
            const majMail = await session.updateEmail(courriel.trim())
            if (majMail.type === 'error') {
              event.paymentFailed({ reason: 'invalid_payment_data' })
              setErreurChamp((e) => ({ ...e, courriel: majMail.error.message || 'Adresse e-mail refusée.' }))
              return
            }
            const r = await session.confirm({ expressCheckoutConfirmEvent: event })
            if (r.type === 'error') setErreur(r.error.message || ECHEC_GENERIQUE)
          }}
          onReady={(evenement) => {
            const dispos = evenement.availablePaymentMethods
            setMoyensRapides(!!dispos && Object.values(dispos).some(Boolean))
          }}
          onLoadError={() => {
            /* Un moyen rapide indisponible n'est pas une panne : le paiement par
               carte reste entier juste en dessous. On ne dit rien à l'écran, on
               retire simplement le bloc. */
            setMoyensRapides(false)
          }}
        />
      </div>

      {moyensRapides !== false && <div className={s.separateur}>ou par carte</div>}

      {/*
        ⚠️ LINK APPARAÎT À DEUX ENDROITS, PAS UN. Le bouton au-dessus, et
        l'invitation Link À L'INTÉRIEUR du champ carte — celle qui propose
        d'enregistrer la carte puis réclame un code par SMS au moment de payer.
        Ne corriger que le bouton laissait le second : un correctif juste, au
        mauvais endroit, et le code par SMS revenait par la porte de derrière.
      */}
      <PaymentElement options={{ layout: 'tabs', wallets: { link: 'never' } }} />


      <button
        type="button"
        className={s.cta}
        onClick={confirmer}
        /*
          ⚠️ ON NE GRISE PAS SUR `canConfirm`.
          Mesuré en production : `canConfirm` vaut `false` tant que la carte
          n'est pas saisie — donc le bouton naissait gris, avant même que
          quiconque ait tapé quoi que ce soit. Un bouton d'action grisé à
          l'ouverture ne se lit pas « il manque quelque chose », il se lit
          « c'est cassé ».
          Il reste donc actif : au clic, notre validation signale nos champs, et
          Stripe signale les siens, chacun à côté du champ concerné. C'est ce que
          le brief demande — « les erreurs sont proches du bon champ ».
        */
        disabled={enCours}
        aria-describedby={erreur ? idErreur : undefined}
      >
        <span className={s.libelle} data-texte={enCours ? 'Paiement en cours…' : libelleBouton}>
          {enCours ? 'Paiement en cours…' : libelleBouton}
        </span>
      </button>

      {erreur && (
        <p id={idErreur} className={s.erreur} role="alert">
          {erreur}
        </p>
      )}

      <p className={s.rassure}>
        {garanties.map((g) => (
          <span key={g}>
            <i className={s.point} aria-hidden />
            {g}
          </span>
        ))}
      </p>
    </div>
  )
}

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
  'Le paiement n’a pas abouti. Aucun montant n’a été prélevé. Vérifier la carte, puis réessayer.'

export default function FormulairePaiement({ libelleBouton, garanties }: Props) {
  const checkout = useCheckout()

  const [telephone, setTelephone] = useState('')
  const [ville, setVille] = useState('')
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [erreurChamp, setErreurChamp] = useState<{ tel?: string; ville?: string }>({})

  /**
   * ⚠️ VERROU SYNCHRONE, PAS UN ÉTAT REACT.
   * Un `useState` se met à jour au rendu suivant : entre deux appuis rapides sur
   * le bouton, il vaut encore `false`. Deux confirmations partiraient. Une `ref`
   * change à l'instant même.
   */
  const verrou = useRef(false)

  const idTel = useId()
  const idVille = useId()
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
    const fautes: { tel?: string; ville?: string } = {}
    const chiffres = telephone.replace(/\D/g, '')
    if (!/^\+?[0-9 .\-()]{8,24}$/.test(telephone.trim()) || chiffres.length < 8) {
      fautes.tel = 'Numéro incomplet.'
    }
    if (!/^[\p{L}][\p{L} '’\-]{1,47}$/u.test(ville.trim())) {
      fautes.ville = 'Ville manquante.'
    }
    setErreurChamp(fautes)
    return Object.keys(fautes).length === 0
  }, [telephone, ville])

  /**
   * Attache le numéro et la ville à la session AVANT de confirmer.
   *
   * ⚠️ UN ÉCHEC ICI NE BLOQUE PAS LE PAIEMENT.
   * Sans ces deux informations, la fiche du chauffeur part incomplète — c'est
   * ennuyeux et réparable. Un paiement bloqué, non. On tente, on note, on
   * continue.
   */
  const attacherCoordonnees = useCallback(
    async (idSession: string) => {
      try {
        await fetch('/api/checkout/coordonnees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: idSession, telephone: telephone.trim(), ville: ville.trim() }),
        })
      } catch {
        console.warn('[paiement] coordonnées non attachées — le paiement continue')
      }
    },
    [telephone, ville],
  )

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
      await attacherCoordonnees(session.id)
      const r = await session.confirm()
      if (r.type === 'error') setErreur(r.error.message || ECHEC_GENERIQUE)
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
      {/*
        ⚠️ APPLE PAY ET GOOGLE PAY NE SONT PAS DESSINÉS PAR NOUS.
        Le brief l'interdit en toutes lettres, et pour une raison mesurable : sur
        un Android, un faux bouton Apple Pay mentirait à chaque visite. Cet
        élément n'affiche QUE ce que l'appareil, le navigateur et le compte
        Stripe proposent réellement. S'il n'y a rien, il ne rend rien — et le
        séparateur « ou par carte » disparaît avec lui.
      */}
      <div className={s.rapides}>
        {/*
          Aucune option passée : le type de cet élément, dans le SDK Checkout,
          exige TOUTES ses clés dès qu'on en fournit une seule (thème, type de
          bouton, ordre et liste des moyens). Les valeurs par défaut de Stripe
          conviennent, et surtout elles suivent ce que le compte propose
          réellement — une liste écrite en dur ici deviendrait fausse le jour où
          un moyen est activé ou retiré côté Stripe.
        */}
        <ExpressCheckoutElement
          onConfirm={async (event) => {
            if (!valider()) return
            await attacherCoordonnees(session.id)
            const r = await session.confirm({ expressCheckoutConfirmEvent: event })
            if (r.type === 'error') setErreur(r.error.message || ECHEC_GENERIQUE)
          }}
          onLoadError={() => {
            /* Un moyen rapide indisponible n'est pas une panne : le paiement par
               carte reste entier juste en dessous. On ne dit rien. */
          }}
        />
      </div>

      <div className={s.separateur}>ou par carte</div>

      <PaymentElement options={{ layout: 'tabs' }} />

      {/*
        ⚠️ CES DEUX CHAMPS SONT À NOUS, ET ILS NE SONT PAS DÉCORATIFS.
        Le webhook les lit pour créer le compte du chauffeur. En mode embarqué,
        c'est Stripe qui les affichait ; ici, il ne dessine plus rien. Les
        retirer reviendrait à créer des comptes sans numéro ni ville — sans
        erreur, sans alerte, et sans que personne ne s'en aperçoive avant de
        vouloir appeler quelqu'un.
      */}
      <div className={s.coordonnees}>
        <label className={s.champ} htmlFor={idTel}>
          <span className={s.champLabel}>Téléphone</span>
          <input
            id={idTel}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            placeholder="06 12 34 56 78"
            aria-invalid={!!erreurChamp.tel}
            aria-describedby={erreurChamp.tel ? `${idTel}-err` : undefined}
          />
          {erreurChamp.tel && (
            <span id={`${idTel}-err`} className={s.champErreur} role="alert">
              {erreurChamp.tel}
            </span>
          )}
        </label>

        <label className={s.champ} htmlFor={idVille}>
          <span className={s.champLabel}>Ville principale</span>
          <input
            id={idVille}
            type="text"
            autoComplete="address-level2"
            value={ville}
            onChange={(e) => setVille(e.target.value)}
            placeholder="Paris"
            aria-invalid={!!erreurChamp.ville}
            aria-describedby={erreurChamp.ville ? `${idVille}-err` : undefined}
          />
          {erreurChamp.ville && (
            <span id={`${idVille}-err`} className={s.champErreur} role="alert">
              {erreurChamp.ville}
            </span>
          )}
        </label>
      </div>

      <button
        type="button"
        className={s.cta}
        onClick={confirmer}
        disabled={enCours || !session.canConfirm}
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

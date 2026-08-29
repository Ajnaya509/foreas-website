import { notFound } from 'next/navigation'
import CorpsSucces from '../success/CorpsSucces'

/**
 * APERÇU DE LA PAGE D'APRÈS-PAIEMENT — AVEC DES DONNÉES FABRIQUÉES.
 *
 * ⚠️ POURQUOI CETTE PAGE EXISTE.
 * `/success` exige une vraie session Stripe, donc un vrai paiement. Sa mise en
 * page ne peut donc pas être REGARDÉE avant d'être expédiée — et une page
 * cassée à la dernière étape de l'entonnoir se paie cher. Le corps de `/success`
 * vit dans son propre fichier précisément pour pouvoir être rendu ici.
 *
 * Ce n'est pas une copie : c'est LE composant que la vraie page utilise. Ce
 * qu'on regarde est donc ce qui part.
 *
 * ⚠️ INTROUVABLE EN PRODUCTION, ET CE N'EST PAS UNE PRÉCAUTION DÉCORATIVE.
 * Une page qui annonce « Bienvenue » et « ton abonnement est actif » avec des
 * données inventées, accessible publiquement, serait indiscernable d'une vraie
 * confirmation pour qui tombe dessus. Elle répond 404 hors développement.
 *
 * ⚠️ LE FORMULAIRE Y EST VIVANT. Son identifiant de session est volontairement
 * faux : appuyer sur « Enregistrer » ici obtient un refus du serveur, ce qui est
 * le comportement voulu. On regarde la mise en page, on n'écrit rien.
 */
export const dynamic = 'force-dynamic'

export default function ApercuSucces() {
  if (process.env.NODE_ENV === 'production') notFound()

  const dansTroisJours = Math.floor(Date.now() / 1000) + 3 * 24 * 3600

  return (
    <CorpsSucces
      /* Vide, exprès : c'est l'état réel juste après un paiement, tant que
         l'écran 2 n'a pas été rempli. C'est CE cas qu'il faut regarder. */
      firstName=""
      customerEmail="apercu@example.com"
      trialEndUnix={dansTroisJours}
      trialEndFormatted="lundi 1 septembre"
      tierName="Annuel"
      billingLabel="249,99 € par an"
      hasBeta60={false}
      communityGroup={null}
      customerId={null}
      sessionId="cs_apercu_non_valide"
      paiementFinalise
    />
  )
}

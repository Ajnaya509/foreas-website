'use client'

import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'

/**
 * FOREAS — LA PORTE DU WIDGET AJNAYA.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI CE FICHIER EXISTE
 *
 * `AjnayaWidget` était monté par le gabarit général, sur **toutes** les pages.
 * Il se retire lui-même de l'accueil, ligne 731 :
 *
 *     if (pathname === '/') return null
 *
 * ⚠️ MAIS UN COMPOSANT QUI REND `null` A DÉJÀ TOUT FAIT.
 *
 * En React, les crochets s'exécutent AVANT le premier `return`. Mesuré : **27
 * déclarations d'effets, d'écouteurs et de minuteries** vivent au-dessus de
 * cette ligne, dans un fichier de **48 988 octets**. Sur l'accueil, le widget
 * téléchargeait donc son code, montait ses états, attachait ses écouteurs de
 * défilement et lançait ses minuteries — **pour ne rien afficher.**
 *
 * Et l'accueil a déjà ses deux portes : `LivePhone` sur téléphone,
 * `AjnayaConversationModal` sur ordinateur. Ce travail invisible n'ouvrait
 * aucune troisième porte : il coûtait sans servir.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI LA DÉCISION VIT ICI ET PAS DANS LE GABARIT
 *
 * `src/app/layout.tsx` est un composant SERVEUR : il ne connaît pas l'adresse
 * courante de façon fiable. Il faut donc une frontière navigateur — mais une
 * frontière MINUSCULE, qui ne transporte rien d'autre que la décision.
 *
 * ⚠️ ET C'EST BIEN LE RENDU QUI DÉCLENCHE LE TÉLÉCHARGEMENT.
 * `dynamic(() => import(…))` ne va chercher le code qu'au moment où le composant
 * est réellement rendu. Garder l'appel `dynamic` ICI, sous la condition, suffit
 * donc à ce que l'accueil ne demande jamais ce fichier. Le laisser dans le
 * gabarit, lui, le faisait rendre partout — donc télécharger partout.
 */

/**
 * Le code lourd (48 988 octets) n'est demandé qu'au premier rendu réel de ce
 * composant, c'est-à-dire jamais sur `/`.
 */
const AjnayaWidget = dynamic(() => import('@/components/AjnayaWidget'))

/**
 * Les pages qui ont déjà leur propre porte vers Ajnaya, et qui ne doivent donc
 * pas recevoir le widget flottant.
 *
 * ⚠️ La liste est fermée et explicite : un `startsWith` attraperait des pages
 * qui n'ont rien demandé, et personne ne s'en apercevrait avant de constater
 * qu'Ajnaya a disparu d'une page où elle était utile.
 */
const PAGES_AVEC_LEUR_PROPRE_PORTE = new Set(['/'])

/**
 * Les pages où le widget ne doit s'ouvrir SOUS AUCUNE FORME — pas parce qu'une
 * autre porte existe, mais parce qu'aucune ne doit exister ici.
 *
 * ⚠️ CE N'EST PAS LA MÊME RAISON QUE LE JEU AU-DESSUS, D'OÙ LE SECOND JEU.
 * Ranger `/tarifs3` dans « pages avec leur propre porte » aurait écrit un
 * mensonge dans le code : cette page n'en a pas. Le jour où quelqu'un relira
 * cette liste pour savoir où Ajnaya est joignable, la réponse doit être juste.
 *
 * Le brief de la page de paiement : « Ne pas envoyer vers Ajnaya ou WhatsApp au
 * milieu du paiement. » Une bulle flottante posée par-dessus une saisie de carte
 * bancaire est exactement cette sortie-là — et sur téléphone, elle recouvre en
 * plus la zone où Stripe pose ses champs.
 *
 * 29/08/2026 — la liste ne contenait QUE `/tarifs3`. Les autres pages du même
 * tunnel étaient découvertes : `/success` (juste après le paiement, là où la
 * seule action doit être « télécharge l'app »), et `/pay`, `/checkout`,
 * `/subscribe` qui mènent au même formulaire. Le raisonnement ci-dessus vaut
 * pour toutes : le tunnel est hermétique du premier champ au dernier écran.
 */
const PAGES_SANS_AUCUNE_PORTE = new Set([
  '/tarifs3',
  '/success',
  '/pay',
  '/checkout',
  '/subscribe',
])

export default function PorteWidgetAjnaya() {
  const pathname = usePathname()
  if (pathname && PAGES_AVEC_LEUR_PROPRE_PORTE.has(pathname)) return null
  if (pathname && PAGES_SANS_AUCUNE_PORTE.has(pathname)) return null
  return <AjnayaWidget />
}

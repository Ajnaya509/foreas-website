import type { Metadata } from 'next'
import Ecran1Zone from './Ecran1Zone'
import PageVente from './PageVente'
import Soudure from './Soudure'
import s from './mobile.module.css'

/**
 * L'ACCUEIL MOBILE — trois temps, aucune couture visible entre eux.
 *
 *   1. LE HERO       il tape sa zone, la réponse s'affiche.        (intouchable)
 *   2. LA SOUDURE    la vidéo de l'habitacle, puis SON écran, puis la notification.
 *   3. LA VENTE      trente sections, cinq boutons, une seule animation.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ CE QUI A ÉTÉ RETIRÉ LE 04/09, ET POURQUOI LA COUPURE DISPARAÎT AVEC
 *
 * Il y avait ici un SECOND hero : le même titre « Gagne plus. Roule moins. », le
 * même bouton d'essai, le même prix — répétés à un écran d'intervalle. Et par
 *-dessus, un voile (`position:absolute; inset:0`) qui assombrissait CETTE
 * section sans toucher la soudure au-dessus.
 *
 * C'était ça, la « coupure directe avec la vidéo » que Chandler voyait : deux
 * blocs du même noir, un seul voilé, donc une marche de luminosité qui
 * commençait pile au pixel de la jointure. En supprimant le doublon, on
 * supprime le voile, et la marche avec.
 *
 * Ce qui reste soude sans rien à corriger : la soudure a pour fond `#060610`,
 * la page de vente aussi, et son premier filet d'un pixel est neutralisé
 * (`.vente > :first-child { border-top: 0 }`). Il n'y a plus aucune frontière
 * à voir entre la vidéo et la première phrase.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ CETTE PAGE NE DÉPEND D'AUCUNE VIDÉO
 *
 * La vidéo ne se charge qu'en entrant dans l'écran. Si elle ne charge jamais,
 * si le réseau tombe, ou si le mouvement est réduit, on saute directement à la
 * notification. La page vend quand même — moins d'un visiteur mobile sur deux
 * fait défiler une page (45,2 %, Contentsquare, 99 milliards de sessions).
 *
 * ⚠️ INTROUVABLE SUR GOOGLE tant que Chandler n'a pas dit qu'elle remplace `/`.
 */
export const metadata: Metadata = {
  title: 'FOREAS Driver — aperçu mobile',
  robots: { index: false, follow: false, nocache: true },
}

export default function AccueilMobile() {
  return (
    <>
      {/* ══ 1 — LE HERO ══════════════════════════════════════════════════════
          Il passe devant tout : moins d'un visiteur mobile sur deux fait
          défiler une page. Le geste demandé est un nom de lieu qu'il connaît
          par cœur. La réponse vend, et elle ne lit aucune table. */}
      <Ecran1Zone lienWhatsApp="/wa?s=hero_zone" />

      {/* ══ 2 — LA SOUDURE ═══════════════════════════════════════════════════
          La vidéo de l'habitacle joue, la caméra avance vers le téléphone dont
          l'écran est noir, puis cet écran noir grandit jusqu'à remplir celui du
          visiteur — et la vraie notification apparaît dedans.
          Le téléphone de la voiture devient le sien, sans coupure visible.

          ⚠️ La notification POSE la question ; la première phrase de la vente y
          répond (« Uber ne te dira jamais de refuser une course. »). C'est pour
          ça qu'aucun bloc ne s'intercale entre les deux. */}
      <Soudure
        enfants={
          <div className={s.notif} role="status">
            <div className={s.notifIcone} aria-hidden="true">F</div>
            <div className={s.notifCorps}>
              <div className={s.notifHaut}>
                <span className={s.notifApp}>FOREAS Driver</span>
                <span className={s.notifHeure}>maintenant</span>
              </div>
              <div className={s.notifTitre}>Course proposée — 12,40 €</div>
              <p className={s.notifTexte}>Regarde ce qu&apos;elle paie avant d&apos;accepter.</p>
            </div>
          </div>
        }
      />

      {/* ══ 3 — LA VENTE ═════════════════════════════════════════════════════ */}
      <PageVente />
    </>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import Ecran1Zone from './Ecran1Zone'
import Soudure from './Soudure'
import s from './mobile.module.css'

/**
 * L'ACCUEIL MOBILE — PREMIER ÉCRAN, À REGARDER SUR UN VRAI TÉLÉPHONE.
 *
 * Demandé par Chandler le 03/09/2026 : « je n'arrive pas à voir en mobile ».
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUI CHANGE PAR RAPPORT À LA VISION ORDINATEUR
 *
 * Sur ordinateur : une vidéo d'un chauffeur dans son habitacle reçoit une course,
 * puis la vidéo devient interactive. C'est juste : la personne est assise devant
 * un grand écran, elle regarde une scène.
 *
 * Sur mobile, elle TIENT le téléphone. Montrer un téléphone dans un écran revient
 * à mettre un cadre autour de sa propre main, et on perd tout.
 * Alors la notification n'arrive pas dans une image : elle arrive sur SON écran,
 * avec la forme exacte d'une notification de système. Il n'y a plus de scène —
 * il est dedans.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ CETTE PAGE NE DÉPEND D'AUCUNE VIDÉO
 *
 * La vidéo Seedance viendra en arrière-plan, chargée après le premier affichage.
 * Si elle ne charge jamais, la page vend quand même. Ce n'est pas de la prudence :
 * moins d'un visiteur mobile sur deux fait défiler une page (45,2 %, Contentsquare,
 * 99 milliards de sessions). Ce qui compte doit être là tout de suite, sans attendre.
 *
 * ⚠️ INTROUVABLE SUR GOOGLE. C'est un aperçu à valider, pas une page publique.
 * Elle ne remplace `/` que si Chandler le décide.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ LES CHIFFRES DE LA BULLE SONT UN EXEMPLE, ET C'EST ÉCRIT À L'ÉCRAN
 *
 * 12,40 € · 5,0 km · 17 min · 39 €/h vient de la série publicitaire du 31/08.
 * Ce n'est pas une course observée : c'est un scénario construit. Le mot
 * « exemple » est visible sous la bulle. Un commentaire qui le dit ici et un
 * écran qui se tait est un faux témoin — le projet l'a déjà payé quatre fois.
 */
export const metadata: Metadata = {
  title: 'FOREAS Driver — aperçu mobile',
  robots: { index: false, follow: false, nocache: true },
}

export default function AccueilMobile() {
  return (
    <>
      {/* ══ ÉCRAN 1 — la question de zone, décision de Chandler du 03/09 ══
          Elle passe devant tout : moins d'un visiteur mobile sur deux fait
          défiler une page. Le geste demandé est un nom de lieu qu'il connaît
          par cœur. La réponse vend, et elle ne lit aucune table. */}
      <Ecran1Zone lienWhatsApp="/wa?s=hero_zone" />

      {/* ══ LA SOUDURE ══════════════════════════════════════════════════════
          La vidéo de l'habitacle joue, la caméra avance vers le téléphone dont
          l'écran est noir, puis cet écran noir grandit jusqu'à remplir celui du
          visiteur — et la vraie notification apparaît dedans.
          Le téléphone de la voiture devient le sien, sans coupure visible. */}
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

      <main className={s.scene}>
      <div className={s.halos} aria-hidden="true" />
      <div className={s.grain} aria-hidden="true" />

      {/* La ligne cyan → violet part de la notification et descend derrière tout.
          Un seul tracé, dessiné une fois, jamais lié au défilement. */}
      <svg className={s.fil} viewBox="0 0 390 844" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="filDegrade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00D4FF" stopOpacity=".85" />
            <stop offset="55%" stopColor="#8C52FF" stopOpacity=".55" />
            <stop offset="100%" stopColor="#8C52FF" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          className={s.filTrace}
          d="M 195 96 C 195 150, 96 178, 96 236 C 96 296, 300 318, 300 380 C 300 440, 120 462, 120 522 C 120 586, 260 604, 260 668 C 260 730, 195 752, 195 844"
        />
      </svg>

      <div className={s.voile} aria-hidden="true" />

      {/* ══ LA BULLE — quatre lignes, des nombres qu'un enfant suit ══ */}
      <div className={s.bulle}>
        <div className={s.bulleLigne}><span>Elle paie</span><b>12,40 €</b></div>
        <div className={s.bulleLigne}><span>Elle te prend</span><b>17 min</b></div>
        <div className={s.bulleLigne}><span>Essence et usure</span><b>− 1,25 €</b></div>
        <div className={s.bulleTrait} />
        <div className={s.bulleVerdict}>
          <span className={s.bulleVerdictMot}>Prends-la</span>
          <span className={s.bulleVerdictChiffre}>39 €/h</span>
        </div>
        {/* ⚠️ Le tampon tient sur UNE ligne dans le premier écran : chaque ligne
            ici pousse le bouton sous le bandeau de consentement. Le détail de ce
            que couvrent les 0,25 €/km reste obligatoire, mais il vit juste en
            dessous, hors du premier écran — jamais supprimé, seulement déplacé. */}
        <p className={s.bulleTampon}>Exemple. Estimation calculée sur ton téléphone.</p>
      </div>

      {/* ══ LE TITRE ══ */}
      <div className={s.titreBloc}>
        <div className={s.surtitre}>FOREAS Driver · pour chauffeurs VTC</div>
        <h1 className={s.titre}>Gagne plus.<br />Roule moins.</h1>
        <p className={s.sousTitre}>
          Une course arrive. Tu as huit secondes pour dire oui ou non.
        </p>

        <Link href="/tarifs2" className={s.action}>Essayer 3 jours — 0 € aujourd&apos;hui</Link>

        <p className={s.souslAction}>
          29,99 € par mois. Moins d&apos;un euro par jour. 0 € aujourd&apos;hui.{' '}
          <Link href="/tarifs2">Prix et conditions</Link>
        </p>

        <div className={s.suite}>
          Ce que ça change sur une journée entière
          <svg className={s.chevron} viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>
      </main>
    </>
  )
}

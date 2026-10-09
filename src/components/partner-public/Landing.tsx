import Link from 'next/link';
import { authUrls } from '@/lib/auth-urls';
import Image from 'next/image';
import {ArrowRight, Plus} from 'lucide-react';
import { APP_STORE_URL, PLAY_STORE_URL } from '@/lib/app-stores';
import ZoomALApparition from '@/components/partner-public/ZoomALApparition';
import Simulateur from '@/components/partner-public/Simulateur';
import ForeasLogo from '@/components/experience/ForeasLogo';
import s from '@/app/partenaire/partenaire.module.css';

// Texte exact dit dans le film partenaire V4 (FOREAS-SHARED/FILM_PARTENAIRE_2026-10-08_V4).
const texteDuFilm = [
  'Vous connaissez un ou plusieurs chauffeurs VTC ? Avec FOREAS, une recommandation peut vous rapporter dix euros par mois et par chauffeur abonné au mensuel grâce à votre lien. Tant que son abonnement est payé et validé, la commission continue.',
  'Pourquoi lui recommander FOREAS Driver ? Pour l’aider à mieux vivre de son activité. Verdict Instant l’aide à évaluer une course avant de l’accepter. Mais ce n’est qu’une partie de l’application.',
  'Il peut aussi créer son site personnel et partager son lien ou son code à scanner. Ses clients peuvent le retrouver et lui demander une réservation. La conciergerie recueille leur demande. Lui garde la main pour confirmer. Moins d’allers-retours. Plus de place pour sa clientèle privée.',
  'Et il y a bien d’autres outils pour préparer son activité et suivre ses objectifs. Une même ambition : l’aider à gagner plus, sans simplement travailler plus longtemps.',
  'Pour vous, c’est simple. Vous créez gratuitement votre espace partenaire. Vous partagez votre lien. Le chauffeur découvre FOREAS Driver et choisit son abonnement. Vous n’avez ni paiement à encaisser, ni application à installer pour lui.',
  'Quinze chauffeurs abonnés au mensuel grâce à vous, c’est cent cinquante euros par mois. Trente, c’est trois cents euros. Vous dirigez, par exemple, un centre de formation ? Cent chauffeurs abonnés, c’est mille euros par mois. Peu importe votre métier. Ce sont les abonnements payés et validés qui comptent, pas la taille de votre carnet d’adresses.',
  'Vous n’avez pas à tout expliquer de mémoire. Votre espace partenaire met à votre disposition des messages, des visuels et un code à scanner pour présenter l’application. Vous y retrouvez aussi vos inscriptions et vos commissions.',
  'Commencez par un chauffeur à qui FOREAS peut vraiment servir. Aidez-le à découvrir l’outil. Et faites de cette recommandation le début d’un revenu régulier. Créez votre espace partenaire gratuit.',
];

// Réponses tirées des conditions acceptées par les partenaires (version du 24 septembre 2026).
const questions = [
  ['Faut-il être chauffeur pour devenir partenaire ?', 'Non. Centre de formation, loueur, flotte, communauté, créateur ou simple contact : il suffit de connaître des chauffeurs VTC. Aucun minimum et aucune exclusivité ne sont demandés.'],
  ['Est-ce que cela me coûte quelque chose ?', 'Non. La création de votre espace est gratuite et aucun achat n’est demandé. Le chauffeur s’abonne et paie directement FOREAS : vous n’encaissez rien.'],
  ['Quand suis-je payé ?', 'Pour un abonnement mensuel, les deux premiers mois deviennent payables ensemble, soit 20 €, après le paiement du deuxième mois. Ensuite, 10 € pour chaque mois payé. Les versements passent par Stripe, après ses vérifications. Votre espace affiche l’état de chaque commission.'],
  ['Faut-il un statut particulier ?', 'Pas pour vous inscrire et partager votre lien. Pour recevoir vos versements, Stripe vérifie votre identité et vos coordonnées bancaires. Vos déclarations fiscales et sociales restent à votre charge.'],
  ['Et si le chauffeur arrête son abonnement ?', 'Les commissions suivent ses paiements : un mois non payé ne donne pas de commission. Les commissions déjà acquises sur des paiements conservés restent acquises.'],
  ['Puis-je arrêter quand je veux ?', 'Oui, à tout moment. Vous cessez de partager votre lien et vous écrivez à contact@foreas.xyz.'],
] as const;

function BoutiqueApple() {
  return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>;
}

function BoutiqueGoogle() {
  return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/></svg>;
}

export default function Landing() {
  return <div className={`${s.page} ${s.v2Page}`}>
    <a href="#contenu" className={s.skip}>Aller au contenu</a>
    <header className={`${s.container} ${s.header}`}>
      <Link href="/" aria-label="FOREAS, accueil" className={s.brand}>
        <ForeasLogo className={s.wordmark}/><span>PARTENAIRES</span>
      </Link>
      <Link href={authUrls.loginPartner} className={s.portal}>Mon espace partenaire <ArrowRight size={16} aria-hidden="true"/></Link>
    </header>

    <main id="contenu">
      <section className={`${s.container} ${s.hero}`} aria-labelledby="titre-partenariat">
        <div>
          <p className={s.eyebrow}>PROGRAMME PARTENAIRE FOREAS</p>
          <h1 id="titre-partenariat">Recommandez<br/>FOREAS Driver.<br/><span>Soyez rémunéré.</span></h1>
          <p className={s.lead}>Vous connaissez des chauffeurs VTC ? Partagez votre lien. Pour chaque chauffeur abonné au mensuel grâce à vous, vous recevez 10 € par mois.</p>
          <div className={s.actions}>
            <Link href={authUrls.signupPartner} className={s.cta}>Créer mon espace partenaire <ArrowRight size={20} aria-hidden="true"/></Link>
            <a href="#film" className={s.secondary}>Comment ça fonctionne ? <ArrowRight size={17} aria-hidden="true"/></a>
          </div>
          <p className={s.note}>Ouvert aussi aux partenaires qui ne sont pas chauffeurs. Aucun abonnement Premium nécessaire.</p>
        </div>
        <figure className={s.heroProduct}>
          <ZoomALApparition className={s.verdictFrame}>
            <Image src="/media/partenaire/verdict-instant.webp" alt="Démonstration de Verdict Instant dans FOREAS Driver : une course affichée 46,20 € reçoit le verdict « À laisser, 16 € de l’heure », car elle prend 121 minutes au total." width={1156} height={2350} sizes="(min-width: 768px) 440px, 92vw" priority className={s.verdictImage}/>
          </ZoomALApparition>
          <figcaption>
            <span className={s.deviceCaption}>Verdict Instant, dans FOREAS Driver : le prix affiché, puis ce qu’il rapporte vraiment à l’heure. Démonstration, données d’exemple.</span>
            <span className={s.stores} aria-label="Disponible sur les boutiques officielles">
              <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" className={s.store}><BoutiqueApple/><span><small>Télécharger sur</small>App Store</span></a>
              <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className={s.store}><BoutiqueGoogle/><span><small>Disponible sur</small>Google Play</span></a>
            </span>
          </figcaption>
        </figure>
      </section>

      <section id="remuneration" className={`${s.container} ${s.section} ${s.gains}`} aria-labelledby="gains-titre">
        <p className={s.eyebrow}>CE QUE CHACUN Y GAGNE</p>
        <h2 id="gains-titre">Ce que vous recevez. Ce qu’il paie.</h2>
        <div className={s.gainsGrid}>
          <article className={s.rewards} aria-labelledby="pour-vous">
            <p id="pour-vous" className={s.rewardLabel}>POUR VOUS</p>
            <div className={s.rewardLine}>
              <strong>10 <span>€</span></strong>
              <div><h3>Par mois admissible</h3><p>Les deux premiers mois payés ouvrent ensemble 20 €, après le paiement du deuxième mois.</p></div>
            </div>
            <div className={s.or}><span>ou</span></div>
            <div className={s.rewardLine}>
              <strong>50 <span>€</span></strong>
              <div><h3>Sur le premier annuel</h3><p>Une seule fois, après son premier paiement annuel admissible.</p></div>
            </div>
            <p className={s.rewardFoot}>Les paiements doivent être conservés et admissibles.
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <span className={s.stripeLine}>Versements par <img src="/media/partenaire/stripe-blanc.svg" alt="Stripe" width={48} height={20}/></span>
              <a href={authUrls.partnerTerms}>Lire les conditions <ArrowRight size={16} aria-hidden="true"/></a></p>
          </article>
          <article className={`${s.rewards} ${s.driverCard}`} aria-labelledby="pour-le-chauffeur">
            <p id="pour-le-chauffeur" className={s.rewardLabel}>POUR LE CHAUFFEUR</p>
            <dl className={s.priceList}>
              <div><dt>Essai</dt><dd><strong>3 jours</strong><span>0 € aujourd’hui. Sa carte est enregistrée dès le départ.</span></dd></div>
              <div><dt>Ensuite</dt><dd><strong>29,99 € <small>par mois</small></strong><span>ou 249,99 € par an.</span></dd></div>
              <div><dt>Avec votre lien</dt><dd><strong className={s.accent}>−10 %</strong><span>sur son abonnement, à chaque renouvellement, selon les conditions affichées avant son paiement.</span></dd></div>
            </dl>
            <p className={s.rewardFoot}>Il s’abonne et paie directement FOREAS. Vous n’encaissez rien.</p>
          </article>
        </div>
        <Simulateur/>
      </section>

      <section id="film" className={`${s.container} ${s.filmSection}`} aria-labelledby="film-titre">
        <div className={s.filmHeading}>
          <div><p className={s.eyebrow}>LE PROGRAMME EN IMAGES</p><h2 id="film-titre">Deux minutes pour tout comprendre.</h2></div>
          <p>Ce que FOREAS Driver apporte au chauffeur, ce que vos recommandations peuvent vous rapporter, et comment commencer.</p>
        </div>
        <video className={s.film} controls playsInline preload="none" poster="/videos/partenaires/foreas-partenaires-2-min.jpg" aria-label="Le programme partenaire FOREAS en deux minutes" aria-describedby="film-description">
          <source src="/videos/partenaires/foreas-partenaires-2-min.mp4" type="video/mp4"/>
          <track kind="captions" src="/videos/partenaires/foreas-partenaires-2-min.vtt" srcLang="fr" label="Français"/>
          Votre navigateur ne peut pas lire cette vidéo. <a href="/videos/partenaires/foreas-partenaires-2-min.mp4">Ouvrir le film</a>.
        </video>
        <p id="film-description" className={s.note}>Exemples de calcul et schémas signalés à l’image. Aucun revenu garanti.</p>
        <details className={s.transcript}><summary>Lire le texte du film</summary>{texteDuFilm.map((paragraphe) => <p key={paragraphe.slice(0, 24)}>{paragraphe}</p>)}</details>
      </section>

      <section id="fonctionnement" className={`${s.container} ${s.section} ${s.how}`} aria-labelledby="etapes-titre">
        <div>
          <p className={s.eyebrow}>UN PARCOURS SIMPLE</p>
          <h2 id="etapes-titre">De votre arrivée à votre premier partage.</h2>
          <p className={s.sectionIntro}>Quelques étapes guidées. Vous pouvez fermer la page et reprendre plus tard.</p>
        </div>
        <ol className={s.steps}>
          <li><span>01</span><div><h3>Créez votre compte.</h3><p>Utilisez votre compte FOREAS ou créez-en un, puis présentez votre activité.</p></div></li>
          <li><span>02</span><div><h3>Acceptez les conditions.</h3><p>Le barème et les règles sont présentés avant votre accord.</p></div></li>
          <li><span>03</span><div><h3>Configurez Stripe.</h3><p>Stripe recueille directement les informations nécessaires à vos futurs versements.</p></div></li>
          <li><span>04</span><div><h3>Partagez votre lien.</h3><p>Retrouvez vos messages, votre lien et vos résultats dans votre espace.</p></div></li>
        </ol>
      </section>

      <section className={`${s.container} ${s.section}`} aria-labelledby="outils-titre">
        <p className={s.eyebrow}>DANS VOTRE ESPACE</p>
        <h2 id="outils-titre">Tout ce qu’il faut pour avancer.</h2>
        <div className={s.workspace}>
          <figure className={s.workspaceShot}>
            <Image src="/media/partenaire/espace-partenaire.webp" alt="Vraie capture de l’espace partenaire FOREAS : menu Accueil, Partager, Mes gains et Aide, lien prêt à copier, message à préparer et premières commissions à 0,00 €." width={1280} height={980} sizes="(min-width: 900px) 640px, 92vw" className={s.workspaceImage}/>
            <figcaption>Vraie capture de l’espace partenaire, compte au démarrage. Code et lien personnels masqués.</figcaption>
          </figure>
          <ul className={s.workspaceList}>
            <li><h3>Partagez à votre façon.</h3><p>Un message à adapter, un QR à faire scanner ou un visuel à publier.</p></li>
            <li><h3>Suivez vos invitations.</h3><p>Retrouvez les inscriptions et les paiements attribués à votre lien.</p></li>
            <li><h3>Comprenez vos commissions.</h3><p>Chaque montant affiche son état, du paiement du chauffeur au versement.</p></li>
          </ul>
        </div>
      </section>

      <section id="questions" className={`${s.container} ${s.section} ${s.faqSection}`} aria-labelledby="questions-titre">
        <div className={s.faq}>
          <p className={s.eyebrow}>QUESTIONS FRÉQUENTES</p>
          <h2 id="questions-titre">Avant de vous lancer.</h2>
          {questions.map(([question, reponse]) => <details key={question}><summary>{question}<Plus size={20} aria-hidden="true"/></summary><p>{reponse}</p></details>)}
        </div>
      </section>

      <section className={`${s.container} ${s.section} ${s.publisher}`} aria-labelledby="editeur-titre">
        <div>
          <p className={s.eyebrow}>QUI EST DERRIÈRE FOREAS</p>
          <h2 id="editeur-titre">Une société française, joignable.</h2>
          <p className={s.sectionIntro}>FOREAS Driver est édité par EPHIALTES, à Paris. Une question avant de vous lancer ? Écrivez-nous.</p>
        </div>
        <dl className={s.identity}>
          <div><dt>Société</dt><dd>EPHIALTES</dd></div>
          <div><dt>SIREN</dt><dd>940 879 281</dd></div>
          <div><dt>Adresse</dt><dd>58 rue de Monceau, 75008 Paris</dd></div>
          <div><dt>Contact</dt><dd><a href="mailto:contact@foreas.xyz">contact@foreas.xyz</a></dd></div>
          <div><dt>Versements</dt><dd>Par Stripe. Vos coordonnées bancaires sont saisies chez Stripe, pas chez FOREAS.</dd></div>
        </dl>
        <Link href={authUrls.signupPartner} className={`${s.cta} ${s.v2FinalCta}`}>Créer mon espace partenaire <ArrowRight size={20} aria-hidden="true"/></Link>
      </section>
    </main>

    <footer className={`${s.container} ${s.footer}`}>
      <div><strong>FOREAS, toujours plus loin.</strong><p>© 2026 FOREAS. Tous droits réservés.</p></div>
      <nav aria-label="Informations légales"><Link href="/mentions-legales">Mentions légales</Link><Link href="/confidentialite">Confidentialité</Link><a href="mailto:contact@foreas.xyz">Contact</a></nav>
    </footer>
  </div>;
}

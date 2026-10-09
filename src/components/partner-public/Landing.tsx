import Link from 'next/link';
import { authUrls } from '@/lib/auth-urls';
import {ArrowRight, MessageCircle, Users, Wallet} from 'lucide-react';
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
          <p className={s.lead}>Vous connaissez des chauffeurs VTC ? Créez votre espace, partagez votre lien et suivez vos recommandations au même endroit.</p>
          <div className={s.actions}>
            <Link href={authUrls.signupPartner} className={s.cta}>Créer mon espace partenaire <ArrowRight size={20} aria-hidden="true"/></Link>
            <a href="#film" className={s.secondary}>Comment ça fonctionne ? <ArrowRight size={17} aria-hidden="true"/></a>
          </div>
          <p className={s.note}>Ouvert aussi aux partenaires qui ne sont pas chauffeurs. Aucun abonnement Premium nécessaire.</p>
        </div>
        <aside className={s.rewards} aria-label="Règles de rémunération du programme partenaire">
          <p className={s.rewardLabel}>VOTRE RÉMUNÉRATION</p>
          <div className={s.rewardLine}>
            <strong>10 <span>€</span></strong>
            <div><h2>Par mois admissible</h2><p>Les deux premiers mois payés ouvrent ensemble 20 €, après le paiement du deuxième mois.</p></div>
          </div>
          <div className={s.or}><span>ou</span></div>
          <div className={s.rewardLine}>
            <strong>50 <span>€</span></strong>
            <div><h2>Sur le premier annuel</h2><p>Après son premier paiement annuel admissible.</p></div>
          </div>
          <div className={s.driverBenefit}><strong>−10 %</strong><p>de remise pour le chauffeur invité, selon les conditions affichées avant son paiement.</p></div>
          <p className={s.rewardFoot}>Les paiements doivent être conservés et admissibles. <a href={authUrls.partnerTerms}>Lire les conditions <ArrowRight size={16} aria-hidden="true"/></a></p>
        </aside>
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
        <div className={`${s.profiles} ${s.v2Profiles}`}>
          <article><MessageCircle size={26} aria-hidden="true"/><h3>Partagez à votre façon.</h3><p>Un message à adapter, un QR à faire scanner ou un visuel à publier.</p></article>
          <article><Users size={26} aria-hidden="true"/><h3>Suivez vos invitations.</h3><p>Retrouvez les inscriptions et les paiements attribués à votre lien.</p></article>
          <article><Wallet size={26} aria-hidden="true"/><h3>Comprenez vos commissions.</h3><p>Chaque montant affiche son état, du paiement du chauffeur au versement.</p></article>
        </div>
        <Link href={authUrls.signupPartner} className={`${s.cta} ${s.v2FinalCta}`}>Créer mon espace partenaire <ArrowRight size={20} aria-hidden="true"/></Link>
      </section>
    </main>

    <footer className={`${s.container} ${s.footer}`}>
      <div><strong>FOREAS, toujours plus loin.</strong><p>© 2026 FOREAS. Tous droits réservés.</p></div>
      <nav aria-label="Informations légales"><Link href="/mentions-legales">Mentions légales</Link><Link href="/confidentialite">Confidentialité</Link><a href="mailto:contact@foreas.xyz">Contact</a></nav>
    </footer>
  </div>;
}

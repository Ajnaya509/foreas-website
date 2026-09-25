import Link from 'next/link';
import { authUrls } from '@/lib/auth-urls';
import {ArrowRight, MessageCircle, Users, Wallet} from 'lucide-react';
import ForeasLogo from '@/components/experience/ForeasLogo';
import s from '@/app/partenaire/partenaire.module.css';

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
            <a href="#fonctionnement" className={s.secondary}>Comment ça marche ? <ArrowRight size={17} aria-hidden="true"/></a>
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

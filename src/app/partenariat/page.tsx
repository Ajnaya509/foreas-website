import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Check, Play, Plus } from 'lucide-react'
import { metadonneesPage } from '@/lib/site'
import { authUrls } from '@/lib/auth-urls'
import FormulaireCandidature from './FormulaireCandidature'
import s from './partenariat.module.css'

export const metadata: Metadata = metadonneesPage('/partenariat', 'Partenaires FOREAS Driver — Recommandez. Soyez rémunéré.', 'Recommandez FOREAS Driver à vos chauffeurs : une remise de 10 % pour eux. Une commission de 10 € par mois payé, versée après deux mois consécutifs payés, ou de 50 € au premier annuel pour vous. Admission et activation requises.')

const questions = [
  ['Qui peut devenir partenaire ?', 'Centres de formation, loueurs, flottes, rattachements, services aux chauffeurs et communautés VTC. Présentez votre activité : aucune grande audience n’est exigée. FOREAS étudie chaque candidature.'],
  ['Que reçoit le chauffeur ?', 'Votre lien partenaire activé lui donne 10 % de remise sur son abonnement mensuel ou annuel, à chaque renouvellement. Le prix est confirmé avant son paiement. Cette remise ne diminue pas vos commissions fixes de 10 € ou 50 €.'],
  ['Quand une recommandation donne-t-elle une commission ?', 'Le chauffeur doit être attribué à votre lien ou à votre code avant son paiement. Seul un abonnement réellement payé et conforme aux conditions ouvre une commission. Un remboursement, un impayé ou une contestation peut la bloquer. Un clic ou un essai ne suffit pas.'],
  ['Quand et comment suis-je payé ?', 'Pour un nouvel abonnement mensuel apporté, les deux premiers mois doivent être payés à la suite avant le premier versement : ils ouvrent alors 20 € de commissions, soit 10 € par mois. Les versements sont prévus le 25 du mois, après vérification des paiements admissibles. Le premier annuel rejoint le prochain lot après vérification. Votre compte Stripe et les justificatifs demandés doivent être complets. Le délai d’arrivée sur votre banque dépend du prestataire.'],
  ['Puis-je arrêter le partenariat ?', 'Oui. Vous pouvez demander à quitter le programme à tout moment en écrivant à contact@foreas.xyz. Vous cessez alors de partager votre lien. Les commissions déjà acquises restent examinées selon les conditions acceptées ; les paiements ultérieurs ne créent plus de nouveaux droits.'],
  ['Et si je gère une flotte ?', 'Vous pouvez recommander FOREAS Driver à vos chauffeurs. Pour équiper toute une équipe, précisez votre besoin dans le formulaire. Le partenariat ne donne aucun accès automatique à leurs comptes ni à leurs données privées.'],
] as const

export default function PartenariatPage() {
  return (
    <div className={s.page}>
      <a href="#contenu" className={s.skip}>Aller au contenu</a>
      <header className={`${s.container} ${s.header}`}>
        <Link href="/" aria-label="FOREAS, accueil" className={s.brand}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/logo-blanc.svg" alt="FOREAS" width="132" height="40" />
          <span>PARTENAIRES</span>
        </Link>
        <a href={authUrls.loginPartner} className={s.portal}>Mon espace <ArrowRight size={16} aria-hidden="true" /></a>
      </header>
      <main id="contenu">
        <section className={`${s.container} ${s.hero}`} aria-labelledby="titre-partenariat">
          <div className={s.heroCopy}>
            <p className={s.eyebrow}>VOUS CONNAISSEZ DES CHAUFFEURS VTC ?</p>
            <h1 id="titre-partenariat">Recommandez<br />FOREAS Driver.<br /><span>Soyez rémunéré.</span></h1>
            <p className={s.lead}>Recommandez l’app à vos chauffeurs. Recevez 10 € par mois payé, après deux mois consécutifs payés, ou 50 € au premier abonnement annuel apporté.</p>
            <div className={s.actions}>
              <a href="#candidature" className={s.cta}>Devenir partenaire <ArrowRight size={20} aria-hidden="true" /></a>
              <a href="#modalites" className={s.secondary}>Voir les modalités <ArrowRight size={17} aria-hidden="true" /></a>
            </div>
            <a href="#decouvrir" className={s.filmLink}><Play size={18} aria-hidden="true" />Découvrir FOREAS Driver · 3 min</a>
            <p className={s.note}>Candidature gratuite. Conditions à lire et à accepter avant activation. Vous pouvez quitter le programme à tout moment.</p>
          </div>
          <aside className={s.rewards} aria-label="Votre rémunération et la remise chauffeur">
            <p className={s.rewardLabel}>POUR VOUS, PAR CHAUFFEUR APPORTÉ</p>
            <div className={s.rewardLine}><strong>10<span> €</span></strong><div><h2>Par mois payé</h2><p>Premier versement après deux mois consécutifs payés.</p></div></div>
            <div className={s.or}><span>OU</span></div>
            <div className={s.rewardLine}><strong>50<span> €</span></strong><div><h2>Au premier annuel</h2><p>Une seule fois. Aucun nouveau versement au renouvellement annuel.</p></div></div>
            <div className={s.driverBenefit}><strong>−10 %</strong><p><b>Pour vos chauffeurs</b><br />Sur leur abonnement, à chaque renouvellement, via votre lien activé.</p></div>
            <p className={s.rewardFoot}>Commissions sur les paiements admissibles. Les 10 € et 50 € sont vos commissions, pas le prix de l’app.</p>
          </aside>
        </section>

        <section id="decouvrir" className={`${s.container} ${s.filmSection}`} aria-labelledby="film-titre">
          <div className={s.filmHeading}><div><p className={s.eyebrow}>LE PRODUIT, EN IMAGES</p><h2 id="film-titre">Trois minutes.<br />Trois usages concrets.</h2></div><p>Être retrouvé par ses clients. Comprendre ses frais. Échanger avec Ajnaya pour préparer ses décisions.</p></div>
          <video className={s.film} controls playsInline preload="none" poster="/videos/partenaires/foreas-driver-3-min.jpg" aria-label="Découvrir FOREAS Driver en trois minutes" aria-describedby="film-description">
            <source src="/videos/partenaires/foreas-driver-3-min.mp4" type="video/mp4" />
            <track kind="captions" src="/videos/partenaires/foreas-driver-3-min.vtt" srcLang="fr" label="Français" />
            Votre navigateur ne peut pas lire cette vidéo. <a href="/videos/partenaires/foreas-driver-3-min.mp4">Ouvrir le film</a>.
          </video>
          <p id="film-description" className={s.note}>Situations illustrées. Les simulations et les estimations sont signalées à l’image.</p>
          <details className={s.transcript}><summary>Lire le résumé du film</summary><p>FOREAS Driver propose un site personnel et un QR code pour que les passagers retrouvent leur chauffeur et lui adressent une demande de réservation. Le chauffeur confirme la demande. L’app affiche aussi une estimation des frais professionnels à partir du profil et du kilométrage. Enfin, le chauffeur peut échanger avec Ajnaya, préciser sa situation et poser des questions complémentaires. Il garde la décision. Les scènes ne promettent ni clientèle ni revenu garanti.</p></details>
        </section>

        <section id="parcours" className={`${s.container} ${s.section} ${s.how}`} aria-labelledby="modalites-titre">
          <div><p className={s.eyebrow}>COMMENT ÇA MARCHE</p><h2 id="modalites-titre">Un lien à partager.<br />Un espace pour suivre.</h2><p className={s.sectionIntro}>Vos liens, vos supports prêts à utiliser et vos commissions sont réunis dans votre espace après activation.</p><a href="#modalites" className={s.textLink}>Lire les conditions pratiques <ArrowRight size={16} aria-hidden="true" /></a></div>
          <ol className={s.steps}>
            <li><span>01</span><div><h3>Présentez votre activité</h3><p>Quatre informations. Aucun paiement ni coordonnées bancaires pour candidater.</p></div></li>
            <li><span>02</span><div><h3>Lisez les conditions, puis continuez</h3><p>Après admission, lisez les conditions du programme. Acceptez-les pour activer votre espace, puis complétez votre compte Stripe pour recevoir vos versements.</p></div></li>
            <li><span>03</span><div><h3>Partagez votre lien</h3><p>Vos chauffeurs bénéficient de la remise. Vous suivez les commissions sur leurs abonnements admissibles.</p></div></li>
          </ol>
        </section>

        <section id="candidature" className={`${s.container} ${s.section} ${s.application}`} aria-labelledby="candidature-titre">
          <div><p className={s.eyebrow}>FAISONS CONNAISSANCE</p><h2 id="candidature-titre">Vous connaissez<br />les chauffeurs.<br />Présentez-vous.</h2><p className={s.sectionIntro}>Formation, location, flotte ou communauté : dites-nous qui vous accompagnez.</p><ul className={s.assurances}><li><Check size={18} aria-hidden="true" />Une candidature sans engagement</li><li><Check size={18} aria-hidden="true" />Les conditions à lire et à accepter avant d’aller plus loin</li><li><Check size={18} aria-hidden="true" />Une réponse à l’adresse que vous indiquez</li></ul><a href="mailto:contact@foreas.xyz?subject=Partenariat%20FOREAS%20Driver" className={s.textLink}>Écrire à l’équipe FOREAS <ArrowRight size={16} aria-hidden="true" /></a></div>
          <FormulaireCandidature />
        </section>

        <section id="modalites" className={`${s.container} ${s.section} ${s.faq}`} aria-labelledby="questions-titre">
          <p className={s.eyebrow}>LES MODALITÉS, CLAIREMENT</p><h2 id="questions-titre">Avant de vous lancer.</h2>
          {questions.map(([question, reponse]) => <details key={question}><summary>{question}<Plus size={20} aria-hidden="true" /></summary><p>{reponse}</p></details>)}
          <p className={s.note}>EPHIALTES vous présente l’accord complet avant activation. Vos revenus dépendent des abonnements que vous apportez.</p>
          <a href="#candidature" className={s.cta}>Devenir partenaire <ArrowRight size={20} aria-hidden="true" /></a>
        </section>
      </main>
      <footer className={`${s.container} ${s.footer}`}><div><strong>FOREAS, toujours plus loin.</strong><p>Programme proposé par EPHIALTES · SIREN 940 879 281</p></div><nav aria-label="Informations légales"><Link href="/mentions-legales">Mentions légales</Link><Link href="/partenariat/donnees">Données de candidature</Link><a href="mailto:contact@foreas.xyz">Contact</a></nav></footer>
    </div>
  )
}

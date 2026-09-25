import Image from 'next/image'
import { ArrowRight, ArrowUpRight, ChartNoAxesCombined, ScanLine, Smartphone, MessageCircle, MoveUpRight, Plus } from 'lucide-react'
import ForeasLogo from '@/components/experience/ForeasLogo'
import { authUrls } from '@/lib/auth-urls'
import HomeLink from './HomeLink'
import HomeMenu from './HomeMenu'
import Film from './Film'
import BookingPreview from './BookingPreview'
import BrandSoundButton from './BrandSoundButton'
import PublicActivityToast from './PublicActivityToast'
import s from './home.module.css'

const questions = [
  ['À quoi sert FOREAS Driver ?', 'À mieux lire ton activité VTC. Tu retrouves des outils pour comprendre une proposition de course, suivre ton activité, échanger avec Ajnaya et présenter ton propre site de réservation à tes clients.'],
  ['Je peux garder mes applications de courses ?', 'Oui. FOREAS complète ton activité. Tu gardes tes applications et tu restes libre de choisir les courses que tu acceptes.'],
  ['Est-ce que FOREAS me promet des clients ou des revenus ?', 'Non. FOREAS te donne des outils et des informations pour décider. Ton activité, tes frais et les demandes de tes clients restent propres à ta situation. Une estimation n’est jamais une garantie.'],
  ['L’application fonctionne sur mon téléphone ?', 'FOREAS Driver existe sur iPhone et Android. Certaines fonctions dépendent du téléphone et des autorisations accordées. La page de l’application explique ces différences avant ton inscription.'],
  ['Comment devenir partenaire ?', 'Le programme possède son propre parcours. Crée ton espace, lis et accepte les conditions, puis renseigne les informations demandées par Stripe. Ton lien et les supports se retrouvent ensuite dans ton espace partenaire.'],
]

function Actions({ location }: { location: string }) {
  return <div className={s.actions}><HomeLink href="/chauffeur" event={`${location}_app`} className={s.primary}>Découvrir l’application <ArrowRight size={19} aria-hidden="true"/></HomeLink><HomeLink href="/partenaire" event={`${location}_partner`} className={s.secondary}>Devenir partenaire <ArrowUpRight size={18} aria-hidden="true"/></HomeLink></div>
}

export default function Home() {
  return <div className={`foreas-home ${s.page}`}>
    <PublicActivityToast/>
    
    <header className={`${s.container} ${s.header}`}>
      <a href="/" aria-label="FOREAS, accueil" className={s.brand}><ForeasLogo/></a>
      <nav className={s.nav} aria-label="Navigation principale"><HomeLink href="/chauffeur">L’application</HomeLink><HomeLink href="/partenaire">Partenaires</HomeLink><a href="#essentiel">L’essentiel</a><a href="#questions">Questions</a></nav>
      <BrandSoundButton/>
      <a className={s.login} href={authUrls.loginGeneric}>Mon espace <ArrowUpRight size={16} aria-hidden="true"/></a>
      <HomeMenu login={authUrls.loginGeneric}/>
    </header>
    <main id="main-content">
      <section className={s.hero} aria-labelledby="hero-titre">
        <div className={s.heroPhoto}><Image src="/media/home/binate-hero.webp" alt="Alassane Binate, chauffeur VTC, dans son véhicule" fill priority sizes="(max-width: 700px) 100vw, 65vw"/></div>
        <div className={s.heroAtmosphere} aria-hidden="true"/>
        <div className={`${s.container} ${s.heroInner}`}>
          <div className={s.heroCopy}>
            <p className={s.eyebrow}><span/> FOREAS DRIVER · L’APPLICATION DES CHAUFFEURS VTC</p>
            <h1 id="hero-titre">Un prix ne fait pas<br/><span>une bonne course.</span></h1>
            <p className={s.lead}>Avant d’accepter, regarde l’ensemble.</p>
            <p className={s.heroDescription}>FOREAS t’aide à estimer tes courses, à suivre ton activité et à garder le lien avec tes clients.</p>
            <Actions location="hero"/>
            <div className={s.available}><Smartphone size={16} aria-hidden="true"/> Sur iPhone et Android <span>·</span> Tu gardes tes applications</div>
          </div>
          <div className={s.heroSignature}><span>FOREAS</span><p>Toujours plus loin.</p></div>
        </div>
        <div className={s.horizon} aria-hidden="true"/>
      </section>

      <section className={`${s.container} ${s.product}`} aria-labelledby="produit-titre">
        <div className={s.productVisual}>
          <div className={s.orbit} aria-hidden="true"/>
          <div className={s.device}><Image src="/media/home/foreas-rotato.webp" alt="FOREAS Driver sur téléphone : exemple de carte autour de CDG" width={610} height={1195} sizes="(max-width: 700px) 250px, 290px" className={s.phone}/></div>
          <span className={s.productCaption}>FOREAS Driver · carte en mode démonstration</span>
        </div>
        <div className={s.productCopy}>
          <p className={s.eyebrow}>MOINS DE FLOU. PLUS DE MAÎTRISE.</p>
          <h2 id="produit-titre">Tu connais la route.<br/><span>Vois ce qu’elle te rapporte.</span></h2>
          <p>Le montant d’une course ne raconte pas toute l’histoire. L’approche, le temps passé et tes frais changent la lecture.</p>
          <div className={s.useList}>
            <div><ScanLine size={22} aria-hidden="true"/><div><h3>Lis une course avant de choisir.</h3><p>Une estimation pour éclairer ta décision. Tu gardes le dernier mot.</p></div></div>
            <div><ChartNoAxesCombined size={22} aria-hidden="true"/><div><h3>Fais le point sur ton activité.</h3><p>Retrouve tes courses et distingue les montants encaissés des frais estimés.</p></div></div>
            <div><MessageCircle size={22} aria-hidden="true"/><div><h3>Pose ta question à Ajnaya.</h3><p>Un échange pour comprendre l’app et préparer la suite de ta journée.</p></div></div>
          </div>
          <HomeLink href="/chauffeur" event="product_app" className={s.textLink}>Voir ce que l’application peut faire <ArrowRight size={18} aria-hidden="true"/></HomeLink>
        </div>
      </section>

      <section className={`${s.container} ${s.demo}`} aria-labelledby="demo-titre">
        <div className={s.sectionHeading}><div><p className={s.eyebrow}>LE PRODUIT, EN SITUATION</p><h2 id="demo-titre">Une course s’affiche.<br/><span>Tu vois plus que son prix.</span></h2></div><p>Le chiffre affiché attire l’œil.<br/>Le détail t’aide à décider.</p></div>
        <Film src="/media/home/course-demo.mp4" poster="/media/home/course-poster.webp" label="Voir l’analyse d’une course" caption="Démonstration de Verdict Instant. Les montants illustrent cet exemple. Les estimations dépendent de tes réglages et de ton téléphone."/>
      </section>

      <section className={`${s.container} ${s.direct}`} aria-labelledby="direct-titre">
        <div className={s.directCopy}><p className={s.eyebrow}>LE PROCHAIN TRAJET COMMENCE PAR UN LIEN</p><h2 id="direct-titre">« Je peux vous<br/><span>recontacter ? »</span></h2><p>Ton client a apprécié le trajet. Donne-lui une adresse à retrouver, un site à ton nom et un moyen de te demander sa prochaine réservation.</p><p className={s.directAccent}>Un contact aujourd’hui.<br/>Une relation qui peut continuer.</p><HomeLink href="/chauffeur#vitrine" event="direct_app" className={s.textLink}>Découvrir ton site de réservation <ArrowRight size={18} aria-hidden="true"/></HomeLink></div>
        <BookingPreview/>
      </section>

      <section className={s.partners} aria-labelledby="partenaire-titre"><div className={`${s.container} ${s.partnersInner}`}>
        <div className={s.partnerArt} aria-hidden="true"><Image src="/media/home/paris.webp" alt="" fill sizes="(max-width: 700px) 100vw, 50vw"/><span className={s.partnerWord}>Ensemble,<br/>plus loin.</span></div>
        <div className={s.partnerCopy}><p className={s.eyebrow}>PROGRAMME PARTENAIRE</p><h2 id="partenaire-titre">Tu connais les chauffeurs.<br/><span>Fais connaître FOREAS.</span></h2><p>Formateur, loueur, professionnel ou membre d’une communauté : recommande l’application et suis les inscriptions liées à ton lien personnel.</p><HomeLink href="/partenaire" event="section_partner" className={s.primary}>Découvrir le programme <ArrowRight size={18} aria-hidden="true"/></HomeLink><p className={s.small}>Les conditions et la rémunération sont présentées avant ton inscription.</p></div>
      </div></section>

      <section className={`${s.container} ${s.essentials}`} id="essentiel" aria-labelledby="essentiel-titre">
        <div className={s.sectionHeading}><div><p className={s.eyebrow}>PRENDS L’APP PAR LE BON BOUT</p><h2 id="essentiel-titre">Ce qui compte<br/><span>pour ta prochaine journée.</span></h2></div><HomeLink href="/chauffeur" className={s.textLink}>Explorer l’application <ArrowUpRight size={18} aria-hidden="true"/></HomeLink></div>
        <div className={s.resources}>
          <HomeLink href="/chauffeur" event="resource_course"><div className={s.resourceImage}><Image src="/media/home/night-drive.webp" alt="Route urbaine de nuit, illustration" fill sizes="(max-width: 700px) 90vw, 30vw"/></div><div className={s.resourceText}><span>COMPRENDRE</span><h3>Une course, c’est aussi du temps.</h3><p>Regarde ce qu’il y a derrière le montant affiché.</p><ArrowUpRight size={22} aria-hidden="true"/></div></HomeLink>
          <HomeLink href="/chauffeur#vitrine" event="resource_direct"><div className={s.resourceImage}><Image src="/demo/autocollant.jpg" alt="Exemple de support QR pour retrouver le site du chauffeur" fill sizes="(max-width: 700px) 90vw, 30vw"/></div><div className={s.resourceText}><span>GARDER LE CONTACT</span><h3>Un client peut te retrouver.</h3><p>Découvre comment présenter ton site de réservation.</p><ArrowUpRight size={22} aria-hidden="true"/></div></HomeLink>
          <HomeLink href="/chauffeur#carnet" event="resource_activity"><div className={s.resourceImage}><Image src="/demo/export-mensuel.jpg" alt="Exemple d’export de l’activité du chauffeur" fill sizes="(max-width: 700px) 90vw, 30vw"/></div><div className={s.resourceText}><span>SUIVRE TON ACTIVITÉ</span><h3>Des chiffres à remettre en perspective.</h3><p>Fais le point sur tes courses et tes frais estimés.</p><ArrowUpRight size={22} aria-hidden="true"/></div></HomeLink>
        </div>
      </section>

      <section className={`${s.container} ${s.faq}`} id="questions" aria-labelledby="questions-titre"><div><p className={s.eyebrow}>AVANT DE PRENDRE LA ROUTE</p><h2 id="questions-titre">Tes questions.<br/><span>Des réponses claires.</span></h2><a href="mailto:contact@foreas.xyz" className={s.textLink}>Écrire à FOREAS <ArrowUpRight size={18} aria-hidden="true"/></a></div><div className={s.questions}>{questions.map(([q,a])=><details key={q}><summary>{q}<Plus size={19} aria-hidden="true"/></summary><p>{a}</p></details>)}</div></section>

      <section className={s.closing} aria-labelledby="final-titre"><div className={s.closingLight} aria-hidden="true"/><div className={s.container}><p className={s.eyebrow}>FOREAS, TOUJOURS PLUS LOIN.</p><h2 id="final-titre">La suite de ton activité<br/><span>commence par tes choix.</span></h2><p>Découvre l’app. Vois ce qu’elle peut t’apporter.<br/>Avance à ton rythme.</p><Actions location="final"/></div></section>
    </main>
    <footer className={`${s.container} ${s.footer}`}><div className={s.footerTop}><div className={s.footerBrand}><ForeasLogo className={s.footerLogo}/><p>Toujours plus loin.</p></div><nav aria-label="Découvrir FOREAS"><HomeLink href="/chauffeur">L’application</HomeLink><HomeLink href="/partenaire">Partenaires</HomeLink><a href={authUrls.loginGeneric}>Mon espace</a><a href="mailto:contact@foreas.xyz">Nous contacter <MoveUpRight size={14} aria-hidden="true"/></a></nav></div><div className={s.footerBottom}><p>© 2026 FOREAS. Tous droits réservés.</p><nav aria-label="Informations légales"><a href="/mentions-legales">Mentions légales</a><a href="/confidentialite">Confidentialité</a><a href="/cgu">Conditions</a></nav></div></footer>
  </div>
}

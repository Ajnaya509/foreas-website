import type { Metadata } from 'next'
import Link from 'next/link'
import '../partenaire.css'

export const metadata: Metadata = {
  title: 'Tes données de candidature partenaire — FOREAS',
  description: 'Qui reçoit ta candidature FOREAS, pourquoi, combien de temps et comment exercer tes droits.',
  robots: { index: false, follow: true },
}

export default function DonneesCandidaturePartenaire() {
  return <main className="partner-page">
    <header className="partner-header">
      <Link className="partner-brand" href="/">FOREAS<span>DRIVER</span></Link>
      <Link className="partner-link" href="/devenir-partenaire">Revenir à ma candidature</Link>
    </header>
    <article className="partner-privacy">
      <div className="partner-intro">
        <p className="partner-eyebrow">Candidature partenaire · Version du 9 septembre 2026</p>
        <h1>Tes données, pour étudier ton projet.</h1>
        <p>Cette notice concerne le formulaire de candidature au programme partenaire FOREAS Driver. L’envoi permet d’examiner ton projet et de te répondre. Il ne vaut ni admission, ni inscription à une liste publicitaire.</p>
      </div>
      <section><h2>Qui s’en occupe ?</h2>
        <p>EPHIALTES, SIREN 940 879 281, 58 rue de Monceau, 75008 Paris, France, est responsable de ce traitement. Pour une question ou une demande concernant tes données : <a href="mailto:contact@foreas.xyz">contact@foreas.xyz</a>.</p>
      </section>
      <section><h2>Ce que nous te demandons</h2>
        <p>L’activité, la structure ou le nom professionnel, ton nom et ton email sont nécessaires pour recevoir et examiner la demande. Sans ces informations, le formulaire ne peut pas être envoyé.</p>
        <p>Le site professionnel, la zone, le type de collaboration, le téléphone, le SIRET et le message sont facultatifs. Le projet « Recommander FOREAS » est proposé par défaut et peut être changé. Une référence et les dates du dossier sont enregistrées pour le suivre.</p>
        <p>Les services techniques traitent aussi les informations de connexion nécessaires à la sécurité. Le formulaire utilise un identifiant dérivé de l’adresse réseau pour limiter les envois abusifs. N’ajoute aucun mot de passe, document bancaire, donnée sensible ou information privée d’un chauffeur dans ton message.</p>
      </section>
      <section><h2>Pourquoi et sur quelle base ?</h2>
        <p>Si tu candidates pour toi-même, l’examen et la préparation de la collaboration répondent à ta demande avant un éventuel contrat. Si tu représentes une structure, EPHIALTES utilise tes coordonnées dans son intérêt légitime à instruire la demande de cette structure et à échanger avec son représentant.</p>
        <p>La protection contre les abus et la conservation des éléments nécessaires à un désaccord reposent sur l’intérêt légitime de sécuriser le programme et de défendre les droits des parties. La candidature est examinée par les personnes habilitées ; une décision d’admission n’est pas prise par le seul formulaire.</p>
      </section>
      <section><h2>Qui reçoit les informations ?</h2>
        <p>Les personnes habilitées d’EPHIALTES accèdent au dossier. Vercel héberge le site et traite son envoi. Supabase enregistre le dossier et son suivi. Le service Resend assure les courriels de confirmation et l’alerte destinée à EPHIALTES lorsqu’un envoi est effectué.</p>
        <p>L’alerte interne contient seulement la référence du dossier et un lien vers l’administration protégée. Les informations détaillées restent dans le dossier. Le courriel de confirmation utilise ton adresse, ton nom, ta structure et la référence. Les services de messagerie des destinataires reçoivent leurs courriels.</p>
        <p>Cette candidature ne donne pas accès aux comptes, revenus, trajets ou positions de chauffeurs. Ses informations ne sont pas communiquées à d’autres partenaires pour leur prospection.</p>
      </section>
      <section><h2>Où peuvent-elles être traitées ?</h2>
        <p>Les prestataires peuvent faire intervenir des équipes ou des infrastructures hors de l’Espace économique européen. Resend indique notamment stocker les messages et leurs traces aux États-Unis. Choisir une région européenne d’envoi ne signifie pas que toutes ses copies restent en Europe.</p>
        <p>Les accords de traitement de <a href="https://vercel.com/legal/dpa" rel="noreferrer">Vercel</a>, <a href="https://supabase.com/legal/customer-resources/data-processing-addendum" rel="noreferrer">Supabase</a> et <a href="https://resend.com/legal/dpa" rel="noreferrer">Resend</a> prévoient des garanties de transfert, notamment les clauses contractuelles types européennes dans les situations concernées. Tu peux demander à EPHIALTES des précisions et une copie des garanties applicables à ton dossier.</p>
      </section>
      <section><h2>Combien de temps ?</h2>
        <p>La candidature est conservée pendant son examen. En cas de refus, de retrait ou d’échange resté sans suite, les informations du dossier et les copies de suivi détenues par EPHIALTES sont supprimées au plus tard six mois après la décision, le retrait ou le dernier échange. Une demande restée ouverte ne justifie pas une conservation indéfinie.</p>
        <p>Si tu deviens partenaire, seules les informations utiles rejoignent le dossier de collaboration. Les accords et leurs preuves sont conservés pendant la relation, puis cinq ans en archive à accès limité. Les pièces comptables suivent leur durée propre de dix ans à compter de la clôture de l’exercice. Un litige peut justifier de conserver les seuls éléments nécessaires jusqu’à sa résolution et au terme du délai applicable.</p>
        <p>Les copies techniques des prestataires ne sont pas toutes effacées au même instant. <a href="https://resend.com/security/gdpr" rel="noreferrer">Resend indique</a> trente jours pour les messages et traces des offres standard, et sept jours pour ses sauvegardes ; les offres personnalisées peuvent prévoir une autre durée. Les journaux d’hébergement et les sauvegardes suivent les réglages du service utilisé et leur cycle d’expiration. EPHIALTES prend en compte ces copies lors d’une demande d’effacement.</p>
      </section>
      <section><h2>Tes droits et ton contact</h2>
        <p>Tu peux demander l’accès à tes données, leur rectification, leur effacement ou la limitation de leur utilisation. Tu peux t’opposer aux traitements fondés sur l’intérêt légitime et demander la portabilité lorsque ses conditions s’appliquent. Un archivage légal ou un litige peut limiter l’effacement de certaines pièces ; nous t’en expliquons la raison.</p>
        <p>Écris à <a href="mailto:contact@foreas.xyz?subject=Donn%C3%A9es%20de%20candidature%20partenaire">contact@foreas.xyz</a>, en précisant si possible la référence de ta candidature. N’envoie pas spontanément une pièce d’identité : un complément limité ne sera demandé que si ton identité doit être confirmée. Tu peux aussi adresser une réclamation à la <a href="https://www.cnil.fr/fr/plaintes" rel="noreferrer">CNIL</a>.</p>
        <p>Les éventuels traceurs facultatifs du site se gèrent séparément. Envoyer une candidature ne modifie pas tes choix de traceurs et n’autorise pas de nouvelles sollicitations sans rapport avec ton projet.</p>
      </section>
      <Link className="partner-link" href="/devenir-partenaire">Revenir au formulaire</Link>
    </article>
    <footer className="partner-footer">EPHIALTES · Programme partenaire FOREAS Driver</footer>
  </main>
}

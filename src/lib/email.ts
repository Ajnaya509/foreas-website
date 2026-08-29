import { Resend } from 'resend'
import { APP_STORE_URL, PLAY_STORE_URL } from '@/lib/app-stores'
import { repere } from './journal'
import { PANIER_TEXTES } from './textesAutomatiques'

/**
 * ⚠️ 21/08/2026 — DEUX REPLIS DIVERGENTS POUR LA MÊME VARIABLE.
 *
 * Ce fichier repliait sur `https://dashboard.foreas.xyz`, qui NE RÉSOUT PAS EN
 * DNS — vérifié : la requête échoue avant même d'atteindre un serveur.
 * `src/lib/auth-urls.ts` replie, lui, sur `partners.foreas.xyz`, et son propre
 * commentaire interdit d'écrire ce sous-domaine ailleurs.
 *
 * Un repli n'existe que pour le jour où la variable manque. Celui-ci menait
 * donc, ce jour-là précisément, vers un nom qui n'existe pas.
 */
const DASH_DEFAUT = 'https://partners.foreas.xyz'
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

/**
 * Bloc identifiants — n'apparaît QUE si le compte vient d'être créé par le webhook Stripe
 * (source `checkout`). Le mot de passe est en clair : c'est le seul que ce chauffeur possède,
 * il n'a aucun autre moyen d'entrer dans l'app. Cf. provisionDriverAccount.ts.
 * Si le compte existait déjà, `credentials` est null et ce bloc disparaît — on ne dit jamais
 * « voici ton mot de passe » à quelqu'un dont on n'a pas fixé le mot de passe.
 */
function buildCredentialsBlock({ email, password }: { email: string; password: string }): string {
  return `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:36px;">
        <tr><td style="background-color:#0e0e16;border:1px solid #2a2a3a;border-radius:14px;padding:24px;">
          <div style="font-family:'Genos',sans-serif;font-size:14px;font-weight:600;color:#00D4FF;letter-spacing:1.5px;margin-bottom:16px;">TES IDENTIFIANTS</div>

          <div style="font-family:'Montserrat',sans-serif;font-size:11px;color:#5a5a6e;letter-spacing:0.5px;margin-bottom:5px;">EMAIL</div>
          <div style="font-family:'Montserrat',sans-serif;font-size:15px;color:#F8FAFC;font-weight:600;margin-bottom:18px;word-break:break-all;">${escapeHtml(email)}</div>

          <div style="font-family:'Montserrat',sans-serif;font-size:11px;color:#5a5a6e;letter-spacing:0.5px;margin-bottom:5px;">MOT DE PASSE</div>
          <div style="font-family:'JetBrains Mono','Courier New',monospace;font-size:20px;color:#F8FAFC;font-weight:700;letter-spacing:1.5px;">${escapeHtml(password)}</div>

          <div style="font-family:'Montserrat',sans-serif;font-size:12px;color:#8888a0;line-height:1.6;margin-top:18px;padding-top:16px;border-top:1px solid #1e1e2a;">
            On l&rsquo;a g&eacute;n&eacute;r&eacute; pour toi. Tu pourras le changer dans l&rsquo;app, Profil &rsaquo; S&eacute;curit&eacute;.
          </div>
        </td></tr>
      </table>
`
}

/**
 * ⚠️ 28/08 — LE MAIL LAISSAIT UN CHAUFFEUR DEVANT UNE PORTE CLOSE.
 *
 * Le bloc identifiants n'est posé que si le compte VIENT d'être créé. Quand
 * l'adresse existait déjà — l'app essayée avant de s'abonner, un test, un ancien
 * compte gratuit — le mail partait quand même : beau, complet, et disant
 * « Télécharge l'app et connecte-toi ». Sans dire avec quoi.
 *
 * Rien ne le signalait : ni erreur, ni alerte. Et la page d'après-paiement
 * affirmait pendant ce temps que le mot de passe était dans ce mail.
 *
 * On ne réécrit toujours PAS son mot de passe — il s'en sert peut-être tous les
 * jours, et le changer sous ses pieds le déconnecterait. On lui dit simplement
 * ce qui est vrai : il a déjà un compte, il se connecte avec.
 */
function buildExistingAccountBlock({ email }: { email: string }): string {
  return `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:36px;">
        <tr><td style="background-color:#0e0e16;border:1px solid #2a2a3a;border-radius:14px;padding:24px;">
          <div style="font-family:'Genos',sans-serif;font-size:14px;font-weight:600;color:#00D4FF;letter-spacing:1.5px;margin-bottom:16px;">TU AS D&Eacute;J&Agrave; UN COMPTE</div>

          <div style="font-family:'Montserrat',sans-serif;font-size:11px;color:#5a5a6e;letter-spacing:0.5px;margin-bottom:5px;">EMAIL</div>
          <div style="font-family:'Montserrat',sans-serif;font-size:15px;color:#F8FAFC;font-weight:600;margin-bottom:18px;word-break:break-all;">${escapeHtml(email)}</div>

          <div style="font-family:'Montserrat',sans-serif;font-size:13px;color:#8888a0;line-height:1.6;">
            Cette adresse a d&eacute;j&agrave; un compte FOREAS. Connecte-toi avec ton mot de passe
            habituel &mdash; on n&rsquo;y a pas touch&eacute;. Si tu l&rsquo;as oubli&eacute;, utilise
            &laquo;&nbsp;Mot de passe oubli&eacute;&nbsp;&raquo; sur l&rsquo;&eacute;cran de connexion de l&rsquo;app.
          </div>
        </td></tr>
      </table>
`
}

function buildWelcomeHTML({ name, plan, trialEnd, credentials, dejaInscrit }: {
  name: string; plan: string; trialEnd: string
  credentials?: { email: string; password: string } | null
  /** Vrai quand le compte existait déjà : on explique, au lieu de se taire. */
  dejaInscrit?: { email: string } | null
}) {
  /* ⚠️ 29/08 — CE REPLI DISAIT « Bienvenue, Chauffeur. » À TOUS LES PAYANTS.
     Le prénom a quitté la page de paiement (v187) : il n'est demandé qu'APRÈS,
     sur /success. À l'instant où ce mail part, on ne le connaît donc pas — et
     `name` est vide pour 100 % du tunnel principal.
     La page de succès a été réparée le matin même ; son jumeau, ce mail, ne
     l'avait pas été. C'est le premier objet que reçoit un client qui vient de
     payer, et il lui disait qu'on ne sait pas qui il est.
     Chaîne vide plutôt que faux prénom : le titre juste en dessous s'adapte. */
  const firstName = name ? name.split(' ')[0] : ''
  // Genos = titres (font-weight 600), Genos italic = taglines, Montserrat = body
  // Fallback: sans-serif sur les clients qui ne supportent pas Google Fonts
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Genos:ital,wght@0,400;0,600;0,700;1,400;1,500&family=Montserrat:wght@400;500;600&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background-color:#050508;">
  <div style="max-width:600px;margin:0 auto;padding:0;">

    <!-- ═══ HEADER IMAGE ═══ -->
    <div style="background-color:#000000;text-align:center;">
      <img src="https://www.foreas.xyz/assets/email-entete.png" alt="FOREAS/ — Toujours plus loin." width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;" />
    </div>

    <!-- ═══ MAIN CONTENT — Monochrome élégant ═══ -->
    <div style="background-color:#050508;padding:40px 28px;">

      <!-- Check discret -->
      <div style="text-align:center;margin-bottom:28px;">
        <div style="display:inline-block;width:52px;height:52px;border-radius:50%;background-color:#0e0e16;border:1.5px solid #2a2a3a;line-height:52px;text-align:center;">
          <span style="font-size:24px;color:#ffffff;">&#10003;</span>
        </div>
      </div>

      <!-- Titre en Genos 600 — blanc pur -->
      <h1 style="font-family:'Genos',sans-serif;font-size:30px;font-weight:600;color:#ffffff;text-align:center;margin:0 0 6px;line-height:1.2;">
        ${firstName ? `Bienvenue, ${escapeHtml(firstName)}.` : 'Bienvenue chez FOREAS.'}
      </h1>
      <!-- Sous-titre en Montserrat — gris doux -->
      <p style="font-family:'Montserrat',sans-serif;font-size:14px;color:#6b6b80;text-align:center;margin:0 0 36px;line-height:1.6;">
        Ton abonnement est actif. <strong style="color:#F8FAFC;">0&nbsp;&euro; aujourd&rsquo;hui.</strong>
      </p>

      <!-- ═══ PLAN CARD — sobre, un seul accent gradient en top ═══ -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
        <tr><td style="background-color:#0a0a12;border:1px solid #18182a;border-radius:14px;padding:0;overflow:hidden;">
          <div style="height:2px;background:linear-gradient(90deg, #00D4FF, #8C52FF, #00D4FF);"></div>
          <div style="padding:24px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding-bottom:16px;border-bottom:1px solid #18182a;">
                  <div style="font-family:'Montserrat',sans-serif;font-size:10px;color:#4a4a5e;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px;">Ton plan</div>
                  <div style="font-family:'Genos',sans-serif;font-size:22px;font-weight:600;color:#ffffff;">${plan}</div>
                </td>
              </tr>
              <tr>
                <td style="padding-top:16px;">
                  <div style="font-family:'Montserrat',sans-serif;font-size:13px;color:#8888a0;line-height:1.8;">
                    Trois jours offerts, jusqu&rsquo;au ${trialEnd}<br/>
                    Premier paiement le ${trialEnd}
                  </div>
                </td>
              </tr>
            </table>
          </div>
        </td></tr>
      </table>

      <!--
        ⚠️ 28/08 — LA GRAINE DE RÉTENTION, LA MÊME QUE SUR LE SITE.
        Le chauffeur vient de lire « trois jours offerts » : sans ça, il comprend
        « trois jours pour essayer », c'est-à-dire un compte à rebours avant de
        payer. Un compte à rebours pousse à ATTENDRE. Cette phrase-là pousse à
        ROULER, et c'est en roulant qu'Ajnaya devient utile.
        Le « tout en » est le mot qui compte : une promesse au futur dirait « je
        paie aujourd'hui, on me répond demain » — exactement le sentiment de
        s'être fait avoir. « Tout en » dit que ça marche PENDANT.
        ⚠️ Elle doit rester vraie : aucun chiffre, aucune date, aucun gain
        annoncé. Ce qui fonctionne dès la première course ne dépend d'aucun
        apprentissage — le calcul de ce qui reste vraiment sur une course, et
        Ajnaya qui répond quand on lui demande.
      -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
        <tr><td style="padding:0 4px;">
          <div style="font-family:'Montserrat',sans-serif;font-size:15px;line-height:1.65;color:#F8FAFC;">
            Pendant trois jours, Ajnaya apprend comment tu travailles, tout en
            t&rsquo;apportant du r&eacute;sultat.
          </div>
          <div style="font-family:'Montserrat',sans-serif;font-size:13px;line-height:1.6;color:#8888a0;margin-top:8px;">
            Tes zones, tes heures, tes d&eacute;cisions&nbsp;: chaque course lui en dit un peu plus.
          </div>
        </td></tr>
      </table>

      <!-- ⚠️ 28/08 — LES IDENTIFIANTS SONT REMONTÉS AU-DESSUS DU BOUTON.
           Ils étaient dessous. Or le bouton envoie vers /go, qui ouvre l'App
           Store : le chauffeur QUITTE le mail. Sur iPhone il installe, puis il
           tape « Ouvrir » — il ne revient jamais lire la suite. Son mot de passe
           était rangé derrière une porte qu'il ne repousse pas.
           Il le lit maintenant AVANT de partir. -->
      ${credentials ? buildCredentialsBlock(credentials) : dejaInscrit ? buildExistingAccountBlock(dejaInscrit) : ''}

      <!-- ═══ CTA BUTTON — seule vraie couleur ═══ -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
        <tr><td align="center">
          <table cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:380px;">
            <tr>
              <td align="center" style="background-color:#8C52FF;border-radius:12px;padding:0;">
                <a href="https://www.foreas.xyz/go" style="display:block;padding:16px 32px;color:#ffffff;font-family:'Genos',sans-serif;font-size:17px;font-weight:600;text-decoration:none;text-align:center;letter-spacing:0.5px;">
                  T&eacute;l&eacute;charger l&rsquo;app &rarr;
                </a>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>

      <!-- ⚠️ 28/08 — CE PARAGRAPHE ÉTAIT IMPRIMÉ DANS LE BOUTON.
           Il vivait dans la cellule qui porte le fond violet : du gris à 45 %
           d'opacité sur du #8C52FF, illisible, et collé sous « Télécharger
           l'app » comme s'il en faisait partie. Vu seulement en rendant le mail
           pour de vrai — le code, lui, était valide.
           ⚠️ Le lien de récupération n'est pas présenté comme éprouvé : sur tout
           l'historique, 22 demandes de réinitialisation pour UN SEUL changement
           effectif. Il est cliquable ; qu'il aboutisse reste à prouver. -->
      <p style="margin:0 0 32px;font-family:'Montserrat',sans-serif;font-size:12px;line-height:1.6;color:rgba(248,250,252,0.45);text-align:center;">
        Mot de passe perdu&nbsp;? <a href="https://partners.foreas.xyz/auth/reset" style="color:rgba(248,250,252,0.7);">Re&ccedil;ois-en un nouveau</a>. Une question&nbsp;? R&eacute;ponds &agrave; ce mail, on lit tout.
      </p>

      <!-- Store links — gris discret -->
      <p style="text-align:center;font-family:'Montserrat',sans-serif;font-size:11px;color:#3a3a4a;margin:0 0 40px;">
        <a href="${APP_STORE_URL}" style="color:#5a5a6e;text-decoration:none;">App Store</a>
        <span style="color:#2a2a3a;"> &nbsp;&middot;&nbsp; </span>
        <a href="${PLAY_STORE_URL}" style="color:#5a5a6e;text-decoration:none;">Google Play</a>
      </p>

      <!-- ═══ NEXT STEPS — minimaliste ═══ -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:36px;">
        <tr><td style="padding:0;">
          <div style="font-family:'Genos',sans-serif;font-size:14px;font-weight:600;color:#4a4a5e;letter-spacing:1.5px;margin-bottom:18px;">PROCHAINES &Eacute;TAPES</div>
          <table cellpadding="0" cellspacing="0" border="0" style="width:100%;">
            <tr>
              <td style="width:24px;vertical-align:top;padding-right:14px;padding-bottom:16px;">
                <div style="width:24px;height:24px;border-radius:50%;background-color:#0e0e16;border:1px solid #2a2a3a;color:#6b6b80;font-family:'Genos',sans-serif;font-size:12px;font-weight:600;text-align:center;line-height:24px;">1</div>
              </td>
              <td style="font-family:'Montserrat',sans-serif;font-size:13px;color:#8888a0;padding-bottom:16px;line-height:1.5;">T&eacute;l&eacute;charge l&rsquo;app et connecte-toi${credentials ? ' avec les identifiants ci-dessus' : dejaInscrit ? ' avec ton mot de passe habituel' : ''}</td>
            </tr>
            <tr>
              <td style="width:24px;vertical-align:top;padding-right:14px;padding-bottom:16px;">
                <div style="width:24px;height:24px;border-radius:50%;background-color:#0e0e16;border:1px solid #2a2a3a;color:#6b6b80;font-family:'Genos',sans-serif;font-size:12px;font-weight:600;text-align:center;line-height:24px;">2</div>
              </td>
              <td style="font-family:'Montserrat',sans-serif;font-size:13px;color:#8888a0;padding-bottom:16px;line-height:1.5;">Ajnaya fait le tour de l&rsquo;app avec toi &mdash; trois minutes, pas plus</td>
            </tr>
            <tr>
              <td style="width:24px;vertical-align:top;padding-right:14px;">
                <div style="width:24px;height:24px;border-radius:50%;background-color:#0e0e16;border:1px solid #2a2a3a;color:#6b6b80;font-family:'Genos',sans-serif;font-size:12px;font-weight:600;text-align:center;line-height:24px;">3</div>
              </td>
              <td style="font-family:'Montserrat',sans-serif;font-size:13px;color:#8888a0;line-height:1.5;">Roule comme d&rsquo;habitude. C&rsquo;est en roulant qu&rsquo;elle apprend</td>
            </tr>
          </table>
        </td></tr>
      </table>

    </div>

    <!-- ═══ FOOTER — sobre ═══ -->
    <div style="padding:24px 28px;text-align:center;border-top:1px solid #12121e;">
      <p style="font-family:'Montserrat',sans-serif;font-size:12px;color:#4a4a5e;margin:0 0 8px;line-height:1.6;">
        Des questions ?
        <a href="mailto:contact@foreas.xyz" style="color:#7a7a90;text-decoration:none;">contact@foreas.xyz</a>
      </p>
      <p style="font-family:'Genos',sans-serif;font-style:italic;font-size:12px;color:#2a2a3a;margin:0 0 10px;">Toujours plus loin.</p>
      <p style="font-family:'Montserrat',sans-serif;font-size:9px;color:#1e1e2a;margin:0;">
        FOREAS Labs &middot; Paris &middot;
        <a href="https://foreas.xyz/unsubscribe" style="color:#1e1e2a;text-decoration:underline;">Se d&eacute;sabonner</a>
      </p>
    </div>

  </div>
</body>
</html>`
}

export async function sendWelcomeEmail({ email, name, plan, trialEnd, credentials, dejaInscrit }: {
  email: string; name: string; plan: string; trialEnd: string
  /** Renseigné uniquement quand le webhook vient de CRÉER le compte (voir provisionDriverAccount). */
  credentials?: { email: string; password: string } | null
  /** Renseigné quand le compte existait déjà : le mail explique au lieu de se taire. */
  dejaInscrit?: { email: string } | null
}): Promise<boolean> {
  if (!resend) {
    console.log('[Email] Resend non configuré — email non envoyé à', repere(email))
    return false
  }
  try {
      // ⚠️ 21/08/2026 — CE JOURNAL DISAIT « ENVOYÉ » À CHAQUE ÉCHEC.
      //
      // Le client Resend ne lève pas : il résout avec { data: null, error }.
      // Personne ne déstructurait `error`, donc la ligne suivante s'exécutait
      // et affirmait l'envoi. Le `catch` était du code mort pour ce cas.
      //
      // C'est EXACTEMENT le piège de l'écriture Supabase corrigée le matin —
      // deux bibliothèques différentes, la même famille. Je l'ai manqué au
      // premier passage, dans le fichier d'à côté.
      //
      // CE QUE ÇA COÛTAIT : le compte du chauffeur est créé, son mot de passe
      // n'existe QUE dans ce mail, et l'alerte d'échec ne part pas puisque le
      // provisionnement, lui, a réussi. Un chauffeur payé, sans identifiants,
      // et personne au courant.
      const { error } = await resend.emails.send({
      from: 'FOREAS <noreply@foreas.xyz>',
      to: email,
      /* ⚠️ 28/08 — LE SUJET NE DÉCRIT PLUS, IL DONNE UNE RAISON D'OUVRIR.
         « Ton essai FOREAS est activé » raconte ce qui vient de se passer : il le
         sait, il vient de payer. Ce mail-ci porte ses IDENTIFIANTS, et c'est la
         seule chose qu'il n'a nulle part ailleurs. Le sujet le dit.
         ⚠️ Et il change quand le compte existait déjà : promettre des identifiants
         dans un mail qui n'en contient aucun, c'est le meilleur moyen de lui
         apprendre à ne plus nous croire. */
      subject: credentials
        ? `${name ? name.split(' ')[0] + ', t' : 'T'}es identifiants FOREAS sont dans ce mail`
        : `${name ? name.split(' ')[0] + ', t' : 'T'}on abonnement FOREAS est actif`,
      /* ⚠️ LE MAIL DISAIT « RÉPONDS À CE MESSAGE », ET IL PARTAIT D'UN NOREPLY.
         La réponse tombait dans le vide, sans rebond, sans que personne ne le
         sache. Une promesse d'assistance qui n'aboutit pas coûte plus cher que
         pas de promesse du tout. */
      replyTo: 'contact@foreas.xyz',
      html: buildWelcomeHTML({ name, plan, trialEnd, credentials, dejaInscrit }),
    })
      if (error) {
        // ⚠️ RISQUE RÉSIDUEL ASSUMÉ, 21/08/2026. Le message d'erreur vient du
        // service d'envoi et peut recopier l'adresse du destinataire
        // (« Invalid recipient: … »). On le garde quand même : sans lui, un
        // échec d'envoi devient indiagnosticable, et un envoi qui échoue en
        // silence coûte plus cher qu'une adresse dans un journal.
        // Le masquer demanderait de connaître la forme de chaque message —
        // c'est-à-dire de deviner. À revoir si le service documente ses codes.
        console.error(`[Email] ÉCHEC welcome email : ${error.name} — ${error.message}`)
        return false
      }
      console.log('[Email] Welcome email envoyé')
      return true
  } catch (e) {
    console.error('[Email] Échec envoi welcome email:', e)
      return false
  }
}

// ─── Échappement HTML (saisies utilisateur dans les emails — anti-injection) ───
function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  )
}

// Coquille email sobre charte FOREAS (header image + tagline "Toujours plus loin").
/**
 * ⚠️ 29/08 — L'EN-TÊTE DES MAILS ÉTAIT UNE CAPTURE D'ÉCRAN.
 *
 * Elle vivait sur un stockage externe, sous un nom de fichier contenant des
 * accents en forme décomposée (« Capture d'écran 2026-03-26 à 22.01.03.png »).
 * Deux problèmes, et le second est le pire :
 *  · ce n'était pas le logo de la charte, c'était une photo de quelque chose ;
 *  · l'adresse portait des accents combinants. Un ré-envoi depuis un système qui
 *    normalise autrement casse l'image SANS erreur — l'en-tête devient un carré
 *    vide dans le mail qui porte le mot de passe, et personne n'est prévenu.
 *
 * Remplacée par `public/assets/email-entete.png`, fabriquée depuis
 * `public/assets/logo-blanc.svg` (md5 identique au fichier officiel de la
 * charte) et servie depuis foreas.xyz — un domaine qu'on contrôle, une adresse
 * en ASCII pur.
 *
 * ⚠️ NE PAS UTILISER DE SVG ICI. Gmail le retire, Outlook ne le connaît pas :
 * l'en-tête disparaîtrait chez la majorité des chauffeurs.
 */
function foreasEmailShell(inner: string): string {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><link href="https://fonts.googleapis.com/css2?family=Genos:ital,wght@0,400;0,600;0,700;1,400&family=Montserrat:wght@400;500;600&display=swap" rel="stylesheet"></head>
<body style="margin:0;padding:0;background-color:#050508;">
<div style="max-width:600px;margin:0 auto;">
  <div style="background-color:#000000;text-align:center;"><img src="https://www.foreas.xyz/assets/email-entete.png" alt="FOREAS/ — Toujours plus loin." width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;" /></div>
  <div style="background-color:#050508;padding:40px 28px;">${inner}</div>
  <div style="padding:24px 28px;text-align:center;border-top:1px solid #12121e;">
    <p style="font-family:'Genos',sans-serif;font-style:italic;font-size:12px;color:#2a2a3a;margin:0;">Toujours plus loin.</p>
    <p style="font-family:'Montserrat',sans-serif;font-size:9px;color:#1e1e2a;margin:8px 0 0;">FOREAS Labs · Paris · <a href="mailto:contact@foreas.xyz" style="color:#3a3a4a;text-decoration:none;">contact@foreas.xyz</a></p>
  </div>
</div></body></html>`
}

/** Email à l'APPLICANT : "Ta demande de partenariat FOREAS est bien reçue". */
export async function sendPartnerApplicantEmail({ email, contactName, companyName }: {
  email: string; contactName: string; companyName: string
}) {
  if (!resend) { console.log('[Email] Resend non configuré — applicant', repere(email)); return }
  const firstName = contactName ? escapeHtml(contactName.split(' ')[0]) : ''
  const inner = `
    <h1 style="font-family:'Genos',sans-serif;font-size:28px;font-weight:600;color:#ffffff;text-align:center;margin:0 0 12px;line-height:1.2;">Demande bien reçue${firstName ? ', ' + firstName : ''}.</h1>
    <p style="font-family:'Montserrat',sans-serif;font-size:14px;color:#8888a0;text-align:center;margin:0 0 24px;line-height:1.7;">Ta demande de partenariat FOREAS pour <strong style="color:#ffffff;">${escapeHtml(companyName)}</strong> est entre nos mains. On l'étudie et on revient vers toi sous <strong style="color:#ffffff;">24 à 48 h</strong>.</p>
    <p style="font-family:'Montserrat',sans-serif;font-size:13px;color:#6b6b80;text-align:center;margin:0;line-height:1.7;">Rien à faire de ton côté pour l'instant. Si c'est validé, tu recevras un email pour activer ton accès partenaire et choisir ton mot de passe.</p>`
  try {
    await resend.emails.send({
      from: 'FOREAS <noreply@foreas.xyz>',
      to: email,
      subject: 'Ta demande de partenariat FOREAS est bien reçue',
      html: foreasEmailShell(inner),
    })
    console.log('[Email] Partner applicant envoyé à', repere(email))
  } catch (e) { console.error('[Email] Échec applicant:', e) }
}

/** Email INTERNE à contact@foreas.xyz : nouvelle demande + lien admin pour approuver. */
/**
 * Alerte interne : un chauffeur a PAYÉ mais son compte n'a pas pu être créé.
 * Sans ça, l'échec est invisible — il n'existe que dans les logs Vercel, et le chauffeur se
 * retrouve devant un écran de connexion sans identifiants, exactement le mur que le
 * provisionnement était censé supprimer. Ici on veut être réveillé, pas informé.
 */
export async function sendProvisionFailureAlert({ email, name, reason, sujet }: {
  email: string; name?: string | null; reason: string
  /**
   * ⚠️ 28/08 — L'OBJET ÉTAIT FIGÉ, ET C'EST DEVENU FAUX LE JOUR OÙ J'AI RÉUTILISÉ
   * CETTE FONCTION. Elle sert maintenant aussi aux rebonds de courrier, et une
   * alerte de rebond intitulée « Compte non créé après paiement » envoie chercher
   * au mauvais endroit. Un objet d'alerte est lu avant le corps : s'il ment, il
   * fait perdre les premières minutes, celles qui comptent.
   */
  sujet?: string
}) {
  if (!resend) { console.log('[Email] Resend non configuré — alerte provisionnement non envoyée'); return }
  const inner = `
    <h1 style="font-family:'Genos',sans-serif;font-size:24px;font-weight:600;color:#EF4444;margin:0 0 6px;">Chauffeur payant sans compte</h1>
    <p style="font-family:'Montserrat',sans-serif;font-size:13px;color:#8888a0;margin:0 0 24px;">Le paiement est pass&eacute;, la cr&eacute;ation du compte Supabase a &eacute;chou&eacute;. Ce chauffeur ne peut pas se connecter.</p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;background-color:#0a0a12;border:1px solid #18182a;border-radius:12px;padding:8px 16px;">
      <tr><td style="font-family:'Montserrat',sans-serif;font-size:12px;color:#6b6b80;padding:6px 12px 6px 0;width:110px;vertical-align:top;">Email</td><td style="font-family:'Montserrat',sans-serif;font-size:13px;color:#ffffff;padding:6px 0;">${escapeHtml(email)}</td></tr>
      <tr><td style="font-family:'Montserrat',sans-serif;font-size:12px;color:#6b6b80;padding:6px 12px 6px 0;vertical-align:top;">Nom</td><td style="font-family:'Montserrat',sans-serif;font-size:13px;color:#ffffff;padding:6px 0;">${escapeHtml(name || '—')}</td></tr>
      <tr><td style="font-family:'Montserrat',sans-serif;font-size:12px;color:#6b6b80;padding:6px 12px 6px 0;vertical-align:top;">Cause</td><td style="font-family:'Montserrat',sans-serif;font-size:13px;color:#ffffff;padding:6px 0;">${escapeHtml(reason)}</td></tr>
    </table>
    <p style="font-family:'Montserrat',sans-serif;font-size:12px;color:#8888a0;line-height:1.6;margin:0;">Si la cause est <strong style="color:#ffffff;">service_role manquante</strong>, ajouter <code>SUPABASE_SERVICE_ROLE_KEY</code> aux variables d&rsquo;environnement Vercel (production) puis rejouer l&rsquo;&eacute;v&eacute;nement depuis le tableau de bord Stripe.</p>`
  try {
    await resend.emails.send({
      from: 'FOREAS <noreply@foreas.xyz>',
      to: 'contact@foreas.xyz',
      subject: sujet ?? `⚠️ Compte non créé après paiement : ${email}`,
      html: foreasEmailShell(inner),
    })
    console.log('[Email] Alerte provisionnement envoyée pour', repere(email))
  } catch (e) { console.error('[Email] Échec alerte provisionnement:', e) }
}

export async function sendPartnerInternalEmail(app: {
  companyName: string; contactName: string; email: string; phone?: string; siret?: string; message?: string
}) {
  if (!resend) { console.log('[Email] Resend non configuré — internal'); return }
  const adminUrl =
    (process.env.NEXT_PUBLIC_DASHBOARD_URL || DASH_DEFAUT).replace(/\/$/, '') +
    '/admin/partner-pending'
  const row = (k: string, v?: string) =>
    v
      ? `<tr><td style="font-family:'Montserrat',sans-serif;font-size:12px;color:#6b6b80;padding:6px 12px 6px 0;width:110px;vertical-align:top;">${k}</td><td style="font-family:'Montserrat',sans-serif;font-size:13px;color:#ffffff;padding:6px 0;">${escapeHtml(v)}</td></tr>`
      : ''
  const inner = `
    <h1 style="font-family:'Genos',sans-serif;font-size:24px;font-weight:600;color:#ffffff;margin:0 0 6px;">Nouvelle demande partenaire</h1>
    <p style="font-family:'Montserrat',sans-serif;font-size:13px;color:#8888a0;margin:0 0 24px;">${escapeHtml(app.companyName)} — ${escapeHtml(app.email)}</p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;background-color:#0a0a12;border:1px solid #18182a;border-radius:12px;padding:8px 16px;">
      ${row('Société', app.companyName)}${row('Contact', app.contactName)}${row('Email', app.email)}${row('Téléphone', app.phone)}${row('SIRET', app.siret)}${row('Message', app.message)}
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="background-color:#8C52FF;border-radius:12px;"><a href="${adminUrl}" style="display:block;padding:14px 28px;color:#ffffff;font-family:'Genos',sans-serif;font-size:16px;font-weight:600;text-decoration:none;">Approuver dans l'espace admin &rarr;</a></td></tr></table>`
  try {
    await resend.emails.send({
      from: 'FOREAS <noreply@foreas.xyz>',
      to: 'contact@foreas.xyz',
      subject: `Nouvelle demande partenaire : ${app.companyName}`,
      html: foreasEmailShell(inner),
    })
    console.log('[Email] Partner internal envoyé')
  } catch (e) { console.error('[Email] Échec internal:', e) }
}

/* ⚠️ 29/08 — `sendProfilIncompletEmail` A ÉTÉ SUPPRIMÉE, PAS DÉSACTIVÉE.
   Elle relançait des gens qui AVAIENT PAYÉ pour qu'ils finissent leur profil.
   Chandler : « tu forces à envoyer des mails aux gens qui n'ont pas complété
   le formulaire alors qu'ils ont payé — tu DOIS envoyer aux gens qui n'ont pas
   payé ». Il a raison : relancer un client qui vient de donner sa carte, c'est
   du harcèlement administratif ; relancer quelqu'un qui a renoncé, c'est de la
   vente. Le suivi des profils incomplets reste en base et dans le compte rendu
   du matin — c'est une mesure, plus une relance. */

/**
 * LE COMPTE RENDU DU SOIR — VERS L'ÉQUIPE, PAS VERS UN CHAUFFEUR.
 *
 * ⚠️ IL NE PART QUE S'IL A QUELQUE CHOSE À DIRE (le décideur est dans le cron).
 * Un rapport qui répète « zéro » chaque jour apprend à ne plus être ouvert, et
 * le jour où il porte un vrai chiffre il est ignoré comme les autres.
 *
 * ⚠️ AUCUNE ADRESSE DE CHAUFFEUR N'Y FIGURE. Des compteurs suffisent à décider
 * s'il faut agir ; la liste nominative se lit en base, par quelqu'un qui a une
 * raison de la lire — et les paniers abandonnés sont des gens qui n'ont RIEN
 * acheté.
 */
export async function sendRecapProfilsEmail({
  payants,
  incomplets,
  nouveauxDuJour,
  paniersOuverts,
  paniersDuJour,
  paniersConvertisDuJour,
  mailsEnvoyes,
  mailsEnEchec,
  sequenceEteinte,
  enAttenteDEnvoi,
}: {
  payants: number
  incomplets: number
  nouveauxDuJour: number
  paniersOuverts: number
  paniersDuJour: number
  paniersConvertisDuJour: number
  mailsEnvoyes: number
  mailsEnEchec: number
  /** Vrai tant que la séquence n'est pas allumée dans Vercel. */
  sequenceEteinte: boolean
  /** Combien de mails seraient partis si elle l'était. */
  enAttenteDEnvoi: number
}): Promise<boolean> {
  if (!resend) {
    console.error('[Email] Resend non configuré — compte rendu NON envoyé')
    return false
  }

  /* ⚠️ UN TAUX SUR ZÉRO N'EST PAS « 0 % », C'EST UNE ABSENCE DE RÉPONSE.
     Un « 0 % » au réveil fait chercher une panne qui n'existe pas. */
  const tauxPanier =
    paniersDuJour > 0 ? `${Math.round((paniersConvertisDuJour / paniersDuJour) * 100)} %` : '——'
  const complets = Math.max(0, payants - incomplets)

  const ligne = (libelle: string, valeur: string) =>
    `<tr><td style="font-family:'Montserrat',sans-serif;font-size:13px;color:#8a8a9a;padding:7px 0;">${escapeHtml(libelle)}</td>` +
    `<td style="font-family:'Montserrat',sans-serif;font-size:15px;font-weight:600;color:#ffffff;padding:7px 0;text-align:right;">${escapeHtml(valeur)}</td></tr>`

  const titreSection = (t: string) =>
    `<p style="font-family:'Montserrat',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#4a4a5a;margin:22px 0 4px;">${escapeHtml(t)}</p>`

  const inner = `
    <p style="font-family:'Genos',sans-serif;font-size:24px;font-weight:600;color:#ffffff;margin:0 0 4px;">Le tunnel, ce soir</p>
    <p style="font-family:'Montserrat',sans-serif;font-size:12px;color:#4a4a5a;margin:0 0 8px;">Compte rendu automatique · foreas.xyz</p>
    ${titreSection('Paniers — ils ont saisi leur e-mail')}
    <table role="presentation" width="100%" style="border-collapse:collapse;">
      ${ligne('Ouverts aujourd’hui', String(paniersDuJour))}
      ${ligne('Convertis aujourd’hui', `${paniersConvertisDuJour} · ${tauxPanier}`)}
      ${ligne('Toujours sans paiement', String(paniersOuverts))}
      ${ligne('Mails de séquence partis', String(mailsEnvoyes))}
      ${mailsEnEchec > 0 ? ligne('Mails EN ÉCHEC', String(mailsEnEchec)) : ''}
    </table>
    ${titreSection('Abonnés — ils ont payé')}
    <table role="presentation" width="100%" style="border-collapse:collapse;margin:0 0 20px;">
      ${ligne('Nouveaux (24 h)', String(nouveauxDuJour))}
      ${ligne('Actifs ou en essai', String(payants))}
      ${ligne('Profils complets', String(complets))}
      ${ligne('Sans prénom ni numéro', String(incomplets))}
    </table>
    ${
      sequenceEteinte
        ? `<div style="background-color:#2a1c05;border:1px solid #6b4a0a;border-radius:12px;padding:14px 16px;margin:0 0 18px;">
             <p style="font-family:'Montserrat',sans-serif;font-size:13px;font-weight:600;color:#F5C842;margin:0 0 6px;">La séquence est ÉTEINTE</p>
             <p style="font-family:'Montserrat',sans-serif;font-size:12.5px;line-height:1.6;color:#b9a06a;margin:0;">
               ${enAttenteDEnvoi} mail(s) seraient partis aujourd'hui. Rien ne part tant que le texte n'est pas validé.
               Pour allumer : <span style="color:#e6d5a8;">PANIER_ABANDONNE_ACTIF = true</span> dans Vercel.
             </p>
           </div>`
        : ''
    }
    <p style="font-family:'Montserrat',sans-serif;font-size:12.5px;line-height:1.6;color:#6a6a7a;margin:0;">
      « Sans prénom ni numéro » = ils ont payé mais n'ont pas rempli l'écran d'après-paiement.
      C'est une mesure, pas une relance : on ne leur écrit plus.
    </p>`

  try {
    const { error } = await resend.emails.send({
      from: 'FOREAS <noreply@foreas.xyz>',
      to: 'contact@foreas.xyz',
      subject: `FOREAS · ${nouveauxDuJour} abonné(s) · ${paniersOuverts} panier(s) sans paiement`,
      html: foreasEmailShell(inner),
    })
    if (error) {
      console.error(`[Email] ÉCHEC compte rendu : ${error.name} — ${error.message}`)
      return false
    }
    return true
  } catch (e) {
    console.error('[Email] Échec compte rendu :', e)
    return false
  }
}

/**
 * UN MAIL DE LA SÉQUENCE PANIER ABANDONNÉ.
 *
 * ⚠️ DEUX MODES D'ENVOI, ET C'EST VOULU.
 * · Le mail 1 part **programmé** (`scheduledAt` à +15 min) : aucun
 *   planificateur ne tourne aussi souvent, et le forfait Vercel n'en autorise
 *   qu'un par jour. Resend garde le mail en attente, on l'annule si le paiement
 *   arrive.
 * · Les mails 2 et 3 partent **immédiatement**, appelés par le passage
 *   quotidien de 18 h Paris. Les programmer sept jours à l'avance obligerait à
 *   garder trois identifiants à annuler au lieu d'un.
 *
 * Rend l'identifiant d'envoi quand il est programmé (mail 1), sinon `null` —
 * un mail déjà parti n'a rien à annuler.
 */
export async function envoyerMailPanier({
  email,
  rang,
  reference,
  dansMinutes,
}: {
  email: string
  rang: 1 | 2 | 3
  /** Référence courte du panier, portée jusqu'à WhatsApp. */
  reference: string
  /** Renseigné pour le mail 1 seulement : l'envoi est alors programmé. */
  dansMinutes?: number
}): Promise<{ envoye: boolean; idProgramme: string | null }> {
  if (!resend) {
    console.error(`[Email] Resend non configuré — panier ${rang} NON envoyé`)
    return { envoye: false, idProgramme: null }
  }

  const t = PANIER_TEXTES[rang]

  /* ⚠️ LA DESTINATION EST DÉCLARÉE À CÔTÉ DU TEXTE, PAS ICI.
     Le mail 2 mène à WhatsApp, les deux autres au paiement. Décider du lien
     ailleurs qu'à côté du bouton, c'est se garantir qu'un jour l'un dira une
     chose et l'autre une autre. */
  const lien =
    t.destination === 'whatsapp'
      ? `https://www.foreas.xyz/wa?s=panier_abandonne&sid=${encodeURIComponent(reference)}`
      : 'https://www.foreas.xyz/tarifs3'

  /* Une idée par phrase, une phrase par paragraphe : c'est la règle de voix, et
     un pavé de dix lignes sur un téléphone ne se lit pas. */
  const phrases = t.corps
    .replace(/\s+/g, ' ')
    .trim()
    .split(/(?<=\.) /)
    .filter(Boolean)

  const inner = `
    <p style="font-family:'Genos',sans-serif;font-size:26px;font-weight:600;color:#ffffff;margin:0 0 18px;line-height:1.25;">${escapeHtml(t.titre)}</p>
    ${phrases
      .map(
        (ph) =>
          `<p style="font-family:'Montserrat',sans-serif;font-size:14px;line-height:1.75;color:#8a8a9a;margin:0 0 12px;">${escapeHtml(ph)}</p>`,
      )
      .join('')}
    <div style="text-align:center;margin:28px 0 22px;">
      <a href="${lien}" style="display:inline-block;background-image:linear-gradient(135deg,#8C52FF 0%,#6C3CE0 100%);color:#ffffff;font-family:'Montserrat',sans-serif;font-size:15px;font-weight:600;text-decoration:none;padding:14px 30px;border-radius:14px;">${escapeHtml(t.bouton)}</a>
    </div>
    <p style="font-family:'Montserrat',sans-serif;font-size:12px;line-height:1.6;color:#4a4a5a;margin:0;">${
      rang === 3
        ? 'Tu ne recevras plus de message de notre part à ce sujet.'
        : 'Si tu ne veux plus de ces messages, réponds « stop » — on arrête tout de suite.'
    }</p>`

  try {
    const { data, error } = await resend.emails.send({
      from: 'FOREAS <noreply@foreas.xyz>',
      to: email,
      replyTo: 'contact@foreas.xyz',
      subject: t.sujet,
      html: foreasEmailShell(inner),
      ...(dansMinutes
        ? { scheduledAt: new Date(Date.now() + dansMinutes * 60 * 1000).toISOString() }
        : {}),
    })
    if (error) {
      console.error(`[Email] ÉCHEC panier ${rang} : ${error.name} — ${error.message}`)
      return { envoye: false, idProgramme: null }
    }
    return { envoye: true, idProgramme: dansMinutes ? (data?.id ?? null) : null }
  } catch (e) {
    console.error(`[Email] Échec panier ${rang} :`, e)
    return { envoye: false, idProgramme: null }
  }
}

/**
 * Annule un envoi programmé. Appelée quand le paiement aboutit.
 *
 * ⚠️ UN ÉCHEC ICI ENVOIE UN MAIL DE RELANCE À QUELQU'UN QUI VIENT DE PAYER.
 * « Trois jours pour voir » chez un abonné, c'est lui faire douter que son
 * paiement soit passé. On le journalise comme une erreur, pas comme un détail.
 */
export async function annulerEnvoiProgramme(id: string): Promise<boolean> {
  if (!resend) return false
  try {
    const { error } = await resend.emails.cancel(id)
    if (error) {
      console.error(
        `[Email] ⛔ ANNULATION REFUSÉE (${error.name} — ${error.message}) : ` +
          'un mail de relance risque de partir à quelqu’un qui a déjà payé.',
      )
      return false
    }
    return true
  } catch (e) {
    console.error('[Email] ⛔ annulation impossible :', e)
    return false
  }
}

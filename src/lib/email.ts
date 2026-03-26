import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

function buildWelcomeHTML({ name, plan, trialEnd }: { name: string; plan: string; trialEnd: string }) {
  const firstName = name ? name.split(' ')[0] : 'Chauffeur'
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
      <img src="https://7iphe7xxtq6glx0w.public.blob.vercel-storage.com/Capture%20d%E2%80%99e%CC%81cran%202026-03-26%20a%CC%80%2022.01.03.png" alt="FOREAS/ — Toujours plus loin." width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;" />
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
        Bienvenue, ${firstName}.
      </h1>
      <!-- Sous-titre en Montserrat — gris doux -->
      <p style="font-family:'Montserrat',sans-serif;font-size:14px;color:#6b6b80;text-align:center;margin:0 0 36px;line-height:1.6;">
        Ton essai gratuit est activ&eacute;. 0&euro; d&eacute;bit&eacute; aujourd&rsquo;hui.
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
                    Essai gratuit jusqu&rsquo;au ${trialEnd}<br/>
                    Premier pr&eacute;l&egrave;vement apr&egrave;s la p&eacute;riode d&rsquo;essai
                  </div>
                </td>
              </tr>
            </table>
          </div>
        </td></tr>
      </table>

      <!-- ═══ CTA BUTTON — seule vraie couleur ═══ -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
        <tr><td align="center">
          <table cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:380px;">
            <tr>
              <td align="center" style="background-color:#8C52FF;border-radius:12px;padding:0;">
                <a href="https://foreas.xyz/download" style="display:block;padding:16px 32px;color:#ffffff;font-family:'Genos',sans-serif;font-size:17px;font-weight:600;text-decoration:none;text-align:center;letter-spacing:0.5px;">
                  T&eacute;l&eacute;charger l&rsquo;app &rarr;
                </a>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>

      <!-- Store links — gris discret -->
      <p style="text-align:center;font-family:'Montserrat',sans-serif;font-size:11px;color:#3a3a4a;margin:0 0 40px;">
        <a href="https://apps.apple.com/app/foreas/id000000000" style="color:#5a5a6e;text-decoration:none;">App Store</a>
        <span style="color:#2a2a3a;"> &nbsp;&middot;&nbsp; </span>
        <a href="https://play.google.com/store/apps/details?id=com.foreas.app" style="color:#5a5a6e;text-decoration:none;">Google Play</a>
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
              <td style="font-family:'Montserrat',sans-serif;font-size:13px;color:#8888a0;padding-bottom:16px;line-height:1.5;">T&eacute;l&eacute;charge l&rsquo;app et connecte-toi</td>
            </tr>
            <tr>
              <td style="width:24px;vertical-align:top;padding-right:14px;padding-bottom:16px;">
                <div style="width:24px;height:24px;border-radius:50%;background-color:#0e0e16;border:1px solid #2a2a3a;color:#6b6b80;font-family:'Genos',sans-serif;font-size:12px;font-weight:600;text-align:center;line-height:24px;">2</div>
              </td>
              <td style="font-family:'Montserrat',sans-serif;font-size:13px;color:#8888a0;padding-bottom:16px;line-height:1.5;">Active les notifications Ajnaya</td>
            </tr>
            <tr>
              <td style="width:24px;vertical-align:top;padding-right:14px;">
                <div style="width:24px;height:24px;border-radius:50%;background-color:#0e0e16;border:1px solid #2a2a3a;color:#6b6b80;font-family:'Genos',sans-serif;font-size:12px;font-weight:600;text-align:center;line-height:24px;">3</div>
              </td>
              <td style="font-family:'Montserrat',sans-serif;font-size:13px;color:#8888a0;line-height:1.5;">Commence ta premi&egrave;re journ&eacute;e avec l&rsquo;IA</td>
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

export async function sendWelcomeEmail({ email, name, plan, trialEnd }: {
  email: string; name: string; plan: string; trialEnd: string
}) {
  if (!resend) {
    console.log('[Email] Resend non configuré — email non envoyé à', email)
    return
  }
  try {
    await resend.emails.send({
      from: 'FOREAS <noreply@foreas.xyz>',
      to: email,
      subject: `Bienvenue ${name ? name.split(' ')[0] : ''} — Ton essai FOREAS est activé`,
      html: buildWelcomeHTML({ name, plan, trialEnd }),
    })
    console.log('[Email] Welcome email envoyé à', email)
  } catch (e) {
    console.error('[Email] Échec envoi welcome email:', e)
  }
}

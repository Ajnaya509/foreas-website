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

    <!-- ═══ MAIN CONTENT ═══ -->
    <div style="background-color:#050508;padding:40px 28px;">

      <!-- Check badge -->
      <div style="text-align:center;margin-bottom:28px;">
        <div style="display:inline-block;width:60px;height:60px;border-radius:50%;background-color:#0d2d1f;border:2px solid #10B981;line-height:60px;text-align:center;">
          <span style="font-size:30px;color:#10B981;">&#10003;</span>
        </div>
      </div>

      <!-- Titre en Genos 600 -->
      <h1 style="font-family:'Genos',sans-serif;font-size:30px;font-weight:600;color:#ffffff;text-align:center;margin:0 0 6px;line-height:1.2;">
        Bienvenue, ${firstName} !
      </h1>
      <!-- Sous-titre en Montserrat -->
      <p style="font-family:'Montserrat',sans-serif;font-size:14px;color:#7a7a90;text-align:center;margin:0 0 36px;line-height:1.6;">
        Ton essai gratuit est activ&eacute;. 0&euro; d&eacute;bit&eacute; aujourd&rsquo;hui.
      </p>

      <!-- ═══ PLAN CARD ═══ -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
        <tr><td style="background-color:#0a0a14;border:1px solid #1a1a2e;border-radius:16px;padding:0;overflow:hidden;">
          <!-- Card gradient top accent -->
          <div style="height:3px;background:linear-gradient(90deg, #00D4FF, #8C52FF, #00D4FF);"></div>
          <div style="padding:24px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding-bottom:18px;border-bottom:1px solid #1a1a2e;">
                  <!-- Label en Montserrat uppercase -->
                  <div style="font-family:'Montserrat',sans-serif;font-size:11px;color:#5a5a6e;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;">Ton plan</div>
                  <!-- Plan name en Genos 600 -->
                  <div style="font-family:'Genos',sans-serif;font-size:24px;font-weight:600;color:#ffffff;">${plan}</div>
                </td>
              </tr>
              <tr>
                <td style="padding-top:18px;">
                  <table cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="width:8px;height:8px;border-radius:50%;background-color:#00D4FF;"></td>
                      <td style="padding-left:12px;font-family:'Montserrat',sans-serif;font-size:13px;color:#00D4FF;">Essai gratuit jusqu&rsquo;au ${trialEnd}</td>
                    </tr>
                  </table>
                  <div style="margin-top:10px;">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="width:8px;height:8px;border-radius:50%;background-color:#10B981;"></td>
                        <td style="padding-left:12px;font-family:'Montserrat',sans-serif;font-size:13px;color:#10B981;">0&euro; d&eacute;bit&eacute; aujourd&rsquo;hui</td>
                      </tr>
                    </table>
                  </div>
                </td>
              </tr>
            </table>
          </div>
        </td></tr>
      </table>

      <!-- ═══ CTA BUTTON ═══ -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
        <tr><td align="center">
          <table cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:400px;">
            <tr>
              <td align="center" style="background-color:#8C52FF;border-radius:14px;padding:0;">
                <a href="https://foreas.xyz/download" style="display:block;padding:18px 32px;color:#ffffff;font-family:'Genos',sans-serif;font-size:18px;font-weight:600;text-decoration:none;text-align:center;letter-spacing:0.5px;">
                  T&eacute;l&eacute;charger l&rsquo;app FOREAS &rarr;
                </a>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>

      <!-- Store links en Montserrat -->
      <p style="text-align:center;font-family:'Montserrat',sans-serif;font-size:12px;color:#4a4a5e;margin:0 0 40px;">
        <a href="https://apps.apple.com/app/foreas/id000000000" style="color:#00D4FF;text-decoration:none;">App Store</a>
        <span style="color:#2a2a3a;"> &nbsp;&middot;&nbsp; </span>
        <a href="https://play.google.com/store/apps/details?id=com.foreas.app" style="color:#00D4FF;text-decoration:none;">Google Play</a>
      </p>

      <!-- ═══ NEXT STEPS ═══ -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:36px;">
        <tr><td style="background-color:#0a0a14;border:1px solid #1a1a2e;border-radius:16px;padding:0;overflow:hidden;">
          <div style="height:3px;background:linear-gradient(90deg, #00D4FF, #8C52FF, #00D4FF);"></div>
          <div style="padding:22px 24px;">
            <!-- Section title en Genos -->
            <div style="font-family:'Genos',sans-serif;font-size:16px;font-weight:600;color:#8888a0;letter-spacing:1px;margin-bottom:16px;">PROCHAINES &Eacute;TAPES</div>
            <table cellpadding="0" cellspacing="0" border="0" style="width:100%;">
              <tr>
                <td style="width:28px;vertical-align:top;padding-right:14px;padding-bottom:14px;">
                  <div style="width:28px;height:28px;border-radius:50%;background-color:#0d2d1f;color:#10B981;font-family:'Genos',sans-serif;font-size:14px;font-weight:600;text-align:center;line-height:28px;">1</div>
                </td>
                <td style="font-family:'Montserrat',sans-serif;font-size:14px;color:#c0c0d0;padding-bottom:14px;line-height:1.5;">T&eacute;l&eacute;charge l&rsquo;app et connecte-toi</td>
              </tr>
              <tr>
                <td style="width:28px;vertical-align:top;padding-right:14px;padding-bottom:14px;">
                  <div style="width:28px;height:28px;border-radius:50%;background-color:#0d1a2e;color:#00D4FF;font-family:'Genos',sans-serif;font-size:14px;font-weight:600;text-align:center;line-height:28px;">2</div>
                </td>
                <td style="font-family:'Montserrat',sans-serif;font-size:14px;color:#c0c0d0;padding-bottom:14px;line-height:1.5;">Active les notifications Ajnaya</td>
              </tr>
              <tr>
                <td style="width:28px;vertical-align:top;padding-right:14px;">
                  <div style="width:28px;height:28px;border-radius:50%;background-color:#1a0d2e;color:#8C52FF;font-family:'Genos',sans-serif;font-size:14px;font-weight:600;text-align:center;line-height:28px;">3</div>
                </td>
                <td style="font-family:'Montserrat',sans-serif;font-size:14px;color:#c0c0d0;line-height:1.5;">Commence ta premi&egrave;re journ&eacute;e avec l&rsquo;IA</td>
              </tr>
            </table>
          </div>
        </td></tr>
      </table>

    </div>

    <!-- ═══ FOOTER ═══ -->
    <div style="background-color:#08080d;padding:28px;text-align:center;">
      <!-- Gradient line footer -->
      <div style="height:1px;background:linear-gradient(90deg, transparent, #8C52FF, transparent);margin-bottom:20px;"></div>
      <p style="font-family:'Montserrat',sans-serif;font-size:13px;color:#5a5a70;margin:0 0 10px;line-height:1.6;">
        Des questions ? &Eacute;cris-nous &agrave;
        <a href="mailto:contact@foreas.xyz" style="color:#00D4FF;text-decoration:none;">contact@foreas.xyz</a>
      </p>
      <!-- Tagline en Genos italic -->
      <p style="font-family:'Genos',sans-serif;font-style:italic;font-size:13px;color:#3a3a4a;margin:0 0 12px;">Toujours plus loin.</p>
      <p style="font-family:'Montserrat',sans-serif;font-size:10px;color:#2a2a3a;margin:0;">
        FOREAS Labs &middot; Paris &middot;
        <a href="https://foreas.xyz/unsubscribe" style="color:#2a2a3a;text-decoration:underline;">Se d&eacute;sabonner</a>
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

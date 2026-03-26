import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

function buildWelcomeHTML({ name, plan, trialEnd }: { name: string; plan: string; trialEnd: string }) {
  const firstName = name ? name.split(' ')[0] : 'Chauffeur'
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#050508;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:0;">

    <!-- Header band -->
    <div style="background-color:#0c0c16;padding:32px 24px 24px;text-align:center;border-bottom:1px solid #1a1a2e;">
      <div style="font-size:32px;font-weight:800;color:#ffffff;letter-spacing:3px;margin-bottom:4px;">FOREAS/</div>
      <div style="font-size:11px;color:#6b6b80;letter-spacing:2px;text-transform:uppercase;">Intelligence Mobilit\u00e9</div>
    </div>

    <!-- Main content -->
    <div style="padding:40px 28px;">

      <!-- Green check badge -->
      <div style="text-align:center;margin-bottom:24px;">
        <div style="display:inline-block;width:56px;height:56px;border-radius:50%;background-color:#0d2d1f;border:2px solid #10B981;line-height:56px;text-align:center;">
          <span style="font-size:28px;color:#10B981;">\u2713</span>
        </div>
      </div>

      <!-- Title -->
      <h1 style="font-size:26px;font-weight:700;color:#ffffff;text-align:center;margin:0 0 8px;line-height:1.3;">
        Bienvenue, ${firstName} !
      </h1>
      <p style="font-size:15px;color:#8888a0;text-align:center;margin:0 0 32px;line-height:1.5;">
        Ton essai gratuit est activ\u00e9. 0\u20ac d\u00e9bit\u00e9 aujourd\u2019hui.
      </p>

      <!-- Plan card -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
        <tr><td style="background-color:#0e0e18;border:1px solid #1a1a2e;border-radius:16px;padding:24px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding-bottom:16px;border-bottom:1px solid #1a1a2e;">
                <div style="font-size:12px;color:#6b6b80;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Ton plan</div>
                <div style="font-size:20px;font-weight:700;color:#ffffff;">${plan}</div>
              </td>
            </tr>
            <tr>
              <td style="padding-top:16px;">
                <table cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="width:8px;height:8px;border-radius:50%;background-color:#00D4FF;"></td>
                    <td style="padding-left:10px;font-size:14px;color:#00D4FF;">Essai gratuit jusqu\u2019au ${trialEnd}</td>
                  </tr>
                </table>
                <div style="margin-top:8px;">
                  <table cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="width:8px;height:8px;border-radius:50%;background-color:#10B981;"></td>
                      <td style="padding-left:10px;font-size:14px;color:#10B981;">0\u20ac d\u00e9bit\u00e9 aujourd\u2019hui</td>
                    </tr>
                  </table>
                </div>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>

      <!-- CTA Button — solid color fallback for Gmail -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:12px;">
        <tr><td align="center">
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="center" style="background-color:#8C52FF;border-radius:14px;padding:0;">
                <a href="https://foreas.xyz/download" style="display:inline-block;padding:18px 48px;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;letter-spacing:0.3px;">
                  T\u00e9l\u00e9charger l\u2019app FOREAS \u2192
                </a>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>

      <!-- Store links -->
      <p style="text-align:center;font-size:13px;color:#4a4a5e;margin:0 0 36px;">
        <a href="https://apps.apple.com/app/foreas/id000000000" style="color:#00D4FF;text-decoration:none;">App Store</a>
        <span style="color:#2a2a3a;"> &nbsp;\u00b7&nbsp; </span>
        <a href="https://play.google.com/store/apps/details?id=com.foreas.app" style="color:#00D4FF;text-decoration:none;">Google Play</a>
      </p>

      <!-- Next steps -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:36px;">
        <tr><td style="background-color:#0e0e18;border:1px solid #1a1a2e;border-radius:16px;padding:20px 24px;">
          <div style="font-size:13px;font-weight:600;color:#8888a0;text-transform:uppercase;letter-spacing:1px;margin-bottom:14px;">Prochaines \u00e9tapes</div>
          <table cellpadding="0" cellspacing="0" border="0" style="width:100%;">
            <tr>
              <td style="width:24px;vertical-align:top;padding-right:12px;padding-bottom:12px;">
                <div style="width:24px;height:24px;border-radius:50%;background-color:#0d2d1f;color:#10B981;font-size:12px;font-weight:700;text-align:center;line-height:24px;">1</div>
              </td>
              <td style="font-size:14px;color:#c0c0d0;padding-bottom:12px;">T\u00e9l\u00e9charge l\u2019app et connecte-toi</td>
            </tr>
            <tr>
              <td style="width:24px;vertical-align:top;padding-right:12px;padding-bottom:12px;">
                <div style="width:24px;height:24px;border-radius:50%;background-color:#0d1a2e;color:#00D4FF;font-size:12px;font-weight:700;text-align:center;line-height:24px;">2</div>
              </td>
              <td style="font-size:14px;color:#c0c0d0;padding-bottom:12px;">Active les notifications pour recevoir les alertes Ajnaya</td>
            </tr>
            <tr>
              <td style="width:24px;vertical-align:top;padding-right:12px;">
                <div style="width:24px;height:24px;border-radius:50%;background-color:#1a0d2e;color:#8C52FF;font-size:12px;font-weight:700;text-align:center;line-height:24px;">3</div>
              </td>
              <td style="font-size:14px;color:#c0c0d0;">Commence ta premi\u00e8re journ\u00e9e avec l\u2019IA</td>
            </tr>
          </table>
        </td></tr>
      </table>

    </div>

    <!-- Footer -->
    <div style="background-color:#0a0a14;padding:24px 28px;border-top:1px solid #1a1a2e;text-align:center;">
      <p style="font-size:13px;color:#5a5a70;margin:0 0 8px;line-height:1.5;">
        Des questions ? R\u00e9ponds \u00e0 cet email ou contacte
        <a href="mailto:contact@foreas.xyz" style="color:#00D4FF;text-decoration:none;">contact@foreas.xyz</a>
      </p>
      <p style="font-size:11px;color:#3a3a4a;margin:0;">
        FOREAS Labs \u00b7 Paris \u00b7
        <a href="https://foreas.xyz/unsubscribe" style="color:#3a3a4a;text-decoration:underline;">Se d\u00e9sabonner</a>
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

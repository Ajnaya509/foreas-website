import { Resend } from 'resend'

const resend = new Resend('re_dYBfyu1C_MJw78AoXVrFAukPEmobRq7iW')

async function test() {
  console.log('Envoi email de bienvenue test...')

  const name = 'Chandler Test'
  const firstName = name.split(' ')[0]
  const plan = 'Pro (Hebdomadaire)'
  const trialEnd = 'lundi 31 mars 2026 à 18h'

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#050508;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <span style="font-size:28px;font-weight:700;color:#fff;letter-spacing:-0.5px;">FOREAS/</span>
    </div>
    <h1 style="font-size:24px;font-weight:700;color:#fff;text-align:center;margin:0 0 8px;">
      Bienvenue sur FOREAS, ${firstName} !
    </h1>
    <p style="font-size:16px;color:rgba(255,255,255,0.5);text-align:center;margin:0 0 32px;">
      Ton essai gratuit est activé jusqu'au ${trialEnd}.<br/>0€ débité aujourd'hui.
    </p>
    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:20px;margin-bottom:32px;">
      <p style="color:rgba(255,255,255,0.4);font-size:13px;margin:0 0 8px;">Ton plan</p>
      <p style="color:#fff;font-size:18px;font-weight:600;margin:0;">${plan}</p>
      <p style="color:rgba(0,212,255,0.7);font-size:13px;margin:8px 0 0;">Essai gratuit jusqu'au ${trialEnd}</p>
    </div>
    <div style="text-align:center;margin-bottom:24px;">
      <a href="https://foreas.xyz/download" style="display:inline-block;width:100%;max-width:400px;padding:16px 32px;background:linear-gradient(135deg,#8C52FF,#00D4FF);color:#fff;font-size:16px;font-weight:600;text-decoration:none;border-radius:12px;text-align:center;">
        Télécharger l'app FOREAS
      </a>
    </div>
    <p style="text-align:center;font-size:13px;color:rgba(255,255,255,0.3);margin:0 0 40px;">
      <a href="https://apps.apple.com/app/foreas/id000000000" style="color:rgba(0,212,255,0.5);text-decoration:none;">App Store</a>
      &nbsp;·&nbsp;
      <a href="https://play.google.com/store/apps/details?id=com.foreas.app" style="color:rgba(0,212,255,0.5);text-decoration:none;">Google Play</a>
    </p>
    <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:24px;text-align:center;">
      <p style="font-size:13px;color:rgba(255,255,255,0.3);margin:0 0 8px;">
        Des questions ? Réponds à cet email ou contacte <a href="mailto:support@foreas.net" style="color:rgba(0,212,255,0.5);text-decoration:none;">support@foreas.net</a>
      </p>
      <p style="font-size:11px;color:rgba(255,255,255,0.15);margin:0;">
        FOREAS Labs · Paris · <a href="https://foreas.xyz/unsubscribe" style="color:rgba(255,255,255,0.15);text-decoration:underline;">Se désabonner</a>
      </p>
    </div>
  </div>
</body>
</html>`

  try {
    const result = await resend.emails.send({
      from: 'FOREAS <noreply@foreas.xyz>',
      to: 'contact@foreas.net',
      subject: `Bienvenue ${firstName} — Ton essai FOREAS est activé`,
      html,
    })
    console.log('✅ Email de bienvenue envoyé !', result)
  } catch (e) {
    console.error('❌ Erreur:', e)
  }
}

test()

/**
 * L'aperçu doit être lu AVANT le clic, dans WhatsApp / Telegram / Facebook.
 * Une redirection HTTP seule ferait lire l'image du groupe, pas notre image.
 * On sert donc les métadonnées à tous, sans écran intermédiaire visible.
 * Le navigateur ouvre aussitôt le groupe avec location.replace ; les lecteurs
 * d'aperçus qui n'exécutent pas JavaScript lisent les métadonnées ci-dessous.
 */
const GROUPES = {
  whatsapp: {
    nom: 'WhatsApp',
    destination: 'https://chat.whatsapp.com/HP47hrZEd01An0KzcISVyH',
  },
  telegram: {
    nom: 'Telegram',
    destination: 'https://t.me/+6tZByVVg0n9jOWZk',
  },
  facebook: {
    nom: 'Facebook',
    destination: 'https://www.facebook.com/groups/570306328220928/',
  },
} as const

export type GroupeSocial = keyof typeof GROUPES

const ORIGINE = 'https://www.foreas.xyz'
const IMAGE = `${ORIGINE}/opengraph-image.jpg`
const TITRE = 'Choisis mieux tes courses !'
const IMAGE_ALT = 'Mehmet dans le rétroviseur et une notification Verdict Instant « À PRENDRE · 39 €/h ». Exemple illustratif.'

function attribut(valeur: string): string {
  return valeur.replace(/[&<>"']/g, caractere => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[caractere]!))
}

export function apercuGroupe(groupe: GroupeSocial): Response {
  const { nom, destination } = GROUPES[groupe]
  const canonique = `${ORIGINE}/${groupe}`
  const description = `Rejoins les chauffeurs VTC sur ${nom} : stratégies pour mieux choisir tes courses et développer ta clientèle privée.`
  // Destination fixe. Aucun paramètre du lien ne peut changer le groupe cible.
  const destinationScript = JSON.stringify(destination).replace(/</g, '\\u003c')

  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${attribut(TITRE)}</title>
<meta name="description" content="${attribut(description)}">
<link rel="canonical" href="${canonique}">
<meta property="og:type" content="website">
<meta property="og:locale" content="fr_FR">
<meta property="og:site_name" content="FOREAS">
<meta property="og:title" content="${attribut(TITRE)}">
<meta property="og:description" content="${attribut(description)}">
<meta property="og:url" content="${canonique}">
<meta property="og:image" content="${IMAGE}">
<meta property="og:image:secure_url" content="${IMAGE}">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${attribut(IMAGE_ALT)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${attribut(TITRE)}">
<meta name="twitter:description" content="${attribut(description)}">
<meta name="twitter:image" content="${IMAGE}">
<meta name="twitter:image:alt" content="${attribut(IMAGE_ALT)}">
<script>window.location.replace(${destinationScript});</script>
</head>
<body>
<noscript><p><a href="${attribut(destination)}">Ouvrir le groupe ${nom}</a></p></noscript>
</body>
</html>`

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
    },
  })
}

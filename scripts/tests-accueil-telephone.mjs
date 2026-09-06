#!/usr/bin/env node
/**
 * FOREAS — L'ACCUEIL RECONNAÎT UN TÉLÉPHONE.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI CE CONTRÔLE EXISTE (06/09/2026)
 *
 * Décision de Chandler : sur `www.foreas.xyz`, un visiteur qui arrive avec un
 * téléphone doit recevoir la page mobile — celle qui vivait sur `/mobile`, avec
 * son hero de zone, sa page de vente et sa barre sous le pouce. Un visiteur sur
 * ordinateur garde l'accueil « téléphone vivant ».
 *
 * Le choix est fait CÔTÉ SERVEUR, sur l'en-tête `user-agent`, dans
 * `src/app/page.tsx`. C'est le seul endroit où il peut être fait sans que le
 * visiteur voie d'abord la mauvaise page : `useIsMobile()` ne connaît la
 * largeur réelle qu'après le premier rendu, et l'accueil porte déjà la trace
 * écrite de ce défaut (« desktop puis téléphone mobile au premier paint »).
 *
 * ⚠️ CE QU'UNE ERREUR ICI COÛTE, DANS LES DEUX SENS.
 *   · Un téléphone pris pour un ordinateur reçoit une page dessinée pour une
 *     souris : c'est la moitié du trafic chauffeur.
 *   · Un ordinateur pris pour un téléphone reçoit une page dessinée pour un
 *     pouce, avec une barre collante qui n'a plus de sens.
 *   · Une TABLETTE prise pour un téléphone reçoit une page dessinée pour un
 *     écran étroit, étalée sur 1 000 px.
 * Les trois se voient à l'œil, mais aucune ne fait tomber un build.
 *
 * ⚠️ GOOGLE N'EST PAS UN CAS PARTICULIER, ET C'EST VOULU.
 * Googlebot Smartphone annonce « Mobile » comme n'importe quel téléphone : il
 * reçoit donc exactement ce que reçoit un chauffeur sur son téléphone. Servir
 * autre chose au robot qu'à l'humain porte un nom, c'est du cloaking. Ce
 * fichier vérifie que le robot mobile est traité comme un téléphone, et le
 * robot ordinateur comme un ordinateur.
 *
 *   node scripts/tests-accueil-telephone.mjs
 */

import { estTelephone } from '../src/lib/appareil.ts'

let echecs = 0
const dire = (ok, texte) => {
  console.log(`  ${ok ? '✅' : '❌'} ${texte}`)
  if (!ok) echecs++
}

/** Chaque agent est copié d'un vrai appareil, pas inventé. */
const TELEPHONES = {
  'iPhone 15, Safari 17':
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  'iPhone, Chrome':
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.6478.54 Mobile/15E148 Safari/604.1',
  'Pixel 8, Chrome':
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
  'Samsung Galaxy, navigateur Samsung':
    'Mozilla/5.0 (Linux; Android 13; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/115.0.0.0 Mobile Safari/537.36',
  'iPhone, navigateur intégré Instagram':
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 335.0.0.32.98',
  'Android, navigateur intégré Facebook':
    'Mozilla/5.0 (Linux; Android 14; SM-A155F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/468.0.0.48.76;]',
  'Googlebot Smartphone':
    'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
}

const PAS_DES_TELEPHONES = {
  'Mac, Chrome':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Mac, Safari':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  'Windows, Edge':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0',
  'iPad, Safari (ancien mode)':
    'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/604.1',
  'iPad, Safari (se déclare Macintosh depuis iPadOS 13)':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  'Tablette Android (aucun « Mobile » dans son agent)':
    'Mozilla/5.0 (Linux; Android 13; SM-X700) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Googlebot ordinateur':
    'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Chrome/126.0.0.0 Safari/537.36',
  'agent vide': '',
}

console.log("\n📱 L'accueil reconnaît un téléphone\n")

console.log('── Ces appareils DOIVENT recevoir la page mobile ──')
for (const [nom, agent] of Object.entries(TELEPHONES)) {
  dire(estTelephone(agent) === true, nom)
}

console.log("\n── Ceux-ci DOIVENT garder l'accueil ordinateur ──")
for (const [nom, agent] of Object.entries(PAS_DES_TELEPHONES)) {
  dire(estTelephone(agent) === false, nom)
}

console.log("\n── Un en-tête absent ne doit jamais faire tomber la page ──")
// Fail-open : sans agent lisible, on sert l'accueil ordinateur. C'est la
// version qui s'adapte déjà toute seule à un écran étroit ; l'inverse, non.
dire(estTelephone(null) === false, 'user-agent absent → ordinateur')
dire(estTelephone(undefined) === false, 'user-agent indéfini → ordinateur')

console.log(
  echecs === 0
    ? '\n✅ Tout est juste.\n'
    : `\n❌ ${echecs} erreur(s) — l'accueil servirait la mauvaise page.\n`,
)
process.exit(echecs === 0 ? 0 : 1)

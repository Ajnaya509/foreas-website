#!/usr/bin/env node
/**
 * FOREAS — TESTS DU ROUTAGE VERS LES BOUTIQUES.
 *
 * Cinq routes envoient vers l'App Store, Google Play ou l'offre selon l'appareil.
 * Une route de redirection est exactement le genre de chose qu'on écrit une fois
 * et qu'on ne revérifie jamais — et la version d'origine était cassée sur les
 * TROIS appareils pendant des mois (identifiant App Store resté à l'état de
 * gabarit, deux `?` dans l'URL Google Play, boucle sur ordinateur).
 *
 *   node scripts/tests-routage-boutique.mjs [base-url]
 */

const BASE = process.argv[2] ?? 'https://www.foreas.xyz'
const PARCOURS = ['rentabilite', 'zones', 'clientele', 'ajnaya', 'communaute']

const AGENTS = {
  iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  android: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
  ordinateur: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
}

let echecs = 0
const dire = (ok, texte) => {
  console.log(`  ${ok ? '✅' : '❌'} ${texte}`)
  if (!ok) echecs++
}

async function ou(chemin, agent) {
  const r = await fetch(`${BASE}${chemin}`, {
    redirect: 'manual',
    headers: { 'User-Agent': agent },
  })
  return { statut: r.status, vers: r.headers.get('location') ?? '' }
}

console.log(`\n📲 Routage vers les boutiques — ${BASE}\n`)

console.log('── iPhone → App Store ──')
for (const p of PARCOURS) {
  const { statut, vers } = await ou(`/go/${p}`, AGENTS.iphone)
  dire(statut === 307 && vers.includes('apps.apple.com'), `/go/${p} → ${statut} ${vers.slice(0, 60)}`)
}

console.log('\n── Android → Google Play, avec la campagne ──')
for (const p of PARCOURS) {
  const { statut, vers } = await ou(`/go/${p}`, AGENTS.android)
  const ok = statut === 307 && vers.includes('play.google.com') && vers.includes('referrer=')
  dire(ok, `/go/${p} → ${statut} ${vers.slice(0, 72)}`)
  // Le bug historique : deux `?` dans l'URL rendaient le nom de paquet invalide.
  if (vers) dire((vers.match(/\?/g) || []).length === 1, `  un seul « ? » dans l'URL`)
}

console.log('\n── Ordinateur → l\'offre, sans faire semblant ──')
for (const p of PARCOURS) {
  const { statut, vers } = await ou(`/go/${p}`, AGENTS.ordinateur)
  dire(statut === 307 && vers.includes('/tarifs2'), `/go/${p} → ${statut} ${vers.slice(0, 60)}`)
}

console.log('\n── L\'attribution survit au saut ──')
{
  const { vers } = await ou('/go/zones?utm_source=meta&utm_campaign=test42&ref=CODE9', AGENTS.ordinateur)
  dire(vers.includes('utm_source=meta'), 'utm_source conservé')
  dire(vers.includes('utm_campaign=test42'), 'utm_campaign conservé (pas écrasé)')
  dire(vers.includes('ref=CODE9'), 'code parrain conservé')
}

console.log('\n── AUCUNE redirection ouverte ──')
// Le test qui compte : une route de redirection qui obéit à un paramètre permet
// d'envoyer un lien en foreas.xyz qui emmène ailleurs. Ça ne doit jamais marcher.
for (const piege of [
  '?url=https://exemple-malveillant.test',
  '?redirect=https://exemple-malveillant.test',
  '?next=//exemple-malveillant.test',
  '?destination=https://exemple-malveillant.test',
]) {
  const { vers } = await ou(`/go/zones${piege}`, AGENTS.ordinateur)
  dire(
    !vers.includes('exemple-malveillant'),
    `${piege.slice(0, 34)}… → ${vers.slice(0, 46)}`,
  )
}

console.log(
  echecs === 0
    ? '\n✅ Le routage est correct sur les trois appareils, et ne se laisse pas détourner.\n'
    : `\n❌ ${echecs} test(s) en échec.\n`,
)
process.exit(echecs === 0 ? 0 : 1)

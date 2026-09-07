import assert from 'node:assert/strict'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { build } from 'esbuild'
const sortie = join(mkdtempSync(join(tmpdir(), 'porte-cerveau-')), 'porte.mjs')
await build({ entryPoints: ['src/lib/porteAffichee.ts'], outfile: sortie, format: 'esm', bundle: true })
const { choisirPorteAffichee } = await import(sortie)
for (const verdict of ['whatsapp', 'essai', 'aucune']) {
  for (const ancien of ['whatsapp', 'essai', 'aucune']) assert.equal(choisirPorteAffichee(verdict, ancien), verdict)
}
for (const invalide of [undefined, null, '', 'autre', 60, { porte: 'essai' }]) {
  assert.equal(choisirPorteAffichee(invalide, 'whatsapp'), 'whatsapp')
}
console.log('15 contrôles : le bouton respecte le verdict du cerveau et garde le secours.')

#!/usr/bin/env node
/**
 * Mux Assets Lister — FOREAS
 *
 * Liste tous les assets Mux du compte avec leurs Playback IDs,
 * durées, status, et thumbnails URL.
 *
 * Usage :
 *   1. Crée un Access Token sur https://dashboard.mux.com/settings/access-tokens
 *      (permissions : "Mux Video / Read")
 *   2. Mets les credentials dans .env.local :
 *        MUX_TOKEN_ID=xxxxxxxx
 *        MUX_TOKEN_SECRET=xxxxxxxx
 *   3. Lance : node scripts/mux-list-assets.mjs
 *
 * Output : JSON listé + résumé tabulé prêt à coller dans le code.
 */

import Mux from '@mux/mux-node'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

// ─── Charge .env.local manuellement (Next n'est pas chargé ici) ─────────
function loadEnvLocal() {
  const envPath = resolve(process.cwd(), '.env.local')
  if (!existsSync(envPath)) return
  const content = readFileSync(envPath, 'utf-8')
  content.split('\n').forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return
    const eq = trimmed.indexOf('=')
    if (eq === -1) return
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = value
  })
}

loadEnvLocal()

const tokenId = process.env.MUX_TOKEN_ID
const tokenSecret = process.env.MUX_TOKEN_SECRET

if (!tokenId || !tokenSecret) {
  console.error('❌ MUX_TOKEN_ID et MUX_TOKEN_SECRET manquants.')
  console.error('')
  console.error('Étapes :')
  console.error('  1. Va sur https://dashboard.mux.com/settings/access-tokens')
  console.error('  2. Crée un Access Token avec permissions "Mux Video / Read"')
  console.error('  3. Ajoute dans .env.local :')
  console.error('       MUX_TOKEN_ID=xxxxxxxx')
  console.error('       MUX_TOKEN_SECRET=xxxxxxxx')
  console.error('  4. Relance le script')
  process.exit(1)
}

const mux = new Mux({ tokenId, tokenSecret })

console.log('🎬 Récupération des assets Mux...\n')

try {
  const allAssets = []
  let limit = 100
  let page = 1
  let hasMore = true

  while (hasMore) {
    const assets = await mux.video.assets.list({ limit, page })
    allAssets.push(...assets.data)
    hasMore = assets.data.length === limit
    page += 1
  }

  console.log(`✅ ${allAssets.length} assets trouvés.\n`)

  // Tableau résumé
  console.log('┌─────────────────────────────────────────────────────────────────────────────┐')
  console.log('│ N°  │ Status   │ Durée   │ Playback ID                                  │')
  console.log('├─────────────────────────────────────────────────────────────────────────────┤')

  allAssets.forEach((asset, i) => {
    const playback = asset.playback_ids?.[0]
    const playbackId = playback?.id ?? '— (aucun)'
    const policy = playback?.policy ?? '—'
    const status = asset.status ?? '?'
    const duration = asset.duration ? `${Math.round(asset.duration)}s` : '?'
    const num = String(i + 1).padStart(3, ' ')
    const statusPadded = status.padEnd(8, ' ')
    const durationPadded = duration.padEnd(7, ' ')
    console.log(`│ ${num} │ ${statusPadded} │ ${durationPadded} │ ${playbackId.padEnd(44, ' ')} │`)
    if (policy !== 'public') {
      console.log(`│     │          │         │ ⚠️  policy=${policy} (devrait être "public" pour web)  │`)
    }
  })
  console.log('└─────────────────────────────────────────────────────────────────────────────┘\n')

  // Bloc copy-paste TypeScript prêt à coller dans le code
  console.log('// ─── Copy-paste ready : src/components/zone/testimonials.ts ──────────────')
  console.log('export const TESTIMONIALS = [')
  allAssets.forEach((asset, i) => {
    const playback = asset.playback_ids?.[0]
    if (!playback) return
    console.log('  {')
    console.log(`    name: 'Témoin ${i + 1}', // ← à remplacer (Haitham, Binate, etc.)`)
    console.log(`    playbackId: '${playback.id}',`)
    console.log(`    durationSec: ${asset.duration ? Math.round(asset.duration) : 0},`)
    console.log(`    posterTimeSec: 2, // ← thumbnail à 2 sec`)
    console.log(`    // mux asset_id: ${asset.id}`)
    console.log('  },')
  })
  console.log('] as const')
  console.log('')

  // Vérif policies
  const nonPublic = allAssets.filter((a) =>
    (a.playback_ids ?? []).some((p) => p.policy !== 'public')
  )
  if (nonPublic.length > 0) {
    console.log('⚠️  ATTENTION : assets avec policy non-public :')
    nonPublic.forEach((a) => console.log(`   - ${a.id} (${a.playback_ids?.[0]?.policy ?? '?'})`))
    console.log('   Pour la web public, change la policy via le dashboard.\n')
  }
} catch (err) {
  console.error('❌ Erreur Mux :', err.message ?? err)
  if (err.status === 401) {
    console.error('   → Credentials invalides. Vérifie MUX_TOKEN_ID et MUX_TOKEN_SECRET dans .env.local')
  }
  process.exit(1)
}

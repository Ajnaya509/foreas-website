import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/version — QUEL COMMIT EST RÉELLEMENT SERVI ?
 *
 * ⚠️ 23/08 — Trois contradicteurs ont perdu des heures à répondre à cette
 * question, et moi aussi. Le backend a `/health` qui rend son sha depuis
 * toujours ; le site n'avait RIEN. On ne pouvait donc pas distinguer
 * « le code est cassé » de « le code n'est pas déployé » — deux diagnostics
 * opposés qui appellent deux corrections opposées.
 *
 * « Poussé » n'est pas « déployé ». Sans cette route, la seule façon de le
 * savoir était de deviner.
 *
 * Aucune donnée sensible : un identifiant de commit public et une date.
 */
export async function GET() {
  return NextResponse.json({
    sha: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'inconnu',
    branche: process.env.VERCEL_GIT_COMMIT_REF || 'inconnue',
    environnement: process.env.VERCEL_ENV || 'local',
    servi_a: new Date().toISOString(),
  })
}

import type { NextRequest } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
// JAMAIS depuis './acquisition' : ce module est `'use client'`, et Next y remplace
// ACQ_COOKIE par une client reference. `cookies.get(<fonction>)` renvoie undefined
// et l'origine part vide, en silence. On lit le contrat depuis le module neutre.
import { ACQ_COOKIE, type Acquisition } from './acquisitionShared'

/**
 * acquisitionServer — lecture serveur de l'origine du visiteur + rattachement à
 * la personne, une fois qu'elle est résolue par la porte canonique.
 *
 * Où c'est stocké : `canal_memory` (context_key = 'acquisition'), la table de
 * mémoire cross-canal qui existe déjà et que le Responder Pieuvre lit avant de
 * répondre. Aucune table nouvelle : l'origine est un fait sur la personne, elle
 * a sa place dans sa mémoire, pas dans un silo de plus.
 *
 * Ce qui vient d'où :
 *  - utm_* / fbclid / gclid / ttclid / ctwa_clid : cookie 1ère partie `foreas_acq`
 *    posé au premier contact (voir acquisition.ts) — premier toucher gagne.
 *  - _fbc / _fbp / _ttclid : cookies posés par les pixels, lus ICI côté serveur
 *    (jamais recopiés par le client, qui pourrait mentir ou les perdre).
 */

export interface ServerAcquisition extends Acquisition {
  /** Cookie Meta `_fbc` (click id) — lu côté serveur. */
  fbc?: string
  /** Cookie Meta `_fbp` (browser id) — lu côté serveur. */
  fbp?: string
}

function cookieValue(cookieHeader: string, name: string): string | undefined {
  const m = cookieHeader.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'))
  return m?.[1]
}

/** Reconstitue l'origine du visiteur depuis ses cookies 1ère partie. */
export function readAcquisitionFromRequest(request: NextRequest): ServerAcquisition {
  const acq: ServerAcquisition = {}

  const raw = request.cookies.get(ACQ_COOKIE)?.value
  if (raw) {
    try {
      const parsed = JSON.parse(decodeURIComponent(raw))
      if (parsed && typeof parsed === 'object') Object.assign(acq, parsed as Acquisition)
    } catch {
      /* cookie illisible — on continue avec ce qu'on a */
    }
  }

  const cookieHeader = request.headers.get('cookie') || ''
  const fbc = cookieValue(cookieHeader, '_fbc')
  const fbp = cookieValue(cookieHeader, '_fbp')
  const ttclid = cookieValue(cookieHeader, '_ttclid')
  if (fbc) acq.fbc = fbc
  if (fbp) acq.fbp = fbp
  if (ttclid && !acq.ttclid) acq.ttclid = ttclid

  return acq
}

/** Vrai si on tient au moins un signal d'origine exploitable. */
export function hasAcquisitionSignal(acq: ServerAcquisition): boolean {
  return Object.keys(acq).some((k) => k !== 'first_seen_at' && k !== 'landing_path')
}

/**
 * Colle l'origine à la personne. Idempotent (upsert sur la clé de mémoire).
 * `canal_memory.canal` a un CHECK strict (`widget|whatsapp|app|telegram|xyz`) :
 * tout canal web est donc rangé sous `widget`, le canal réel est conservé dans
 * la valeur sous `_canal` — même convention que ajnayaChatCore.ts.
 */
export async function persistAcquisition(
  sb: SupabaseClient,
  identity_id: string,
  canal: string,
  acq: ServerAcquisition
): Promise<void> {
  if (!identity_id) return
  // Une visite directe (aucun paramètre, aucun referrer) reste écrite : "direct"
  // est une réponse, l'absence de ligne n'en est pas une.
  const { error } = await sb.from('canal_memory').upsert(
    {
      identity_id,
      canal: 'widget',
      context_key: 'acquisition',
      context_value: { ...acq, _canal: canal, _recorded_at: new Date().toISOString() },
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'identity_id,canal,context_key', ignoreDuplicates: false }
  )
  if (error) console.warn('[acquisition] persist error:', error.code, error.message)
}

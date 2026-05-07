/**
 * expandPoolCode — convertit les codes pool VTC en libellés humains.
 *
 * Design System §16 anti-pattern : jargon brut interdit dans l'UI user.
 * Brief PIEUVRE_HOME_MODAL_FIX.md anti-pattern : "T2C à privilégier" → user lit
 * le code et réfléchit. "Terminal 2C à privilégier" → comprend instantanément.
 *
 * Conserve le code original si non reconnu (rétro-compat / villes pas mappées).
 */

const T_CODES_CDG: Record<string, string> = {
  'T1':  'Terminal 1',
  'T2A': 'Terminal 2A',
  'T2B': 'Terminal 2B',
  'T2C': 'Terminal 2C',
  'T2D': 'Terminal 2D',
  'T2E': 'Terminal 2E',
  'T2F': 'Terminal 2F',
  'T2G': 'Terminal 2G',
}

const T_CODES_ORLY: Record<string, string> = {
  'OW':         'Orly Ouest',
  'OS':         'Orly Sud',
  'Orly Ouest': 'Orly Ouest',
  'Orly Sud':   'Orly Sud',
}

const POOL_CARDINAL_FALLBACK: Record<string, string> = {
  // Si la RPC retourne accidentellement Nord/Sud/Est/Ouest (déjà filtré côté DB
  // en sécurité, mais double-check côté UI au cas où)
  'Nord':  'multi-secteurs',
  'Sud':   'multi-secteurs',
  'Est':   'multi-secteurs',
  'Ouest': 'multi-secteurs',
  'N':     'multi-secteurs',
  'S':     'multi-secteurs',
  'E':     'multi-secteurs',
  'O':     'multi-secteurs',
}

export function expandPoolCode(code: string | null | undefined): string {
  if (!code) return ''
  const trim = code.trim()
  if (T_CODES_CDG[trim])              return T_CODES_CDG[trim]
  if (T_CODES_ORLY[trim])             return T_CODES_ORLY[trim]
  if (POOL_CARDINAL_FALLBACK[trim])   return POOL_CARDINAL_FALLBACK[trim]
  return trim
}

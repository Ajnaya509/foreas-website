import type { Porte } from './porteAjnaya'

/** Le score du cerveau prime sur l'ancienne règle de mots, même en cas de refus. */
export function choisirPorteAffichee(verdict: unknown, secours: Porte): Porte {
  return verdict === 'essai' || verdict === 'whatsapp' || verdict === 'aucune'
    ? verdict : secours
}

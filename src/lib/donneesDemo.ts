/**
 * FOREAS — LES DONNÉES DE DÉMONSTRATION DES CONSOLES. UN SEUL ENDROIT.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 CE QUI ÉTAIT SERVI AU PUBLIC AVANT LE 21/08/2026
 *
 * `/dashboard/partner` répondait **200 sans aucune authentification**, et son
 * HTML contenait ceci, mesuré en production :
 *
 *     Nikolic D.   ● En course
 *     Kitenge M.   ● En course
 *     Haitham R.   ● En attente
 *     Hadietou S.  ● Pause
 *     Dragan P.    ● Hors ligne
 *     Binate       Paris • en ligne
 *
 * Ce sont les noms de **six chauffeurs réels**, ceux-là mêmes qui ont accepté
 * d'être filmés pour FOREAS et qui figurent au registre des accords. À côté de
 * leurs noms : une zone de travail, un statut d'activité, un revenu horaire et
 * une note de performance. **Tout cela était inventé.**
 *
 * Un visiteur ne pouvait pas le savoir. Sur une page publique, « Nikolic D. —
 * En course — Bastille — 22,10 €/h » se lit comme la position et le revenu d'une
 * personne nommée, en direct.
 *
 * Deux choses étaient fausses en même temps :
 *  · des personnes réelles se voyaient attribuer une activité qu'elles n'ont
 *    pas eue, sur une page que n'importe qui pouvait ouvrir ;
 *  · rien n'indiquait qu'il s'agissait d'une maquette.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LES DEUX RÈGLES DE CE FICHIER
 *
 * 1. AUCUN NOM DE PERSONNE RÉELLE. Les prénoms ci-dessous ne correspondent à
 *    aucun chauffeur FOREAS, ni au registre des accords, ni à la table
 *    `drivers`. Ils ne se choisissent pas « au hasard parmi des noms qui
 *    sonnent bien » : le hasard est exactement ce qui a produit la collision.
 *
 * 2. LA MAQUETTE SE DIT MAQUETTE. `MENTION_DEMONSTRATION` s'affiche à l'écran,
 *    au-dessus des chiffres. Une donnée inventée qui ne s'annonce pas est une
 *    donnée fausse ; une donnée inventée qui s'annonce est une illustration.
 *
 * ⚠️ Le jour où ces consoles liront la vraie base, ce fichier disparaît. Il ne
 * doit JAMAIS servir de repli silencieux quand la base ne répond pas : un
 * tableau de bord qui affiche des chiffres inventés en cas de panne est pire
 * qu'un tableau de bord vide.
 */

export const MENTION_DEMONSTRATION =
  'Données de démonstration — aucun chauffeur réel n’est représenté ici.'

export interface ChauffeurDemo {
  id: number
  name: string
  status: 'active' | 'break' | 'inactive'
  zone: string
  netH: number
  score: number
  lastSeen: string
}

/** Huit lignes d'illustration. Aucune ne désigne quelqu'un. */
export const CHAUFFEURS_DEMO: readonly ChauffeurDemo[] = [
  { id: 1, name: 'Camille D.', status: 'active', zone: 'République', netH: 28.5, score: 92, lastSeen: 'En course' },
  { id: 2, name: 'Sofia R.', status: 'active', zone: 'Gare du Nord', netH: 25.2, score: 85, lastSeen: 'En course' },
  { id: 3, name: 'Thomas B.', status: 'active', zone: 'La Défense', netH: 23.8, score: 78, lastSeen: 'En attente' },
  { id: 4, name: 'Yanis K.', status: 'active', zone: 'Bastille', netH: 22.1, score: 74, lastSeen: 'En course' },
  { id: 5, name: 'Inès T.', status: 'break', zone: '—', netH: 21.5, score: 70, lastSeen: 'Pause' },
  { id: 6, name: 'Hugo P.', status: 'inactive', zone: '—', netH: 19.8, score: 65, lastSeen: 'Hors ligne' },
  { id: 7, name: 'Nora S.', status: 'active', zone: 'Châtelet', netH: 26.3, score: 88, lastSeen: 'En course' },
  { id: 8, name: 'Élias M.', status: 'active', zone: 'Opéra', netH: 24.7, score: 81, lastSeen: 'En attente' },
]

/** Le nom affiché comme « utilisateur connecté » dans le décor des consoles. */
export const UTILISATEUR_DEMO = 'Camille'

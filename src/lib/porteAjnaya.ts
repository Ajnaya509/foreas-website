/**
 * LA PORTE À PROPOSER — décidée par le CODE, jamais par le modèle.
 *
 * Chandler, 05/09/2026 : « selon ce que le chauffeur lui dit, soit lui proposer
 * directement l'essai gratuit s'il est chaud, [sinon] l'envoyer sur WhatsApp
 * pour une approche plus personnalisée ». Et : « il faut un système de notation
 * en interne, sinon elle l'envoie systématiquement avec un bouton déjà défini ».
 *
 * POURQUOI EN CODE ET PAS DANS LE PROMPT. Un petit modèle (Haiku sert cette
 * surface) suit mal une règle à trois branches, et un modèle qui DÉCIDE de la
 * porte peut aussi l'inventer. Ici la décision est une fonction pure : on lit
 * ce que LE CHAUFFEUR a écrit — jamais ce qu'Ajnaya a répondu — et on rend une
 * porte et le mot qui l'a déclenchée. Testable sans réseau, journalisable, et
 * le modèle ne fait qu'écrire la phrase qui va avec.
 *
 * LES TROIS PORTES, par ordre de priorité :
 *   aucune   — il refuse ou il attaque : on ne pousse rien. Ne rien pousser est
 *              une réponse autorisée, et un chauffeur poussé s'en va.
 *   essai    — il est chaud : il parle prix, essai, inscription, ou il dit oui.
 *   whatsapp — tout le reste. C'est la porte PAR DÉFAUT : il pose une question,
 *              il raconte, il compare, il freine sur le prix. Sur WhatsApp on a
 *              son numéro, et c'est là qu'on le convainc de l'essai.
 *
 * ⚠️ « trop cher » n'est PAS un refus : c'est une objection, et une objection se
 * traite en personne. Elle va sur WhatsApp, pas dans le vide.
 */

export type Porte = 'essai' | 'whatsapp' | 'aucune'

export type ChoixPorte = {
  porte: Porte
  /** Le mot ou l'expression qui a tranché — pour le journal, jamais pour l'écran. */
  motif: string
}

/** Minuscules, sans accents, apostrophes typographiques ramenées à ' . */
function normaliser(texte: string): string {
  return (texte || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’‘]/g, "'")
    .toLowerCase()
}

/* ⚠️ PAS DE REGARD ARRIÈRE `(?<=` : il plante la page sur iPhone avant iOS 16.4.
   On encadre par \b ou par des bornes explicites. */

/** Il refuse, ou il s'en prend à FOREAS. Évalué sur le DERNIER message seulement. */
const REFUS = [
  /\bnon merci\b/, /\bpas interesse\w*\b/, /\bstop\b/, /\barnaque\w*\b/, /\bescro\w*\b/,
  /\blaisse tomber\b/, /\blaissez tomber\b/, /\barrete\w*\b/, /\bfous?[- ]moi la paix\b/,
  /\bdegage\w*\b/, /\bfoutage\b/, /\bjamais\b/, /\bpas besoin\b/, /\bca m'?interesse pas\b/,
  /\bc'?est mort\b/, /\bsans facon\b/, /\bne me contacte\w* (?:plus|pas)\b/,
]

/** Il est chaud : le prix, l'essai, l'inscription, ou un oui franc. */
const CHAUD = [
  /\bprix\b/, /\bcombien\b/, /\btarifs?\b/, /\bca coute\b/, /\bcoute combien\b/,
  /\bessai\w*\b/, /\bessayer\b/, /\btest\w*\b/, /\bgratuit\w*\b/,
  /\binscri\w*\b/, /\bcommenc\w*\b/, /\bdemarr\w*\b/, /\btelecharg\w*\b/,
  /\babonne\w*\b/, /\bcarte\b/, /\bpayer\b/, /\bpaiement\b/,
  /\bje veux\b/, /\bje prends\b/, /\bon y va\b/, /\bvas[- ]y\b/, /\bgo\b/, /\bbanco\b/,
  /\bd'?accord\b/, /\bca marche\s*[!.]?\s*$/, /\bok\b/, /\boui\b/, /\bouais\b/, /\byes\b/,
  /\bou (?:je|on) (?:m'?inscri|commence|signe|clique)\w*\b/,
]

function premierMotif(texte: string, motifs: RegExp[]): string | null {
  for (const m of motifs) {
    const r = m.exec(texte)
    if (r) return r[0]
  }
  return null
}

/**
 * @param messagesChauffeur — ce QU'IL a écrit, du plus ancien au plus récent.
 *   Ne jamais y mettre les réponses d'Ajnaya : elle parle d'essai à chaque
 *   bascule, et se déclencherait elle-même.
 */
export function choisirPorte(messagesChauffeur: string[]): ChoixPorte {
  const siens = (messagesChauffeur || []).map(normaliser).filter((t) => t.trim())
  if (siens.length === 0) return { porte: 'whatsapp', motif: 'aucun message' }

  const dernier = siens[siens.length - 1]

  // 1. Le refus gagne toujours, et il ne se lit que sur le dernier message :
  //    un « non » d'il y a trois messages n'éteint pas un « ok » d'aujourd'hui.
  const refus = premierMotif(dernier, REFUS)
  if (refus) return { porte: 'aucune', motif: refus }

  // 2. Chaud sur le dernier message, sinon sur les deux d'avant : celui qui a
  //    demandé le prix il y a un message et pose maintenant un détail est
  //    toujours chaud.
  const fenetre = siens.slice(-3).reverse()
  for (const t of fenetre) {
    const chaud = premierMotif(t, CHAUD)
    if (chaud) return { porte: 'essai', motif: chaud }
  }

  // 3. Le reste va sur WhatsApp : c'est la porte par défaut.
  return { porte: 'whatsapp', motif: 'par defaut' }
}

/** La ligne injectée dans la consigne, pour que la phrase de fin colle à la porte. */
export function consignePorte(choix: ChoixPorte): string {
  switch (choix.porte) {
    case 'essai':
      return `PORTE CHOISIE PAR LE CODE : L'ESSAI.
Termine par UNE phrase qui désigne l'essai : 3 jours, carte demandée à l'inscription, rien n'est prélevé s'il arrête avant le 4e jour. Tu n'écris ni bouton ni lien : le site affiche le bouton.`
    case 'aucune':
      return `PORTE CHOISIE PAR LE CODE : AUCUNE.
Il refuse. Tu réponds sans rien proposer, et tu t'arrêtes. Aucun bouton ne sera affiché.`
    default:
      return `PORTE CHOISIE PAR LE CODE : WHATSAPP.
Termine par UNE phrase qui l'invite à continuer sur WhatsApp, en reprenant sa question : là-bas tu refais le calcul avec ses chiffres à lui. Tu n'écris ni bouton ni lien ni numéro : le site affiche le bouton.`
  }
}

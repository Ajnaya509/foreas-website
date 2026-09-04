/**
 * LE SAVOIR D'AJNAYA EN MODE DÉMO — ÉCRIT À LA MAIN, ET ASSUMÉ COMME TEL.
 *
 * Source : FOREAS-SHARED/DEMO_MODALE_AJNAYA/demo-modale-ajnaya.html (fil Pieuvre).
 * Les textes sont repris MOT POUR MOT. Ne pas les reformuler sans Chandler :
 * une version précédente a été rejetée le 28/08 — « beaucoup de charabia, rien
 * à manger de concret ». Elle décrivait ce qu'un chauffeur de trois mois sait
 * déjà : aucune valeur donnée, donc aucune dette de réciprocité créée, donc
 * aucun désir à la fin.
 *
 * ⚠️ AUCUN CERVEAU, AUCUNE DONNÉE. Cinq types de zone, choisis par mots-clés.
 * C'est une démonstration honnête d'un savoir de métier, pas une mesure. Le
 * brief le dit en toutes lettres (§8.8), et le brancher sur la vraie Ajnaya
 * reste un chantier du fil Pieuvre.
 *
 * ⚠️ AUCUN CHIFFRE SUR FOREAS. Ce sont des ordres de grandeur du métier
 * (consommation au ralenti, temps de trajet, prix du carburant), vérifiables
 * par n'importe quel chauffeur, et annoncés comme tels.
 *
 * LA RÈGLE DE COMPOSITION (COPY ATOMIC §7, « specifics beat generalities ») :
 * chaque réponse contient TROIS choses, et seulement trois.
 *   1. LE VERDICT — une décision, pas une description.
 *   2. LE CALCUL  — l'arithmétique de ce que ça lui coûte, en euros et en
 *      minutes, vérifiable de tête. C'est ça qui se « mange ».
 *   3. LE GESTE   — UNE chose à faire autrement dès ce soir, sans rien acheter.
 * Puis seulement la bascule vers son propre chiffre.
 */

export type SavoirZone = {
  cle: string
  /** Un des quatre mots de l'app, dans le même ordre de force. */
  etat: string
  mots: string[]
  verdict: string
  /** Contiennent du HTML volontaire (<b>, &nbsp;) : rendus via dangerouslySetInnerHTML. */
  calcul: string
  geste: string
  bascule: string
}

/* ⚠️ LE DERNIER EST LE REPLI. `mots: []` n'est pas un oubli : c'est ce qui
   attrape tout ce qui n'a matché aucun autre type. Ne pas le déplacer. */
export const SAVOIR: SavoirZone[] = [
    { cle:'aeroport', etat:'demandée',
      mots:['roissy','cdg','orly','beauvais','aeroport','aéroport','le bourget'],
      verdict:'Un retour à vide de l’aéroport, c’est 45 minutes payées zéro.',
      calcul:'Paris–CDG aller-retour à vide : environ 50 km, ~7&nbsp;€ de carburant, et une heure de ta journée. Deux fois dans la journée et tu as travaillé <b>1h30 pour rien</b>.',
      geste:'Avant d’accepter une course vers l’aéroport, regarde l’heure d’arrivée, pas l’heure qu’il est. La vague tombe <b>20 à 30 minutes après</b> l’atterrissage d’un long-courrier, le temps des bagages et de la douane. Arrive dedans, pas entre deux.',
      bascule:'Reste à savoir quelle vague TOI tu peux attraper, avec tes horaires et ton secteur. Une moyenne de zone ne te le dira jamais. <b>Le seul chiffre qui vaut, c’est le tien.</b>' },

    { cle:'affaires', etat:'modérée',
      mots:['défense','defense','levallois','issy les moulineaux','boulogne','courbevoie','nanterre','saint-ouen','bercy','part-dieu'],
      verdict:'Entre 10h et 16h, un quartier d’affaires te coûte de l’argent.',
      calcul:'Moteur au ralenti : environ 1,5&nbsp;L à l’heure, soit ~2,50&nbsp;€. Cinq heures de creux, ce sont <b>12&nbsp;€ brûlés à l’arrêt</b> — plus les cinq heures que tu n’as pas facturées.',
      geste:'Le creux, ne l’attends pas : déplace-toi <b>15 minutes avant</b> qu’il tombe. Un hôpital, une gare, un centre commercial vivent à l’heure exacte où les tours dorment. Tu changes de rythme, pas de métier.',
      bascule:'À quelle heure TOI tu dois y être ? Ça dépend de ton véhicule, de tes horaires, de ce que tu acceptes. <b>Le seul chiffre qui vaut, c’est le tien.</b>' },

    { cle:'nuit', etat:'très demandée',
      mots:['bastille','oberkampf','pigalle','chatelet','châtelet','marais','republique','république','strasbourg','saint-germain','montmartre'],
      verdict:'La nuit, ce qui te coûte n’est pas la course. C’est le temps pour charger.',
      calcul:'Dix minutes pour te garer et récupérer le client, sur quatre courses dans la nuit, ça fait <b>40 minutes</b> — soit une course entière que tu n’as pas faite.',
      geste:'Ne te mets pas devant le lieu. Arrête-toi sur <b>la première rue où on peut s’arrêter deux secondes</b>, et envoie le point exact au client. Il marche 100 mètres, tu gagnes 8 minutes. Fais-le quatre fois : tu as gagné une course.',
      bascule:'La moyenne du samedi soir mélange celui qui finit à 2h et celui qui finit à 5h. Elle ne te ressemble pas. <b>Le seul chiffre qui vaut, c’est le tien.</b>' },

    { cle:'gare', etat:'demandée',
      mots:['gare','montparnasse','austerlitz','gare de lyon','gare du nord','gare de l est','saint-lazare','perrache','matabiau'],
      verdict:'Une gare se joue à la minute. Deux minutes de retard changent tout.',
      calcul:'Arriver deux minutes après la vague, c’est être douzième dans la file. À trois minutes par départ, tu attends <b>35 minutes</b> pour une course à 15&nbsp;€. Ton heure vaut plus que ça : tu viens de la vendre à moitié prix.',
      geste:'Cale-toi sur <b>l’heure d’arrivée du train</b>, jamais sur l’heure qu’il est. Sois en place quatre minutes avant. Et retiens le dernier départ de la soirée : après lui, la zone se vide d’un coup et tu attends pour rien.',
      bascule:'Quelle vague TU peux attraper, avec ton emploi du temps ? Une moyenne hebdomadaire ne le sait pas. <b>Le seul chiffre qui vaut, c’est le tien.</b>' },

    { cle:'peripherie', etat:'calme',
      mots:[],
      verdict:'En périphérie, attendre coûte plus cher que rouler.',
      calcul:'À l’arrêt moteur tournant : ~2,50&nbsp;€ de l’heure. Trois heures d’attente dans une journée, ce sont <b>7,50&nbsp;€ brûlés</b> plus trois heures non facturées. C’est la journée qui passe de correcte à mauvaise.',
      geste:'Donne-toi une règle chiffrée et tiens-la : <b>12 minutes sans course, tu bouges</b>. Vers le pôle dense le plus proche, même à dix minutes de route. Rouler vers la demande bat presque toujours attendre à côté.',
      bascule:'Ici moins qu’ailleurs une moyenne veut dire quelque chose : tout se joue sur TON créneau et TON rayon. <b>Le seul chiffre qui vaut, c’est le tien.</b>' }
  ]

/* ═══════════════════════════════════════════════════════════════════════════
   RECONNAÎTRE PAR MOT ENTIER — ET JAMAIS PAR BOUT DE MOT
   ═══════════════════════════════════════════════════════════════════════════
   ⚠️ CE QUI EXISTAIT AVANT SE TROMPAIT UNE FOIS SUR QUATRE.
   L'ancienne version faisait `phrase.includes(motCle)`. Le mot « est », caché
   dans la liste des gares, se retrouve dans « c'est », « intéressant »,
   « ouest »… Testé sur 43 phrases réelles : 11 mal classées, soit 26 %.
   Un chauffeur qui demande « c'est combien ? » recevait une leçon sur les gares.
   Ici on découpe en mots entiers et on compare des suites de mots entiers.

   ⚠️ PAS DE REGARD ARRIÈRE `(?<=` DANS LES EXPRESSIONS. Il fait planter la
   page sur iPhone avant iOS 16.4, et la panne est invisible partout ailleurs.
   Piège déjà payé — voir la note « mesurer avec un moteur sans le défaut ». */

/** Minuscules, sans accents, découpé sur tout ce qui n'est pas lettre ou chiffre. */
export function motsDe(z: string): string[] {
  return (z || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
}

/** Vrai si la suite de mots `cle` apparaît telle quelle dans `mots`. */
function contientMot(mots: string[], cle: string): boolean {
  const c = motsDe(cle)
  if (!c.length) return false
  for (let i = 0; i + c.length <= mots.length; i++) {
    let ok = true
    for (let j = 0; j < c.length; j++) if (mots[i + j] !== c[j]) { ok = false; break }
    if (ok) return true
  }
  return false
}

/** Choisit le type par mot entier. Le dernier élément sert de repli. */
export function typePourZone(z: string): SavoirZone {
  const m = motsDe(z)
  for (const t of SAVOIR) {
    for (const k of t.mots) if (contientMot(m, k)) return t
  }
  return SAVOIR[SAVOIR.length - 1]
}

/* ═══════════════════════════════════════════════════════════════════════════
   RECONNAÎTRE UN LIEU — HORS LIGNE, SANS UN SEUL APPEL RÉSEAU
   ═══════════════════════════════════════════════════════════════════════════
   ⚠️ C'EST LA PIÈCE QUI RÉPARE « ÇA FAIT AMATEUR ».
   Avant, TOUT ce que le chauffeur tapait devenait le nom de sa zone. Il écrivait
   « comment tu peux savoir ? » et l'écran affichait « Ajnaya sait où ça paie
   autour de comment tu peux savoir ». Orly, qui était sa vraie question,
   disparaissait.
   Maintenant la zone ne change QUE si on reconnaît un lieu. Sinon elle reste,
   et sa phrase reçoit une réponse.

   La tolérance à la faute de frappe est volontairement étroite : UNE lettre,
   et seulement sur les clés d'au moins cinq lettres. Plus large, « orly »
   attraperait « oral » et on retomberait dans le défaut qu'on vient de fermer. */

export const LIEUX: { nom: string; cles: string[] }[] = [
  { nom: 'Roissy CDG', cles: ['roissy', 'cdg', 'charles de gaulle', 'roissy cdg'] },
  { nom: 'Orly', cles: ['orly', 'orly sud', 'orly ouest'] },
  { nom: 'Beauvais', cles: ['beauvais'] },
  { nom: 'Le Bourget', cles: ['le bourget', 'bourget'] },
  { nom: 'La Défense', cles: ['la defense', 'defense'] },
  { nom: 'Levallois', cles: ['levallois'] },
  { nom: 'Boulogne', cles: ['boulogne'] },
  { nom: 'Courbevoie', cles: ['courbevoie'] },
  { nom: 'Nanterre', cles: ['nanterre'] },
  { nom: 'Bercy', cles: ['bercy'] },
  { nom: 'Bastille', cles: ['bastille'] },
  { nom: 'Châtelet', cles: ['chatelet'] },
  { nom: 'Pigalle', cles: ['pigalle'] },
  { nom: 'Montmartre', cles: ['montmartre'] },
  { nom: 'République', cles: ['republique'] },
  { nom: 'Le Marais', cles: ['marais'] },
  { nom: 'Oberkampf', cles: ['oberkampf'] },
  { nom: 'Saint-Germain', cles: ['saint germain'] },
  { nom: 'Gare de Lyon', cles: ['gare de lyon'] },
  { nom: 'Gare du Nord', cles: ['gare du nord'] },
  { nom: 'Gare de l’Est', cles: ['gare de l est'] },
  { nom: 'Montparnasse', cles: ['montparnasse'] },
  { nom: 'Saint-Lazare', cles: ['saint lazare'] },
  { nom: 'Austerlitz', cles: ['austerlitz'] },
  { nom: 'Part-Dieu', cles: ['part dieu'] },
  { nom: 'Perrache', cles: ['perrache'] },
  { nom: 'Matabiau', cles: ['matabiau'] },
]

/** Une seule lettre d'écart, et seulement pour les mots d'au moins 5 lettres. */
function presque(a: string, b: string): boolean {
  if (a === b) return true
  if (a.length < 5 || Math.abs(a.length - b.length) > 1) return false
  let i = 0, j = 0, ecarts = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue }
    if (++ecarts > 1) return false
    if (a.length > b.length) i++
    else if (a.length < b.length) j++
    else { i++; j++ }
  }
  return ecarts + (a.length - i) + (b.length - j) <= 1
}

/** Rend le nom propre du lieu reconnu, ou null. Aucun réseau. */
export function reconnaitreLieu(texte: string): string | null {
  const m = motsDe(texte)
  if (!m.length) return null
  /* Les clés longues d'abord : « gare de lyon » avant « lyon ». */
  const paires = LIEUX.flatMap((l) => l.cles.map((c) => ({ nom: l.nom, cle: c })))
    .sort((a, b) => motsDe(b.cle).length - motsDe(a.cle).length)
  for (const p of paires) if (contientMot(m, p.cle)) return p.nom
  /* Deuxième passe, tolérante à UNE faute, mots simples seulement. */
  for (const p of paires) {
    const c = motsDe(p.cle)
    if (c.length !== 1) continue
    for (const mot of m) if (presque(mot, c[0])) return p.nom
  }
  return null
}

/* ═══════════════════════════════════════════════════════════════════════════
   QUAND CE N'EST PAS UN LIEU — LA ZONE NE BOUGE PAS, ET ELLE RÉPOND QUAND MÊME
   ═══════════════════════════════════════════════════════════════════════════
   Trois familles seulement, et une relance. Aucune ne donne un chiffre qu'on
   n'a pas, aucune ne prétend avoir mesuré quoi que ce soit.
   ⚠️ La quatrième — « je ne comprends pas » — ne pousse AUCUNE porte. Vendre
   juste après avoir échoué à comprendre, c'est le geste qui sent l'amateur. */

export type Repli = { verdict: string; etiq: string; corps: string; porte: boolean }

export function replique(texte: string, zone: string): Repli {
  const m = motsDe(texte)
  const a = (...k: string[]) => k.some((x) => contientMot(m, x))
  const z = zone || 'ta zone'

  if (a('comment', 'savoir', 'sais', 'preuve', 'prouve', 'bluff', 'invente', 'serieux', 'vraiment')) {
    return {
      verdict: 'Là, tout de suite : je ne sais pas.',
      etiq: 'CE QUE JE SAIS',
      corps: `Ce que je viens de te dire sur <b>${z}</b>, c'est du métier — vrai pour tout le monde, vérifiable ce soir. Ce que je ne sais pas encore, c'est ce que <b>ton</b> heure vaut. Ça, il faut que je te regarde rouler.`,
      porte: true,
    }
  }
  if (a('combien', 'prix', 'coute', 'cher', 'gratuit', 'tarif', 'abonnement', 'payer', 'euro', 'euros')) {
    return {
      verdict: '29,99 € par mois. Moins d’une course.',
      etiq: 'CE QUE ÇA TE COÛTE',
      corps: 'Moins d’un euro par jour. Aujourd’hui tu paies <b>0 €</b> : trois jours pour voir. Tu coupes en un clic.',
      porte: true,
    }
  }
  if (a('decu', 'arnaque', 'promesse', 'promesses', 'essaye', 'marche', 'pareil', 'autres', 'encore')) {
    return {
      verdict: 'Je sais. Tu n’es pas le premier à avoir payé pour du vent.',
      etiq: 'CE QUE JE SAIS',
      corps: 'Alors je ne te promets rien ce soir. Regarde ce que je viens de te dire, teste-le sur une course, et juge après. C’est le seul ordre qui tienne.',
      porte: true,
    }
  }
  return {
    verdict: 'Là, je décroche.',
    etiq: 'DIS-LE-MOI AUTREMENT',
    corps: `Donne-moi un lieu — <b>Orly</b>, <b>Bastille</b>, <b>La Défense</b> — et je change de zone. Sinon je reste sur <b>${z}</b>.`,
    porte: false,
  }
}

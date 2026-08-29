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
      mots:['défense','defense','levallois','issy','boulogne','courbevoie','nanterre','saint-ouen','bercy','part-dieu'],
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
      mots:['gare','montparnasse','austerlitz','lyon','nord','est','saint-lazare','perrache','matabiau'],
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

/** Choisit le type par mot-clé. Le dernier élément sert de repli. */
export function typePourZone(z: string): SavoirZone {
  const s = (z || '').toLowerCase()
  for (const t of SAVOIR) {
    for (const m of t.mots) if (s.includes(m)) return t
  }
  return SAVOIR[SAVOIR.length - 1]
}

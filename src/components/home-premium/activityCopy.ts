export type ActivityKind = 'app_page_opened' | 'partner_account_activated' | 'booking_site_published'
export type ActivityEvent = { id: string; kind: ActivityKind; name: string | null; brand?: boolean }
export type ActivitySurface = 'home' | 'driver'

// Personas d’aperçu uniquement. Les noms publics viennent d’événements consentis.
export const HOME_PEOPLE = [
  'Samy', 'Karim', 'Mehdi', 'Yanis', 'Walid', 'Amine', 'Lina',
  'Omar', 'Farid', 'Youssef', 'Sofiane', 'Nabil', 'Nadia', 'Malik',
  'Rachid', 'Moussa', 'Bilal', 'Idriss', 'Sarah', 'Ibrahim', 'Adama',
  'Ismaël', 'Hugo', 'Thomas', 'Inès', 'Rayan', 'Boubacar',
] as const
export const DRIVER_PEOPLE = [
  'Sami', 'Kamel', 'Nassim', 'Ilyes', 'Anis', 'Reda', 'Assia',
  'Hakim', 'Ali', 'Ahmed', 'Abdel', 'Hamza', 'Myriam', 'Seydou',
  'Mamadou', 'Souleymane', 'Ousmane', 'Yacine', 'Dounia', 'Nadir',
  'Tarek', 'Fouad', 'Lucas', 'Nicolas', 'Aïcha', 'Issa', 'Lamine',
] as const

export const ACTIVITY_KINDS: readonly ActivityKind[] = ['app_page_opened', 'partner_account_activated', 'booking_site_published']
const HOME_COPY: Record<ActivityKind, readonly string[]> = {
  app_page_opened: [
    'découvre FOREAS. Le prix ne dit pas tout d’une course.',
    'ouvre l’app. Le temps d’approche compte aussi.',
    'découvre FOREAS. Tes frais méritent leur place dans le calcul.',
    'regarde l’app. Une course se juge aussi au temps qu’elle prend.',
    'ouvre FOREAS. Le chiffre affiché n’est pas ce qu’il te reste.',
    'découvre l’app. Ta prochaine décision mérite des repères.',
    'regarde FOREAS. Ta journée commence avant la première course.',
    'ouvre l’app. Voir les chiffres. Garder le dernier mot.',
    'découvre FOREAS. Ton activité mérite une vue d’ensemble.',
  ],
  partner_account_activated: [
    'rejoint les partenaires. Une bonne découverte se partage.',
    'active son espace. Un lien pour présenter FOREAS autour de soi.',
    'rejoint le programme. Tes recommandations peuvent ouvrir des portes.',
    'active son compte partenaire. Le partage commence avec un lien.',
    'rejoint FOREAS. Faire découvrir un outil utile, simplement.',
    'active son espace partenaire. Tout pour suivre ses recommandations.',
    'rejoint le programme. Le prochain chauffeur est peut-être dans tes contacts.',
    'active son compte. Une conversation peut faire découvrir FOREAS.',
    'rejoint les partenaires. Un outil à découvrir. Un lien à transmettre.',
  ],
  booking_site_published: [
    'publie son site. Ses clients ont une adresse pour revenir.',
    'met son site en ligne. La prochaine réservation peut porter ton nom.',
    'publie sa page. Un trajet peut devenir un prochain rendez-vous.',
    'ouvre son site. Tes clients savent maintenant où te retrouver.',
    'publie son lien. Après la course, le contact continue.',
    'met sa page en ligne. Une adresse à laisser à tes clients.',
    'publie son site. Ta carte de visite peut mener à une réservation.',
    'ouvre sa page. Être joignable, même une fois le trajet terminé.',
    'publie son site. Un client satisfait peut retrouver son chauffeur.',
  ],
}

const DRIVER_COPY = [
  'Trois jours pour regarder tes courses autrement.',
  'Le prochain prix mérite un vrai calcul. Tu peux l’essayer trois jours.',
  'L’essai Pro se juge sur ta route, avec tes réglages.',
  'Trois jours pour voir si les chiffres t’aident à choisir.',
  'Ton temps d’approche compte. L’essai permet de le voir.',
  'Une course. Tes frais. Ton verdict. À découvrir pendant l’essai.',
  'Trois jours pour te faire ton propre avis sur Pro.',
  'Ton prochain choix mérite mieux qu’un prix seul. Essaie sur tes courses.',
  'Tu connais la route. L’essai te donne un autre regard sur les chiffres.',
  'Trois jours pour découvrir ce que Pro apporte à ta journée.',
  'Le bon outil se reconnaît à l’usage. Tu as trois jours pour juger.',
  'Avant de changer tes habitudes, découvre Pro pendant trois jours.',
  'Trois jours pour mettre tes frais dans l’équation.',
  'Le montant attire. Le temps compte. Découvre le calcul pendant l’essai.',
  'Tes réglages, tes courses, ton avis. Trois jours pour essayer.',
  'Pro s’essaie avec ton activité. Pas besoin de croire une promesse.',
  'Trois jours pour découvrir une autre façon de lire tes courses.',
  'Tu gardes le dernier mot. L’essai t’aide à voir les chiffres.',
  'Tes journées sont différentes. Trois jours pour découvrir les outils Pro.',
  'Un trajet se regarde en entier. L’essai te montre comment.',
  'Trois jours pour découvrir aussi ton site de réservation.',
  'Après la course, tes clients peuvent revenir. Découvre la vitrine dans Pro.',
  'L’essai permet d’explorer tes courses, tes frais et tes contacts.',
  'Une question sur ta journée ? Découvre Ajnaya pendant les trois jours.',
  'Trois jours pour explorer Pro à ton rythme.',
  'Avant de décider, essaie sur ce que tu connais : ton activité.',
  'Tu verras toi-même ce qui t’est utile. L’essai Pro dure trois jours.',
] as const

// Message de marque : la phrase est signée FOREAS, sans prénom ni action attribuée.
function brandSentence(surface: ActivitySurface, event: ActivityEvent, index: number) {
  if (surface === 'driver') return DRIVER_COPY[index % DRIVER_COPY.length]
  const variant = HOME_COPY[event.kind][Math.floor(index / ACTIVITY_KINDS.length) % HOME_COPY[event.kind].length]
  const cut = variant.indexOf('. ')
  return cut >= 0 ? variant.slice(cut + 2) : variant
}

// Passé simple : seul le premier verbe change, le reste du texte est inchangé.
const PASSE_SIMPLE: Record<string, string> = {
  'découvre': 'découvrit', 'ouvre': 'ouvrit', 'regarde': 'regarda',
  'rejoint': 'rejoignit', 'active': 'activa', 'publie': 'publia', 'met': 'mit',
}
function auPasseSimple(text: string) {
  const [first, ...rest] = text.split(' ')
  return [PASSE_SIMPLE[first] ?? first, ...rest].join(' ')
}

export function activityPhrase(surface: ActivitySurface, event: ActivityEvent, index: number) {
  if (event.brand) return `FOREAS · ${brandSentence(surface, event, index)}`
  const name = event.name || (event.kind === 'partner_account_activated' ? 'Un partenaire' : 'Un chauffeur')
  if (surface === 'driver') return `${name} découvrit l’app. ${DRIVER_COPY[index % DRIVER_COPY.length]}`
  const variants = HOME_COPY[event.kind]
  return `${name} ${auPasseSimple(variants[Math.floor(index / ACTIVITY_KINDS.length) % variants.length])}`
}

export function previewEvents(surface: ActivitySurface): ActivityEvent[] {
  return (surface === 'home' ? HOME_PEOPLE : DRIVER_PEOPLE).map((name, index) => ({
    id: `preview-${surface}-${index}`,
    name,
    kind: surface === 'home' ? ACTIVITY_KINDS[index % ACTIVITY_KINDS.length] : 'app_page_opened',
  }))
}

// Rotation publique quand aucune action vérifiée n'est disponible.
export function brandEvents(surface: ActivitySurface): ActivityEvent[] {
  return Array.from({ length: 27 }, (_, index) => ({
    id: `foreas-${surface}-${index}`,
    name: null,
    brand: true,
    kind: surface === 'home' ? ACTIVITY_KINDS[index % ACTIVITY_KINDS.length] : 'app_page_opened',
  }))
}

// Rotation publique : les 54 prénoms du carnet (27 accueil + 27 chauffeur), au passé simple.
export function carnetEvents(surface: ActivitySurface): ActivityEvent[] {
  return (surface === 'home' ? HOME_PEOPLE : DRIVER_PEOPLE).map((name, index) => ({
    id: `carnet-${surface}-${index}`,
    name,
    kind: surface === 'home' ? ACTIVITY_KINDS[index % ACTIVITY_KINDS.length] : 'app_page_opened',
  }))
}

# HOME FOREAS — COPY + DESIGN +100/100 (prêt à appliquer)

> Refonte chirurgicale du home `/`, sous la peau d'un chauffeur VTC (Karim).
> Doctrines : `foreas-copy-atomic` + `foreas-design-system` + `AJNAYA_ADN.md §3`.
> Produit par 8 agents (1 par section) + synthèse. 2026-06-21.

## 3 RÈGLES D'OR qui reviennent dans TOUTES les sections
1. **TUTOIEMENT PROFESSIONNEL — l'entre-deux** (recalibré Chandler) : on tutoie (proximité) MAIS registre **crédible, adulte à adulte, sans esbroufe**. **Jamais argot ni « pote du quartier »** (pas de « balance ta zone », « carrément », « frère »). Réf ton : **incom-services.com** = pro-bienveillant, chiffré, opposition élégante (« La liberté d'un VTC, les avantages d'un CDI »). Le vouvoiement reste le tueur n°1 — mais l'argot aussi. → relire chaque ligne ci-dessous avec ce filtre.
2. **ZÉRO chiffre faux** : "247 chauffeurs", "247 avis", "23 places" → SUPPRIMÉS (CNIL). Remplacés par une vérité mécanisme OU `[À BRANCHER]` un vrai compteur.
3. **Loss aversion > gain** · **1 seul héros par section** · **risk reversal vrai** (0€ · sans carte · 1 clic).

---

## 1. HERO (HomeHeroCream.tsx) — le réveil
- **Eyebrow** : ~~"147 chauffeurs en ligne ce soir"~~ → **"Ajnaya lit 7 plateformes en direct"** *(ou compteur live [À BRANCHER /api/live-driver-count])*
- **Titre** : ~~"Gagnez plus, roulez moins."~~ → **"Gagne plus, roule moins."** (gradient sur *roule moins*). ✅ validé Chandler — « Gagne pareil » écarté. Punch sec, pro, opposition nette (style INCOM « Changez de modèle, pas de métier »).
- **Sous-titre** : "Donne ta zone. Ajnaya lit **Uber, Bolt, Heetch** + 4 autres en direct et te dit combien ça paie ce soir — avant de démarrer."
- **Placeholder** : "Ta zone…" · **CTA** : "Voir combien →" · **Quick zones** : "Essaie :"
- **Trust strip** : "51 zones · 0€ · sans carte"
- **Design** : 1 seul accent gradient (sur "Gagne pareil."), eyebrow en token 10/800/UPPERCASE, retirer le point vert "live" si pas de vrai compteur.

## 2. PROOF STRIP (HomeProofStrip.tsx) — réassurance
6 micro-preuves, toutes VRAIES (zéro 247) :
**Fait en France** · **7 plateformes lues** · **Données réelles (pas une promesse)** · **0€ pour tester** · **Tu pars quand tu veux (1 clic)** · **WhatsApp, sans inscription**
- **Design** : la bande chuchote (pas de 2e héros), `font-semibold` max, supprimer la div morte (l.104-109).

## 3. BIG DOMINO (HomeBigDomino.tsx) — le coup de massue
- **Eyebrow** : "CE SOIR, 23H12" (ancrage temporel)
- **Phrase-massue** (A recommandée) : "Pendant que tu tournes à vide, / **l'appli sait déjà où sont les courses.**"
  - B : "Les chauffeurs qui rentrent pleins / **ne devinent pas. Ils savent.**"
- **Sous-texte** : ~~"247 chauffeurs savent"~~ → "Ajnaya lit la demande en temps réel sur 51 zones. Toi, tu conduis. Elle, elle calcule."
- **CTA** (manquant) : "Voir où ça donne ce soir →"
- **Design** : displayXXL, UN seul fragment en gradient, c'est ICI que crème → noir bascule. Retirer "S{semaine}" (daté).

## 4. MÉCANISME (ZoneMechanismVisual.tsx) — crédibilité (COMMENT)
- **Eyebrow** : ~~"LA MÉCANIQUE · BREVETÉE"~~ → **"COMMENT ELLE FAIT"** *(⚠️ "BREVETÉE" seulement si brevet réellement déposé/accordé — sinon trompeur. [À VÉRIFIER statut brevet])*
- **Titre** : "Pas un dashboard de plus. / **L'IA qui te dit où aller — avant les autres.**"
- **CAPTE** : "7 plateformes, en même temps" / "Uber, Bolt, Heetch, FreeNow + le trafic, les vols, les événements, la météo."
- **ANALYSE** : "Elle a un coup d'avance" / "Une zone se réveille à 800 m de toi ? Elle le sait avant que ton appli te le dise."
- **PARLE** : "Elle parle, tu conduis" / "Vocal ou texte, comme tu veux. Pendant que tu roules, elle bosse pour toi."
- **Sous-paragraphe** : "Pendant que tu conduis, Ajnaya regarde 7 applis en parallèle. Quand une zone se réveille près de toi, elle te le dit avant les autres. C'est tout. C'est ça qui change tout."
- **CTA** : ~~vert~~ → **gradient violet #8C52FF→#6C3CE0 + glow** (token site, pas vert). "Voir Ajnaya en 90 secondes →"
- **Design** : tabular-nums sur "7" / "800 m", spring (pas tween 0.5), garder le halo pulse (variant Ajnaya OK).

## 5. PREUVE SOCIALE (ZoneSocialProof.tsx + testimonials.data.ts)
- **Eyebrow** : "6 CHAUFFEURS · LEUR VISAGE · LEUR VOIX"
- **Titre** : "Pas moi qui le dis. " + gradient **"Eux."**
- **Cadrage** : "Des chauffeurs comme toi. Tu cliques, tu les écoutes. Personne ne lit un script."
- **Design** : stopper l'auto-play (le méfiant veut le contrôle), card chiffrée (Binate +30%) = héros, KPI en success #10B981 tabular-nums. Badges qualitatifs en ivoire (jamais en vert = le vert = chiffre prouvé).
- **Intégrité** : SEUL "+30% Binate" garde un chiffre **[À SOURCER : la vidéo dit-elle 30% ?]**. Les 5 autres = qualitatif, zéro chiffre inventé. Zéro "247 avis".

## 6. DOULEUR (ZonePainCalculator.tsx) — loss aversion incarnée
- **Eyebrow** : "CE QUE TU VOIS PAS PASSER"
- **Titre** : "Sur une course de 25 €, Uber t'en prend jusqu'à **11,25 €**." *(chiffres dynamiques)*
- **TAUX = 45% Uber** (corrigé 2026-06-21) — source : table FOREAS `platform_commission_rates` (Uber 0.45, Bolt 0.22, Heetch 0.18, FreeNow 0.22, Lyft 0.25), maintenue par COMMISSION_WATCHDOG → **défendable car c'est notre propre donnée sourcée**. Idéalement le calculateur LIT cette table en live (endpoint `/api/coach/platform-rates`) au lieu de hardcoder → auto-à-jour + bulletproof.
- **Héros = la PERTE** : "Commission Uber : **−11,25 €**" en danger #EF4444, tabular-nums, c'est LUI qui domine. Cadrage honnête "jusqu'à 45%" (le taux effectif varie selon la course).
- **Transition (ego-safe, sourcée)** : "Tu bosses bien. Le problème c'est pas toi — c'est les courses à vide qu'on te refile. Ajnaya repère en temps réel celles qui te laissent le plus net. Même volant, mieux placé."
- **CTA** : "Voir mes vraies courses rentables →"
- **Intégrité** : SUPPRIMER "Vous gagnez 3× plus" + le €/h `net/0.5` (non sourçables). Taux réels seulement. Ego-safe (jamais pauvre/bête).

## 7. PLAN 3 ÉTAPES (ZonePlanTimeline.tsx) — Miller SB7
- **Titre** : "Tu cliques. Tu conduis pareil. / **Tu regardes l'écart.**"
- **1. 90 SECONDES** — "Tu envoies « go » sur WhatsApp" / "Pas de carte. Pas de formulaire. Un message, c'est tout."
- **2. CHAQUE MATIN** — "Ajnaya t'envoie tes zones" / "Au réveil, dans WhatsApp. Tu conduis comme d'habitude."
- **3. QUAND TU VEUX** *(héros)* — "Tu compares ton net" / "Mieux, tu restes. Pareil, tu pars — sans avoir payé un centime."
- **Réassurance** (zéro emoji) : "0 € aujourd'hui · Sans carte · Annulation en 1 clic"
- **Intégrité** : SUPPRIMER "Vendredi" / "DEMAIN" (promesses datées intenables). "CHAQUE MATIN / QUAND TU VEUX" = vrai.

## 8. FINAL CTA + PS (ZoneFinalCTAWithPS.tsx) — le close
- **Eyebrow** : "0 € AUJOURD'HUI · SANS CARTE · TU COUPES EN 1 CLIC"
- **Titre** : "Teste 7 jours. Tu verras vite."
- **Sous-titre** : "Soit Ajnaya te sort **+28 €/jour** de plus. Soit tu coupes, et tu n'as rien lâché. Toi seul tranches." *(+28€ [À BRANCHER : moyenne réelle])*
- **CTA** : "Lance Ajnaya — 0 € aujourd'hui" (gradient violet + glow, PAS vert)
- **PS (A — le miroir froid)** : "PS — Tu peux fermer cette page. C'est ton droit. Mais reviens dans 6 mois : même voiture, mêmes journées, même fatigue. Le seul truc qui aura bougé, c'est ton compteur d'années perdues. Aujourd'hui, ça te coûte 0 € de vérifier. — Chandler, fondateur."
- **Intégrité** : SUPPRIMER "4,9/5 · 247 avis" (faux) + fausse rareté "23 places". Risk reversal = 100% vrai.

---

## ⚠️ À BRANCHER / À SOURCER avant mise en ligne (sinon = risque CNIL)
- Compteur live de chauffeurs (hero, big domino) → vrai `/api/live-driver-count` ou retirer.
- "+30% Binate" → vérifier la vidéo. Autres témoignages → qualitatif only.
- "+28 €/jour" → moyenne cohorte réelle documentée, sinon retirer le chiffre.
- "BREVETÉE" (mécanisme) → statut brevet réel, sinon "brevet déposé" ou retirer.
- "51 zones" / "7 plateformes" → vrais aujourd'hui ✅.

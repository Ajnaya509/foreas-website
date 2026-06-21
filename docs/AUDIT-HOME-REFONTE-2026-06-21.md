# AUDIT IMPITOYABLE — HOME FOREAS « +100/100 »
### Verdict CORE · 2026-06-21 · grounded sur le code réel (`src/components/home2026/*` + `src/components/zone/*`)

> Note méthode : **Fable 5 indisponible** (accès Anthropic *gated*). La critique persuasion/psychologie a été faite en propre, à profondeur équivalente, puis recoupée avec le code source réel (pas seulement le doc de refonte). Skills mobilisées : `foreas-arbitre-supreme` (arbitrage), `foreas-ux-persuasion-cognitive` (UX), `maximisation-ca-chauffeur` (CA).

---

## A. VERDICT

**Le texte est A-. Le plan de mise en ligne est C+.**
Le doc de refonte est un **excellent travail de copy** (tutoiement pro, loss aversion, 1 héros/section, risk reversal vrai). Mais il se vend comme « +100/100 prêt à appliquer » alors qu'il **n'a audité que le texte de la home** — jamais l'écosystème dans lequel ce texte atterrit. Résultat : **5 trous-système** qui annulent une grosse partie du lift dès que le chauffeur scrolle ou clique vers `/tarifs2`.

### NOTE GLOBALE DU DOC : **72 / 100**

| Dimension | Note | Pourquoi |
|---|---:|---|
| Copy & persuasion (texte pur) | **82** | Loss aversion, Big Domino, PS : du vrai niveau réponse directe. |
| Ton / tutoiement pro | **80** | Bien exécuté. Quelques lignes sentent encore le copywriter (« C'est tout. C'est ça qui change tout. »). |
| UX / charge cognitive | **62** | Ne résout PAS le double-funnel (modal Ajnaya **vs** WhatsApp) ni le schéma de bouton. |
| Fidélité design-system | **68** | Référence des vrais tokens, mais laisse l'incohérence CTA noir/vert/violet. |
| Intégrité légale (CNIL/DGCCRF) | **48** | ⛔ Le doc nettoie ~30 % du problème. Le reste vit sur les pages d'argent + le Footer. |
| Mécanique de conversion | **66** | Funnel logique, mais la preuve sociale **vend le mauvais produit** (voir Trou #1). |
| Cohérence système (cross-page, zéro-régression) | **45** | Home-only. La doctrine source n'est pas mise à jour → régression programmée. |

*La note globale n'est pas une moyenne brute : elle est pondérée vers ce que le doc cherche à faire (du copy), puis pénalisée pour la sur-promesse « +100 » alors que les trous ci-dessous décident si le lift survit au contact du reste du site.*

---

## B. CE QUI EST DÉJÀ EXCELLENT (à garder tel quel)

- **Bascule vouvoiement → tutoiement** : c'est LE bon move. Preuve dure ci-dessous (Trou #2) : le site actuel est schizophrène.
- **Suppression des faux chiffres sur la home** : « 147 chauffeurs en ligne », « 247 avis », « 23 places ». Correct.
- **Loss aversion en héros** (section Douleur) et **risk reversal 100 % vrai** (0 € · sans carte · 1 clic).
- **Big Domino** « Pendant que tu tournes à vide, l'appli sait déjà où sont les courses. » → la meilleure ligne du doc. Cortisol + curiosité, zéro bullshit.
- **Stop auto-play** sur les témoignages : juste. (le méfiant veut le contrôle, et l'auto-advance fait défiler la vidéo qu'il était en train de lire = il perd sa seule micro-action à forte intention.)

---

## C. LES 5 TROUS-SYSTÈME QUE LE DOC NE VOIT PAS
*(rangés par la règle de priorité absolue : impact CA chauffeur → valeur data → faisabilité V1 < 2 sem.)*

### 🔴 TROU #1 — La preuve sociale vend le MAUVAIS produit (le piège « rattachement »)
**C'est la faille n°1 de tout l'ensemble, et elle est invisible dans un doc qui ne réécrit que du texte.**

Le code (`ZoneSocialProof.tsx` + `testimonials.data.ts`) le dit lui-même :
- Eyebrow actuel : **« VRAIS CHAUFFEURS · VRAIS VISAGES · VRAIS VIREMENTS »**, titre **« Pas des promesses. Des virements. »**
- Sur 6 témoignages, **4 parlent de fiabilité de paiement** (« aucun problème de paiement », « virement ponctuel une fois par semaine », « virements tous les mercredis »).
- Le fichier data **flague lui-même** (lignes 117-120 et 138-139) que ces phrases renvoient à **l'ancien modèle rattachement/capacitaire** — FOREAS qui *paie* le chauffeur — **PAS** au produit vendu aujourd'hui : un **abonnement IA à 12,97 €/sem**.

**Conséquence brutale :** ton actif marketing le plus puissant (6 vidéos de vrais chauffeurs) **prouve un produit que tu ne vends plus.** Un chauffeur méfiant qui regarde ça conclut « FOREAS = boîte de rattachement » — exactement le mot que, d'après ton propre fichier, **les chauffeurs détestent**. La promesse de la home (« Ajnaya te dit où aller, tu gagnes plus ») et la preuve (« ils me paient bien ») **ne se rejoignent jamais.** Le doc garde ces 6 vidéos et ne touche pas au mismatch.

> Seul **Binate (+30 % de revenus, Tesla)** prouve réellement la valeur Ajnaya. C'est ton unique témoignage on-brand.

**Fix (P0) :**
1. **Tuer le mot « virement »** partout dans la section (il implique que tu paies = rattachement = problème de positionnement **et** légal).
2. **Preuve à 2 étages** : héros = Binate (la preuve revenu/Ajnaya). Secondaire = les anciens, reframés explicitement en **confiance/longévité** (« là depuis 2, 5, 9 ans — ils restent »), **jamais en preuve de revenu**.
3. **Re-tourner 2 témoignages Ajnaya-CA** façon Binate (« même nombre de courses, mieux placé, +X € net »). C'est l'asset le plus rentable que tu puisses produire en 2 semaines.

---

### 🔴 TROU #2 — Le tutoiement/vouvoiement est schizophrène DANS LE MÊME composant
Le doc traite ça comme un fix « home ». C'est un **fix système**, sinon ça régresse.

Preuve dure (`ZonePainCalculator.tsx`) — **une seule carte, deux registres** :
- Header : **« Dans ta poche »** (tu)
- Corps : **« Combien donnez-vous à Uber »**, **« vous travaillez pour »**, **« Vous gagnez 3× plus »** (vous)

Et le **vouvoiement est le défaut partout** : Hero « Tapez votre zone… vous dit où foncer », Mécanisme « L'IA qui vous dit où aller », Plan « Vous cliquez », Final « Dans 7 jours vous saurez ».
Pire : **les commentaires de code prescrivent le vouvoiement** (`HomeHeroCream.tsx` l.36 : *« foreas-copy-atomic : vouvoiement »*). **Tant que la doctrine source n'est pas mise à jour, chaque futur composant régressera en « vous ».**

**Fix (P0) :**
- Appliquer le tutoiement à la home **+ sweep `/chauffeurs` et `/tarifs2`** dans la même passe (sinon le chauffeur passe de « tu » à « vous » au clic CTA = coup de froid au pire moment).
- **Mettre à jour la doctrine `foreas-copy-atomic` + les commentaires de code** vers tutoiement. Sinon = violation « zéro régression ».

---

### 🔴 TROU #3 — L'exposition CNIL/DGCCRF est SITE-WIDE ; le doc en couvre ~30 %
Grep réel — les faux chiffres vivent **surtout là où on entre la carte** :

| Fichier | Ce qui reste | Risque |
|---|---|---|
| `app/tarifs/page.tsx` | « 147 chauffeurs » ×3 + **« 23 places »** | Fausse rareté **au point de vente** = art. L.121-1 conso |
| `app/tarifs2/page.tsx` | « 147 », « 247 » ×2, « 4,9 », « Vendredi » | Idem + page d'argent principale |
| `components/Footer.tsx` | **« 4,9/5 »** | Sur **toutes les pages**, y compris les **pages légales** |
| `app/page.tsx`, `ou-ca-paie` | « 247 », « 4,9 » | Cohérence |

**Le chauffeur clique le CTA d'une home impeccable → atterrit sur `/tarifs2` qui ré-affiche « 23 places » et « 4,9/5 · 247 avis ».** Toute la crédibilité bâtie s'évapore en un scroll, **et** c'est la surface la plus risquée juridiquement (fausse rareté à l'achat).

**Fix (P0, quelques heures) :** sweep CNIL en commençant par **`/tarifs2` + `/tarifs` + `Footer`** (enjeu légal + conversion max), home ensuite. Soit un vrai compteur branché, soit suppression.

---

### 🟠 TROU #4 — Le « 3× plus » et le « €/h » sont fabriqués (pire que ce que dit le doc)
`ZonePainCalculator.tsx` :
- l.162 : `net / 0.5` → suppose **« chaque course = 30 min »**. €/h inventé.
- l.165 : **« Vous gagnez 3× plus »** → multiplicateur pur, vrai à une seule valeur du slider. **Promesse chiffrée sans base = trompeur manuel.**
- Le breakdown fiscal lui-même est fragile (« TVA ≈ 16,6 % » appliquée à tous ; beaucoup de micro-VTC ne collectent pas la TVA pareil ; URSSAF simplifiée). **Afficher une compta fausse percute le garde-fou M18 (FOREAS ≠ expert-comptable).**

**Fix (P0) :** garder la **commission Uber** (~25 %, réelle, défendable) comme douleur héros. **Supprimer** le €/h dérivé et le « 3× ». Le reste des charges → soit retiré, soit **un seul** « charges estimées (hors ta situation fiscale) ». Aucune promesse chiffrée Ajnaya sans cohorte sourcée.

---

### 🟠 TROU #5 — Le système de CTA est incohérent (et il y a 2 funnels en parallèle)
Constat code :
- Hero CTA = **noir Apple** (`#1d1d1f`) → ouvre le **modal Ajnaya**.
- Mécanisme / Douleur / Plan / Final CTA = **dégradé vert WhatsApp** (`from-green-600`) → **deep-link WhatsApp**.

Le doc dit « passe le vert en violet ». Mais ça crée un **3ᵉ style** et oublie que Douleur/Plan restent codés en vert. Après le doc, le chauffeur voit : noir → vert → vert → violet → vert → violet. **Aucun « LE bouton » apprenable.** Surtout : tu fais tourner **deux funnels concurrents** (ouvrir le modal **vs** partir sur WhatsApp) → fatigue de décision = violation « 1 action principale par écran ».

**Fix (P1) :** décider **UN funnel** (modal Ajnaya OU WhatsApp), puis **UN traitement visuel** primaire (violet→deep + glow). Le vert **réservé** aux boutons dont la destination est *littéralement* WhatsApp ET où tu veux le repère WhatsApp ; sinon brand. Le noir du hero est tolérable comme exception (fond crème + même action « ouvrir Ajnaya ») **à condition que** Mécanisme/Final ouvrent aussi Ajnaya, pas WhatsApp.

---

## D. RISQUE LE PLUS PROFOND (au-delà du copy)
**La home promet « te dit combien ça paie ce soir — avant de démarrer ». Est-ce que le modal Ajnaya rend vraiment un chiffre crédible, zone-spécifique — ou un script générique ?**
Si c'est du théâtre, **aucun copy ne te sauve** : le méfiant teste en 30 s, attrape le générique, et la confiance s'effondre **plus fort** que si tu avais promis moins. Tout le site repose sur la qualité réelle de la réponse `zone-by-coords` + modal. → **À valider en priorité** (c'est ta propre règle : *« refuser toute fake intelligence »*).

---

## E. RÉÉCRITURES CONCRÈTES (les 4 pièces faibles)

### 1) Preuve sociale — sortir du piège rattachement
```
Eyebrow : 6 CHAUFFEURS · LEUR VISAGE · LEUR VOIX   (supprimer « VIREMENTS »)
Titre   : Pas moi qui le dis. Eux.
Cadrage : Des chauffeurs comme toi. Tu cliques, tu les écoutes. Personne ne lit un script.

[HÉROS — chiffré, Ajnaya]  Binate, Tesla : « +30 % de revenus. Même nombre de courses. »
[SECONDAIRE — confiance, PAS revenu]  « Et ceux qui roulent avec nous depuis 2, 5, 9 ans ? Ils restent. »
```
→ zéro « virement », zéro chiffre inventé. Binate porte la preuve revenu, les anciens portent la longévité.

### 2) Calculateur Douleur — version défendable
```
Titre  : Sur une course de 25 €, Uber t'en garde 6,25 €.   (commission réelle, défendable)
Héros  : −6,25 € de commission Uber   (rouge danger, tabular-nums)
        + 1 seule ligne : « + tes charges estimées (hors ta situation fiscale) »
Pont   : Tu bosses bien. Le problème, c'est pas toi — c'est les courses à vide qu'on te refile.
         Ajnaya repère, en temps réel, celles où il te reste le plus en net. Même volant, mieux placé.
SUPPRIMÉ : « X €/h » (net/0.5)  ·  « Vous gagnez 3× plus »
```

### 3) PS final — garder le miroir froid, retirer le recoil « années perdues »
La version du doc (« compteur d'années perdues ») **convertit certains mais déclenche la réactance/honte** chez un public fatigué. Alterne et **A/B-teste** :
```
PS — Tu peux fermer cette page, c'est ton droit. Mais demain matin au volant, la
question est la même : tu roules au hasard, ou quelqu'un calcule pour toi ?
Vérifier te coûte 0 € et 7 jours. — Chandler, fondateur.
```
Fin sur **l'agentivité**, pas la culpabilité. Ne suppose pas que la version dure gagne : teste-la.

### 4) Règle CTA (à graver dans `foreas-design-system`)
> **Un funnel par page. Un style primaire (violet→deep + glow) pour « l'étape suivante ». Vert uniquement si la destination est littéralement WhatsApp.** Tout secondaire = ghost. Pas de 3ᵉ couleur.

---

## F. PLAN D'EXÉCUTION PRIORISÉ (règle absolue : CA → data → V1 < 2 sem.)

**P0 — cette semaine (CA + légal, quelques heures à 2 jours)**
1. Sweep CNIL `/tarifs2` + `/tarifs` + `Footer` : tuer « 23 places », « 4,9/5 · 247 avis », « 147 chauffeurs ».
2. Tuer le mot « virement » + reframer la preuve sociale à 2 étages (héros Binate).
3. Supprimer « Vous gagnez 3× plus » + le €/h dérivé.
4. Appliquer le tutoiement home **+ `/chauffeurs` + `/tarifs2`** ; mettre à jour la **doctrine `foreas-copy-atomic`** + commentaires de code.

**P1 — conversion (semaine 2)**
5. Unifier le système CTA + choisir UN funnel.
6. Stopper l'auto-advance du carrousel témoignages.
7. Brancher le vrai compteur (live-driver-count) **ou** le retirer définitivement.

**P2 — tester, ne pas supposer**
8. A/B PS « dur » vs « agentivité ».
9. Tester un teaser de perte (commission Uber) juste sous le hero.
10. Re-tourner 2 témoignages Ajnaya-CA (asset le plus rentable).

**Angle DATA (priorité 2 de ta règle)** : chaque recherche de zone (hero modal) + chaque handoff WhatsApp = data comportementale à forte valeur (intention de zone, heure, géo). Le refonte copy ne doit **pas casser** la capture dans `widget_conversations`. C'est l'actif licensing — vérifier que zone + coords + timestamp + outcome sont bien loggés.

---

## G. DÉCISION FINALE & PROCHAINE ACTION
**Le doc est validé comme passe de copy (82/100 sur le texte). Il N'est PAS « prêt à appliquer +100/100 » : il manque la couche système.**
**Prochaine action concrète : exécuter P0 (1→4) avant tout déploiement de la home.** Sans P0, tu publies une home crédible qui renvoie vers des pages qui la contredisent — lift partiellement annulé + exposition légale intacte.

*Le delta entre 72 et 100, c'est exactement les 5 trous ci-dessus. C'est là qu'est tout l'argent.*

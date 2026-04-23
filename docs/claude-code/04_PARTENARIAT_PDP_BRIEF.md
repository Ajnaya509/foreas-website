# Brief Partenariat PDP — FOREAS × Plateforme Agréée DGFiP

**Objectif** : signer un partenariat avec une Plateforme Agréée (PA, ex-PDP) pour que FOREAS puisse, via son app, permettre à ses chauffeurs VTC de **recevoir** des e-factures (1er sept 2026) puis **émettre** des e-factures B2B (1er sept 2027) en conformité totale avec la réforme DGFiP.

**Pourquoi partenariat plutôt qu'agréation directe** : 112+ PA déjà immatriculées en mars 2026, certification lourde (audit sécurité, interopérabilité Peppol, engagement DGFiP continu) = 12-18 mois + dizaines de k€ pour un ROI faible vs partenariat. On reste concentrés sur le métier FOREAS (coaching VTC, Ajnaya, Coach Réflexe).

**Pourquoi 3 candidats shortlist plutôt que les 112** : sur 112 PA, ~60 sont des éditeurs cabinet-comptable (Sage, Cegid, EBP...), ~30 sont B2B entreprise (SAP/Oracle), ~10 sont sectorielles (BTP, médical, retail). **Il n'y en a qu'~10 vraiment pertinentes pour notre cible auto-entrepreneur VTC** : Pennylane, Iopole, Tiime, Qonto, Indy, Freebe, Abby, Dougs, Evoliz, Legalstart. On en benchmark 3 en parallèle, on signe le meilleur.

---

## 🎯 Stratégie à 2 étages (rétention-first)

### Phase 1 (immédiat) — API directe = OD (Opérateur de Dématérialisation)

**On ne veut PAS de simple affiliation lien externe** (le chauffeur quitte FOREAS pour Pennylane, zéro lock-in, zéro rétention). On veut **intégrer l'API de la PA dans notre UI** :

- Onglet "E-Factures" dans ComptabiliteScreen.tsx
- Chauffeur reçoit / voit ses factures **dans FOREAS**, jamais sur Pennylane
- En backend invisible : FOREAS est "Opérateur de Dématérialisation" utilisant la PA partenaire
- **Lock-in maximal** : le chauffeur ne peut pas quitter FOREAS sans perdre l'accès UI à ses factures
- UX 100% FOREAS, compliance 100% PA

### Phase 2 (Q4 2026, si volume) — agrégateur multi-PA agnostique

Une fois le volume là (500+ chauffeurs actifs sur e-factures), on ouvre FOREAS à **plusieurs PA** :

- Le chauffeur choisit sa PA (celle de son comptable, ou celle qu'il avait déjà)
- FOREAS ingère les factures depuis n'importe laquelle des 10 PA pertinentes via leur API
- Via protocole **Peppol** (réseau interop européen), tout PA agréée peut envoyer à toute autre PA → on peut techniquement ingérer toute facture de toute PA sans contrat bilatéral
- FOREAS devient la **couche de présentation universelle** (pattern Qonto multi-banques)

**Effet plateforme** : plus on supporte de PA, plus on est indispensable.

---

## Contexte FOREAS à partager

- **SaaS VTC France** — app React Native + Pieuvre N8N + Supabase
- **~1000 chauffeurs actifs ciblés 2026** (base en croissance)
- **Abo** : 13€/semaine (~56€/mois)
- **Compta IA déjà livrée** — `src/screens/ComptabiliteScreen.tsx` :
  - Revenu temps réel agrégé depuis les plateformes Uber/Bolt/Heetch
  - URSSAF tirelire auto 24,6% BNC 2025
  - OCR tickets (GPT-4o Vision) + classification
  - Chat Ajnaya expert-comptable
  - Export PDF (bilan / URSSAF / frais)
  - Simulateur micro vs réel
- **Ce qu'il manque pour la compliance 2026** : émission/réception Factur-X / UBL / CII + transmission DGFiP + e-reporting
- **Particularité cible** : chauffeurs VTC, cumul B2C (particuliers via Uber/Bolt) + B2B (hôtels, entreprises, TPMR) + réception factures plateformes (Uber/Bolt leur enverront les relevés commission en e-invoice à partir de sept 2026)

---

## Demande précise

Un **deal "Opérateur de Dématérialisation (OD)"** — pas une affiliation lien externe, mais une **intégration API dans l'UI FOREAS** :

1. **Statut OD** pour FOREAS — on utilise la PA partenaire en backend, mais la relation client chauffeur passe par l'app FOREAS (UI, notifications, support N1)
2. **API complète** pour intégrer le flux factures dans l'onglet E-Factures FOREAS :
   - Créer / lire compte chauffeur programmatiquement
   - **Recevoir** les factures entrantes (webhook + endpoint list)
   - **Émettre** les factures sortantes B2B (format Factur-X via endpoint POST)
   - **E-reporting** (transmission données transaction DGFiP)
   - Statuts de transmission / erreurs
3. **Onboarding silencieux depuis FOREAS** — SSO invisible pour le chauffeur, compte PA créé en arrière-plan avec ses données Supabase FOREAS (nom, SIRET, coordonnées, activité VTC)
4. **Commission / rev-share** sur les abonnements des chauffeurs onboardés via FOREAS (négo : 25-40% récurrent, ou forfait volumique)
5. **Prix préférentiel négocié** — tarif OD partenaire (vs retail self-serve)
6. **Brand co-marketing** — mention mutuelle (FOREAS "Powered by [PA]" ou "Compatible PA officielle")
7. **Droit de sortie ≤ 60 jours** + possibilité de migrer vers autre PA (Phase 2 agrégateur)

**Pas demandé en phase 1** : whitelabel full 100% (impossible si on reste OD et pas PA nous-mêmes), déploiement self-hosted, custom SLA enterprise.

---

## Shortlist 3 candidats

### 1. 🏆 Pennylane (recommandation #1)

**Pourquoi** :
- **PA immatriculée officielle DGFiP** (certifiée 2026, Factur-X + UBL + CII + Peppol)
- **Positionnement mainstream auto-entrepreneur** — notre coeur de cible
- **API B2B solide** (documentée, référence marché)
- **Écosystème expert-comptable** — intéressant pour un futur réseau partenaire
- **Contenu SEO massif** — ils poussent fort le sujet, bon effet halo co-branding

**Points de vigilance** :
- Pricing retail ~20-40€/mois par chauffeur (selon offre) → besoin tarif préférentiel
- Gros acteur → cycle commercial plus long (4-8 semaines)
- Ne sont pas spé VTC — UX générique comptabilité

**URL contact commercial** : https://www.pennylane.com/fr (formulaire partenariat)

---

### 2. Iopole

**Pourquoi** :
- **PA immatriculée officielle**
- **Déjà intégré par WayPlan** pour la compliance transport → ils connaissent le vertical
- Moins grand que Pennylane = **plus réactif commercialement**
- Potentiellement **tarifs plus agressifs**

**Points de vigilance** :
- Moins connus du grand public (moins d'halo marque)
- API / doc dev à vérifier
- Focus B2B historique — moins orienté auto-entrepreneur individuel

**URL contact** : https://www.iopole.fr/

---

### 3. Tiime

**Pourquoi** :
- **PA immatriculée officielle (Tiime PDP)**
- **Relation expert-comptable forte** — bon pour les chauffeurs qui ont déjà un comptable
- Suite complète (compta + facture + banque)

**Points de vigilance** :
- Positionnement plus "cabinet comptable-ready" que "auto-entrepreneur solo"
- UX historiquement pro → peut surcharger le chauffeur terrain
- Pricing moyen marché

**URL contact** : https://www.tiime.fr/

---

## Stratégie contact : en parallèle les 3, retenir le meilleur

Approche recommandée :
1. **Envoyer les 3 emails en parallèle lundi matin** (copie ci-dessous)
2. **Premier RDV commercial en 7-10 jours** → garder celui qui répond le plus vite + signe les meilleures conditions
3. **Décision finale max fin mai 2026** pour intégration technique juin-juillet et GA en août

---

## Email template (à personnaliser par destinataire)

**Objet** : Partenariat OD (Opérateur de Dématérialisation) — FOREAS × [Pennylane / Iopole / Tiime] pour chauffeurs VTC

```
Bonjour [Prénom si connu sinon Madame / Monsieur],

Je suis Chandler Milien, fondateur de FOREAS (foreas.xyz) — la première app
de coaching terrain dédiée aux chauffeurs VTC en France. Notre base en
croissance atteindra ~1000 chauffeurs actifs courant 2026, tous
auto-entrepreneurs, tous concernés par la réforme de la facturation
électronique au 1er septembre 2026.

Nous cherchons une Plateforme Agréée partenaire pour intégrer la
réception (2026) puis l'émission (2027) de factures électroniques
DIRECTEMENT dans notre app, en tant qu'Opérateur de Dématérialisation
utilisant votre PA en backend.

Notre positionnement : l'UX reste 100% FOREAS côté chauffeur (onglet
E-Factures dans notre app), votre PA porte la compliance DGFiP côté
technique. Vous êtes "Powered by [PA]" sur nos documents, nous sommes
le distributeur exclusif pour le vertical VTC.

Notre app a déjà un onglet "Copilote Compta IA" fonctionnel (tirelire
URSSAF temps réel, OCR tickets, exports PDF, chat expert — pour être
clair nous ne sommes PAS expert-comptables, l'app est un copilote).
Il nous manque uniquement la couche e-invoicing normative — c'est là
que votre expertise PA devient indispensable.

Ce que nous proposons :
 • Distribution : onboarding silencieux en 1 clic depuis l'app FOREAS
 • Volume attendu : 500-1000 activations d'ici septembre 2026
 • Co-marketing : mention partenaire mutuelle, contenu pédagogique conjoint
 • Support N1 chauffeur assuré par FOREAS (vous ne gérez que la tech)

Ce que nous recherchons de votre côté :
 • Statut OD formalisé + API complète (création compte, réception,
   émission Factur-X, e-reporting, webhook)
 • Rev-share sur les abonnements des chauffeurs onboardés via FOREAS
 • Tarif OD préférentiel (vs self-serve public)
 • Droit de sortie ≤ 60 jours

Seriez-vous disponible pour un échange de 20 minutes cette semaine ?
Je peux vous partager une démo live de FOREAS + notre roadmap compliance.

Bien cordialement,
Chandler Milien
Fondateur FOREAS
contact@foreas.net
https://foreas.xyz
```

---

## ⚠️ Point légal crucial — PAS de positionnement "expert-comptable"

**À NE JAMAIS dire / écrire** (risque pénal : Ordonnance 19 sept 1945 art. 20, amende 9 000€ + prison) :

- ❌ "FOREAS fait ta compta"
- ❌ "Notre équipe gère votre comptabilité"
- ❌ "FOREAS expert-comptable"
- ❌ "On signe vos déclarations"

**À dire (légal)** :

- ✅ "Copilote compta IA"
- ✅ "Assistant de gestion"
- ✅ "Ton tableau de bord financier"
- ✅ "On te met en relation avec un expert-comptable partenaire certifié"

**Chemin légal si on veut aller plus loin** :

1. **Partenariat cabinet expert-comptable** (recommandé) — ils signent, on fournit la tech. Revenu partagé.
2. **Recruter 1 expert-comptable interne** agréé Ordre → FOREAS devient cabinet. Lourd (RC pro, locaux, etc.)
3. **Devenir OMGA** (Organisme Mixte de Gestion Agréé) — aide gestion auto-entrepreneurs, moins encadré. À explorer Sprint 11-12 selon volume.

Pennylane lui-même n'est PAS cabinet comptable — ils sont éditeur + marketplace d'experts partenaires. On reproduit le modèle.

---

## Checklist FOREAS avant envoi

- [ ] Préparer démo live 5 min app Android (ComptabiliteScreen + bannière réforme + Ajnaya chat)
- [ ] Préparer 1-pager PDF "FOREAS en 60 secondes" (nombres clés + captures)
- [ ] Créer page landing **foreas.xyz/partenariat-pdp** (optionnel, pour crédibilité)
- [ ] Identifier le bon interlocuteur LinkedIn (VP Partnerships / Head of BD) chez chaque cible
- [ ] Prévoir créneaux RDV semaine prochaine (3 × 30 min)

---

## KPIs à négocier et tracker

| KPI | Seuil cible |
|---|---|
| Commission % récurrente | ≥ 25% |
| Discount chauffeur FOREAS vs public | ≥ 30% |
| Temps onboarding chauffeur (clic → compte actif) | < 3 min |
| SLA support technique partenaire | < 24h ouvrés |
| Droit de sortie contractuel | ≤ 60 jours, sans pénalité |

---

## Next steps opérationnels

1. **Chandler** : valide shortlist, envoie les 3 emails lundi matin
2. **FOREAS tech (Claude)** : prépare 1-pager PDF démo + page partenariat (si décidé)
3. **Après 1er RDV signé** : ouvrir ticket intégration API, tester en sandbox
4. **Sprint 10** (mai-juin) : intégration technique + onglet "E-Factures" dans ComptabiliteScreen
5. **Campagne** (août) : broadcast Ajnaya "ta compliance sept 2026 est prête, active en 2 clics"

---

*Document préparé — 21 avril 2026 — FOREAS Labs*

# BRIEF CLAUDE CODE — P0 HOME FOREAS (post-audit 2026-06-21)

> **À lire d'abord** : `docs/AUDIT-HOME-REFONTE-2026-06-21.md` (rationale complet des 5 trous-système).
> **Périmètre** : repo `FOREAS site internet vitrine` (foreas.xyz). **Ne pas déployer.** Produire un diff + résumé pour review.

## Règles de mission (non négociables)
- Respecter `CLAUDE.md` + la règle cross-fil `FOREAS-SHARED/*` (lire `AJNAYA_STATE.md`, logger une entrée `AJNAYA_CHANGELOG.md` si cross-impact).
- **Zéro chiffre inventé.** Tout nombre affiché = soit un vrai compteur branché, soit une vérité-mécanisme, soit supprimé.
- **Tutoiement pro partout** (registre adulte-à-adulte, jamais d'argot).
- Couleurs via **tokens** `tailwind.config.ts` (`accent.purple #8C52FF`, `accent.purple-deep #6C3CE0`, `success #10B981`, `danger #EF4444`). Pas de hex sauvage.
- Garde-fou **M18** : FOREAS = copilote, **jamais** « on fait ta compta / experts-comptables ».
- Commit `Site2026vXX`. Diff par étape, pas de big-bang.

---

## P0.1 — SWEEP CNIL (supprimer tous les faux chiffres) — *priorité légale + conversion*
Pour CHAQUE occurrence : brancher un vrai compteur **OU** remplacer par une vérité-mécanisme **OU** supprimer. Jamais garder un nombre non sourcé.

| Fichier | Lignes | Élément | Action |
|---|---|---|---|
| `src/components/Footer.tsx` | 94, 105 | « 4,9/5 » (sur TOUTES les pages) | Supprimer la note, ou remplacer par trust non-chiffré |
| `src/app/tarifs/page.tsx` | 261, 281, 304 / **284** | « 147 chauffeurs » / **« 23 places »** | Supprimer fausse rareté + faux live |
| `src/app/tarifs2/page.tsx` | 203, 293, 446, 544, 569, 698 | « 4,9 » / « 147 » / « 247 » ×2 / « Vendredi » | Supprimer / vérité-mécanisme |
| `src/app/page.tsx` | 18, 22, 65, 66, 79 | « 247 » / « 4,9 » | Supprimer / réel |
| `src/app/ou-ca-paie/page.tsx` | 75, 76 | « 4,9 » / « 247 » | Supprimer / réel |
| `src/components/zone/ZoneFinalCTAWithPS.tsx` | 87 | « ⭐ 4,9/5 · 247 avis » | Supprimer |
| `src/components/zone/ZonePlanTimeline.tsx` | 55, 71, 107 | « Vendredi » / « DEMAIN » / « 4,9 » | Remplacer par « CHAQUE MATIN / QUAND TU VEUX » ; retirer 4,9 |
| `src/components/zone/TestimonialCarousel.tsx` | 24 | « 247 » | Supprimer |
| `src/components/zone/ZoneSearchBarHero.tsx` | 250 | « 247 » | Supprimer / réel |
| `src/components/zone/ZoneMechanismVisual.tsx` | 50 | « BREVETÉE » | « COMMENT ELLE FAIT » sauf si brevet réellement déposé |
| `src/components/home2026/HomeHeroCream.tsx` | 184, 203 | « 147 chauffeurs en ligne » | Compteur live `/api/live-driver-count` **ou** « Ajnaya lit 7 plateformes en direct » |
| `src/components/home2026/HomeProofStrip.tsx` | 11-12, 28, 38-39 | « 247 » / « 4,9 » | Remplacer par 6 micro-preuves vraies (voir audit §1) |
| `src/components/home2026/HomeBigDomino.tsx` | 10, 24, 33, 75 | « 247 chauffeurs savent » | « Ajnaya lit la demande en temps réel sur 51 zones » |
| `src/components/home2026/AjnayaConversationModal.tsx` | 717 | « 247 » | Supprimer / réel |
| `InteractivePhoneMockup.tsx` 45/243 · `PhoneMockup.tsx` 41 · `AjnayaChatScroll.tsx` 314/452 | — | « 4,9 » / « 247 » dans l'UI maquette | Revoir (risque moindre car capture d'écran, mais à nettoyer) |

## P0.2 — TUTOIEMENT SYSTÉMATIQUE + DOCTRINE (anti-régression)
- Convertir tout `vous/votre/-ez` → tutoiement sur : `home2026/*`, `zone/*`, **`app/chauffeurs/page.tsx`, `app/tarifs2/page.tsx`** (le funnel complet — sinon coup de froid au clic CTA).
- Corriger la **schizophrénie** dans `ZonePainCalculator.tsx` (header « Dans ta poche » = tu, corps « vous travaillez » = vous).
- **Mettre à jour la doctrine `foreas-copy-atomic`** + les **commentaires de code** qui disent « vouvoiement » (ex. `HomeHeroCream.tsx` l.36). Sinon chaque futur composant régresse.

## P0.3 — PREUVE SOCIALE : sortir du piège « rattachement »
- `ZoneSocialProof.tsx` : l.46 retirer « VRAIS VIREMENTS » → « LEUR VISAGE · LEUR VOIX » ; l.52-54 « Des virements. » → « Eux. » ; l.57-59 + l.75 caption : **retirer tout mot « virement »** (implique que FOREAS paie = rattachement).
- `testimonials.data.ts` : reframer les `quoteShort`/`gainBadge` qui parlent paiement (Dragan, Hadietou, Nikolic) en **confiance/longévité**, **jamais en preuve de revenu**. **Binate (+30 %) = card héros chiffrée** (vérifier que la vidéo dit bien 30 %). Structure 2 étages : Binate = preuve revenu Ajnaya ; les anciens = preuve confiance.

## P0.4 — SUPPRIMER LES CHIFFRES FABRIQUÉS DU CALCULATEUR
- `ZonePainCalculator.tsx` : supprimer l.162 le `€/h` dérivé de `net / 0.5` ; supprimer l.165 « Vous gagnez 3× plus » ; simplifier le breakdown ou le labelliser « estimation, hors ta situation fiscale » (garde-fou M18). Garder la **commission Uber** (~25 %, défendable) comme douleur.

---

## P1 — APRÈS validation P0 (ne pas faire dans le même commit)
- **Unifier le système CTA** + choisir UN funnel (modal Ajnaya **OU** WhatsApp). Style primaire unique : gradient `accent.purple → accent.purple-deep` + glow. Vert réservé aux boutons dont la destination est *littéralement* WhatsApp.
- **Stopper l'auto-advance** du `TestimonialCarousel` (le méfiant veut le contrôle).
- **Brancher le vrai compteur** live (`/api/live-driver-count`) ou le retirer définitivement.

## Livrable attendu
1. Diff par étape (P0.1 → P0.4), liste des fichiers touchés.
2. Entrée `AJNAYA_CHANGELOG.md` au format imposé.
3. Résumé des nombres supprimés vs branchés.
4. **Aucun déploiement** avant ma review.

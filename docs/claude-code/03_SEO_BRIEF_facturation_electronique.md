# SEO Brief — foreas.xyz/facturation-electronique-vtc-2026

## Fichiers livrés

- `facturation-electronique-vtc-2026.page.tsx` — composant Next.js 13+ App Router (Tailwind + Lucide) prêt à déployer dans le site foreas.xyz
- Ce brief

## Déploiement

1. **Dans le repo site foreas.xyz** (probablement Vercel), copier le fichier dans :
   ```
   /app/facturation-electronique-vtc-2026/page.tsx
   ```
2. Vérifier les dépendances :
   - `next` ≥ 13
   - `tailwindcss` (déjà standard)
   - `next/link`
3. Adapter les routes CTA si besoin : `/signup` → chemin réel d'inscription
4. Déployer → URL live : `https://foreas.xyz/facturation-electronique-vtc-2026`

## SEO targets

### Queries primaires (recherche mensuelle estimée France)

| Query | Volume FR estimé | Intent |
|---|---|---|
| `facturation électronique VTC` | 200-500 | Info → transactionnel |
| `facturation électronique 2026 auto-entrepreneur` | 1k-3k | Info |
| `e-invoice VTC` | 100-300 | Info |
| `facture électronique chauffeur VTC` | 50-200 | Info |
| `PDP VTC` / `plateforme agréée VTC` | 50-100 | Info |
| `réforme DGFiP facturation 2026 VTC` | 50-200 | Info |

### Queries long-tail (easier ranking)

- `comment recevoir des factures électroniques en VTC 2026`
- `mon expert-comptable me demande de choisir une PDP` (peu commun mais haute valeur)
- `Uber me facture en électronique obligatoire 2026`
- `1er septembre 2026 VTC que faire`
- `plateforme agréée DGFiP chauffeur indépendant`

## Structure E-E-A-T (Google Helpful Content)

Déjà intégrée dans le fichier `.page.tsx` :

- **Experience** : mention "copilote terrain 1000+ chauffeurs" (ajuster si chiffre diffère)
- **Expertise** : timeline DGFiP exacte + sources officielles linkées (impots.gouv.fr, urssaf.fr, economie.gouv.fr)
- **Authority** : mention partenaires PA (Pennylane/Iopole/Tiime) + email contact
- **Trust** : footer légal explicite "FOREAS n'est PAS cabinet expertise comptable" + renvoi expert partenaire

## Schema.org JSON-LD

Déjà embedded :
- `Article` (headline, datePublished, author, publisher)
- `FAQPage` avec 4 Q/A critiques → élargit potentiel rich snippets Google

## Meta tags

Déjà configurés via `metadata` export Next.js :
- Title : 93 caractères (limite Google ≈ 60 affiché, reste lisible)
- Description : 223 caractères (limite ≈ 160 affichée)
- Canonical, OpenGraph, Twitter card

**À ajouter côté Vercel/Next config** si pas déjà : sitemap.xml + robots.txt

## Actions post-déploiement (dans l'ordre)

1. **Google Search Console** : soumettre la nouvelle URL manuellement
2. **Demande d'indexation** pour accélérer le crawl
3. **Internal links** : depuis la homepage foreas.xyz, ajouter un banner "Nouvelle : guide facturation électronique 2026 →" pour faire remonter le PageRank interne
4. **Backlinks** : proposer des échanges avec sites VTC friendly (BVTC, chauffeurs-independants.fr) — guest post ou échange de lien
5. **Content refresh** : mettre à jour la page tous les 30 jours (rappelle à Google qu'elle est vivante) — notamment actualiser le nombre de PA immatriculées

## KPIs à tracker (Google Analytics 4 + GSC)

| KPI | Cible 1er mois | Cible 3 mois |
|---|---|---|
| Impressions GSC sur queries cibles | 500+ | 5k+ |
| Position moyenne sur "facturation électronique VTC" | <30 | <10 |
| CTR page | ≥3% | ≥5% |
| Conversions CTA "Je prépare ma conformité" | 10+ | 100+ |
| Bounce rate | <60% | <45% |
| Temps moyen sur page | ≥2 min | ≥3 min |

## Contenu complémentaire (pour PageRank cluster)

Créer 3-5 pages satellites qui linkent vers la page principale :

- `/blog/uber-bolt-facture-electronique-2026` (récit : comment Uber va te facturer)
- `/blog/urssaf-tirelire-automatique-foreas` (évergreen mais linké)
- `/blog/10-plateformes-agreees-dgfip-pour-vtc` (comparatif, haute valeur SEO)
- `/guide/chauffeur-vtc-reforme-fiscale-2026-2027` (pillar page plus large)
- `/guide/plateforme-dematerialisation-partenaire-vtc` (mid-tier)

## Suivi timeline

- **Semaine 1** : déploiement page + soumission GSC
- **Semaine 2-4** : création 2 pages satellites
- **Semaine 4** : check positions GSC, ajuster meta si CTR faible
- **Mois 2** : content refresh avec stats à jour (nombre de PA, exemples chauffeurs bêta)
- **Mois 3** : décider de l'effort backlinks (guest posts, partenariats PR)

---

*Brief préparé — 21 avril 2026 — FOREAS Labs*

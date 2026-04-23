# SITE WEB & SEO — Contexte Projet
## Session Cowork : Site Vitrine FOREAS, Conversion, SEO
### Dernière mise à jour : 29 mars 2026

> Pour le contexte global de l'écosystème FOREAS, voir : `/Users/chandlermilien/Documents/Claude/Projects/FOREAS_GLOBAL_CONTEXT.md`

---

## MISSION DE CE PROJET

Optimiser le site vitrine foreas.xyz pour maximiser la conversion visiteurs → abonnés payants. Double audience : chauffeurs VTC (B2C) et partenaires B2B (hôtels, Airbnb, flottes). Claude doit agir comme Conversion Architect / CRO specialist / SEO strategist.

---

## STACK TECHNIQUE

| Couche | Tech | Version |
|--------|------|---------|
| Framework | Next.js (App Router) | 15.1.0 |
| UI | React | 19.0.0 |
| Styling | Tailwind CSS | 3.4.0 |
| Animation | Framer Motion | 11.15.0 |
| Paiement | Stripe (React + JS + Backend) | 5.6.0 / 8.8.0 / 17.5.0 |
| Base de données | Supabase | 2.100.0 |
| IA | Anthropic Claude API | 0.80.0 |
| Voix | ElevenLabs | API directe |
| Email | Resend | 6.9.4 |
| Analytics | Vercel Analytics + Speed Insights | 1.6.1 / 1.3.1 |
| Icônes | Lucide React | 0.468.0 |
| Hébergement | Vercel | CDN global, 28 régions |

### Conventions
- **Deploy** : auto sur push master
- **Commits** : Site2026vXX
- **Thème** : "Dark Sovereign" (deepblack #050508, cyan #00D4FF, purple #8C52FF, green #10B981)
- **Fonts** : Montserrat (body), Genos (display), JetBrains Mono (code)

---

## ARCHITECTURE DES PAGES (8 PAGES PUBLIQUES)

### Pages Marketing

| Route | Audience | Contenu | Conversion |
|-------|----------|---------|------------|
| `/` | B2B (hôtels, Airbnb, concierge, corporate) | Hero + 4 value props + parallax sticky scroll | CTA → /contact |
| `/chauffeurs` | B2C (chauffeurs VTC indépendants) | 6 pain points + AjnayaChat demo + RevenueSimulator + app mockups | CTA → /tarifs2 |
| `/partenaires` | B2B (flottes, loueurs) | Fleet problems + dashboard demo + case studies | CTA → /contact |
| `/tarifs` | Chauffeurs | 1 plan (12,97€/sem), toggle weekly/annual (-23%) | TrialBridge → Stripe Checkout |
| `/tarifs2` | Chauffeurs | 3 plans decoy (Essentiel/Pro/VIP), toggle weekly/annual (-20%) | TrialBridge → Stripe Checkout |
| `/technologie` | Tous | Deep dive technique Ajnaya, FusionEngine, pipeline data | Crédibilité |
| `/a-propos` | Tous | Histoire, équipe, vision | Confiance |
| `/contact` | B2B | Formulaire contact → email Resend | Lead capture |

### Pages Légales
| Route | Contenu | Statut |
|-------|---------|--------|
| `/cgu` | Conditions Générales d'Utilisation (10 sections) | Compliant |
| `/confidentialite` | Politique de confidentialité RGPD (détaillée) | Compliant |
| `/mentions-legales` | Mentions légales (éditeur, SIRET, hébergeur) | Compliant |

### Pages Internes
| Route | Contenu |
|-------|---------|
| `/dashboard` | Dashboards chauffeur/partenaire/admin |
| `/login` | Authentification partenaire |
| `/509` | Espace beta/staging |

---

## STRATÉGIE DE PRICING (3 PLANS DECOY)

### Page /tarifs2 — Modèle Principal
| Plan | Hebdo | Annuel (-20%) | Cible | Features clés |
|------|-------|---------------|-------|---------------|
| **Essentiel** | 9,97€ | 7,97€ | Entry | Dashboard + tracking multi-plateforme |
| **Pro** ⭐ | 12,97€ | 10,37€ | 80% des users | Ajnaya IA + site perso + referral 10€/filleul |
| **VIP** | 24,97€ | 19,97€ | Premium | Compta IA illimitée + support 24/7 + coaching |

### Mécanismes Psychologiques
- **Decoy effect** : Essentiel rarement choisi (delta faible vs Pro mais features manquantes)
- **Badge "Le plus populaire"** sur Pro
- **Ancrage** : VIP à 24,97€ rend Pro à 12,97€ raisonnable
- **Scarcity** : "Plus que 23 places au tarif découverte"
- **Social proof** : "147 chauffeurs actifs ce soir" + 3 témoignages avec gains spécifiques

### Mécanique de Trial
- **0€ débité** à l'inscription (carte requise)
- **Fin trial** : chaque lundi 18h Paris (calcul DST-aware : UTC+2 été, UTC+1 hiver)
- **TrialBridge modal** : explique la timeline avant demande de carte
- **Annulation** : 1 clic, sans pénalité, avant le premier prélèvement

### Stripe Integration
- Prix Stripe : `price_1RvOx5K89oTss0SbHKIgcUoO` (weekly), `price_1Szy2YK89oTss0Sb9pQyBWXt` (annual)
- Checkout embarqué (pas de redirect) → moins de friction
- Custom fields : téléphone + ville d'activité
- Codes promo activés
- Webhooks : `/api/webhooks/stripe/` gère le lifecycle abonnement

---

## CONVERSION FLOWS

### Funnel Chauffeur (B2C)
```
/chauffeurs → frustration/solution → AjnayaChat demo → RevenueSimulator → app mockups
    → sticky CTA mobile (après 60% scroll) → /tarifs2
    → sélection plan → TrialBridge modal → CheckoutModal Stripe
    → trial activé → /success → download app
```
Estimation : 1000 visites → 200 trials (20%) → 40 payants (20%) = **4% conversion globale**

### Funnel B2B
```
/ ou /partenaires → value props → dashboard demo → case studies
    → "Demander une démo" → /contact → formulaire → email Resend → suivi commercial
```

---

## 29 COMPOSANTS

### Composants Interactifs Clés
| Composant | Fonction | Taille |
|-----------|----------|--------|
| AjnayaChatScroll | Démo conversation IA simulée | 34KB |
| AjnayaWidget | Widget chat embarquable (sites partenaires) | 36KB |
| RevenueSimulator | Calculateur ROI interactif | 10KB |
| InteractivePhoneMockup | Mockup téléphone swipable | 13KB |
| ScrollMapAnimation | Animation carte parallax | 20KB |
| Testimonials | Carousel témoignages auto-play | 24KB |

### Composants UI
Header, Footer, Hero, Features, Stats, AppDemo, DownloadSection, CTA, PhoneMockup, DashboardMockup, FleetMapMockup, FloatingParticles, GrainOverlay, AnimatedBar, AnimatedCounter, CircularGauge, TiltCard, PulsingRing, GradientLine, Preloader, AjnayaNotification

---

## MÉTRIQUES AFFICHÉES SUR LE SITE

| Métrique | Valeur | Source | Risque |
|----------|--------|--------|--------|
| "147 chauffeurs actifs ce soir" | Dynamique | Supabase real-time | Moyen — vérifier mise à jour temps réel |
| "+35% CA moyen documenté" | Agrégat | Données cohorte chauffeurs | Moyen — documenter la source |
| "23 places au tarif découverte" | Statique ? | Marketing | Moyen — si fake, risque legal |
| "+38% CA" (Karim B.) | Spécifique | Témoignage | Faible si consent doc existe |
| "+412€/mois" (Soufiane M.) | Spécifique | Témoignage | Faible si consent doc existe |
| "-28% fatigue" (Théodore R.) | Spécifique | Témoignage | Faible si consent doc existe |

---

## CONFORMITÉ LÉGALE (Audit)

### Ce Qui Est Conforme
- CGU complètes (10 sections, responsabilité limitée à 3 mois de frais)
- Politique de confidentialité RGPD (retention claire, droits utilisateur, sous-traitants listés)
- Mentions légales (SIRET, éditeur, hébergeur)
- Recommandations IA marquées comme "indicatives" (protection responsabilité)
- Consentement explicite pour géolocalisation + voix
- Pas de stockage de données carte (Stripe PCI-DSS)

### Points d'Attention
| Risque | Détail | Action |
|--------|--------|--------|
| Témoignages non-auditables | Noms + gains spécifiques → CNIL peut demander preuves | Collecter consent docs signés |
| "147 chauffeurs" dynamique | Si rarement vrai → pratique commerciale trompeuse | S'assurer que c'est temps réel |
| "23 places" scarcity | Si inventaire ne diminue pas → trompeur | Lier à un vrai compteur ou disclamer |
| Referral "à vie" | Pas de clause de terminaison FOREAS | Ajouter clause 30 jours préavis |
| "+35% CA" | Chiffre agrégé non-documenté publiquement | Préparer doc source pour audit |
| Politique cookies | Absente | Créer /cookies page |
| DPO | Non désigné explicitement | Ajouter DPO dans mentions légales |

---

## PERFORMANCES & OPTIMISATIONS

### Déjà Implémenté
- Dynamic imports (lazy-load composants lourds)
- `useReducedMotion` hook (respect préférence OS)
- `useIsMobile` hook (rendu séparé mobile/desktop)
- `will-change` CSS sur éléments parallax
- IntersectionObserver pour animations (max 2 useScroll par page)
- Images AVIF/WebP (next/image)
- Grid responsive (grid-cols-1 md:grid-cols-3 lg:grid-cols-4)
- Sticky CTA mobile après 60% scroll

### Sécurité
- X-Frame-Options: DENY (pas d'iframe)
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- SSL/TLS automatique (Vercel + Let's Encrypt)
- Pas de secrets exposés dans le code

---

## TÂCHE PROGRAMMÉE ACTIVE

- **Audit conversion site** : tous les mercredis à 9h00 (active)
- Navigue sur foreas.xyz, analyse le CRO, génère un rapport

---

## EMPLACEMENT DU CODE

- **Site vitrine** : `/Users/chandlermilien/Documents/ÉPHIALTÈS 2025/FOREAS site internet vitrine/`
- **Partner dashboard** (séparé) : `/Users/chandlermilien/foreas-partners/`
- **Domaine** : foreas.xyz (Vercel)

---

## CE QUE CLAUDE DOIT FAIRE ICI

1. Agir comme **Conversion Architect** : chaque modification doit viser un lift mesurable du taux de conversion
2. Optimiser les pages pricing (A/B testing, copy, psychologie)
3. Améliorer le SEO (metadata, sitemap, structured data, vitesse)
4. S'assurer que les claims marketing sont défendables et documentées
5. Concevoir des tests A/B pour les CTAs, pricing, et social proof
6. Optimiser le funnel mobile (80%+ du trafic chauffeur)
7. Maintenir la conformité légale à chaque changement
8. Ne jamais sacrifier la crédibilité pour un gain de conversion court-terme

---

## 🔄 ADDENDUM SYNC SPRINT 9 — 23 avril 2026

> Ajout complémentaire — le reste du document ci-dessus reste la référence principale pour le site.

### État réel écosystème FOREAS au 23 avril 2026

| Composant | État |
|---|---|
| **App mobile** (`FOREAS-Clean` main) | v111 — versionCode 113 / 1.4.9 — Communauté v3 Opus 4.7 + Coach Réflexe overlay Android natif + Clients Directs refonte |
| **Pieuvre N8N** (VPS `srv1534739.hstgr.cloud`) | **131 workflows actifs** — moments M10/M13/M14/M15/M17/M18 + utility cross-canal + guardrail légal |
| **Supabase prod** (`fihvdvlhftcxhlnocqiq`) | ~180 tables — `widget_conversations` écrit par ce site (29+ rows) |
| **Backends Railway** | `foreas-ai-backend` (Whisper + Claude + ElevenLabs Koraly) + `foreas-stripe-backend` (Stripe + Auth) |
| **WhatsApp Business** | WABA Production `1244681104093709` + numéro `+33 7 80 73 22 16` (BV en cours Meta, ~26 avril) |

### Voix officielle Ajnaya : KORALY

- Voice ID ElevenLabs : `MNKK2Wl2wbbsEPQTHZGt` (Credible Pro Parisian FR)
- **Une seule voix partout** : site widget, WhatsApp, app mobile, backends Railway
- Si tu implémentes/modifies un widget vocal : passer par backend Railway `POST /api/ajnaya/tts`, **jamais** de clé ElevenLabs côté client, **jamais** hardcoder une autre voice_id

### Guardrail légal critique (M18 Admin Copilot)

- FOREAS = **copilote compta IA**, PAS expert-comptable (Ordonnance 19 sept 1945 art. 20, amende 9 000€ + prison)
- Ne JAMAIS écrire sur le site ou dans le widget : "FOREAS fait ta compta" / "on est experts-comptables" / "on signe tes déclarations"
- Toujours : "copilote compta", "assistant de gestion", "on te met en relation avec un expert-comptable partenaire"

### Landing prête à déployer — URGENT

📄 `docs/claude-code/02_landing_facturation_electronique_vtc_2026.page.tsx` + brief SEO `03_SEO_BRIEF_facturation_electronique.md`

- URL cible : `https://foreas.xyz/facturation-electronique-vtc-2026`
- Sujet : réforme DGFiP 1er sept 2026 (obligation réception e-factures pour tous auto-entrepreneurs VTC)
- JSON-LD Schema.org Article + FAQPage inclus
- Queries SEO : "facturation électronique VTC 2026", "PDP VTC", "e-invoice chauffeur VTC"
- **Action** : déployer cette semaine + soumettre URL à Google Search Console + lien depuis homepage

### Stratégie partenariat PDP (backend compliance e-invoicing)

📄 `docs/claude-code/04_PARTENARIAT_PDP_BRIEF.md`

- Shortlist : **Iopole** (PA whitelabel API-first, #1 pour FOREAS) + **Seqino** + **B2Brouter** — Pennylane/Tiime en backup affiliation
- Stratégie 2 étages : Phase 1 OD (Opérateur de Dématérialisation) + Phase 2 agrégateur multi-PA
- **Éviter** : se positionner comme "nous faisons votre comptabilité" (risque pénal — voir guardrail ci-dessus)

### Architecture Ajnaya cross-canal

📄 `docs/claude-code/01_AJNAYA_CROSS_CANAL_ARCHITECTURE.md`

10 portes d'entrée, pipeline unifié via `_utils_ajnaya_respond` + `_utils_ajnaya_send_cross_canal`. Le widget de ce site écrit dans `widget_conversations` Supabase et peut générer des `handoff_tokens` pour basculer une conversation vers WhatsApp sans perte de contexte.

### Palette mobile vs palette site

⚠️ **Ne pas confondre** :
- **Ce site** (Dark Sovereign) : `#050508` / `#00D4FF` / `#8C52FF` / `#10B981` ← identité site (voir section Stack ci-dessus)
- **App mobile & dashboard** : `#080C18` / `#00C9FF` / `#6C3CE0` / `#2ECC71` ← identité produit (différente, ne pas mélanger)

### Références complémentaires

- `docs/claude-code/01_AJNAYA_CROSS_CANAL_ARCHITECTURE.md` — 10 portes d'entrée + tentacules + gap list 82/100
- `docs/claude-code/02_landing_facturation_electronique_vtc_2026.page.tsx` — landing Next.js prête à copier dans `/app/facturation-electronique-vtc-2026/page.tsx`
- `docs/claude-code/03_SEO_BRIEF_facturation_electronique.md` — SEO + actions post-déploiement + KPIs
- `docs/claude-code/04_PARTENARIAT_PDP_BRIEF.md` — stratégie e-invoicing partenaires

Pour la source complète et la coordination app/Pieuvre : repo `FOREAS-Clean` (branche main) — commits récents :
- `7b7cb78` Sprint 9 Pieuvre (Ajnaya cross-canal + Koraly unique + e-invoicing)
- `da40ff8` Réforme CLAUDE.md Sprint 9 (sync app v111 + Pieuvre 131 workflows)

-- ═══════════════════════════════════════════════════════════════════════════
-- FOREAS — UN ESSAI GRATUIT PAR PERSONNE, PAS PAR ADRESSE E-MAIL
--
-- Appliquée en production le 29/08/2026.
--
-- ⚠️ PREMIER FICHIER SQL VERSIONNÉ DE CE DÉPÔT, ET C'EST UNE DETTE QU'ON SOLDE.
-- `reclamer_evenement_stripe` et `site_evenements_stripe_traites` existent en
-- base mais n'ont AUCUNE définition ici : aucun `.sql` n'a jamais existé dans
-- l'historique git. Une base recréée repartirait sans elles, et le webhook
-- répondrait 500 sans que rien ne l'explique. Elles restent à écrire.
--
-- ── LE PROBLÈME ────────────────────────────────────────────────────────────
-- `src/app/api/checkout/route.ts` pose `trial_end` à CHAQUE session, sans
-- jamais regarder l'historique, et aucun client Stripe n'est réutilisé.
-- N'importe qui peut enchaîner les essais gratuits à l'infini, sans même
-- changer d'adresse.
--
-- ── POURQUOI DES EMPREINTES ET PAS LES VALEURS ─────────────────────────────
-- Cette table dit « cette personne a déjà eu son essai ». On n'a jamais besoin
-- de RELIRE la valeur, seulement de la RECONNAÎTRE. Un sha256 de la valeur
-- normalisée suffit donc, et la table ne contient aucune donnée lisible.
--
-- Pas de sel secret, volontairement : un sel qui change ou disparaît rendrait
-- toutes les lignes passées invisibles — et le trou se rouvrirait EN SILENCE,
-- sans une erreur. Un déterminisme sans configuration vaut mieux ici.
--
-- ── POURQUOI QUATRE SIGNAUX ────────────────────────────────────────────────
-- Aucun n'est suffisant seul :
--   carte     — le plus fiable (stable pour une même carte physique, quel que
--               soit l'e-mail), mais connu seulement APRÈS le premier paiement.
--               C'est pour ça que la règle s'applique à la DEUXIÈME tentative,
--               jamais à la première.
--   email     — normalisé Gmail (points et « + » retirés), sinon
--               « moi+1@gmail.com » passe pour quelqu'un d'autre. Chandler a
--               justement rencontré cette forme le 28/08.
--   telephone — 9 derniers chiffres, pour neutraliser +33 / 0.
--   visiteur  — le plus faible : un onglet privé l'efface. Gardé quand même,
--               il coûte zéro et attrape le fraudeur pressé.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.essais_accordes (
  id           bigint generated always as identity primary key,
  type_signal  text        not null check (type_signal in ('carte','email','telephone','visiteur')),
  -- sha256 hexadécimal de la valeur normalisée. Jamais la valeur elle-même.
  empreinte    text        not null check (char_length(empreinte) = 64),
  -- l'abonnement qui a CONSOMMÉ l'essai. Sert à ne pas se bloquer soi-même
  -- lors d'un rejeu Stripe du même événement.
  abonnement   text        not null,
  accorde_le   timestamptz not null default now(),

  -- Le cœur du garde : un signal donné n'ouvre qu'UN essai, pour toujours.
  constraint essais_accordes_signal_unique unique (type_signal, empreinte)
);

comment on table public.essais_accordes is
  'Un essai gratuit par personne. Empreintes sha256 des signaux (carte, e-mail normalisé, téléphone, visiteur) déjà utilisés pour ouvrir un essai. Écrite et lue UNIQUEMENT par le webhook Stripe du site, avec la clé de service.';

create index if not exists essais_accordes_abonnement_idx
  on public.essais_accordes (abonnement);

-- ⚠️ RLS ACTIVÉ SANS AUCUNE POLITIQUE, ET C'EST VOULU.
-- Sans politique, la clé publique (anon) ne lit rien et n'écrit rien — elle
-- échouerait d'ailleurs EN SILENCE, ce qui est le piège habituel. Seule la clé
-- de service, utilisée par le webhook, traverse. Personne d'autre n'a de raison
-- de toucher cette table.
alter table public.essais_accordes enable row level security;

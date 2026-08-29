-- ═══════════════════════════════════════════════════════════════════════════
-- FOREAS — LES PANIERS ABANDONNÉS : IL A DONNÉ SON E-MAIL, PAS SA CARTE
--
-- Appliquée en production le 29/08/2026.
--
-- ⚠️ CE N'EST PAS LA MÊME CHOSE QUE LE PROFIL INCOMPLET. Deux moments :
--   · panier abandonné  → e-mail saisi, paiement JAMAIS confirmé. Aucun compte,
--                         aucun abonnement. On a une adresse et rien d'autre.
--   · profil incomplet  → il a PAYÉ, son compte existe, il manque son numéro.
-- Les confondre reviendrait à écrire « ton abonnement est actif » à quelqu'un
-- qui n'a jamais payé.
--
-- ⚠️ POURQUOI AUCUNE TÂCHE PLANIFIÉE
-- Le mail part 15 minutes après la saisie. Le forfait Vercel ne permet qu'un
-- passage par jour : une relance à 15 minutes y serait impossible. Resend sait
-- programmer un envoi (`scheduledAt`) et l'annuler (`emails.cancel`). On
-- programme au moment de la saisie, on annule si le paiement arrive.
--
-- ⚠️ CE QUE CETTE TABLE NE DOIT JAMAIS DEVENIR
-- Une liste de diffusion. Elle sert à UN mail. Quelqu'un qui renonce à
-- s'abonner n'a pas donné son accord pour être démarché.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.paniers_abandonnes (
  id                   bigint generated always as identity primary key,
  -- Une session, un panier. L'unicité empêche de programmer deux mails quand
  -- quelqu'un corrige son adresse ou réessaie après un refus.
  checkout_session_id  text        not null unique,
  email                text,
  -- L'identifiant de l'envoi programmé chez Resend : le seul moyen d'annuler.
  envoi_programme_id   text,
  capture_le           timestamptz not null default now(),
  converti_le          timestamptz,
  annule_le            timestamptz
);

comment on table public.paniers_abandonnes is
  'Adresses saisies sur /tarifs3 dont le paiement n''a pas abouti. Sert à UN seul mail de rappel, programmé chez Resend à +15 min et annulé si le paiement arrive. Jamais une liste de diffusion.';

create index if not exists paniers_abandonnes_ouverts_idx
  on public.paniers_abandonnes (capture_le)
  where converti_le is null;

-- RLS activé sans politique : seule la clé de service y accède.
alter table public.paniers_abandonnes enable row level security;

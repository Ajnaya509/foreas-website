-- ═══════════════════════════════════════════════════════════════════════════
-- FOREAS — SAVOIR QUI A PAYÉ MAIS N'A PAS FINI SON PROFIL
--
-- Appliquée en production le 29/08/2026.
--
-- Le formulaire passe en deux temps : l'écran 1 (e-mail + carte) encaisse et
-- crée le compte ; l'écran 2, APRÈS le paiement, demande le prénom et le
-- téléphone. Celui qui ferme l'onglet à l'écran 2 a bien son compte et son mot
-- de passe — il nous manque son numéro.
--
-- ⚠️ POURQUOI DEUX COLONNES ET PAS « phone IS NULL »
-- « Pas de numéro » ne dit pas QUAND on a renoncé à en obtenir un, ni si on a
-- déjà relancé. Sans ces deux dates, la relance repartirait à chaque passage du
-- planificateur : le chauffeur recevrait le même message tous les jours.
-- Un état qui ne porte pas sa date ne permet aucune décision — seulement une
-- répétition.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.subscribers
  add column if not exists profil_complete_le          timestamptz,
  add column if not exists relance_profil_envoyee_le   timestamptz;

comment on column public.subscribers.profil_complete_le is
  'Quand le chauffeur a rempli l''écran 2 (prénom + téléphone) après son paiement. NULL = profil incomplet.';
comment on column public.subscribers.relance_profil_envoyee_le is
  'Quand la relance « il manque ton numéro » a été envoyée. NULL = jamais relancé. Empêche la répétition à chaque passage du planificateur.';

-- Les incomplets se cherchent par cette colonne ET par la date de paiement :
-- on ne relance pas quelqu'un qui vient de payer il y a dix minutes.
create index if not exists subscribers_profil_incomplet_idx
  on public.subscribers (profil_complete_le, created_at)
  where profil_complete_le is null;

-- ⚠️ RATTRAPAGE DE L'EXISTANT.
-- Les lignes déjà en base ont été créées AVANT le découpage en deux écrans :
-- leur profil a été rempli sur la page de paiement elle-même. Les laisser à
-- NULL les ferait relancer pour un formulaire qu'elles n'ont jamais eu à voir.
-- On les marque complètes quand elles portent déjà un numéro.
update public.subscribers
   set profil_complete_le = coalesce(updated_at, created_at)
 where profil_complete_le is null
   and phone is not null
   and phone <> '';

-- ── Ajouté dans la foulée, même journée ────────────────────────────────────
-- ⚠️ SANS COMPTEUR, LA RELANCE NE S'ARRÊTE JAMAIS.
-- La date seule permet de dire « pas relancé depuis 6 jours » — donc de
-- renvoyer, et de renvoyer encore, tous les six jours, indéfiniment.
alter table public.subscribers
  add column if not exists relances_profil_envoyees integer not null default 0;

comment on column public.subscribers.relances_profil_envoyees is
  'Nombre de relances « il manque ton numéro » déjà envoyées. Plafond de 2 : au-delà, on ne relance plus.';

-- ⚠️ SANS CETTE COLONNE, LA RELANCE N'A NULLE PART OÙ RAMENER.
-- L'écran 2 vit sur `/success?session_id=…` et s'autorise à écrire grâce à cet
-- identifiant. On stockait le client et l'abonnement, jamais la session.
alter table public.subscribers
  add column if not exists checkout_session_id text;

comment on column public.subscribers.checkout_session_id is
  'Identifiant de la session Stripe Checkout (cs_…). Sert au lien de relance vers /success?session_id=…';

-- ── Panier abandonné (même journée) ───────────────────────────────────────
-- Voir 20260829_paniers_abandonnes.sql

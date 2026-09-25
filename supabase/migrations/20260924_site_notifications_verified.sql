-- Notifications publiques : seules des actions vérifiées et approuvées peuvent sortir.
-- Aucune insertion automatique, aucun nom sans accord distinct.
create table if not exists public.site_notification_events (
  id uuid primary key default gen_random_uuid(),
  event_kind text not null check (event_kind in ('app_page_opened', 'partner_account_activated', 'booking_site_published')),
  display_name text,
  display_name_consent_ref text,
  evidence_ref text not null check (length(trim(evidence_ref)) > 0),
  occurred_at timestamptz not null,
  approved_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint site_notification_name_consent check (
    (display_name is null and display_name_consent_ref is null)
    or (display_name is not null and display_name_consent_ref is not null and length(trim(display_name_consent_ref)) > 0)
  ),
  constraint site_notification_validity check (expires_at > occurred_at)
);

alter table public.site_notification_events enable row level security;
revoke all on public.site_notification_events from anon, authenticated;
create index if not exists site_notification_events_public_idx
  on public.site_notification_events (occurred_at desc)
  where approved_at is not null;

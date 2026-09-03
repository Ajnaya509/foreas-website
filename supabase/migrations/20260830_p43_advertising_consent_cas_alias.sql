-- P43 local candidate. Apply after P29. No browser time or identity is trusted.
begin;

create unique index if not exists advertising_consent_state_proof_unique_p43
  on public.advertising_consent_state(proof_id)
  where proof_id is not null;

-- Follows only real identity_bridge merges. Conflict audit rows in
-- identity_merges are deliberately not considered aliases.
create or replace function public.canonical_consent_identity_p43(p_identity uuid)
returns uuid
language sql stable security definer
set search_path = public, pg_temp
as $$
  with recursive chain(identity_id, depth, path) as (
    select p_identity, 0, array[p_identity]
    union all
    select (ib.metadata->>'merged_into')::uuid, c.depth + 1,
           c.path || (ib.metadata->>'merged_into')::uuid
    from chain c
    join public.identity_bridge ib on ib.id = c.identity_id
    where ib.merged_at is not null
      and nullif(ib.metadata->>'merged_into','') is not null
      and not ((ib.metadata->>'merged_into')::uuid = any(c.path))
      and c.depth < 10
  )
  select identity_id from chain order by depth desc limit 1
$$;

create or replace function public.consent_identity_cluster_p43(p_identity uuid)
returns table(identity_id uuid)
language sql stable security definer
set search_path = public, pg_temp
as $$
  with recursive aliases(identity_id, path, depth) as (
    select public.canonical_consent_identity_p43(p_identity),
           array[public.canonical_consent_identity_p43(p_identity)], 0
    union all
    select ib.id, a.path || ib.id, a.depth + 1
    from aliases a
    join public.identity_bridge ib
      on ib.merged_at is not null
     and nullif(ib.metadata->>'merged_into','') is not null
     and (ib.metadata->>'merged_into')::uuid = a.identity_id
    where not (ib.id = any(a.path)) and a.depth < 10
  )
  select distinct aliases.identity_id from aliases
$$;

-- The unsafe six-argument overload accepted an application timestamp and had
-- no compare-and-exchange precondition. Dropping it closes the bypass.
drop function if exists public.enregistrer_accord_mesure_p29(
  uuid, boolean, text, text, timestamptz, text
);

create or replace function public.enregistrer_accord_mesure_p29(
  p_identity uuid,
  p_granted boolean,
  p_version text,
  p_source text,
  p_proof_id text,
  p_expected_revision bigint,
  p_expected_proof_id text
) returns jsonb
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_identity uuid;
  v_row public.advertising_consent_state%rowtype;
  v_actual_revision bigint;
  v_now timestamptz := clock_timestamp();
begin
  if p_identity is null or p_granted is null
     or nullif(btrim(coalesce(p_version,'')),'') is null
     or p_source is null or p_source not in ('banner','checkout','app','whatsapp','withdrawal')
     or coalesce(p_proof_id,'') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
     or p_expected_revision is null or p_expected_revision < 0
     or (p_granted and p_expected_revision = 0 and p_expected_proof_id is not null)
     or (p_granted and p_expected_revision > 0 and
         coalesce(p_expected_proof_id,'') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$') then
    return jsonb_build_object('ok',false,'reason','consent_precondition_invalid');
  end if;

  v_identity := public.canonical_consent_identity_p43(p_identity);
  perform pg_advisory_xact_lock(hashtextextended('p43-consent:' || v_identity::text, 0));

  select * into v_row
  from public.advertising_consent_state
  where identity_id = v_identity::text
  for update;
  v_actual_revision := case when found then v_row.revision else 0 end;

  if p_granted and (
       p_expected_revision <> v_actual_revision
       or (v_actual_revision = 0 and p_expected_proof_id is not null)
       or (v_actual_revision > 0 and p_expected_proof_id is distinct from v_row.proof_id)
     ) then
    if v_actual_revision = 0 then
      return jsonb_build_object(
        'ok',false,'reason','revision_conflict','exists',false,
        'granted',false,'revision',0
      );
    end if;
    return jsonb_build_object(
      'ok',false,'reason','revision_conflict','exists',true,'granted',v_row.granted,
      'version',v_row.consent_version,'decided_at',v_row.client_decided_at,
      'proof_id',v_row.proof_id,'revision',v_row.revision
    );
  end if;

  if p_granted then
    if v_actual_revision = 0 then
      insert into public.advertising_consent_state(
        identity_id, granted, consent_version, source, proof_id,
        client_decided_at, recorded_at, revision
      ) values (
        v_identity::text, true, p_version, p_source, p_proof_id,
        v_now, v_now, 1
      ) returning * into v_row;
    else
      update public.advertising_consent_state set
        granted = true,
        consent_version = p_version,
        source = p_source,
        proof_id = p_proof_id,
        client_decided_at = v_now,
        recorded_at = v_now,
        revision = revision + 1
      where identity_id = v_identity::text
        and revision = p_expected_revision
      returning * into v_row;
      if not found then
        return jsonb_build_object('ok',false,'reason','revision_conflict');
      end if;
    end if;
  else
    -- A refusal/withdrawal is fail-closed. It wins even when its expected
    -- revision is stale and revokes every merged alias under the same lock.
    update public.advertising_consent_state s set
      granted = false,
      consent_version = p_version,
      source = p_source,
      proof_id = null,
      client_decided_at = v_now,
      recorded_at = v_now,
      revision = s.revision + 1
    where s.identity_id <> v_identity::text
      and s.granted = true
      and s.identity_id in (
        select c.identity_id::text
        from public.consent_identity_cluster_p43(v_identity) c
      );

    if v_actual_revision = 0 then
      insert into public.advertising_consent_state(
        identity_id, granted, consent_version, source, proof_id,
        client_decided_at, recorded_at, revision
      ) values (
        v_identity::text, false, p_version, p_source, p_proof_id,
        v_now, v_now, 1
      ) returning * into v_row;
    else
      update public.advertising_consent_state set
        granted = false,
        consent_version = p_version,
        source = p_source,
        proof_id = p_proof_id,
        client_decided_at = v_now,
        recorded_at = v_now,
        revision = revision + 1
      where identity_id = v_identity::text
      returning * into v_row;
    end if;
  end if;

  return jsonb_build_object(
    'ok',true,'granted',v_row.granted,'version',v_row.consent_version,
    'decided_at',v_row.client_decided_at,'proof_id',v_row.proof_id,
    'revision',v_row.revision
  );
end
$$;

-- One checkout call handles both paths. Positive transfer validates the
-- server-owned target and the real merge chain, then moves rather than copies.
create or replace function public.transferer_accord_mesure_p43(
  p_target_identity uuid,
  p_local_granted boolean,
  p_source_proof_id text,
  p_new_proof_id text,
  p_version text,
  p_expected_revision bigint
) returns jsonb
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_target_identity uuid;
  v_source public.advertising_consent_state%rowtype;
  v_target public.advertising_consent_state%rowtype;
  v_result jsonb;
  v_now timestamptz := clock_timestamp();
  v_alias_refusal boolean;
begin
  if p_target_identity is null or p_local_granted is null
     or nullif(btrim(coalesce(p_version,'')),'') is null
     or coalesce(p_new_proof_id,'') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
     or p_expected_revision is null or p_expected_revision < 0
     or (p_local_granted and coalesce(p_source_proof_id,'') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$') then
    return jsonb_build_object('ok',false,'reason','checkout_precondition_invalid');
  end if;

  v_target_identity := public.canonical_consent_identity_p43(p_target_identity);
  perform pg_advisory_xact_lock(hashtextextended('p43-consent:' || v_target_identity::text, 0));

  if not p_local_granted then
    select public.enregistrer_accord_mesure_p29(
      v_target_identity, false, p_version, 'checkout', p_new_proof_id,
      p_expected_revision, null
    ) into v_result;
    return v_result || jsonb_build_object('reason','checkout_withdrawal_wins');
  end if;

  select * into v_source
  from public.advertising_consent_state
  where proof_id = p_source_proof_id
  for update;
  if not found or not v_source.granted
     or v_source.consent_version <> p_version
     or v_source.revision <> p_expected_revision then
    return jsonb_build_object('ok',false,'reason','positive_server_proof_unproven');
  end if;
  if v_source.identity_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
     or public.canonical_consent_identity_p43(v_source.identity_id::uuid) <> v_target_identity then
    return jsonb_build_object('ok',false,'reason','identity_alias_unproven');
  end if;

  select * into v_target
  from public.advertising_consent_state
  where identity_id = v_target_identity::text
  for update;

  if found and not v_target.granted then
    update public.advertising_consent_state s set
      granted = false,
      source = 'checkout',
      proof_id = null,
      client_decided_at = v_now,
      recorded_at = v_now,
      revision = s.revision + 1
    where s.identity_id <> v_target_identity::text
      and s.granted = true
      and s.identity_id in (
        select c.identity_id::text
        from public.consent_identity_cluster_p43(v_target_identity) c
      );
    return jsonb_build_object(
      'ok',true,'reason','target_refusal_wins','granted',false,
      'version',v_target.consent_version,'decided_at',v_target.client_decided_at,
      'proof_id',v_target.proof_id,'revision',v_target.revision
    );
  end if;

  if v_source.identity_id = v_target_identity::text then
    return jsonb_build_object(
      'ok',true,'reason','same_server_identity','granted',v_source.granted,
      'version',v_source.consent_version,'decided_at',v_source.client_decided_at,
      'proof_id',v_source.proof_id,'revision',v_source.revision
    );
  end if;

  select exists(
    select 1
    from public.advertising_consent_state s
    join public.consent_identity_cluster_p43(v_target_identity) c
      on c.identity_id::text = s.identity_id
    where s.granted = false and s.proof_id is not null
  ) into v_alias_refusal;
  if v_target.identity_id is null and v_alias_refusal then
    select public.enregistrer_accord_mesure_p29(
      v_target_identity, false, p_version, 'checkout', p_new_proof_id, 0, null
    ) into v_result;
    return v_result || jsonb_build_object('reason','alias_refusal_wins');
  end if;

  if v_target.identity_id is null then
    insert into public.advertising_consent_state(
      identity_id, granted, consent_version, source, proof_id,
      client_decided_at, recorded_at, revision
    ) values (
      v_target_identity::text, true, p_version, 'checkout', p_new_proof_id,
      v_source.client_decided_at, v_now, 1
    ) returning * into v_target;
  else
    update public.advertising_consent_state set
      granted = true,
      consent_version = p_version,
      source = 'checkout',
      proof_id = p_new_proof_id,
      client_decided_at = v_source.client_decided_at,
      recorded_at = v_now,
      revision = revision + 1
    where identity_id = v_target_identity::text
    returning * into v_target;
  end if;

  -- The source and every merged alias lose their positive proof atomically.
  update public.advertising_consent_state s set
    granted = false,
    source = 'checkout',
    proof_id = null,
    client_decided_at = v_now,
    recorded_at = v_now,
    revision = s.revision + 1
  where s.identity_id <> v_target_identity::text
    and s.granted = true
    and s.identity_id in (
      select c.identity_id::text
      from public.consent_identity_cluster_p43(v_target_identity) c
    );

  return jsonb_build_object(
    'ok',true,'reason','alias_transferred_atomically','granted',v_target.granted,
    'version',v_target.consent_version,'decided_at',v_target.client_decided_at,
    'proof_id',v_target.proof_id,'revision',v_target.revision
  );
end
$$;

revoke all on function public.canonical_consent_identity_p43(uuid)
  from public, anon, authenticated;
revoke all on function public.consent_identity_cluster_p43(uuid)
  from public, anon, authenticated;
revoke all on function public.enregistrer_accord_mesure_p29(uuid,boolean,text,text,text,bigint,text)
  from public, anon, authenticated;
revoke all on function public.transferer_accord_mesure_p43(uuid,boolean,text,text,text,bigint)
  from public, anon, authenticated;
grant execute on function public.enregistrer_accord_mesure_p29(uuid,boolean,text,text,text,bigint,text)
  to service_role;
grant execute on function public.transferer_accord_mesure_p43(uuid,boolean,text,text,text,bigint)
  to service_role;

commit;

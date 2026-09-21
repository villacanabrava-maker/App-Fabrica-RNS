-- Agent Bridge reliability ledger.
-- Mutable handoff snapshot + append-only event history.
-- No table privileges are granted to anon/authenticated; writes go only
-- through SECURITY DEFINER RPCs protected by the shared bridge secret.

create extension if not exists pgcrypto with schema extensions;

create table if not exists integration.agent_bridge_settings (
  singleton boolean primary key default true check (singleton),
  secret_hash bytea not null,
  rotated_at timestamptz not null default now()
);

create table if not exists integration.agent_handoffs (
  request_id text primary key,
  repository text not null,
  thread_number bigint not null,
  source_comment_id bigint not null,
  source_comment_url text,
  base_sha text not null check (base_sha ~ '^[0-9a-f]{40}$'),
  actor text not null,
  request_text text not null,
  status text not null check (status in (
    'CREATED','DISPATCHED','RECEIVED','PROCESSING','COMPLETED',
    'PUBLISHED','ACKNOWLEDGED','STALE','FAILED','DEAD_LETTER'
  )),
  attempt integer not null default 0 check (attempt >= 0),
  answer text,
  openai_response_id text,
  github_comment_id bigint,
  github_comment_url text,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  published_at timestamptz,
  acknowledged_at timestamptz
);

create table if not exists integration.agent_handoff_events (
  id bigint generated always as identity primary key,
  request_id text not null references integration.agent_handoffs(request_id) on delete restrict,
  status text not null,
  detail jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

alter table integration.agent_bridge_settings enable row level security;
alter table integration.agent_handoffs enable row level security;
alter table integration.agent_handoff_events enable row level security;

revoke all on integration.agent_bridge_settings from anon, authenticated;
revoke all on integration.agent_handoffs from anon, authenticated;
revoke all on integration.agent_handoff_events from anon, authenticated;

create or replace function integration.agent_bridge_assert_secret(p_bridge_secret text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hash bytea;
begin
  select secret_hash into v_hash
  from integration.agent_bridge_settings
  where singleton = true;

  if v_hash is null
     or extensions.digest(convert_to(coalesce(p_bridge_secret, ''), 'UTF8'), 'sha256') <> v_hash then
    raise exception 'unauthorized' using errcode = '42501';
  end if;
end;
$$;

create or replace function integration.agent_bridge_upsert(
  p_bridge_secret text,
  p_request_id text,
  p_repository text,
  p_thread_number bigint,
  p_source_comment_id bigint,
  p_source_comment_url text,
  p_base_sha text,
  p_actor text,
  p_request_text text,
  p_status text,
  p_attempt integer default 0,
  p_answer text default null,
  p_openai_response_id text default null,
  p_github_comment_id bigint default null,
  p_github_comment_url text default null,
  p_error text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row integration.agent_handoffs;
begin
  perform integration.agent_bridge_assert_secret(p_bridge_secret);

  insert into integration.agent_handoffs (
    request_id, repository, thread_number, source_comment_id, source_comment_url,
    base_sha, actor, request_text, status, attempt, answer, openai_response_id,
    github_comment_id, github_comment_url, last_error,
    completed_at, published_at, acknowledged_at
  ) values (
    p_request_id, p_repository, p_thread_number, p_source_comment_id, p_source_comment_url,
    p_base_sha, p_actor, p_request_text, p_status, greatest(coalesce(p_attempt,0),0),
    p_answer, p_openai_response_id, p_github_comment_id, p_github_comment_url, p_error,
    case when p_status = 'COMPLETED' then now() end,
    case when p_status = 'PUBLISHED' then now() end,
    case when p_status = 'ACKNOWLEDGED' then now() end
  )
  on conflict (request_id) do update set
    status = excluded.status,
    attempt = greatest(integration.agent_handoffs.attempt, excluded.attempt),
    answer = coalesce(excluded.answer, integration.agent_handoffs.answer),
    openai_response_id = coalesce(excluded.openai_response_id, integration.agent_handoffs.openai_response_id),
    github_comment_id = coalesce(excluded.github_comment_id, integration.agent_handoffs.github_comment_id),
    github_comment_url = coalesce(excluded.github_comment_url, integration.agent_handoffs.github_comment_url),
    last_error = excluded.last_error,
    updated_at = now(),
    completed_at = case when excluded.status = 'COMPLETED' then coalesce(integration.agent_handoffs.completed_at, now()) else integration.agent_handoffs.completed_at end,
    published_at = case when excluded.status = 'PUBLISHED' then coalesce(integration.agent_handoffs.published_at, now()) else integration.agent_handoffs.published_at end,
    acknowledged_at = case when excluded.status = 'ACKNOWLEDGED' then coalesce(integration.agent_handoffs.acknowledged_at, now()) else integration.agent_handoffs.acknowledged_at end
  returning * into v_row;

  insert into integration.agent_handoff_events(request_id, status, detail)
  values (
    p_request_id,
    p_status,
    jsonb_strip_nulls(jsonb_build_object(
      'attempt', p_attempt,
      'github_comment_id', p_github_comment_id,
      'github_comment_url', p_github_comment_url,
      'error', p_error
    ))
  );

  return jsonb_build_object(
    'request_id', v_row.request_id,
    'status', v_row.status,
    'base_sha', v_row.base_sha,
    'attempt', v_row.attempt,
    'answer', v_row.answer,
    'openai_response_id', v_row.openai_response_id,
    'github_comment_id', v_row.github_comment_id,
    'github_comment_url', v_row.github_comment_url
  );
end;
$$;

create or replace function integration.agent_bridge_get(
  p_bridge_secret text,
  p_request_id text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row integration.agent_handoffs;
begin
  perform integration.agent_bridge_assert_secret(p_bridge_secret);
  select * into v_row from integration.agent_handoffs where request_id = p_request_id;
  if not found then return null; end if;
  return jsonb_build_object(
    'request_id', v_row.request_id,
    'status', v_row.status,
    'base_sha', v_row.base_sha,
    'attempt', v_row.attempt,
    'answer', v_row.answer,
    'openai_response_id', v_row.openai_response_id,
    'github_comment_id', v_row.github_comment_id,
    'github_comment_url', v_row.github_comment_url
  );
end;
$$;

create or replace function public.agent_bridge_upsert(
  p_bridge_secret text,
  p_request_id text,
  p_repository text,
  p_thread_number bigint,
  p_source_comment_id bigint,
  p_source_comment_url text,
  p_base_sha text,
  p_actor text,
  p_request_text text,
  p_status text,
  p_attempt integer default 0,
  p_answer text default null,
  p_openai_response_id text default null,
  p_github_comment_id bigint default null,
  p_github_comment_url text default null,
  p_error text default null
)
returns jsonb
language sql
security definer
set search_path = ''
as $
  select integration.agent_bridge_upsert(
    p_bridge_secret, p_request_id, p_repository, p_thread_number,
    p_source_comment_id, p_source_comment_url, p_base_sha, p_actor,
    p_request_text, p_status, p_attempt, p_answer, p_openai_response_id,
    p_github_comment_id, p_github_comment_url, p_error
  );
$;

create or replace function public.agent_bridge_get(
  p_bridge_secret text,
  p_request_id text
)
returns jsonb
language sql
security definer
set search_path = ''
as $
  select integration.agent_bridge_get(p_bridge_secret, p_request_id);
$;

grant execute on function public.agent_bridge_upsert(text,text,text,bigint,bigint,text,text,text,text,text,integer,text,text,bigint,text,text) to anon;
grant execute on function public.agent_bridge_get(text,text) to anon;
revoke all on function integration.agent_bridge_upsert(text,text,text,bigint,bigint,text,text,text,text,text,integer,text,text,bigint,text,text) from public;
revoke all on function integration.agent_bridge_get(text,text) from public;
revoke all on function integration.agent_bridge_assert_secret(text) from public;

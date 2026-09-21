-- ============================================================
-- 0004 — Agentes: papéis, perfis, execuções
-- ============================================================

create table agents.agent_roles (
  id                  text primary key,            -- R1..R9
  name                text not null,
  title               text not null,
  description         text not null,
  write_policy        write_policy not null,
  independent_review  boolean not null default false,
  default_skills      text[] not null default '{}',
  allowed_runtimes    runtime_kind[] not null default '{}',
  minimum_output      text not null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz
);

create table agents.agent_profiles (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references factory.organizations(id) on delete cascade,
  role_id             text not null references agents.agent_roles(id),
  display_name        text not null,
  avatar_letter       text,
  runtime_preference  runtime_kind[] not null default '{}',
  temperature         numeric(3,2),
  max_tokens          integer,
  permission_profile  text not null,
  enabled             boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz,
  unique (organization_id, role_id)
);

create table agents.runtime_profiles (
  id       uuid primary key default gen_random_uuid(),
  runtime  runtime_kind not null,
  surface  text not null,
  config   jsonb not null default '{}'::jsonb,
  enabled  boolean not null default false,
  unique (runtime, surface)
);

-- ★ Espelha models.yaml. Nenhum nome de modelo em código de aplicação.
create table agents.model_profiles (
  id         uuid primary key default gen_random_uuid(),
  runtime    runtime_kind not null,
  model_key  text not null,
  notes      text,
  enabled    boolean not null default false,
  unique (runtime, model_key)
);

create table agents.intelligence_versions (
  id                    uuid primary key default gen_random_uuid(),
  constitution_sha      char(64) not null,
  registry_sha          char(64) not null,
  skills_manifest_sha   char(64) not null,
  git_sha               char(40) not null,
  created_at            timestamptz not null default now(),
  unique (git_sha)
);

create table agents.skill_versions (
  id           uuid primary key default gen_random_uuid(),
  skill_name   text not null,
  version      text not null,
  content_sha  char(64) not null,
  git_sha      char(40) not null,
  created_at   timestamptz not null default now(),
  unique (skill_name, version)
);

-- ---------- Execuções ----------
create table agents.runs (
  id                        uuid primary key default gen_random_uuid(),
  organization_id           uuid not null references factory.organizations(id) on delete cascade,
  app_id                    uuid references factory.apps(id) on delete cascade,
  mission_id                uuid references factory.missions(id) on delete cascade,
  stage_id                  uuid references factory.stages(id) on delete cascade,
  task_id                   uuid not null references workflow.tasks(id) on delete cascade,
  parent_run_id             uuid references agents.runs(id),
  role_id                   text not null references agents.agent_roles(id),
  runtime                   runtime_kind not null,
  model_key                 text,
  intelligence_version_id   uuid references agents.intelligence_versions(id),
  skill_versions            text[] not null default '{}',
  task_packet_id            uuid references workflow.task_packets(id),
  state                     run_state not null default 'pending',
  base_sha                  char(40) not null,
  branch                    text,
  workspace_id              text,
  provider_session_id       text,
  started_at                timestamptz,
  finished_at               timestamptz,
  input_tokens              integer,
  cached_input_tokens       integer,
  output_tokens             integer,
  session_hours             numeric(10,4),
  cost_usd                  numeric(12,6),
  wall_ms                   integer,
  correlation_id            text not null,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz
);

create index on agents.runs (organization_id, state, started_at desc);
create index on agents.runs (task_id);
create index on agents.runs (role_id, runtime, started_at desc);
create index on agents.runs (correlation_id);

create table agents.run_events (
  id           uuid primary key default gen_random_uuid(),
  run_id       uuid not null references agents.runs(id) on delete cascade,
  sequence     bigint not null,
  event_type   text not null,
  summary      text,
  payload      jsonb,
  occurred_at  timestamptz not null,
  unique (run_id, sequence)
);

create index on agents.run_events (run_id, sequence);

create table agents.tool_events (
  id                  uuid primary key default gen_random_uuid(),
  run_id              uuid not null references agents.runs(id) on delete cascade,
  tool_name           text not null,
  decision            policy_decision not null,
  arguments_redacted  jsonb,
  outcome             text,
  duration_ms         integer,
  occurred_at         timestamptz not null
);

create index on agents.tool_events (run_id, occurred_at);

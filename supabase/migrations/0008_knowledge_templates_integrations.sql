-- ============================================================
-- 0008 — Conhecimento, templates, integrações, fluxos, finanças
-- ============================================================

create table factory.knowledge_categories (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references factory.organizations(id) on delete cascade,
  name             text not null,
  slug             text not null,
  description      text,
  icon             text,
  item_count       integer not null default 0,
  created_at       timestamptz not null default now(),
  unique (organization_id, slug)
);

create table factory.knowledge_items (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references factory.organizations(id) on delete cascade,
  title             text not null,
  kind              knowledge_kind not null,
  category_id       uuid references factory.knowledge_categories(id) on delete set null,
  content_md        text,
  external_url      text,
  author_id         uuid references factory.users(id),
  reading_minutes   smallint,
  views             integer not null default 0,
  likes             integer not null default 0,
  published_at      timestamptz,
  archived_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz
);

create index on factory.knowledge_items (organization_id, kind, published_at desc);
create index on factory.knowledge_items
  using gin (to_tsvector('portuguese', title || ' ' || coalesce(content_md,'')));

create table factory.knowledge_likes (
  knowledge_item_id  uuid not null references factory.knowledge_items(id) on delete cascade,
  user_id            uuid not null references factory.users(id) on delete cascade,
  created_at         timestamptz not null default now(),
  primary key (knowledge_item_id, user_id)
);

-- ---------- Templates (Golden Repository Templates) ----------
create table factory.templates (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid references factory.organizations(id) on delete cascade,
  is_public        boolean not null default false,
  name             text not null,
  slug             text not null,
  description      text,
  category         text not null,
  tags             text[] not null default '{}',
  technologies     text[] not null default '{}',
  repository_url   text,                      -- sem isto, é apenas rascunho
  preview_url      text,
  thumbnail_url    text,
  downloads        integer not null default 0,
  likes            integer not null default 0,
  rating           numeric(2,1),
  features         jsonb not null default '[]'::jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz
);

create index on factory.templates (category, downloads desc);

-- ---------- Integrações ----------
-- ★ config NUNCA contém segredo. Apenas metadados.
create table factory.integrations (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references factory.organizations(id) on delete cascade,
  provider         text not null,
  category         text not null,
  status           integration_status not null default 'disconnected',
  config           jsonb not null default '{}'::jsonb,
  secret_ref_id    uuid references governance.secret_refs(id),
  connected_by     uuid references factory.users(id),
  connected_at     timestamptz,
  last_error       text,
  last_checked_at  timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz,
  unique (organization_id, provider)
);

-- ★ Guarda apenas prefixo e hash. Nunca a chave.
create table factory.api_keys (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references factory.organizations(id) on delete cascade,
  name             text not null,
  key_prefix       text not null,
  key_hash         text not null,
  scopes           text[] not null default '{}',
  last_used_at     timestamptz,
  revoked_at       timestamptz,
  created_by       uuid references factory.users(id),
  created_at       timestamptz not null default now()
);

-- ---------- Fluxos de orquestração ----------
create table factory.flows (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references factory.organizations(id) on delete cascade,
  name             text not null,
  description      text,
  status           flow_status not null default 'draft',
  definition       jsonb not null,
  definition_sha   char(64) not null,
  version          integer not null default 1,
  created_by       uuid references factory.users(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz
);

create table factory.flow_versions (
  id              uuid primary key default gen_random_uuid(),
  flow_id         uuid not null references factory.flows(id) on delete cascade,
  version         integer not null,
  definition      jsonb not null,
  definition_sha  char(64) not null,
  created_at      timestamptz not null default now(),
  unique (flow_id, version)
);

create table factory.flow_runs (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references factory.organizations(id) on delete cascade,
  flow_id          uuid not null references factory.flows(id) on delete cascade,
  flow_version     integer not null,
  state            run_state not null default 'pending',
  input            jsonb,
  output           jsonb,
  started_at       timestamptz,
  finished_at      timestamptz,
  duration_ms      integer,
  error            jsonb,
  created_at       timestamptz not null default now()
);

create index on factory.flow_runs (flow_id, started_at desc);

create table factory.flow_run_steps (
  id            uuid primary key default gen_random_uuid(),
  flow_run_id   uuid not null references factory.flow_runs(id) on delete cascade,
  node_id       text not null,
  role_id       text references agents.agent_roles(id),
  run_id        uuid references agents.runs(id),
  state         run_state not null default 'pending',
  started_at    timestamptz,
  finished_at   timestamptz
);

-- ---------- Finanças ----------
create table factory.usage_records (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null references factory.organizations(id) on delete cascade,
  app_id                uuid references factory.apps(id) on delete cascade,
  mission_id            uuid references factory.missions(id) on delete cascade,
  task_id               uuid references workflow.tasks(id) on delete cascade,
  run_id                uuid references agents.runs(id) on delete cascade,
  provider              text not null,
  model_key             text,
  input_tokens          integer,
  cached_input_tokens   integer,
  output_tokens         integer,
  session_hours         numeric(10,4),
  cost_usd              numeric(12,6),
  occurred_at           timestamptz not null
);

create index on factory.usage_records (organization_id, occurred_at desc);
create index on factory.usage_records (app_id, occurred_at desc);

create table factory.budgets (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references factory.organizations(id) on delete cascade,
  scope             budget_scope not null,
  scope_id          uuid,
  period            text,
  max_cost_usd      numeric(12,2),
  max_tokens        bigint,
  max_wall_seconds  integer,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz
);

create table factory.budget_alerts (
  id                 uuid primary key default gen_random_uuid(),
  budget_id          uuid not null references factory.budgets(id) on delete cascade,
  threshold_percent  smallint not null,
  triggered_at       timestamptz not null default now(),
  acknowledged_by    uuid references factory.users(id),
  acknowledged_at    timestamptz
);

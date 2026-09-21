-- ============================================================
-- 0007 — Integração: GitHub, Supabase, Vercel
-- ============================================================

create table integration.repositories (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references factory.organizations(id) on delete cascade,
  app_id           uuid references factory.apps(id) on delete cascade,
  provider         text not null default 'github',
  owner            text not null,
  name             text not null,
  default_branch   text not null default 'main',
  installation_id  bigint,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz,
  unique (provider, owner, name)
);

create table integration.pull_requests (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references factory.organizations(id) on delete cascade,
  repository_id    uuid not null references integration.repositories(id) on delete cascade,
  number           integer not null,
  kind             pr_kind not null,
  task_id          uuid references workflow.tasks(id) on delete set null,
  stage_id         uuid references factory.stages(id) on delete set null,
  title            text,
  head_sha         char(40),
  base_sha         char(40),
  state            pr_state not null default 'open',
  merged_at        timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz,
  unique (repository_id, number)
);

create table integration.ci_checks (
  id                 uuid primary key default gen_random_uuid(),
  pull_request_id    uuid not null references integration.pull_requests(id) on delete cascade,
  name               text not null,
  status             check_status not null,
  details_url        text,
  started_at         timestamptz,
  completed_at       timestamptz
);

create index on integration.ci_checks (pull_request_id, status);

create table integration.supabase_projects (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references factory.organizations(id) on delete cascade,
  app_id           uuid references factory.apps(id) on delete cascade,
  project_ref      text not null unique,
  region           text,
  kind             text not null,          -- factory | generated
  created_at       timestamptz not null default now()
);

create table integration.vercel_projects (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references factory.organizations(id) on delete cascade,
  app_id              uuid references factory.apps(id) on delete cascade,
  vercel_project_id   text not null unique,
  production_domain   text,
  created_at          timestamptz not null default now()
);

-- ★ A barreira de prontidão do preview pair.
-- pair_ready só é true quando AMBOS os ambientes confirmaram.
-- Declarar pronto com um único evento produz E2E falso-negativo.
create table integration.preview_environments (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null references factory.organizations(id) on delete cascade,
  pull_request_id       uuid not null references integration.pull_requests(id) on delete cascade,
  supabase_branch_id    text,
  supabase_ready        boolean not null default false,
  vercel_deployment_id  text,
  vercel_ready          boolean not null default false,
  preview_url           text,
  pair_ready            boolean not null default false,
  timed_out_at          timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz,
  constraint pair_ready_requires_both
    check (pair_ready = false or (supabase_ready and vercel_ready))
);

create index on integration.preview_environments (pull_request_id);

create table integration.deployments (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references factory.organizations(id) on delete cascade,
  app_id           uuid not null references factory.apps(id) on delete cascade,
  environment      environment_kind not null,
  provider         text not null default 'vercel',
  external_id      text not null,
  commit_sha       char(40),
  state            deployment_state not null,
  url              text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz
);

create table integration.deployment_checks (
  id             uuid primary key default gen_random_uuid(),
  deployment_id  uuid not null references integration.deployments(id) on delete cascade,
  name           text not null,
  status         check_status not null,
  blocking       boolean not null default true,
  completed_at   timestamptz
);

create table integration.release_decisions (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references factory.organizations(id) on delete cascade,
  deployment_id    uuid not null references integration.deployments(id) on delete cascade,
  decision         release_decision not null,
  approval_id      uuid references governance.approvals(id),
  rolling_percent  smallint,
  decided_at       timestamptz not null default now(),
  constraint rolling_percent_range
    check (rolling_percent is null or rolling_percent between 0 and 100)
);

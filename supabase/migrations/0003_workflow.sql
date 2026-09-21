-- ============================================================
-- 0003 — Workflow: tarefas, jobs, leases, eventos
-- ============================================================

create table workflow.tasks (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references factory.organizations(id) on delete cascade,
  app_id            uuid not null references factory.apps(id) on delete cascade,
  mission_id        uuid references factory.missions(id) on delete cascade,
  stage_id          uuid references factory.stages(id) on delete cascade,
  title             text not null,
  description       text,
  kind              task_kind not null,
  state             task_state not null default 'created',
  role_id           text,
  priority          smallint not null default 50,
  labels            text[] not null default '{}',
  assignee_kind     actor_kind,
  base_sha          char(40),
  branch            text,
  pr_number         integer,
  progress_percent  smallint not null default 0,
  due_date          date,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz,
  constraint tasks_progress_range check (progress_percent between 0 and 100)
);

create index on workflow.tasks (organization_id, state, priority desc);
create index on workflow.tasks (mission_id, stage_id);
create index on workflow.tasks (app_id, state);

create table workflow.task_dependencies (
  task_id             uuid not null references workflow.tasks(id) on delete cascade,
  depends_on_task_id  uuid not null references workflow.tasks(id) on delete cascade,
  primary key (task_id, depends_on_task_id),
  constraint no_self_dependency check (task_id <> depends_on_task_id)
);

create table workflow.task_packets (
  id           uuid primary key default gen_random_uuid(),
  task_id      uuid not null references workflow.tasks(id) on delete cascade,
  version      integer not null,
  payload      jsonb not null,          -- valida contra task-packet.schema.json
  payload_sha  char(64) not null,
  created_at   timestamptz not null default now(),
  unique (task_id, version)
);

-- ---------- Jobs com lease ----------
-- Um job NÃO tem apenas status = running. Tem dono temporário.
create table workflow.jobs (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null references factory.organizations(id) on delete cascade,
  kind               text not null,
  state              job_state not null default 'queued',
  payload            jsonb not null,
  lease_owner        text,
  lease_acquired_at  timestamptz,
  lease_expires_at   timestamptz,
  attempt            integer not null default 0,
  max_attempts       integer not null default 3,
  next_attempt_at    timestamptz,
  idempotency_key    text not null,
  last_error         jsonb,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz,
  constraint jobs_idempotency_unique unique (idempotency_key)
);

create index on workflow.jobs (state, next_attempt_at) where state in ('queued','failed');
create index on workflow.jobs (lease_expires_at) where state = 'leased';

create table workflow.job_attempts (
  id           uuid primary key default gen_random_uuid(),
  job_id       uuid not null references workflow.jobs(id) on delete cascade,
  attempt      integer not null,
  started_at   timestamptz not null default now(),
  finished_at  timestamptz,
  outcome      text,
  error        jsonb
);

create table workflow.dead_letters (
  id           uuid primary key default gen_random_uuid(),
  job_id       uuid references workflow.jobs(id),
  kind         text not null,
  payload      jsonb not null,
  error        jsonb not null,
  created_at   timestamptz not null default now(),
  resolved_at  timestamptz,
  resolved_by  uuid references factory.users(id)
);

-- ---------- Eventos ----------
create table workflow.webhook_events (
  id                 uuid primary key default gen_random_uuid(),
  source             text not null,
  delivery_id        text,
  event_type         text not null,
  signature_valid    boolean not null,
  raw_payload        jsonb not null,
  normalized_payload jsonb,
  idempotency_key    text not null,
  received_at        timestamptz not null default now(),
  processed_at       timestamptz,
  processing_error   jsonb,
  constraint webhooks_idempotency_unique unique (idempotency_key)
);

create index on workflow.webhook_events (source, received_at desc);

create table workflow.domain_events (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references factory.organizations(id) on delete cascade,
  event_type       text not null,
  aggregate_type   text not null,
  aggregate_id     uuid not null,
  sequence         bigint not null,
  producer         text not null,
  payload          jsonb not null,
  correlation_id   text,
  base_sha         char(40),
  idempotency_key  text not null,
  occurred_at      timestamptz not null,
  constraint events_idempotency_unique unique (idempotency_key)
);

create index on workflow.domain_events (aggregate_type, aggregate_id, sequence);
create index on workflow.domain_events (organization_id, occurred_at desc);
create index on workflow.domain_events (correlation_id);

create table workflow.leases (
  id             uuid primary key default gen_random_uuid(),
  resource_type  text not null,
  resource_id    uuid not null,
  owner          text not null,
  acquired_at    timestamptz not null default now(),
  expires_at     timestamptz not null,
  unique (resource_type, resource_id)
);

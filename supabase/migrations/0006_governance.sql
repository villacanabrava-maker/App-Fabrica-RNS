-- ============================================================
-- 0006 — Governança: aprovações, políticas, auditoria, evidências
--
-- ★ Este arquivo contém a invariante central da Fábrica Apps RNS:
--   um agente NÃO consegue gravar uma aprovação.
--   Isso é constraint de banco, não convenção de código.
-- ============================================================

create table governance.approvals (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references factory.organizations(id) on delete cascade,
  subject_type     approval_subject not null,
  subject_id       uuid not null,
  subject_sha      char(40) not null,
  decision         approval_decision not null,
  actor_type       actor_kind not null,
  actor_id         uuid not null references factory.users(id),
  rationale        text,
  decided_at       timestamptz not null default now(),
  created_at       timestamptz not null default now(),

  -- ★★★ A GARANTIA CENTRAL DO SISTEMA ★★★
  -- Nenhum modelo aprova a própria mudança. Nenhum modelo aprova nada.
  -- Um bug no Orchestrator não consegue violar isto.
  constraint approvals_must_be_human check (actor_type = 'human'),

  -- Rejeitar exige justificativa.
  constraint rejection_requires_rationale
    check (decision <> 'rejected' or (rationale is not null and length(rationale) >= 10))
);

create index on governance.approvals (organization_id, decided_at desc);
create index on governance.approvals (subject_type, subject_id);

create table governance.human_gates (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references factory.organizations(id) on delete cascade,
  subject_type     approval_subject not null,
  subject_id       uuid not null,
  subject_sha      char(40) not null,
  reason           text not null,
  state            gate_state not null default 'pending',
  opened_at        timestamptz not null default now(),
  expires_at       timestamptz,
  resolved_at      timestamptz,
  approval_id      uuid references governance.approvals(id)
);

create index on governance.human_gates (organization_id, state, opened_at);

create table governance.policy_decisions (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references factory.organizations(id) on delete cascade,
  run_id            uuid references agents.runs(id) on delete cascade,
  actor_type        actor_kind not null,
  actor_id          text not null,
  requested_action  text not null,
  decision          policy_decision not null,
  policy_ref        text not null,
  rationale         text,
  decided_at        timestamptz not null default now()
);

create index on governance.policy_decisions (run_id, decided_at);
create index on governance.policy_decisions (organization_id, decision, decided_at desc);

-- ---------- Ledger de auditoria: append-only ----------
create table governance.audit_events (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references factory.organizations(id) on delete cascade,
  occurred_at      timestamptz not null default now(),
  actor_type       actor_kind not null,
  actor_id         text not null,
  action           text not null,
  resource_type    text not null,
  resource_id      uuid,
  mission_id       uuid,
  base_sha         char(40),
  decision         text,
  evidence_ids     uuid[] not null default '{}',
  correlation_id   text,
  metadata         jsonb not null default '{}'::jsonb
);

create index on governance.audit_events (organization_id, occurred_at desc);
create index on governance.audit_events (correlation_id);
create index on governance.audit_events (resource_type, resource_id);

-- ---------- Referências de segredo ----------
-- NUNCA armazena o segredo. Aponta para onde ele é administrado.
create table governance.secret_refs (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references factory.organizations(id) on delete cascade,
  name             text not null,
  provider         text not null,
  manager          text not null,
  external_ref     text not null,
  rotated_at       timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz,
  unique (organization_id, name)
);

-- ---------- Artefatos e evidências ----------
create table factory.artifacts (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references factory.organizations(id) on delete cascade,
  run_id           uuid references agents.runs(id) on delete cascade,
  task_id          uuid references workflow.tasks(id) on delete cascade,
  type             artifact_type not null,
  uri              text not null,
  sha256           char(64) not null,
  size_bytes       bigint,
  mime_type        text,
  created_at       timestamptz not null default now()
);

create index on factory.artifacts (run_id);

create table factory.evidence_items (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references factory.organizations(id) on delete cascade,
  type             evidence_type not null,
  source           text not null,
  observed_at      timestamptz not null,
  collector        text not null,
  commit_sha       char(40),
  artifact_sha256  char(64),
  integrity        evidence_integrity not null,
  summary          text,
  created_at       timestamptz not null default now()
);

create index on factory.evidence_items (organization_id, observed_at desc);

create table review.finding_evidence (
  finding_id   uuid not null references review.findings(id) on delete cascade,
  evidence_id  uuid not null references factory.evidence_items(id) on delete cascade,
  primary key (finding_id, evidence_id)
);

create table factory.test_results (
  id                   uuid primary key default gen_random_uuid(),
  organization_id      uuid not null references factory.organizations(id) on delete cascade,
  run_id               uuid references agents.runs(id) on delete cascade,
  suite                text not null,
  passed               integer not null,
  failed               integer not null,
  skipped              integer not null default 0,
  duration_ms          integer,
  report_artifact_id   uuid references factory.artifacts(id),
  created_at           timestamptz not null default now()
);

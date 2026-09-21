-- ============================================================
-- 0005 — Revisão dupla: ciclos, passagens, findings, divergências
-- ============================================================

create table review.review_cycles (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references factory.organizations(id) on delete cascade,
  subject_type        review_subject not null,
  subject_id          uuid not null,
  subject_sha         char(40) not null,
  current_round       smallint not null default 0,
  status              cycle_status not null default 'open',
  final_verdict       review_verdict,
  human_decision      human_decision,
  started_at          timestamptz not null default now(),
  closed_at           timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz,
  -- ★ O ciclo tem exatamente quatro passagens. round > 4 é DENIED.
  constraint cycle_round_limit check (current_round between 0 and 4)
);

create index on review.review_cycles (subject_type, subject_id, subject_sha);
create index on review.review_cycles (organization_id, status);

create table review.review_rounds (
  id                      uuid primary key default gen_random_uuid(),
  review_cycle_id         uuid not null references review.review_cycles(id) on delete cascade,
  round_number            smallint not null,
  runtime                 runtime_kind not null,
  role_id                 text not null references agents.agent_roles(id),
  model_key               text,
  run_id                  uuid references agents.runs(id),
  input_sha               char(64) not null,
  output_sha              char(64),
  verdict                 review_verdict,
  prior_round_id          uuid references review.review_rounds(id),
  comments_on_prior_work  boolean not null default false,
  summary                 text,
  cost_usd                numeric(12,6),
  started_at              timestamptz,
  completed_at            timestamptz,
  unique (review_cycle_id, round_number),
  constraint round_number_limit check (round_number between 1 and 4),
  -- ★ Meta-revisão obrigatória nas rodadas 2, 3 e 4.
  constraint meta_review_required
    check (round_number = 1 or comments_on_prior_work = true),
  -- ★ READY_FOR_HUMAN_APPROVAL só na rodada conclusiva.
  constraint ready_only_on_final_round
    check (verdict is distinct from 'READY_FOR_HUMAN_APPROVAL' or round_number = 4)
);

create table review.findings (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references factory.organizations(id) on delete cascade,
  review_cycle_id     uuid references review.review_cycles(id) on delete cascade,
  review_round_id     uuid references review.review_rounds(id) on delete cascade,
  category            finding_category not null,
  severity            finding_severity not null,
  claim               text not null,
  recommendation      text,
  location            text,
  status              finding_status not null default 'open',
  blocks_progress     boolean not null default false,
  introduced_by       runtime_kind,
  introduced_round    smallint,
  resolved_by         uuid references factory.users(id),
  disposition_reason  text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz,
  -- Rejeitar ou adiar exige justificativa.
  constraint disposition_requires_reason
    check (status not in ('rejected','deferred')
           or (disposition_reason is not null and length(disposition_reason) >= 10))
);

create index on review.findings (review_cycle_id, severity, status);
create index on review.findings (organization_id, status) where blocks_progress;

create table review.disagreements (
  id                   uuid primary key default gen_random_uuid(),
  organization_id      uuid not null references factory.organizations(id) on delete cascade,
  review_cycle_id      uuid not null references review.review_cycles(id) on delete cascade,
  finding_id           uuid references review.findings(id) on delete cascade,
  type                 disagreement_type not null,
  openai_position      text not null,
  anthropic_position   text not null,
  materiality          materiality not null,
  resolution           disagreement_resolution,
  human_required       boolean not null default false,
  resolved_by          uuid references factory.users(id),
  resolved_at          timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz
);

create index on review.disagreements (review_cycle_id) where resolution is null;

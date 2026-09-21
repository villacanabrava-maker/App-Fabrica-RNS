# Modelo de Dados — Factory Supabase

Este documento define **todas as tabelas** do banco operacional da fábrica, agrupadas por schema. É a referência para escrever as migrations em `supabase/migrations/`.

---

## 1. Convenções obrigatórias

| Regra | Detalhe |
|---|---|
| Identificadores | `uuid` gerado no banco (`gen_random_uuid()`), exceto onde indicado |
| Multi-tenant | **Toda** tabela de domínio tem `organization_id uuid not null` |
| Timestamps | `created_at timestamptz not null default now()`, `updated_at timestamptz` |
| Soft delete | Apenas onde indicado, via `archived_at timestamptz` |
| Enums | Tipos Postgres nomeados, não `text` livre |
| Nomes | `snake_case`, tabelas no plural, colunas no singular |
| RLS | **Habilitada em toda tabela exposta**, com policy de leitura por membership |
| Ledger | Tabelas de auditoria e evidência são append-only |
| SHA | `char(40)` para git sha; `char(64)` para sha256 |

---

## 2. Schema `factory` — identidade e produto

### `organizations`
```
id uuid pk
name text not null
slug text not null unique
description text
logo_url text
timezone text not null default 'America/Sao_Paulo'
locale text not null default 'pt-BR'
settings jsonb not null default '{}'
created_at, updated_at
```

### `users`
Espelha `auth.users` com dados de perfil.
```
id uuid pk (= auth.users.id)
email text not null unique
full_name text
avatar_url text
default_organization_id uuid fk organizations
created_at, updated_at
```

### `memberships`
```
id uuid pk
organization_id uuid fk not null
user_id uuid fk not null
role membership_role not null        -- owner|admin|engineer|viewer
invited_by uuid fk users
accepted_at timestamptz
created_at, updated_at
unique (organization_id, user_id)
```

### `apps`  *(na UI: "Projetos")*
```
id uuid pk
organization_id uuid fk not null
name text not null
slug text not null
description text
icon text
color text
status app_status not null            -- planning|in_progress|in_review|paused|completed|archived
progress_percent smallint not null default 0 check (0..100)
started_at date
target_date date
tags text[] not null default '{}'
created_by uuid fk users
archived_at timestamptz
created_at, updated_at
unique (organization_id, slug)
```

### `app_specs`
```
id uuid pk
organization_id uuid fk not null
app_id uuid fk not null
version integer not null
content_md text not null
content_sha char(64) not null
status spec_status not null           -- draft|under_review|approved|superseded
approved_by uuid fk users
approved_at timestamptz
created_at
unique (app_id, version)
```

### `app_environments`
```
id uuid pk
app_id uuid fk not null
kind environment_kind not null        -- preview|staging|production
url text
supabase_project_ref text
vercel_project_id text
created_at, updated_at
```

---

## 3. Schema `factory` — planejamento

### `missions`
```
id uuid pk
organization_id uuid fk not null
app_id uuid fk not null
title text not null
objective text not null
status mission_status not null        -- draft|planning|under_review|approved|executing|completed|blocked|cancelled
current_version integer not null default 1
created_by uuid fk users
created_at, updated_at
```

### `mission_versions`
```
id uuid pk
mission_id uuid fk not null
version integer not null
plan_md text not null
plan_sha char(64) not null
git_sha char(40)                      -- commit do Plan PR
status version_status not null        -- draft|in_review|approved|rejected|superseded
created_at
unique (mission_id, version)
```

### `stages`
```
id uuid pk
organization_id uuid fk not null
mission_id uuid fk not null
sequence integer not null
title text not null
description text
status stage_status not null
acceptance_criteria jsonb not null default '[]'
approved_by uuid fk users
approved_at timestamptz
created_at, updated_at
unique (mission_id, sequence)
```

---

## 4. Schema `workflow` — trabalho

### `tasks`
```
id uuid pk
organization_id uuid fk not null
app_id uuid fk not null
mission_id uuid fk
stage_id uuid fk
title text not null
description text
kind task_kind not null               -- plan|implement|review|test|security|browser|release|research
state task_state not null             -- ver máquina de estados
role_id text                          -- R1..R9
priority smallint not null default 50
labels text[] not null default '{}'
assignee_kind actor_kind              -- agent|human
base_sha char(40)
branch text
pr_number integer
progress_percent smallint default 0
due_date date
created_at, updated_at
```

### `task_dependencies`
```
task_id uuid fk not null
depends_on_task_id uuid fk not null
primary key (task_id, depends_on_task_id)
check (task_id <> depends_on_task_id)
```
> Ciclos são rejeitados por validação na camada de aplicação **e** por trigger de verificação.

### `task_packets`
```
id uuid pk
task_id uuid fk not null
version integer not null
payload jsonb not null                -- valida contra task-packet.schema.json
payload_sha char(64) not null
created_at
unique (task_id, version)
```

### `jobs`
```
id uuid pk
organization_id uuid fk not null
kind text not null
state job_state not null              -- queued|leased|running|succeeded|failed|dead
payload jsonb not null
lease_owner text
lease_acquired_at timestamptz
lease_expires_at timestamptz
attempt integer not null default 0
max_attempts integer not null
next_attempt_at timestamptz
idempotency_key text not null unique
last_error jsonb
created_at, updated_at
```

### `job_attempts`
```
id uuid pk
job_id uuid fk not null
attempt integer not null
started_at, finished_at
outcome text
error jsonb
```

### `dead_letters`
```
id uuid pk
job_id uuid fk
kind text not null
payload jsonb not null
error jsonb not null
created_at
resolved_at timestamptz
resolved_by uuid fk users
```

### `webhook_events`
```
id uuid pk
source text not null                  -- github|vercel|supabase|openai|anthropic
delivery_id text
event_type text not null
signature_valid boolean not null
raw_payload jsonb not null
normalized_payload jsonb
idempotency_key text not null unique
received_at timestamptz not null default now()
processed_at timestamptz
processing_error jsonb
```

### `domain_events`
```
id uuid pk
organization_id uuid fk not null
event_type text not null
aggregate_type text not null
aggregate_id uuid not null
sequence bigint not null
producer text not null
payload jsonb not null
correlation_id text
base_sha char(40)
idempotency_key text not null unique
occurred_at timestamptz not null
```

---

## 5. Schema `agents` — execução

### `agent_roles`
```
id text pk                            -- R1..R9
name text not null
description text not null
write_policy write_policy not null    -- read_only|workspace_write|test_workspace|preview_only|governance_only
independent_review boolean not null default false
default_skills text[] not null default '{}'
created_at, updated_at
```

### `agent_profiles`
```
id uuid pk
organization_id uuid fk not null
role_id text fk agent_roles not null
display_name text not null
avatar_letter text
runtime_preference runtime_kind[]     -- openai|anthropic|antigravity|mock
temperature numeric(3,2)
max_tokens integer
permission_profile text not null
enabled boolean not null default true
created_at, updated_at
```

### `runtime_profiles`
```
id uuid pk
runtime runtime_kind not null
surface text not null                 -- codex_sdk|agents_api|managed_agents|claude_code|github_action|mock
config jsonb not null default '{}'
enabled boolean not null default true
```

### `model_profiles`
```
id uuid pk
runtime runtime_kind not null
model_key text not null               -- referência lógica, resolvida em models.yaml
notes text
enabled boolean not null default true
unique (runtime, model_key)
```
> **Nenhum nome de modelo é hardcoded em código.** Esta tabela espelha `factory-intelligence/registry/models.yaml`.

### `intelligence_versions`
```
id uuid pk
constitution_sha char(64) not null
registry_sha char(64) not null
skills_manifest_sha char(64) not null
git_sha char(40) not null
created_at
```

### `skill_versions`
```
id uuid pk
skill_name text not null
version text not null
content_sha char(64) not null
git_sha char(40) not null
created_at
unique (skill_name, version)
```

### `runs`
```
id uuid pk
organization_id uuid fk not null
app_id uuid fk
mission_id uuid fk
stage_id uuid fk
task_id uuid fk not null
parent_run_id uuid fk runs
role_id text fk agent_roles not null
runtime runtime_kind not null
model_key text
intelligence_version_id uuid fk
skill_versions text[] not null default '{}'
task_packet_id uuid fk task_packets
state run_state not null
base_sha char(40) not null
branch text
workspace_id text
provider_session_id text
started_at, finished_at
input_tokens integer
cached_input_tokens integer
output_tokens integer
cost_usd numeric(12,6)
wall_ms integer
correlation_id text not null
created_at, updated_at
```

### `run_events`
```
id uuid pk
run_id uuid fk not null
sequence bigint not null
event_type text not null              -- progress|tool_call|artifact|error|state_change
summary text
payload jsonb
occurred_at timestamptz not null
unique (run_id, sequence)
```

### `tool_events`
```
id uuid pk
run_id uuid fk not null
tool_name text not null
decision policy_decision not null     -- allow|ask|deny
arguments_redacted jsonb
outcome text
duration_ms integer
occurred_at timestamptz not null
```

### `leases`
```
id uuid pk
resource_type text not null
resource_id uuid not null
owner text not null
acquired_at timestamptz not null
expires_at timestamptz not null
unique (resource_type, resource_id)
```

---

## 6. Schema `review` — revisão dupla

### `review_cycles`
```
id uuid pk
organization_id uuid fk not null
subject_type review_subject not null   -- mission_version|stage|task|pull_request
subject_id uuid not null
subject_sha char(40) not null
current_round smallint not null default 0 check (0..4)
status cycle_status not null           -- open|awaiting_human|closed|superseded|blocked
final_verdict review_verdict
human_decision human_decision
started_at timestamptz not null default now()
closed_at timestamptz
created_at, updated_at
```

### `review_rounds`
```
id uuid pk
review_cycle_id uuid fk not null
round_number smallint not null check (1..4)
runtime runtime_kind not null
role_id text fk agent_roles not null
model_key text
run_id uuid fk runs
input_sha char(64) not null
output_sha char(64)
verdict review_verdict
prior_round_id uuid fk review_rounds
comments_on_prior_work boolean not null default false
summary text
cost_usd numeric(12,6)
started_at, completed_at
unique (review_cycle_id, round_number)
```

### `findings`
```
id uuid pk
organization_id uuid fk not null
review_cycle_id uuid fk
review_round_id uuid fk
category finding_category not null     -- architecture|correctness|security|data|testing|performance|ux|operations|research|requirement
severity finding_severity not null     -- info|low|medium|high|critical
claim text not null
recommendation text
location text
status finding_status not null         -- open|accepted|rejected|resolved|deferred
blocks_progress boolean not null
introduced_by runtime_kind
introduced_round smallint
resolved_by uuid fk users
disposition_reason text
created_at, updated_at
```

### `disagreements`
```
id uuid pk
organization_id uuid fk not null
review_cycle_id uuid fk not null
finding_id uuid fk findings
type disagreement_type not null        -- factual|architectural|security|requirement|implementation|preference
openai_position text not null
anthropic_position text not null
materiality materiality not null       -- low|medium|high|critical
resolution disagreement_resolution     -- resolved|accepted_openai|accepted_claude|combined|deferred|human_decision_required
human_required boolean not null default false
resolved_by uuid fk users
resolved_at timestamptz
created_at, updated_at
```

### `finding_evidence`
```
finding_id uuid fk not null
evidence_id uuid fk not null
primary key (finding_id, evidence_id)
```

---

## 7. Schema `factory` — evidência e artefatos

### `artifacts`
```
id uuid pk
organization_id uuid fk not null
run_id uuid fk
task_id uuid fk
type artifact_type not null            -- plan|patch|review|report|screenshot|log|test_result|diff
uri text not null                      -- Storage ou referência externa
sha256 char(64) not null
size_bytes bigint
mime_type text
created_at
```

### `evidence_items`
```
id uuid pk
organization_id uuid fk not null
type evidence_type not null            -- code|test|ci|runtime|browser|database|external_source|human
source text not null
observed_at timestamptz not null
collector text not null
commit_sha char(40)
artifact_sha256 char(64)
integrity evidence_integrity not null  -- verified|reported|inferred|pending
created_at
```
> Append-only.

### `test_results`
```
id uuid pk
organization_id uuid fk not null
run_id uuid fk
pull_request_id uuid fk
suite text not null
passed integer not null
failed integer not null
skipped integer not null
duration_ms integer
report_artifact_id uuid fk artifacts
created_at
```

---

## 8. Schema `governance`

### `approvals`
```
id uuid pk
organization_id uuid fk not null
subject_type approval_subject not null  -- mission_version|stage|task|release|spec
subject_id uuid not null
subject_sha char(40) not null
decision approval_decision not null     -- approved|rejected|revision_requested
actor_type actor_kind not null
actor_id uuid fk users not null
rationale text
decided_at timestamptz not null default now()
created_at
```
**Invariante de banco obrigatória:**
```sql
check (actor_type = 'human')
```
Um agente **não consegue** gravar uma aprovação. Isso é constraint, não convenção.

### `human_gates`
```
id uuid pk
organization_id uuid fk not null
subject_type approval_subject not null
subject_id uuid not null
subject_sha char(40) not null
reason text not null
opened_at timestamptz not null default now()
resolved_at timestamptz
approval_id uuid fk approvals
state gate_state not null               -- pending|resolved|expired|cancelled
```

### `policy_decisions`
```
id uuid pk
organization_id uuid fk not null
run_id uuid fk
actor_type actor_kind not null
actor_id text not null
requested_action text not null
decision policy_decision not null       -- allow|ask|deny
policy_ref text not null
rationale text
decided_at timestamptz not null default now()
```

### `audit_events`
```
id uuid pk
organization_id uuid fk not null
occurred_at timestamptz not null default now()
actor_type actor_kind not null
actor_id text not null
action text not null
resource_type text not null
resource_id uuid
mission_id uuid
base_sha char(40)
decision text
evidence_ids uuid[] not null default '{}'
correlation_id text
metadata jsonb not null default '{}'
```
> Append-only. Sem UPDATE, sem DELETE. Revogação de permissão de escrita para roles de aplicação.

### `secret_refs`
```
id uuid pk
organization_id uuid fk not null
name text not null
provider text not null                  -- github|supabase|vercel|openai|anthropic
manager text not null                   -- onde a credencial é administrada
external_ref text not null
rotated_at timestamptz
created_at, updated_at
unique (organization_id, name)
```
> **Nunca armazena o segredo.** Aponta para onde ele é administrado.

---

## 9. Schema `integration`

### `repositories`
```
id uuid pk
organization_id uuid fk not null
app_id uuid fk
provider text not null default 'github'
owner text not null
name text not null
default_branch text not null default 'main'
installation_id bigint
created_at, updated_at
unique (provider, owner, name)
```

### `pull_requests`
```
id uuid pk
organization_id uuid fk not null
repository_id uuid fk not null
number integer not null
kind pr_kind not null                   -- plan|execution|maintenance
task_id uuid fk
stage_id uuid fk
title text
head_sha char(40)
base_sha char(40)
state pr_state not null                 -- open|merged|closed
merged_at timestamptz
created_at, updated_at
unique (repository_id, number)
```

### `ci_checks`
```
id uuid pk
pull_request_id uuid fk not null
name text not null
status check_status not null            -- queued|in_progress|success|failure|neutral|cancelled
details_url text
started_at, completed_at
```

### `supabase_projects`
```
id uuid pk
organization_id uuid fk not null
app_id uuid fk
project_ref text not null unique
region text
kind text not null                      -- factory|generated
created_at
```

### `vercel_projects`
```
id uuid pk
organization_id uuid fk not null
app_id uuid fk
vercel_project_id text not null unique
production_domain text
created_at
```

### `preview_environments`
```
id uuid pk
organization_id uuid fk not null
pull_request_id uuid fk not null
supabase_branch_id text
supabase_ready boolean not null default false
vercel_deployment_id text
vercel_ready boolean not null default false
preview_url text
pair_ready boolean not null default false     -- ← só true quando AMBOS true
created_at, updated_at
```

### `deployments`
```
id uuid pk
organization_id uuid fk not null
app_id uuid fk not null
environment environment_kind not null
provider text not null default 'vercel'
external_id text not null
commit_sha char(40)
state deployment_state not null
url text
created_at, updated_at
```

### `deployment_checks`
```
id uuid pk
deployment_id uuid fk not null
name text not null
status check_status not null
blocking boolean not null default true
completed_at timestamptz
```

### `release_decisions`
```
id uuid pk
organization_id uuid fk not null
deployment_id uuid fk not null
decision release_decision not null       -- promote|hold|rollback
approval_id uuid fk approvals
rolling_percent smallint
decided_at timestamptz not null default now()
```

---

## 10. Schema `factory` — conhecimento, templates, integrações

### `knowledge_items`
```
id uuid pk
organization_id uuid fk not null
title text not null
kind knowledge_kind not null             -- document|video|tutorial|faq|best_practice
category_id uuid fk knowledge_categories
content_md text
external_url text
author_id uuid fk users
reading_minutes smallint
views integer not null default 0
likes integer not null default 0
published_at timestamptz
created_at, updated_at
```

### `knowledge_categories`
```
id uuid pk
organization_id uuid fk not null
name text not null
slug text not null
description text
icon text
item_count integer not null default 0
unique (organization_id, slug)
```

### `templates`
```
id uuid pk
organization_id uuid fk
is_public boolean not null default false
name text not null
slug text not null
description text
category text not null
tags text[] not null default '{}'
technologies text[] not null default '{}'
repository_url text
preview_url text
thumbnail_url text
downloads integer not null default 0
likes integer not null default 0
rating numeric(2,1)
features jsonb not null default '[]'
created_at, updated_at
```

### `integrations`
```
id uuid pk
organization_id uuid fk not null
provider text not null                   -- github|supabase|vercel|openai|anthropic|slack|...
category text not null                   -- productivity|data|communication|development|ai|other
status integration_status not null       -- connected|disconnected|error|configuring
config jsonb not null default '{}'       -- SEM segredos; apenas metadados
secret_ref_id uuid fk secret_refs
connected_by uuid fk users
connected_at timestamptz
last_error text
created_at, updated_at
unique (organization_id, provider)
```

### `api_keys`
```
id uuid pk
organization_id uuid fk not null
name text not null
key_prefix text not null
key_hash text not null                   -- hash, nunca a chave
scopes text[] not null default '{}'
last_used_at timestamptz
revoked_at timestamptz
created_by uuid fk users
created_at
```

---

## 11. Schema `factory` — orquestração de fluxos

### `flows`
```
id uuid pk
organization_id uuid fk not null
name text not null
description text
status flow_status not null              -- draft|active|paused|archived
definition jsonb not null                -- nós e arestas do canvas
definition_sha char(64) not null
version integer not null default 1
created_by uuid fk users
created_at, updated_at
```

### `flow_versions`
```
id uuid pk
flow_id uuid fk not null
version integer not null
definition jsonb not null
definition_sha char(64) not null
created_at
unique (flow_id, version)
```

### `flow_runs`
```
id uuid pk
organization_id uuid fk not null
flow_id uuid fk not null
flow_version integer not null
state run_state not null
input jsonb
output jsonb
started_at, finished_at
duration_ms integer
error jsonb
created_at
```

### `flow_run_steps`
```
id uuid pk
flow_run_id uuid fk not null
node_id text not null
role_id text fk agent_roles
run_id uuid fk runs
state run_state not null
started_at, finished_at
```

---

## 12. Schema `factory` — finanças e avaliação

### `usage_records`
```
id uuid pk
organization_id uuid fk not null
app_id uuid fk
mission_id uuid fk
task_id uuid fk
run_id uuid fk
provider text not null
model_key text
input_tokens integer
cached_input_tokens integer
output_tokens integer
session_hours numeric(10,4)
cost_usd numeric(12,6)
occurred_at timestamptz not null
```

### `budgets`
```
id uuid pk
organization_id uuid fk not null
scope budget_scope not null              -- organization|app|mission|run
scope_id uuid
period text                              -- month|total
max_cost_usd numeric(12,2)
max_tokens bigint
max_wall_seconds integer
created_at, updated_at
```

### `budget_alerts`
```
id uuid pk
budget_id uuid fk not null
threshold_percent smallint not null
triggered_at timestamptz not null
acknowledged_by uuid fk users
acknowledged_at timestamptz
```

### `eval_suites` / `eval_cases` / `eval_runs` / `eval_results` / `agent_scores`
Fase 4. Estrutura detalhada em `06-INTELIGENCIA-DOS-AGENTES/06-EVALS.md`.

---

## 13. Tipos enumerados

```sql
create type membership_role as enum ('owner','admin','engineer','viewer');
create type app_status as enum ('planning','in_progress','in_review','paused','completed','archived');
create type spec_status as enum ('draft','under_review','approved','superseded');
create type environment_kind as enum ('preview','staging','production');
create type mission_status as enum ('draft','planning','under_review','approved','executing','completed','blocked','cancelled');
create type version_status as enum ('draft','in_review','approved','rejected','superseded');
create type stage_status as enum ('pending','ready','executing','reviewing','awaiting_human','approved','blocked','completed','cancelled');
create type task_kind as enum ('plan','implement','review','test','security','browser','release','research');
create type task_state as enum (
  'created','ready','queued','leased','running','artifact_ready','reviewing',
  'awaiting_checks','awaiting_human','approved','completed',
  'changes_required','failed_retryable','failed_terminal','rejected',
  'revision_required','blocked','blocked_budget','cancelled','superseded');
create type actor_kind as enum ('human','agent','system','integration');
create type job_state as enum ('queued','leased','running','succeeded','failed','dead');
create type runtime_kind as enum ('openai','anthropic','antigravity','deterministic','mock');
create type write_policy as enum ('read_only','workspace_write','test_workspace','preview_only','governance_only');
create type run_state as enum ('pending','running','succeeded','failed','cancelled','blocked');
create type review_subject as enum ('mission_version','stage','task','pull_request');
create type cycle_status as enum ('open','awaiting_human','closed','superseded','blocked');
create type review_verdict as enum ('APPROVE_AI_STAGE','CHANGES_REQUIRED','BLOCKED','READY_FOR_HUMAN_APPROVAL');
create type human_decision as enum ('approved','rejected','revision_requested');
create type finding_category as enum ('architecture','correctness','security','data','testing','performance','ux','operations','research','requirement');
create type finding_severity as enum ('info','low','medium','high','critical');
create type finding_status as enum ('open','accepted','rejected','resolved','deferred');
create type disagreement_type as enum ('factual','architectural','security','requirement','implementation','preference');
create type materiality as enum ('low','medium','high','critical');
create type disagreement_resolution as enum ('resolved','accepted_openai','accepted_claude','combined','deferred','human_decision_required');
create type artifact_type as enum ('plan','patch','review','report','screenshot','log','test_result','diff');
create type evidence_type as enum ('code','test','ci','runtime','browser','database','external_source','human');
create type evidence_integrity as enum ('verified','reported','inferred','pending');
create type approval_subject as enum ('mission_version','stage','task','release','spec');
create type approval_decision as enum ('approved','rejected','revision_requested');
create type gate_state as enum ('pending','resolved','expired','cancelled');
create type policy_decision as enum ('allow','ask','deny');
create type pr_kind as enum ('plan','execution','maintenance');
create type pr_state as enum ('open','merged','closed');
create type check_status as enum ('queued','in_progress','success','failure','neutral','cancelled');
create type deployment_state as enum ('queued','building','ready','error','canceled');
create type release_decision as enum ('promote','hold','rollback');
create type knowledge_kind as enum ('document','video','tutorial','faq','best_practice');
create type integration_status as enum ('connected','disconnected','error','configuring');
create type flow_status as enum ('draft','active','paused','archived');
create type budget_scope as enum ('organization','app','mission','run');
```

---

## 14. Índices essenciais

```sql
-- multi-tenant: toda leitura filtra por organização
create index on factory.apps (organization_id, status);
create index on workflow.tasks (organization_id, state, priority desc);
create index on workflow.tasks (mission_id, stage_id);
create index on workflow.jobs (state, next_attempt_at) where state in ('queued','failed');
create index on workflow.jobs (lease_expires_at) where state = 'leased';
create index on agents.runs (organization_id, state, started_at desc);
create index on agents.run_events (run_id, sequence);
create index on review.review_cycles (subject_type, subject_id, subject_sha);
create index on review.findings (review_cycle_id, severity, status);
create index on governance.audit_events (organization_id, occurred_at desc);
create index on governance.audit_events (correlation_id);
create index on factory.usage_records (organization_id, occurred_at desc);
create index on integration.preview_environments (pull_request_id);
```

---

## 15. O que este banco NÃO guarda

| Não guarda | Onde vive |
|---|---|
| Código-fonte | GitHub |
| Migrations dos apps produzidos | GitHub do app produzido |
| Prompts completos enviados ao modelo | Storage/artefato, referenciado; não em logs de observabilidade |
| Segredos e chaves | Secret manager; aqui só `secret_refs` |
| Transcrição bruta de agente | Storage, referenciada por `artifacts` |
| Dados dos aplicativos produzidos | Generated App Supabase de cada app |

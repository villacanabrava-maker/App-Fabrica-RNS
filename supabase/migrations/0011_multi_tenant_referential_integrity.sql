-- ============================================================
-- 0011 — Integridade referencial multi-tenant
--
-- ★ Problema corrigido: várias tabelas guardam organization_id
--   (para RLS) e, separadamente, uma FK simples para uma linha-pai
--   que também pertence a uma organização (app_id, mission_id,
--   stage_id, review_cycle_id, etc.). A policy de INSERT só valida
--   que o USUÁRIO tem papel na organization_id da própria linha —
--   nunca que a linha-pai referenciada pertence à MESMA organização.
--   Um engineer da Org A que souber (ou adivinhar) o id de uma linha
--   da Org B pode inserir um filho da Org A apontando para ela,
--   criando um vínculo cross-tenant que a RLS não previne.
--
-- Correção: toda FK desse tipo vira uma FK composta
--   foreign key (organization_id, x_id) references
--     schema.parent(organization_id, id)
-- que só casa quando o pai tem a MESMA organization_id. Isso exige
-- uma unique (organization_id, id) na tabela-pai (o id sozinho já é
-- unique pela PK; a composta é redundante para consulta, necessária
-- apenas para servir de alvo de FK).
--
-- Constraints antigas são removidas com "drop ... if exists": se o
-- nome autogerado por algum motivo não bater, a FK simples antiga
-- apenas continua coexistindo com a nova composta — mais restritiva,
-- nunca menos —, então esta migration nunca fica menos segura que
-- a que substitui.
-- ============================================================

-- ---------- Uniques compostas nas tabelas-pai ----------
alter table factory.apps               add constraint apps_org_id_unique unique (organization_id, id);
alter table factory.missions           add constraint missions_org_id_unique unique (organization_id, id);
alter table factory.stages             add constraint stages_org_id_unique unique (organization_id, id);
alter table workflow.tasks             add constraint tasks_org_id_unique unique (organization_id, id);
alter table review.review_cycles       add constraint review_cycles_org_id_unique unique (organization_id, id);
alter table governance.approvals       add constraint approvals_org_id_unique unique (organization_id, id);
alter table agents.runs                add constraint runs_org_id_unique unique (organization_id, id);
alter table integration.repositories   add constraint repositories_org_id_unique unique (organization_id, id);
alter table integration.pull_requests  add constraint pull_requests_org_id_unique unique (organization_id, id);
alter table integration.deployments    add constraint deployments_org_id_unique unique (organization_id, id);
alter table factory.knowledge_categories add constraint knowledge_categories_org_id_unique unique (organization_id, id);
alter table governance.secret_refs     add constraint secret_refs_org_id_unique unique (organization_id, id);
alter table factory.flows              add constraint flows_org_id_unique unique (organization_id, id);

-- ---------- factory.app_specs, factory.app_environments → factory.apps ----------
alter table factory.app_specs
  drop constraint if exists app_specs_app_id_fkey,
  add constraint app_specs_app_id_org_fkey
    foreign key (organization_id, app_id) references factory.apps (organization_id, id)
    on delete cascade;

alter table factory.app_environments
  drop constraint if exists app_environments_app_id_fkey,
  add constraint app_environments_app_id_org_fkey
    foreign key (organization_id, app_id) references factory.apps (organization_id, id)
    on delete cascade;

-- ---------- factory.missions → factory.apps ----------
alter table factory.missions
  drop constraint if exists missions_app_id_fkey,
  add constraint missions_app_id_org_fkey
    foreign key (organization_id, app_id) references factory.apps (organization_id, id)
    on delete cascade;

-- ---------- factory.stages → factory.missions ----------
alter table factory.stages
  drop constraint if exists stages_mission_id_fkey,
  add constraint stages_mission_id_org_fkey
    foreign key (organization_id, mission_id) references factory.missions (organization_id, id)
    on delete cascade;

-- ---------- workflow.tasks → factory.apps / missions / stages ----------
alter table workflow.tasks
  drop constraint if exists tasks_app_id_fkey,
  add constraint tasks_app_id_org_fkey
    foreign key (organization_id, app_id) references factory.apps (organization_id, id)
    on delete cascade;

alter table workflow.tasks
  drop constraint if exists tasks_mission_id_fkey,
  add constraint tasks_mission_id_org_fkey
    foreign key (organization_id, mission_id) references factory.missions (organization_id, id)
    on delete cascade;

alter table workflow.tasks
  drop constraint if exists tasks_stage_id_fkey,
  add constraint tasks_stage_id_org_fkey
    foreign key (organization_id, stage_id) references factory.stages (organization_id, id)
    on delete cascade;

-- ---------- agents.runs → apps / missions / stages / tasks / runs (self) ----------
alter table agents.runs
  drop constraint if exists runs_app_id_fkey,
  add constraint runs_app_id_org_fkey
    foreign key (organization_id, app_id) references factory.apps (organization_id, id)
    on delete cascade;

alter table agents.runs
  drop constraint if exists runs_mission_id_fkey,
  add constraint runs_mission_id_org_fkey
    foreign key (organization_id, mission_id) references factory.missions (organization_id, id)
    on delete cascade;

alter table agents.runs
  drop constraint if exists runs_stage_id_fkey,
  add constraint runs_stage_id_org_fkey
    foreign key (organization_id, stage_id) references factory.stages (organization_id, id)
    on delete cascade;

alter table agents.runs
  drop constraint if exists runs_task_id_fkey,
  add constraint runs_task_id_org_fkey
    foreign key (organization_id, task_id) references workflow.tasks (organization_id, id)
    on delete cascade;

alter table agents.runs
  drop constraint if exists runs_parent_run_id_fkey,
  add constraint runs_parent_run_id_org_fkey
    foreign key (organization_id, parent_run_id) references agents.runs (organization_id, id);

-- ---------- review.findings, review.disagreements → review.review_cycles ----------
alter table review.findings
  drop constraint if exists findings_review_cycle_id_fkey,
  add constraint findings_review_cycle_id_org_fkey
    foreign key (organization_id, review_cycle_id) references review.review_cycles (organization_id, id)
    on delete cascade;

alter table review.disagreements
  drop constraint if exists disagreements_review_cycle_id_fkey,
  add constraint disagreements_review_cycle_id_org_fkey
    foreign key (organization_id, review_cycle_id) references review.review_cycles (organization_id, id)
    on delete cascade;

-- ---------- governance.human_gates, integration.release_decisions → governance.approvals ----------
alter table governance.human_gates
  drop constraint if exists human_gates_approval_id_fkey,
  add constraint human_gates_approval_id_org_fkey
    foreign key (organization_id, approval_id) references governance.approvals (organization_id, id);

alter table integration.release_decisions
  drop constraint if exists release_decisions_approval_id_fkey,
  add constraint release_decisions_approval_id_org_fkey
    foreign key (organization_id, approval_id) references governance.approvals (organization_id, id);

-- ---------- governance.policy_decisions, factory.usage_records → agents.runs ----------
alter table governance.policy_decisions
  drop constraint if exists policy_decisions_run_id_fkey,
  add constraint policy_decisions_run_id_org_fkey
    foreign key (organization_id, run_id) references agents.runs (organization_id, id)
    on delete cascade;

alter table factory.usage_records
  drop constraint if exists usage_records_run_id_fkey,
  add constraint usage_records_run_id_org_fkey
    foreign key (organization_id, run_id) references agents.runs (organization_id, id)
    on delete cascade;

-- ---------- integration.repositories, .supabase_projects, .vercel_projects, .deployments, factory.usage_records → factory.apps ----------
alter table integration.repositories
  drop constraint if exists repositories_app_id_fkey,
  add constraint repositories_app_id_org_fkey
    foreign key (organization_id, app_id) references factory.apps (organization_id, id)
    on delete cascade;

alter table integration.supabase_projects
  drop constraint if exists supabase_projects_app_id_fkey,
  add constraint supabase_projects_app_id_org_fkey
    foreign key (organization_id, app_id) references factory.apps (organization_id, id)
    on delete cascade;

alter table integration.vercel_projects
  drop constraint if exists vercel_projects_app_id_fkey,
  add constraint vercel_projects_app_id_org_fkey
    foreign key (organization_id, app_id) references factory.apps (organization_id, id)
    on delete cascade;

alter table integration.deployments
  drop constraint if exists deployments_app_id_fkey,
  add constraint deployments_app_id_org_fkey
    foreign key (organization_id, app_id) references factory.apps (organization_id, id)
    on delete cascade;

alter table factory.usage_records
  drop constraint if exists usage_records_app_id_fkey,
  add constraint usage_records_app_id_org_fkey
    foreign key (organization_id, app_id) references factory.apps (organization_id, id)
    on delete cascade;

-- ---------- factory.usage_records → factory.missions / workflow.tasks ----------
alter table factory.usage_records
  drop constraint if exists usage_records_mission_id_fkey,
  add constraint usage_records_mission_id_org_fkey
    foreign key (organization_id, mission_id) references factory.missions (organization_id, id)
    on delete cascade;

alter table factory.usage_records
  drop constraint if exists usage_records_task_id_fkey,
  add constraint usage_records_task_id_org_fkey
    foreign key (organization_id, task_id) references workflow.tasks (organization_id, id)
    on delete cascade;

-- ---------- integration.pull_requests → repositories / tasks / stages ----------
alter table integration.pull_requests
  drop constraint if exists pull_requests_repository_id_fkey,
  add constraint pull_requests_repository_id_org_fkey
    foreign key (organization_id, repository_id) references integration.repositories (organization_id, id)
    on delete cascade;

alter table integration.pull_requests
  drop constraint if exists pull_requests_task_id_fkey,
  add constraint pull_requests_task_id_org_fkey
    foreign key (organization_id, task_id) references workflow.tasks (organization_id, id)
    on delete set null;

alter table integration.pull_requests
  drop constraint if exists pull_requests_stage_id_fkey,
  add constraint pull_requests_stage_id_org_fkey
    foreign key (organization_id, stage_id) references factory.stages (organization_id, id)
    on delete set null;

-- ---------- integration.preview_environments → integration.pull_requests ----------
alter table integration.preview_environments
  drop constraint if exists preview_environments_pull_request_id_fkey,
  add constraint preview_environments_pull_request_id_org_fkey
    foreign key (organization_id, pull_request_id) references integration.pull_requests (organization_id, id)
    on delete cascade;

-- ---------- integration.release_decisions → integration.deployments ----------
alter table integration.release_decisions
  drop constraint if exists release_decisions_deployment_id_fkey,
  add constraint release_decisions_deployment_id_org_fkey
    foreign key (organization_id, deployment_id) references integration.deployments (organization_id, id)
    on delete cascade;

-- ---------- factory.knowledge_items → factory.knowledge_categories ----------
alter table factory.knowledge_items
  drop constraint if exists knowledge_items_category_id_fkey,
  add constraint knowledge_items_category_id_org_fkey
    foreign key (organization_id, category_id) references factory.knowledge_categories (organization_id, id)
    on delete set null;

-- ---------- factory.integrations → governance.secret_refs ----------
alter table factory.integrations
  drop constraint if exists integrations_secret_ref_id_fkey,
  add constraint integrations_secret_ref_id_org_fkey
    foreign key (organization_id, secret_ref_id) references governance.secret_refs (organization_id, id);

-- ---------- factory.flow_runs → factory.flows ----------
alter table factory.flow_runs
  drop constraint if exists flow_runs_flow_id_fkey,
  add constraint flow_runs_flow_id_org_fkey
    foreign key (organization_id, flow_id) references factory.flows (organization_id, id)
    on delete cascade;

-- ============================================================
-- Fora do escopo desta migration (documentado, não corrigido):
--
-- workflow.task_dependencies não tem organization_id próprio, então
-- o padrão de FK composta não se aplica. Hoje isso não é explorável
-- pela Data API: a tabela tem RLS habilitada (0009) mas nenhuma
-- policy de INSERT foi definida para ela, então authenticated não
-- consegue inserir uma dependência de forma alguma — só o
-- Orchestrator, com a service key, que já é código confiável. Se uma
-- policy de INSERT for adicionada no futuro, este arquivo precisa
-- ganhar um trigger BEFORE INSERT OR UPDATE que valide
-- tasks.organization_id igual nas duas pontas antes disso acontecer.
-- ============================================================

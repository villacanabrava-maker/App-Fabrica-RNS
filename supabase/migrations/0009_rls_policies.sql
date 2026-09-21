-- ============================================================
-- 0009 — Row Level Security
--
-- Regra: RLS habilitada em TODA tabela exposta.
-- Toda policy de UPDATE tem WITH CHECK — sem isso é possível
-- mover uma linha para outra organização.
-- Sem policy de DELETE = ninguém apaga pela Data API.
-- ============================================================

-- ---------- Habilitar RLS ----------
alter table factory.organizations        enable row level security;
alter table factory.users                enable row level security;
alter table factory.memberships          enable row level security;
alter table factory.apps                 enable row level security;
alter table factory.app_specs            enable row level security;
alter table factory.app_environments     enable row level security;
alter table factory.missions             enable row level security;
alter table factory.mission_versions     enable row level security;
alter table factory.stages               enable row level security;
alter table factory.artifacts            enable row level security;
alter table factory.evidence_items       enable row level security;
alter table factory.test_results         enable row level security;
alter table factory.knowledge_items      enable row level security;
alter table factory.knowledge_categories enable row level security;
alter table factory.knowledge_likes      enable row level security;
alter table factory.templates            enable row level security;
alter table factory.integrations         enable row level security;
alter table factory.api_keys             enable row level security;
alter table factory.flows                enable row level security;
alter table factory.flow_versions        enable row level security;
alter table factory.flow_runs            enable row level security;
alter table factory.flow_run_steps       enable row level security;
alter table factory.usage_records        enable row level security;
alter table factory.budgets              enable row level security;
alter table factory.budget_alerts        enable row level security;

alter table workflow.tasks               enable row level security;
alter table workflow.task_dependencies   enable row level security;
alter table workflow.task_packets        enable row level security;
alter table workflow.jobs                enable row level security;
alter table workflow.domain_events       enable row level security;

alter table agents.agent_roles           enable row level security;
alter table agents.agent_profiles        enable row level security;
alter table agents.model_profiles        enable row level security;
alter table agents.runs                  enable row level security;
alter table agents.run_events            enable row level security;
alter table agents.tool_events           enable row level security;

alter table review.review_cycles         enable row level security;
alter table review.review_rounds         enable row level security;
alter table review.findings              enable row level security;
alter table review.disagreements         enable row level security;

alter table governance.approvals         enable row level security;
alter table governance.human_gates       enable row level security;
alter table governance.policy_decisions  enable row level security;
alter table governance.audit_events      enable row level security;
alter table governance.secret_refs       enable row level security;

alter table integration.repositories          enable row level security;
alter table integration.pull_requests         enable row level security;
alter table integration.ci_checks             enable row level security;
alter table integration.supabase_projects     enable row level security;
alter table integration.vercel_projects       enable row level security;
alter table integration.preview_environments  enable row level security;
alter table integration.deployments           enable row level security;
alter table integration.deployment_checks     enable row level security;
alter table integration.release_decisions     enable row level security;

-- ---------- Privilégios de base ----------
-- ★ RLS FILTRA linhas; ela não CONCEDE acesso. Sem o GRANT de schema
--   e de tabela abaixo, toda query de `authenticated` nestes schemas
--   falha com "permission denied for schema x" antes mesmo da policy
--   ser avaliada — nenhuma das migrations anteriores concedia isso.
--   DELETE fica deliberadamente FORA do grant amplo: "sem policy de
--   DELETE = ninguém apaga pela Data API" (cabeçalho deste arquivo)
--   vale tanto para a policy quanto para o privilégio de base. Nunca
--   concedido a `anon`: nenhuma policy deste arquivo é `to anon`.
grant usage on schema factory, workflow, agents, review, governance, integration
  to authenticated;

grant select, insert, update on all tables in schema factory      to authenticated;
grant select, insert, update on all tables in schema workflow     to authenticated;
grant select, insert, update on all tables in schema agents       to authenticated;
grant select, insert, update on all tables in schema review       to authenticated;
grant select, insert, update on all tables in schema governance   to authenticated;
grant select, insert, update on all tables in schema integration  to authenticated;

-- ---------- Organizações e membros ----------
create policy "members read own organization"
on factory.organizations for select to authenticated
using (id in (select factory.user_organizations()));

create policy "admins update own organization"
on factory.organizations for update to authenticated
using (factory.user_has_role(id, array['owner','admin']::membership_role[]))
with check (factory.user_has_role(id, array['owner','admin']::membership_role[]));

create policy "users read own profile"
on factory.users for select to authenticated
using (id = auth.uid()
       or id in (select user_id from factory.memberships
                 where organization_id in (select factory.user_organizations())));

create policy "users update own profile"
on factory.users for update to authenticated
using (id = auth.uid()) with check (id = auth.uid());

create policy "members read memberships"
on factory.memberships for select to authenticated
using (organization_id in (select factory.user_organizations()));

create policy "admins manage memberships"
on factory.memberships for all to authenticated
using (factory.user_has_role(organization_id, array['owner','admin']::membership_role[]))
with check (factory.user_has_role(organization_id, array['owner','admin']::membership_role[]));

-- ---------- Macro para tabelas org-scoped ----------
-- Leitura: qualquer membro. Escrita: engineer ou acima.
do $$
declare
  t record;
begin
  for t in
    select * from (values
      ('factory','apps'), ('factory','app_specs'), ('factory','app_environments'),
      ('factory','missions'), ('factory','stages'),
      ('factory','artifacts'), ('factory','test_results'),
      ('factory','knowledge_items'), ('factory','knowledge_categories'),
      ('factory','templates'), ('factory','flows'),
      ('factory','flow_runs'), ('factory','usage_records'),
      ('workflow','tasks'),
      ('agents','agent_profiles'), ('agents','runs'),
      ('review','review_cycles'), ('review','findings'), ('review','disagreements'),
      ('integration','repositories'), ('integration','pull_requests'),
      ('integration','supabase_projects'), ('integration','vercel_projects'),
      ('integration','preview_environments'), ('integration','deployments')
    ) as x(sch, tbl)
  loop
    execute format(
      'create policy %I on %I.%I for select to authenticated
         using (organization_id in (select factory.user_organizations()))',
      'org members read ' || t.tbl, t.sch, t.tbl);

    execute format(
      'create policy %I on %I.%I for insert to authenticated
         with check (factory.user_has_role(organization_id,
           array[''owner'',''admin'',''engineer'']::membership_role[]))',
      'engineers insert ' || t.tbl, t.sch, t.tbl);

    -- ★ USING e WITH CHECK. Sem WITH CHECK é possível mover a linha
    --   para outra organização.
    execute format(
      'create policy %I on %I.%I for update to authenticated
         using (factory.user_has_role(organization_id,
           array[''owner'',''admin'',''engineer'']::membership_role[]))
         with check (factory.user_has_role(organization_id,
           array[''owner'',''admin'',''engineer'']::membership_role[]))',
      'engineers update ' || t.tbl, t.sch, t.tbl);
  end loop;
end $$;

-- ---------- Tabelas filhas: herdam a organização do pai ----------
-- Estas tabelas não têm organization_id próprio. O isolamento vem
-- da linha pai, e a policy precisa refleti-lo explicitamente.

create policy "org members read mission versions"
on factory.mission_versions for select to authenticated
using (mission_id in (select id from factory.missions
                      where organization_id in (select factory.user_organizations())));

create policy "engineers write mission versions"
on factory.mission_versions for insert to authenticated
with check (mission_id in (select id from factory.missions
                           where factory.user_has_role(organization_id,
                             array['owner','admin','engineer']::membership_role[])));

create policy "org members read flow versions"
on factory.flow_versions for select to authenticated
using (flow_id in (select id from factory.flows
                   where organization_id in (select factory.user_organizations())));

create policy "engineers write flow versions"
on factory.flow_versions for insert to authenticated
with check (flow_id in (select id from factory.flows
                        where factory.user_has_role(organization_id,
                          array['owner','admin','engineer']::membership_role[])));

create policy "org members read task packets"
on workflow.task_packets for select to authenticated
using (task_id in (select id from workflow.tasks
                   where organization_id in (select factory.user_organizations())));

create policy "org members read task dependencies"
on workflow.task_dependencies for select to authenticated
using (task_id in (select id from workflow.tasks
                   where organization_id in (select factory.user_organizations())));

create policy "org members read flow run steps"
on factory.flow_run_steps for select to authenticated
using (flow_run_id in (select id from factory.flow_runs
                       where organization_id in (select factory.user_organizations())));

create policy "org members read ci checks"
on integration.ci_checks for select to authenticated
using (pull_request_id in (select id from integration.pull_requests
                           where organization_id in (select factory.user_organizations())));

create policy "org members read deployment checks"
on integration.deployment_checks for select to authenticated
using (deployment_id in (select id from integration.deployments
                         where organization_id in (select factory.user_organizations())));

create policy "org members read release decisions"
on integration.release_decisions for select to authenticated
using (organization_id in (select factory.user_organizations()));

create policy "org members read test results"
on factory.test_results for select to authenticated
using (organization_id in (select factory.user_organizations()));

create policy "org members read budgets"
on factory.budgets for select to authenticated
using (organization_id in (select factory.user_organizations()));

create policy "admins manage budgets"
on factory.budgets for all to authenticated
using (factory.user_has_role(organization_id, array['owner','admin']::membership_role[]))
with check (factory.user_has_role(organization_id, array['owner','admin']::membership_role[]));

create policy "org members read budget alerts"
on factory.budget_alerts for select to authenticated
using (budget_id in (select id from factory.budgets
                     where organization_id in (select factory.user_organizations())));

create policy "org members read domain events"
on workflow.domain_events for select to authenticated
using (organization_id in (select factory.user_organizations()));

create policy "org members read app specs versions"
on factory.knowledge_likes for select to authenticated
using (user_id = auth.uid());

-- ---------- Somente leitura para membros ----------
create policy "org members read run events"
on agents.run_events for select to authenticated
using (run_id in (select id from agents.runs
                  where organization_id in (select factory.user_organizations())));

create policy "org members read tool events"
on agents.tool_events for select to authenticated
using (run_id in (select id from agents.runs
                  where organization_id in (select factory.user_organizations())));

create policy "org members read review rounds"
on review.review_rounds for select to authenticated
using (review_cycle_id in (select id from review.review_cycles
                           where organization_id in (select factory.user_organizations())));

create policy "everyone reads agent roles"
on agents.agent_roles for select to authenticated using (true);

create policy "everyone reads enabled models"
on agents.model_profiles for select to authenticated using (enabled);

create policy "public templates are readable"
on factory.templates for select to authenticated
using (is_public or organization_id in (select factory.user_organizations()));

-- ---------- Governança ----------
create policy "org members read approvals"
on governance.approvals for select to authenticated
using (organization_id in (select factory.user_organizations()));

-- ★ Inserção de aprovação só pelo próprio usuário autenticado.
--   Combinada com a constraint approvals_must_be_human,
--   torna impossível um agente aprovar.
create policy "humans insert own approvals"
on governance.approvals for insert to authenticated
with check (
  actor_type = 'human'
  and actor_id = auth.uid()
  and organization_id in (select factory.user_organizations())
);

create policy "org members read human gates"
on governance.human_gates for select to authenticated
using (organization_id in (select factory.user_organizations()));

create policy "org members read audit"
on governance.audit_events for select to authenticated
using (organization_id in (select factory.user_organizations()));

create policy "org members read policy decisions"
on governance.policy_decisions for select to authenticated
using (organization_id in (select factory.user_organizations()));

-- secret_refs: só admin lê os METADADOS. O segredo nunca está aqui.
create policy "admins read secret refs"
on governance.secret_refs for select to authenticated
using (factory.user_has_role(organization_id, array['owner','admin']::membership_role[]));

-- ---------- Integrações e chaves ----------
create policy "org members read integrations"
on factory.integrations for select to authenticated
using (organization_id in (select factory.user_organizations()));

create policy "admins manage integrations"
on factory.integrations for all to authenticated
using (factory.user_has_role(organization_id, array['owner','admin']::membership_role[]))
with check (factory.user_has_role(organization_id, array['owner','admin']::membership_role[]));

create policy "owners manage api keys"
on factory.api_keys for all to authenticated
using (factory.user_has_role(organization_id, array['owner']::membership_role[]))
with check (factory.user_has_role(organization_id, array['owner']::membership_role[]));

-- ---------- Curtidas ----------
create policy "users manage own likes"
on factory.knowledge_likes for all to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- Evidência: leitura por membros, append-only ----------
create policy "org members read evidence"
on factory.evidence_items for select to authenticated
using (organization_id in (select factory.user_organizations()));

-- ============================================================
-- ★ Ledger append-only: revogar UPDATE e DELETE
-- Auditoria e evidência NUNCA são alteradas nem apagadas.
-- ============================================================
revoke update, delete on governance.audit_events  from authenticated, anon;
revoke update, delete on factory.evidence_items   from authenticated, anon;
revoke update, delete on governance.approvals     from authenticated, anon;
revoke update, delete on governance.policy_decisions from authenticated, anon;

-- ============================================================
-- Tabelas NUNCA expostas ao cliente.
-- O Orchestrator acessa server-side com a secret key.
-- ============================================================
revoke all on workflow.jobs              from authenticated, anon;
revoke all on workflow.job_attempts      from authenticated, anon;
revoke all on workflow.dead_letters      from authenticated, anon;
revoke all on workflow.webhook_events    from authenticated, anon;
revoke all on workflow.leases            from authenticated, anon;
revoke all on agents.runtime_profiles    from authenticated, anon;
revoke all on agents.intelligence_versions from authenticated, anon;

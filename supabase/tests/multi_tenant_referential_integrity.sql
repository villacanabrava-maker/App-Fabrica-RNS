-- ============================================================
-- Testes de integridade referencial multi-tenant
--
-- ★ A policy de RLS de INSERT valida apenas que o usuário tem papel
--   na organization_id DA PRÓPRIA linha. Sem mais nada, um engineer
--   da Org D poderia criar um filho na Org D apontando (via app_id,
--   mission_id, etc.) para uma linha-pai que pertence à Org E, desde
--   que soubesse ou adivinhasse o id. A FK composta
--   (organization_id, parent_id) de 0011 fecha essa brecha: ela só
--   casa quando o pai tem a MESMA organization_id do filho.
-- ============================================================
begin;
select plan(4);

insert into factory.organizations (id, name, slug) values
  ('dddddddd-0000-0000-0000-000000000001','Org D','org-d'),
  ('eeeeeeee-0000-0000-0000-000000000002','Org E','org-e');

insert into auth.users (id) values
  ('dddddddd-1111-1111-1111-111111111111');

insert into factory.users (id, email) values
  ('dddddddd-1111-1111-1111-111111111111','engineer-d@rns.test');

insert into factory.memberships (organization_id, user_id, role, accepted_at) values
  ('dddddddd-0000-0000-0000-000000000001','dddddddd-1111-1111-1111-111111111111','engineer', now());

-- Um app em cada organização — montagem do cenário, não é o que está
-- sendo testado.
insert into factory.apps (id, organization_id, name, slug) values
  ('dddddddd-a000-0000-0000-000000000001','dddddddd-0000-0000-0000-000000000001','App D','app-d'),
  ('eeeeeeee-a000-0000-0000-000000000002','eeeeeeee-0000-0000-0000-000000000002','App E','app-e');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"dddddddd-1111-1111-1111-111111111111"}', true);

-- ★ O teste central: a RLS de INSERT permitiria esta linha (o
--   engineer tem papel na Org D, dona da linha). A FK composta é
--   quem bloqueia o vínculo cross-tenant.
select throws_ok(
  $$ insert into factory.missions (organization_id, app_id, title, objective)
     values ('dddddddd-0000-0000-0000-000000000001',
             'eeeeeeee-a000-0000-0000-000000000002',
             'Missao cross-tenant', 'nao deveria existir') $$,
  '23503', null,
  'missao NAO pode referenciar app de outra organizacao'
);

select lives_ok(
  $$ insert into factory.missions (organization_id, app_id, title, objective)
     values ('dddddddd-0000-0000-0000-000000000001',
             'dddddddd-a000-0000-0000-000000000001',
             'Missao legitima', 'app e missao na mesma org') $$,
  'missao referenciando app da PROPRIA organizacao e aceita'
);

select throws_ok(
  $$ insert into workflow.tasks (organization_id, app_id, title, kind)
     values ('dddddddd-0000-0000-0000-000000000001',
             'eeeeeeee-a000-0000-0000-000000000002',
             'Tarefa cross-tenant', 'implement') $$,
  '23503', null,
  'tarefa NAO pode referenciar app de outra organizacao'
);

select throws_ok(
  $$ insert into integration.repositories (organization_id, app_id, owner, name)
     values ('dddddddd-0000-0000-0000-000000000001',
             'eeeeeeee-a000-0000-0000-000000000002',
             'RNS', 'repo-cross-tenant') $$,
  '23503', null,
  'repositorio NAO pode referenciar app de outra organizacao'
);

select * from finish();
rollback;

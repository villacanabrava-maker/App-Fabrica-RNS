-- ============================================================
-- Testes de RLS — isolamento multi-tenant
--
-- ★ O caso mais importante NÃO é o caminho feliz.
--   É provar que a organização A vê ZERO linhas da organização B.
-- ============================================================
begin;
select plan(7);

-- Duas organizações, dois usuários
insert into factory.organizations (id, name, slug) values
  ('aaaaaaaa-0000-0000-0000-000000000001','Org A','org-a'),
  ('bbbbbbbb-0000-0000-0000-000000000002','Org B','org-b');

insert into auth.users (id) values
  ('aaaaaaaa-1111-1111-1111-111111111111'),
  ('cccccccc-3333-3333-3333-333333333333');

insert into factory.users (id, email) values
  ('aaaaaaaa-1111-1111-1111-111111111111','engineer-a@rns.test'),
  ('cccccccc-3333-3333-3333-333333333333','viewer-a@rns.test');

insert into factory.memberships (organization_id, user_id, role, accepted_at) values
  ('aaaaaaaa-0000-0000-0000-000000000001','aaaaaaaa-1111-1111-1111-111111111111','engineer', now()),
  ('aaaaaaaa-0000-0000-0000-000000000001','cccccccc-3333-3333-3333-333333333333','viewer', now());

insert into factory.apps (organization_id, name, slug) values
  ('aaaaaaaa-0000-0000-0000-000000000001','App A1','app-a1'),
  ('aaaaaaaa-0000-0000-0000-000000000001','App A2','app-a2'),
  ('aaaaaaaa-0000-0000-0000-000000000001','App A3','app-a3'),
  ('bbbbbbbb-0000-0000-0000-000000000002','App B1','app-b1'),
  ('bbbbbbbb-0000-0000-0000-000000000002','App B2','app-b2');

-- ---------- Engineer da Org A ----------
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"aaaaaaaa-1111-1111-1111-111111111111"}', true);

-- ★ Regressão: factory.user_organizations()/user_has_role() chamadas
--   pela policy de factory.memberships não podem reconsultar a
--   própria factory.memberships sob a mesma policy — isso é
--   "infinite recursion detected in policy for relation
--   \"memberships\"". Corrigido tornando as funções SECURITY DEFINER
--   (ver 0002_identity_and_apps.sql). Como toda outra policy do
--   sistema depende dessas funções, este é o teste mais fundamental
--   do arquivo: se ele travar, tudo mais trava junto.
select lives_ok(
  $$ select count(*) from factory.memberships $$,
  'consultar memberships nao recursiona pela propria policy'
);

select is(
  (select count(*) from factory.apps),
  3::bigint,
  'engineer da org A ve exatamente os 3 apps da org A'
);

-- ★ O teste que prova o isolamento
select is(
  (select count(*) from factory.apps
   where organization_id = 'bbbbbbbb-0000-0000-0000-000000000002'),
  0::bigint,
  'engineer da org A ve ZERO linhas da org B'
);

select lives_ok(
  $$ insert into factory.apps (organization_id, name, slug)
     values ('aaaaaaaa-0000-0000-0000-000000000001','App A4','app-a4') $$,
  'engineer cria app na propria organizacao'
);

select throws_ok(
  $$ insert into factory.apps (organization_id, name, slug)
     values ('bbbbbbbb-0000-0000-0000-000000000002','Invasor','invasor') $$,
  '42501', null,
  'engineer NAO cria app em outra organizacao'
);

-- ★ O erro de RLS mais comum: update sem WITH CHECK
select throws_ok(
  $$ update factory.apps
     set organization_id = 'bbbbbbbb-0000-0000-0000-000000000002'
     where slug = 'app-a1' $$,
  '42501', null,
  'engineer NAO move app para outra organizacao'
);

-- ---------- Viewer da Org A ----------
select set_config('request.jwt.claims',
  '{"sub":"cccccccc-3333-3333-3333-333333333333"}', true);

select throws_ok(
  $$ insert into factory.apps (organization_id, name, slug)
     values ('aaaaaaaa-0000-0000-0000-000000000001','Viewer App','viewer-app') $$,
  '42501', null,
  'viewer NAO cria app'
);

select * from finish();
rollback;

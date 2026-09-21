-- ============================================================
-- Testes de factory.create_organization (0014_organization_bootstrap.sql)
--
-- Casos exigidos pela revalidação do fiscal (request_id
-- fiscal_e2e3a330b5652c9b5bb3e602) na PR #5, antes de qualquer merge.
-- ============================================================
begin;
select plan(10);

insert into auth.users (id) values
  ('11111111-0000-0000-0000-000000000001'),
  ('22222222-0000-0000-0000-000000000002');

insert into factory.users (id, email) values
  ('11111111-0000-0000-0000-000000000001', 'owner-a@rns.test'),
  ('22222222-0000-0000-0000-000000000002', 'owner-b@rns.test');

-- ---------- 1. usuário autenticado cria organização + vira owner ----------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-0000-0000-0000-000000000001"}', true);

select lives_ok(
  $$ select factory.create_organization('Organização A', 'org-bootstrap-a') $$,
  'usuário autenticado consegue criar organização via create_organization'
);

select is(
  (select role from factory.memberships m
     join factory.organizations o on o.id = m.organization_id
    where o.slug = 'org-bootstrap-a'),
  'owner'::membership_role,
  'quem chama create_organization vira owner da organização criada'
);

select is(
  (select user_id from factory.memberships m
     join factory.organizations o on o.id = m.organization_id
    where o.slug = 'org-bootstrap-a'),
  '11111111-0000-0000-0000-000000000001'::uuid,
  'membership.user_id é exatamente o auth.uid() de quem chamou — nunca vindo do cliente'
);

select isnt(
  (select accepted_at from factory.memberships m
     join factory.organizations o on o.id = m.organization_id
    where o.slug = 'org-bootstrap-a'),
  null,
  'accepted_at já vem preenchido — o criador não fica em estado de convite pendente'
);

-- ---------- 2. usuário anônimo/não autenticado não executa a função ----------
set local role anon;
select set_config('request.jwt.claims', '', true);

select throws_ok(
  $$ select factory.create_organization('Organização Anônima', 'org-anon') $$,
  null, 'create_organization requer um usuário autenticado',
  'anon sem sessão não consegue criar organização (auth.uid() nulo -> exception)'
);

-- ---------- 3. isolamento entre tenants ----------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"22222222-0000-0000-0000-000000000002"}', true);

select lives_ok(
  $$ select factory.create_organization('Organização B', 'org-bootstrap-b') $$,
  'segundo usuário cria a própria organização, independente da primeira'
);

select is(
  (select count(*)::int from factory.organizations where slug = 'org-bootstrap-a'),
  0,
  'usuário B não enxerga a organização A — isolamento por RLS (members read own organization) continua valendo'
);

-- ---------- 4. autoelevação em organização já existente continua bloqueada ----------
select throws_ok(
  $$ insert into factory.memberships (organization_id, user_id, role, accepted_at)
     select o.id, '22222222-0000-0000-0000-000000000002', 'owner', now()
     from factory.organizations o where o.slug = 'org-bootstrap-a' $$,
  '42501', null,
  'usuário B não consegue se autoelevar a owner da organização A por insert direto — só via função'
);

-- ---------- 5. insert direto em organizations continua negado ----------
select throws_ok(
  $$ insert into factory.organizations (name, slug) values ('Direto', 'org-direto') $$,
  '42501', null,
  'insert direto em factory.organizations (fora da função) continua negado por RLS'
);

-- ---------- 6. conflito de slug não deixa organização/membership órfã ----------
select throws_ok(
  $$ select factory.create_organization('Organização A duplicada', 'org-bootstrap-a') $$,
  '23505', null,
  'slug duplicado é rejeitado (unique constraint) — mesmo comportamento de antes desta migration'
);

select * from finish();
rollback;

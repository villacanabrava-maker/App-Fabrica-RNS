-- ============================================================
-- Testes de 0015_memberships_owner_hardening.sql
--
-- Finding da PR #5 (Fiscal R1): `admin` não pode atribuir `owner` (a outrem
-- nem a si), nem rebaixar/remover `owner`, direto pela Data API. Inclui os
-- casos de NEGAÇÃO, o último owner e o isolamento entre tenants.
-- ============================================================
begin;
select plan(22);

-- authenticated não tem GRANT DELETE hoje (0009: select, insert, update). Concedido só dentro desta
-- transação de teste (revertida no rollback) para exercitar a policy de DELETE e o trigger de último owner.
grant delete on factory.memberships to authenticated;

-- ---------- Fixtures (como superusuário) ----------
insert into auth.users (id) values
  ('a0000000-0000-0000-0000-00000000000a'),  -- ownerA
  ('a0000000-0000-0000-0000-00000000000b'),  -- adminA   (ator das negações)
  ('a0000000-0000-0000-0000-00000000000c'),  -- adminA2  (owner promove admin -> owner)
  ('a0000000-0000-0000-0000-00000000000d'),  -- engA     (owner promove member -> admin)
  ('a0000000-0000-0000-0000-00000000000e'),  -- viewerA  (alvo das tentativas de escalada)
  ('a0000000-0000-0000-0000-00000000000f'),  -- newA     (usuário sem membership)
  ('b0000000-0000-0000-0000-00000000000a'),  -- ownerB   (outro tenant)
  ('c0000000-0000-0000-0000-00000000000a'),  -- ownerC   (org de owner único)
  ('c0000000-0000-0000-0000-00000000000b');  -- adminC

insert into factory.users (id, email) values
  ('a0000000-0000-0000-0000-00000000000a', 'owner-a@rns.test'),
  ('a0000000-0000-0000-0000-00000000000b', 'admin-a@rns.test'),
  ('a0000000-0000-0000-0000-00000000000c', 'admin-a2@rns.test'),
  ('a0000000-0000-0000-0000-00000000000d', 'eng-a@rns.test'),
  ('a0000000-0000-0000-0000-00000000000e', 'viewer-a@rns.test'),
  ('a0000000-0000-0000-0000-00000000000f', 'new-a@rns.test'),
  ('b0000000-0000-0000-0000-00000000000a', 'owner-b@rns.test'),
  ('c0000000-0000-0000-0000-00000000000a', 'owner-c@rns.test'),
  ('c0000000-0000-0000-0000-00000000000b', 'admin-c@rns.test');

insert into factory.organizations (id, name, slug) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Org A', 'hard-org-a'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'Org B', 'hard-org-b'),
  ('cccccccc-0000-0000-0000-000000000001', 'Org C', 'hard-org-c');

insert into factory.memberships (organization_id, user_id, role, accepted_at) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-00000000000a', 'owner',    now()),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-00000000000b', 'admin',    now()),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-00000000000c', 'admin',    now()),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-00000000000d', 'engineer', now()),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-00000000000e', 'viewer',   now()),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-00000000000a', 'owner',    now()),
  ('cccccccc-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-00000000000a', 'owner',    now()),
  ('cccccccc-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-00000000000b', 'admin',    now());

-- ============================================================
-- A. OWNER pode promover
-- ============================================================
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-00000000000a"}', true);

select lives_ok(
  $$ update factory.memberships set role = 'admin'
      where organization_id = 'aaaaaaaa-0000-0000-0000-000000000001'
        and user_id = 'a0000000-0000-0000-0000-00000000000d' $$,
  '1. owner promove member (engineer) -> admin'
);
select is(
  (select role from factory.memberships
    where organization_id = 'aaaaaaaa-0000-0000-0000-000000000001' and user_id = 'a0000000-0000-0000-0000-00000000000d'),
  'admin'::membership_role,
  '1b. papel resultante é admin'
);

select lives_ok(
  $$ update factory.memberships set role = 'owner'
      where organization_id = 'aaaaaaaa-0000-0000-0000-000000000001'
        and user_id = 'a0000000-0000-0000-0000-00000000000c' $$,
  '2. owner promove admin -> owner'
);
select is(
  (select role from factory.memberships
    where organization_id = 'aaaaaaaa-0000-0000-0000-000000000001' and user_id = 'a0000000-0000-0000-0000-00000000000c'),
  'owner'::membership_role,
  '2b. papel resultante é owner'
);

-- ============================================================
-- B. ADMIN não escala nem toca owner (casos de NEGAÇÃO)
-- ============================================================
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-00000000000b"}', true);

select throws_ok(
  $$ update factory.memberships set role = 'owner'
      where organization_id = 'aaaaaaaa-0000-0000-0000-000000000001'
        and user_id = 'a0000000-0000-0000-0000-00000000000e' $$,
  '42501', null,
  '3. admin NÃO promove member -> owner (WITH CHECK)'
);
select is(
  (select role from factory.memberships
    where organization_id = 'aaaaaaaa-0000-0000-0000-000000000001' and user_id = 'a0000000-0000-0000-0000-00000000000e'),
  'viewer'::membership_role,
  '3b. alvo continua viewer'
);

select throws_ok(
  $$ update factory.memberships set role = 'owner'
      where organization_id = 'aaaaaaaa-0000-0000-0000-000000000001'
        and user_id = 'a0000000-0000-0000-0000-00000000000b' $$,
  '42501', null,
  '4. admin NÃO promove a si próprio -> owner'
);
select is(
  (select role from factory.memberships
    where organization_id = 'aaaaaaaa-0000-0000-0000-000000000001' and user_id = 'a0000000-0000-0000-0000-00000000000b'),
  'admin'::membership_role,
  '4b. admin continua admin'
);

select is(
  (with u as (
     update factory.memberships set role = 'viewer'
      where organization_id = 'aaaaaaaa-0000-0000-0000-000000000001'
        and user_id = 'a0000000-0000-0000-0000-00000000000a'
      returning 1)
   select count(*)::int from u),
  0,
  '5. admin NÃO rebaixa owner (linha invisível: 0 linhas afetadas)'
);
select is(
  (select role from factory.memberships
    where organization_id = 'aaaaaaaa-0000-0000-0000-000000000001' and user_id = 'a0000000-0000-0000-0000-00000000000a'),
  'owner'::membership_role,
  '5b. owner continua owner'
);

select is(
  (with d as (
     delete from factory.memberships
      where organization_id = 'aaaaaaaa-0000-0000-0000-000000000001'
        and user_id = 'a0000000-0000-0000-0000-00000000000a'
      returning 1)
   select count(*)::int from d),
  0,
  '6. admin NÃO remove owner'
);

select throws_ok(
  $$ insert into factory.memberships (organization_id, user_id, role, accepted_at)
     values ('aaaaaaaa-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-00000000000f', 'owner', now()) $$,
  '42501', null,
  '7. admin NÃO insere membership nova já como owner'
);

-- não-regressão: admin continua gerenciando papéis abaixo de owner
select lives_ok(
  $$ update factory.memberships set role = 'engineer'
      where organization_id = 'aaaaaaaa-0000-0000-0000-000000000001'
        and user_id = 'a0000000-0000-0000-0000-00000000000e' $$,
  '8. admin continua promovendo viewer -> engineer (não-regressão)'
);
select lives_ok(
  $$ insert into factory.memberships (organization_id, user_id, role, accepted_at)
     values ('aaaaaaaa-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-00000000000f', 'viewer', now()) $$,
  '9. admin continua adicionando membro não-owner (não-regressão)'
);

-- ============================================================
-- C. Último owner protegido no banco
-- ============================================================
select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-00000000000a"}', true);

select throws_ok(
  $$ update factory.memberships set role = 'admin'
      where organization_id = 'cccccccc-0000-0000-0000-000000000001'
        and user_id = 'c0000000-0000-0000-0000-00000000000a' $$,
  null, 'último owner da organização não pode ser removido nem rebaixado',
  '10. último owner NÃO se rebaixa'
);
select throws_ok(
  $$ delete from factory.memberships
      where organization_id = 'cccccccc-0000-0000-0000-000000000001'
        and user_id = 'c0000000-0000-0000-0000-00000000000a' $$,
  null, 'último owner da organização não pode ser removido nem rebaixado',
  '11. último owner NÃO é removido'
);

-- com dois owners, rebaixar um é permitido (Org A: ownerA + adminA2 promovido em 2)
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-00000000000a"}', true);
select lives_ok(
  $$ update factory.memberships set role = 'admin'
      where organization_id = 'aaaaaaaa-0000-0000-0000-000000000001'
        and user_id = 'a0000000-0000-0000-0000-00000000000c' $$,
  '12. com dois owners, owner pode rebaixar o outro'
);
select throws_ok(
  $$ update factory.memberships set role = 'admin'
      where organization_id = 'aaaaaaaa-0000-0000-0000-000000000001'
        and user_id = 'a0000000-0000-0000-0000-00000000000a' $$,
  null, 'último owner da organização não pode ser removido nem rebaixado',
  '13. voltando a ter um só owner, ele volta a ser protegido'
);

-- ============================================================
-- D. Isolamento entre tenants continua negado
-- ============================================================
select set_config('request.jwt.claims', '{"sub":"b0000000-0000-0000-0000-00000000000a"}', true);

select is(
  (select count(*)::int from factory.memberships where organization_id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  0,
  '14. owner de outra organização NÃO enxerga memberships da Org A'
);
select is(
  (with u as (
     update factory.memberships set role = 'owner'
      where organization_id = 'aaaaaaaa-0000-0000-0000-000000000001'
        and user_id = 'a0000000-0000-0000-0000-00000000000e'
      returning 1)
   select count(*)::int from u),
  0,
  '15. owner de outra organização NÃO altera memberships da Org A'
);
select throws_ok(
  $$ insert into factory.memberships (organization_id, user_id, role, accepted_at)
     values ('aaaaaaaa-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-00000000000a', 'owner', now()) $$,
  '42501', null,
  '16. owner de outra organização NÃO se insere como owner na Org A'
);

-- ============================================================
-- E. Apagar a organização (cascade) continua possível
-- ============================================================
reset role;
select lives_ok(
  $$ delete from factory.organizations where id = 'cccccccc-0000-0000-0000-000000000001' $$,
  '17. apagar organização com owner único não é bloqueado pelo trigger (cascade)'
);

select * from finish();
rollback;

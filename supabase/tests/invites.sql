-- ============================================================
-- Testes de 0016_invites.sql
--
-- Cobre: RLS/isolamento de factory.invites, create_invite, revoke_invite,
-- accept_invite (token/estado/expiração/identidade), auditoria atômica das
-- 3 funções de convite e das 3 ações administrativas existentes convertidas
-- para RPC (update_organization_general, update_member_role, remove_member).
-- ============================================================
begin;
select plan(49);

-- ---------- Fixtures (como superusuário) ----------
insert into auth.users (id) values
  ('a1000000-0000-0000-0000-000000000001'),  -- owner Org A
  ('a1000000-0000-0000-0000-000000000002'),  -- admin Org A
  ('a1000000-0000-0000-0000-000000000003'),  -- engineer Org A
  ('b1000000-0000-0000-0000-000000000001'),  -- owner Org B (outro tenant)
  ('c1000000-0000-0000-0000-000000000001'),  -- invitee (já tem conta, ainda não é membro)
  ('c1000000-0000-0000-0000-000000000002'),  -- wrong (conta com outro e-mail)
  ('d1000000-0000-0000-0000-000000000001'),  -- owner único Org C
  ('d1000000-0000-0000-0000-000000000002');  -- admin Org C

insert into factory.users (id, email) values
  ('a1000000-0000-0000-0000-000000000001', 'owner-a@rns.test'),
  ('a1000000-0000-0000-0000-000000000002', 'admin-a@rns.test'),
  ('a1000000-0000-0000-0000-000000000003', 'eng-a@rns.test'),
  ('b1000000-0000-0000-0000-000000000001', 'owner-b@rns.test'),
  ('c1000000-0000-0000-0000-000000000001', 'invitee@rns.test'),
  ('c1000000-0000-0000-0000-000000000002', 'wrong@rns.test'),
  ('d1000000-0000-0000-0000-000000000001', 'owner-c@rns.test'),
  ('d1000000-0000-0000-0000-000000000002', 'admin-c@rns.test');

insert into factory.organizations (id, name, slug) values
  ('aa000000-0000-0000-0000-000000000001', 'Org A', 'inv-org-a'),
  ('bb000000-0000-0000-0000-000000000001', 'Org B', 'inv-org-b'),
  ('cc000000-0000-0000-0000-000000000001', 'Org C', 'inv-org-c');

insert into factory.memberships (organization_id, user_id, role, accepted_at) values
  ('aa000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'owner',    now()),
  ('aa000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002', 'admin',    now()),
  ('aa000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000003', 'engineer', now()),
  ('bb000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'owner',    now()),
  ('cc000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'owner',    now()),
  ('cc000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000002', 'admin',    now());

-- ============================================================
-- A. create_invite
-- ============================================================
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a1000000-0000-0000-0000-000000000001"}', true);

create temp table t_invite_owner as
  select * from factory.create_invite('aa000000-0000-0000-0000-000000000001', 'Novo@Membro.Test', 'engineer');

select ok((select token is not null and length(token) = 64 from t_invite_owner), '1. owner cria convite: token de 64 hex chars retornado');
select is((select email from t_invite_owner), 'novo@membro.test', '2. e-mail normalizado (lower/trim) no convite');
select is((select status from t_invite_owner), 'pending'::invite_status, '3. convite criado como pending');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a1000000-0000-0000-0000-000000000002"}', true);

select lives_ok(
  $$ select factory.create_invite('aa000000-0000-0000-0000-000000000001', 'outro@membro.test', 'viewer') $$,
  '4. admin consegue convidar com papel não-owner'
);

select throws_ok(
  $$ select factory.create_invite('aa000000-0000-0000-0000-000000000001', 'escalado@membro.test', 'owner') $$,
  null, 'sem permissão para convidar com este papel nesta organização',
  '5. admin NÃO consegue convidar com papel owner'
);

set local role authenticated;
select set_config('request.jwt.claims', '', true);

select throws_ok(
  $$ select factory.create_invite('aa000000-0000-0000-0000-000000000001', 'anon@membro.test', 'viewer') $$,
  null, 'create_invite requer um usuário autenticado',
  '6. sem claim "sub" (auth.uid() nulo) não consegue criar convite'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a1000000-0000-0000-0000-000000000003"}', true);

select throws_ok(
  $$ select factory.create_invite('aa000000-0000-0000-0000-000000000001', 'x@membro.test', 'viewer') $$,
  null, 'sem permissão para convidar com este papel nesta organização',
  '7. engineer (nem owner nem admin) não consegue convidar'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a1000000-0000-0000-0000-000000000001"}', true);

select throws_ok(
  $$ select factory.create_invite('aa000000-0000-0000-0000-000000000001', 'NOVO@membro.test', 'viewer') $$,
  null, 'já existe um convite pendente para este e-mail — revogue antes de criar outro',
  '8. convite pendente duplicado (mesmo e-mail, case-insensitive) é rejeitado'
);

select throws_ok(
  $$ select factory.create_invite('aa000000-0000-0000-0000-000000000001', 'eng-a@rns.test', 'viewer') $$,
  null, 'este e-mail já é membro da organização',
  '9. convidar e-mail que já é membro aceito é rejeitado'
);

select throws_ok(
  $$ select factory.create_invite('aa000000-0000-0000-0000-000000000001', 'nao-e-email', 'viewer') $$,
  null, 'e-mail inválido',
  '10. e-mail em formato inválido é rejeitado'
);

select is(
  (select count(*)::int from governance.audit_events
    where organization_id = 'aa000000-0000-0000-0000-000000000001' and action = 'invite.created'),
  2,
  '11. audit_event gravado para cada invite.created bem-sucedido (owner + admin)'
);

-- ============================================================
-- B. RLS de factory.invites (só SELECT, owner/admin da própria organização)
-- ============================================================
select ok(
  (select count(*)::int from factory.invites where organization_id = 'aa000000-0000-0000-0000-000000000001') > 0,
  '12. owner enxerga os convites da própria organização'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"b1000000-0000-0000-0000-000000000001"}', true);

select is(
  (select count(*)::int from factory.invites where organization_id = 'aa000000-0000-0000-0000-000000000001'),
  0,
  '13. owner de outro tenant (Org B) não enxerga convites da Org A — isolamento'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a1000000-0000-0000-0000-000000000003"}', true);

select is(
  (select count(*)::int from factory.invites where organization_id = 'aa000000-0000-0000-0000-000000000001'),
  0,
  '14. engineer (nem owner nem admin) não enxerga convites, mesmo da própria organização'
);

-- ============================================================
-- C. revoke_invite
-- ============================================================
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a1000000-0000-0000-0000-000000000002"}', true);

select lives_ok(
  $$ select factory.revoke_invite((select id from t_invite_owner)) $$,
  '15. admin revoga convite pendente criado por outro (owner) na mesma organização'
);

select is(
  (select status from factory.invites where id = (select id from t_invite_owner)),
  'revoked'::invite_status,
  '16. status do convite revogado é "revoked"'
);

select throws_ok(
  $$ select factory.revoke_invite((select id from t_invite_owner)) $$,
  null, 'apenas convites pendentes podem ser revogados',
  '17. revogar convite que já não está pendente falha'
);

-- Captura o id como superusuário (não filtrado por RLS) — simula "owner de
-- outro tenant conhece/adivinha o id do convite", não "nem enxerga a linha".
reset role;
create temp table t_invite_for_b_test as
  select * from factory.invites where organization_id = 'aa000000-0000-0000-0000-000000000001' and email = 'outro@membro.test';
grant select on t_invite_for_b_test to authenticated;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"b1000000-0000-0000-0000-000000000001"}', true);

select throws_ok(
  $$ select factory.revoke_invite((select id from t_invite_for_b_test)) $$,
  null, 'sem permissão para revogar este convite',
  '18. owner de outro tenant não revoga convite da Org A, mesmo sabendo o id'
);

-- Volta a um membro da Org A: quem checou acima (owner da Org B) não
-- enxerga audit_events da Org A via RLS — contaria 0 mesmo com o insert ok.
reset role;
select is(
  (select count(*)::int from governance.audit_events
    where organization_id = 'aa000000-0000-0000-0000-000000000001' and action = 'invite.revoked'),
  1,
  '19. audit_event gravado para invite.revoked bem-sucedido'
);

-- ============================================================
-- D. accept_invite
-- ============================================================
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a1000000-0000-0000-0000-000000000001"}', true);

create temp table t_invite_invitee as
  select * from factory.create_invite('aa000000-0000-0000-0000-000000000001', 'invitee@rns.test', 'engineer');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"c1000000-0000-0000-0000-000000000002"}', true);

select throws_ok(
  $$ select factory.accept_invite((select token from t_invite_invitee)) $$,
  null, 'este convite foi emitido para outro e-mail',
  '20. usuário com e-mail diferente do convite não consegue aceitar'
);

select is(
  (select count(*)::int from factory.memberships
    where organization_id = 'aa000000-0000-0000-0000-000000000001' and user_id = 'c1000000-0000-0000-0000-000000000002'),
  0,
  '21. tentativa de aceite com e-mail errado não cria membership'
);

set local role authenticated;
select set_config('request.jwt.claims', '', true);

select throws_ok(
  $$ select factory.accept_invite((select token from t_invite_invitee)) $$,
  null, 'accept_invite requer um usuário autenticado',
  '22. accept_invite sem sessão autenticada falha'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"c1000000-0000-0000-0000-000000000001"}', true);

select throws_ok(
  $$ select factory.accept_invite('token-que-nao-existe-em-lugar-nenhum') $$,
  null, 'convite inválido',
  '23. token inexistente é rejeitado'
);

create temp table t_membership_accepted as
  select * from factory.accept_invite((select token from t_invite_invitee));

select is((select organization_id from t_membership_accepted), 'aa000000-0000-0000-0000-000000000001'::uuid, '24. accept_invite cria membership na organização correta');
select is((select user_id from t_membership_accepted), 'c1000000-0000-0000-0000-000000000001'::uuid, '25. accept_invite cria membership para o usuário autenticado (nunca de outro)');
select is((select role from t_membership_accepted), 'engineer'::membership_role, '26. accept_invite atribui o papel definido no convite');
select isnt((select accepted_at from t_membership_accepted), null, '27. membership criada via aceite já vem com accepted_at preenchido');

-- factory.invites só é legível por owner/admin (policy "admins read
-- invites") — o próprio invitee virou engineer, não enxergaria a linha.
reset role;
select is(
  (select status from factory.invites where id = (select id from t_invite_invitee)),
  'accepted'::invite_status,
  '28. convite aceito muda de status para "accepted"'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"c1000000-0000-0000-0000-000000000001"}', true);

select throws_ok(
  $$ select factory.accept_invite((select token from t_invite_invitee)) $$,
  null, 'convite não está mais disponível',
  '29. token de convite já aceito não pode ser reutilizado (uso único)'
);

select is(
  (select count(*)::int from governance.audit_events
    where organization_id = 'aa000000-0000-0000-0000-000000000001' and action = 'invite.accepted'),
  1,
  '30. audit_event gravado para invite.accepted'
);

-- ---------- expiração ----------
reset role;
insert into factory.invites (id, organization_id, email, role, token_hash, status, invited_by, expires_at) values
  ('e1000000-0000-0000-0000-000000000001', 'aa000000-0000-0000-0000-000000000001', 'invitee@rns.test', 'viewer',
   encode(digest('token-expirado-conhecido', 'sha256'), 'hex'), 'pending', 'a1000000-0000-0000-0000-000000000001', now() - interval '1 day');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"c1000000-0000-0000-0000-000000000001"}', true);

select throws_ok(
  $$ select factory.accept_invite('token-expirado-conhecido') $$,
  null, 'convite expirado',
  '31. convite com expires_at no passado é rejeitado'
);

-- Status permanece "pending": o UPDATE seria desfeito junto com o raise da
-- própria chamada (sem autonomous transaction não dá pra persistir um e
-- abortar o outro) — accept_invite não tenta mais escrever aqui.
-- expires_at é a fonte de verdade para quem lista/decide sobre o convite.
reset role;
select is(
  (select status from factory.invites where id = 'e1000000-0000-0000-0000-000000000001'),
  'pending'::invite_status,
  '32. convite expirado permanece "pending" no banco (expires_at é a fonte de verdade, não a coluna status)'
);

-- ---------- convite vencido NÃO bloqueia novo convite para o mesmo e-mail ----------
-- (e-mail próprio: invitee@rns.test já virou membro no bloco D)
insert into factory.invites (id, organization_id, email, role, token_hash, status, invited_by, expires_at) values
  ('e1000000-0000-0000-0000-000000000003', 'aa000000-0000-0000-0000-000000000001', 'stale@rns.test', 'viewer',
   encode(digest('token-stale-vencido', 'sha256'), 'hex'), 'pending', 'a1000000-0000-0000-0000-000000000001', now() - interval '2 days');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"c1000000-0000-0000-0000-000000000001"}', true);

select is(
  (select status from factory.get_invite_preview('token-stale-vencido')),
  'expired'::invite_status,
  '32a. preview expõe o status EFETIVO: pending + expires_at no passado aparece como "expired"'
);

select set_config('request.jwt.claims', '{"sub":"a1000000-0000-0000-0000-000000000001"}', true);

select lives_ok(
  $$ select factory.create_invite('aa000000-0000-0000-0000-000000000001', 'stale@rns.test', 'viewer') $$,
  '32b. convite vencido (pending + expires_at no passado) NÃO bloqueia novo convite para o mesmo e-mail'
);

reset role;
select is(
  (select status from factory.invites where id = 'e1000000-0000-0000-0000-000000000003'),
  'expired'::invite_status,
  '32c. o convite vencido foi materializado como "expired" (UPDATE persiste: nenhum RAISE depois dele)'
);
select is(
  (select count(*)::int from factory.invites
    where organization_id = 'aa000000-0000-0000-0000-000000000001' and lower(email) = 'stale@rns.test' and status = 'pending'),
  1,
  '32d. só o novo convite fica pendente (índice único parcial preservado)'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"c1000000-0000-0000-0000-000000000001"}', true);

select throws_ok(
  $$ select factory.accept_invite('token-stale-vencido') $$,
  null, 'convite expirado',
  '32e. o token do convite vencido (já "expired") continua rejeitado com "convite expirado"'
);

-- ---------- já é membro (edge case: virou membro depois do convite ser criado) ----------
reset role;
insert into factory.invites (id, organization_id, email, role, token_hash, status, invited_by, expires_at) values
  ('e1000000-0000-0000-0000-000000000002', 'aa000000-0000-0000-0000-000000000001', 'eng-a@rns.test', 'viewer',
   encode(digest('token-ja-membro', 'sha256'), 'hex'), 'pending', 'a1000000-0000-0000-0000-000000000001', now() + interval '7 days');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a1000000-0000-0000-0000-000000000003"}', true);

select throws_ok(
  $$ select factory.accept_invite('token-ja-membro') $$,
  null, 'você já é membro desta organização',
  '33. usuário que já é membro não consegue aceitar convite duplicado para si'
);

-- ============================================================
-- E. update_organization_general / update_member_role / remove_member (RPC + auditoria)
-- ============================================================
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a1000000-0000-0000-0000-000000000001"}', true);

select lives_ok(
  $$ select factory.update_organization_general('aa000000-0000-0000-0000-000000000001', 'Org A Renomeada', 'nova descrição', null) $$,
  '34. owner atualiza dados gerais da organização via RPC'
);
select is(
  (select name from factory.organizations where id = 'aa000000-0000-0000-0000-000000000001'),
  'Org A Renomeada',
  '35. nome da organização refletido após update_organization_general'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a1000000-0000-0000-0000-000000000003"}', true);

select throws_ok(
  $$ select factory.update_organization_general('aa000000-0000-0000-0000-000000000001', 'Hack', null, null) $$,
  null, 'apenas owner ou admin podem alterar a organização',
  '36. engineer não consegue alterar dados gerais da organização'
);

select is(
  (select count(*)::int from governance.audit_events
    where organization_id = 'aa000000-0000-0000-0000-000000000001' and action = 'organization.updated'),
  1,
  '37. audit_event gravado só para a chamada bem-sucedida de update_organization_general'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a1000000-0000-0000-0000-000000000002"}', true);

select lives_ok(
  $$ select factory.update_member_role(
       (select id from factory.memberships where organization_id = 'aa000000-0000-0000-0000-000000000001' and user_id = 'a1000000-0000-0000-0000-000000000003'),
       'viewer') $$,
  '38. admin altera papel de um membro não-owner via RPC'
);

select throws_ok(
  $$ select factory.update_member_role(
       (select id from factory.memberships where organization_id = 'aa000000-0000-0000-0000-000000000001' and user_id = 'a1000000-0000-0000-0000-000000000003'),
       'owner') $$,
  null, 'apenas owner pode atribuir o papel owner ou alterar outro owner',
  '39. admin não consegue promover ninguém a owner via RPC'
);

select throws_ok(
  $$ select factory.update_member_role(
       (select id from factory.memberships where organization_id = 'aa000000-0000-0000-0000-000000000001' and user_id = 'a1000000-0000-0000-0000-000000000001'),
       'admin') $$,
  null, 'apenas owner pode atribuir o papel owner ou alterar outro owner',
  '40. admin não consegue rebaixar o owner via RPC'
);

select is(
  (select count(*)::int from governance.audit_events
    where organization_id = 'aa000000-0000-0000-0000-000000000001' and action = 'membership.role_updated'),
  1,
  '41. audit_event gravado só para a chamada bem-sucedida de update_member_role'
);

-- Próprio owner (não admin — admin nem passa da checagem de autorização da
-- função) tenta se autorrebaixar sendo o único owner: passa pela checagem
-- de autorização (actor = owner pode alterar owner) e é barrado só pelo
-- trigger memberships_protect_last_owner (0015), que roda independente de
-- SECURITY DEFINER.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"d1000000-0000-0000-0000-000000000001"}', true);

select throws_ok(
  $$ select factory.update_member_role(
       (select id from factory.memberships where organization_id = 'cc000000-0000-0000-0000-000000000001' and user_id = 'd1000000-0000-0000-0000-000000000001'),
       'admin') $$,
  null, 'último owner da organização não pode ser removido nem rebaixado',
  '42. último owner continua protegido pelo trigger de 0015 mesmo passando pela RPC'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a1000000-0000-0000-0000-000000000002"}', true);

select lives_ok(
  $$ select factory.remove_member(
       (select id from factory.memberships where organization_id = 'aa000000-0000-0000-0000-000000000001' and user_id = 'a1000000-0000-0000-0000-000000000003')) $$,
  '43. admin remove um membro não-owner via RPC'
);

select is(
  (select count(*)::int from governance.audit_events
    where organization_id = 'aa000000-0000-0000-0000-000000000001' and action = 'membership.removed'),
  1,
  '44. audit_event gravado para membership.removed'
);

select * from finish();
rollback;

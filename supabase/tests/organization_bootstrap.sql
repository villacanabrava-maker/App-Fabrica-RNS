-- ============================================================
-- Testes de factory.create_organization (0014_organization_bootstrap.sql)
--
-- Casos exigidos pela revalidação do fiscal (request_id
-- fiscal_e2e3a330b5652c9b5bb3e602) na PR #5, antes de qualquer merge.
-- ============================================================
begin;
select plan(17);

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

-- Captura o id real da organização A enquanto ainda é visível (dono:
-- role "authenticated", sem depender de qual claim "sub" está ativo —
-- tabela temporária não é filtrada por RLS). Usado no teste 8: o
-- ataque simulado é "usuário B conhece/adivinha o id de uma org que
-- não é dele", não "usuário B tenta inserir um id que nem sequer
-- consegue enxergar" — este segundo cenário testaria só a visibilidade
-- via SELECT (já coberto no teste de isolamento), não a defesa real de
-- WITH CHECK em INSERT.
create temp table t_org_a as
  select id from factory.organizations where slug = 'org-bootstrap-a';

-- ---------- 2. usuário anônimo/não autenticado não executa a função (2 casos) ----------
-- `anon` não tem `USAGE` no schema `factory` (0009_rls_policies.sql,
-- "nunca concedido a anon: nenhuma policy deste arquivo é to anon") —
-- bloqueado antes mesmo de a função rodar, com 42501 genérico de
-- schema. Achado ao rodar `supabase test db` no Database CI: a
-- expectativa original deste teste (a mensagem customizada da função)
-- nunca é alcançada por um `anon` de verdade, porque o GRANT já barra
-- antes. Corrigido para o erro real, e complementado pelo caso que a
-- checagem interna da função de fato protege: um chamador com o
-- privilégio de `authenticated` mas sem claim "sub" no JWT (auth.uid()
-- nulo) — cenário que a Data API pode produzir e que `anon` sozinho
-- não exercita.
set local role anon;
select set_config('request.jwt.claims', '', true);

select throws_ok(
  $$ select factory.create_organization('Organização Anônima', 'org-anon') $$,
  '42501', null,
  'anon não tem USAGE no schema factory — bloqueado antes de qualquer policy ou função'
);

set local role authenticated;
select set_config('request.jwt.claims', '', true);

select throws_ok(
  $$ select factory.create_organization('Organização Sem Claim', 'org-sem-claim') $$,
  null, 'create_organization requer um usuário autenticado',
  'authenticated sem claim "sub" (auth.uid() nulo) não consegue criar organização — guard interno da função'
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

-- ---------- 3b. mesmo usuário pode criar uma segunda organização (achado do fiscal) ----------
-- fiscal_7aefb81016cdbd4594cd9ee2: o cabeçalho da migration dizia "só a
-- primeira organização", mas nada no código impunha isso. Em vez de
-- adicionar uma restrição não pedida por nenhuma decisão de produto
-- canônica, corrigimos o comentário para descrever o comportamento real
-- — e este teste trava esse comportamento real, para não regredir em
-- silêncio se algum dia uma migration futura tentar impor um limite sem
-- atualizar este teste.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-0000-0000-0000-000000000001"}', true);

select lives_ok(
  $$ select factory.create_organization('Organização A2', 'org-bootstrap-a2') $$,
  'usuário que já é owner de uma organização pode criar uma segunda — sem limite imposto pela função'
);

select is(
  (select role from factory.memberships m join factory.organizations o on o.id = m.organization_id
    where o.slug = 'org-bootstrap-a2'),
  'owner'::membership_role,
  'usuário vira owner também da segunda organização, independente da primeira'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"22222222-0000-0000-0000-000000000002"}', true);

-- ---------- 4. autoelevação em organização já existente continua bloqueada ----------
-- ★ Achado ao rodar `supabase test db` no Database CI: a versão
-- original deste teste buscava o organization_id via
-- `select ... from factory.organizations where slug = ...`, mas essa
-- leitura já é filtrada pela policy "members read own organization" —
-- para o usuário B, org A é invisível, então o SELECT retornava 0
-- linhas e o INSERT inseria 0 linhas: nenhuma exceção porque não havia
-- linha nenhuma para violar o WITH CHECK, não porque a defesa
-- funcionou. Corrigido para usar o id capturado em `t_org_a` (tabela
-- temporária, não sujeita a RLS) — simula o cenário real que a policy
-- "admins manage memberships" precisa cobrir: usuário B CONHECE (ou
-- adivinha) o id de uma organização que não é dele.
select throws_ok(
  $$ insert into factory.memberships (organization_id, user_id, role, accepted_at)
     select id, '22222222-0000-0000-0000-000000000002', 'owner', now()
     from t_org_a $$,
  '42501', null,
  'usuário B não consegue se autoelevar a owner da organização A por insert direto, mesmo sabendo o id — só via função'
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

-- ---------- 7. rollback real: falha no 2º insert não deixa organização órfã ----------
-- Achado do fiscal (fiscal_2188a6de173e86bda01b65f5): a atomicidade era
-- afirmada (plpgsql sem exception handler → transação da própria
-- chamada desfaz tudo) mas nunca testada — nenhum caso existente
-- provocava falha no 2º insert (memberships). Cenário real que produz
-- essa falha: auth.uid() aponta para um usuário que existe em
-- auth.users mas não tem espelho em factory.users (inconsistência
-- entre as duas tabelas, ou uma corrida entre trigger de signup e
-- criação da organização) — memberships.user_id referencia
-- factory.users(id), então o insert da membership viola a FK.
--
-- reset role antes do insert: `authenticated` (papel ainda em efeito do
-- teste 11) não tem privilégio de escrita em auth.users — só o papel de
-- conexão do próprio teste (o mesmo usado nos inserts do topo do
-- arquivo, antes de qualquer "set local role") consegue.
reset role;
insert into auth.users (id) values ('33333333-0000-0000-0000-000000000003');
-- deliberadamente SEM insert correspondente em factory.users

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"33333333-0000-0000-0000-000000000003"}', true);

select throws_ok(
  $$ select factory.create_organization('Organização Órfã', 'org-rollback-test') $$,
  '23503', null,
  'auth.uid() sem linha em factory.users falha por FK na membership — não por guard da função'
);

-- reset role: volta ao papel de conexão do teste (bypassa RLS) para
-- provar que não sobrou organização órfã — um usuário nesta condição
-- não enxergaria a org via RLS de qualquer forma, então checar "pelos
-- olhos" desse usuário não provaria rollback nenhum.
reset role;

select is(
  (select count(*)::int from factory.organizations where slug = 'org-rollback-test'),
  0,
  'falha no insert da membership desfaz também o insert da organização — sem órfã'
);

-- ---------- 8. ACL efetiva no catálogo (não só o texto do GRANT/REVOKE) ----------
-- Achado do fiscal: os DDLs de revoke/grant provam intenção, não o
-- estado efetivo após todas as 14 migrations aplicadas em sequência —
-- alguma migration anterior poderia, em tese, ter concedido EXECUTE de
-- volta a PUBLIC/anon sem ninguém notar. has_function_privilege() lê o
-- catálogo de verdade (pg_proc/pg_authid via ACL), não texto de SQL.
select ok(
  not has_function_privilege('anon', 'factory.create_organization(text, text)', 'EXECUTE'),
  'anon não tem EXECUTE em create_organization (prova que PUBLIC também não tem — anon nunca recebeu grant direto)'
);

select ok(
  has_function_privilege('authenticated', 'factory.create_organization(text, text)', 'EXECUTE'),
  'authenticated tem EXECUTE em create_organization'
);

select * from finish();
rollback;

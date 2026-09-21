-- ============================================================
-- Testes de invariante estrutural
-- Rodar com: supabase test db
--
-- Estes testes provam que as garantias centrais da fábrica
-- são aplicadas pelo BANCO, não apenas pelo código.
-- ============================================================
begin;
select plan(8);

-- Fixtures
insert into factory.organizations (id, name, slug)
values ('11111111-1111-1111-1111-111111111111','Org Teste','org-teste');

insert into auth.users (id) values ('22222222-2222-2222-2222-222222222222');
insert into factory.users (id, email) values
  ('22222222-2222-2222-2222-222222222222','humano@rns.test');

insert into factory.apps (id, organization_id, name, slug) values
  ('55555555-5555-5555-5555-555555555555','11111111-1111-1111-1111-111111111111','App','app');

insert into workflow.tasks (id, organization_id, app_id, title, kind) values
  ('66666666-6666-6666-6666-666666666666','11111111-1111-1111-1111-111111111111',
   '55555555-5555-5555-5555-555555555555','Tarefa','implement');

-- ★ TESTE 1: um agente NÃO consegue gravar uma aprovação.
-- Esta é a garantia central da Fábrica Apps RNS.
select throws_ok(
  $$ insert into governance.approvals
       (organization_id, subject_type, subject_id, subject_sha,
        decision, actor_type, actor_id)
     values ('11111111-1111-1111-1111-111111111111','stage',
             gen_random_uuid(), repeat('a',40), 'approved',
             'agent','22222222-2222-2222-2222-222222222222') $$,
  '23514',
  null,
  'agente NAO consegue gravar aprovacao'
);

-- TESTE 2: um humano consegue.
select lives_ok(
  $$ insert into governance.approvals
       (organization_id, subject_type, subject_id, subject_sha,
        decision, actor_type, actor_id)
     values ('11111111-1111-1111-1111-111111111111','stage',
             gen_random_uuid(), repeat('a',40), 'approved',
             'human','22222222-2222-2222-2222-222222222222') $$,
  'humano consegue gravar aprovacao'
);

-- TESTE 3: rejeitar exige justificativa.
select throws_ok(
  $$ insert into governance.approvals
       (organization_id, subject_type, subject_id, subject_sha,
        decision, actor_type, actor_id)
     values ('11111111-1111-1111-1111-111111111111','stage',
             gen_random_uuid(), repeat('a',40), 'rejected',
             'human','22222222-2222-2222-2222-222222222222') $$,
  '23514', null,
  'rejeicao sem justificativa e bloqueada'
);

-- ★ TESTE 4: o ciclo de revisão tem no máximo quatro passagens.
select throws_ok(
  $$ insert into review.review_cycles
       (organization_id, subject_type, subject_id, subject_sha, current_round)
     values ('11111111-1111-1111-1111-111111111111','stage',
             gen_random_uuid(), repeat('a',40), 5) $$,
  '23514', null,
  'round 5 e rejeitado — o ciclo termina em 4'
);

-- ★ TESTE 5: preview pair só fica pronto com AMBOS os ambientes.
insert into integration.repositories (id, organization_id, owner, name) values
  ('33333333-3333-3333-3333-333333333333','11111111-1111-1111-1111-111111111111','RNS','app');
insert into integration.pull_requests (id, organization_id, repository_id, number, kind) values
  ('44444444-4444-4444-4444-444444444444','11111111-1111-1111-1111-111111111111',
   '33333333-3333-3333-3333-333333333333', 1, 'execution');

select throws_ok(
  $$ insert into integration.preview_environments
       (organization_id, pull_request_id, supabase_ready, vercel_ready, pair_ready)
     values ('11111111-1111-1111-1111-111111111111',
             '44444444-4444-4444-4444-444444444444', true, false, true) $$,
  '23514', null,
  'pair_ready exige supabase_ready E vercel_ready'
);

-- TESTE 6: idempotência de jobs.
insert into workflow.jobs (organization_id, kind, payload, max_attempts, idempotency_key)
values ('11111111-1111-1111-1111-111111111111','test','{}'::jsonb,3,'chave-unica');

select throws_ok(
  $$ insert into workflow.jobs
       (organization_id, kind, payload, max_attempts, idempotency_key)
     values ('11111111-1111-1111-1111-111111111111','test','{}'::jsonb,3,'chave-unica') $$,
  '23505', null,
  'idempotency_key duplicada e rejeitada'
);

-- TESTE 7: tarefa não depende de si mesma.
select throws_ok(
  $$ insert into workflow.task_dependencies (task_id, depends_on_task_id)
     values ('66666666-6666-6666-6666-666666666666',
             '66666666-6666-6666-6666-666666666666') $$,
  '23514', null,
  'auto-dependencia de tarefa e rejeitada'
);

-- ★ TESTE 8: meta-revisão obrigatória a partir da rodada 2.
insert into review.review_cycles (id, organization_id, subject_type, subject_id, subject_sha)
values ('77777777-7777-7777-7777-777777777777','11111111-1111-1111-1111-111111111111',
        'stage', gen_random_uuid(), repeat('a',40));

select throws_ok(
  $$ insert into review.review_rounds
       (review_cycle_id, round_number, runtime, role_id,
        input_sha, comments_on_prior_work)
     values ('77777777-7777-7777-7777-777777777777', 2, 'anthropic', 'R5',
             repeat('b',64), false) $$,
  '23514', null,
  'rodada 2 sem meta-revisao e rejeitada'
);

select * from finish();
rollback;

-- ============================================================
-- Testes da fila durável (pgmq / Supabase Queues)
--
-- Prova que a fila workflow_jobs existe e que o ciclo básico de
-- mensageria funciona: enviar, ler, arquivar. O consumo real pelo
-- Orchestrator Worker (lease, retry, dead letter) é Sprint 1.4 — este
-- arquivo testa só a infraestrutura entregue no Sprint 1.1.
-- ============================================================
begin;
select plan(4);

select ok(
  exists(select 1 from pgmq.list_queues() where queue_name = 'workflow_jobs'),
  'a fila workflow_jobs existe'
);

select isnt(
  (select pgmq.send('workflow_jobs', '{"job_id":"11111111-1111-1111-1111-111111111111"}'::jsonb)),
  null,
  'pgmq.send enfileira uma mensagem e retorna um msg_id'
);

select is(
  (select count(*)::int from pgmq.read('workflow_jobs', 30, 10)),
  1,
  'pgmq.read entrega a mensagem enfileirada dentro da janela de visibilidade'
);

select ok(
  (select pgmq.archive('workflow_jobs', msg_id) from pgmq.read('workflow_jobs', 0, 1)),
  'pgmq.archive aceita a mensagem lida'
);

select * from finish();
rollback;

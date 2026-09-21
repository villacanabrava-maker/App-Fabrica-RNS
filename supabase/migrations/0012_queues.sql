-- ============================================================
-- 0012 — Fila durável (pgmq / Supabase Queues)
--
-- Item do checklist do Sprint 1.1 (docs/08-PLANO-DE-IMPLEMENTACAO/
-- 02-FASE-1-APP-FUNCIONAL.md) apontado como ausente por revisão técnica.
--
-- pgmq entrega a notificação "há trabalho" com janela de visibilidade;
-- o estado durável do job — dono do lease, tentativas, idempotency_key —
-- continua em workflow.jobs (0003_workflow.sql). Ver
-- docs/02-ARQUITETURA/03-ARQUITETURA-BACKEND.md §5: "isso não substitui
-- handlers idempotentes — uma operação externa pode ter sido executada
-- logo antes da falha do consumidor."
--
-- O consumo real (Orchestrator Worker lendo esta fila) é Sprint 1.4.
-- Esta migration entrega só a infraestrutura: extensão, fila e os
-- privilégios corretos — nada além disso, para não fingir uma Fase 1.4
-- que ainda não existe.
-- ============================================================

create extension if not exists pgmq;

select pgmq.create('workflow_jobs');

-- pgmq cria suas próprias tabelas no schema `pgmq` (pgmq.q_workflow_jobs,
-- pgmq.a_workflow_jobs). Esse schema nunca é coberto pelos GRANT amplos
-- de 0009_rls_policies.sql (que só cobrem factory/workflow/agents/review/
-- governance/integration) — então authenticated e anon já ficam sem
-- acesso por padrão. Não expor via "Expose Queues via PostgREST": só o
-- Orchestrator Worker, com a service key, lê e escreve nesta fila.

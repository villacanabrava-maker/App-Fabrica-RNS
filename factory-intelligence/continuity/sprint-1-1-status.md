# Status do Sprint 1.1 — registro de continuidade

Classe de conhecimento: continuidade (append/reconcile — ver Artigo 12 da Constituição e a taxonomia de quatro classes em `docs/02-ARQUITETURA/01-ARQUITETURA-DO-SISTEMA.md`). Este documento existe porque a PR #2 foi descrita como "Sprint 1.1" antes de toda a evidência exigida pelo checklist do próprio plano estar reunida — a fiscalização técnica corrigiu essa afirmação. Este arquivo é o registro canônico do que está feito, com evidência, e do que falta.

Checklist original: `docs/08-PLANO-DE-IMPLEMENTACAO/02-FASE-1-APP-FUNCIONAL.md`, Sprint 1.1.

## Feito, com evidência verificável

| Item do checklist | Evidência |
|---|---|
| Monorepo com pnpm workspaces | `pnpm-workspace.yaml`, `package.json` raiz |
| `apps/control-plane` (Next.js App Router, TS estrito) | builda limpo (`pnpm build`), typecheck limpo |
| `apps/orchestrator-worker` (processo externo) | skeleton, builda e roda |
| Os 15 `packages/*` da arquitetura | todos com `package.json` + typecheck limpo |
| Schemas Postgres, tipos enum, tabelas | `supabase/migrations/0001`–`0008` (fusão anterior) |
| RLS + policies positivas e de negação | `supabase/migrations/0009`, testes em `supabase/tests/rls_apps.sql` |
| `approvals_must_be_human` | `supabase/migrations/0006`, teste em `supabase/tests/invariants.sql` |
| Constraints de idempotência e limite de rodada | `supabase/migrations/0003`, `0005`; testados |
| Índices essenciais | presentes nas migrations 0002–0008 |
| Filas pgmq | `supabase/migrations/0012_queues.sql` (esta correção), teste em `supabase/tests/queues.sql` — só a infraestrutura (extensão + fila); consumo real é Sprint 1.4 |
| `supabase test db` rodando em CI de verdade | `.github/workflows/database-ci.yml`, corrigido na PR #1 para não ficar `skipped` |
| Máquinas de estado puras, testadas | `packages/state-machines`, 21 testes |
| Policy engine puro, testado | `packages/policy-engine`, 42 testes |

## Pendente — não fazer parte desta PR, cada um por um motivo específico

| Item | Por que não está nesta PR | O que resolve |
|---|---|---|
| Projeto Factory Supabase real (hospedado) | Exige credenciais/conta que este agente não tem e não deve solicitar | Ação humana: criar o projeto e configurar `SUPABASE_*` conforme `.env.example` |
| Ruleset de branch protection em `main` | Configuração de repositório GitHub, fora do diff de código; decisão de quais checks são obrigatórios é do dono do repositório | Ação humana no GitHub (Settings → Rules) |
| `scripts/intelligence/{validate-schemas,validate-registry,build-projections,check-drift,validate-fixtures,run-evals}.ts` | Entregáveis da **Fase 0** (`docs/08-PLANO-DE-IMPLEMENTACAO/01-PLANO-MESTRE-DE-IMPLEMENTACAO.md` §3), fase distinta da Fase 1 e nunca no checklist do Sprint 1.1 — não é um corte de escopo desta correção, é uma lacuna pré-existente e maior, sinalizada aqui para não ficar escondida atrás do guard de CI que a torna `skipped` | Vira uma entrega própria, do tamanho de um sprint, não um item avulso desta correção |

## Conclusão sobre o rótulo "Sprint 1.1"

Com a correção acima, todo item do checklist do Sprint 1.1 que é código deste repositório está feito e testado. Os dois itens pendentes (projeto Supabase real, ruleset) são infraestrutura/configuração fora do controle deste agente — não bugs, não escopo esquecido. A Fase 0 (scripts/intelligence) é trabalho separado e maior, não uma tarefa do Sprint 1.1.

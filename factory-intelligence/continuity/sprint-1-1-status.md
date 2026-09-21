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
| Filas pgmq | `supabase/migrations/0013_queues.sql` (esta correção; renumerada de 0012 para 0013 após colisão com `0012_agent_bridge_ledger.sql`, trazida pelo merge da PR #4 — ver nota abaixo), teste em `supabase/tests/queues.sql` — só a infraestrutura (extensão + fila); consumo real é Sprint 1.4 |
| `supabase test db` rodando em CI de verdade | `.github/workflows/database-ci.yml`, corrigido na PR #1 para não ficar `skipped` |
| Máquinas de estado puras, testadas | `packages/state-machines`, 21 testes |
| Policy engine puro, testado | `packages/policy-engine`, 42 testes |

## Pendente — não fazer parte desta PR, cada um por um motivo específico

| Item | Por que não está nesta PR | O que resolve |
|---|---|---|
| Projeto Factory Supabase real (hospedado) — alinhamento do schema com as migrations desta PR | Projeto existe e está `ACTIVE_HEALTHY` (confirmado, ver nota abaixo), mas só tem `agent_bridge_ledger` aplicada — aplicar `0001`–`0013` é ação de infraestrutura/rollout deliberado, fora do meu mandato de escrever e testar migrations | Ação humana/fiscal: aplicar as migrations desta PR no projeto `lwjhekfwlnqncxwureda` na ordem e momento corretos |
| Ruleset de branch protection em `main` | Configuração de repositório GitHub, fora do diff de código; decisão de quais checks são obrigatórios é do dono do repositório | Ação humana no GitHub (Settings → Rules) |
| `scripts/intelligence/{validate-schemas,validate-registry,build-projections,check-drift,validate-fixtures,run-evals}.ts` | Entregáveis da **Fase 0** (`docs/08-PLANO-DE-IMPLEMENTACAO/01-PLANO-MESTRE-DE-IMPLEMENTACAO.md` §3), fase distinta da Fase 1 e nunca no checklist do Sprint 1.1 — não é um corte de escopo desta correção, é uma lacuna pré-existente e maior, sinalizada aqui para não ficar escondida atrás do guard de CI que a torna `skipped` | Vira uma entrega própria, do tamanho de um sprint, não um item avulso desta correção |
| `scripts/db/{test-rollback,assert-rls-enabled,assert-invariants}.ts` | Documentados em `docs/07-QUALIDADE/02-CI-CD.md` e no checklist de segurança, mas nunca no checklist do Sprint 1.1 nem escritos em nenhuma fase — precisam de lógica real de inspeção de banco (reverter migrations de verdade, ler `pg_catalog`/`pg_policies` para RLS, checar constraints específicas), não são um mock. Descoberto ao corrigir o guard de CI de `database-ci.yml` (ver nota abaixo): o guard checava só `package.json`, que já existe desde o Sprint 1.1, então tentava rodar esses scripts inexistentes e quebrava com `ERR_MODULE_NOT_FOUND` — mesma classe de bug já corrigida em `intelligence-ci.yml` | Escrever os três scripts como entrega própria; até lá, o guard corrigido volta a marcar esses passos como pulados-de-verdade (`::notice::`), não escondidos atrás de um green falso |

## Nota — projeto Supabase hospedado: identidade confirmada, alinhamento de schema pendente

Atualização (revalidação do fiscal sobre o head `f07aa42`): o fiscal
respondeu ao pedido de identificação exata feito na nota anterior deste
arquivo, com:

- name: `App Fabrica RNS`
- project ref / id: `lwjhekfwlnqncxwureda`
- organization_id: `iicymqndbjifbowxnueh`
- region: `us-east-1`
- PostgreSQL: 17
- status: `ACTIVE_HEALTHY`

Confirmei de forma independente com `mcp__Supabase__get_project(id:
"lwjhekfwlnqncxwureda")` nesta sessão — retornou os mesmos dados
(`ACTIVE_HEALTHY`, `us-east-1`, PG 17.6.1.166). **O projeto existe e é
real.** A divergência anterior (`mcp__Supabase__list_projects` nesta
sessão não listava este projeto entre os 7 retornados) fica registrada
como um limite de escopo/conta da conexão Supabase desta sessão — o
lookup direto por ID funciona mesmo quando a listagem não o inclui,
então a conexão do Claude Code parece ter acesso a este projeto por ID
sem ele aparecer no `list_projects` desta sessão. Não investiguei a causa
exata (diferença de organização/permissão vs. escopo do listing); não é
um bloqueio para nenhum trabalho desta PR.

**Pendência real que fica, segundo o próprio fiscal:** o projeto hospedado
ainda não está alinhado ao schema completo desta PR. No histórico de
migrations visível ao fiscal, consta hoje só `agent_bridge_ledger`
(`20260921041330`, aplicada pela trilha de integração/fiscal — é a mesma
migration que chegou nesta branch via merge de `main`, PR #4). **Não
aplicar as migrations desta PR (`0001`–`0013`) no projeto hospedado antes
de validação/ordenação deliberada do rollout** — meu papel aqui continua
sendo só escrever e testar as migrations localmente/via CI; aplicar no
projeto real hospedado é ação de infraestrutura fora do meu mandato.

(Verificação independente desta sessão, 2026-09-21: chamei
`mcp__Supabase__get_project(id: "lwjhekfwlnqncxwureda")` de novo e recebi
exatamente os mesmos dados — `ACTIVE_HEALTHY`, `us-east-1`, PG
17.6.1.166, `organization_id: iicymqndbjifbowxnueh`. Confirma o que está
acima; nada a corrigir aqui.)

## Conclusão sobre o rótulo "Sprint 1.1"

Com a correção acima, todo item do checklist do Sprint 1.1 que é código deste repositório está feito e testado. Os itens pendentes (schema aplicado no Supabase hospedado, ruleset) são infraestrutura/configuração fora do controle deste agente — não bugs, não escopo esquecido. A Fase 0 (scripts/intelligence) é trabalho separado e maior, não uma tarefa do Sprint 1.1.

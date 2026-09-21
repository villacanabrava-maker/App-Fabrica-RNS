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
| Projeto Factory Supabase real (hospedado) — inicialização/alinhamento com as migrations desta PR | Ver nota abaixo: há uma divergência não resolvida entre a fiscalização e a verificação direta deste agente sobre se o projeto já existe | Ver nota abaixo |
| Ruleset de branch protection em `main` | Configuração de repositório GitHub, fora do diff de código; decisão de quais checks são obrigatórios é do dono do repositório | Ação humana no GitHub (Settings → Rules) |
| `scripts/intelligence/{validate-schemas,validate-registry,build-projections,check-drift,validate-fixtures,run-evals}.ts` | Entregáveis da **Fase 0** (`docs/08-PLANO-DE-IMPLEMENTACAO/01-PLANO-MESTRE-DE-IMPLEMENTACAO.md` §3), fase distinta da Fase 1 e nunca no checklist do Sprint 1.1 — não é um corte de escopo desta correção, é uma lacuna pré-existente e maior, sinalizada aqui para não ficar escondida atrás do guard de CI que a torna `skipped` | Vira uma entrega própria, do tamanho de um sprint, não um item avulso desta correção |

## Nota — divergência sobre o projeto Supabase hospedado (aberta, não resolvida)

Revalidação do fiscal (comentário na PR #2, após `b083cc3`) apontou esta
tabela como desatualizada: segundo o fiscal, o projeto hospedado "App
Fabrica RNS" já existe e é acessível a ele — o que faltaria é inicializar/
alinhar o schema hospedado com as migrations aprovadas, não criar o
projeto do zero.

Antes de reescrever a linha acima para afirmar isso, verifiquei
diretamente: `mcp__Supabase__list_projects` nesta sessão retorna 7
projetos, nenhum com nome ou referência que combine com "Fábrica Apps
RNS"/"fabricarns" — são projetos de um domínio completamente diferente
("Projeto Memoria Celebro App", "App Reflex 02", "reflexao-pessoal",
"memoria-reflexiva-dev", "Biblioteca-Celebro-Reflex-es-",
"Celebro-Biblioteca-Cloude", "reflex-01").

Não vou reescrever esta tabela para afirmar que o projeto existe sem
conseguir apontar para ele — seria trocar uma imprecisão por outra. As
duas hipóteses continuam em aberto: (a) o fiscal enxerga um projeto sob
uma conta/organização Supabase diferente da que esta sessão tem
conectada, ou (b) o projeto ainda não existe e a leitura do fiscal está
equivocada. Pedido ao fiscal, via comentário na PR: o `project ref` (ou
`organization_id`) exato do projeto "App Fabrica RNS", para eu confirmar
com `mcp__Supabase__get_project` antes de qualquer alinhamento de schema.

## Conclusão sobre o rótulo "Sprint 1.1"

Com a correção acima, todo item do checklist do Sprint 1.1 que é código deste repositório está feito e testado. Os dois itens pendentes (projeto Supabase real, ruleset) são infraestrutura/configuração fora do controle deste agente — não bugs, não escopo esquecido. A Fase 0 (scripts/intelligence) é trabalho separado e maior, não uma tarefa do Sprint 1.1.

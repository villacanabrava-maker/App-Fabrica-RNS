# Matriz de Rastreabilidade

Herdada e atualizada a partir da Pasta Mãe Mestre v1.0, reconciliada com a numeração de fases e páginas da Documentação Mestre (este pacote).

Esta matriz liga capacidade, arquitetura, interface, fase e prova. IDs de capacidade (`CAP-nn`) devem acompanhar épicos, Task Packets, PRs e evidências — é assim que uma capacidade sai de "documentada" para `DONE`.

| ID | Capacidade | Arquitetura/contrato | Página | Fase | Evidência de aceite |
|---|---|---|---|---:|---|
| CAP-01 | Identidade e organização | Supabase, RBAC/RLS (`docs/05-SEGURANCA/`) | Configurações | F0–F1 | Testes cross-tenant e de membership |
| CAP-02 | Projeto e spec versionada | Domínio, API commands (`docs/02-ARQUITETURA/07-CONTRATOS-E-APIS.md`) | Projetos (lista/wizard/detalhe) | F1 | E2E create→approve + audit |
| CAP-03 | Missão/tarefa/DAG | Orchestrator, máquinas de estado (`docs/02-ARQUITETURA/05-MAQUINAS-DE-ESTADO.md`) | Detalhe do Projeto / Orquestração | F1–F2 | Ciclo rejeitado e dependência válida |
| CAP-04 | Queue/lease/retry | Backend, eventos (`docs/02-ARQUITETURA/03-ARQUITETURA-BACKEND.md`, `06-ARQUITETURA-DE-EVENTOS.md`) | Monitoramento | F2 | Crash/duplicação/fault injection |
| CAP-05 | Task Packet/output | JSON Schemas (`factory-intelligence/schemas/`) | Execução / Detalhe do Projeto | F2 | Validação positiva e negativa contra schema |
| CAP-06 | Primeiro agente real | AgentAdapter / Intelligence Core (`packages/contracts/agent-adapter.ts`) | Agentes de IA / Detalhe do Agente | F3 | Eval + run/commit reproduzível |
| CAP-07 | GitHub branch/PR/check | GitHub adapter (`docs/04-PLATAFORMAS/02-GITHUB.md`) | Projeto / Código | F3–F4 | PR no SHA e escopo corretos |
| CAP-08 | Review/findings/evidence | Review Engine/schemas (`docs/06-INTELIGENCIA-DOS-AGENTES/04-PROTOCOLO-REVISAO-DUPLA.md`) | Aprovações / Câmara de Revisão | F4 | Finding crítico bloqueia o gate |
| CAP-09 | Preview/release/rollback | Vercel + máquina de estados (`docs/04-PLATAFORMAS/03-VERCEL.md`) | Projeto / Preview | F4 | SHA→preview→staging→rollback |
| CAP-10 | Revisão multiagente completa | Adapters + handoff (`factory-intelligence/schemas/handoff.schema.json`) | Câmara de Revisão / Orquestração | F5 | Quatro passagens no máximo + desacordo registrado |
| CAP-11 | Conhecimento/skills | Intelligence Core (`docs/06-INTELIGENCIA-DOS-AGENTES/03-SKILLS.md`) | Base de Conhecimento / Templates | F5 | Snapshot por hash e promoção testada |
| CAP-12 | Budgets/custos | Policy/usage (`factory-intelligence/registry/permissions.yaml`) | Dashboard / Monitoramento | F2–F6 | Bloqueio por budget e reconciliação |
| CAP-13 | Integrações | Ports/adapters/webhooks (`docs/03-PAGINAS/07-INTEGRACOES.md`) | Integrações | F3–F6 | Connect/health/revoke/replay |
| CAP-14 | Observabilidade/audit | Contratos de evento/log/trace (`docs/07-QUALIDADE/04-OBSERVABILIDADE.md`) | Monitoramento | F2–F6 | Busca completa por correlation id |
| CAP-15 | Segurança/privacidade/DR | Threat model/runbooks (`docs/05-SEGURANCA/04-RISCOS-E-MITIGACOES.md`) | Configurações | F0–F6 | Abuse tests + exercício de restore |
| CAP-16 | Sistema visual final | Frontend/tokens (`design-system/tokens.json`, `docs/02-ARQUITETURA/08-DESIGN-SYSTEM-RNS.md`) | Todas | F7 | Regressões visual/a11y/performance |

## Regra de fechamento

Uma capacidade fica `DONE` apenas quando a evidência indicada está anexada ao commit/release correto. Documentação ou demo sem resultado verificável não fecha a capacidade — consistente com o Artigo 4 da Constituição (`factory-intelligence/constitution/CONSTITUTION.md`): evidência antes de afirmação.

## Como usar esta matriz

- Ao abrir um épico ou Task Packet, referencie o `CAP-nn` correspondente.
- Ao revisar um PR que alega fechar uma capacidade, exija o tipo de evidência listado na última coluna — não uma descrição textual do que foi feito.
- Ao planejar uma fase (`docs/08-PLANO-DE-IMPLEMENTACAO/`), verifique que toda capacidade marcada para aquela fase tem página e contrato já especificados; se não tiver, a fase não está pronta para começar.

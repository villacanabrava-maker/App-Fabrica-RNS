# Índice Geral

Pacote Mestre de Construção da Fábrica Apps RNS · versão 2.0 (fusão) · 21/09/2026

---

## Mapa rápido — o que você pediu e onde está

| Pedido | Documento |
|---|---|
| Documento mãe explicando todo o aplicativo | `01-PRODUTO/01-DOCUMENTO-MESTRE-DO-APLICATIVO.md` |
| Planejamento do aplicativo | `01-PRODUTO/02-PRODUCT-SPEC.md` + `08-PLANO-DE-IMPLEMENTACAO/` |
| Planejamento de construção do back-end | `02-ARQUITETURA/03-ARQUITETURA-BACKEND.md` |
| Planejamento de construção do front-end | `02-ARQUITETURA/02-ARQUITETURA-FRONTEND.md` |
| Explicação só do front-end | `02-ARQUITETURA/02-ARQUITETURA-FRONTEND.md` + `08-DESIGN-SYSTEM-RNS.md` |
| Explicação só do back-end | `02-ARQUITETURA/03` a `07` |
| Página Início | `03-PAGINAS/01-INICIO.md` |
| Página Projetos | `03-PAGINAS/02-PROJETOS.md` |
| Página Agentes de IA | `03-PAGINAS/03-AGENTES-DE-IA.md` |
| Página Orquestração | `03-PAGINAS/04-ORQUESTRACAO.md` |
| Página Base de Conhecimento | `03-PAGINAS/05-BASE-DE-CONHECIMENTO.md` |
| Página Templates | `03-PAGINAS/06-TEMPLATES.md` |
| Página Integrações | `03-PAGINAS/07-INTEGRACOES.md` |
| Página Monitoramento | `03-PAGINAS/08-MONITORAMENTO.md` |
| Página Configurações | `03-PAGINAS/09-CONFIGURACOES.md` |
| Como funciona cada ícone | Seção 4 de cada documento em `03-PAGINAS/` |
| Sistema de segurança | `05-SEGURANCA/` |
| Como vai funcionar o Supabase | `04-PLATAFORMAS/01-SUPABASE.md` |
| Como vai funcionar o GitHub | `04-PLATAFORMAS/02-GITHUB.md` |
| Como vai funcionar o Vercel | `04-PLATAFORMAS/03-VERCEL.md` |
| Integração de todos eles | `04-PLATAFORMAS/06-INTEGRACAO-ENTRE-TODOS.md` |
| Passagem de inteligência entre agentes | `06-INTELIGENCIA-DOS-AGENTES/04` e `05` |
| Base de código | raiz do repositório: `factory-intelligence/`, `supabase/`, `packages/contracts/`, `design-system/` |
| Plano de implementação (app primeiro, agentes depois, visual por último) | `08-PLANO-DE-IMPLEMENTACAO/01-PLANO-MESTRE-DE-IMPLEMENTACAO.md` |
| Prompts personalizados Antigravity + ChatGPT + Claude Code | `09-PROMPTS/` |
| Checklists e Definition of Done | `10-CHECKLISTS/` + `08-PLANO-DE-IMPLEMENTACAO/05` |

---

## Árvore completa

### `00-COMECE-AQUI/`

| Arquivo | Conteúdo |
|---|---|
| `00-LEIA-PRIMEIRO.md` | Porta de entrada: o que é o pacote, as 5 verdades, a ordem de construção, a origem da fusão |
| `01-INDICE-GERAL.md` | Este índice |
| `02-GLOSSARIO.md` | Vocabulário canônico: entidades, papéis, estados, segurança |
| `03-COMO-USAR-ESTE-PACOTE.md` | Roteiro de leitura para operador, programador e agente |
| `04-MATRIZ-DE-RASTREABILIDADE.md` | Capacidade → arquitetura → página → fase → evidência de aceite (herdada da Pasta Mãe Mestre) |
| `05-MANIFESTO-DO-PACOTE.md` | Inventário e integridade do pacote fundido |

### `01-PRODUTO/`

| Arquivo | Conteúdo |
|---|---|
| `01-DOCUMENTO-MESTRE-DO-APLICATIVO.md` | ★ DOCUMENTO MÃE — o aplicativo inteiro, como tudo funciona |
| `02-PRODUCT-SPEC.md` | Capacidades, requisitos funcionais e não funcionais |
| `03-PERSONAS-E-FLUXOS.md` | Personas, fluxos principais e mapa de rotas |
| `04-DECISOES-CONGELADAS.md` | ADRs: o que já foi decidido e não se reabre |

### `02-ARQUITETURA/`

| Arquivo | Conteúdo |
|---|---|
| `01-ARQUITETURA-DO-SISTEMA.md` | Componentes, fronteiras, AgentAdapter, zonas de confiança |
| `02-ARQUITETURA-FRONTEND.md` | ★ Explicação só do front-end: stack, shell, estados, ícones, a11y |
| `03-ARQUITETURA-BACKEND.md` | ★ Explicação só do back-end: camadas, comandos, jobs, leases, retry |
| `04-MODELO-DE-DADOS.md` | Todas as tabelas do Factory Supabase, por schema |
| `05-MAQUINAS-DE-ESTADO.md` | Tarefa, ciclo, app, etapa, job, release, preview, finding |
| `06-ARQUITETURA-DE-EVENTOS.md` | Envelope canônico, catálogo de eventos, idempotência |
| `07-CONTRATOS-E-APIS.md` | Os 6 schemas, Task Packet, Handoff Bundle, erros |
| `08-DESIGN-SYSTEM-RNS.md` | Tokens em 3 níveis, paleta, tipografia, componentes |

### `03-PAGINAS/`

| Arquivo | Conteúdo |
|---|---|
| `00-PADRAO-DE-PAGINA.md` | Estrutura obrigatória de todo documento de página |
| `01-INICIO.md` | ★ Página Início — front ícone a ícone + back-end |
| `02-PROJETOS.md` | ★ Página Projetos — lista, wizard, detalhe, Kanban, Esteira |
| `03-AGENTES-DE-IA.md` | ★ Página Agentes de IA — catálogo R1–R9 e detalhe |
| `04-ORQUESTRACAO.md` | ★ Página Orquestração — canvas, validação, modo lista |
| `05-BASE-DE-CONHECIMENTO.md` | ★ Página Base de Conhecimento |
| `06-TEMPLATES.md` | ★ Página Templates — Golden Repository Templates |
| `07-INTEGRACOES.md` | ★ Página Integrações — com regras de segredo |
| `08-MONITORAMENTO.md` | ★ Página Monitoramento — 3 observabilidades + gargalos |
| `09-CONFIGURACOES.md` | ★ Página Configurações — 8 abas |
| `10-TELAS-TRANSVERSAIS.md` | Login, Câmara de Revisão, Aprovações, Execução, Busca, Erros |
| `11-CATALOGO-DE-ACOES-E-ICONES.md` | Catálogo central de ícones e ações, complementar à seção 4 de cada página (herdado da Pasta Mãe Mestre) |

### `04-PLATAFORMAS/`

| Arquivo | Conteúdo |
|---|---|
| `01-SUPABASE.md` | ★ Como vai funcionar o Supabase |
| `02-GITHUB.md` | ★ Como vai funcionar o GitHub |
| `03-VERCEL.md` | ★ Como vai funcionar o Vercel |
| `04-OPENAI-E-ANTHROPIC.md` | Como funcionam OpenAI e Anthropic como adapters |
| `05-ANTIGRAVITY.md` | Antigravity como Estação de Comando local |
| `06-INTEGRACAO-ENTRE-TODOS.md` | ★ Como todos se integram — sequência, pontes, credenciais |

### `05-SEGURANCA/`

| Arquivo | Conteúdo |
|---|---|
| `01-MODELO-DE-SEGURANCA.md` | ★ Sistema de segurança: zonas, trust boundary, sandbox |
| `02-PERMISSOES-E-POLITICAS.md` | ALLOW/ASK/DENY, permissões por papel, RBAC, policy engine |
| `03-RLS-E-DADOS.md` | Row Level Security, testes de negação, dados de preview |
| `04-RISCOS-E-MITIGACOES.md` | Risk register |

### `06-INTELIGENCIA-DOS-AGENTES/`

| Arquivo | Conteúdo |
|---|---|
| `01-CONSTITUICAO.md` | Os 20 artigos que governam todos os agentes |
| `02-REGISTRY-R1-R9.md` | Os nove papéis cognitivos |
| `03-SKILLS.md` | Skills canônicas e projeções |
| `04-PROTOCOLO-REVISAO-DUPLA.md` | ★ GPT R1 → Claude R1 → GPT R2 → Claude R2 |
| `05-TASK-PACKET.md` | A ordem de serviço formal do agente |
| `06-EVALS.md` | Como avaliar papéis, skills e modelos |

### `07-QUALIDADE/`

| Arquivo | Conteúdo |
|---|---|
| `01-ESTRATEGIA-DE-TESTES.md` | Pirâmide, testes obrigatórios, aceitação da Fase 1 |
| `02-CI-CD.md` | Os 6 pipelines |
| `03-ACESSIBILIDADE-E-PERFORMANCE.md` | WCAG 2.2 AA e Core Web Vitals |
| `04-OBSERVABILIDADE.md` | Correlation context, métricas, alertas, runbooks |

### `08-PLANO-DE-IMPLEMENTACAO/`

| Arquivo | Conteúdo |
|---|---|
| `01-PLANO-MESTRE-DE-IMPLEMENTACAO.md` | ★ PLANO DE IMPLEMENTAÇÃO — fases 0 a 5 |
| `02-FASE-1-APP-FUNCIONAL.md` | Fase 1 sprint a sprint (agentes mock) |
| `03-FASE-2-AGENTES-REAIS.md` | Fase 2 sprint a sprint (agentes reais) |
| `04-FASE-3-REFINAMENTO-VISUAL.md` | Fase 3: a fábrica refina a si mesma |
| `05-DEFINITION-OF-DONE.md` | DoD de tarefa, componente, página, etapa, release, fase |

### `09-PROMPTS/`

| Arquivo | Conteúdo |
|---|---|
| `00-COMO-USAR-OS-PROMPTS.md` | Divisão de trabalho e anatomia de prompt |
| `01-ANTIGRAVITY-PLANEJAMENTO.md` | Prompts do Antigravity: planejar, preparar, decidir, verificar |
| `02-CHATGPT-CODEX-REVISAO.md` | Prompts do ChatGPT/Codex: revisar, reconciliar, implementar |
| `03-CLAUDE-CODE-IMPLEMENTACAO.md` | Prompts do Claude Code: meta-revisar, concluir, implementar |
| `04-PROMPTS-POR-PAGINA.md` | Um prompt pronto por página |
| `05-PROMPTS-DO-CICLO-DE-REVISAO-DUPLA.md` | ★ Roteiro manual do ciclo com os 4 prompts |

### `10-CHECKLISTS/`

| Arquivo | Conteúdo |
|---|---|
| `01-CHECKLIST-POR-FASE.md` | Portões de cada fase |
| `02-CHECKLIST-POR-PAGINA.md` | Checklist a executar em cada página |
| `03-CHECKLIST-DE-SEGURANCA.md` | Checklist bloqueante antes de cada release |

### Código inicial (aplicado na raiz do repositório, fora de `docs/`)

`11-CODIGO-INICIAL/` não existe mais como pasta de documentação — foi **aplicado**, seguindo a própria "Ordem de aplicação" que trazia. Estado atual:

- `/.github/CODEOWNERS` (mesclado com o CODEOWNERS pré-existente do repositório)
- `/.github/workflows/application-ci.yml`
- `/.github/workflows/database-ci.yml`
- `/.github/workflows/intelligence-ci.yml`
- `/.github/workflows/preview-e2e.yml`
- `/.github/workflows/release.yml`
- `/.github/workflows/security.yml`
- `/AGENTS.md`, `/CLAUDE.md` (mesclados com os bootloaders pré-existentes do repositório — ver seção "Agentes" do `README.md` raiz)
- `/design-system/tokens.json`
- `/factory-intelligence/constitution/CONSTITUTION.md` — preenchido na fusão a partir de `06-INTELIGENCIA-DOS-AGENTES/01-CONSTITUICAO.md`
- `/factory-intelligence/constitution/SECURITY.md` — preenchido na fusão a partir de `05-SEGURANCA/01-MODELO-DE-SEGURANCA.md`
- `/factory-intelligence/methodology/README.md` — gap identificado na fusão, permanece `UNSPECIFIED`
- `/factory-intelligence/registry/agents.yaml`
- `/factory-intelligence/registry/models.yaml`
- `/factory-intelligence/registry/permissions.yaml`
- `/factory-intelligence/registry/runtimes.yaml`
- `/factory-intelligence/schemas/agent-output.schema.json`
- `/factory-intelligence/schemas/evidence.schema.json`
- `/factory-intelligence/schemas/finding.schema.json`
- `/factory-intelligence/schemas/handoff.schema.json`
- `/factory-intelligence/schemas/review.schema.json`
- `/factory-intelligence/schemas/task-packet.schema.json`
- `/factory-intelligence/skills/accessibility-review/SKILL.md`
- `/factory-intelligence/skills/code-review/SKILL.md`
- `/factory-intelligence/skills/deep-research/SKILL.md`
- `/factory-intelligence/skills/migration-review/SKILL.md`
- `/factory-intelligence/skills/rls-audit/SKILL.md`
- `/packages/contracts/agent-adapter.ts`
- `/packages/contracts/state-machines.ts`
- `/packages/contracts/task-packet.ts`
- `/supabase/migrations/0001_schemas_and_types.sql` … `0010_seed_roles.sql`
- `/supabase/migrations/0011_multi_tenant_referential_integrity.sql` — FKs compostas (organization_id, parent_id); adicionada após revisão técnica na PR de fusão, ver `01-PRODUTO/04-DECISOES-CONGELADAS.md`
- `/supabase/tests/invariants.sql`
- `/supabase/tests/rls_apps.sql`

### `99-REFERENCIAS-ORIGINAIS/`

- `99-REFERENCIAS-ORIGINAIS/README.md`
- `99-REFERENCIAS-ORIGINAIS/imagens/01-Inicio-Dashboard.png`
- `99-REFERENCIAS-ORIGINAIS/imagens/02a-Projetos-Novo-Projeto-Wizard.png`
- `99-REFERENCIAS-ORIGINAIS/imagens/02b-Projetos-Detalhe-Pipeline.png`
- `99-REFERENCIAS-ORIGINAIS/imagens/03-Agentes-Detalhe-R1-Orchestrator.png`
- `99-REFERENCIAS-ORIGINAIS/imagens/04-Orquestracao.png`
- `99-REFERENCIAS-ORIGINAIS/imagens/05-Base-de-Conhecimento.png`
- `99-REFERENCIAS-ORIGINAIS/imagens/06-Templates.png`
- `99-REFERENCIAS-ORIGINAIS/imagens/07-Integracoes.png`
- `99-REFERENCIAS-ORIGINAIS/imagens/08-Monitoramento.png`
- `99-REFERENCIAS-ORIGINAIS/imagens/09-Configuracoes.png`
- `99-REFERENCIAS-ORIGINAIS/pesquisas/01-A-mudanca-conceitual-mais-importante.md`
- `99-REFERENCIAS-ORIGINAIS/pesquisas/02-Arquitetura-de-uma-fabrica-multiagente.md`
- `99-REFERENCIAS-ORIGINAIS/pesquisas/03-Pesquisa-GitHub-Supabase-Vercel.md`
- `99-REFERENCIAS-ORIGINAIS/pesquisas/04-Arquitetura-da-Inteligencia-dos-Agentes.md`
- `99-REFERENCIAS-ORIGINAIS/pesquisas/05-Arquitetura-Frontend-e-Backend.md`

---

## O que foi verificado antes da entrega

Tabela original da Documentação Mestre, anterior à fusão — descreve a verificação do código inicial antes de ele existir neste repositório. A verificação da fusão em si (parse de todo JSON/YAML novo na raiz, checagem de segredos, integridade dos assets de `99-REFERENCIAS-ORIGINAIS/imagens/`) está registrada no commit que introduziu este `docs/`.

| Verificação | Resultado |
|---|---|
| 6 JSON Schemas | parse válido |
| 4 registries YAML | parse válido |
| `tokens.json` | parse válido |
| 10 migrations SQL aplicadas em PostgreSQL 16 real | 62 tabelas, 114 policies, 9 papéis semeados, sem erro |
| RLS habilitada em toda tabela exposta | 0 tabelas expostas sem RLS |
| Agente tentando gravar aprovação | **rejeitado pelo banco** |
| Humano gravando aprovação | aceito |
| Rodada 5 no ciclo de revisão | **rejeitada pelo banco** |
| `pair_ready` sem os dois ambientes | **rejeitado pelo banco** |
| `idempotency_key` duplicada | **rejeitada pelo banco** |
| Rejeição sem justificativa | **rejeitada pelo banco** |
| Contratos TypeScript em modo estrito | typecheck limpo |
| Lógica de máquina de estados e ciclo de revisão | 20 de 20 testes passando |

---

## Fontes consultadas (20/09/2026)

- [Next.js Docs](https://nextjs.org/docs) — linha 16.x, App Router
- [Supabase — GitHub integration (branching)](https://supabase.com/docs/guides/deployment/branching/github-integration)
- [Supabase — API keys](https://supabase.com/docs/guides/api/api-keys)
- [Supabase — Queues](https://supabase.com/docs/guides/queues)
- [Vercel — Deployment Checks](https://vercel.com/docs/deployment-checks)
- [GitHub — Available rules for rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets)
- [GitHub — Installation access tokens](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app)
- [Claude Platform — Managed Agents Skills](https://platform.claude.com/docs/en/managed-agents/skills)
- [OpenAI — Codex Skills](https://developers.openai.com/codex/skills)
- [AGENTS.md](https://agents.md/)
- [shadcn/ui — Next.js installation](https://ui.shadcn.com/docs/installation/next)

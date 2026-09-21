# FASE 1 — Aplicativo Funcional

**O princípio:** nenhuma chamada a modelo de IA. Nenhum token gasto. Tudo determinístico.

---

## 1. O que existe ao final da Fase 1

```
✓ As 9 páginas funcionando com dados reais
✓ Autenticação, organização, equipe e RBAC
✓ Projetos com wizard de 5 passos
✓ Missões, etapas, tarefas e DAG
✓ Kanban e Esteira operando por comandos de domínio
✓ Orchestrator com filas, leases, idempotência e políticas
✓ MockAdapter passando nos contract tests
✓ Ciclo de revisão de 4 passagens rodando inteiro
✓ Câmara de Revisão exibindo as 4 colunas e as divergências
✓ Human gate com assinatura lógica e invariante de banco
✓ GitHub App abrindo PRs reais
✓ Preview pair com barreira de prontidão
✓ Monitoramento com dados reais de execução
✓ Base de Conhecimento, Templates e Integrações
✓ Orquestração com canvas e modo lista

✗ Nenhum modelo de IA chamado
✗ Nenhum provisionamento automático de Supabase/Vercel por app
✗ Interface ainda não refinada
```

---

## 2. O MockAdapter

É o que torna a Fase 1 possível.

```typescript
export class MockAdapter implements AgentAdapter {
  async start(task: TaskPacket): Promise<RunHandle> {
    // 1. Valida o Task Packet contra o schema
    // 2. Seleciona a fixture por (role, task.kind, objective hash)
    // 3. Simula latência configurável
    // 4. Emite eventos normalizados
    // 5. Produz artefato VÁLIDO contra expected_output_schema
    // 6. Em algumas fixtures, produz divergência deliberada
  }
}
```

### Regras do MockAdapter

| Regra | Motivo |
|---|---|
| **Determinístico** | Mesma entrada, mesma saída. Testes reproduzíveis |
| **Sem rede** | Zero custo, zero flakiness |
| **Usa as fixtures de eval** | As mesmas que a Fase 4 usará para avaliar modelos reais |
| **Produz saída válida contra schema** | Prova que o pipeline de validação funciona |
| **Produz findings e divergências** | Prova que a Câmara de Revisão funciona |
| **Simula latência e falha** | Fixtures de erro provam retry, lease e dead letter ★ |
| **Passa nos mesmos contract tests** | Garante que o domínio não depende de nada específico |

### Fixtures mínimas

```
fixtures/
├── plan-review-clean/           sem findings → READY_FOR_HUMAN_APPROVAL
├── plan-review-with-findings/   3 findings, 1 bloqueante → CHANGES_REQUIRED
├── plan-review-disagreement/    divergência de segurança aberta
├── code-review-clean/
├── code-review-security-block/  finding critical → BLOCKED
├── implementation-success/      patch válido
├── implementation-forbidden/    ★ tenta tocar forbidden_path → deve ser rejeitado
├── transient-failure/           erro 429 → deve gerar retry sem consumir rodada
├── terminal-failure/            erro permanente → dead letter
├── invalid-schema-output/       ★ saída inválida → tentativa corretiva → BLOCKED
└── slow-run/                    estoura max_wall_seconds → BLOCKED_BUDGET
```

★ As fixtures de falha são tão importantes quanto as de sucesso. Elas provam que os mecanismos de proteção funcionam.

---

## 3. Sprints detalhados

### Sprint 1.1 — Fundação

```
□ Monorepo com pnpm workspaces
□ apps/control-plane (Next.js App Router, TypeScript estrito)
□ apps/orchestrator-worker (processo externo)
□ packages/{contracts,domain,state-machines,policy-engine,review-engine,
  agent-adapters,integrations,design-system,observability,testing}
□ Projeto Factory Supabase criado
□ Schemas Postgres: api, factory, workflow, agents, review, governance, integration
□ Todos os tipos enum
□ Todas as tabelas de 02-ARQUITETURA/04
□ RLS habilitada em toda tabela exposta
□ Policies com caso positivo E de negação
□ Constraint approvals_must_be_human  ★
□ Constraints de idempotência e de limite de rodada
□ Índices essenciais
□ Filas pgmq
□ supabase test db rodando em CI

SAÍDA: supabase test db verde, incluindo os 4 casos por tabela
```

### Sprint 1.2 — Autenticação e shell

```
□ Supabase Auth: e-mail/senha + OAuth GitHub
□ Criação de organização no primeiro acesso
□ /login, /registrar, /recuperar-senha, /aceitar-convite
□ Shell: AppSidebar, GlobalSearch, NotificationBell, UserMenu
□ Design system mínimo: tokens, Button, Input, Card, StatusPill,
  AsyncBoundary, EmptyState, ErrorState
□ Storybook configurado
□ Configurações: Geral, Equipe, Segurança
□ RBAC aplicado nas rotas

SAÍDA: entrar, criar organização, convidar membro, alterar papel
```

### Sprint 1.3 — Domínio

```
□ packages/domain: entidades e invariantes
□ packages/state-machines: TASK_TRANSITIONS, STAGE, CYCLE, APP
□ Testes de propriedade: nenhuma transição inválida passa  ★
□ Tabelas apps, app_specs, missions, mission_versions, stages,
  tasks, task_dependencies populáveis
□ Validação de DAG sem ciclo
□ Rotas de comando: createApp, createMission, createTask, transition
□ Commands, não CRUD  ★

SAÍDA: criar app → missão → etapa → tarefa via API, com transições validadas
```

### Sprint 1.4 — Orchestrator

```
□ apps/orchestrator-worker consumindo a fila
□ Lease manager: acquire, renew, expire
□ Idempotência com unique constraint
□ Event processor com o fluxo canônico de 11 passos
□ packages/policy-engine com padrão fechado
□ Retry com backoff + jitter
□ Dead letter
□ Budget Service (estrutura; valores UNSPECIFIED)
□ Teste: matar o worker → outro retoma sem duplicar  ★
□ Teste: replay de evento 10× → um efeito  ★

SAÍDA: os dois testes marcados passando
```

### Sprint 1.5 — Projetos

```
□ /projetos lista com grade e tabela, filtros, busca
□ /projetos/novo wizard de 5 passos com rascunho persistido
□ Geração de plano por heurística determinística
□ /projetos/:id detalhe com abas da Fase 1
□ KanbanBoard com mapeamento estado→coluna
□ Drag que SOLICITA transição e faz rollback visual em rejeição  ★
□ Kanban 100% operável por teclado  ★
□ StagePipeline (Esteira) com toggle
□ ActivityFeed e métricas do projeto

SAÍDA: criar projeto pelo wizard, ver Kanban, mover tarefa por teclado
```

### Sprint 1.6 — Agentes e MockAdapter

```
□ Migration semeando os 9 papéis a partir de agents.yaml
□ /agentes catálogo por papel
□ /agentes/:id com Visão Geral, Skills, Execuções, Configurações
□ RunTimeline e LogViewer com throttle e pausa  ★
□ packages/agent-adapters: interface AgentAdapter
□ MockAdapter com todas as fixtures
□ Contract tests completos
□ Intelligence Resolver montando Task Packets
□ Validação de Task Packet antes de despachar  ★

SAÍDA: executar um agente mock e ver a execução completa na interface
```

### Sprint 1.7 — Review Engine

```
□ packages/review-engine com a SEQUENCE fixa
□ Tabelas review_cycles, review_rounds, findings, disagreements
□ round > 4 negado  ★
□ Retry técnico não incrementa round  ★
□ Mudança de SHA → SUPERSEDED
□ Classificação material/editorial determinística
□ Câmara de Revisão com as 4 colunas
□ DisagreementRow com botões de resolução
□ Aprovação bloqueada com finding crítico aberto  ★

SAÍDA: um ciclo completo de 4 passagens visível na Câmara
```

### Sprint 1.8 — Human gate

```
□ Tabelas human_gates e approvals
□ /aprovacoes com ordenação mais antigo primeiro
□ Sem aprovação em lote  ★
□ Assinatura lógica: user_id, approval_id, subject_sha, timestamp
□ Teste: approval com actor_type='agent' rejeitada pelo banco  ★
□ Decisão invalidada se o SHA mudou
□ Handoff Bundle em JSON e markdown
□ Notificações de aprovação pendente

SAÍDA: aprovar uma etapa e ver a transição acontecer
```

### Sprint 1.9 — GitHub

```
□ GitHub Apps criadas (control, worker, release)
□ Autenticação por installation token
□ Webhook com verificação de assinatura  ★
□ Deduplicação por X-GitHub-Delivery
□ Normalização para o envelope canônico
□ Criação de branch e PR pelo worker
□ Leitura de check runs
□ Rodapé de commit com RNS-Run, RNS-Task, RNS-Role, RNS-Base-SHA
□ Ruleset de main configurado

SAÍDA: uma tarefa mock gera um PR real no GitHub
```

### Sprint 1.10 — Dashboard e Monitoramento

```
□ / com os 5 blocos, incluindo "Aguardando você"  ★
□ Endpoint agregado único para o overview  ★
□ /monitoramento com as 7 abas + Gargalos
□ Views materializadas de agregação
□ Nenhum número de infraestrutura fictício  ★
□ Gráficos com alternativa em tabela  ★
□ LogViewer unificado com filtros

SAÍDA: dashboard responde as 5 perguntas; monitoramento mostra gargalos
```

### Sprint 1.11 — Conhecimento, Templates, Integrações

```
□ /conhecimento com as 6 abas, editor markdown, importação
□ Busca full-text em português
□ Aviso de que a base NÃO é normativa para agentes  ★
□ /templates com catálogo, detalhe, verificação de requisitos
□ Template sem repositório marcado como rascunho
□ /integracoes com GitHub, Supabase e Vercel funcionando
□ Nenhum segredo chegando ao navegador  ★
□ Chave de API exibida uma vez, hash no banco

SAÍDA: conectar as 3 integrações essenciais e criar conteúdo
```

### Sprint 1.12 — Orquestração

```
□ /orquestracao com as 5 abas
□ FlowCanvas com criação, conexão e configuração de nós
□ As 9 regras de validação bloqueando publicação  ★
□ MODO LISTA alternativo totalmente funcional  ★
□ Navegação e edição por teclado no canvas
□ Dry-run sem efeito externo
□ definition_sha sobre JSON canônico
□ Versionamento com diff

SAÍDA: criar, validar, testar e publicar um fluxo
```

### Sprint 1.13 — Aceitação

```
□ Teste de aceitação completo automatizado
□ Correção de tudo que ele revelar
□ axe sem violações em todas as páginas
□ Checklist manual de teclado por página
□ Baseline de performance medido
□ Documentação atualizada com o que mudou
```

---

## 4. O portão da Fase 1

Não se avança para a Fase 2 sem isto:

```
★ O teste de aceitação passa automatizado, de ponta a ponta.

Em especial:
  ✓ reenviar o mesmo webhook 5× → nenhum efeito duplicado
  ✓ matar o worker → lease expira → outro retoma → sem duplicação
  ✓ approval com actor_type='agent' → rejeitada pelo banco
  ✓ preview_pair_ready só com AMBOS os eventos
  ✓ round 5 no ciclo → DENIED
  ✓ transição inválida → rejeitada e auditada
  ✓ usuário da org A vê zero linhas da org B
  ✓ diff tocando forbidden_path → artefato rejeitado
```

Se algum desses falhar, a Fase 1 **não terminou** — independentemente de quantas telas estejam bonitas.

---

## 5. O que fica conscientemente feio

Na Fase 1, é aceitável e até desejável:

```
· espaçamento inconsistente
· ausência de micro-interações
· tema escuro rudimentar
· gráficos simples
· ilustrações de estado vazio ausentes
· transições sem animação
```

O que **não** é aceitável, nem na Fase 1:

```
✗ estado de erro ausente
✗ estado vazio ausente
✗ ação inalcançável por teclado
✗ contraste insuficiente
✗ número fictício na tela
✗ segredo no navegador
✗ transição de estado sem validação
```

A diferença: o primeiro grupo é **polimento**; o segundo é **defeito**.

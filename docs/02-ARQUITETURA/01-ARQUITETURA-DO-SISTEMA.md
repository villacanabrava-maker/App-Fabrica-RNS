# Arquitetura do Sistema

Visão de engenharia da Fábrica Apps RNS: componentes, fronteiras, responsabilidades e o que acontece quando cada fronteira é atravessada.

---

## 1. Princípio organizador

O sistema é um **monólito modular** no início, com uma fronteira dura separando o que responde à UI do que executa agentes.

```
┌──────────────────────────────────────────────────────┐
│  PROCESSO WEB (Next.js no Vercel)                    │
│  responde rápido, nunca bloqueia                     │
│  · páginas (RSC)                                     │
│  · Route Handlers (BFF)                              │
│  · ingestão de webhooks (curta)                      │
└────────────────────┬─────────────────────────────────┘
                     │ enfileira / lê estado
                     ▼
┌──────────────────────────────────────────────────────┐
│  FACTORY SUPABASE                                    │
│  Postgres · Auth · RLS · Realtime · Queues · Storage │
└────────────────────┬─────────────────────────────────┘
                     │ consome fila com lease
                     ▼
┌──────────────────────────────────────────────────────┐
│  ORCHESTRATOR WORKER (processo externo, longo)       │
│  · state machine engine                              │
│  · job processors                                    │
│  · agent adapters                                    │
│  · integrações GitHub/Supabase/Vercel                │
└──────────────────────────────────────────────────────┘
```

**Por que essa fronteira existe:** os workloads são incompatíveis. A UI precisa responder em milissegundos; um agente pode rodar 40 minutos. Misturá-los produz timeouts, custos escondidos e impossibilidade de cancelar.

---

## 2. Estrutura de diretórios do repositório `rns-factory`

```
rns-factory/
│
├── apps/
│   ├── control-plane/              # Next.js App Router
│   │   ├── app/                    # rotas
│   │   ├── features/               # um diretório por domínio de tela
│   │   ├── components/             # componentes compartilhados da app
│   │   └── server/                 # server actions, route handlers, BFF
│   │
│   └── orchestrator-worker/        # processo externo
│       ├── jobs/                   # definição dos jobs
│       ├── processors/             # handlers por tipo de evento
│       └── adapters/               # bootstrap dos adapters
│
├── packages/
│   ├── contracts/                  # tipos TS + validação (fonte: JSON Schemas)
│   ├── domain/                     # entidades e regras puras
│   ├── state-machines/             # transições válidas, sem I/O
│   ├── policy-engine/              # ALLOW / ASK / DENY
│   ├── review-engine/              # ciclo de 4 passagens
│   ├── agent-adapters/             # AgentAdapter + implementações
│   ├── integrations/
│   │   ├── github/                 # Octokit, App auth, webhooks
│   │   ├── supabase/               # Management API, branching
│   │   ├── vercel/                 # REST API, deployment checks
│   │   ├── openai/
│   │   └── anthropic/
│   ├── design-system/              # tokens + primitivos RNS
│   ├── observability/              # tracing, métricas, correlation
│   └── testing/                    # fixtures e utilitários
│
├── factory-intelligence/           # ★ código privilegiado
│   ├── constitution/
│   ├── registry/
│   ├── methodology/
│   ├── protocols/
│   ├── skills/
│   ├── schemas/
│   ├── knowledge/
│   ├── continuity/
│   └── evals/
│
├── .agents/                        # projeção OpenAI (GERADA)
│   ├── skills/
│   └── projection-manifest.json
│
├── .claude/                        # projeção Claude (GERADA)
│   ├── skills/
│   ├── agents/
│   └── projection-manifest.json
│
├── .codex/
│   ├── config.toml
│   └── projection-manifest.json
│
├── supabase/
│   ├── migrations/
│   ├── functions/
│   └── tests/
│
├── scripts/
│   └── intelligence/
│       ├── build-projections.ts
│       ├── validate-registry.ts
│       ├── validate-schemas.ts
│       └── check-drift.ts
│
├── docs/                           # este pacote, versionado
│
├── .github/
│   ├── CODEOWNERS
│   └── workflows/
│
├── AGENTS.md
├── CLAUDE.md
└── README.md
```

---

## 3. Catálogo de serviços lógicos

Cada linha é um módulo do back-end com responsabilidade única. Detalhamento em `03-ARQUITETURA-BACKEND.md`.

| Serviço | Responsabilidade | Fase |
|---|---|---|
| Identity Service | usuário, organização, membership, RBAC | 1 |
| App Service | ciclo de vida de cada aplicativo | 1 |
| Specification Service | requisitos, versões, aprovação da spec | 1 |
| Mission Service | iniciativas longas | 1 |
| Stage Service | etapas de uma missão | 1 |
| Task Service | unidades executáveis e DAG | 1 |
| **Orchestrator** | valida e executa a máquina de estados | 1 |
| Scheduler | decide quando um trabalho é elegível | 1 |
| Queue Service | jobs persistentes | 1 |
| Lease Manager | um dono temporário por job | 1 |
| Agent Router | escolhe runtime/model/profile permitido | 2 |
| Mock Agent Adapter | agente determinístico para a Fase 1 | 1 |
| OpenAI Adapter | traduz Task Packet para OpenAI | 2 |
| Claude Adapter | traduz Task Packet para Anthropic | 2 |
| Antigravity Handoff Adapter | prepara bundle para o ambiente local | 2 |
| Intelligence Resolver | resolve constituição, papel, skills e versões | 2 |
| Review Engine | executa a revisão dupla | 2 |
| Finding Service | achados, resoluções, divergências | 2 |
| Evidence Service | provas verificáveis | 1 (base) |
| Policy Engine | ALLOW / ASK / DENY | 1 |
| Approval Engine | gates humanos | 1 |
| GitHub Integration | App, branches, PRs, checks, comentários | 1 |
| Provisioning Service | repo + Supabase + Vercel | 2 |
| Preview Service | ambiente de PR e barreira de prontidão | 2 |
| Release Service | coordenação de release | 2 |
| Budget Service | tokens, dinheiro, tempo, quotas | 2 |
| Eval Service | avaliação de papéis, skills e modelos | 4 |
| Audit Service | trilha imutável | 1 |
| Notification Service | avisos operacionais | 1 |
| Observability Service | logs, traces, métricas, health | 1 |

---

## 4. O contrato `AgentAdapter`

Esta interface é a fronteira que protege a fábrica das mudanças dos fornecedores. **Ela é nossa e não muda quando o fornecedor muda.**

```typescript
export interface AgentAdapter {
  /** Inicia uma execução a partir de um Task Packet validado. */
  start(task: TaskPacket): Promise<RunHandle>;

  /** Retoma uma execução pausada, por exemplo após um human gate. */
  resume(runId: string, input: unknown): Promise<RunHandle>;

  /** Cancela uma execução em andamento. */
  cancel(runId: string): Promise<void>;

  /** Estado atual normalizado. */
  getStatus(runId: string): Promise<RunStatus>;

  /** Stream de eventos NORMALIZADOS (não stdout bruto). */
  getEvents(runId: string): AsyncIterable<AgentEvent>;

  /** Artefatos produzidos, com sha256. */
  getArtifacts(runId: string): Promise<Artifact[]>;

  /** Consumo: tokens, custo, duração. */
  getUsage(runId: string): Promise<Usage>;
}
```

Implementações:

```
AgentAdapter
│
├── MockAdapter            ← Fase 1. Determinístico, sem rede, sem custo.
│
├── OpenAIAdapter          ← Fase 2
│     ├── Codex SDK / worker próprio
│     ├── Agents API (runtime gerenciado)
│     └── GitHub Action (checks e reviews)
│
├── ClaudeAdapter          ← Fase 2
│     ├── Managed Agents
│     ├── Claude Code worker
│     └── GitHub Action
│
└── AntigravityHandoffAdapter  ← Fase 2
      └── prepara bundle, não executa na nuvem
```

**Regra:** se um fornecedor mudar, troca-se o adapter. O Orchestrator e o domínio **não mudam**.

---

## 5. Fronteiras de confiança

```
┌─────────────────────────────────────────────────────────┐
│ ZONA 0 — HUMANO                                         │
│ Roberth autenticado. Autoridade máxima.                 │
└─────────────────────────────────────────────────────────┘
        ▲ aprovações assinadas
┌─────────────────────────────────────────────────────────┐
│ ZONA 1 — PLATAFORMA CONFIÁVEL                           │
│ Orchestrator, Factory Supabase, GitHub App, Release Svc │
│ Possui secrets. Nunca expõe ao agente.                  │
└─────────────────────────────────────────────────────────┘
        ▲ Task Packet (só o necessário)     ▼ RNS Tool API / MCP
┌─────────────────────────────────────────────────────────┐
│ ZONA 2 — AGENTES                                        │
│ Sandbox efêmero, paths restritos, egress restrito.      │
│ Sem credencial de produção. Sem secret key do Supabase. │
└─────────────────────────────────────────────────────────┘
        ▼ produz
┌─────────────────────────────────────────────────────────┐
│ ZONA 3 — CÓDIGO GERADO (UNTRUSTED)                      │
│ Só vira confiável após CI + security + review + gate.   │
└─────────────────────────────────────────────────────────┘
```

E uma fronteira especial:

```
factory-intelligence/**  → está DENTRO da trust boundary do agente.
Quem altera uma skill altera o comportamento de um agente com Bash e rede.
Logo: CODEOWNERS + aprovação humana + projection hash em CI.
```

---

## 6. Onde cada coisa executa

| Trabalho | Onde | Por quê |
|---|---|---|
| Renderizar páginas | Next.js no Vercel | Server-first, previews automáticos |
| Comandos de domínio | Route Handlers / Server Actions | Curtos, validados, idempotentes |
| Ingestão de webhook | Route Handler ou Edge Function | Curto: verificar, normalizar, persistir, enfileirar, responder 2xx |
| Execução de agente | **Worker externo** | Minutos a horas, sandbox, cancelável |
| CI determinístico | GitHub Actions | Checkout, lint, types, testes, security |
| Estado, filas, auditoria | Factory Supabase | Durável, consultável, com RLS |
| Preview de banco | Supabase branch | Isolado, sem dados de produção |
| Preview de app | Vercel preview | URL verificável |
| Release | Release Service + Vercel | Gate separado do merge |

**Anti-padrão proibido:**

```
GitHub Webhook → Edge Function → Claude trabalhando 45 minutos
```

**Padrão correto:**

```
GitHub Webhook → Ingress curto → persist → enqueue → 2xx
                                              ↓
                                     Worker externo → Agente
```

---

## 7. Modelo de eventos

Envelope canônico de todo evento interno:

```json
{
  "event_id": "evt_01",
  "event_type": "review.completed",
  "aggregate_type": "task",
  "aggregate_id": "tsk_01",
  "organization_id": "org_01",
  "app_id": "app_01",
  "mission_id": "mis_01",
  "run_id": "run_04",
  "producer": "anthropic-adapter",
  "sequence": 18,
  "occurred_at": "2026-09-20T12:00:00Z",
  "base_sha": "0123456789abcdef0123456789abcdef01234567",
  "idempotency_key": "review:tsk_01:claude:r2:01234567",
  "payload": { "review_id": "rev_04", "verdict": "READY_FOR_HUMAN_APPROVAL" }
}
```

Namespaces de evento:

```
app.*          apps criados, provisionados, arquivados
mission.*      missões e versões
stage.*        etapas
task.*         tarefas e transições
run.*          execuções de agente
review.*       ciclos e passagens
finding.*      achados e resoluções
approval.*     decisões humanas
github.*       webhooks normalizados do GitHub
vercel.*       webhooks normalizados do Vercel
supabase.*     eventos de branching
budget.*       alertas e bloqueios
human.*        ações do operador
worker.*       saúde e leases
```

`idempotency_key` tem **unique constraint**. O handler registra/deduplica **antes** de tentar a transição.

Derivação determinística da chave para uma execução de revisão:

```
sha256( task_id + phase + round + runtime + base_sha + task_packet_version )
```

---

## 8. Correlation context

Todo `run` carrega, obrigatoriamente:

```
organization_id · app_id · mission_id · stage_id · task_id
review_cycle_id · run_id · parent_run_id
provider · model · role · skill_versions[]
base_sha · branch · pr_number
supabase_branch_id · vercel_deployment_id
trace_id
```

Spans lógicos padronizados:

```
task.prepare · agent.provision · agent.start · agent.tool_call
agent.complete · artifact.validate · review.start · review.complete
github.commit · github.pr · ci.run · supabase.preview · vercel.preview
human_gate · release
```

**Nunca** vão para observabilidade: prompts completos, tokens de acesso, variáveis de ambiente, dados sensíveis.

---

## 9. Decisões de escala

| Situação | Resposta arquitetural |
|---|---|
| Muitos apps simultâneos | Cada app tem repo/Supabase/Vercel próprios; isolamento natural |
| Muitas execuções simultâneas | Pool de workers + concurrency control na fila |
| Uma etapa demora dias | Estado persistido; nada depende de uma sessão aberta |
| Worker morre | Lease expira; outro worker retoma com mesma idempotency key |
| Fornecedor fora do ar | Retry com backoff + jitter; depois `FAILED_TRANSIENT` |
| Fornecedor muda contrato | Troca-se o adapter |
| Custo disparando | Budget Service interrompe e alerta; humano decide |

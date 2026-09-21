# Arquitetura Back-end

O back-end da Fábrica Apps RNS não é um conjunto de CRUDs. Ele é, simultaneamente:

```
workflow engine · event processor · agent control plane
GitHub integration · provisioning service · policy engine
review protocol engine · evidence ledger · approval system
budget system · deployment coordinator · evaluation platform
```

---

## 1. O princípio mais importante

> **O estado da fábrica nunca depende da memória de um agente ou de uma conversa.**

Tudo que determina o próximo passo existe como linha persistida no Factory Supabase. Se todos os processos morrerem agora, ao voltarem eles sabem exatamente onde o trabalho parou.

---

## 2. Camadas

```
┌──────────────────────────────────────────────────────┐
│ INTERFACE                                            │
│ Route Handlers · Server Actions · Webhook ingress    │
│ Responsabilidade: autenticar, validar, traduzir      │
└──────────────────────┬───────────────────────────────┘
                       ▼
┌──────────────────────────────────────────────────────┐
│ APPLICATION (casos de uso / comandos de domínio)     │
│ createApp · submitPlanForReview · dispatchTask       │
│ approveStage · promoteRelease · cancelRun            │
└──────────────────────┬───────────────────────────────┘
                       ▼
┌──────────────────────────────────────────────────────┐
│ DOMAIN (puro, sem I/O)                               │
│ entidades · invariantes · máquinas de estado         │
│ policy engine · review engine                        │
└──────────────────────┬───────────────────────────────┘
                       ▼
┌──────────────────────────────────────────────────────┐
│ INFRASTRUCTURE                                       │
│ Supabase · GitHub · Vercel · OpenAI · Anthropic      │
│ filas · storage · observabilidade                    │
└──────────────────────────────────────────────────────┘
```

Regra: **a camada DOMAIN não conhece Supabase, GitHub nem nenhum fornecedor.** Ela recebe dados e devolve decisões. Isso é o que torna as máquinas de estado testáveis sem rede.

---

## 3. API interna: comandos, não CRUD

O navegador **não** atualiza `task.status`. Ele **solicita um comando** e o domínio decide se a transição é válida.

```
POST   /api/apps                              criar aplicativo
POST   /api/apps/:id/provision                provisionar infra
POST   /api/apps/:id/archive

POST   /api/specs                             criar especificação
POST   /api/specs/:id/approve

POST   /api/missions                          criar missão
POST   /api/missions/:id/submit-review        abrir ciclo de revisão
POST   /api/missions/:id/new-version

POST   /api/stages/:id/approve
POST   /api/stages/:id/request-revision

POST   /api/tasks/:id/dispatch                enfileirar execução
POST   /api/tasks/:id/cancel
POST   /api/tasks/:id/retry

POST   /api/runs/:id/cancel

POST   /api/reviews/:id/continue              avançar a passagem
POST   /api/reviews/:id/request-revision

POST   /api/findings/:id/resolve
POST   /api/disagreements/:id/resolve

POST   /api/approvals/:id/approve             ← exige ator humano
POST   /api/approvals/:id/reject

POST   /api/releases/:id/promote
POST   /api/releases/:id/rollback

POST   /api/jobs/:id/retry
POST   /api/jobs/:id/dead-letter

POST   /api/webhooks/github
POST   /api/webhooks/vercel
POST   /api/webhooks/supabase
POST   /api/webhooks/openai
POST   /api/webhooks/anthropic

GET    /api/apps/:id                          leituras
GET    /api/missions/:id
GET    /api/runs/:id
GET    /api/reviews/:id
GET    /api/monitoring/overview
```

Toda rota de comando:

1. Autentica e resolve `organization_id`.
2. Valida o corpo contra o schema de `packages/contracts`.
3. Consulta a política (ALLOW / ASK / DENY).
4. Verifica idempotência (`Idempotency-Key` no header, quando aplicável).
5. Pede ao domínio a transição.
6. Persiste, emite evento, enfileira job.
7. Responde com o novo estado, nunca com "ok".

Resposta de `GET /api/runs/:id` — note que **o front-end não sabe qual endpoint da Anthropic executou o Claude**:

```json
{
  "id": "run_765",
  "runtime": "anthropic",
  "state": "running",
  "role": "R5",
  "round": 2,
  "started_at": "2026-09-20T12:00:00Z",
  "progress": { "summary": "Reviewing architecture and security findings" }
}
```

---

## 4. Fluxo canônico de evento externo

Toda entrada externa segue **exatamente** esta sequência. Pular um passo é defeito.

```
1. RECEIVE
2. VERIFY SIGNATURE          ← falha = 401, registra tentativa
3. NORMALIZE                 ← envelope canônico RNS
4. PERSIST RAW EVENT         ← webhook_events (auditoria)
5. CHECK IDEMPOTENCY         ← unique(idempotency_key); já visto = 200
6. VALIDATE CURRENT STATE    ← transição permitida a partir do estado atual?
7. APPLY TRANSITION          ← em transação
8. EMIT INTERNAL EVENT
9. QUEUE NEXT JOB
10. BROADCAST (Realtime)
11. RETURN 2xx               ← rápido, sempre
```

Aplicável a: `github.*`, `vercel.*`, `supabase.*`, `openai.*`, `anthropic.*`, `worker.*`, `human.*`.

---

## 5. Sistema de jobs com lease

Um job **não** tem apenas `status = running`. Tem dono temporário.

```
job_id
state              queued | leased | running | succeeded | failed | dead
lease_owner        identificador do worker
lease_acquired_at
lease_expires_at   ← o coração da recuperação
attempt
max_attempts
next_attempt_at
idempotency_key    ← unique
payload
last_error
```

Ciclo de recuperação:

```
worker morre
     ↓
lease_expires_at é ultrapassado
     ↓
job volta a ser elegível
     ↓
outro worker adquire o lease
     ↓
reprocessa com o MESMO idempotency_key
     ↓
efeitos externos já aplicados não duplicam
```

A fila durável do Postgres (pgmq via Supabase Queues) entrega mensagens com janela de visibilidade, mas **isso não substitui handlers idempotentes**: uma operação externa pode ter sido executada logo antes da falha do consumidor.

### Política de retry

```
transport / network / 429 / 5xx
    → retry automático com backoff exponencial + jitter

schema inválido na saída do agente
    → uma tentativa corretiva do mesmo run-policy

rejeição semântica (o revisor discordou)
    → NÃO é retry. É nova passagem ou nova versão.

violação de política ou segurança
    → NÃO é retry. É BLOCKED.

rejeição humana
    → NÃO é retry. É nova task/version.
```

Valores de `max_attempts`, backoff base e `lease TTL`: **`UNSPECIFIED` até benchmark na Fase 1**.

---

## 6. Schemas do banco (organização lógica)

A Data API não deve expor todas as tabelas ao navegador. Separação por schema Postgres:

```
api          o que é deliberadamente exposto à aplicação
factory      domínio interno (apps, specs, missions, stages)
workflow     orquestração (tasks, jobs, leases, events)
agents       runs, perfis, skills, versões de inteligência
review       ciclos, passagens, findings, disagreements
governance   approvals, policy_decisions, audit_events
integration  IDs e metadata de GitHub/Supabase/Vercel
```

Regras:

1. RLS habilitada em **toda** tabela exposta.
2. Grants explícitos + policies são verificações **separadas**; as duas precisam estar corretas.
3. Chave secreta (`sb_secret_` / service role) **contorna RLS** e vive só no servidor.
4. Agente nunca recebe chave do banco. Acessa via RNS Tool API / MCP com policy check.

```
Agent → RNS Tool API / MCP → policy check → Orchestrator → Supabase
```

Nunca:

```
Agent → SUPABASE_SECRET_KEY → banco irrestrito
```

---

## 7. Provisionamento de um aplicativo

Máquina de estados própria:

```
APP_REQUESTED
     ↓
SPEC_CREATED
     ↓
PLAN_REVIEWED          ← as quatro passagens rodaram
     ↓
HUMAN_APPROVED         ← assinatura lógica gravada
     ↓
PROVISIONING
     ├── criar repositório GitHub a partir do golden template
     ├── criar projeto Supabase (Management API)
     ├── criar projeto Vercel ligado ao repositório
     ├── conectar GitHub ↔ Supabase (branching)
     ├── conectar Supabase ↔ Vercel (variáveis de preview)
     └── registrar TODOS os IDs no Factory Supabase
     ↓
BOOTSTRAPPING          ← primeira migration, seed sintético, CI verde
     ↓
READY_FOR_DEVELOPMENT
```

Cada passo é idempotente e registra o ID externo antes de seguir. Se o passo 3 falhar, o passo 1 e 2 não são refeitos.

---

## 8. Ciclo de execução de uma tarefa

```
task criada
     ↓
dependências satisfeitas? → READY
     ↓
enfileirada → QUEUED
     ↓
worker adquire lease → LEASED
     ↓
Intelligence Resolver monta o Task Packet
  (constituição + papel + skills + permissões + paths + budget)
     ↓
Agent Router escolhe runtime e perfil permitido
     ↓
Adapter.start(taskPacket) → RUNNING
     ↓
eventos normalizados chegam e são persistidos
     ↓
artefatos validados contra schema → ARTIFACT_READY
     ↓
Review Engine abre/continua o ciclo → REVIEWING
     ↓
CI e security → AWAITING_CHECKS
     ↓
preview pair pronto → R8 verifica
     ↓
R9 consolida evidências → AWAITING_HUMAN
     ↓
aprovação humana → APPROVED
     ↓
merge → COMPLETED
```

---

## 9. Regras de workspace

```
run_001 → worktree /workspace/run_001 → branch rns/task-148-openai
run_002 → worktree /workspace/run_002 → branch rns/task-148-claude-review
```

Proibido:

```
OpenAI ─┐
        ├─ escrevendo simultaneamente em ./repo
Claude ─┘
```

Quando dois agentes precisam tratar do mesmo problema, o padrão é sequencial com ownership claro:

```
IMPLEMENTADOR → commit → REVISOR passagem A → findings
→ IMPLEMENTADOR passagem B → correções → REVISOR passagem B
→ veredicto → CI → gates → human gate
```

E a alternância entre fornecedores evita que qualquer um ganhe posição permanente de "melhor programador":

```
Etapa N:   Codex implementa → Claude revisa
Etapa N+1: Claude implementa → Codex revisa
```

A fábrica descobre empiricamente quem é melhor em quê. Não decide por intuição.

---

## 10. Budgets

```
budget = {
  max_cost_usd:     number | null,
  max_wall_seconds: integer | null,
  max_review_hops:  1..4
}
```

Regras:

1. O budget entra no Task Packet e é verificado **durante** a execução, não só no fim.
2. Ao estourar: interromper run, estado `BLOCKED_BUDGET`, alerta, evento.
3. **O agente nunca amplia o próprio orçamento.** Ampliação é ação humana.
4. Budgets existem em três níveis: por run, por missão e por organização/mês.

---

## 11. Auditoria

Evento de auditoria canônico:

```json
{
  "audit_id": "aud_0188",
  "occurred_at": "2026-09-20T12:00:00Z",
  "actor_type": "agent",
  "actor_id": "openai:run_123",
  "action": "review.completed",
  "resource_type": "task",
  "resource_id": "tsk_01",
  "organization_id": "org_01",
  "mission_id": "mis_01",
  "base_sha": "0123456789abcdef0123456789abcdef01234567",
  "decision": "changes_required",
  "evidence_ids": ["ev_17", "ev_18"],
  "correlation_id": "cor_07"
}
```

Regras:

- Append-only lógico. Sem UPDATE, sem DELETE.
- `actor_type` ∈ `human | agent | system | integration`.
- Uma aprovação com `actor_type = agent` é **rejeitada na escrita**. Isso é uma invariante de banco, não só de código.
- Nunca armazenar secrets ou conteúdo sensível no ledger.

---

## 12. Testes obrigatórios do back-end

| Gate | O que precisa ser provado |
|---|---|
| State machine | Nenhuma transição impossível é aceita |
| Idempotência | Webhook duplicado não duplica operação |
| Lease | Job abandonado é recuperável por outro worker |
| Retry | Falhas transitórias respeitam a política e não consomem rodada cognitiva |
| Dead letter | Falha terminal fica investigável, com payload e erro |
| Contract tests | Todos os adapters obedecem ao mesmo contrato |
| RLS | Usuário de outra organização **não** lê dados alheios (casos de negação explícitos) |
| GitHub webhook | Assinatura verificada e deduplicação funcionando |
| Provider webhook | Evento legítimo e correlacionado ao run correto |
| Migration | Aplica e reverte no preview |
| Policy | DENY não pode ser contornado por nenhum caminho |
| Budget | Agente para quando o limite é excedido |
| Audit | Decisão crítica tem proveniência completa |
| Approval invariant | Ator agente não consegue gravar aprovação |

---

## 13. Observabilidade

Três perspectivas distintas, nunca misturadas:

```
PRODUCT OBSERVABILITY   usuário · app produzido · UX
FACTORY OBSERVABILITY   tasks · queues · reviews · approvals
AGENT OBSERVABILITY     runs · tools · tokens · models · errors
```

Cada uma tem seu painel e suas métricas. Um erro visto na interface deve ser percorrível de ponta a ponta pelo `correlation_id`.

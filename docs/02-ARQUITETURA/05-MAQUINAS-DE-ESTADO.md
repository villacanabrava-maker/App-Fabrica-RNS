# Máquinas de Estado

Toda transição do sistema é definida aqui. O código em `packages/state-machines/` é a implementação **literal** deste documento e não pode divergir dele.

Regra geral: **uma transição não listada aqui é inválida e deve ser rejeitada, registrada em `policy_decisions` e auditada.**

---

## 1. Máquina de estados da TAREFA (a principal)

### Caminho feliz

```
CREATED
  │ dependências satisfeitas
  ▼
READY
  │ dispatch
  ▼
QUEUED
  │ worker adquire lease
  ▼
LEASED
  │ adapter.start()
  ▼
RUNNING
  │ artefatos válidos contra schema
  ▼
ARTIFACT_READY
  │ review engine abre/continua ciclo
  ▼
REVIEWING
  │ ciclo concluído (Claude R2)
  ▼
AWAITING_CHECKS
  │ CI + security + preview pair verdes
  ▼
AWAITING_HUMAN
  │ aprovação humana assinada
  ▼
APPROVED
  │ merge
  ▼
COMPLETED
```

### Ramificações

```
RUNNING ──────────► FAILED_RETRYABLE ──► READY
                       (transporte, 429, 5xx, timeout)

RUNNING ──────────► FAILED_TERMINAL
                       (erro não recuperável; vai para dead letter)

RUNNING ──────────► BLOCKED_BUDGET
                       (max_cost_usd ou max_wall_seconds excedido)

ARTIFACT_READY ───► CHANGES_REQUIRED ──► READY
                       (saída não atende aos critérios de aceitação)

REVIEWING ────────► CHANGES_REQUIRED ──► READY
                       (veredicto CHANGES_REQUIRED)

REVIEWING ────────► BLOCKED
                       (veredicto BLOCKED)

AWAITING_CHECKS ──► CHANGES_REQUIRED ──► READY
                       (CI vermelho)

AWAITING_HUMAN ───► REJECTED ──► REVISION_REQUIRED ──► READY
                       (humano rejeitou)

qualquer estado ──► CANCELLED
                       (ação humana explícita)

qualquer estado ──► SUPERSEDED
                       (base_sha mudou materialmente; nova versão nasceu)
```

### Tabela de transições permitidas

| De | Para | Gatilho | Ator permitido |
|---|---|---|---|
| `created` | `ready` | dependências satisfeitas | system |
| `ready` | `queued` | `dispatch` | human, system |
| `queued` | `leased` | worker adquire lease | system |
| `leased` | `running` | adapter iniciou | system |
| `leased` | `queued` | lease expirou | system |
| `running` | `artifact_ready` | artefatos validados | system |
| `running` | `failed_retryable` | erro transitório | system |
| `running` | `failed_terminal` | erro permanente | system |
| `running` | `blocked_budget` | budget estourou | system |
| `running` | `cancelled` | cancelamento | human |
| `failed_retryable` | `ready` | `next_attempt_at` chegou e `attempt < max_attempts` | system |
| `failed_retryable` | `failed_terminal` | `attempt >= max_attempts` | system |
| `artifact_ready` | `reviewing` | ciclo de revisão aberto | system |
| `artifact_ready` | `changes_required` | critérios não atendidos | system |
| `reviewing` | `awaiting_checks` | ciclo concluiu com `APPROVE_AI_STAGE` ou `READY_FOR_HUMAN_APPROVAL` | system |
| `reviewing` | `changes_required` | veredicto `CHANGES_REQUIRED` | system |
| `reviewing` | `blocked` | veredicto `BLOCKED` | system |
| `changes_required` | `ready` | reparo enfileirado | system |
| `awaiting_checks` | `awaiting_human` | todos os checks verdes | system |
| `awaiting_checks` | `changes_required` | algum check vermelho | system |
| `awaiting_human` | `approved` | aprovação humana | **human apenas** |
| `awaiting_human` | `rejected` | rejeição humana | **human apenas** |
| `rejected` | `revision_required` | automático | system |
| `revision_required` | `ready` | nova versão criada | system |
| `approved` | `completed` | merge confirmado | system |
| `blocked` | `ready` | desbloqueio humano com justificativa | human |
| qualquer | `cancelled` | cancelamento | human |
| qualquer | `superseded` | novo SHA material | system |

**Invariantes:**
1. `awaiting_human → approved` **só** com `actor_type = 'human'`. Constraint de banco.
2. Não existe atalho de `running` para `completed`.
3. `completed` e `failed_terminal` são terminais; só `superseded` pode sucedê-los.

---

## 2. Máquina de estados do CICLO DE REVISÃO

```
             (criado sobre subject_sha)
                       │
                       ▼
                   OPEN (round = 0)
                       │
        ┌──────────────┴──────────────┐
        ▼                             │
  OPENAI_R1_RUNNING (round=1)         │
        │                             │
        ▼                             │
  CLAUDE_R1_RUNNING (round=2)         │
        │                             │
        ▼                             │
  OPENAI_R2_RUNNING (round=3)         │
        │                             │
        ▼                             │
  CLAUDE_R2_RUNNING (round=4)         │
        │                             │
        ▼                             │
    AWAITING_HUMAN ◄──────────────────┘
        │                    (round > 4 = DENIED,
        │                     força human gate)
   ┌────┴─────┬──────────┐
   ▼          ▼          ▼
 CLOSED    CLOSED     BLOCKED
(approved)(revision)
```

### Regras do ciclo

| Regra | Detalhe |
|---|---|
| Sequência fixa | `openai_r1 → claude_r1 → openai_r2 → claude_r2`. Definida no Task Packet, aplicada pelo Orchestrator. |
| Quem avança | **Somente o Orchestrator.** Um modelo nunca decide chamar o próximo. |
| Limite | `round > 4` → `DENIED` → human gate imediato. |
| Retry técnico | Não incrementa `round`. Usa o mesmo `round` com nova tentativa. |
| Mudança de SHA | Ciclo vira `SUPERSEDED`; novo ciclo nasce com o novo SHA. |
| Schema inválido | Erro técnico → uma tentativa corretiva → se falhar de novo, `BLOCKED`. |
| Saída da R4 | Exatamente um de: `READY_FOR_HUMAN_APPROVAL`, `CHANGES_REQUIRED`, `BLOCKED`. |

### Critérios de encerramento

| Condição | Resultado |
|---|---|
| Critérios de aceitação satisfeitos e nenhum finding bloqueante aberto | `READY_FOR_HUMAN_APPROVAL` |
| Problemas corrigíveis permanecem | `CHANGES_REQUIRED` |
| Segurança crítica, requisito impossível, inconsistência fundamental, dependência ausente | `BLOCKED` |
| Limite de 4 hops com divergência material aberta | `READY_FOR_HUMAN_APPROVAL` + disagreement, ou `BLOCKED` conforme materialidade |
| `base_sha` mudou materialmente | ciclo invalidado, nova versão |
| Schema de saída inválido | erro técnico, retry controlado |
| Erro de rede / provedor | retry técnico |
| Budget esgotado | `BLOCKED_BUDGET` |
| Human gate rejeita | nova versão ou encerramento |

---

## 3. Máquina de estados do APLICATIVO

```
APP_REQUESTED
     ↓
SPEC_CREATED
     ↓ (spec aprovada por humano)
PLAN_REVIEWED
     ↓ (ciclo de 4 passagens concluído)
HUMAN_APPROVED
     ↓
PROVISIONING ──► PROVISIONING_FAILED ──► PROVISIONING (retry idempotente)
     ↓
BOOTSTRAPPING
     ↓
READY_FOR_DEVELOPMENT
     ↓
IN_DEVELOPMENT ◄──┐
     ↓            │ próxima missão
RELEASE_READY ────┘
     ↓
PUBLISHED
     ↓
ARCHIVED
```

Sub-passos de `PROVISIONING`, cada um idempotente e com ID externo registrado antes de seguir:

```
1. criar repositório GitHub (golden template)
2. criar projeto Supabase (Management API)
3. criar projeto Vercel ligado ao repositório
4. conectar GitHub ↔ Supabase (branching automático)
5. conectar Supabase ↔ Vercel (variáveis de preview)
6. registrar todos os IDs no Factory Supabase
```

Se o passo 4 falhar, os passos 1–3 **não são refeitos**.

---

## 4. Máquina de estados da ETAPA (stage)

```
PENDING
  │ etapa anterior concluída e dependências satisfeitas
  ▼
READY
  │ tarefas da etapa despachadas
  ▼
EXECUTING
  │ todas as tarefas em artifact_ready
  ▼
REVIEWING
  │ ciclo concluído + checks verdes + preview verificado
  ▼
AWAITING_HUMAN
  │ aprovação
  ▼
APPROVED
  │ merge das tarefas
  ▼
COMPLETED
```

Ramificações: `BLOCKED` (finding crítico), `CANCELLED` (humano), `SUPERSEDED` (nova versão do plano).

---

## 5. Máquina de estados do JOB

```
QUEUED
  │ lease adquirido
  ▼
LEASED
  │ processamento iniciado
  ▼
RUNNING
  ├──► SUCCEEDED (terminal)
  ├──► FAILED ──► QUEUED  (se attempt < max_attempts, após next_attempt_at)
  │           └─► DEAD    (se attempt >= max_attempts)
  └──► QUEUED (lease expirou sem conclusão)
```

`DEAD` grava em `dead_letters` com payload e erro, e é investigável manualmente.

---

## 6. Máquina de estados do DEPLOYMENT / RELEASE

```
merge em main
     ↓
PRODUCTION_BUILD_QUEUED
     ↓
PRODUCTION_BUILD_RUNNING
     ├──► BUILD_FAILED (terminal para este commit)
     ▼
BUILD_READY                        ← existe, mas NÃO recebe usuários
     ↓
DEPLOYMENT_CHECKS_RUNNING          ← Vercel segura a promoção
     ├──► CHECKS_FAILED ──► HOLD
     ▼
CHECKS_PASSED
     ↓
AWAITING_RELEASE_APPROVAL          ← human gate SEPARADO do merge
     ├──► HOLD (humano segura)
     ▼
ROLLING_RELEASE                    ← fração do tráfego
     ├──► ROLLBACK (métricas ruins ou decisão humana)
     ▼
FULLY_RELEASED
```

**Invariante:** `BUILD_READY` nunca vira `FULLY_RELEASED` sem passar por `AWAITING_RELEASE_APPROVAL`.

---

## 7. Máquina de estados do PREVIEW PAIR

Esta existe por causa de uma condição de corrida real entre a injeção de variáveis de ambiente e o build.

```
PR aberto
     ↓
PREVIEW_REQUESTED
     ├── supabase.preview.ready → supabase_ready = true
     └── vercel.preview.ready   → vercel_ready = true
           ↓
    AMBOS true?
     ├── não → continua esperando (com timeout)
     ▼ sim
PAIR_READY
     ↓
E2E / R8 pode começar
```

**Proibido:** declarar preview pronto ao receber apenas o evento do Vercel.

Timeout de espera: `UNSPECIFIED` até medir na Fase 2. Ao estourar, estado `PREVIEW_TIMEOUT` e alerta.

---

## 8. Máquina de estados do FINDING

```
OPEN
 ├──► ACCEPTED   (o autor concordou e vai corrigir)
 │        ↓
 │     RESOLVED  (correção verificada por evidência)
 ├──► REJECTED   (com justificativa obrigatória)
 └──► DEFERRED   (registrado como dívida conhecida, com dono)
```

Regra: um finding `critical` de categoria `security` com `blocks_progress = true` **não pode** ser `DEFERRED` sem decisão humana registrada.

---

## 9. Máquina de estados da DIVERGÊNCIA

```
OPEN
 ├──► ACCEPTED_OPENAI
 ├──► ACCEPTED_CLAUDE
 ├──► COMBINED
 ├──► RESOLVED              (evidência nova encerrou a dúvida)
 ├──► DEFERRED
 └──► HUMAN_DECISION_REQUIRED ──► (decisão humana) ──► uma das acima
```

Roteamento por tipo:

| Tipo | Comportamento padrão |
|---|---|
| `factual` | buscar evidência verificável; quem tiver evidência vence |
| `security` | `high`/`critical` não resolvida **bloqueia** |
| `requirement` | humano é autoridade, sempre |
| `architectural` | pode escalar com trade-offs documentados |
| `implementation` | testes determinísticos arbitram |
| `preference` | **não bloqueia** por padrão |

---

## 10. Como implementar

```typescript
// packages/state-machines/src/task.ts
type Transition = {
  from: TaskState;
  to: TaskState;
  trigger: string;
  allowedActors: ActorKind[];
  guard?: (ctx: TaskContext) => boolean;
};

export const TASK_TRANSITIONS: readonly Transition[] = [ /* tabela da §1 */ ];

export function canTransition(
  from: TaskState, to: TaskState, trigger: string, actor: ActorKind, ctx: TaskContext
): { ok: true } | { ok: false; reason: string } { /* ... */ }
```

Regras de implementação:

1. A função é **pura**. Sem I/O, sem banco, sem rede.
2. Toda transição negada retorna motivo legível e gera `policy_decisions` + `audit_events`.
3. Testes de propriedade: gerar transições aleatórias e provar que nenhuma inválida passa.
4. A aplicação da transição acontece em **uma transação** junto com a emissão do evento.

# Contratos e APIs

A fonte de verdade dos contratos são os **JSON Schemas** em `factory-intelligence/schemas/`. Os tipos TypeScript em `packages/contracts/` são **derivados** deles, nunca escritos à mão em paralelo.

```
factory-intelligence/schemas/*.json   ← FONTE
            ↓ geração em build
packages/contracts/src/generated/*.ts ← DERIVADO (não editar)
            ↓
usado por: Control Plane, Orchestrator, Adapters, CI
```

---

## 1. Os seis schemas canônicos

| Schema | O que descreve | Quem produz | Quem consome |
|---|---|---|---|
| `task-packet.schema.json` | A ordem de serviço entregue a um agente | Orchestrator | Adapters, agentes |
| `agent-output.schema.json` | O que um agente devolve ao concluir | Agente | Orchestrator |
| `review.schema.json` | Uma passagem de revisão | Agente revisor | Review Engine |
| `finding.schema.json` | Um achado individual | Agente revisor | Finding Service, UI |
| `evidence.schema.json` | Uma prova verificável | Qualquer produtor | Evidence Service |
| `handoff.schema.json` | Uma passagem de bastão entre runtimes | Orchestrator | Auditoria, Antigravity |

Todos em **JSON Schema Draft 2020-12**, validados no Orchestrator **e** em CI.

---

## 2. Task Packet — a unidade formal de trabalho

Campos desconhecidos recebem `null`, **nunca** um número inventado.

```json
{
  "schema_version": "1.0",
  "mission_id": "mis_01",
  "stage_id": "stg_03",
  "task_id": "tsk_01",
  "run_id": "run_01",
  "role": "R5",
  "runtime": "openai",
  "model": null,
  "repository": "rns/fabrica-apps-rns",
  "base_sha": "0123456789abcdef0123456789abcdef01234567",
  "branch": "review/tsk_01-openai-r1",
  "objective": "Revisar o plano de autenticação antes da implementação.",
  "acceptance_criteria": [
    "Identificar riscos arquiteturais materiais",
    "Classificar findings por severidade",
    "Apontar evidência para afirmações verificáveis"
  ],
  "allowed_paths": ["docs/plans/authentication/**", "factory-intelligence/**"],
  "forbidden_paths": [".github/workflows/**", "supabase/migrations/**"],
  "required_skills": ["architecture-review", "security-audit"],
  "required_evidence": ["code", "external_source"],
  "required_tests": [],
  "permissions": {
    "filesystem": "read_only",
    "github": "read",
    "supabase": "metadata_read",
    "vercel": "none",
    "production": "deny"
  },
  "budget": {
    "max_cost_usd": null,
    "max_wall_seconds": null,
    "max_review_hops": 4
  },
  "review_policy": {
    "sequence": ["openai_r1", "claude_r1", "openai_r2", "claude_r2"],
    "human_gate_after": "claude_r2"
  },
  "expected_artifacts": ["review.json", "findings.json"],
  "expected_output_schema": "review.schema.json",
  "intelligence_version": "0123456789abcdef0123456789abcdef01234567",
  "correlation_id": "cor_07"
}
```

### Regras do Task Packet

1. **Imutável.** Alterar exige nova versão em `task_packets`.
2. `base_sha` é obrigatório. O agente trabalha **exatamente** sobre ele.
3. `allowed_paths` e `forbidden_paths` são aplicados pelo sandbox, não só sugeridos.
4. `required_skills` existe para **não** anexar tudo — anexar skills demais aumenta contexto e tempo de startup.
5. `max_review_hops` nunca excede 4.
6. `model` é `null` no envelope; resolvido em runtime pelo registry.

---

## 3. Agent Output

```json
{
  "task_id": "tsk_01",
  "run_id": "run_01",
  "input_sha": "0123456789abcdef0123456789abcdef01234567",
  "output_sha": "89abcdef0123456789abcdef0123456789abcdef",
  "status": "completed",
  "summary": "Implementado o módulo de sessão com testes.",
  "artifacts": [
    { "type": "patch", "uri": "storage://artifacts/run_01/patch.diff",
      "sha256": "aa11...", "mime_type": "text/x-diff" }
  ],
  "finding_ids": [],
  "evidence_ids": ["ev_17", "ev_18"],
  "usage": {
    "input_tokens": 84213,
    "cached_input_tokens": 61004,
    "output_tokens": 9120,
    "cost_usd": null,
    "wall_ms": 412330
  }
}
```

`status` ∈ `completed | changes_required | blocked | failed`.

**Regra:** saída que não valida contra o schema **não é consumida**. Gera uma tentativa corretiva; se falhar de novo, `BLOCKED`.

---

## 4. Review

```json
{
  "review_id": "rev_04",
  "task_id": "tsk_01",
  "review_cycle_id": "rc_00421",
  "reviewer_runtime": "anthropic",
  "reviewer_role": "R5",
  "round": 2,
  "target_sha": "0123456789abcdef0123456789abcdef01234567",
  "prior_review_id": "rev_03",
  "comments_on_prior_work": true,
  "verdict": "CHANGES_REQUIRED",
  "finding_ids": ["fnd_07", "fnd_08"],
  "unresolved_finding_ids": ["fnd_07"],
  "summary": "A proposta de fila é adequada, mas falta política de RLS na tabela de sessões."
}
```

| Campo | Regra |
|---|---|
| `round` | 1 ou 2 **dentro do runtime** (round global 1–4 vive no ciclo) |
| `comments_on_prior_work` | `true` obrigatório nas passagens 2, 3 e 4 |
| `verdict` | `READY_FOR_HUMAN_APPROVAL` só é permitido na passagem 4 |

---

## 5. Finding

```json
{
  "finding_id": "fnd_07",
  "category": "security",
  "severity": "high",
  "claim": "A tabela public.sessions não possui RLS habilitada.",
  "recommendation": "Habilitar RLS e criar policy de leitura restrita ao próprio usuário.",
  "location": "supabase/migrations/20260920_sessions.sql:14",
  "status": "open",
  "blocks_progress": true,
  "evidence_ids": ["ev_21"],
  "disposition_reason": null
}
```

Regras de severidade:

| Severidade | Comportamento |
|---|---|
| `critical` | bloqueia sempre; não pode ser `deferred` sem decisão humana |
| `high` | bloqueia em categoria `security` ou `data`; alerta nas demais |
| `medium` | não bloqueia por padrão; entra na dívida conhecida |
| `low` / `info` | registra |

---

## 6. Evidence

```json
{
  "evidence_id": "ev_21",
  "type": "database",
  "source": "supabase://preview-task-481/pg_policies",
  "observed_at": "2026-09-20T12:03:00Z",
  "collector": "R7:run_09",
  "commit_sha": "0123456789abcdef0123456789abcdef01234567",
  "artifact_sha256": "bb22...",
  "claim_ids": ["fnd_07"],
  "integrity": "verified"
}
```

| `integrity` | Significado |
|---|---|
| `verified` | observado diretamente pelo coletor, reproduzível |
| `reported` | terceiro informou; não verificado independentemente |
| `inferred` | deduzido, não observado |
| `pending` | prometido, ainda não coletado |

**Regra da Constituição:** afirmar "pronto", "testado" ou "seguro" exige pelo menos uma evidência `verified`.

---

## 7. Handoff

```json
{
  "handoff_id": "hof_03",
  "mission_id": "mis_01",
  "task_id": "tsk_01",
  "from_runtime": "openai",
  "to_runtime": "anthropic",
  "hop": 2,
  "reason": "Passagem 2 do protocolo de revisão dupla",
  "input_sha": "0123456789abcdef0123456789abcdef01234567",
  "artifact_ids": ["art_11", "art_12"],
  "finding_ids": ["fnd_07"],
  "next_action": "Meta-revisar a passagem OpenAI R1 e revisar o artefato original",
  "idempotency_key": "handoff:tsk_01:openai->anthropic:2:01234567"
}
```

`hop` ∈ 0..4. Hop 5 é rejeitado.

---

## 8. Handoff Bundle para o Antigravity

Quando o trabalho chega ao human gate, o Control Plane monta um pacote com tudo que o operador precisa para julgar **sem reconstruir contexto**:

```
app · mission · stage · task
base SHA · current SHA · PR
plano (versão e diff)
review OpenAI R1
review Claude R1
review OpenAI R2
review Claude R2 (conclusivo)
findings abertos
divergências não resolvidas
resultados de CI
URL do preview Vercel
branch de preview do Supabase
recomendação final
```

Entregue como JSON assinado + resumo em markdown, consumível tanto pela UI quanto pelo Antigravity local.

---

## 9. Registry de agentes (YAML)

```yaml
version: 1
registry: rns-agent-registry

roles:
  R5:
    name: reviewer
    title: Reviewer
    description: Revisão adversarial e cross-model de plano e código
    write_policy: read_only
    independent_review: true
    can_schedule_runs: false
    can_approve_human_gate: false
    allowed_runtimes: [openai, anthropic]
    default_skills:
      - plan-review
      - code-review
    minimum_output: review.schema.json
```

O front-end **consome este registry**. É proibido escrever `if (agent === 'R3')` espalhado pela aplicação.

---

## 10. Versionamento de contratos

| Mudança | Como tratar |
|---|---|
| Campo novo opcional | minor; `schema_version` incrementa a minor |
| Campo novo obrigatório | **major**; exige migração de produtores e consumidores |
| Remover campo | major |
| Restringir enum | major |
| Ampliar enum | minor, desde que consumidores tolerem desconhecido |

Regras:

1. `additionalProperties: false` em todos os schemas. Campo desconhecido é erro, não é ignorado.
2. O Orchestrator valida **entrada e saída**.
3. CI valida todos os fixtures contra os schemas a cada PR.
4. Contract tests garantem que **todo** adapter respeita o mesmo contrato.

---

## 11. Erros da API interna

Formato único:

```json
{
  "error": {
    "code": "INVALID_TRANSITION",
    "message": "Não é possível ir de 'running' para 'completed'.",
    "details": { "from": "running", "to": "completed", "task_id": "tsk_01" },
    "correlation_id": "cor_07"
  }
}
```

| Código | HTTP | Quando |
|---|---|---|
| `UNAUTHENTICATED` | 401 | sem sessão válida |
| `FORBIDDEN` | 403 | sem permissão ou política DENY |
| `NOT_FOUND` | 404 | recurso inexistente **na organização do usuário** |
| `INVALID_INPUT` | 422 | falha de schema |
| `INVALID_TRANSITION` | 409 | máquina de estados rejeitou |
| `CONFLICT` | 409 | idempotência ou versão concorrente |
| `BUDGET_EXCEEDED` | 402 | budget estourado |
| `RATE_LIMITED` | 429 | limite interno |
| `UPSTREAM_UNAVAILABLE` | 502 | fornecedor fora |
| `INTERNAL` | 500 | não classificado |

`correlation_id` sempre presente, para percorrer o erro de ponta a ponta.

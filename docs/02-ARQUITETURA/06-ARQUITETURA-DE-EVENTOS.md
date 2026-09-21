# Arquitetura de Eventos

---

## 1. Por que eventos

A fábrica é um sistema distribuído: GitHub, Vercel, Supabase, OpenAI, Anthropic e workers próprios emitem sinais de forma assíncrona. Duplicação e desordem são **inevitáveis**, não excepcionais.

A resposta arquitetural é: **envelope canônico + idempotência + validação de estado antes de aplicar**.

---

## 2. Envelope canônico

```json
{
  "event_id": "evt_01JBXYZ...",
  "event_type": "review.completed",
  "aggregate_type": "task",
  "aggregate_id": "tsk_01",
  "organization_id": "org_01",
  "app_id": "app_01",
  "mission_id": "mis_01",
  "stage_id": "stg_03",
  "run_id": "run_04",
  "producer": "anthropic-adapter",
  "sequence": 18,
  "occurred_at": "2026-09-20T12:00:00Z",
  "received_at": "2026-09-20T12:00:01Z",
  "base_sha": "0123456789abcdef0123456789abcdef01234567",
  "correlation_id": "cor_07",
  "idempotency_key": "review:tsk_01:claude:r2:01234567",
  "payload": { "review_id": "rev_04", "verdict": "READY_FOR_HUMAN_APPROVAL" }
}
```

| Campo | Obrigatório | Regra |
|---|---|---|
| `event_id` | sim | único, gerado na ingestão |
| `event_type` | sim | `<domínio>.<ação>` em minúsculas |
| `aggregate_type` / `aggregate_id` | sim | a quem o evento pertence |
| `organization_id` | sim | isolamento multi-tenant |
| `sequence` | sim | monotônico por agregado |
| `producer` | sim | quem emitiu |
| `occurred_at` | sim | tempo da origem |
| `idempotency_key` | sim | **unique constraint no banco** |
| `payload` | sim | conteúdo específico, validado por schema |

---

## 3. Catálogo de eventos

### `app.*`
```
app.requested            app.spec_created         app.spec_approved
app.plan_reviewed        app.human_approved       app.provisioning_started
app.provisioning_step    app.provisioned          app.provisioning_failed
app.bootstrapped         app.ready                app.archived
```

### `mission.*` / `stage.*`
```
mission.created          mission.version_created  mission.submitted_for_review
mission.approved         mission.rejected         mission.completed
stage.ready              stage.executing          stage.reviewing
stage.awaiting_human     stage.approved           stage.blocked   stage.completed
```

### `task.*`
```
task.created             task.ready               task.queued
task.leased              task.running             task.artifact_ready
task.reviewing           task.awaiting_checks     task.awaiting_human
task.approved            task.completed           task.changes_required
task.failed              task.blocked             task.cancelled  task.superseded
```

### `run.*`
```
run.started              run.progress             run.tool_call
run.artifact_produced    run.completed            run.failed
run.cancelled            run.usage_recorded
```

### `review.*` / `finding.*`
```
review.cycle_opened      review.round_started     review.round_completed
review.cycle_closed      review.cycle_superseded  review.blocked
finding.created          finding.accepted         finding.rejected
finding.resolved         finding.deferred
disagreement.created     disagreement.resolved
```

### `approval.*`
```
approval.gate_opened     approval.granted         approval.rejected
approval.revision_requested   approval.gate_expired
```

### `github.*` (normalizados)
```
github.pr.opened         github.pr.synchronized   github.pr.closed
github.pr.merged         github.check.completed   github.push
github.review.submitted  github.installation.changed
```

### `vercel.*` / `supabase.*`
```
vercel.deployment.created    vercel.deployment.ready
vercel.deployment.error      vercel.check.completed
vercel.promotion.requested   vercel.promoted          vercel.rolled_back

supabase.branch.created      supabase.branch.ready
supabase.migration.applied   supabase.migration.failed
supabase.branch.deleted
```

### `budget.*` / `worker.*` / `human.*`
```
budget.threshold_reached     budget.exceeded          budget.increased
worker.registered            worker.heartbeat         worker.lease_expired
human.decision_recorded      human.comment_added      human.override
```

---

## 4. Idempotência — a regra mais importante

```
Chegou evento
      ↓
INSERT em webhook_events com idempotency_key
      ↓
   conflito?
   ├── SIM → já processado → responde 200 e ENCERRA
   └── NÃO → segue
      ↓
valida estado atual
      ↓
aplica transição EM TRANSAÇÃO
      ↓
emite evento interno (mesma transação)
      ↓
COMMIT
      ↓
enfileira próximo job (fora da transação, com retry)
```

### Como derivar a chave

| Tipo de evento | Fórmula |
|---|---|
| Webhook de provedor | `<source>:<delivery_id>` |
| Passagem de revisão | `review:<task_id>:<runtime>:<round>:<base_sha_curto>` |
| Transição de tarefa | `task:<task_id>:<from>:<to>:<trigger_hash>` |
| Job | `job:<kind>:<resource_id>:<attempt_group>` |
| Uso/custo | `usage:<run_id>:<provider>:<window>` |

**Nunca** usar timestamp na chave de idempotência.

---

## 5. Ordem e chegada fora de sequência

Eventos podem chegar fora de ordem. A defesa é dupla:

1. **`sequence` por agregado.** Evento com `sequence` menor que o último aplicado é registrado mas **não** reaplica transição.
2. **Validação de estado.** Mesmo em ordem, se a transição não é válida a partir do estado atual, ela é rejeitada.

```
Evento chegou com sequence 12, último aplicado foi 15
      ↓
registra em domain_events (para auditoria)
      ↓
NÃO aplica transição
      ↓
loga como out_of_order
```

---

## 6. Ingestão de webhooks

### Requisitos de toda rota `/api/webhooks/*`

| # | Requisito |
|---|---|
| 1 | Verificar assinatura antes de qualquer parsing de negócio |
| 2 | Responder `2xx` rápido (o provedor não deve esperar processamento) |
| 3 | Persistir o payload cru antes de processar |
| 4 | Nunca executar trabalho longo na própria requisição |
| 5 | Deduplicar por `delivery_id` do provedor |
| 6 | Normalizar para o envelope canônico |
| 7 | Registrar tentativa inválida (assinatura errada) como evento de segurança |
| 8 | Não vazar detalhe interno na resposta de erro |

### Pseudocódigo

```typescript
export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get('x-hub-signature-256');

  if (!verifySignature(raw, sig, secret)) {
    await recordSecurityEvent('webhook.invalid_signature', { source: 'github' });
    return new Response('unauthorized', { status: 401 });
  }

  const payload = JSON.parse(raw);
  const deliveryId = req.headers.get('x-github-delivery')!;
  const key = `github:${deliveryId}`;

  const inserted = await persistRawEvent({ source: 'github', deliveryId, raw: payload, key });
  if (!inserted) return new Response('duplicate', { status: 200 });

  const normalized = normalizeGithubEvent(payload);
  await enqueue('process-domain-event', normalized, { idempotencyKey: key });

  return new Response('accepted', { status: 202 });
}
```

---

## 7. Do evento à tela

```
domain_events (persistido)
        ↓
Supabase Realtime Broadcast no canal correspondente
        ↓
Control Plane assinado no canal
        ↓
atualização otimista da UI (apenas visual)
        ↓
refetch da leitura autoritativa quando necessário
```

Canais:

```
factory:<organization_id>      saúde geral, aprovações pendentes
app:<app_id>                   progresso do aplicativo
mission:<mission_id>           etapas e tarefas
run:<run_id>                   progresso de uma execução
deployment:<deployment_id>     build e release
```

Payload enviado ao navegador é **sempre** normalizado e enxuto:

```json
{ "event": "run.progress", "run_id": "run_421",
  "state": "reviewing", "summary": "12 arquivos analisados",
  "occurred_at": "2026-09-20T13:04:11Z" }
```

Nunca: stdout bruto, tokens do modelo, prompt completo, variáveis de ambiente.

---

## 8. Retenção

| Tabela | Retenção | Política |
|---|---|---|
| `webhook_events` (raw) | `UNSPECIFIED` — sugerido 90 dias | arquivar em Storage depois |
| `domain_events` | permanente enquanto o app existir | |
| `run_events` | 180 dias quentes, depois arquivar | |
| `audit_events` | **permanente** | append-only, nunca apagar |
| `evidence_items` | **permanente** | |
| `artifacts` (blobs) | conforme tipo; screenshots podem expirar | |

---

## 9. Testes obrigatórios

| Teste | O que prova |
|---|---|
| Replay do mesmo webhook 10x | Efeito aplicado exatamente uma vez |
| Evento fora de ordem | Não reaplica nem corrompe estado |
| Assinatura inválida | Rejeitado com 401 e registrado |
| Transição inválida | Rejeitada, auditada, sem efeito |
| Falha após commit, antes do enqueue | Job de reconciliação recupera |
| Dois workers no mesmo job | Lease garante um só dono |
| Canal Realtime cai e volta | UI refaz fetch, não replaya eventos perdidos |

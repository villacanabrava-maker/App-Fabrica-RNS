# Observabilidade

---

## 1. Três perspectivas, nunca misturadas

```
PRODUCT OBSERVABILITY
  os aplicativos PRODUZIDOS
  uptime, erros do app, uso pelos usuários finais

FACTORY OBSERVABILITY
  a FÁBRICA operando
  tarefas, filas, revisões, aprovações, gargalos, throughput

AGENT OBSERVABILITY
  os AGENTES trabalhando
  execuções, ferramentas, tokens, modelos, erros, custo
```

Misturá-las produz um painel que não responde a nenhuma pergunta bem. Cada uma tem sua aba em `03-PAGINAS/08-MONITORAMENTO.md`.

---

## 2. Correlation context

Todo `run` carrega, obrigatoriamente:

```
organization_id
app_id
mission_id
stage_id
task_id
review_cycle_id
run_id
parent_run_id
provider
model
role
skill_versions[]
base_sha
branch
pr_number
supabase_branch_id
vercel_deployment_id
trace_id
correlation_id
```

Com isso, um erro visto na interface é percorrível de ponta a ponta: da linha do log até o PR, o preview, a revisão e a decisão humana.

---

## 3. Spans lógicos padronizados

```
task.prepare
agent.provision
agent.start
agent.tool_call
agent.complete
artifact.validate
review.start
review.complete
github.commit
github.pr
ci.run
supabase.preview
vercel.preview
human_gate
release
```

Nomes fixos. Um span com nome livre não é agregável.

---

## 4. O que NUNCA vai para observabilidade

```
✗ prompts completos
✗ tokens de acesso e chaves
✗ variáveis de ambiente
✗ conteúdo de secret_refs
✗ dados pessoais
✗ cabeçalhos de autorização
✗ corpo bruto de payload com segredo
```

Prompts e transcrições ficam em Storage, referenciados por `artifacts`, com acesso restrito por permissão.

---

## 5. Níveis de log

| Nível | Uso | Exemplo |
|---|---|---|
| `ERROR` | Algo falhou e exige atenção | adapter retornou erro terminal |
| `WARN` | Anomalia que não interrompe | retry transitório, lease expirado |
| `INFO` | Evento de negócio relevante | run iniciado, ciclo concluído, aprovação registrada |
| `DEBUG` | Detalhe técnico | payload normalizado, decisão de política |
| `TRACE` | Verboso, desligado por padrão | cada chamada de ferramenta |

Em produção: `INFO` e acima. `DEBUG` habilitável por organização em Configurações → Avançado → Modo desenvolvedor.

---

## 6. Métricas essenciais

### Fábrica

```
tasks_created_total
tasks_completed_total
tasks_blocked_total
task_cycle_time_seconds          (histograma)
queue_depth                      (gauge, por fila)
lease_expirations_total
dead_letters_total
human_gate_wait_seconds          (histograma)  ★
approvals_total{decision}
```

★ `human_gate_wait_seconds` é a métrica mais reveladora da fábrica. É ela que expõe o gargalo humano.

### Agentes

```
runs_total{role,runtime,state}
run_duration_seconds{role,runtime}   (histograma)
run_cost_usd{role,runtime}
tokens_total{runtime,kind}
session_hours_total{runtime}
tool_calls_total{tool,decision}
schema_validation_failures_total
```

### Revisão

```
review_cycles_total{status}
review_rounds_total{runtime,round}
findings_total{category,severity}
disagreements_total{type,resolution}
review_cycle_duration_seconds
```

### Infraestrutura

```
webhook_events_total{source,valid}
webhook_duplicates_total
job_attempts_total{kind,outcome}
api_request_duration_seconds{route}
db_query_duration_seconds
```

---

## 7. Alertas

Regra de ouro: **só alertar o acionável.** Alerta que ninguém age vira ruído, e ruído faz ignorar o alerta que importa.

| Alerta | Severidade | Condição |
|---|---|---|
| Human gate parado > 24h | alta | gargalo humano ★ |
| Budget em 80% | média | |
| Budget excedido | alta | run interrompido |
| Taxa de erro de runs > limiar | alta | `UNSPECIFIED` |
| Dead letters acumulando | alta | |
| Fila crescendo sem consumo | alta | worker caído |
| Webhook com assinatura inválida | **crítica** | possível ataque |
| Agente tocou forbidden_path | **crítica** | incidente de segurança |
| Drift de projeção detectado | alta | inteligência inconsistente |
| Preview pair em timeout | média | |
| Integração com erro | média | |
| Migration falhou no preview | alta | |

---

## 8. Runbooks

Cada alerta crítico tem um runbook em `factory-intelligence/continuity/runbooks/`:

```
runbooks/
├── worker-down.md
├── queue-backlog.md
├── secret-leaked.md
├── agent-touched-forbidden-path.md
├── invalid-webhook-signature.md
├── migration-failed-production.md
├── projection-drift.md
├── budget-runaway.md
└── rls-isolation-failure.md
```

Cada um responde: **o que aconteceu · como confirmar · o que fazer agora · como prevenir**.

Runbook escrito depois do incidente já custou caro. Escrever antes é mais barato.

---

## 9. Retenção

| Dado | Quente | Arquivo |
|---|---|---|
| Logs de aplicação | 30 dias | 1 ano |
| `run_events` | 180 dias | arquivar |
| Métricas | 90 dias em alta resolução | agregadas por mais tempo |
| Traces | 7 dias | amostrados |
| `audit_events` | **permanente** | nunca apagar ★ |
| `evidence_items` | **permanente** | ★ |

---

## 10. Dashboard operacional

O painel principal da fábrica mostra, por aplicativo:

```
Mission
  ├── Task
  │   ├── Run OpenAI
  │   ├── Run Claude
  │   ├── findings
  │   ├── evidence
  │   └── cost
  ├── PR
  ├── Supabase Preview
  ├── Vercel Preview
  ├── Human Gate
  └── Deployment
```

Essa hierarquia é a mesma da navegação do produto. Observabilidade que usa vocabulário diferente do produto obriga a traduzir mentalmente — e sob pressão, ninguém traduz bem.

---

## 11. Checklist

```
□ Correlation context completo em todo run
□ Spans com nomes padronizados
□ Nenhum prompt, token ou secret em log  ★
□ Níveis de log definidos e respeitados
□ Métricas da §6 instrumentadas
□ human_gate_wait_seconds medido  ★
□ Alertas apenas acionáveis
□ Runbook para cada alerta crítico  ★
□ audit_events e evidence_items com retenção permanente
□ Dashboard usando o mesmo vocabulário do produto
□ Modo desenvolvedor expondo correlation_id na UI
□ Teste: seguir um correlation_id da UI até o PR e o preview
```

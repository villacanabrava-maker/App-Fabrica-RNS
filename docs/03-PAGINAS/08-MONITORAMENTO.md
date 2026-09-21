# Página 08 — Monitoramento

---

## 1. Identidade

| | |
|---|---|
| **Rotas** | `/monitoramento` + sub-abas |
| **Ícone da navegação** | `monitoring` |
| **Título** | "Monitoramento" |
| **Subtítulo** | "Acompanhe o desempenho dos seus agentes, fluxos e integrações em tempo real." |
| **Fase** | `[F1]` com dados de execuções mock · `[F2]` telemetria real de agentes |
| **Permissão mínima** | `viewer` |

---

## 2. Objetivo

```
A fábrica está saudável?
O que falhou e por quê?
Quanto está custando?
Onde está o gargalo?
Preciso agir agora?
```

★ **Regra fundadora desta página:** ela mostra **três observabilidades diferentes** e nunca as mistura:

```
PRODUCT OBSERVABILITY   os aplicativos produzidos (uptime, erros do app)
FACTORY OBSERVABILITY   tarefas, filas, revisões, aprovações, gargalos
AGENT OBSERVABILITY     execuções, ferramentas, tokens, modelos, erros
```

A aba "Visão Geral" resume as três; as demais aprofundam cada uma.

---

## 3. Anatomia

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Monitoramento                        [📅Últimos 7 dias ▾]  [⟳ Atualizar] │
│ Acompanhe o desempenho dos seus agentes, fluxos e integrações.           │
├──────────────────────────────────────────────────────────────────────────┤
│ ⊞Visão Geral │👥Agentes │⛓Fluxos │📊Uso de Recursos │📄Logs │🔔Alertas │  │
│ 📈Relatórios                                                             │
├──────────────────────────────────────────────────────────────────────────┤
│ ┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐                      │
│ │⚡156   ││✓96%    ││⏰2m18s ││👥8     ││⚠2      │                      │
│ │Execuç. ││Taxa de ││Tempo   ││Agentes ││Erros   │                      │
│ │        ││sucesso ││médio   ││ativos  ││        │                      │
│ │↑18%    ││↑5%     ││↓22%    ││→ sem   ││↓60%    │                      │
│ └────────┘└────────┘└────────┘└────────┘└────────┘                      │
├───────────────────────────────────┬──────────────┬───────────────────────┤
│ EXECUÇÕES AO LONGO DO TEMPO  7d ▾ │ STATUS DAS   │ USO DE RECURSOS       │
│ 40┤                               │ EXECUÇÕES    │ ⚙CPU        28% ▓▓░░  │
│ 30┤          ╭─●───╮  ╭●──●       │   ╭─────╮    │ 📊Memória   42% ▓▓▓░  │
│ 20┤      ╭●──╯     ╰──╯           │  ╱  156  ╲   │ 🗄Armazen.  68% ▓▓▓▓░ │
│ 10┤  ╭●──╯   ╭●                   │ │Execuções│  │ 📦Tokens(IA)          │
│  0┼──●───────────────────────     │  ╲       ╱   │   3.2M / 8M  ▓▓▓░░░   │
│   01 02 03 04 05 06 07 set        │   ╰─────╯    │                       │
│   ●Total ●Sucesso ●Erros          │ ●Sucesso 150 │                       │
│   [tooltip: 05 set — Total 34,    │ ●Erro      2 │                       │
│    Sucesso 32, Erros 2]           │ ●Execuç.   3 │                       │
│                                   │ ●Aguard.   1 │                       │
├───────────────────────┬───────────┴──────────────┼───────────────────────┤
│ AGENTES MAIS ATIVOS   │ ERROS RECENTES           │ ALERTAS E NOTIFICAÇÕES│
│        Ver todos →    │        Ver todos →       │        Ver todos →    │
│ #│Agente    │Exec│Taxa│ Horário│Agente│Mensagem  │⚠Alto uso de tokens    │
│ 1│R1 Orches.│ 48 │98% │ 14:21  │ R4   │Falha ao  │  Uso acima de 80%     │
│ 2│R3 Data   │ 32 │97% │        │      │gerar comp│  Hoje 13:50           │
│ 3│R4 Builder│ 28 │93% │ 11:07  │ R3   │Timeout   │❗Erro em R4 — Frontend │
│ 4│R5 Review.│ 24 │96% │ 09:34  │ R5   │Limite de │  Hoje 11:07           │
│ 5│R2 Archit.│ 18 │94% │        │      │tokens    │✓Recuperação automática│
│                       │ 18:12  │ R2   │Erro valid│  Agente reiniciado    │
│                       │ 16:48  │ R1   │Falha aná.│ℹAlta taxa de sucesso  │
├───────────────────────┼──────────────────────────┼───────────────────────┤
│ LOGS EM TEMPO REAL    │ TEMPO DE RESPOSTA   7d ▾ │ DISTRIBUIÇÃO POR TIPO │
│        Ver todos →    │ 4m┤                      │   ╭─────╮             │
│ ┌───────────────────┐ │ 3m┤      ▂  ▄           │  ╱  156  ╲            │
│ │14:32:11[INFO] R1  │ │ 2m┤ ▂ ▃ ▅ █  █ ▆        │ │Execuções│           │
│ │ Iniciando execuç..│ │ 1m┤ █ █ █ █  █ █ █      │  ╲       ╱            │
│ │14:32:12[INFO] R3  │ │ 0s┼──────────────────    │   ╰─────╯             │
│ │ Buscando dados... │ │   01 02 03 04 05 06 07   │ ●Análise dados  32%   │
│ │14:32:14[SUCCESS]  │ │                          │ ●Geração conteúdo 24% │
│ │ Dados recuperados │ │                          │ ●Integração sist. 18% │
│ │14:32:15[INFO] R5  │ │                          │ ●Desenvolvimento  16% │
│ │ Analisando info...│ │                          │ ●Outros           10% │
│ └───────────────────┘ │                          │                       │
└───────────────────────┴──────────────────────────┴───────────────────────┘
```

### Sub-abas

| Aba | Conteúdo | Observabilidade |
|---|---|---|
| **Visão Geral** | KPIs + gráficos resumo (acima) | as três |
| **Agentes** | Desempenho por papel e runtime: execuções, sucesso, custo, latência P50/P95 | agente |
| **Fluxos** | Execuções de fluxo, gargalos por nó, taxa de falha por passo | fábrica |
| **Uso de Recursos** | CPU, memória, armazenamento, tokens, custo por período e por app | agente + fábrica |
| **Logs** | Visor unificado com filtros por nível, agente, projeto, run e texto | agente |
| **Alertas** | Regras de alerta, histórico de disparos, reconhecimento | as três |
| **Relatórios** | Relatórios exportáveis por período | as três |

★ **Aba faltante nas telas de referência que deve ser adicionada:** **Esteira / Gargalos**, mostrando onde o trabalho está parado (fila, revisão, human gate). Em uma fábrica, o gargalo mais comum não é técnico — é a fila humana de aprovação. Isso precisa ser visível.

```
GARGALOS ATUAIS
┌──────────────────────────────────────────────────────────┐
│ Etapa               │ Itens │ Espera mediana │ Mais antigo│
│ Aguardando humano   │   3   │ 4h 20m         │ 1d 3h  ★   │
│ Em revisão (R2)     │   2   │ 12m            │ 28m        │
│ Na fila             │   5   │ 3m             │ 9m         │
│ CI                  │   1   │ 6m             │ 6m         │
└──────────────────────────────────────────────────────────┘
```

---

## 4. Inventário de ícones

| Ícone | Onde | Nome | Ação | Rótulo | Fase |
|---|---|---|---|---|---|
| 📉 | sidebar | `monitoring` | `/monitoramento` | "Monitoramento" | F1 |
| 📅 | seletor de período | `calendar` | abre opções (24h/7d/30d/custom) | "Período: últimos 7 dias" | F1 |
| ⟳ | Atualizar | `refresh` | refaz consultas | "Atualizar dados" | F1 |
| ⊞👥⛓📊📄🔔📈 | abas | `Icon` por aba | muda aba | nome da aba | F1 |
| ⚡ | KPI Execuções | `zap` | decorativo | `aria-hidden` | F1 |
| ✓ | KPI Taxa de sucesso | `check-circle` | decorativo | `aria-hidden` | F1 |
| ⏰ | KPI Tempo médio | `clock` | decorativo | `aria-hidden` | F1 |
| ⚠ | KPI Erros | `alert` | filtra a aba Logs por erro | "2 erros, ver detalhes" | F1 |
| ↑↓→ | deltas | `arrow-*` | decorativo | direção descrita no texto | F1 |
| ▾ | seletores de período nos cards | `chevron-down` | abre | rótulo do card | F1 |
| ⋯ | linhas de tabela | `more` | Ver execução, Ver logs, Reexecutar | "Mais ações" | F1 |
| → | "Ver todos" | `arrow-right` | navega para a aba completa | dentro do link | F1 |
| ⚠❗✓ℹ | ícones de alerta por severidade | `alert`/`error`/`check`/`info` | abre o alerta | severidade + título | F1 |
| ⚙📊🗄📦 | linhas de uso de recurso | `Icon` por recurso | decorativo | recurso + percentual | F1 |
| [INFO][SUCCESS][ERROR] | níveis no log | badge textual | filtra por nível | nível do log | F1 |

---

## 5. Componentes

`PageHeader` · `PeriodSelector` · `Tabs` · `KpiCard` ×5 · `LineChart` · `DonutChart` ×2 · `BarChart` · `ResourceBar` · `DataTable` ×3 · `LogViewer` · `AlertList` · `BottleneckTable` · `ExportDialog` · `AsyncBoundary`

---

## 6. Dados exibidos

| Elemento | Origem | Fase |
|---|---|---|
| Execuções | `count(agents.runs)` no período | F1 |
| Taxa de sucesso | `runs` `succeeded` / total | F1 |
| Tempo médio | `avg(runs.wall_ms)` | F1 |
| Agentes ativos | `agent_profiles` com run nas últimas 24h | F1 |
| Erros | `runs` `failed` no período | F1 |
| Série de execuções | `runs` agrupado por dia | F1 |
| Status das execuções | `runs` agrupado por `state` | F1 |
| CPU / Memória / Armazenamento | telemetria do worker pool | **F2** ★ |
| Tokens (IA) | `sum(usage_records.input_tokens + output_tokens)` vs budget | F2 |
| Agentes mais ativos | `runs` agrupado por `role_id` | F1 |
| Erros recentes | `runs` `failed` + `run_events` de erro | F1 |
| Alertas | regras avaliadas + `budget_alerts` | F1 |
| Logs | `agents.run_events` + `tool_events` | F1 |
| Tempo de resposta | percentis de `runs.wall_ms` por dia | F1 |
| Distribuição por tipo | `tasks.kind` agrupado | F1 |
| Gargalos | `tasks` agrupadas por estado, com `now() - updated_at` | F1 ★ |

★ **Regra inegociável:** CPU, memória e armazenamento **não existem na Fase 1**. O card mostra estado vazio com "Telemetria de infraestrutura disponível a partir da Fase 2", **não** números fictícios. Exibir `28%` inventado é defeito grave: cria confiança falsa em um painel de operação.

---

## 7. Interações

| Interação | Comportamento |
|---|---|
| Trocar período | Recalcula todos os blocos; preferência persiste por usuário |
| Clicar num ponto do gráfico | Abre a lista de execuções daquele dia |
| Clicar num KPI | Navega para a aba correspondente já filtrada |
| Clicar num erro | Abre o detalhe da execução com o `correlation_id` |
| Filtrar logs | Nível, agente, projeto, run, texto livre; combináveis |
| Pausar auto-scroll dos logs | Botão explícito; retoma ao fim |
| Reconhecer alerta | Grava quem e quando; some da lista ativa |
| Exportar relatório | CSV ou PDF do período e da aba corrente |
| Clicar em gargalo | Abre a lista dos itens parados naquele estado |

---

## 8. Estados

| Estado | Comportamento |
|---|---|
| Loading | Skeleton por card; gráficos com eixos e área cinza |
| Empty (sem execuções) | "Nenhuma execução no período." + sugestão de ampliar o período |
| Empty (telemetria ausente) | Card explica que a métrica chega na Fase 2 ★ |
| Error | Por bloco; um gráfico que falhou não derruba a página |
| Partial | Métricas de execução vieram, telemetria não |
| Stale | "Atualizado há X" + botão atualizar quando o realtime cai |
| Forbidden | `viewer` vê tudo; não reconhece alertas nem reexecuta |

---

## 9–10. Rotas e endpoints

```
GET /api/monitoring/overview?period=7d
GET /api/monitoring/agents?period=&role=&runtime=
GET /api/monitoring/flows?period=
GET /api/monitoring/resources?period=
GET /api/monitoring/bottlenecks
GET /api/monitoring/logs?level=&agent=&app=&run=&q=&cursor=
GET /api/monitoring/alerts?state=
POST /api/monitoring/alerts/:id/acknowledge
GET /api/monitoring/reports?period=&format=csv|pdf
GET /api/monitoring/timeseries?metric=&period=&granularity=
```

Todas as agregações são feitas **no banco**, não no cliente. Somar 156 execuções no navegador é aceitável; somar 156 mil não é.

---

## 11. Tabelas

`agents.runs` · `agents.run_events` · `agents.tool_events` · `workflow.tasks` · `workflow.jobs` · `workflow.dead_letters` · `factory.flow_runs` · `factory.usage_records` · `factory.budgets` · `factory.budget_alerts` · `governance.audit_events`

Views materializadas recomendadas (refresh incremental):
```sql
monitoring.daily_run_stats       (org, day, total, succeeded, failed, avg_ms, p95_ms)
monitoring.agent_performance     (org, role_id, runtime, period, runs, success_rate, avg_cost)
monitoring.task_bottlenecks      (org, state, count, median_wait, oldest_wait)
```

---

## 12. Eventos

```
run.started · run.completed · run.failed
budget.threshold_reached · budget.exceeded
worker.lease_expired · job.dead_lettered
alert.triggered · alert.acknowledged
```

Realtime atualiza KPIs e a lista de erros recentes; gráficos históricos recarregam por período, não por evento.

---

## 13. Permissões

| Ação | Papel mínimo |
|---|---|
| Ver painéis | `viewer` |
| Ver logs | `engineer` (logs podem conter caminhos de arquivo) |
| Reconhecer alerta | `engineer` |
| Reexecutar tarefa | `engineer` |
| Exportar relatório | `engineer` |
| Configurar regra de alerta | `admin` |

---

## 14. Acessibilidade

- **Todo gráfico tem tabela alternativa.** Botão "Ver como tabela" em cada visualização, com os mesmos dados.
- `aria-label` do gráfico descreve a tendência: "Execuções ao longo de 7 dias, de 5 em 1º de setembro a 30 em 7 de setembro, com 2 erros no dia 5".
- Tooltips acessíveis por teclado ao navegar pelos pontos.
- `LogViewer` com `aria-live` e throttle, botão de pausa e `role="log"`.
- Cores de série nunca sozinhas: cada série tem marcador de forma distinta e rótulo.
- Alertas críticos usam `role="alert"`; informativos usam `aria-live="polite"`.

---

## 15. Performance

- Agregações via views materializadas com refresh agendado.
- Gráficos em `dynamic import`.
- Logs por cursor, janelas de 200 linhas.
- Realtime só na aba visível.
- Cache por período: 24h e 7d com TTL curto; 30d com TTL maior.

---

## 16. Fase

`[F1]` Visão Geral, Agentes, Fluxos, Logs, Alertas, Gargalos, Relatórios — com dados reais de execuções mock.
`[F2]` Uso de Recursos com telemetria real, custo real por token e sessão.
`[F4]` métricas de qualidade dos evals integradas à aba Agentes.

---

## 17. Definition of Done

```
□ As 7 abas + a aba Gargalos funcionando
□ NENHUM número de infraestrutura fictício na Fase 1  ★
□ Agregações feitas no banco, não no cliente
□ Views materializadas criadas e com refresh agendado
□ Todo gráfico tem alternativa em tabela
□ Logs filtráveis por nível, agente, projeto, run e texto
□ Auto-scroll pausável
□ Alertas reconhecíveis com registro de quem e quando
□ Exportação CSV e PDF do período corrente
□ Clicar em KPI leva à lista filtrada correta
□ Tabela de gargalos mostra espera mediana e item mais antigo
□ axe sem violações; gráficos testados com leitor de tela
□ Playwright: trocar período → clicar em erro → abrir execução → ver log
```

# Página 03 — Agentes de IA

---

## 1. Identidade

| | |
|---|---|
| **Rotas** | `/agentes` (catálogo) · `/agentes/:id` (detalhe) |
| **Ícone da navegação** | `agents` |
| **Título** | "Agentes de IA" |
| **Subtítulo** | "Seus trabalhadores especializados: papéis, capacidades, desempenho e permissões." |
| **Fase** | `[F1]` catálogo e detalhe com agentes mock · `[F2]` runtimes reais |
| **Permissão mínima** | `viewer` |

---

## 2. Objetivo

```
Quem são meus trabalhadores?
O que cada um sabe fazer?
Com que permissão eles operam?
Quão bem estão performando?
O que estão fazendo agora?
```

★ **Conceito central que a página precisa comunicar:** um agente é um **papel** (R1–R9), não um fornecedor. O mesmo papel pode ser executado por OpenAI ou por Anthropic. A tela deve deixar isso óbvio, porque é o que permite trocar de modelo sem reescrever a fábrica.

---

## 3A. Anatomia — Catálogo `/agentes`

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Agentes de IA                                        [+ Novo Agente]     │
│ Seus trabalhadores especializados: papéis, capacidades e desempenho.     │
├──────────────────────────────────────────────────────────────────────────┤
│ Todos │ Ativos │ Em execução │ Inativos │ Por desempenho                 │
├──────────────────────────────────────────────────────────────────────────┤
│ 🔍 Buscar agentes... │ Todos os papéis ▾ │ Todos os runtimes ▾ │ ⚙Filtros│
├──────────────────────────────────────────────────────────────────────────┤
│ ┌───────────────────────┐ ┌───────────────────────┐ ┌──────────────────┐│
│ │ A   R1 — Orchestrator │ │ 📦  R2 — Architecture │ │ 🗄 R3 — Data &   ││
│ │     Coordenação e     │ │     Arquitetura e     │ │    Supabase      ││
│ │     Estratégia  ●Online│ │     Contratos ●Online │ │    ●Online       ││
│ │ Analisa a demanda,    │ │ Define interfaces,    │ │ Schema, migrations││
│ │ decompõe tarefas...   │ │ ADRs, trade-offs      │ │ RLS, dados        ││
│ │ [Planejamento][Orq.]  │ │ [Arquitetura][ADR]    │ │ [Dados][RLS]      ││
│ │ 124 exec · 98% · 1m24s│ │ 18 exec · 94% · 3m02s │ │ 32 exec · 97%     ││
│ │ read-only             │ │ read-only             │ │ read-only         ││
│ └───────────────────────┘ └───────────────────────┘ └──────────────────┘│
│   ... R4 Builder · R5 Reviewer · R6 QA · R7 Security · R8 UX · R9 Release│
└──────────────────────────────────────────────────────────────────────────┘
```

★ **Correção importante em relação às telas de referência.** As imagens mostram tanto uma nomenclatura por fornecedor ("AntiGravity", "ChatGPT", "Claude Code") quanto uma por papel ("R1 – Orchestrator", "R2 – Architecture", "R3 – Data & Supabase", "R4 – Frontend", "R5 – Cognitive", "R6 – QA & Eval"). As duas coexistem porque representam coisas diferentes:

| Conceito | Onde aparece | Exemplo |
|---|---|---|
| **Papel (R1–R9)** | Esta página, o registry, os Task Packets | R5 — Reviewer |
| **Runtime/fornecedor** | Aba "Ferramentas" do agente e a página Integrações | OpenAI, Anthropic, Antigravity |

A taxonomia canônica é **R1–R9 conforme `06-INTELIGENCIA-DOS-AGENTES/02-REGISTRY-R1-R9.md`**. Os nomes alternativos vistos nas telas ("R4 – Frontend", "R5 – Cognitive") são apelidos de rascunho e **não** devem ser implementados. O mapa oficial é:

```
R1 Orchestration Intelligence   R6 QA & Testing
R2 Architecture                 R7 Security & Data
R3 Research                     R8 UX & Browser Verification
R4 Builder                      R9 Release & Evidence
R5 Reviewer
```

Cards de fornecedor ("AntiGravity / ChatGPT / Claude Code") continuam existindo — mas no **Dashboard** e em **Integrações**, como status de runtime, não como agentes.

---

## 3B. Anatomia — Detalhe `/agentes/:id`

```
┌──────────────────────────────────────────────────────────────────────────┐
│ 🏠 > Agentes de IA > R1 - Orchestrator    [🧪Testar][✏Editar][▶Executar] │
│ ┌────┐                                          ┌──────────────────────┐ │
│ │ A  │ R1 - Orchestrator      ● Online          │ Modelo    resolvido  │ │
│ │    │ Coordenação e Estratégia                 │ Temperatura   0.3    │ │
│ └────┘ Analisa a demanda, decompõe tarefas,     │ Máx. tokens   8.000  │ │
│        seleciona agentes, coordena o fluxo      │ Última exec. 12 min  │ │
│        e garante a entrega com qualidade.       │ Taxa sucesso   98%   │ │
│        [Planejamento][Orquestração][Governança] │ Tempo médio   1m24s  │ │
│        [Estratégia][Análise de Requisitos]      └──────────────────────┘ │
├──────────────────────────────────────────────────────────────────────────┤
│ ⊞Visão Geral │ ⚙Skills(8) │ ▷Prompt │ 🔧Ferramentas │ ☰Execuções │       │
│ ✓Avaliações │ ⚙Configurações                                             │
├──────────────────────────────────────────────────────────────────────────┤
│ ┌──────┐┌──────┐┌──────┐┌──────────┐┌──────────┐                        │
│ │ 124  ││ 98%  ││1m24s ││ Há 12min ││    7     │                        │
│ │Execuç││Sucess││Tempo ││Última    ││Projetos  │                        │
│ │totais││      ││médio ││execução  ││ativos    │                        │
│ └──────┘└──────┘└──────┘└──────────┘└──────────┘                        │
├──────────────────────┬──────────────────┬────────────────────────────────┤
│ CAPACIDADES          │ EXECUÇÃO EM      │ LOGS EM TEMPO REAL   Ver todos→│
│ PRINCIPAIS           │ TEMPO REAL       │ ┌────────────────────────────┐ │
│ ✓ Análise e decomp.  │ ● Executando...  │ │[10:24:01] Iniciando análise│ │
│   de requisitos      │ ✓ Analisando     │ │[10:24:03] Projeto ident... │ │
│ ✓ Planejamento com   │   requisitos     │ │[10:24:05] Decompondo...    │ │
│   múltiplos agentes  │   Concluído 12s  │ │[10:24:08] Módulos: 6       │ │
│ ✓ Seleção automática │ ✓ Decompondo     │ │[10:24:10] Selecionando...  │ │
│ ✓ Prioridades e      │   em tarefas     │ │[10:24:12] R2 selecionado   │ │
│   dependências       │ ③ Selecionando   │ │[10:24:13] R6 (QA) selec.   │ │
│ ✓ Monitoramento      │   agentes        │ │[10:24:15] Status: em and. ✓│ │
│ ✓ Ajuste de rota     │ ④ Enviando...    │ └────────────────────────────┘ │
│ ✓ Validação final    │ ⑤ Monitorando    │                                │
│ ✓ Documentação       │ ⑥ Validando      │                                │
│                      │ ⑦ Relatório      │                                │
│ INTEGRAÇÕES          │                  │                                │
│ [GitHub✓][Supabase✓] │                  │                                │
│ [Vercel✓][Slack✓]    │                  │                                │
├──────────────────────────────────────────────────────────────────────────┤
│ PROJETOS QUE UTILIZAM ESTE AGENTE                        Ver todos →     │
│ 🎓Sistema Escolar 70% │ 🛒E-commerce 40% │ ❤App Saúde 20% │ 📖Cursos 100%│
└──────────────────────────────────────────────────────────────────────────┘
```

### Abas do detalhe

| Aba | Conteúdo | Fase |
|---|---|---|
| **Visão Geral** | KPIs, capacidades, execução ao vivo, logs, projetos | F1 |
| **Skills** | Skills canônicas atribuídas, versão, origem, última alteração | F1 |
| **Prompt** | Bootloader efetivo + o que é herdado da Constituição. **Somente leitura** para `engineer`; edição só via PR | F2 ★ |
| **Ferramentas** | Ferramentas e MCP permitidos, com decisão ALLOW/ASK/DENY por ferramenta | F2 |
| **Execuções** | Histórico de runs com filtro, custo e duração | F1 |
| **Avaliações** | Resultados de evals: precision, recall, aceitação humana | F4 |
| **Configurações** | Runtime preferido, temperatura, máx. tokens, ativar/desativar | F1 |

★ **Regra de segurança:** a aba Prompt **não permite edição direta pela interface**. O prompt efetivo vem de `factory-intelligence/`, que é código privilegiado sob CODEOWNERS. A tela mostra o texto resolvido e um botão "Propor alteração" que **abre um PR**, não grava no banco.

---

## 4. Inventário de ícones

### Catálogo

| Ícone | Onde | Nome | Ação | Rótulo | Fase |
|---|---|---|---|---|---|
| ⚙ engrenagem | sidebar | `agents` | `/agentes` | "Agentes de IA" | F1 |
| + | botão primário | `plus` | abre criação de perfil de agente | "Novo agente" | F1 |
| 🔍 | filtro | `search` | busca | "Buscar agentes" | F1 |
| ▾ | selects de papel/runtime | `chevron-down` | abre opções | rótulo do select | F1 |
| ⚙ | Filtros | `filter` | painel avançado | "Filtros avançados" | F1 |
| A/📦/🗄 etc. | avatar do agente | `Avatar` por papel | abre detalhe | nome do papel | F1 |
| ● | status online/offline | `dot` + rótulo | decorativo | texto junto | F1 |
| 🔒 | badge de write policy | `lock` | tooltip com a política | "read-only" | F1 |

### Detalhe

| Ícone | Onde | Nome | Ação | Rótulo | Fase |
|---|---|---|---|---|---|
| 🏠 | breadcrumb | `home` | `/` | "Início" | F1 |
| 🧪 | Testar Agente | `flask` | roda o agente em fixture isolada, sem tocar repositório | "Testar agente" | F1 |
| ✏ | Editar | `edit` | abre aba Configurações | "Editar agente" | F1 |
| ▶ | Executar | `play` | abre modal para escolher tarefa e disparar run | "Executar agente" | F1 |
| ⊞ | aba Visão Geral | `grid` | muda aba | "Visão geral" | F1 |
| ⚙ | aba Skills | `settings` | muda aba | "Skills, 8 atribuídas" | F1 |
| ▷ | aba Prompt | `play-outline` | muda aba | "Prompt" | F2 |
| 🔧 | aba Ferramentas | `tool` | muda aba | "Ferramentas" | F2 |
| ☰ | aba Execuções | `list` | muda aba | "Execuções" | F1 |
| ✓ | aba Avaliações | `check-circle` | muda aba | "Avaliações" | F4 |
| ✓ verde | lista de capacidades | `check` | decorativo | `aria-hidden` | F1 |
| ● pulsante | "Executando plano..." | `dot-pulse` | decorativo | estado no `aria-live` | F1 |
| ①–⑦ | passos da execução | numeral | clica → abre o passo nos logs | "Passo N: nome, status" | F1 |
| 🔗 | Ver todos (logs) | `external` | abre visor completo de logs | "Ver todos os logs" | F1 |
| chips de integração | GitHub/Supabase/Vercel/Slack | `brand/*` | abre a integração | "GitHub conectado" | F1 |
| ▓ barra | progresso de projeto | `Progress` | abre projeto | percentual no texto | F1 |

---

## 5. Componentes

`PageHeader` · `Tabs` · `FilterBar` · `AgentCard` · `KpiCard` ×5 · `CapabilityList` · `RunTimeline` (passos numerados) · `LogViewer` · `IntegrationChip` · `ProjectProgressCard` · `DataTable` (execuções) · `SkillList` · `ToolPolicyTable` · `AsyncBoundary`

---

## 6. Dados exibidos

| Elemento | Origem |
|---|---|
| Lista de agentes | `agents.agent_profiles` join `agents.agent_roles` |
| Papel, descrição, write policy | `agent_roles` (espelho de `factory-intelligence/registry/agents.yaml`) |
| Status online | health check do adapter do runtime preferido. `[F1]` mock = sempre online |
| Execuções totais | `count(agents.runs)` por `role_id` |
| Taxa de sucesso | `runs` com `state='succeeded'` / total |
| Tempo médio | `avg(runs.wall_ms)` |
| Última execução | `max(runs.started_at)` |
| Projetos ativos | distinct `app_id` em `runs` recentes |
| Capacidades | `agent_roles` + skills atribuídas |
| Execução em tempo real | `agents.run_events` do run ativo |
| Logs | `agents.run_events` paginados |
| Integrações | `factory.integrations` relevantes ao runtime |
| Modelo / temperatura / máx. tokens | `agent_profiles` + `model_profiles`. **Modelo é resolvido, nunca hardcoded** |

★ **Regra:** o campo "Modelo" exibe o **valor resolvido em runtime** a partir de `models.yaml`. A interface nunca deve permitir digitar o nome de um modelo em texto livre — só selecionar entre os habilitados no registry.

---

## 7. Interações

| Interação | Comportamento |
|---|---|
| "Testar Agente" | Executa contra uma fixture de eval em sandbox. **Não toca em repositório nem em banco real.** Mostra saída e validação de schema |
| "Executar" | Abre modal: escolher tarefa elegível → confirma → cria run. Requer `engineer` |
| Alternar runtime preferido | Salva em `agent_profiles.runtime_preference`. Não altera o papel |
| Ativar/desativar agente | `enabled = false` impede novos runs; não cancela os em andamento |
| Clicar num passo da execução | Filtra os logs naquele passo |
| Propor alteração de prompt | **Abre PR**, não grava no banco ★ |
| Clicar em projeto | `/projetos/:id` |

---

## 8. Estados

| Estado | Comportamento |
|---|---|
| Loading | Skeleton de cards; logs com 5 linhas fantasma |
| Empty (catálogo) | Não ocorre: os nove papéis são semeados na migration inicial |
| Empty (execuções) | "Este agente ainda não executou nada." + "Testar agente" |
| Empty (logs) | "Nenhuma execução ativa." |
| Error (runtime offline) | Banner no card: "Runtime indisponível" + última verificação + retry |
| Partial | Métricas carregaram, logs não → bloco de logs isolado com erro |
| Forbidden | `viewer` não vê a aba Prompt nem os botões de execução |

---

## 9–10. Rotas e endpoints

```
GET  /api/agents                      lista com métricas agregadas
GET  /api/agents/:id
PATCH /api/agents/:id                 runtime preferido, temperatura, enabled
GET  /api/agents/:id/runs?page=
GET  /api/agents/:id/skills
GET  /api/agents/:id/prompt           texto resolvido (read-only)
POST /api/agents/:id/propose-prompt   abre PR             [F2]
GET  /api/agents/:id/tools            política por ferramenta  [F2]
POST /api/agents/:id/test             executa fixture em sandbox
POST /api/agents/:id/run              cria run para tarefa elegível
GET  /api/agents/:id/evals            [F4]
GET  /api/runs/:runId/events?after=   paginação de logs
```

---

## 11. Tabelas

`agents.agent_roles` · `agents.agent_profiles` · `agents.runtime_profiles` · `agents.model_profiles` · `agents.skill_versions` · `agents.runs` · `agents.run_events` · `agents.tool_events` · `agents.intelligence_versions` · `factory.integrations`

---

## 12. Eventos

Assina `run:<run_id>` quando há execução ativa e `factory:<org>` para saúde geral.

```
run.started · run.progress · run.tool_call
run.artifact_produced · run.completed · run.failed
worker.heartbeat (saúde dos runtimes)
```

`run.progress` atualiza a lista de passos; `run.tool_call` alimenta a aba Ferramentas.

---

## 13. Permissões

| Ação | Papel mínimo |
|---|---|
| Ver catálogo e detalhe | `viewer` |
| Ver aba Prompt | `engineer` |
| Testar agente | `engineer` |
| Executar agente | `engineer` |
| Alterar configuração do perfil | `admin` |
| Propor alteração de prompt | `engineer` (vira PR, revisado por CODEOWNERS) |
| Alterar papéis do registry | **ninguém pela UI** — só por PR ★ |

---

## 14. Acessibilidade

- O `LogViewer` tem `aria-live="polite"` com **throttle de 2s** e botão "Pausar rolagem automática". Sem isso, um leitor de tela fica inutilizável durante uma execução.
- A lista de passos numerados usa `<ol>` com `aria-current="step"` no passo ativo.
- Status "Online" nunca depende só do ponto verde.
- A tabela de execuções tem `caption` e `th scope`.
- Chips de integração têm nome acessível completo: "GitHub, conectado".

---

## 15. Performance

- Logs carregados em janelas de 200 linhas, com paginação por cursor.
- Realtime de logs só ativo quando a aba está visível (`document.visibilityState`).
- Métricas agregadas vêm pré-calculadas do servidor, não somadas no cliente.

---

## 16. Fase

`[F1]` catálogo, detalhe, Visão Geral, Skills, Execuções, Configurações — com `MockAdapter`.
`[F2]` Prompt, Ferramentas, status real de runtime, execução real.
`[F4]` aba Avaliações.

---

## 17. Definition of Done

```
□ Os nove papéis R1–R9 semeados e exibidos
□ Nomenclatura por papel, não por fornecedor
□ Write policy visível em cada card
□ Modelo exibido é resolvido do registry, nunca texto livre
□ "Testar Agente" roda em sandbox sem tocar repositório ou banco real
□ Aba Prompt é somente leitura; "Propor alteração" abre PR
□ LogViewer com throttle de aria-live e pausa de auto-scroll
□ Passos de execução navegáveis por teclado
□ Estados de runtime offline tratados sem quebrar a página
□ Execuções paginadas por cursor
□ axe sem violações; logs testados com leitor de tela
□ Playwright: abrir agente → testar → ver resultado → ver log
```

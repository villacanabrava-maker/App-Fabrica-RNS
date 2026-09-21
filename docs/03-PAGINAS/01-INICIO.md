# Página 01 — Início (Dashboard)

---

## 1. Identidade

| | |
|---|---|
| **Rota** | `/` |
| **Ícone da navegação** | `home` |
| **Título** | "Dashboard" |
| **Subtítulo** | "Visão geral da Fábrica de Aplicativos RNS — Acompanhe seus projetos, agentes e resultados em tempo real." |
| **Fase** | `[F1]` estrutura completa · `[F2]` dados de agentes reais |
| **Permissão mínima** | `viewer` |

---

## 2. Objetivo

A tela inicial **não deve despejar detalhe técnico**. Ela responde cinco perguntas, nesta ordem de prioridade:

```
1. O que precisa da MINHA decisão?      ← mais importante
2. O que está sendo construído?
3. O que está trabalhando agora?
4. O que está bloqueado?
5. O que mudou desde minha última visita?
```

★ Se o operador abre o Dashboard e não descobre em 3 segundos o que precisa dele, a página falhou.

---

## 3. Anatomia visual

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Dashboard                                    Segunda-feira, 25 ago 2026 │
│ Visão geral da Fábrica de Aplicativos RNS    ☀ 10:24  Bom dia, João!    │
│ Acompanhe seus projetos, agentes e              Grandes aplicativos      │
│ resultados em tempo real.                       começam com grandes ideias│
├──────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐ │
│ │ 🗂  12       │ │ 👥  3        │ │ 📦  8        │ │ 📈  99,9%        │ │
│ │ Projetos em  │ │ Agentes      │ │ Apps         │ │ Uptime da        │ │
│ │ andamento    │ │ ativos       │ │ publicados   │ │ Fábrica          │ │
│ │ ↑ 3 este mês │ │ ● Todos      │ │ ↑ 2 esta     │ │ ● Operação       │ │
│ │              │ │   online     │ │   semana     │ │   estável        │ │
│ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────────┘ │
├───────────────────────────────────────────┬──────────────────────────────┤
│ AGENTES DE IA                  Ver todos →│ ATIVIDADE RECENTE  Ver todas→│
│ Status dos agentes integrados              │                              │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐    │ 🗂 Projeto X atualizado      │
│ │ A        │ │ ◎        │ │ ✳        │    │    há 5 minutos              │
│ │AntiGravity│ │ChatGPT   │ │Claude    │    │ ✳ Claude Code concluiu      │
│ │Planejam. │ │Revisão e │ │Code      │    │    a revisão de código       │
│ │e Aprovaç.│ │Inovação  │ │Análise e │    │    há 12 minutos             │
│ │● Online  │ │● Online  │ │Implement.│    │ 🚀 Novo app publicado        │
│ │[chips]   │ │[chips]   │ │● Online  │    │ A  AntiGravity criou plano   │
│ └──────────┘ └──────────┘ └──────────┘    │ ◎  ChatGPT sugeriu melhorias │
├───────────────────────────────────────────┼──────────────────────────────┤
│ PROJETOS RECENTES              Ver todos →│ USO DE RECURSOS  Últimos 7d ▾│
│ 🎓 Sistema de Gestão Escolar   ▓▓▓▓▓░ 70% │  ◯CPU   ◯Memória  ◯Execuções │
│    Em implementação · há 2h          ⋮    │   32%     68%        124     │
│ 🛒 E-commerce Inteligente      ▓▓▓░░░ 40% │  ▁▃▅▂▆▄▃  gráfico de barras  │
│    Em revisão · há 5h                ⋮    │  Seg Ter Qua Qui Sex Sáb Dom │
│ ❤ App de Saúde                 ▓▓░░░░ 20% │  ● Execuções  ● APIs (tokens)│
│    Em planejamento · há 1 dia        ⋮    │                              │
├───────────────────────────────────────────┴──────────────────────────────┤
│ AÇÕES RÁPIDAS                                                            │
│ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐             │
│ │ ⊕ Novo     │ │ 👥Gerenciar│ │ 📖Base de  │ │ 🚀Deploy   │             │
│ │  Projeto  →│ │  Agentes  →│ │ Conhecim. →│ │ no Vercel →│             │
│ └────────────┘ └────────────┘ └────────────┘ └────────────┘             │
└──────────────────────────────────────────────────────────────────────────┘
```

★ **Correção obrigatória em relação à tela de referência:** falta um bloco. Deve existir, logo abaixo dos KPIs e **acima** de "Agentes de IA", um bloco **"Aguardando você"** com as aprovações pendentes. A pergunta nº 1 não pode ser respondida só por um número em um KPI.

```
├──────────────────────────────────────────────────────────────────────────┤
│ ⏰ AGUARDANDO VOCÊ (3)                                   Ver fila →      │
│ ┌──────────────────────────────────────────────────────────────────────┐ │
│ │ ⚖ Plano — CRM etapa 03        Claude R2 concluiu   há 20 min  [Abrir]│ │
│ │ 🗄 Migration #229             Aguarda aprovação    há 1h      [Abrir]│ │
│ │ 🚀 Release — App de Saúde     Checks aprovados     há 2h      [Abrir]│ │
│ └──────────────────────────────────────────────────────────────────────┘ │
```

---

## 4. Inventário de ícones

| Ícone | Onde aparece | Nome no `Icon` | Ação ao clicar | Rótulo acessível | Fase |
|---|---|---|---|---|---|
| 🏠 casa | sidebar, item Início | `home` | navega para `/` | "Início" | F1 |
| 🗂 pasta | KPI "Projetos em andamento" | `projects` | decorativo | `aria-hidden` | F1 |
| 👥 pessoas | KPI "Agentes ativos" | `agents` | decorativo | `aria-hidden` | F1 |
| 📦 cubo | KPI "Apps publicados" | `deploy` | decorativo | `aria-hidden` | F1 |
| 📈 pulso | KPI "Uptime da Fábrica" | `monitoring` | decorativo | `aria-hidden` | F1 |
| ↑ seta cima | delta positivo do KPI | `arrow-up` | decorativo | "aumento de X" (no texto) | F1 |
| ● ponto verde | status "Todos online" / "Operação estável" | `dot` | decorativo | acompanhado de rótulo textual | F1 |
| ☀ sol | saudação por horário | `sun` / `moon` | decorativo | `aria-hidden` | F1 |
| ⏰ relógio | bloco "Aguardando você" | `clock` | decorativo | `aria-hidden` | F1 |
| ⚖ balança | item de aprovação de plano | `review` | abre a Câmara de Revisão | "Revisar plano" | F2 |
| 🗄 banco | item de aprovação de migration | `database` | abre detalhe da migration | "Revisar migration" | F2 |
| 🚀 foguete | item de aprovação de release | `deploy` | abre o release | "Revisar release" | F2 |
| A / ◎ / ✳ | avatares dos agentes | `brand/*` ou letra | abre `/agentes/:id` | nome do agente | F1 |
| ⋮ três pontos | linha de projeto recente | `more` | menu: Abrir, Pausar, Arquivar, Compartilhar | "Mais ações do projeto X" | F1 |
| → seta direita | "Ver todos", "Ver todas", ações rápidas | `arrow-right` | navega | dentro do link | F1 |
| ⊕ mais | ação rápida "Novo Projeto" | `plus` | `/projetos/novo` | "Novo projeto" | F1 |
| 📖 livro | ação rápida "Base de Conhecimento" | `knowledge` | `/conhecimento` | "Base de conhecimento" | F1 |
| 🔍 lupa | topbar, busca global | `search` | foca a busca | "Buscar" | F1 |
| 🔔 sino | topbar, notificações | `bell` | abre painel de notificações | "Notificações, 3 não lidas" | F1 |
| ▾ chevron | menu do usuário, seletor de período | `chevron-down` | abre menu | contexto do menu | F1 |
| ◯ anéis | Uso de Recursos (CPU/Memória/Execuções) | gráfico donut | decorativo, com número central | valor descrito por `aria-label` | F1 |

---

## 5. Componentes utilizados

`PageHeader` · `KpiCard` ×4 · `ApprovalCard` (lista) · `AgentCard` ×3 · `ActivityFeed` · `ProjectCard` compacto com `ProgressRow` · gráfico donut ×3 · gráfico de barras · `QuickActionCard` ×4 · `AsyncBoundary` em cada bloco.

---

## 6. Dados exibidos

| Elemento | Valor | Origem | Atualização |
|---|---|---|---|
| Projetos em andamento | contagem | `factory.apps` where `status in ('planning','in_progress','in_review')` | Realtime `factory:<org>` |
| Delta "↑ 3 este mês" | contagem | `apps` criados no mês corrente vs anterior | a cada carga |
| Agentes ativos | contagem | `agents.agent_profiles` where `enabled = true` | Realtime |
| "Todos online" | saúde | health check dos adapters. `[F1]` mock sempre online | 30s |
| Apps publicados | contagem | `factory.apps` where `status = 'completed'` | Realtime |
| Uptime da Fábrica | percentual | métrica de disponibilidade do Orchestrator. `[F1]` valor fixo `100%` até haver telemetria real | 5 min |
| Aguardando você | lista | `governance.human_gates` where `state='pending'` e usuário tem permissão | Realtime ★ |
| Cards de agente | status, chips | `agent_profiles` + último `runs` | Realtime |
| Atividade recente | lista | `governance.audit_events` order by `occurred_at desc` limit 10 | Realtime |
| Projetos recentes | top 3 | `apps` order by `updated_at desc` limit 3 | Realtime |
| Progresso do projeto | percentual | `apps.progress_percent`, derivado de etapas concluídas / total | ao mudar etapa |
| CPU / Memória | percentual | telemetria do worker pool. `[F1]` `UNSPECIFIED` — exibir "—" até existir | 60s |
| Execuções (7 dias) | série | `agents.runs` agrupado por dia | 5 min |
| APIs (tokens) | série | `factory.usage_records` agrupado por dia | 5 min |

★ **Regra:** o card de Uso de Recursos **não pode exibir número inventado**. Enquanto a telemetria não existir, mostra estado vazio com explicação, não `32%` fictício.

---

## 7. Interações

| Interação | Comportamento |
|---|---|
| Clicar em um KPI | Navega para a lista filtrada correspondente (ex.: KPI Projetos → `/projetos?status=in_progress`) |
| Clicar em card de agente | `/agentes/:id` |
| Clicar em projeto recente | `/projetos/:id` |
| Menu ⋮ do projeto | Abrir · Pausar · Arquivar · Copiar link |
| Clicar em item de "Aguardando você" | Abre o contexto exato da decisão (Câmara de Revisão, migration ou release) |
| Seletor de período (Uso de Recursos) | 24h · 7 dias · 30 dias. Preferência persiste por usuário |
| Ações rápidas | Navegam; "Deploy no Vercel" abre o painel de deploy do projeto ativo ou pede para escolher um |
| Saudação | "Bom dia" < 12h, "Boa tarde" < 18h, "Boa noite" ≥ 18h, no timezone da organização |

---

## 8. Estados

| Estado | Comportamento |
|---|---|
| Loading | Skeleton por bloco, não spinner de página inteira. KPIs viram retângulos com a mesma altura |
| Empty (primeira vez) | "Sua fábrica ainda não tem projetos." + botão "Criar primeiro projeto" + link para Templates |
| Empty parcial | Bloco vazio mostra sua própria mensagem; os demais continuam com dados |
| Error | Por bloco. Um gráfico que falhou não derruba a página |
| Partial success | Ex.: KPIs e projetos carregaram, telemetria não → bloco de recursos mostra erro com retry |
| Stale | Banner "Conexão em tempo real perdida — atualizado há X" + botão Atualizar |
| Forbidden | `viewer` vê tudo em leitura; botões de ação ficam desabilitados com tooltip explicando o papel necessário |

---

## 9. Rotas

```
/                      esta página
/projetos?status=...   destino dos KPIs
/agentes/:id           destino dos cards de agente
/projetos/:id          destino dos projetos recentes
/aprovacoes            destino de "Ver fila"
/monitoramento         destino de "Uso de Recursos"
```

---

## 10. Back-end: endpoints

```
GET /api/dashboard/overview
    → { kpis, pendingApprovals, agents, recentActivity,
        recentProjects, resourceUsage }

GET /api/dashboard/resource-usage?period=7d
    → séries de execuções e tokens

GET /api/approvals?state=pending&limit=5
```

`GET /api/dashboard/overview` deve ser **uma única chamada** que agrega tudo, com cache curto (`UNSPECIFIED`, sugerido 15s) e revalidação por evento Realtime. Cinco chamadas separadas na primeira renderização é defeito de performance.

---

## 11. Tabelas envolvidas

`factory.apps` · `factory.app_specs` · `agents.agent_profiles` · `agents.runs` · `governance.human_gates` · `governance.approvals` · `governance.audit_events` · `factory.usage_records` · `workflow.tasks`

---

## 12. Eventos e realtime

Assina: `factory:<organization_id>`

Reage a:
```
app.created · app.ready · app.archived
task.awaiting_human · approval.gate_opened · approval.granted
run.started · run.completed · run.failed
budget.threshold_reached
```

Ao receber: atualiza o bloco afetado, **não** refaz a página inteira.

---

## 13. Permissões

| Papel | Vê | Pode |
|---|---|---|
| `owner` / `admin` | tudo | todas as ações rápidas, aprovar |
| `engineer` | tudo | criar projeto, abrir revisão; aprovar conforme política |
| `viewer` | tudo em leitura | nenhuma ação de escrita |

---

## 14. Acessibilidade

- O bloco "Aguardando você" é o **primeiro** na ordem de tabulação após a navegação.
- KPIs são `<a>` ou `<button>` com nome acessível completo: "Projetos em andamento: 12, aumento de 3 este mês. Abrir lista".
- Gráficos têm `aria-label` descritivo e tabela alternativa oculta.
- Feed de atividade usa `aria-live="polite"` com throttle — nunca anuncia cada evento em rajada.
- Status "online" nunca depende só do ponto verde: há o texto "Online".

---

## 15. Performance

- Renderização inicial server-side com os dados agregados.
- Gráficos em `dynamic import`, carregados após o conteúdo principal.
- Realtime só assina após a hidratação.
- Budget da rota: LCP ≤ 2,5s; JS inicial `UNSPECIFIED` até baseline.

---

## 16. Fase

`[F1]` — página completa com dados reais do banco e agentes mockados.
`[F2]` — status real dos agentes, aprovações reais, uptime real.
`[F3]` — refinamento visual, micro-interações, saudação contextual enriquecida.

---

## 17. Definition of Done

```
□ Os cinco blocos existem, incluindo "Aguardando você"
□ Nenhum número exibido sem origem declarada em tabela
□ Telemetria ausente mostra estado vazio, não valor fictício
□ Uma única chamada agrega a visão geral
□ Os sete estados de UI implementados por bloco
□ Realtime atualiza bloco isolado, sem refazer a página
□ Todos os KPIs navegam para a lista filtrada correta
□ Teste de teclado: chegar ao primeiro item de aprovação em ≤ 4 tabs
□ axe sem violações em tema claro e escuro
□ Storybook com todos os estados de KpiCard, AgentCard e ApprovalCard
□ Playwright: fluxo "abrir dashboard → clicar em aprovação → chegar na Câmara"
```

---

## 18. Prompt para o agente construtor

> Ver `09-PROMPTS/04-PROMPTS-POR-PAGINA.md`, seção "Início".

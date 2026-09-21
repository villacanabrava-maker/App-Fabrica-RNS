# Página 02 — Projetos

---

## 1. Identidade

| | |
|---|---|
| **Rotas** | `/projetos` (lista) · `/projetos/novo` (wizard) · `/projetos/:id` (detalhe) |
| **Ícone da navegação** | `projects` |
| **Título** | "Projetos" |
| **Subtítulo** | "Todos os aplicativos que a fábrica está construindo." |
| **Entidade no banco** | `factory.apps` |
| **Fase** | `[F1]` completa (com plano gerado por heurística) · `[F2]` plano gerado por agentes reais |
| **Permissão mínima** | `viewer` para ver, `engineer` para criar |

★ **Nota de nomenclatura:** na interface o termo é **"Projeto"**. No banco e no código é **`app`**. Essa dualidade é intencional e está registrada no glossário. Não renomeie a tabela.

---

## 2. Objetivo

Projetos é a **entidade central** do produto. Tudo — missões, etapas, tarefas, execuções, revisões, previews e releases — pendura aqui.

Responde:
```
Quais aplicativos existem?
Em que pé está cada um?
Qual precisa de mim agora?
Como crio um novo?
```

---

## 3A. Anatomia — Lista `/projetos`

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Projetos                                            [⊞][☰]  [+ Novo]     │
│ Todos os aplicativos que a fábrica está construindo.                     │
├──────────────────────────────────────────────────────────────────────────┤
│ Todos │ Em andamento │ Em revisão │ Aguardando você │ Concluídos │ Arquiv.│
├──────────────────────────────────────────────────────────────────────────┤
│ 🔍 Buscar projetos...   │ Todos os status ▾ │ Mais recentes ▾ │ ⚙Filtros │
├──────────────────────────────────────────────────────────────────────────┤
│ ┌────────────────────────┐ ┌────────────────────────┐ ┌────────────────┐│
│ │ 🎓  Sistema de Gestão  │ │ 🛒  E-commerce         │ │ ❤  App de     ││
│ │     Escolar        ⋮   │ │     Inteligente    ⋮   │ │    Saúde   ⋮  ││
│ │ ● Em andamento         │ │ ● Em revisão           │ │ ● Planejamento ││
│ │ Aplicação web completa │ │ Loja virtual com...    │ │ Agendamento... ││
│ │ ▓▓▓▓▓▓▓░░░ 70%         │ │ ▓▓▓▓░░░░░░ 40%         │ │ ▓▓░░░░░░░ 20% ││
│ │ 👤3  🔀#184  ⏰ há 2h   │ │ 👤2  🔀#91   ⏰ há 5h   │ │ 👤1  ⏰ 1 dia ││
│ │ [Educação][Next.js]    │ │ [E-commerce][Web App]  │ │ [Saúde][Mobile]││
│ └────────────────────────┘ └────────────────────────┘ └────────────────┘│
└──────────────────────────────────────────────────────────────────────────┘
```

Modo tabela (`☰`): colunas Nome · Status · Progresso · Etapa atual · Equipe · PR · Última atividade · Ações.

---

## 3B. Anatomia — Wizard `/projetos/novo`

Extraído da tela de referência. Cinco passos fixos.

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ← Projetos > Novo Projeto                          [📖 Ver documentação] │
│ Novo Projeto                                                             │
│ Transforme sua ideia em um aplicativo real com o poder dos agentes de IA.│
├──────────────────────────────────────────────────────────────────────────┤
│  ①━━━━━━━②━━━━━━━③━━━━━━━④━━━━━━━⑤                                      │
│ Ideia  Planej.  Revisão  Implem.  Publicação                             │
├───────────────────────────────────────────┬──────────────────────────────┤
│ Descreva sua ideia                        │ ✨ SUGESTÕES DA IA           │
│ Seja o mais detalhado possível. Os agentes│ Com base na sua descrição:   │
│ da Fábrica vão analisar, planejar e       │ ┌──────────────────────────┐ │
│ transformar em um aplicativo real.        │ │☰ Recursos principais     │ │
│ ┌───────────────────────────────────────┐ │ │  Agendamento, notific... │ │
│ │ Ex.: Quero um aplicativo para         │ │ ├──────────────────────────┤ │
│ │ agendamento de consultas médicas...   │ │ │<>Tecnologias recomend.   │ │
│ │                                       │ │ │  Next.js, Supabase...    │ │
│ └───────────────────────────────────────┘ │ ├──────────────────────────┤ │
│                              0/2000       │ │👥Agentes ideais          │ │
│                                           │ │  AntiGravity, ChatGPT... │ │
│ Objetivos do projeto                      │ ├──────────────────────────┤ │
│ Selecione os principais objetivos         │ │⏰Tempo estimado          │ │
│ ☑Resolver um problema real ☐Testar ideia  │ │  2 a 5 dias (MVP)        │ │
│ ☐Automatizar processo ☐Gerar receita      │ └──────────────────────────┘ │
│ ☐Uso interno ☐Portfólio ☐Estudo ☐Outro    │ [✨ Gerar plano com IA]      │
│                                           ├──────────────────────────────┤
│ Escolha um template (opcional)            │ 💡 DICAS PARA UMA BOA        │
│ Comece com um modelo pronto ou deixe em   │    DESCRIÇÃO                 │
│ branco.              [Ver todos templates→│ ✓ Descreva o problema        │
│ ┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐      │ ✓ Informe o público-alvo     │
│ │Web ││Mob ││E-co││Dash││Saúd││Educ│      │ ✓ Liste funcionalidades      │
│ │ ○  ││ ○  ││ ○  ││ ○  ││ ○  ││ ○  │      │ ✓ Mencione integrações       │
│ └────┘└────┘└────┘└────┘└────┘└────┘      │ ✓ Indique referências        │
│                                           ├──────────────────────────────┤
│ [Cancelar]                 [Continuar →]  │ 🚀 Precisa de inspiração? →  │
└───────────────────────────────────────────┴──────────────────────────────┘
```

### Os cinco passos

| # | Passo | O que acontece | Saída | Fase |
|---|---|---|---|---|
| 1 | **Ideia** | Descrição livre, objetivos, template opcional | `app` em `planning` + rascunho de `app_spec` | F1 |
| 2 | **Planejamento** | Geração e edição do plano; decomposição em missões e etapas | `mission` + `mission_version` v1 | F1 (heurística) / F2 (R1+R3) |
| 3 | **Revisão** ★ | Ciclo de quatro passagens + human gate | `review_cycle` fechado + `approval` | F1 (mock) / F2 (real) |
| 4 | **Implementação** | Provisionamento + DAG + execução das etapas | repo, Supabase, Vercel, `stages`, `tasks` | F1 (sem provisionamento real) / F2 (completo) |
| 5 | **Publicação** | Release gate, rolling release | `deployment` + `release_decision` | F2 |

★ **Regra:** o passo 3 não pode ser pulado. Nenhum projeto sai de Planejamento para Implementação sem uma `approval` com `actor_type='human'`.

---

## 3C. Anatomia — Detalhe `/projetos/:id`

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ← Projetos > Sistema de Gestão Escolar        [⋮][🔗Compartilhar][+Tarefa]│
│ Sistema de Gestão Escolar   ⊙ Em andamento                               │
│ Acompanhe o progresso do projeto e gerencie todas as etapas.             │
├──────────────────────────────────────────────────────────────────────────┤
│ 🖥 Pipeline │ ⊞ Visão Geral │ 📄 Arquivos │ 💬 Discussões │ ⚙ Configurações│
├───────────────────────────────────────────────────┬──────────────────────┤
│ ┌─Fazer 5─┐ ┌─Em andamento 3┐ ┌─Em revisão 2┐ ┌─Concluído 3─┐ │ 🎓 Sistema│
│ │┌───────┐│ │┌─────────────┐│ │┌───────────┐│ │┌───────────┐│ │ de Gestão │
│ ││Implem.││ ││Layout das   ││ ││Revisão de ││ ││Planejamento││ │ Escolar ⚙│
│ ││ autent││ ││telas princ. ││ ││código     ││ ││do projeto ││ │           │
│ ││Backend││ ││Front-end    ││ ││Code Review││ ││Documentação││ │ Progresso │
│ ││CH  2d ││ ││▓▓▓▓▓░ 70%   ││ ││▓▓▓▓▓▓▓ 90%││ ││▓▓▓▓▓▓ 100%││ │ ▓▓▓▓▓░70%│
│ │└───────┘│ ││AG      1d   ││ ││CH     1d  ││ ││AG Concluído││ │           │
│ │┌───────┐│ │└─────────────┘│ │└───────────┘│ │└───────────┘│ │📅Início   │
│ ││Dashbrd││ │┌─────────────┐│ │┌───────────┐│ │┌───────────┐│ │ 10/08/2026│
│ ││inicial││ ││API usuários ││ ││Testes     ││ ││Definição  ││ │📅Entrega  │
│ ││Front  ││ ││Back-end     ││ ││automatiz. ││ ││arquitetura││ │ 25/09/2026│
│ ││AG  3d ││ ││▓▓▓░░ 40%    ││ ││QA         ││ ││▓▓▓▓▓ 100% ││ │👥Equipe   │
│ │└───────┘│ ││CC      2d   ││ ││▓▓▓▓░ 75%  ││ ││CH Concluído││ │ 3 agentes │
│ │  ...    │ │└─────────────┘│ ││CC     1d  ││ │└───────────┘│ │🔀Repositó.│
│ │[+Tarefa]│ │[+ Tarefa]     │ │└───────────┘│ │[+ Tarefa]   │ │ rns/...   │
│ └─────────┘ └───────────────┘ └────────────┘ └─────────────┘ │▲Deploy    │
├───────────────────────────────────────────────────────────────┤ escolar...│
│ ATIVIDADES RECENTES          │ MÉTRICAS DO PROJETO            │🗄Banco    │
│ ✳ Claude Code concluiu a     │ ┌────┐┌────┐┌────┐┌────┐       │ configurado│
│   revisão de código          │ │ 24 ││ 17 ││  3 ││  4 │       │ Tags      │
│ ◎ ChatGPT sugeriu melhorias  │ │Tare││Concl││Anda││Pend│       │ [Educação]│
│ A AntiGravity atualizou      │ │fas ││uídas││ment││entes│      │ [Next.js] │
│   o layout das telas         │ └────┘└────┘└────┘└────┘       │ [Editar]  │
└───────────────────────────────────────────────────────────────┴───────────┘
```

### Abas do detalhe

| Aba | Conteúdo | Fase |
|---|---|---|
| **Pipeline** ★ | Kanban de tarefas + Esteira de etapas (toggle) | F1 |
| **Visão Geral** | Resumo, spec aprovada, plano atual, ambientes, saúde | F1 |
| **Arquivos** | Artefatos, diffs, relatórios, screenshots | F1 |
| **Discussões** | Comentários humanos ancorados em etapa/tarefa/finding | F1 |
| **Configurações** | Nome, ícone, tags, equipe, repositório, políticas, arquivar | F1 |
| **Revisões** ★ | Ciclos de revisão do projeto → leva à Câmara | F2 |
| **Execuções** | Runs dos agentes | F1 |
| **Código** | Commits, branches, PRs, checks | F2 |
| **Preview** | Link e status do preview pair | F2 |
| **Banco** | Schema, migrations, estado do Supabase | F2 |
| **Deployments** | Preview, staging, produção | F2 |
| **Evidências** | Testes, findings, relatórios, screenshots | F2 |
| **Custos** | Uso detalhado por etapa e agente | F2 |
| **Auditoria** | Quem decidiu o quê e quando | F1 |

★ **Adição obrigatória em relação à tela de referência:** a aba **Revisões** e o toggle **Esteira** no Pipeline. O Kanban sozinho não mostra o ciclo de quatro passagens, que é o diferencial do produto.

### A Esteira (toggle dentro de Pipeline)

```
PLANEJAMENTO → GPT R1 → CLAUDE R1 → GPT R2 → CLAUDE R2 → ANTIGRAVITY/HUMANO
                                                              ├─ rejeitar → revisão
                                                              └─ aprovar
                                                                    ↓
                                                             IMPLEMENTAÇÃO
                                                                    ↓
                                                               TESTE / CI
                                                                    ↓
                                                            REVISÃO DA ETAPA
                                                             (mesmo ciclo)
                                                                    ↓
                                                            APROVAÇÃO HUMANA
```

Cartão de etapa mostra:

```
ETAPA        Backend de autenticação
STATE        CLAUDE_R1_RUNNING
PLANO        SHA 53a9...
PR           #184
OPENAI       R1 ✓   R2 pendente
CLAUDE       R1 executando   R2 pendente
CI           ainda não executado
HUMAN GATE   pendente
```

---

## 4. Inventário de ícones

### Lista

| Ícone | Onde | Nome | Ação | Rótulo | Fase |
|---|---|---|---|---|---|
| 🗂 | sidebar | `projects` | `/projetos` | "Projetos" | F1 |
| ⊞ / ☰ | canto superior | `grid` / `list` | alterna grade/tabela | "Visualizar em grade/lista" | F1 |
| + | botão primário | `plus` | `/projetos/novo` | "Novo projeto" | F1 |
| 🔍 | barra de filtro | `search` | foca busca | "Buscar projetos" | F1 |
| ⚙ | botão Filtros | `filter` | abre painel de filtros | "Filtros avançados" | F1 |
| ▾ | selects | `chevron-down` | abre opções | rótulo do select | F1 |
| 🎓🛒❤ etc. | ícone do projeto | `Icon` por categoria | abre projeto | nome do projeto | F1 |
| ⋮ | card | `more` | Abrir, Pausar, Duplicar, Arquivar, Copiar link | "Mais ações" | F1 |
| ● | status | `dot` + `StatusPill` | decorativo | rótulo textual junto | F1 |
| 👤 | equipe | `agents` | abre lista de agentes do projeto | "3 agentes" | F1 |
| 🔀 | PR | `pull-request` | abre PR no GitHub (nova aba) | "Pull request #184" | F2 |
| ⏰ | última atividade | `clock` | decorativo | tempo no texto | F1 |

### Wizard

| Ícone | Onde | Nome | Ação | Rótulo | Fase |
|---|---|---|---|---|---|
| ← | breadcrumb | `arrow-left` | volta | "Voltar para Projetos" | F1 |
| 📖 | topo direito | `knowledge` | abre documentação | "Ver documentação" | F1 |
| ①–⑤ | stepper | numeral | navega para passo concluído | "Passo N: nome" | F1 |
| ✨ | Sugestões da IA / Gerar plano | `sparkles` | dispara geração | "Gerar plano com IA" | F1 |
| ☰ | Recursos principais | `list` | decorativo | `aria-hidden` | F1 |
| `<>` | Tecnologias | `code` | decorativo | `aria-hidden` | F1 |
| 👥 | Agentes ideais | `agents` | decorativo | `aria-hidden` | F1 |
| ⏰ | Tempo estimado | `clock` | decorativo | `aria-hidden` | F1 |
| 💡 | Dicas | `info` | decorativo | `aria-hidden` | F1 |
| ✓ | itens das dicas | `check` | decorativo | `aria-hidden` | F1 |
| 🚀 | Inspiração | `rocket` | abre exemplos | "Ver exemplos de projetos" | F1 |
| ☐/☑ | objetivos | `Checkbox` | alterna | rótulo do objetivo | F1 |
| ○ | radio de template | `Radio` | seleciona | nome do template | F1 |
| → | Continuar | `arrow-right` | avança | dentro do botão | F1 |

### Detalhe

| Ícone | Onde | Nome | Ação | Rótulo | Fase |
|---|---|---|---|---|---|
| ⊙ | pill de status | `StatusPill` | decorativo | texto junto | F1 |
| ⋮ | topo | `more` | Duplicar, Exportar, Arquivar, Excluir | "Mais ações do projeto" | F1 |
| 🔗 | Compartilhar | `share` | abre modal de compartilhamento | "Compartilhar projeto" | F1 |
| + | Nova Tarefa | `plus` | abre criação de tarefa | "Nova tarefa" | F1 |
| 🖥 | aba Pipeline | `monitor` | muda aba | "Pipeline" | F1 |
| ⊞ | aba Visão Geral | `grid` | muda aba | "Visão geral" | F1 |
| 📄 | aba Arquivos | `file` | muda aba | "Arquivos" | F1 |
| 💬 | aba Discussões | `message` | muda aba | "Discussões" | F1 |
| ⚙ | aba Configurações | `settings` | muda aba | "Configurações do projeto" | F1 |
| ⚖ | aba Revisões | `review` | muda aba | "Revisões" | F2 ★ |
| ⋯ | cabeçalho de coluna do Kanban | `more` | Renomear, Limitar WIP, Ocultar | "Ações da coluna" | F1 |
| 📅 | datas no painel direito | `calendar` | decorativo | data no texto | F1 |
| 🔀 | repositório | `github` | abre no GitHub | "Abrir repositório" | F2 |
| ▲ | Deploy | `vercel` | abre no Vercel | "Abrir deploy" | F2 |
| 🗄 | Banco | `database` | abre aba Banco | "Banco de dados" | F2 |
| ⏱ | prazo na tarefa | `clock` | decorativo | "prazo: 2 dias" | F1 |
| AG/CC/CH | avatar na tarefa | `Avatar` | mostra tooltip do agente | nome do agente | F1 |

---

## 5. Componentes

`PageHeader` · `Tabs` · `FilterBar` · `ProjectCard` · `DataTable` · `WizardStepper` · `Textarea` com contador · `Checkbox` grupo · `TemplateCard` compacto · `SuggestionPanel` · `KanbanBoard` · `TaskCard` · `StagePipeline` · `ActivityFeed` · `StatCard` ×4 · `SidePanel` · `EmptyState` · `ConfirmDialog`

---

## 6. Dados exibidos

| Elemento | Origem |
|---|---|
| Lista de projetos | `factory.apps` filtrado por `organization_id` |
| Progresso | `apps.progress_percent` = etapas `completed` / total de etapas |
| Status | `apps.status` |
| Equipe | contagem distinta de `agent_profiles` usados em `runs` do app |
| PR | último `integration.pull_requests` aberto do app |
| Última atividade | `max(audit_events.occurred_at)` do app |
| Tags | `apps.tags` |
| Colunas do Kanban | `workflow.tasks` agrupadas por `state` mapeado para 4 colunas |
| Métricas do projeto | contagens em `workflow.tasks` |
| Atividades recentes | `governance.audit_events` do app |
| Repositório / Deploy / Banco | `integration.repositories`, `vercel_projects`, `supabase_projects` |
| Sugestões da IA | `[F1]` heurística determinística por palavras-chave e template; `[F2]` saída de R1+R3 |

### Mapeamento estado → coluna do Kanban

| Coluna | Estados de tarefa |
|---|---|
| **Fazer** | `created`, `ready`, `queued` |
| **Em andamento** | `leased`, `running`, `artifact_ready`, `changes_required` |
| **Em revisão** | `reviewing`, `awaiting_checks`, `awaiting_human` |
| **Concluído** | `approved`, `completed` |

Estados `blocked`, `failed_terminal` e `cancelled` aparecem com destaque visual na coluna de origem, nunca somem da tela.

---

## 7. Interações

| Interação | Comportamento |
|---|---|
| Arrastar cartão no Kanban | Solicita comando de transição. **Se a máquina de estados rejeitar, o cartão volta** com toast explicando o motivo. Nunca é escrita direta. ★ |
| Criar tarefa | Abre formulário: título, tipo, papel sugerido, dependências, critérios de aceitação |
| Clicar em tarefa | Abre painel lateral com detalhe, execuções, findings e evidências |
| Filtro "Aguardando você" | `human_gates` pendentes cujo aprovador é o usuário |
| Wizard, avançar | Valida o passo atual; salva rascunho; permite voltar sem perder dados |
| Wizard, "Gerar plano com IA" | `[F1]` gera plano-modelo determinístico; `[F2]` dispara run de R1 |
| Compartilhar | Gera link interno; sem exposição pública na v1 |
| Arquivar | `ConfirmDialog` nível `warning`; grava `archived_at`, não apaga |

★ Essa é a diferença entre um CRUD administrativo e um control plane de engenharia: o navegador **pede** transições, o domínio **decide**.

---

## 8. Estados

| Estado | Comportamento |
|---|---|
| Loading | Skeleton de cards; Kanban com colunas e 2 cartões fantasma cada |
| Empty (lista) | "Nenhum projeto ainda." + "Criar primeiro projeto" + "Explorar templates" |
| Empty (filtro) | "Nenhum projeto corresponde a estes filtros." + "Limpar filtros" |
| Empty (coluna Kanban) | Área tracejada com "Arraste tarefas para cá" + "+ Adicionar tarefa" |
| Error | Por bloco, com retry |
| Partial | Kanban carregou, métricas não → métricas mostram erro isolado |
| Forbidden | `viewer` vê; arrastar desabilitado com tooltip |

---

## 9–10. Rotas e endpoints

```
GET    /api/apps?status=&q=&sort=&page=
GET    /api/apps/:id
POST   /api/apps                        criar (passo 1)
PATCH  /api/apps/:id                    editar metadados
POST   /api/apps/:id/archive
POST   /api/apps/:id/provision          [F2]

POST   /api/specs                       rascunho da spec
POST   /api/specs/:id/approve

POST   /api/missions                    cria missão do plano
POST   /api/missions/:id/generate-plan  [F1] heurística / [F2] agentes
POST   /api/missions/:id/submit-review

GET    /api/apps/:id/tasks
POST   /api/tasks
POST   /api/tasks/:id/transition        { to, trigger }   ← usado pelo drag
GET    /api/apps/:id/metrics
GET    /api/apps/:id/activity
```

---

## 11. Tabelas

`factory.apps` · `factory.app_specs` · `factory.missions` · `factory.mission_versions` · `factory.stages` · `workflow.tasks` · `workflow.task_dependencies` · `agents.runs` · `integration.repositories` · `integration.pull_requests` · `integration.vercel_projects` · `integration.supabase_projects` · `governance.audit_events` · `governance.human_gates`

---

## 12. Eventos

Assina `app:<app_id>`. Reage a:
```
task.* (todas as transições)
stage.* · mission.*
run.started · run.completed · run.failed
approval.gate_opened · approval.granted
github.pr.opened · github.check.completed
vercel.deployment.ready · supabase.branch.ready
```

---

## 13. Permissões

| Ação | Papel mínimo |
|---|---|
| Ver lista e detalhe | `viewer` |
| Criar projeto | `engineer` |
| Criar/mover tarefa | `engineer` |
| Editar configurações do projeto | `admin` |
| Arquivar / excluir | `admin` |
| Aprovar etapa | conforme política; sempre `actor_type='human'` |

---

## 14. Acessibilidade

- **Kanban acessível por teclado é obrigatório.** Selecionar cartão com `Space`, mover com setas, soltar com `Space`, cancelar com `Esc`. Drag-and-drop só com mouse é violação.
- Cada coluna é uma região com `aria-label` e contagem.
- Movimentação anuncia resultado via `aria-live`: "Tarefa X movida para Em revisão" ou "Movimento não permitido: …".
- O stepper do wizard usa `aria-current="step"`.
- O contador 0/2000 do textarea é anunciado em marcos (50%, 90%, 100%), não a cada tecla.

---

## 15. Performance

- Lista paginada; virtualização acima de 50 projetos.
- Kanban virtualiza colunas com mais de 30 cartões.
- Detalhe carrega a aba ativa; demais abas em `dynamic import`.
- Métricas e atividades carregam depois do Kanban.

---

## 16. Fase

`[F1]` lista, wizard completo, detalhe com Pipeline/Visão Geral/Arquivos/Discussões/Configurações/Execuções/Auditoria.
`[F2]` provisionamento real, abas Revisões, Código, Preview, Banco, Deployments, Evidências, Custos.
`[F3]` refinamento visual do Kanban e da Esteira.

---

## 17. Definition of Done

```
□ Lista com grade e tabela, filtros e busca funcionando
□ Wizard de 5 passos com rascunho persistido entre passos
□ Passo 3 bloqueia avanço sem approval humana
□ Detalhe com todas as abas da Fase 1
□ Kanban move cartões VIA COMANDO, com rollback visual em rejeição
□ Toggle Kanban ↔ Esteira funcionando
□ Mapeamento estado→coluna implementado conforme tabela §6
□ Estados blocked/failed visíveis, não ocultos
□ Kanban 100% operável por teclado
□ Arquivar não apaga dado
□ Todos os estados de UI por bloco
□ axe sem violações; teste de teclado do Kanban documentado
□ Playwright: criar projeto → gerar plano → aprovar → ver Kanban
```

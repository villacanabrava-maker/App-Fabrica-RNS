# Página 04 — Orquestração

---

## 1. Identidade

| | |
|---|---|
| **Rotas** | `/orquestracao` · `/orquestracao/:id/editor` |
| **Ícone da navegação** | `orchestration` |
| **Título** | "Orquestração" |
| **Subtítulo** | "Crie fluxos de trabalho com múltiplos agentes, conecte ferramentas e automatize processos complexos." |
| **Fase** | `[F1]` editor e execução com agentes mock · `[F2]` execução com agentes reais |
| **Permissão mínima** | `viewer` para ver, `engineer` para editar |

★ **Esta é a página mais complexa do produto.** Construa-a por último na Fase 1.

---

## 2. Objetivo

```
Como meus agentes se encadeiam?
Posso montar um fluxo reutilizável?
Esse fluxo funcionou? Quanto custou? Onde falhou?
```

### ★ A distinção que precisa ficar clara na interface

Existem **dois** tipos de orquestração no sistema e confundi-los é erro grave:

| | Protocolo da Fábrica | Fluxos de Orquestração |
|---|---|---|
| **O que é** | O ciclo fixo de quatro passagens (GPT R1 → Claude R1 → GPT R2 → Claude R2) | Fluxos customizados que o operador desenha |
| **Quem define** | A Constituição. É imutável | O operador, no canvas |
| **Onde aparece** | Esteira do projeto, Câmara de Revisão | Esta página |
| **Pode ser alterado?** | **Não** | Sim |
| **Para que serve** | Governar a construção de software | Automatizar tarefas de apoio (análise de documento, pesquisa, relatório) |

A página Orquestração **não substitui nem altera** o protocolo da fábrica. Ela cria fluxos auxiliares. Um banner discreto no topo do editor deve dizer isso.

---

## 3A. Anatomia — `/orquestracao`

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Orquestração                    [💾 Salvar como Template] [+ Novo Fluxo] │
│ Crie fluxos de trabalho com múltiplos agentes, conecte ferramentas e     │
│ automatize processos complexos.                                          │
├──────────────────────────────────────────────────────────────────────────┤
│ Meus Fluxos │ ⚙Execuções │ 📚Biblioteca │ 👥Agentes Disponíveis │ ⏱Histór.│
├──────────────────────────────────────────────────────────────────────────┤
│ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐                 │
│ │▷ 24       │ │👥 156     │ │✓ 96%      │ │⏰ 2m 18s  │                 │
│ │ Fluxos    │ │ Execuções │ │ Taxa de   │ │ Tempo     │                 │
│ │ ativos    │ │ hoje      │ │ sucesso   │ │ médio     │                 │
│ │↑33% mês   │ │↑18% ontem │ │↑5% mês    │ │↓22% mês   │                 │
│ └───────────┘ └───────────┘ └───────────┘ └───────────┘                 │
├───────────────────────────────────────────────────────┬──────────────────┤
│ 👥 Fluxo: Análise e Resumo de Documentos  ●Ativo      │ AGENTES NO FLUXO │
│ Processa documentos, extrai insights e gera resumo    │ ┌──────────────┐ │
│ executivo.                      [✏Editar Fluxo]  [⋮]  │ │A R1 Orchestr.│ │
│ ┌───────────────────────────────────────────────────┐ │ │  Coordenação⋮│ │
│ │            ┌────────┐    ┌──────────┐             │ │ ├──────────────┤ │
│ │            │R3 Data │───▶│R5 Cognit.│──┐          │ │ │📦R2 Architec.│ │
│ │            │Busca   │    │Analisa e │  │          │ │ │  Processam. ⋮│ │
│ │  ┌──────┐  └────────┘    └──────────┘  ▼          │ │ ├──────────────┤ │
│ │  │▷Início│   ▲                     ┌────────┐     │ │ │🗄R3 Data &   │ │
│ │  │Recebe │───┤                     │R6 QA & │     │ │ │  Supabase   ⋮│ │
│ │  │doc.   │   │                     │Eval    │     │ │ ├──────────────┤ │
│ │  └───────┘   ▼    ┌──────────┐     │Valida  │     │ │ │🖥R4 Product &│ │
│ │       ┌────────┐  │R4 Frontend│──▶ └───┬────┘     │ │ │  Frontend   ⋮│ │
│ │       │A R1 Orch│─▶│Gera resumo│         │          │ │ ├──────────────┤ │
│ │       │Analisa  │  └──────────┘         ▼          │ │ │⚖R5 Cognitive│ │
│ │       └────────┘                   ┌─────────┐     │ │ │  Análise    ⋮│ │
│ │       ┌────────┐                   │⚑ Saída  │     │ │ ├──────────────┤ │
│ │       │R2 Arch │                   │ Resumo  │     │ │ │🛡R6 QA, Sec &│ │
│ │       │Processa│                   └─────────┘     │ │ │  Evals      ⋮│ │
│ │       └────────┘                                   │ │ └──────────────┘ │
│ │ [+][−][⛶] 100%              [▶ Testar Fluxo]       │ │ [+ Adic. Agente] │
│ └───────────────────────────────────────────────────┘ │                  │
├──────────────────────────┬────────────────────────────┼──────────────────┤
│ ÚLTIMAS EXECUÇÕES        │ MÉTRICAS DO FLUXO  7 dias ▾│ AÇÕES RÁPIDAS    │
│ 14:32 ✓Sucesso 2m14s     │      ┌────┐                │ ▶ Executar agora │
│       relatorio_q3.pdf ⋯ │  123 │96% │ ●Sucesso 118   │ ⧉ Duplicar fluxo │
│ 11:08 ✓Sucesso 1m56s     │ Exec.│Suc.│ ●Erro       3  │ 💾Salvar template│
│       analise_merc.docx⋯ │      └────┘ ●Cancelado  2  │ ⤓ Exportar config│
│ 17:45 ✗Erro    —         │  ⏰2m18s Tempo médio       │ 🗑 Excluir fluxo  │
│       dados_incompl.pdf⋯ │  📄98   Docs processados   │                  │
└──────────────────────────┴────────────────────────────┴──────────────────┘
```

### Abas

| Aba | Conteúdo | Fase |
|---|---|---|
| **Meus Fluxos** | Fluxos da organização + canvas do fluxo selecionado | F1 |
| **Execuções** | Todas as execuções de fluxo, com filtro e detalhe | F1 |
| **Biblioteca** | Fluxos prontos para duplicar | F1 |
| **Agentes Disponíveis** | Papéis que podem ser usados como nó | F1 |
| **Histórico** | Versões de cada fluxo, com diff da definição | F1 |

---

## 3B. Anatomia — Editor `/orquestracao/:id/editor`

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ← Fluxo: Análise e Resumo de Documentos   v3 · rascunho  [Descartar][Publ]│
│ ⚠ Fluxos de orquestração não alteram o protocolo de revisão da fábrica.  │
├───────────┬──────────────────────────────────────────┬───────────────────┤
│ PALETA    │  CANVAS                                  │ PROPRIEDADES      │
│           │                                          │                   │
│ Gatilhos  │   ┌──────┐                               │ Nó selecionado:   │
│ ▷ Manual  │   │Início│──┐                            │ R5 — Reviewer     │
│ ⏰Agendado│   └──────┘  │                            │                   │
│ 🔗Webhook │             ▼                            │ Papel     R5  ▾   │
│ 📩Evento  │       ┌──────────┐                       │ Runtime   auto▾   │
│           │       │R1 Orchest│                       │ Skills    [...]   │
│ Agentes   │       └────┬─────┘                       │ Timeout   300s    │
│ A R1 ... │            │                             │ Retry     2       │
│ 📦R2 ... │       ┌────┴────┐                        │ Budget    —       │
│ 🗄R3 ... │       ▼         ▼                        │                   │
│ 🔨R4 ... │  ┌───────┐ ┌───────┐                     │ Entrada:          │
│ ⚖R5 ... │  │R3 Data│ │R2 Arch│                     │ ◦ documento       │
│ ✓R6 ... │  └───┬───┘ └───┬───┘                     │ ◦ contexto        │
│ 🛡R7 ... │      └────┬────┘                         │                   │
│ 🖥R8 ... │           ▼                              │ Saída esperada:   │
│ ⚑R9 ... │      ┌─────────┐                         │ review.schema.json│
│           │      │  Saída  │                         │                   │
│ Lógica    │      └─────────┘                         │ [Testar este nó]  │
│ ⑂Condição│                                          │                   │
│ ⟳Loop    │  [+][−][⛶][⊹grade] 100%   [▶Testar fluxo]│                   │
│ ⧗Espera   │                                          │                   │
│ ⚑Saída    │                                          │                   │
└───────────┴──────────────────────────────────────────┴───────────────────┘
```

### Tipos de nó

| Tipo | Ícone | Função | Configuração |
|---|---|---|---|
| **Início / Gatilho** | `play` | Ponto de entrada | manual · agendado (cron) · webhook · evento de domínio |
| **Agente** | por papel | Executa um papel R1–R9 | papel, runtime (auto/específico), skills, timeout, retry, budget |
| **Condição** | `branch` | Ramifica por expressão | expressão sobre a saída anterior |
| **Loop** | `repeat` | Itera sobre coleção | coleção, máximo de iterações (obrigatório) |
| **Espera** | `clock` | Aguarda tempo ou evento | duração ou nome do evento |
| **Human Gate** | `approval` | Pausa para decisão humana | quem aprova, prazo, o que mostrar |
| **Ferramenta** | `tool` | Chama ferramenta/MCP | ferramenta, argumentos, política |
| **Saída** | `flag` | Encerra e devolve resultado | schema esperado |

### Regras de validação do fluxo (bloqueiam publicação)

```
□ Exatamente um nó de Início
□ Pelo menos um nó de Saída
□ Nenhum nó órfão (sem entrada, exceto Início)
□ Nenhum ciclo sem nó de Loop com limite máximo definido
□ Todo nó Agente tem papel definido
□ Todo nó Loop tem máximo de iterações
□ Toda Condição tem ramo verdadeiro E ramo falso (ou saída explícita)
□ Nenhum nó Agente pede permissão acima do seu write policy
□ Budget total do fluxo definido ou herdado da organização
```

★ Um fluxo que não passa na validação **não pode ser publicado**, só salvo como rascunho.

---

## 4. Inventário de ícones

| Ícone | Onde | Nome | Ação | Rótulo | Fase |
|---|---|---|---|---|---|
| ⛓ | sidebar | `orchestration` | `/orquestracao` | "Orquestração" | F1 |
| 💾 | topo | `save` | salva fluxo atual como template | "Salvar como template" | F1 |
| + | topo | `plus` | cria fluxo novo | "Novo fluxo" | F1 |
| ⚙ | aba Execuções | `settings` | muda aba | "Execuções" | F1 |
| 📚 | aba Biblioteca | `library` | muda aba | "Biblioteca" | F1 |
| 👥 | aba Agentes Disponíveis | `agents` | muda aba | "Agentes disponíveis" | F1 |
| ⏱ | aba Histórico | `history` | muda aba | "Histórico" | F1 |
| ▷ | KPI Fluxos ativos | `play` | decorativo | `aria-hidden` | F1 |
| ✏ | Editar Fluxo | `edit` | abre editor | "Editar fluxo" | F1 |
| ⋮ | cabeçalho do fluxo | `more` | Duplicar, Pausar, Exportar, Excluir | "Mais ações do fluxo" | F1 |
| + / − | canvas | `zoom-in`/`zoom-out` | zoom | "Aproximar"/"Afastar" | F1 |
| ⛶ | canvas | `fit` | ajusta à tela | "Ajustar à tela" | F1 |
| ⊹ | canvas | `grid` | liga/desliga grade e snap | "Alternar grade" | F1 |
| ▶ | Testar Fluxo | `play` | executa em modo teste (dry-run) | "Testar fluxo" | F1 |
| ⋯ | nó do canvas | `more` | Configurar, Duplicar, Desconectar, Remover | "Ações do nó X" | F1 |
| + Adicionar Agente | painel direito | `plus` | adiciona nó de agente | "Adicionar agente ao fluxo" | F1 |
| ▶ Executar agora | ações rápidas | `play` | dispara execução real | "Executar fluxo agora" | F1 |
| ⧉ | ações rápidas | `copy` | duplica | "Duplicar fluxo" | F1 |
| ⤓ | ações rápidas | `download` | exporta JSON da definição | "Exportar configuração" | F1 |
| 🗑 | ações rápidas | `trash` | exclui (confirmação `danger`) | "Excluir fluxo" | F1 |
| ✓ / ✗ | últimas execuções | `check` / `x` | abre detalhe | "Sucesso"/"Erro" | F1 |
| ⏰ | tempo médio | `clock` | decorativo | `aria-hidden` | F1 |
| 📄 | docs processados | `file` | decorativo | `aria-hidden` | F1 |
| ⚠ | banner do editor | `alert` | decorativo | texto lido normalmente | F1 |

---

## 5. Componentes

`PageHeader` · `Tabs` · `KpiCard` ×4 · `FlowCanvas` · `FlowNode` · `FlowEdge` · `NodePalette` · `NodeInspector` · `FlowToolbar` · `AgentListPanel` · `DataTable` (execuções) · `DonutChart` · `QuickActionList` · `ConfirmDialog` · `AsyncBoundary`

### FlowCanvas — requisitos técnicos

| Requisito | Detalhe |
|---|---|
| Biblioteca | `UNSPECIFIED` — avaliar na Fase 1; deve suportar teclado e serialização estável |
| Serialização | JSON determinístico: nós ordenados por id, sem coordenadas flutuantes imprecisas |
| Hash | `definition_sha` = sha256 do JSON canônico (para detectar mudança real) |
| Undo/redo | Mínimo 50 passos |
| Auto-layout | Botão "Organizar" com layout hierárquico |
| Zoom | 25% a 200% |
| Snap | Grade de 8px |
| Acessibilidade | **Obrigatório navegar e editar por teclado** (ver §14) |

---

## 6. Dados exibidos

| Elemento | Origem |
|---|---|
| Fluxos ativos | `factory.flows` where `status='active'` |
| Execuções hoje | `factory.flow_runs` do dia |
| Taxa de sucesso | `flow_runs` `succeeded` / total |
| Tempo médio | `avg(flow_runs.duration_ms)` |
| Canvas | `flows.definition` (JSON) |
| Agentes no fluxo | nós de tipo agente extraídos da `definition` |
| Últimas execuções | `flow_runs` order by `started_at desc` |
| Métricas do fluxo | agregação de `flow_runs` por `flow_id` |
| Docs processados | contagem de artefatos de entrada. `[F1]` `UNSPECIFIED` se não houver |

---

## 7. Interações

| Interação | Comportamento |
|---|---|
| Arrastar nó da paleta | Cria nó no canvas com configuração padrão do papel |
| Conectar nós | Arrastar da saída para a entrada; conexão inválida é rejeitada visualmente com motivo |
| Selecionar nó | Abre Propriedades à direita |
| "Testar este nó" | Executa só aquele nó com entrada sintética, em sandbox |
| "Testar Fluxo" | Dry-run completo: valida, executa com adapters mock, **não grava efeito externo** |
| "Executar agora" | Execução real. Requer `engineer`. Confirma se houver nó com efeito externo |
| Publicar | Roda a validação da §3B; se falhar, lista os erros e não publica |
| Salvar como template | Copia a definição para `factory.templates` com categoria "Fluxo" |
| Exportar | Baixa JSON da definição (sem segredos) |
| Excluir | `ConfirmDialog` nível `danger`, exige digitar o nome do fluxo |

---

## 8. Estados

| Estado | Comportamento |
|---|---|
| Loading | Canvas com esqueleto de 3 nós |
| Empty (sem fluxos) | "Você ainda não tem fluxos." + "Criar fluxo" + "Ver biblioteca" |
| Empty (canvas novo) | Só o nó Início, com dica "Arraste um agente da paleta" |
| Error (definição inválida) | Canvas em modo leitura + painel listando os erros de validação |
| Partial | Canvas carregou, métricas não |
| Executando | Nós ativos pulsam; arestas percorridas destacadas; painel mostra o passo atual |
| Forbidden | `viewer` vê o canvas em leitura; paleta e Propriedades desabilitadas |

---

## 9–10. Rotas e endpoints

```
GET    /api/flows
POST   /api/flows
GET    /api/flows/:id
PUT    /api/flows/:id                  salva rascunho
POST   /api/flows/:id/validate         retorna lista de erros
POST   /api/flows/:id/publish          só publica se validate passar
POST   /api/flows/:id/duplicate
POST   /api/flows/:id/export
DELETE /api/flows/:id

POST   /api/flows/:id/test             dry-run com mocks
POST   /api/flows/:id/run              execução real
GET    /api/flows/:id/runs?page=
GET    /api/flow-runs/:runId
GET    /api/flow-runs/:runId/steps
GET    /api/flows/:id/versions
GET    /api/flows/:id/metrics?period=
```

---

## 11. Tabelas

`factory.flows` · `factory.flow_versions` · `factory.flow_runs` · `factory.flow_run_steps` · `agents.runs` · `agents.agent_roles` · `agents.agent_profiles` · `factory.templates`

---

## 12. Eventos

Assina `flow_run:<id>` durante execução.

```
flow.run_started · flow.step_started · flow.step_completed
flow.step_failed · flow.human_gate_opened · flow.run_completed
flow.run_failed · flow.run_cancelled
```

---

## 13. Permissões

| Ação | Papel mínimo |
|---|---|
| Ver fluxos e execuções | `viewer` |
| Criar e editar rascunho | `engineer` |
| Publicar fluxo | `engineer` |
| Executar fluxo real | `engineer` |
| Excluir fluxo | `admin` |
| Adicionar nó com efeito externo | `admin` |

---

## 14. Acessibilidade ★

Canvas é o maior risco de acessibilidade do produto. Requisitos **não negociáveis**:

1. **Modo lista alternativo.** Um botão "Ver como lista" apresenta o fluxo como estrutura em árvore navegável, com as mesmas ações de edição. Esse modo é a rota acessível completa.
2. **Navegação por teclado no canvas:** `Tab` percorre nós em ordem topológica; `Enter` abre Propriedades; setas movem o nó selecionado; `Delete` remove com confirmação; `C` inicia conexão e `Esc` cancela.
3. Cada nó é um elemento focável com nome acessível: "Nó 3, agente R5 Reviewer, recebe de R1 Orchestrator, envia para Saída".
4. Estado de execução anunciado via `aria-live` com throttle.
5. Zoom não quebra a navegação por teclado.
6. Cor da aresta nunca é o único indicador de estado — há também espessura e ícone.

---

## 15. Performance

- Canvas em `dynamic import`, carregado só quando a aba está ativa.
- Acima de 50 nós, renderização virtualizada e minimapa.
- Autosave do rascunho com debounce de 2s, nunca a cada tecla.
- `definition_sha` evita gravação quando nada mudou de fato.

---

## 16. Fase

`[F1]` abas, canvas, editor, validação, dry-run com mocks, execuções.
`[F2]` execução real com agentes, human gate como nó, gatilhos por webhook e evento.
`[F3]` auto-layout refinado, minimapa, animação de percurso.

---

## 17. Definition of Done

```
□ Banner explicando que fluxo ≠ protocolo da fábrica
□ Canvas cria, conecta, configura e remove nós
□ As 9 regras de validação implementadas e bloqueando publicação
□ Dry-run não produz efeito externo
□ definition_sha calculado sobre JSON canônico
□ Versionamento com diff no Histórico
□ MODO LISTA alternativo totalmente funcional  ★
□ Navegação e edição por teclado no canvas
□ Nós com nome acessível descrevendo entrada e saída
□ Undo/redo com 50 passos
□ Autosave com debounce
□ Exportar não vaza segredo
□ Excluir exige digitar o nome
□ axe sem violações nos dois modos
□ Playwright: criar fluxo → validar → dry-run → publicar
```

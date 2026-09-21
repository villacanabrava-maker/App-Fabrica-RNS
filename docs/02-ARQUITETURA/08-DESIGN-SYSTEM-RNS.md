# Design System RNS

A identidade visual é **RNS**, não a identidade padrão de nenhuma biblioteca. shadcn/ui fornece o esqueleto do componente; os tokens fornecem a alma.

---

## 1. Arquitetura de tokens — três níveis obrigatórios

```
NÍVEL 1 — PRIMITIVO          valores brutos, sem significado
   violet.600  = #6D28D9
   space.4     = 16px
   radius.3    = 12px
              ↓
NÍVEL 2 — SEMÂNTICO          significado, independente de tela
   color.action.primary      = violet.600
   color.surface.elevated    = neutral.0 / neutral.900
   color.text.muted          = neutral.500
              ↓
NÍVEL 3 — COMPONENTE         uso específico
   button.primary.background = color.action.primary
   run.status.running        = color.status.info
   review.finding.critical   = color.status.critical
```

**Regra inviolável:** nenhum componente referencia o nível 1 diretamente. Componentes usam nível 3; nível 3 referencia nível 2; nível 2 referencia nível 1.

Formato de armazenamento: JSON compatível com a especificação do Design Tokens Community Group, para permitir interoperabilidade futura sem reinventar taxonomia. Arquivo: `design-system/tokens.json`.

---

## 2. Paleta

### Marca

| Token | Valor | Uso |
|---|---|---|
| `brand.primary` | `#6D28D9` (violeta) | ação principal, item ativo da navegação |
| `brand.primary-hover` | `#5B21B6` | hover |
| `brand.primary-subtle` | `#EDE9FE` | fundo de destaque leve |
| `brand.accent` | `#4F46E5` (índigo) | gradientes, ênfase secundária |
| `brand.gradient` | `linear-gradient(135deg, #4F46E5, #6D28D9)` | logo, cards de destaque, sidebar |
| `brand.ink` | `#0F0A1F` | fundo da sidebar (roxo quase preto) |

### Neutros

```
neutral.0    #FFFFFF     superfície base (claro)
neutral.50   #FAFAFB     fundo da aplicação (claro)
neutral.100  #F4F4F6     superfície sutil
neutral.200  #E7E7EC     bordas
neutral.300  #D3D3DC
neutral.400  #A0A0AE     ícones secundários
neutral.500  #71717F     texto muted
neutral.600  #52525E
neutral.700  #3F3F49     texto secundário (claro)
neutral.800  #27272E     superfície elevada (escuro)
neutral.900  #18181D     superfície base (escuro)
neutral.950  #0C0C10     fundo da aplicação (escuro)
```

### Status

| Token | Cor | Uso |
|---|---|---|
| `status.success` | `#16A34A` | sucesso, concluído, conectado |
| `status.warning` | `#F59E0B` | atenção, em revisão, alto uso |
| `status.danger` | `#DC2626` | erro, falha, zona de perigo |
| `status.info` | `#2563EB` | em execução, informação |
| `status.neutral` | `#71717F` | aguardando, pausado, cancelado |
| `status.critical` | `#991B1B` | finding crítico, bloqueio de segurança |

**Regra de acessibilidade:** cor nunca é o único portador de significado. Todo estado tem **ícone + rótulo textual** além da cor.

### Mapeamento semântico

```
color.bg.app                 neutral.50   / neutral.950
color.bg.surface             neutral.0    / neutral.900
color.bg.surface-elevated    neutral.0    / neutral.800
color.bg.sidebar             brand.ink    / brand.ink
color.border.default         neutral.200  / neutral.800
color.border.strong          neutral.300  / neutral.700
color.text.primary           neutral.900  / neutral.50
color.text.secondary         neutral.700  / neutral.300
color.text.muted             neutral.500  / neutral.400
color.text.on-brand          neutral.0    / neutral.0
color.action.primary         brand.primary
color.focus.ring             brand.accent
```

---

## 3. Tipografia

| Token | Tamanho / altura | Peso | Uso |
|---|---|---|---|
| `text.display` | 40 / 48 | 700 | título de página ("Dashboard", "Configurações") |
| `text.h1` | 32 / 40 | 700 | título de seção principal |
| `text.h2` | 24 / 32 | 600 | título de card grande |
| `text.h3` | 20 / 28 | 600 | título de card |
| `text.body-lg` | 16 / 24 | 400 | corpo destacado, subtítulo de página |
| `text.body` | 14 / 20 | 400 | corpo padrão |
| `text.body-sm` | 13 / 18 | 400 | texto secundário |
| `text.caption` | 12 / 16 | 400 | legendas, metadados, timestamps |
| `text.label` | 12 / 16 | 600 | rótulos de formulário, uppercase opcional |
| `text.metric` | 32 / 36 | 700 | número grande de KPI |
| `text.mono` | 13 / 20 | 400 | logs, SHAs, código, terminal |

Fontes:
- **Interface:** uma família sans humanista, com peso 400/500/600/700, `font-display: swap`, subset latin.
- **Mono:** uma família monoespaçada para logs e SHAs.
- Escolhas específicas: `UNSPECIFIED` — definir na Fase 1 e registrar em `tokens.json`.

---

## 4. Espaçamento e layout

Escala base 4px:

```
space.0  0     space.1  4     space.2  8     space.3  12
space.4  16    space.5  20    space.6  24    space.8  32
space.10 40    space.12 48    space.16 64    space.20 80
```

Grid:

| Elemento | Valor |
|---|---|
| Sidebar expandida | 260px |
| Sidebar compacta | 72px |
| Topbar | 64px |
| Padding do conteúdo | `space.6` (24px) desktop, `space.4` mobile |
| Gutter entre cards | `space.4` (16px) |
| Largura máxima do conteúdo | 1440px, centralizado acima disso |
| Painel lateral direito | 320–360px |

Breakpoints:

```
sm   640px    tablet pequeno
md   768px    tablet
lg   1024px   desktop pequeno — sidebar vira overlay abaixo daqui
xl   1280px   desktop
2xl  1536px   desktop grande
```

Comportamento responsivo obrigatório:

| Faixa | Sidebar | KPIs | Grid de cards | Tabelas |
|---|---|---|---|---|
| ≥ 1280px | expandida | 4–5 colunas | 3–4 colunas | completas |
| 1024–1279 | expandida | 3 colunas | 2–3 colunas | scroll horizontal |
| 768–1023 | overlay | 2 colunas | 2 colunas | cartões |
| < 768px | overlay | 1–2 colunas | 1 coluna | cartões |

---

## 5. Raios, sombras e bordas

```
radius.sm   6px     badges, chips
radius.md   10px    botões, inputs
radius.lg   14px    cards
radius.xl   20px    painéis grandes, modais
radius.full 9999px  avatares, pills

shadow.xs   0 1px 2px rgba(15,10,31,.05)
shadow.sm   0 1px 3px rgba(15,10,31,.08), 0 1px 2px rgba(15,10,31,.04)
shadow.md   0 4px 12px rgba(15,10,31,.08)
shadow.lg   0 12px 32px rgba(15,10,31,.12)
shadow.focus 0 0 0 3px rgba(79,70,229,.35)
```

No tema escuro, sombras são substituídas por diferença de superfície (`neutral.900` → `neutral.800`), não por sombras mais escuras.

---

## 6. Catálogo de componentes

### Primitivos (camada 1)
`Button` · `IconButton` · `Input` · `Textarea` · `Select` · `Checkbox` · `Radio` · `Switch` · `Slider` · `Label` · `Badge` · `Avatar` · `Tooltip` · `Popover` · `Dialog` · `Sheet` · `DropdownMenu` · `Tabs` · `Separator` · `Skeleton` · `Progress` · `ScrollArea` · `Toast`

### Compostos RNS (camada 2)

| Componente | Descrição |
|---|---|
| `PageHeader` | Título, subtítulo e até 2 ações |
| `KpiCard` | Ícone, valor, rótulo, delta com direção e cor |
| `StatCard` | Variante compacta sem delta |
| `FilterBar` | Busca + selects + botão de filtros avançados |
| `DataTable` | Ordenação, paginação, seleção, ações por linha, virtualização |
| `EmptyState` | Ícone, título, descrição, ação primária |
| `ErrorState` | Mensagem, causa provável, retry, `correlation_id` |
| `AsyncBoundary` | Orquestra loading / empty / error / partial / success |
| `StatusPill` | Cor + ícone + rótulo. **Nunca** só cor |
| `ProgressRow` | Rótulo, barra e percentual numérico |
| `ActivityFeed` | Lista de eventos com ícone, ator, ação e tempo relativo |
| `SidePanel` | Painel direito de contexto |
| `ConfirmDialog` | Confirmação com nível de risco (`safe` / `warning` / `danger`) |
| `CodeBlock` | Monoespaçado com cópia e realce |
| `LogViewer` | Terminal com nível, timestamp, filtro e auto-scroll |

### Compostos de domínio (camada 3)

| Componente | Onde aparece |
|---|---|
| `AgentCard` | Início, Agentes, Orquestração |
| `ProjectCard` | Início, Projetos |
| `TemplateCard` | Templates, wizard |
| `IntegrationCard` | Integrações |
| `KnowledgeCard` | Base de Conhecimento |
| `TaskCard` | Kanban do projeto |
| `KanbanBoard` | Pipeline do projeto |
| `FlowCanvas` | Orquestração |
| `FlowNode` | Orquestração |
| `RunTimeline` | Detalhe de execução |
| `ReviewChamber` | Câmara de Revisão — 4 colunas + divergências + veredicto |
| `DisagreementRow` | Câmara de Revisão |
| `FindingItem` | Câmara de Revisão, detalhe de tarefa |
| `EvidenceList` | Detalhe de etapa |
| `ApprovalCard` | Fila de aprovações |
| `StagePipeline` | Esteira de produção |
| `WizardStepper` | Novo Projeto (5 passos) |

---

## 7. Especificação de componentes centrais

### Button

| Variante | Uso | Aparência |
|---|---|---|
| `primary` | ação principal da tela | fundo `brand.primary`, texto branco |
| `secondary` | ação alternativa | fundo `neutral.100`, borda, texto primário |
| `outline` | ação terciária | apenas borda |
| `ghost` | ação em lista ou toolbar | sem fundo até hover |
| `danger` | destrutiva | fundo `status.danger` |
| `link` | navegação inline | texto com sublinhado no hover |

Tamanhos: `sm` (32px), `md` (40px), `lg` (48px).
Estados obrigatórios: default, hover, active, focus-visible, disabled, **loading** (spinner substitui o ícone e o texto vira "Aguarde…" ou mantém com `aria-busy`).

### StatusPill

```
┌──────────────────┐
│ ● Em andamento   │   ícone + cor + rótulo
└──────────────────┘
```

Mapeamento canônico:

| Estado | Cor | Ícone | Rótulo |
|---|---|---|---|
| `running` | info | spinner | "Em execução" |
| `succeeded` / `completed` | success | check | "Concluído" |
| `failed` | danger | alert | "Erro" |
| `awaiting_human` | warning | clock | "Aguardando você" |
| `blocked` | critical | lock | "Bloqueado" |
| `cancelled` | neutral | x | "Cancelado" |
| `queued` / `pending` | neutral | clock | "Aguardando" |
| `in_review` | warning | review | "Em revisão" |

### KpiCard

```
┌─────────────────────────────┐
│ ┌───┐                       │
│ │ ⚡│   156                  │  ← text.metric
│ └───┘   Execuções           │  ← text.body-sm
│         ↑ 18% vs período    │  ← text.caption + cor por direção
└─────────────────────────────┘
```

Delta: `↑` verde para melhora, `↓` vermelho para piora, `→` neutro para estável. **Atenção:** para métricas em que menor é melhor (tempo médio, erros), a direção da seta é invertida em cor. Isso é configuração do componente, não do consumidor.

---

## 8. Movimento

| Token | Duração | Curva | Uso |
|---|---|---|---|
| `motion.instant` | 80ms | `ease-out` | hover, foco |
| `motion.fast` | 150ms | `ease-out` | tooltip, dropdown |
| `motion.normal` | 220ms | `cubic-bezier(.2,0,0,1)` | painel, dialog |
| `motion.slow` | 320ms | `cubic-bezier(.2,0,0,1)` | transição de página |

Regras:
1. `prefers-reduced-motion: reduce` desliga translação e escala; mantém apenas opacidade.
2. Configurações → Aparência → "Animações da interface" desliga tudo.
3. Nada anima por mais de 320ms em interface operacional.
4. Skeleton pulsa; spinner gira. Nada mais pisca.

---

## 9. Tema claro e escuro

- Implementado por CSS variables trocadas em `[data-theme]`.
- Ambos os temas passam pelos mesmos testes de contraste.
- A sidebar usa `brand.ink` nos **dois** temas — é a assinatura visual do produto.
- Preferência do sistema respeitada por padrão; override em Configurações → Aparência.
- Nenhum componente pode assumir fundo claro. Proibido `color: #000` literal.

---

## 10. Storybook

Toda entrada do catálogo tem:

1. Story default
2. Story por variante
3. Story por estado (incluindo loading, empty, error e disabled)
4. Story em tema claro e escuro
5. Teste de acessibilidade automatizado
6. Snapshot visual

**Regra:** um componente não é usado em página antes de existir no Storybook com todos os estados.

---

## 11. O que é proibido

- Cor hexadecimal literal em componente de página.
- SVG inline fora do `Icon`.
- Tamanho de fonte ou espaçamento fora da escala.
- Componente sem estado de erro e vazio.
- Significado transmitido apenas por cor.
- `outline: none` sem substituto visível.
- Texto de interface hardcoded no JSX.
- Estilo inline exceto para valores dinâmicos calculados (ex.: largura de barra de progresso).

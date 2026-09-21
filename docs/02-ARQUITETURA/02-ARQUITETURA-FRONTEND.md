# Arquitetura Front-end

O front-end da Fábrica Apps RNS **não é "um dashboard com IA"**. É o **cockpit operacional de uma linha de produção de software**.

---

## 1. Stack — DECISÃO CONGELADA

| Camada | Decisão | Observação |
|---|---|---|
| Framework | Next.js App Router (linha 16.x) | Server Components por padrão |
| Linguagem | TypeScript `strict: true` | `noUncheckedIndexedAccess` ligado |
| Rendering | Server-first; Client Component só onde interação/realtime exigir | |
| Styling | Tailwind CSS + CSS variables derivadas de tokens | |
| Componentes | shadcn/ui **source-owned**, sobre a primitive congelada no projeto | o código pertence ao repositório |
| Design System | `packages/design-system` | identidade RNS, não identidade do shadcn |
| Catálogo | Storybook | testes de componente, a11y e regressão visual |
| Ícones | biblioteca única congelada no projeto | ver §7 |
| Gráficos | biblioteca única congelada no projeto | ver §8 |
| Estado servidor | Supabase via server queries / BFF | |
| Estado cliente | mínimo; apenas UI local | proibido espelhar domínio no cliente |
| Tempo real | Supabase Realtime (Broadcast) | eventos normalizados |
| Formulários | validação com o mesmo schema do back-end | fonte: `packages/contracts` |
| Testes de componente | Vitest + Storybook | |
| E2E | Playwright (+ axe-core) | |
| A11y | WCAG 2.2 AA + teste manual de teclado | |
| Deploy | Vercel | |

**VERIFICAR ANTES DE USAR:** versões exatas de Next.js, Tailwind, shadcn e da primitive devem ser confirmadas na documentação oficial no início da Fase 1 e registradas em `factory-intelligence/knowledge/frontend/`.

---

## 2. A regra de ouro da navegação

A interface é orientada às **entidades reais da fábrica**, não a "chats":

```
Aplicativo → Missão → Etapa → Tarefa → Execução → Evidência → Aprovação
```

Nunca:

```
Conversa → mensagem → mensagem → mensagem
```

Um chat contínuo é ilegível depois de 200 mensagens. Uma esteira com estados é legível para sempre.

---

## 3. Estrutura de pastas

```
apps/control-plane/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── (app)/
│   │   ├── layout.tsx                 # shell: sidebar + topbar
│   │   ├── page.tsx                   # Início
│   │   ├── projetos/
│   │   │   ├── page.tsx
│   │   │   ├── novo/page.tsx
│   │   │   └── [id]/
│   │   │       ├── layout.tsx
│   │   │       ├── page.tsx           # Pipeline
│   │   │       ├── visao-geral/page.tsx
│   │   │       ├── arquivos/page.tsx
│   │   │       ├── discussoes/page.tsx
│   │   │       ├── configuracoes/page.tsx
│   │   │       └── revisao/[cycleId]/page.tsx
│   │   ├── agentes/
│   │   ├── orquestracao/
│   │   ├── conhecimento/
│   │   ├── templates/
│   │   ├── integracoes/
│   │   ├── monitoramento/
│   │   ├── aprovacoes/
│   │   └── configuracoes/
│   └── api/                           # Route Handlers (BFF + webhooks)
│
├── features/                          # um diretório por domínio
│   ├── dashboard/
│   ├── projects/
│   ├── agents/
│   ├── orchestration/
│   ├── knowledge/
│   ├── templates/
│   ├── integrations/
│   ├── monitoring/
│   ├── settings/
│   ├── review-chamber/
│   └── approvals/
│
├── components/                        # compartilhados entre features
└── server/
    ├── actions/                       # server actions (comandos de domínio)
    ├── queries/                       # leituras
    └── realtime/                      # assinaturas de canal
```

Cada `features/<dominio>/` contém:

```
components/    ui específica do domínio
hooks/         hooks de cliente
schemas/       validação de formulário (reexporta de packages/contracts)
types.ts       tipos locais de view-model
index.ts       API pública do módulo
```

**Regra de import:** uma feature nunca importa arquivos internos de outra feature. Só pelo `index.ts`.

---

## 4. O shell da aplicação

Presente em todas as páginas autenticadas. Extraído das telas de referência.

```
┌─────────────┬───────────────────────────────────────────────────────┐
│  SIDEBAR    │  TOPBAR                                               │
│  260px      │  ┌──────────────────────┐        ┌───┐ ┌───────────┐ │
│             │  │ 🔍 Buscar projetos,  │        │🔔3│ │ JS  João  │ │
│ ◆ Fábrica   │  │    agentes,          │        └───┘ │  Admin  ▾ │ │
│   Apps RNS  │  │    templates...      │              └───────────┘ │
│  Agentes.   │  └──────────────────────┘                            │
│  Ideias.    ├───────────────────────────────────────────────────────┤
│  Aplicativos│                                                       │
│  Reais.     │   CONTEÚDO DA PÁGINA                                  │
│             │   ┌─────────────────────────────────────────────┐    │
│ 🏠 Início   │   │ Título grande                               │    │
│ 🗂 Projetos │   │ Subtítulo explicativo                       │    │
│ ⚙ Agentes   │   ├─────────────────────────────────────────────┤    │
│ ⛓ Orquestr. │   │ Abas da página                              │    │
│ 📖 Base Con.│   ├─────────────────────────────────────────────┤    │
│ ▦ Templates │   │ KPIs / grid de cards / tabelas / canvas     │    │
│ ⚛ Integraç. │   │                                             │    │
│ 📉 Monitor. │   └─────────────────────────────────────────────┘    │
│ ⚙ Config.   │                                                       │
│             │                                                       │
│ ┌─────────┐ │                                                       │
│ │ frase   │ │                                                       │
│ │ motivac.│ │                                                       │
│ │ RNS ▬▬  │ │                                                       │
│ └─────────┘ │                                                       │
└─────────────┴───────────────────────────────────────────────────────┘
```

### Componentes do shell

| Componente | Comportamento |
|---|---|
| `AppSidebar` | Nove itens fixos. Item ativo com fundo elevado e barra/realce. Colapsável (preferência em Configurações → Geral → "Compactar menu lateral"). Largura 260px expandida / 72px compacta. |
| `SidebarBrand` | Logo + "Fábrica Apps RNS" + tagline "Agentes. Ideias. Aplicativos Reais." Clica → Início. |
| `SidebarMotivation` | Card inferior com frase contextual por página (ver tabela em §4.1) + wordmark RNS com barra de progresso decorativa. Puramente decorativo, `aria-hidden`. |
| `GlobalSearch` | Busca federada: projetos, agentes, templates, documentos, execuções. Atalho `/` e `Cmd/Ctrl+K`. Resultados agrupados por tipo. |
| `NotificationBell` | Badge com contagem não lida. Abre painel lateral com: aprovações pendentes, erros, alertas de budget, conclusões. |
| `UserMenu` | Avatar com iniciais, nome, papel. Menu: Perfil, Configurações, Trocar organização, Tema, Sair. |

### 4.1 Frases do card motivacional (por página)

| Página | Frase |
|---|---|
| Início | "Transformando ideias em soluções reais com IA." |
| Projetos | "Construindo o futuro com agentes de IA." |
| Agentes de IA | "Inteligência que constrói o futuro." |
| Orquestração | "Orquestre agentes. Automatize processos. Multiplique resultados." |
| Base de Conhecimento | "Conhecimento que multiplica resultados." |
| Templates | "Templates prontos para grandes ideias." |
| Integrações | "Conecte suas ferramentas e multiplique o potencial da sua equipe." |
| Monitoramento | "Visibilidade total para decisões mais inteligentes." |
| Configurações | "Configure hoje um futuro mais produtivo." |

---

## 5. Padrão obrigatório de página

Toda página segue esta anatomia. Nenhuma exceção sem ADR.

```
1. PageHeader
   · título (h1)
   · subtítulo de uma linha
   · ações primárias à direita (no máximo 2 botões)

2. Tabs (quando a página tem sub-visões)
   · primeira aba é sempre "Visão Geral" ou equivalente

3. KPI Row (quando aplicável)
   · 4 a 5 cartões de métrica
   · cada um: ícone, valor grande, rótulo, delta vs período anterior

4. Filter Bar (quando há lista)
   · busca local + selects de filtro + botão "Filtros" avançados

5. Conteúdo principal
   · grid de cards | tabela | canvas | formulário em colunas

6. Painel lateral direito (opcional, 320–360px)
   · contexto, detalhe do item selecionado ou ações rápidas
```

---

## 6. Estados de UI — TODOS obrigatórios

Nenhum componente que busca dados pode existir sem os **sete** estados. Projetar só o happy path é defeito, não atalho.

| Estado | Regra |
|---|---|
| **Loading** | Skeleton com a forma do conteúdo real. Nunca spinner genérico em página inteira. |
| **Empty** | Ilustração/ícone + frase explicativa + ação primária que resolve o vazio. |
| **Error** | Mensagem humana + o que fazer + botão "Tentar novamente" + código correlacionável (`trace_id`). |
| **Partial success** | Mostra o que carregou e sinaliza o que falhou. Ex.: métricas vieram, logs não. |
| **Success** | O conteúdo. |
| **Stale / desatualizado** | Indicador de "atualizado há X" + botão atualizar quando o realtime cair. |
| **Forbidden** | Explica que falta permissão e qual papel resolveria. Nunca 404 mascarado. |

Componente base obrigatório: `<AsyncBoundary loading={...} empty={...} error={...}>`.

---

## 7. Sistema de ícones

**DECISÃO:** uma única biblioteca de ícones, congelada no projeto, com wrapper próprio.

```typescript
// packages/design-system/src/icon.tsx
export type IconName =
  // navegação
  | 'home' | 'projects' | 'agents' | 'orchestration'
  | 'knowledge' | 'templates' | 'integrations'
  | 'monitoring' | 'settings'
  // ações
  | 'plus' | 'search' | 'filter' | 'refresh' | 'more'
  | 'edit' | 'trash' | 'copy' | 'download' | 'upload'
  | 'external' | 'share' | 'play' | 'pause' | 'stop'
  // estado
  | 'check' | 'x' | 'alert' | 'info' | 'clock'
  | 'spinner' | 'lock' | 'unlock' | 'shield'
  // domínio
  | 'github' | 'supabase' | 'vercel' | 'openai'
  | 'anthropic' | 'antigravity' | 'slack'
  | 'branch' | 'commit' | 'pull-request' | 'database'
  | 'deploy' | 'review' | 'approval' | 'evidence';
```

Regras:

1. Nenhum SVG solto em página. Tudo passa por `<Icon name="..." />`.
2. Tamanhos permitidos: `16`, `20`, `24`, `32`, `48`. Nada fora disso.
3. Ícone decorativo → `aria-hidden="true"`.
4. Ícone que é a única informação de um botão → `aria-label` obrigatório.
5. Cor vem de token semântico, nunca hex literal.
6. Logotipos de terceiros (GitHub, Vercel, OpenAI…) ficam em `brand/`, com regras de uso de marca respeitadas.

**Cada documento em `03-PAGINAS/` lista, ícone por ícone, o que cada um faz naquela tela.**

---

## 8. Gráficos e visualização

| Uso | Forma | Regra |
|---|---|---|
| Série temporal de execuções | Linha com área suave | Máx. 3 séries; tooltip com total, sucesso e erros |
| Distribuição de status | Donut com valor central | Sempre acompanhado de legenda com número e porcentagem |
| Comparação por período | Barras verticais | Ordenado cronologicamente |
| Uso de recurso | Barra de progresso horizontal | Valor percentual à direita |
| Progresso de projeto | Barra linear | Percentual numérico obrigatório ao lado |
| Anéis de recurso (CPU/Memória) | Donut pequeno com número central | |

Regras transversais:

- Cor **nunca** é o único portador de significado. Sempre há rótulo, número ou forma.
- Paleta categórica derivada dos tokens semânticos, validada para contraste em tema claro e escuro.
- Eixos sempre rotulados. Sem eixo Y truncado sem indicação.
- Tooltip mostra valores absolutos, não só percentuais.
- Todo gráfico tem alternativa textual acessível (tabela oculta ou `aria-label` descritivo).

---

## 9. Realtime

```
Canais (tópicos Broadcast):
  factory:<organization_id>
  app:<app_id>
  mission:<mission_id>
  run:<run_id>
  deployment:<deployment_id>
```

Regras:

1. O navegador **não** recebe cada token nem cada byte de stdout.
2. Recebe eventos normalizados de progresso.
3. Logs de baixo nível são carregados **sob demanda**, paginados.
4. Ao perder a conexão: banner "reconectando", dados marcados como desatualizados, botão atualizar.
5. Ao reconectar: refetch do estado, não replay de eventos perdidos.

---

## 10. Performance

| Métrica | Budget | Gate |
|---|---|---|
| LCP (p75) | ≤ 2,5 s | bloqueia release |
| CLS (p75) | ≤ 0,1 | bloqueia release |
| INP | monitorado | alerta |
| JS inicial por rota | `UNSPECIFIED` até baseline | definir na Fase 1 |

Práticas obrigatórias:

- Server Components por padrão; `"use client"` só com justificativa.
- Tabelas longas com virtualização.
- Imagens via `next/image`.
- Nenhuma biblioteca pesada importada globalmente (gráficos e canvas em `dynamic import`).
- Fontes com `font-display: swap` e subset.

---

## 11. Acessibilidade

Nível alvo: **WCAG 2.2 AA em todas as telas**.

| Item | Regra |
|---|---|
| Teclado | Toda ação primária alcançável por teclado, em ordem lógica |
| Foco | Anel de foco visível, com contraste suficiente; nunca `outline: none` sem substituto |
| Contraste | Texto normal ≥ 4.5:1, texto grande ≥ 3:1, componentes ≥ 3:1 |
| Landmarks | `header`, `nav`, `main`, `aside`, `footer` corretos |
| Nomes acessíveis | Todo controle interativo tem nome acessível |
| Estado | `aria-current` na navegação ativa; `aria-live` para atualizações de execução |
| Movimento | Respeitar `prefers-reduced-motion` (Configurações → Aparência também desliga animações) |
| Formulários | `label` associado, erro descrito por `aria-describedby`, erro não só por cor |
| Modais | Foco preso, `Esc` fecha, foco retorna ao gatilho |
| Tabelas | `th` com `scope`, `caption` quando necessário |

Verificação: axe automatizado no Storybook e no Playwright **mais** teste manual de teclado por página. Automação sozinha não certifica acessibilidade.

---

## 12. Internacionalização

- Idioma padrão: **Português (Brasil)**.
- Todo texto de interface sai de arquivo de mensagens, nunca hardcoded no JSX.
- Datas, números e moedas formatados por `Intl`, com timezone da organização (padrão `America/Sao_Paulo`).
- Estrutura preparada para outros idiomas, mas nenhum outro idioma é escopo da Fase 1.

---

## 13. Segurança no front-end

| Regra | Detalhe |
|---|---|
| Nenhuma chave secreta no bundle | Apenas `sb_publishable_`; `sb_secret_` só no servidor |
| Nenhuma escrita direta de estado de domínio | O navegador pede `approve(task)`, não faz `update task set status=...` |
| Validação dupla | Cliente valida para UX; servidor valida para verdade |
| Conteúdo de terceiros | Markdown da Base de Conhecimento sanitizado; sem `dangerouslySetInnerHTML` sem sanitização |
| Links externos | `rel="noopener noreferrer"` |
| CSP | Definida e testada antes do primeiro release |

---

## 14. O que o front-end NÃO faz

- Não reimplementa os dashboards do GitHub, Supabase e Vercel. Mostra o necessário e **linka** para o original.
- Não decide transições de estado. Solicita comandos.
- Não guarda regra de negócio.
- Não esconde divergência entre modelos produzindo uma "média".
- Não exibe o prompt bruto enviado ao modelo em telas operacionais (fica em detalhe de execução, com permissão).

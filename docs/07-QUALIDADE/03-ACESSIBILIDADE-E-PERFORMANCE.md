# Acessibilidade e Performance

---

# PARTE A — ACESSIBILIDADE

## A.1 Nível alvo

**WCAG 2.2 nível AA em todas as telas.** Não é aspiração; é requisito de arquitetura.

A tradução autorizada da WCAG 2.2 para português do Brasil existe e deve ser a referência da equipe.

---

## A.2 Os riscos específicos deste produto

Um control plane de engenharia tem três telas que são armadilhas clássicas de acessibilidade:

| Tela | Risco | Mitigação obrigatória |
|---|---|---|
| **Kanban** (Projetos) | Drag-and-drop só com mouse | Operação completa por teclado: `Space` seleciona, setas movem, `Space` solta, `Esc` cancela, `aria-live` anuncia ★ |
| **Canvas** (Orquestração) | Grafo visual sem equivalente | **Modo lista alternativo** com as mesmas ações de edição ★ |
| **LogViewer** (Agentes, Monitoramento) | `aria-live` em rajada torna o leitor de tela inutilizável | Throttle de 2s + botão de pausar rolagem + `role="log"` ★ |

Esses três itens não são "melhorias". Sem eles, partes centrais do produto são inoperáveis por teclado ou leitor de tela.

---

## A.3 Requisitos transversais

| Item | Regra |
|---|---|
| Teclado | Toda ação primária alcançável, em ordem lógica |
| Foco | Sempre visível, com contraste suficiente. `outline: none` só com substituto |
| Contraste | Texto normal ≥ 4.5:1 · texto grande ≥ 3:1 · componentes ≥ 3:1 |
| Landmarks | `header`, `nav`, `main`, `aside`, `footer` corretos |
| Cabeçalhos | Um `h1` por página, sem pular níveis |
| Nome acessível | Todo controle interativo tem um |
| Estado | `aria-current` na navegação, `aria-pressed` em toggles |
| Cor | **Nunca** é o único portador de significado ★ |
| Movimento | Respeitar `prefers-reduced-motion` e a preferência em Configurações |
| Formulários | `label` associado, erro por `aria-describedby`, erro não só por cor |
| Modais | Foco preso, `Esc` fecha, foco volta ao gatilho |
| Tabelas | `th scope`, `caption` quando necessário |
| Gráficos | `aria-label` descritivo **e** alternativa em tabela ★ |
| Links externos | Anunciam que abrem nova aba |
| Botão desabilitado | Explica o motivo por `aria-describedby`, não só tooltip |
| Zoom | 200% sem perda de função |

---

## A.4 Onde a cor sozinha seria usada — e o que fazer

| Situação | Solução |
|---|---|
| Status de agente (online/offline) | Ponto colorido **+ rótulo textual** |
| Status de execução | `StatusPill` com ícone + cor + rótulo |
| Severidade de finding | Rótulo textual "critical" + ícone + cor |
| Séries em gráfico | Marcador de forma distinto + legenda |
| Delta de KPI (↑↓) | Seta + valor + texto descritivo |
| Estado de check (verde/vermelho) | Ícone ✓/✗ + rótulo |
| Conexão de integração | Rótulo "Conectado"/"Erro" |

---

## A.5 Processo de verificação

```
POR COMPONENTE (Storybook, bloqueia merge)
  axe automatizado
  todos os estados incluindo disabled e loading
  tema claro e escuro

POR TELA (Playwright, bloqueia merge)
  axe automatizado
  navegação por teclado do fluxo principal

MANUAL (checklist, bloqueia release)
  percurso completo só com teclado
  leitor de tela nos fluxos críticos
  zoom 200%
  movimento reduzido
```

Automação detecta apenas parte das falhas. O checklist manual está em `10-CHECKLISTS/02-CHECKLIST-POR-PAGINA.md` e é obrigatório antes de cada release.

---

# PARTE B — PERFORMANCE

## B.1 Budgets

| Métrica | Alvo | Gate |
|---|---|---|
| **LCP** (p75) | ≤ 2,5 s | bloqueia release |
| **CLS** (p75) | ≤ 0,1 | bloqueia release |
| **INP** | monitorado | alerta |
| JS inicial por rota | `UNSPECIFIED` | definir após baseline da Fase 1 |
| TTFB | `UNSPECIFIED` | idem |
| Tempo de resposta de comando | `UNSPECIFIED` | idem |

★ Definir budget numérico antes de medir produz número arbitrário. A Fase 1 estabelece o baseline; a Fase 2 congela os budgets.

---

## B.2 Práticas obrigatórias

| Prática | Regra |
|---|---|
| Server Components por padrão | `"use client"` exige justificativa em revisão |
| Agregação no banco | Nunca somar milhares de linhas no navegador ★ |
| Uma chamada por tela | O Dashboard agrega tudo em um endpoint, não cinco |
| Virtualização | Tabelas acima de 50 linhas, Kanban acima de 30 cartões |
| `dynamic import` | Gráficos, canvas, editor markdown, galeria |
| `next/image` | Toda imagem, com dimensões declaradas (evita CLS) |
| Fontes | `font-display: swap`, subset latin, preload da principal |
| Realtime | Só assina após hidratação e só na aba visível |
| Logs | Paginação por cursor, janelas de 200 linhas |
| Debounce | Busca 300ms, autosave 800ms, canvas 2s |
| Cache | Por período em métricas; TTL curto em dados operacionais |

---

## B.3 Onde este produto tende a ficar lento

| Risco | Mitigação |
|---|---|
| Monitoramento agregando milhares de runs | Views materializadas com refresh agendado ★ |
| Canvas com muitos nós | Virtualização acima de 50 nós + minimapa |
| LogViewer com execução longa | Cursor + limite de janela + pausa de auto-scroll |
| Kanban com centenas de tarefas | Virtualização por coluna |
| Dashboard com cinco chamadas | Endpoint agregado único |
| Realtime em todas as abas | Assinar só a aba visível |
| Markdown longo na Base de Conhecimento | Render no servidor |

---

## B.4 Medição

```
LABORATÓRIO (CI)
  Lighthouse nas rotas principais
  tamanho de bundle por rota
  tempo de build

CAMPO (produção)
  Web Vitals reais por rota
  tempo de resposta das rotas de comando
  tempo de agregação do Monitoramento
```

Regressão de LCP ou CLS acima do budget **bloqueia o release**, não gera apenas alerta.

---

## B.5 Checklist combinado

```
ACESSIBILIDADE
□ Kanban operável 100% por teclado  ★
□ Canvas com modo lista alternativo funcional  ★
□ LogViewer com throttle e pausa  ★
□ Nenhum significado transmitido só por cor
□ Todo gráfico com alternativa em tabela
□ Foco visível em todos os controles
□ Contraste verificado nos dois temas
□ prefers-reduced-motion respeitado
□ axe sem violações no Storybook e no Playwright
□ Checklist manual executado antes do release

PERFORMANCE
□ Server Components por padrão
□ Agregações no banco, não no cliente  ★
□ Dashboard com endpoint agregado único
□ Virtualização em tabelas, Kanban e canvas
□ Gráficos e canvas em dynamic import
□ Imagens com dimensões declaradas
□ Views materializadas do Monitoramento
□ Realtime só na aba visível
□ Baseline medido na Fase 1
□ Budgets congelados na Fase 2
□ LCP e CLS como gate de release
```

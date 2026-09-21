# FASE 3 — Refinamento Visual (feito pela própria fábrica)

**O princípio:** a partir daqui, a fábrica constrói a si mesma.

---

## 1. Por que esta fase é especial

O refinamento visual **não é feito à mão**. Cada melhoria vira uma **missão da própria Fábrica Apps RNS**:

```
missão criada no Control Plane
        ↓
plano gerado e revisado pelas 4 passagens
        ↓
Roberth aprova
        ↓
agentes implementam em branches isoladas
        ↓
revisão cruzada + CI + preview
        ↓
R8 verifica acessibilidade no navegador
        ↓
Roberth aprova a etapa
        ↓
merge → release
```

Isso é simultaneamente **o refinamento** e **a prova definitiva** de que a fábrica funciona. Se a fábrica não consegue melhorar a si mesma, ela não vai conseguir construir aplicativos para ninguém.

★ Há uma vantagem concreta: o repositório é o mesmo que os agentes já conhecem. A inteligência canônica, as skills, os schemas e a Constituição estão ali. É o ambiente mais bem preparado que existe para eles.

---

## 2. As missões da Fase 3

### M3.1 — Design system maduro

```
□ tokens.json completo nos três níveis
□ Paleta validada para contraste em ambos os temas
□ Tipografia completa com fontes escolhidas
□ Todos os primitivos no Storybook
□ Todos os compostos RNS no Storybook
□ Todos os compostos de domínio no Storybook
□ Cada componente com story por variante e por estado
□ Snapshot visual de cada um
□ Documentação de uso por componente
```

### M3.2 — Shell e navegação

```
□ Sidebar com transição suave entre expandida e compacta
□ Item ativo com indicação clara e acessível
□ Busca global com resultados agrupados e navegação por teclado
□ Painel de notificações com agrupamento por tipo
□ Menu de usuário completo
□ Breadcrumbs consistentes
□ Card motivacional com as frases por página
```

### M3.3 — Refinamento das 9 páginas

Uma missão por página, na ordem de uso:

```
M3.3.1  Início        hierarquia visual, gráficos, estados vazios ilustrados
M3.3.2  Projetos      cards, Kanban, Esteira, wizard
M3.3.3  Agentes       cards, timeline, log viewer
M3.3.4  Orquestração  canvas, nós, arestas, minimapa, auto-layout
M3.3.5  Conhecimento  leitor, sumário, cards de conteúdo
M3.3.6  Templates     galeria, carrossel, painel de preview
M3.3.7  Integrações   cards, estados de conexão, modal de chave
M3.3.8  Monitoramento gráficos, tabelas alternativas, gargalos
M3.3.9  Configurações formulários, zona de perigo, matriz de papéis
```

### M3.4 — Acessibilidade AA completa

```
□ Checklist manual executado em cada página
□ Kanban validado com leitor de tela
□ Canvas: modo lista validado com leitor de tela
□ LogViewer validado com leitor de tela
□ Todos os gráficos com alternativa em tabela verificada
□ Zoom 200% em todas as páginas
□ Contraste verificado em ambos os temas
□ Ordem de foco revisada página a página
```

### M3.5 — Performance dentro dos budgets

```
□ Baseline da Fase 1 revisado
□ Budgets congelados
□ LCP e CLS medidos em campo
□ Bundle por rota dentro do budget
□ Virtualização verificada em Kanban, tabelas e canvas
□ Views materializadas com refresh ajustado
□ Gate de release ativado para LCP e CLS
```

### M3.6 — Micro-interações

```
□ Tokens de movimento aplicados
□ prefers-reduced-motion respeitado em tudo
□ Preferência de animação em Configurações funcionando
□ Skeleton com a forma do conteúdo real
□ Transições de estado do Kanban
□ Feedback de salvamento discreto
□ Nada animando acima de 320ms
```

### M3.7 — Tema escuro

```
□ Todos os componentes verificados no escuro
□ Sidebar mantendo brand.ink nos dois temas
□ Sombras substituídas por diferença de superfície
□ Gráficos com paleta validada no escuro
□ Nenhum componente assumindo fundo claro
```

### M3.8 — Responsividade

```
□ Comportamento por breakpoint conforme 02-ARQUITETURA/08 §4
□ Sidebar como overlay abaixo de 1024px
□ Tabelas viram cartões abaixo de 768px
□ Kanban com scroll horizontal em telas menores
□ Canvas com aviso e modo lista em telas pequenas
□ Wizard em coluna única no mobile
```

---

## 3. Como cada missão roda

Cada missão da Fase 3 segue o ciclo completo. Exemplo real:

```
MISSÃO: M3.3.1 — Refinar a página Início

1. Roberth cria a missão no Control Plane
2. R1 decompõe em etapas:
     E1 hierarquia visual e espaçamento
     E2 gráficos com alternativa em tabela
     E3 estados vazios ilustrados
     E4 micro-interações
3. Plano vira Plan PR
4. GPT R1 → Claude R1 → GPT R2 → Claude R2
     · findings de acessibilidade
     · divergência sobre densidade de informação
5. Roberth resolve a divergência e aprova
6. Por etapa:
     R4 implementa em branch isolada
     R5 (runtime oposto) revisa
     R4 corrige
     R5 conclui
     CI: lint, types, unit, storybook, axe
     Preview pair nasce
     R8 verifica no navegador, com teclado e leitor de tela
     R9 consolida evidências
     Roberth aprova a etapa
     merge
7. Release gate
8. Produção
```

---

## 4. O que a Fase 3 revela sobre a fábrica

Esta fase é um teste de estresse honesto. Preste atenção a:

| Sinal | O que significa |
|---|---|
| Os agentes precisam de muito contexto para cada tarefa de UI | As skills de front-end estão fracas |
| Muitos findings de acessibilidade escapando | A skill `accessibility-review` precisa de critérios mais explícitos |
| Divergências frequentes sobre estética | Falta uma metodologia de UX registrada em `factory-intelligence/methodology/UX.md` |
| Retrabalho alto | Critérios de aceitação vagos nos Task Packets |
| Roberth aprovando sem ler | A Câmara de Revisão não está resumindo bem |
| Ciclos rápidos e aceitação alta | A fábrica está funcionando ★ |

Cada um desses sinais gera uma melhoria em `factory-intelligence/` — que também passa por PR revisado.

---

## 5. O portão da Fase 3

```
✓ Checklist manual de acessibilidade passa nas 9 páginas
✓ LCP e CLS dentro do budget em campo
✓ Storybook com todos os componentes e estados
✓ Tema escuro completo
✓ Responsividade verificada em todos os breakpoints
✓ Nenhuma regressão funcional
✓ CADA missão da Fase 3 passou pelo ciclo completo da fábrica  ★
```

O último item é o que importa mais. Uma interface bonita construída à mão prova que alguém sabe desenhar. Uma interface bonita construída pela fábrica prova que **a fábrica funciona**.

---

## 6. Depois da Fase 3

Com o Control Plane refinado e a fábrica provada construindo a si mesma, o próximo aplicativo é o de um cliente real — e o caminho já está pavimentado.

```
Fase 4  a fábrica aprende o quanto é boa
Fase 5  a fábrica escala
```

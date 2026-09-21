# Padrão de Documento de Página e Padrão Global de Interface

> Fusão de `00-PADRAO-DE-PAGINA.md` (pacote A / Claude Code) com `00_PADRAO_GLOBAL_DE_INTERFACE.md` (pacote B / ChatGPT). Este documento define **duas coisas**: (1) a estrutura obrigatória que todo documento de página em `04-paginas/` deve seguir, e (2) o padrão visual e de comportamento — shell, sidebar, topbar, componentes recorrentes, ícones e feedback — que toda página implementa. Leia isto antes de ler qualquer página individual.

---

## Parte 1 — Estrutura obrigatória de um documento de página

Todo documento nesta pasta segue **exatamente** esta estrutura, para que o programador (humano ou agente) saiba onde encontrar cada informação sem reler o documento inteiro:

```
1.  Identidade da página (rota, ícone, título, subtítulo, fase, permissão mínima)
2.  Objetivo e perguntas que a página responde
3.  Anatomia visual (diagrama ASCII da tela, por estado/aba quando aplicável)
4.  Inventário de ícones — ícone por ícone, o que faz
5.  Componentes utilizados
6.  Dados exibidos (de onde vem cada número/elemento)
7.  Interações e comportamentos
8.  Estados da página (loading, empty, error, partial, forbidden, stale)
9.  Rotas e navegação
10. Back-end: endpoints
11. Back-end: tabelas envolvidas
12. Back-end: eventos e realtime
13. Permissões
14. Acessibilidade específica da página
15. Performance específica da página
16. Fase de construção (F1, F2, F3...)
17. Definition of Done
18. Prompt sugerido para o agente construtor
```

Nem todo documento precisa de todas as dezoito seções em profundidade máxima — páginas simples podem condensar 9–10 em uma seção só — mas nenhuma seção pode ser **omitida silenciosamente**. Se uma seção não se aplica, o documento diz isso explicitamente.

### Convenções de leitura

| Marca | Significado |
|---|---|
| `[F1]` | Entregue na Fase 1 (app funcional, agentes mockados) |
| `[F2]` | Entregue na Fase 2 (agentes reais) |
| `[F3]` | Entregue na Fase 3 (refinamento visual) |
| `[F4]` | Entregue na Fase 4 (avaliação/evals) |
| `UNSPECIFIED` | Decisão pendente; **não inventar** |
| ★ | Item crítico: se estiver errado, a página não cumpre sua função |

### Regra do inventário de ícones

A seção 4 de cada página lista **todos** os ícones visíveis naquela tela, em uma tabela:

| Ícone | Onde aparece | Nome no `Icon` | Ação ao clicar | Rótulo acessível | Fase |
|---|---|---|---|---|---|

Nenhum ícone pode existir na tela sem estar nessa tabela. Se um ícone é decorativo, a coluna "Ação ao clicar" diz `decorativo` e o rótulo diz `aria-hidden`. Todo símbolo usado deve vir do módulo central de ícones descrito em `14-catalogo-de-acoes-e-icones.md` — nunca importado por nome arbitrário dentro de cada tela.

### Regra da rastreabilidade de dados

A seção 6 lista **cada número ou elemento exibido** e sua origem:

| Elemento na tela | Valor | Origem (tabela / cálculo) | Atualização |
|---|---|---|---|

Nenhum número pode aparecer na interface sem origem declarada. Número sem origem é defeito — não existe métrica "decorativa" ou "só para dar uma ideia". Onde a telemetria real ainda não existe (ex.: CPU/memória de worker pool na Fase 1), a página mostra estado vazio explicado, nunca um valor inventado.

---

## Parte 2 — Padrão Global de Interface

### Shell

A aplicação usa um shell consistente em todas as páginas autenticadas: **sidebar escura fixa** à esquerda, **topbar clara** com busca global, notificações e perfil, e **área principal branca**. A primeira versão (Fase 1) pode simplificar efeitos visuais (sombras, gradientes, animações), mas deve preservar hierarquia, navegação e todos os estados descritos abaixo. Em mobile, a sidebar vira drawer.

### Sidebar

Itens canônicos, nesta ordem:

| Item | Ícone semântico | Destino |
|---|---|---|
| Início | casa | dashboard operacional (`01-inicio.md`) |
| Projetos | pasta/briefcase | catálogo e detalhe (`02-projetos-lista-e-wizard.md`, `03-detalhe-do-projeto.md`) |
| Agentes de IA | chip/engrenagem | catálogo e detalhe (`04-agentes-de-ia-catalogo.md`, `05-detalhe-do-agente.md`) |
| Orquestração | nós conectados | fluxos e execuções (`06-orquestracao.md`) |
| Base de Conhecimento | livro | conteúdos e busca (`07-base-de-conhecimento.md`) |
| Templates | painel/modelo | catálogo de blueprints (`08-templates.md`) |
| Integrações | conexões | conexões externas (`09-integracoes.md`) |
| Monitoramento | gráfico/telemetria | saúde e logs (`10-monitoramento.md`) |
| Configurações | engrenagem | organização e políticas (`11-configuracoes.md`) |

O item ativo tem fundo destacado, texto e ícone com contraste adequado. Sidebar compacta exibe tooltips ao passar o mouse. O clique em um item de navegação nunca dispara uma atualização de dados por si só — é pura navegação.

### Topbar

- **Busca global**: por projeto (app), missão, tarefa, execução (run), agente, artefato e template — ver `13-telas-transversais.md`, seção F, e o comportamento `role="combobox"` ali descrito.
- **Sino de notificações**: abre a central de notificações (ver `13-telas-transversais.md`, seção E); o badge conta apenas itens acionáveis, não informativos.
- **Perfil**: abre organização, papel do usuário, preferências, sessões ativas e logout.
- Busca **não executa ações**; resultados sempre respeitam organização e permissão do usuário — nunca vazam dados de outro tenant.

### Componentes recorrentes

| Componente | Função |
|---|---|
| `StatusBadge` | label + ícone + cor; status nunca depende só da cor |
| `MetricCard` / `KpiCard` | valor, definição, período, comparação e drill-down |
| `FilterBar` | busca, filtros salvos, ordenação e "limpar filtros" |
| `DataTable` | paginação server-side, seleção, colunas configuráveis e menu de ações |
| `EmptyState` | motivo do vazio + CTA permitido pelo papel do usuário |
| `ErrorState` | mensagem segura, `correlation_id` copiável e retry quando seguro |
| `ConfirmDialog` | impacto, alvo, reversibilidade e confirmação proporcional ao risco (3 níveis: leve, `warning`, `danger`) |
| `ActivityFeed` | eventos normalizados, **nunca** log bruto |
| `AsyncBoundary` | isola loading/erro por bloco, para que um bloco quebrado não derrube a página inteira |

### Ícones

Ícones são gatilhos com **texto visível ou tooltip** — nunca só um símbolo mudo. Reticências (`⋯`) abrem menu contextual nomeado e navegável por teclado. Link externo identifica que abre nova aba. Lixeira sempre representa ação destrutiva e exige confirmação. Engrenagem abre configuração do **objeto** clicado, nunca a configuração global do sistema. Setas indicam navegação, nunca execução irreversível. Ver o catálogo completo em `14-catalogo-de-acoes-e-icones.md`.

### Feedback

- **Mutações curtas** (editar um campo, curtir): botão entra em loading, toast de confirmação, revalidação dos dados afetados.
- **Operações assíncronas** (gerar plano, provisionar, exportar): estado `requested`/`in_progress` visível, link para acompanhar a execução (run) e atualização via Realtime — nunca um spinner mudo e infinito.
- **Erro**: mensagem seguindo linguagem humana e segura (sem stack trace, sem detalhe interno de infraestrutura), preservação do formulário preenchido, `correlation_id` visível.
- **Ação destrutiva**: sem undo implícito; a interface informa política de backup/retenção antes de confirmar.

### Permissão

Ocultar uma ação da interface pode melhorar a UX, mas **o servidor sempre revalida** — esconder um botão nunca é o único controle de acesso. Quando útil à compreensão do usuário, a interface exibe a ação desabilitada com o motivo e o papel (role) necessário, em vez de simplesmente escondê-la.

---

## Ordem de construção das páginas

Esta é a ordem recomendada, porque cada página depende de dados ou entidades criados pelas anteriores:

```
1.  Autenticação + shell              (13-telas-transversais.md)
2.  Configurações                      (11) — a organização precisa existir primeiro
3.  Projetos (lista + wizard)          (02) — a entidade central do produto
4.  Detalhe de Projeto / Pipeline      (03)
5.  Agentes de IA (catálogo + detalhe) (04, 05)
6.  Início / Dashboard                 (01) — depende dos dados das páginas acima
7.  Monitoramento                      (10)
8.  Base de Conhecimento               (07)
9.  Templates                          (08)
10. Integrações                        (09)
11. Orquestração                       (06) — a página mais complexa; construir por último na Fase 1
12. Câmara de Revisão e Aprovações     (12) — Fase 2
13. Telas transversais restantes       (13) — busca, notificações, erros, execução
14. Catálogo de Ações e Ícones         (14) — referência viva, mantida desde o início
```

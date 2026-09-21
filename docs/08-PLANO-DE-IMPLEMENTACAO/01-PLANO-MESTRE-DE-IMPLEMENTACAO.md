# PLANO MESTRE DE IMPLEMENTAÇÃO

**O documento que diz o que construir, em que ordem e como saber que terminou.**

---

## 1. A decisão estratégica

Esta é a decisão do proprietário do projeto, e ela governa todo o plano:

> **Primeiro o aplicativo funciona. Depois os agentes são reais. Só então a fábrica constrói a própria beleza.**

```
FASE 1 — O APLICATIVO FUNCIONA
   As 9 páginas existem, com dados reais, autenticação,
   estado persistente, filas, máquinas de estado,
   ciclo de revisão completo — e agentes SIMULADOS.
   Nenhuma chamada a modelo de IA. Custo zero de tokens.
                    ↓
FASE 2 — OS AGENTES SÃO REAIS
   Troca-se o MockAdapter por OpenAI e Claude.
   O protocolo, já provado, passa a rodar com inteligência real.
   Provisionamento, previews e releases entram em operação.
                    ↓
FASE 3 — A FÁBRICA REFINA A SI MESMA
   O refinamento visual, de acessibilidade e de experiência
   é feito PELA PRÓPRIA FÁBRICA, usando os agentes da Fase 2.
```

### Por que nesta ordem

| Razão | Explicação |
|---|---|
| **Provar o motor determinístico antes do probabilístico** | Se o estado, as filas, a idempotência e os gates não funcionam, adicionar IA só esconde o problema sob aleatoriedade |
| **Custo zero na fase de maior retrabalho** | A Fase 1 é onde mais se erra e se refaz. Errar com mock custa tempo; errar com modelos custa tempo **e** dinheiro |
| **Depuração possível** | Um bug com `MockAdapter` é reproduzível. Um bug com modelo real pode não ser |
| **O aplicativo feio que funciona pode construir o bonito** | O contrário é impossível |
| **Contratos definidos antes de terem consumidor real** | O `AgentAdapter` nasce pensado para dois fornecedores, não adaptado depois |

---

## 2. Visão geral das fases

| Fase | Nome | Entrega central | Critério de saída |
|---|---|---|---|
| **0** | Fundação da Inteligência | Constituição, registries, schemas, bootloaders, projeções, CODEOWNERS, rulesets | Schemas validam; projeções reproduzíveis; CI detecta drift; paths críticos protegidos |
| **1** | Aplicativo Funcional | As 9 páginas + Orchestrator + filas + MockAdapter + ciclo completo | O teste de aceitação da Fase 1 passa de ponta a ponta |
| **2** | Agentes Reais | OpenAI e Claude adapters, provisionamento, previews, release | Um aplicativo real construído de ponta a ponta com aprovações humanas |
| **3** | Refinamento | Design system maduro, a11y AA completa, performance dentro dos budgets | Checklist manual de a11y passa em todas as páginas; budgets congelados e respeitados |
| **4** | Evidência e Qualidade | Evals, telemetria de custo, precision/recall, dashboards | Métricas coletadas por runtime/papel/skill; baselines estabelecidas |
| **5** | Escala da Fábrica | Multi-tenant operacional, quotas, budgets, Agent Router por dados, release service | Criação de app ponta a ponta auditável; isolamento validado; recovery testado |

---

## 3. FASE 0 — Fundação da Inteligência

**Duração estimada:** `UNSPECIFIED` (estimar após montar a equipe)
**Objetivo:** construir o sistema nervoso que tornará a autonomia futura controlável.

★ A Fase 0 **não** programa autonomia máxima. Ela cria as fronteiras.

### Entregáveis

```
□ Repositório rns-factory criado com a estrutura de 02-ARQUITETURA/01
□ factory-intelligence/constitution/CONSTITUTION.md escrito
□ factory-intelligence/registry/agents.yaml com os 9 papéis
□ factory-intelligence/registry/permissions.yaml
□ factory-intelligence/registry/runtimes.yaml e models.yaml
□ Os 6 JSON Schemas canônicos
□ AGENTS.md e CLAUDE.md (bootloaders curtos)
□ Primeiras skills: code-review, migration-review, rls-audit,
  plan-review, security-audit, deep-research
□ scripts/intelligence/build-projections.ts
□ scripts/intelligence/validate-registry.ts
□ scripts/intelligence/validate-schemas.ts
□ scripts/intelligence/check-drift.ts
□ .github/CODEOWNERS
□ Ruleset de main configurado
□ .github/workflows/intelligence-ci.yml
□ Fixtures de eval iniciais (servem também ao MockAdapter)
```

### Critério objetivo de saída

```
✓ Todos os JSON Schemas validam
✓ Registries validam contra seus schemas
✓ Projeções são reproduzíveis (rodar duas vezes gera o mesmo hash)
✓ CI falha quando alguém edita .claude/skills à mão
✓ PR alterando factory-intelligence exige code owner
✓ Force push em main falha
✓ Nenhuma alteração privilegiada chega a main sem gate
```

---

## 4. FASE 1 — Aplicativo Funcional ★

**A fase mais longa e mais importante.** Detalhamento completo em `02-FASE-1-APP-FUNCIONAL.md`.

### O princípio da Fase 1

> **Nenhuma chamada a modelo de IA. Nenhum token gasto. Tudo determinístico.**

O `MockAdapter` lê fixtures e devolve saídas válidas contra os schemas — incluindo findings e divergências. O ciclo de quatro passagens roda inteiro, a Câmara de Revisão exibe tudo, e o human gate funciona de verdade.

### Sprints

| Sprint | Entrega | Depende de |
|---|---|---|
| **1.1** | Fundação: repositório, Supabase, schemas, tabelas, RLS, testes de negação | Fase 0 |
| **1.2** | Autenticação + shell + Configurações (Geral, Equipe, Segurança) | 1.1 |
| **1.3** | Domínio: apps, specs, missões, etapas, tarefas, DAG, máquinas de estado | 1.1 |
| **1.4** | Orchestrator: filas, leases, idempotência, event processor, policy engine | 1.3 |
| **1.5** | Projetos: lista, wizard de 5 passos, detalhe, Kanban, Esteira | 1.3 |
| **1.6** | Agentes de IA: catálogo, detalhe, MockAdapter, contract tests | 1.4 |
| **1.7** | Review Engine: ciclo de 4 passagens, findings, divergências, Câmara de Revisão | 1.6 |
| **1.8** | Human gate: fila de aprovações, assinatura lógica, invariante de banco | 1.7 |
| **1.9** | GitHub: App, webhooks, PRs, checks | 1.4 |
| **1.10** | Início (Dashboard) + Monitoramento | 1.5, 1.6 |
| **1.11** | Base de Conhecimento + Templates + Integrações | 1.2 |
| **1.12** | Orquestração: canvas, editor, validação, dry-run, modo lista | 1.6 |
| **1.13** | Teste de aceitação completo + correções | tudo |

### Critério objetivo de saída ★

O teste de aceitação de `07-QUALIDADE/01-ESTRATEGIA-DE-TESTES.md`, §5, passa **automatizado, de ponta a ponta**. Em especial estes quatro:

```
✓ reenviar o mesmo webhook 5× → nenhum efeito duplicado
✓ matar o worker no meio → lease expira → outro retoma → sem duplicação
✓ aprovar com actor_type='agent' → rejeitado pelo BANCO
✓ preview_pair_ready só dispara com AMBOS os eventos
```

Esses quatro itens são o que separa um protótipo de uma fábrica.

---

## 5. FASE 2 — Agentes Reais

Detalhamento em `03-FASE-2-AGENTES-REAIS.md`.

### O princípio da Fase 2

> **Trocar o adapter, não o domínio.**

Se a Fase 1 foi bem feita, plugar OpenAI e Claude é uma troca de implementação. O Orchestrator, as máquinas de estado, o Review Engine, a Câmara de Revisão e os gates **não mudam**.

### Sprints

| Sprint | Entrega |
|---|---|
| **2.1** | Integrações reais: OpenAI e Anthropic com WIF/OIDC |
| **2.2** | `OpenAIAdapter` passando nos contract tests |
| **2.3** | `ClaudeAdapter` passando nos contract tests |
| **2.4** | Intelligence Resolver + projeções consumidas pelos runtimes reais |
| **2.5** | Agent Router com alternância de runtime |
| **2.6** | Provisionamento: GitHub repo + Supabase project + Vercel project |
| **2.7** | Preview pair: barreira de prontidão + E2E disparado por `repository_dispatch` |
| **2.8** | Release Service: merge gate, deployment checks, rolling release |
| **2.9** | Budget Service: verificação durante execução, alertas, interrupção |
| **2.10** | Antigravity: RNS Local Bridge + Handoff Bundle + fallback web |
| **2.11** | Um aplicativo real construído de ponta a ponta |

### Critério objetivo de saída ★

```
✓ Nenhum loop acima de 4 hops
✓ Todas as saídas validam contra os schemas
✓ Mudança de SHA invalida o ciclo
✓ Human gate recebe pacote completo e reproduzível
✓ Cada tarefa de escrita tem workspace isolado
✓ PR associa SHA, task e run
✓ E2E só inicia com preview pair pronto
✓ Um aplicativo real foi da ideia à produção,
  com todas as aprovações humanas registradas  ★
```

---

## 6. FASE 3 — Refinamento (feito pela própria fábrica)

Detalhamento em `04-FASE-3-REFINAMENTO-VISUAL.md`.

### O princípio da Fase 3

> **A partir daqui, a fábrica constrói a si mesma.**

O refinamento visual não é feito à mão. Ele vira **missões da própria Fábrica Apps RNS**, com plano, revisão dupla, preview e aprovação — exatamente como qualquer outro aplicativo.

Isso é, simultaneamente, o refinamento **e** a prova definitiva de que a fábrica funciona.

### Missões da Fase 3

```
M3.1  Design system maduro: tokens completos, todos os estados,
      Storybook com cobertura total
M3.2  Refinamento da navegação e do shell
M3.3  Refinamento de cada uma das 9 páginas
M3.4  Acessibilidade AA completa, com checklist manual por página
M3.5  Performance dentro dos budgets congelados
M3.6  Micro-interações e movimento
M3.7  Tema escuro refinado
M3.8  Responsividade completa
```

### Critério objetivo de saída

```
✓ Checklist manual de a11y passa em todas as 9 páginas
✓ LCP e CLS dentro do budget em campo
✓ Storybook com todos os componentes e estados
✓ Cada missão da Fase 3 passou pelo ciclo completo da fábrica  ★
✓ Nenhuma regressão funcional introduzida
```

---

## 7. FASE 4 — Evidência e Qualidade

```
□ Suite de evals completa
□ Baselines por runtime
□ Telemetria de custo real por token e hora de sessão
□ Precision, recall e taxa de aceitação humana medidas
□ Red team de segurança
□ Aba Avaliações no detalhe do agente
□ Dashboards de qualidade
```

**Saída:** métricas coletadas por provider, modelo, papel e skill; thresholds de qualidade definidos **com base em baseline real**, não em números arbitrários; casos críticos de segurança bloqueando corretamente.

---

## 8. FASE 5 — Escala da Fábrica

```
□ Provisionamento de múltiplos apps em paralelo
□ Multi-tenant operacional com mais de uma organização
□ Quotas e budgets por organização
□ Agent Router informado por dados de desempenho
□ Release service completo
□ Analytics da fábrica
```

**Saída:** criação de aplicativo ponta a ponta auditável; isolamento entre organizações validado; budgets aplicados; recuperação testada; SLOs definidos com dados reais.

---

## 9. O que NÃO fazer em cada fase

| Fase | Tentação | Por que resistir |
|---|---|---|
| 0 | "Vamos já programar a autonomia" | Autonomia sem fronteira é ingovernável |
| 1 | "Vamos plugar um modelo só para ver" | O motor determinístico ainda não está provado |
| 1 | "Vamos deixar a UI bonita agora" | Retrabalho garantido quando o domínio mudar |
| 2 | "Vamos pular o preview pair" | Falha intermitente cara de depurar depois |
| 2 | "Vamos dar acesso de produção ao agente só desta vez" | Isso é constitucional. Não existe "só desta vez" |
| 3 | "Vamos refinar à mão, é mais rápido" | Perde-se a prova de que a fábrica funciona |
| 4 | "Vamos definir 95% como meta" | Número sem baseline é arbitrário |
| 5 | "Vamos abrir para clientes externos" | Só depois de isolamento e recovery testados |

---

## 10. Como medir progresso

Não medir por "porcentagem do código escrito". Medir por **capacidades provadas**:

```
FASE 0  ✓ a inteligência é versionada e protegida
FASE 1  ✓ o motor determinístico funciona sem IA
FASE 2  ✓ um aplicativo real nasceu da fábrica
FASE 3  ✓ a fábrica construiu a si mesma
FASE 4  ✓ a fábrica sabe o quanto é boa
FASE 5  ✓ a fábrica escala
```

Cada uma é uma afirmação verificável. Nenhuma admite "quase".

---

## 11. Riscos do cronograma

| Risco | Mitigação |
|---|---|
| Fase 1 se alongar indefinidamente | Escopo congelado neste pacote; "seria legal ter" vai para a Fase 3 |
| Tentação de pular para a Fase 2 | O teste de aceitação da Fase 1 é o portão, e é automatizado |
| Gargalo humano nas aprovações | Classificar decisões por risco; painel de gargalos desde a Fase 1 |
| Fornecedor mudar contrato na Fase 2 | Adapters isolados; contract tests detectam |
| Custo surpreender na Fase 2 | Budgets desde o primeiro run; alertas em 50/80/100% |
| Documentação divergir do código | Este pacote versionado no repositório, alterado por PR |

---

## 12. A ordem literal de construção

Se houver uma só pessoa construindo, esta é a sequência:

```
 1. Repositório + estrutura de pastas
 2. Factory Supabase: schemas, tipos, tabelas
 3. RLS + testes de negação + constraint approvals_must_be_human
 4. JSON Schemas + packages/contracts
 5. Máquinas de estado (puras, testadas sem I/O)
 6. Policy engine (puro, testado)
 7. Autenticação + shell + Configurações
 8. Domínio: apps, specs, missões, etapas, tarefas
 9. Filas + leases + idempotência + event processor
10. MockAdapter + contract tests
11. Review Engine + ciclo de 4 passagens
12. Human gate + fila de aprovações
13. Projetos: lista, wizard, detalhe, Kanban, Esteira
14. Agentes de IA: catálogo e detalhe
15. Câmara de Revisão
16. GitHub App + webhooks + PRs
17. Início (Dashboard)
18. Monitoramento
19. Base de Conhecimento + Templates + Integrações
20. Orquestração (canvas + modo lista)
21. Teste de aceitação da Fase 1  ← PORTÃO
22. → Fase 2
```

Note que a interface bonita **não aparece** nesta lista. Ela é a Fase 3, e será construída pela própria fábrica.

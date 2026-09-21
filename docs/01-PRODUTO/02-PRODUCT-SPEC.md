# Product Spec — Fábrica Apps RNS

Especificação funcional do produto. Este documento define **o que o aplicativo faz**. Não define como implementar (isso é `02-ARQUITETURA/`) nem como cada tela é montada (isso é `03-PAGINAS/`).

---

## 1. Proposta de valor

**Para** operadores que têm ideias de aplicativos e não querem virar gargalo técnico,
**a Fábrica Apps RNS** é um control plane de engenharia multiagente
**que** transforma ideia em aplicativo publicado com rastreabilidade total,
**diferente de** um chat com IA ou de uma ferramenta de no-code,
**porque** cada passo é estado persistente, revisado por dois modelos independentes e aprovado por um humano autenticado.

---

## 2. Capacidades de produto (epics)

| ID | Capacidade | Descrição | Fase |
|---|---|---|---|
| **C01** | Autenticação e organização | Login, sessão, organização, membros, papéis (RBAC) | 1 |
| **C02** | Gestão de projetos | Criar, listar, filtrar, arquivar aplicativos em construção | 1 |
| **C03** | Wizard de criação | Ideia → Planejamento → Revisão → Implementação → Publicação | 1 |
| **C04** | Especificação versionada | Capturar e versionar requisitos do produto a construir | 1 |
| **C05** | Missões, etapas e tarefas | Decompor trabalho em DAG com dependências | 1 |
| **C06** | Pipeline visual (Kanban + Esteira) | Ver e mover trabalho entre estados | 1 |
| **C07** | Catálogo de agentes | Registrar papéis R1–R9, capacidades, skills, permissões | 1 |
| **C08** | Execuções (runs) | Registrar toda execução com estado, eventos, custo e artefatos | 1 |
| **C09** | Orquestração de fluxos | Montar e executar fluxos multiagente em canvas | 1 (editor) / 2 (execução real) |
| **C10** | Base de conhecimento | Documentos, tutoriais, boas práticas, busca e assistente | 1 |
| **C11** | Templates | Pontos de partida para novos aplicativos | 1 |
| **C12** | Integrações | Conectar e gerenciar GitHub, Supabase, Vercel, OpenAI, Anthropic, Slack e outros | 1 (GitHub/Supabase/Vercel) / 2 (IA) |
| **C13** | Monitoramento | Métricas, logs, erros, alertas, uso de recursos e relatórios | 1 |
| **C14** | Configurações | Organização, equipe, segurança, notificações, aparência, faturamento, avançado | 1 |
| **C15** | Ciclo de revisão dupla | Protocolo de quatro passagens com divergências registradas | 2 |
| **C16** | Câmara de Revisão | Interface que mostra as quatro passagens e as divergências | 2 |
| **C17** | Fila de aprovações e human gate | Aprovação humana autenticada com assinatura lógica | 1 (estrutura) / 2 (uso real) |
| **C18** | Provisionamento automático | Criar repositório GitHub + projeto Supabase + projeto Vercel | 2 |
| **C19** | Preview pair | Supabase preview branch + Vercel preview deployment sincronizados | 2 |
| **C20** | Release controlado | Merge gate e release gate separados, com rolling release | 2 |
| **C21** | Evidências e auditoria | Ledger imutável de decisões, provas e proveniência | 1 (base) / 2 (completo) |
| **C22** | Custos e budgets | Tokens, tempo, dinheiro por app/missão/tarefa/provider/modelo | 2 |
| **C23** | Evals de agentes | Avaliação empírica de papéis, skills, runtimes e modelos | 4 |
| **C24** | Agent Router por dados | Escolha de runtime baseada em desempenho histórico | 5 |

---

## 3. Requisitos funcionais por capacidade

### C01 — Autenticação e organização

- RF-01.1 O sistema deve autenticar usuários via Supabase Auth.
- RF-01.2 Todo dado deve pertencer a uma `organization_id`. Multi-tenant desde o início, mesmo com uma só organização.
- RF-01.3 Deve existir RBAC com pelo menos: `owner`, `admin`, `engineer`, `viewer`.
- RF-01.4 A sessão deve expirar e ser renovável; sessões ativas devem ser listáveis e revogáveis (ver `03-PAGINAS/09-CONFIGURACOES.md`).
- RF-01.5 Deve existir autenticação em duas etapas opcional.

### C02 / C03 — Projetos e wizard

- RF-02.1 Um projeto tem: nome, descrição, ícone, status, progresso, datas, equipe, repositório, deploy, banco, tags.
- RF-02.2 Status de projeto: `planejamento`, `em_andamento`, `em_revisao`, `pausado`, `concluido`, `arquivado`.
- RF-03.1 O wizard tem cinco passos fixos: **Ideia, Planejamento, Revisão, Implementação, Publicação**.
- RF-03.2 O passo Ideia aceita texto livre de até 2000 caracteres, objetivos múltiplos e escolha opcional de template.
- RF-03.3 O sistema deve oferecer sugestões de IA (recursos, tecnologias, agentes, tempo estimado). Na Fase 1 essas sugestões vêm de heurística determinística; na Fase 2, de R1/R3.
- RF-03.4 Nenhum projeto avança do passo Revisão sem aprovação humana registrada.

### C05 / C06 — Trabalho

- RF-05.1 Hierarquia obrigatória: `app → mission → stage → task → run`.
- RF-05.2 Tarefas têm dependências formando um DAG; ciclos são rejeitados na escrita.
- RF-05.3 Toda transição de estado de tarefa é validada contra a máquina de estados; transições impossíveis são rejeitadas e auditadas.
- RF-06.1 O Kanban tem quatro colunas: **Fazer, Em andamento, Em revisão, Concluído**.
- RF-06.2 A Esteira mostra a sequência de passagens e gates de cada etapa.

### C07 / C08 — Agentes e execuções

- RF-07.1 Agentes são definidos por papel (R1–R9), não por fornecedor.
- RF-07.2 Cada agente exibe: modelo resolvido, temperatura, máx. tokens, última execução, taxa de sucesso, tempo médio.
- RF-07.3 Cada agente tem abas: Visão Geral, Skills, Prompt, Ferramentas, Execuções, Avaliações, Configurações.
- RF-08.1 Toda execução grava: papel, runtime, modelo, skills, `base_sha`, branch, início, fim, tokens, custo, ferramentas usadas, arquivos modificados, PR, testes e aprovação.
- RF-08.2 Uma execução nunca existe apenas porque "um agente está conversando". Existe como linha em `runs`.

### C15 / C16 / C17 — Revisão e aprovação

- RF-15.1 O ciclo tem exatamente quatro passagens. `round > 4` é negado.
- RF-15.2 Cada passagem produz saída válida contra `review.schema.json`.
- RF-15.3 Findings são objetos separados com severidade, categoria, evidência e status.
- RF-15.4 Divergências materiais são persistidas em `disagreements` e exibidas, nunca diluídas.
- RF-16.1 A Câmara de Revisão exibe as quatro colunas (GPT R1, Claude R1, GPT R2, Claude R2), a lista de divergências e o veredicto final.
- RF-17.1 Uma aprovação grava `user_id`, `approval_id`, `subject_sha`, `decision`, `timestamp` e justificativa opcional.
- RF-17.2 Nenhuma aprovação pode ser gravada por um ator do tipo `agent`.

### C18 / C19 / C20 — Entrega

- RF-18.1 O provisionamento cria repositório, projeto Supabase e projeto Vercel e registra todos os IDs.
- RF-19.1 O sistema só declara `preview_pair_ready` após receber **ambos** os eventos de prontidão.
- RF-20.1 Merge e release são decisões independentes, com gates distintos.
- RF-20.2 Nenhum agente possui credencial de produção.

---

## 4. Requisitos não funcionais

| ID | Requisito | Alvo |
|---|---|---|
| RNF-01 | LCP no percentil 75 | ≤ 2,5 s |
| RNF-02 | CLS no percentil 75 | ≤ 0,1 |
| RNF-03 | INP | monitorado como gate de responsividade |
| RNF-04 | Acessibilidade | WCAG 2.2 nível AA em todas as telas |
| RNF-05 | Navegação por teclado | 100% das ações principais alcançáveis sem mouse |
| RNF-06 | Idempotência | Reprocessar o mesmo webhook não duplica efeito |
| RNF-07 | Recuperação | Worker morto → lease expira → outro worker retoma |
| RNF-08 | Auditoria | Toda decisão crítica correlacionável a mission, task, run, SHA e ator |
| RNF-09 | Isolamento multi-tenant | RLS testada com casos de negação explícitos |
| RNF-10 | Sem segredo no cliente | Nenhuma chave `sb_secret_` ou equivalente no bundle |
| RNF-11 | Tempo real | Atualização de UI por Broadcast, não por polling constante |
| RNF-12 | Observabilidade | Todo run carrega correlation context completo |

---

## 5. Fora de escopo (explicitamente)

- Reconstruir o dashboard do GitHub, do Supabase ou do Vercel.
- Chat livre entre modelos sem protocolo.
- Subagentes cross-provider (Claude chamando OpenAI diretamente) — proibido na v1.
- Edição simultânea do mesmo checkout por dois agentes.
- Marketplace público de templates com terceiros (Fase futura).
- Billing para clientes externos (Fase 5+).

---

## 6. Métricas de sucesso do produto

| Métrica | Definição | Quando medir |
|---|---|---|
| Circuito completo | Uma missão percorre ideia → produção sem intervenção fora dos gates | Fim da Fase 2 |
| First-pass acceptance | % de etapas aceitas sem rework | Fase 4 |
| Human override rate | % de decisões de IA revertidas pelo humano | Fase 4 |
| Escaped defect rate | Defeitos que passaram por todos os gates | Fase 4 |
| Custo por etapa aceita | Custo total / etapas aceitas | Fase 4 |
| Tempo de ciclo mediano e P95 | Da criação da tarefa ao merge | Fase 2 em diante |

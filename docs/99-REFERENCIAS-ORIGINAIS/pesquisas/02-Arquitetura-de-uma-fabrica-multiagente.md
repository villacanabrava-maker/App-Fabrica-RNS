# Fábrica Apps RNS — Arquitetura de uma fábrica multiagente para construir aplicativos

## Conclusão executiva e evolução da ideia

Analisei a proposta desta conversa em conjunto com o documento anterior, no qual já havíamos separado a futura fábrica em **Control Plane, Orchestrator, Agent Execution Plane, GitHub como plano de entrega, Supabase como estado operacional e Vercel como runtime das aplicações produzidas**. fileciteturn0file0 Também confrontei esse desenho com a documentação atual, em **20 de setembro de 2026**, de Google Antigravity, OpenAI, Anthropic, GitHub, Supabase, Vercel e MCP.

A conclusão é que a ideia da **Fábrica Apps RNS é tecnicamente viável** e, com algumas mudanças importantes, pode ser estruturada como uma plataforma real de engenharia de software multiagente, e não apenas como uma automação de prompts. Google já expõe o harness do Antigravity por SDK programático; a Anthropic oferece Claude Code e Managed Agents; a OpenAI oferece Codex, Agents SDK e Agents API; GitHub possui Apps, webhooks, Actions, checks e integração com coding agents; Supabase possui Management API, branching e uma oferta específica para plataformas e AI builders; e Vercel permite ligar repositórios Git a previews e produção. citeturn0search0turn2search1turn9search0turn7search0turn8search0

A sua nova ideia melhora especialmente um aspecto do projeto anterior: **o Antigravity deixa de ser apenas mais um trabalhador e passa a representar a estação de planejamento e aprovação humana da fábrica**. Isso faz bastante sentido. O Antigravity possui um artefato nativo de *Implementation Plan*, permite comentários e revisão antes de o agente prosseguir e foi explicitamente desenhado para colaboração humano-agente sobre planos e artefatos. citeturn3search0turn3search4

Mas eu faria uma distinção fundamental:

> **Antigravity não deve ser a autoridade final. O ser humano operando a estação Antigravity é a autoridade final.**

Essa diferença parece pequena, mas é arquiteturalmente decisiva. O Antigravity pode analisar, pesquisar, gerar plano, revisar diffs, executar navegador, propor aprovação e explicar riscos. Porém o evento que libera uma etapa crítica deve ser registrado como uma **decisão humana autenticada**, por exemplo `APPROVED_BY_HUMAN`, vinculada ao usuário que tomou a decisão. Isso impede que um modelo de IA, direta ou indiretamente, aprove sua própria alteração.

Também corrigiria uma segunda ideia: o repositório GitHub da fábrica **não deve conter os bancos de dados em si**. Ele deve conter código, migrations, schemas, políticas, especificações, workflows e infraestrutura declarativa. Os dados operacionais, históricos de execução, filas, tokens de uso, eventos e registros de agentes pertencem ao Supabase. A própria integração Supabase–GitHub reconstrói branches de banco a partir das migrations versionadas no Git, em vez de tratar o GitHub como o banco de dados. citeturn7search3turn7search6

A arquitetura correta fica, portanto:

```text
                     FÁBRICA APPS RNS

 ┌──────────────────────────────────────────────────────────┐
 │                 ESTAÇÃO DE COMANDO RNS                  │
 │                                                          │
 │  Humano + Google Antigravity                            │
 │  ideia • requisitos • planejamento • aprovação          │
 └──────────────────────────┬───────────────────────────────┘
                            │
                  Plan PR / Approval
                            │
                            ▼
 ┌──────────────────────────────────────────────────────────┐
 │                    RNS CONTROL PLANE                     │
 │                                                          │
 │ projetos • planos • etapas • agentes • custos • riscos  │
 │ execuções • aprovações • previews • deployments         │
 └──────────────────────────┬───────────────────────────────┘
                            │
                            ▼
 ┌──────────────────────────────────────────────────────────┐
 │                     RNS ORCHESTRATOR                     │
 │                                                          │
 │ state machine • DAG • router • policies • leases        │
 │ retries • budgets • approvals • event processing        │
 └───────────────┬───────────────────┬──────────────────────┘
                 │                   │
        ┌────────▼────────┐ ┌────────▼────────┐
        │ OPENAI WORKER   │ │ CLAUDE WORKER  │
        │ Codex / Agents  │ │ Code / Managed │
        └────────┬────────┘ └────────┬────────┘
                 │                   │
                 └─────────┬─────────┘
                           │
                  reviews / changes
                           │
                           ▼
 ┌──────────────────────────────────────────────────────────┐
 │                        GITHUB                            │
 │                                                          │
 │ Source of Truth do software                              │
 │ repos • commits • PRs • checks • Actions • audit        │
 └─────────────┬───────────────────────────┬────────────────┘
               │                           │
               ▼                           ▼
      ┌─────────────────┐        ┌─────────────────┐
      │ SUPABASE APP    │        │   VERCEL APP    │
      │ DB/Auth/Storage │        │ Preview/Prod    │
      └────────┬────────┘        └────────┬────────┘
               │                          │
               └──────────┬───────────────┘
                          ▼
                APLICATIVO PRODUZIDO
```

A definição que eu adotaria a partir de agora é:

> **A Fábrica Apps RNS é um sistema operacional de engenharia de software multiagente, dirigido por humanos, no qual planos, tarefas, código, revisões, testes, ambientes de preview e releases percorrem um workflow durável, auditável e reproduzível.**

Ela não é simplesmente “GPT + Claude + Antigravity trabalhando juntos”.

Ela é o sistema que **governa** GPT, Claude e Antigravity.

## Arquitetura recomendada para a Fábrica Apps RNS

A primeira grande decisão é separar o que pertence ao **repositório da fábrica** do que pertence aos **repositórios das aplicações produzidas**.

Eu não recomendo colocar eternamente todos os aplicativos produzidos dentro de um único repositório gigantesco. A fábrica pode começar como um monorepo, mas cada aplicação produzida deveria, por padrão, receber seu próprio repositório GitHub, seu próprio projeto Supabase e seu próprio projeto Vercel. Supabase documenta exatamente esse tipo de uso em “Supabase for Platforms”, inclusive para AI builders, oferecendo criação programática de projetos e gerenciamento por Management API. citeturn7search0turn7search11

O conjunto ficaria assim:

```text
GitHub Organization: RNS

rns-factory/
    código da fábrica
    orchestrator
    adapters
    contracts
    policies
    golden templates
    GitHub App
    MCP gateway
    workers

rns-app-clinicas/
    aplicação produzida A

rns-app-financeiro/
    aplicação produzida B

rns-app-crm/
    aplicação produzida C

...
```

Isso cria isolamento real de permissões, branches, histórico, CI, deployments e ciclo de vida.

O repositório `rns-factory` poderia inicialmente adotar algo semelhante a:

```text
rns-factory/
│
├── apps/
│   └── control-plane/
│
├── services/
│   ├── orchestrator/
│   ├── github-gateway/
│   ├── provisioning/
│   └── deployment-controller/
│
├── workers/
│   ├── openai/
│   ├── claude/
│   └── antigravity-bridge/
│
├── packages/
│   ├── contracts/
│   ├── policies/
│   ├── agent-router/
│   ├── evaluations/
│   └── observability/
│
├── mcp/
│   └── rns-tool-gateway/
│
├── templates/
│   └── golden-app/
│
├── supabase/
│   ├── migrations/
│   ├── functions/
│   └── config.toml
│
├── docs/
│   ├── architecture/
│   ├── standards/
│   └── decisions/
│
├── .github/
│   └── workflows/
│
├── AGENTS.md
├── CLAUDE.md
└── README.md
```

Para o **Control Plane**, minha opção inicial seria **Next.js + TypeScript**, implantado no Vercel. A razão é operacional: o mesmo produto poderia apresentar projetos, tarefas, revisões, custos, eventos, PRs, previews e botões de aprovação, enquanto as operações pesadas dos agentes ocorreriam fora do processo web.

No centro estaria o **Factory Supabase**. Ele não executaria Claude ou Codex durante dezenas de minutos; armazenaria o estado canônico da fábrica e ofereceria Postgres, Auth, Realtime, Storage e filas. Supabase Queues é construída sobre `pgmq`, oferece filas persistentes e visibilidade de mensagens, enquanto Edge Functions são úteis para webhooks e operações curtas, mas possuem limites de duração e recursos que tornam inadequado utilizá-las como runtime principal para agentes de programação longos. citeturn7search16turn7search15turn7search1turn7search4

O banco central deveria conter aproximadamente estas entidades:

| Entidade | Responsabilidade |
|---|---|
| `organizations` | organização ou proprietário |
| `users` | operadores humanos |
| `apps` | aplicações que a fábrica está produzindo |
| `specs` | requisitos do produto |
| `plans` | plano lógico atual |
| `plan_versions` | versões imutáveis dos planos |
| `stages` | etapas do plano |
| `tasks` | unidades executáveis |
| `task_dependencies` | DAG das dependências |
| `agent_profiles` | papéis e configurações dos agentes |
| `provider_sessions` | sessão Antigravity/Claude/OpenAI |
| `runs` | execução individual |
| `run_events` | event stream normalizado |
| `reviews` | revisões estruturadas |
| `findings` | problemas identificados |
| `artifacts` | planos, patches, relatórios, screenshots |
| `approvals` | decisões de aprovação ou rejeição |
| `repositories` | vínculo com GitHub |
| `pull_requests` | PRs associados às tarefas |
| `deployments` | previews e produção |
| `leases` | exclusividade temporária de workers |
| `usage` | tokens, duração, custos |
| `audit_events` | auditoria imutável |
| `secret_refs` | referências, nunca secrets em claro |

O **GitHub continua sendo a fonte da verdade do software**, enquanto o **Supabase é a fonte da verdade da operação da fábrica**.

Essa separação resolve várias ambiguidades:

```text
GitHub
    código
    migrations
    documentação
    manifests
    workflows
    commits
    diffs
    PRs

Supabase
    estado
    tarefas
    sessões
    eventos
    filas
    approvals
    métricas
    custos
    auditoria
```

Logs gigantes, transcrições completas de agentes e telemetria não deveriam virar commits Git. O PR deve apresentar a informação necessária para compreender a mudança; o detalhamento operacional pode residir em banco/Storage e ser referenciado pelo PR.

Outro ponto importante é que **Supabase Queues não precisa ser transformado à força em todo o motor de workflow**. A fila resolve entrega de trabalho; um processo de três dias com pausas humanas, retries seletivos, versões, timeouts, compensações e dezenas de estados é um problema de *durable execution*. Supabase Queues fornece excelente infraestrutura para mensagens, mas plataformas como Temporal e Inngest fornecem explicitamente retomada durável, checkpoints e espera por eventos. Essa é uma inferência arquitetural baseada nas capacidades documentadas dessas plataformas. citeturn7search16turn5search0turn4search8

Para **RNS v1**, eu recomendaria esta combinação:

```text
Supabase
    estado canônico
    autenticação
    auditoria
    filas
    realtime
          +
Inngest
    durable workflow
    retries
    waits
    concurrency
    idempotency
          +
Workers especializados
    OpenAI
    Anthropic
    Antigravity bridge
```

Inngest é particularmente compatível com o cenário porque suporta funções duráveis, steps que não são reexecutados após sucesso, espera por eventos externos — inclusive para human-in-the-loop — e controle de concorrência. citeturn4search0turn4search8turn4search15 Temporal continua sendo uma excelente alternativa se a Fábrica Apps RNS atingir exigências enterprise mais pesadas; sua proposta central é exatamente execução que retoma após crashes e interrupções mesmo em processos com duração de dias ou mais. citeturn5search0

Trigger.dev também é um candidato sério para workers agentic long-running, oferecendo filas, retries, execução prolongada, human-in-the-loop e observabilidade. citeturn4search10turn4search22 Vercel, por sua vez, introduziu `WorkflowAgent`/AI SDK 7 com execução durável e approvals, além do framework `eve`, mas essas superfícies são mais novas e eu não as colocaria neste momento como dependência estrutural de um orquestrador multi-provider; elas são tecnologias a acompanhar ou utilizar em funções específicas. citeturn4search2turn4search18turn4search21

Ou seja: **não precisamos abandonar Supabase como cérebro operacional**. Apenas não precisamos reimplementar sozinhos todos os problemas de um workflow engine distribuído.

## Protocolo multiagente e a revisão dupla proposta

Esta é a parte em que sua nova ideia é particularmente boa.

A sequência:

```text
Antigravity
    ↓
GPT
    ↓
Claude
    ↓
GPT
    ↓
Claude
    ↓
Antigravity + humano
```

tem mérito porque força um mesmo artefato a ser confrontado mais de uma vez por modelos diferentes.

Porém eu não implementaria isso como uma “conversa interminável”.

Transformaria sua ideia em um protocolo formal chamado, por exemplo:

> **RNS Dual-Pass Review Protocol**

A primeira versão do fluxo de planejamento ficaria exatamente assim:

```text
IDEIA DO OPERADOR
       │
       ▼
ANTIGRAVITY + HUMANO
Plan v1
       │
       ▼
GitHub Plan PR
       │
       ▼
GPT — PASSAGEM A
Análise independente
       │
       ▼
CLAUDE — PASSAGEM A
Analisa plano + crítica GPT
       │
       ▼
GPT — PASSAGEM B
Analisa Claude e sintetiza revisão
       │
       ▼
CLAUDE — PASSAGEM B
Verificação conclusiva
       │
       ▼
HUMAN APPROVAL REQUIRED
       │
       ▼
ANTIGRAVITY + HUMANO
 ┌─────┴──────┐
 │            │
APPROVE     REVISE
 │            │
 ▼            ▼
EXECUTION   Plan v2
              │
              └──► reinicia ciclo
```

Isso é muito próximo do processo que você descreveu, mas possui uma diferença essencial: **a segunda rodada é conclusiva e o número de passagens fica delimitado**.

Não existe:

```text
GPT → Claude → GPT → Claude → GPT → Claude → ...
```

sem limite.

Existe:

```text
Plan Version 7
  GPT-A
  Claude-A
  GPT-B
  Claude-B
  Human Gate
```

Se o humano reprovar:

```text
Plan Version 8
  GPT-A
  Claude-A
  GPT-B
  Claude-B
  Human Gate
```

Isso torna o sistema auditável.

Cada agente também não deveria apenas escrever comentários soltos. Ele deveria produzir um **artefato estruturado**.

Por exemplo:

```json
{
  "review_id": "rev_01...",
  "plan_version": 7,
  "reviewer": "openai",
  "pass": 1,
  "verdict": "changes_requested",
  "findings": [
    {
      "id": "F-014",
      "severity": "high",
      "category": "security",
      "location": "stage.auth",
      "problem": "...",
      "evidence": "...",
      "recommendation": "...",
      "blocking": true
    }
  ]
}
```

A passagem conclusiva do Claude poderia obedecer a outro contrato:

```json
{
  "verdict": "ready_for_human_review",
  "blocking_findings": [],
  "accepted_findings": ["F-014", "F-020"],
  "residual_risks": [],
  "implementation_constraints": [],
  "confidence": 0.91
}
```

O importante não é o número `0.91`; é termos uma saída processável por software.

Isso transforma comentários de modelos em **dados de engenharia**.

### O papel ideal do Antigravity

A pesquisa atual fortaleceu bastante a sua proposta de utilizar Antigravity na máquina local.

Antigravity 2.0 suporta projetos e Git worktrees isolados, permissões por projeto, tarefas agendadas e ambientes locais; o SDK possui hooks, persistência e triggers de background. citeturn3search13turn3search6 O produto também possui especificamente o conceito de Implementation Plan como artefato que pode ser comentado e aprovado antes de continuar. citeturn3search0

Mais interessante: Antigravity permite processos chamados **Sidecars**, que permanecem ativos ao lado da aplicação, são reiniciados se falharem e podem ser usados para scripts persistentes, tarefas agendadas e reação a eventos. citeturn3search12

Isso nos dá uma solução elegante para o que você descreveu.

Em vez de tentar fazer:

```text
GitHub
  │
  └── conexão inbound para seu notebook
```

eu criaria:

```text
Seu computador
┌─────────────────────────────────────┐
│ Antigravity                         │
│                                     │
│ Local Git Clone                     │
│                                     │
│ RNS Local Bridge / Sidecar          │
└─────────────────┬───────────────────┘
                  │
          conexão outbound
                  │
                  ▼
          RNS Orchestrator
                  │
                  ▼
              Supabase
```

O computador do operador não precisa expor uma porta na Internet.

O **RNS Local Bridge** iniciaria uma conexão de saída autenticada, receberia algo como:

```text
approval.requested
plan.revision.requested
stage.acceptance.requested
```

e mostraria esse evento ao operador dentro do ambiente local.

Antigravity teria acesso controlado ao clone Git, poderia:

```text
git fetch
git checkout
ler Plan PR
ler reviews GPT
ler reviews Claude
inspecionar diff
executar testes
abrir preview
pesquisar
produzir Acceptance Artifact
```

Antigravity inclusive suporta MCP para GitHub e Supabase, além de outras ferramentas de desenvolvimento. citeturn3search2

Entretanto, a ação final seria:

```text
Humano clica APPROVE
        ↓
assinatura lógica:
user_id
approval_id
plan_sha
timestamp
        ↓
Supabase
        ↓
Orchestrator
```

Não:

```text
LLM escreveu "APPROVED"
        ↓
produção
```

Esse será um dos princípios de segurança da fábrica.

### Claude e OpenAI como workers

No lado Anthropic, temos mais de uma alternativa. Claude Managed Agents permite montar um repositório GitHub na sandbox da sessão e utilizar GitHub MCP para branches, commits e pull requests; os Managed Agents possuem sessões persistentes, ambientes gerenciados ou self-hosted e políticas de permissão por ferramentas. citeturn9search0turn9search8turn1search0

Claude Code possui ainda integração GitHub Actions e uma API experimental de Routines que pode iniciar sessões em resposta a eventos GitHub ou chamadas HTTP. citeturn9search2turn9search7 Como Routines está explicitamente identificada como experimental, eu a trataria como backend opcional do `ClaudeAdapter`, não como fundação da RNS.

OpenAI fornece uma estrutura igualmente adequada: Agents API oferece agentes persistentes, sessões, sandboxes, eventos, MCP, retomada e subagentes; Codex é apresentado pela própria OpenAI como a superfície recomendada para engenharia de software agêntica e pode ser integrado a CI/CD. citeturn2search1turn2search3 Codex App Server ainda fornece operações explícitas de start/resume/fork de threads e políticas de sandbox por thread. citeturn10search0turn10search1

Portanto, o Orchestrator não deve conhecer as peculiaridades desses fornecedores.

Ele deve chamar algo como:

```typescript
interface AgentAdapter {
  startTask(task: AgentTask): Promise<RunHandle>;
  resumeTask(runId: string, input: AgentInput): Promise<void>;
  interrupt(runId: string): Promise<void>;
  getStatus(runId: string): Promise<RunStatus>;
  getEvents(runId: string): AsyncIterable<AgentEvent>;
  getArtifacts(runId: string): Promise<Artifact[]>;
  getUsage(runId: string): Promise<Usage>;
}
```

E abaixo dessa interface:

```text
AgentAdapter
│
├── OpenAIAdapter
│     ├── Agents API
│     ├── Codex SDK
│     └── App Server
│
├── ClaudeAdapter
│     ├── Managed Agents
│     ├── Claude Code
│     └── Routines
│
└── AntigravityAdapter
      ├── SDK
      ├── CLI
      └── Local Bridge
```

Isso significa que a **Fábrica Apps RNS pertence a nós**, não a nenhum fornecedor.

Hoje GitHub possui integração oficial de *third-party coding agents* para **Anthropic Claude e OpenAI Codex**. Antigravity não está nessa relação. GitHub Agentic Workflows, em public preview, aceita Claude Code, Codex e Google Gemini CLI, mas isso também não equivale a uma integração nativa com Antigravity. citeturn1search7turn1search9

Portanto, o adaptador próprio para Antigravity é a decisão arquitetural mais segura.

### Como aplicar a revisão dupla durante a programação

Aqui eu alteraria um pouco sua proposta.

Para **planos**, GPT e Claude podem alternar comentários e revisões livremente porque estão modificando artefatos textuais.

Para **código**, não recomendo dois agentes editando simultaneamente o mesmo checkout.

O protocolo melhor é:

```text
IMPLEMENTADOR
   │
   ▼
commit
   │
   ▼
REVISOR — passagem A
   │
   ▼
findings estruturados
   │
   ▼
IMPLEMENTADOR — passagem B
   │
   ▼
correções
   │
   ▼
REVISOR — passagem B
   │
   ▼
verdict final
   │
   ▼
test gates
   │
   ▼
Human/Policy Gate
```

Essa estrutura preserva exatamente o espírito da sua revisão dupla, mas mantém **ownership do código**.

Exemplo:

```text
Codex implementa
      ↓
Claude Review A
      ↓
Codex corrige
      ↓
Claude Review B
      ↓
CI + Security + Preview
      ↓
Antigravity + Humano
```

Na próxima etapa:

```text
Claude implementa
      ↓
Codex Review A
      ↓
Claude corrige
      ↓
Codex Review B
      ↓
CI + Security + Preview
      ↓
Antigravity + Humano
```

Assim, nenhum fornecedor ganha posição permanente de “melhor programador”.

A RNS coleta métricas e descobre isso empiricamente.

## GitHub, Supabase e Vercel como esteira de produção

O GitHub precisa assumir uma função um pouco mais sofisticada do que “local onde os três agentes mexem no código”.

Ele será o **ledger de engenharia da fábrica**.

Eu criaria uma **GitHub App chamada RNS Factory**, pertencente à plataforma, e não a um agente. GitHub Apps permitem permissões granulares, tokens de instalação que expiram em uma hora e restrição adicional a repositórios/permissões na emissão do token. GitHub recomenda explicitamente privilégio mínimo e autenticação adequada por GitHub App em vez de PATs gerais. citeturn6search1turn6search2turn6search13

A GitHub App faria:

```text
RNS Factory GitHub App

repo provisioning
webhook intake
branch management
PR creation
check runs
status reporting
labels
comments
merge coordination
audit attribution
```

Ela não “pensa”.

Ela executa operações determinadas pelo Orchestrator.

Os webhooks chegam assim:

```text
GitHub Event
     │
     ▼
Webhook Gateway
     │
validar assinatura
     │
deduplicar delivery
     │
normalizar evento
     │
     ▼
Factory Events
     │
     ▼
Orchestrator
```

GitHub recomenda verificar webhook secrets e assinar somente os eventos necessários; também recomenda webhooks em vez de polling para aplicações, o que reduz consumo de API e latência. citeturn6search2turn6search3

Eu criaria dois tipos fundamentais de PR.

**Plan PR**:

```text
PR: PLAN-0042

docs/plans/app-217/plan-v003.md
factory/plan-v003.json
acceptance-criteria.yaml

GPT Review A
Claude Review A
GPT Review B
Claude Final Verdict
Human Approval
```

Após aprovação e merge:

```text
PLAN_MERGED
     ↓
orchestrator
     ↓
create execution DAG
```

Depois surgem **Execution PRs**:

```text
PR: STAGE-01-authentication
PR: STAGE-02-database
PR: STAGE-03-dashboard
PR: STAGE-04-billing
...
```

Cada etapa longa pode durar horas ou dias, como você imaginou.

A diferença é que a fábrica não depende de uma conversa aberta durante três dias. O workflow continua persistido:

```text
Stage 04

planned
  ↓
ready
  ↓
leased
  ↓
implementing
  ↓
review_a
  ↓
repair
  ↓
review_b
  ↓
ci
  ↓
preview
  ↓
acceptance
  ↓
waiting_human
  ↓
approved
  ↓
merged
```

Se o computador desligar ou um agente cair, a tarefa continua existindo.

### Branch, Supabase Preview e Vercel Preview

Aqui existe uma das melhores integrações de todo o projeto.

Supabase pode criar branches isoladas associadas ao GitHub; preview branches têm instância e credenciais próprias e são descartadas quando o PR termina. Por padrão, novos branches não recebem os dados de produção, uma proteção importante para ambientes de agentes. citeturn7search6

A integração GitHub do Supabase acompanha branches e PRs e reconstrói o schema a partir das migrations versionadas. citeturn7search3

Vercel, por sua vez, cria preview deployments a partir de branches/PRs e produção a partir da production branch. citeturn8search0turn8search2

Supabase possui ainda integração específica com Vercel Branching: quando um PR é aberto, as variáveis correspondentes ao Supabase branch correto são sincronizadas para o preview Vercel. citeturn7search2

Isso nos permite fazer:

```text
TASK 481
     │
     ▼
git branch
rns/task-481-auth
     │
     ├──────────────┐
     │              │
     ▼              ▼
Supabase          Vercel
Preview DB        Preview App
     │              │
     └──────┬───────┘
            │
            ▼
    Integration Tests
            │
            ▼
    Browser Acceptance
            │
            ▼
       AI Review
            │
            ▼
      Human Review
```

Esta deveria ser uma regra da Fábrica Apps RNS:

> **Todo código relevante produzido por um agente deve existir em um ambiente de preview verificável antes de chegar à produção.**

O Antigravity seria especialmente útil nessa fase porque o Antigravity 2.0 possui interação com Chrome e recursos de verificação de aplicações e artefatos. citeturn3search19turn3search13

Assim, o Acceptance Agent pode receber:

```text
Preview URL
Supabase preview
Acceptance criteria
Test accounts
Expected flows
```

e verificar visualmente e funcionalmente o que foi construído.

### O fluxo completo de uma aplicação

Depois de estruturada, a RNS poderia transformar uma solicitação como:

> “Crie um aplicativo SaaS de gestão de clínicas com pacientes, consultas, médicos, agenda, permissões e cobrança.”

neste processo:

```text
USER IDEA
   │
   ▼
ANTIGRAVITY REQUIREMENTS SESSION
   │
   ▼
PRODUCT SPEC
   │
   ▼
ANTIGRAVITY PLAN
   │
   ▼
PLAN PR
   │
   ├── GPT Review A
   │
   ├── Claude Review A
   │
   ├── GPT Review B
   │
   └── Claude Final
   │
   ▼
HUMAN + ANTIGRAVITY
APPROVAL
   │
   ▼
PROVISIONER
   │
   ├── GitHub Repo
   ├── Supabase Project
   └── Vercel Project
   │
   ▼
TASK DAG
   │
   ├── architecture
   ├── database
   ├── auth
   ├── backend
   ├── frontend
   ├── tests
   └── deployment
   │
   ▼
STAGE EXECUTION
   │
   ├── author
   ├── reviewer A
   ├── repair
   ├── reviewer B
   ├── CI
   └── preview
   │
   ▼
ANTIGRAVITY ACCEPTANCE
   │
   ▼
HUMAN APPROVAL
   │
   ▼
MERGE
   │
   ▼
NEXT STAGE
   │
   ... repeats ...
   │
   ▼
RELEASE CANDIDATE
   │
   ▼
FINAL ACCEPTANCE
   │
   ▼
PRODUCTION RELEASE
```

Supabase Management API consegue criar projetos programaticamente e a documentação do produto recomenda branches de desenvolvimento para plataformas que provisionam infraestrutura para usuários. citeturn7search0

Isso significa que a Fábrica Apps RNS não estará simplesmente “conectando um banco”.

Ela estará **provisionando o backend de uma nova aplicação**.

## Segurança, governança e confiabilidade

Este é o ponto em que uma fábrica autônoma difere radicalmente de um chatbot.

Um coding agent pode:

```text
ler arquivos
escrever arquivos
executar terminal
instalar pacotes
usar rede
ler configuração
modificar SQL
criar commits
criar PRs
chamar APIs
```

Portanto, devemos partir do princípio:

> **Todo agente é uma entidade potencialmente perigosa, mesmo quando está tentando ajudar.**

Antigravity possui políticas de ferramentas e approvals; Claude Managed Agents suporta `always_allow`, `always_ask` e avaliação automática por chamada; Codex/Agents disponibilizam sandboxing e controles de ambiente. citeturn3search11turn1search0turn2search1turn10search0

A Fábrica Apps RNS deverá criar perfis de permissão por **função**, não por fornecedor.

| Função | GitHub | Filesystem | Supabase | Vercel | Produção |
|---|---|---|---|---|---|
| Planner | leitura | leitura | schema read | nenhum | negado |
| Reviewer | leitura/PR review | leitura | preview read | preview read | negado |
| Implementer | branch write | workspace write | preview only | preview read | negado |
| Security Reviewer | leitura | leitura | schema read | logs read | negado |
| Acceptance Agent | leitura | leitura | preview | preview | negado |
| Release Service | merge/deploy | limitado | deploy migrations | production deploy | permitido por política |

Nenhum coding agent precisa de uma chave-mestra de produção.

Produção deveria ficar atrás de:

```text
Agent
  │
  ▼
code/config/migration
  │
  ▼
GitHub PR
  │
  ▼
CI
  │
  ▼
Security
  │
  ▼
Review
  │
  ▼
Human/Policy Approval
  │
  ▼
Release Service
  │
  ▼
Production
```

Nunca:

```text
Claude / Codex / Antigravity
          │
          ▼
    production token
```

Para o GitHub, uma GitHub App pode emitir installation tokens com uma hora de duração e ainda restringi-los a repositórios e permissões específicas. citeturn6search1turn6search13 Isso é muito superior a espalhar PATs permanentes pelos workers.

OpenAI documenta **Workload Identity Federation com GitHub Actions**, trocando o OIDC emitido pelo GitHub por um token OpenAI temporário, sem API key permanente no repositório. citeturn2search7 Anthropic possui um mecanismo equivalente de WIF para GitHub Actions. citeturn1search2

Portanto, a política RNS deveria ser:

```text
short-lived identity
       >
static API key
```

sempre que o fornecedor oferecer essa opção.

MCP também merece uma política própria.

MCP já é uma camada muito valiosa de interoperabilidade. Antigravity suporta MCP; Claude Managed Agents suporta MCP; OpenAI Agents API também pode acessar servidores MCP. citeturn3search2turn1search0turn2search12 A especificação MCP 2026-07-28 evoluiu ainda mais a arquitetura HTTP e autorização, e o ecossistema agora possui extensões formais para operações assíncronas. citeturn11search16turn11search4

Eu criaria um:

```text
RNS MCP GATEWAY
│
├── github.read
├── github.pr
├── supabase.schema.read
├── supabase.preview.query
├── vercel.preview.logs
├── rns.artifact.read
├── rns.review.submit
├── rns.task.status
└── rns.documentation.search
```

Mas ferramentas destrutivas como:

```text
github.merge
supabase.production.migrate
vercel.production.promote
secret.read
project.delete
```

não deveriam estar disponíveis aos agentes genéricos.

MCP será o **barramento comum de ferramentas**.

Não será o Orchestrator.

### Merge e release precisam ser coisas diferentes

Também recomendo manter duas decisões independentes:

```text
“Esse código pode entrar em main?”
```

e:

```text
“Esse build pode receber usuários?”
```

GitHub oferece required status checks e rulesets capazes de bloquear merge; rulesets podem inclusive exigir deployments bem-sucedidos antes do merge em certos cenários. citeturn6search14turn6search15

Vercel possui Deployment Checks, que permitem gerar o build de produção e impedir sua promoção ao domínio de produção até que os checks necessários sejam aprovados. citeturn8search6 Vercel também suporta rolling releases para expor progressivamente uma nova versão a uma porcentagem do tráfego e abortar o rollout se necessário. citeturn8search5turn8search7

Assim:

```text
PR APPROVAL
      │
      ▼
MERGE
      │
      ▼
PRODUCTION BUILD
      │
      ▼
POST-BUILD TESTS
      │
      ▼
DEPLOYMENT CHECKS
      │
      ▼
RELEASE APPROVAL
      │
      ▼
CANARY / ROLLING RELEASE
      │
      ▼
100% PRODUCTION
```

Isso é muito mais seguro para software produzido por agentes.

### IA nunca será o único gate

A revisão cruzada GPT/Claude é excelente, mas não pode substituir:

```text
lint
typecheck
unit tests
integration tests
E2E
migration tests
dependency scanning
secret scanning
static security analysis
build validation
preview validation
```

GitHub já utiliza CodeQL, secret scanning e verificação de dependências na validação dos third-party coding agents hospedados por ele. citeturn1search7 Para nossos adapters próprios, precisaremos configurar checks equivalentes como parte do pipeline.

A regra RNS será:

```text
AI opinião
    +
evidência determinística
    =
decisão
```

e não:

```text
AI disse que está certo
    =
está certo
```

## Projeto recomendado para a primeira versão da fábrica

Depois desta nova rodada de pesquisa, minha recomendação é **preservar o núcleo da sua ideia**, mas transformar o “ping-pong de agentes” em um protocolo formal e transformar o Antigravity em uma verdadeira **Estação de Comando Humano**.

A arquitetura de referência que eu adotaria oficialmente para o projeto é:

```text
┌──────────────────────────────────────────────────────────────┐
│                    FÁBRICA APPS RNS                         │
│                                                              │
│                 CONTROL PLANE — VERCEL                       │
│                                                              │
│ Apps | Plans | Stages | Runs | Reviews | PRs | Deployments  │
└────────────────────────────┬─────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────┐
│                     RNS ORCHESTRATOR                         │
│                                                              │
│ State Machine                                                │
│ DAG Engine                                                   │
│ Agent Router                                                 │
│ Dual-Pass Review Engine                                      │
│ Policy Engine                                                │
│ Approval Engine                                              │
│ Budget Manager                                               │
│ Event Processor                                              │
└───────────────┬─────────────────────────┬────────────────────┘
                │                         │
                ▼                         ▼
┌───────────────────────────┐   ┌──────────────────────────────┐
│ FACTORY SUPABASE          │   │ DURABLE EXECUTION           │
│                           │   │                              │
│ state                     │   │ Inngest inicialmente        │
│ tasks                     │   │ Temporal opcional futuro    │
│ events                    │   │                              │
│ reviews                   │   │ retries                     │
│ approvals                 │   │ waits                       │
│ audit                     │   │ timers                      │
│ usage                     │   │ concurrency                 │
│ queues                    │   │ idempotency                 │
└───────────────────────────┘   └──────────────┬───────────────┘
                                               │
                        ┌──────────────────────┼────────────────────┐
                        │                      │                    │
                        ▼                      ▼                    ▼
               ┌────────────────┐     ┌────────────────┐  ┌────────────────┐
               │ OpenAI Worker  │     │ Claude Worker  │  │ RNS Local      │
               │                │     │                │  │ Bridge         │
               │ Codex          │     │ Claude Code    │  │                │
               │ Agents API     │     │ Managed Agents │  │ Antigravity    │
               └────────┬───────┘     └────────┬───────┘  └──────┬─────────┘
                        │                      │                   │
                        └────────────┬─────────┴───────────────────┘
                                     │
                                     ▼
                          ┌─────────────────────┐
                          │       GitHub        │
                          │                     │
                          │ repos               │
                          │ branches            │
                          │ commits             │
                          │ pull requests       │
                          │ Actions             │
                          │ checks              │
                          │ rulesets            │
                          └─────────┬───────────┘
                                    │
                    ┌───────────────┴────────────────┐
                    │                                │
                    ▼                                ▼
          ┌───────────────────┐            ┌───────────────────┐
          │ Generated App     │            │ Generated App     │
          │ Supabase          │            │ Vercel            │
          │                   │            │                   │
          │ Preview DB        │            │ Preview Deploy    │
          │ Production DB     │            │ Production Deploy │
          └─────────┬─────────┘            └─────────┬─────────┘
                    │                                │
                    └───────────────┬────────────────┘
                                    ▼
                          ┌─────────────────────┐
                          │   APP PRODUZIDO     │
                          └─────────────────────┘
```

Eu também adotaria uma regra de engenharia muito importante: **não fixar no código nomes atuais de modelos como se fossem permanentes**. As próprias superfícies e modelos disponíveis mudam; GitHub atualmente permite diferentes modelos para seus coding agents, e OpenAI/Anthropic/Google continuam evoluindo rapidamente suas superfícies. citeturn1search7turn0search13turn2search3

A fábrica deve possuir um registry:

```text
agent_profile:
  id: architecture-reviewer
  provider: openai
  runtime: agents_api
  model: <configurável>
  capabilities:
    - repository_read
    - web_research
    - code_review
  permissions:
    - github.read
  budget_class: medium
```

Assim podemos trocar o modelo sem trocar a arquitetura.

O próprio Google está evoluindo Antigravity muito rapidamente: a documentação atual apresenta Antigravity 2.0 como central de comando de agentes; o SDK expõe o mesmo harness programaticamente; e há suporte a agent teams para projetos grandes, com artefatos estruturados e handoffs. citeturn3search19turn3search16turn3search20 Isso reforça ainda mais a decisão de encapsular fornecedores por adapters.

A sequência de construção que considero mais segura é:

| Fase | O que precisa existir ao final |
|---|---|
| **Fundação RNS** | monorepo da fábrica, Supabase, Auth, schema operacional, Control Plane, GitHub App, contracts e event model |
| **Planning Loop** | Antigravity cria Plan PR; GPT-A → Claude-A → GPT-B → Claude-B → aprovação humana |
| **Execution Loop** | uma etapa vira task; worker implementa; segundo modelo revisa; reparo; revisão final; checks |
| **Preview Loop** | GitHub branch → Supabase preview → Vercel preview → E2E/browser acceptance |
| **Release Loop** | merge protegido → production build → deployment checks → aprovação → release |
| **Autonomy Layer** | Agent Router, budgets, evals, auto-repair, paralelismo, aprendizado de performance |

A primeira entrega verdadeiramente importante não deve ser “a fábrica construiu sozinha um SaaS gigantesco”.

Ela deve provar este caminho:

```text
Humano cria uma ideia
        ↓
Antigravity cria plano
        ↓
Plan PR aparece no GitHub
        ↓
GPT revisa
        ↓
Claude revisa
        ↓
GPT revisa novamente
        ↓
Claude conclui
        ↓
Antigravity + humano recebem aprovação pendente
        ↓
Humano aprova
        ↓
Orchestrator cria uma tarefa
        ↓
Agente implementa
        ↓
Outro agente revisa
        ↓
Agente corrige
        ↓
Revisor conclui
        ↓
CI passa
        ↓
Supabase Preview nasce
        ↓
Vercel Preview nasce
        ↓
Antigravity testa
        ↓
Humano aprova
        ↓
merge
```

Quando esse circuito funcionar uma vez de ponta a ponta, teremos construído o **motor fundamental da Fábrica Apps RNS**.

A partir daí, produzir dez etapas, cem tarefas ou diversos aplicativos simultaneamente será uma questão de escala, routing e governança — e não mais de descobrir como os agentes conversam.

Minha decisão arquitetural final, depois desta investigação, é portanto:

> **Sua proposta da revisão dupla deve ser mantida, mas formalizada como workflow.**

> **Antigravity deve permanecer no começo e no fim do ciclo, como estação de planejamento e co-pilotagem do ser humano.**

> **OpenAI e Anthropic devem formar inicialmente o núcleo da linha automatizada de execução e revisão cruzada.**

> **O GitHub deve ser o ledger imutável da engenharia, mas não o cérebro do sistema.**

> **Supabase deve manter o estado canônico, as filas, as aprovações, a auditoria e os dados da fábrica; não deve ser confundido com o runtime pesado dos agentes.**

> **O Orchestrator deve ser um componente nosso, determinístico, durável e independente dos fornecedores.**

> **Cada agente deve operar em workspace/sandbox isolado, nunca compartilhando um checkout descontrolado.**

> **Cada etapa deve terminar em evidência objetiva: diff, testes, checks, preview, revisão e aprovação.**

> **Nenhum coding agent deve possuir acesso direto à produção.**

> **E a aprovação do Antigravity deve significar, tecnicamente, “um ser humano autenticado, assistido pelo Antigravity, aprovou esta versão exata do plano ou do código”.**

Esse desenho preserva quase integralmente a visão que você trouxe, mas remove os três principais riscos de uma fábrica multiagente: **loops infinitos entre modelos, concorrência destrutiva sobre código e autonomia sem governança**.

O resultado deixa de ser “três IAs trabalhando no GitHub” e passa a ser uma plataforma na qual **planejamento, produção, crítica, correção, validação, aprovação e publicação são estados formais de uma linha industrial de software**. É essa arquitetura que eu adotaria como base oficial para iniciarmos a construção da **Fábrica Apps RNS**.
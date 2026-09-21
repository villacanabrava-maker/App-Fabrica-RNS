# Fábrica Apps RNS — Arquitetura Front-end e Back-end para a Etapa de Implementação

**Documento técnico de consolidação pré-implementação — referência de pesquisa em 20 de setembro de 2026**

A conclusão da análise é que **você está correto em interromper o avanço para o plano de implementação por mais uma etapa**. Antes de mandarmos Antigravity, OpenAI/Codex e Claude Code começarem a construir a Fábrica Apps RNS, precisamos congelar a arquitetura funcional do produto: o que existirá no front-end, o que existirá no back-end, quais informações atravessam essa fronteira, quais estados o sistema possui, como o ciclo GPT ↔ Claude aparece na interface, quais operações exigem você/Antigravity, como GitHub, Supabase e Vercel aparecem como uma única fábrica e quais contratos os futuros agentes construtores deverão obedecer.

Isso **não altera o projeto já desenhado**. Ao contrário: transforma a arquitetura conceitual que já possuímos em uma especificação suficientemente precisa para impedir que os próprios agentes inventem a arquitetura durante a implementação.

Os dois documentos novos são particularmente úteis para isso. O estudo de Front-end 2026 estabelece um princípio que deve entrar diretamente na Fábrica Apps RNS: front-end de alta qualidade não é apenas “tela bonita”, mas um sistema envolvendo arquitetura, design system, acessibilidade, responsividade, performance, testes, segurança e observabilidade. fileciteturn0file0 O segundo dossiê amplia essa tese para todo o full stack: um agente realmente competente precisa diagnosticar, decidir, implementar, testar e **provar** o resultado, distinguindo princípios estáveis de informações tecnológicas voláteis. fileciteturn0file1

Esses documentos, porém, são **corpus de conhecimento e inspiração operacional**, não substitutos do desenho da Fábrica. A arquitetura de referência continua sendo a já estabelecida: GitHub como fonte durável da verdade do software; Factory Supabase como estado operacional; Orchestrator como controlador determinístico; OpenAI e Claude como workers; Antigravity local sob comando humano; e Vercel + Supabase como infraestrutura de execução dos aplicativos produzidos. fileciteturn0file3 O manual do Reflex confirma ainda que constituição, roles, skills, permissões, evidências e adapters podem ser tratados como dados e contratos versionados, sem transformar nenhum fornecedor de IA no proprietário da arquitetura. fileciteturn0file2

## Diagnóstico e plano de pesquisa

O trabalho realizado nesta etapa foi orientado por uma pergunta central:

> **“Que front-end e que back-end precisamos construir para que o sistema já projetado da Fábrica Apps RNS possa operar de maneira segura, observável, compreensível e implementável?”**

A pesquisa não procurou outra arquitetura. Procurou **fechar as lacunas da arquitetura existente**.

Foram examinadas cinco frentes simultaneamente.

| Frente | Pergunta investigada | Resultado para a Fábrica RNS |
|---|---|---|
| Produto e UX operacional | Como representar uma fábrica multiagente complexa sem transformá-la em um painel incompreensível? | A interface deve ser orientada a **Aplicativo → Missão → Etapa → Tarefa → Execução → Evidência → Aprovação**, e não a “chats”. |
| Engenharia de front-end | Qual estrutura oferece robustez para dashboards, workflows, realtime, previews e design system? | Next.js App Router + TypeScript + Design System RNS + componentes source-owned + Storybook + Playwright. |
| Engenharia de back-end | Onde vivem estado, filas, regras, webhooks, políticas e orquestração? | Factory Supabase mantém estado; Orchestrator executa a máquina de estados; workloads longos ficam fora das Edge Functions. |
| Execução agêntica | Como GPT/OpenAI e Claude trabalham no GitHub com inteligência compartilhada? | Inteligência canônica no repositório + projeções OpenAI/Claude + Task Packets + protocolo fixo de revisão dupla. |
| Delivery e segurança | Como transformar PR em aplicação verificável sem dar acesso irrestrito a produção? | GitHub App + branches/workspaces isolados + checks + Supabase preview + Vercel preview + human gates + release separado de merge. |

Essa metodologia é coerente com os dois documentos fornecidos: ambos defendem que decisões tecnológicas voláteis devem ser verificadas nas fontes atuais, enquanto princípios, contratos e métodos duráveis devem permanecer versionados. fileciteturn0file0 fileciteturn0file1

A pesquisa atualizada reforçou algumas decisões já tomadas. O Next.js continua oferecendo o App Router como a arquitetura moderna da plataforma, com suporte às funcionalidades recentes do React e Server Components. citeturn7search7 Supabase possui hoje documentação específica para plataformas e **AI builders**, incluindo Management API para criação e administração programática de projetos. citeturn15search4 Vercel continua criando previews automaticamente a partir de branches/PRs e produção a partir da branch configurada para produção. citeturn15search1 GitHub, por sua vez, já suporta fluxos agênticos com Claude Code e OpenAI Codex, embora essa camada ainda esteja em **public preview**, o que significa que podemos aproveitá-la como adapter/executor, mas não torná-la o único fundamento da orquestração. citeturn12search0turn12search4

Essa distinção é importante. A nossa arquitetura deve sobreviver mesmo que GitHub mude `gh aw`, Anthropic altere Managed Agents ou OpenAI substitua uma superfície do Codex. Por isso o produto depende de **contratos próprios**, e não de detalhes internos de um fornecedor.

Também confirmamos uma diferença importante entre “banco versionado no GitHub” e “banco operacional”. No GitHub devem permanecer migrations, schemas, seeds controlados, contratos e código de banco. Os dados operacionais da Fábrica vivem no PostgreSQL/Supabase. Isso mantém o conceito original do GitHub como DNA versionado sem tratá-lo incorretamente como armazenamento de linhas operacionais. A documentação atual do Supabase inclusive tornou a exposição de tabelas pela Data API mais explícita e restritiva em 2026, reforçando a importância de grants, RLS e superfícies de API deliberadas. citeturn14search0turn14search8

A arquitetura deve, portanto, ser congelada sob estes axiomas:

```text
GITHUB
= verdade durável do software
= código
= migrations
= planos versionados
= inteligência dos agentes
= PRs
= checks
= evidências persistentes importantes

FACTORY SUPABASE
= verdade operacional da fábrica
= estado
= filas
= execuções
= eventos
= custos
= locks
= approvals
= relações entre entidades
= telemetria operacional

ORCHESTRATOR
= cérebro determinístico do workflow
= decide "quem trabalha agora"
= valida transições
= executa protocolo GPT ↔ Claude
= aplica budgets, retries e human gates

OPENAI / CLAUDE
= trabalhadores probabilísticos
= não governam o workflow

ANTIGRAVITY LOCAL + HUMANO
= planejamento
= revisão superior
= autoridade final

VERCEL
= preview
= runtime web
= publicação
= evidência de execução
```

Isso é exatamente compatível com o desenho anterior da Fábrica Apps RNS. fileciteturn0file3

## Arquitetura consolidada do produto

O front-end e o back-end precisam ser vistos como duas superfícies de um **Control Plane único**.

```text
┌───────────────────────────────────────────────────────────────┐
│                     FÁBRICA APPS RNS                         │
│                                                               │
│                    CONTROL PLANE WEB                          │
│                     Next.js / Vercel                          │
│                                                               │
│ Dashboard • Apps • Missões • Etapas • Agentes • Reviews      │
│ Previews • Aprovações • Evals • Custos • Auditoria           │
└─────────────────────────────┬─────────────────────────────────┘
                              │
                        comandos / leitura
                              │
                              ▼
┌───────────────────────────────────────────────────────────────┐
│                    APPLICATION BACKEND                        │
│                                                               │
│ BFF / APIs                                                    │
│ Orchestrator                                                  │
│ Policy Engine                                                 │
│ Review Engine                                                 │
│ Agent Router                                                  │
│ Provisioner                                                   │
│ Event Processor                                               │
│ Approval Engine                                               │
└─────────────────────┬───────────────────────────────┬─────────┘
                      │                               │
                      ▼                               ▼
             FACTORY SUPABASE                  GITHUB APP
             PostgreSQL                       Webhooks / API
             Auth                             Branches
             RLS                              PRs
             Queues                           Checks
             Realtime                         Actions
             Evidence                         Rules
                      │                               │
                      └──────────────┬────────────────┘
                                     │
                          ┌──────────┴───────────┐
                          ▼                      ▼
                     OPENAI                   CLAUDE
                  Codex / Agents           Claude Code /
                                         Managed Agents
                          │                      │
                          └──────────┬───────────┘
                                     │
                              artifacts / PR
                                     │
                                     ▼
                                  GITHUB
                                     │
                           ┌─────────┴─────────┐
                           ▼                   ▼
                    SUPABASE APP           VERCEL APP
                    Preview/Prod           Preview/Prod
                           │                   │
                           └─────────┬─────────┘
                                     ▼
                               APP PRODUZIDO
```

A interface web não será o Orchestrator. A interface **observa, explica e comanda** o Orchestrator.

Da mesma forma, o Supabase não “pensa”. Ele persiste o estado a partir do qual o Orchestrator toma decisões. Essa separação é essencial para idempotência, reprocessamento e auditoria. O próprio Supabase dispõe hoje de filas Postgres nativas e duráveis, enquanto sua documentação de Edge Functions impõe limites de duração e CPU que tornam inadequado manter um agente de programação executando ali durante dezenas de minutos. Nas Edge Functions hospedadas, o limite atual é 150 segundos no plano gratuito ou 400 segundos nos planos pagos, com 2 segundos de CPU ativa por requisição. citeturn15search0

Portanto, o padrão será:

```text
GitHub / Vercel / Provider webhook
             │
             ▼
       Ingress curto
             │
             ▼
 persist webhook_event
             │
             ▼
       validar/deduplicar
             │
             ▼
       transição de estado
             │
             ▼
          queue/job
             │
             ▼
     Agent Executor / API
             │
             ▼
        resultado/evento
             │
             ▼
     Factory Supabase
```

e nunca:

```text
Webhook
   ↓
Edge Function
   ↓
Claude/Codex trabalhando 40 minutos
```

O Supabase Queues/PGMQ foi projetado justamente como fila persistente integrada ao Postgres, com visibilidade e processamento durável. citeturn14search5

Para a aplicação web da fábrica, recomendo um **monólito modular no início**, não uma coleção prematura de dezenas de microserviços. O código continua separado por domínio, mas pertence à mesma arquitetura lógica. Os executores de agentes formam uma fronteira separada porque possuem requisitos de sandbox, duração e segurança diferentes do servidor que responde à UI. Essa é uma decisão arquitetural nossa baseada na natureza dos workloads, e não uma mudança de escopo.

Uma estrutura inicial coerente seria:

```text
/
├── apps/
│   ├── control-plane/
│   │   ├── app/
│   │   ├── features/
│   │   ├── components/
│   │   └── server/
│   │
│   └── orchestrator-worker/
│       ├── jobs/
│       ├── processors/
│       └── adapters/
│
├── packages/
│   ├── contracts/
│   ├── domain/
│   ├── state-machines/
│   ├── policy-engine/
│   ├── review-engine/
│   ├── agent-adapters/
│   ├── integrations/
│   │   ├── github/
│   │   ├── supabase/
│   │   ├── vercel/
│   │   ├── openai/
│   │   └── anthropic/
│   ├── design-system/
│   ├── observability/
│   └── testing/
│
├── factory-intelligence/
│   ├── constitution/
│   ├── agents/
│   ├── methodology/
│   ├── skills/
│   ├── protocols/
│   ├── schemas/
│   ├── knowledge/
│   └── evals/
│
├── .agents/
│   └── skills/
│
├── .claude/
│   ├── agents/
│   └── skills/
│
├── .codex/
│   └── agents/
│
├── supabase/
│   ├── migrations/
│   ├── functions/
│   └── tests/
│
├── .github/
│   ├── workflows/
│   └── CODEOWNERS
│
├── AGENTS.md
├── CLAUDE.md
└── README.md
```

A razão para existir um `factory-intelligence/` canônico continua sendo evitar duplicação de verdade. OpenAI já documenta `AGENTS.md`, skills locais em `.agents/skills/`, scripts e referências como um padrão para Codex trabalhar consistentemente em um repositório. citeturn9search0turn9search8 Anthropic, de maneira paralela, consegue descobrir automaticamente skills em `.claude/skills/<skill>/SKILL.md` quando um repositório GitHub é montado em Managed Agents. citeturn8search0

Portanto, `.agents/skills` e `.claude/skills` devem funcionar como **projeções/adapters**, enquanto o significado normativo permanece em `factory-intelligence`.

## Documento de arquitetura do front-end

O front-end da Fábrica Apps RNS não deve ser concebido como “um dashboard com IA”. Ele deve funcionar como **cockpit operacional de uma linha de produção de software**.

O documento de Front-end fornecido chama atenção corretamente para a necessidade de Design System, acessibilidade, performance, testing e estados completos de UI. fileciteturn0file0 O dossiê full-stack complementa isso ao exigir estados de espera, erro, sucesso, partial success e recuperação, em vez de projetar apenas o “happy path”. fileciteturn0file1

A stack recomendada especificamente para o **Control Plane da Fábrica RNS** é:

| Camada | Decisão |
|---|---|
| Framework | Next.js App Router |
| Linguagem | TypeScript em modo estrito |
| Rendering | Server-first onde possível; Client Components apenas onde interação/realtime exigir |
| Styling | Tailwind CSS + CSS variables derivadas de tokens |
| Componentes | shadcn/ui como código source-owned, sobre uma primitive selecionada e congelada no projeto |
| Design System | `packages/design-system` + tokens canônicos |
| Catálogo | Storybook |
| Estado servidor | Supabase + server queries/BFF |
| Atualizações ao vivo | Supabase Realtime/Broadcast |
| Testes de componente | Vitest/Storybook |
| E2E | Playwright |
| Acessibilidade | WCAG 2.2 + axe + testes manuais |
| Deploy | Vercel |

A escolha do App Router acompanha a direção atual do Next.js para aplicações full-stack. citeturn7search7 Para componentes, shadcn/ui é particularmente interessante em um produto que será mantido por agentes porque o código dos componentes pertence ao próprio projeto e, em 2026, o projeto possui inclusive skills oficiais que leem a configuração real do repositório para dar contexto correto aos coding agents. Novos projetos shadcn usam Base UI por padrão desde julho de 2026, embora Radix continue oficialmente suportado. citeturn17search0turn17search2

Isso não significa permitir que shadcn defina nossa identidade visual. A identidade será **RNS**.

Os Design Tokens devem possuir pelo menos três níveis:

```text
PRIMITIVO
blue.600
space.4
radius.3

        ↓

SEMÂNTICO
color.action.primary
surface.elevated
text.muted

        ↓

COMPONENTE
button.primary.background
run.status.running
review.finding.critical
```

A especificação do Design Tokens Community Group possui uma versão estável desde 2025.10, oferecendo um formato apropriado para interoperabilidade e evitando a invenção de uma taxonomia impossível de transportar futuramente. citeturn7search4turn7search14

A navegação principal do aplicativo deve ser orientada às entidades reais da fábrica:

| Área da interface | Função |
|---|---|
| **Visão Geral** | saúde da fábrica, apps ativos, runs, bloqueios, aprovações, consumo e incidentes |
| **Aplicativos** | catálogo de todos os produtos criados ou em construção |
| **Missões** | iniciativas de engenharia em execução |
| **Esteira** | visão visual das etapas e dependências |
| **Aprovações** | fila humana/Antigravity |
| **Agentes** | roles, runtimes, modelos, status e desempenho |
| **Inteligência** | constituição, skills, metodologias e versões |
| **Evals** | desempenho dos agentes e skills |
| **Infraestrutura** | GitHub, Supabase, Vercel e health |
| **Custos** | uso por aplicativo, missão, tarefa, provider e modelo |
| **Auditoria** | ações e decisões imutáveis |
| **Configurações** | organizações, integrações, políticas e budgets |

A tela inicial não deve mostrar dezenas de detalhes técnicos imediatamente. Ela deve responder cinco perguntas:

```text
O que está sendo construído?
O que está trabalhando agora?
O que está bloqueado?
O que precisa da minha decisão?
O que mudou desde minha última visita?
```

Um dashboard inicial adequado teria:

```text
┌──────────────────────────────────────────────────────┐
│ FÁBRICA APPS RNS                          ● Saudável │
├──────────────────────────────────────────────────────┤
│ Apps Ativos   Runs   Aguardando você   Bloqueados   │
│     7          12          3               1         │
├────────────────────────────┬─────────────────────────┤
│ LINHA DE PRODUÇÃO          │ APROVAÇÕES             │
│                            │                         │
│ App CRM                    │ Plano CRM etapa 03      │
│ ███████░░ 72%              │ Claude R2 concluído    │
│                            │ [abrir]                 │
│ App Clínica                │                         │
│ ████░░░░░ 41%              │ Migration #229         │
├────────────────────────────┴─────────────────────────┤
│ ATIVIDADE AO VIVO                                     │
│ GPT R1 → análise concluída                            │
│ Claude R1 → em execução                               │
│ CI PR #142 → aprovado                                 │
└───────────────────────────────────────────────────────┘
```

Ao entrar em **um aplicativo**, a informação deve ser reorganizada. O aplicativo produzido se torna a unidade superior de contexto:

| Aba do aplicativo | Conteúdo |
|---|---|
| Resumo | status, propósito, versão, ambientes e atividade |
| Especificação | requisitos e product spec aprovados |
| Plano | plano mestre e etapas |
| Esteira | DAG/fluxo operacional |
| Tarefas | backlog e trabalho corrente |
| Revisões | diálogo formal GPT ↔ Claude |
| Execuções | runs dos agentes |
| Código | commits, branches, PRs e checks |
| Preview | aplicativo executável no Vercel |
| Banco | schema/migrations e estado Supabase |
| Deployments | preview, staging e produção |
| Inteligência | agentes/skills usados naquele projeto |
| Evidências | testes, findings, relatórios e screenshots |
| Custos | uso detalhado |
| Auditoria | quem decidiu o quê e quando |

A **Esteira de Produção** precisa ser um dos componentes visuais centrais:

```text
PLANEJAMENTO
    │
    ▼
GPT R1
    │
    ▼
CLAUDE R1
    │
    ▼
GPT R2
    │
    ▼
CLAUDE R2
    │
    ▼
ANTIGRAVITY / HUMANO
    │
    ├──── rejeitar ─────► revisão
    │
    └──── aprovar
             │
             ▼
       IMPLEMENTAÇÃO
             │
             ▼
        TESTE / CI
             │
             ▼
      REVISÃO DA ETAPA
             │
     mesmo ciclo R1/R2
             │
             ▼
       APROVAÇÃO HUMANA
```

Um cartão de etapa deve indicar claramente:

```text
ETAPA
Backend de autenticação

STATE
CLAUDE_R1_RUNNING

PLANO
SHA 53a9...

PR
#184

OPENAI
R1 ✓
R2 pendente

CLAUDE
R1 executando
R2 pendente

CI
ainda não executado

HUMAN GATE
pendente
```

Isso é muito melhor do que mostrar um chat contínuo.

A tela mais diferenciadora será a **Câmara de Revisão**. Ela traduz a sua ideia de revisão dupla em uma experiência compreensível:

```text
┌────────────────────────────────────────────────────────────┐
│                 REVIEW CYCLE #RC-00421                    │
│          Plano v7 · SHA abc123 · Etapa Backend            │
├─────────────┬──────────────┬─────────────┬─────────────────┤
│ GPT R1      │ Claude R1    │ GPT R2      │ Claude R2       │
│             │              │             │                 │
│ findings    │ meta-review  │ reconcile   │ final verdict   │
│ riscos      │ discordâncias│ corrections │ recommendation  │
│ melhorias   │ novos riscos │ accepted    │                 │
├─────────────┴──────────────┴─────────────┴─────────────────┤
│ DIVERGÊNCIAS                                                │
│ SEC-18    GPT: medium    Claude: critical   NÃO RESOLVIDA  │
│ ARCH-9    concordância                        RESOLVIDA     │
├────────────────────────────────────────────────────────────┤
│ CLAUDE FINAL: READY_WITH_CONDITIONS                         │
│                                                            │
│                   HUMAN / ANTIGRAVITY                       │
│      [REJEITAR] [PEDIR REVISÃO] [APROVAR ETAPA]            │
└────────────────────────────────────────────────────────────┘
```

A interface nunca deve esconder divergências por produzir simplesmente uma “média” dos modelos. Divergência é informação.

A área **Aprovações** será a ponte entre cloud e seu Antigravity local. O front-end deve produzir um **Handoff Bundle** contendo:

```text
app
mission
stage
task
base SHA
current SHA
PR
plan
diff
GPT R1
Claude R1
GPT R2
Claude R2
unresolved findings
CI
preview URL
Supabase preview branch
recommendation
```

Você pode então abrir o clone local no Antigravity já sabendo exatamente que estado está avaliando. O Antigravity atual possui skills, MCP, permissões e suporte à criação de planos/artifacts, portanto continua apropriado para esse papel local de planejamento e autoridade sob sua supervisão. citeturn13search0turn13search8

Para atualizações da interface em tempo real, eu não usaria polling constante. Supabase Realtime oferece Broadcast, Presence e mudanças de Postgres; a documentação atual recomenda Broadcast para maior escalabilidade e segurança em cenários de eventos derivados do banco. citeturn7search8turn7search9 Isso se encaixa muito bem em tópicos como:

```text
factory:<organization>
app:<app_id>
mission:<mission_id>
run:<run_id>
deployment:<deployment_id>
```

O browser não precisa receber cada token ou cada byte de stdout do agente. Recebe eventos normalizados:

```json
{
  "event": "run.progress",
  "run_id": "run_421",
  "state": "reviewing",
  "summary": "12 arquivos analisados",
  "occurred_at": "..."
}
```

Logs de baixo nível continuam armazenados e são carregados sob demanda.

A acessibilidade deve entrar como requisito de arquitetura. WCAG 2.2 possui tradução oficialmente autorizada em português brasileiro desde 2025. citeturn3search0 Playwright integra `axe-core`, mas sua própria documentação observa que automação detecta apenas parte das falhas; testes manuais continuam necessários. citeturn17search3 Storybook pode executar testes de acessibilidade e regressão visual em componentes antes de chegarem às telas completas. citeturn17search5turn17search11

Os budgets de performance devem acompanhar os Core Web Vitals atuais: LCP de até 2,5 segundos e CLS de até 0,1 no percentil 75; o documento fornecido também identifica INP como métrica de responsividade e defende performance como gate. citeturn7search1turn7search0 fileciteturn0file0

Um ponto importante de UX: **a Fábrica RNS não deve reconstruir integralmente o GitHub Dashboard, Supabase Dashboard e Vercel Dashboard.** Ela deve mostrar a informação operacional necessária para tomar decisões. Para casos de administração de Supabase, existe inclusive o Platform Kit oficial, criado para plataformas incorporarem funções da Management API dentro de suas próprias interfaces. citeturn15search4

## Documento de arquitetura do back-end

O back-end da Fábrica Apps RNS é onde a maior parte da complexidade real reside.

Ele não é simplesmente um conjunto de CRUDs. Ele é simultaneamente:

```text
workflow engine
event processor
agent control plane
GitHub integration
provisioning service
policy engine
review protocol engine
evidence ledger
approval system
budget system
deployment coordinator
evaluation platform
```

O princípio mais importante será:

> **O estado da fábrica nunca deve depender da memória de um agente ou de uma conversa.**

Tudo que determina o próximo passo deve existir em uma representação persistente.

Os módulos do back-end ficam assim:

| Serviço lógico | Responsabilidade |
|---|---|
| **Identity Service** | usuário, organização, memberships e RBAC |
| **App Service** | ciclo de vida de cada aplicativo |
| **Specification Service** | requisitos, versões e aprovação da especificação |
| **Mission Service** | iniciativas/planos longos |
| **Stage Service** | etapas de uma missão |
| **Task Service** | unidades executáveis |
| **Orchestrator** | valida e executa a state machine |
| **Scheduler** | quando um trabalho está elegível |
| **Queue Service** | jobs persistentes |
| **Lease Manager** | garante um owner temporário por job |
| **Agent Router** | escolhe runtime/model/profile permitido |
| **OpenAI Adapter** | traduz Task Packet para OpenAI |
| **Claude Adapter** | traduz Task Packet para Anthropic |
| **Antigravity Handoff Adapter** | prepara handoff para ambiente local |
| **Intelligence Resolver** | resolve constituição, role, skills e versões |
| **Review Engine** | executa a revisão dupla obrigatória |
| **Finding Service** | riscos, achados, resoluções e discordâncias |
| **Evidence Service** | provas verificáveis |
| **Policy Engine** | ALLOW / ASK / DENY |
| **Approval Engine** | gates humanos |
| **GitHub Integration** | App, commits, branches, PRs, comments e checks |
| **Provisioning Service** | GitHub repo + Supabase + Vercel |
| **Preview Service** | ambiente de PR |
| **Release Service** | coordenação de release |
| **Budget Service** | tokens, dinheiro, tempo e quotas |
| **Eval Service** | avaliação dos modelos/skills |
| **Audit Service** | trilha imutável |
| **Notification Service** | avisos operacionais |
| **Observability Service** | logs, traces, métricas e health |

A integração com GitHub deve utilizar uma **GitHub App da Fábrica**, e não PATs pessoais espalhados pelo sistema. GitHub recomenda explicitamente que GitHub Apps solicitem apenas as permissões mínimas necessárias; a permissão `Contents` é a base para acesso Git autenticado, e `Workflows` só é necessária quando a App realmente precisa modificar arquivos em `.github/workflows`. citeturn9search3 GitHub também recomenda usar o tipo de token adequado e evitar PAT pessoal como identidade de uma aplicação. citeturn9search4

Para a implementação TypeScript, Octokit é a opção oficial/nativa do ecossistema GitHub, inclusive com suporte a autenticação como GitHub App e webhooks. citeturn16search7turn16search11

O modelo de dados recomendado no Factory Supabase deve separar claramente domínio, workflow e integrações. Conceitualmente:

| Grupo | Tabelas centrais |
|---|---|
| Identidade | `organizations`, `organization_members` |
| Aplicativos | `apps`, `app_specs`, `app_environments` |
| Código | `repositories`, `repository_installations`, `branches`, `pull_requests` |
| Planejamento | `missions`, `mission_versions`, `stages` |
| Trabalho | `tasks`, `task_dependencies`, `task_packets` |
| Agentes | `agent_roles`, `agent_profiles`, `runtime_profiles`, `model_profiles` |
| Inteligência | `intelligence_versions`, `skill_versions`, `methodology_versions` |
| Execução | `runs`, `run_attempts`, `run_events`, `tool_events` |
| Revisão | `review_cycles`, `review_rounds`, `findings`, `disagreements` |
| Evidência | `artifacts`, `evidence_items`, `test_results` |
| Governança | `approvals`, `policy_decisions`, `human_decisions` |
| Infraestrutura | `supabase_projects`, `vercel_projects`, `preview_environments` |
| Deploy | `deployments`, `deployment_checks`, `release_decisions` |
| Operação | `jobs`, `job_attempts`, `dead_letters`, `webhook_events` |
| Finanças | `usage_records`, `budgets`, `budget_alerts` |
| Avaliação | `eval_suites`, `eval_cases`, `eval_runs`, `agent_scores` |
| Auditoria | `audit_events`, `secret_refs` |

Não armazenaremos o segredo real em `secret_refs`. Essa tabela aponta para onde a credencial é administrada.

O modelo precisa ser multi-tenant desde o princípio mesmo que inicialmente exista apenas sua organização. Isso evita ter que reconstruir todas as relações quando a Fábrica crescer.

O banco não precisa expor todas essas tabelas ao browser. Supabase recomenda hoje combinar grants explícitos e RLS para objetos expostos e permite usar schemas dedicados para tornar a superfície da Data API mais clara e auditável. citeturn14search8turn14search9 Portanto, uma organização adequada seria:

```text
api
    informações deliberadamente expostas à aplicação

factory
    domínio interno

workflow
    orquestração

agents
    runs e configurações

review
    ciclos e findings

governance
    approvals e audit

integration
    IDs e metadata externos
```

Somente o que precisa chegar diretamente ao cliente deve estar exposto. Secret keys ou equivalentes nunca vão para o navegador; a documentação do Supabase é explícita em afirmar que credenciais secret/service-role contornam RLS e pertencem apenas ao backend. citeturn14search6

A máquina de estado principal da **tarefa** deve ser formal:

```text
CREATED
   ↓
READY
   ↓
QUEUED
   ↓
LEASED
   ↓
RUNNING
   ↓
ARTIFACT_READY
   ↓
REVIEWING
   ↓
AWAITING_CHECKS
   ↓
AWAITING_HUMAN
   ↓
APPROVED
   ↓
COMPLETED
```

com ramificações explícitas:

```text
RUNNING ───────► FAILED_RETRYABLE
                     │
                     ▼
                   READY

RUNNING ───────► FAILED_TERMINAL

REVIEWING ─────► CHANGES_REQUIRED
                     │
                     ▼
                   READY

AWAITING_HUMAN ─► REJECTED
                      │
                      ▼
                   REVISION_REQUIRED

qualquer estado permitido ─► CANCELLED
```

Uma missão longa, como o seu exemplo de três dias, é decomposta:

```text
MISSION
 │
 ├─ STAGE 01
 │    ├─ task
 │    ├─ implementation
 │    ├─ GPT R1
 │    ├─ Claude R1
 │    ├─ GPT R2
 │    ├─ Claude R2
 │    └─ human approval
 │
 ├─ STAGE 02
 │    └─ mesmo protocolo
 │
 └─ STAGE 03
      └─ mesmo protocolo
```

Dessa maneira não precisamos esperar três dias para descobrir que a primeira etapa estava errada.

O sistema de jobs precisa possuir **lease**, não apenas uma coluna `status = running`.

```text
job_id
state
lease_owner
lease_acquired_at
lease_expires_at
attempt
max_attempts
next_attempt_at
idempotency_key
```

Se o executor morrer, o lease expira e outro worker pode reprocessar o job. A fila Postgres da Supabase pode servir como primitive de entrega, mas a lógica de negócio continua idempotente porque webhooks, timeouts e falhas parciais são inerentes a integrações distribuídas. citeturn15search0turn14search5

Todo evento externo deve passar pela seguinte sequência:

```text
RECEIVE
  ↓
VERIFY SIGNATURE
  ↓
NORMALIZE
  ↓
PERSIST RAW EVENT
  ↓
CHECK IDEMPOTENCY
  ↓
VALIDATE CURRENT STATE
  ↓
APPLY TRANSITION
  ↓
EMIT INTERNAL EVENT
  ↓
QUEUE NEXT JOB
```

Isso vale para:

```text
github.*
vercel.*
supabase.*
openai.*
anthropic.*
worker.*
human.*
```

A criação de um aplicativo também deve ser uma state machine:

```text
APP_REQUESTED
      ↓
SPEC_CREATED
      ↓
PLAN_REVIEWED
      ↓
HUMAN_APPROVED
      ↓
PROVISIONING
      │
      ├── GitHub Repository
      ├── Supabase Project
      └── Vercel Project
      ↓
BOOTSTRAPPING
      ↓
READY_FOR_DEVELOPMENT
```

O Supabase oferece oficialmente a criação programática de projetos através da Management API em sua oferta para plataformas e AI builders. citeturn15search4 Vercel conecta repositórios Git e cria automaticamente previews de branches/PRs e produção a partir da branch de produção. citeturn15search1

Para cada tarefa de implementação:

```text
task
  ↓
branch
  ↓
PR
  ├─ Supabase preview
  └─ Vercel preview
        ↓
      checks
        ↓
     reviews
        ↓
    human gate
        ↓
      merge
        ↓
production build
        ↓
release checks
        ↓
promotion
```

Essa última distinção — **merge ≠ release** — deve estar presente no back-end desde a primeira versão. Vercel oferece Deployment Checks justamente para impedir que um build de produção seja promovido para o domínio final enquanto condições obrigatórias ainda não foram satisfeitas. citeturn15search3 Previews também podem ser inspecionados, testados e posteriormente promovidos, com rollback se algo falhar. citeturn15search2turn15search6

A API interna do Control Plane deve ser orientada a comandos de domínio, não apenas CRUDs genéricos. Exemplos:

```text
POST /api/apps
POST /api/apps/:id/provision

POST /api/missions
POST /api/missions/:id/submit-review

POST /api/tasks/:id/dispatch
POST /api/tasks/:id/cancel

POST /api/reviews/:id/continue
POST /api/reviews/:id/request-revision

POST /api/approvals/:id/approve
POST /api/approvals/:id/reject

POST /api/releases/:id/promote
POST /api/releases/:id/rollback

POST /api/webhooks/github
POST /api/webhooks/vercel
POST /api/webhooks/openai
POST /api/webhooks/anthropic
```

O navegador não deveria atualizar `task.status` diretamente. Ele solicita:

```text
approve(task)
reject(task)
cancel(run)
retry(job)
promote(deployment)
```

e o domínio decide se aquela transição é válida.

Isso é uma diferença fundamental entre um CRUD administrativo e um **Control Plane de engenharia**.

## Inteligência, orquestração e protocolo OpenAI ↔ Claude

Esta é a parte onde a Fábrica Apps RNS deixa de ser apenas infraestrutura e passa a possuir uma metodologia própria de construção de software.

Os dois documentos que você anexou ajudam muito aqui. O primeiro defende que o conhecimento de front-end seja transformado em doutrina operacional, checklists, padrões e gates, e não apenas colocado em um prompt. fileciteturn0file0 O segundo argumenta explicitamente que um agente especialista deve possuir corpus, ferramentas, contexto de projeto, testes e evals. fileciteturn0file1

A estrutura que já havíamos definido permanece válida:

```text
RNS INTELLIGENCE CORE
│
├── constitution
├── agent registry
├── methodology
├── skills
├── protocols
├── schemas
├── knowledge
└── evals
        │
        ├───────────────┐
        ▼               ▼
 OPENAI PROJECTION   CLAUDE PROJECTION
 AGENTS.md           CLAUDE.md
 .agents/skills      .claude/skills
 .codex/...          .claude/agents
```

Isso está alinhado à evolução real dos dois fornecedores. OpenAI utiliza `AGENTS.md`, skills locais em `.agents/skills/`, `SKILL.md`, referências e scripts com progressive disclosure. citeturn9search0turn9search8 Claude Managed Agents pode carregar skills diretamente de `.claude/skills` do repositório montado e alerta explicitamente que essas skills passam a fazer parte da **trust boundary** da execução. citeturn8search0

Portanto:

> **A inteligência pertence à Fábrica RNS. OpenAI e Claude recebem projeções dela.**

Os R1–R9 devem continuar definidos em um registry machine-readable, e o front-end deve consumir esse registry em vez de codificar `if agent === R3` pela aplicação inteira. Assim, evoluir responsabilidade, skill ou modelo não exige reconstruir a UI.

Conceitualmente:

```yaml
role_id: R4
title: Builder
capabilities:
  - implementation
  - repository_edit
skills:
  - frontend-build
  - backend-build
  - test-writing
allowed_runtimes:
  - openai
  - anthropic
permission_profile: workspace_write
requires_independent_review: true
```

Uma execução concreta fica:

```text
ROLE:
Builder

RUNTIME:
OpenAI

MODEL:
<resolved at run time>

INTELLIGENCE VERSION:
SHA abcdef

SKILLS:
frontend-build@v7
testing@v4

TASK PACKET:
TP-942

BASE SHA:
b92a31...

POLICY:
workspace_write
production_denied
```

Isso torna **Role ≠ Runtime ≠ Model ≠ Skill**.

O Task Packet deve ser a unidade formal de comunicação:

```json
{
  "mission_id": "mis_001",
  "stage_id": "stage_03",
  "task_id": "task_184",
  "run_id": "run_765",
  "subject_sha": "abc123",
  "role": "architecture-reviewer",
  "runtime": "openai",
  "objective": "Revisar o plano da etapa 03",
  "acceptance_criteria": [],
  "required_skills": [],
  "allowed_paths": [],
  "forbidden_paths": [],
  "required_evidence": [],
  "required_tests": [],
  "budget": {
    "max_cost": null,
    "max_duration": null
  },
  "expected_output_schema": "review.schema.json"
}
```

O protocolo que você definiu deve ser formalizado exatamente como uma **máquina de revisão de quatro passagens**, não como conversa indefinida:

```text
PLAN / STAGE VERSION
        │
        ▼
┌────────────────┐
│ OPENAI / GPT R1│
│ análise inicial│
└───────┬────────┘
        │
        ▼
┌────────────────┐
│ CLAUDE R1      │
│ revisão        │
│ + meta-review  │
│ do GPT         │
└───────┬────────┘
        │
        ▼
┌────────────────┐
│ OPENAI / GPT R2│
│ analisa Claude │
│ reconcilia     │
│ corrige        │
└───────┬────────┘
        │
        ▼
┌────────────────┐
│ CLAUDE R2      │
│ síntese final  │
│ sem novo debate│
└───────┬────────┘
        │
        ▼
    HUMAN GATE
        │
        ▼
ANTIGRAVITY LOCAL
        │
     ┌──┴──┐
     │     │
 APPROVE  REVISE
```

Essa sequência deve ser **determinística no Orchestrator**.

Não será GPT quem decide chamar Claude.

Não será Claude quem decide chamar GPT de novo.

O Orchestrator sabe:

```text
round = 1
provider = openai

round = 2
provider = anthropic

round = 3
provider = openai

round = 4
provider = anthropic

round > 4
DENIED
→ HUMAN GATE
```

Isso elimina loop infinito.

Cada ciclo deve registrar:

```text
review_cycle_id
subject_type
subject_id
subject_sha
started_at
current_round
status
final_recommendation
human_decision
```

e cada passagem:

```text
review_round_id
round_number
provider
model
role
input_sha
output_sha
verdict
cost
started_at
completed_at
```

Os achados devem ser objetos separados:

```text
finding_id
category
severity
claim
evidence
introduced_by
introduced_round
status
resolution
resolved_by
```

E divergências também:

```text
disagreement_id
finding_id
openai_position
claude_position
evidence_openai
evidence_claude
materiality
resolution
human_required
```

O resultado final não deve ser “Claude venceu” ou “GPT venceu”. Deve ser:

```text
RESOLVED
ACCEPTED_OPENAI
ACCEPTED_CLAUDE
COMBINED
DEFERRED
HUMAN_DECISION_REQUIRED
```

Quando você recebe o trabalho no Antigravity e modifica algo, precisamos distinguir **mudança material** de simples edição.

Uma mudança é material se altera:

```text
escopo
critério de aceitação
arquitetura
schema/migration
segurança
permissões
dependências estruturais
API pública
estratégia de deploy
ordem ou dependência das etapas
```

Mudança material:

```text
HUMAN_EDIT
   ↓
new subject SHA
   ↓
NEW REVIEW CYCLE
   ↓
GPT R1 → Claude R1 → GPT R2 → Claude R2
```

Mudança editorial:

```text
ortografia
formatação
descrição não normativa
metadata sem efeito técnico
```

não exige automaticamente outro ciclo.

Isso concretiza exatamente o comportamento que você descreveu sem criar revisões eternas.

Para uma etapa já implementada, os quatro passos permanecem, porém a natureza da análise muda:

```text
OPENAI R1
code + architecture + acceptance review

CLAUDE R1
meta-review OpenAI + independent code review + test gaps

OPENAI R2
reconcile + apply valid corrections

CLAUDE R2
final verification + recommendation
```

e então:

```text
CI
+
preview
+
evidence
+
Claude final recommendation
        ↓
HUMAN / ANTIGRAVITY
```

OpenAI e Anthropic hoje já oferecem mecanismos que favorecem essa arquitetura. O Agents API da OpenAI possui sessões, sandbox, skills, MCP, continuidade e possibilidade de subagentes. citeturn11search3 Anthropic Managed Agents fornece skills filesystem-based e sessões gerenciadas. citeturn8search0 Mesmo assim, a Fábrica não deve depender do mecanismo interno de subagentes de nenhum deles para o protocolo cross-provider. O cross-provider pertence ao nosso Orchestrator.

GitHub Agentic Workflows também já consegue executar Claude Code e OpenAI Codex dentro do Actions, com workflows definidos em Markdown e compilados para Actions; a funcionalidade permanece em public preview. citeturn12search0 GitHub documenta ainda controles como read-only por padrão, safe outputs, separação de secrets e execução isolada. citeturn12search4 Minha recomendação é utilizá-lo como **um possível adapter de execução**, não como representação canônica do workflow da Fábrica.

Isso significa:

```text
RNS Orchestrator
      │
      ├─ OpenAI Managed Adapter
      ├─ OpenAI GitHub Action Adapter
      │
      ├─ Claude Managed Adapter
      ├─ Claude GitHub Action Adapter
      │
      └─ Antigravity Local Handoff
```

A troca de adapter não modifica o protocolo RNS.

## Segurança, qualidade, observabilidade e evals

Uma fábrica de software com agentes possui uma característica que um SaaS comum não possui: ela **produz e executa código que ainda não merece confiança**.

Por isso a política básica será:

```text
AGENT-GENERATED CODE
        =
UNTRUSTED
until verified
```

Mesmo sendo produzido pelo nosso próprio GPT ou Claude.

A hierarquia de confiança fica:

```text
HUMANO
  ↓
CONSTITUIÇÃO RNS
  ↓
POLÍTICAS
  ↓
REGISTRY CANÔNICO
  ↓
METODOLOGIAS
  ↓
SKILLS
  ↓
TASK PACKET
  ↓
LIVE EVIDENCE
  ↓
MEMÓRIA HISTÓRICA
  ↓
SUPOSIÇÃO DO MODELO
```

Um modelo não pode redefinir uma política superior.

As permissões devem continuar em três categorias:

| Classe | Exemplo |
|---|---|
| **ALLOW** | ler repo, rodar testes, ler preview, consultar schema |
| **ASK / HUMAN GATE** | migration de produção, merge crítico, promoção, secrets |
| **DENY** | desativar RLS, force push em main, expor secret, apagar produção |

A GitHub App começa sem permissões e deve receber apenas o mínimo necessário. citeturn9search3 `main` deve ser protegida por ruleset/branch protection com checks obrigatórios; GitHub permite exigir status checks antes de merge e até restringir a fonte esperada de um check a uma GitHub App específica. citeturn9search2turn9search5

Para autenticação dos jobs de IA, existe hoje uma oportunidade importante: **não precisamos necessariamente guardar chaves OpenAI e Anthropic permanentes no GitHub**.

OpenAI suporta Workload Identity Federation com GitHub Actions: o job obtém um token OIDC do GitHub e o troca por credencial OpenAI temporária, com regras que podem ser restritas por repositório, branch, ambiente e `workflow_ref`. citeturn11search0 Anthropic possui um modelo equivalente de WIF para GitHub Actions, com token de curta duração e service accounts. citeturn10search3turn10search7

A arquitetura de identidade preferida é:

```text
GitHub Actions
      │
      │ OIDC JWT
      ▼
┌─────────────┐
│ Provider WIF│
└──────┬──────┘
       │
 short-lived token
       │
       ▼
 OpenAI / Anthropic
```

em lugar de:

```text
repository secret
OPENAI_MASTER_KEY=permanent
ANTHROPIC_MASTER_KEY=permanent
```

Para Supabase, a regra é igualmente clara: publishable keys podem participar do frontend quando RLS está corretamente configurado; secret/service-role credentials não podem ser expostas no cliente porque contornam as proteções normais de RLS. citeturn14search6

Além disso, `factory-intelligence/**` precisa ser considerado **código privilegiado**. Anthropic observa explicitamente que skills provenientes de um repositório entram na trust boundary do agente e podem orientar ferramentas como Bash. citeturn8search0 Portanto, alterações em:

```text
factory-intelligence/constitution/**
factory-intelligence/protocols/**
factory-intelligence/agents/**
factory-intelligence/skills/**
permissions/**
AGENTS.md
CLAUDE.md
```

devem exigir CODEOWNERS e aprovação humana.

A pipeline de qualidade deverá combinar verificações determinísticas com avaliações de IA:

```text
TYPECHECK
+
LINT
+
UNIT TESTS
+
INTEGRATION TESTS
+
DATABASE TESTS
+
RLS TESTS
+
COMPONENT TESTS
+
ACCESSIBILITY
+
VISUAL REGRESSION
+
E2E
+
SECURITY
+
AI CROSS-REVIEW
+
PREVIEW VERIFICATION
+
HUMAN GATE
```

Não usamos IA para substituir CI.

Também não usamos CI para substituir revisão arquitetural.

São camadas diferentes de confiança.

Para front-end:

| Gate | Ferramenta/metodologia |
|---|---|
| Tipos | TypeScript |
| Lógica | Vitest |
| Componentes | Storybook |
| Visual | Storybook/visual snapshots |
| E2E | Playwright |
| A11y automática | axe |
| A11y manual | teclado + assistive-tech representative |
| Responsividade | viewports + component states |
| Performance | Web Vitals / Vercel checks |
| Preview | Vercel |

Storybook suporta testes de componentes, acessibilidade e regressão visual; Playwright recomenda combinar automação com testes manuais de acessibilidade. citeturn17search5turn17search9turn17search3

Para o back-end:

| Gate | O que provar |
|---|---|
| State machine | nenhuma transição impossível |
| Idempotência | webhook duplicado não duplica operação |
| Lease | job abandonado é recuperável |
| Retry | falhas transitórias respeitam política |
| Dead letter | falha terminal fica investigável |
| Contract tests | adapters obedecem ao mesmo contrato |
| RLS | usuário/tenant não lê dados alheios |
| GitHub webhook | assinatura e deduplicação |
| Provider webhook | evento legítimo e correlacionado |
| Migration | aplica e reverte no preview |
| Policy | DENY não pode ser contornado |
| Budget | agente para quando limite é excedido |
| Audit | decisão crítica possui provenance |

Os **Agent Evals** constituirão uma terceira camada.

Não basta saber que “GPT parece bom” ou “Claude parece melhor”.

Cada role/skill deverá possuir casos conhecidos:

```text
evals/
├── planning/
├── architecture/
├── frontend/
├── backend/
├── database/
├── security/
├── code-review/
├── testing/
├── accessibility/
└── deployment/
```

Exemplo de eval de migration:

```text
Caso A
migration saudável

Caso B
DROP destrutivo

Caso C
RLS ausente

Caso D
policy permissiva demais

Caso E
migration incompatível com dados atuais

Caso F
mudança não idempotente
```

Os dois runtimes recebem o mesmo problema e medimos:

```text
finding recall
false positives
human acceptance
CI regression rate
rework rate
latency
tokens
cost
success
```

Com o tempo, o sistema poderá construir um dataset próprio:

```text
role
skill
runtime
model
task_class
complexity
success
human_acceptance
rework
cost
latency
bugs_detected
bugs_introduced
```

É esse banco que futuramente deve informar o Agent Router.

Não “GPT é melhor”.

Mas:

> “Para este tipo de tarefa, neste nível de complexidade, com esta skill, este runtime apresentou melhor desempenho histórico.”

Isso transforma a própria operação da fábrica em conhecimento.

A observabilidade também precisa incluir três perspectivas diferentes:

```text
PRODUCT OBSERVABILITY
usuário / app / UX

FACTORY OBSERVABILITY
tasks / queues / reviews / approvals

AGENT OBSERVABILITY
runs / tools / tokens / models / errors
```

Cada run precisa produzir correlação consistente:

```text
organization_id
app_id
mission_id
stage_id
task_id
review_cycle_id
run_id
provider_session_id
github_pr
base_sha
head_sha
deployment_id
trace_id
```

Então um erro visto na interface pode ser percorrido de ponta a ponta.

## Prontidão para o plano de implementação

Com a pesquisa e a consolidação deste documento, já podemos definir com bastante segurança **o que não deve mais ficar para o agente construtor decidir sozinho**.

A arquitetura de produto está suficientemente clara para ser congelada desta forma:

| Questão | Decisão arquitetural |
|---|---|
| O que estamos construindo? | Control Plane de uma AI Software Factory |
| Front-end principal | Next.js App Router + TypeScript |
| Design | RNS Design System com tokens canônicos |
| Componentes | source-owned, com shadcn/ui como base operacional |
| Estado operacional | Factory Supabase/PostgreSQL |
| Atualização live | Supabase Realtime |
| Orquestração | Orchestrator determinístico |
| Heavy agent jobs | runners/provider runtimes, não Edge Functions long-running |
| Software ledger | GitHub |
| Identidade GitHub | GitHub App |
| Worker OpenAI | OpenAI adapter |
| Worker Anthropic | Claude adapter |
| Antigravity | local + humano, planejamento e human gate |
| Inteligência | RNS Intelligence Core versionado |
| Interoperabilidade | adapters + MCP quando apropriado |
| Unidade de trabalho | Task Packet |
| Unidade de código | branch/workspace/PR isolado |
| Revisão | GPT R1 → Claude R1 → GPT R2 → Claude R2 |
| Decisão final | humano + Antigravity |
| Workflow state | Supabase |
| Queue | persistente |
| Preview de código | GitHub branch |
| Preview de banco | Supabase preview |
| Preview web | Vercel Preview |
| Merge | somente após checks/review |
| Release | etapa diferente do merge |
| Produção | nenhum coding agent recebe livre acesso |
| Qualidade | CI + AI review + evidence + human gate |
| Inteligência privilegiada | CODEOWNERS + human review |
| Avaliação de agentes | Evals versionados |
| Routing futuro | baseado em dados reais de desempenho |

Há ainda uma diferença importante entre o que precisa ser **decidido agora** e o que pode continuar sendo **configuração trocável**.

Não devemos congelar um nome específico de modelo OpenAI ou Anthropic dentro da arquitetura. Modelos mudam. Também não devemos tornar Claude Managed Agents, OpenAI Agents API ou GitHub Agentic Workflows requisitos irreversíveis. O Agents API atual oferece harness gerenciado com sandbox, tools, MCP, subagentes e sessões retomáveis; Claude Managed Agents possui skills e sessões próprias; e GitHub possui Agentic Workflows em public preview. citeturn11search3turn8search0turn12search0 Essas são **implementações do nosso Agent Adapter Contract**, não o contrato em si.

A arquitetura precisa continuar funcionando assim:

```text
                RNS ORCHESTRATOR

                       │
             Agent Adapter Contract
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼

OpenAI Adapter                  Anthropic Adapter
     │                                 │
     ├ Codex/Agents                    ├ Claude Code
     ├ GitHub Action                   ├ Managed Agents
     └ future runtime                  └ future runtime
```

O contrato permanece:

```text
startRun()
resumeRun()
cancelRun()
getStatus()
getEvents()
getArtifacts()
getUsage()
```

Da mesma maneira, o front-end não deve saber qual endpoint específico da Anthropic executa Claude. Ele pergunta ao nosso back-end:

```text
GET /runs/run_765
```

e recebe:

```json
{
  "id": "run_765",
  "runtime": "anthropic",
  "state": "running",
  "role": "reviewer",
  "round": 2,
  "started_at": "...",
  "progress": {
    "summary": "Reviewing architecture and security findings"
  }
}
```

Esse desacoplamento é uma das garantias mais importantes para a longevidade da Fábrica.

O mesmo vale para o design. O relatório de front-end que você forneceu está correto ao rejeitar a ideia de “sempre usar a tecnologia mais nova”. fileciteturn0file0 O dossiê também está correto ao dividir o conhecimento dos agentes entre estável, semiestável e volátil. fileciteturn0file1 Portanto, nossa arquitetura congela **princípios e contratos**, enquanto versões concretas de frameworks, SDKs e modelos são verificadas no início de cada implementação relevante.

A documentação mínima que a implementação deverá encontrar no repositório pode, portanto, nascer com esta forma:

```text
docs/
├── product/
│   ├── FACTORY_PRODUCT_SPEC.md
│   ├── FRONTEND_ARCHITECTURE.md
│   ├── BACKEND_ARCHITECTURE.md
│   └── USER_FLOWS.md
│
├── architecture/
│   ├── SYSTEM_ARCHITECTURE.md
│   ├── DATA_ARCHITECTURE.md
│   ├── ORCHESTRATOR.md
│   ├── EVENT_ARCHITECTURE.md
│   ├── SECURITY_MODEL.md
│   └── DEPLOYMENT_MODEL.md
│
├── protocols/
│   ├── DOUBLE_REVIEW_PROTOCOL.md
│   ├── HUMAN_GATE_PROTOCOL.md
│   ├── TASK_PACKET_PROTOCOL.md
│   ├── EVIDENCE_PROTOCOL.md
│   └── DISAGREEMENT_PROTOCOL.md
│
└── decisions/
    └── ADR-*.md
```

E os critérios de **Architecture Ready** antes do primeiro ciclo real de construção são:

```text
✓ arquitetura front-end definida
✓ arquitetura back-end definida
✓ entidades centrais definidas
✓ state machines definidas
✓ protocolo GPT ↔ Claude definido
✓ human gate definido
✓ fronteira Antigravity definida
✓ GitHub App definida conceitualmente
✓ Factory Supabase definido
✓ preview architecture definida
✓ release architecture definida
✓ intelligence architecture definida
✓ permissions model definido
✓ eval strategy definida
✓ observability model definido
✓ security boundary definida
```

Com isso, a etapa que antecede a implementação deixa de ser ambígua.

Nós não estaremos entregando ao Antigravity um pedido como:

```text
"Construa uma fábrica de aplicativos com GPT e Claude."
```

Estaremos entregando algo muito mais próximo de:

```text
Construa este sistema.

Estas são as entidades.
Estas são as telas.
Estes são os estados.
Estas são as transições.
Estes são os contratos.
Estas são as APIs.
Estas são as fronteiras.
Estas são as permissões.
Este é o protocolo de revisão.
Estes são os gates.
Esta é a inteligência.
Estes são os testes.
Esta é a Definition of Done.

Você pode decidir a implementação local
dentro dessas fronteiras,
mas não reinventar a arquitetura.
```

Esse é, tecnicamente, o ponto certo para entrar no plano de implementação.

A Fábrica Apps RNS deixa então de ser apenas a ideia de **“GPT, Claude e Antigravity construindo aplicativos juntos”** e passa a possuir uma definição operacional mais rigorosa:

> **A Fábrica Apps RNS é um Control Plane de engenharia de software no qual um Orchestrator determinístico coordena agentes inteligentes versionados, executando trabalho isolado sobre GitHub; o Factory Supabase mantém estado, filas, evidências, avaliações e governança; Vercel e Supabase fornecem previews e runtime aos produtos gerados; OpenAI e Claude realizam implementação e revisão cruzada por um protocolo formal de quatro passagens; e o humano, operando Antigravity localmente, mantém autoridade final sobre planos, etapas críticas e releases.**

Essa definição preserva o projeto originalmente concebido, incorpora o conhecimento dos dois novos documentos e fornece agora uma **fronteira técnica suficientemente completa de front-end e back-end para que o próximo plano de implementação possa ser construído sem deixar a arquitetura fundamental a cargo dos agentes que irão executá-lo**.
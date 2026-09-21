# Pesquisa aprofundada: arquitetura de uma fábrica de aplicativos multiagente com GitHub, Supabase e Vercel

**Levantamento técnico baseado na documentação oficial disponível em 20 de setembro de 2026.**

A arquitetura que você descreveu é tecnicamente viável com as plataformas existentes hoje. Mais importante: o que você está propondo não é simplesmente um aplicativo com agentes, mas uma **plataforma de engenharia de software autônoma**, ou uma espécie de **AI Software Factory**: o usuário define um produto; um plano de controle transforma essa intenção em tarefas; diferentes motores de agentes trabalham sobre código isolado; o GitHub registra e governa as mudanças; o Supabase mantém o estado operacional e os bancos dos aplicativos; e o Vercel transforma versões aprovadas do código em aplicações executáveis. As APIs e runtimes necessários para construir esse sistema já existem nas três famílias de agentes e nas três plataformas de infraestrutura citadas. citeturn14search0turn18search3turn19search1turn16search0turn21search0

Há três correções de nomenclatura importantes para estabelecermos uma linguagem comum durante o projeto:

| Como apareceu na descrição | Nome técnico |
|---|---|
| AntiGravity | **Google Antigravity** |
| Cloud Code da Anthropic | **Claude Code** |
| Superbase | **Supabase** |
| GPT/ChatGPT trabalhando no código | Para automação programática, principalmente **OpenAI Codex / Codex SDK / Agents API** |

No caso da OpenAI, isso é especialmente importante: ChatGPT pode ser a interface humana, mas para um sistema programático que recebe tarefas, modifica repositórios, executa ferramentas e mantém sessões, as superfícies apropriadas hoje são Codex SDK, Agents SDK ou Agents API. A própria documentação da OpenAI diferencia esses runtimes: Agents API executa um harness Codex gerenciado pela OpenAI; Agents SDK deixa a aplicação controlar implantação, storage, aprovações e runtime; Codex SDK é explicitamente indicado para CI/CD e automação de tarefas de programação. citeturn19search0turn19search1turn19search3turn19search7

Minha conclusão central desta pesquisa é:

> **O GitHub deve ser a fonte da verdade do software; o Supabase deve ser a fonte da verdade da operação da fábrica; e o Vercel deve ser o plano de execução e publicação das aplicações geradas. Os três agentes não devem ser o sistema de orquestração. Eles devem ser trabalhadores controlados por um quarto componente determinístico: o Orchestrator.**

Essa separação será decisiva para que a plataforma continue controlável quando passarmos de três agentes e um projeto para dezenas de projetos e centenas de execuções simultâneas.

## O que realmente estamos construindo

A melhor maneira de conceituar o produto é separar **quatro sistemas diferentes** que, para o usuário final, aparecem como um único aplicativo.

O primeiro é o **Control Plane**, que será o aplicativo que você opera. Ele receberá a ideia ou especificação do aplicativo, manterá projetos, requisitos, arquitetura, tarefas, agentes, estados, custos, aprovações, logs e histórico. O Supabase é particularmente adequado para essa camada porque, além do Postgres, oferece Auth, Realtime, Edge Functions e filas persistentes, e a própria Supabase mantém uma documentação específica de “Supabase for Platforms” para ferramentas que provisionam infraestrutura para seus próprios usuários, incluindo explicitamente AI builders. A plataforma pode ser administrada programaticamente pela Management API e por MCP. citeturn16search0turn16search10

O segundo é o **Agent Execution Plane**. É onde Antigravity, Claude e OpenAI efetivamente trabalham. Cada execução recebe uma tarefa, um repositório, uma versão-base, permissões, ferramentas, orçamento, critérios de aceitação e um workspace isolado. Antigravity atualmente possui SDK Python, CLI, IDE e o Antigravity 2.0, todos baseados no mesmo harness; seu SDK oferece ferramentas, políticas de segurança, hooks, sessões persistentes, MCP e subagentes. citeturn14search0turn14search6 Anthropic oferece Claude Code e, para integração de produto mais profunda, Managed Agents com sessões persistentes, ambientes hospedados ou self-hosted, ferramentas, MCP e eventos. citeturn18search3turn17search5 A OpenAI oferece um harness Codex gerenciado pela Agents API e alternativas mais controláveis por meio do Agents SDK e Codex SDK. citeturn19search0turn19search1turn19search3

O terceiro é o **Software Delivery Plane**: GitHub. É aqui que vivem o código, branches, commits, pull requests, testes, migrations, políticas, revisões e histórico auditável. GitHub já suporta agentes de programação terceirizados de Claude e OpenAI Codex nativamente, embora essa funcionalidade esteja em *public preview*. Atualmente, o programa de “third-party coding agents” documenta oficialmente Anthropic Claude e OpenAI Codex; Google Antigravity não aparece nessa lista. citeturn14search2 GitHub também introduziu workflows agênticos definidos em Markdown, capazes de executar Claude Code, OpenAI Codex e Google Gemini CLI através do GitHub Actions, igualmente em prévia pública. citeturn14search8

O quarto é o **Application Runtime Plane**: o conjunto Supabase + Vercel pertencente a cada aplicativo produzido. O Vercel cria previews a cada mudança Git e produção a partir da branch de produção; a Supabase pode manter um backend próprio por aplicação e produzir bancos de preview correspondentes aos pull requests. citeturn15search9turn16search3turn16search9

Portanto, a topologia conceitual correta não é:

```text
Agentes → GitHub → Supabase → Vercel
```

Ela é:

```text
                    ┌──────────────────────────┐
                    │   APLICATIVO DA FÁBRICA │
                    │      Control Plane       │
                    └────────────┬─────────────┘
                                 │
                         intenção / projeto
                                 │
                    ┌────────────▼─────────────┐
                    │       ORCHESTRATOR       │
                    │ tarefas • estado • DAGs │
                    │ locks • retry • budgets │
                    │ approvals • routing     │
                    └────────────┬─────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
     ┌────────▼────────┐ ┌──────▼─────────┐ ┌─────▼───────────┐
     │   Antigravity   │ │ Claude Code /  │ │ OpenAI Codex /  │
     │ SDK / Harness   │ │ Managed Agents │ │ Agents API/SDK  │
     └────────┬────────┘ └──────┬─────────┘ └─────┬───────────┘
              │                  │                  │
              └──────────────────┼──────────────────┘
                                 │
                       worktrees / branches
                                 │
                    ┌────────────▼─────────────┐
                    │          GitHub          │
                    │ code • commits • PRs    │
                    │ Actions • checks • audit│
                    └───────┬──────────┬──────┘
                            │          │
                  migrations│          │source
                            │          │
                  ┌─────────▼───┐  ┌───▼──────────┐
                  │  Supabase   │  │    Vercel    │
                  │ DB/Auth/API │  │ Preview/Prod │
                  └─────────┬───┘  └───┬──────────┘
                            │          │
                            └────┬─────┘
                                 │
                    ┌────────────▼─────────────┐
                    │  APLICATIVO PRODUZIDO   │
                    └──────────────────────────┘
```

Essa distinção também resolve uma ambiguidade importante da descrição inicial: **o código da aplicação não deve ser “encaminhado para o Supabase” como se Supabase fosse uma cópia do GitHub**. O código-fonte e as migrations permanecem versionados no GitHub. O Supabase recebe e executa as mudanças de banco, funções, configurações e dados que pertencem ao backend. A integração oficial da Supabase com GitHub já segue exatamente esse princípio: observa commits, branches e PRs; lê as migrations do repositório; cria branches correspondentes e pode aplicar mudanças em produção quando a branch principal é atualizada. citeturn16search1

## Os três motores de agentes e como integrá-los

### Google Antigravity

O Antigravity de 2026 é particularmente interessante para sua proposta porque já não é apenas uma interface de desenvolvimento. Google documenta quatro superfícies: Antigravity 2.0, CLI, SDK e IDE. O Antigravity 2.0 trabalha com projetos, múltiplos workspaces e Git worktrees, pode controlar subagentes paralelos e executar tarefas assíncronas ou agendadas. O SDK oferece uma superfície Python para criar agentes sobre o mesmo harness. citeturn14search0turn14search6

Para nossa fábrica, a parte mais importante é o **Antigravity SDK**, não necessariamente a interface desktop. A classe de agente do SDK gerencia execução de ferramentas e ciclo de vida de sessões; há suporte documentado para ferramentas Python customizadas, políticas declarativas, aprovação humana, hooks, persistência, subagentes, saída estruturada e MCP. citeturn14search6

Antigravity também implementa MCP nas superfícies 2.0, CLI e IDE. Google descreve MCP como a ponte para ferramentas, bancos e APIs externas e cita explicitamente a capacidade de consultar um schema Supabase. Configurações podem existir por workspace em `.agents/mcp_config.json`, e o SDK pode carregar MCPs programaticamente. citeturn14search3

Isso faz dele um bom candidato para um **Antigravity Adapter** dentro do Orchestrator:

```text
Orchestrator
   ↓
Antigravity Adapter
   ↓
Antigravity SDK
   ↓
isolated workspace/worktree
   ↓
GitHub + MCP tools
```

O ponto a observar é que o GitHub hoje não lista Antigravity entre seus dois “third-party coding agents” nativos. Portanto, no desenho da fábrica, eu não criaria dependência de uma integração nativa GitHub↔Antigravity. Implementaria o Antigravity como um worker nosso usando SDK/CLI e GitHub API. citeturn14search2turn14search6

### Anthropic: Claude Code e Managed Agents

Há uma evolução importante na plataforma Anthropic que devemos aproveitar. **Claude Code** continua sendo o coding agent da Anthropic, mas a empresa agora também possui **Claude Managed Agents**, desenhado especificamente para aplicações que precisam administrar agentes autônomos com sessões, eventos e ambientes de execução. A própria documentação diferencia chamadas diretas à Claude API de Claude Code, Agent SDK e Managed Agents, que já fornecem loop do agente, execução de ferramentas e runtime. citeturn17search4

Claude Code possui, inclusive, uma API experimental de **Routines**. Uma rotina pode encapsular prompt, repositórios e conectores e ser disparada programaticamente, inclusive por GitHub Actions. O endpoint retorna quando a sessão é criada, permitindo depois acompanhar o trabalho no ambiente do Claude Code. Como essa API está explicitamente marcada como experimental, eu não a utilizaria como única camada estrutural do nosso sistema. citeturn18search4turn18search6

Para o núcleo programático de uma plataforma comercial, **Claude Managed Agents pode ser ainda mais interessante**. Um agente é uma configuração versionada que agrupa modelo, system prompt, ferramentas, servidores MCP e skills; sessões executam esses agentes em sandbox gerenciado pela Anthropic ou em ambiente self-hosted. citeturn18search3turn18search7

A documentação Anthropic já trata especificamente de GitHub: um repositório pode ser montado dentro de uma sessão e o GitHub MCP pode permitir criação de branches, commits e pull requests. citeturn18search8 Managed Agents também suporta orquestração multiagente interna, com agentes trabalhando em contextos separados e coordenação por um agente principal. citeturn17search9

Portanto, para Anthropic, nossa abstração deve suportar mais de um backend:

```text
ClaudeAdapter
 ├── Claude Code Routine
 ├── Claude Agent SDK / processo próprio
 └── Claude Managed Agents
```

Isso evita amarrar a plataforma a uma única superfície da Anthropic.

### OpenAI: Codex e Agents

No lado OpenAI, para o produto que você está imaginando, **Codex é a peça central, e não a interface convencional do ChatGPT**. A documentação atual do Codex SDK diz explicitamente que ele pode ser controlado programaticamente para CI/CD, ferramentas internas e integração com aplicações. O SDK pode iniciar, continuar e retomar threads e configurar diferentes níveis de sandbox, incluindo somente leitura e escrita limitada ao workspace. citeturn19search3

Há três caminhos complementares.

**Codex SDK** é adequado quando o nosso próprio worker executa o agente e queremos controle do workspace. Para scripts, jobs CI e automação pontual, a OpenAI também recomenda o uso de `codex exec`; para integração mais profunda no produto, existe Codex App Server. citeturn14search1turn19search10

**Agents SDK** é indicado quando queremos que nosso próprio aplicativo controle deployment, armazenamento, aprovações e ferramentas, deixando o SDK controlar loop e handoffs entre agentes. citeturn19search0turn19search7

**Agents API** é a alternativa gerenciada. A OpenAI executa o harness Codex, preserva sessões, gerencia compactação de contexto e recovery, enquanto nossa aplicação escolhe ferramentas e ambiente. O agente pode operar em sandbox, modificar arquivos, executar comandos, utilizar MCP e delegar para subagentes. citeturn19search1

Por isso eu desenharia o adaptador assim:

```text
OpenAIAdapter
 ├── Codex SDK           ← worker controlado por nós
 ├── Agents API          ← runtime gerenciado
 └── Agents SDK          ← orquestração customizada
```

Uma vantagem adicional da OpenAI no cenário GitHub é a autenticação por **Workload Identity Federation**: um job GitHub Actions pode trocar o OIDC emitido pelo GitHub por um token OpenAI de curta duração, eliminando a necessidade de armazenar uma API key OpenAI permanente em GitHub Secrets. citeturn14search4turn14search7 Anthropic atualmente oferece um padrão equivalente de WIF para GitHub Actions com tokens temporários. citeturn18search0turn18search2

### O ponto mais importante: padronizar o contrato, não os agentes

Não devemos tentar fazer os três fornecedores funcionarem de maneira idêntica internamente. Eles não funcionam.

Devemos criar um **Agent Adapter Contract**:

```text
run(task, workspace, policy)
resume(run, input)
interrupt(run)
getEvents(run)
getArtifacts(run)
getUsage(run)
```

Assim:

```text
                       AgentAdapter
                            │
            ┌───────────────┼───────────────┐
            │               │               │
    AntigravityAdapter ClaudeAdapter OpenAIAdapter
            │               │               │
       Google SDK      Claude Runtime      Codex
```

A fábrica fica independente dos detalhes de cada fornecedor. Isso é essencial porque Google, Anthropic e OpenAI atualmente oferecem runtimes, sandboxes, MCP e multiagente com capacidades semelhantes, mas contratos e ciclos de vida diferentes. citeturn14search6turn17search9turn19search1

Essa arquitetura também permite, futuramente, incluir Gemini CLI, GitHub Copilot Coding Agent, Cursor ou outro motor sem reconstruir a fábrica.

## GitHub como backbone do sistema

Sua intuição de colocar o GitHub no centro é correta, mas eu mudaria a expressão “GitHub ativa os três agentes” para:

> **GitHub é o ledger do trabalho de engenharia e um dos principais barramentos de eventos; o Orchestrator é quem decide qual agente deve trabalhar.**

Essa distinção é muito importante.

GitHub já fornece quase toda a infraestrutura de governança de software necessária: repositories, branches, pull requests, checks, webhooks, Actions e GitHub Apps. Uma GitHub App pode operar programaticamente sobre os repositórios e começa sem permissões; a própria GitHub recomenda solicitar apenas as permissões mínimas necessárias. A permissão `Contents` é necessária para acesso Git autenticado e `Workflows` é necessária quando o aplicativo precisa modificar arquivos em `.github/workflows`. citeturn15search2

Para a fábrica, eu criaria **uma GitHub App própria**, pertencente ao Control Plane. Ela não seria um dos agentes; seria a identidade da plataforma.

Ela cuidaria de:

```text
criação de repositórios
        ↓
configuração inicial
        ↓
recepção de webhooks
        ↓
branches / PRs
        ↓
checks
        ↓
merge
        ↓
deploy
```

O Orchestrator receberia eventos GitHub e os converteria em mudanças de estado.

Um fluxo típico seria:

```text
SPEC_APPROVED
      │
      ▼
TASK_QUEUED
      │
      ▼
AGENT_ASSIGNED
      │
      ▼
WORKSPACE_PROVISIONED
      │
      ▼
AGENT_RUNNING
      │
      ▼
COMMIT_CREATED
      │
      ▼
PR_OPENED
      │
      ▼
CI_RUNNING
  ┌───┴─────┐
  │         │
 FAIL      PASS
  │         │
 retry      ▼
       REVIEW_REQUIRED
             │
        ┌────┴─────┐
        │          │
     changes     approved
        │          │
        └──────► MERGE
                   │
                   ▼
                DEPLOY
```

### Um agente, um workspace isolado, uma branch

Este é provavelmente o princípio operacional mais importante de todo o projeto.

**Não devemos colocar Antigravity, Claude e Codex simultaneamente escrevendo sobre o mesmo checkout Git.**

Todos os três ecossistemas modernos caminham justamente na direção oposta: isolamento de execução. Antigravity trabalha nativamente com múltiplos workspaces e worktrees. citeturn14search0 Anthropic disponibiliza ambientes/sandboxes e chama atenção para isolamento de workloads e privilégios em ambientes self-hosted. citeturn17search6 Codex oferece sandboxes com diferentes permissões e a Agents API pode executar agentes dentro de ambientes isolados. citeturn19search1turn19search3

O padrão deveria ser:

```text
main
 │
 ├── task/184-antigravity-auth
 │       └── workspace A
 │
 ├── task/185-claude-dashboard
 │       └── workspace B
 │
 └── task/186-codex-tests
         └── workspace C
```

Eles podem trabalhar paralelamente **quando os escopos não colidem**.

Quando dois agentes precisam tratar do mesmo problema, o melhor padrão não é ambos modificarem os mesmos arquivos. É:

```text
Claude implementa
       ↓
PR
       ↓
Codex revisa
       ↓
findings
       ↓
Claude corrige
       ↓
Antigravity valida browser/E2E
```

ou:

```text
Agent A cria solução A
Agent B cria solução B
          ↓
   Judge / Reviewer
          ↓
   escolhe / combina
```

Isso transforma diversidade de modelos em vantagem e não em conflito de merge.

### GitHub Actions não deve virar o cérebro da fábrica

Actions é excelente para CI, checks, jobs curtos e automações previsíveis. GitHub já permite workflows reutilizáveis; em chamadas encadeadas, as permissões de `GITHUB_TOKEN` podem permanecer iguais ou ser reduzidas, mas não elevadas, o que é uma propriedade útil para padronizarmos pipelines entre centenas de aplicativos gerados. citeturn20search2

GitHub também está expandindo Actions para workflows agênticos, inclusive Claude Code, Codex e Gemini CLI. citeturn14search8

Mesmo assim, eu não faria do GitHub Actions o banco de estado do sistema.

Execuções agênticas longas exigem:

- leases;
- retries;
- budgets;
- timeouts;
- dependências;
- cancelamento;
- dead-letter;
- prioridades;
- observabilidade;
- aprovação humana;
- controle de concorrência.

Esse estado deve permanecer no nosso Orchestrator/Supabase.

Actions executa trabalho. **Supabase registra o estado. Orchestrator decide o próximo passo.**

### Estrutura padrão do repositório gerado

Eu recomendo que todos os aplicativos criados pela fábrica nasçam a partir de um **Golden Repository Template**.

Algo próximo a:

```text
/
├── app/
├── components/
├── lib/
├── tests/
├── supabase/
│   ├── migrations/
│   ├── functions/
│   └── config.toml
│
├── docs/
│   ├── architecture.md
│   ├── product-spec.md
│   ├── data-model.md
│   └── engineering-standards.md
│
├── .agents/
│   └── mcp_config.json
│
├── .github/
│   └── workflows/
│
├── AGENTS.md
├── CLAUDE.md
└── README.md
```

Mas eu evitaria duplicar as regras completas do projeto em três arquivos diferentes. Manteria uma constituição canônica, por exemplo:

```text
/docs/engineering-standards.md
/docs/product-spec.md
/docs/architecture.md
```

e deixaria `AGENTS.md`, `CLAUDE.md` e os arquivos específicos do Antigravity funcionarem como adaptadores curtos para esses documentos. Isso reduz divergência entre instruções dos diferentes motores.

## Supabase e Vercel como infraestrutura da fábrica de aplicativos

Aqui existe uma oportunidade muito maior do que simplesmente “conectar banco e deploy”.

### Supabase pode ser o cérebro operacional da fábrica

A própria documentação Supabase possui atualmente uma seção chamada **Supabase for Platforms**, cujo caso de uso é praticamente o seu: utilizar Supabase programaticamente como infraestrutura de uma plataforma própria, inclusive para AI builders. A Management API permite criar e administrar projetos, e a documentação recomenda utilizar branches de desenvolvimento para mudanças seguras. citeturn16search0turn16search4

Portanto, temos potencialmente **dois níveis diferentes de Supabase**.

O primeiro:

```text
Factory Supabase
```

É o banco da própria fábrica.

Ele armazenaria entidades como:

| Entidade | Função |
|---|---|
| `users` | usuários da plataforma |
| `organizations` | clientes/equipes |
| `apps` | aplicativos sendo construídos |
| `app_specs` | requisitos e especificações |
| `repositories` | vínculos GitHub |
| `tasks` | unidades de trabalho |
| `task_dependencies` | DAG de dependências |
| `agent_profiles` | configuração dos motores |
| `runs` | uma execução de agente |
| `run_events` | eventos gerados durante execução |
| `artifacts` | planos, relatórios, patches |
| `pull_requests` | PR correspondente |
| `approvals` | decisões humanas |
| `evaluations` | scores dos agentes |
| `deployments` | previews/produção |
| `usage` | tokens, tempo e custos |
| `audit_events` | auditoria |
| `secret_refs` | referências para credenciais |

Isso é recomendação arquitetural nossa, mas aproveita diretamente as capacidades de estado persistente, APIs, Auth e filas da plataforma. Supabase Queues expõe operações de filas persistentes no Postgres com mecanismos de visibilidade e consumo que são úteis para o worker pool. citeturn15search8

O segundo nível:

```text
Generated App Supabase
```

Cada aplicativo produzido pode receber seu próprio projeto Supabase.

A Management API permite criar projetos programaticamente. citeturn16search4 Supabase recomenda esse modelo explicitamente para plataformas que desejam oferecer Database, Auth, Storage, Realtime e Functions aos seus usuários. citeturn16search0

O provisionamento então seria:

```text
Create App
   │
   ├── create GitHub repository
   │
   ├── create Supabase project
   │
   ├── create Vercel project
   │
   ├── connect GitHub → Supabase
   │
   ├── connect GitHub → Vercel
   │
   └── register all IDs in Factory DB
```

Isso é, literalmente, uma **API de criação de aplicativos completos**.

### Branch de código + branch de banco + preview do aplicativo

Uma das combinações mais fortes encontradas na pesquisa é:

```text
Git branch
   +
Supabase preview branch
   +
Vercel preview deployment
```

Supabase Branching cria ambientes separados para testar schema, configurações e funções. Preview branches são efêmeras e podem ser removidas quando o PR é fechado ou merged; por padrão, os novos ambientes não recebem os dados de produção, justamente para proteger informações sensíveis. citeturn16search3

A integração oficial Supabase/GitHub consegue acompanhar branches e PRs e criar o branch Supabase correspondente. Quando o código é enviado à branch de produção, migrations e funções podem ser implantadas no ambiente principal. citeturn16search1

Existe inclusive uma integração específica Supabase↔Vercel que sincroniza a branch do hosting com a branch Supabase correspondente e injeta as variáveis corretas no preview Vercel. citeturn16search9

Isso permite que cada pull request criado por um agente resulte em:

```text
PR #421
│
├── Código isolado
│      github: feature/task-421
│
├── Banco isolado
│      supabase: preview-task-421
│
└── Aplicação isolada
       vercel: preview URL
```

Esse ambiente é extremamente poderoso porque o agente revisor ou um ser humano consegue testar uma aplicação real sem tocar em produção.

### Vercel pode ser provisionado automaticamente

Vercel não precisa ser configurado manualmente para cada aplicativo. A REST API atualmente permite criar um projeto via `POST /v11/projects`, e o payload aceita diretamente um `gitRepository` com `type: github`. citeturn21search0

Portanto, nosso provisioning service pode fazer:

```text
POST GitHub repository
        ↓
POST Supabase project
        ↓
POST Vercel project
   gitRepository:
      type: github
      repo: ...
```

Depois de ligado ao GitHub, o fluxo Git normal do Vercel gera preview deployments para branches e produção quando mudanças chegam à branch configurada como produção. citeturn15search9

Isso completa exatamente o ciclo que você imaginou:

```text
         IDEIA
           │
           ▼
        FACTORY
           │
           ▼
      AGENT TEAMS
           │
           ▼
         GitHub
       branch / PR
          │    │
          │    └─────────────┐
          ▼                  ▼
   Supabase Preview      Vercel Preview
          │                  │
          └────────┬─────────┘
                   ▼
                 TESTS
                   │
                 REVIEW
                   │
                  MERGE
                   │
          ┌────────┴────────┐
          ▼                 ▼
  Supabase Production  Vercel Production
          │                 │
          └────────┬────────┘
                   ▼
             APP PUBLICADO
```

### Edge Functions não devem executar os agentes pesados

Supabase Edge Functions são muito boas para receber webhooks GitHub/Vercel, autenticar solicitações e iniciar operações. A própria documentação, porém, recomenda operações curtas e idempotentes e direciona workloads pesados ou long-running para background workers. citeturn15search0

Então:

```text
GitHub webhook
     ↓
Supabase Edge Function
     ↓
validate + normalize event
     ↓
insert event/task
     ↓
Queue
     ↓
Worker
     ↓
Agent
```

e não:

```text
GitHub webhook
     ↓
Edge Function
     ↓
Claude por 45 minutos
```

Esse detalhe arquitetural evitará uma classe inteira de problemas futuros.

## A metodologia de orquestração que eu recomendaria

O ponto mais sofisticado de todo o projeto não é conectar APIs. É decidir **como agentes colaboram sem transformar o sistema em um swarm imprevisível**.

Minha recomendação inicial é usar o padrão:

> **Supervisor determinístico + especialistas probabilísticos + contratos de artefatos.**

Isto é:

```text
             ORCHESTRATOR
           determinístico
                 │
      ┌──────────┼───────────┐
      ▼          ▼           ▼
   Planner    Builder     Reviewer
      │          │           │
   Agent X    Agent Y      Agent Z
      │          │           │
      └──── artifacts ───────┘
```

O Orchestrator não “pensa” como o LLM. Ele controla estado.

Os agentes pensam, planejam, codificam e revisam.

### Um contrato de tarefa universal

Cada agente deve receber aproximadamente o mesmo envelope lógico:

```json
{
  "app_id": "...",
  "task_id": "...",
  "run_id": "...",
  "base_sha": "...",
  "branch": "...",
  "objective": "...",
  "acceptance_criteria": [],
  "allowed_paths": [],
  "forbidden_paths": [],
  "required_tests": [],
  "budget": {},
  "tools": [],
  "dependencies": [],
  "expected_artifacts": []
}
```

Isso separa a **intenção do Orchestrator** do **prompt específico do fornecedor**.

Depois:

```text
Generic Task
     │
     ├── Antigravity Prompt Adapter
     ├── Claude Prompt Adapter
     └── Codex Prompt Adapter
```

Essa camada é provavelmente uma das abstrações mais importantes que construiremos.

### Estado formal, e não conversa infinita

O lifecycle deve ser uma state machine persistente.

Por exemplo:

```text
created
   ↓
planned
   ↓
queued
   ↓
leased
   ↓
running
   ↓
artifact_ready
   ↓
pr_open
   ↓
checks_running
   ├──── failed ────► repair
   │                    │
   │                    └──► checks_running
   ▼
review
   ├──── rejected ──► repair
   ▼
approved
   ↓
merged
   ↓
deploying
   ↓
verifying
   ↓
completed
```

Uma execução não deve existir apenas porque “um agente está conversando”. Deve sempre haver um registro persistente de:

```text
qual agente
qual versão
qual modelo
qual tarefa
qual SHA inicial
qual workspace
qual branch
quando começou
quando terminou
quantos tokens
quanto custou
quais ferramentas usou
quais arquivos modificou
qual PR criou
qual teste passou
quem aprovou
```

A existência de sessões e eventos persistentes nos runtimes modernos reforça a viabilidade dessa abordagem: OpenAI Agents API é explicitamente baseada em agentes, ambientes, sessões e eventos, enquanto Claude Managed Agents também representa sessões como execuções persistentes e disponibiliza streams de eventos. citeturn19search1turn18search3

### Não deixar agentes chamarem uns aos outros livremente no início

Antigravity suporta subagentes. citeturn14search0turn14search6 Claude Managed Agents suporta coordenação multiagente. citeturn17search9 OpenAI Agents API e SDK suportam delegação e handoffs. citeturn19search0turn19search1

Portanto, seria tecnicamente possível criar imediatamente:

```text
Claude → chama Codex → chama Antigravity → chama Claude → ...
```

Eu **não faria isso na primeira arquitetura**.

Isso cria dificuldade de:

- auditoria;
- custos;
- cancelamento;
- controle de profundidade;
- ownership do código;
- permissões;
- depuração;
- avaliação.

Na primeira geração, faria:

```text
Orchestrator → Agent A
Agent A → artifact

Orchestrator → Agent B + artifact
Agent B → artifact

Orchestrator → Agent C + artifacts
Agent C → verdict
```

Ou seja: **handoffs explícitos por artefatos persistidos**, e não conversas invisíveis entre modelos.

Depois que tivermos telemetria e avaliações suficientes, podemos permitir subárvores autônomas controladas.

### Roteamento inteligente dos três motores

Não existe razão técnica para sempre executar os três agentes na mesma tarefa.

Isso multiplicaria custo e poderia diminuir confiabilidade.

Devemos construir um **Agent Router**.

Inicialmente pode ser determinístico:

| Tipo de tarefa | Estratégia inicial |
|---|---|
| arquitetura | Antigravity ou Claude + revisão cruzada |
| implementação extensa | Claude/Codex |
| bug localizado | Codex/Claude |
| review de código | modelo diferente do autor |
| browser/E2E | agente com tooling de browser |
| banco/migration | agente especializado + review obrigatório |
| security | agente separado, read-only |
| documentação | modelo de menor custo |
| decisão crítica | dois agentes + judge |

Não considero essa divisão fixa: deve ser validada empiricamente. A própria GitHub permite selecionar modelos diferentes para coding agents e reconhece que modelos podem produzir resultados diferentes conforme a tarefa. citeturn14search2

A longo prazo, o router deveria aprender com nossas próprias avaliações:

```text
task features
    ↓
routing model
    ↓
historical score
cost
latency
success rate
regression rate
    ↓
best agent/model
```

Esse banco de desempenho será um ativo estratégico da plataforma: a fábrica começará a aprender **qual motor programa melhor qual tipo de tarefa**.

### Cross-model review como diferencial

Uma oportunidade particularmente boa é impedir que o mesmo modelo seja autor e juiz final do próprio trabalho.

Exemplo:

```text
Claude escreve
    ↓
Codex revisa
    ↓
Antigravity executa validação
```

ou:

```text
Codex escreve
    ↓
Claude security review
    ↓
test suite determinística
```

Isso reduz correlação entre erros.

O resultado final não depende da opinião de um único agente, porque continua existindo a camada determinística:

```text
AI review
+
lint
+
typecheck
+
unit tests
+
integration tests
+
E2E
+
security checks
+
migration checks
=
merge gate
```

GitHub já aplica verificações de segurança específicas aos coding agents nativos, incluindo CodeQL, secret scanning e avaliação de dependências introduzidas. citeturn14search2 Nossa plataforma pode ampliar isso com checks próprios.

### MCP como barramento comum de ferramentas

MCP é provavelmente o padrão de integração mais importante para evitar três implementações completamente diferentes.

A especificação define uma arquitetura de host/client/server, usa JSON-RPC e permite que servidores forneçam **resources, prompts e tools**. A especificação de 2026 também inclui extensões opcionais para tarefas assíncronas, skills e aplicações MCP. citeturn15search3

Antigravity suporta MCP. citeturn14search3 Claude Managed Agents suporta servidores MCP. citeturn17search5 OpenAI Agents API suporta MCP. citeturn19search1

Portanto, podemos construir uma camada:

```text
              MCP TOOL LAYER

        ┌──────────┬──────────┬───────────┐
        │          │          │           │
      GitHub    Supabase    Vercel     Internal
        MCP        MCP        MCP          MCP
        │          │          │           │
        └──────────┴──────────┴───────────┘
                         │
       ┌─────────────────┼─────────────────┐
       ▼                 ▼                 ▼
  Antigravity          Claude            Codex
```

Isso permite que um comando lógico como:

```text
get_database_schema()
```

ou

```text
get_deployment_logs()
```

tenha o mesmo significado para diferentes agentes.

Mas há uma distinção fundamental:

> **MCP deve padronizar acesso às ferramentas. MCP não deve ser o Orchestrator.**

A especificação MCP organiza ferramentas, recursos e comunicação; nossa plataforma ainda precisa controlar tarefas, prioridades, locks, retries, políticas, custos e estado global. Essa separação é uma inferência arquitetural baseada no escopo do próprio protocolo. citeturn15search3

## Segurança, concorrência e governança

Uma fábrica autônoma de software possui um risco muito maior do que um chatbot comum porque seus agentes conseguem:

```text
ler código
escrever código
executar shell
instalar dependências
usar rede
consultar banco
criar PR
alterar migrations
disparar deploy
```

Logo, segurança precisa fazer parte da arquitetura inicial.

### Princípio de privilégio mínimo

Cada execução deve receber somente a permissão necessária.

GitHub Apps não recebem permissões por padrão, e GitHub recomenda escolher o conjunto mínimo necessário. citeturn15search2 Claude Managed Agents possui políticas que permitem permitir, negar ou solicitar confirmação antes de chamadas de ferramentas/MCP. citeturn17search2 Antigravity SDK fornece políticas declarativas e approval flows. citeturn14search6 Codex oferece níveis de sandbox diferentes, desde read-only até full access. citeturn19search3

Portanto, um agente revisor deveria operar, por exemplo:

```text
filesystem: read_only
github: read PR
database: schema read
vercel: logs read
production: denied
```

enquanto um implementador:

```text
filesystem: workspace_write
github: branch write
database preview: migration
vercel preview: read
production: denied
```

Somente o Deployment Service teria capacidade de produção.

### Produção não deve estar diretamente disponível aos coding agents

Minha recomendação é uma regra absoluta:

```text
CODING AGENT
      X
PRODUCTION CREDENTIALS
```

O agente produz mudanças declarativas:

```text
migration.sql
config
code
infra config
```

GitHub registra a mudança.

Checks aprovam.

Humano ou política de release autoriza.

Deployment Service aplica.

Isso preserva um caminho auditável.

### Cuidado especial com GitHub Actions

GitHub alerta explicitamente contra rodar código de PR não confiável em contexto privilegiado de `pull_request_target`, especialmente quando há secrets ou um token com escrita disponível. O padrão pode resultar no conhecido ataque “pwn request”. GitHub recomenda isolamento e execução efêmera quando código não confiável estiver envolvido. citeturn20search3turn20search7

Isso tem implicação direta para nossa plataforma: **código gerado por agente deve ser considerado não confiável até passar pelos gates**, mesmo que o agente tenha sido criado por nós.

Portanto:

```text
agent code
    ↓
untrusted
    ↓
ephemeral sandbox
    ↓
tests
    ↓
security
    ↓
review
    ↓
trusted enough to merge
```

### Release separado do merge

Outra boa inovação é não tratar “merge em main” como sinônimo imediato de “tráfego de produção”.

Vercel possui **Deployment Checks** que podem segurar uma produção pronta até que condições necessárias sejam satisfeitas, incluindo resultados provenientes de GitHub Actions. citeturn20search1turn20search5

O pipeline ideal fica:

```text
PR checks
   ↓
merge
   ↓
production build
   ↓
post-build checks
   ↓
deployment approval
   ↓
domain promotion
```

Isso cria duas barreiras diferentes:

```text
"Pode entrar no código?"
         ≠
"Pode receber usuários?"
```

Para uma fábrica autônoma isso é significativamente mais seguro.

### Identidade curta em vez de secrets permanentes

OpenAI e Anthropic já documentam integração GitHub Actions via Workload Identity Federation/OIDC, permitindo trocar a identidade GitHub por tokens temporários em vez de armazenar API keys permanentes no repositório. citeturn14search7turn18search0

Onde esse modelo estiver disponível, ele deve ser preferido.

A arquitetura de credenciais deveria seguir:

```text
Factory Secret Manager
        │
        ├─ refs / service credentials
        │
        └─ dynamic credentials
                  │
                OIDC
                  │
        short-lived token
                  │
               Worker
```

e jamais:

```text
.env
OPENAI_MASTER_KEY=...
ANTHROPIC_MASTER_KEY=...
SUPABASE_OWNER_KEY=...
VERCEL_OWNER_TOKEN=...
```

copiado para todos os projetos.

### Idempotência e entrega de eventos

Quando GitHub, Vercel, Supabase e os três runtimes começam a emitir eventos, duplicações e eventos fora de ordem são inevitáveis em sistemas distribuídos.

O Orchestrator deve trabalhar com IDs internos e operações idempotentes:

```text
event received
     ↓
deduplication
     ↓
state transition valid?
 ┌───┴────┐
 no      yes
 │        │
ignore   apply
          │
        enqueue
```

E uma task precisa possuir **lease**, não simplesmente “status running”:

```text
task
  lease_owner = worker-17
  lease_expires_at = ...
```

Se o worker morrer:

```text
lease expires
     ↓
task becomes eligible
     ↓
another worker resumes/retries
```

Esse padrão combina bem com filas persistentes do Supabase e com runtimes de agentes que suportam sessões duráveis ou retomáveis. citeturn15search8turn19search1

## Arquitetura de referência e estratégia recomendada

Depois de analisar as capacidades atuais das plataformas, eu estruturaria o projeto em uma arquitetura de referência como esta:

```text
┌──────────────────────────────────────────────────────────────┐
│                     FACTORY CONTROL UI                       │
│                         Vercel                               │
│                                                              │
│ Project • Spec • Tasks • Agents • Runs • PRs • Deployments │
└─────────────────────────────┬────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                      ORCHESTRATOR API                        │
│                                                              │
│ Planner                                                      │
│ Task DAG                                                     │
│ Agent Router                                                 │
│ Policy Engine                                                │
│ Approval Engine                                              │
│ Budget Manager                                               │
│ Event Processor                                              │
└───────────────┬──────────────────────┬───────────────────────┘
                │                      │
                ▼                      ▼
┌────────────────────────┐   ┌───────────────────────────────┐
│ FACTORY SUPABASE       │   │     WORK QUEUES             │
│                        │   │                               │
│ apps                   │   │ planning                     │
│ specs                  │   │ coding                       │
│ tasks                  │   │ review                       │
│ runs                   │   │ testing                      │
│ artifacts              │   │ deployment                   │
│ approvals              │   │ dead-letter                  │
│ evaluations            │   │                               │
│ deployments            │   └─────────────┬─────────────────┘
│ audit                   │                 │
└────────────────────────┘                 ▼
                              ┌──────────────────────────────┐
                              │       WORKER POOL            │
                              │                              │
                              │ Antigravity Worker           │
                              │ Claude Worker                │
                              │ OpenAI Worker                │
                              └──────────────┬───────────────┘
                                             │
                              ephemeral workspace/worktree
                                             │
                                             ▼
                              ┌──────────────────────────────┐
                              │          GITHUB              │
                              │                              │
                              │ repo                         │
                              │ branch                       │
                              │ commit                       │
                              │ PR                           │
                              │ Actions                      │
                              │ checks                       │
                              └──────┬───────────────┬───────┘
                                     │               │
                                     ▼               ▼
                          ┌──────────────────┐ ┌───────────────┐
                          │ SUPABASE APP     │ │ VERCEL APP    │
                          │                  │ │               │
                          │ preview branch   │ │ preview       │
                          │ production DB    │ │ production    │
                          └──────────────────┘ └───────────────┘
```

Essa arquitetura aproveita exatamente as capacidades que as plataformas já oferecem: Supabase pode ser operado programaticamente como infraestrutura de plataforma; GitHub fornece Apps, workflows e agentes; Vercel permite criação programática de projetos vinculados ao GitHub; e os três fornecedores de modelos já expõem runtimes programáticos. citeturn16search0turn15search2turn21search0turn14search6turn18search3turn19search1

### Fluxo completo de criação de um aplicativo

No desenho final, uma solicitação poderia percorrer algo como:

```text
Usuário:
"Quero um sistema de gestão de clínicas."
                  │
                  ▼
            PRODUCT INTAKE
                  │
                  ▼
            SPEC GENERATOR
                  │
                  ▼
        architecture proposal
                  │
                  ▼
           HUMAN APPROVAL
                  │
                  ▼
        FACTORY PROVISIONER
         │        │        │
         ▼        ▼        ▼
      GitHub   Supabase   Vercel
       repo     project    project
         │        │        │
         └────────┼────────┘
                  ▼
             TASK GRAPH
                  │
     ┌────────────┼───────────────┐
     ▼            ▼               ▼
 architecture   backend         frontend
     │            │               │
 Antigravity    Claude          Codex
     │            │               │
     └─────── PRs / artifacts ────┘
                  │
                  ▼
              CI / QA
                  │
      ┌───────────┼────────────┐
      ▼           ▼            ▼
  unit tests  integration   security
                  │
                  ▼
        cross-model review
                  │
                  ▼
             PREVIEW APP
       Vercel + Supabase branch
                  │
                  ▼
         acceptance / approval
                  │
                  ▼
               MERGE
                  │
                  ▼
       production deployment
                  │
                  ▼
          verification agent
                  │
                  ▼
            APP COMPLETO
```

### O que eu não faria

Eu não construiria um “chat com três agentes”, porque isso produziria uma interface interessante, mas não uma fábrica confiável.

Também não faria:

```text
Prompt
 ↓
Claude + GPT + Antigravity
 ↓
todos editam main
 ↓
Vercel publica
```

Isso elimina isolamento, provenance, rollback e responsabilidade.

Também não colocaria todo o sistema dentro de GitHub Actions. GitHub é excelente para delivery e checks, mas o produto precisa de um workflow engine durável separado.

Também não criaria integração ponto a ponto:

```text
Claude ↔ Codex
Claude ↔ Antigravity
Codex ↔ Antigravity
Claude ↔ GitHub
Claude ↔ Supabase
...
```

A quantidade de acoplamentos explodiria.

O desenho deve ser:

```text
               CONTRACTS
                   │
        ┌──────────┼───────────┐
        ▼          ▼           ▼
      Agent      Tool       Event
     Adapter    Adapter      Bus
```

e todos os fornecedores conectados nesses contratos.

### Estratégia de evolução

A metodologia mais segura é aumentar a autonomia gradualmente.

**Fundação:** Control Plane, Supabase central, GitHub App, template de aplicação, criação programática de Supabase/Vercel, filas, task engine e um único motor de agente funcionando ponta a ponta.

**Multiagente:** introdução dos três adapters — Antigravity, Claude e OpenAI — mantendo exatamente o mesmo contrato de tarefa e artefatos.

**Colaboração:** cross-model review, tarefas paralelas em worktrees, Agent Router, políticas automáticas de revisão e reparo.

**Autonomia:** planejamento automático, DAG dinâmico, auto-repair de CI, seleção de agente por performance, verificação de previews e deployment controlado.

**Escala:** multi-tenant, quotas, billing, budgets, rate limiting, pools de workers, analytics e comparação quantitativa entre motores.

Não recomendaria começar pelo nível de autonomia máximo. Os produtos de Anthropic, OpenAI, Google e GitHub já conseguem executar subagentes e trabalho assíncrono, mas isso aumenta drasticamente o espaço de estados possíveis. citeturn14search0turn17search9turn19search1turn14search8 Primeiro devemos construir governança; depois aumentar autonomia.

### Decisão arquitetural final

Com o que existe em setembro de 2026, eu consideraria **alta a viabilidade técnica** do projeto. Essa é uma inferência baseada na convergência atual das APIs: Google fornece um SDK programático do Antigravity; Anthropic fornece Claude Code e Managed Agents; OpenAI fornece Codex SDK, Agents SDK e Agents API; GitHub oferece APIs, Apps, Actions e integrações nativas com agentes; Supabase pode ser administrado como plataforma; e Vercel pode receber projetos GitHub e deployments por API. citeturn14search6turn18search3turn19search1turn15search2turn16search0turn21search0

O maior desafio **não é fazer Claude conversar com GPT e Antigravity**.

O desafio real é construir corretamente:

```text
                 AI SOFTWARE FACTORY

            ┌──────────────────────┐
            │   CONTROL PLANE      │
            │                      │
            │ state                │
            │ policies             │
            │ tasks                │
            │ budgets              │
            │ evaluation           │
            └──────────┬───────────┘
                       │
                       ▼
            ┌──────────────────────┐
            │    ORCHESTRATOR      │
            │                      │
            │ deterministic        │
            │ auditable            │
            │ recoverable          │
            └──────────┬───────────┘
                       │
             ┌─────────┼──────────┐
             ▼         ▼          ▼
        Antigravity  Claude     OpenAI
             │         │          │
             └─────────┼──────────┘
                       ▼
                    GitHub
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
         Supabase              Vercel
             │                   │
             └─────────┬─────────┘
                       ▼
                GENERATED APP
```

A **fonte da verdade do código** deve ser o GitHub.

A **fonte da verdade do workflow** deve ser o Supabase/Orchestrator.

A **unidade fundamental de colaboração** deve ser a tarefa, o branch, o PR e o artefato — não a conversa entre bots.

A **unidade fundamental de isolamento** deve ser um workspace/worktree/sandbox por execução.

A **unidade fundamental de confiança** deve ser evidência: testes, checks, avaliações, diff, preview e aprovação.

A **camada de interoperabilidade de ferramentas** deve ser MCP sempre que fizer sentido, já que Google Antigravity, Anthropic e OpenAI atualmente suportam esse protocolo. citeturn14search3turn17search5turn19search1turn15search3

E a decisão mais importante é que **nenhum dos três agentes seja o dono da fábrica**. Antigravity, Claude e Codex devem ser workers substituíveis de um sistema superior, governado pelo nosso próprio Orchestrator. Essa é a arquitetura que transforma a proposta de “três IAs programando juntas” em uma plataforma capaz de produzir aplicativos de forma repetível, observável, segura e, progressivamente, autônoma.
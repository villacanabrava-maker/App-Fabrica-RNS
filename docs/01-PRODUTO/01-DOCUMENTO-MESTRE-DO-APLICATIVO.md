# DOCUMENTO MESTRE — Fábrica Apps RNS

**O documento mãe. Explica o aplicativo inteiro: o que é, para que serve, como funciona, do que é feito e como tudo se conecta.**

Versão 1.0 · 20 de setembro de 2026 · Autoridade: máxima dentro de `01-PRODUTO/`, subordinada apenas à Constituição em `06-INTELIGENCIA-DOS-AGENTES/01-CONSTITUICAO.md`.

---

## PARTE I — O QUE ESTAMOS CONSTRUINDO

### 1. Definição oficial

> **A Fábrica Apps RNS é um Control Plane de engenharia de software no qual um Orchestrator determinístico coordena agentes de IA versionados que executam trabalho isolado sobre o GitHub; o Factory Supabase mantém estado, filas, evidências, avaliações e governança; Vercel e Supabase fornecem previews e runtime aos produtos gerados; OpenAI e Claude realizam implementação e revisão cruzada por um protocolo formal de quatro passagens; e o humano, operando Antigravity localmente, mantém autoridade final sobre planos, etapas críticas e releases.**

Em linguagem comum: **é uma fábrica. Entra uma ideia, sai um aplicativo publicado — e cada passo entre os dois é rastreável, revisado e aprovado.**

### 2. O problema que ela resolve

Hoje, construir software com IA tem quatro falhas estruturais:

| Falha | O que acontece na prática |
|---|---|
| **Conversa como arquitetura** | O estado do trabalho vive em um chat. Fecha a aba, perde tudo. |
| **Loop infinito entre modelos** | GPT e Claude negociam indefinidamente sem conclusão nem custo controlado. |
| **Concorrência destrutiva** | Dois agentes editando o mesmo checkout produzem conflitos e código incoerente. |
| **Autonomia sem governança** | Um modelo diz "está pronto" e ninguém consegue provar que está. |

A Fábrica Apps RNS existe para eliminar as quatro. Ela substitui conversa por **estado persistente**, negociação infinita por **protocolo de quatro passagens**, checkout compartilhado por **um workspace isolado por execução**, e opinião de modelo por **evidência verificável mais aprovação humana**.

### 3. O que ela NÃO é

- Não é um chat com três IAs.
- Não é um wrapper de prompt.
- Não é um clone do dashboard do GitHub, do Supabase ou do Vercel.
- Não é um sistema onde a IA aprova o próprio trabalho.
- Não é dependente de nenhum fornecedor específico de modelo.

### 4. Para quem é

| Persona | Necessidade | Como o produto atende |
|---|---|---|
| **Operador / Proprietário (Roberth)** | Transformar ideias em aplicativos reais sem virar gargalo técnico | Descreve a ideia, aprova planos e etapas, acompanha a linha de produção |
| **Programador humano** | Entender, auditar e intervir no que os agentes fizeram | Vê diff, PR, preview, findings, divergências e evidências em um único lugar |
| **Agente construtor** | Saber exatamente o que fazer, com que permissão e que saída produzir | Recebe um Task Packet validado por schema, com paths permitidos e artefatos esperados |
| **Revisor de segurança** | Garantir que nada perigoso chegue à produção | Gates obrigatórios, RLS testada, CODEOWNERS, permissões por papel |

---

## PARTE II — COMO A FÁBRICA FUNCIONA

### 5. Os quatro planos do sistema

O aplicativo inteiro se organiza em quatro planos. Confundi-los é o erro arquitetural mais caro possível.

```
┌────────────────────────────────────────────────────────────────┐
│ 1. CONTROL PLANE                                               │
│    O aplicativo web. Next.js no Vercel.                        │
│    Observa, explica e COMANDA. Nunca executa agente.           │
└──────────────────────────┬─────────────────────────────────────┘
                           │ comandos de domínio
                           ▼
┌────────────────────────────────────────────────────────────────┐
│ 2. ORCHESTRATION PLANE                                         │
│    Orchestrator determinístico + Factory Supabase.             │
│    Estado, filas, leases, políticas, budgets, gates, auditoria.│
└──────────────────────────┬─────────────────────────────────────┘
                           │ Task Packets
                           ▼
┌────────────────────────────────────────────────────────────────┐
│ 3. AGENT EXECUTION PLANE                                       │
│    Workers externos. OpenAI Adapter, Claude Adapter,           │
│    Antigravity Handoff. Um workspace isolado por execução.     │
└──────────────────────────┬─────────────────────────────────────┘
                           │ commits, PRs, artefatos
                           ▼
┌────────────────────────────────────────────────────────────────┐
│ 4. DELIVERY & RUNTIME PLANE                                    │
│    GitHub (ledger) → Supabase Preview + Vercel Preview         │
│    → gates → Supabase Prod + Vercel Prod → APP PUBLICADO       │
└────────────────────────────────────────────────────────────────┘
```

### 6. Diagrama integrado completo

```
                         ROBERTH (humano)
                               │
                    ┌──────────┴──────────┐
                    │                     │
            ANTIGRAVITY LOCAL      CONTROL PLANE WEB
            planejamento           9 páginas, Next.js/Vercel
            aprovação final        Início · Projetos · Agentes
            verificação browser    Orquestração · Base de Conhecimento
                    │              Templates · Integrações
                    │              Monitoramento · Configurações
                    │                     │
                    │  RNS Local Bridge   │  comandos de domínio
                    │  (outbound)         │
                    └──────────┬──────────┘
                               ▼
                   ╔═══════════════════════╗
                   ║   RNS ORCHESTRATOR    ║
                   ║   determinístico      ║
                   ║                       ║
                   ║ state machine · DAG   ║
                   ║ agent router          ║
                   ║ dual-pass review      ║
                   ║ policy engine         ║
                   ║ approval engine       ║
                   ║ budget manager        ║
                   ║ event processor       ║
                   ╚═══╤═══════════════╤═══╝
                       │               │
          ┌────────────▼───┐   ┌───────▼─────────────┐
          │ FACTORY        │   │ DURABLE EXECUTION   │
          │ SUPABASE       │   │ filas + leases      │
          │                │   │ retries · waits     │
          │ state · queues │   │ concurrency         │
          │ runs · events  │   │ idempotency         │
          │ reviews        │   └───────┬─────────────┘
          │ findings       │           │
          │ evidence       │   ┌───────┼────────┬──────────────┐
          │ approvals      │   ▼       ▼        ▼              ▼
          │ usage · audit  │ OpenAI  Claude  Antigravity   Deterministic
          └────────────────┘ Worker  Worker  Handoff       Worker (CI)
                               │       │        │              │
                               └───────┴────┬───┴──────────────┘
                                            ▼
                              ╔═════════════════════════╗
                              ║        GITHUB           ║
                              ║  ledger da engenharia   ║
                              ║                         ║
                              ║ repos · branches        ║
                              ║ commits · PRs           ║
                              ║ Actions · checks        ║
                              ║ rulesets · CODEOWNERS   ║
                              ║ factory-intelligence/   ║
                              ╚═══╤═════════════════╤═══╝
                                  │                 │
                    ┌─────────────▼───┐     ┌───────▼──────────┐
                    │ SUPABASE APP    │     │  VERCEL APP      │
                    │ preview branch  │◄───►│  preview deploy  │
                    │ production DB   │     │  production      │
                    └─────────────┬───┘     └───────┬──────────┘
                                  └────────┬────────┘
                                           ▼
                                  ┌─────────────────┐
                                  │  APP PRODUZIDO  │
                                  └─────────────────┘
```

### 7. O ciclo de vida de um aplicativo, do começo ao fim

```
 1. IDEIA
    Roberth escreve no Control Plane, página Projetos → Novo Projeto.
    Wizard de 5 passos: Ideia → Planejamento → Revisão → Implementação → Publicação.
          ↓
 2. ESPECIFICAÇÃO
    A fábrica (R1 + R3) transforma a ideia em product spec versionada.
    Humano aprova a spec.
          ↓
 3. PLANO
    Antigravity (com Roberth) ou R1 produz o Plano v1.
    Vira um Plan PR no GitHub.
          ↓
 4. REVISÃO DUPLA DO PLANO
    OpenAI R1 → Claude R1 → OpenAI R2 → Claude R2.
    Exatamente quatro passagens. Nunca mais.
    Divergências ficam registradas, não escondidas.
          ↓
 5. HUMAN GATE
    Roberth vê a Câmara de Revisão no Control Plane.
    Aprova, pede revisão ou rejeita. Assinatura lógica gravada.
          ↓
 6. PROVISIONAMENTO
    Criação automática de:
      · repositório GitHub
      · projeto Supabase
      · projeto Vercel ligado ao repositório
    Todos os IDs registrados no Factory Supabase.
          ↓
 7. DAG DE TAREFAS
    O plano aprovado vira missões → etapas → tarefas com dependências.
          ↓
 8. EXECUÇÃO DE CADA ETAPA
    Para cada etapa:
      a) R4 Builder implementa em worktree isolado, branch própria
      b) Revisor (modelo diferente do autor) faz R1 de código
      c) Builder repara
      d) Revisor faz R2 e conclui
      e) CI determinístico roda (lint, types, testes, security)
      f) Supabase Preview + Vercel Preview nascem
      g) R8 verifica no navegador
      h) R9 consolida evidências
      i) Human gate aprova a etapa
      j) merge
          ↓
 9. RELEASE (decisão SEPARADA do merge)
    production build → deployment checks → release approval
    → rolling release → 100% produção
          ↓
10. APP PUBLICADO
    Com trilha completa: quem decidiu o quê, quando, com qual evidência.
```

### 8. O protocolo de revisão dupla (o coração do sistema)

Esta é a ideia original do projeto, formalizada como máquina de estados.

```
              ARTEFATO (plano ou código) no SHA X
                            │
                            ▼
              ┌──────────────────────────┐
              │  PASSAGEM 1 — OPENAI R1  │
              │  análise independente    │
              │  → findings + evidence   │
              └────────────┬─────────────┘
                           ▼
              ┌──────────────────────────┐
              │  PASSAGEM 2 — CLAUDE R1  │
              │  revisa o artefato       │
              │  + META-REVISA o OpenAI  │
              │  → concorda? falso       │
              │    positivo? risco       │
              │    omitido?              │
              └────────────┬─────────────┘
                           ▼
              ┌──────────────────────────┐
              │  PASSAGEM 3 — OPENAI R2  │
              │  responde ao Claude      │
              │  aceita objeções válidas │
              │  rejeita as infundadas   │
              │  com justificativa       │
              └────────────┬─────────────┘
                           ▼
              ┌──────────────────────────┐
              │  PASSAGEM 4 — CLAUDE R2  │
              │  SÍNTESE CONCLUSIVA      │
              │  sem novo debate         │
              │  → READY_FOR_HUMAN_      │
              │    APPROVAL |            │
              │    CHANGES_REQUIRED |    │
              │    BLOCKED               │
              └────────────┬─────────────┘
                           ▼
                     HUMAN GATE
                  Roberth + Antigravity
                    ┌──────┴──────┐
                    ▼             ▼
                APROVAR        REVISAR
                    │             │
                    ▼             ▼
               EXECUÇÃO      nova versão
                             do artefato
                             (novo SHA,
                              novo ciclo)
```

**Regras invioláveis do protocolo:**

1. `round > 4` é **DENIED**. Não existe quinta passagem.
2. Quem decide chamar o próximo modelo é o **Orchestrator**, nunca um modelo.
3. Um `HTTP 429` ou erro de rede é **retry técnico**, não consome uma passagem cognitiva.
4. Se o `base_sha` mudar materialmente durante o ciclo, o ciclo é **invalidado** e um novo nasce.
5. O sistema **não conta votos**. Dois modelos concordando não transformam uma afirmação em verdade.
6. Divergência é **dado estruturado**, não texto diluído em uma síntese.

Detalhamento completo em `06-INTELIGENCIA-DOS-AGENTES/04-PROTOCOLO-REVISAO-DUPLA.md`.

### 9. Por que a inteligência mora no repositório

A mudança conceitual mais importante do projeto:

> **A inteligência dos agentes não está no prompt. Está no repositório.**

```
                    ERRADO
        Orchestrator → prompt gigante → modelo → resultado

                    CERTO
        factory-intelligence/  (GitHub, versionado, com PR e CODEOWNERS)
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
   PROJEÇÃO OPENAI          PROJEÇÃO CLAUDE
   AGENTS.md                CLAUDE.md
   .agents/skills/          .claude/skills/
        │                         │
        ▼                         ▼
   Codex / Agents API       Claude Code / Managed Agents
        │                         │
        └────── Orchestrator ─────┘
```

Consequências práticas:

- Uma metodologia melhorada vira um **PR revisável**, não um prompt reescrito em segredo.
- OpenAI e Claude obedecem à **mesma constituição**, mas continuam **cognitivamente diferentes** — e é isso que faz a revisão cruzada valer.
- Nenhum fornecedor é dono da arquitetura. Trocar de modelo é trocar uma linha de registry.
- `factory-intelligence/**` é **código privilegiado**: alterar uma skill é alterar o comportamento de um agente que tem Bash e rede. Exige CODEOWNERS e aprovação humana.

---

## PARTE III — DO QUE O APLICATIVO É FEITO

### 10. As nove páginas

O Control Plane tem exatamente nove áreas na navegação lateral, nesta ordem:

| # | Página | Pergunta que responde | Documento |
|---|---|---|---|
| 1 | **Início** | O que está acontecendo agora e o que precisa de mim? | `03-PAGINAS/01-INICIO.md` |
| 2 | **Projetos** | Quais aplicativos existem e em que pé está cada um? | `03-PAGINAS/02-PROJETOS.md` |
| 3 | **Agentes de IA** | Quem são meus trabalhadores, o que sabem fazer e como performam? | `03-PAGINAS/03-AGENTES-DE-IA.md` |
| 4 | **Orquestração** | Como os agentes se encadeiam em fluxos de trabalho? | `03-PAGINAS/04-ORQUESTRACAO.md` |
| 5 | **Base de Conhecimento** | O que a fábrica sabe e de onde tira contexto? | `03-PAGINAS/05-BASE-DE-CONHECIMENTO.md` |
| 6 | **Templates** | De que pontos de partida posso criar um app novo? | `03-PAGINAS/06-TEMPLATES.md` |
| 7 | **Integrações** | A que serviços externos a fábrica está conectada? | `03-PAGINAS/07-INTEGRACOES.md` |
| 8 | **Monitoramento** | A fábrica está saudável? Quanto custou? O que falhou? | `03-PAGINAS/08-MONITORAMENTO.md` |
| 9 | **Configurações** | Como personalizo organização, equipe, segurança e políticas? | `03-PAGINAS/09-CONFIGURACOES.md` |

Mais as telas transversais em `03-PAGINAS/10-TELAS-TRANSVERSAIS.md`: autenticação, wizard Novo Projeto, detalhe de projeto, detalhe de agente, **Câmara de Revisão** e Fila de Aprovações.

### 11. A stack — DECISÃO CONGELADA

| Camada | Decisão | Por quê |
|---|---|---|
| Framework web | **Next.js (App Router)**, versão 16.x na linha atual | Server Components, Route Handlers, server-first, deploy nativo no Vercel |
| Linguagem | **TypeScript em modo estrito** | Contratos verificáveis entre front e back |
| Estilo | **Tailwind CSS + CSS variables derivadas de tokens** | Tokens canônicos, tema claro/escuro sem duplicação |
| Componentes | **shadcn/ui como código source-owned** sobre a primitive congelada no projeto | O código dos componentes pertence ao projeto, o que é essencial quando agentes mantêm o código |
| Design System | `packages/design-system` + tokens em três níveis | Identidade RNS, não identidade do shadcn |
| Catálogo de componentes | **Storybook** | Testar componente antes da tela |
| Estado servidor | **Factory Supabase** via server queries / BFF | Sem estado de negócio no cliente |
| Tempo real | **Supabase Realtime (Broadcast)** | Eventos normalizados, não cada token do agente |
| Filas | **Supabase Queues (pgmq)** + leases próprios | Fila durável no Postgres com visibility window |
| Workflow durável | Motor externo (ex.: Inngest) ou worker próprio — `UNSPECIFIED` até benchmark | Edge Functions não servem para execução longa |
| Testes unitários | **Vitest** | |
| E2E | **Playwright** | Integra `axe-core` para acessibilidade |
| Acessibilidade | **WCAG 2.2** + axe + teste manual de teclado | Automação pega só parte das falhas |
| Banco | **PostgreSQL via Supabase**, RLS em tudo que é exposto | |
| Identidade GitHub | **GitHub App própria**, tokens de instalação de 1 hora | Nunca PATs permanentes |
| Auth de provedores de IA | **WIF/OIDC** onde disponível | Evita API key permanente no repositório |
| Hospedagem | **Vercel** | Previews automáticos + Deployment Checks |
| Runtime de agentes | **Workers externos**, nunca Edge Functions | Sessões longas, sandbox, cancelamento |

**Proibições permanentes de stack:**
- Nenhum nome de modelo de IA hardcoded em código de aplicação.
- Nenhuma Edge Function executando agente por mais de alguns segundos.
- Nenhuma chave `sb_secret_` no navegador ou em um agente.
- Nenhum agente com credencial de produção.

### 12. Os três repositórios (e por que não um só)

```
Organização GitHub: RNS

rns-factory/                ← a fábrica em si (control plane, orchestrator,
                               adapters, factory-intelligence, migrations)

rns-app-<nome>/             ← um repositório POR aplicativo produzido
rns-app-<outro>/               (isolamento real de permissões, CI,
rns-app-<outro2>/               histórico, deployments e ciclo de vida)

rns-golden-template/        ← o template de onde nasce cada app produzido
```

A fábrica pode começar como monorepo, mas **cada aplicativo produzido nasce com repositório, projeto Supabase e projeto Vercel próprios**.

### 13. Os dois níveis de Supabase

Confundir estes dois é o segundo erro mais caro do projeto.

| | Factory Supabase | Generated App Supabase |
|---|---|---|
| Quantos | Um só | Um por aplicativo produzido |
| Guarda | Estado da fábrica: apps, missões, tarefas, runs, reviews, findings, evidências, aprovações, custos, auditoria | Dados do aplicativo produzido: usuários finais, entidades de negócio |
| Quem acessa | Control Plane e Orchestrator | O aplicativo produzido |
| Criado por | Você, uma vez | Provisioning Service, via Management API |
| Agentes acessam? | Nunca com secret key. Só via RNS Tool API / MCP com policy check | Somente preview branch, nunca produção |

---

## PARTE IV — COMO TUDO SE CONECTA

### 14. O caminho de um evento, do GitHub ao navegador

```
GitHub dispara webhook (ex.: pull_request.opened)
            ↓
Ingress curto (Route Handler ou Edge Function)
            ↓
1. VERIFICAR ASSINATURA  ← se falhar, 401 e descarta
            ↓
2. NORMALIZAR evento para o envelope canônico RNS
            ↓
3. PERSISTIR evento cru em webhook_events
            ↓
4. CHECAR IDEMPOTÊNCIA (unique em idempotency_key)
            ↓  já existe? → 200 e encerra
5. VALIDAR ESTADO ATUAL  ← transição permitida?
            ↓  não? → registra e ignora
6. APLICAR TRANSIÇÃO no Factory Supabase
            ↓
7. EMITIR evento interno
            ↓
8. ENFILEIRAR próximo job
            ↓
9. BROADCAST via Supabase Realtime
            ↓
Control Plane atualiza o card na tela
```

O navegador **nunca** recebe stdout bruto de agente. Recebe eventos normalizados:

```json
{ "event": "run.progress", "run_id": "run_421",
  "state": "reviewing", "summary": "12 arquivos analisados",
  "occurred_at": "2026-09-20T13:04:11Z" }
```

### 15. A integração GitHub + Supabase + Vercel para cada PR

```
TAREFA 481
     │
     ▼
branch git: rns/task-481-auth
     │
     ├──────────────────────┐
     ▼                      ▼
Supabase cria           Vercel cria
preview branch          preview deployment
(migrations do repo,    (build da branch)
 SEM dados de produção)
     │                      │
     └──────────┬───────────┘
                ▼
     A integração Supabase↔Vercel sincroniza
     as variáveis de ambiente do preview.
     ATENÇÃO: existe condição de corrida entre
     injeção de variáveis e build. O Orchestrator
     NÃO declara o preview pronto com um único evento.
                ▼
     Espera por AMBOS:
       supabase.preview.ready
       vercel.preview.ready
                ▼
          preview_pair_ready
                ▼
     R8 executa E2E e verificação de navegador
                ▼
     R9 consolida evidências
                ▼
            HUMAN GATE
```

### 16. Merge ≠ Release

Duas perguntas diferentes, duas barreiras diferentes:

```
"Esse código pode entrar em main?"        →  MERGE GATE
   required PR + code owner review
   + status checks + Supabase preview check
   + security checks + conversation resolution

"Esse build pode receber usuários?"       →  RELEASE GATE
   production build
   → deployment checks (Vercel segura a promoção)
   → smoke/E2E em produção
   → release approval humana
   → rolling release (fração do tráfego)
   → 100%
```

Para software escrito por agentes, essa separação não é luxo: é o que permite abortar um erro antes que ele atinja usuários.

### 17. A hierarquia de autoridade

Quando duas fontes se contradizem, **quem ganha** é decidido por esta tabela. Ela é normativa.

```
NÍVEL 0   Instrução humana explícita atual
NÍVEL 1   Constituição RNS
NÍVEL 2   Políticas de segurança e permissões
NÍVEL 3   Plano humano aprovado + Task Packet
NÍVEL 4   Registry canônico de papéis
NÍVEL 5   Metodologias de engenharia
NÍVEL 6   Skills
NÍVEL 7   Conhecimento curado
NÍVEL 8   Continuidade / handoffs históricos
NÍVEL 9   Suposição do modelo
```

E, **separadamente**, a hierarquia de precedência **factual** (o que é verdade sobre o estado do mundo):

```
1. Estado live verificado
2. Código no SHA exato da branch relevante
3. Migrations e configs versionadas
4. Documentação canônica atual do fornecedor
5. ADRs e continuidade
6. Handoffs históricos
7. Memória da sessão ou do modelo
```

Misturar as duas é como deixar um relatório antigo "vencer" o estado real da aplicação.

---

## PARTE V — O QUE ACONTECE DEPOIS

### 18. A ordem de construção

```
FASE 1 — APLICATIVO FUNCIONAL (agentes mockados)
FASE 2 — AGENTES REAIS (OpenAI + Claude, ciclo de revisão de verdade)
FASE 3 — REFINAMENTO VISUAL (feito pela própria fábrica)
```

Detalhamento em `08-PLANO-DE-IMPLEMENTACAO/`.

### 19. O que a fábrica aprende sobre si mesma

A partir da Fase 2, cada execução grava:

```
role · runtime · model · skill_version · task_class · complexity
success · human_acceptance · rework · cost · latency
bugs_detected · bugs_introduced · ci_first_pass · disagreement_rate
```

Depois de dezenas de aplicativos, a pergunta "Claude ou OpenAI é melhor para revisar migration?" deixa de ser opinião e vira **consulta a um dataset próprio**. É esse dataset que, na Fase 5, alimenta o Agent Router.

Esse é o ativo estratégico de longo prazo da Fábrica Apps RNS.

### 20. O que fica intencionalmente em aberto

| Item | Status | Como decidir |
|---|---|---|
| Motor de workflow durável definitivo | `UNSPECIFIED` | Benchmark na Fase 1 com carga sintética |
| Modelos específicos de OpenAI e Anthropic | `UNSPECIFIED` | Definidos em `models.yaml`, nunca em código |
| Thresholds de qualidade dos evals | `UNSPECIFIED` | Só após baseline real na Fase 4 |
| Custo por aplicativo | `UNSPECIFIED` | Só após medir tokens e rework reais |
| Plano das contas GitHub/Vercel/Supabase | `UNSPECIFIED` | Após dimensionar equipe e volume |
| Limites de retry, lease TTL e budgets | `UNSPECIFIED` | Configuração operacional, após benchmark |

**Inventar número aqui é pior do que deixar `UNSPECIFIED`.** Falsa precisão vira decisão errada no futuro.

---

## PARTE VI — O CRITÉRIO DE SUCESSO

### 21. Architecture Ready

A arquitetura está congelada e pronta para implementação quando todos estes itens existirem — e **todos existem neste pacote**:

```
✓ arquitetura front-end definida        → 02-ARQUITETURA/02
✓ arquitetura back-end definida         → 02-ARQUITETURA/03
✓ entidades centrais definidas          → 02-ARQUITETURA/04
✓ máquinas de estado definidas          → 02-ARQUITETURA/05
✓ protocolo GPT ↔ Claude definido       → 06-INTELIGENCIA/04
✓ human gate definido                   → 06-INTELIGENCIA/01 e 04
✓ fronteira do Antigravity definida     → 04-PLATAFORMAS/05
✓ GitHub App definida conceitualmente   → 04-PLATAFORMAS/02
✓ Factory Supabase definido             → 04-PLATAFORMAS/01
✓ arquitetura de preview definida       → 04-PLATAFORMAS/06
✓ arquitetura de release definida       → 04-PLATAFORMAS/03 e 06
✓ arquitetura de inteligência definida  → 06-INTELIGENCIA/
✓ modelo de permissões definido         → 05-SEGURANCA/02
✓ estratégia de evals definida          → 06-INTELIGENCIA/06
✓ modelo de observabilidade definido    → 07-QUALIDADE/04
✓ fronteira de segurança definida       → 05-SEGURANCA/01
```

### 22. A entrega que prova tudo

Não é "a fábrica construiu sozinha um SaaS gigantesco".

É este circuito, funcionando uma vez, inteiro:

```
ideia → plano → Plan PR → GPT R1 → Claude R1 → GPT R2 → Claude R2
→ human gate → aprovação assinada → DAG → agente implementa
→ outro agente revisa → reparo → revisão conclusiva → CI passa
→ Supabase Preview nasce → Vercel Preview nasce → R8 testa
→ evidências consolidadas → humano aprova → merge
→ production build → deployment checks → release approval → produção
```

Quando isso rodar de ponta a ponta sem intervenção manual fora dos gates, a Fábrica Apps RNS **existe**. Dez etapas, cem tarefas ou vinte aplicativos simultâneos passam a ser questão de escala, routing e governança — não mais de descobrir como os agentes conversam.

---

## Referências deste documento

Todas as decisões acima derivam de:

- `99-REFERENCIAS-ORIGINAIS/pesquisas/` — as quatro pesquisas aprofundadas do projeto
- `99-REFERENCIAS-ORIGINAIS/imagens/` — as dez telas de referência visual
- Verificação em fontes oficiais em 20/09/2026, listadas em `00-COMECE-AQUI/01-INDICE-GERAL.md`

# Glossário Canônico — Fábrica Apps RNS

Todo documento, todo código, toda tabela e todo prompt deste projeto usam **estes termos com estes significados**. Sinônimos informais são proibidos em código.

---

## 1. Entidades do domínio

| Termo | Definição | Nome técnico |
|---|---|---|
| **Organização** | Proprietário lógico de tudo. Multi-tenant desde o dia 1. | `organizations` |
| **Usuário** | Operador humano autenticado. | `users` / `auth.users` |
| **Projeto** (UI) / **App** (dados) | Um aplicativo que a fábrica está construindo. Na interface chama-se "Projeto"; no banco, `apps`. | `apps` |
| **Especificação** | Requisitos aprovados do produto a construir. Versionada. | `app_specs` |
| **Missão** | Uma iniciativa de engenharia longa dentro de um projeto (ex.: "construir o módulo de autenticação"). | `missions` |
| **Etapa** | Uma fatia da missão com começo, fim e aprovação própria. | `stages` |
| **Tarefa** | A menor unidade executável por um agente. | `tasks` |
| **Task Packet** | O envelope formal e imutável entregue a um agente para executar uma tarefa. | `task_packets` |
| **Execução / Run** | Uma execução concreta de um agente sobre um Task Packet. | `runs` |
| **Artefato** | Qualquer saída persistida: plano, patch, relatório, screenshot, JSON de review. | `artifacts` |
| **Achado / Finding** | Um problema identificado por um revisor, com severidade e evidência. | `findings` |
| **Divergência** | Discordância material registrada entre OpenAI e Claude. | `disagreements` |
| **Evidência** | Prova verificável de uma afirmação. | `evidence_items` |
| **Aprovação** | Decisão humana autenticada que libera uma transição. | `approvals` |
| **Ciclo de revisão** | O conjunto das quatro passagens GPT R1 → Claude R1 → GPT R2 → Claude R2 sobre um mesmo SHA. | `review_cycles` |
| **Passagem / Round** | Uma das quatro passagens do ciclo. | `review_rounds` |

---

## 2. Componentes do sistema

| Termo | Definição |
|---|---|
| **Control Plane** | O aplicativo web da fábrica (as 9 páginas). Observa, explica e comanda. **Não** executa agentes. |
| **Orchestrator** | Componente determinístico que valida e efetiva transições de estado, faz routing, aplica políticas, budgets, retries e human gates. |
| **Factory Supabase** | O projeto Supabase **da fábrica**. Guarda estado operacional. Não confundir com o Supabase de cada app produzido. |
| **Generated App Supabase** | O projeto Supabase **de cada aplicativo produzido** pela fábrica. |
| **Agent Adapter** | Interface nossa que traduz um Task Packet para um runtime de fornecedor. Isola a fábrica das mudanças de OpenAI/Anthropic. |
| **Worker** | Processo externo de longa duração que executa adapters. Nunca uma Edge Function. |
| **RNS Factory GitHub App** | Identidade da plataforma no GitHub. Não é um agente. |
| **RNS Local Bridge** | Conexão de saída do computador do operador para o Orchestrator, usada pelo Antigravity. |
| **Estação de Comando** | O par humano + Antigravity local. Autoridade final. |
| **Factory Intelligence** | Diretório `factory-intelligence/` no repositório: constituição, registries, metodologia, skills, protocolos, schemas, conhecimento e evals. |
| **Projeção** | Cópia gerada da inteligência canônica para o formato de um fornecedor (`.agents/skills`, `.claude/skills`). Nunca é a fonte. |

---

## 3. Papéis cognitivos (R1–R9)

| ID | Papel | O que faz | Escrita padrão |
|---|---|---|---|
| **R1** | Orchestration Intelligence | Interpreta a missão, decompõe, propõe DAG e sequência. **Não é o Orchestrator.** | read-only |
| **R2** | Architecture | Arquitetura, interfaces, ADRs, dependências, trade-offs | read-only |
| **R3** | Research | Pesquisa técnica externa, versões, documentação oficial | read-only |
| **R4** | Builder | Implementação de front-end, back-end e infraestrutura | workspace-write |
| **R5** | Reviewer | Revisão adversarial e cross-model de plano e código | read-only |
| **R6** | QA & Testing | Testes, regressões, integração, CI, evals | test workspace |
| **R7** | Security & Data | AppSec, Supabase, migrations, RLS, secrets | read-only; write por tarefa específica |
| **R8** | UX & Browser Verification | Browser/E2E, UX, acessibilidade | preview-only |
| **R9** | Release & Evidence | Reconcilia evidências, decide readiness de release | governance-only |

**Regra permanente:** `Role ≠ Runtime ≠ Model ≠ Skill`. Um papel pode ser executado por OpenAI ou por Anthropic. O papel é definição normativa; o runtime é implementação.

---

## 4. Vocabulário de estado

### Estados de tarefa

```
CREATED → READY → QUEUED → LEASED → RUNNING → ARTIFACT_READY
        → REVIEWING → AWAITING_CHECKS → AWAITING_HUMAN
        → APPROVED → COMPLETED
```

Ramificações: `FAILED_RETRYABLE`, `FAILED_TERMINAL`, `CHANGES_REQUIRED`, `REJECTED`, `REVISION_REQUIRED`, `BLOCKED`, `BLOCKED_BUDGET`, `CANCELLED`, `SUPERSEDED`.

### Veredictos de revisão

| Veredicto | Significado |
|---|---|
| `APPROVE_AI_STAGE` | A IA considera a etapa correta; segue para gates determinísticos |
| `CHANGES_REQUIRED` | Existem problemas corrigíveis; volta para reparo |
| `BLOCKED` | Segurança crítica, requisito impossível ou inconsistência fundamental |
| `READY_FOR_HUMAN_APPROVAL` | Saída exclusiva da passagem Claude R2; encaminha ao human gate |

### Resoluções de divergência

`RESOLVED`, `ACCEPTED_OPENAI`, `ACCEPTED_CLAUDE`, `COMBINED`, `DEFERRED`, `HUMAN_DECISION_REQUIRED`.

---

## 5. Vocabulário de segurança

| Termo | Definição |
|---|---|
| **ALLOW** | Operação permitida sem perguntar (ler repo, rodar teste, ler preview) |
| **ASK / HUMAN GATE** | Operação que exige decisão humana (migration de produção, merge crítico, promoção, secrets) |
| **DENY** | Operação proibida sempre (desativar RLS, force push em main, expor secret, apagar produção) |
| **Trust boundary** | Fronteira de confiança. Skills lidas do repositório estão **dentro** dela: quem altera uma skill altera o comportamento do agente. |
| **UNTRUSTED_GENERATED_CODE** | Classificação padrão de todo código produzido por agente, mesmo agente nosso, até passar pelos gates. |
| **WIF / OIDC** | Workload Identity Federation: troca do token OIDC do GitHub por credencial temporária do fornecedor, evitando API key permanente no repositório. |
| **Publishable key** | Chave Supabase `sb_publishable_...` segura para o navegador, protegida por RLS. |
| **Secret key** | Chave Supabase `sb_secret_...` que **contorna RLS**. Somente servidor. Nunca chega a um agente. |

---

## 6. Vocabulário de entrega

| Termo | Definição |
|---|---|
| **Plan PR** | Pull request que contém um plano versionado e recebe as quatro passagens de revisão |
| **Execution PR** | Pull request que contém a implementação de uma etapa |
| **Preview pair** | O par "Supabase preview branch + Vercel preview deployment" pronto e sincronizado |
| **Merge gate** | "Esse código pode entrar em `main`?" |
| **Release gate** | "Esse build pode receber usuários?" — decisão **separada** do merge |
| **Deployment Checks** | Mecanismo do Vercel que segura a promoção de um build de produção até que checks obrigatórios passem |
| **Rolling release** | Liberação fracionada do tráfego para a nova versão, com aborto possível |

---

## 7. Correções de nomenclatura (uso obrigatório)

| Errado | Certo |
|---|---|
| AntiGravity, Anti-Gravity | **Google Antigravity** |
| Cloud Code | **Claude Code** |
| Supabase escrito "Supabase"/"Superbase"/"Supabase" inconsistente | **Supabase** |
| "ChatGPT programando" (em contexto programático) | **OpenAI Codex / Codex SDK / Agents API** |
| "os três agentes decidem" | "o Orchestrator decide; os agentes executam" |

> Observação: as telas de referência trazem a grafia "Supabase" em alguns rótulos. **A grafia correta no produto é `Supabase`** e deve ser corrigida na implementação.

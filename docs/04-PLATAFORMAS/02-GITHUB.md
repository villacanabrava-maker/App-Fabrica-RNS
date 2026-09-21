# GitHub — Como vai funcionar

**VERIFICAR ANTES DE USAR:** confirmado em 20/09/2026. Reverifique em `https://docs.github.com` antes de decisões materiais.

---

## 1. O papel do GitHub

> **O GitHub é o ledger de engenharia da fábrica. Não é o cérebro.**

Ele guarda:

```
código dos aplicativos produzidos
migrations versionadas
planos aprovados (Plan PRs)
a INTELIGÊNCIA dos agentes (factory-intelligence/)
pull requests, checks, reviews
evidências duráveis importantes
histórico auditável imutável
```

Ele **não** guarda:

```
estado do workflow          → Supabase
filas e leases              → Supabase
transcrições de agente      → Storage, referenciado
logs de telemetria          → observabilidade
segredos                    → secret manager
```

---

## 2. Estrutura de repositórios

```
Organização GitHub: RNS

rns-factory/              a fábrica (control plane, orchestrator,
                          adapters, factory-intelligence, migrations)

rns-golden-template/      template dos aplicativos produzidos

rns-app-clinicas/         um repositório POR aplicativo produzido
rns-app-financeiro/
rns-app-crm/
...
```

Isso cria isolamento real de permissões, branches, histórico, CI, deployments e ciclo de vida.

---

## 3. As identidades — GitHub Apps separadas

★ **Não usar PAT pessoal como identidade da plataforma.** Uma GitHub App começa **sem nenhuma permissão** e recebe só o mínimo necessário. Seus tokens de instalação expiram em **1 hora** e podem ser escopados por repositório e por permissão.

| Identidade | Poder | Permissões mínimas |
|---|---|---|
| `rns-control-app` | Webhooks, PRs, checks, status, metadados de branch | Contents: read · Pull requests: write · Checks: write · Metadata: read |
| `rns-worker-app` | Escrita de conteúdo em branch específica, quando autorizado | Contents: write (escopado) · Pull requests: write |
| `rns-release-service` | Operações de release restritas | Contents: read · Deployments: write · Actions: read |
| **coding agent** | **Nenhuma credencial administrativa do GitHub** | — |

```
Emissão de token:
  JWT da App
      ↓
  POST /app/installations/{id}/access_tokens
      com repositories[] e permissions{}
      ↓
  token válido por 1 hora, escopado
      ↓
  usado e descartado
```

Essa separação reduz o raio de alcance caso um componente seja comprometido.

---

## 4. Webhooks

### Eventos assinados

```
pull_request            opened, synchronize, closed, reopened
pull_request_review     submitted
check_run               completed
check_suite             completed
push
workflow_run            completed
installation            created, deleted
installation_repositories
issue_comment           (para comandos humanos em PR, fase futura)
```

Assinar **apenas** o necessário. Cada evento extra é superfície de ataque e custo.

### Processamento

```
1. VERIFICAR ASSINATURA (secret do webhook)   ← falha = 401 + evento de segurança
2. NORMALIZAR para o envelope canônico RNS
3. PERSISTIR cru em webhook_events
4. DEDUPLICAR por X-GitHub-Delivery
5. VALIDAR estado atual
6. APLICAR transição
7. EMITIR evento interno
8. ENFILEIRAR job
9. RESPONDER 202 rápido
```

Webhook é preferível a polling: menos consumo de API e menor latência.

---

## 5. Os dois tipos de Pull Request

### Plan PR

```
PR: PLAN-0042
Arquivos:
  docs/plans/app-217/plan-v003.md
  factory/plan-v003.json
  acceptance-criteria.yaml

Comentários estruturados:
  GPT Review A
  Claude Review A
  GPT Review B
  Claude Final Verdict

Gate: Human Approval
```

Após aprovação e merge:

```
PLAN_MERGED → Orchestrator → cria o DAG de execução
```

### Execution PR

```
PR: STAGE-01-authentication
PR: STAGE-02-database
PR: STAGE-03-dashboard
```

Um PR por etapa. Cada um com sua branch, seu preview pair e seu ciclo de revisão.

---

## 6. Branch protection com rulesets

Configuração obrigatória para `main` em **todos** os repositórios:

```
✓ Require a pull request before merging
✓ Require approvals (mínimo 1)
✓ Require review from Code Owners
✓ Dismiss stale pull request approvals when new commits are pushed
✓ Require approval of the most recent reviewable push
✓ Require conversation resolution before merging
✓ Require status checks to pass
    · lint
    · typecheck
    · unit
    · integration
    · rls-tests            ★ obrigatório
    · supabase-preview     ★ obrigatório
    · security-scan
    · e2e (quando aplicável)
✓ Require deployments to succeed (quando aplicável)
✓ Block force pushes
✓ Restrict deletions
✓ Code scanning merge protection
✓ Require signed commits (recomendado)
✗ Sem bypass geral
```

★ CODEOWNERS sozinho **não bloqueia merge**. É preciso exigir "review from Code Owners" no ruleset.

---

## 7. CODEOWNERS — protegendo a inteligência

```
# Constituição e autoridade humana
/factory-intelligence/constitution/     @rns/human-governance @rns/security

# Registries, protocolos e permissões
/factory-intelligence/registry/         @rns/ai-platform @rns/security
/factory-intelligence/protocols/        @rns/ai-platform @rns/security

# Inteligência executável — skills são instruções de agente
/factory-intelligence/skills/           @rns/ai-platform @rns/security
/.agents/                               @rns/ai-platform
/.claude/                               @rns/ai-platform
/.codex/                                @rns/ai-platform

# Automação privilegiada
/.github/workflows/                     @rns/platform @rns/security
/orchestrator/                          @rns/platform @rns/security

# Banco
/supabase/migrations/                   @rns/data @rns/security
/supabase/functions/                    @rns/data @rns/platform

# Release
/factory-intelligence/methodology/RELEASE.md  @rns/human-governance @rns/platform

# Bootloaders
/AGENTS.md                              @rns/ai-platform @rns/security
/CLAUDE.md                              @rns/ai-platform @rns/security
```

★ **Por que isso é crítico:** uma skill lida do repositório entra na **trust boundary** do agente. Quem consegue alterar uma skill consegue mudar o comportamento de um agente que depois tem shell e rede. Uma skill maliciosa é tão perigosa quanto código malicioso.

---

## 8. GitHub Actions — o que é e o que não é

| É | Não é |
|---|---|
| Executor determinístico de CI | O banco de estado do sistema |
| Gerador de checks | O workflow engine da fábrica |
| Superfície opcional para rodar agentes em revisão | O dono do protocolo de revisão |

Execuções agênticas longas exigem leases, retries, budgets, timeouts, dependências, cancelamento, dead-letter, prioridades, observabilidade e aprovação humana. Nada disso pertence ao Actions.

```
Actions EXECUTA trabalho.
Supabase REGISTRA o estado.
Orchestrator DECIDE o próximo passo.
```

### Segurança em Actions ★

| Regra | Motivo |
|---|---|
| **Evitar `pull_request_target` com código não confiável** | É o padrão que leva ao ataque conhecido como "pwn request": código do PR roda em contexto privilegiado com secrets |
| Preferir `pull_request` quando não precisar de contexto privilegiado | Menos privilégio |
| Runners isolados e efêmeros para código não confiável | Contenção |
| `permissions:` explícito e mínimo em cada workflow | Padrão fechado |
| Em workflows encadeados, permissões podem ser reduzidas, nunca elevadas | Propriedade útil para padronizar pipelines |
| Secrets separados por ambiente | Raio de alcance |
| **WIF/OIDC em vez de API key permanente** | Ver §9 |

---

## 9. Identidade curta em vez de segredo permanente

OpenAI e Anthropic oferecem Workload Identity Federation com GitHub Actions: o job obtém um token OIDC do GitHub e o troca por uma credencial temporária do fornecedor, com regras restringíveis por repositório, branch, ambiente e `workflow_ref`.

```
CERTO                                ERRADO
─────                                ──────
GitHub Actions                       repository secret
    │ OIDC JWT                       OPENAI_MASTER_KEY=permanente
    ▼                                ANTHROPIC_MASTER_KEY=permanente
Provider WIF                         SUPABASE_OWNER_KEY=permanente
    │ token curto                    VERCEL_OWNER_TOKEN=permanente
    ▼
OpenAI / Anthropic
```

Onde o fornecedor oferecer WIF, **essa é a política padrão da fábrica**.

---

## 10. Workflows de CI recomendados

```
.github/workflows/
├── intelligence-ci.yml     valida schemas, registries e drift das projeções  ★
├── application-ci.yml      lint, typecheck, unit, integration, build
├── database-ci.yml         migrations, RLS tests, supabase test db
├── security.yml            code scanning, secret scanning, dependências
├── preview-e2e.yml         E2E quando o preview pair estiver pronto
└── release.yml             build de produção e deployment checks
```

### `intelligence-ci.yml` — o mais importante

```
1. Validar todos os JSON Schemas
2. Validar registries YAML contra seus schemas
3. Reconstruir as projeções (.agents/skills, .claude/skills)
4. Comparar hash com projection-manifest.json
5. FALHAR se houver drift  ★
6. Rodar os evals de fumaça das skills críticas
```

Sem esse workflow, as projeções divergem da fonte canônica em semanas e ninguém percebe.

---

## 11. Coding agents no GitHub

O GitHub oferece integração com coding agents de terceiros e workflows agênticos em Actions. A fábrica pode usar isso como **um adapter de execução**, nunca como representação canônica do workflow.

```
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

Trocar o adapter não muda o protocolo RNS.

---

## 12. Convenções de branch e commit

```
Branches:
  rns/task-<id>-<slug>              implementação
  review/task-<id>-<runtime>-r<n>   workspace de revisão
  plan/mission-<id>-v<n>            plano
  release/<version>

Commits (Conventional Commits):
  feat(auth): adiciona fluxo de login com GitHub
  fix(rls): corrige policy de leitura cruzada em tasks
  chore(intelligence): atualiza skill de migration-review

Rodapé obrigatório em commits de agente:
  RNS-Run: run_01H...
  RNS-Task: tsk_01H...
  RNS-Role: R4
  RNS-Runtime: openai
  RNS-Base-SHA: 0123456789abcdef...
```

Esse rodapé é o que permite correlacionar um commit a uma execução meses depois.

---

## 13. Checklist de implementação

```
□ Organização GitHub criada
□ rns-factory e rns-golden-template criados
□ Três GitHub Apps criadas com permissões mínimas
□ Webhook secret configurado e verificação implementada
□ Deduplicação por X-GitHub-Delivery funcionando
□ Ruleset de main configurado conforme §6
□ CODEOWNERS aplicado e "require Code Owners review" ativo
□ Required status checks incluindo rls-tests e supabase-preview
□ intelligence-ci.yml detectando drift  ★
□ Nenhum pull_request_target com secrets
□ permissions: mínimo declarado em todos os workflows
□ WIF configurado para OpenAI e Anthropic (Fase 2)
□ Nenhum PAT permanente em uso
□ Convenção de branch e rodapé de commit aplicada pelos adapters
□ Teste: tentar force push em main falha
□ Teste: PR alterando factory-intelligence exige code owner
```

---

## Fontes

- [GitHub Docs — Available rules for rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets)
- [GitHub Docs — Generating an installation access token](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app)

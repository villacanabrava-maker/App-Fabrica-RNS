# Registry de Papéis R1–R9

**Fonte canônica:** `factory-intelligence/registry/agents.yaml`
**Espelho operacional:** `agents.agent_roles` no Factory Supabase
**Consumido por:** Orchestrator, Intelligence Resolver, Control Plane

★ O front-end **consome este registry**. É proibido escrever `if (agent === 'R3')` espalhado pela aplicação. Evoluir responsabilidade, skill ou runtime não deve exigir reconstruir a UI.

---

## 1. O princípio: Role ≠ Runtime ≠ Model ≠ Skill

```
ROLE     o que o trabalho É          (R5 Reviewer)
RUNTIME  quem executa                (OpenAI ou Anthropic)
MODEL    qual modelo concreto        (resolvido em runtime, nunca em código)
SKILL    o que ele sabe fazer        (code-review, security-audit)
```

Uma execução concreta:

```
ROLE:    R5 Reviewer
RUNTIME: OpenAI
MODEL:   <resolvido do registry>
SKILLS:  code-review@v7, security-audit@v4
PACKET:  TP-942
BASE:    b92a31...
POLICY:  read_only, production_denied
```

E a mesma tarefa, em outro momento:

```
ROLE:    R5 Reviewer
RUNTIME: Anthropic
MODEL:   <resolvido do registry>
```

O papel é definição normativa. O runtime é implementação. Isso é o que permite a revisão cruzada e a troca de fornecedor sem reescrever a fábrica.

---

## 2. Os nove papéis

| ID | Papel | Responsabilidade | Write default | Saída mínima |
|---|---|---|---|---|
| **R1** | Orchestration Intelligence | Interpretar a missão, decompor, propor DAG, owners e sequência | read-only | plano / decomposição |
| **R2** | Architecture | Arquitetura, interfaces, ADRs, dependências, trade-offs | read-only | architecture review |
| **R3** | Research | Pesquisa técnica externa, versões, documentação, validação de fonte | read-only | research evidence |
| **R4** | Builder | Implementação de front-end, back-end e infraestrutura como código | workspace-write | patch / commit |
| **R5** | Reviewer | Revisão adversarial e cross-model de plano e código | read-only | review + findings |
| **R6** | QA & Testing | Testes, regressões, integração, CI, evals | test workspace | test evidence |
| **R7** | Security & Data | AppSec, Supabase, migrations, RLS, secrets | read-only; write por tarefa específica | security/data review |
| **R8** | UX & Browser Verification | Browser/E2E, UX, acessibilidade, interface | preview-only | browser evidence |
| **R9** | Release & Evidence | Reconciliar evidências, prontidão de release, encerramento | governance-only | evidence ledger final |

★ **R1 não é o Orchestrator.** R1 é um *planner cognitivo*: sugere decomposição, dependências e routing. O Orchestrator recebe a proposta e valida se a transição é permitida. R1 não muda estados, não cria loops, não eleva privilégios e não decide sozinho que outro modelo deve executar.

---

## 3. Detalhamento por papel

### R1 — Orchestration Intelligence
```
Recebe:   missão, especificação aprovada, restrições, contexto do projeto
Produz:   decomposição em etapas e tarefas, DAG de dependências,
          papéis sugeridos por tarefa, critérios de aceitação
Não faz:  efetivar transições, escolher modelo, aprovar, escrever código
Skills:   plan-decomposition, dependency-analysis
Falha se: propõe DAG com ciclo, tarefa sem critério de aceitação,
          ou etapa sem entregável verificável
```

### R2 — Architecture
```
Recebe:   plano, código no base_sha, contexto arquitetural
Produz:   findings arquiteturais, ADRs, análise de trade-off,
          mapa de dependências e acoplamento
Não faz:  implementar
Skills:   architecture-review, adr-authoring, dependency-analysis
Falha se: aprova acoplamento que viola a fronteira de camadas,
          ou não aponta impacto de uma decisão estrutural
```

### R3 — Research
```
Recebe:   pergunta técnica específica, com escopo
Produz:   evidência externa com fonte, data de verificação e grau de integridade
Não faz:  decidir arquitetura; opinar sem fonte
Skills:   deep-research, source-validation
Regra:    informação temporal (API, preço, modelo, versão, recurso
          experimental) EXIGE consulta à fonte oficial atual  ★
Falha se: apresenta informação de treino como fato atual verificado
```

### R4 — Builder
```
Recebe:   Task Packet com objetivo, critérios, allowed_paths, base_sha
Produz:   commit na branch da tarefa, patch, testes, evidência de execução
Não faz:  revisar o próprio trabalho como juiz final; tocar produção
Skills:   implementation, frontend-build, backend-build, test-writing, ci-repair
Falha se: toca forbidden_paths, ignora critério de aceitação,
          ou entrega sem teste quando a tarefa exige
```

### R5 — Reviewer
```
Recebe:   artefato + (nas passagens 2,3,4) as saídas anteriores
Produz:   review estruturado, findings com severidade e evidência
Não faz:  implementar a correção; aprovar em nome do humano
Skills:   plan-review, code-review, source-validation
Regra:    nas passagens 2, 3 e 4, comments_on_prior_work = true  ★
Falha se: produz finding sem evidência, ou não meta-revisa quando deveria
```

### R6 — QA & Testing
```
Recebe:   implementação, critérios de aceitação
Produz:   matriz de teste, testes escritos, resultados, análise de regressão
Não faz:  aprovar release
Skills:   test-design, regression-analysis, ci-diagnosis
Falha se: declara cobertura sem execução, ou ignora caso de negação
```

### R7 — Security & Data
```
Recebe:   migrations, policies, configuração, dependências
Produz:   findings de segurança, matriz allow/deny de RLS,
          avaliação de migration (aplica e reverte)
Não faz:  aplicar em produção
Skills:   security-audit, rls-audit, migration-review, secrets-review
Regra:    finding critical de segurança BLOQUEIA progresso  ★
Falha se: aprova policy sem caso de negação testado
```

### R8 — UX & Browser Verification
```
Recebe:   preview pair pronto, critérios de aceitação, contas de teste
Produz:   evidência de navegador (screenshots, traces), findings de a11y e UX
Não faz:  tocar produção; alterar código
Skills:   browser-validation, accessibility-review
Regra:    só inicia quando preview_pair_ready = true  ★
Falha se: valida contra ambiente errado ou aceita fluxo inacessível por teclado
```

### R9 — Release & Evidence
```
Recebe:   todas as evidências, findings, checks e decisões da etapa
Produz:   ledger consolidado, verdict de prontidão, riscos residuais
Não faz:  merge, deploy, aprovar
Skills:   evidence-synthesis, release-readiness
Falha se: declara pronto com finding bloqueante aberto ou evidência pending
```

---

## 4. O registry em YAML

```yaml
version: 1
registry: rns-agent-registry
updated_at: 2026-09-20

roles:
  R1:
    name: orchestration-intelligence
    title: Orchestration Intelligence
    write_policy: read_only
    can_schedule_runs: false
    can_approve_human_gate: false
    allowed_runtimes: [openai, anthropic, mock]
    default_skills: [plan-decomposition, dependency-analysis]
    minimum_output: agent-output.schema.json

  R2:
    name: architecture
    title: Architecture
    write_policy: read_only
    allowed_runtimes: [openai, anthropic, mock]
    default_skills: [architecture-review, adr-authoring]
    minimum_output: review.schema.json

  R3:
    name: research
    title: Research
    write_policy: read_only
    network: broad
    allowed_runtimes: [openai, anthropic, mock]
    default_skills: [deep-research, source-validation]
    minimum_output: evidence.schema.json
    requires_external_sources: true

  R4:
    name: builder
    title: Builder
    write_policy: workspace_write
    allowed_runtimes: [openai, anthropic, mock]
    default_skills: [implementation, ci-repair]
    minimum_output: agent-output.schema.json
    requires_independent_review: true

  R5:
    name: reviewer
    title: Reviewer
    write_policy: read_only
    independent_review: true
    allowed_runtimes: [openai, anthropic, mock]
    default_skills: [plan-review, code-review]
    minimum_output: review.schema.json

  R6:
    name: qa-testing
    title: QA & Testing
    write_policy: test_workspace
    independent_review: true
    allowed_runtimes: [openai, anthropic, mock]
    default_skills: [test-design, regression-analysis]
    minimum_output: evidence.schema.json

  R7:
    name: security-data
    title: Security & Data
    write_policy: read_only
    independent_review: true
    allowed_runtimes: [openai, anthropic, mock]
    default_skills: [security-audit, rls-audit, migration-review]
    minimum_output: review.schema.json
    blocking_severity: critical

  R8:
    name: ux-browser-verification
    title: UX & Browser Verification
    write_policy: preview_only
    allowed_runtimes: [openai, anthropic, mock]
    default_skills: [browser-validation, accessibility-review]
    minimum_output: evidence.schema.json
    requires_preview_pair: true

  R9:
    name: release-evidence
    title: Release & Evidence
    write_policy: governance_only
    can_merge: false
    can_deploy_production: false
    allowed_runtimes: [openai, anthropic, mock]
    default_skills: [evidence-synthesis, release-readiness]
    minimum_output: evidence.schema.json
```

Note que `runtime` **não** aparece fixo em nenhum papel. Só a lista do que é permitido.

---

## 5. Seleção de papéis por tipo de tarefa

Uma tarefa curta não precisa ativar os nove papéis. O Task Packet escolhe o **menor conjunto necessário**.

| Tipo de tarefa | Papéis ativados |
|---|---|
| Planejar uma missão | R1, R2, R3 |
| Revisar um plano | R5 (×2 runtimes), R2, R7 se houver schema |
| Implementar uma etapa de front-end | R4, depois R5 + R6 + R8 |
| Implementar uma etapa de back-end | R4, depois R5 + R6 + R7 |
| Criar ou alterar migration | R7 obrigatório, R4, R6 |
| Corrigir bug localizado | R4, R5 |
| Pesquisar uma decisão técnica | R3, R2 |
| Preparar release | R9, R6, R8 |

---

## 6. Alternância de runtime — a regra anti-viés

```
Etapa N:    R4 implementa em OpenAI   →  R5 revisa em Anthropic
Etapa N+1:  R4 implementa em Anthropic →  R5 revisa em OpenAI
```

Nenhum fornecedor ganha posição permanente de "melhor programador". A fábrica coleta métricas e descobre isso **empiricamente**, não por intuição.

A alternância é aplicada pelo Agent Router. Na Fase 1, é determinística (alterna por índice de etapa). Na Fase 5, é informada pelos dados de desempenho.

---

## 7. Como o registry é usado em runtime

```
Orchestrator precisa despachar a tarefa T
        ↓
Intelligence Resolver lê agents.yaml no base_sha
        ↓
resolve: papel → write_policy → permission profile
        ↓
resolve: default_skills + required_skills da tarefa
        ↓
resolve: allowed_runtimes ∩ runtimes habilitados
        ↓
Agent Router escolhe o runtime (alternância ou dados)
        ↓
resolve o modelo a partir de models.yaml
        ↓
monta o Task Packet
        ↓
valida contra task-packet.schema.json
        ↓
despacha
```

A versão do registry usada fica gravada em `runs.intelligence_version_id`. Isso permite responder, meses depois: "com quais regras essa execução rodou?"

---

## 8. Evolução do registry

| Mudança | Como fazer |
|---|---|
| Adicionar skill padrão a um papel | PR em `agents.yaml`, revisão de CODEOWNERS |
| Alterar `write_policy` | PR + revisão de **segurança** obrigatória ★ |
| Adicionar runtime permitido | PR + contract tests passando para aquele adapter |
| Criar um papel R10 | PR + justificativa em `continuity/decisions/` |
| Renomear papel | Evitar. Se necessário, manter alias por uma versão |

Toda alteração propaga para `agents.agent_roles` por migration, não por escrita manual no banco.

---

## 9. Checklist

```
□ agents.yaml criado com os nove papéis
□ Schema de validação do registry criado
□ validate-registry.ts rodando em CI
□ Migration semeando agents.agent_roles a partir do YAML
□ Nenhum runtime hardcoded em papel
□ Front-end lendo o registry, sem if por ID de agente  ★
□ runs.intelligence_version_id gravado em toda execução
□ Alternância de runtime implementada no Agent Router
□ Teste: papel com write_policy read_only não consegue escrever
□ Teste: alteração de write_policy exige CODEOWNER de segurança
```

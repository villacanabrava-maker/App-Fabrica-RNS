# CI/CD

---

## 1. Os pipelines

```
.github/workflows/
├── intelligence-ci.yml     ★ valida a inteligência e detecta drift
├── application-ci.yml        lint, types, unit, integration, build
├── database-ci.yml           migrations, RLS tests
├── security.yml              code scanning, secrets, dependências
├── preview-e2e.yml           E2E quando o preview pair estiver pronto
└── release.yml               build de produção e deployment checks
```

---

## 2. `intelligence-ci.yml` — o mais importante

Sem este pipeline, as projeções divergem da fonte canônica em semanas e ninguém percebe.

```yaml
name: Intelligence CI
on:
  pull_request:
    paths:
      - 'factory-intelligence/**'
      - '.agents/**'
      - '.claude/**'
      - '.codex/**'
      - 'AGENTS.md'
      - 'CLAUDE.md'
      - 'scripts/intelligence/**'

permissions:
  contents: read

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile

      - name: Validar JSON Schemas
        run: pnpm tsx scripts/intelligence/validate-schemas.ts

      - name: Validar registries YAML
        run: pnpm tsx scripts/intelligence/validate-registry.ts

      - name: Reconstruir projeções
        run: pnpm tsx scripts/intelligence/build-projections.ts

      - name: Detectar drift          # ★ o coração deste workflow
        run: pnpm tsx scripts/intelligence/check-drift.ts

      - name: Validar fixtures contra schemas
        run: pnpm tsx scripts/intelligence/validate-fixtures.ts

      - name: Evals de fumaça das skills alteradas
        run: pnpm tsx scripts/intelligence/run-evals.ts --changed-only
```

`check-drift.ts` compara o hash de cada arquivo gerado com `projection-manifest.json` e **falha** se houver diferença. Isso torna impossível alguém editar `.claude/skills` à mão sem ser notado.

---

## 3. `application-ci.yml`

```yaml
name: Application CI
on: [pull_request]
permissions:
  contents: read

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm lint

      - name: Typecheck
        run: pnpm typecheck

      - name: Verificar segredos em variáveis públicas   # ★
        run: pnpm tsx scripts/check-public-env.ts

      - name: Testes unitários
        run: pnpm test:unit --coverage

      - name: Testes de integração
        run: pnpm test:integration

      - name: Testes de componente e a11y
        run: pnpm test:storybook

      - name: Build
        run: pnpm build
```

`check-public-env.ts` falha se encontrar padrões de segredo (`sb_secret_`, `sk-`, `ghp_`, `-----BEGIN`) em qualquer variável com prefixo público. Uma linha de script que evita um vazamento.

---

## 4. `database-ci.yml`

```yaml
name: Database CI
on:
  pull_request:
    paths: ['supabase/**']

jobs:
  migrations:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: supabase/setup-cli@v1

      - name: Subir stack local
        run: supabase start

      - name: Aplicar migrations
        run: supabase db reset

      - name: Testar REVERSÃO das migrations       # ★
        run: pnpm tsx scripts/db/test-rollback.ts

      - name: Testes de RLS (inclui casos de negação)
        run: supabase test db

      - name: Verificar RLS habilitada em toda tabela exposta   # ★
        run: pnpm tsx scripts/db/assert-rls-enabled.ts

      - name: Verificar constraint approvals_must_be_human      # ★
        run: pnpm tsx scripts/db/assert-invariants.ts
```

Os três passos marcados transformam regras de documento em regras verificadas.

---

## 5. `security.yml`

```yaml
name: Security
on:
  pull_request:
  schedule: [{ cron: '0 3 * * 1' }]

permissions:
  contents: read
  security-events: write

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Code scanning
        uses: github/codeql-action/analyze@v3
      - name: Secret scanning (histórico)
        run: pnpm tsx scripts/security/scan-secrets.ts
      - name: Auditoria de dependências
        run: pnpm audit --audit-level=high
      - name: Verificar lockfile íntegro
        run: pnpm install --frozen-lockfile --lockfile-only
```

★ **Nenhum workflow usa `pull_request_target` com secrets.** Ver `05-SEGURANCA/01`, §6.

---

## 6. `preview-e2e.yml`

Este workflow **não dispara no PR**. Ele espera o sinal de que o preview pair está pronto.

```yaml
name: Preview E2E
on:
  repository_dispatch:
    types: [rns.preview_pair_ready]     # ★ emitido pelo Orchestrator

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { ref: ${{ github.event.client_payload.head_sha }} }
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps chromium

      - name: E2E contra o preview
        env:
          PREVIEW_URL: ${{ github.event.client_payload.preview_url }}
        run: pnpm test:e2e

      - name: Acessibilidade no preview
        run: pnpm test:a11y

      - name: Reportar status ao Vercel com nome ÚNICO   # ★
        uses: vercel/repository-dispatch/actions/status@v1
        with:
          name: "Vercel - control-plane: preview-e2e"
```

★ Rodar E2E antes de `preview_pair_ready` produz falha intermitente, porque o build pode estar apontando para variáveis antigas. O nome único do check evita colisão com outros workflows.

---

## 7. `release.yml`

```yaml
name: Release
on:
  push:
    branches: [main]

jobs:
  production-checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install --frozen-lockfile

      - name: Smoke tests de produção
        run: pnpm test:smoke

      - name: E2E do caminho crítico
        run: pnpm test:e2e:critical

      - name: Verificação final de segurança
        run: pnpm test:security

      - name: Verificação de migration em produção
        run: pnpm tsx scripts/db/verify-production-migration.ts

      - name: Reportar ao Vercel (nomes únicos)
        uses: vercel/repository-dispatch/actions/status@v1
        with:
          name: "Vercel - control-plane: release-checks"
```

Estes são os checks configurados como **Deployment Checks** no Vercel. Enquanto não passarem, o build de produção **existe mas não recebe usuários**.

---

## 8. Required status checks

Configurados no ruleset de `main`:

```
✓ intelligence-ci / validate
✓ application-ci / quality
✓ database-ci / migrations
✓ security / scan
✓ supabase-preview                 ← check da própria integração Supabase
✓ preview-e2e / e2e                ← quando aplicável
```

E, separadamente, no Vercel como Deployment Checks:

```
✓ Vercel - control-plane: release-checks
✓ Vercel - control-plane: preview-e2e
```

---

## 9. Permissões em workflows

Regra: **todo** workflow declara `permissions:` explicitamente e no mínimo necessário.

```yaml
permissions:
  contents: read          # padrão para a maioria
  # adicionar APENAS o que o job realmente precisa
```

Em workflows reutilizáveis encadeados, as permissões podem ser **reduzidas**, nunca elevadas. Use isso a favor: um workflow reutilizável de teste nunca precisa de `contents: write`.

---

## 10. Cache e velocidade

| Item | Estratégia |
|---|---|
| Dependências | Cache por hash do lockfile |
| Build do Next.js | Cache do `.next/cache` |
| Playwright browsers | Cache por versão |
| Storybook | Build incremental |
| Jobs independentes | Paralelos, não sequenciais |
| Matriz | Só onde agrega (ex.: E2E em 2 navegadores) |

Um CI lento é um CI que as pessoas contornam. Meta: feedback do `application-ci` em `UNSPECIFIED` minutos — definir após medir.

---

## 11. O que quebra o CI e o que não quebra

| Quebra o build | Apenas alerta |
|---|---|
| Lint com erro | Lint com warning |
| Typecheck com erro | Cobertura abaixo da meta |
| Qualquer teste vermelho | Tamanho de bundle acima do budget |
| RLS sem teste de negação | Dependência desatualizada (não vulnerável) |
| Drift entre canônico e projeção | Tempo de CI acima do alvo |
| Segredo em variável pública | |
| Vulnerabilidade high ou critical | |
| Migration que não reverte | |
| Eval com recall abaixo da baseline | |

---

## 12. Checklist

```
□ Os 6 workflows criados
□ permissions: mínimo declarado em todos
□ Nenhum pull_request_target com secrets  ★
□ check-drift.ts falhando em divergência  ★
□ check-public-env.ts detectando segredo  ★
□ assert-rls-enabled.ts verificando todas as tabelas expostas  ★
□ assert-invariants.ts verificando constraints críticas  ★
□ test-rollback.ts provando reversibilidade das migrations
□ preview-e2e disparando por repository_dispatch, não por PR  ★
□ Nomes de check únicos, incluindo o ambiente
□ Required status checks configurados no ruleset
□ Deployment Checks configurados no Vercel
□ Cache configurado
□ Tempo de CI medido e registrado
```

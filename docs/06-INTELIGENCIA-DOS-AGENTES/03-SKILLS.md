# Skills

---

## 1. Agente ≠ Skill

Esta distinção precisa existir desde o primeiro dia.

```
AGENTE   é QUEM está trabalhando       (R5 Reviewer)
SKILL    é O QUE ele sabe fazer        (code-review, security-audit)
```

Combinação:

```
R2 Architecture
   + architecture-review
   + adr-authoring
   + dependency-analysis

R7 Security & Data
   + threat-modeling
   + security-audit
   + rls-audit
   + migration-review
   + secrets-review
```

Assim não é preciso criar um agente novo para cada situação imaginável. Combina-se papel com skills.

---

## 2. A fonte canônica e as projeções

```
factory-intelligence/skills/<nome>/SKILL.md      ← FONTE ÚNICA
                    │
          build-projections.ts
          ┌─────────┴─────────┐
          ▼                   ▼
   .agents/skills/       .claude/skills/
     <nome>/               <nome>/
     SKILL.md              SKILL.md
          │                   │
          └── projection-manifest.json (hash por arquivo)
                        │
                CI compara e FALHA em drift  ★
```

Regras:

1. `.agents/skills` e `.claude/skills` **nunca** são editados à mão. São gerados.
2. Não usar symlink como mecanismo principal — gerar arquivo e manter manifesto com hash é mais previsível e detectável.
3. A semântica é única; a formatação pode diferir por convenção de runtime.
4. `intelligence-ci.yml` reconstrói as projeções e falha se o hash divergir.

---

## 3. Formato de uma skill

```
factory-intelligence/skills/migration-review/
├── SKILL.md              ← obrigatório
├── reference/
│   ├── checklist.md
│   └── patterns.md
├── scripts/
│   └── analyze_migration.sh
└── examples/
    ├── safe-migration.sql
    └── destructive-migration.sql
```

### `SKILL.md`

```markdown
---
name: migration-review
description: Avaliar uma migration de banco quanto a destrutividade, reversibilidade, idempotência e impacto em RLS. Use quando a tarefa envolver arquivos em supabase/migrations/.
---

# Revisão de migration

## Quando usar
Quando o diff tocar `supabase/migrations/**` ou quando o Task Packet
pedir `migration-review`.

## Como proceder

1. Ler a migration inteira antes de opinar.
2. Classificar cada statement:
   · aditivo (CREATE, ADD COLUMN nullable)
   · alterador (ALTER TYPE, SET NOT NULL)
   · destrutivo (DROP, TRUNCATE, DELETE)
3. Para cada statement destrutivo, exigir justificativa explícita
   e plano de reversão.
4. Verificar idempotência: a migration pode rodar duas vezes?
5. Verificar impacto em RLS:
   · a tabela nova tem RLS habilitada?
   · a policy tem `with check` no update?
   · existe caso de negação testado?
6. Verificar compatibilidade com dados existentes.
7. Aplicar e reverter no preview antes de concluir.

## Saída
`review.schema.json` com findings. Severidade mínima:
· DROP sem justificativa       → critical, blocks_progress
· RLS ausente em tabela nova   → critical, blocks_progress
· policy sem `with check`      → high
· migration não idempotente    → high
· sem plano de reversão        → medium

## Nunca
· Aprovar migration sem tê-la aplicado no preview.
· Assumir que "provavelmente está certo".
· Recomendar rodar em produção.
```

### Frontmatter — regras

| Campo | Obrigatório | Regra |
|---|---|---|
| `name` | sim | kebab-case, igual ao nome do diretório |
| `description` | sim | **Uma frase dizendo QUANDO usar.** É o que decide se a skill será carregada ★ |
| outros | não | não são preservados de forma garantida entre runtimes |

★ A descrição é a parte mais importante. Em progressive disclosure, o agente vê apenas `name`, `description` e caminho; só carrega o corpo completo quando decide usar a skill. Uma descrição vaga faz a skill nunca ser usada, ou ser usada na hora errada.

---

## 4. Catálogo inicial

| Skill | Papéis principais | Artefato esperado |
|---|---|---|
| `plan-decomposition` | R1 | DAG, etapas, dependências |
| `dependency-analysis` | R1, R2 | mapa de dependências |
| `architecture-review` | R2, R5 | findings arquiteturais |
| `adr-authoring` | R2 | ADR |
| `deep-research` | R3 | evidência externa com fonte |
| `source-validation` | R3, R5 | verificação de afirmações |
| `implementation` | R4 | patch / commit |
| `frontend-build` | R4 | implementação de UI |
| `backend-build` | R4 | implementação de back-end |
| `test-writing` | R4, R6 | testes |
| `ci-repair` | R4, R6 | correção de CI |
| `ci-diagnosis` | R4, R6 | diagnóstico de falha |
| `code-review` | R5 | review estruturado |
| `plan-review` | R5 | review de plano |
| `test-design` | R6 | matriz de teste |
| `regression-analysis` | R6 | análise de regressão |
| `migration-review` | R7 | avaliação de migration |
| `rls-audit` | R7 | matriz allow/deny |
| `security-audit` | R7 | findings de AppSec |
| `secrets-review` | R7 | verificação de segredos |
| `browser-validation` | R8 | evidência de navegador |
| `accessibility-review` | R8 | findings de a11y |
| `release-readiness` | R9 | verdict de release |
| `evidence-synthesis` | R9 | ledger consolidado |

---

## 5. Restrições de runtime a respeitar

Estes são fatos das plataformas que o builder de projeções precisa honrar.

| Restrição | Consequência |
|---|---|
| Claude descobre skills em `.claude/skills/<nome>/SKILL.md`, exatamente **um nível** de profundidade | O builder não pode aninhar mais |
| A descoberta acontece **uma vez, no início da sessão** | Alterar skill no meio de uma execução não tem efeito. Nova versão exige nova sessão ★ |
| Skills seguem o commit/branch do checkout | O `base_sha` determina qual versão da inteligência foi usada |
| Cada skill anexada consome contexto e aumenta o startup | Anexar só o necessário via `required_skills` |
| Codex usa progressive disclosure com a lista inicial limitada a uma fração pequena do contexto | Descrições curtas e precisas; corpo volumoso em `reference/` |
| A cadeia de `AGENTS.md` tem limite agregado | Bootloader curto; conhecimento em skills e documentos |
| ★ Skills do repositório entram na **trust boundary** | CODEOWNERS obrigatório |

---

## 6. `required_skills` no Task Packet

```json
"required_skills": ["migration-review", "rls-audit"]
```

Regra: anexar **apenas** o necessário para a tarefa. Disponibilizar tudo indiscriminadamente aumenta custo, tempo de startup e ruído de contexto — e reduz a precisão.

O Intelligence Resolver monta a lista assim:

```
required_skills = default_skills do papel
                ∪ skills específicas da tarefa
                ∩ skills existentes no base_sha
```

Se uma skill exigida não existe no `base_sha`, o Task Packet é **inválido** e a tarefa é bloqueada com erro claro. Não se executa com inteligência parcial.

---

## 7. Como escrever uma boa skill

| Faça | Não faça |
|---|---|
| Descrição que diz **quando** usar | Descrição que descreve o que a skill "é" |
| Passos numerados e verificáveis | Prosa genérica sobre boas práticas |
| Critérios de severidade explícitos | "Use bom senso" |
| Uma seção "Nunca" | Só o caminho feliz |
| Exemplos de entrada e saída | Só teoria |
| Referência a schema de saída | Formato livre |
| Conteúdo durável | Versões de API, preços, nomes de modelo ★ |

★ Skill **não** é lugar de informação temporal. Versão de biblioteca, preço e nome de modelo mudam. A skill diz **como verificar**, não qual é o valor.

---

## 8. Versionamento

```
skill_versions
  skill_name       migration-review
  version          v7
  content_sha      sha256 do SKILL.md
  git_sha          commit onde foi definida
```

Toda execução grava `runs.skill_versions[]`. Isso permite responder: "essa revisão usou qual versão da skill de migration?"

Mudança de skill é mudança de engenharia:

```
PR: "Improve database migration review skill"
      ↓
CODEOWNERS revisa
      ↓
evals rodam contra a nova versão
      ↓
compara com a baseline
      ↓
merge só se não houver regressão de recall
```

---

## 9. Avaliação de skills

Cada skill crítica tem casos de eval. Exemplo para `migration-review`:

```
Caso A   migration saudável                → não deve gerar finding falso
Caso B   DROP destrutivo sem justificativa → deve gerar critical
Caso C   RLS ausente em tabela nova        → deve gerar critical
Caso D   policy com using(true)            → deve gerar high
Caso E   migration incompatível com dados  → deve gerar high
Caso F   migration não idempotente         → deve gerar high
```

Rodando nos dois runtimes, mede-se: recall de findings, falsos positivos, aceitação humana, custo e latência. Detalhes em `06-EVALS.md`.

---

## 10. Checklist

```
□ Estrutura factory-intelligence/skills/ criada
□ Skills do catálogo inicial escritas
□ Toda skill com frontmatter name + description que diz QUANDO usar
□ Nenhuma skill contendo informação temporal (versão, preço, modelo)  ★
□ build-projections.ts gerando .agents/skills e .claude/skills
□ Profundidade de .claude/skills respeitando um nível
□ projection-manifest.json com hash por arquivo
□ intelligence-ci.yml falhando em drift  ★
□ CODEOWNERS cobrindo factory-intelligence/skills/
□ skill_versions gravado em toda execução
□ required_skills validado contra o base_sha
□ Task Packet com skill inexistente é rejeitado
□ Evals das skills críticas escritos
```

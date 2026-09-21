# Evals — Avaliar a inteligência, não só o software

**Fase de entrega: 4.** Mas as fixtures nascem na Fase 0/1, porque elas também servem ao `MockAdapter`.

---

## 1. Por que avaliar agentes

Não basta testar o código que os agentes produzem. É preciso testar **os próprios agentes, papéis e skills**.

Sem isso, a fábrica opera com afirmações como "o Claude parece melhor em revisão" — opinião, não engenharia.

Com isso, a fábrica responde:

> "Para este tipo de tarefa, neste nível de complexidade, com esta skill, este runtime apresentou melhor desempenho histórico."

Isso transforma a operação da fábrica em **conhecimento**, e é o ativo estratégico de longo prazo do projeto.

---

## 2. A unidade experimental

```
role + runtime + model + skill_version + task_fixture + permission_profile
```

Mudar qualquer um desses é um experimento diferente. Comparar resultados sem fixar os outros é ruído.

---

## 3. Estrutura no repositório

```
factory-intelligence/evals/
├── datasets/
│   ├── planning/
│   ├── architecture/
│   ├── frontend/
│   ├── backend/
│   ├── database/
│   ├── security/
│   ├── code-review/
│   ├── testing/
│   ├── accessibility/
│   └── deployment/
├── cases/
│   └── <case-id>/
│       ├── case.yaml          descrição, papel, skills, entrada
│       ├── input/             arquivos da fixture
│       └── expected.yaml      findings esperados, com id e severidade
├── rubrics/
│   └── <rubric>.md            como pontuar saídas não binárias
└── baselines/
    └── <date>-<runtime>.json  resultado de referência
```

---

## 4. Dataset inicial

| Eval | O que testa | Papel |
|---|---|---|
| `architecture-invalid-dependency` | R2 encontra acoplamento problemático | R2 |
| `fake-security-finding` | R5 **evita falso positivo** | R5 |
| `sql-drop-production` | R7 identifica operação destrutiva | R7 |
| `rls-missing-policy` | R7 detecta tabela exposta sem RLS | R7 |
| `rls-overpermissive` | R7 detecta `using(true)` inadequado | R7 |
| `rls-update-without-check` | R7 detecta update sem `with check` | R7 |
| `migration-not-idempotent` | R7 detecta migration não idempotente | R7 |
| `migration-incompatible-data` | R7 detecta incompatibilidade com dados | R7 |
| `prompt-injection-in-readme` | ★ agente **não** transforma conteúdo não confiável em autoridade | todos |
| `malicious-skill-change` | pipeline bloqueia alteração de skill | CI |
| `stale-provider-doc` | R3 identifica necessidade de consultar fonte atual | R3 |
| `failing-unit-test` | R6 localiza a regressão | R6 |
| `missing-acceptance-criterion` | R5/R9 **não aprovam prematuramente** | R5, R9 |
| `inaccessible-button` | R8 encontra problema de a11y | R8 |
| `keyboard-trap` | R8 detecta armadilha de foco | R8 |
| `clean-change` | ★ agente **não inventa finding** onde não há problema | R5 |

★ Os dois casos marcados são os mais importantes. Um revisor que encontra problema em tudo é tão inútil quanto um que não encontra nada.

---

## 5. Formato de um caso

```yaml
# cases/rls-missing-policy/case.yaml
id: rls-missing-policy
title: Tabela nova exposta sem RLS habilitada
role: R7
required_skills: [migration-review, rls-audit]
permission_profile: read_only
input:
  repository_fixture: input/
  base_sha: fixture
  changed_files:
    - supabase/migrations/20260920_add_sessions.sql
difficulty: medium
category: security
```

```yaml
# cases/rls-missing-policy/expected.yaml
must_find:
  - claim_matches: "RLS.*(não habilitada|not enabled|missing)"
    category: security
    min_severity: critical
    blocks_progress: true

must_not_find:
  - claim_matches: "performance"
    reason: "Não há problema de performance nesta fixture"

max_findings: 4
required_evidence_types: [database]
```

---

## 6. Métricas

Nunca resumir a "passou/falhou".

| Métrica | Definição |
|---|---|
| **Task success rate** | Tarefas realmente aceitas |
| **First-pass acceptance** | Aceitas sem rework |
| **Finding precision** | Findings válidos / total de findings |
| **Finding recall** | Defeitos conhecidos encontrados / defeitos existentes |
| **False-positive rate** | Findings incorretos |
| **False-negative rate** | Defeitos conhecidos não encontrados |
| **Human override rate** | Decisões de IA revertidas por humano |
| **Escaped defect rate** | Problemas que passaram por todos os gates |
| **Rework rate** | Tarefas reabertas |
| **Cost per accepted task** | Custo total / tarefas finais aceitas |
| **Tokens per accepted task** | Consumo por sucesso |
| **Median / P95 latency** | Tempo de ciclo |
| **Tool error rate** | Falhas de ferramentas |
| **CI first-pass rate** | PRs que passam CI sem reparo |
| **Cross-model disagreement rate** | Frequência e categoria das divergências |
| **Security block rate** | Execuções bloqueadas por política |
| **Model drift** | Mudança de resultado após troca de modelo ou versão |

★ Para precision e recall é preciso um **truth set curado** por humano. Até existir amostra suficiente, os thresholds de qualidade aceitável permanecem **`UNSPECIFIED`**. Escolher "95%" agora seria arbitrário e viraria uma meta falsa.

---

## 7. O que cada execução de eval persiste

```
dataset_version · case_id · role · runtime · model · model_snapshot
skill_versions[] · constitution_version · permission_profile
input_sha · output · output_sha
score · precision · recall
tokens_in · tokens_cached · tokens_out · cost · latency_ms
human_adjudication · adjudicated_by · adjudicated_at
```

Sem `model_snapshot` e `skill_versions`, um resultado de eval não é comparável seis meses depois.

---

## 8. Quando os evals rodam

| Gatilho | O que roda |
|---|---|
| PR que altera `factory-intelligence/skills/**` | Evals da skill alterada, comparados à baseline ★ |
| PR que altera a Constituição ou o registry | Suite de fumaça completa |
| Troca de modelo em `models.yaml` | Suite completa, novo baseline |
| Agendado (semanal) | Suite completa, detecção de drift |
| Manual | Qualquer subconjunto |

★ Um PR de skill que **reduz o recall** em relação à baseline é bloqueado. É a proteção contra "melhorar" uma skill e piorar o resultado sem perceber.

---

## 9. O dataset que a fábrica constrói sozinha

A partir da Fase 2, cada execução real alimenta:

```
role · skill · runtime · model · task_class · complexity
success · human_acceptance · rework · cost · latency
bugs_detected · bugs_introduced · ci_failures
human_rejection_rate · disagreement_category
```

Depois de dezenas de aplicativos, isso vira o insumo do **Agent Router** (Fase 5):

```
características da tarefa
        ↓
modelo de routing
        ↓
consulta o histórico: score, custo, latência,
taxa de sucesso, taxa de regressão
        ↓
melhor combinação papel + runtime + modelo + esforço
```

Não é "GPT é melhor". É uma consulta a dados próprios.

---

## 10. Adjudicação humana

Nem todo resultado é binário. Alguns exigem julgamento.

```
saída do agente
      ↓
comparação automática com expected.yaml
      ├── casa exatamente → pontua
      └── ambíguo → FILA DE ADJUDICAÇÃO
                        ↓
                humano avalia e pontua
                        ↓
                resultado entra no truth set
```

A fila de adjudicação é pequena por design. Se ela cresce, os casos estão mal especificados.

---

## 11. Checklist

```
□ Estrutura factory-intelligence/evals/ criada
□ Casos do dataset inicial escritos
□ prompt-injection-in-readme implementado  ★
□ clean-change implementado (anti falso positivo)  ★
□ Runner de evals executando contra qualquer adapter
□ MockAdapter usa as mesmas fixtures  [F1]
□ Resultado persistido com model_snapshot e skill_versions
□ Baseline gravada por runtime
□ CI roda evals da skill alterada em PRs de skill
□ PR que reduz recall é bloqueado  ★
□ Fila de adjudicação humana implementada  [F4]
□ Thresholds permanecem UNSPECIFIED até existir baseline real  ★
□ Dashboard de evals na aba Avaliações do agente  [F4]
```

# Task Packet — A unidade formal de trabalho

---

## 1. O que é

O Task Packet é a **ordem de serviço** que o Orchestrator entrega a um agente. Ele substitui o "prompt gigante".

```
ERRADO
Orchestrator → prompt de 8000 palavras → modelo → torça para dar certo

CERTO
Orchestrator → Task Packet validado por schema
                 · quem você é (papel)
                 · sobre qual SHA trabalhar
                 · o que fazer (objetivo + critérios)
                 · onde pode mexer (allowed/forbidden paths)
                 · o que sabe usar (required_skills)
                 · com que permissão
                 · com que orçamento
                 · que formato de saída produzir
               → modelo → saída validável
```

O agente não começa do zero. Ele sabe quem é, qual papel exerce, quais regras obedece, quais metodologias usar, quais skills tem, quais ferramentas pode usar, quais arquivos pode alterar, quem é o próximo agente, qual evidência precisa produzir, como avaliar o trabalho do outro agente, quando deve parar e quando deve escalar.

---

## 2. O envelope completo

```json
{
  "schema_version": "1.0",

  "mission_id": "mis_01",
  "stage_id": "stg_03",
  "task_id": "tsk_481",
  "run_id": "run_765",

  "role": "R5",
  "runtime": "openai",
  "model": null,

  "repository": "RNS/rns-app-escolar",
  "base_sha": "0123456789abcdef0123456789abcdef01234567",
  "branch": "review/tsk_481-openai-r1",

  "objective": "Revisar a implementação do módulo de autenticação da etapa 03.",

  "acceptance_criteria": [
    "Identificar riscos de segurança materiais",
    "Verificar cobertura de teste dos fluxos de login e recuperação",
    "Classificar findings por severidade com evidência"
  ],

  "allowed_paths": [
    "app/**",
    "features/auth/**",
    "supabase/migrations/**",
    "tests/**"
  ],
  "forbidden_paths": [
    "factory-intelligence/**",
    ".github/workflows/**",
    ".agents/**",
    ".claude/**",
    "AGENTS.md",
    "CLAUDE.md",
    "**/.env*"
  ],

  "required_skills": ["code-review", "security-audit", "rls-audit"],
  "required_evidence": ["code", "test", "database"],
  "required_tests": [],

  "permissions": {
    "filesystem": "read_only",
    "github": "read",
    "supabase": "preview_read",
    "vercel": "preview_read",
    "network": "restricted",
    "production": "deny"
  },

  "budget": {
    "max_cost_usd": null,
    "max_wall_seconds": null,
    "max_review_hops": 4
  },

  "review_policy": {
    "sequence": ["openai_r1", "claude_r1", "openai_r2", "claude_r2"],
    "human_gate_after": "claude_r2"
  },

  "context_refs": {
    "prior_round_id": null,
    "prior_artifacts": [],
    "spec_version": 3,
    "plan_version": 7
  },

  "expected_artifacts": ["review.json", "findings.json"],
  "expected_output_schema": "review.schema.json",

  "intelligence_version": "0123456789abcdef0123456789abcdef01234567",
  "correlation_id": "cor_07",
  "idempotency_key": "review:tsk_481:openai:r1:01234567"
}
```

---

## 3. Campo a campo

| Campo | Obrigatório | Regra |
|---|---|---|
| `schema_version` | sim | Versionamento do contrato |
| `mission_id` / `stage_id` / `task_id` / `run_id` | sim (task, run) | Correlação completa |
| `role` | sim | `R1`..`R9` |
| `runtime` | sim | `openai`, `anthropic`, `antigravity`, `deterministic`, `mock` |
| `model` | sim, pode ser `null` | **`null` no envelope.** Resolvido em runtime pelo registry ★ |
| `repository` | sim | `owner/name` |
| `base_sha` | sim | 40 hex. **Sem isso o packet é inválido** ★ |
| `branch` | pode ser `null` | Branch de trabalho da execução |
| `objective` | sim | Uma frase clara. Não é um prompt |
| `acceptance_criteria` | sim | Lista verificável. Vazia é inválida para tarefas materiais |
| `allowed_paths` | sim | Glob. Aplicado pelo sandbox |
| `forbidden_paths` | sim | Sempre inclui `forbidden_paths_always` das permissões |
| `required_skills` | sim | Só o necessário. Todas devem existir no `base_sha` ★ |
| `required_evidence` | sim | Tipos de evidência que a saída deve trazer |
| `required_tests` | sim | Pode ser vazia para papéis de revisão |
| `permissions` | sim | Derivado do perfil do papel |
| `budget` | sim | `max_review_hops` ≤ 4 |
| `review_policy` | pode ser `null` | Presente em tarefas que fazem parte de um ciclo |
| `context_refs` | sim | O que o agente precisa saber do passado |
| `expected_artifacts` | sim | Nomes dos artefatos esperados |
| `expected_output_schema` | sim | Qual schema valida a saída |
| `intelligence_version` | sim | SHA da inteligência usada |
| `correlation_id` | sim | Rastreabilidade ponta a ponta |
| `idempotency_key` | sim | Determinística, sem timestamp |

★ **Campos desconhecidos recebem `null`, nunca um número inventado.** Um `max_cost_usd: 5.00` inventado é pior que `null`: ele parece uma decisão.

---

## 4. Como o Task Packet é montado

```
Orchestrator decide despachar a tarefa T
        ↓
1. Carrega a tarefa e sua etapa/missão
        ↓
2. Intelligence Resolver lê o registry no base_sha
     · papel → write_policy → permission profile
     · default_skills do papel
        ↓
3. Soma as skills específicas da tarefa
        ↓
4. Valida: todas as skills existem no base_sha?
     · não → TASK BLOQUEADA com erro claro  ★
        ↓
5. Monta allowed_paths e forbidden_paths
     · forbidden = forbidden_paths_always ∪ específicos da tarefa
        ↓
6. Agent Router escolhe o runtime
     · allowed_runtimes do papel ∩ runtimes habilitados
     · alternância (Fase 1) ou dados de desempenho (Fase 5)
        ↓
7. Resolve budget (run → missão → organização)
        ↓
8. Monta context_refs (rodadas anteriores, artefatos, versões)
        ↓
9. Calcula idempotency_key determinística
        ↓
10. VALIDA contra task-packet.schema.json  ★
        ↓
11. Persiste em task_packets (versionado, imutável)
        ↓
12. Despacha para o adapter
```

O passo 10 é obrigatório. Um Task Packet inválido nunca sai do Orchestrator.

---

## 5. Imutabilidade

```
task_packets
  id · task_id · version · payload · payload_sha · created_at
  unique (task_id, version)
```

Um Task Packet **nunca** é editado. Mudança gera nova versão. Isso permite responder: "qual exatamente era a ordem de serviço quando o run 765 executou?"

---

## 6. Validação da saída contra o packet

Quando o agente devolve:

```
1. Validar contra expected_output_schema
        ↓  inválido → tentativa corretiva → se falhar, BLOCKED
2. Validar que todos os expected_artifacts existem
        ↓
3. Validar que os paths modificados ∈ allowed_paths  ★
        ↓
4. Validar que NENHUM forbidden_path foi tocado  ★
        ↓  violou → REJEITAR + INCIDENTE DE SEGURANÇA
5. Validar que finding_ids e evidence_ids referenciados existem
        ↓
6. Validar que required_evidence foi atendido
        ↓
consumir
```

★ Os passos 3 e 4 são os que transformam `allowed_paths` de sugestão em fronteira real.

---

## 7. Exemplos por papel

### R4 Builder — implementação

```json
{
  "role": "R4", "runtime": "anthropic", "model": null,
  "objective": "Implementar o fluxo de login com e-mail e senha conforme a etapa 03.",
  "acceptance_criteria": [
    "Formulário com validação client e server",
    "Sessão persistida via Supabase Auth",
    "Erro genérico em credencial inválida (sem revelar se o e-mail existe)",
    "Testes unitários dos casos de sucesso e falha",
    "Teste E2E do fluxo completo"
  ],
  "allowed_paths": ["app/(auth)/**", "features/auth/**", "tests/auth/**"],
  "forbidden_paths": ["factory-intelligence/**", ".github/workflows/**",
                      "supabase/migrations/**"],
  "required_skills": ["frontend-build", "backend-build", "test-writing"],
  "required_evidence": ["code", "test"],
  "required_tests": ["unit:auth", "e2e:login"],
  "permissions": { "filesystem": "workspace_write", "github": "branch_write",
                   "supabase": "preview_only", "production": "deny" },
  "expected_output_schema": "agent-output.schema.json"
}
```

### R7 Security & Data — revisão de migration

```json
{
  "role": "R7", "runtime": "openai", "model": null,
  "objective": "Avaliar a migration 20260920_sessions.sql quanto a destrutividade, reversibilidade e RLS.",
  "acceptance_criteria": [
    "Classificar cada statement como aditivo, alterador ou destrutivo",
    "Verificar RLS habilitada e policy com with check",
    "Confirmar aplicação e reversão no preview",
    "Apontar impacto em dados existentes"
  ],
  "allowed_paths": ["supabase/migrations/**", "supabase/tests/**"],
  "forbidden_paths": ["factory-intelligence/**", "app/**"],
  "required_skills": ["migration-review", "rls-audit"],
  "required_evidence": ["database", "test"],
  "permissions": { "filesystem": "read_only", "supabase": "preview_read",
                   "production": "deny" },
  "expected_output_schema": "review.schema.json"
}
```

### R8 UX & Browser — verificação

```json
{
  "role": "R8", "runtime": "anthropic", "model": null,
  "objective": "Verificar o fluxo de login no preview e auditar acessibilidade.",
  "acceptance_criteria": [
    "Fluxo completo executado no navegador com evidência visual",
    "Navegação por teclado do início ao fim",
    "axe sem violações em tema claro e escuro",
    "Foco visível em todos os controles"
  ],
  "allowed_paths": [],
  "forbidden_paths": ["**"],
  "required_skills": ["browser-validation", "accessibility-review"],
  "required_evidence": ["browser"],
  "permissions": { "filesystem": "read_only", "vercel": "preview",
                   "network": "preview_only", "production": "deny" },
  "context_refs": { "preview_url": "https://...", "test_accounts": ["..."] },
  "expected_output_schema": "evidence.schema.json"
}
```

Note: R8 tem `forbidden_paths: ["**"]` — ele não escreve código, só verifica.

---

## 8. Erros comuns a evitar

| Erro | Por que é ruim |
|---|---|
| `acceptance_criteria` vazia | O agente inventa o que é "pronto" |
| `allowed_paths: ["**"]` para um Builder | Sandbox vira decoração |
| Esquecer `factory-intelligence/**` em `forbidden_paths` | O agente pode reescrever as próprias regras ★ |
| Anexar todas as skills | Custo, latência e ruído de contexto |
| `model` preenchido no envelope | Quebra a separação Role ≠ Model |
| `base_sha` ausente | Execução não auditável |
| `idempotency_key` com timestamp | Retomada duplica efeito |
| Objetivo escrito como prompt longo | O packet não é um prompt; é uma ordem de serviço |
| Budget inventado | Falsa precisão vira decisão errada |

---

## 9. Checklist

```
□ task-packet.schema.json criado com additionalProperties: false
□ Validação obrigatória antes de despachar  ★
□ forbidden_paths_always sempre incluído
□ factory-intelligence/** proibido em todo packet de implementação  ★
□ required_skills validado contra o base_sha
□ Skill inexistente → tarefa bloqueada com erro claro
□ model sempre null no envelope
□ base_sha obrigatório, 40 hex
□ idempotency_key determinística sem timestamp
□ Task Packet versionado e imutável em task_packets
□ Validação de saída conferindo paths modificados  ★
□ Violação de forbidden_path gera incidente, não apenas erro
□ Campos desconhecidos como null, nunca valor inventado
```

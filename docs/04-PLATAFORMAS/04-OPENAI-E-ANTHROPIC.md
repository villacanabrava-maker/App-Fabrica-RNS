# OpenAI e Anthropic — Como vão funcionar

**VERIFICAR ANTES DE USAR:** confirmado em 20/09/2026. Modelos, preços, superfícies e nomes de produto mudam rápido. **Nada aqui deve virar constante em código.**

---

## 1. O princípio que protege a fábrica

> **OpenAI e Anthropic são implementações do nosso `AgentAdapter`. Eles não são o contrato.**

```
                RNS ORCHESTRATOR
                       │
             Agent Adapter Contract        ← NOSSO, estável
                       │
        ┌──────────────┴──────────────┐
        ▼                             ▼
  OpenAI Adapter                Anthropic Adapter
        │                             │
        ├ Codex SDK / worker          ├ Managed Agents
        ├ Agents API                  ├ Claude Code worker
        ├ GitHub Action               ├ GitHub Action
        └ runtime futuro              └ runtime futuro
```

Se um fornecedor mudar o contrato, troca-se o adapter. O Orchestrator e o domínio não mudam.

---

## 2. O contrato

```typescript
export interface AgentAdapter {
  start(task: TaskPacket): Promise<RunHandle>;
  resume(runId: string, input: unknown): Promise<RunHandle>;
  cancel(runId: string): Promise<void>;
  getStatus(runId: string): Promise<RunStatus>;
  getEvents(runId: string): AsyncIterable<AgentEvent>;
  getArtifacts(runId: string): Promise<Artifact[]>;
  getUsage(runId: string): Promise<Usage>;
}
```

Contract tests garantem que **todos** os adapters — incluindo o `MockAdapter` da Fase 1 — se comportam igual sob o mesmo Task Packet.

---

## 3. Lado OpenAI

### Superfícies disponíveis

| Superfície | Vantagem | Restrição | Uso recomendado |
|---|---|---|---|
| **Codex SDK / worker próprio** | Controle completo do worktree e do sandbox | Nós operamos o runtime | Implementação (R4) |
| **Agents API** | Sessão assíncrona gerenciada, sandbox, MCP, subagentes | Maior dependência do runtime do fornecedor | Workload gerenciado |
| **Codex GitHub Action** | Integração direta com CI, output estruturável | Preso ao runner/job | Reviews e checks previsíveis |

### Como a inteligência chega até o Codex

```
AGENTS.md na raiz do repositório
     ↓ lido antes do trabalho, hierarquicamente
     ↓ arquivo mais próximo do diretório tem precedência
.agents/skills/<skill>/SKILL.md
     ↓ progressive disclosure: Codex vê nome, descrição e caminho;
       só carrega o SKILL.md completo quando decide usar a skill
```

★ **Limite prático importante:** a lista inicial de skills é limitada a uma fração pequena do contexto (na ordem de alguns milhares de caracteres), e a cadeia de `AGENTS.md` tem limite agregado. Por isso:

1. `AGENTS.md` é um **bootloader curto**, não um manual.
2. `required_skills` no Task Packet existe para não anexar tudo.
3. Conhecimento volumoso fica em documentos carregados sob demanda.

### Autenticação preferida

Workload Identity Federation com GitHub Actions: o job troca o OIDC do GitHub por credencial temporária, com regras restringíveis por repositório, branch, ambiente e `workflow_ref`.

---

## 4. Lado Anthropic

### Superfícies disponíveis

| Superfície | Vantagem | Restrição | Uso recomendado |
|---|---|---|---|
| **Managed Agents** | Sessão gerenciada, skills, mount de repositório GitHub, eventos | Depende do ciclo de vida do fornecedor | Adapter Claude cloud principal |
| **Claude Code worker** | Alinhamento com a experiência Claude Code | Execução precisa ser governada pelo nosso wrapper | Alternativa self-managed |
| **GitHub Action** | Integração com CI | Preso ao runner | Reviews e checks |

### Como a inteligência chega até o Claude

```
CLAUDE.md na raiz
     ↓
.claude/skills/<skill-name>/SKILL.md
     ↓ descoberto AUTOMATICAMENTE quando um repositório GitHub
       é montado na sessão
     ↓ a varredura acontece UMA VEZ no início da sessão
     ↓ commits no meio da sessão NÃO são recarregados  ★
```

Fatos operacionais confirmados:

| Fato | Consequência |
|---|---|
| Skills devem estar em `.claude/skills/<nome>/SKILL.md`, exatamente um nível | O builder de projeções precisa respeitar essa profundidade |
| Descoberta ocorre no início da sessão | Alterar skill no meio da execução não tem efeito. Nova versão exige nova sessão |
| Skills seguem o commit/branch do checkout | O `base_sha` do Task Packet determina qual versão da inteligência foi usada |
| Cada skill anexada consome contexto e aumenta o tempo de startup | Anexar só o necessário |
| Sessões medem por **session-hour** além dos tokens | O Budget Service precisa contar horas de sessão, não só tokens |
| ★ **Skills do repositório fazem parte da trust boundary** | Quem tem commit access pode mudar o comportamento do agente. CODEOWNERS obrigatório |

O aviso oficial é explícito: só monte repositórios em que você confia, e revise `.claude/skills` antes de montar repositórios que aceitam contribuições externas.

### Autenticação preferida

WIF/OIDC para GitHub Actions, com service accounts e tokens de curta duração.

---

## 5. A convergência que a fábrica aproveita

```
OpenAI                          Anthropic
──────                          ─────────
AGENTS.md                       CLAUDE.md
.agents/skills/<n>/SKILL.md     .claude/skills/<n>/SKILL.md
frontmatter: name, description  frontmatter: name, description
progressive disclosure          carga quando relevante
MCP                             MCP
subagentes                      coordenação multiagente
WIF/OIDC                        WIF/OIDC
```

Os dois convergiram para **skills baseadas em filesystem, versionadas no repositório**. É exatamente o que a arquitetura da fábrica precisa.

Por isso:

```
factory-intelligence/skills/<nome>/SKILL.md     ← FONTE CANÔNICA
              │
      build-projections.ts
      ┌───────┴───────┐
      ▼               ▼
.agents/skills/   .claude/skills/
  <nome>/           <nome>/
  SKILL.md          SKILL.md
      │               │
      └─ projection-manifest.json com hash de cada arquivo
                      │
              CI compara e FALHA em caso de drift  ★
```

Não usar symlink como mecanismo principal. Gerar arquivos e manter manifesto com hash é mais previsível e detectável.

---

## 6. O que a fábrica NÃO delega ao fornecedor

| Capacidade | Onde vive |
|---|---|
| Decidir qual modelo roda agora | Agent Router, no Orchestrator |
| Decidir a próxima passagem do ciclo | Orchestrator |
| Chamar o outro fornecedor | Orchestrator. **Cross-provider direto é proibido** ★ |
| Estado do workflow | Factory Supabase |
| Budget e interrupção | Budget Service |
| Aprovação | Humano |
| Auditoria | Factory Supabase |

Subagentes internos do mesmo fornecedor são permitidos. Um subagente Claude chamando OpenAI diretamente **não é**, porque destrói custo, rastreabilidade, autorização, profundidade, retry, idempotência e logs.

---

## 7. Modelos — política

```
NUNCA:  const MODEL = "gpt-5.3-codex"
        const MODEL = "claude-sonnet-5"

SEMPRE: resolvido em runtime a partir de
        factory-intelligence/registry/models.yaml
        espelhado em agents.model_profiles
```

```yaml
# models.yaml
version: 1
models:
  - key: openai-primary
    runtime: openai
    model: UNSPECIFIED        # preenchido na operação
    enabled: true
    notes: "revisão e implementação"
  - key: anthropic-primary
    runtime: anthropic
    model: UNSPECIFIED
    enabled: true
  - key: anthropic-deep
    runtime: anthropic
    model: UNSPECIFIED
    enabled: false
    notes: "análises longas; custo maior"
```

A interface de Configurações lista apenas as chaves habilitadas. Digitar nome de modelo em texto livre é proibido.

---

## 8. Custo — como calcular sem inventar

A fórmula é estável; os preços não. **Não congele preço em documento.**

```
C_openai =
    (uncached_input_tokens / 1e6 × preço_input)
  + (cached_input_tokens   / 1e6 × preço_input_cache)
  + (output_tokens         / 1e6 × preço_output)

C_anthropic =
    (uncached_input_tokens / 1e6 × preço_input)
  + (cache_hit_tokens      / 1e6 × preço_cache_hit)
  + (output_tokens         / 1e6 × preço_output)
  + (running_session_hours × preço_session_hour)     ★ específico de Managed Agents
```

★ Managed Agents cobra também por **hora de sessão em estado `running`**. Tempo ocioso, reagendamento e sessões terminadas não entram nesse medidor. O `Usage` retornado pelo adapter precisa incluir `session_hours`.

Custo total da fábrica:

```
C_total = Supabase_factory + Supabase_apps + Supabase_preview_hours
        + Vercel + GitHub + Orchestrator_compute
        + OpenAI_tokens + Anthropic_tokens + Anthropic_session_runtime
        + CI_compute + Observability + Network
```

Tudo sem quantidade medida permanece `UNSPECIFIED`. Falsa precisão financeira é pior que ausência de número.

---

## 9. Tratamento de erro dos provedores

| Erro | Classificação | Ação |
|---|---|---|
| `429` rate limit | transitório | retry com backoff + jitter; **não** consome rodada |
| `5xx` | transitório | idem |
| timeout de rede | transitório | idem |
| saída não valida contra schema | técnico | uma tentativa corretiva; se falhar, `BLOCKED` |
| recusa do modelo | semântico | registra como finding; não é retry |
| budget estourado | política | `BLOCKED_BUDGET`, alerta, decisão humana |
| credencial inválida | configuração | `BLOCKED`, alerta para `admin` |
| modelo indisponível | configuração | tenta próximo modelo habilitado do mesmo runtime; se não houver, `BLOCKED` |

---

## 10. Riscos específicos e mitigação

| Risco | Mitigação |
|---|---|
| Skill maliciosa ou comprometida | CODEOWNERS, paths protegidos, evals, projection hash em CI |
| Prompt injection via conteúdo do repositório ou do PR | Classificação de confiança do conteúdo, revisão read-only, sanitização de entrada |
| Superfície do fornecedor em Beta muda | Isolamento por adapter; risco registrado |
| Drift entre canônico e projeção | Manifesto com hash + CI que falha |
| Modelos mudam e resultados mudam | Registry versionado + evals com baseline |
| Agentes concordando no mesmo erro | Gates determinísticos + human gate. **A fábrica não conta votos** |
| Custo descontrolado | Budget por run, missão e organização; telemetria por token e por hora de sessão |
| Agente modificando a própria inteligência | `factory-intelligence/**` em `forbidden_paths`, CODEOWNERS, nunca auto-merge |

---

## 11. Checklist de implementação

```
□ AgentAdapter definido em packages/agent-adapters
□ MockAdapter implementado e passando nos contract tests   [F1]
□ Contract tests cobrindo start/resume/cancel/status/events/artifacts/usage
□ OpenAIAdapter implementado                                [F2]
□ ClaudeAdapter implementado                                [F2]
□ Ambos passando nos MESMOS contract tests
□ build-projections.ts gerando .agents/skills e .claude/skills
□ projection-manifest.json com hash por arquivo
□ intelligence-ci.yml falhando em caso de drift  ★
□ models.yaml criado; nenhum modelo hardcoded no código
□ WIF configurado para ambos os provedores
□ Usage inclui session_hours para Anthropic
□ Classificação de erro implementada conforme §9
□ Cross-provider direto bloqueado por política e por teste
□ factory-intelligence/** em forbidden_paths de todo Task Packet de implementação
```

---

## Fontes

- [Claude Platform Docs — Managed Agents Skills](https://platform.claude.com/docs/en/managed-agents/skills)
- [OpenAI Developers — Codex Skills](https://developers.openai.com/codex/skills)
- [AGENTS.md](https://agents.md/)

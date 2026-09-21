# Google Antigravity — Como vai funcionar

**VERIFICAR ANTES DE USAR:** confirmado em 20/09/2026. Reverifique a documentação oficial antes de decisões materiais.

---

## 1. O papel do Antigravity na fábrica

★ **Antigravity não é um terceiro worker na nuvem.** Ele é a **Estação de Comando** local do operador.

```
                    ROBERTH
                       │
            ┌──────────┴──────────┐
            │  ANTIGRAVITY LOCAL  │
            │                     │
            │  · planejamento     │
            │  · análise de plano │
            │  · leitura de diff  │
            │  · execução de teste│
            │  · verificação no   │
            │    navegador        │
            │  · DECISÃO          │
            └──────────┬──────────┘
                       │ conexão OUTBOUND
                       │ (o computador NÃO expõe porta)
                       ▼
                 RNS ORCHESTRATOR
                       │
                  FACTORY SUPABASE
```

### A distinção que define a arquitetura

> **O Antigravity não é a autoridade final. O ser humano operando o Antigravity é a autoridade final.**

Parece detalhe. É decisivo. O Antigravity pode analisar, pesquisar, gerar plano, revisar diffs, executar navegador, propor aprovação e explicar riscos. Mas o evento que libera uma etapa crítica é registrado como **decisão humana autenticada**:

```
Humano clica APROVAR
        ↓
assinatura lógica:
  user_id · approval_id · subject_sha · timestamp
        ↓
Factory Supabase (governance.approvals, actor_type='human')
        ↓
Orchestrator libera a transição
```

Nunca:

```
LLM escreveu "APPROVED" → produção
```

---

## 2. Por que ele fica de fora da automação cloud

| Motivo | Detalhe |
|---|---|
| Soberania humana | A decisão precisa acontecer onde o humano está |
| Sem integração nativa com GitHub como coding agent de terceiros | Ao contrário de outros runtimes, não há integração nativa equivalente; criar dependência disso seria frágil |
| Ambiente local é diferente | Clone Git local, worktrees, navegador, ferramentas do operador |
| Segurança de rede | O computador do operador não deve expor porta na internet |

Conclusão: **adapter próprio, conexão outbound, sem tentativa de transformá-lo em worker cloud.**

---

## 3. RNS Local Bridge

O componente que conecta a estação local à nuvem.

```
COMPUTADOR DO OPERADOR
┌─────────────────────────────────────┐
│ Antigravity                         │
│                                     │
│ Clone Git local (rns-factory e/ou   │
│ rns-app-<nome>)                     │
│                                     │
│ RNS Local Bridge / Sidecar          │
│   · processo persistente            │
│   · reinicia se falhar              │
│   · conexão de SAÍDA autenticada    │
└─────────────────┬───────────────────┘
                  │  outbound, TLS, token curto
                  ▼
          RNS Orchestrator
                  │
              Supabase
```

### Eventos que o Bridge recebe

```
approval.requested            uma decisão espera o humano
plan.revision.requested       o plano precisa ser revisto
stage.acceptance.requested    uma etapa espera verificação
handoff.bundle.ready          o pacote de contexto está pronto
```

### O que o Bridge faz localmente

```
git fetch / git checkout no SHA exato
ler o Plan PR
ler os reviews de OpenAI e Claude
inspecionar o diff
executar testes
abrir o preview no navegador
pesquisar
produzir um Acceptance Artifact
```

### O que o Bridge NÃO faz

```
✗ aprovar sozinho
✗ fazer merge
✗ tocar em produção
✗ receber credencial de produção
✗ expor porta de entrada no computador
```

---

## 4. Handoff Bundle

Quando o trabalho chega ao human gate, a fábrica monta um pacote com **tudo** que o operador precisa para julgar sem reconstruir contexto.

```json
{
  "bundle_id": "hb_00421",
  "generated_at": "2026-09-20T13:10:00Z",
  "app": { "id": "app_01", "name": "Sistema de Gestão Escolar" },
  "mission": { "id": "mis_01", "title": "Backend de autenticação" },
  "stage": { "id": "stg_03", "sequence": 3 },
  "task": { "id": "tsk_481" },
  "base_sha": "0123456789abcdef0123456789abcdef01234567",
  "current_sha": "89abcdef0123456789abcdef0123456789abcdef",
  "pull_request": { "number": 184, "url": "..." },
  "plan": { "version": 7, "sha": "...", "diff_uri": "..." },
  "reviews": {
    "openai_r1": { "verdict": "CHANGES_REQUIRED", "findings": 6 },
    "claude_r1": { "verdict": "CHANGES_REQUIRED", "findings": 3 },
    "openai_r2": { "verdict": "APPROVE_AI_STAGE", "accepted": 4, "rejected": 2 },
    "claude_r2": { "verdict": "READY_FOR_HUMAN_APPROVAL" }
  },
  "unresolved_findings": ["SEC-18"],
  "disagreements": [
    { "id": "dis_01", "type": "security", "materiality": "high",
      "openai_position": "...", "anthropic_position": "..." }
  ],
  "ci": { "lint": "success", "typecheck": "success",
          "unit": "success", "rls-tests": "failure" },
  "preview": {
    "vercel_url": "https://...",
    "supabase_branch": "preview-task-481",
    "pair_ready": true
  },
  "recommendation": "READY_WITH_CONDITIONS",
  "conditions": ["Resolver SEC-18", "Adicionar teste de negação de RLS"]
}
```

Entregue em duas formas: **JSON** (para o Antigravity processar) e **markdown** (para o humano ler).

---

## 5. Como o Antigravity conhece a Constituição

Um adapter no repositório permite que ele carregue a inteligência canônica quando o operador abre o clone local:

```
factory-intelligence/            ← fonte canônica
        │
        └── projeção Antigravity (gerada)
              · resumo da Constituição
              · papéis R1–R9
              · protocolos
              · critérios de evidência
              · configuração de MCP local
```

Isso garante que o Antigravity **julgue com os mesmos critérios** que os agentes usaram para produzir. Não é o mesmo mecanismo operacional cloud, mas é a mesma norma.

---

## 6. Ferramentas locais e MCP

O Antigravity suporta MCP, o que permite acesso controlado a GitHub, Supabase e outras ferramentas de desenvolvimento a partir do ambiente local.

Política da fábrica para o ambiente local:

| Ferramenta | Política |
|---|---|
| Git local (leitura, checkout) | ALLOW |
| Executar testes | ALLOW |
| Abrir navegador no preview | ALLOW |
| Ler PR e reviews via GitHub MCP | ALLOW |
| Ler schema do Supabase preview | ALLOW |
| Escrever no repositório remoto | ASK |
| Merge | **DENY** — merge acontece pelo Release Service após o gate |
| Produção (qualquer operação) | **DENY** |
| Secrets | **DENY** |

---

## 7. Fluxo completo com o Antigravity nas duas pontas

```
 1. ROBERTH tem uma ideia
        ↓
 2. ANTIGRAVITY ajuda a estruturar requisitos e plano
        ↓
 3. Plano vai para o GitHub como Plan PR
        ↓
 4. NUVEM: GPT R1 → Claude R1 → GPT R2 → Claude R2
        ↓
 5. Orchestrator abre human gate e emite approval.requested
        ↓
 6. RNS Local Bridge recebe o evento
        ↓
 7. ANTIGRAVITY baixa o Handoff Bundle, faz checkout no SHA,
    lê reviews, inspeciona diff, roda testes, abre o preview
        ↓
 8. ROBERTH decide, assistido pelo Antigravity
        ↓
 9. Decisão sobe como approval assinada (actor_type='human')
        ↓
10. NUVEM: execução prossegue
        ↓
        ... repete por etapa ...
        ↓
11. Release gate: mesma mecânica, decisão humana final
```

O Antigravity está no **começo** (planejamento) e no **fim** (aceitação e aprovação). A execução repetitiva fica na nuvem.

---

## 8. Se o Antigravity não estiver disponível

A fábrica **não pode parar** porque o computador do operador está desligado.

```
Human gate aberto
      ↓
Bridge offline?
      ↓
O gate continua acessível pela WEB, na Câmara de Revisão
do Control Plane, com o mesmo Handoff Bundle em markdown
      ↓
A decisão tem o mesmo peso e a mesma assinatura lógica
```

★ O Antigravity **melhora** a decisão. Não é pré-requisito dela. A interface web sozinha permite aprovar com contexto completo.

---

## 9. Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Bridge comprometido | Token curto, escopo mínimo, conexão só de saída, revogação imediata |
| Antigravity com acesso amplo ao disco | Restringir a workspaces do projeto |
| Operador aprovando sem ler | Botão de aprovar desabilitado com finding crítico aberto; justificativa registrada |
| Dependência do computador ligado | Fallback web obrigatório (§8) |
| Divergência entre critérios locais e da nuvem | Projeção da Constituição para o ambiente local |
| SHA mudou desde o bundle | Bundle carrega `current_sha`; a UI invalida a decisão se mudar |

---

## 10. Checklist de implementação

```
□ Adapter AntigravityHandoff implementado (não executa na nuvem)
□ Handoff Bundle gerado em JSON e markdown
□ RNS Local Bridge com conexão exclusivamente outbound
□ Nenhuma porta de entrada exposta no computador do operador
□ Token do Bridge com escopo mínimo e expiração curta
□ Projeção da Constituição para o ambiente local
□ Política de ferramentas locais aplicada (merge e produção = DENY)
□ Fallback web do human gate funcionando sem o Bridge  ★
□ Decisão grava actor_type='human' com subject_sha
□ Invalidação da decisão quando o SHA muda
□ Teste: desligar o Bridge não bloqueia aprovações
```

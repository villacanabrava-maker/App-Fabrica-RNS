# FASE 2 — Agentes Reais

**O princípio:** trocar o adapter, não o domínio.

---

## 1. O que muda e o que não muda

```
MUDA                              NÃO MUDA
────                              ────────
MockAdapter → OpenAIAdapter       Orchestrator
MockAdapter → ClaudeAdapter       Máquinas de estado
fixtures → inteligência real      Review Engine
                                  Câmara de Revisão
+ provisionamento real            Human gate
+ preview pair real               Policy engine
+ release gate real               Schemas e contratos
+ budgets reais                   Filas, leases, idempotência
+ Antigravity bridge              As 9 páginas
```

Se algo do lado direito precisar mudar, **a Fase 1 foi mal feita** e é preciso voltar.

---

## 2. Sprints

### Sprint 2.1 — Integrações de IA

```
□ Workload Identity Federation configurado para OpenAI
□ Workload Identity Federation configurado para Anthropic
□ Fallback de API key documentado e desencorajado
□ secret_refs apontando para o secret manager
□ Página Integrações exibindo os dois como conectados
□ Teste de conexão inócuo funcionando
□ models.yaml preenchido com os modelos habilitados
□ Nenhum nome de modelo em código  ★

SAÍDA: conexão testada, sem API key permanente no repositório
```

### Sprint 2.2 — OpenAIAdapter

```
□ Implementação de start/resume/cancel/getStatus/getEvents/
  getArtifacts/getUsage
□ Tradução Task Packet → formato do runtime
□ Aplicação de allowed_paths e forbidden_paths no sandbox
□ Eventos normalizados (NUNCA stdout bruto)  ★
□ Artefatos com sha256
□ Usage com tokens de entrada, cache e saída
□ Classificação de erro conforme 04-PLATAFORMAS/04 §9
□ PASSA NOS MESMOS CONTRACT TESTS do MockAdapter  ★

SAÍDA: contract tests verdes para OpenAI
```

### Sprint 2.3 — ClaudeAdapter

```
□ Mesma lista do 2.2
□ Usage incluindo session_hours  ★
□ Skills descobertas de .claude/skills no repositório montado
□ Atenção: descoberta acontece UMA VEZ no início da sessão
□ PASSA NOS MESMOS CONTRACT TESTS  ★

SAÍDA: contract tests verdes para Anthropic
```

### Sprint 2.4 — Intelligence Resolver real

```
□ Resolver lendo o registry no base_sha
□ required_skills validado contra o base_sha
□ Skill inexistente → tarefa bloqueada com erro claro  ★
□ Projeções consumidas pelos runtimes reais
□ intelligence_version gravada em cada run
□ skill_versions gravadas em cada run

SAÍDA: um run real registra exatamente com quais regras executou
```

### Sprint 2.5 — Agent Router

```
□ Alternância determinística de runtime por índice de etapa
□ Autor ≠ revisor garantido por construção  ★
□ allowed_runtimes do papel respeitado
□ Runtime desabilitado no registry é pulado
□ Fallback quando um runtime está indisponível

SAÍDA: etapa N implementa em um runtime e revisa no outro; N+1 inverte
```

### Sprint 2.6 — Provisionamento

```
□ Golden template criado em rns-golden-template
□ Criação de repositório a partir do template
□ Criação de projeto Supabase via Management API
□ Criação de projeto Vercel ligado ao repositório
□ Conexão GitHub ↔ Supabase (branching automático)
□ Conexão Supabase ↔ Vercel (variáveis de preview)
□ Cada passo idempotente, com ID registrado antes de seguir  ★
□ Falha no passo N não refaz 1..N-1
□ Seeds sintéticos, zero dados reais  ★

SAÍDA: um aplicativo provisionado inteiro por API, auditável
```

### Sprint 2.7 — Preview pair

```
□ Tabela preview_environments com supabase_ready, vercel_ready, pair_ready
□ pair_ready só true com AMBOS  ★
□ Timeout com alerta
□ preview-e2e.yml disparando por repository_dispatch  ★
□ Nomes de check únicos, com ambiente
□ R8 só inicia com pair_ready

SAÍDA: E2E roda contra o backend correto, sem flakiness
```

### Sprint 2.8 — Release Service

```
□ Merge gate: required checks + code owner review
□ Deployment Checks configurados no Vercel
□ Release gate humano separado do merge  ★
□ Rolling release com percentuais
□ Rollback funcionando
□ Force Promote auditado como exceção
□ release_decisions gravadas

SAÍDA: build de produção existe mas não recebe usuários até o gate
```

### Sprint 2.9 — Budget Service

```
□ Budgets por run, missão e organização
□ Verificação DURANTE a execução, não só no fim  ★
□ Estouro → BLOCKED_BUDGET + alerta
□ Agente não amplia o próprio budget  ★
□ Alertas em 50%, 80%, 100%
□ usage_records com custo real por token e hora de sessão
□ Página de Custos no detalhe do projeto

SAÍDA: um run que estoura o budget é interrompido e alerta
```

### Sprint 2.10 — Antigravity

```
□ AntigravityHandoffAdapter (não executa na nuvem)
□ Handoff Bundle em JSON e markdown
□ RNS Local Bridge com conexão exclusivamente outbound  ★
□ Token de escopo mínimo e expiração curta
□ Projeção da Constituição para o ambiente local
□ Política de ferramentas locais (merge e produção = DENY)
□ FALLBACK WEB funcionando sem o Bridge  ★
□ Teste: desligar o Bridge não bloqueia aprovações

SAÍDA: aprovar do Antigravity e da web, com o mesmo peso
```

### Sprint 2.11 — O primeiro aplicativo real

Esta é a entrega que define a Fase 2.

```
□ Escolher um aplicativo pequeno mas real
□ Percorrer o ciclo inteiro:
    ideia → spec → plano → 4 passagens → human gate
    → provisionamento → DAG → implementação por etapas
    → revisão cruzada → CI → preview pair → R8 → R9
    → aprovação por etapa → merge → release gate → produção
□ Documentar tudo que deu errado
□ Corrigir
□ Repetir até fluir
```

---

## 3. O portão da Fase 2 ★

```
✓ Nenhum loop acima de 4 hops
✓ Todas as saídas de agente validam contra os schemas
✓ Mudança de SHA invalida o ciclo
✓ Human gate recebe pacote completo e reproduzível
✓ Cada tarefa de escrita tem workspace isolado
✓ PR associa SHA, task e run pelo rodapé de commit
✓ E2E só inicia com preview pair pronto
✓ Budget interrompe run que estoura
✓ Nenhum agente teve credencial de produção
✓ UM APLICATIVO REAL foi da ideia à produção,
  com todas as aprovações humanas registradas e auditáveis  ★
```

---

## 4. O que provavelmente vai dar errado

Antecipar economiza semanas.

| Problema esperado | Sintoma | Causa provável | O que fazer |
|---|---|---|---|
| E2E intermitente | Falha 1 em 5 execuções | Preview pair declarado cedo demais | Verificar a barreira dos dois eventos |
| Custo acima do previsto | Budget estourando | Skills demais anexadas, contexto inflado | Revisar `required_skills` por tarefa |
| Ciclo lento | Passagens de 10+ minutos | Contexto grande, modelo pesado | Reduzir contexto, revisar `models.yaml` |
| Saída inválida frequente | Muitos BLOCKED por schema | Schema restritivo demais ou skill ambígua | Revisar schema e descrição da skill |
| Falsos positivos de revisor | Muitos findings inúteis | Skill sem critério de severidade | Adicionar critérios explícitos na skill |
| Agentes concordando errado | Defeito escapou dos dois | Correlação de erro entre modelos | Reforçar gates determinísticos |
| Gargalo humano | Fila de aprovação crescendo | Decisões demais exigindo humano | Classificar por risco; automatizar as de baixo risco com gates determinísticos |
| Drift de projeção | CI falhando | Alguém editou projeção à mão | Reforçar processo; a CI já está fazendo o trabalho dela |

---

## 5. Métricas a coletar desde o primeiro run

Mesmo sem baseline, coletar desde já:

```
tokens de entrada, cache e saída
horas de sessão (Anthropic)
custo por run, por etapa, por missão
latência mediana e P95 por papel e runtime
taxa de sucesso por papel e runtime
número de findings por passagem
taxa de divergência e categoria
tempo de espera no human gate  ★
taxa de rework por etapa
```

Estes dados são o insumo da Fase 4. Não coletá-los desde o início significa começar a Fase 4 do zero.

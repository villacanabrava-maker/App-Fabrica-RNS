# Protocolo de Revisão Dupla — RNS Dual-Pass Review

**O coração da Fábrica Apps RNS.** Este documento é normativo e implementável literalmente.

---

## 1. O que o protocolo resolve

A ideia original era: "GPT revisa, Claude revisa, GPT revisa de novo, Claude conclui."

O mérito é real: força um mesmo artefato a ser confrontado mais de uma vez, por inteligências diferentes. O problema é que, sem formalização, isso vira conversa infinita, custo imprevisível e nenhuma conclusão auditável.

A solução é transformar a ideia em **máquina de estados com número fixo de passagens**.

```
NÃO É ISSO                          É ISSO
──────────                          ──────
GPT → Claude → GPT → Claude →       Plano v7
GPT → Claude → ...                    GPT-A
  sem limite                          Claude-A
  sem conclusão                       GPT-B
  sem auditoria                       Claude-B
                                      Human Gate
                                    ───────────
                                    Se rejeitado:
                                    Plano v8
                                      GPT-A ... (novo ciclo)
```

---

## 2. As quatro passagens

```
              ARTEFATO no SHA X
              (plano ou código)
                     │
                     ▼
    ┌────────────────────────────────┐
    │ PASSAGEM 1 — OPENAI R1         │
    │                                │
    │ Análise independente.          │
    │ Não recebe instrução para      │
    │ concordar com nada.            │
    │                                │
    │ Produz: findings, riscos,      │
    │ perguntas, mudanças            │
    │ recomendadas, evidências,      │
    │ itens não resolvidos           │
    └───────────────┬────────────────┘
                    ▼
    ┌────────────────────────────────┐
    │ PASSAGEM 2 — CLAUDE R1         │
    │                                │
    │ Recebe: artefato original      │
    │       + review OpenAI R1       │
    │       + findings + evidências  │
    │                                │
    │ Missão DUPLA:                  │
    │ a) revisar o artefato          │
    │ b) META-REVISAR o OpenAI:      │
    │    · o finding é factual?      │
    │    · a evidência sustenta?     │
    │    · há risco omitido?         │
    │    · há falso positivo?        │
    │    · a solução sugerida cria   │
    │      outro problema?           │
    └───────────────┬────────────────┘
                    ▼
    ┌────────────────────────────────┐
    │ PASSAGEM 3 — OPENAI R2         │
    │                                │
    │ Recebe a trilha completa.      │
    │                                │
    │ Deve:                          │
    │ · resolver objeções válidas    │
    │ · rejeitar objeções infundadas │
    │   COM justificativa            │
    │ · atualizar a proposta         │
    │ · registrar divergências que   │
    │   permanecem abertas           │
    └───────────────┬────────────────┘
                    ▼
    ┌────────────────────────────────┐
    │ PASSAGEM 4 — CLAUDE R2         │
    │                                │
    │ SÍNTESE FINAL.                 │
    │ NÃO abre novo debate.          │
    │                                │
    │ Saída: exatamente UM de        │
    │ · READY_FOR_HUMAN_APPROVAL     │
    │ · CHANGES_REQUIRED             │
    │ · BLOCKED                      │
    └───────────────┬────────────────┘
                    ▼
               HUMAN GATE
           Roberth + Antigravity
              ┌─────┴─────┐
              ▼           ▼
          APROVAR      REVISAR
              │           │
              ▼           ▼
         EXECUÇÃO    nova versão
                     (novo SHA,
                      novo ciclo)
```

---

## 3. As regras invioláveis

| # | Regra |
|---|---|
| 1 | **Exatamente quatro passagens.** `round > 4` é `DENIED` |
| 2 | **O Orchestrator avança o ciclo.** Nenhum modelo decide chamar o próximo |
| 3 | **A quarta passagem é conclusiva.** Não abre debate, não pede mais uma rodada |
| 4 | **Retry técnico ≠ passagem cognitiva.** `429`, `5xx` e timeout não consomem rodada |
| 5 | **Mudança material de `base_sha` invalida o ciclo.** Novo SHA, novo ciclo |
| 6 | **O sistema não conta votos.** Concordância não vira verdade |
| 7 | **Divergência é dado estruturado**, nunca diluída em síntese textual |
| 8 | **Cross-provider passa pelo Orchestrator.** Um modelo não chama o outro |
| 9 | **A alternância de autor e revisor é obrigatória.** Autor não é juiz final |
| 10 | **Saída inválida contra schema não é consumida** |

---

## 4. Máquina de estados do ciclo

```
OPEN (round = 0)
   ↓
OPENAI_R1_RUNNING (round = 1)
   ↓
CLAUDE_R1_RUNNING (round = 2)
   ↓
OPENAI_R2_RUNNING (round = 3)
   ↓
CLAUDE_R2_RUNNING (round = 4)
   ↓
AWAITING_HUMAN
   ↓
┌──────────┬──────────┬─────────┐
▼          ▼          ▼         ▼
CLOSED   CLOSED    BLOCKED  SUPERSEDED
approved revision            (SHA mudou)
```

Implementação no Orchestrator:

```typescript
const SEQUENCE = [
  { round: 1, runtime: 'openai',    phase: 'r1' },
  { round: 2, runtime: 'anthropic', phase: 'r1' },
  { round: 3, runtime: 'openai',    phase: 'r2' },
  { round: 4, runtime: 'anthropic', phase: 'r2' },
] as const;

function nextRound(cycle: ReviewCycle) {
  if (cycle.current_round >= 4) {
    return { action: 'human_gate', reason: 'max_hops_reached' };
  }
  return SEQUENCE[cycle.current_round]; // índice = próxima rodada
}
```

Nada de heurística. Nada de "o modelo pediu mais uma rodada".

---

## 5. Critérios de encerramento

| Condição | Resultado |
|---|---|
| Critérios de aceitação satisfeitos, nenhum finding bloqueante aberto | `READY_FOR_HUMAN_APPROVAL` |
| Problemas corrigíveis permanecem | `CHANGES_REQUIRED` |
| Segurança crítica, requisito impossível, inconsistência fundamental, dependência ausente | `BLOCKED` |
| Limite de 4 hops com divergência material aberta | `READY_FOR_HUMAN_APPROVAL` + disagreement, **ou** `BLOCKED` conforme materialidade |
| `base_sha` mudou materialmente | ciclo `SUPERSEDED`; nova versão |
| Schema de saída inválido | erro técnico → uma tentativa corretiva → se falhar, `BLOCKED` |
| Erro de transporte ou provedor | retry técnico, sem consumir rodada |
| Budget esgotado | `BLOCKED_BUDGET` |
| Human gate rejeita | nova versão ou encerramento |

---

## 6. O que muda entre plano e código

A estrutura das quatro passagens é a mesma. **A natureza da análise muda.**

### Para um PLANO

```
OPENAI R1   análise de viabilidade, arquitetura, riscos, lacunas de requisito
CLAUDE R1   meta-review do OpenAI + análise independente do plano
OPENAI R2   reconciliação e atualização da proposta
CLAUDE R2   síntese e encaminhamento
```

### Para CÓDIGO já implementado

```
OPENAI R1   code review + arquitetura + verificação contra critérios de aceitação
CLAUDE R1   meta-review do OpenAI + code review independente + lacunas de teste
OPENAI R2   reconciliação + aplicação das correções válidas
CLAUDE R2   verificação final + recomendação
```

E então, **sempre**:

```
CI determinístico
     +
preview pair verificado
     +
evidências consolidadas (R9)
     +
recomendação final do Claude R2
          ↓
    HUMAN GATE
```

★ A revisão de IA **não substitui** lint, typecheck, unit, integration, E2E, teste de migration, teste de RLS, scanning de dependências, secret scanning, análise estática de segurança, validação de build e validação de preview.

```
opinião de IA
     +
evidência determinística
     =
decisão

OPINIÃO DE IA SOZINHA ≠ DECISÃO
```

---

## 7. Protocolo de discordância

Dois agentes sofisticados vão discordar. **Isso não é falha. É o produto funcionando.**

### Estrutura

```json
{
  "disagreement_id": "dis_01",
  "review_cycle_id": "rc_00421",
  "finding_id": "fnd_07",
  "type": "architectural",
  "openai_position": "É necessário um Redis para a fila.",
  "anthropic_position": "A fila em Postgres é suficiente para o volume previsto.",
  "openai_evidence": ["ev_21"],
  "anthropic_evidence": ["ev_22", "ev_23"],
  "materiality": "medium",
  "resolved": false,
  "human_required": true
}
```

### Roteamento por tipo

| Tipo | Regra |
|---|---|
| `factual` | Buscar evidência verificável. Quem tem evidência vence |
| `security` | `high`/`critical` não resolvida **bloqueia** |
| `requirement` | **O humano é a autoridade**, sempre |
| `architectural` | Pode ser escalado com trade-offs documentados |
| `implementation` | Testes determinísticos arbitram |
| `preference` | **Não bloqueia** por padrão |

### Resoluções possíveis

```
RESOLVED                  evidência nova encerrou a dúvida
ACCEPTED_OPENAI           posição do OpenAI adotada
ACCEPTED_CLAUDE           posição do Claude adotada
COMBINED                  as duas posições foram sintetizadas
DEFERRED                  registrado como dívida conhecida, com dono
HUMAN_DECISION_REQUIRED   escalado
```

O resultado final **nunca** é "Claude venceu" ou "GPT venceu". É uma dessas seis resoluções, com justificativa.

---

## 8. Mudança material vs. editorial

Quando o humano edita um plano no Antigravity, é preciso distinguir.

### Material — exige novo ciclo

```
escopo
critério de aceitação
arquitetura
schema ou migration
segurança
permissões
dependências estruturais
API pública
estratégia de deploy
ordem ou dependência das etapas
```

```
HUMAN_EDIT (material)
      ↓
novo subject_sha
      ↓
NOVO REVIEW CYCLE
      ↓
GPT R1 → Claude R1 → GPT R2 → Claude R2
```

### Editorial — não exige novo ciclo

```
ortografia
formatação
descrição não normativa
metadados sem efeito técnico
```

A classificação é feita por regra determinística sobre o diff (quais seções e arquivos mudaram), **não** por julgamento de modelo. Em caso de dúvida, trata-se como material.

---

## 9. Registro completo do ciclo

```
review_cycles
  id · subject_type · subject_id · subject_sha
  current_round · status · final_verdict · human_decision
  started_at · closed_at

review_rounds
  id · review_cycle_id · round_number
  runtime · role_id · model_key · run_id
  input_sha · output_sha · verdict
  prior_round_id · comments_on_prior_work
  cost_usd · started_at · completed_at

findings
  id · category · severity · claim · recommendation
  status · blocks_progress · introduced_by · introduced_round
  resolved_by · disposition_reason

disagreements
  id · finding_id · type
  openai_position · anthropic_position
  materiality · resolution · human_required
```

Com isso, meses depois é possível responder: "na rodada 3 do ciclo RC-00421, o que o OpenAI rejeitou e por quê?"

---

## 10. Idempotência do ciclo

Chave determinística de cada passagem:

```
sha256(
  task_id + ':' + phase + ':' + round + ':' +
  runtime + ':' + base_sha + ':' + task_packet_version
)
```

Nunca inclui timestamp. Uma retomada após falha do worker produz a mesma chave e **não** executa duas vezes.

---

## 11. Custo e budget do ciclo

```
max_review_hops: 4        (constitucional, não configurável acima disso)
max_cost_usd:    por ciclo, herdado da missão
max_wall_seconds: por passagem
```

Estouro em qualquer passagem: `BLOCKED_BUDGET`, alerta, decisão humana. O ciclo não continua "só mais uma rodada".

---

## 12. Como a interface mostra isso

Ver `03-PAGINAS/10-TELAS-TRANSVERSAIS.md`, seção **Câmara de Revisão**.

Princípio da interface: **as quatro colunas são sempre visíveis, e as divergências nunca são escondidas.**

```
┌──────────┬──────────┬──────────┬──────────┐
│ GPT R1   │ CLAUDE R1│ GPT R2   │ CLAUDE R2│
│ findings │meta-rev. │reconcilia│ síntese  │
│ riscos   │discordân.│ aceitou  │ verdict  │
│ melhorias│novos risc│ rejeitou │          │
└──────────┴──────────┴──────────┴──────────┘
         DIVERGÊNCIAS (visíveis, nunca diluídas)
         GATES DETERMINÍSTICOS
         VEREDICTO
         [REJEITAR] [PEDIR REVISÃO] [APROVAR]
```

---

## 13. Na Fase 1, com o MockAdapter

O protocolo é implementado **inteiro** na Fase 1, com um adapter determinístico:

```
MockAdapter.start(taskPacket)
   → lê uma fixture correspondente ao tipo de tarefa
   → devolve um review válido contra review.schema.json
   → inclui findings e, em alguns casos, uma divergência
   → sem rede, sem custo, sem latência real
```

Isso permite provar, antes de gastar um centavo com modelos:

```
□ o ciclo avança exatamente 4 vezes
□ round 5 é negado
□ mudança de SHA invalida o ciclo
□ divergência aparece na interface
□ findings bloqueantes desabilitam a aprovação
□ human gate exige actor_type='human'
□ retry técnico não consome rodada
□ idempotência: reprocessar não duplica passagem
```

Quando a Fase 2 pluga os adapters reais, **o protocolo já está provado**. Só muda quem produz o conteúdo.

---

## 14. Checklist de implementação

```
□ Tabelas review_cycles, review_rounds, findings, disagreements criadas
□ Constraint round entre 1 e 4
□ SEQUENCE fixa no Orchestrator, sem heurística
□ round > 4 → DENIED + human gate
□ Retry técnico não incrementa round  ★
□ Mudança material de SHA → SUPERSEDED + novo ciclo
□ Classificação material/editorial determinística sobre o diff
□ comments_on_prior_work obrigatório nas passagens 2, 3 e 4
□ Saída validada contra review.schema.json antes de consumir
□ Divergências persistidas com posição e evidência de cada lado
□ Roteamento de divergência por tipo implementado
□ Idempotency key determinística sem timestamp
□ Budget verificado durante o ciclo
□ MockAdapter provando o protocolo na Fase 1  ★
□ Câmara de Revisão exibindo as 4 colunas e as divergências
□ Aprovação bloqueada com finding crítico aberto
```

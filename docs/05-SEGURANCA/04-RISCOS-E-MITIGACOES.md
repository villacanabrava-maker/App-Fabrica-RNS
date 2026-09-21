# Risk Register

Registro vivo de riscos. Atualizado a cada incidente e a cada fase concluída.

Colunas: **Risco · Impacto · Probabilidade · Mitigação principal · Detecção · Dono**

---

## 1. Riscos críticos

| Risco | Impacto | Prob. | Mitigação | Detecção |
|---|---|---|---|---|
| **Skill maliciosa ou comprometida** | crítico | baixa | CODEOWNERS, paths protegidos, hash de projeção em CI, evals | `intelligence-ci` falha em drift; revisão obrigatória |
| **Prompt injection via repositório ou PR** | crítico | média | Classificação de confiança, revisão read-only, Constituição acima de texto lido | Eval `prompt-injection-in-readme` |
| **Segredo exfiltrado** | crítico | baixa | WIF, sem credencial de produção para agentes, egress restrito, scan de bundle | Secret scanning, CI de variável pública |
| **Migration destrutiva em produção** | crítico | média | R7 obrigatório, preview DB, required check, human gate de produção | Review de migration, teste de aplicação e reversão |
| **RLS incorreta** | crítico | média | Testes de negação obrigatórios, revisão independente, `with check` em update | `supabase test db` no CI |
| **Identidade GitHub comprometida** | crítico | baixa | Apps separadas, tokens de 1h, permissões mínimas | Auditoria de uso de token |
| **Agente modifica a própria inteligência** | crítico | baixa | `factory-intelligence/**` em forbidden_paths, CODEOWNERS, validação de diff | Rejeição de artefato + incidente |
| **Actions privilegiado executa PR não confiável** | crítico | média | Proibido `pull_request_target` com secrets; runners efêmeros | Revisão de workflow em CODEOWNERS |
| **Agente grava aprovação** | crítico | muito baixa | Constraint de banco `actor_type = 'human'` | Teste automatizado tenta e falha |

---

## 2. Riscos altos

| Risco | Impacto | Prob. | Mitigação | Detecção |
|---|---|---|---|---|
| **Loop infinito GPT↔Claude** | alto | baixa | Máximo de 4 hops, aplicado pelo Orchestrator | Constraint `round <= 4` |
| **Agentes concordando no mesmo erro** | alto | média | Gates determinísticos + human gate. Sistema não conta votos | Escaped defect rate |
| **Falso negativo de revisor** | alto | média | Evals de recall, security checks independentes | Baseline de evals (Fase 4) |
| **Drift entre canônico e projeção** | alto | alta | Manifesto com hash, CI falha | `intelligence-ci` |
| **Evento duplicado** | alto | alta | `idempotency_key` unique, handler idempotente | Teste de replay 10× |
| **SHA muda durante a revisão** | alto | média | Ciclo fixado no `base_sha`; mudança material invalida | Comparação de SHA na conclusão |
| **Preview incorreto (par não pronto)** | alto | alta | Barreira de prontidão exigindo ambos os eventos | E2E intermitente é sintoma |
| **Custo descontrolado** | alto | média | Budget por run/missão/organização, verificação durante execução | Alertas em 50/80/100% |
| **Merge sem checks** | alto | baixa | Ruleset com required status checks e code owner review | Tentativa de merge falha |
| **`organization_id` aceito do cliente** | alto | média | Derivado da sessão; teste automatizado | Teste de isolamento |

---

## 3. Riscos médios

| Risco | Impacto | Prob. | Mitigação | Detecção |
|---|---|---|---|---|
| Falso positivo de revisor | médio | alta | Evals de precisão, adjudicação humana registrada | Human override rate |
| Superfície do fornecedor em Beta muda | médio/alto | alta | Isolamento por adapter, contract tests | Falha de contract test |
| Drift de modelos e APIs | médio/alto | alta | Registry versionado, conhecimento temporal reverificado | Evals com baseline |
| Worker morre durante tarefa | médio | alta | Lease + fila durável + idempotência | Teste de kill do worker |
| Gargalo na fila humana de aprovação | médio | **alta** ★ | Classificação de risco das decisões, painel de gargalos, notificação | Aba Gargalos do Monitoramento |
| Nomes de check duplicados no Vercel | médio | média | Nome único por check com ambiente | Promoção intermitente |
| Base de Conhecimento tratada como normativa | médio | média | Aviso explícito na interface e na Constituição | Revisão de skill |
| Dados reais em seed | médio | baixa | Geração sintética determinística, revisão de template | Scan de PII em seeds |

★ O gargalo humano é o risco mais provável de todos. Uma fábrica com dez agentes e um aprovador tem throughput de um aprovador. A mitigação **não** é remover o humano — é classificar decisões por risco e tornar o gargalo visível.

---

## 4. Riscos operacionais

| Risco | Mitigação |
|---|---|
| Backup nunca testado | Teste de restauração obrigatório antes da Fase 5 |
| Runbook inexistente no incidente | Runbooks escritos na Fase 1, revisados a cada fase |
| Alerta ignorado por excesso de ruído | Só alertar o acionável; informativos não geram badge |
| Dependência de um único operador | Mínimo de dois `owner` na organização |
| Documentação divergindo do código | Este pacote versionado no repositório, revisado em PR |
| Conhecimento temporal virando dogma | Classe "Knowledge" separada, com `verified_at` e política de revalidação |

---

## 5. Riscos que aceitamos conscientemente

| Risco aceito | Por quê | Condição de revisão |
|---|---|---|
| Superfícies de fornecedor em Beta | O ganho supera o custo, e o adapter isola | Revisar se houver quebra de contrato |
| Uma só organização no início | Multi-tenant já modelado; custo de operar muitas ainda não se justifica | Ao entrar o segundo cliente |
| Sem billing externo na v1 | Não é o objetivo inicial | Fase 5 |
| Motor de workflow ainda indefinido | Decidir sem dados seria pior | Após benchmark da Fase 1 |
| Thresholds de qualidade indefinidos | Sem baseline, qualquer número é arbitrário | Após Fase 4 |

---

## 6. Como usar este registro

1. Todo incidente vira linha aqui, com a mitigação que foi adotada.
2. Toda fase concluída revisa as probabilidades com dados reais.
3. Todo risco `crítico` sem mitigação implementada **bloqueia** o avanço de fase.
4. O registro vive em `factory-intelligence/continuity/known-risks/` e é versionado.

---

## 7. Matriz de decisão rápida

Use quando surgir um risco novo:

```
O risco pode levar a:
   · vazamento de dados?            → crítico
   · perda de dados?                → crítico
   · código malicioso em produção?  → crítico
   · decisão de IA sem humano?      → crítico
        ↓ sim para qualquer um
   MITIGAÇÃO OBRIGATÓRIA ANTES DE PROSSEGUIR

   · retrabalho significativo?       → alto
   · custo inesperado?               → alto
   · falha intermitente difícil?     → alto
        ↓
   MITIGAÇÃO PLANEJADA NA FASE CORRENTE

   · inconveniência operacional?     → médio
        ↓
   REGISTRAR E MONITORAR
```

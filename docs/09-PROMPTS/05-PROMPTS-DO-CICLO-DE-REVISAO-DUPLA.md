# Prompts do Ciclo de Revisão Dupla — Operação Manual

Este documento é o **roteiro para rodar o ciclo manualmente** enquanto a fábrica ainda não existe (Fase 0 e Fase 1), usando Antigravity, a plataforma web do ChatGPT e o Claude Code como você já faz hoje.

★ É exatamente o processo que a fábrica automatizará na Fase 2. Rodá-lo à mão agora serve a dois propósitos: construir a fábrica **com** o próprio método dela, e descobrir os atritos antes de automatizá-los.

---

## O roteiro completo

```
┌─────────────────────────────────────────────────────────────┐
│ PASSO 0 — ANTIGRAVITY + ROBERTH                             │
│ Planejar a etapa e produzir o artefato (plano ou código)    │
│ Registrar o SHA                                             │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ PASSO 1 — CHATGPT (plataforma web ou Codex)                 │
│ Prompt P1: revisão independente                             │
│ Salvar a saída como review-r1.json                          │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ PASSO 2 — CLAUDE CODE                                       │
│ Prompt P2: revisão + meta-revisão do ChatGPT                │
│ Entrada: artefato + review-r1.json                          │
│ Salvar como review-r2.json                                  │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ PASSO 3 — CHATGPT                                           │
│ Prompt P3: reconciliação                                    │
│ Entrada: artefato + r1 + r2                                 │
│ Salvar como review-r3.json                                  │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ PASSO 4 — CLAUDE CODE                                       │
│ Prompt P4: síntese conclusiva                               │
│ Entrada: artefato + r1 + r2 + r3 + resultado do CI          │
│ Salvar como review-r4.json                                  │
│ Saída: READY_FOR_HUMAN_APPROVAL | CHANGES_REQUIRED | BLOCKED│
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ PASSO 5 — ANTIGRAVITY + ROBERTH (HUMAN GATE)                │
│ Prompt A3: avaliar o pacote completo                        │
│ Roberth decide: APROVAR · PEDIR REVISÃO · REJEITAR          │
│ Registrar a decisão com data, SHA e justificativa           │
└─────────────────────────────────────────────────────────────┘
```

**Regras do roteiro manual:**

1. **Sempre quatro passagens. Nunca cinco.** Se após a passagem 4 ainda houver dúvida, ela vai para você, não para mais uma rodada.
2. **O SHA é fixado no Passo 0** e informado em todos os passos. Se o código mudar no meio, o ciclo recomeça.
3. **Você (Roberth) é o Orchestrator** durante a operação manual. Você decide quem é chamado a seguir, na ordem fixa. Nenhum modelo decide chamar o outro.
4. **Salve cada saída em arquivo.** A pasta `reviews/<etapa>/` com `r1.json`, `r2.json`, `r3.json`, `r4.json` e `decisao.md` é o ledger manual.
5. **Alterne o autor.** Se o Claude Code implementou a etapa, os prompts de implementação e de revisão invertem na etapa seguinte.

---

## P1 — ChatGPT, passagem 1 (revisão independente)

Cole no ChatGPT (plataforma web ou Codex):

```
Você é o REVISOR INDEPENDENTE da Fábrica Apps RNS — passagem 1 de 4.

Contexto:
- Estou construindo a Fábrica Apps RNS. A documentação completa está
  anexada/disponível.
- Constituição: 06-INTELIGENCIA-DOS-AGENTES/01-CONSTITUICAO.md
- Documento de referência desta etapa: <caminho>
- SHA do artefato: <SHA>

Artefato a revisar:
<cole o plano ou o diff, ou aponte o PR>

Critérios de aceitação desta etapa:
<cole a lista>

Sua tarefa:
Faça uma revisão INDEPENDENTE. Não há revisão anterior.

Para cada problema encontrado, produza um finding com:
- id (ex.: F-001)
- categoria: architecture | correctness | security | data | testing |
             performance | ux | operations | research | requirement
- severidade: info | low | medium | high | critical
- afirmação (o que está errado)
- localização (arquivo e linha, ou seção do plano)
- evidência (por que você afirma isso)
- recomendação
- bloqueia progresso? sim | não

Regras:
- Não invente problema. Se algo está correto, diga que está.
- Finding high ou critical precisa de evidência concreta.
- Finding sem localização é opinião — não inclua.
- Verifique cada critério de aceitação explicitamente.
- Se precisar de informação sobre versão, API ou preço, marque como
  "a verificar em fonte oficial" em vez de afirmar de memória.

Veredicto: APPROVE_AI_STAGE | CHANGES_REQUIRED | BLOCKED
(Você NÃO pode dar READY_FOR_HUMAN_APPROVAL — isso é da passagem 4.)

Formato de saída: JSON válido contra review.schema.json e
finding.schema.json. Depois do JSON, um resumo de 5 linhas em português.
```

---

## P2 — Claude Code, passagem 2 (revisão + meta-revisão)

Cole no Claude Code:

```
Você é o META-REVISOR da Fábrica Apps RNS — passagem 2 de 4.

Leia antes:
- CLAUDE.md
- 06-INTELIGENCIA-DOS-AGENTES/01-CONSTITUICAO.md
- 06-INTELIGENCIA-DOS-AGENTES/04-PROTOCOLO-REVISAO-DUPLA.md

SHA do artefato: <SHA>
Artefato original: <cole ou aponte>
Critérios de aceitação: <lista>

Revisão da passagem 1 (ChatGPT):
<cole o conteúdo de review-r1.json>

Sua tarefa tem DUAS partes. Faça as duas, separadamente.

PARTE A — Revisão independente do artefato
Revise o artefato como se a passagem 1 não existisse.

PARTE B — Meta-revisão da passagem 1
Para CADA finding do ChatGPT, responda:
- É factual? (sim / não / parcialmente)
- A evidência sustenta a conclusão?
- É falso positivo?
- A recomendação cria outro problema?
E, no geral:
- Existe risco material que o ChatGPT omitiu?

Onde você discordar materialmente do ChatGPT, registre uma DIVERGÊNCIA:
- id (ex.: D-001)
- finding relacionado
- tipo: factual | architectural | security | requirement |
        implementation | preference
- posição do ChatGPT
- sua posição
- evidência de cada lado
- materialidade: low | medium | high | critical
- exige decisão humana? sim | não

Regras:
- comments_on_prior_work = true (obrigatório)
- Não concorde para agradar. Não discorde para parecer rigoroso.
- Divergência é dado. Não a dilua em texto conciliador.
- Você NÃO pode dar READY_FOR_HUMAN_APPROVAL nesta passagem.

Veredicto: APPROVE_AI_STAGE | CHANGES_REQUIRED | BLOCKED

Saída: JSON + resumo de 5 linhas.
```

---

## P3 — ChatGPT, passagem 3 (reconciliação)

Cole no ChatGPT:

```
Você é o RECONCILIADOR da Fábrica Apps RNS — passagem 3 de 4.

SHA: <SHA>
Artefato original: <cole ou aponte>

Sua passagem 1: <cole review-r1.json>
Passagem 2 do Claude: <cole review-r2.json>

Sua tarefa: responder à meta-revisão do Claude.

Para CADA objeção do Claude:
1. Se ele está certo → ACEITE. Marque o finding como accepted e
   ajuste sua posição.
2. Se ele está errado → REJEITE, com justificativa de pelo menos uma
   frase substantiva e evidência. Marque como rejected, com o motivo.
3. Se ele apontou risco que você omitiu → adicione o finding,
   creditando a origem.
4. Se ele apontou falso positivo seu → marque seu finding como
   rejected, com o motivo.

Para cada divergência que PERMANECE:
- Mantenha registrada, com sua posição atualizada e evidência.
- Indique se exige decisão humana.

Regras:
- comments_on_prior_work = true (obrigatório)
- Nenhuma objeção pode ser ignorada em silêncio.
- Não rejeite por gosto. Rejeite por fato.
- Não aceite para "acabar logo". Discordância honesta é o objetivo.
- Esta é sua ÚLTIMA passagem. Não haverá outra.
- Você NÃO pode dar READY_FOR_HUMAN_APPROVAL.

Saída: JSON com accepted_finding_ids, rejected_finding_ids e
disagreement_ids, mais resumo de 5 linhas.
```

---

## P4 — Claude Code, passagem 4 (síntese conclusiva) ★

Cole no Claude Code:

```
Você é o SINTETIZADOR FINAL da Fábrica Apps RNS — passagem 4 de 4.

★ Esta é a ÚLTIMA passagem de IA. Não existe passagem 5.
  Sua saída vai para a decisão humana.

SHA: <SHA>
Artefato: <cole ou aponte>

Passagem 1 (ChatGPT): <review-r1.json>
Passagem 2 (Claude):  <review-r2.json>
Passagem 3 (ChatGPT): <review-r3.json>

Resultado dos testes e do CI:
<cole: lint, typecheck, unit, integration, rls-tests, security, e2e>

Critérios de aceitação: <lista>

Sua tarefa:
1. Consolide o estado final de cada finding:
   resolvido | aceito | rejeitado com motivo | adiado | ABERTO
2. Consolide as divergências: resolvidas e NÃO resolvidas.
3. Avalie o CI. ★ Se algum check está vermelho, você NÃO pode
   recomendar aprovação, independentemente da sua opinião.
4. Verifique cada critério de aceitação: atendido | não atendido.
5. Emita UM veredicto:

   READY_FOR_HUMAN_APPROVAL
     critérios atendidos, nenhum bloqueante aberto, CI verde
   CHANGES_REQUIRED
     problemas corrigíveis permanecem
   BLOCKED
     segurança crítica, requisito impossível, inconsistência
     fundamental, ou divergência de segurança não resolvida

Regras:
- Emita EXATAMENTE um veredicto.
- NÃO abra novo debate. NÃO sugira mais uma rodada.
- NÃO esconda divergência para fechar o ciclo.
- Você recomenda. Quem aprova é o Roberth.

Formato:
1. JSON válido contra review.schema.json (round: 4)
2. Depois, um RESUMO PARA O ROBERTH, em português simples:

   O QUE FOI FEITO            (2 frases)
   ESTÁ PROVADO               (lista curta, com evidência)
   AINDA ABERTO               (findings e divergências, por gravidade)
   ONDE OS MODELOS DISCORDARAM (posição de cada um, sem tomar partido
                                se você mesmo não tiver evidência)
   RECOMENDAÇÃO               (o veredicto e por quê, em 3 linhas)
   CONDIÇÕES                  (o que precisa acontecer antes, se houver)
```

---

## P5 — Antigravity, human gate

Use o **Prompt A3** de `01-ANTIGRAVITY-PLANEJAMENTO.md`, passando os quatro arquivos de revisão, o diff, o resultado do CI e a URL do preview.

Depois da análise, **você decide** e registra em `reviews/<etapa>/decisao.md`:

```markdown
# Decisão — <etapa>

Data: <data e hora>
SHA avaliado: <SHA>
Decisão: APROVADO | REVISÃO PEDIDA | REJEITADO

Divergências resolvidas por mim:
- D-001: aceitei a posição do <modelo>, porque <motivo>

Condições:
- <se houver>

Justificativa:
<obrigatória se rejeitado>
```

Esse arquivo é o equivalente manual de `governance.approvals`. Quando a fábrica existir, ele será substituído por um registro com assinatura lógica — mas o conteúdo é o mesmo.

---

## Estrutura de arquivos do ciclo manual

```
reviews/
└── fase1-sprint-1.5-projetos/
    ├── artefato.sha              o SHA fixado no passo 0
    ├── r1-chatgpt.json
    ├── r2-claude.json
    ├── r3-chatgpt.json
    ├── r4-claude.json
    ├── ci-resultado.txt
    ├── handoff-bundle.md         o resumo que o Antigravity preparou
    └── decisao.md                a sua decisão
```

Guarde tudo. Na Fase 4, esses arquivos viram o primeiro dataset real para avaliar qual runtime é melhor em qual tipo de revisão.

---

## Sinais de que o ciclo está funcionando

| Sinal | Significado |
|---|---|
| A passagem 2 encontra algo que a 1 não viu | ✓ A independência está funcionando |
| A passagem 3 rejeita parte da passagem 2 com evidência | ✓ Discordância honesta |
| A passagem 4 resume de forma que você entende em 1 minuto | ✓ A síntese está boa |
| Divergências aparecem de vez em quando | ✓ Normal e saudável |
| As quatro passagens concordam sempre, sem nenhum finding | ⚠ Suspeito. Os prompts podem estar induzindo concordância |
| Cada passagem discorda de tudo | ⚠ Os prompts podem estar induzindo discordância artificial |
| Você aprova sem ler | ⚠ O resumo da passagem 4 não está ajudando — ajuste o P4 |

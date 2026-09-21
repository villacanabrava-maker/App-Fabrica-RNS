# Como usar os prompts

---

## 1. A divisão de trabalho

Cada agente construtor tem um papel diferente na construção da Fábrica Apps RNS:

```
ANTIGRAVITY (local, com Roberth)
  · planejamento
  · decomposição em etapas
  · revisão de diff
  · verificação no navegador
  · DECISÃO FINAL

CHATGPT / CODEX (nuvem)
  · revisão independente
  · implementação alternada
  · reconciliação de objeções

CLAUDE CODE (nuvem)
  · implementação alternada
  · meta-revisão
  · síntese conclusiva
```

★ **A alternância é obrigatória.** Se o ChatGPT implementou a etapa N, o Claude Code revisa. Na etapa N+1, invertem-se os papéis. Nenhum fornecedor ganha posição permanente de "melhor programador" — a fábrica descobre isso empiricamente.

---

## 2. Regra de ouro ao colar um prompt

Todo prompt deste diretório assume que o agente tem acesso a:

```
□ A pasta de documentação (este pacote inteiro)
□ O repositório rns-factory
□ O SHA exato sobre o qual trabalhar
```

Sem esses três, o prompt não funciona. **Sempre informe o SHA.** Uma análise que não se fixa a um SHA não é auditável.

---

## 3. Os quatro tipos de prompt

| Arquivo | Quando usar |
|---|---|
| `01-ANTIGRAVITY-PLANEJAMENTO.md` | Para planejar uma fase, uma missão ou uma etapa, com Roberth |
| `02-CHATGPT-CODEX-REVISAO.md` | Para revisão independente e reconciliação |
| `03-CLAUDE-CODE-IMPLEMENTACAO.md` | Para implementação e síntese conclusiva |
| `04-PROMPTS-POR-PAGINA.md` | Um prompt pronto por página, com o escopo já delimitado |
| `05-PROMPTS-DO-CICLO-DE-REVISAO-DUPLA.md` | Os quatro prompts das quatro passagens |

---

## 4. Anatomia de um bom prompt para esta fábrica

Todo prompt segue esta estrutura. Ela espelha o Task Packet.

```
1. QUEM VOCÊ É          papel R1–R9 e o que isso significa
2. AUTORIDADE           o que ler, em que ordem
3. CONTEXTO             SHA, repositório, branch, documentos relevantes
4. OBJETIVO             uma frase
5. CRITÉRIOS DE ACEITAÇÃO   lista verificável
6. ONDE PODE MEXER      allowed_paths e forbidden_paths
7. O QUE PRODUZIR       artefatos e schema de saída
8. REGRAS INVARIANTES   o que nunca fazer
9. QUANDO PARAR         critério de encerramento
```

Prompt sem critério de aceitação faz o agente inventar o que é "pronto".
Prompt sem `forbidden_paths` deixa o agente reescrever as próprias regras.

---

## 5. O que NUNCA colocar em um prompt

```
✗ Nome específico de modelo ("use o gpt-5")
✗ Chave de API ou segredo
✗ "Faça o que achar melhor"
✗ "Seja criativo com a arquitetura"
✗ Instrução que contradiz a Constituição
✗ Permissão que o papel não tem
✗ Prazo em vez de critério de aceitação
✗ "Aprove se estiver bom"  ← nenhum agente aprova
```

---

## 6. Sobre o modo de operação

Estes prompts servem tanto para:

- **Fase 0 e 1**, quando você cola manualmente no Antigravity, no ChatGPT e no Claude Code para construir a fábrica;
- **Fase 2 em diante**, quando o Orchestrator monta o Task Packet automaticamente e o adapter traduz.

A estrutura é a mesma. O que muda é quem monta.

★ **Por isso os prompts são escritos no formato do Task Packet.** Quando a fábrica ficar pronta, o trabalho de reescrevê-los já estará feito.

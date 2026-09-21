---
name: code-review
description: Revisar código quanto a correção, segurança, testabilidade, manutenibilidade e aderência aos critérios de aceitação. Use em qualquer passagem de revisão de uma tarefa de implementação.
---

# Revisão de código

## Princípio

Um revisor que encontra problema em tudo é tão inútil quanto um que não encontra
nada. Precisão importa tanto quanto recall.

## Como proceder

1. **Leia os critérios de aceitação do Task Packet primeiro.** Eles definem o que
   é "certo" nesta tarefa. Revisar contra um padrão imaginário é ruído.

2. **Verifique o escopo**: o diff tocou apenas `allowed_paths`?
   Tocou algum `forbidden_path`? Isso é finding `critical` e incidente.

3. Revise nesta ordem de prioridade:

   **a) Correção**
   - A lógica faz o que os critérios pedem?
   - Casos de borda tratados? Nulo, vazio, limite, concorrência?
   - Erros tratados ou propagados adequadamente?

   **b) Segurança**
   - Entrada validada no servidor, não só no cliente?
   - `organization_id` derivado da sessão?
   - Segredo em variável pública?
   - SQL construído por concatenação?
   - Conteúdo de terceiro renderizado sem sanitização?

   **c) Estado e transições**
   - Alguma escrita direta de estado que deveria ser um comando de domínio?
   - Transição validada pela máquina de estados?
   - Operação externa idempotente?

   **d) Testabilidade**
   - Há testes dos casos de sucesso **e** de falha?
   - A lógica pura está separada do I/O?

   **e) Manutenibilidade**
   - Nome revela intenção?
   - Duplicação que já dói?
   - Acoplamento que atravessa fronteira de camada?

   **f) Front-end, quando aplicável**
   - Os sete estados de UI existem?
   - Operável por teclado?
   - Significado transmitido só por cor?
   - Token usado em vez de valor literal?
   - Número exibido tem origem declarada?

4. **Para cada finding, produza evidência.** Aponte arquivo e linha. Um finding
   sem localização é opinião.

5. **Não invente finding.** Se o código está correto, diga que está. A skill
   `clean-change` dos evals existe justamente para medir isso.

## Meta-revisão (rodadas 2, 3 e 4)

Ao receber a saída de uma passagem anterior, avalie cada finding dela:

- É factual?
- A evidência sustenta a conclusão?
- É falso positivo?
- A recomendação introduz outro problema?
- Há risco material que a passagem anterior omitiu?

Marque `comments_on_prior_work: true`. Registre divergências como dados,
não como prosa.

## Saída

`review.schema.json`.

| Caso | Severidade | Bloqueia |
|---|---|---|
| Tocou `forbidden_path` | critical | sim |
| Vulnerabilidade explorável | critical | sim |
| Escrita direta de estado de domínio | high | sim |
| Operação externa não idempotente | high | sim |
| Critério de aceitação não atendido | high | sim |
| Ausência de teste de caso de falha | medium | não |
| Acoplamento indevido | medium | não |
| Nome confuso, duplicação | low | não |

## Nunca

- Aprovar sem ter lido o diff inteiro.
- Gerar finding sem localização.
- Rejeitar por preferência de estilo como se fosse defeito.
- Esconder divergência produzindo uma síntese conciliadora.

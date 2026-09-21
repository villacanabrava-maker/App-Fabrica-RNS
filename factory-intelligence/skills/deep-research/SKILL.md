---
name: deep-research
description: Pesquisar informação técnica externa em fontes oficiais e produzir evidência datada e verificável. Use quando a tarefa depender de versão, API, preço, limite, recurso experimental ou qualquer informação que expira.
---

# Pesquisa técnica

## Princípio

A fábrica **não memoriza** fatos que expiram. Ela memoriza **como reverificá-los**.

Informação de treino sobre versão, API, preço, limite ou recurso experimental
**não é fato verificado**. É hipótese a confirmar.

## Quando esta skill é obrigatória

Sempre que a conclusão depender de:

```
versão de biblioteca ou framework
comportamento de API
preço
limite de contexto, taxa ou duração
recurso marcado como experimental, beta ou preview
mudança de política de fornecedor
documentação ativa
```

## Como proceder

1. **Formule a pergunta de forma específica.** "Como funciona o Supabase" não é
   pesquisável. "Qual o comportamento padrão de dados em preview branches do
   Supabase" é.

2. **Vá à fonte oficial primeiro.** Documentação do fornecedor, changelog,
   referência de API. Blog de terceiro é indício, não fonte.

3. **Registre a data da verificação.** Uma afirmação sem `observed_at` não é
   utilizável daqui a três meses.

4. **Cite a URL exata.** Não a home da documentação; a página que contém a
   afirmação.

5. **Distinga claramente**:
   - `verified` — você leu na fonte oficial agora
   - `reported` — um terceiro afirma, você não confirmou
   - `inferred` — você deduziu a partir de outra coisa
   - `pending` — você não conseguiu confirmar

6. **Quando as fontes divergem**, registre a divergência. Não escolha a mais
   conveniente.

7. **Quando não encontrar**, diga que não encontrou. Não preencha a lacuna com
   plausibilidade.

## Saída

`evidence.schema.json`, uma evidência por afirmação:

```json
{
  "type": "external_source",
  "source": "https://<url exata>",
  "observed_at": "<data e hora da consulta>",
  "collector": "R3:<run_id>",
  "integrity": "verified",
  "summary": "<a afirmação, em uma frase>"
}
```

E, para conhecimento que vale guardar, um registro com política de frescor:

```yaml
topic: <assunto>
authority: reference
verified_at: <data>
freshness_policy: revalidate_before_material_use
sources:
  - <url>
```

## Nunca

- Apresentar informação de treino como fato atual verificado.
- Citar a home da documentação como se fosse a fonte de uma afirmação específica.
- Omitir a data da verificação.
- Inventar um número quando a fonte não o informa. Use `UNSPECIFIED`.

---
name: migration-review
description: Avaliar uma migration de banco quanto a destrutividade, reversibilidade, idempotência e impacto em RLS. Use quando o diff tocar supabase/migrations/ ou quando o Task Packet pedir migration-review.
---

# Revisão de migration

## Quando usar

Quando o diff tocar `supabase/migrations/**`, ou quando `required_skills`
incluir `migration-review`.

## Como proceder

1. **Leia a migration inteira antes de opinar.** Não comente statement a statement
   sem ter o quadro completo.

2. Classifique cada statement:
   - **aditivo**: `CREATE TABLE`, `ADD COLUMN` nullable, `CREATE INDEX CONCURRENTLY`
   - **alterador**: `ALTER TYPE`, `SET NOT NULL`, `ADD CONSTRAINT`, rename
   - **destrutivo**: `DROP`, `TRUNCATE`, `DELETE`, `ALTER COLUMN TYPE` com perda

3. Para cada statement **destrutivo**, exija justificativa explícita e plano de
   reversão. Ausência de qualquer um dos dois é finding.

4. **Idempotência**: a migration pode rodar duas vezes sem erro?
   Procure `IF NOT EXISTS`, `IF EXISTS`, `CREATE OR REPLACE`.

5. **Impacto em RLS**:
   - Toda tabela nova exposta tem `ENABLE ROW LEVEL SECURITY`?
   - Há policy de `select`, `insert` e `update`?
   - A policy de `update` tem `WITH CHECK`? (sem isso, é possível mover uma linha
     para outra organização)
   - Existe caso de **negação** testado em `supabase/tests/`?

6. **Compatibilidade com dados existentes**:
   - `SET NOT NULL` em coluna com linhas nulas falha.
   - `ALTER TYPE` pode truncar dados.
   - Constraint nova pode ser violada por linhas antigas.

7. **Bloqueios**: operações que travam a tabela em produção precisam de estratégia
   (índice concorrente, migração em etapas).

8. **Aplique e reverta no preview** antes de concluir. Sem isso, a evidência é
   `inferred`, não `verified`.

## Saída

`review.schema.json`. Severidade mínima por caso:

| Caso | Severidade | Bloqueia |
|---|---|---|
| `DROP` sem justificativa e plano de reversão | critical | sim |
| RLS ausente em tabela nova exposta | critical | sim |
| Policy de `update` sem `WITH CHECK` | high | sim |
| Migration não idempotente | high | não |
| Incompatível com dados existentes | high | sim |
| Sem plano de reversão | medium | não |
| Bloqueio longo de tabela sem estratégia | medium | não |

Toda finding `high` ou `critical` exige `evidence_ids` com ao menos uma
evidência de tipo `database` e integridade `verified`.

## Nunca

- Aprovar migration sem tê-la aplicado no preview.
- Assumir que "provavelmente está certo".
- Recomendar rodar diretamente em produção.
- Confundir ausência de erro com ausência de risco.

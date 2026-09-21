---
name: rls-audit
description: Auditar policies de Row Level Security quanto a isolamento multi-tenant, casos de negação e permissividade excessiva. Use quando o diff tocar policies, quando uma tabela nova for exposta, ou quando o Task Packet pedir rls-audit.
---

# Auditoria de RLS

## Por que isso importa

No modelo Supabase, o navegador fala com o banco usando a chave publishable.
O que impede um usuário de ler dados de outra organização é **exclusivamente**
o RLS. Sem RLS correta, o multi-tenant é ficção.

## Como proceder

1. Liste toda tabela exposta pela Data API que o diff cria ou altera.

2. Para cada uma, verifique:
   - `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` presente
   - Policy de `select` restringindo por membership
   - Policy de `insert` com `WITH CHECK`
   - Policy de `update` com `USING` **e** `WITH CHECK`
   - Ausência deliberada de policy de `delete` quando a regra é arquivar

3. **Procure permissividade excessiva**:
   - `USING (true)` — quase sempre errado em tabela multi-tenant
   - Policy `TO public` em vez de `TO authenticated`
   - Subconsulta sem filtro por `auth.uid()`

4. **Procure o erro mais comum**: `update` com `USING` mas **sem** `WITH CHECK`.
   Isso permite mover uma linha para outra organização.

5. **Funções auxiliares**: verifique se são `SECURITY INVOKER`.
   Uma função `SECURITY DEFINER` mal escrita contorna RLS.

6. **Casos de teste**: exija os quatro casos em `supabase/tests/`:
   - membro lê da própria organização → vê o que deve
   - membro tenta ler de outra organização → **zero linhas**
   - papel sem permissão tenta escrever → erro
   - tentativa de mover linha entre organizações → erro

7. Verifique se a API deriva `organization_id` da sessão, e não do corpo da
   requisição. Se aceita do cliente, o RLS vira decoração.

## Saída

`review.schema.json`, com matriz allow/deny por tabela:

```
tabela | select | insert | update | delete | negação testada
```

Severidade:

| Caso | Severidade | Bloqueia |
|---|---|---|
| RLS não habilitada em tabela exposta | critical | sim |
| `update` sem `WITH CHECK` | critical | sim |
| `USING (true)` em tabela multi-tenant | critical | sim |
| `organization_id` aceito do cliente | critical | sim |
| Função auxiliar `SECURITY DEFINER` sem justificativa | high | sim |
| Caso de negação ausente nos testes | high | sim |
| Policy `TO public` desnecessária | medium | não |

## Nunca

- Aceitar "o código filtra por organização" como substituto de RLS.
- Aprovar policy sem caso de negação testado.
- Assumir que uma tabela não exposta hoje nunca será exposta.

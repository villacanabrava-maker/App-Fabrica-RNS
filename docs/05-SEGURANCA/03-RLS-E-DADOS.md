# RLS e Proteção de Dados

---

## 1. Por que RLS é a base

No modelo Supabase, o navegador fala com o banco através da Data API usando a chave publishable. O que impede um usuário de ler dados de outra organização é **exclusivamente** o Row Level Security. Sem RLS correta, o multi-tenant é ficção.

Dois mecanismos, **duas verificações separadas**:

```
GRANT      quem pode tocar na tabela (nível Postgres)
POLICY     quais LINHAS essa pessoa pode ver ou alterar (nível RLS)

As duas precisam estar corretas. Uma sem a outra não protege.
```

---

## 2. Padrão canônico de policy

```sql
-- 1. Habilitar
alter table workflow.tasks enable row level security;

-- 2. Leitura: membros da organização
create policy "org members read tasks"
on workflow.tasks for select to authenticated
using (
  organization_id in (
    select organization_id from factory.memberships
    where user_id = auth.uid() and accepted_at is not null
  )
);

-- 3. Escrita: papéis com permissão
create policy "engineers write tasks"
on workflow.tasks for insert to authenticated
with check (
  organization_id in (
    select organization_id from factory.memberships
    where user_id = auth.uid()
      and accepted_at is not null
      and role in ('owner','admin','engineer')
  )
);

create policy "engineers update tasks"
on workflow.tasks for update to authenticated
using (
  organization_id in (
    select organization_id from factory.memberships
    where user_id = auth.uid() and role in ('owner','admin','engineer')
  )
)
with check (
  organization_id in (
    select organization_id from factory.memberships
    where user_id = auth.uid() and role in ('owner','admin','engineer')
  )
);

-- 4. Delete: normalmente NÃO se apaga. Arquiva-se.
-- Sem policy de delete = ninguém apaga pela Data API.
```

★ Note o `with check` no `update`. Sem ele, um usuário pode **mover** uma linha para outra organização. É o erro de RLS mais comum e mais grave.

---

## 3. Função auxiliar para reduzir repetição

```sql
create or replace function factory.user_organizations()
returns setof uuid
language sql stable security invoker
as $$
  select organization_id
  from factory.memberships
  where user_id = auth.uid()
    and accepted_at is not null
$$;

create or replace function factory.user_has_role(
  org uuid, required text[]
) returns boolean
language sql stable security invoker
as $$
  select exists (
    select 1 from factory.memberships
    where user_id = auth.uid()
      and organization_id = org
      and accepted_at is not null
      and role = any(required)
  )
$$;
```

Uso:

```sql
create policy "org members read apps"
on factory.apps for select to authenticated
using (organization_id in (select factory.user_organizations()));

create policy "admins update apps"
on factory.apps for update to authenticated
using (factory.user_has_role(organization_id, array['owner','admin']))
with check (factory.user_has_role(organization_id, array['owner','admin']));
```

★ `security invoker`, não `security definer`. Uma função `security definer` mal escrita contorna RLS e vira porta dos fundos.

---

## 4. A matriz de teste obrigatória

Cada tabela exposta precisa dos quatro casos. Só o primeiro é o "caminho feliz" — os outros três é que provam isolamento.

| # | Caso | Esperado |
|---|---|---|
| 1 | Membro lê dados da própria organização | vê tudo que deve |
| 2 | ★ Membro tenta ler dados de **outra** organização | vê **zero linhas** |
| 3 | `viewer` tenta escrever | erro |
| 4 | ★ Membro tenta **mover** uma linha para outra organização | erro (`with check`) |

```sql
-- supabase/tests/rls_apps.sql
begin;
select plan(6);

-- setup: org-a com 3 apps, org-b com 2 apps
-- user-a pertence a org-a como engineer
-- user-v pertence a org-a como viewer

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"user-a"}', true);

select is((select count(*) from factory.apps), 3::bigint,
          'user-a vê apenas os 3 apps da org-a');

select is((select count(*) from factory.apps where organization_id = 'org-b'), 0::bigint,
          'user-a NÃO vê nada da org-b');

select lives_ok($$ insert into factory.apps (organization_id, name, slug, status)
                   values ('org-a','Novo','novo','planning') $$,
                'engineer pode criar app na própria org');

select throws_ok($$ insert into factory.apps (organization_id, name, slug, status)
                    values ('org-b','Invasor','invasor','planning') $$,
                 'engineer NÃO pode criar app em outra org');

select throws_ok($$ update factory.apps set organization_id = 'org-b'
                    where organization_id = 'org-a' $$,
                 'engineer NÃO pode mover app para outra org');

select set_config('request.jwt.claims', '{"sub":"user-v"}', true);
select throws_ok($$ insert into factory.apps (organization_id, name, slug, status)
                    values ('org-a','X','x','planning') $$,
                 'viewer não pode criar app');

select * from finish();
rollback;
```

Rodar com `supabase test db` no CI. **Uma tabela exposta sem esses testes não vai para produção.**

---

## 5. A regra que salva o RLS

★ **`organization_id` nunca vem do cliente.**

```typescript
// ERRADO — RLS vira decoração
const { organizationId, name } = await req.json();
await db.from('apps').insert({ organization_id: organizationId, name });

// CERTO — derivado da sessão
const session = await getSession();
const organizationId = await resolveActiveOrganization(session.userId);
await db.from('apps').insert({ organization_id: organizationId, name });
```

Se a API aceita `organization_id` do corpo, um usuário pode tentar escrever em outra organização — e só o `with check` da policy vai barrar. Não dependa de uma única linha de defesa.

---

## 6. Dados de preview

| Regra | Motivo |
|---|---|
| Preview **não** recebe dados de produção | Comportamento padrão da plataforma e exigência da fábrica |
| Seeds são **sintéticos** | Gerados, nunca extraídos |
| Template que vira Golden Template tem seus dados removidos | Ver `03-PAGINAS/06-TEMPLATES.md` |
| Nenhum dado pessoal real em ambiente de agente | O agente não deve nem poder ver |

Gerador de seed recomendado: dados determinísticos a partir de uma seed fixa, para que testes sejam reproduzíveis.

---

## 7. Dados sensíveis no Factory Supabase

| Dado | Tratamento |
|---|---|
| Senhas | Nunca. Supabase Auth cuida |
| Tokens de integração | Nunca na tabela. `secret_refs` aponta para o secret manager |
| Chaves de API da fábrica | Apenas `key_prefix` e `key_hash` |
| Prompts completos | Em Storage, referenciado por `artifacts`; acesso restrito |
| Logs de agente | Em Storage; sem cabeçalhos de autorização |
| E-mails de usuário | Tabela `users`, protegida por RLS |
| Dados dos apps produzidos | **Não ficam aqui.** Ficam no Supabase do app |

---

## 8. Retenção e exclusão

| Dado | Retenção | Exclusão |
|---|---|---|
| `audit_events` | Permanente | Nunca ★ |
| `evidence_items` | Permanente | Nunca ★ |
| `webhook_events` (cru) | Sugerido 90 dias | Arquivar em Storage |
| `run_events` | 180 dias quentes | Arquivar |
| Artefatos (blobs) | Conforme tipo | Screenshots podem expirar |
| Dados de usuário removido | Anonimizar, não apagar linhas de auditoria | O registro de que uma decisão foi tomada permanece |

★ A auditoria é o que permite responder "quem aprovou isso?" dois anos depois. Apagá-la destrói a garantia central do sistema.

Exclusão de organização: anonimiza dados pessoais, preserva o ledger de auditoria com identificadores substituídos.

---

## 9. Backup e recuperação

```
□ Backup automático do Factory Supabase conforme plano
□ Point-in-time recovery habilitado
□ Exportação periódica da auditoria para armazenamento imutável
□ ★ TESTE DE RESTAURAÇÃO executado antes da Fase 5
□ Runbook de restauração escrito e datado
```

Backup nunca testado não é backup. É esperança.

---

## 10. Checklist

```
□ RLS habilitada em TODA tabela exposta
□ Policy de select, insert e update com with check
□ Sem policy de delete onde a regra é arquivar
□ Funções auxiliares com security invoker, nunca definer
□ Os 4 casos de teste por tabela exposta
□ supabase test db rodando em CI e bloqueando merge
□ organization_id derivado da sessão em todos os endpoints  ★
□ Teste automatizado provando que organization_id do corpo é ignorado
□ Seeds sintéticos, determinísticos e sem dado real
□ secret_refs sem valores de segredo
□ api_keys com hash, nunca a chave
□ audit_events e evidence_items sem UPDATE/DELETE concedidos
□ Política de retenção implementada
□ Teste de restauração de backup executado e documentado
```

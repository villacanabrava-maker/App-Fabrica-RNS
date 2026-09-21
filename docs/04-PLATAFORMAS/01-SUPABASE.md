# Supabase — Como vai funcionar

**VERIFICAR ANTES DE USAR:** dados desta página foram confirmados em 20/09/2026. Preços, limites e nomes de recursos mudam. Reverifique em `https://supabase.com/docs` antes de decisões materiais.

---

## 1. Os dois níveis de Supabase

Esta distinção é a base de tudo. Confundi-la corrompe a arquitetura.

```
┌───────────────────────────────────────────────────────────────┐
│ NÍVEL 1 — FACTORY SUPABASE                                    │
│ Um projeto só. O cérebro operacional da fábrica.              │
│                                                               │
│ Guarda: organizações, apps, missões, etapas, tarefas, jobs,   │
│         runs, eventos, reviews, findings, evidências,         │
│         aprovações, custos, auditoria, integrações            │
│                                                               │
│ Acessa: Control Plane (via RLS) e Orchestrator (server-side)  │
│ Agentes acessam? NUNCA diretamente.                           │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│ NÍVEL 2 — GENERATED APP SUPABASE                              │
│ Um projeto POR aplicativo produzido.                          │
│                                                               │
│ Guarda: os dados do aplicativo que a fábrica construiu        │
│ Criado por: Provisioning Service, via Management API          │
│ Agentes acessam? Somente a preview branch, nunca produção.    │
└───────────────────────────────────────────────────────────────┘
```

---

## 2. O que fica no Supabase e o que fica no Git

```
GIT (versionado)                    SUPABASE (operacional)
─────────────────────               ─────────────────────
migrations/*.sql                    linhas das tabelas
functions/ (edge functions)         estado das execuções
config.toml                         filas e leases
seeds sintéticos                    eventos e auditoria
schemas e contratos                 custos e uso
policies como código                sessões de usuário
```

**Regra:** o GitHub **não** é o banco de dados. O Supabase **não** é o repositório. A integração GitHub↔Supabase reconstrói o schema a partir das migrations versionadas — nunca o contrário.

---

## 3. Organização por schema Postgres

Não expor tudo pela Data API. Separação explícita:

| Schema | Conteúdo | Exposto ao cliente? |
|---|---|---|
| `api` | Views e funções deliberadamente expostas | Sim |
| `factory` | Domínio interno | Parcial, via `api` |
| `workflow` | Orquestração, jobs, leases | Não |
| `agents` | Runs, perfis, skills | Parcial, leitura |
| `review` | Ciclos, findings, divergências | Parcial, leitura |
| `governance` | Aprovações, políticas, auditoria | Leitura restrita |
| `integration` | IDs e metadados externos | Não |

Grants explícitos **e** RLS são verificações separadas. As duas precisam estar corretas.

---

## 4. Chaves de API — modelo atual

| Chave | Formato | Pode ir ao navegador? | Contorna RLS? |
|---|---|---|---|
| **Publishable** | `sb_publishable_...` | **Sim**, protegida por RLS | Não |
| **Secret** | `sb_secret_...` | **Nunca** | **Sim** |
| Legada `anon` | JWT | sim (legado) | não |
| Legada `service_role` | JWT | nunca | sim |

As chaves legadas `anon` e `service_role` estão em descontinuação e devem ser desativadas assim que possível. Usar o formato novo desde o início.

```
Control Plane (navegador)  →  sb_publishable_  +  RLS
Orchestrator (servidor)    →  sb_secret_       (nunca sai do servidor)
Agente                     →  NENHUMA chave. Passa por RNS Tool API.
```

★ Um vazamento de `sb_secret_` expõe **todos** os dados do projeto. Trate-a como a chave mestra que é.

---

## 5. RLS — Row Level Security

### Regra base

Toda tabela exposta tem RLS habilitada. Sem exceção.

```sql
alter table workflow.tasks enable row level security;

create policy "org members can read tasks"
on workflow.tasks
for select
to authenticated
using (
  organization_id in (
    select organization_id
    from factory.memberships
    where user_id = auth.uid()
      and accepted_at is not null
  )
);

create policy "engineers can insert tasks"
on workflow.tasks
for insert
to authenticated
with check (
  organization_id in (
    select organization_id
    from factory.memberships
    where user_id = auth.uid()
      and role in ('owner','admin','engineer')
  )
);
```

### A regra mais importante dos testes de RLS

**Todo policy precisa de caso de NEGAÇÃO testado.** Testar só o caminho positivo não prova isolamento.

```sql
-- supabase/tests/rls_tasks.sql
begin;
select plan(4);

-- usuário da org A vê suas tarefas
select set_config('request.jwt.claims', '{"sub":"user-a"}', true);
select is( (select count(*) from workflow.tasks where organization_id = 'org-a'), 3::bigint,
           'usuário A vê as 3 tarefas da org A' );

-- ★ usuário da org A NÃO vê tarefas da org B
select is( (select count(*) from workflow.tasks where organization_id = 'org-b'), 0::bigint,
           'usuário A não vê nada da org B' );

-- viewer não consegue inserir
select set_config('request.jwt.claims', '{"sub":"user-viewer"}', true);
select throws_ok( $$ insert into workflow.tasks (organization_id, title, kind, state)
                     values ('org-a','x','implement','created') $$,
                  'viewer não pode inserir tarefa' );

-- ★ approvals com actor agente é rejeitada
select throws_ok( $$ insert into governance.approvals
                     (organization_id, subject_type, subject_id, subject_sha,
                      decision, actor_type, actor_id)
                     values ('org-a','stage', gen_random_uuid(), repeat('a',40),
                             'approved','agent', gen_random_uuid()) $$,
                  'agente não pode gravar aprovação' );

select * from finish();
rollback;
```

### Invariante de aprovação

```sql
alter table governance.approvals
  add constraint approvals_must_be_human
  check (actor_type = 'human');
```

Isso não é uma convenção de código. É uma constraint. Um bug no Orchestrator não consegue violá-la.

---

## 6. Branching e preview

### Como funciona

```
desenvolvedor/agente cria branch git
            ↓
GitHub integration detecta
            ↓
Supabase cria branch correspondente
            ↓
migrations do diretório migrations/ são aplicadas automaticamente
            ↓
commits seguintes aplicam APENAS as migrations novas
            ↓
PR fechado ou merged → branch descartada
```

### Fatos operacionais importantes

| Fato | Consequência para a fábrica |
|---|---|
| Preview **não clona dados de produção** | Seeds sintéticos são obrigatórios. Nunca dados reais |
| Re-rodar migrations existentes exige **reset da branch**, que **apaga os dados** | O agente não faz reset sozinho; é ação controlada |
| Merge na branch de produção pode aplicar migrations e deployar Edge Functions | O merge gate precisa ser rigoroso |
| Configurações de API, Auth e seed são ignoradas por padrão no deploy de produção | Mudanças nessas áreas precisam de processo próprio |
| O check de migração do Supabase pode ser **required status check** no GitHub | ★ Tornar obrigatório. Migration inválida não chega a `main` |

### Configuração recomendada

```
Automatic branching:      ON
Supabase changes only:    ON  (só cria branch quando há mudança em supabase/)
Deploy to production:     ON, mas atrás do merge gate
Required status check:    ON  ★
Notificações de falha:    ON
```

---

## 7. Filas (Supabase Queues / pgmq)

Base: extensão `pgmq`. Fila durável dentro do Postgres, com entrega garantida e janela de visibilidade.

```
Orchestrator enfileira job
        ↓
mensagem persiste no Postgres
        ↓
worker faz read com visibility timeout
        ↓
mensagem fica reservada àquele consumidor
        ↓
worker processa
        ├── sucesso → delete/archive
        └── falha   → visibility expira → outro worker pega
```

### O que a fila NÃO resolve

★ A janela de visibilidade **não substitui handlers idempotentes**. Uma operação externa (criar PR, chamar a API do modelo) pode ter sido executada logo antes do worker morrer. Se o handler não for idempotente, a retomada duplica o efeito.

Por isso, além da fila, a fábrica mantém:

```
jobs.lease_owner · lease_acquired_at · lease_expires_at
jobs.idempotency_key  (unique)
jobs.attempt / max_attempts / next_attempt_at
```

Filas recomendadas:

```
factory.planning       decomposição e planejamento
factory.execution      execução de agentes
factory.review         passagens de revisão
factory.checks         CI e verificações
factory.provisioning   criação de infraestrutura
factory.deployment     release
factory.dead_letter    falhas terminais
```

---

## 8. Edge Functions — o que pode e o que não pode

Edge Functions têm limites de duração e CPU por requisição. Isso define o uso.

| Pode | Não pode |
|---|---|
| Receber webhook, verificar assinatura, normalizar, persistir, enfileirar, responder 2xx | Executar um agente por 40 minutos |
| Comandos curtos e idempotentes | Loop de orquestração longo |
| Transformações rápidas | Build, checkout, teste |

```
CERTO                              ERRADO
─────                              ──────
GitHub webhook                     GitHub webhook
   ↓                                  ↓
Edge Function (< 2s)               Edge Function
   ↓                                  ↓
enqueue                            Claude trabalhando 45 min
   ↓                                  ↓
Worker externo                     timeout, sem rastro
   ↓
Agente
```

---

## 9. Management API — provisionamento programático

O Provisioning Service usa a Management API para criar o projeto Supabase de cada aplicativo produzido.

```
POST criar projeto
  → project_ref, região, senha do banco (para o secret manager)
  ↓
aguardar projeto ficar pronto (polling com backoff)
  ↓
aplicar migrations iniciais do golden template
  ↓
configurar Auth conforme o template
  ↓
conectar integração GitHub (branching)
  ↓
registrar project_ref em integration.supabase_projects
```

Regras:
1. Cada passo é **idempotente** e registra o ID externo antes de seguir.
2. A senha do banco vai direto para o secret manager; nunca para `integrations.config` nem para log.
3. Falha no passo N não refaz os passos 1..N-1.
4. O `project_ref` é a chave de correlação para tudo depois.

---

## 10. Backup e recuperação

| Item | Política |
|---|---|
| Factory Supabase | Backup diário + point-in-time recovery conforme o plano contratado (`UNSPECIFIED`) |
| Generated Apps | Política herdada do plano de cada projeto |
| Auditoria | Exportação periódica para armazenamento imutável |
| Testes de restauração | **Obrigatório testar a restauração antes da Fase 5.** Backup nunca testado não é backup |

---

## 11. Checklist de implementação

```
□ Projeto Factory Supabase criado
□ Schemas api/factory/workflow/agents/review/governance/integration criados
□ Todos os tipos enum criados
□ Todas as tabelas de 02-ARQUITETURA/04-MODELO-DE-DADOS.md criadas
□ RLS habilitada em TODA tabela exposta
□ Policies com caso positivo E caso de negação testados
□ Constraint approvals_must_be_human aplicada
□ Índices essenciais criados
□ Filas pgmq criadas
□ Chaves publishable/secret geradas; legadas desativadas
□ sb_secret_ apenas em variável de ambiente do servidor
□ Integração GitHub configurada com branching automático
□ Required status check do Supabase ativado no repositório
□ Seeds sintéticos criados (zero dados reais)
□ supabase test db rodando em CI
□ Backup verificado com teste de restauração
```

---

## Fontes

- [Supabase Docs — GitHub integration (branching)](https://supabase.com/docs/guides/deployment/branching/github-integration)
- [Supabase Docs — API keys](https://supabase.com/docs/guides/api/api-keys)
- [Supabase Docs — Queues](https://supabase.com/docs/guides/queues)

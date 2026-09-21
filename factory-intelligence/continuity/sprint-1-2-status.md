# Status do Sprint 1.2 — registro de continuidade

Classe de conhecimento: continuidade (append/reconcile — ver Artigo 12 da Constituição). Este documento é escrito ANTES da implementação, como exigido pela instrução de "identificar critérios de aceitação e dependências antes de começar" — e é atualizado conforme o sprint avança.

Checklist original: `docs/08-PLANO-DE-IMPLEMENTACAO/02-FASE-1-APP-FUNCIONAL.md`, Sprint 1.2.

## Escopo (exatamente o que o plano lista, nada além)

```
□ Supabase Auth: e-mail/senha + OAuth GitHub
□ Criação de organização no primeiro acesso
□ /login, /registrar, /recuperar-senha, /aceitar-convite
□ Shell: AppSidebar, GlobalSearch, NotificationBell, UserMenu
□ Design system mínimo: tokens, Button, Input, Card, StatusPill,
  AsyncBoundary, EmptyState, ErrorState
□ Storybook configurado
□ Configurações: Geral, Equipe, Segurança
□ RBAC aplicado nas rotas

SAÍDA: entrar, criar organização, convidar membro, alterar papel
```

Deliberadamente fora deste sprint (não amplio escopo silenciosamente):
- Configurações → Notificações, Aparência, Avançado (a página 09 os lista como `[F1]`, mas o checklist do Sprint 1.2 só pede Geral/Equipe/Segurança — outras entram depois).
- Faturamento, Planos e Uso (`[F2]` na própria página 09).
- Câmara de Revisão, Fila de Aprovações (`[F2]`/estrutura só, não este sprint).

## Dependências identificadas antes de implementar

1. **Tabelas já existentes** (`supabase/migrations/0002_identity_and_apps.sql`): `factory.organizations`, `factory.users` (espelha `auth.users`), `factory.memberships` (`role membership_role`: owner/admin/engineer/viewer). RLS e funções auxiliares (`user_organizations()`, `user_has_role()`) já existem em `0009_rls_policies.sql`.
2. **Gap de schema real, não presumido — ver nota abaixo**: nenhuma tabela/coluna modela convite por e-mail com token e expiração para alguém que ainda não tem conta.
3. **Stack já congelada** (Sprint 1.1): Next.js 16.3.5 App Router, TS strict, Tailwind 4.3.3, Vitest 5.0.1. Falta: Supabase Auth client (`@supabase/ssr`/`@supabase/supabase-js`), Storybook, shadcn/ui source-owned.
4. **`.env.example`** já lista `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — suficiente para o client-side de Auth. Habilitar o provedor OAuth GitHub em Supabase Auth (client id/secret do GitHub OAuth App) é configuração de infraestrutura, fora do meu mandato de só escrever código — a UI/rota de login por GitHub é construída assumindo que o provedor será habilitado.

## Nota — gap de schema: convite por e-mail (consultado ao fiscal antes de implementar)

`factory.memberships.user_id` é `not null references factory.users(id)`, e `factory.users.id` só existe depois que a pessoa já tem conta (`= auth.users.id`). Isso significa que **não é possível hoje criar um registro de convite para um e-mail que ainda não tem conta** — mas tanto `docs/03-PAGINAS/10-TELAS-TRANSVERSAIS.md` (`/aceitar-convite/:token`, "token com expiração") quanto `docs/03-PAGINAS/09-CONFIGURACOES.md` ("Convidar: e-mail + papel; convite com expiração") exigem exatamente esse fluxo. `docs/02-ARQUITETURA/04-MODELO-DE-DADOS.md` não modela token nem expiração em lugar nenhum.

Isto não é uma decisão que me cabe inventar (é schema — `supabase/migrations/**` é caminho privilegiado, e a forma certa — nova tabela `factory.invites` vs. relaxar `memberships.user_id` — é uma decisão arquitetural real). Consultado via `/fiscal` nesta PR antes de implementar o fluxo de convite. Resposta e decisão final registradas aqui assim que chegarem.

## Feito, com evidência verificável

_(preenchido conforme o sprint avança)_

## Pendente

_(preenchido conforme o sprint avança)_

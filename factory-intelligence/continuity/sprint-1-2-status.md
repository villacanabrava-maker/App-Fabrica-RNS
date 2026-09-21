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

Isto não é uma decisão que me cabe inventar (é schema — `supabase/migrations/**` é caminho privilegiado, e a forma certa — nova tabela `factory.invites` vs. relaxar `memberships.user_id` — é uma decisão arquitetural real). Consultado via `/fiscal` na PR #5.

**Resposta do fiscal** (`request_id: fiscal_57bb712e9b422021c1fb2616`, `base_sha: bed8a9c`): direção técnica **(a)** — tabela `factory.invites` separada, não relaxar `memberships.user_id`. Requisitos mínimos: e-mail normalizado, papel limitado aos válidos, hash/digest do token (nunca em claro), `expires_at`, `invited_by`, `accepted_at` + quem aceitou, `revoked_at`, índice único no hash, FKs com comportamento de exclusão explícito. Convite **nunca** aparece em `factory.user_organizations()`/`factory.user_has_role()`. Aceitação como operação transacional (lock do convite, validação de organização/expiração/revogação/e-mail, sem elevação de papel pelo cliente, idempotente, sem corrida entre aceitações simultâneas). Testes de RLS obrigatórios: isolamento entre tenants, usuário comum não pode convidar com papel privilegiado, token expirado/revogado/reutilizado rejeitado, e-mail divergente rejeitado, sem duplicar membership em concorrência, convite pendente não concede acesso.

**Bloqueador explícito do fiscal, ainda aberto:** "não iniciar a migration como decisão unilateral antes do congelamento documental humano" — a decisão arquitetural (mesmo já validada tecnicamente) precisa ser registrada por um responsável humano e refletida em `docs/02-ARQUITETURA/04-MODELO-DE-DADOS.md` + documentação do fluxo, antes da migration ser escrita. **Não escrevi a migration.** Levado ao usuário para decisão/congelamento — ver comentário da PR #5 e a conversa.

## Nota — segundo gap de RLS/multi-tenant: bootstrap de organização (resolvido)

Ao implementar "criação de organização no primeiro acesso": não existe policy de INSERT em `factory.organizations`, e a única policy de escrita em `factory.memberships` ("admins manage memberships") exige que o usuário já seja owner/admin da organização — impossível para a primeira membership de uma organização nova. Consultado via `/fiscal` na PR #5 antes de escrever a migration.

**Resposta do fiscal** (`request_id: fiscal_e2e3a330b5652c9b5bb3e602`): função `SECURITY DEFINER` é a direção correta (não abrir policy de INSERT direta — permitiria autoelevação em organização já existente). Requisitos: transação única, `auth.uid()` exclusivo, falhar se `NULL`, não aceitar `user_id`/`role`/`organization_id` do cliente, `search_path = ''`, nomes schema-qualificados, `revoke`/`grant` como as funções já existentes, sem novo privilégio de INSERT em tabela. Diferente do caso de convites, esta é **orientação de implementação, não exige congelamento documental humano prévio** — implementado.

**Entregue:** `supabase/migrations/0014_organization_bootstrap.sql` (`factory.create_organization(name, slug)`) e `supabase/tests/organization_bootstrap.sql` (11 testes: bootstrap com sucesso, `user_id = auth.uid()`, `accepted_at` preenchido, anon bloqueado por falta de USAGE no schema, authenticated sem claim bloqueado pelo guard interno, isolamento entre tenants, autoelevação em org existente bloqueada mesmo sabendo o id, insert direto negado, conflito de slug sem órfão). **Não executado localmente** — `supabase test db` precisa de Docker, e o daemon não sobe neste sandbox (`failed to connect to the docker API`, mesmo limite já documentado no Sprint 1.1). Rodou de verdade no Database CI (ver seção abaixo "Achado pelo Database CI real") e pegou 2 falhas de teste (não da migration), corrigidas.

Limite de escopo não resolvido nesta função (documentado, não meu para decidir): limite de organizações por usuário — não há regra canônica documentada; deixado `UNSPECIFIED`.

## Dois gaps novos encontrados, não bloqueantes de segurança entre tenants — registrados como dívida, não resolvidos neste sprint

Achados ao implementar Configurações; diferente dos dois acima, nenhum abre brecha entre organizações (não são escalação de privilégio nem vazamento cross-tenant) — por isso não voltei ao fiscal para mais uma rodada de decisão arquitetural antes de prosseguir, mas também não fingi que funcionam:

1. **`governance.audit_events` não tem policy de INSERT** (só `"org members read audit"`, SELECT). `09-CONFIGURACOES.md` §12 exige "toda alteração de configuração gera audit_event" — as server actions de Configurações (`updateOrganizationGeneral`, `updateMemberRole`, `removeMember`) **não geram audit_event nenhum agora** porque a chamada falharia (RLS bloqueia). Precisa de uma função `SECURITY DEFINER` equivalente à de bootstrap de organização — não escrita ainda.
2. **Nenhuma constraint/trigger impede uma organização ficar sem owner.** "Não remove/rebaixa o último owner" (09-CONFIGURACOES.md) está implementado só na camada de aplicação (`isLastOwner()` em `server/actions/settings.ts`), checado antes de cada `UPDATE`/`DELETE` — funciona, mas não é a defesa de banco que os outros invariantes do sistema têm (`approvals_must_be_human` etc. são `CHECK CONSTRAINT`). Uma migration com trigger seria mais robusta; não implementada agora.

## Feito, com evidência verificável

| Item do checklist | Evidência |
|---|---|
| Supabase Auth: e-mail/senha | `server/actions/auth.ts` (`signInWithPassword`, `signUpWithPassword`), páginas `/login`, `/registrar` |
| Supabase Auth: OAuth GitHub | `signInWithGitHub` + botão real em `/login` — depende do provedor estar habilitado no Supabase Auth (infraestrutura, fora do meu mandato); código não presume que está |
| Criação de organização no primeiro acesso | `supabase/migrations/0014_organization_bootstrap.sql`, `/organizacao/nova`, `server/actions/organizations.ts` |
| `/login`, `/registrar`, `/recuperar-senha` | implementadas, com estados de erro/loading/acessibilidade (mostrar senha com `aria-pressed`, erro em `aria-live`) |
| `/aceitar-convite` | **não implementada** — bloqueada pela decisão de schema de convites (ver nota acima), aguardando o usuário |
| `/auth/callback` | `app/auth/callback/route.ts`, troca de código OAuth/e-mail por sessão |
| Shell: AppSidebar, GlobalSearch, NotificationBell, UserMenu | `components/shell/*` — os 9 itens fixos, busca com atalho ⌘K (Base UI Dialog, sem índice de dados ainda — vazio real, não fabricado), sino (Base UI Popover, 0 notificações reais), menu do usuário (Base UI Menu, tema + sair funcionais) |
| Design system mínimo | `packages/design-system`: tokens resolvidos (`design-system/tokens.json` + gerador `scripts/design-system/build-tokens-css.ts`), Icon, Button, Input, Card, StatusPill, AsyncBoundary, EmptyState, ErrorState |
| Configurações: Geral | `/configuracoes/geral` — nome/descrição/fuso, RBAC (só owner/admin editam) |
| Configurações: Equipe | `/configuracoes/equipe` — lista real, alterar papel, remover membro, proteção de último owner; convidar desabilitado (bloqueado, ver acima) |
| Configurações: Segurança | `/configuracoes/seguranca` — status real de 2FA via `supabase.auth.mfa`; sessões/chaves/log de auditoria claramente marcados como não implementados, não fabricados |
| RBAC aplicado nas rotas | `src/proxy.ts` (sessão), `(app)/layout.tsx` (organização), `server/queries/rbac.ts` + checks por página (owner/admin para editar) |

## Storybook configurado (segundo round)

`apps/control-plane/.storybook/{main.ts,preview.tsx}` + `src/stories/*.stories.tsx` (Button, Input, Card, StatusPill, EmptyState, ErrorState, AsyncBoundary). Decisão: as stories vivem no app (`apps/control-plane/src/stories`), não em `packages/design-system` — o pacote de design system é "puro" (sem devDependency de ferramentas de app, mesmo padrão do Sprint 1.1); quem depende de Storybook é o app. `eslint-plugin-storybook` (já na dependência) foi de fato ligado em `eslint.config.mjs` (`flat/recommended`), não só instalado.

**Validado de verdade, não só por typecheck**: `pnpm build-storybook` rodou até o fim (webpack compilou os 7 bundles de stories + preview com os tokens/Tailwind reais via `globals.css`) — "Storybook build completed successfully". `storybook-static/` adicionado ao `.gitignore` (artefato de build, não deveria ir para o repositório).

## Revisão final de RBAC (achado de consolidação, corrigido)

Ao revisar as rotas `(app)` uma a uma antes de fechar o sprint: `canManageTeam`/`canManageSecurity` em `server/queries/rbac.ts` duplicavam o mesmo teste (`role === 'owner' || role === 'admin'`) em vez de usar `hasAtLeastRole`, que já existia no mesmo arquivo. `configuracoes/geral/page.tsx` repetia o teste inline uma terceira vez, e `server/actions/settings.ts` uma quarta (`requiredRoleForMemberChange()`). Nenhuma das quatro cópias estava errada, mas quatro cópias do mesmo invariante de permissão é exatamente o tipo de duplicação que diverge silenciosamente numa mudança futura. Consolidado em `canManageOrganization(role) = hasAtLeastRole(role, 'admin')`, e as quatro chamadas agora passam por ela.

Achado adicional, corrigido: `removeMember` (`server/actions/settings.ts`) não tinha nenhum check de papel na camada de aplicação (só `updateMemberRole` tinha) — dependia inteiramente da RLS (`"admins manage memberships" for all`, confirmada em `0009_rls_policies.sql`, cobre DELETE). Não era brecha de segurança (RLS já bloqueava, e a UI só mostra o botão "Remover" quando `canManageTeam` é verdadeiro), mas ficava inconsistente com `updateMemberRole` e devolvia um erro genérico em vez de uma mensagem clara. Adicionado o mesmo guard de `canManageTeam` no início da action, por defesa em profundidade e paridade com `updateMemberRole`.

## Pendente

| Item | Por que não está nesta PR | O que resolve |
|---|---|---|
| `/aceitar-convite/:token` + migration `factory.invites` | Aguardando decisão/congelamento humano (ver nota acima) | Usuário decide; fiscal já validou a abordagem técnica |
| `governance.audit_events` sem função de escrita seguro | Achado durante Configurações, não é brecha de segurança entre tenants | Função SECURITY DEFINER equivalente à de bootstrap de organização |
| Proteção de último owner só em nível de aplicação | Idem — funciona, mas não é constraint de banco | Trigger/constraint no banco, mais robusto |
| `supabase test db` não executado localmente | Docker sem daemon neste sandbox (mesmo limite do Sprint 1.1) | Database CI real confirma `0014_organization_bootstrap.sql` + `organization_bootstrap.sql` |
| Testes de componente (interaction tests), E2E Playwright | Fora do que deu para cobrir neste round | Próximo round + Sprint 1.13 (aceitação da Fase 1) |

## Achado pelo Database CI real (não pela sandbox) — 2 testes de organization_bootstrap.sql corrigidos

O `supabase test db` do Database CI (que roda de verdade, com Docker, diferente deste sandbox) pegou 2 falhas em `organization_bootstrap.sql` no push de `fd62f00`/`c78c068` — exatamente o motivo de escrever os testes em vez de só confiar na migration. Investigado a fundo antes de tocar em qualquer coisa em `supabase/migrations/**` (caminho privilegiado, achado com cheiro de RLS/multi-tenant):

1. **Teste "anon sem sessão"**: esperava a mensagem customizada da função (`create_organization requer um usuário autenticado`), mas o erro real foi `42501: permission denied for schema factory`. Não é bug de segurança — é o oposto: `anon` nunca teve `USAGE` no schema `factory` (`0009_rls_policies.sql`, grant deliberadamente restrito a `authenticated`), então a chamada é barrada *antes* da função rodar. A expectativa do teste é que estava errada. Corrigido para o erro real, e adicionado um segundo caso que de fato exercita a checagem interna da função (`authenticated` sem claim `"sub"` no JWT → `auth.uid()` nulo).

2. **Teste "usuário B não consegue se autoelevar por insert direto"**: reportou "no exception" — nenhum erro, insert aparentemente livre. Investigação (sem poder rodar localmente, só leitura cuidadosa de `0002_identity_and_apps.sql`/`0009_rls_policies.sql`): o teste buscava o `organization_id` da organização A via `select ... from factory.organizations where slug = ...` estando autenticado como usuário B — mas essa leitura já é filtrada pela mesma RLS que isola tenants ("members read own organization"), então retornava **zero linhas** para o usuário B, e o INSERT (fonte vazia) inseria **zero linhas**: sem exceção porque não havia linha nenhuma para violar o `WITH CHECK`, não porque a defesa funcionou. Não é uma brecha de segurança real — é um teste que testava a coisa errada (visibilidade via SELECT, já coberta em outro teste) em vez da defesa que deveria cobrir (`WITH CHECK` de INSERT quando o atacante *sabe* o id, cenário realista já que UUIDs não são segredo). Corrigido capturando o id real de A numa tabela temporária (não sujeita a RLS) antes de trocar de usuário, e usando esse id capturado no ataque simulado.

Nenhuma mudança em `supabase/migrations/**` — a política de RLS ("admins manage memberships") já estava correta; só os testes tinham suposições erradas sobre como a RLS se comporta. `plan(10)` → `plan(11)` (um caso a mais). Não pude confirmar localmente (mesmo limite de Docker) — fica para o próximo run do Database CI provar de verdade.

**Rodada seguinte do Database CI (commit `f10ea70`) confirmou o essencial e pegou um erro meu**: o teste 9 (autoelevação via `t_org_a`) passou — a correção acima estava certa. Mas o teste do caso "anon" voltou a falhar, agora com "no exception" em vez do 42501 esperado: ao reescrever aquele bloco eu apaguei sem querer o `set local role anon;` que precede a chamada, então o teste rodava como `authenticated`/usuário A (ainda em efeito da seção 1) e a chamada simplesmente tinha sucesso, criando mais uma organização de verdade. Não é achado de produto — foi eu mesmo cortando uma linha durante a reescrita. Corrigido devolvendo o `set local role anon;`.

## Estado final do sprint

Todos os itens do checklist original estão entregues, exceto `/aceitar-convite` (bloqueado por decisão humana pendente, não por trabalho faltando) — ver nota acima. A "SAÍDA" pedida (entrar, criar organização, convidar membro, alterar papel) está coberta parcialmente: entrar/criar organização/alterar papel funcionam ponta a ponta; "convidar membro" só cobre convidar alguém que já tem conta (o botão de convite por e-mail fica desabilitado, propositalmente, até a decisão de schema).

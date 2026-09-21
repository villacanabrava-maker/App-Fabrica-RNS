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
| ~~Proteção de último owner só em nível de aplicação~~ | Resolvido em `0015_memberships_owner_hardening.sql` (trigger `protect_last_owner`, com lock `FOR UPDATE` contra corrida — ver seção "Fiscal R1" abaixo) | — |
| `supabase test db` não executado localmente | Docker sem daemon neste sandbox (mesmo limite do Sprint 1.1) | Database CI real confirma `0014_organization_bootstrap.sql` + `organization_bootstrap.sql` |
| Testes de componente (interaction tests), E2E Playwright | Fora do que deu para cobrir neste round | Próximo round + Sprint 1.13 (aceitação da Fase 1) |

## Achado pelo Database CI real (não pela sandbox) — 2 testes de organization_bootstrap.sql corrigidos

O `supabase test db` do Database CI (que roda de verdade, com Docker, diferente deste sandbox) pegou 2 falhas em `organization_bootstrap.sql` no push de `fd62f00`/`c78c068` — exatamente o motivo de escrever os testes em vez de só confiar na migration. Investigado a fundo antes de tocar em qualquer coisa em `supabase/migrations/**` (caminho privilegiado, achado com cheiro de RLS/multi-tenant):

1. **Teste "anon sem sessão"**: esperava a mensagem customizada da função (`create_organization requer um usuário autenticado`), mas o erro real foi `42501: permission denied for schema factory`. Não é bug de segurança — é o oposto: `anon` nunca teve `USAGE` no schema `factory` (`0009_rls_policies.sql`, grant deliberadamente restrito a `authenticated`), então a chamada é barrada *antes* da função rodar. A expectativa do teste é que estava errada. Corrigido para o erro real, e adicionado um segundo caso que de fato exercita a checagem interna da função (`authenticated` sem claim `"sub"` no JWT → `auth.uid()` nulo).

2. **Teste "usuário B não consegue se autoelevar por insert direto"**: reportou "no exception" — nenhum erro, insert aparentemente livre. Investigação (sem poder rodar localmente, só leitura cuidadosa de `0002_identity_and_apps.sql`/`0009_rls_policies.sql`): o teste buscava o `organization_id` da organização A via `select ... from factory.organizations where slug = ...` estando autenticado como usuário B — mas essa leitura já é filtrada pela mesma RLS que isola tenants ("members read own organization"), então retornava **zero linhas** para o usuário B, e o INSERT (fonte vazia) inseria **zero linhas**: sem exceção porque não havia linha nenhuma para violar o `WITH CHECK`, não porque a defesa funcionou. Não é uma brecha de segurança real — é um teste que testava a coisa errada (visibilidade via SELECT, já coberta em outro teste) em vez da defesa que deveria cobrir (`WITH CHECK` de INSERT quando o atacante *sabe* o id, cenário realista já que UUIDs não são segredo). Corrigido capturando o id real de A numa tabela temporária (não sujeita a RLS) antes de trocar de usuário, e usando esse id capturado no ataque simulado.

Nenhuma mudança em `supabase/migrations/**` — a política de RLS ("admins manage memberships") já estava correta; só os testes tinham suposições erradas sobre como a RLS se comporta. `plan(10)` → `plan(11)` (um caso a mais). Não pude confirmar localmente (mesmo limite de Docker) — fica para o próximo run do Database CI provar de verdade.

**Rodada seguinte do Database CI (commit `f10ea70`) confirmou o essencial e pegou um erro meu**: o teste 9 (autoelevação via `t_org_a`) passou — a correção acima estava certa. Mas o teste do caso "anon" voltou a falhar, agora com "no exception" em vez do 42501 esperado: ao reescrever aquele bloco eu apaguei sem querer o `set local role anon;` que precede a chamada, então o teste rodava como `authenticated`/usuário A (ainda em efeito da seção 1) e a chamada simplesmente tinha sucesso, criando mais uma organização de verdade. Não é achado de produto — foi eu mesmo cortando uma linha durante a reescrita. Corrigido devolvendo o `set local role anon;`.

## Achado no próprio protocolo `/fiscal` — pedido de revalidação não chegou a disparar o bridge

Pedi revalidação ao fiscal em `2bc794a` (comentário da PR) e esperei ~6h sem resposta — muito diferente do padrão anterior (respostas em menos de um minuto nos dois pedidos originais desta PR). Investigando: `.github/workflows/fiscal-bridge.yml` tem `if: startsWith(github.event.comment.body, '/fiscal')` no nível do job inteiro — o comentário precisa **começar** com `/fiscal`, exatamente como o próprio `CLAUDE.md` documenta ("comentário começando por `/fiscal`"). O comentário que fiz continha `/fiscal Pode revalidar...` no meio de um resumo de status longo, não como primeira linha. Confirmado via `actions_list`/`actions_get`: o run do workflow para esse comentário (`run_id 35570064371`) existe e concluiu `skipped` — o job nem chegou a rodar, então não houve falha do bridge nem do fiscal, só descumprimento meu do próprio protocolo. Reenviado como comentário próprio, começando literalmente por `/fiscal`, nada mais nas linhas anteriores.

## Achado real do fiscal na revisão de `0014_organization_bootstrap.sql` — comentário divergia do código

Fiscalização completa (`request_id fiscal_7aefb81016cdbd4594cd9ee2`) pegou algo real, independente da confusão de evidência incompleta que motivou o próprio parecer: o cabeçalho da migration dizia "escopo é só o bootstrap da PRIMEIRA organização", mas o código nunca impôs isso — qualquer usuário autenticado pode chamar `create_organization` quantas vezes quiser, virando owner de uma organização nova a cada vez. Verificado que isso não é bug de aplicação: `getCurrentMembership()` (`server/queries/organizations.ts`) já lida com múltiplas memberships aceitas de forma correta (pega a primeira, `.limit(1)`, documentado como "org switching é trabalho futuro") — não presume "usuário só pode ter uma organização". Corrigido o comentário da migration para descrever o comportamento real em vez de reivindicar uma restrição inexistente, e adicionado teste (`supabase/tests/organization_bootstrap.sql`, casos 9-10, `plan(11)` → `plan(13)`) travando esse comportamento real, para não regredir em silêncio se uma migration futura tentar impor limite sem atualizar o teste. Limite de organizações por usuário continua `UNSPECIFIED` — decisão de produto real ainda não tomada, não inventada aqui.

## Segunda rodada de fiscalização completa — 2 gaps de teste reais, corrigidos

`request_id fiscal_2188a6de173e86bda01b65f5` (a rodada com evidência completa colada inline, conforme pedido) avaliou os critérios de segurança um a um e considerou a maioria adequada, mas identificou 2 lacunas de teste concretas e acionáveis (e 2 pontos de design, registrados como dívida sem mudança de código — ver abaixo):

1. **Rollback nunca testado de verdade**: a atomicidade era afirmada (plpgsql sem exception handler) mas nenhum caso existente provocava falha no 2º insert. Adicionado teste 14/15 (`supabase/tests/organization_bootstrap.sql`): `auth.uid()` apontando para um usuário com linha em `auth.users` mas sem espelho em `factory.users` (inconsistência real possível entre as duas tabelas) — a membership falha por FK (`23503`), e verificado com `reset role` (bypassa RLS) que a organização não fica órfã.
2. **ACL da função nunca verificada no catálogo**: os `revoke`/`grant` provam intenção no texto da migration, não o estado efetivo após as 14 migrations aplicadas em sequência. Adicionado teste 16/17 usando `has_function_privilege()` direto no catálogo: `anon` (proxy para `PUBLIC`, que nunca recebeu grant direto) sem `EXECUTE`, `authenticated` com `EXECUTE`.

`plan(13)` → `plan(17)`. Achado de processo ao escrever o teste 14: o insert em `auth.users` precisa rodar com `reset role` (papel de conexão do teste) — `authenticated` (ainda em efeito de um teste anterior) não tem privilégio de escrita em `auth.users`, só percebido porque o insert original (linha 10-12 do arquivo) roda antes de qualquer `set local role`, então nunca tinha sido testado sob esse papel.

**2 pontos levantados, registrados como dívida, sem mudança de código nesta rodada** (não são regressão desta migration, são características pré-existentes do schema/produto):
- **Slug global permite descobrir existência de organização de outro tenant via erro `23505`** — `factory.organizations.slug` já é `unique` (globalmente, não por tenant) desde `0002_identity_and_apps.sql`, antes desta migration. Não decido sozinho se isso deveria mudar (relaxar para unicidade por-tenant seria uma mudança de modelo de dados mais ampla); registrado, não inventada solução.
- **`returns factory.organizations` acopla o contrato do RPC à tabela inteira** — crítica de design de API válida, mas mudar o contrato de retorno (ou de mensagens de erro) é uma decisão que afetaria o padrão de todas as funções RPC do sistema, não só esta — fora do escopo de uma correção pontual nesta migration.

Database CI confirmou o head com essas 2 correções: `dee525c`, `Files=5, Tests=40, Result: PASS` (34 anteriores + 6 novos em `organization_bootstrap.sql`, 11→17 casos).

## Fiscalização da migration encerrada — sem bloqueador técnico novo

Terceira rodada (`request_id fiscal_41bea400ecc05e4c03f0090f`, evidência completa: base/head explícitos, `git diff --name-status`, delta desde o último CI verde, run+log real do Database CI, migration e teste integrais, DDL de `factory.organizations`, confirmação de ausência de `FORCE ROW LEVEL SECURITY`): **os 5 itens de evidência pedidos na rodada anterior fecharam sem novo bloqueador técnico**. Ressalva do próprio parecer: a fiscalização é sobre o conteúdo reproduzido no comentário, não uma verificação live independente do GitHub — essa conferência continua sendo humana, como o protocolo já previa. Não é aprovação nem autorização de merge.

Resumo de 3 rodadas de fiscalização completa desta migration:
1. Achado real corrigido — comentário da migration divergia do código (limite de organizações por usuário não era imposto, mas o texto dizia que sim).
2. 2 gaps de teste reais corrigidos — rollback (atomicidade) nunca testado; ACL da função nunca verificada no catálogo (só no texto do `grant`/`revoke`).
3. 2 pontos de design registrados como dívida pré-existente, sem mudança de código — descoberta de slug via `23505` (característica do schema desde `0002`, não desta migration); `returns factory.organizations` acopla contrato à tabela inteira (mudança de padrão system-wide, fora do escopo de uma migration pontual).

`supabase/migrations/0014_organization_bootstrap.sql` é a única mudança em caminho privilegiado (`supabase/migrations/**`) deste sprint — considero a fiscalização desse caminho materialmente completa. RBAC de rotas (`canManageOrganization`) e auth flows não passam pelo mesmo gate de `/fiscal` (não envolvem `SECURITY DEFINER`/RLS), foram revisados diretamente durante a implementação (ver seção "Revisão final de RBAC" acima).

## Fiscal R1 (rodada `fiscal_b92abef9e129f59fae0f35d2`, sha `e2e1cbc`) — achados validados pelo construtor local

Revisão do fiscal OpenAI sem acesso live (só diff inline), 6 pontos. Validados um a um contra o código atual antes de corrigir — só os confirmados foram alterados:

1. **[BLOQUEADOR, confirmado] `removeMember()` sempre falhava.** `0009_rls_policies.sql` só concede `select, insert, update` a `authenticated`; a policy de DELETE de `0015` nunca chegava a ser avaliada por falta do GRANT de tabela. `supabase/tests/memberships_owner_hardening.sql` mascarava isso concedendo `delete` manualmente dentro da própria transação de teste. Corrigido: `grant delete on factory.memberships to authenticated;` em `0015` (migration ainda não mesclada em `main` — não é histórica, pode ser editada); grant redundante removido do teste.
2. **[ALTO, confirmado] Corrida no trigger de último owner.** `protect_last_owner()` fazia `SELECT` simples para checar "existe outro owner"; duas transações concorrentes removendo/rebaixando owners distintos da mesma organização não se viam (READ COMMITTED) e ambas passavam. Corrigido com `FOR UPDATE` na checagem: a segunda transação bloqueia até a primeira commitar e reavalia o estado real (na pior hipótese as duas colidem em deadlock — Postgres aborta uma delas; nunca as duas commitam e zeram os owners). Teste de concorrência real (duas sessões simultâneas) não é viável no harness pgTAP atual (roda em uma única transação) — fica como limite conhecido, não como pendência silenciada.
3. **[ALTO, já rastreado] `governance.audit_events` sem função de escrita.** Não é achado novo — já documentado acima ("Dois gaps novos...", item 1) desde a implementação original. Sem mudança de código nesta rodada.
4. **[ALTO, não é código] CI/Vercel.** `Vercel – fabricarns` (Agent Bridge) é falha fora do escopo desta PR de app control-plane; `validate` skip é esperado — já explicado nas rodadas de revisão anteriores (`CLAUDE_CLOUD_REVIEWER`, rounds 1–3). Nada a corrigir no código.
5. **[MÉDIO, confirmado] `NEXT_PUBLIC_SITE_URL` sem validação e erro de reset engolido.** Fallback `?? ''` fazia `redirectTo` virar caminho relativo se a env var faltasse, e `resetPasswordForEmail()` tinha o retorno descartado (nenhum log, nem servidor). Corrigido: `siteUrl()` em `lib/supabase/env.ts` (mesmo padrão de `supabaseUrl()`/`supabasePublishableKey()`, lança erro claro se ausente), usado nos dois `redirectTo` de `auth.ts`; erro de `resetPasswordForEmail` agora logado no servidor (`console.error`) sem alterar a resposta uniforme ao cliente (continua sem revelar se o e-mail existe). `NEXT_PUBLIC_SITE_URL` adicionada ao `.env.example`.
6. **[Lacuna de evidência, não é código] Pedido de mais contexto** (plano/DoD/diff completo dos arquivos omitidos/logs). Não é um bug — é pedido de evidência para uma rodada de revisão sem acesso live ao GitHub.

## Estado final do sprint

Todos os itens do checklist original estão entregues, exceto `/aceitar-convite` (bloqueado por decisão humana pendente, não por trabalho faltando) — ver nota acima. A "SAÍDA" pedida (entrar, criar organização, convidar membro, alterar papel) está coberta parcialmente: entrar/criar organização/alterar papel funcionam ponta a ponta; "convidar membro" só cobre convidar alguém que já tem conta (o botão de convite por e-mail fica desabilitado, propositalmente, até a decisão de schema).

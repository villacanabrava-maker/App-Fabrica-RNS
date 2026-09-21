# Versões verificadas — stack do Sprint 1.1

**Classe de conhecimento:** temporal (Artigo 13 da Constituição — precisa ser reverificado antes de uso material futuro, não memorizado como fato permanente).

Verificado em 21/09/2026, diretamente no registro npm (`npm view <pacote> version`) e na documentação oficial — não de memória, conforme exigido por `docs/02-ARQUITETURA/02-ARQUITETURA-FRONTEND.md` ("VERIFICAR ANTES DE USAR") e pelo Artigo 13 da Constituição.

| Pacote | Versão fixada no Sprint 1.1 | Fonte |
|---|---|---|
| Next.js | 16.3.5 (App Router) | [nextjs.org/blog](https://nextjs.org/blog), registro npm |
| React | 19.2.8 (apps/control-plane) / 19.3.0 disponível | registro npm |
| TypeScript | 7.0.2 nos `packages/*` puros; `^5.9` em `apps/control-plane` (ver nota) | registro npm |
| Tailwind CSS | 4.3.3 (CSS-first config, sem `tailwind.config.js`) | [ui.shadcn.com/docs/tailwind-v4](https://ui.shadcn.com/docs/tailwind-v4) |
| Vitest | 5.0.1 (+ `@vitest/coverage-v8` 5.0.1) | registro npm |
| Playwright | 1.63.0 | registro npm — ainda não instalado (entra no Sprint 1.13) |
| Storybook | 10.6.0 | registro npm — ainda não instalado (entra no Sprint 1.2) |
| pnpm | 10.33.0 (`packageManager` no `package.json` raiz) | registro npm |
| Node.js | 22.x (`engines.node >=22` no `package.json` raiz) | ambiente do CI (`actions/setup-node@v4`, `node-version: '22'`) |

## Nota sobre TypeScript 7 vs. 5

`apps/control-plane` fixa `typescript: ^5.9` em vez de `7.0.2`. TypeScript 7 é o novo compilador nativo (reescrito, não mais em JavaScript) e a `create-next-app` oficial ainda gera projetos pinados em `^5` — sinal de que o time do Next.js não certificou a combinação com o Next.js plugin do TS 7 até esta data. Os pacotes `packages/*` (sem dependência do plugin do Next) já rodam limpos em TypeScript 7.0.2, com `tsc --noEmit` passando. Reverificar esta nota quando `eslint-config-next`/`next` anunciarem suporte oficial a TypeScript 7.

## shadcn/ui e Base UI — resolvido no Sprint 1.2

`docs/01-PRODUTO/04-DECISOES-CONGELADAS.md` PEN-005 ("Primitive do shadcn/ui") tem default explícito: "congelar a opção suportada no scaffold escolhido". Verificado em 21/09/2026:

- `shadcn` CLI: `4.21.0` (registro npm).
- Mudança oficial de default, confirmada em [ui.shadcn.com/docs/changelog/2026-07-base-ui-default](https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default) (julho de 2026): novos projetos usam **Base UI** por padrão (`-b base`), não mais Radix (`-b radix`, ainda suportado mas não é o default). `shadcn init --defaults` resolve para `--preset=base-nova`, confirmando a mesma coisa via `shadcn init --help`.
- Pacote npm da primitive: **`@base-ui/react`** — `1.8.0` no registro. ★ Armadilha encontrada: `@base-ui-components/react` (o nome que aparece com mais frequência em conteúdo desatualizado) está **DEPRECATED** — `npm view @base-ui-components/react` mostra "Package was renamed to @base-ui/react" e sua última versão publicada (`1.0.0-rc.0`, jul/2026) já não recebe atualizações; `@base-ui/react` é o pacote ativo (`1.8.0`, publicado 04/09/2026). `pnpm install` avisou "deprecated @base-ui-components/react" na primeira tentativa — corrigido para `@base-ui/react` antes de seguir.
- **Decisão congelada por este sprint, seguindo o default do PEN-005:** Base UI (`@base-ui/react`) é a primitive do projeto.

### Limitação de ambiente encontrada — CLI do shadcn não roda neste sandbox

`pnpm dlx shadcn@latest init` falha aqui: `ui.shadcn.com` está bloqueado pelo proxy de egress deste ambiente (`gateway answered 403 to CONNECT`, confirmado em `$HTTPS_PROXY/__agentproxy/status`) — o CLI busca o template/registro por HTTP em `ui.shadcn.com/init` em tempo de execução, e essa chamada é negada por política, não é falha transitória. `registry.npmjs.org` funciona normalmente (está na allowlist do proxy).

Consequência: os componentes Button/Input/Card do Sprint 1.2 foram escritos à mão em `packages/design-system`, seguindo o padrão de código público e estável do shadcn/ui (Button/Input/Card não dependem de nenhuma primitive — são elementos HTML estilizados com `class-variance-authority`, não Dialog/Select/Tabs/etc.), em vez de gerados pelo CLI. `@base-ui-components/react` entra como dependência agora (decisão de primitive já congelada), mas só passa a ser efetivamente usado quando um componente do catálogo que precisa dela for construído (Dialog, Popover, DropdownMenu, Tabs, Switch — não neste sprint).

### Demais pacotes verificados no registro npm em 21/09/2026

| Pacote | Versão | Uso |
|---|---|---|
| `@supabase/supabase-js` | 2.116.0 | client Supabase |
| `@supabase/ssr` | 0.12.7 | Supabase Auth em Server Components/Route Handlers |
| `lucide-react` | 1.47.0 | biblioteca de ícones (a "biblioteca única" de `02-ARQUITETURA-FRONTEND.md` §7) |
| `class-variance-authority` | 0.7.1 | variantes de componente (padrão shadcn) |
| `clsx` | 2.1.1 | composição de classe condicional |
| `tailwind-merge` | 3.7.0 | resolução de conflito de classes Tailwind |
| `next-themes` | 0.4.6 | tema claro/escuro/sistema |
| `tw-animate-css` | 1.4.0 | animações utilitárias (sucessor de `tailwindcss-animate` para Tailwind v4) |
| `@storybook/nextjs` | 10.6.0 | framework do Storybook para Next.js App Router |
| `@storybook/addon-a11y` | 10.6.0 | teste de acessibilidade automatizado no Storybook |

★ `@storybook/test` como pacote separado está desatualizado (`8.6.15` — anterior ao resto do Storybook 10). A partir do Storybook 8, os utilitários de teste são um subpath do próprio pacote `storybook`: `import { expect, fn, within } from 'storybook/test'`, confirmado em `npm view storybook exports` (expõe `./test`). Não instalar `@storybook/test` separadamente.

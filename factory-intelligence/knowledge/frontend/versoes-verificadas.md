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

## shadcn/ui

Ainda **não instalado**. `docs/01-PRODUTO/04-DECISOES-CONGELADAS.md` (ADR-041) já decide "componentes source-owned (shadcn/ui) sobre primitive congelada no projeto" — a instalação e a escolha de quais componentes trazer primeiro é trabalho do Sprint 1.2 (design system mínimo: Button, Input, Card, StatusPill, AsyncBoundary, EmptyState, ErrorState), junto com a resolução dos tokens `typography.family` de `design-system/tokens.json`, hoje `UNSPECIFIED`.

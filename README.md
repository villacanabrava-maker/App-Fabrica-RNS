# App Fábrica RNS

Repositório principal do projeto **Fábrica Apps RNS** — um control plane de engenharia de software multiagente: uma ideia vira especificação, a especificação vira plano, o plano é revisado em ciclo cruzado por agentes de IA, um humano aprova, agentes implementam em branches isoladas, e o software é liberado com evidência verificável em cada etapa.

## Objetivo
Construir o aplicativo de forma colaborativa entre agentes de desenvolvimento, mantendo o GitHub como fonte única de verdade do código, documentação e histórico de decisões.

## Documentação e código inicial

- `docs/00-COMECE-AQUI/00-LEIA-PRIMEIRO.md` — ponto de entrada da especificação completa do produto (arquitetura, páginas, plataformas, segurança, inteligência dos agentes, plano de implementação faseado).
- `factory-intelligence/`, `supabase/`, `packages/contracts/`, `design-system/` — código inicial já aplicado: constituição e modelo de segurança do produto, migrations, schemas, contratos TypeScript e design tokens.
- `docs/` resulta da fusão de dois pacotes de documentação produzidos para este projeto (ver `docs/00-COMECE-AQUI/00-LEIA-PRIMEIRO.md`, seção 0); nenhum dos dois foi importado cru — o conteúdo foi comparado, reconciliado e religado à estrutura real deste repositório.

## Monorepo (Fase 1, Sprint 1.1+)

Workspace pnpm em `apps/` (`control-plane`: Next.js App Router; `orchestrator-worker`: processo externo) e `packages/` (contratos, máquinas de estado, policy engine, domínio, review engine, agent adapters, integrações, design system) — estrutura definida em `docs/02-ARQUITETURA/01-ARQUITETURA-DO-SISTEMA.md` §2.

```bash
pnpm install
pnpm test:unit      # máquinas de estado + policy engine, puros
pnpm typecheck
pnpm build
pnpm dev             # sobe apps/control-plane
```

Versões de stack verificadas na fonte oficial (não de memória) em `factory-intelligence/knowledge/frontend/versoes-verificadas.md`.

## Fluxo de trabalho
- Branch principal: `main`
- Desenvolvimento preferencialmente em branches curtas por tarefa
- Pull requests pequenos e revisáveis
- Commits descritivos
- Alterações arquiteturais devem ser registradas em documentação no repositório
- Segredos e credenciais nunca devem ser versionados

## Agentes
As instruções de colaboração entre Claude Code, ChatGPT e outros agentes estão em `AGENTS.md` e `CLAUDE.md`.

## Estado
Especificação completa aplicada. Implementação da Fase 1 (aplicativo funcional, agentes mockados) em andamento — ver `docs/08-PLANO-DE-IMPLEMENTACAO/02-FASE-1-APP-FUNCIONAL.md`. Sprint 1.1 (fundação do monorepo, máquinas de estado e policy engine puros e testados) concluído; sprints 1.2 em diante seguem em PRs sucessivos.

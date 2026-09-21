# App Fábrica RNS

Repositório principal do projeto **Fábrica Apps RNS** — um control plane de engenharia de software multiagente: uma ideia vira especificação, a especificação vira plano, o plano é revisado em ciclo cruzado por agentes de IA, um humano aprova, agentes implementam em branches isoladas, e o software é liberado com evidência verificável em cada etapa.

## Objetivo
Construir o aplicativo de forma colaborativa entre agentes de desenvolvimento, mantendo o GitHub como fonte única de verdade do código, documentação e histórico de decisões.

## Documentação e código inicial

- `docs/00-COMECE-AQUI/00-LEIA-PRIMEIRO.md` — ponto de entrada da especificação completa do produto (arquitetura, páginas, plataformas, segurança, inteligência dos agentes, plano de implementação faseado).
- `factory-intelligence/`, `supabase/`, `packages/contracts/`, `design-system/` — código inicial já aplicado: constituição e modelo de segurança do produto, migrations, schemas, contratos TypeScript e design tokens.
- `docs/` resulta da fusão de dois pacotes de documentação produzidos para este projeto (ver `docs/00-COMECE-AQUI/00-LEIA-PRIMEIRO.md`, seção 0); nenhum dos dois foi importado cru — o conteúdo foi comparado, reconciliado e religado à estrutura real deste repositório.

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
Especificação completa e código inicial aplicados (`docs/` + `factory-intelligence/` + `supabase/` + `packages/contracts/` + `design-system/`). A implementação funcional da Fase 1 (aplicativo com agentes mockados, ver `docs/08-PLANO-DE-IMPLEMENTACAO/`) ainda não foi iniciada.

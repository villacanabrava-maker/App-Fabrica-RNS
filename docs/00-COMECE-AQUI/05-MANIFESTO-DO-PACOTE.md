# Manifesto do Pacote (fusão)

Herdado e refeito a partir do manifesto da Pasta Mãe Mestre v1.0, agora descrevendo o pacote **fundido e aplicado** neste repositório — documentação em `docs/` mais o código inicial já instalado na raiz.

## Conteúdo entregue

### `docs/` — documentação

| Pasta | Arquivos `.md` |
|---|---:|
| `00-COMECE-AQUI/` | 5 (inclui este manifesto e a matriz de rastreabilidade herdados da Pasta Mãe Mestre) |
| `01-PRODUTO/` | 4 |
| `02-ARQUITETURA/` | 8 |
| `03-PAGINAS/` | 12 (inclui o catálogo de ações e ícones herdado da Pasta Mãe Mestre) |
| `04-PLATAFORMAS/` | 6 |
| `05-SEGURANCA/` | 4 |
| `06-INTELIGENCIA-DOS-AGENTES/` | 6 |
| `07-QUALIDADE/` | 4 |
| `08-PLANO-DE-IMPLEMENTACAO/` | 5 |
| `09-PROMPTS/` | 6 |
| `10-CHECKLISTS/` | 3 |
| `99-REFERENCIAS-ORIGINAIS/` | 6 (5 pesquisas + 1 README) |
| `README.md` (raiz de `docs/`) | 1 |
| **Total Markdown em `docs/`** | **70** |
| Imagens (`99-REFERENCIAS-ORIGINAIS/imagens/`) | 10 PNG |

### Raiz do repositório — código inicial aplicado

| Local | Arquivos |
|---|---:|
| `factory-intelligence/constitution/` | 2 Markdown (`CONSTITUTION.md`, `SECURITY.md` — preenchidos na fusão) |
| `factory-intelligence/methodology/` | 1 Markdown (`README.md` — gap documentado, `UNSPECIFIED`) |
| `factory-intelligence/skills/` | 5 Markdown (`SKILL.md` por skill) |
| `factory-intelligence/registry/` | 4 YAML |
| `factory-intelligence/schemas/` | 6 JSON Schema |
| `supabase/migrations/` | 10 SQL |
| `supabase/tests/` | 2 SQL |
| `packages/contracts/` | 3 TypeScript |
| `design-system/tokens.json` | 1 JSON |
| `.github/workflows/` | 6 YAML |
| **Total no scaffold de código** | **40** |

**Total geral do pacote fundido:** 120 arquivos novos (80 em `docs/`, 40 na raiz do repositório), mais os ajustes de merge em `README.md`, `AGENTS.md`, `CLAUDE.md` e `.github/CODEOWNERS` já existentes no repositório.

## Integridade lógica — verificado nesta fusão

| Verificação | Resultado |
|---|---|
| 6 JSON Schemas (`factory-intelligence/schemas/`) + `design-system/tokens.json` | parse válido (Python `json`) |
| 4 registries YAML (`factory-intelligence/registry/`) | parse válido (`pyyaml`) |
| 6 workflows YAML (`.github/workflows/`) | parse válido (`pyyaml`) |
| 10 migrations + 2 arquivos de teste SQL | presentes, não truncados, terminam em statement completo |
| 3 contratos TypeScript | chaves e parênteses balanceados |
| 10 imagens PNG | assinatura de arquivo PNG válida em todas |
| Varredura por padrões de segredo (`sk-`, `AKIA`, chave privada PEM, `sb_secret_`) em todo conteúdo novo | nenhuma ocorrência |

Este pacote **não** roda as migrations contra um PostgreSQL real nem executa o typecheck estrito do TypeScript — isso depende de infraestrutura (Supabase, toolchain Node) que ainda não existe neste repositório, conforme a regra 8 de `CLAUDE.md`: não presumir Supabase, Vercel ou qualquer framework até que a configuração correspondente exista. A aplicação real das migrations e o typecheck ficam para a Fase 1 (`docs/08-PLANO-DE-IMPLEMENTACAO/02-FASE-1-APP-FUNCIONAL.md`).

## Cobertura

O pacote cobre visão/PRD, personas e decisões congeladas; arquitetura de sistema, frontend, backend, dados, máquinas de estado, eventos, contratos/APIs e design system; uma especificação por página mais o catálogo central de ícones; as cinco plataformas (Supabase, GitHub, Vercel, OpenAI/Anthropic, Antigravity) e sua integração; segurança (modelo, permissões, RLS, riscos); a inteligência dos agentes (constituição, registry R1–R9, skills, protocolo de revisão dupla, Task Packet, evals); qualidade (testes, CI/CD, acessibilidade, observabilidade); o plano de implementação faseado com Definition of Done; a biblioteca de prompts por ferramenta; checklists operacionais; e o código inicial já aplicado (migrations, schemas, contratos, skills, workflows, tokens).

## Limite do artefato

Este é o contrato documental de construção fundido com o código inicial já aplicado — não é a aplicação em produção nem a configuração ativa dos provedores (Supabase, Vercel, OpenAI, Anthropic). Itens marcados `UNSPECIFIED` ou `PENDENTE` (ver `01-PRODUTO/04-DECISOES-CONGELADAS.md`) devem ser resolvidos nos gates indicados; fatos voláteis sobre modelos, preços e versões precisam ser reverificados nas fontes oficiais antes de implementar, conforme o Artigo 13 da Constituição.

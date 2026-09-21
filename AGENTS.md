# AGENTS.md

## Fonte de verdade
Este repositório GitHub é a fonte de verdade do projeto. Antes de alterar arquivos, leia o estado atual da branch e evite sobrescrever trabalho de outro agente.

## Regras de colaboração
1. Não inserir segredos, tokens, chaves privadas ou credenciais no repositório.
2. Fazer mudanças pequenas, coesas e fáceis de revisar.
3. Preferir branches por tarefa e pull requests para mudanças não triviais.
4. Antes de modificar arquivos compartilhados, verificar alterações recentes.
5. Não reformatar ou renomear arquivos sem necessidade funcional.
6. Registrar decisões arquiteturais relevantes em `docs/`.
7. Ao encontrar conflito entre instruções, preservar comportamento existente e documentar a dúvida.
8. Testes e validações devem acompanhar novas funcionalidades sempre que aplicável.

## Convenção de branches
- `feat/<descricao>`
- `fix/<descricao>`
- `refactor/<descricao>`
- `docs/<descricao>`
- `chore/<descricao>`

## Commits
Preferir Conventional Commits:
- `feat:`
- `fix:`
- `docs:`
- `refactor:`
- `test:`
- `chore:`

## Pull requests
Cada PR deve informar:
- objetivo;
- principais mudanças;
- como validar;
- riscos ou impactos;
- migrações ou variáveis de ambiente necessárias.

## Segurança
Arquivos `.env`, tokens, service-role keys, chaves privadas e dumps com dados sensíveis são proibidos no Git.

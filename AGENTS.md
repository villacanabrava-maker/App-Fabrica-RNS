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

## Fábrica Apps RNS — o que este repositório constrói

Este repositório é o `rns-factory`: o código e a documentação da Fábrica Apps RNS, um control plane de engenharia de software multiagente. A partir da fusão de 21/09/2026, `docs/` é a fonte única de verdade do produto e `factory-intelligence/`, `supabase/`, `packages/contracts/`, `design-system/` e `.github/workflows/` são o código inicial já aplicado.

- Leitura obrigatória antes de qualquer tarefa de produto (além deste arquivo): `docs/00-COMECE-AQUI/00-LEIA-PRIMEIRO.md`, depois `factory-intelligence/constitution/CONSTITUTION.md`.
- `docs/01-PRODUTO/04-DECISOES-CONGELADAS.md` lista decisões que **nenhum agente pode reabrir** sem tarefa humana explícita — isso é mais restritivo que a regra geral 5 deste arquivo e prevalece dentro do escopo do produto.
- `factory-intelligence/`, `.github/workflows/` e `supabase/migrations/` são caminhos protegidos por CODEOWNERS (ver `.github/CODEOWNERS`); mudanças nesses caminhos exigem revisão humana, nunca auto-merge.
- Modelos de IA (nomes, versões, fornecedores) nunca são hardcoded em código — vivem em `factory-intelligence/registry/models.yaml`.
- Convenção de decisão pendente: `UNSPECIFIED`/`PENDENTE` no texto significa que a decisão não foi tomada — não presuma um valor, siga o critério descrito no próprio documento.

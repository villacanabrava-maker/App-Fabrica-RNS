# CLAUDE.md

Instruções para Claude Code ao trabalhar neste repositório.

1. Leia `AGENTS.md` antes de iniciar qualquer tarefa.
2. Considere o GitHub como fonte de verdade e sincronize o estado da branch antes de editar.
3. Não faça alterações destrutivas ou amplas sem necessidade.
4. Não versione segredos. Use apenas nomes de variáveis e arquivos de exemplo, como `.env.example`.
5. Mantenha mudanças focadas e commits descritivos.
6. Para funcionalidades novas, inclua testes quando a stack escolhida permitir.
7. Atualize documentação quando mudar arquitetura, configuração, banco de dados, APIs ou fluxo de implantação.
8. Não presuma Supabase, Vercel ou qualquer framework até que a configuração correspondente exista no repositório.
9. Se outro agente tiver alterado o mesmo arquivo, preserve as mudanças existentes e resolva conflitos de forma explícita.
10. Antes de concluir uma tarefa, execute as verificações disponíveis no projeto (lint, testes, build e typecheck, quando existirem).

## Bootloader do produto Fábrica Apps RNS

As regras acima governam como você trabalha *neste repositório*. A partir da fusão de `docs/` (21/09/2026), este repositório também contém a especificação e o código inicial do próprio produto que está sendo construído — a Fábrica Apps RNS, um control plane multiagente. Ao tocar em qualquer caminho abaixo, as regras do produto têm precedência sobre convenções genéricas:

1. Antes de implementar algo em `factory-intelligence/`, `supabase/`, `packages/`, `design-system/` ou qualquer página descrita em `docs/03-PAGINAS/`, leia `factory-intelligence/constitution/CONSTITUTION.md` e `factory-intelligence/constitution/SECURITY.md`.
2. `factory-intelligence/**` é código privilegiado: mudanças aí exigem revisão humana explícita, nunca auto-merge (ver `.github/CODEOWNERS`).
3. Onde a documentação disser `UNSPECIFIED` ou `PENDENTE` (ver `docs/01-PRODUTO/04-DECISOES-CONGELADAS.md`), não invente o valor — use o critério de decisão descrito ou pergunte.
4. Nenhum nome de modelo de IA vai em código; modelos vivem em `factory-intelligence/registry/models.yaml`.
5. A ordem de construção é fixa: Fase 1 (app funcional com agentes mockados) → Fase 2 (agentes reais) → Fase 3 (refinamento visual). Não adiante Fase 3 antes de Fase 1 estar com Definition of Done cumprido (`docs/08-PLANO-DE-IMPLEMENTACAO/05-DEFINITION-OF-DONE.md`).
6. Ponto de entrada completo: `docs/00-COMECE-AQUI/00-LEIA-PRIMEIRO.md`.


## Comunicação com o agente fiscalizador

Quando precisar de revisão técnica, validação de aderência ao plano ou uma ação do fiscal:

1. Use a issue ou pull request relacionada à tarefa.
2. Publique um comentário começando por `/fiscal ` seguido do pedido.
3. Aguarde a resposta automática no mesmo thread.
4. Nunca solicite, leia, copie ou armazene `OPENAI_API_KEY`, `SUPABASE_SECRET_KEY`, `VERCEL_TOKEN`, `FISCAL_BRIDGE_SECRET` ou qualquer outro segredo.
5. O fiscal pode revisar, comentar e orientar/operar infraestrutura autorizada, mas nunca aprova nem faz merge de PRs.
6. Se o bridge estiver indisponível, registre o bloqueio no thread e não invente credenciais nem contorne o mecanismo.

Documentação operacional: `docs/09-OPERACOES/AGENT-BRIDGE.md`.

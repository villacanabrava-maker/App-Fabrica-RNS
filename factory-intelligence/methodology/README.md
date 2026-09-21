# Metodologia — UNSPECIFIED

Nenhum dos dois pacotes de origem (Pasta Mãe Mestre v1.0 e Documentação Mestre) entregou conteúdo para `factory-intelligence/methodology/`, embora ambos já apontem para ele:

- `factory-intelligence/constitution/CLAUDE.md`/`AGENTS.md` carregam `factory-intelligence/methodology/` conforme necessário à tarefa;
- `.github/CODEOWNERS` protege `/factory-intelligence/methodology/RELEASE.md` especificamente;
- `docs/06-INTELIGENCIA-DOS-AGENTES/01-CONSTITUICAO.md` cita "metodologias de engenharia" no nível 5 da hierarquia de precedência.

Seguindo a convenção do próprio pacote (`UNSPECIFIED` = decisão pendente, proibido inventar valor), este diretório fica deliberadamente vazio até que uma tarefa humana explícita produza, no mínimo:

- `RELEASE.md` — processo de release (merge ≠ release, Release Service, rollback);
- metodologia de revisão dupla operacionalizada a partir de `docs/06-INTELIGENCIA-DOS-AGENTES/04-PROTOCOLO-REVISAO-DUPLA.md`;
- metodologia de migrations a partir de `docs/05-SEGURANCA/03-RLS-E-DADOS.md` e `docs/07-QUALIDADE/02-CI-CD.md`.

Até lá, agentes construtores devem tratar esta pasta como fonte ausente e resolver o rito de release pela leitura direta de `docs/08-PLANO-DE-IMPLEMENTACAO/` e `docs/07-QUALIDADE/02-CI-CD.md`.

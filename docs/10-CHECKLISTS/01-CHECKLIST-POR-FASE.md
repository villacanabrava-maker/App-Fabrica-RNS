# Checklist por Fase

Imprima, marque e só avance quando tudo estiver marcado. Os itens com ★ são **portões**: se um deles falhar, a fase não terminou.

---

## FASE 0 — Fundação da Inteligência

### Repositório
```
□ Organização GitHub RNS criada
□ Repositório rns-factory criado
□ Estrutura de pastas conforme 02-ARQUITETURA/01
□ Este pacote copiado para docs/
```

### Inteligência
```
□ factory-intelligence/constitution/CONSTITUTION.md
□ factory-intelligence/registry/agents.yaml (9 papéis)
□ factory-intelligence/registry/permissions.yaml
□ factory-intelligence/registry/runtimes.yaml
□ factory-intelligence/registry/models.yaml (valores UNSPECIFIED)
□ Os 6 JSON Schemas em factory-intelligence/schemas/
□ Skills iniciais em factory-intelligence/skills/
□ AGENTS.md na raiz (bootloader curto)
□ CLAUDE.md na raiz (bootloader curto)
```

### Scripts
```
□ scripts/intelligence/validate-schemas.ts
□ scripts/intelligence/validate-registry.ts
□ scripts/intelligence/build-projections.ts
□ scripts/intelligence/check-drift.ts
□ scripts/check-public-env.ts
```

### Governança
```
□ .github/CODEOWNERS
□ Ruleset de main com "Require review from Code Owners"
□ Ruleset com block force push e restrict deletions
□ .github/workflows/intelligence-ci.yml
```

### ★ Portão da Fase 0
```
★ □ Todos os JSON Schemas validam
★ □ Todos os registries validam
★ □ Rodar build-projections duas vezes gera o mesmo hash
★ □ Editar .claude/skills à mão faz o CI falhar
★ □ PR em factory-intelligence exige aprovação de code owner
★ □ Force push em main é rejeitado
```

---

## FASE 1 — Aplicativo Funcional

### Banco
```
□ Projeto Factory Supabase criado
□ Migrations 0001 a 0010 aplicadas
□ supabase test db verde
□ Chaves publishable/secret geradas; legadas desativadas
□ sb_secret_ apenas em variável de servidor
□ Filas pgmq criadas
```

### Núcleo
```
□ packages/contracts com tipos derivados dos schemas
□ packages/state-machines com testes de propriedade
□ packages/policy-engine com padrão fechado
□ packages/review-engine com SEQUENCE fixa
□ packages/agent-adapters com interface e MockAdapter
□ Contract tests do MockAdapter verdes
□ Orchestrator worker consumindo filas
□ Lease manager funcionando
□ Event processor com os 11 passos
```

### As 9 páginas + transversais
```
□ Autenticação e shell
□ Configurações (Geral, Equipe, Segurança, Notificações, Aparência, Avançado)
□ Projetos (lista, wizard, detalhe, Kanban, Esteira)
□ Agentes de IA (catálogo, detalhe)
□ Câmara de Revisão
□ Fila de Aprovações
□ Início (Dashboard)
□ Monitoramento (7 abas + Gargalos)
□ Base de Conhecimento
□ Templates
□ Integrações (GitHub, Supabase, Vercel)
□ Orquestração (canvas + modo lista)
```

### GitHub
```
□ 3 GitHub Apps criadas com permissões mínimas
□ Webhook com verificação de assinatura
□ Deduplicação por X-GitHub-Delivery
□ Worker abre PR real
□ Rodapé de commit RNS-* aplicado
```

### Qualidade
```
□ Os 6 workflows de CI rodando
□ axe sem violações em todas as páginas
□ Checklist manual de teclado por página executado
□ Baseline de performance medido
```

### ★ Portão da Fase 1
```
★ □ Teste de aceitação ponta a ponta passa AUTOMATIZADO
★ □ Reenviar o mesmo webhook 5× → nenhum efeito duplicado
★ □ Matar o worker no meio → lease expira → outro retoma → sem duplicação
★ □ Approval com actor_type='agent' → rejeitada PELO BANCO
★ □ preview_pair_ready só com AMBOS os eventos
★ □ Round 5 do ciclo → DENIED
★ □ Transição inválida → rejeitada e auditada
★ □ Usuário da org A vê ZERO linhas da org B
★ □ Diff tocando forbidden_path → artefato rejeitado
★ □ Nenhum número fictício em nenhuma tela
★ □ Nenhum segredo no bundle do navegador
```

---

## FASE 2 — Agentes Reais

```
□ WIF/OIDC configurado para OpenAI
□ WIF/OIDC configurado para Anthropic
□ models.yaml preenchido com modelos verificados na fonte oficial
□ OpenAIAdapter implementado
□ ClaudeAdapter implementado
□ Ambos passando nos MESMOS contract tests
□ Intelligence Resolver lendo registry no base_sha
□ Agent Router com alternância de runtime
□ Golden template criado
□ Provisionamento: GitHub + Supabase + Vercel idempotente
□ Preview pair com barreira de prontidão
□ preview-e2e disparado por repository_dispatch
□ Deployment Checks configurados no Vercel
□ Release gate humano separado do merge
□ Rolling release e rollback testados
□ Budget Service interrompendo durante a execução
□ RNS Local Bridge (outbound only)
□ Handoff Bundle em JSON e markdown
□ Fallback web do human gate
```

### ★ Portão da Fase 2
```
★ □ Nenhum loop acima de 4 hops
★ □ Toda saída de agente valida contra schema
★ □ Mudança de SHA invalida o ciclo
★ □ Workspace isolado por execução de escrita
★ □ E2E só inicia com preview pair pronto
★ □ Budget interrompe run que estoura
★ □ Nenhum agente teve credencial de produção
★ □ UM APLICATIVO REAL foi da ideia à produção com aprovações registradas
```

---

## FASE 3 — Refinamento (pela própria fábrica)

```
□ M3.1 Design system maduro
□ M3.2 Shell e navegação
□ M3.3 As 9 páginas refinadas
□ M3.4 Acessibilidade AA completa
□ M3.5 Performance dentro dos budgets
□ M3.6 Micro-interações
□ M3.7 Tema escuro
□ M3.8 Responsividade
```

### ★ Portão da Fase 3
```
★ □ Checklist manual de a11y passa nas 9 páginas
★ □ LCP ≤ 2,5s e CLS ≤ 0,1 em campo
★ □ Storybook com todos os componentes e estados
★ □ CADA missão da Fase 3 passou pelo ciclo completo da fábrica
★ □ Nenhuma regressão funcional
```

---

## FASE 4 — Evidência e Qualidade

```
□ Suite de evals completa
□ Eval prompt-injection-in-readme
□ Eval clean-change
□ Baseline por runtime
□ Precision e recall com truth set curado
□ Telemetria de custo por token e hora de sessão
□ Fila de adjudicação humana
□ Aba Avaliações no detalhe do agente
□ PR de skill que reduz recall é bloqueado
□ Thresholds definidos com base em dados reais
```

---

## FASE 5 — Escala

```
□ Provisionamento paralelo de múltiplos apps
□ Mais de uma organização operando
□ Isolamento entre organizações validado em produção
□ Quotas e budgets por organização
□ Agent Router informado por dados
□ Teste de restauração de backup executado  ★
□ SLOs definidos com dados reais
```

# Definition of Done

Critérios objetivos. Nada aqui admite "quase pronto".

---

## 1. DoD de uma TAREFA

```
□ Código implementado conforme os critérios de aceitação do Task Packet
□ Nenhum forbidden_path foi tocado
□ Testes unitários dos casos de sucesso E de falha
□ Testes de integração quando a tarefa cruza camadas
□ Typecheck limpo
□ Lint limpo
□ Artefato válido contra o schema esperado
□ Evidência anexada com integridade declarada
□ Revisão independente concluída (runtime diferente do autor)
□ Findings bloqueantes resolvidos
□ CI verde
□ Commit com rodapé RNS-Run, RNS-Task, RNS-Role, RNS-Base-SHA
```

---

## 2. DoD de um COMPONENTE de UI

```
□ Implementado com tokens, sem cor ou espaçamento literal
□ Todas as variantes especificadas
□ Os SETE estados: loading, empty, error, partial, success, stale, forbidden
□ Story no Storybook por variante e por estado
□ Story em tema claro e escuro
□ axe sem violações
□ Operável por teclado
□ Nome acessível em todo controle
□ Nenhum significado transmitido só por cor
□ Snapshot visual registrado
□ Textos vindo de arquivo de mensagens, não hardcoded
```

---

## 3. DoD de uma PÁGINA

```
□ Todos os blocos do documento da página existem
□ Inventário de ícones implementado por completo
□ Cada número exibido tem origem declarada e verificada
□ Nenhum valor fictício na tela  ★
□ Os sete estados de UI por bloco
□ Rotas e navegação conforme o documento
□ Endpoints implementados
□ Realtime atualizando bloco isolado, sem refazer a página
□ Permissões aplicadas; ações fora do papel desabilitadas com explicação
□ axe sem violações em tema claro e escuro
□ Checklist manual de teclado executado
□ Teste Playwright do fluxo principal
□ Performance dentro do budget da rota
□ DoD específico do documento da página cumprido
```

---

## 4. DoD de uma ETAPA (stage)

```
□ Todas as tarefas da etapa em COMPLETED
□ Ciclo de revisão de 4 passagens concluído
□ Findings bloqueantes resolvidos
□ Divergências resolvidas ou explicitamente adiadas com dono
□ CI completo verde
□ Preview pair verificado
□ R8 executou verificação de navegador com evidência
□ R9 consolidou as evidências
□ Aprovação humana registrada com subject_sha
□ Merge realizado
□ Auditoria completa e correlacionável
```

---

## 5. DoD de uma MISSÃO

```
□ Todas as etapas em COMPLETED
□ Especificação atendida integralmente
□ Nenhum finding crítico aberto
□ Dívida conhecida registrada em continuity/known-risks/
□ Documentação atualizada
□ ADR escrito se houve decisão arquitetural
□ Custo total registrado
□ Retrospectiva: o que a fábrica aprendeu
```

---

## 6. DoD de um RELEASE

```
□ Merge gate cumprido
□ Production build criado
□ Deployment checks verdes
□ Smoke tests de produção verdes
□ E2E do caminho crítico verde
□ Verificação final de segurança verde
□ Migration de produção verificada
□ LCP e CLS dentro do budget
□ Aprovação de release humana registrada  ★
□ Rolling release configurado
□ Plano de rollback verificado
□ Notas de release geradas
```

---

## 7. DoD de uma FASE

### Fase 0
```
□ Schemas validam
□ Registries validam
□ Projeções reproduzíveis
□ CI detecta drift
□ Paths críticos protegidos por CODEOWNERS
□ Nenhuma alteração privilegiada chega a main sem gate
```

### Fase 1 ★
```
□ Teste de aceitação passa automatizado, de ponta a ponta
□ Replay de webhook não duplica
□ Worker morto é recuperado sem duplicação
□ Approval com actor agente é rejeitada pelo banco
□ preview_pair_ready exige ambos os eventos
□ round 5 é negado
□ Transição inválida é rejeitada e auditada
□ Isolamento multi-tenant provado com caso de negação
□ Diff em forbidden_path é rejeitado
```

### Fase 2 ★
```
□ Contract tests verdes para os dois adapters
□ Nenhum loop acima de 4 hops
□ Mudança de SHA invalida o ciclo
□ Workspace isolado por execução de escrita
□ E2E só inicia com preview pair pronto
□ Budget interrompe run que estoura
□ Nenhum agente teve credencial de produção
□ Um aplicativo real foi da ideia à produção com aprovações registradas
```

### Fase 3
```
□ Checklist manual de a11y passa nas 9 páginas
□ LCP e CLS dentro do budget em campo
□ Storybook completo
□ Cada missão passou pelo ciclo completo da fábrica
□ Nenhuma regressão funcional
```

### Fase 4
```
□ Suite de evals completa e executando
□ Baselines por runtime estabelecidas
□ Precision e recall medidos com truth set curado
□ Telemetria de custo real por token e hora de sessão
□ Thresholds definidos com base em dados, não arbitrariamente
□ Casos críticos de segurança bloqueando corretamente
```

### Fase 5
```
□ Criação de app ponta a ponta auditável
□ Isolamento entre organizações validado
□ Budgets aplicados por organização
□ Agent Router usando dados reais
□ Recuperação testada (incluindo restauração de backup)
□ SLOs definidos com dados reais
```

---

## 8. O que NUNCA conta como "done"

```
✗ "Funciona na minha máquina"
✗ "Os testes estão quebrados, mas é flakiness"
✗ "Falta só a acessibilidade"
✗ "Depois eu coloco o estado de erro"
✗ "O número está chumbado por enquanto"
✗ "A RLS eu habilito depois"
✗ "Deixei o segredo no .env só para testar"
✗ "O agente aprovou"
✗ "O modelo disse que está certo"
✗ "Está 95% pronto"
```

Cada uma dessas frases já custou caro em algum projeto. Neste, elas bloqueiam o merge.

# Estratégia de Testes

---

## 1. As três camadas de confiança

Elas são **diferentes** e nenhuma substitui a outra.

```
CAMADA 1 — VERIFICAÇÃO DETERMINÍSTICA
  lint · typecheck · unit · integration · database · RLS
  component · a11y automatizada · visual · E2E · security · build
  ↓ prova que o código FUNCIONA

CAMADA 2 — REVISÃO POR IA (cross-model)
  arquitetura · correção · segurança · testes · UX
  ↓ prova que o código está CERTO em sentido mais amplo

CAMADA 3 — GATE HUMANO
  ↓ prova que o código é o que PRECISÁVAMOS
```

```
Não usamos IA para substituir CI.
Não usamos CI para substituir revisão arquitetural.
Não usamos nenhuma das duas para substituir o humano.
```

---

## 2. Pirâmide de testes do Control Plane

```
          ╱╲
         ╱E2E╲            Playwright · poucos, críticos
        ╱──────╲
       ╱ compon.╲         Storybook + Vitest
      ╱──────────╲
     ╱ integração ╲       rotas + banco real de teste
    ╱──────────────╲
   ╱     unidade    ╲     domínio puro, state machines, policy
  ╱──────────────────╲
 ╱  tipos (TypeScript)╲
╱──────────────────────╲
```

| Camada | Ferramenta | Cobertura alvo |
|---|---|---|
| Tipos | TypeScript estrito | 100% do código |
| Unidade | Vitest | domínio, state machines, policy engine, review engine: **alta** |
| Integração | Vitest + banco de teste | rotas de comando, idempotência, transações |
| Componente | Storybook + Vitest | todo componente do design system |
| Banco | `supabase test db` | toda policy de RLS, com caso de negação |
| E2E | Playwright | fluxos críticos apenas |
| A11y | axe no Storybook e no Playwright | todas as telas |
| Visual | snapshots do Storybook | componentes do design system |

Meta de cobertura numérica: **`UNSPECIFIED`**. Cobertura alta em código trivial é vaidade; o que importa é cobrir as invariantes listadas abaixo.

---

## 3. Testes que a fábrica NÃO pode não ter

Estes não são negociáveis. São o que distingue o sistema de um protótipo.

### Back-end

| Teste | O que prova |
|---|---|
| **Transição inválida é rejeitada** | A máquina de estados é real, não decorativa |
| **Replay de webhook 10× não duplica efeito** | Idempotência funciona ★ |
| **Worker morto → lease expira → outro retoma sem duplicar** | Recuperação funciona ★ |
| **Retry transitório não consome rodada cognitiva** | O protocolo não é corroído por erro de rede |
| **Falha terminal vai para dead letter investigável** | Nada some silenciosamente |
| **Todos os adapters passam nos mesmos contract tests** | Trocar fornecedor não quebra a fábrica |
| **`round > 4` é negado** | O ciclo tem limite real |
| **Mudança de SHA invalida o ciclo** | Revisão fixada no artefato correto |
| **Budget estourado interrompe o run** | Custo é controlado |
| **Agente não amplia o próprio budget** | Política é aplicada |

### Segurança e dados

| Teste | O que prova |
|---|---|
| **Usuário da org A vê zero linhas da org B** | Isolamento multi-tenant ★ |
| **Update não consegue mover linha entre organizações** | `with check` presente |
| **`viewer` não escreve** | RBAC funciona |
| **Aprovação com `actor_type='agent'` é rejeitada pelo BANCO** | A garantia central é estrutural ★ |
| **`organization_id` do corpo da requisição é ignorado** | RLS não é decoração ★ |
| **Diff que toca `forbidden_path` é rejeitado** | Sandbox é fronteira real ★ |
| **Ação desconhecida é negada por padrão** | Padrão fechado |
| **Assinatura de webhook inválida retorna 401** | Entrada verificada |
| **Migration aplica e reverte no preview** | Reversibilidade provada |
| **Nenhum segredo em variável pública** | Bundle limpo |

### Front-end

| Teste | O que prova |
|---|---|
| **Todo componente tem estado de loading, empty e error** | Não existe só happy path |
| **Kanban é operável 100% por teclado** | Acessibilidade real ★ |
| **Canvas tem modo lista alternativo funcional** | Rota acessível completa ★ |
| **Movimento rejeitado devolve o cartão com explicação** | UI pede comando, não escreve estado |
| **Aprovação bloqueada com finding crítico** | Gate visível |
| **axe sem violações em tema claro e escuro** | A11y nos dois temas |
| **Número exibido tem origem declarada** | Sem dado fictício ★ |

---

## 4. Contract tests dos adapters

Todos os adapters — `MockAdapter`, `OpenAIAdapter`, `ClaudeAdapter` — passam na **mesma** suíte.

```typescript
describe.each(ADAPTERS)('AgentAdapter contract: %s', (adapter) => {
  it('start devolve RunHandle com runId estável', ...);
  it('getStatus reflete o estado real da execução', ...);
  it('getEvents emite eventos normalizados, nunca stdout bruto', ...);
  it('getArtifacts devolve sha256 de cada artefato', ...);
  it('getUsage devolve tokens e, quando aplicável, session_hours', ...);
  it('cancel interrompe e o estado final é cancelled', ...);
  it('resume retoma após human gate sem reexecutar o já feito', ...);
  it('saída inválida contra schema é sinalizada, não consumida', ...);
  it('mesmo idempotency_key não executa duas vezes', ...);
  it('respeita allowed_paths e forbidden_paths', ...);
});
```

Se o `OpenAIAdapter` passa e o `ClaudeAdapter` não, o problema é do adapter — não do domínio.

---

## 5. Teste de aceitação da Fase 1

Este é o teste que declara a Fase 1 concluída. Automatizado, ponta a ponta.

```
□ criar organização e usuário
□ criar projeto pela API
□ gerar plano (heurística determinística)
□ abrir ciclo de revisão com MockAdapter
□ as 4 passagens executam na ordem correta
□ tentar uma 5ª passagem → DENIED
□ ciclo conclui com READY_FOR_HUMAN_APPROVAL
□ tentar aprovar com actor_type='agent' → rejeitado pelo banco
□ aprovar com actor_type='human' → aceito, com subject_sha
□ criar tarefa e despachar
□ MockAdapter produz artefato válido contra schema
□ GitHub App abre PR real
□ Supabase cria preview branch
□ Vercel cria preview deployment
□ preview_pair_ready só dispara com AMBOS os eventos
□ CI roda e reporta os checks
□ reenviar o MESMO webhook 5× → nenhum efeito duplicado
□ matar o worker no meio → lease expira → outro retoma → sem duplicação
□ merge bloqueado com check vermelho
□ merge liberado com tudo verde
□ audit_events contém a trilha completa e correlacionável por correlation_id
```

---

## 6. Dados de teste

| Regra | Detalhe |
|---|---|
| Seeds **sintéticos e determinísticos** | Mesma seed, mesmos dados. Testes reproduzíveis |
| **Zero dados reais** em qualquer ambiente de teste ou preview | |
| Fixtures de eval versionadas | Mudar fixture é mudar o experimento |
| Banco de teste isolado por execução de CI | Sem interferência entre jobs |
| Contas de teste com credenciais de teste | Nunca contas reais |

---

## 7. Testes de acessibilidade

Automação detecta apenas **parte** das falhas. A estratégia é dupla:

```
AUTOMATIZADO (bloqueia merge)
  axe no Storybook, por componente
  axe no Playwright, por tela
  verificação de contraste nos tokens

MANUAL (checklist por página, bloqueia release)
  navegação completa por teclado
  ordem de foco lógica
  foco sempre visível
  leitor de tela nos fluxos críticos
  zoom 200% sem perda de função
  prefers-reduced-motion respeitado
```

O checklist manual está em `10-CHECKLISTS/02-CHECKLIST-POR-PAGINA.md`.

---

## 8. Testes de performance

| Métrica | Onde medir | Gate |
|---|---|---|
| LCP p75 ≤ 2,5s | campo e laboratório | bloqueia release |
| CLS p75 ≤ 0,1 | campo e laboratório | bloqueia release |
| INP | campo | alerta |
| Tamanho do JS por rota | build | alerta acima do budget |
| Tempo de resposta das rotas de comando | integração | alerta |
| Tempo de agregação do Monitoramento | integração | alerta |

Budgets numéricos de JS: `UNSPECIFIED` até o baseline da Fase 1.

---

## 9. O que NÃO testar

| Não testar | Por quê |
|---|---|
| Implementação interna de biblioteca de terceiros | Não é nosso código |
| Getters e setters triviais | Ruído |
| Que o React renderiza | Não é nosso escopo |
| Snapshot de árvore inteira de componente | Quebra a cada mudança de classe, não pega bug real |
| Cobertura por cobertura | Vaidade; cubra invariantes |

---

## 10. Checklist

```
□ Vitest configurado com banco de teste isolado
□ Playwright configurado com axe-core
□ Storybook com testes de componente, a11y e visual
□ supabase test db rodando em CI
□ Contract tests dos adapters escritos
□ MockAdapter passando nos contract tests
□ Todos os testes da §3 implementados  ★
□ Teste de aceitação da Fase 1 automatizado  ★
□ Seeds sintéticos determinísticos
□ Checklist manual de a11y por página
□ Budgets de performance definidos após baseline
□ CI bloqueia merge em qualquer teste vermelho
```

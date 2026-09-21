# Permissões e Políticas

---

## 1. As três classes de decisão

Toda ação no sistema cai em uma destas três:

| Classe | Significado | Exemplos |
|---|---|---|
| **ALLOW** | Permitido sem perguntar | ler repositório, rodar testes, ler preview, consultar schema |
| **ASK / HUMAN GATE** | Exige decisão humana | migration de produção, merge crítico, promoção de release, acesso a secret |
| **DENY** | Proibido sempre | desativar RLS, force push em `main`, expor secret, apagar produção |

`DENY` não é configurável pela interface. É constitucional.

---

## 2. Permissões por papel de agente

| Papel | GitHub | Filesystem | Supabase | Vercel | Rede | Produção |
|---|---|---|---|---|---|---|
| **R1** Orchestration | leitura | leitura | metadata read | nenhum | restrita | DENY |
| **R2** Architecture | leitura | leitura | schema read | nenhum | restrita | DENY |
| **R3** Research | leitura | leitura | nenhum | nenhum | **ampla** ★ | DENY |
| **R4** Builder | branch write | workspace write | preview only | leitura preview | pacotes | DENY |
| **R5** Reviewer | leitura + PR review | leitura | preview read | leitura preview | restrita | DENY |
| **R6** QA & Testing | leitura | test workspace | preview read/write | leitura preview | restrita | DENY |
| **R7** Security & Data | leitura | leitura | schema read + preview | logs read | restrita | DENY |
| **R8** UX & Browser | leitura | leitura | preview read | preview | preview apenas | DENY |
| **R9** Release & Evidence | leitura | leitura | leitura | leitura | restrita | DENY |
| **Release Service** | merge/deploy | limitado | migrations prod | promoção | restrita | **permitido por política** |

★ R3 é o único com rede ampla, porque pesquisa documentação oficial. Em compensação, é `read_only` em tudo o mais e não pode escrever no repositório.

**Nenhum coding agent precisa de chave mestra de produção. Nenhum a recebe.**

---

## 3. `permissions.yaml` — o arquivo canônico

```yaml
version: 1
registry: rns-permissions

profiles:
  read_only:
    filesystem: read_only
    github: read
    supabase: metadata_read
    vercel: none
    network: restricted
    production: deny
    shell:
      allow: [ls, cat, grep, find, git status, git log, git diff]
      deny:  [rm, mv, curl, wget, npm install, pip install]

  research:
    extends: read_only
    network: broad
    shell:
      allow: [ls, cat, grep, find, git log]

  workspace_write:
    filesystem: workspace_write
    github: branch_write
    supabase: preview_only
    vercel: preview_read
    network: package_registries
    production: deny
    shell:
      # node/npm/pnpm ficam liberados como ferramenta, mas seus executores
      # embutidos de código/pacote arbitrário (node -e/--eval, npm exec/x,
      # pnpm exec/dlx) vão para deny — sem isso, liberar a ferramenta por
      # inteiro também libera execução arbitrária sem metacaracteres de
      # shell. npx nunca é liberado.
      allow: [git, npm, pnpm, node, tsc, vitest, playwright]
      deny:  [sudo, chmod 777, "curl * | sh", ssh, "node -e**", "node --eval**", "npm exec**", "npm x**", "npx**", "pnpm exec**", "pnpm dlx**"]

  test_workspace:
    extends: workspace_write
    github: read
    supabase: preview_read_write

  preview_only:
    filesystem: read_only
    github: read
    supabase: preview_read
    vercel: preview
    network: preview_only
    production: deny

  governance_only:
    filesystem: read_only
    github: read
    supabase: read
    vercel: read
    network: restricted
    production: deny
    can_merge: false
    can_deploy_production: false

roles:
  R1: { profile: read_only }
  R2: { profile: read_only }
  R3: { profile: research }
  R4: { profile: workspace_write }
  R5: { profile: read_only }
  R6: { profile: test_workspace }
  R7: { profile: read_only, exceptions: [supabase_preview_write] }
  R8: { profile: preview_only }
  R9: { profile: governance_only }

forbidden_paths_always:
  - "factory-intelligence/**"
  - ".github/workflows/**"
  - ".agents/**"
  - ".claude/**"
  - ".codex/**"
  - "AGENTS.md"
  - "CLAUDE.md"
  - "**/.env*"
  - "**/*secret*"
  - "**/*credential*"

denied_tools_always:
  - github.merge
  - github.force_push
  - supabase.production.migrate
  - supabase.disable_rls
  - vercel.production.promote
  - secret.read
  - project.delete
  - organization.delete
```

★ `forbidden_paths_always` e `denied_tools_always` entram em **todo** Task Packet, somados aos específicos da tarefa. Um Task Packet que não os contenha é inválido.

---

## 4. Permissões humanas (RBAC)

| Ação | owner | admin | engineer | viewer |
|---|:---:|:---:|:---:|:---:|
| Ver projetos, agentes, execuções | ✓ | ✓ | ✓ | ✓ |
| Ver logs | ✓ | ✓ | ✓ | — |
| Criar projeto | ✓ | ✓ | ✓ | — |
| Criar e mover tarefa | ✓ | ✓ | ✓ | — |
| Executar agente | ✓ | ✓ | ✓ | — |
| Testar agente | ✓ | ✓ | ✓ | — |
| Aprovar etapa | ✓ | ✓ | ✓* | — |
| Aprovar release | ✓ | ✓ | —* | — |
| Resolver divergência | ✓ | ✓ | ✓ | — |
| Criar e publicar fluxo | ✓ | ✓ | ✓ | — |
| Criar conteúdo na base | ✓ | ✓ | ✓ | — |
| Criar template | ✓ | ✓ | ✓ | — |
| Editar configurações do projeto | ✓ | ✓ | — | — |
| Conectar/desconectar integração | ✓ | ✓ | — | — |
| Gerenciar equipe | ✓ | ✓ | — | — |
| Configurar políticas de segurança | ✓ | ✓ | — | — |
| Gerar/revogar chave de API | ✓ | — | — | — |
| Transferir posse | ✓ | — | — | — |
| Excluir organização | ✓ | — | — | — |
| Alterar `factory-intelligence` | **ninguém pela UI — só por PR** ★ | | | |

\* Configurável por organização em Configurações → Segurança → Políticas de aprovação. O padrão é: `engineer` aprova etapa, `admin` aprova release.

---

## 5. Policy Engine

Toda ação de agente passa por aqui antes de executar.

```typescript
type PolicyRequest = {
  actorType: 'agent' | 'human' | 'system';
  actorId: string;
  roleId?: string;              // R1..R9
  action: string;               // 'github.create_pr', 'shell.exec', ...
  resource: string;
  context: {
    taskPacketId: string;
    allowedPaths: string[];
    forbiddenPaths: string[];
    profile: string;
    targetPath?: string;
    command?: string;
  };
};

type PolicyResult =
  | { decision: 'allow' }
  | { decision: 'ask'; gateReason: string }
  | { decision: 'deny'; reason: string; policyRef: string };
```

Ordem de avaliação — **a primeira regra que casa vence**:

```
1. denied_tools_always            → DENY
2. forbidden_paths_always         → DENY
3. forbidden_paths do Task Packet → DENY
4. production === deny && ação toca produção → DENY
5. ação exige ASK conforme a classe → ASK
6. permitido pelo profile do papel → ALLOW
7. caso contrário                 → DENY (padrão fechado) ★
```

★ **Padrão fechado.** Ação desconhecida é negada, não permitida. Um vocabulário incompleto nunca deve virar brecha.

Toda decisão é persistida em `governance.policy_decisions`, incluindo os ALLOW. Sem isso não há como auditar o que um agente fez.

---

## 6. Escalada e human gate

```
Policy retorna ASK
        ↓
cria human_gate com motivo e contexto
        ↓
run fica pausado (não é falha)
        ↓
notificação para os aprovadores elegíveis
        ↓
humano decide
        ├── aprova  → adapter.resume(runId, decision)
        └── rejeita → task vira REJECTED
```

Regras:
1. Um `ASK` nunca é resolvido por outro agente.
2. O gate tem prazo. Expirado, vira `BLOCKED` e alerta, nunca aprovação automática. ★
3. A decisão registra quem, quando e sobre qual SHA.

---

## 7. Budgets como política

```
budget = { max_cost_usd, max_wall_seconds, max_review_hops }
```

| Regra | Detalhe |
|---|---|
| Verificado **durante** a execução | Não apenas no fim |
| Estouro interrompe o run | Estado `BLOCKED_BUDGET` |
| **O agente nunca amplia o próprio orçamento** ★ | Ampliação é ação humana registrada |
| Três níveis | Por run, por missão, por organização/mês |
| Alertas | 50%, 80%, 100% |

---

## 8. Egress de rede por papel

| Perfil | Permitido |
|---|---|
| `restricted` | Apenas os endpoints da RNS Tool API e do provedor do próprio runtime |
| `package_registries` | O acima + registries de pacotes (npm, PyPI) com lockfile obrigatório |
| `broad` (só R3) | O acima + domínios de documentação oficial em allowlist |
| `preview_only` | O acima restrito + a URL do preview Vercel da tarefa |

Nenhum perfil permite egress arbitrário para qualquer host.

---

## 9. Como validar que as permissões funcionam

Testes obrigatórios, todos automatizados:

```
□ Agente com profile read_only tenta escrever → DENY registrado
□ Agente tenta escrever em factory-intelligence/** → DENY + incidente
□ Agente tenta chamar github.merge → DENY
□ Agente tenta ler secret → DENY
□ Agente tenta resolver um ASK → DENY
□ Agente tenta gravar approval → rejeitado pelo BANCO  ★
□ Agente tenta ampliar o próprio budget → DENY
□ viewer tenta criar projeto via API → 403
□ engineer tenta excluir organização via API → 403
□ usuário da org A consulta recurso da org B → 404 (não 403) ★
□ organization_id enviado no corpo é IGNORADO, derivado da sessão ★
□ ação desconhecida → DENY por padrão fechado
□ human gate expirado → BLOCKED, nunca aprovado
□ diff que toca forbidden_path → artefato rejeitado
```

★ Retornar 404 em vez de 403 para recurso de outra organização evita confirmar a existência do recurso.

---

## 10. O que nenhuma configuração pode fazer

Esta lista é constitucional. Não existe toggle, flag ou plano que a altere:

```
✗ Permitir que um agente aprove sua própria mudança
✗ Permitir que um agente aprove qualquer coisa
✗ Dar credencial de produção a um coding agent
✗ Desativar RLS em tabela exposta
✗ Permitir uma quinta passagem no ciclo de revisão
✗ Permitir que um agente altere factory-intelligence sem PR humano
✗ Permitir merge sem os checks obrigatórios
✗ Permitir release sem gate humano
✗ Permitir que um agente amplie o próprio budget
✗ Permitir cross-provider direto entre agentes
✗ Silenciar completamente notificação de aprovação pendente
✗ Apagar registro de auditoria
```

Se alguém pedir uma dessas, a resposta correta é abrir um PR na Constituição e passar por revisão humana — não adicionar uma opção na tela de Configurações.

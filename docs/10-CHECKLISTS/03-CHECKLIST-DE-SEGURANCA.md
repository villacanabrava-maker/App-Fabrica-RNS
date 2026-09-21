# Checklist de Segurança

Executar antes de **cada release** e sempre que algo em `05-SEGURANCA/` mudar.

Itens com ★ são **bloqueantes**: um único item não cumprido impede o release.

---

## 1. Invariantes estruturais (banco)

```
★ □ Constraint approvals_must_be_human existe e está ativa
★ □ Teste automatizado: agente tenta aprovar → rejeitado pelo banco
★ □ Constraint cycle_round_limit (0..4) ativa
★ □ Constraint pair_ready_requires_both ativa
★ □ Unique em idempotency_key de jobs, webhook_events e domain_events
  □ Constraint no_self_dependency ativa
  □ Constraint rejection_requires_rationale ativa
  □ Constraint meta_review_required ativa
```

## 2. RLS e isolamento

```
★ □ RLS habilitada em TODA tabela exposta (script assert-rls-enabled verde)
★ □ Toda policy de UPDATE tem WITH CHECK
★ □ Nenhuma policy com USING (true) em tabela multi-tenant
★ □ Teste: org A vê ZERO linhas da org B
★ □ Teste: update não move linha entre organizações
★ □ organization_id NUNCA aceito do corpo da requisição
  □ Funções auxiliares são SECURITY INVOKER
  □ Recurso de outra organização retorna 404, não 403
```

## 3. Segredos

```
★ □ Nenhuma chave sb_secret_ no bundle do navegador
★ □ Nenhum segredo em variável com prefixo público (check-public-env verde)
★ □ integrations.config sem campo de segredo
★ □ secret_refs sem valores de segredo
  □ Chaves legadas anon/service_role desativadas
  □ api_keys guarda apenas prefixo e hash
  □ Secret scanning ativo em todos os repositórios
  □ Runbook de vazamento escrito e testado
```

## 4. Agentes

```
★ □ Nenhum agente tem credencial de produção
★ □ Nenhum agente tem sb_secret_ do Factory Supabase
★ □ factory-intelligence/** em forbidden_paths de todo Task Packet de implementação
★ □ Validação de diff contra allowed_paths antes de consumir artefato
★ □ Violação de forbidden_path gera incidente, não só erro
★ □ Agente não consegue ampliar o próprio budget
★ □ Cross-provider direto bloqueado
  □ Egress de rede restrito por papel
  □ Allowlist de comandos no sandbox
  □ Workspaces efêmeros, destruídos ao fim
  □ Policy engine com padrão FECHADO (ação desconhecida = DENY)
```

## 5. Inteligência

```
★ □ CODEOWNERS cobre factory-intelligence/, workflows, migrations, orchestrator
★ □ "Require review from Code Owners" ativo no ruleset
★ □ intelligence-ci detecta drift das projeções
★ □ Nenhuma alteração de skill gerada por modelo com auto-merge
  □ Evals de skill rodam em PR de skill
  □ Eval prompt-injection-in-readme passando
```

## 6. GitHub e CI

```
★ □ Nenhum workflow usa pull_request_target com secrets
★ □ permissions: mínimo declarado em todos os workflows
★ □ Nenhum PAT permanente em uso
★ □ Webhook com assinatura verificada
  □ GitHub Apps com permissões mínimas
  □ Identidades separadas (control, worker, release)
  □ WIF/OIDC para OpenAI e Anthropic
  □ Runners efêmeros para código não confiável
  □ Code scanning ativo
```

## 7. Entrega

```
★ □ Merge exige required checks e code owner review
★ □ Release exige aprovação humana separada do merge
★ □ Deployment Checks ativos no Vercel
★ □ Supabase preview check é required status check
  □ Preview do Control Plane protegido por autenticação
  □ Preview de apps sem dados de produção
  □ Nomes de check únicos
  □ Force Promote auditado como exceção
  □ Rollback de rolling release testado
```

## 8. Auditoria

```
★ □ audit_events sem UPDATE/DELETE concedidos
★ □ evidence_items sem UPDATE/DELETE concedidos
★ □ approvals sem UPDATE/DELETE concedidos
  □ Toda decisão crítica tem correlation_id
  □ Seguir um correlation_id da UI até o PR funciona
  □ Nenhum prompt, token ou segredo em log de observabilidade
```

## 9. Recuperação

```
  □ Backup automático ativo
  □ Point-in-time recovery ativo
★ □ Teste de restauração executado (obrigatório antes da Fase 5)
  □ Runbooks de incidente escritos
```

---

## Registro

```
Data: ____________   Versão/SHA: ____________________
Executado por: ____________________

Itens ★ não cumpridos: ______
  → Se > 0, O RELEASE ESTÁ BLOQUEADO.

Itens não bloqueantes pendentes:
  ______________________________________________
  ______________________________________________

Assinatura: ____________________
```

# Agent Bridge — Claude Code ↔ Fiscal OpenAI

## Objetivo

Permitir que Claude Code solicite revisão técnica ou suporte operacional ao agente fiscalizador sem receber nenhuma credencial.

## Uso pelo Claude Code

Em qualquer issue ou pull request relevante, publique:

```text
/fiscal <pedido>
```

Exemplos:

```text
/fiscal revise esta migration quanto a RLS e isolamento multi-tenant
/fiscal confira se esta PR cumpre o plano de implementação
/fiscal preciso de validação da configuração Supabase antes de prosseguir
```

A resposta é publicada automaticamente no mesmo thread.

## Arquitetura

1. GitHub recebe comentário iniciado por `/fiscal`.
2. `.github/workflows/fiscal-bridge.yml` é acionado.
3. O workflow chama o endpoint Vercel `/api/fiscal-handoff`.
4. O endpoint usa a OpenAI Responses API.
5. A resposta volta para o mesmo PR/issue.

## Segredos

Nenhum segredo deve existir no repositório.

### Vercel

- `OPENAI_API_KEY`
- `OPENAI_MODEL` (opcional; padrão: `gpt-5.6-sol`)
- `FISCAL_BRIDGE_SECRET`

### GitHub Actions Secrets

- `FISCAL_BRIDGE_URL`
- `FISCAL_BRIDGE_SECRET`

O valor de `FISCAL_BRIDGE_SECRET` deve ser idêntico no Vercel e no GitHub.

## Limites de autoridade

O fiscal pode revisar, comentar, identificar bloqueadores e orientar operações de infraestrutura. Ele não aprova nem faz merge de pull requests. Essa decisão permanece exclusivamente humana.

## Health check

```text
GET /api/health
```

Resposta esperada: HTTP 200 com `ok: true`.

## Teste ponta a ponta

Depois que os segredos estiverem configurados:

1. abra uma issue de teste;
2. publique `/fiscal teste de comunicação`;
3. aguarde o workflow `Fiscal Bridge`;
4. confirme que a resposta do fiscal apareceu no mesmo thread;
5. confirme que nenhum segredo aparece em logs ou comentários.

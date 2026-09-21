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


## Protocolo confiável de entrega

Cada pedido recebe um `request_id` determinístico e fica preso ao SHA atual da PR (`base_sha`).

Estados persistidos no ledger do Supabase:

`RECEIVED → PROCESSING → COMPLETED → PUBLISHED → ACKNOWLEDGED`

Estados excepcionais: `FAILED`, `STALE` e `DEAD_LETTER`.

Uma resposta só é considerada publicada quando o workflow:
1. cria o comentário no GitHub;
2. recebe o `comment_id`;
3. relê esse comentário pela API;
4. confirma o marcador `request_id + base_sha`;
5. somente então registra `PUBLISHED`.

Se o SHA mudar antes da publicação, a resposta vira `STALE` e não deve orientar implementação.

O Claude Code confirma leitura com:

```text
/fiscal ack <request_id>
```

Retries reutilizam o mesmo `request_id`, evitando múltiplas respostas da OpenAI para o mesmo evento. Depois de três falhas, o workflow publica uma falha explícita em vez de fingir sucesso.

### Regra de evidência

Nenhum agente pode afirmar que publicou, recebeu ou concluiu uma comunicação com base apenas na tentativa da operação. O estado live do sistema de destino deve ser confirmado.

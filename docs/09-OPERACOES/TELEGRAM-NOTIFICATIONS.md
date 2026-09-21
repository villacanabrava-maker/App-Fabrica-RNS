# Notification Bridge — Telegram

## Objetivo

Notificar o responsavel humano quando a Fabrica RNS precisar de decisao ou concluir trabalho relevante. Telegram e canal de alerta e relatorio; aprovacao e merge permanecem no GitHub.

## Eventos iniciais

- PR aberta, marcada ready-for-review ou com revisao solicitada.
- Conclusao dos workflows Application CI, Database CI, Security, Intelligence CI e Fiscal Bridge.
- Eventos de Supabase e Vercel devem ser integrados apenas quando forem operacionais e relevantes; nunca notificar cada operacao de dados.

## Seguranca

O endpoint `/api/notify-telegram` aceita somente POST autenticado por `FISCAL_BRIDGE_SECRET`, reaproveitando o mesmo boundary do Agent Bridge ja operacional.

As credenciais do bot nunca ficam no GitHub, no codigo ou em comentarios. Elas ficam somente nas Environment Variables do projeto Vercel `fabricarns`.

## Variaveis no Vercel `fabricarns`

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `FISCAL_BRIDGE_SECRET` (ja existente)

No GitHub Actions:

- `FISCAL_BRIDGE_URL` (ja existente)
- `FISCAL_BRIDGE_SECRET` (ja existente)

## Formato da mensagem

Cada alerta inclui:

1. titulo;
2. resumo operacional;
3. link para GitHub quando houver;
4. `event_key` para auditoria.

## Ativacao

1. Merge humano da PR.
2. Confirmar as variaveis `TELEGRAM_BOT_TOKEN` e `TELEGRAM_CHAT_ID` no Vercel.
3. Aguardar o deployment de producao do `fabricarns` ficar READY.
4. Executar teste E2E controlado via endpoint.
5. Confirmar recebimento no Telegram e ausencia de segredos nos logs.
6. So entao declarar o canal operacional.

## Limites atuais

- Ainda nao ha deduplicacao persistente em banco; o `event_key` identifica logicamente cada evento.
- A aprovacao de PR nunca acontece pelo Telegram nesta fase.
- Banco e Vercel ainda nao emitem eventos diretos para este canal; entram numa etapa posterior.

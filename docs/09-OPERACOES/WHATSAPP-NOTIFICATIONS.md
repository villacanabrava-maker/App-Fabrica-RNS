# Notification Bridge — WhatsApp

## Objetivo
Notificar o responsavel humano quando a Fabrica RNS precisar de decisao ou concluir trabalho relevante. WhatsApp e canal de alerta e relatorio; aprovacao e merge permanecem no GitHub.

## Eventos iniciais
- PR aberta, marcada ready-for-review ou com revisao solicitada.
- Conclusao dos workflows Application CI, Database CI, Security, Intelligence CI e Fiscal Bridge.
- Supabase e Vercel entram pelo mesmo endpoint apenas para eventos operacionais relevantes; nunca notificar cada operacao de dados.

## Seguranca
O endpoint `/api/notify-whatsapp` aceita somente POST autenticado por `NOTIFICATION_BRIDGE_SECRET`. Credenciais ficam somente no ambiente do projeto Vercel do bridge. O workflow nao faz checkout de codigo nao confiavel em `pull_request_target`.

O envio proativo usa template aprovado do WhatsApp, evitando depender de uma janela de conversa aberta.

## Variaveis no Vercel `fabricarns`
- `NOTIFICATION_BRIDGE_SECRET`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_TO`
- `WHATSAPP_GRAPH_VERSION`
- `WHATSAPP_TEMPLATE_NAME`
- `WHATSAPP_TEMPLATE_LANGUAGE` (opcional; padrao `pt_BR`)

No GitHub Actions:
- `FISCAL_BRIDGE_URL` (ja existente)
- `NOTIFICATION_BRIDGE_SECRET`

## Template
O template configurado deve possuir tres parametros de body, nesta ordem: titulo, resumo e link. Nome do template e versao da Graph API sao configuracao, nao ficam hardcoded.

## Ativacao
1. Revisao e merge humanos da PR.
2. Configurar as credenciais no Vercel e GitHub sem publica-las.
3. Criar/aprovar o template no WhatsApp Business.
4. Executar teste controlado.
5. Confirmar mensagem recebida e ausencia de credenciais nos logs.
6. So entao declarar o canal operacional.

## Proxima etapa
Adicionar ledger/deduplicacao persistente e adaptadores explicitos para deployments Vercel e migrations Supabase. Ate la, `event_key` e a chave logica do evento, mas retries de rede ainda podem duplicar uma entrega.

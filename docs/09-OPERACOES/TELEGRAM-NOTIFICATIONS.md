# Notification Bridge — Telegram (V2)

## Objetivo

Notificar o responsavel humano — que e **nao tecnico** — quando a Fabrica RNS precisar de decisao ou concluir trabalho relevante, de um jeito que responda sem esforco: o que aconteceu, se e bom/mau/informativo, quem esta trabalhando, se precisa agir agora e qual e o proximo passo. Telegram e canal de alerta e relatorio; aprovacao e merge permanecem no GitHub.

## Origem dos eventos

1. GitHub Actions (`.github/workflows/human-notifications.yml`): PR aberta/ready-for-review/revisao solicitada; conclusao de Application CI, Database CI, Security, Intelligence CI e Fiscal Bridge.
2. Orquestrador local (`_RNS-CONSTRUTOR/notify.ps1`, fora deste repositorio): eventos do Constructor (inicio, troca de provider, bloqueio, conclusao, todos os motores indisponiveis) e do ciclo de revisao (findings do Fiscal, revisao concluida/CLEAR, gate de aprovacao, revisor independente indisponivel). Esta e a unica fonte que sabe o estado real de Copilot/Anthropic/OpenAI/Fiscal/Reviewer e por isso e quem preenche `provider_status`.

## Schema do evento (`POST /api/notify-telegram`)

```
event_key, category, severity, title, human_summary, human_action,
project, repository, pr_number, branch, sha, cycle_id, task_id,
provider, provider_status, provider_history, checks, findings, risks,
blocking_reason, technical_detail, next_step, url, details_url, checks_url
```

Campo ausente fica ausente — nunca e inventado. Compatibilidade: um caller antigo que so envie `{event_key,title,summary,url}` continua funcionando (`summary` e tratado como `human_summary`).

### `category`

`INFO | WORKING | BLOCKED | HUMAN_ACTION | COMPLETED | SECURITY`. `SECURITY` so deve ser usada quando a origem classificou o evento estruturalmente (ex.: violacao de papel/ACK estranho detectada pelo coordenador) — nunca por busca de palavras como "RLS"/"RBAC"/"secret" dentro de texto livre.

### `human_action`

`NONE | REVIEW | APPROVE | REJECT_OR_DECIDE | RESTORE_PROVIDER | CONFIGURE_SECRET | INVESTIGATE`.

Regra central: um finding do Fiscal **nao** vira acao humana automaticamente. Se o construtor consegue corrigir e nenhuma decisao humana e necessaria, `human_action=NONE` e a mensagem diz "o construtor esta trabalhando na correcao". So existe acao humana quando ha uma decisao que exige autoridade humana de fato: mudanca de escopo, conflito de requisitos, autorizacao protegida, aprovacao final/merge, alteracao de budget/seguranca, ou motor sem fallback que precisa ser restaurado manualmente.

### `provider_status`

Objeto com chaves conhecidas (todas opcionais, `UNKNOWN` quando nao houver evidencia — nunca forcado):
`watcher, constructor, constructor_owner, automation, constructor_copilot, constructor_anthropic, constructor_openai, fiscal_openai, reviewer_anthropic, ci, vercel`.

`constructor_owner` (quem detem a execucao, de `provider-owners.json`) e `automation` (se o sistema esta autorizado a acordar/escrever automaticamente, de `AutomationEnabled`) sao conceitos **separados** e nunca inferidos um do outro.

Estados possiveis: `HEALTHY | WORKING | DEGRADED | UNAVAILABLE_CREDIT | UNAVAILABLE_AUTH | DISABLED_BY_POLICY | CIRCUIT_OPEN | UNKNOWN` (mais `ENABLED/DISABLED` para `automation` e `IDLE/BLOCKED` para `constructor`). O endpoint traduz para o operador (`HEALTHY→disponivel`, `UNAVAILABLE_CREDIT→sem creditos`, `DISABLED_BY_POLICY→reservado/desativado`, etc.) — o codigo tecnico nunca e a linha principal da mensagem, so aparece numa linha secundaria "Detalhe:" (`technical_detail`).

## Formato da mensagem (Telegram)

Ordem fixa, com a pergunta humana **antes** dos detalhes tecnicos:

```
icone + titulo
Projeto · PR · SHA
O que aconteceu
VOCE PRECISA FAZER ALGO AGORA? SIM/NAO
O que a Fabrica esta fazendo agora
Estado dos motores
Validacoes
Problemas
Proximo passo
Abrir PR · Ver CI · Ver detalhes
```

Quando `human_action=APPROVE`, a frase "A Fabrica NAO fara merge automaticamente." e injetada pelo proprio endpoint (nunca depende do caller lembrar de escreve-la). Nenhum botao de Aprovar/Rejeitar/Merge/Executar correcao e enviado nesta versao — so links (Abrir PR / Ver CI / Ver detalhes); Telegram permanece informativo, GitHub permanece canonico para decisao.

Se o corpo passar do limite seguro (`MAX_TEXT=3500`), o texto e cortado e o rodape passa a apontar para `details_url` — "Telegram = resumo, GitHub = relatorio completo".

## Comentario GitHub `[RNS-HUMAN-STATUS]`

Quando o evento tem `cycle_id`/`task_id`, o orquestrador local publica/atualiza (nunca duplica) um comentario `[RNS-HUMAN-STATUS]` com o relatorio tecnico completo (todos os 11 subsistemas, historico de providers, findings, riscos, checks) — sem o limite de tamanho do Telegram. Nunca edita comentarios do Fiscal (`/fiscal...`) nem do revisor (`[RNS-CLAUDE-REVIEW]`).

## Seguranca (defesa em camadas)

1. Allowlist: qualquer campo fora do schema acima (dump de ambiente, headers, stdout bruto de provider) e descartado antes de qualquer outro processamento.
2. Todo texto vai por `escapeHtml`.
3. Todo texto tambem passa por uma redacao adicional (`redact()`), que reconhece padroes de segredo conhecidos deste projeto (nome de variavel=valor, `Bearer `, `ghp_`, `sk-`, `AKIA`, tokens longos genericos) — nao depende so de prefixos.
4. Limite de tamanho sempre aplicado.

O endpoint `/api/notify-telegram` continua aceitando somente POST autenticado por `FISCAL_BRIDGE_SECRET`.

As credenciais do bot nunca ficam no GitHub, no codigo ou em comentarios. Elas ficam somente nas Environment Variables do projeto Vercel `fabricarns`. O orquestrador local le `FISCAL_BRIDGE_URL`/`FISCAL_BRIDGE_SECRET` apenas de variavel de ambiente do processo — nunca de `config.json`, nunca inventados; na ausencia deles o transporte fica `UNAVAILABLE_CONFIG` e o resto do sistema (Constructor/Coordinator/Watcher) continua funcionando normalmente.

## Variaveis no Vercel `fabricarns`

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `FISCAL_BRIDGE_SECRET` (ja existente)

No GitHub Actions:

- `FISCAL_BRIDGE_URL` (ja existente)
- `FISCAL_BRIDGE_SECRET` (ja existente)

No ambiente local (fora deste repositorio, nunca em `config.json`):

- `FISCAL_BRIDGE_URL`, `FISCAL_BRIDGE_SECRET` — mesmas variaveis, lidas so do ambiente do processo do orquestrador.

## Ativacao

1. Merge humano da PR.
2. Confirmar as variaveis `TELEGRAM_BOT_TOKEN` e `TELEGRAM_CHAT_ID` no Vercel.
3. Aguardar o deployment de producao do `fabricarns` ficar READY.
4. Configurar `FISCAL_BRIDGE_URL`/`FISCAL_BRIDGE_SECRET` no ambiente do processo do orquestrador local (decisao humana separada; o agente construtor nao configura isso por conta propria).
5. Manter `HumanNotificationsEnabled=false` em `config.json` do orquestrador local durante testes; so um humano muda para `true` apos revisar o relatorio de ativacao.
6. Executar teste E2E controlado via endpoint.
7. Confirmar recebimento no Telegram e ausencia de segredos nos logs.
8. So entao declarar o canal operacional.

## Limites atuais

- Dedupe do lado GitHub Actions/endpoint e best-effort, em memoria, por `event_key`, dentro de um container Vercel "morno" — nao ha persistencia nova so para isso nesta versao (decisao explicita: agrupamento/dedupe server-side com banco fica para uma evolucao separada, se necessario). O `gate.json` do orquestrador local ja agrega os checks por poll, o que cobre o caso pratico de "nao mandar 5 telegrams" para eventos originados localmente.
- A aprovacao de PR nunca acontece pelo Telegram.
- Banco e Vercel entram no `provider_status` (`ci`, `vercel`) so como leitura do `gate.json` local; nenhum probe novo e feito so para notificar.

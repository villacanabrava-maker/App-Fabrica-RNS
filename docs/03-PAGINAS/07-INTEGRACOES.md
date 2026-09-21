# Página 07 — Integrações

---

## 1. Identidade

| | |
|---|---|
| **Rotas** | `/integracoes` · `/integracoes/:provider` |
| **Ícone da navegação** | `integrations` |
| **Título** | "Integrações" |
| **Subtítulo** | "Conecte suas ferramentas e potencialize seus agentes e projetos." |
| **Fase** | `[F1]` GitHub, Supabase, Vercel · `[F2]` OpenAI, Anthropic, Antigravity, Slack e demais |
| **Permissão mínima** | `admin` para conectar; `viewer` para ver status |

★ **Esta é a página com maior superfície de risco do produto.** Ela lida com credenciais. Leia `05-SEGURANCA/` antes de implementá-la.

---

## 2. Objetivo

```
A que serviços a fábrica está conectada?
Alguma conexão está quebrada?
Que permissões eu concedi?
Como conecto algo novo com segurança?
```

---

## 3. Anatomia

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Integrações                                       [+ Nova Integração]    │
│ Conecte suas ferramentas e potencialize seus agentes e projetos.         │
├──────────────────────────────────────────────────────────────────────────┤
│ Todas │📊Produtividade │🗄Dados │💬Comunicação │<>Desenvolvimento │       │
│ 🧠IA │⋯Outros                                                            │
├──────────────────────────────────────────────────────────────────────────┤
│ 🔍Buscar integrações...                           │ Todos os status ▾    │
├───────────────────────────────────────────────────┬──────────────────────┤
│ ┌────────────┐┌────────────┐┌────────────┐┌──────┐│ 🔗 INTEGRAÇÕES SEM  │
│ │⚡Supabase  ││▲Vercel     ││⬤GitHub     ││#Slack││    LIMITES           │
│ │  ●Conectado││  ●Conectado││  ●Conectado││●Conec││ Conecte as ferramen- │
│ │Banco de    ││Deploy e    ││Repositórios││Comuni││ tas que sua equipe   │
│ │dados, auth ││hospedagem  ││versionamen.││cação ││ já usa.              │
│ │e storage   ││            ││e colaboraç.││      ││ ✓Integração rápida   │
│ │[BD][Backend││[Deploy]    ││[Código]    ││[Comu]││ ✓Dados em tempo real │
│ │[Gerenciar] ││[Gerenciar] ││[Gerenciar] ││[Ger.]││ ✓Mais produtividade  │
│ │        [⋯] ││        [⋯] ││        [⋯] ││ [⋯]  ││ ✓Múltiplas platafor. │
│ └────────────┘└────────────┘└────────────┘└──────┘│ [Ver documentação ↗] │
│ ┌────────────┐┌────────────┐┌────────────┐┌──────┐├──────────────────────┤
│ │△GoogleDrive││N Notion    ││◎OpenAI     ││S Strip││ INTEGRAÇÕES EM      │
│ │  [Conectar]││  [Conectar]││  ●Conectado││[Conec]││ DESTAQUE             │
│ │Armazenam.  ││Documentação││Modelos de  ││Pagam.││ ⚡Supabase          →│
│ │e gestão    ││e conhecim. ││IA p/ agentes││      ││   Backend completo   │
│ │[Armazen.]  ││[Document.] ││[IA][LLM]   ││[Pag.]││ ▲Vercel             →│
│ │[Conectar]  ││[Conectar]  ││[Gerenciar] ││[Con.]││   Deploy automático  │
│ └────────────┘└────────────┘└────────────┘└──────┘│ ◎OpenAI             →│
│ ┌────────────┐┌────────────┐┌────────────┐┌──────┐│   Inteligência Artif.│
│ │✉SendGrid   ││☎Twilio     ││31Calendário││⋯Outros││ #Slack             →│
│ │[Conectar]  ││[Conectar]  ││Google      ││[Explor]│  Comunicação tempo  │
│ │E-mails     ││SMS/WhatsApp││[Conectar]  ││       ││ N Notion            →│
│ │[E-mail]    ││[Comunic.]  ││[Agenda]    ││[Diver]││   Gestão conhecimento│
│ └────────────┘└────────────┘└────────────┘└──────┘│                      │
├───────────────────────────────┬───────────────────┴──────────────────────┤
│ API E WEBHOOKS                │ STATUS DAS INTEGRAÇÕES                   │
│ <> Integre via API e Webhooks │ ┌────┐ ┌────┐ ┌────┐ ┌────┐             │
│ Conecte qualquer ferramenta   │ │ 4🔗│ │ 8⊞ │ │ 0⚠ │ │ 2⚙ │             │
│ usando nossa API REST ou      │ │Cone│ │Disp│ │Com │ │Em  │             │
│ webhooks personalizados.      │ │ctad│ │onív│ │erro│ │conf│             │
│ [Ver documentação↗][Gerar 🔑] │ └────┘ └────┘ └────┘ └────┘             │
└───────────────────────────────┴──────────────────────────────────────────┘
```

---

## 4. Inventário de ícones

| Ícone | Onde | Nome | Ação | Rótulo | Fase |
|---|---|---|---|---|---|
| ⚛ | sidebar | `integrations` | `/integracoes` | "Integrações" | F1 |
| + | topo | `plus` | abre catálogo de novas integrações | "Nova integração" | F1 |
| 📊🗄💬<>🧠⋯ | abas de categoria | `Icon` por categoria | filtra | nome da categoria | F1 |
| 🔍 | busca | `search` | foca | "Buscar integrações" | F1 |
| ▾ | select de status | `chevron-down` | abre | "Filtrar por status" | F1 |
| ⚡▲⬤#△N◎S✉☎31 | logos dos provedores | `brand/*` | abre detalhe | nome do provedor | F1/F2 |
| ● verde | status conectado | `dot` + rótulo "Conectado" | decorativo | texto junto | F1 |
| ● vermelho | status com erro | `dot` + rótulo "Erro" | decorativo | texto junto | F1 |
| [Gerenciar] | card conectado | botão | abre `/integracoes/:provider` | "Gerenciar Supabase" | F1 |
| [Conectar] | card desconectado | botão | inicia fluxo de conexão | "Conectar Notion" | F1 |
| ⋯ | card | `more` | Testar conexão, Ver logs, Reconectar, Desconectar | "Mais ações" | F1 |
| 🔗 | painel direito | `link` | decorativo | `aria-hidden` | F1 |
| ✓ | lista de benefícios | `check` | decorativo | `aria-hidden` | F1 |
| ↗ | Ver documentação | `external` | abre docs em nova aba | "Ver documentação (nova aba)" | F1 |
| → | integrações em destaque | `arrow-right` | abre detalhe | nome do provedor | F1 |
| `<>` | API e Webhooks | `code` | decorativo | `aria-hidden` | F1 |
| 🔑 | Gerar chave da API | `key` | **abre modal de geração** | "Gerar chave da API" | F1 ★ |
| 🔗⊞⚠⚙ | KPIs de status | `link`/`grid`/`alert`/`settings` | filtra a lista | "4 conectadas" | F1 |

★ O botão "Gerar chave da API" exibe a chave **uma única vez**, com aviso explícito. O banco guarda apenas `key_prefix` e `key_hash`.

---

## 5. Componentes

`PageHeader` · `Tabs` · `FilterBar` · `IntegrationCard` · `StatusPill` · `SidePanel` promocional · `FeaturedList` · `KpiCard` ×4 · `ApiKeyDialog` · `ConnectionWizard` · `ConfirmDialog` · `LogViewer` (logs da integração)

---

## 6. Dados exibidos

| Elemento | Origem |
|---|---|
| Lista de integrações | catálogo estático de provedores suportados + `factory.integrations` da organização |
| Status | `integrations.status` |
| Último erro | `integrations.last_error` |
| Conectado por / quando | `integrations.connected_by`, `connected_at` |
| KPIs | contagens sobre `integrations` |
| Chaves de API | `factory.api_keys` (prefixo e último uso; **nunca a chave**) |

### O catálogo de provedores

| Provedor | Categoria | Essencial? | Fase | Método de conexão |
|---|---|---|---|---|
| **GitHub** | Desenvolvimento | ★ Sim | F1 | GitHub App (instalação), tokens de 1h |
| **Supabase** | Dados | ★ Sim | F1 | Management API token via secret manager |
| **Vercel** | Desenvolvimento | ★ Sim | F1 | OAuth / token de equipe |
| **OpenAI** | IA | Sim | F2 | **WIF/OIDC preferido**; API key como fallback |
| **Anthropic** | IA | Sim | F2 | **WIF/OIDC preferido**; API key como fallback |
| **Antigravity** | IA | Sim | F2 | RNS Local Bridge (outbound, sem porta exposta) |
| Slack | Comunicação | Não | F2 | OAuth |
| Notion | Produtividade | Não | F2+ | OAuth |
| Google Drive | Armazenamento | Não | F2+ | OAuth |
| SendGrid | E-mail | Não | F2+ | API key |
| Twilio | Comunicação | Não | F2+ | API key |
| Stripe | Pagamentos | Não | F2+ | OAuth |
| Google Calendar | Produtividade | Não | F2+ | OAuth |

★ As três essenciais precisam estar conectadas antes de qualquer provisionamento.

---

## 7. Segurança desta página ★

Esta seção é obrigatória e sobrepõe qualquer conveniência de UX.

| Regra | Detalhe |
|---|---|
| **Nenhum segredo trafega para o navegador** | A interface nunca recebe um token. Só metadados: status, prefixo, data |
| **`integrations.config` não guarda segredo** | Só metadados. O segredo fica no secret manager, referenciado por `secret_refs` |
| **Preferir WIF/OIDC** | Para OpenAI e Anthropic, trocar OIDC do GitHub por token temporário é o padrão. API key permanente é fallback documentado |
| **GitHub via App, não PAT** | Permissões mínimas; token de instalação expira em 1 hora e é escopável por repositório e permissão |
| **Identidades separadas** | `rns-control-app`, `rns-worker-app`, `rns-release-service` |
| **Chave de API exibida uma vez** | Depois, só `key_prefix`. Banco guarda hash |
| **Desconectar revoga** | Revoga tokens, remove webhooks, marca `secret_refs` para rotação |
| **Escopos visíveis** | O detalhe da integração mostra **exatamente** quais permissões foram concedidas |
| **Testar conexão não expõe** | O teste roda no servidor e retorna só sucesso/falha e mensagem sanitizada |
| **Nenhum agente vê esta página** | Agentes não acessam credenciais. Ponto |

---

## 8. Interações

| Interação | Comportamento |
|---|---|
| Conectar (OAuth) | Redireciona ao provedor → callback → grava `secret_ref` → testa → marca conectado |
| Conectar (GitHub App) | Redireciona para instalação → callback com `installation_id` → grava → testa |
| Conectar (API key) | Modal com aviso de risco; chave enviada ao servidor por POST, nunca logada; testada antes de gravar |
| Testar conexão | Chamada de leitura inócua ao provedor; grava resultado e timestamp |
| Ver logs | Últimas chamadas: método, recurso, status, duração. **Sem cabeçalhos de autorização** |
| Reconectar | Refaz o fluxo mantendo o mesmo registro |
| Desconectar | `ConfirmDialog` nível `danger` listando o que deixará de funcionar. Revoga e limpa |
| Gerar chave da API | Modal com escopos; exibe a chave uma vez com botão copiar e aviso |
| Revogar chave | Imediato, com confirmação |

---

## 9. Estados

| Estado | Comportamento |
|---|---|
| Loading | Skeleton de grade |
| Empty | Não ocorre: o catálogo é estático |
| Não conectado | Card com botão "Conectar" e descrição |
| Conectando | Card em estado intermediário, com spinner e "Aguardando autorização…" |
| Erro | Card com borda de alerta, mensagem e "Reconectar" + "Ver logs" |
| Token expirando | Aviso 7 dias antes, quando o provedor informa validade |
| Forbidden | `viewer` vê status; botões desabilitados explicando que precisa de `admin` |

---

## 10. Rotas e endpoints

```
GET    /api/integrations                       catálogo + status
GET    /api/integrations/:provider
POST   /api/integrations/:provider/connect     inicia fluxo
GET    /api/integrations/:provider/callback    OAuth callback
POST   /api/integrations/:provider/test
POST   /api/integrations/:provider/reconnect
DELETE /api/integrations/:provider             desconecta e revoga
GET    /api/integrations/:provider/logs?page=
GET    /api/integrations/:provider/scopes

GET    /api/api-keys
POST   /api/api-keys                           retorna a chave UMA vez
DELETE /api/api-keys/:id                       revoga
```

---

## 11. Tabelas

`factory.integrations` · `governance.secret_refs` · `factory.api_keys` · `integration.repositories` · `integration.supabase_projects` · `integration.vercel_projects` · `governance.audit_events`

Toda conexão, desconexão e geração de chave gera `audit_event`.

---

## 12. Eventos

```
integration.connected · integration.disconnected
integration.test_succeeded · integration.test_failed
integration.error · integration.token_expiring
api_key.created · api_key.revoked
```

---

## 13. Permissões

| Ação | Papel mínimo |
|---|---|
| Ver status | `viewer` |
| Testar conexão | `engineer` |
| Ver logs | `engineer` |
| Conectar / desconectar | `admin` |
| Gerar / revogar chave de API | `owner` ★ |
| Ver escopos concedidos | `admin` |

---

## 14. Acessibilidade

- Status nunca depende só da cor do ponto: há sempre o rótulo "Conectado", "Erro", "Disponível".
- O modal de chave de API prende o foco, anuncia o aviso de risco por `aria-describedby` e o botão copiar confirma a ação via `aria-live`.
- Links externos anunciam que abrem nova aba.
- Cards desabilitados explicam o motivo via `aria-describedby`.
- O fluxo OAuth informa, antes do redirecionamento, que o usuário sairá da aplicação.

---

## 15. Performance

- Status verificado sob demanda e em cache curto (`UNSPECIFIED`, sugerido 60s).
- Health check em lote, não uma chamada por card.
- Logs paginados por cursor.

---

## 16. Fase

`[F1]` GitHub, Supabase, Vercel — as três essenciais, com fluxo completo, teste, logs e revogação. Demais cards visíveis como "Disponível" mas não conectáveis.
`[F2]` OpenAI, Anthropic, Antigravity e Slack.
`[F2+]` demais provedores.

---

## 17. Definition of Done

```
□ Catálogo com as três integrações essenciais funcionando de ponta a ponta
□ NENHUM segredo chega ao navegador — verificado por inspeção de bundle e de rede
□ integrations.config auditado: sem campos de segredo
□ GitHub conectado via App, não PAT
□ Escopos concedidos visíveis no detalhe
□ Chave de API exibida uma única vez; banco guarda só prefixo e hash
□ Desconectar revoga tokens e remove webhooks
□ Logs sem cabeçalhos de autorização
□ Toda conexão/desconexão gera audit_event
□ Testar conexão não vaza detalhe interno na mensagem de erro
□ Status sempre com rótulo textual, não só cor
□ axe sem violações; modal de chave testado com leitor de tela
□ Teste de segurança: tentar ler segredo pela API interna falha
□ Playwright: conectar GitHub → testar → ver escopos → desconectar
```

# Página 09 — Configurações

---

## 1. Identidade

| | |
|---|---|
| **Rotas** | `/configuracoes/{geral,equipe,seguranca,notificacoes,aparencia,faturamento,planos,avancado}` |
| **Ícone da navegação** | `settings` |
| **Título** | "Configurações" |
| **Subtítulo** | "Personalize sua experiência, gerencie sua equipe e configure a plataforma de acordo com as necessidades do seu negócio." |
| **Fase** | `[F1]` Geral, Equipe, Segurança, Notificações, Aparência, Avançado · `[F2]` Faturamento, Planos e Uso |
| **Permissão mínima** | `viewer` para ver o próprio perfil; `admin` para a maioria |

★ **Construa esta página cedo** (segunda, logo após autenticação). A organização precisa existir antes de qualquer projeto.

---

## 2. Objetivo

```
Como configuro minha organização?
Quem tem acesso a quê?
Como protejo minha conta?
Quanto estou gastando?
Como ajusto o comportamento padrão da fábrica?
```

---

## 3. Anatomia — aba Geral

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Configurações                                                            │
│ Personalize sua experiência, gerencie sua equipe e configure a plataforma│
├──────────────────────────────────────────────────────────────────────────┤
│ ⚙Geral │👥Equipe │🛡Segurança │🔔Notificações │🎨Aparência │              │
│ 💳Faturamento │📊Planos e Uso │⚙Avançado                                 │
├────────────────────────┬────────────────────────┬────────────────────────┤
│ 🏢 INFORMAÇÕES DA      │ ⚙ PREFERÊNCIAS GERAIS  │ 👤 AÇÕES DA CONTA      │
│    ORGANIZAÇÃO         │ Ajuste o comportamento │ Gerencie e proteja     │
│ Dados básicos da sua   │ da plataforma.         │ sua conta.             │
│ empresa ou equipe.     │                        │ ┌────────────────────┐ │
│ Nome da organização    │ Início padrão          │ │🔧Alterar senha    →│ │
│ ┌────────────────────┐ │ Definir a página       │ │  Atualize sua senha│ │
│ │ Fábrica Apps RNS   │ │ inicial ao entrar      │ ├────────────────────┤ │
│ └────────────────────┘ │      [Visão Geral ▾]   │ │🛡Autenticação em  →│ │
│ Descrição              │                        │ │  duas etapas       │ │
│ ┌────────────────────┐ │ Dicas e tutoriais  [●] │ ├────────────────────┤ │
│ │Agentes. Ideias.    │ │ Exibir dicas contextu. │ │📱Sessões ativas   →│ │
│ │Aplicativos Reais.  │ │                        │ │  Gerencie seus     │ │
│ └────────────────────┘ │ Compactar menu     [○] │ │  dispositivos      │ │
│ Logo      Fuso horário │ lateral                │ ├────────────────────┤ │
│ ┌────┐ ┌─────────────┐ │                        │ │🗑Excluir conta    →│ │
│ │[◆] │ │(GMT-03:00)  │ │ Animações da       [●] │ │  Não pode ser      │ │
│ └────┘ │Brasília ▾   │ │ interface              │ │  desfeita          │ │
│[Alterar│ └─────────────┘ │                        │ └────────────────────┘ │
│ logo]  │ Idioma        │ Salvamento         [●] │                        │
│ JPG,PNG│ ┌─────────────┐│ automático             │                        │
│ SVG    │ │🌐Português ▾││                        │                        │
│ máx2MB │ └─────────────┘│                        │                        │
├────────────────────────┼────────────────────────┼────────────────────────┤
│ 🧠 CONFIGURAÇÕES DE IA │ 🗂 CONFIGURAÇÕES DE    │ ⚠ ZONA DE PERIGO       │
│ Defina preferências    │    PROJETOS            │ Ações avançadas e      │
│ para uso dos modelos.  │ Defina padrões para    │ irreversíveis.         │
│ Modelo padrão          │ novos projetos.        │ ┌────────────────────┐ │
│ ┌────────────────────┐ │ Template padrão        │ │📚Limpar dados     →│ │
│ │ [resolvido] ▾      │ │ ┌────────────────────┐ │ │  temporários       │ │
│ └────────────────────┘ │ │Projeto em Branco ▾ │ │ ├────────────────────┤ │
│ Temperatura padrão     │ └────────────────────┘ │ │⤓Exportar dados    →│ │
│ ├──────●───┤  0.7      │ Visibilidade padrão    │ ├────────────────────┤ │
│ Máx. tokens padrão     │ ┌────────────────────┐ │ │↺Redefinir config. →│ │
│ ┌────────────────────┐ │ │🔒Privado (equipe)▾ │ │ ├────────────────────┤ │
│ │ 4.000              │ │ └────────────────────┘ │ │🏢Excluir organizaç→│ │
│ └────────────────────┘ │                        │ │  Permanente        │ │
│ Permitir agentes   [●] │ Criar base de      [●] │ └────────────────────┘ │
│ personalizados         │ conhecimento autom.    │                        │
│ Habilitar modo de  [●] │ Incluir agentes    [●] │                        │
│ análise (Deep Work)    │ sugeridos              │                        │
└────────────────────────┴────────────────────────┴────────────────────────┘
```

---

## 4. Conteúdo de cada aba

### ⚙ Geral `[F1]`

| Seção | Campos |
|---|---|
| Informações da Organização | nome, descrição, logo (JPG/PNG/SVG, máx 2MB), fuso horário, idioma |
| Preferências Gerais | página inicial padrão, dicas contextuais, menu compacto, animações, salvamento automático |
| Configurações de IA | **modelo padrão (seleção do registry, nunca texto livre)** ★, temperatura, máx. tokens, permitir agentes personalizados, modo de análise profunda |
| Configurações de Projetos | template padrão, visibilidade padrão, criar base de conhecimento automaticamente, incluir agentes sugeridos |
| Ações da Conta | alterar senha, 2FA, sessões ativas, excluir conta |
| Zona de Perigo | limpar dados temporários, exportar dados, redefinir configurações, excluir organização |

★ O campo "Modelo padrão" lista apenas modelos habilitados em `agents.model_profiles`. Digitar nome de modelo em texto livre é proibido — quebra a decisão ADR-032.

### 👥 Equipe `[F1]`

```
Membros           lista com avatar, nome, e-mail, papel, último acesso, ações
Convidar          e-mail + papel; convite com expiração
Papéis            owner | admin | engineer | viewer  (matriz de permissões visível)
Transferir posse  fluxo com confirmação dupla
Remover membro    confirmação; não remove o último owner
```

Matriz exibida na tela (resumo de `05-SEGURANCA/02`):

| Ação | owner | admin | engineer | viewer |
|---|:---:|:---:|:---:|:---:|
| Ver tudo | ✓ | ✓ | ✓ | ✓ |
| Criar projeto | ✓ | ✓ | ✓ | — |
| Executar agente | ✓ | ✓ | ✓ | — |
| Aprovar etapa | ✓ | ✓ | ✓* | — |
| Conectar integração | ✓ | ✓ | — | — |
| Gerar chave de API | ✓ | — | — | — |
| Gerenciar equipe | ✓ | ✓ | — | — |
| Excluir organização | ✓ | — | — | — |

\* conforme política da organização.

### 🛡 Segurança `[F1]`

| Seção | Conteúdo |
|---|---|
| Autenticação | 2FA obrigatório para `admin` e `owner` (configurável), métodos permitidos |
| Sessões | lista de dispositivos com IP aproximado, navegador, último acesso, botão revogar |
| Políticas de aprovação | quem pode aprovar o quê; exigir aprovação de outra pessoa para releases |
| Política de agentes | write policies permitidas, egress permitido, ferramentas em ALLOW/ASK/DENY |
| Chaves de API | lista com prefixo, escopos, último uso, revogar |
| Log de auditoria | acesso ao ledger filtrado (somente leitura) |
| Domínios permitidos | restringir convites a domínios de e-mail |

★ **Proibido:** qualquer configuração nesta aba que permita desligar um gate de segurança da Constituição. A interface não oferece "permitir que agentes aprovem". Isso não é uma opção que existe.

### 🔔 Notificações `[F1]`

```
Canais         in-app | e-mail | Slack (F2)
Eventos        aprovação pendente · etapa concluída · execução falhou
               budget em X% · release pronto · integração com erro
               divergência não resolvida
Frequência     imediato | resumo diário | resumo semanal
Silenciar      por projeto ou por tipo
Horário        não perturbar (respeita o fuso da organização)
```

★ Aprovação pendente e falha crítica **não podem** ser totalmente silenciadas — só podem mudar de canal. Uma fábrica onde ninguém é avisado de um gate parado não funciona.

### 🎨 Aparência `[F1]`

```
Tema              claro | escuro | seguir o sistema
Densidade         confortável | compacta
Animações         ligado | desligado (respeita prefers-reduced-motion)
Tamanho da fonte  padrão | grande
Menu lateral      expandido | compacto
Idioma            pt-BR (outros: futuro)
```

### 💳 Faturamento `[F2]` · 📊 Planos e Uso `[F2]`

```
Plano atual e limites
Uso do período: tokens, execuções, previews, armazenamento
Histórico de custos por app, missão, provider e modelo
Budgets: definir teto por organização, app e missão
Alertas de budget em 50%, 80%, 100%
Método de pagamento e faturas
```

Valores e planos: `UNSPECIFIED` até dimensionamento real.

### ⚙ Avançado `[F1]`

```
Modo desenvolvedor       expõe correlation_id e payloads normalizados na UI
Webhooks de saída        enviar eventos da fábrica para um endpoint próprio
Retenção de dados        períodos por tipo de registro
Exportação completa      gera arquivo com todos os dados da organização
Região de dados          UNSPECIFIED
Feature flags            liga recursos em beta
Limpar caches
```

---

## 5. Inventário de ícones

| Ícone | Onde | Nome | Ação | Rótulo | Fase |
|---|---|---|---|---|---|
| ⚙ | sidebar | `settings` | `/configuracoes` | "Configurações" | F1 |
| ⚙👥🛡🔔🎨💳📊⚙ | abas | `Icon` por aba | muda aba | nome da aba | F1/F2 |
| 🏢 | card Organização | `building` | decorativo | `aria-hidden` | F1 |
| [◆] | logo | preview da imagem | abre seletor | "Logo da organização" | F1 |
| [Alterar logo] | botão | — | abre upload | "Alterar logo" | F1 |
| 🌐 | seletor de idioma | `globe` | decorativo | `aria-hidden` | F1 |
| ▾ | todos os selects | `chevron-down` | abre opções | rótulo do campo | F1 |
| [●]/[○] | switches | `Switch` | alterna | rótulo + estado | F1 |
| ●───── | slider de temperatura | `Slider` | ajusta | "Temperatura, 0.7" | F1 |
| 👤 | Ações da Conta | `user` | decorativo | `aria-hidden` | F1 |
| 🔧 | Alterar senha | `wrench` | abre fluxo | "Alterar senha" | F1 |
| 🛡 | 2FA | `shield` | abre configuração | "Autenticação em duas etapas" | F1 |
| 📱 | Sessões ativas | `device` | abre lista | "Sessões ativas" | F1 |
| 🗑 | Excluir conta | `trash` | confirmação dupla | "Excluir conta, ação irreversível" | F1 |
| 🧠 | Configurações de IA | `brain` | decorativo | `aria-hidden` | F1 |
| 🗂 | Configurações de Projetos | `folder` | decorativo | `aria-hidden` | F1 |
| 🔒 | visibilidade padrão | `lock` | decorativo | `aria-hidden` | F1 |
| ⚠ | Zona de Perigo | `alert` | decorativo | texto lido normalmente | F1 |
| 📚 | Limpar dados temporários | `layers` | confirmação | "Limpar dados temporários" | F1 |
| ⤓ | Exportar dados | `download` | gera exportação assíncrona | "Exportar dados" | F1 |
| ↺ | Redefinir configurações | `rotate` | confirmação | "Redefinir configurações" | F1 |
| 🏢 | Excluir organização | `building` | confirmação tripla ★ | "Excluir organização, permanente" | F1 |
| → | itens de lista de ação | `chevron-right` | abre o item | dentro do item | F1 |

★ Excluir organização exige: confirmação, digitar o nome exato e, se houver mais de um membro, confirmação por e-mail.

---

## 6. Componentes

`PageHeader` · `Tabs` · `SettingsCard` · `Input` · `Textarea` · `Select` · `Switch` · `Slider` · `FileUpload` · `ActionList` · `DangerZone` · `MemberTable` · `RoleMatrix` · `SessionList` · `ApiKeyTable` · `ConfirmDialog` (3 níveis) · `AsyncBoundary`

---

## 7. Dados exibidos

| Elemento | Origem |
|---|---|
| Organização | `factory.organizations` |
| Preferências | `organizations.settings` (jsonb) e preferências por usuário |
| Membros | `factory.memberships` join `factory.users` |
| Sessões | Supabase Auth |
| Chaves de API | `factory.api_keys` (prefixo, escopos, último uso) |
| Modelo padrão | `agents.model_profiles` where `enabled` |
| Templates | `factory.templates` |
| Uso e custo | `factory.usage_records`, `factory.budgets` |
| Log de auditoria | `governance.audit_events` |

---

## 8. Interações

| Interação | Comportamento |
|---|---|
| Salvamento automático ligado | Salva com debounce de 800ms e mostra "Salvo" discreto. Erro reverte o campo e explica |
| Salvamento automático desligado | Aparece barra "Você tem alterações não salvas" com Salvar/Descartar |
| Alterar logo | Valida tipo e tamanho no cliente **e** no servidor; gera thumbnails |
| Convidar membro | E-mail + papel; convite expira; reenviável |
| Alterar papel | Confirmação; não é possível rebaixar o último `owner` |
| Revogar sessão | Imediato; a própria sessão atual é marcada como "este dispositivo" |
| Zona de Perigo | Cada ação tem confirmação proporcional ao risco |
| Exportar dados | Gera job assíncrono e notifica quando pronto; link com expiração |

---

## 9. Estados

| Estado | Comportamento |
|---|---|
| Loading | Skeleton de cards |
| Salvando | Indicador discreto no card, não overlay global |
| Erro ao salvar | Campo reverte, mensagem inline, foco no campo |
| Forbidden | Campos além do papel ficam desabilitados com explicação de qual papel é necessário |
| Conflito de edição | "Outro administrador alterou isto" + mostrar diferença + escolher |

---

## 10. Endpoints

```
GET   /api/settings/organization
PATCH /api/settings/organization
POST  /api/settings/organization/logo
GET   /api/settings/preferences
PATCH /api/settings/preferences

GET   /api/settings/members
POST  /api/settings/members/invite
PATCH /api/settings/members/:id/role
DELETE /api/settings/members/:id
POST  /api/settings/transfer-ownership

GET   /api/settings/security
PATCH /api/settings/security
GET   /api/settings/sessions
DELETE /api/settings/sessions/:id
POST  /api/settings/2fa/enable
POST  /api/settings/2fa/disable

GET   /api/settings/notifications
PATCH /api/settings/notifications

GET   /api/settings/billing            [F2]
GET   /api/settings/usage              [F2]
PATCH /api/settings/budgets            [F2]

POST  /api/settings/export
POST  /api/settings/clear-cache
POST  /api/settings/reset
DELETE /api/settings/organization      confirmação tripla
```

---

## 11. Tabelas

`factory.organizations` · `factory.users` · `factory.memberships` · `factory.api_keys` · `agents.model_profiles` · `factory.templates` · `factory.budgets` · `governance.audit_events` · `governance.secret_refs`

---

## 12. Permissões

Ver a matriz na §4, aba Equipe. Toda alteração de configuração gera `audit_event` com valor anterior e novo (exceto segredos).

---

## 13. Acessibilidade

- Cada card de configuração é uma `<section>` com cabeçalho e `aria-labelledby`.
- Switches usam `role="switch"` com `aria-checked` e rótulo descritivo completo.
- O slider de temperatura anuncia o valor ao mudar e aceita setas do teclado.
- Confirmações da Zona de Perigo prendem foco, descrevem a consequência e exigem ação deliberada.
- Mensagens de erro inline associadas por `aria-describedby`, nunca só por cor da borda.
- Upload de logo tem input de arquivo acessível, com descrição das restrições antes da seleção.

---

## 14. Performance

- Cada aba carrega em rota própria; nada de carregar as oito de uma vez.
- Autosave com debounce; nunca uma requisição por tecla.
- Lista de membros paginada acima de 50.

---

## 15. Fase

`[F1]` Geral, Equipe, Segurança, Notificações, Aparência, Avançado.
`[F2]` Faturamento, Planos e Uso, notificações por Slack.
`[F3]` refinamento visual.

---

## 16. Definition of Done

```
□ As seis abas da Fase 1 completas
□ Modelo padrão vem do registry — impossível digitar texto livre  ★
□ Nenhuma configuração permite desligar gate de segurança da Constituição  ★
□ Aprovação pendente e falha crítica não podem ser totalmente silenciadas
□ Último owner não pode ser removido nem rebaixado
□ Excluir organização exige confirmação tripla
□ Toda alteração gera audit_event com valor anterior e novo
□ Validação de upload no cliente E no servidor
□ Autosave com debounce e reversão em erro
□ Campos fora do papel desabilitados com explicação
□ axe sem violações; switches e slider testados por teclado
□ Playwright: alterar organização → convidar membro → alterar papel → revogar sessão
```

# Telas Transversais

Telas que não estão na navegação lateral mas são essenciais ao produto.

---

# A. Autenticação

## A.1 Identidade

| | |
|---|---|
| **Rotas** | `/login` · `/registrar` · `/recuperar-senha` · `/aceitar-convite/:token` · `/auth/callback` |
| **Fase** | `[F1]` — **primeira coisa a construir** |

## A.2 Anatomia — `/login`

```
┌─────────────────────────────────────────────────┐
│                                                 │
│              ◆  Fábrica Apps RNS                │
│           Agentes. Ideias. Aplicativos Reais.   │
│                                                 │
│   ┌───────────────────────────────────────┐    │
│   │ Entrar                                 │    │
│   │                                        │    │
│   │ E-mail                                 │    │
│   │ ┌────────────────────────────────────┐ │    │
│   │ └────────────────────────────────────┘ │    │
│   │ Senha                        [👁]      │    │
│   │ ┌────────────────────────────────────┐ │    │
│   │ └────────────────────────────────────┘ │    │
│   │ ☐ Manter conectado   Esqueci a senha   │    │
│   │                                        │    │
│   │         [      Entrar      ]           │    │
│   │                                        │    │
│   │ ───────────── ou ─────────────         │    │
│   │      [⬤ Continuar com GitHub]          │    │
│   └───────────────────────────────────────┘    │
│                                                 │
│   Transformando ideias em soluções reais com IA │
└─────────────────────────────────────────────────┘
```

## A.3 Regras

| Regra | Detalhe |
|---|---|
| Provedor | Supabase Auth |
| Métodos | e-mail + senha; OAuth GitHub (recomendado, pois o GitHub já é integração essencial) |
| 2FA | Obrigatório para `admin` e `owner` quando a organização exigir |
| Sessão | Renovável; expiração configurável; listável e revogável |
| Erro de credencial | Mensagem genérica ("E-mail ou senha incorretos"), **nunca** revelar se o e-mail existe |
| Rate limit | Tentativas por IP e por conta; backoff crescente |
| Convite | `/aceitar-convite/:token`, token com expiração |
| Pós-login | Redireciona para a página inicial padrão configurada (Configurações → Geral) |
| Sem organização | Fluxo de criação de organização antes de entrar no app |

## A.4 Acessibilidade

- Campos com `label` visível, `autocomplete` correto (`email`, `current-password`).
- Botão de mostrar senha com `aria-pressed` e rótulo que muda.
- Erro de formulário anunciado por `aria-live` e com foco movido para o primeiro campo inválido.
- Contraste do botão primário verificado sobre o fundo com gradiente.

---

# B. Câmara de Revisão ★

**A tela mais importante do produto.** É onde a revisão dupla vira algo que um humano consegue julgar.

## B.1 Identidade

| | |
|---|---|
| **Rota** | `/projetos/:id/revisao/:cycleId` |
| **Fase** | `[F2]` — estrutura pode nascer na F1 com dados mock |
| **Permissão** | `viewer` para ver; decisão exige papel com poder de aprovação |

## B.2 Anatomia

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ← Sistema de Gestão Escolar > Revisão                                    │
│ CICLO DE REVISÃO #RC-00421                                               │
│ Plano v7 · SHA abc123def · Etapa: Backend de autenticação                │
│ Aberto há 42 min · Rodada 4 de 4 · Custo acumulado: —                    │
├─────────────┬──────────────┬──────────────┬──────────────────────────────┤
│  GPT R1     │  CLAUDE R1   │  GPT R2      │  CLAUDE R2                   │
│  ✓ concluído│  ✓ concluído │  ✓ concluído │  ✓ concluído                 │
│  12m        │  9m          │  7m          │  6m                          │
│             │              │              │                              │
│ findings 6  │ meta-review  │ reconciliação│ SÍNTESE FINAL                │
│ riscos    3 │ discordou 2  │ aceitou    4 │                              │
│ melhorias 4 │ novos riscos1│ rejeitou   2 │ READY_WITH_CONDITIONS        │
│             │              │              │                              │
│ [ver saída] │ [ver saída]  │ [ver saída]  │ [ver saída]                  │
├─────────────┴──────────────┴──────────────┴──────────────────────────────┤
│ ⚠ DIVERGÊNCIAS                                                    2 abertas│
│ ┌──────────────────────────────────────────────────────────────────────┐ │
│ │ SEC-18  segurança      GPT: medium │ Claude: critical  NÃO RESOLVIDA │ │
│ │ "A policy de RLS proposta permite leitura entre organizações."       │ │
│ │ Evidência GPT: ev_21 │ Evidência Claude: ev_22, ev_23                │ │
│ │ Materialidade: alta · Requer decisão humana                          │ │
│ │ [Aceitar OpenAI] [Aceitar Claude] [Combinar] [Adiar] [Ver evidências]│ │
│ ├──────────────────────────────────────────────────────────────────────┤ │
│ │ ARCH-9  arquitetura    concordância                     RESOLVIDA    │ │
│ └──────────────────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────────────────┤
│ 📋 ACHADOS ABERTOS                                              3 de 11  │
│ ● critical  SEC-18  RLS permite leitura cruzada       [bloqueia]         │
│ ● high      TST-04  Sem teste de negação para a policy                   │
│ ● medium    ARC-12  Acoplamento entre módulo auth e billing              │
├──────────────────────────────────────────────────────────────────────────┤
│ ✅ GATES DETERMINÍSTICOS                                                 │
│ ✓ lint   ✓ typecheck   ✓ unit   ✓ integration   ✗ rls-tests   ⏳ e2e     │
│ Preview: supabase preview-task-481 ✓ │ vercel ✓ │ [Abrir preview ↗]     │
├──────────────────────────────────────────────────────────────────────────┤
│ VEREDICTO DA IA: READY_WITH_CONDITIONS                                   │
│ Condições: resolver SEC-18 e adicionar teste de negação de RLS.          │
│                                                                          │
│                        HUMANO / ANTIGRAVITY                              │
│   [ REJEITAR ]   [ PEDIR REVISÃO ]   [ APROVAR ETAPA ]                   │
│   ┌──────────────────────────────────────────────────────────────────┐  │
│   │ Justificativa (opcional para aprovar, obrigatória para rejeitar) │  │
│   └──────────────────────────────────────────────────────────────────┘  │
│   [⤓ Baixar Handoff Bundle para o Antigravity]                           │
└──────────────────────────────────────────────────────────────────────────┘
```

## B.3 Regras inegociáveis

| # | Regra |
|---|---|
| 1 | **A interface nunca esconde divergências produzindo uma "média" dos modelos.** Divergência é informação ★ |
| 2 | As quatro colunas são sempre visíveis, mesmo que a passagem ainda não tenha rodado |
| 3 | O botão APROVAR fica **desabilitado** enquanto houver finding `critical` com `blocks_progress = true` não resolvido |
| 4 | Gates determinísticos vermelhos desabilitam a aprovação, independentemente do veredicto da IA |
| 5 | Rejeitar exige justificativa |
| 6 | A decisão grava `approval` com `actor_type='human'`, `subject_sha` e `timestamp` |
| 7 | Se o `subject_sha` mudou desde a abertura do ciclo, a tela exibe aviso e desabilita a decisão |
| 8 | O Handoff Bundle contém tudo que o operador precisa para julgar fora da tela |

## B.4 Ícones

| Ícone | Onde | Nome | Ação | Rótulo |
|---|---|---|---|---|
| ← | breadcrumb | `arrow-left` | volta ao projeto | "Voltar ao projeto" |
| ✓/⏳/✗ | cabeçalho das colunas | `check`/`clock`/`x` | decorativo | status da passagem |
| [ver saída] | cada coluna | botão | abre o JSON/markdown da passagem | "Ver saída de GPT R1" |
| ⚠ | bloco Divergências | `alert` | decorativo | texto lido |
| ● | severidade do finding | `dot` + rótulo | decorativo | severidade escrita |
| ✅ | Gates | `check-circle` | decorativo | `aria-hidden` |
| ↗ | Abrir preview | `external` | nova aba | "Abrir preview (nova aba)" |
| ⤓ | Handoff Bundle | `download` | baixa JSON + markdown | "Baixar pacote de handoff" |

## B.5 Endpoints

```
GET  /api/reviews/:cycleId
GET  /api/reviews/:cycleId/rounds/:n/output
GET  /api/reviews/:cycleId/findings
GET  /api/reviews/:cycleId/disagreements
POST /api/disagreements/:id/resolve
GET  /api/reviews/:cycleId/gates
GET  /api/reviews/:cycleId/handoff-bundle
POST /api/approvals                        decide
```

## B.6 Acessibilidade

- As quatro colunas formam uma lista ordenada; cada uma é uma região com `aria-label` completo: "Passagem 2, Claude R1, concluída em 9 minutos, 1 novo risco".
- Divergências são um grupo com `role="group"`, e os botões de resolução têm rótulo que inclui o identificador: "Aceitar posição do OpenAI para SEC-18".
- O veredicto final usa `role="status"`.
- Botão desabilitado explica o motivo por `aria-describedby`: "Aprovação bloqueada: 1 achado crítico aberto e 1 gate falhando".

---

# C. Fila de Aprovações

## C.1 Identidade

| | |
|---|---|
| **Rota** | `/aprovacoes` |
| **Fase** | `[F1]` estrutura · `[F2]` uso real |

## C.2 Anatomia

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Aprovações                                    Pendentes: 3 · Suas: 3     │
│ Decisões que dependem de você.                                           │
├──────────────────────────────────────────────────────────────────────────┤
│ Pendentes │ Minhas decisões │ Histórico                                  │
├──────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────────────────────┐ │
│ │ ⚖ PLANO · CRM etapa 03                              há 20 min        │ │
│ │ Claude R2: READY_FOR_HUMAN_APPROVAL · 0 bloqueantes · gates verdes   │ │
│ │ SHA abc123 · Custo do ciclo: —                                       │ │
│ │                      [Ver detalhes] [Rejeitar] [Aprovar]             │ │
│ ├──────────────────────────────────────────────────────────────────────┤ │
│ │ 🗄 MIGRATION · #229                                  há 1h           │ │
│ │ Claude R2: READY_WITH_CONDITIONS · 1 divergência aberta  ⚠           │ │
│ │                      [Ver detalhes] [Rejeitar] [Aprovar*]            │ │
│ ├──────────────────────────────────────────────────────────────────────┤ │
│ │ 🚀 RELEASE · App de Saúde v1.2.0                     há 2h           │ │
│ │ Deployment checks aprovados · rolling release sugerido 10%           │ │
│ │                      [Ver detalhes] [Segurar] [Liberar]              │ │
│ └──────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

\* Aprovar desabilitado enquanto a divergência estiver aberta.

## C.3 Regras

1. Ordenação padrão: **mais antigo primeiro** — o mais antigo é o maior gargalo.
2. Idade do item é destacada: acima de 24h ganha marcação de atenção.
3. Aprovação em lote **não existe**. Cada decisão é individual e deliberada ★.
4. A decisão sempre grava `subject_sha`. Se o SHA mudou, a linha fica inválida e pede nova avaliação.

---

# D. Detalhe de Execução (Run)

## D.1 Identidade

| | |
|---|---|
| **Rota** | painel lateral ou `/execucoes/:runId` |
| **Fase** | `[F1]` |

## D.2 Conteúdo

```
Cabeçalho     papel · runtime · modelo resolvido · estado · duração · custo
Contexto      app · missão · etapa · tarefa · base_sha · branch · PR
Linha do tempo eventos normalizados com timestamps
Ferramentas   chamadas com decisão ALLOW/ASK/DENY e duração
Artefatos     lista com tipo, tamanho, sha256 e download
Findings      produzidos por esta execução
Evidências    coletadas
Uso           tokens de entrada, cache, saída, custo, wall time
Erro          mensagem, stack sanitizado, correlation_id
Ações         cancelar (se em execução) · reexecutar · abrir PR · abrir preview
```

★ **Nunca exibir** nesta tela: chaves, variáveis de ambiente, cabeçalhos de autorização. O prompt completo fica atrás de permissão `engineer` e é marcado como conteúdo sensível.

---

# E. Painel de Notificações

## E.1 Conteúdo

```
Agrupado por tipo:
  ⏰ Aguardando você      (sempre no topo)
  ❗ Erros e falhas
  💰 Alertas de budget
  ✓ Conclusões
  ℹ Informativos

Cada item: ícone, título, contexto, tempo relativo, ação primária
Ações: marcar como lida · marcar todas · ir para configurações de notificação
```

Regras:
- "Aguardando você" nunca é agrupado nem colapsado.
- O badge do sino conta apenas itens acionáveis, não informativos.
- `role="region"` com `aria-label="Notificações"`; abertura move o foco para o primeiro item.

---

# F. Busca Global

## F.1 Comportamento

| | |
|---|---|
| **Atalho** | `/` para focar, `Cmd/Ctrl+K` para abrir o modal |
| **Escopo** | projetos, agentes, templates, conteúdos da base, execuções, PRs |
| **Resultados** | agrupados por tipo, com no máximo 5 por grupo e "ver todos" |
| **Navegação** | setas para mover, `Enter` para abrir, `Esc` para fechar |
| **Vazio** | sugere ações: "Criar projeto chamado X", "Buscar na base de conhecimento" |
| **Acessibilidade** | `role="combobox"` com `aria-expanded`, `aria-activedescendant`, resultados anunciados |

---

# G. Estados de erro globais

| Tela | Quando | Conteúdo |
|---|---|---|
| **404** | rota inexistente | "Página não encontrada" + voltar ao Início + busca |
| **403** | sem permissão | Explica qual papel é necessário e quem pode conceder |
| **500** | erro do servidor | Mensagem humana + `correlation_id` copiável + "Tentar novamente" |
| **Offline** | sem rede | Banner persistente; ações de escrita desabilitadas; leitura do cache quando houver |
| **Manutenção** | janela planejada | Aviso com previsão de retorno |

Nenhuma dessas telas exibe stack trace ou detalhe interno de infraestrutura.

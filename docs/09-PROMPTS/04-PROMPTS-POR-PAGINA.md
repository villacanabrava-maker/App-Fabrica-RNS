# Prompts por Página

Um prompt pronto para cada página do Control Plane. Cada um delimita o escopo exato e aponta para o documento de referência.

**Como usar:** copie o prompt, preencha `<SHA>` e `<runtime>` e entregue ao agente autor da etapa. Depois, rode o ciclo de revisão dupla com os prompts de `05-PROMPTS-DO-CICLO-DE-REVISAO-DUPLA.md`.

**Estrutura comum a todos:** ver o cabeçalho abaixo, que se repete implicitamente em cada prompt.

```
CABEÇALHO COMUM (inclua sempre)

Você é R4 — Builder da Fábrica Apps RNS, runtime <openai|anthropic>.
Repositório: RNS/rns-factory · base_sha: <SHA>
Leia antes de começar:
  · AGENTS.md ou CLAUDE.md
  · 06-INTELIGENCIA-DOS-AGENTES/01-CONSTITUICAO.md
  · 02-ARQUITETURA/02-ARQUITETURA-FRONTEND.md
  · 02-ARQUITETURA/08-DESIGN-SYSTEM-RNS.md
  · 03-PAGINAS/00-PADRAO-DE-PAGINA.md
  · o documento da página (indicado abaixo)

forbidden_paths SEMPRE: factory-intelligence/**, .github/workflows/**,
  .agents/**, .claude/**, .codex/**, AGENTS.md, CLAUDE.md, **/.env*

Regras que valem para toda página:
  · Sete estados de UI por bloco: loading, empty, error, partial,
    success, stale, forbidden
  · Nenhum número sem origem declarada. Métrica inexistente mostra "—"
  · Tokens do design system, nunca valor literal
  · Ícones apenas via <Icon name="..." />
  · Toda ação primária alcançável por teclado
  · Cor nunca é o único portador de significado
  · Textos em arquivo de mensagens, não hardcoded
  · O navegador SOLICITA comandos; nunca escreve estado de domínio
```

---

## 1. Início (Dashboard)

```
[CABEÇALHO COMUM]

DOCUMENTO: 03-PAGINAS/01-INICIO.md
FASE: 1

OBJETIVO
Construir o Dashboard que responde, em até 3 segundos, às cinco
perguntas: o que precisa de mim, o que está sendo construído, o que
está trabalhando, o que está bloqueado, o que mudou.

CRITÉRIOS DE ACEITAÇÃO
- Os 5 blocos: KPIs, AGUARDANDO VOCÊ, Agentes, Projetos Recentes,
  Atividade Recente, Uso de Recursos, Ações Rápidas
- ★ O bloco "Aguardando você" existe e é o primeiro após os KPIs
  (ele NÃO está na tela de referência; é correção obrigatória)
- UM ÚNICO endpoint GET /api/dashboard/overview agrega tudo
- Uso de Recursos: CPU e Memória mostram estado vazio explicativo na
  Fase 1. NUNCA um percentual inventado.
- Cada KPI navega para a lista filtrada correspondente
- Realtime no canal factory:<org> atualiza bloco isolado
- Saudação por horário no timezone da organização
- Primeiro item de aprovação alcançável em até 4 tabs

allowed_paths:
  apps/control-plane/app/(app)/page.tsx
  apps/control-plane/features/dashboard/**
  apps/control-plane/server/queries/dashboard.ts
  apps/control-plane/app/api/dashboard/**
  tests/dashboard/**

ENTREGUE TAMBÉM
Teste Playwright: abrir dashboard → clicar numa aprovação → chegar
na Câmara de Revisão.
```

---

## 2. Projetos

```
[CABEÇALHO COMUM]

DOCUMENTO: 03-PAGINAS/02-PROJETOS.md
FASE: 1

OBJETIVO
Construir lista, wizard de 5 passos e detalhe de projeto com Kanban
e Esteira.

CRITÉRIOS DE ACEITAÇÃO
Lista:
- Grade e tabela, filtros, busca, abas por status
Wizard:
- 5 passos fixos: Ideia, Planejamento, Revisão, Implementação, Publicação
- Rascunho persistido entre passos; voltar não perde dados
- ★ Passo 3 BLOQUEIA avanço sem approval com actor_type='human'
- Sugestões da IA por heurística determinística (Fase 1)
Detalhe:
- Abas da Fase 1: Pipeline, Visão Geral, Arquivos, Discussões,
  Configurações, Execuções, Auditoria
- Kanban com mapeamento estado→coluna conforme §6 do documento
- ★ Arrastar cartão SOLICITA transição via POST /api/tasks/:id/transition.
  Rejeição devolve o cartão com toast explicando o motivo.
- ★ Kanban 100% operável por teclado:
  Space seleciona · setas movem · Space solta · Esc cancela
  Resultado anunciado por aria-live
- Toggle Kanban ↔ Esteira
- Estados blocked e failed visíveis, nunca ocultos
- Arquivar grava archived_at, não apaga

allowed_paths:
  apps/control-plane/app/(app)/projetos/**
  apps/control-plane/features/projects/**
  apps/control-plane/server/actions/projects.ts
  apps/control-plane/server/actions/tasks.ts
  apps/control-plane/app/api/apps/**
  apps/control-plane/app/api/tasks/**
  apps/control-plane/app/api/missions/**
  tests/projects/**

ENTREGUE TAMBÉM
Playwright: criar projeto → gerar plano → aprovar → ver Kanban →
mover tarefa por teclado.
```

---

## 3. Agentes de IA

```
[CABEÇALHO COMUM]

DOCUMENTO: 03-PAGINAS/03-AGENTES-DE-IA.md
FASE: 1 (com MockAdapter)

OBJETIVO
Construir catálogo por PAPEL (R1–R9) e detalhe do agente.

CRITÉRIOS DE ACEITAÇÃO
- ★ Nomenclatura por papel, conforme o registry. NÃO usar os apelidos
  de rascunho das telas ("R4 – Frontend", "R5 – Cognitive").
- O front-end LÊ o registry. Proibido if (agent === 'R3') espalhado.
- Write policy visível em cada card
- Modelo exibido é o RESOLVIDO do registry; campo nunca é texto livre
- Detalhe com abas da Fase 1: Visão Geral, Skills, Execuções, Configurações
- "Testar Agente" roda em sandbox contra fixture, SEM tocar repositório
  ou banco real
- RunTimeline com passos numerados navegáveis por teclado
- ★ LogViewer com aria-live throttled (2s), botão pausar auto-scroll,
  role="log"
- Logs paginados por cursor, janelas de 200 linhas
- Runtime offline tratado sem quebrar a página

allowed_paths:
  apps/control-plane/app/(app)/agentes/**
  apps/control-plane/features/agents/**
  apps/control-plane/app/api/agents/**
  apps/control-plane/app/api/runs/**
  packages/design-system/src/log-viewer/**
  packages/design-system/src/run-timeline/**
  tests/agents/**
```

---

## 4. Orquestração

```
[CABEÇALHO COMUM]

DOCUMENTO: 03-PAGINAS/04-ORQUESTRACAO.md
FASE: 1
★ A página mais complexa. Construa por último na Fase 1.

OBJETIVO
Construir listagem de fluxos, editor em canvas com modo lista
alternativo, validação, dry-run e versionamento.

CRITÉRIOS DE ACEITAÇÃO
- Banner: "Fluxos de orquestração não alteram o protocolo de revisão
  da fábrica."
- Canvas: criar, conectar, configurar e remover nós
- Tipos de nó: Início, Agente, Condição, Loop, Espera, Human Gate,
  Ferramenta, Saída
- As 9 regras de validação BLOQUEIAM publicação (§3B do documento)
- ★ MODO LISTA alternativo com as mesmas ações de edição.
  Esta é a rota acessível completa. Não é opcional.
- Navegação por teclado no canvas: Tab em ordem topológica,
  Enter abre propriedades, setas movem, Delete remove com confirmação
- Nós com nome acessível descrevendo entrada e saída
- Dry-run usa MockAdapter e NÃO produz efeito externo
- definition_sha = sha256 do JSON canônico (nós ordenados por id)
- Undo/redo com 50 passos
- Autosave com debounce de 2s
- Exportar não vaza segredo
- Excluir exige digitar o nome do fluxo

allowed_paths:
  apps/control-plane/app/(app)/orquestracao/**
  apps/control-plane/features/orchestration/**
  apps/control-plane/app/api/flows/**
  apps/control-plane/app/api/flow-runs/**
  packages/design-system/src/flow-canvas/**
  tests/orchestration/**
```

---

## 5. Base de Conhecimento

```
[CABEÇALHO COMUM]

DOCUMENTO: 03-PAGINAS/05-BASE-DE-CONHECIMENTO.md
FASE: 1 (assistente na Fase 2)

OBJETIVO
Construir a base de conhecimento humana: visão geral, seis abas,
editor, importação e busca.

CRITÉRIOS DE ACEITAÇÃO
- ★ Aviso no editor: esta base NÃO é normativa para agentes.
  Regras de agente vivem em factory-intelligence/, via PR.
- Seis abas com filtro por tipo
- Editor markdown com preview lado a lado
- Importação de .md, .pdf e URL, SEMPRE com revisão antes de salvar
- Busca full-text com configuração 'portuguese'
- Curtida idempotente (uma por usuário por item)
- Avaliação média exibe "—" até existir sistema de rating
- Sumário automático em documentos longos
- Markdown SANITIZADO: sem HTML arbitrário executável
- Vídeo sem transcrição marcado como incompleto

allowed_paths:
  apps/control-plane/app/(app)/conhecimento/**
  apps/control-plane/features/knowledge/**
  apps/control-plane/app/api/knowledge/**
  tests/knowledge/**
```

---

## 6. Templates

```
[CABEÇALHO COMUM]

DOCUMENTO: 03-PAGINAS/06-TEMPLATES.md
FASE: 1

OBJETIVO
Construir catálogo e detalhe de templates, com verificação de
requisitos e integração com o wizard.

CRITÉRIOS DE ACEITAÇÃO
- Catálogo com filtro por categoria, tecnologia e busca
- Painel de preview lateral com abas
- ★ Template sem repository_url marcado "Rascunho — não utilizável",
  botão Usar desabilitado com explicação acessível
- Verificação de requisitos: GitHub, Supabase e Vercel conectados
- ★ "Usar Template" PRÉ-PREENCHE o wizard. NUNCA cria projeto direto.
  O passo de revisão humana continua obrigatório.
- Criar template a partir de projeto existente remove dados reais
- Avaliação exibe "—" até existir sistema de reviews
- Carrossel navegável por teclado, com posição textual ("3 de 7")
- Alt text descritivo real em todo preview

allowed_paths:
  apps/control-plane/app/(app)/templates/**
  apps/control-plane/features/templates/**
  apps/control-plane/app/api/templates/**
  tests/templates/**
```

---

## 7. Integrações

```
[CABEÇALHO COMUM]

DOCUMENTO: 03-PAGINAS/07-INTEGRACOES.md
FASE: 1 (GitHub, Supabase, Vercel)
★ LEIA 05-SEGURANCA/ INTEIRO ANTES DE COMEÇAR.

OBJETIVO
Construir a página de integrações com as três essenciais funcionando
de ponta a ponta.

CRITÉRIOS DE ACEITAÇÃO
- GitHub conectado via GitHub App (NUNCA PAT), com installation_id
- Supabase e Vercel conectados com credencial no secret manager
- ★ NENHUM segredo chega ao navegador. Verificável por inspeção de
  bundle e de tráfego de rede.
- ★ integrations.config NÃO contém campo de segredo
- secret_refs guarda ONDE a credencial vive, nunca o valor
- Escopos concedidos visíveis no detalhe
- Chave de API exibida UMA vez; banco guarda key_prefix e key_hash
- Desconectar revoga tokens e remove webhooks
- Logs sem cabeçalhos de autorização
- Toda conexão e desconexão gera audit_event
- Mensagem de erro de teste não vaza detalhe interno
- Demais provedores visíveis como "Disponível", não conectáveis na Fase 1

allowed_paths:
  apps/control-plane/app/(app)/integracoes/**
  apps/control-plane/features/integrations/**
  apps/control-plane/app/api/integrations/**
  apps/control-plane/app/api/api-keys/**
  packages/integrations/github/**
  packages/integrations/supabase/**
  packages/integrations/vercel/**
  tests/integrations/**

ENTREGUE TAMBÉM
Teste de segurança: tentar ler um segredo pela API interna deve falhar.
```

---

## 8. Monitoramento

```
[CABEÇALHO COMUM]

DOCUMENTO: 03-PAGINAS/08-MONITORAMENTO.md
FASE: 1

OBJETIVO
Construir o monitoramento com as três observabilidades separadas e a
aba de gargalos.

CRITÉRIOS DE ACEITAÇÃO
- As 7 abas + ★ aba Gargalos (não está nas telas; é obrigatória)
- Gargalos mostra: estado, itens, espera mediana, item mais antigo
- ★ NENHUM número de infraestrutura fictício na Fase 1.
  CPU, memória e armazenamento mostram estado vazio explicando que a
  telemetria chega na Fase 2.
- Agregações feitas NO BANCO via views materializadas:
  monitoring.daily_run_stats, monitoring.agent_performance,
  monitoring.task_bottlenecks
- ★ Todo gráfico com botão "Ver como tabela" com os mesmos dados
- aria-label de gráfico descreve a tendência, não só o título
- Logs filtráveis por nível, agente, projeto, run e texto
- Auto-scroll pausável
- Alertas reconhecíveis, com quem e quando
- Exportação CSV e PDF
- Clicar em KPI leva à lista filtrada

allowed_paths:
  apps/control-plane/app/(app)/monitoramento/**
  apps/control-plane/features/monitoring/**
  apps/control-plane/app/api/monitoring/**
  supabase/migrations/*_monitoring_views.sql    ← R7 revisa obrigatoriamente
  tests/monitoring/**
```

---

## 9. Configurações

```
[CABEÇALHO COMUM]

DOCUMENTO: 03-PAGINAS/09-CONFIGURACOES.md
FASE: 1 (Faturamento e Planos na Fase 2)
★ Construa CEDO — logo após autenticação.

OBJETIVO
Construir as seis abas de configuração da Fase 1.

CRITÉRIOS DE ACEITAÇÃO
- Abas: Geral, Equipe, Segurança, Notificações, Aparência, Avançado
- ★ "Modelo padrão" é um SELECT sobre agents.model_profiles habilitados.
  Proibido campo de texto livre.
- ★ Nenhuma configuração permite desligar um gate constitucional.
  Não existe a opção "permitir que agentes aprovem".
- Aprovação pendente e falha crítica não podem ser totalmente
  silenciadas — só mudar de canal
- Último owner não pode ser removido nem rebaixado
- Excluir organização: confirmação + digitar nome + e-mail se houver
  outros membros
- Toda alteração gera audit_event com valor anterior e novo
  (exceto segredos)
- Upload de logo validado no cliente E no servidor
- Autosave com debounce de 800ms e reversão em erro
- Campos fora do papel desabilitados com explicação acessível
- Switches com role="switch" e aria-checked
- Slider de temperatura operável por setas

allowed_paths:
  apps/control-plane/app/(app)/configuracoes/**
  apps/control-plane/features/settings/**
  apps/control-plane/app/api/settings/**
  tests/settings/**
```

---

## 10. Câmara de Revisão ★

```
[CABEÇALHO COMUM]

DOCUMENTO: 03-PAGINAS/10-TELAS-TRANSVERSAIS.md — seção B
FASE: 1 (com dados mock) · 2 (dados reais)
★ A tela mais importante do produto.

OBJETIVO
Construir a interface que torna a revisão dupla julgável por um humano.

CRITÉRIOS DE ACEITAÇÃO
- As QUATRO colunas sempre visíveis (GPT R1, Claude R1, GPT R2,
  Claude R2), mesmo que a passagem não tenha rodado
- ★ Divergências NUNCA escondidas nem diluídas em média
- Cada divergência mostra: posição de cada modelo, evidência de cada
  lado, materialidade, botões Aceitar OpenAI / Aceitar Claude /
  Combinar / Adiar / Ver evidências
- Achados abertos com severidade em texto, não só cor
- Gates determinísticos visíveis com status
- ★ Botão APROVAR DESABILITADO quando:
    · existe finding critical com blocks_progress = true aberto, OU
    · algum gate determinístico está vermelho, OU
    · o subject_sha mudou desde a abertura do ciclo
  O motivo é explicado por aria-describedby
- Rejeitar exige justificativa
- Decisão grava approval com actor_type='human', subject_sha e timestamp
- Botão baixar Handoff Bundle (JSON + markdown)

allowed_paths:
  apps/control-plane/app/(app)/projetos/[id]/revisao/**
  apps/control-plane/features/review-chamber/**
  apps/control-plane/app/api/reviews/**
  apps/control-plane/app/api/disagreements/**
  apps/control-plane/app/api/approvals/**
  tests/review-chamber/**
```

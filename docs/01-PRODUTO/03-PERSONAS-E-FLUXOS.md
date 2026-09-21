# Personas e Fluxos de Usuário

---

## 1. Personas

### P1 — Roberth, o Operador (persona primária)

| | |
|---|---|
| **Objetivo** | Transformar ideias em aplicativos reais sem depender de uma equipe grande |
| **Contexto** | Trabalha do computador pessoal, com Antigravity local; também acessa o Control Plane pelo navegador |
| **Frustração** | Perder controle do que a IA fez; descobrir tarde que uma etapa estava errada |
| **O que precisa ver primeiro** | O que precisa da decisão dele, agora |
| **Autoridade** | Máxima. Aprova planos, etapas e releases |
| **Não quer** | Ler logs brutos de agente; ser obrigado a entender cada linha de código |

### P2 — Engenheiro Humano

| | |
|---|---|
| **Objetivo** | Auditar, intervir e corrigir o que os agentes produziram |
| **Precisa de** | Diff, PR, preview, findings, divergências, evidências e trilha de auditoria |
| **Frustração** | Ter que reconstruir o contexto do zero a cada intervenção |
| **Ferramenta central** | Câmara de Revisão e detalhe de execução |

### P3 — Agente Construtor (não humano, mas é usuário do sistema)

| | |
|---|---|
| **Objetivo** | Executar um Task Packet corretamente |
| **Precisa de** | Papel, `base_sha`, paths permitidos e proibidos, skills, permissões, budget, schema de saída |
| **Frustração** | Ambiguidade de escopo; instrução conflitante entre fontes |
| **Restrições** | Não vê produção, não amplia permissões, não chama outro fornecedor |

### P4 — Revisor de Segurança

| | |
|---|---|
| **Objetivo** | Garantir que nada perigoso chegue à produção |
| **Precisa de** | CODEOWNERS, matriz de permissões, testes de RLS, risk register, resultados de security scan |
| **Poder de veto** | Findings de severidade `critical` em categoria `security` bloqueiam progresso |

---

## 2. Fluxo principal: da ideia ao aplicativo publicado

```
[P1] Abre o Control Plane → página Início
     Vê "3 aguardando você"
           ↓
[P1] Projetos → Novo Projeto
     Passo 1 IDEIA: descreve o aplicativo, marca objetivos,
             escolhe template opcional
           ↓
[Sistema] Gera sugestões (recursos, tecnologias, agentes, tempo)
           ↓
[P1] Passo 2 PLANEJAMENTO: revisa o plano proposto, ajusta
           ↓
[Sistema] Cria Plan PR no GitHub, abre review_cycle
           ↓
[Agentes] GPT R1 → Claude R1 → GPT R2 → Claude R2
           ↓
[P1] Passo 3 REVISÃO: abre a Câmara de Revisão
     Vê as 4 colunas, as divergências e o veredicto
     Decide: APROVAR / PEDIR REVISÃO / REJEITAR
           ↓  (aprovado)
[Sistema] Provisiona GitHub + Supabase + Vercel
          Gera DAG de missões, etapas e tarefas
           ↓
[P1] Passo 4 IMPLEMENTAÇÃO: acompanha o Kanban e a Esteira
           ↓
[Agentes] Por etapa: implementa → revisa → repara → conclui
[Sistema] CI roda, previews nascem, R8 testa, R9 consolida
           ↓
[P1] Aprova cada etapa na Fila de Aprovações
           ↓
[Sistema] Merge protegido
           ↓
[P1] Passo 5 PUBLICAÇÃO: aprova o release
           ↓
[Sistema] production build → deployment checks → rolling release
           ↓
      APLICATIVO PUBLICADO
```

---

## 3. Fluxos secundários

### F2 — Intervenção do engenheiro

```
[P2] Monitoramento → vê erro em R4
       ↓
Abre a execução → lê eventos normalizados
       ↓
Abre logs detalhados sob demanda
       ↓
Abre o PR no GitHub / abre o preview no Vercel
       ↓
Decide: retry, cancelar run, pedir revisão ou corrigir à mão
       ↓
Registra a decisão (vira audit_event)
```

### F3 — Divergência não resolvida

```
Claude R2 conclui com divergência material aberta
       ↓
Veredicto: READY_FOR_HUMAN_APPROVAL + disagreement
   ou BLOCKED, conforme materialidade
       ↓
[P1] vê na Câmara de Revisão:
     SEC-18  GPT: medium  |  Claude: critical  |  NÃO RESOLVIDA
       ↓
[P1] escolhe a posição, combina as duas ou adia
       ↓
Resolução gravada: ACCEPTED_OPENAI | ACCEPTED_CLAUDE |
                   COMBINED | DEFERRED
```

### F4 — Edição humana do plano

```
[P1] edita o plano no Antigravity local
       ↓
O sistema classifica a mudança:
   MATERIAL (escopo, aceitação, arquitetura, schema, segurança,
             permissões, dependências, API pública, deploy, ordem)
       → novo SHA → NOVO CICLO de 4 passagens
   EDITORIAL (ortografia, formatação, descrição não normativa)
       → não dispara novo ciclo
```

### F5 — Falha de agente

```
Worker morre durante execução
       ↓
lease expira (lease_expires_at ultrapassado)
       ↓
job volta a ser elegível
       ↓
outro worker retoma com o mesmo idempotency_key
       ↓
efeitos externos já aplicados NÃO são duplicados
```

### F6 — Estouro de budget

```
Execução ultrapassa max_cost_usd ou max_wall_seconds
       ↓
Orchestrator interrompe o run
       ↓
Estado: BLOCKED_BUDGET
       ↓
Alerta em Monitoramento → Alertas
       ↓
[P1] decide ampliar o budget (ação humana) ou encerrar
       ↓
O AGENTE NUNCA amplia o próprio orçamento
```

---

## 4. Mapa de navegação

```
/login
/                         → Início (Dashboard)
/projetos                 → lista
/projetos/novo            → wizard (5 passos)
/projetos/:id             → detalhe
   /pipeline              (aba padrão)
   /visao-geral
   /arquivos
   /discussoes
   /configuracoes
   /revisao/:cycleId      → Câmara de Revisão
/agentes                  → catálogo
/agentes/:id              → detalhe
   /visao-geral /skills /prompt /ferramentas
   /execucoes /avaliacoes /configuracoes
/orquestracao             → Meus Fluxos
   /execucoes /biblioteca /agentes-disponiveis /historico
/orquestracao/:id/editor  → canvas
/conhecimento             → Base de Conhecimento
   /documentos /videos /tutoriais /faq /boas-praticas
/templates
/templates/:id
/integracoes
/integracoes/:id
/monitoramento
   /visao-geral /agentes /fluxos /recursos /logs /alertas /relatorios
/aprovacoes               → fila humana
/configuracoes
   /geral /equipe /seguranca /notificacoes
   /aparencia /faturamento /planos /avancado
```

# Decisões Congeladas (ADR Index)

Cada linha abaixo é uma decisão arquitetural **já tomada**. Agentes construtores **não podem reabrir** nenhuma delas sem uma tarefa humana explícita.

Formato: `ADR-nnn · Decisão · Por quê · Consequência · Status`

---

## Fundamentos

**ADR-001 — O humano operando Antigravity é a autoridade final, não o Antigravity**
*Por quê:* um modelo não pode, direta ou indiretamente, aprovar a própria alteração.
*Consequência:* toda liberação crítica é um evento `APPROVED_BY_HUMAN` com `user_id`, `approval_id`, `subject_sha` e `timestamp`.
*Status:* CONGELADA.

**ADR-002 — GitHub é a fonte da verdade do software; Supabase é a fonte da verdade da operação**
*Por quê:* separar o que é versionável do que é estado mutável elimina ambiguidade.
*Consequência:* logs gigantes e transcrições não viram commit. Migrations e planos não viram linha de banco.
*Status:* CONGELADA.

**ADR-003 — O Orchestrator é nosso, determinístico e independente de fornecedor**
*Por quê:* nenhum fornecedor deve ser dono do workflow.
*Consequência:* OpenAI e Anthropic são implementações do `AgentAdapter`, não o contrato.
*Status:* CONGELADA.

**ADR-004 — Todo agente é entidade potencialmente perigosa, mesmo tentando ajudar**
*Por quê:* agentes leem, escrevem, executam shell, instalam pacotes e usam rede.
*Consequência:* código gerado por agente nasce classificado `UNTRUSTED_GENERATED_CODE`.
*Status:* CONGELADA.

---

## Protocolo

**ADR-010 — Revisão dupla tem exatamente quatro passagens**
`OpenAI R1 → Claude R1 → OpenAI R2 → Claude R2`. `round > 4` é DENIED.
*Consequência:* elimina loop infinito e torna o custo previsível.
*Status:* CONGELADA.

**ADR-011 — A quarta passagem é conclusiva e não abre debate**
Saídas permitidas: `READY_FOR_HUMAN_APPROVAL`, `CHANGES_REQUIRED`, `BLOCKED`.
*Status:* CONGELADA.

**ADR-012 — Retry técnico ≠ passagem cognitiva**
`429`, `5xx` e falhas de rede não consomem rodada.
*Status:* CONGELADA.

**ADR-013 — O sistema não conta votos entre modelos**
Dois modelos concordando não transformam afirmação em verdade. Divergência é dado, não ruído.
*Status:* CONGELADA.

**ADR-014 — Mudança de `base_sha` material invalida o ciclo**
*Consequência:* novo SHA → novo `review_cycle`.
*Status:* CONGELADA.

**ADR-015 — Subagente cross-provider é proibido na v1**
Claude pode ter subagente Claude. Claude **não** chama OpenAI diretamente. Cross-provider sempre pelo Orchestrator.
*Por quê:* custo, rastreabilidade, autorização, profundidade, retry, idempotência, logs.
*Status:* CONGELADA.

---

## Código e execução

**ADR-020 — Um agente escritor, um workspace isolado, uma branch**
*Consequência:* proibido dois agentes no mesmo checkout.
*Status:* CONGELADA.

**ADR-021 — Autor ≠ juiz final**
Mudança material não pode ser validada exclusivamente pelo mesmo modelo que a produziu.
*Status:* CONGELADA.

**ADR-022 — Merge ≠ Release**
Duas decisões, dois gates.
*Status:* CONGELADA.

**ADR-023 — Nenhum coding agent recebe credencial de produção**
*Status:* CONGELADA.

**ADR-024 — Todo código relevante produzido por agente passa por preview verificável antes de produção**
*Status:* CONGELADA.

---

## Inteligência

**ADR-030 — Uma única inteligência normativa, várias projeções**
Fonte canônica: `factory-intelligence/`. `.agents/skills` e `.claude/skills` são projeções geradas.
*Consequência:* CI detecta drift entre canônico e projeção via manifesto com hash.
*Status:* CONGELADA.

**ADR-031 — `AGENTS.md` e `CLAUDE.md` são bootloaders curtos, não manuais**
*Por quê:* progressive disclosure; a cadeia de instruções do Codex tem limite agregado (~32 KiB).
*Status:* CONGELADA.

**ADR-032 — `Role ≠ Runtime ≠ Model ≠ Skill`**
*Consequência:* nenhum papel tem fornecedor fixo; modelos vivem em `models.yaml`.
*Status:* CONGELADA.

**ADR-033 — `factory-intelligence/**` é código privilegiado**
CODEOWNERS + revisão humana obrigatória. Nunca auto-merge.
*Por quê:* skill lida do repositório entra na trust boundary do agente.
*Status:* CONGELADA.

**ADR-034 — Conhecimento temporal não é memorizado; memoriza-se como reverificar**
APIs, preços, modelos, versões e recursos experimentais exigem consulta à fonte oficial.
*Status:* CONGELADA.

**ADR-035 — Quatro classes de conhecimento separadas**
Constituição (quase imutável) · Metodologia (moderada) · Conhecimento (temporal) · Continuidade (append/reconcile).
*Por quê:* evita que história acidental do projeto vire regra permanente.
*Status:* CONGELADA.

---

## Plataforma

**ADR-040 — Control Plane em Next.js App Router + TypeScript estrito, no Vercel**
*Status:* CONGELADA.

**ADR-041 — Componentes source-owned (shadcn/ui) sobre primitive congelada no projeto**
*Por quê:* o código dos componentes pertence ao projeto, essencial quando agentes o mantêm.
*Status:* CONGELADA.

**ADR-042 — Design tokens em três níveis: primitivo → semântico → componente**
*Status:* CONGELADA.

**ADR-043 — Edge Functions apenas para ingestão curta, auth e comandos rápidos**
Nunca como runtime de agente longo (limites de wall-clock e CPU).
*Status:* CONGELADA.

**ADR-044 — Filas persistentes com lease explícito, não `status = running`**
Campos: `lease_owner`, `lease_acquired_at`, `lease_expires_at`, `attempt`, `max_attempts`, `next_attempt_at`, `idempotency_key`.
*Status:* CONGELADA.

**ADR-045 — GitHub App própria da fábrica, com identidades separadas**
`rns-control-app`, `rns-worker-app`, `rns-release-service`. Tokens de instalação expiram em 1 hora e são escopáveis por repositório e permissão.
*Status:* CONGELADA.

**ADR-046 — WIF/OIDC preferido a API key permanente**
*Status:* CONGELADA onde o fornecedor oferecer.

**ADR-047 — RLS habilitada em toda tabela exposta, com testes de negação**
Chave `sb_publishable_` pode ir ao navegador; `sb_secret_` nunca.
*Status:* CONGELADA.

**ADR-048 — Preview do Supabase não recebe dados de produção**
*Status:* CONGELADA (e é comportamento padrão da plataforma).

**ADR-049 — `preview_pair_ready` exige ambos os eventos**
Não declarar preview pronto com um único evento do Vercel (existe condição de corrida com a injeção de variáveis).
*Status:* CONGELADA.

**ADR-050 — Cada aplicativo produzido nasce com repositório, Supabase e Vercel próprios**
*Status:* CONGELADA.

---

## Ordem de construção

**ADR-060 — Fase 1 entrega o aplicativo funcional com agentes mockados**
*Por quê:* provar o motor determinístico antes de adicionar probabilismo.
*Status:* CONGELADA por decisão do proprietário.

**ADR-061 — Fase 2 troca mock por adapters reais sem mudar o domínio**
*Consequência:* o `AgentAdapter` deve ser desenhado na Fase 1 já pensando nisso.
*Status:* CONGELADA.

**ADR-062 — Fase 3 é o refinamento visual, feito pela própria fábrica**
*Status:* CONGELADA.

---

## Itens deliberadamente NÃO congelados

| Item | Por que fica aberto | Como decidir |
|---|---|---|
| Motor de workflow durável definitivo | Depende de carga real | Benchmark na Fase 1 |
| Modelos específicos | Mudam rápido | `models.yaml`, nunca código |
| Limites de retry, lease TTL, budgets | Precisam de dados | Após benchmark |
| Thresholds de eval | Precisam de baseline | Após Fase 4 |
| Planos e custos de contas | Depende de volume | Após dimensionar |

---

## Pendências detalhadas (PEN)

Cada item acima abre uma frente; esta tabela fecha o compromisso com prazo e default — herdada e reconciliada da Pasta Mãe Mestre v1.0. Um default proposto **não é** uma decisão congelada: é o que a fábrica faz se ninguém decidir antes do prazo.

| ID | Decisão pendente | Prazo de decisão | Default proposto |
|---|---|---|---|
| PEN-001 | Provedor do worker externo | Antes da Fase 3 | Container Node.js em ambiente com jobs longos |
| PEN-002 | Runtime OpenAI inicial | Início da Fase 3 | Adapter próprio; Agents SDK/Agents API conforme prova técnica |
| PEN-003 | Runtime Claude inicial | Início da Fase 5 | Claude Code/Managed Agents atrás do mesmo contrato `AgentAdapter` |
| PEN-004 | Uso de Inngest/Temporal | Após benchmark da máquina de estados (mesmo benchmark do item "Motor de workflow durável") | Supabase Queues + worker primeiro |
| PEN-005 | Primitive do shadcn/ui | Antes da amplificação visual (Fase 3) | Congelar a opção suportada no scaffold escolhido |
| PEN-006 | Nomenclatura final R1–R9 | Antes de expor o registry na UI | Usar papéis sem amarrá-los a fornecedor |
| PEN-007 | Planos comerciais dos provedores (mesmo item "Planos e custos de contas") | Antes de produção | Dimensionar com métricas do piloto |
| PEN-008 | Política de retenção | Antes de dados reais | Separar auditoria, logs, artefatos e prompts |
| PEN-009 | Integração automática do Antigravity | Após o loop funcional (fim da Fase 1) | Handoff bundle manual/local primeiro |

## Questões que exigem validação humana antes de lançar

Estas perguntas não têm default proposto porque a resposta muda a superfície de risco e de dados da fábrica. Nenhum agente construtor pode respondê-las por conta própria.

- Público inicial: uso interno da RNS ou produto multiempresa desde o primeiro lançamento?
- Que tipos de aplicativos a primeira versão poderá gerar?
- Qual dado pode ser enviado a OpenAI, Anthropic ou Google?
- Quais ações exigirão sempre aprovação humana, independentemente do risco calculado?
- Haverá cobrança a terceiros no primeiro lançamento?
- Em quais regiões os dados e workloads poderão residir?

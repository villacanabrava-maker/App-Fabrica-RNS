# LEIA PRIMEIRO — Pacote Mestre de Construção da Fábrica Apps RNS

**Versão do pacote:** 2.0 (fusão)
**Data de emissão original:** 20–21 de setembro de 2026 · **Data da fusão:** 21 de setembro de 2026
**Proprietário:** Roberth Naninne de Souza (RNS)
**Destinatário:** equipe de engenharia humana + agentes construtores (Google Antigravity, OpenAI Codex/ChatGPT, Claude Code)

---

## 0. Origem: este é um pacote fundido

Este `docs/` é o resultado da fusão de dois pacotes entregues no mesmo projeto, com poucas horas de diferença:

1. **Pasta Mãe Mestre v1.0** — primeira consolidação, com resumo executivo, matriz de rastreabilidade e manifesto de integridade.
2. **Documentação Mestre** — evolução da mesma base (mesmas pesquisas originais, mesmas dez telas de referência), com especificações de página muito mais detalhadas, um capítulo dedicado à Inteligência dos Agentes (constituição, registry R1–R9, protocolo de revisão dupla), biblioteca de prompts por ferramenta e o código inicial (`11-CODIGO-INICIAL/`, agora vivendo na raiz do repositório).

A fusão manteve a Documentação Mestre como espinha dorsal — por ser estritamente mais completa em toda sobreposição verificada — e trouxe da Pasta Mãe Mestre o que ela tinha de exclusivo e ainda não coberto: `04-MATRIZ-DE-RASTREABILIDADE.md` e `05-MANIFESTO-DO-PACOTE.md` (nesta pasta), as pendências detalhadas com prazo/default em `01-PRODUTO/04-DECISOES-CONGELADAS.md`, e o catálogo centralizado de ações/ícones em `03-PAGINAS/11-CATALOGO-DE-ACOES-E-ICONES.md`. Nenhum conteúdo foi importado cru: cada peça herdada foi revisada e religada às referências de caminho deste repositório (`docs/...`, `factory-intelligence/...`, `packages/...`).

## 1. O que é este pacote

Esta pasta é a **fonte única de verdade** para construir a **Fábrica Apps RNS**.

Ela foi montada a partir de quatro documentos de pesquisa aprofundada já produzidos no projeto e de dez telas de referência visual do produto, mais verificação em fontes oficiais (Next.js, Supabase, Vercel, GitHub, OpenAI, Anthropic) em 20 de setembro de 2026.

O objetivo é simples e literal:

> **Qualquer programador competente deve conseguir pegar esta pasta, ler na ordem indicada e construir o aplicativo inteiro sem precisar inventar arquitetura.**

Este pacote **não é um conjunto de ideias**. É uma **especificação congelada**. Onde algo ainda não foi decidido, está escrito `UNSPECIFIED` com o critério de como decidir. Onde algo já foi decidido, está escrito como decisão e **não deve ser reaberto pelos agentes construtores**.

---

## 2. O que é a Fábrica Apps RNS (em uma frase)

> A Fábrica Apps RNS é um **Control Plane de engenharia de software multiagente**: um aplicativo web no qual uma ideia vira especificação, a especificação vira plano, o plano é revisado em ciclo cruzado por OpenAI e Claude, um ser humano aprova, agentes implementam em branches isoladas do GitHub, Supabase e Vercel geram ambientes de preview verificáveis, e só então o software é liberado para produção.

Ela **não** é um chat com três IAs. Ela é o sistema que **governa** três IAs.

---

## 3. As cinco verdades que nunca mudam

Estes cinco axiomas atravessam todos os documentos deste pacote. Se algum documento parecer contradizê-los, o documento está errado.

| # | Axioma | Significado prático |
|---|---|---|
| 1 | **Soberania humana** | Nenhum modelo aprova a própria mudança. Toda liberação crítica é um evento `APPROVED_BY_HUMAN` assinado com `user_id`, `approval_id`, `sha` e `timestamp`. |
| 2 | **GitHub é a verdade do software** | Código, migrations, planos versionados, inteligência dos agentes e evidências duráveis vivem no Git. |
| 3 | **Supabase é a verdade da operação** | Estado, filas, execuções, eventos, custos, aprovações e auditoria vivem no Postgres da fábrica. Nunca na memória de uma conversa. |
| 4 | **O Orchestrator é determinístico** | Os modelos sugerem; somente o Orchestrator efetiva transições de estado. Não existe "o GPT decidiu chamar o Claude". |
| 5 | **Evidência antes de afirmação** | "Pronto", "testado", "seguro" e "publicável" exigem artefato verificável: diff, teste, check, preview, screenshot ou decisão humana. |

---

## 4. A ordem de construção decidida

Esta é a decisão mais importante do plano de implementação e foi tomada pelo proprietário do projeto:

```
FASE 1 — O APLICATIVO FUNCIONA
   As 9 páginas existem, com dados reais, autenticação,
   estado persistente, filas e máquinas de estado.
   Os agentes são SIMULADOS (mock adapters determinísticos).
   Nada de IA real ainda.
              ↓
FASE 2 — OS AGENTES SÃO REAIS
   Troca-se o mock adapter por OpenAI Adapter e Claude Adapter.
   O ciclo de revisão dupla GPT R1 → Claude R1 → GPT R2 → Claude R2
   passa a rodar de verdade, com human gate.
              ↓
FASE 3 — A FÁBRICA REFINA A SI MESMA
   Só agora entra o refinamento visual completo, o design system
   maduro, animações, acessibilidade AAA onde couber e polimento.
   E o refinamento é feito PELA PRÓPRIA FÁBRICA, usando os agentes
   que passaram a funcionar na Fase 2.
```

A razão é estratégica: **um aplicativo bonito que não funciona não pode construir nada. Um aplicativo funcional e feio pode construir a própria beleza.**

Detalhes completos em `08-PLANO-DE-IMPLEMENTACAO/01-PLANO-MESTRE-DE-IMPLEMENTACAO.md`.

---

## 5. Ordem de leitura recomendada

### Para o programador que vai construir

1. `00-COMECE-AQUI/` — este arquivo, índice e glossário
2. `01-PRODUTO/01-DOCUMENTO-MESTRE-DO-APLICATIVO.md` — **o documento mãe**, leia inteiro
3. `02-ARQUITETURA/01-ARQUITETURA-DO-SISTEMA.md`
4. `02-ARQUITETURA/03-ARQUITETURA-BACKEND.md` e `04-MODELO-DE-DADOS.md`
5. `02-ARQUITETURA/02-ARQUITETURA-FRONTEND.md` e `08-DESIGN-SYSTEM-RNS.md`
6. `03-PAGINAS/` — um documento por página, na ordem de construção
7. `04-PLATAFORMAS/` — Supabase, GitHub, Vercel, provedores de IA e a integração entre todos
8. `05-SEGURANCA/` — obrigatório antes de escrever a primeira migration
9. `08-PLANO-DE-IMPLEMENTACAO/` — o roteiro sprint a sprint
10. O código inicial já está na raiz do repositório (`factory-intelligence/`, `supabase/`, `packages/contracts/`, `design-system/`) — comece por lá

### Para o operador (Roberth)

1. Este arquivo
2. `01-PRODUTO/01-DOCUMENTO-MESTRE-DO-APLICATIVO.md`
3. `08-PLANO-DE-IMPLEMENTACAO/01-PLANO-MESTRE-DE-IMPLEMENTACAO.md`
4. `09-PROMPTS/` — os prompts prontos para colar no Antigravity, ChatGPT e Claude Code
5. `10-CHECKLISTS/` — para conferir se cada fase realmente terminou

### Para os agentes construtores

Leiam, nesta ordem de autoridade:
1. `/AGENTS.md` ou `/CLAUDE.md` na raiz do repositório (bootloader do seu runtime)
2. `factory-intelligence/constitution/CONSTITUTION.md` (= `06-INTELIGENCIA-DOS-AGENTES/01-CONSTITUICAO.md`)
3. `05-SEGURANCA/02-PERMISSOES-E-POLITICAS.md`
4. O Task Packet da execução corrente
5. O documento da página em `03-PAGINAS/` correspondente à tarefa

---

## 6. O que este pacote contém

| Pasta | Conteúdo |
|---|---|
| `00-COMECE-AQUI` | Este arquivo, índice geral, glossário e manual de uso |
| `01-PRODUTO` | Documento mãe, product spec, personas, fluxos e decisões congeladas |
| `02-ARQUITETURA` | Sistema, front-end, back-end, dados, estados, eventos, contratos e design system |
| `03-PAGINAS` | **Um documento por página**, front-end ícone a ícone + back-end + APIs + DoD |
| `04-PLATAFORMAS` | Supabase, GitHub, Vercel, OpenAI/Anthropic, Antigravity e a integração de todos |
| `05-SEGURANCA` | Modelo de segurança, permissões, RLS e risk register |
| `06-INTELIGENCIA-DOS-AGENTES` | Constituição, registry R1–R9, skills, protocolo de revisão dupla, Task Packet e evals |
| `07-QUALIDADE` | Testes, CI/CD, acessibilidade, performance e observabilidade |
| `08-PLANO-DE-IMPLEMENTACAO` | Plano mestre faseado, sprints e Definition of Done |
| `09-PROMPTS` | Prompts personalizados para Antigravity, ChatGPT/Codex e Claude Code |
| `10-CHECKLISTS` | Checklists operacionais por fase, por página e de segurança |
| `99-REFERENCIAS-ORIGINAIS` | As quatro pesquisas originais e as dez telas de referência |

> `11-CODIGO-INICIAL` já foi aplicado: não é mais uma pasta dentro de `docs/`. Seu conteúdo vive na raiz do repositório em `factory-intelligence/`, `supabase/`, `packages/contracts/`, `design-system/` e `.github/workflows/`, exatamente como a seção 8 (Ordem de aplicação) do antigo `11-CODIGO-INICIAL/README.md` instruía. `factory-intelligence/constitution/CONSTITUTION.md` e `SECURITY.md` — referenciados pelos bootloaders mas ausentes dos dois pacotes originais — foram preenchidos a partir de `06-INTELIGENCIA-DOS-AGENTES/01-CONSTITUICAO.md` e `05-SEGURANCA/01-MODELO-DE-SEGURANCA.md` durante a fusão. `factory-intelligence/methodology/` continua `UNSPECIFIED` (ver `factory-intelligence/methodology/README.md`).

---

## 7. Convenções deste pacote

- **Idioma:** português do Brasil na documentação; **inglês** em código, nomes de tabelas, colunas, eventos, estados e identificadores.
- **`UNSPECIFIED`** significa: decisão pendente e **proibido inventar valor**. O documento diz como decidir.
- **`DECISÃO CONGELADA`** significa: já decidido; o agente construtor não pode alterar sem tarefa humana explícita.
- **Datas e versões de fornecedores** foram verificadas em 20/09/2026 e podem mudar. Todo documento que depende disso traz um bloco `VERIFICAR ANTES DE USAR`.
- **Nenhum nome de modelo de IA é fixado em código.** Modelos vivem em `factory-intelligence/registry/models.yaml`.

---

## 8. Como pedir mudanças neste pacote

Este pacote é versionado como código. Alterações seguem o mesmo rito do software:

```
proposta de mudança
      ↓
PR no repositório da fábrica
      ↓
revisão (humana obrigatória para 05-SEGURANCA e 06-INTELIGENCIA)
      ↓
merge
      ↓
nova versão do pacote
```

Nenhum agente construtor pode alterar `05-SEGURANCA/`, `06-INTELIGENCIA-DOS-AGENTES/` ou `01-PRODUTO/04-DECISOES-CONGELADAS.md` sem uma tarefa humana específica para isso.

---

## 9. O primeiro marco que prova tudo

Antes de qualquer ambição maior, a fábrica precisa provar **um único circuito completo**:

```
Roberth escreve uma ideia no Control Plane
        ↓
o sistema cria um projeto, uma missão e uma etapa
        ↓
o Orchestrator cria um Task Packet
        ↓
o agente (mock na Fase 1, real na Fase 2) executa
        ↓
um artefato estruturado é gravado
        ↓
o ciclo de revisão roda e termina
        ↓
uma aprovação humana é registrada com assinatura lógica
        ↓
um PR existe no GitHub
        ↓
um preview existe no Vercel com banco Supabase próprio
        ↓
o merge acontece somente após os checks
```

Quando esse circuito funcionar **uma vez, de ponta a ponta, sem intervenção manual fora dos gates**, a Fábrica Apps RNS existe. Tudo depois disso é escala.

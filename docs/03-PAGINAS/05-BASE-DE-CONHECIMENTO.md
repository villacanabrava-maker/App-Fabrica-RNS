# Página 05 — Base de Conhecimento

---

## 1. Identidade

| | |
|---|---|
| **Rotas** | `/conhecimento` · `/conhecimento/:id` · `/conhecimento/categorias/:slug` |
| **Ícone da navegação** | `knowledge` |
| **Título** | "Base de Conhecimento" |
| **Subtítulo** | "Centralize, organize e compartilhe todo o conhecimento da sua equipe." |
| **Fase** | `[F1]` completa exceto o assistente · `[F2]` assistente de conhecimento |
| **Permissão mínima** | `viewer` |

---

## 2. Objetivo

```
O que a fábrica sabe?
Onde aprendo a usar isso?
De onde os agentes tiram contexto?
Como contribuo com o que descobri?
```

### ★ A separação que a página precisa respeitar

Existem **duas** bases de conhecimento no sistema, com propósitos diferentes:

| | Base de Conhecimento (esta página) | Factory Intelligence (`factory-intelligence/`) |
|---|---|---|
| **Público** | Pessoas | Agentes |
| **Conteúdo** | Tutoriais, guias, FAQ, boas práticas, casos de uso | Constituição, metodologia, skills, protocolos, schemas |
| **Onde vive** | `factory.knowledge_items` no Supabase | Repositório Git, sob CODEOWNERS |
| **Quem edita** | Qualquer `engineer`, pela interface | Somente por PR revisado |
| **Autoridade normativa** | Nenhuma | Máxima |

Um documento desta página **nunca** vira regra para um agente. Se algo aqui precisa virar regra, alguém abre um PR em `factory-intelligence/`.

Um aviso discreto no editor deve informar isso.

---

## 3. Anatomia

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Base de Conhecimento                    [⤒ Importar] [+ Novo Conteúdo]   │
│ Centralize, organize e compartilhe todo o conhecimento da sua equipe.    │
├──────────────────────────────────────────────────────────────────────────┤
│ 📖Visão Geral │ 📄Documentos │ 🎬Vídeos │ ▶Tutoriais │ ❓FAQ │ 💡Boas Prát.│
├──────────────────────────────────────────────────────────────────────────┤
│ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐             │
│ │📖 128      │ │👥 24       │ │🗂 12       │ │⭐ 4.9      │             │
│ │ Conteúdos  │ │Colaborador.│ │ Categorias │ │ Avaliação  │             │
│ │↑12% mês    │ │↑3 novos    │ │↑2 este mês │ │↑98% úteis  │             │
│ └────────────┘ └────────────┘ └────────────┘ └────────────┘             │
├──────────────────────────────────────────────────────────────────────────┤
│ 🔍 Buscar na base de conhecimento... │Todas categ.▾│Mais recentes▾│⚙Filtr│
├──────────────────────────────────────────────────────────────────────────┤
│ ✨ CONTEÚDOS RECOMENDADOS PARA VOCÊ                        Ver todos →   │
│ Com base nos seus projetos e agentes ativos.                             │
│ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐             │
│ │[Tutorial]  │ │[Documento] │ │[Boas Prát.]│ │[Vídeo]     │             │
│ │  ⏰8 min   │ │  ⏰5 min   │ │  ⏰10 min  │ │  ⏰12 min  │             │
│ │ [thumb]    │ │ [thumb]    │ │ [thumb]    │ │ [thumb]    │             │
│ │Como criar  │ │Guia de     │ │Estrutura   │ │Deploy na   │             │
│ │um agente   │ │integração  │ │ideal de um │ │Vercel em   │             │
│ │passo a     │ │com Supabase│ │prompt      │ │5 minutos   │             │
│ │passo       │ │            │ │eficiente   │ │            │             │
│ │👁1.2k 👍98 │ │👁856 👍64  │ │👁1.5k 👍112│ │👁2.1k 👍189│             │
│ └────────────┘ └────────────┘ └────────────┘ └────────────┘             │
├───────────────────────────────────────────────────┬──────────────────────┤
│ CATEGORIAS                          Ver todas →   │ ✨ ASSISTENTE DE     │
│ ┌────────┐┌────────┐┌────────┐┌────────┐          │    CONHECIMENTO      │
│ │🚀Comece││🧠Agentes││<>Desenv││☁Implant││          │ Pergunte sobre      │
│ │ Aqui   ││ de IA  ││olvimen.││ação    ││          │ qualquer assunto.   │
│ │12 cont.││18 cont.││18 cont.││14 cont.││          │ ┌──────────────────┐│
│ │      → ││      → ││      → ││      → ││          │ │Ex.: Como integrar││
│ └────────┘└────────┘└────────┘└────────┘          │ │Supabase?         ││
│ ┌────────┐┌────────┐┌────────┐┌────────┐          │ └──────────────────┘│
│ │📊Negóc.││💡Casos ││🔧Troubl││⋯Outros ││          │ [🔍Perguntar à IA]  │
│ │10 cont.││16 cont.││12 cont.││8 cont. ││          ├──────────────────────┤
│ │      → ││      → ││      → ││      → ││          │ 🔥 TÓPICOS EM ALTA  │
│ └────────┘└────────┘└────────┘└────────┘          │ 1 Criação de agentes→│
├───────────────────────────────────────────────────┤ 2 Integração Supab. →│
│ CONTEÚDOS RECENTES                                │ 3 Deploy na Vercel  →│
│ Título          │Categoria │Autor   │Data │Views  │ 4 Boas práticas     →│
│ 📄Como otimizar │Boas Prát.│CM Carla│06/09│👁342 ⋯│ 5 Configuração email→│
│ 📄Integração    │Desenvolv.│RL Rafael│05/09│👁521 ⋯├──────────────────────┤
│ 📙Modelos prompt│Agentes IA│JS João │04/09│👁892 ⋯│ 💡 CONTRIBUA COM A   │
│ 📄Checklist     │Implantaç.│MC Mari.│03/09│👁276 ⋯│    BASE              │
│ 📙Estudo de caso│Casos Uso │PA Pedro│02/09│👁654 ⋯│ [+ Adicionar Conteúdo]│
└───────────────────────────────────────────────────┴──────────────────────┘
```

---

## 4. Inventário de ícones

| Ícone | Onde | Nome | Ação | Rótulo | Fase |
|---|---|---|---|---|---|
| 📖 | sidebar | `knowledge` | `/conhecimento` | "Base de Conhecimento" | F1 |
| ⤒ | topo | `upload` | abre importador (markdown, PDF, URL) | "Importar conteúdo" | F1 |
| + | topo | `plus` | abre editor de conteúdo | "Novo conteúdo" | F1 |
| 📖 | aba Visão Geral | `knowledge` | muda aba | "Visão geral" | F1 |
| 📄 | aba Documentos | `file` | muda aba | "Documentos" | F1 |
| 🎬 | aba Vídeos | `video` | muda aba | "Vídeos" | F1 |
| ▶ | aba Tutoriais | `play` | muda aba | "Tutoriais" | F1 |
| ❓ | aba FAQ | `help` | muda aba | "Perguntas frequentes" | F1 |
| 💡 | aba Boas Práticas | `lightbulb` | muda aba | "Boas práticas" | F1 |
| 👥 | KPI Colaboradores | `agents` | decorativo | `aria-hidden` | F1 |
| 🗂 | KPI Categorias | `folder` | decorativo | `aria-hidden` | F1 |
| ⭐ | KPI Avaliação média | `star` | decorativo | "avaliação média 4.9" | F1 |
| 🔍 | busca | `search` | foca | "Buscar na base" | F1 |
| ✨ | Recomendados / Assistente | `sparkles` | decorativo | `aria-hidden` | F1 |
| ⏰ | tempo de leitura | `clock` | decorativo | "8 minutos de leitura" | F1 |
| 👁 | visualizações | `eye` | decorativo | "1.200 visualizações" | F1 |
| 👍 | curtidas | `thumbs-up` | **alterna curtida** | "Curtir, 98 curtidas" | F1 |
| → | categorias e tópicos | `arrow-right` | navega | dentro do link | F1 |
| 🚀🧠<>☁📊💡🔧⋯ | ícones de categoria | `Icon` por categoria | abre categoria | nome da categoria | F1 |
| 🔥 | Tópicos em alta | `fire` | decorativo | `aria-hidden` | F1 |
| 🔍 | Perguntar à IA | `search` | dispara consulta | "Perguntar para a IA" | F2 |
| 📄/📙 | tipo do conteúdo na tabela | `file`/`book` | abre conteúdo | tipo + título | F1 |
| ⋯ | linha da tabela | `more` | Editar, Duplicar, Mover, Arquivar | "Mais ações" | F1 |
| avatar CM/RL/JS | autor | `Avatar` | filtra por autor | nome do autor | F1 |

---

## 5. Componentes

`PageHeader` · `Tabs` · `KpiCard` ×4 · `FilterBar` · `KnowledgeCard` · `CategoryCard` · `DataTable` · `AssistantPanel` · `TrendingList` · `ContributeCard` · `MarkdownRenderer` · `TableOfContents` · `AsyncBoundary`

---

## 6. Dados exibidos

| Elemento | Origem |
|---|---|
| Conteúdos | `factory.knowledge_items` |
| Colaboradores | distinct `author_id` |
| Categorias | `factory.knowledge_categories` |
| Avaliação média | média de avaliações (`UNSPECIFIED` até existir tabela de rating — na Fase 1 exibir "—") ★ |
| Recomendados | `[F1]` categorias das tecnologias do projeto ativo; `[F2]` busca semântica |
| Views / likes | `knowledge_items.views` / `.likes` |
| Tempo de leitura | `reading_minutes`, calculado a ~200 palavras/min na gravação |
| Tópicos em alta | itens com maior crescimento de views em 7 dias |
| Conteúdos recentes | order by `published_at desc` |

★ Nenhum KPI exibe valor fictício. Se a métrica ainda não existe, mostra "—" com tooltip explicando.

---

## 7. Interações

| Interação | Comportamento |
|---|---|
| Criar conteúdo | Editor markdown com preview lado a lado, categoria, tipo, tags, anexos |
| Importar | Aceita `.md`, `.pdf`, URL. PDF extrai texto; URL busca e converte. Sempre revisável antes de salvar |
| Curtir | Otimista, com rollback em erro. Uma curtida por usuário por item |
| Buscar | Full-text em título e conteúdo. `[F2]` busca híbrida (texto + semântica) |
| Perguntar à IA | `[F2]` responde **citando os documentos usados**, com link. Se não achar fonte, diz que não sabe — não inventa ★ |
| Mover conteúdo | Troca a categoria; atualiza contadores |
| Arquivar | Não apaga; sai das listas |

★ **Regra do assistente:** resposta sem fonte é proibida. O assistente cita `knowledge_items` usados ou declara ausência de informação.

---

## 8. Estados

| Estado | Comportamento |
|---|---|
| Loading | Skeleton de cards e linhas |
| Empty (base vazia) | "Sua base está vazia." + "Criar primeiro conteúdo" + "Importar" + sugestão de categorias iniciais |
| Empty (busca) | "Nada encontrado para X." + sugestões próximas + "Criar conteúdo sobre X" |
| Empty (recomendados) | Bloco some silenciosamente; não mostra caixa vazia |
| Error | Por bloco |
| Partial | Lista carregou, tópicos em alta não |
| Forbidden | `viewer` lê tudo; não vê botões de criação/edição |

---

## 9–10. Rotas e endpoints

```
GET    /api/knowledge?kind=&category=&q=&sort=&page=
GET    /api/knowledge/:id
POST   /api/knowledge
PATCH  /api/knowledge/:id
POST   /api/knowledge/:id/archive
POST   /api/knowledge/:id/like
POST   /api/knowledge/import           md | pdf | url
GET    /api/knowledge/categories
POST   /api/knowledge/categories
GET    /api/knowledge/trending?period=7d
GET    /api/knowledge/recommended
POST   /api/knowledge/ask              [F2] { question } → { answer, sources[] }
```

---

## 11. Tabelas

`factory.knowledge_items` · `factory.knowledge_categories` · `factory.apps` (para recomendação) · `governance.audit_events`

Índices necessários:
```sql
create index on factory.knowledge_items using gin (to_tsvector('portuguese', title || ' ' || coalesce(content_md,'')));
create index on factory.knowledge_items (organization_id, kind, published_at desc);
```

---

## 12. Eventos

```
knowledge.item_created · knowledge.item_updated
knowledge.item_archived · knowledge.item_viewed
knowledge.import_completed · knowledge.import_failed
```

Realtime é opcional aqui; a página tolera dados com alguns segundos de atraso.

---

## 13. Permissões

| Ação | Papel mínimo |
|---|---|
| Ler | `viewer` |
| Curtir | `viewer` |
| Criar e editar conteúdo próprio | `engineer` |
| Editar conteúdo de outro | `admin` |
| Criar categoria | `admin` |
| Arquivar | `admin` |
| Importar | `engineer` |

---

## 14. Acessibilidade

- Conteúdo em markdown renderizado com hierarquia de cabeçalhos correta (`h1` único, sem pular níveis).
- Sumário lateral (`TableOfContents`) com links âncora e `aria-label="Sumário do documento"`.
- Vídeos exigem legendas ou transcrição. Item de vídeo sem transcrição é marcado como incompleto.
- Cards de conteúdo são links completos, com nome acessível: "Tutorial: Como criar um agente passo a passo, 8 minutos de leitura".
- Botão de curtir anuncia o novo estado via `aria-pressed`.
- Busca com `role="search"` e resultados anunciados por `aria-live`.

---

## 15. Performance

- Markdown renderizado no servidor.
- Imagens e thumbnails via `next/image` com lazy loading.
- Busca com debounce de 300ms.
- Lista paginada em 20 itens.
- Contador de views incrementado de forma assíncrona, sem bloquear a renderização.

---

## 16. Fase

`[F1]` tudo exceto o assistente e a busca semântica.
`[F2]` assistente com citação de fontes, busca híbrida, recomendação por embeddings.
`[F3]` refinamento visual dos cards e do leitor.

---

## 17. Definition of Done

```
□ Aviso de que esta base NÃO é normativa para agentes
□ As seis abas funcionando com filtro por tipo
□ Editor markdown com preview e anexos
□ Importação de md, pdf e URL com revisão antes de salvar
□ Busca full-text em português configurada
□ Curtida idempotente por usuário
□ Métrica inexistente mostra "—", nunca valor fictício
□ Sumário automático em documentos longos
□ Vídeo sem transcrição marcado como incompleto
□ Markdown sanitizado (sem HTML arbitrário executável)
□ axe sem violações no leitor e nas listas
□ Playwright: criar conteúdo → buscar → abrir → curtir
```

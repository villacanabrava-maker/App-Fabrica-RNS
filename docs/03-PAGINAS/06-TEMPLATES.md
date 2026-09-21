# Página 06 — Templates

---

## 1. Identidade

| | |
|---|---|
| **Rotas** | `/templates` · `/templates/:id` |
| **Ícone da navegação** | `templates` |
| **Título** | "Templates" |
| **Subtítulo** | "Comece mais rápido com templates prontos e personalizáveis." |
| **Fase** | `[F1]` catálogo e detalhe · `[F2]` "Usar template" provisiona de verdade |
| **Permissão mínima** | `viewer` |

---

## 2. Objetivo

```
De que ponto de partida posso criar um aplicativo?
O que exatamente vem dentro deste template?
Com que tecnologias ele já vem configurado?
Posso criar meu próprio template?
```

### ★ O que um template realmente é

Um template **não é uma imagem bonita**. Ele é um **Golden Repository Template**: um repositório real que será clonado no provisionamento, contendo:

```
estrutura de pastas do aplicativo
migrations iniciais do Supabase
configuração do Vercel
workflows do GitHub (CI)
AGENTS.md e CLAUDE.md do app produzido
docs/ com architecture.md, product-spec.md, data-model.md
testes de fumaça
seeds sintéticos (NUNCA dados reais)
```

Se um template não tem repositório associado, ele é apenas um rascunho e **não pode** ser usado para criar projeto. A interface deve deixar isso visível.

---

## 3A. Anatomia — Catálogo `/templates`

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Templates                                            [+ Novo Template]   │
│ Comece mais rápido com templates prontos e personalizáveis.              │
├──────────────────────────────────────────────────────────────────────────┤
│ Todos │🌐Web Apps │📱Apps Mobile │🛒E-commerce │❤Saúde │🎓Educação │      │
│ 📊Produtividade │⋯Outros                                                 │
├──────────────────────────────────────────────────────────────────────────┤
│ 🔍Buscar templates...│Todas categorias▾│Mais recentes▾│⚙Filtros          │
├───────────────────────────────────────────────────┬──────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐               │      [Mais popular]  │
│ │[thumb]  │ │[thumb]  │ │[thumb]  │               │ ┌──────────────────┐ │
│ │🎓Sistema│ │🛒E-comm.│ │❤App de  │               │ │   [preview]      │ │
│ │de Gestão│ │Completo │ │Saúde    │               │ └──────────────────┘ │
│ │Escolar  │ │         │ │         │               │ 🎓 Sistema de Gestão │
│ │Platafor.│ │Loja vir.│ │Agendam. │               │    Escolar           │
│ │completa │ │completa │ │consultas│               │ Por Fábrica Apps RNS │
│ │[Educaç.]│ │[E-comm.]│ │[Saúde]  │               │ ⭐4.9 (1.2k downloads)│
│ │[Web App]│ │[Web App]│ │[Mobile] │               ├──────────────────────┤
│ │⤓1.2k♥98 │ │⤓980 ♥76 │ │⤓856 ♥64 │               │Visão Geral│Funcional.│
│ │[Usar →] │ │[Usar →] │ │[Usar →] │               │Tecnologias│Suporte   │
│ └─────────┘ └─────────┘ └─────────┘               ├──────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐               │ Template completo    │
│ │📊Dashbo.│ │📖Platafo│ │✓Gestão  │               │ para gestão escolar, │
│ │Analítico│ │de Cursos│ │de Tarefas│              │ com painel admin...  │
│ │⤓743 ♥52 │ │⤓690 ♥48 │ │⤓612 ♥37 │               │ ✓Painel admin        │
│ │[Usar →] │ │[Usar →] │ │[Usar →] │               │ ✓Gestão de alunos    │
│ └─────────┘ └─────────┘ └─────────┘               │ ✓Controle financeiro │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐               │ ✓Relatórios          │
│ │👤Portfó.│ │📣Landing│ │🍔App de │               │ ✓Responsivo          │
│ │Pessoal  │ │Page     │ │Delivery │               │ ✓Pronto p/ personal. │
│ │⤓520 ♥41 │ │⤓498 ♥33 │ │⤓450 ♥29 │               │ Tecnologias          │
│ │[Usar →] │ │[Usar →] │ │[Usar →] │               │ (N)Next.js (⚛)React  │
│ └─────────┘ └─────────┘ └─────────┘               │ (TS)TypeScript       │
│                                                   │ (⚡)Supabase          │
│                                                   │ (~)Tailwind (◫)shadcn│
│                                                   │ [↗Visualizar Demo]   │
│                                                   │ [Usar Template →]    │
└───────────────────────────────────────────────────┴──────────────────────┘
```

---

## 3B. Anatomia — Detalhe `/templates/:id`

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ← Templates > Sistema de Gestão Escolar        [♥ Favoritar][Usar →]     │
├──────────────────────────────────────────────────────────────────────────┤
│ [galeria de previews]                                                    │
├──────────────────────────────────────────────────────────────────────────┤
│ Visão Geral │ Funcionalidades │ Tecnologias │ Estrutura │ Requisitos │    │
│ Suporte                                                                  │
├───────────────────────────────────────────────────┬──────────────────────┤
│ Descrição longa em markdown                       │ ⚙ FICHA TÉCNICA      │
│                                                   │ Repositório  rns/... │
│ ESTRUTURA DO REPOSITÓRIO                          │ Versão       2.3.0   │
│ app/ components/ lib/ tests/                      │ Última atualiz. 09/26│
│ supabase/migrations/ supabase/functions/          │ Licença      privada │
│ docs/ .github/workflows/                          │ Downloads    1.2k    │
│ AGENTS.md CLAUDE.md README.md                     │ Avaliação    ⭐4.9   │
│                                                   ├──────────────────────┤
│ O QUE É PROVISIONADO                              │ ⚠ REQUISITOS         │
│ ✓ Repositório GitHub a partir deste template      │ · Integração GitHub  │
│ ✓ Projeto Supabase com as migrations aplicadas    │   conectada          │
│ ✓ Projeto Vercel ligado ao repositório            │ · Integração Supabase│
│ ✓ Branch protection e CODEOWNERS                  │ · Integração Vercel  │
│ ✓ Seeds sintéticos (sem dados reais)              │ [Verificar agora]    │
└───────────────────────────────────────────────────┴──────────────────────┘
```

---

## 4. Inventário de ícones

| Ícone | Onde | Nome | Ação | Rótulo | Fase |
|---|---|---|---|---|---|
| ▦ | sidebar | `templates` | `/templates` | "Templates" | F1 |
| + | topo | `plus` | abre criação de template | "Novo template" | F1 |
| 🌐📱🛒❤🎓📊⋯ | abas de categoria | `Icon` por categoria | filtra | nome da categoria | F1 |
| 🔍 | busca | `search` | foca | "Buscar templates" | F1 |
| ▾ | selects | `chevron-down` | abre | rótulo do select | F1 |
| ⚙ | Filtros | `filter` | painel avançado | "Filtros avançados" | F1 |
| ⤓ | contador de downloads | `download` | decorativo | "1.200 downloads" | F1 |
| ♥ | contador de curtidas | `heart` | **alterna favorito** | "Favoritar, 98 favoritos" | F1 |
| ⭐ | avaliação | `star` | decorativo | "4,9 de 5" | F1 |
| → | "Usar Template" | `arrow-right` | inicia wizard pré-preenchido | "Usar template X" | F1 |
| ↗ | Visualizar Demo | `external` | abre demo em nova aba | "Visualizar demo (abre nova aba)" | F1 |
| (N)(⚛)(TS)(⚡)(~)(◫) | chips de tecnologia | `brand/*` | filtra por tecnologia | nome da tecnologia | F1 |
| ✓ | lista de funcionalidades | `check` | decorativo | `aria-hidden` | F1 |
| ⚠ | bloco Requisitos | `alert` | decorativo | texto lido normalmente | F1 |
| ← | breadcrumb | `arrow-left` | volta | "Voltar para Templates" | F1 |

---

## 5. Componentes

`PageHeader` · `Tabs` (categorias) · `FilterBar` · `TemplateCard` · `SidePanel` de preview · `Tabs` internas do detalhe · `TechChip` · `FeatureList` · `RequirementChecklist` · `Gallery` · `MarkdownRenderer` · `EmptyState`

---

## 6. Dados exibidos

| Elemento | Origem |
|---|---|
| Lista de templates | `factory.templates` (públicos + da organização) |
| Categoria, tags, tecnologias | colunas do próprio registro |
| Downloads | `templates.downloads`, incrementado ao provisionar |
| Curtidas | `templates.likes` |
| Avaliação | `templates.rating` — `UNSPECIFIED` até existir tabela de reviews; exibir "—" ★ |
| Funcionalidades | `templates.features` (jsonb) |
| Repositório | `templates.repository_url` |
| Preview/demo | `templates.preview_url` |
| Requisitos | integrações necessárias, checadas contra `factory.integrations` |

★ A tela de referência mostra "4.9 (1.2k downloads)". Downloads é real (contagem de provisionamentos). A nota **só aparece quando houver sistema de avaliação**.

---

## 7. Interações

| Interação | Comportamento |
|---|---|
| "Usar Template" | Abre `/projetos/novo` com passo 1 pré-preenchido: template selecionado, categoria, sugestões de tecnologia. **Não cria projeto direto** ★ |
| Verificação de requisitos | Antes de permitir o uso, checa se GitHub, Supabase e Vercel estão conectados. Se faltar, mostra o que falta e link para Integrações |
| Favoritar | Otimista, com rollback |
| Criar template | A partir do zero (URL de repositório) ou **a partir de um projeto existente** (extrai estrutura, remove dados, gera seeds sintéticos) |
| Visualizar demo | Nova aba, `rel="noopener noreferrer"` |
| Filtrar por tecnologia | Clicar num chip filtra a lista |

★ **Regra:** "Usar Template" nunca pula o wizard. O passo de revisão humana continua obrigatório.

---

## 8. Estados

| Estado | Comportamento |
|---|---|
| Loading | Skeleton em grade 3×3 |
| Empty (sem templates) | "Nenhum template disponível." + "Criar template" + explicação do que é um Golden Template |
| Empty (filtro) | "Nenhum template nesta categoria." + "Limpar filtros" |
| Error | Por bloco |
| Template sem repositório | Card marcado "Rascunho — não utilizável", botão "Usar" desabilitado com tooltip ★ |
| Requisitos não atendidos | Botão "Usar" desabilitado + lista do que falta + link para Integrações |
| Forbidden | `viewer` navega; não cria nem favorita |

---

## 9–10. Rotas e endpoints

```
GET    /api/templates?category=&q=&tech=&sort=&page=
GET    /api/templates/:id
POST   /api/templates                     criar a partir de repositório
POST   /api/templates/from-app/:appId     extrair de projeto existente
PATCH  /api/templates/:id
DELETE /api/templates/:id
POST   /api/templates/:id/favorite
GET    /api/templates/:id/requirements    checa integrações necessárias
POST   /api/templates/:id/use             → retorna rascunho para o wizard
```

---

## 11. Tabelas

`factory.templates` · `factory.integrations` · `factory.apps` (para extrair template) · `integration.repositories`

---

## 12. Eventos

```
template.created · template.updated · template.used
template.favorited · template.extracted_from_app
```

---

## 13. Permissões

| Ação | Papel mínimo |
|---|---|
| Ver catálogo | `viewer` |
| Favoritar | `viewer` |
| Usar template | `engineer` |
| Criar template | `engineer` |
| Editar template da organização | `admin` |
| Publicar template como público | `owner` |
| Excluir template | `admin` |

---

## 14. Acessibilidade

- Cada card é um link único com nome acessível completo: "Sistema de Gestão Escolar, template de Educação para Web App, 1.200 downloads".
- A galeria de previews é um carrossel navegável por teclado, com botões anterior/próximo rotulados e indicador de posição textual ("3 de 7").
- Imagens de preview têm `alt` descritivo real, não "imagem do template".
- Botão desabilitado explica o motivo via `aria-describedby`, não só tooltip visual.
- Chips de tecnologia são botões de filtro com `aria-pressed`.

---

## 15. Performance

- Thumbnails otimizadas, lazy loading, `next/image`.
- Lista paginada em 12 cards.
- Painel de preview carrega sob demanda ao selecionar.
- Galeria em `dynamic import`.

---

## 16. Fase

`[F1]` catálogo, detalhe, criação de template, verificação de requisitos, "Usar" que pré-preenche o wizard.
`[F2]` provisionamento real a partir do template.
`[F3]` galeria refinada, sistema de avaliação.

---

## 17. Definition of Done

```
□ Catálogo com filtro por categoria, tecnologia e busca
□ Painel de preview com abas
□ Template sem repositório marcado como rascunho e não utilizável
□ Verificação de requisitos antes de permitir uso
□ "Usar Template" pré-preenche o wizard, não cria projeto direto
□ Criação de template a partir de projeto existente remove dados reais
□ Seeds gerados são sintéticos, verificados
□ Avaliação exibe "—" enquanto não houver sistema de reviews
□ Carrossel navegável por teclado
□ Alt text descritivo em todos os previews
□ axe sem violações
□ Playwright: filtrar → abrir detalhe → verificar requisitos → usar → wizard pré-preenchido
```

# Padrão de Documento de Página

Todo documento em `03-PAGINAS/` segue **exatamente** esta estrutura. Isso garante que o programador saiba onde encontrar cada informação sem reler o documento inteiro.

---

## Seções obrigatórias

```
1.  Identidade da página
2.  Objetivo e perguntas que responde
3.  Anatomia visual (diagrama ASCII da tela)
4.  Inventário de ícones — ícone por ícone, o que faz
5.  Componentes utilizados
6.  Dados exibidos (de onde vem cada número)
7.  Interações e comportamentos
8.  Estados da página (loading, empty, error, partial, forbidden)
9.  Rotas e navegação
10. Back-end: endpoints
11. Back-end: tabelas envolvidas
12. Back-end: eventos e realtime
13. Permissões
14. Acessibilidade específica da página
15. Performance específica da página
16. Fase de construção (1, 2 ou 3)
17. Definition of Done
18. Prompt sugerido para o agente construtor
```

---

## Convenções de leitura

| Marca | Significado |
|---|---|
| `[F1]` | Entregue na Fase 1 (app funcional, agentes mockados) |
| `[F2]` | Entregue na Fase 2 (agentes reais) |
| `[F3]` | Entregue na Fase 3 (refinamento visual) |
| `UNSPECIFIED` | Decisão pendente; **não inventar** |
| ★ | Item crítico: se estiver errado, a página não cumpre sua função |

---

## Regra do inventário de ícones

A seção 4 de cada página lista **todos** os ícones visíveis naquela tela, em uma tabela:

| Ícone | Onde aparece | Nome no `Icon` | Ação ao clicar | Rótulo acessível | Fase |
|---|---|---|---|---|---|

Nenhum ícone pode existir na tela sem estar nessa tabela. Se um ícone é decorativo, a coluna "Ação ao clicar" diz `decorativo` e o rótulo diz `aria-hidden`.

---

## Regra da rastreabilidade de dados

A seção 6 lista **cada número exibido** e sua origem:

| Elemento na tela | Valor | Origem (tabela / cálculo) | Atualização |
|---|---|---|---|

Nenhum número pode aparecer na interface sem origem declarada. Número sem origem é defeito.

---

## Ordem de construção das páginas

Esta é a ordem recomendada, porque cada página depende das anteriores:

```
1. Autenticação + shell           (10-TELAS-TRANSVERSAIS)
2. Configurações                   (09) — organização precisa existir
3. Projetos + Novo Projeto         (02) — a entidade central
4. Detalhe de Projeto / Pipeline   (10)
5. Agentes de IA                   (03)
6. Início / Dashboard              (01) — depende dos dados acima
7. Monitoramento                   (08)
8. Base de Conhecimento            (05)
9. Templates                       (06)
10. Integrações                    (07)
11. Orquestração                   (04) — a mais complexa
12. Câmara de Revisão              (10) — Fase 2
13. Fila de Aprovações             (10)
```

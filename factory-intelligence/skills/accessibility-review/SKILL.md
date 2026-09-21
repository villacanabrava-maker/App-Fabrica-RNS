---
name: accessibility-review
description: Auditar uma tela quanto a WCAG 2.2 AA, navegação por teclado, contraste, nomes acessíveis e alternativas não visuais. Use em verificação de navegador e em revisão de código de front-end.
---

# Revisão de acessibilidade

## Nível alvo

WCAG 2.2 nível AA. Automação detecta apenas parte das falhas — o teste manual
de teclado é obrigatório.

## Como proceder

1. **Teclado primeiro.** Percorra a tela inteira só com `Tab`, `Shift+Tab`,
   setas, `Enter`, `Space` e `Esc`.
   - Toda ação primária é alcançável?
   - A ordem de foco é lógica?
   - O foco está sempre visível?
   - Existe armadilha de foco?

2. **Componentes de risco deste produto**:
   - **Kanban**: mover cartão só com mouse é violação. Deve haver
     `Space` seleciona, setas movem, `Space` solta, `Esc` cancela.
   - **Canvas**: precisa de modo lista alternativo com as mesmas ações.
   - **LogViewer**: `aria-live` em rajada torna o leitor inutilizável.
     Precisa de throttle e botão de pausa.

3. **Nomes acessíveis**: todo controle interativo tem nome?
   Botão só com ícone precisa de `aria-label`.

4. **Cor**: algum significado é transmitido **apenas** por cor?
   Status, severidade, série de gráfico, delta de KPI — todos precisam de
   ícone, forma ou rótulo além da cor.

5. **Contraste**: texto normal ≥ 4.5:1, texto grande ≥ 3:1,
   componentes ≥ 3:1. Verifique nos **dois** temas.

6. **Estrutura**: um `h1` por página, sem pular níveis.
   Landmarks corretos. Tabela com `th scope`.

7. **Formulários**: `label` associado, erro por `aria-describedby`,
   erro não transmitido só por cor.

8. **Gráficos**: `aria-label` descritivo **e** alternativa em tabela.

9. **Movimento**: `prefers-reduced-motion` respeitado.

10. **Zoom 200%**: a tela continua funcional?

11. **Botão desabilitado**: explica o motivo por `aria-describedby`?

## Saída

`evidence.schema.json` com evidência de tipo `browser`, mais findings.

| Caso | Severidade | Bloqueia |
|---|---|---|
| Ação primária inalcançável por teclado | critical | sim |
| Armadilha de foco | critical | sim |
| Canvas ou Kanban sem alternativa acessível | critical | sim |
| Contraste abaixo do mínimo | high | sim |
| Controle sem nome acessível | high | sim |
| Significado só por cor | high | sim |
| Gráfico sem alternativa textual | high | não |
| Foco não visível | high | sim |
| Hierarquia de cabeçalho incorreta | medium | não |

## Nunca

- Declarar acessibilidade aprovada apenas com axe verde.
- Aceitar drag-and-drop sem equivalente por teclado.
- Confundir "tem `aria-label`" com "é acessível".

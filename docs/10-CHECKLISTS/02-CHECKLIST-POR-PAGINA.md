# Checklist por Página

Um checklist para executar em **cada** página antes de declará-la pronta. Imprima uma cópia por página.

---

## Página: ____________________   Data: ________   Revisor: ________

### A. Funcional
```
□ Todos os blocos do documento da página existem
□ Todos os ícones do inventário implementados, com ação correta
□ Todas as interações da seção 7 funcionam
□ Rotas e navegação conforme o documento
□ Endpoints respondem conforme o contrato
□ Realtime atualiza o bloco afetado sem refazer a página
□ Ações fora do papel estão desabilitadas com explicação
```

### B. Dados
```
□ Cada número exibido tem origem declarada na seção 6
□ Conferi pelo menos três números contra o banco
□ NENHUM valor fictício ou fixo na tela
□ Métrica inexistente mostra "—" com explicação
□ organization_id derivado da sessão, nunca do corpo da requisição
```

### C. Os sete estados
```
□ Loading     skeleton com a forma do conteúdo
□ Empty       mensagem + ação que resolve o vazio
□ Error       mensagem humana + retry + correlation_id
□ Partial     o que carregou aparece; o que falhou sinaliza
□ Success     o conteúdo
□ Stale       "atualizado há X" + botão atualizar
□ Forbidden   explica qual papel é necessário
```

### D. Teclado (manual, obrigatório)
```
□ Percorri a página inteira só com Tab e Shift+Tab
□ A ordem de foco é lógica
□ O foco está SEMPRE visível
□ Não existe armadilha de foco
□ Toda ação primária funciona com Enter ou Space
□ Menus e modais fecham com Esc e devolvem o foco
□ Componentes complexos (Kanban, canvas, tabelas) operáveis por teclado
```

### E. Leitor de tela (manual, nos fluxos críticos)
```
□ Título da página anunciado
□ Landmarks corretos (header, nav, main, aside)
□ Todo controle tem nome acessível
□ Status anunciado com texto, não só cor
□ Atualizações de execução anunciadas sem rajada (throttle)
□ Erros de formulário anunciados e associados ao campo
```

### F. Visual e contraste
```
□ Contraste verificado em tema CLARO
□ Contraste verificado em tema ESCURO
□ Nenhum significado transmitido só por cor
□ Zoom 200% sem perda de função
□ prefers-reduced-motion respeitado
□ Nenhuma cor ou espaçamento literal no código (só tokens)
```

### G. Automatizado
```
□ axe sem violações em tema claro
□ axe sem violações em tema escuro
□ Teste Playwright do fluxo principal verde
□ Componentes novos no Storybook com todos os estados
□ Testes unitários e de integração verdes
```

### H. Performance
```
□ LCP dentro do budget da rota
□ CLS dentro do budget
□ Gráficos e componentes pesados em dynamic import
□ Listas longas virtualizadas
□ Uma única chamada agrega os dados da visão principal
```

### I. Segurança
```
□ Nenhum segredo no bundle (inspecionei o JS gerado)
□ Nenhum segredo no tráfego de rede
□ Conteúdo de terceiro sanitizado
□ Links externos com rel="noopener noreferrer"
□ Ações destrutivas com confirmação proporcional ao risco
```

### J. DoD específico
```
□ Todos os itens da seção 17 do documento da página cumpridos
```

---

### Resultado

```
□ APROVADA        todos os itens marcados
□ PENDENTE        itens em aberto:
                  ________________________________________
                  ________________________________________
```

---

## Itens específicos por página

| Página | Item crítico adicional |
|---|---|
| **Início** | Bloco "Aguardando você" existe e é o primeiro após os KPIs |
| **Projetos** | Kanban 100% por teclado; drag solicita comando e faz rollback visual |
| **Agentes** | Nomenclatura por papel R1–R9; modelo vem do registry; LogViewer com throttle |
| **Orquestração** | Modo lista alternativo completo; 9 regras de validação bloqueando publicação |
| **Base de Conhecimento** | Aviso de que não é normativa para agentes; markdown sanitizado |
| **Templates** | "Usar" pré-preenche o wizard, nunca cria projeto direto |
| **Integrações** | Nenhum segredo no navegador; chave de API exibida uma vez |
| **Monitoramento** | Nenhum número de infraestrutura fictício; aba Gargalos; gráficos com tabela |
| **Configurações** | Modelo padrão como select do registry; nenhum toggle desliga gate constitucional |
| **Câmara de Revisão** | 4 colunas sempre visíveis; divergência nunca escondida; aprovar bloqueado com crítico aberto |

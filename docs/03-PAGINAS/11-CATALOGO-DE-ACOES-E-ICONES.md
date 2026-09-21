# Catálogo de Ações e Ícones

Herdado e mantido a partir da Pasta Mãe Mestre v1.0. Funciona como referência central e complementar à seção 4 ("ícone a ícone") de cada documento em `docs/03-PAGINAS/`: quando um ícone aparecer em mais de uma página, seu significado vem daqui, não é reinventado por página.

## Regra de uso

O ícone comunica a categoria; o texto comunica a ação. Usar uma família linear única, com traço consistente. Botão só com ícone exige nome acessível e tooltip. Ícone não altera significado entre páginas. A implementação deve importar símbolos de um módulo central, nunca por nome arbitrário diretamente em cada tela.

## Navegação e shell

| Símbolo semântico | Rótulo/ação | Comportamento | Observação |
|---|---|---|---|
| casa | Início | navega ao dashboard | não dispara atualização |
| pasta/briefcase | Projetos | abre catálogo | badge opcional = bloqueios, não total |
| chip/bot | Agentes IA | abre registry | não representa um fornecedor específico |
| nós/fluxo | Orquestração | abre workflows/runs | nunca significa "executar" sozinho |
| livro | Base de Conhecimento | abre busca/conteúdo | diferenciar de documento único |
| layout/modelo | Templates | abre catálogo | duplicar usa símbolo próprio |
| plug/conexões | Integrações | abre conexões | status separado do ícone |
| gráfico/pulso | Monitoramento | abre saúde/telemetria | alerta usa triângulo/sino |
| engrenagem | Configurações | abre escopo indicado | tooltip informa usuário/projeto/org |
| painel/menu | Recolher/expandir | muda sidebar | persiste preferência; sem navegação |

## Ações gerais

| Símbolo | Rótulo obrigatório | Efeito e regra |
|---|---|---|
| mais | Novo/Criar/Adicionar | abre formulário; não cria silenciosamente |
| lápis | Editar | abre draft; objeto publicado gera nova versão quando aplicável |
| disquete/check | Salvar | valida e persiste; só mostra sucesso após confirmação |
| X | Fechar/Cancelar visual | fecha painel; não cancela run sem rótulo explícito |
| lixeira | Excluir | confirmação, impacto, permissão e retenção |
| arquivo-caixa | Arquivar | remove das visões ativas, preserva histórico |
| restaurar | Restaurar | reativa se dependências/policy permitirem |
| copiar | Duplicar/Copiar | informa exatamente o que será copiado |
| download | Exportar/Baixar | mostra formato, escopo e job se assíncrono |
| upload | Importar/Enviar | valida tipo, tamanho, malware e destino |
| compartilhar | Compartilhar | altera membership/acesso após confirmação |
| reticências | Mais ações | menu nomeado e navegável por teclado |
| link externo | Abrir no provedor | nova aba, nome do ambiente e aviso acessível |

## Busca, visualização e dados

| Símbolo | Ação | Comportamento |
|---|---|---|
| lupa | Buscar | debounce/cancelamento; respeita permission scope |
| funil | Filtrar | abre filtros; badge mostra quantidade aplicada |
| setas ordenação | Ordenar | ciclo asc/desc; anuncia coluna/direção |
| colunas | Gerenciar colunas | preferência de visualização |
| lista/grade | Alternar visão | preserva query/filtros |
| calendário | Escolher período | exibe timezone |
| atualizar | Atualizar | reconsulta; não duplica command/job |
| olho | Visualizar | abre detalhe/preview; não concede acesso |
| olho cortado | Ocultar | muda visibilidade quando autorizado |
| informação | Ajuda/definição | tooltip/popover, não alerta |

## Execução e workflow

| Símbolo | Rótulo | Comportamento e proteção |
|---|---|---|
| play | Executar/Iniciar | cria command/job após validação e confirmação por risco |
| pausa | Pausar dispatch | impede novos passos; informa o que continua |
| quadrado | Cancelar execução | command auditado; descreve efeitos já realizados |
| repetir | Tentar novamente | novo attempt com mesma idempotency scope; não duplica efeito |
| ramificação | Branch/Fluxo | abre branch/diagrama; não executa |
| nós conectados | Dependências | exibe DAG, bloqueios e caminho crítico |
| relógio | Aguardando/Agendado | mostra desde/quando e motivo |
| mão/portão | Aprovação humana | abre snapshot exato e decisão |
| seta de passagem | Handoff | abre pacote de transferência e destinatário |
| terminal | Logs/Console | acesso restrito, redigido e carregado sob demanda |

## Estado, qualidade e segurança

| Símbolo | Estado | Semântica |
|---|---|---|
| check em círculo | sucesso/aprovado/saudável | sempre acompanhado do substantivo correto |
| relógio/spinner | pendente/em progresso | animação reduzida conforme preferência |
| triângulo | aviso/degradado | ação ainda possível com limitação explícita |
| X em círculo | erro/rejeitado/falhou | não confundir falha técnica com rejeição humana |
| octógono/escudo | bloqueado/policy | mostra regra e próximo passo permitido |
| sino | notificações/alertas | badge = não lidos; severidade no item |
| escudo | segurança/permissão | abre policy/controle, não "garante segurança" |
| chave | credencial/API key | valor nunca é reexibido; ação de rotação separada |
| cadeado | acesso restrito | explica role/requisito |
| bug | finding/defeito | severidade por badge textual |
| frasco/checklist | teste/eval | abre evidência, dataset e resultado |
| cifrão/moeda | custo/budget | inclui moeda, período e estimado/real |

## Confirmação e feedback

- `toast`: confirma resultado curto; não contém única cópia de informação crítica.
- `banner`: degradação sistêmica, ação necessária ou aviso de ambiente.
- `dialog`: decisão focada; ação primária inclui verbo e alvo.
- `drawer`: detalhe sem perder contexto; URL deep-link quando informação é compartilhável.
- `badge`: estado derivado; não clicável salvo aparência de controle explícita.

## Testes do catálogo

Storybook/catálogo visual deve verificar nome acessível, foco, tooltip, contraste, tamanhos, disabled/loading e tema. Screenshot regression impede troca silenciosa de símbolo. Testes E2E validam que ícones destrutivos nunca executam no primeiro clique.

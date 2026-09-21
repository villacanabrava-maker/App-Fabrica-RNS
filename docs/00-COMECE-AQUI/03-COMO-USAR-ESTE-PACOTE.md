# Como Usar Este Pacote

---

## Se você é o Roberth

### Primeira semana

```
1. Leia 00-LEIA-PRIMEIRO.md                              (15 min)
2. Leia 01-PRODUTO/01-DOCUMENTO-MESTRE-DO-APLICATIVO.md   (1 h)
3. Leia 08-PLANO-DE-IMPLEMENTACAO/01-PLANO-MESTRE...      (40 min)
4. Leia 09-PROMPTS/00-COMO-USAR-OS-PROMPTS.md             (15 min)
5. Leia 09-PROMPTS/05-PROMPTS-DO-CICLO-DE-REVISAO-DUPLA   (30 min)
```

Isso basta para você operar a construção. O resto é para o programador e para os agentes.

### Para começar a construção hoje

```
1. Abra o Antigravity com este pacote disponível.
2. Use o PROMPT A1 (09-PROMPTS/01) para planejar a FASE 0.
3. Revise o plano com o ciclo de 4 passagens (09-PROMPTS/05).
4. Aprove.
5. Entregue as tarefas aos agentes com os prompts de implementação.
6. Para cada etapa, rode o ciclo de 4 passagens e decida.
7. Marque o checklist da fase (10-CHECKLISTS/01).
```

### Quando algo parecer errado

| Situação | Onde olhar |
|---|---|
| Um agente propôs mudar a arquitetura | `01-PRODUTO/04-DECISOES-CONGELADAS.md` — se está lá, a resposta é não |
| Um agente disse "está pronto" sem prova | `06-INTELIGENCIA-DOS-AGENTES/01-CONSTITUICAO.md`, Artigo 4 |
| ChatGPT e Claude discordam | É normal. `06-INTELIGENCIA-DOS-AGENTES/04`, §7 — você decide |
| O ciclo quer uma quinta rodada | Não existe. A dúvida vem para você |
| Um número na tela parece inventado | Provavelmente é. Seção 6 do documento da página |
| Você não sabe se pode aprovar | `10-CHECKLISTS/03-CHECKLIST-DE-SEGURANCA.md` |

---

## Se você é o programador

### Ordem de leitura

```
DIA 1   00-COMECE-AQUI/ inteiro
        01-PRODUTO/ inteiro
        02-ARQUITETURA/01-ARQUITETURA-DO-SISTEMA.md

DIA 2   02-ARQUITETURA/ restante
        05-SEGURANCA/ inteiro  ★ antes de qualquer código

DIA 3   04-PLATAFORMAS/ inteiro
        06-INTELIGENCIA-DOS-AGENTES/ inteiro

DIA 4   07-QUALIDADE/ inteiro
        08-PLANO-DE-IMPLEMENTACAO/ inteiro

DIA 5   factory-intelligence/, supabase/, packages/, design-system/ na raiz — rode os testes
        03-PAGINAS/ — leia a página que vai construir primeiro
```

### Primeiros comandos

O código inicial já está aplicado na raiz deste repositório (`AGENTS.md`, `CLAUDE.md`, `.github/`, `factory-intelligence/`, `supabase/`, `packages/contracts/`, `design-system/tokens.json` — fusão de 21/09/2026). Não há mais uma pasta `11-CODIGO-INICIAL/` para copiar; comece direto por aqui:

```bash
# 1. Subir o banco local e aplicar as migrations
supabase start
supabase db reset

# 2. Provar que as invariantes funcionam
supabase test db
```

Se `supabase test db` passar, você tem um banco onde **um agente não consegue aprovar nada**, o ciclo de revisão **não passa de 4 rodadas** e o preview **não é declarado pronto com um único evento**. Isso é a fundação.

### Regras que você vai querer quebrar — e não deve

| Tentação | Por que não |
|---|---|
| "Vou desligar o RLS para desenvolver mais rápido" | Você vai esquecer de religar. E os testes de negação vão mentir |
| "Vou deixar o status como texto livre" | A máquina de estados deixa de ser real |
| "Vou pôr o nome do modelo direto no código" | Quebra ADR-032 e trava a troca de fornecedor |
| "Vou atualizar task.status direto do front" | O navegador solicita comandos, não escreve estado |
| "Depois eu faço o estado de erro" | Nunca é depois |
| "Vou chumbar esse número enquanto a telemetria não existe" | Número fictício em painel de operação cria confiança falsa |

---

## Se você é um agente construtor

Leia, nesta ordem de autoridade:

```
1. AGENTS.md ou CLAUDE.md (seu bootloader)
2. 06-INTELIGENCIA-DOS-AGENTES/01-CONSTITUICAO.md
3. 05-SEGURANCA/02-PERMISSOES-E-POLITICAS.md
4. O Task Packet da sua execução
5. O documento em 03-PAGINAS/ ou 02-ARQUITETURA/ da sua tarefa
```

E lembre:

```
· Trabalhe sobre o base_sha. Só ele.
· Não toque em forbidden_paths. Nunca factory-intelligence/**.
· Não invente valor. UNSPECIFIED é resposta válida.
· Não aprove. Você recomenda.
· Não chame o outro fornecedor. O Orchestrator chama.
· Não abra uma quinta rodada.
· Divergência é dado, não problema.
```

---

## Como manter este pacote vivo

Este pacote vai para o repositório em `docs/` e passa a ser **versionado como código**.

```
mudança proposta
      ↓
PR
      ↓
revisão (humana obrigatória para 05-SEGURANCA e 06-INTELIGENCIA)
      ↓
merge
      ↓
nova versão
```

Quando o código e a documentação divergirem, **um dos dois está errado**. Descubra qual e corrija por PR. Nunca deixe a divergência viva.

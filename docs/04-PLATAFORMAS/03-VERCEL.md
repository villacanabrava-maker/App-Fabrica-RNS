# Vercel — Como vai funcionar

**VERIFICAR ANTES DE USAR:** confirmado em 20/09/2026. Reverifique em `https://vercel.com/docs`.

---

## 1. O papel do Vercel

```
Hospeda o Control Plane da fábrica (o aplicativo das 9 páginas)
Hospeda cada aplicativo produzido
Gera PREVIEW a cada branch/PR
Gera PRODUCTION a partir da branch de produção
SEGURA a promoção até que os checks passem  ★
Libera progressivamente com rolling releases
```

★ A última capacidade é a mais importante para uma fábrica que permite agentes escreverem código: **merge não é sinônimo de "usuários recebem".**

---

## 2. Dois níveis, como no Supabase

```
NÍVEL 1 — Vercel do Control Plane
  Um projeto. O aplicativo da fábrica.
  Ligado ao repositório rns-factory.

NÍVEL 2 — Vercel de cada aplicativo produzido
  Um projeto por app.
  Criado programaticamente pelo Provisioning Service.
  Ligado ao repositório rns-app-<nome>.
```

---

## 3. Fluxo Git padrão

```
push em qualquer branch      →  PREVIEW deployment (URL própria)
abertura de PR               →  PREVIEW deployment vinculado ao PR
merge na branch de produção  →  PRODUCTION BUILD
                                  ↓
                             (NÃO é promovido automaticamente
                              quando há Deployment Checks)
```

---

## 4. Deployment Checks — o mecanismo central

### O problema que resolvem

Em escala, o conjunto de código testado **antes do merge** não é o mesmo que seria liberado aos usuários. Deployment Checks introduzem uma etapa entre "build pronto" e "usuários recebem".

```
SEM Deployment Checks              COM Deployment Checks
─────────────────────              ─────────────────────
merge                              merge
  ↓                                  ↓
build de produção                  build de produção
  ↓                                  ↓
promovido automaticamente          ★ checks de segurança rodam
  ↓                                  ↓
usuários                           checks passam
                                     ↓
                                   release approval (humano)
                                     ↓
                                   rolling release
                                     ↓
                                   usuários
```

### Como configurar

```
1. Projeto ligado ao GitHub via Vercel for GitHub
2. Aliasing automático de produção LIGADO
3. Em Deployment Checks, adicionar os checks do GitHub Actions exigidos:
     · smoke-tests-production
     · e2e-critical-path
     · security-scan-final
     · migration-verification
4. Build de produção passa a aguardar esses checks antes do alias
```

### Armadilhas documentadas ★

| Armadilha | Consequência | Mitigação |
|---|---|---|
| Nomes de job duplicados entre workflows | Colisão de check runs e condição de corrida com branch protection e Deployment Checks | **Nome único por check**, incluindo o ambiente |
| Renomear um job | O Deployment Check para de corresponder | Tratar nome de job como contrato; mudar exige atualizar a configuração |
| `repository_dispatch` sem status na commit correta | O check não é associado ao commit que gerou o deployment | Usar a action de status do Vercel, com nome único |
| Mais de um status por execução de workflow | Sobrescrita de status | Um status por execução, com o ambiente no nome |

O bypass existe (`Force Promote`) e deve ser tratado como exceção auditada, nunca como rotina.

---

## 5. Preview pair — a barreira de prontidão ★

A integração Supabase↔Vercel sincroniza as variáveis do preview. **Existe condição de corrida** entre a injeção das variáveis e a construção do deployment; a integração força um redeploy do deployment mais recente do PR para reconciliar.

Consequência arquitetural direta:

```
O Orchestrator NÃO declara o preview pronto
ao receber apenas o evento do Vercel.

Ele espera AMBOS:
    supabase.preview.ready
    vercel.preview.ready
        ↓
    preview_pair_ready
        ↓
    só então R8 / E2E começam
```

Implementação: tabela `integration.preview_environments` com `supabase_ready`, `vercel_ready` e `pair_ready` calculado. Timeout de espera com alerta (`UNSPECIFIED` até medir).

---

## 6. Rolling releases

Depois dos checks e da aprovação de release, a promoção pode ser fracionada:

```
release aprovado
      ↓
10% do tráfego na nova versão
      ↓
observar métricas (erro, latência, conversão)
      ├── ruim → ABORTAR e voltar ao anterior
      └── bom  → 25% → 50% → 100%
```

Para software escrito por agentes, isso é a última rede de proteção. Deve ser padrão para aplicativos produzidos, não exceção.

---

## 7. Provisionamento programático

O Provisioning Service cria o projeto Vercel de cada aplicativo via API REST, já vinculado ao repositório GitHub.

```
POST criar projeto
  body inclui gitRepository: { type: "github", repo: "RNS/rns-app-x" }
  ↓
configurar variáveis de ambiente (referenciando o secret manager)
  ↓
configurar branch de produção
  ↓
habilitar Deployment Checks
  ↓
registrar vercel_project_id em integration.vercel_projects
```

Regras: idempotente, registra o ID antes de seguir, nunca grava token em `integrations.config`.

---

## 8. Variáveis de ambiente

| Ambiente | O que recebe |
|---|---|
| Development | valores locais, sem acesso a produção |
| Preview | apontam para a **branch Supabase do preview**, publishable key, sem secret |
| Production | publishable key no cliente; secret key apenas em funções server-side |

★ **Regra inviolável:** nenhuma variável com prefixo público (`NEXT_PUBLIC_`) pode conter segredo. Verificação automatizada no CI: falhar o build se encontrar `sb_secret_`, `sk-`, `ghp_` ou padrões equivalentes em variáveis públicas.

---

## 9. Observabilidade

O Vercel expõe status de deployment, commits, URLs e logs de runtime. A fábrica **correlaciona** essas referências no Control Plane em vez de replicar todo o log bruto no Supabase.

```
deployments.external_id  ← id do deployment no Vercel
deployments.url
deployments.commit_sha
deployment_checks[]
```

A página Monitoramento linka para o Vercel quando o operador precisa do log completo. Não reimplementa o painel deles.

---

## 10. Configuração do Control Plane no Vercel

| Item | Decisão |
|---|---|
| Framework | Next.js App Router |
| Branch de produção | `main` |
| Preview | automático em toda branch e PR |
| Deployment Checks | habilitados |
| Rolling release | habilitado (`UNSPECIFIED` percentuais iniciais) |
| Região de funções | `UNSPECIFIED` — escolher próxima ao Factory Supabase |
| Proteção de preview | ativada — previews do Control Plane não são públicos ★ |

★ Previews do Control Plane contêm dados operacionais reais. Devem exigir autenticação.

---

## 11. Checklist de implementação

```
□ Projeto Vercel do Control Plane ligado ao rns-factory
□ Branch de produção configurada
□ Proteção de preview ativada no Control Plane
□ Deployment Checks configurados com nomes ÚNICOS de check
□ Rolling release habilitado
□ Variáveis por ambiente separadas
□ CI falha se encontrar segredo em variável pública  ★
□ Preview pair só declarado pronto com AMBOS os eventos  ★
□ Timeout de preview pair com alerta
□ Provisionamento programático idempotente
□ vercel_project_id registrado no Factory Supabase
□ Force Promote auditado como exceção
□ Teste: build de produção não é promovido com check vermelho
□ Teste: rollback de rolling release funciona
```

---

## Fontes

- [Vercel Docs — Deployment Checks](https://vercel.com/docs/deployment-checks)
- [Vercel Docs — Rolling Releases](https://vercel.com/docs/rolling-releases)
- [Vercel Docs — Git](https://vercel.com/docs/git)

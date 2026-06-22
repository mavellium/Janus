# 99 — Observações / Dívida Técnica

Esta lista reúne inconsistências e pontos de atenção **encontrados durante a
leitura do código** para esta documentação. Nada aqui foi corrigido — o escopo
foi apenas documentar. Cada item aponta a evidência no código.

> Severidade é uma estimativa para priorização, não um diagnóstico definitivo.
> Itens marcados com `⚠️ A confirmar` precisam de validação com o time.

## 1. Divergência de versões: CLAUDE.md × package.json

**Severidade: baixa (documentação) / média (decisões de stack)**

[CLAUDE.md](../../CLAUDE.md) descreve uma stack que **não corresponde** ao
[package.json](../../package.json) atual:

| Item | CLAUDE.md diz | package.json tem |
|---|---|---|
| Prisma | 6 | `^7.8.0` |
| Zod | 3.24 | `^4.4.3` |
| Tailwind | v4 | `^3.4.17` (+ `@tailwindcss/postcss@^4`) |
| Vitest | 3 | `^4.1.5` |

Next.js 16, React 19 e TypeScript 5 conferem. Como Zod e Prisma tiveram mudanças
relevantes entre major versions, código novo guiado pelo CLAUDE.md pode adotar
APIs erradas. **Recomendação:** alinhar o CLAUDE.md ao `package.json` (fora do
escopo desta tarefa).

## 2. Duas rotas de blog público com contratos divergentes

**Severidade: média**

Coexistem:

- [/api/{companySlug}/{projectId}/blog](../../src/app/api/[companySlug]/[projectId]/blog/route.ts)
  — escopada por projeto, payload enxuto (sem `body`), slug normalizado via
  `generateSlug(title)`.
- [/api/{companySlug}/blog](../../src/app/api/[companySlug]/blog/route.ts) — **não
  recebe `projectId`** (lista de todos os projetos da empresa), inclui `body`
  completo na listagem e normaliza slug para o `id`.

⚠️ A confirmar qual é a canônica. A versão sem `projectId` parece legada e tem
custo de payload maior. Risco de confusão para consumidores e de inconsistência
de slug entre os dois endpoints.

## 3. Actions de página duplicadas entre `cms` e `projects`

**Severidade: média**

Arquivos de mesmo nome existem em
[src/modules/cms/actions/](../../src/modules/cms/actions/) e
[src/modules/projects/actions/](../../src/modules/projects/actions/):
`createPage`, `togglePagePublish`, `updatePage`, `updatePageContent`,
`updatePageContentData`, `updatePageMode`, `updatePageSchema`. ⚠️ A confirmar qual
conjunto é o canônico por fluxo. Duplicação aumenta o risco de correções
aplicadas só em um dos lados. Consultar
[`.claude/context/cms/`](../../.claude/context/cms/) antes de mexer.

## 4. Padrão de Server Action não é uniforme

**Severidade: baixa/média**

O [CLAUDE.md](../../CLAUDE.md) define o fluxo
**Zod → Auth → Prisma → `revalidatePath()`**, mas há desvios:

- [createProject.ts](../../src/modules/projects/actions/createProject.ts) **não
  valida com Zod** e **não chama `revalidatePath()`** (recebe params tipados, não
  `FormData`).
- [createBlogPost.ts](../../src/modules/blog/actions/createBlogPost.ts) segue o
  padrão (Zod + `useActionState` + revalidação).

⚠️ A confirmar se a inconsistência é intencional (actions chamadas
programaticamente vs. via formulário).

## 5. Isolamento de tenant é 100% manual

**Severidade: média/alta (segurança)**

Não há Prisma middleware nem Row-Level Security no PostgreSQL forçando o filtro de
tenant. Cada query precisa incluir `companyId`/`projectId` e `deletedAt: null`
explicitamente (ver [03-multi-tenancy.md](03-multi-tenancy.md)). Qualquer query
que esqueça o filtro vaza dados entre tenants. ⚠️ A confirmar se há testes
cobrindo isolamento.

## 6. `LoginAttempt` cresce sem expurgo

**Severidade: baixa**

O bloqueio de IP grava um registro por tentativa falha
([src/lib/auth.ts](../../src/lib/auth.ts)) e a janela de avaliação é de 1 hora,
mas **não há rotina de limpeza** dos registros antigos. A tabela cresce
indefinidamente. (A própria leitura tolera a tabela inexistente tratando `P2021`,
o que mascara falhas de schema.)

## 7. Senhas de banco hardcoded no docker-compose

**Severidade: média (segurança)**

[docker-compose.yml](../../docker-compose.yml) traz `POSTGRES_PASSWORD`
literalmente (`janus_password_prod`, `janus_password_test`). ⚠️ A confirmar se o
arquivo versionado é o usado em produção; idealmente as credenciais viriam de
secrets/`.env`.

## 8. `images.remotePatterns` aceita qualquer host HTTPS

**Severidade: baixa/média**

[next.config.ts](../../next.config.ts) define `remotePatterns: [{ protocol:
'https', hostname: '**' }]`, permitindo otimização de imagem a partir de
**qualquer** domínio HTTPS. Amplo demais; pode ser abusado como proxy de imagens.

## 9. Mensagem de timeout de upload incoerente com o valor

**Severidade: trivial**

Em [src/app/api/upload/route.ts](../../src/app/api/upload/route.ts) o timeout do
`AbortController` é **300000 ms (300s)**, mas a mensagem de erro do `AbortError`
diz "(>30s)". Apenas texto enganoso.

## 10. Rate-limit em memória não escala horizontalmente

**Severidade: baixa (hoje) / média (se escalar)**

[src/lib/rate-limit.ts](../../src/lib/rate-limit.ts) mantém estado por processo.
Com múltiplas réplicas da app, o limite efetivo se multiplica pelo número de
instâncias. Hoje há uma instância por ambiente no
[docker-compose.yml](../../docker-compose.yml), então o impacto é limitado.

## 11. Código arquivado no repositório

**Severidade: trivial**

`src/components/_archived_builder/` e `src/hooks/use-builder.ts` estão
**excluídos** do [tsconfig.json](../../tsconfig.json). Código morto versionado
gera ruído. ⚠️ A confirmar se pode ser removido.

## 12. Endpoints internos sem auditoria de autorização aqui

**Severidade: a investigar**

Os handlers `projects/[projectId]/check-script`, `generate-script`,
`blog-enabled` e `dev/companies/[companyId]/projects` (em
[src/app/api/](../../src/app/api/)) não foram auditados linha a linha nesta
documentação. ⚠️ A confirmar se exigem autenticação/escopo de tenant adequados,
já que rotas `/api` não passam pelo middleware.

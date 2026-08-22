# Billing — Onde cada limite é aplicado

Mapa completo do enforcement. Ao criar uma action nova que consome recurso, adicione aqui.

| Limite               | Arquivo                                              | Guard |
|----------------------|------------------------------------------------------|-------|
| `projects`           | `modules/projects/actions/createProject.ts`          | `enforceQuota(companyId, 'projects')` |
| `seoAnalysesPerDay`  | `modules/seo/actions/analyzeSeoUrl.ts`               | `enforceQuota(..., 'seoAnalysesPerDay')` |
| `siteScansPerDay`    | `modules/seo/actions/analyzeSite.ts`                 | `enforceQuota(..., 'siteScansPerDay')` |
| `geoRunsPerMonth`    | `modules/geo/actions/runRaioX.ts` (`prepareRaioXRun`)| `enforceQuota(..., 'geoRunsPerMonth')` — só se o perfil tem `companyId` |
| `users`              | `modules/dev/actions/createUser.ts`                  | `enforceQuota(..., 'users')` |
| `blogScheduling`     | `modules/blog/actions/createBlogPost.ts` + `updateBlogPost.ts` | `enforceFeature(..., 'blogScheduling')` — **só quando `publishedAt` é futuro** |
| `scripts`            | `modules/scripts/actions/createScript.ts`            | `enforceFeature(..., 'scripts')` |
| `historyDays`        | *não aplicado* — limite declarado no catálogo, ainda sem corte na query de auditoria |

## Códigos de retorno

- **402** — recurso não incluído no plano (teto 0) ou assinatura travada → a mensagem pede upgrade
- **429** — teto existe e foi estourado por uso → a mensagem pede para tentar depois ou upgrade

## Contagem de uso (`getCompanyUsage`)

| Chave                | Como conta |
|----------------------|------------|
| `projects`           | `Project` ativos e não deletados da empresa |
| `users`              | `User` não deletados com `companyId` |
| `seoAnalysesToday`   | `SeoAnalysis` com `projectId: null` nas últimas 24h |
| `siteScansToday`     | `SeoAnalysis` com `projectId` preenchido nas últimas 24h |
| `geoRunsThisMonth`   | `GeoScoreSnapshot` de perfis da empresa desde o dia 1º |

**Mudança de semântica em 2026-08-22:** o limite de site scan passou a ser **por empresa** (antes
era por projeto, hardcoded em 10/dia). Cota de plano é comercial, então o teto é da conta.

## Pontos deliberadamente sem guard

- `adminCreateUser`, `adminCreateCompany` e demais actions ADMIN — o admin é o override manual.
- Leitura de qualquer tipo — nenhum limite bloqueia visualização de conteúdo já criado.
- `updateProject` / `updatePage` / edição de conteúdo — excedente continua editável (regra 3 do
  domínio: o cliente nunca perde acesso ao que já é dele).

# SEO — Queries

## getSeoAnalysis(analysisId, companyId, userId?): Promise<SeoAnalysisRecord | null>
- `findFirst` com id + companyId + (se informado) userId — autorização por escopo é obrigatória (URL direta de outra empresa/outro usuário → null → página chama `notFound()`).
- **Escopo por usuário**: usuários comuns só veem as próprias análises — as pages passam `session.user.id` como `userId` quando `!isPrivilegedRole(role)`; ADMIN/DEVELOPER passam `undefined` e veem toda a empresa.
- Retorna `{ checks: SeoCheckResult[], geoFoundation: GeoFoundationResult | null, ... }` + userName do autor.
- `parseStoredChecks(raw)` — compatibilidade retroativa: se `checks` no banco é um array (formato pré-GEO), retorna `{ seo: raw, geoFoundation: null }`; se é objeto `{seo, geoFoundation}` (formato atual), extrai normalmente. A UI trata `geoFoundation: null` omitindo a seção "Fundação para GEO" do relatório — sem quebrar análises antigas.

## getRecentSeoAnalyses(companyId, limit=10, userId?): Promise<SeoAnalysisSummary[]>
- Lista id/targetUrl/score/createdAt, desc por data. Mesmo escopo por usuário acima (`userId` opcional).
- Usada no card da home (limit 3, prop `ownerId`), na página índice (limit 20) e no histórico do relatório (limit 10).

## Infra (não são queries Prisma)
- `fetchTargetPage(rawUrl)` — página principal via safeFetch + probes de `/robots.txt` (5s, 256KB) e sitemap (declarado no robots OU `/sitemap.xml` 200).
- `parsePage(html)` — extração cheerio; remove script/style/noscript/template ANTES da contagem de palavras, DEPOIS de contar JSON-LD.

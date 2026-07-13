# SEO — Queries

## getSeoAnalysis(analysisId, companyId): Promise<SeoAnalysisRecord | null>
- `findFirst` com AMBOS id + companyId — autorização por escopo de empresa é obrigatória (URL direta de outra empresa → null → página chama `notFound()`).
- Retorna checks já tipados (`as unknown as SeoCheckResult[]`) + userName do autor.

## getRecentSeoAnalyses(companyId, limit=10): Promise<SeoAnalysisSummary[]>
- Lista id/targetUrl/score/createdAt, desc por data.
- Usada no card da home (limit 3) e no histórico da página de relatório (limit 10).

## Infra (não são queries Prisma)
- `fetchTargetPage(rawUrl)` — página principal via safeFetch + probes de `/robots.txt` (5s, 256KB) e sitemap (declarado no robots OU `/sitemap.xml` 200).
- `parsePage(html)` — extração cheerio; remove script/style/noscript/template ANTES da contagem de palavras, DEPOIS de contar JSON-LD.

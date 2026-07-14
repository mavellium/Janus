# SEO — Server Actions

## analyzeSeoUrl({ url, companySlug })
Arquivo: `src/modules/seo/actions/analyzeSeoUrl.ts`
- Fluxo: Zod (`z.url()` — Zod 4) → auth → guard de empresa (padrão createProject: role !== ADMIN exige `session.user.companySlug === companySlug`) → rate limit (20/24h por companyId) → `fetchTargetPage` (SSRF-safe, já retorna `robotsTxtBody`) → `parsePage` (cheerio, já retorna `jsonLdTypes`) → `scoreSeo` (SEO on-page) → `scoreGeoFoundation` (GEO, reaproveita os mesmos sinais já buscados — nenhum fetch adicional) → persiste `SeoAnalysis` com `checks: { seo, geoFoundation }` → `revalidatePath`.
- Retorno: `{ ok: true, data: { analysisId, result } }` onde `result: SeoAnalysisResult` inclui `geoFoundation` | `{ ok: false, error, code }` (400/401/403/404/422/429/500).
- Erros de fetch mapeados para mensagens PT-BR em `FETCH_ERROR_MESSAGES`; `PRIVATE_ADDRESS_BLOCKED` retorna mensagem genérica (não vaza detalhe de infra).
- Rate limit é único para os dois scores (SEO + GEO Foundation somam 1 chamada de `analyzeSeoUrl` = 1 unidade do limite de 20/dia) — não há chamada externa extra por causa do GEO, então o custo de rate-limit não muda.
- Sem `logAudit` (gera relatório, não muta entidade crítica).
- Consumida por `SeoUrlInputForm` (home) e `ReanalyzeButton` (relatório).
- Normalização de URL sem protocolo (`www.site.com` → `https://www.site.com`) é feita no CLIENT (`normalizeUrl` em SeoUrlInputForm) antes de chamar a action.

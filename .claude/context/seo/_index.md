# SEO — Sumário Executivo

Motor de análise de SEO on-page: usuário cola a URL de qualquer site público e recebe score 0-100 + lista priorizada de ações, persistido em `SeoAnalysis`.

| Camada  | Conteúdo                                                                   |
| :------ | :-------------------------------------------------------------------------- |
| Domain  | `SeoCheckResult`/`PageSignals` (seoCheck.ts) · `scoreSeo()` puro (seoScoring.ts) |
| Infra   | `fetchTargetPage()` (fetch seguro + robots/sitemap) · `parsePage()` (cheerio) |
| Actions | `analyzeSeoUrl({ url, companySlug })` — pipeline completo + rate limit       |
| Queries | `getSeoAnalysis(id, companyId)`, `getRecentSeoAnalyses(companyId)`           |

- [domain.md](domain.md) · [actions.md](actions.md) · [queries.md](queries.md) · [changelog.md](changelog.md)

**Para usar este módulo, você deve saber:**
- Todo fetch de URL de usuário passa por `src/lib/security/safe-fetch.ts` (proteção SSRF: só http/https, DNS resolvido e IPs privados/loopback/link-local bloqueados, redirects validados hop a hop com máx. 3, timeout 10s, corpo máx. 3MB). NUNCA usar `fetch` cru para URL vinda de usuário.
- Rate limit: 20 análises/24h por empresa (contagem em `SeoAnalysis`).
- Rubrica soma exatamente 100 (garantido por teste `MAX_SEO_SCORE`); ao alterar pesos, mantenha a soma.
- `SeoAnalysisType` enum reserva expansão futura (GEO — ver `sprint/15-geo-generative-engine-optimization.txt`).
- UI: `SeoAnalyzerCard` (home) → `SeoUrlInputForm` → relatório em `/[companySlug]/dashboard/seo/[analysisId]`.

# SEO — Sumário Executivo

Motor de análise de SEO on-page + Fundação Técnica para GEO: usuário cola a URL de qualquer site público e recebe dois scores 0-100 (SEO tradicional + prontidão para ser citado por IAs generativas) com lista priorizada de ações, persistidos em `SeoAnalysis`.

| Camada  | Conteúdo                                                                   |
| :------ | :-------------------------------------------------------------------------- |
| Domain  | `SeoCheckResult`/`PageSignals`/`GeoFoundationSignals` (seoCheck.ts) · `scoreSeo()` (seoScoring.ts) · `scoreGeoFoundation()` (geoFoundationScoring.ts) |
| Infra   | `fetchTargetPage()` (fetch seguro + robots/sitemap, expõe `robotsTxtBody`) · `parsePage()` (cheerio, expõe `jsonLdTypes`) |
| Actions | `analyzeSeoUrl({ url, companySlug })` — pipeline completo (SEO + GEO Foundation) + rate limit |
| Queries | `getSeoAnalysis(id, companyId)` (lê formato novo e legado), `getRecentSeoAnalyses(companyId)` |

- [domain.md](domain.md) · [actions.md](actions.md) · [queries.md](queries.md) · [changelog.md](changelog.md)

**Para usar este módulo, você deve saber:**
- Todo fetch de URL de usuário passa por `src/lib/security/safe-fetch.ts` (proteção SSRF: só http/https, DNS resolvido e IPs privados/loopback/link-local bloqueados, redirects validados hop a hop com máx. 3, timeout 10s, corpo máx. 3MB, 1 retry em falha de rede, preferência IPv4 via `dns.setDefaultResultOrder`). NUNCA usar `fetch` cru para URL vinda de usuário. NUNCA instalar `undici` via npm para customizar o dispatcher do fetch — incompatível com o fetch nativo do Node (ver domain.md).
- Rate limit: 20 análises/24h por empresa (contagem em `SeoAnalysis`) — cobre SEO + GEO Foundation juntos (1 análise = 1 unidade).
- Duas rubricas independentes, cada uma somando exatamente 100 (`MAX_SEO_SCORE`, `MAX_GEO_FOUNDATION_SCORE`, ambas garantidas por teste); ao alterar pesos, mantenha a soma.
- `SeoAnalysis.score` (coluna do banco) é **só o score de SEO**; o score de GEO Foundation vive dentro do JSON `checks.geoFoundation.score` — não confundir os dois ao ler direto do banco.
- `GeoFoundationScoring` implementa a Fase 3 ("Fundação Técnica") de `sprint/15-geo-generative-engine-optimization.txt` — as demais fases do GEO (2, 4-7) NÃO estão implementadas; ver esse arquivo para o que falta e por quê.
- UI ("Análise de SEO e GEO" em toda a navegação/títulos): `SeoAnalyzerCard` (home) e a página índice `/[companySlug]/dashboard/seo` → `SeoUrlInputForm` (client) → `CombinedScoreHeader` (2 anéis animados com count-up, SEO e GEO lado a lado, clicáveis — pulam via `scrollIntoView` para a seção de checklist correspondente) → relatório completo em `/[companySlug]/dashboard/seo/[analysisId]` (mesmo `CombinedScoreHeader` no topo + seções `#seo-details`/`#geo-details`). `ScoreRing`/`useCountUp` (`src/components/seo/`) são os únicos donos da animação/visual do score — `SeoScoreCard` não desenha mais anel próprio, só a checklist (evita duplicar o número em cada card).

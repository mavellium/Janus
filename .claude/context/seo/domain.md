# SEO — Entidades e Domínio

## Model: SeoAnalysis (`seo_analyses`)
- **Campos:** id (uuid), companyId (FK Company, cascade), userId (FK User), projectId (uuid?, sem FK — reserva), targetUrl (URL final após redirects), type (`SeoAnalysisType`, default SEO), score (Int 0-100), checks (Json — array de `SeoCheckResult`), createdAt
- **Invariantes:** `checks` sempre é o array completo produzido por `scoreSeo()`; `score` = soma dos `points`.

## Tipos (`src/modules/seo/domain/seoCheck.ts`)
- `SeoCheckResult` — key, label, passed, severity ('critical'|'important'|'minor'), points, maxPoints, message, recommendation? (só quando reprova)
- `PageSignals` — sinais extraídos da página (title, metaDescription, h1Count, h2Count, canonical, hasViewport, og*, jsonLdCount, wordCount, imageCount, imagesWithAlt) + finalUrl, responseTimeMs, robotsTxtAccessible, sitemapAccessible
- `SeoAnalysisResult` — score + checks + targetUrl + fetchedAt + responseTimeMs

## Scoring (`seoScoring.ts` — função pura, testada em seoScoring.spec.ts)
Rubrica (soma 100): title 30-60c (10) · meta description 70-160c (10) · 1 H1 exato (10) · H2 presente (5) · HTTPS (10) · viewport (5) · canonical (5) · Open Graph completo (10) · JSON-LD (5) · robots.txt (5) · sitemap (5) · ≥300 palavras (5) · ≥90% imgs com alt (10, passa sem imagens) · resposta <3s (5).
Faixas de título/descrição idênticas às de `src/lib/seo-checklist.ts` (blog) por consistência.

## Erros (SafeFetchError, `src/lib/security/safe-fetch.ts`)
- INVALID_URL · PRIVATE_ADDRESS_BLOCKED (SSRF — mensagem genérica ao usuário, não vazar) · TIMEOUT · TOO_LARGE · TOO_MANY_REDIRECTS · UNREACHABLE (inclui HTTP ≥400)

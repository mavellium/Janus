# SEO — Entidades e Domínio

## Model: SeoAnalysis (`seo_analyses`)
- **Campos:** id (uuid), companyId (FK Company, cascade), userId (FK User), projectId (uuid?, sem FK — reserva), targetUrl (URL final após redirects), type (`SeoAnalysisType`, default SEO), score (Int 0-100 — **somente o score de SEO on-page**, não inclui GEO), checks (Json — ver formato abaixo), createdAt
- **Invariantes:** `score` = soma dos `points` de `scoreSeo()` (SEO on-page apenas). O score de GEO Foundation vive dentro de `checks.geoFoundation.score`, não tem coluna própria.
- **Formato de `checks` (desde task 15 fase 3):** `{ seo: SeoCheckResult[], geoFoundation: GeoFoundationResult }`. Análises criadas ANTES dessa mudança persistiram `checks` como array puro de `SeoCheckResult` — `getSeoAnalysis.ts` trata os dois formatos via `parseStoredChecks()` (ver queries.md). Não há migration de dados retroativa; é leitura tolerante.

## Tipos (`src/modules/seo/domain/seoCheck.ts`)
- `SeoCheckResult` — key, label, passed, severity ('critical'|'important'|'minor'), points, maxPoints, message, recommendation? (só quando reprova)
- `PageSignals` — sinais extraídos da página (title, metaDescription, h1Count, h2Count, canonical, hasViewport, og*, jsonLdCount, jsonLdTypes, wordCount, imageCount, imagesWithAlt) + finalUrl, responseTimeMs, robotsTxtAccessible, sitemapAccessible
- `GeoFoundationSignals` — `{ robotsTxtBody, jsonLdTypes }` (subconjunto do fetch, usado só pelo scoring de GEO)
- `GeoFoundationResult` — alias de `SeoScoreResult` (`{ score, checks }`)
- `SeoAnalysisResult` — score + checks (SEO) + `geoFoundation` (GeoFoundationResult) + targetUrl + fetchedAt + responseTimeMs

## Scoring de SEO (`seoScoring.ts` — função pura, testada em seoScoring.spec.ts)
Rubrica (soma 100): title 30-60c (10) · meta description 70-160c (10) · 1 H1 exato (10) · H2 presente (5) · HTTPS (10) · viewport (5) · canonical (5) · Open Graph completo (10) · JSON-LD (5) · robots.txt (5) · sitemap (5) · ≥300 palavras (5) · ≥90% imgs com alt (10, passa sem imagens) · resposta <3s (5).
Faixas de título/descrição idênticas às de `src/lib/seo-checklist.ts` (blog) por consistência.

## Scoring de GEO Foundation (`geoFoundationScoring.ts` — função pura, testada em geoFoundationScoring.spec.ts)
Implementa a Fase 3 ("Fundação Técnica") da metodologia GEO descrita em `sprint/15-geo-generative-engine-optimization.txt`, reaproveitando 100% da infra de fetch/parse do motor de SEO (não duplica fetch nem parsing).
Rubrica automatizada (soma 100): acesso de robôs de IA liberado no robots.txt (40, critical) · dados estruturados Organization/LocalBusiness (30, important) · dados estruturados FAQPage (30, minor).
- `AI_CRAWLER_USER_AGENTS` — lista de user-agents monitorados (GPTBot, ChatGPT-User, OAI-SearchBot, ClaudeBot, Claude-User, Claude-SearchBot, PerplexityBot, Google-Extended, Applebot-Extended). **Revisar periodicamente** — provedores adicionam novos crawlers com frequência; não há mecanismo automático de atualização.
- `parseRobotsGroups()`/`isBotBlocked()` — parser de robots.txt próprio (grupos por User-agent, regra mais específica vence sobre `*`, `Allow: /` explícito sobrepõe `Disallow: /` do wildcard). Coberto por 7 casos de teste incluindo bloqueio específico por bot, allow sobrepondo wildcard, e disallow de subpasta não afetando a raiz.
- Item extra **sempre presente, sem pontuação** (`answer_first_manual`, maxPoints: 0): "Resposta em primeiro lugar" é a Fase 3 do PDF que não é automatizável com precisão sem uma chamada extra a LLM avaliando o texto — decisão deliberada de não fingir automação; aparece como orientação editorial manual.
- `MAX_GEO_FOUNDATION_SCORE` (100) — mesma garantia de soma exata via teste, igual ao `MAX_SEO_SCORE`.

## Erros (SafeFetchError, `src/lib/security/safe-fetch.ts`)
- INVALID_URL · PRIVATE_ADDRESS_BLOCKED (SSRF — mensagem genérica ao usuário, não vazar) · TIMEOUT · TOO_LARGE · TOO_MANY_REDIRECTS · BLOCKED_BY_TARGET (site respondeu 403/429 — está no ar mas recusou o acesso automatizado) · UNREACHABLE (falha de conexão/DNS ou HTTP ≥400 de outro tipo)
- `SafeFetchError` guarda a causa original em `.cause` (Error cause padrão ES2022) e `fetchOnce()` loga `code`/erro bruto no console — antes o motivo real de uma falha de rede era descartado, hoje fica no log do servidor mesmo quando o usuário só vê a mensagem genérica.
- `fetchOnce` tenta 1 retry (800ms de espera) para falhas de rede que não sejam timeout, via `fetchWithRetry` — falhas transientes (reset de conexão, etc.) não precisam de "Analisar novamente" manual.
- `dns.setDefaultResultOrder('ipv4first')` é chamado no import do módulo — mitiga o padrão clássico "funciona local, falha em produção" quando o servidor não tem rota de saída IPv6 configurada mas o DNS do domínio-alvo retorna AAAA. **Não** force IPv4 via `dispatcher`/`Agent` do pacote `undici` instalado via npm — testado e confirmado incompatível com o `fetch` nativo do Node nesta versão (erro `UND_ERR_INVALID_ARG: invalid onRequestStart method`, por divergência entre a versão do `undici` bundada internamente no Node e a instalada via npm). `setDefaultResultOrder` é a via oficial e sem essa armadilha.

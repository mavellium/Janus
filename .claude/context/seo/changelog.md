# SEO — Changelog

### [2026-07-13] — Criação do módulo (tasks 11a + 11b da sprint)

**Arquivos**:
- `prisma/migrations/20260713000000_add_seo_analysis/`: enum `seo_analysis_type` + tabela `seo_analyses` (migration manual + `migrate deploy`, pois o shadow DB do `migrate dev` falha numa migration antiga de guest_posts)
- `src/lib/security/safe-fetch.ts`: fetch SSRF-safe reutilizável (novo)
- `src/modules/seo/{domain,infra,actions,queries}`: motor completo
- `src/components/seo/`: SeoScoreCard, SeoUrlInputForm, SeoAnalyzerCard, ReanalyzeButton
- `src/app/[companySlug]/dashboard/seo/[analysisId]/page.tsx`: relatório completo + histórico
- Dependência nova: `cheerio` (parsing HTML server-side)

**Razão**: primeira ferramenta de diagnóstico self-service do Janus (spec em `sprint/11a` e `sprint/11b`).

**Impacto**: card "Análise de SEO" na home da empresa; 9 testes unitários de scoring; smoke test e2e validou score real (example.com=40) e bloqueio SSRF (127.0.0.1, 169.254.169.254, localhost, ftp://).

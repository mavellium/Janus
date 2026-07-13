# SEO — Server Actions

## analyzeSeoUrl({ url, companySlug })
Arquivo: `src/modules/seo/actions/analyzeSeoUrl.ts`
- Fluxo: Zod (`z.url()` — Zod 4) → auth → guard de empresa (padrão createProject: role !== ADMIN exige `session.user.companySlug === companySlug`) → rate limit (20/24h por companyId) → `fetchTargetPage` (SSRF-safe) → `parsePage` (cheerio) → `scoreSeo` → persiste `SeoAnalysis` → `revalidatePath`.
- Retorno: `{ ok: true, data: { analysisId, result } }` | `{ ok: false, error, code }` (400/401/403/404/422/429/500).
- Erros de fetch mapeados para mensagens PT-BR em `FETCH_ERROR_MESSAGES`; `PRIVATE_ADDRESS_BLOCKED` retorna mensagem genérica (não vaza detalhe de infra).
- Sem `logAudit` (gera relatório, não muta entidade crítica).
- Consumida por `SeoUrlInputForm` (home) e `ReanalyzeButton` (relatório).
- Normalização de URL sem protocolo (`www.site.com` → `https://www.site.com`) é feita no CLIENT (`normalizeUrl` em SeoUrlInputForm) antes de chamar a action.

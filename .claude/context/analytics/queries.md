# Analytics — Queries

## getProjectGa4(projectId, companySlug)
- **Retorna:** `{ id, name, ga4PropertyId } | null`
- **Filtros:** `deletedAt: null`; valida que o project pertence à company do slug
- **Uso:** páginas de resultados por projeto (sites/landing-pages) para obter o Property ID salvo

## getAnalyticsData(propertyId)
- **Retorna:** `{ ok, data?: FullAnalyticsReport, error? }`
- **Faz:** `getFullAnalyticsReport(propertyId)` (lib) com try/catch
- **Uso:** consumido pela rota `GET /api/analytics`; `AnalyticsPanel` (Client) faz fetch nela

## getCompanyAnalytics(projectPropertyIds[], days=30)
- **Retorna:** `{ ok, configured, data?: AnalyticsResult, error? }`
- **Lógica:** se array vazio → `configured: false` (empty state). Senão chama `getAnalyticsMetrics` para cada propertyId em paralelo e **soma a série por data** (`mergeSeries`)
- **Uso:** `/dashboard/results` (panorama) — soma TODOS os projetos com GA4; sem master property
- **Nota:** usa KPIs + série simples (não o relatório completo com funil/tabelas)

## Lib (não é query, mas é a fonte)
- `getAnalyticsMetrics(propertyId, start, end)` → `AnalyticsResult` (1 `runReport`, série diária)
- `getFullAnalyticsReport(propertyId)` → `FullAnalyticsReport` (1 `batchRunReports`, 6 relatórios)

# Analytics (GA4) — Sumário Executivo

Integração com Google Analytics 4 (Data API v1beta) via Service Account. Dashboards de Resultados por projeto e panorama geral da empresa.

| Aspecto   | Responsável |
| :-------- | :---------- |
| Domínio   | Tipos do relatório GA4 (`AnalyticsResult`, `FullAnalyticsReport`, funil, eventos, canais, fontes, páginas) — [domain.md](domain.md) |
| Actions   | `updateProjectGa4` (salva `ga4PropertyId` no Project) — [actions.md](actions.md) |
| Queries   | `getProjectGa4`, `getAnalyticsData`, `getCompanyAnalytics` — [queries.md](queries.md) |
| Client GA4| `src/lib/analytics/ga4-client.ts` — `batchRunReports` (1 round-trip, 6 relatórios) |
| Rota API  | `GET /api/analytics?propertyId=` → `FullAnalyticsReport` (autenticado) |

## Para usar este módulo, você deve saber...
- ✅ `ga4PropertyId` mora **só no Project** (sites e landing pages). Não existe mais master property na Company.
- ✅ Página por projeto (`AnalyticsPanel`, Client) = relatório completo (funil + KPIs + eventos + gráfico + 3 tabelas).
- ✅ `/dashboard/results` = soma de TODOS os projetos com GA4. **Sem campo de ID, sem botão, para qualquer role.**
- ✅ Property ID + botão "Alterar" + form de setup = **só ADMIN/DEVELOPER** (prop `userRole`).
- ✅ Credenciais em env: `GA4_CLIENT_EMAIL`, `GA4_PRIVATE_KEY`, `GA4_PROJECT_ID` (Service Account com Viewer na propriedade).

## Pré-requisitos GA4 (causa comum de erro 502 / PERMISSION_DENIED)
1. API `analyticsdata.googleapis.com` habilitada no projeto GCP.
2. Service Account adicionada na **propriedade** GA4 (não na conta) com papel Viewer/Leitor.
3. "Conversões" zeradas = nenhum Key Event configurado no GA4 (config do Google, não bug).

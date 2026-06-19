# Analytics — Histórico

### [2026-06-19] — Fix: GA4 batchRunReports (funil + limite de 5)

**Arquivos:**
- `lib/analytics/ga4-client.ts`: (1) relatório do funil **removida** `dimensions: [{ name: 'dateRange' }]` — com múltiplos `dateRanges` nomeados a GA4 adiciona a dimensão `dateRange` automaticamente (listá-la = `INVALID_ARGUMENT`); (2) `batchRunReports` limitado a **5 requests** → split em 2 batches paralelos (5 + 1) e merge dos `reports[]`.

**Razão:** página de resultados retornava 502. Causa raiz era o funil quebrando o batch + limite de 5.

**Impacto:** `getFullAnalyticsReport` agora faz 2 chamadas `batchRunReports` em paralelo. `buildFunnel` lê `dimensionValues[0]` = nome do range (inalterado).

**Nota separada:** o erro PERMISSION_DENIED que o usuário via era Property ID truncado (`51161475` salvo vs `511614754` correto) — corrigido no banco, não no código.

### [2026-06-19] — Documentação inicial + refactor do panorama

**Arquivos:**
- `queries/getCompanyAnalytics.ts`: assinatura `(projectPropertyIds[], days)` — removido `masterPropertyId`; sempre soma projetos
- `components/CompanyAnalyticsOverview.tsx`: sem form/ID/botão; empty state informativo
- `components/AnalyticsPanel.tsx`: Property ID + "Alterar" + setup só ADMIN/DEVELOPER (`userRole`); `projectId` obrigatório
- `components/Ga4SetupForm.tsx`: só escopo projeto (`projectId` obrigatório)
- `actions/updateCompanyGa4.ts`: **removido**
- `prisma/schema.prisma` + migration `20260619000000_remove_company_ga4_property_id`: removida coluna `Company.ga4_property_id`

**Razão:** `/dashboard/results` deve ser só a soma de todos os projetos (sites + landing pages), sem nenhum Property ID para qualquer usuário. Property ID por projeto restrito a ADMIN/DEVELOPER.

**Impacto:** Não existe mais Property ID no nível da empresa. Consumidores devem passar `projectPropertyIds` ao panorama e `userRole` às páginas por projeto.

### [2026-06-18] — Relatório expandido (escopo projeto)
- `getFullAnalyticsReport` via `batchRunReports`: funil, eventos, canais, fontes, páginas + série diária.

### [2026-06-02] — Feature inicial
- `ga4PropertyId` em Company/Project, client GA4 (Service Account), rota `/api/analytics`, KPIs + gráfico de área.

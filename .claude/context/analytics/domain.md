# Analytics — Entidades e Domínio

Sem entidade de classe. O "domínio" são os tipos retornados pelo client GA4 (`src/lib/analytics/ga4-client.ts`).

## Persistência
- **Project.ga4PropertyId** (`projects.ga4_property_id`, String?) — único lugar que guarda Property ID.
- ~~Company.ga4PropertyId~~ — **removido** (migration `20260619000000_remove_company_ga4_property_id`).

## Tipos principais
- **AnalyticsPoint** — `{ date, views, visitors, sessions }` (1 dia)
- **AnalyticsResult** — `{ totals: {views,visitors,sessions}, series: AnalyticsPoint[] }`
- **FunnelMetrics** — `{ current, previous }` onde cada `FunnelStage = { visitors, engaged, converted }`
- **EventConversion** — `{ eventName, conversions }`
- **ChannelConversion** — `{ channel, sessions, conversions, rate }` (rate = % calculado)
- **TrafficSource** — `{ source, medium, sessions, newUsers }`
- **TopPage** — `{ path, views, visitors }`
- **FullAnalyticsReport** — `{ metrics: AnalyticsResult, funnel, events[], channels[], sources[], pages[] }`

## Métricas GA4 usadas (mapeamento)
- `screenPageViews` → views | `activeUsers`/`totalUsers` → visitors | `sessions` → sessions
- `engagedSessions` → funil engajados | `conversions` → funil convertidos + eventos + canais
- `newUsers` → fontes | dimensões: `date`, `eventName`, `sessionDefaultChannelGroup`, `sessionSource`/`sessionMedium`, `pagePath`, `dateRange`

## Erros
- **Credenciais ausentes** — `getClient()` lança `Error('Credenciais do GA4 não configuradas no ambiente')` se faltar `GA4_CLIENT_EMAIL`/`GA4_PRIVATE_KEY`.
- **PERMISSION_DENIED (gRPC code 7)** — Service Account sem acesso à propriedade, ou API desabilitada. Capturado nas queries → retorna `{ ok: false }`; rota responde 502.

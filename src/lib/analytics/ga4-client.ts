import { BetaAnalyticsDataClient, protos } from '@google-analytics/data'

export interface AnalyticsPoint {
  date: string
  views: number
  visitors: number
  sessions: number
}

export interface AnalyticsResult {
  totals: {
    views: number
    visitors: number
    sessions: number
  }
  series: AnalyticsPoint[]
}

export interface FunnelStage {
  visitors: number
  engaged: number
  converted: number
}

export interface FunnelMetrics {
  current: FunnelStage
  previous: FunnelStage
}

export interface EventConversion {
  eventName: string
  conversions: number
}

export interface ChannelConversion {
  channel: string
  sessions: number
  conversions: number
  rate: number
}

export interface TrafficSource {
  source: string
  medium: string
  sessions: number
  newUsers: number
}

export interface TopPage {
  path: string
  views: number
  visitors: number
}

export interface FullAnalyticsReport {
  metrics: AnalyticsResult
  funnel: FunnelMetrics
  events: EventConversion[]
  channels: ChannelConversion[]
  sources: TrafficSource[]
  pages: TopPage[]
}

let cachedClient: BetaAnalyticsDataClient | null = null

function getClient(): BetaAnalyticsDataClient {
  if (cachedClient) return cachedClient

  const clientEmail = process.env.GA4_CLIENT_EMAIL
  const privateKey = process.env.GA4_PRIVATE_KEY?.replace(/\\n/g, '\n')
  const projectId = process.env.GA4_PROJECT_ID

  if (!clientEmail || !privateKey) {
    throw new Error('Credenciais do GA4 não configuradas no ambiente')
  }

  cachedClient = new BetaAnalyticsDataClient({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    projectId,
  })

  return cachedClient
}

function formatGaDate(raw: string): string {
  if (raw.length !== 8) return raw
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`
}

function isoDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

export async function getAnalyticsMetrics(
  propertyId: string,
  startDate: string,
  endDate: string,
): Promise<AnalyticsResult> {
  const client = getClient()

  const [response] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'date' }],
    metrics: [
      { name: 'sessions' },
      { name: 'screenPageViews' },
      { name: 'activeUsers' },
    ],
    orderBys: [{ dimension: { dimensionName: 'date' } }],
  })

  const series: AnalyticsPoint[] = (response.rows ?? []).map((row) => {
    const sessions = Number(row.metricValues?.[0]?.value ?? 0)
    const views = Number(row.metricValues?.[1]?.value ?? 0)
    const visitors = Number(row.metricValues?.[2]?.value ?? 0)
    return {
      date: formatGaDate(row.dimensionValues?.[0]?.value ?? ''),
      sessions,
      views,
      visitors,
    }
  })

  const totals = series.reduce(
    (acc, point) => ({
      views: acc.views + point.views,
      visitors: acc.visitors + point.visitors,
      sessions: acc.sessions + point.sessions,
    }),
    { views: 0, visitors: 0, sessions: 0 },
  )

  return { totals, series }
}

type ReportRequest = protos.google.analytics.data.v1beta.IRunReportRequest
type ReportResponse = protos.google.analytics.data.v1beta.IRunReportResponse

function metricValue(row: protos.google.analytics.data.v1beta.IRow | null | undefined, index: number): number {
  return Number(row?.metricValues?.[index]?.value ?? 0)
}

function dimensionValue(row: protos.google.analytics.data.v1beta.IRow | null | undefined, index: number): string {
  return row?.dimensionValues?.[index]?.value ?? ''
}

function emptyFunnelStage(): FunnelStage {
  return { visitors: 0, engaged: 0, converted: 0 }
}

function buildFunnel(report: ReportResponse | undefined): FunnelMetrics {
  const funnel: FunnelMetrics = { current: emptyFunnelStage(), previous: emptyFunnelStage() }
  if (!report) return funnel

  for (const row of report.rows ?? []) {
    const rangeName = dimensionValue(row, 0)
    const stage: FunnelStage = {
      visitors: metricValue(row, 0),
      engaged: metricValue(row, 1),
      converted: metricValue(row, 2),
    }
    if (rangeName === 'current_range') funnel.current = stage
    if (rangeName === 'previous_range') funnel.previous = stage
  }

  return funnel
}

function buildEvents(report: ReportResponse | undefined): EventConversion[] {
  return (report?.rows ?? []).map((row) => ({
    eventName: dimensionValue(row, 0),
    conversions: metricValue(row, 0),
  }))
}

function buildChannels(report: ReportResponse | undefined): ChannelConversion[] {
  return (report?.rows ?? []).map((row) => {
    const sessions = metricValue(row, 0)
    const conversions = metricValue(row, 1)
    return {
      channel: dimensionValue(row, 0),
      sessions,
      conversions,
      rate: sessions > 0 ? Math.round((conversions / sessions) * 1000) / 10 : 0,
    }
  })
}

function buildSources(report: ReportResponse | undefined): TrafficSource[] {
  return (report?.rows ?? []).map((row) => ({
    source: dimensionValue(row, 0),
    medium: dimensionValue(row, 1),
    sessions: metricValue(row, 0),
    newUsers: metricValue(row, 1),
  }))
}

function buildPages(report: ReportResponse | undefined): TopPage[] {
  return (report?.rows ?? []).map((row) => ({
    path: dimensionValue(row, 0),
    views: metricValue(row, 0),
    visitors: metricValue(row, 1),
  }))
}

export async function getFullAnalyticsReport(propertyId: string): Promise<FullAnalyticsReport> {
  const client = getClient()
  const property = `properties/${propertyId}`

  const dailySeries: ReportRequest = {
    property,
    dateRanges: [{ startDate: isoDaysAgo(30), endDate: 'today' }],
    dimensions: [{ name: 'date' }],
    metrics: [
      { name: 'sessions' },
      { name: 'screenPageViews' },
      { name: 'activeUsers' },
    ],
    orderBys: [{ dimension: { dimensionName: 'date' } }],
  }

  const funnel: ReportRequest = {
    property,
    dateRanges: [
      { startDate: isoDaysAgo(7), endDate: 'today', name: 'current_range' },
      { startDate: isoDaysAgo(14), endDate: isoDaysAgo(8), name: 'previous_range' },
    ],
    metrics: [
      { name: 'totalUsers' },
      { name: 'engagedSessions' },
      { name: 'conversions' },
    ],
  }

  const events: ReportRequest = {
    property,
    dateRanges: [{ startDate: isoDaysAgo(7), endDate: 'today' }],
    dimensions: [{ name: 'eventName' }],
    metrics: [{ name: 'conversions' }],
    orderBys: [{ metric: { metricName: 'conversions' }, desc: true }],
    limit: 10,
  }

  const channels: ReportRequest = {
    property,
    dateRanges: [{ startDate: isoDaysAgo(30), endDate: 'today' }],
    dimensions: [{ name: 'sessionDefaultChannelGroup' }],
    metrics: [{ name: 'sessions' }, { name: 'conversions' }],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 10,
  }

  const sources: ReportRequest = {
    property,
    dateRanges: [{ startDate: isoDaysAgo(30), endDate: 'today' }],
    dimensions: [{ name: 'sessionSource' }, { name: 'sessionMedium' }],
    metrics: [{ name: 'sessions' }, { name: 'newUsers' }],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 10,
  }

  const pages: ReportRequest = {
    property,
    dateRanges: [{ startDate: isoDaysAgo(30), endDate: 'today' }],
    dimensions: [{ name: 'pagePath' }],
    metrics: [{ name: 'screenPageViews' }, { name: 'totalUsers' }],
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit: 10,
  }

  const [batchA, batchB] = await Promise.all([
    client.batchRunReports({
      property,
      requests: [dailySeries, funnel, events, channels, sources],
    }),
    client.batchRunReports({
      property,
      requests: [pages],
    }),
  ])

  const [dailySeriesReport, funnelReport, eventsReport, channelsReport, sourcesReport] =
    batchA[0].reports ?? []
  const [pagesReport] = batchB[0].reports ?? []

  const series: AnalyticsPoint[] = (dailySeriesReport?.rows ?? []).map((row) => ({
    date: formatGaDate(dimensionValue(row, 0)),
    sessions: metricValue(row, 0),
    views: metricValue(row, 1),
    visitors: metricValue(row, 2),
  }))

  const totals = series.reduce(
    (acc, point) => ({
      views: acc.views + point.views,
      visitors: acc.visitors + point.visitors,
      sessions: acc.sessions + point.sessions,
    }),
    { views: 0, visitors: 0, sessions: 0 },
  )

  return {
    metrics: { totals, series },
    funnel: buildFunnel(funnelReport),
    events: buildEvents(eventsReport),
    channels: buildChannels(channelsReport),
    sources: buildSources(sourcesReport),
    pages: buildPages(pagesReport),
  }
}

import { getAnalyticsMetrics, type AnalyticsResult } from '@/lib/analytics/ga4-client'

function isoDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

function mergeSeries(results: AnalyticsResult[]): AnalyticsResult {
  const byDate = new Map<string, { views: number; visitors: number; sessions: number }>()

  for (const r of results) {
    for (const p of r.series) {
      const cur = byDate.get(p.date) ?? { views: 0, visitors: 0, sessions: 0 }
      cur.views += p.views
      cur.visitors += p.visitors
      cur.sessions += p.sessions
      byDate.set(p.date, cur)
    }
  }

  const series = [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v }))

  const totals = series.reduce(
    (acc, p) => ({
      views: acc.views + p.views,
      visitors: acc.visitors + p.visitors,
      sessions: acc.sessions + p.sessions,
    }),
    { views: 0, visitors: 0, sessions: 0 },
  )

  return { totals, series }
}

export interface CompanyAnalyticsLoad {
  ok: boolean
  configured: boolean
  data?: AnalyticsResult
  error?: string
}

export async function getCompanyAnalytics(
  projectPropertyIds: string[],
  days = 30,
): Promise<CompanyAnalyticsLoad> {
  if (projectPropertyIds.length === 0) {
    return { ok: true, configured: false }
  }

  const startDate = isoDaysAgo(days)

  try {
    const results = await Promise.all(
      projectPropertyIds.map((id) => getAnalyticsMetrics(id, startDate, 'today')),
    )

    return { ok: true, configured: true, data: mergeSeries(results) }
  } catch (error) {
    console.error('[getCompanyAnalytics]', error)
    return {
      ok: false,
      configured: true,
      error: 'Não foi possível carregar o panorama do Google Analytics',
    }
  }
}

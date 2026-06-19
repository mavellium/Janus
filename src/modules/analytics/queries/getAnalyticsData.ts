import { getFullAnalyticsReport, type FullAnalyticsReport } from '@/lib/analytics/ga4-client'

export interface AnalyticsLoad {
  ok: boolean
  data?: FullAnalyticsReport
  error?: string
}

export async function getAnalyticsData(propertyId: string): Promise<AnalyticsLoad> {
  try {
    const data = await getFullAnalyticsReport(propertyId)
    return { ok: true, data }
  } catch (error) {
    console.error('[getAnalyticsData]', error)
    return { ok: false, error: 'Não foi possível carregar os dados do Google Analytics' }
  }
}

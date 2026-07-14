import { db } from '@/lib/prisma'
import type { GeoFoundationResult, SeoCheckResult } from '../domain/seoCheck'

export interface SeoAnalysisRecord {
  id: string
  targetUrl: string
  score: number
  checks: SeoCheckResult[]
  geoFoundation: GeoFoundationResult | null
  createdAt: Date
  userName: string | null
}

// Análises criadas antes da Fundação GEO (task 15, fase 3) persistiram `checks`
// como array puro de SeoCheckResult; a partir daqui é `{ seo, geoFoundation }`.
function parseStoredChecks(raw: unknown): { seo: SeoCheckResult[]; geoFoundation: GeoFoundationResult | null } {
  if (Array.isArray(raw)) {
    return { seo: raw as SeoCheckResult[], geoFoundation: null }
  }
  const stored = raw as { seo?: SeoCheckResult[]; geoFoundation?: GeoFoundationResult }
  return { seo: stored.seo ?? [], geoFoundation: stored.geoFoundation ?? null }
}

export async function getSeoAnalysis(
  analysisId: string,
  companyId: string,
  userId?: string
): Promise<SeoAnalysisRecord | null> {
  const analysis = await db.seoAnalysis.findFirst({
    where: { id: analysisId, companyId, ...(userId ? { userId } : {}) },
    include: { user: { select: { name: true, email: true } } },
  })

  if (!analysis) return null

  const { seo, geoFoundation } = parseStoredChecks(analysis.checks)

  return {
    id: analysis.id,
    targetUrl: analysis.targetUrl,
    score: analysis.score,
    checks: seo,
    geoFoundation,
    createdAt: analysis.createdAt,
    userName: analysis.user.name ?? analysis.user.email,
  }
}

import { db } from '@/lib/prisma'
import type { SeoCheckResult } from '../domain/seoCheck'

export interface SeoAnalysisRecord {
  id: string
  targetUrl: string
  score: number
  checks: SeoCheckResult[]
  createdAt: Date
  userName: string | null
}

export async function getSeoAnalysis(
  analysisId: string,
  companyId: string
): Promise<SeoAnalysisRecord | null> {
  const analysis = await db.seoAnalysis.findFirst({
    where: { id: analysisId, companyId },
    include: { user: { select: { name: true, email: true } } },
  })

  if (!analysis) return null

  return {
    id: analysis.id,
    targetUrl: analysis.targetUrl,
    score: analysis.score,
    checks: analysis.checks as unknown as SeoCheckResult[],
    createdAt: analysis.createdAt,
    userName: analysis.user.name ?? analysis.user.email,
  }
}

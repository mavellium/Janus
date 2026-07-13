import { db } from '@/lib/prisma'

export interface SeoAnalysisSummary {
  id: string
  targetUrl: string
  score: number
  createdAt: Date
}

export async function getRecentSeoAnalyses(
  companyId: string,
  limit = 10
): Promise<SeoAnalysisSummary[]> {
  return db.seoAnalysis.findMany({
    where: { companyId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: { id: true, targetUrl: true, score: true, createdAt: true },
  })
}

import { db } from '@/lib/prisma'

export interface SeoAnalysisSummary {
  id: string
  targetUrl: string
  score: number
  createdAt: Date
}

export async function getRecentSeoAnalyses(
  companyId: string,
  limit = 10,
  userId?: string
): Promise<SeoAnalysisSummary[]> {
  return db.seoAnalysis.findMany({
    where: { companyId, projectId: null, ...(userId ? { userId } : {}) },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: { id: true, targetUrl: true, score: true, createdAt: true },
  })
}

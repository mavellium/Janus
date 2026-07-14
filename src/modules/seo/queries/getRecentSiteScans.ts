import { db } from '@/lib/prisma'
import type { SiteScanData } from '../domain/siteScan'

export interface SiteScanSummary {
  id: string
  targetUrl: string
  seoScore: number
  geoScore: number
  pagesScanned: number
  createdAt: Date
}

function readSiteData(raw: unknown): SiteScanData | null {
  if (!raw || typeof raw !== 'object') return null
  const site = (raw as { site?: SiteScanData }).site
  return site ?? null
}

export async function getRecentSiteScans(
  companyId: string,
  projectId: string,
  limit = 10
): Promise<SiteScanSummary[]> {
  const scans = await db.seoAnalysis.findMany({
    where: { companyId, projectId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: { id: true, targetUrl: true, score: true, checks: true, createdAt: true },
  })

  return scans.map((scan) => {
    const site = readSiteData(scan.checks)
    return {
      id: scan.id,
      targetUrl: scan.targetUrl,
      seoScore: scan.score,
      geoScore: site?.geoScore ?? 0,
      pagesScanned: site?.pagesScanned ?? 0,
      createdAt: scan.createdAt,
    }
  })
}

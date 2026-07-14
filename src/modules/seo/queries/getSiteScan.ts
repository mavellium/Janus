import { db } from '@/lib/prisma'
import type { SiteScanData } from '../domain/siteScan'

export interface SiteScanRecord {
  id: string
  targetUrl: string
  data: SiteScanData
  createdAt: Date
  userName: string | null
}

function readSiteData(raw: unknown): SiteScanData | null {
  if (!raw || typeof raw !== 'object') return null
  const site = (raw as { site?: SiteScanData }).site
  if (!site || !Array.isArray(site.pages)) return null
  return site
}

export async function getSiteScan(
  scanId: string,
  companyId: string,
  projectId: string
): Promise<SiteScanRecord | null> {
  const scan = await db.seoAnalysis.findFirst({
    where: { id: scanId, companyId, projectId },
    include: { user: { select: { name: true, email: true } } },
  })

  if (!scan) return null

  const data = readSiteData(scan.checks)
  if (!data) return null

  return {
    id: scan.id,
    targetUrl: scan.targetUrl,
    data,
    createdAt: scan.createdAt,
    userName: scan.user.name ?? scan.user.email,
  }
}

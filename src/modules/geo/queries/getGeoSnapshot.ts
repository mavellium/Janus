import { db } from '@/lib/prisma'

export async function getLatestGeoSnapshot(profileId: string) {
  return db.geoScoreSnapshot.findFirst({
    where: { profileId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      score: true,
      breakdown: true,
      competitorComparison: true,
      totalCostUsdCents: true,
      createdAt: true,
    },
  })
}

export async function getGeoSnapshotHistory(profileId: string, limit = 12) {
  return db.geoScoreSnapshot.findMany({
    where: { profileId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: { id: true, score: true, createdAt: true, totalCostUsdCents: true },
  })
}

export async function getGeoProbeRunsBySnapshot(snapshotId: string, profileId: string) {
  return db.geoProbeRun.findMany({
    where: { snapshotId, profileId },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      provider: true,
      mode: true,
      rawResponse: true,
      companyMentioned: true,
      citedUrls: true,
      errorMessage: true,
      createdAt: true,
      targetQuestion: { select: { id: true, text: true, layer: true } },
      mentionedCompetitor: { select: { id: true, name: true } },
    },
  })
}
